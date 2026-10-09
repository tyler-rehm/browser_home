# Design

## Context

The production server in `src/server.js` is loopback-only, GET and HEAD, with `connect-src 'none'`. Dialogs use the local Headless UI wrapper in `src/components/dialog.jsx`. Browser data lives in `code-home-*` keys. The login helper runs the same server and does not pass shell environment variables. See proposal.md for why this change exists. Requirements are in the delta specs.

This Mac has no `~/Library/Mobile Documents` folder. The operator's keys stay in whatever iCloud-synced file they already use. The server reads a path. It does not create a second secret store.

## Goals / Non-Goals

**Goals:**

- One loopback POST per checked provider, run with `Promise.allSettled` in the page, so a slow provider does not hold the others.
- Provider HTTP, dossier markdown, and secret parsing are pure enough to test without a live model.
- Keys stay out of the browser, logs, and git. The login helper can read them without a plist change.

**Non-Goals:**

- Server-sent events, WebSockets, token streaming, or a server-side fan-out.
- Persisting the prompt, the replies, or which boxes were checked.
- Teaching the Vite dev server these routes. Ask models works on `npm start` and the login helper.

## Decisions

### 1. The page fans out; the server answers one provider

`GET /api/providers` returns `{ providers: [{ id, label, model, configured }] }` for `anthropic`, `openai`, `google`, and `xai`, labeled Claude, ChatGPT, Gemini, and Grok.

`POST /api/ask` accepts `{ id, prompt }` and calls that one provider. Validation failures (empty prompt, prompt over 32000 characters, unknown id, unconfigured provider, body over 128 KiB, non-JSON) return 400 and do not call out. A settled provider outcome returns 200: `{ ok, id, label, model, latencyMs, text }` or `{ ok: false, id, label, model, latencyMs, error }`. `error` is at most 200 characters and must not contain a configured API key.

The dialog starts one `fetch` per checked box with its own `AbortSignal`. Closing the dialog aborts signals that are still running. `Promise.allSettled` collects cards as each fetch finishes.

Alternative: one POST that waits for every provider. Rejected. One hung call would hold the dossier, and canceling one provider would mean canceling the batch.

Alternative: server-sent events. Rejected for this change. Finished replies are what Copy needs.

### 2. Keys are a file outside the repo

Resolution order:

1. `CODE_HOME_SECRETS_FILE`, when set (tests and a one-off `npm start`).
2. `~/Library/Application Support/browser-home/model-secrets.json`.

The login helper already runs as the user, so the default path works without `EnvironmentVariables` in the plist. An iCloud file is connected by putting that path on the file or by a symlink. The server never writes this file. Missing, unreadable, or invalid JSON means every provider is `configured: false`.

Shape, unknown ids ignored:

```json
{
  "anthropic": { "apiKey": "", "model": "" },
  "openai": { "apiKey": "", "model": "" },
  "google": { "apiKey": "", "model": "" },
  "xai": { "apiKey": "", "model": "" }
}
```

`apiKey` must be a non-empty string to count as configured. `model`, when a non-empty string, replaces the default. Defaults live next to the adapters: `claude-sonnet-4-5`, `gpt-4.1`, `gemini-2.5-pro`, `grok-3`. The checked-in example uses empty `apiKey` values and omits real keys. `.gitignore` ignores `model-secrets.json`.

Alternative: macOS Keychain. Rejected. The operator already keeps these secrets in iCloud, and the server should read that file rather than a second store.

### 3. Adapters are small request builders

`src/model-ask.js` exports the catalog, secret parsing, dossier formatting, and `askProvider({ provider, prompt, fetch, signal })`. No SDK. Calls use Node `fetch` and `AbortSignal.timeout(60_000)` combined with the client abort.

- Anthropic: `POST https://api.anthropic.com/v1/messages` with `x-api-key` and `anthropic-version: 2023-06-01`. Body is `{ model, max_tokens: 4096, messages: [{ role: "user", content: prompt }] }`. Reply text is the concatenated `content[].text`.
- OpenAI: `POST https://api.openai.com/v1/chat/completions` with `Authorization: Bearer`. Body is `{ model, messages: [{ role: "user", content: prompt }] }`. Reply text is `choices[0].message.content`.
- xAI: same body as OpenAI at `https://api.x.ai/v1/chat/completions`.
- Google: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with header `x-goog-api-key`. The key is not placed in the URL. Body is `{ contents: [{ parts: [{ text: prompt }] }] }`. Reply text is the concatenated candidate parts.

A non-OK HTTP status, unparseable body, or abort becomes `ok: false`. Timeout is reported as `Timed out`. Upstream response text is shortened and passed through a redaction step that removes every configured key before it reaches the JSON response. The server does not log the body, the prompt, or the reply.

`createHomepageServer` gains optional `fetchImpl` and `secretsFile` so tests inject both. Production passes global `fetch` and the resolved path.

### 4. The dialog matches the ones already on the page

An Ask models button in the top bar opens `src/components/ask-models-dialog.jsx`, using the existing dialog parts at size `xl`. Opening it loads `/api/providers`. Configured providers start checked. Unconfigured providers are disabled. The prompt is component state. Copy calls `navigator.clipboard.writeText` with `formatDossier`. Copy stays disabled until at least one selected request has settled.

Dossier shape:

```text
# Prompt

<prompt>

## Claude
Model: claude-sonnet-4-5
Status: ok

<reply>
```

A failure uses `Status: failed` and the short error instead of a reply. Sections follow the catalog order, skipping providers that were not selected.

Nothing is written under `code-home-*`. `APP_KEYS` stays unchanged.

### 5. Security headers and method routing change only as far as the spec

`connect-src 'self'` replaces `connect-src 'none'`. `script-src` stays `'self'`. Host checks still run before any route. POST to any path other than `/api/ask` is still 405. GET `/api/providers` is the only new GET that is not a file. Static-file checks are untouched.

### 6. Tests stay off the network

Unit tests cover secret parsing, request URL and headers (the key is asserted only inside the outbound request fixture, never in a response), redaction, the 32000-character reject, dossier text, and a homepage server whose `fetchImpl` records calls. One provider success and one timeout are enough to prove independence. A dialog test renders with stubbed providers and checks that an unconfigured box is disabled, copy is disabled until a result exists, and the dossier contains both a reply and a failure. No Playwright path and no live API call.

## Risks / Trade-offs

- [Anything on loopback can POST a prompt and spend API quota] → The server was already reachable by local processes. Cap the body, cap the prompt, and call out only for a configured id. Do not add a token in the page; a local caller could read it.
- [A default model id can 404 after a vendor rename] → The card shows the short upstream error. The operator sets `model` in the secrets file. No code change is required for a rename.
- [LaunchAgent logs could capture a thrown error that includes a key] → Redact before throwing or responding. Do not log request or response bodies.
- [`npm run dev` has no ask routes] → Document that Ask models is served by the production server. The pinned Safari origin already uses that server.
- [Google or Anthropic response shapes drift] → A missing text field becomes a failed card with a short error, and the other providers still complete.
- [In-flight link-import edits already touch `src/app.jsx`] → Add the button and dialog mount without rewriting that work.

## Migration Plan

1. Operator creates `~/Library/Application Support/browser-home/model-secrets.json`, or symlinks that path to the iCloud file, using the example shape.
2. `npm run build`, then `npm start` or `node scripts/home-service.js update`.
3. Rollback is a revert of this change. No browser keys are added, so uninstall and reset behavior stay as they are.

## Open Questions

None. Model ids that should differ from the defaults are set in the secrets file.
