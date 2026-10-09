# Design

## Context

Ask models already fans out from the page to `POST /api/ask` with secrets in `~/Library/Application Support/browser-home/model-secrets.json`. A live pong run on this Mac returned: Claude invalid for workspace scope, ChatGPT no credits remaining, Gemini `gemini-2.5-pro` unavailable to new users, Grok `pong`. See proposal.md for why Perplexity, Keychain, expiry, and balance land together.

## Goals / Non-Goals

**Goals:**

- Fifth provider: Perplexity.
- Secrets and `expiresAt` in macOS Keychain, file as fallback and migration source.
- Expiry warning inside 7 days with docs refresh steps.
- Best-effort balance on dialog open only.
- Fix Anthropic workspace id and Gemini default so a fresh setup can succeed.

**Non-Goals:**

- Auto-buying credits.
- Inventing a balance when the vendor does not expose one.
- Windows or Linux Keychain ports.
- Background polling while the homepage sits idle.

## Decisions

### 1. Perplexity adapter

Add catalog id `perplexity`, label `Perplexity`, default Agent preset `fast`. Request posts to `https://api.perplexity.ai/v1/responses` with `{ preset, input }` and `Authorization: Bearer`. Reply text comes from `output_text` or message `output_text` blocks. Sonar chat completions are retired; Router needs paid credits and would collapse the multi-vendor fan-out, so Ask keeps first-party providers and uses Agent for the Perplexity row.

### 2. Secrets shape grows metadata

```json
{
  "anthropic": {
    "apiKey": "",
    "model": "",
    "expiresAt": "",
    "workspaceId": ""
  },
  "openai": { "apiKey": "", "model": "", "expiresAt": "" },
  "google": { "apiKey": "", "model": "", "expiresAt": "" },
  "xai": { "apiKey": "", "model": "", "expiresAt": "" },
  "perplexity": { "apiKey": "", "model": "", "expiresAt": "" }
}
```

`expiresAt` is an ISO date (`YYYY-MM-DD` or full ISO). `workspaceId` is Anthropic-only; when non-empty, send header `anthropic-workspace-id`. Public provider payload may include `expiresAt` and billing fields, never `apiKey` or `workspaceId`.

### 3. Keychain item

One generic password item:

- Service: `local.browser-home.model-secrets`
- Account: `model-secrets`
- Value: the JSON document above

Load with `/usr/bin/security find-generic-password -s … -w` from Node `execFile` (no shell string). Write with `security add-generic-password -U`. iCloud Keychain sync is the user's Keychain setting; the app does not configure iCloud.

Resolution order:

1. Keychain item, when readable on darwin.
2. Else `CODE_HOME_SECRETS_FILE` / default JSON path.
3. If Keychain missing and file present on darwin, migrate file JSON into Keychain once, then use Keychain. Leave the file for rollback.

Tests inject a fake Keychain reader/writer. Non-darwin skips Keychain.

### 4. Gemini default

Change built-in default from `gemini-2.5-pro` to `gemini-3.8-flash` (live AI Studio rejected `gemini-2.0-flash` as retired). Operator override in secrets still wins. Document that retired ids fail for new API projects.

### 5. Expiry warning

`daysUntil(expiresAt) <= 7` and `>= 0` → warning. Past dates → expired warning, provider stays selectable so the operator can see the refresh failure. Dialog shows one line per affected provider plus a link/hash into `docs/ask-models.md` refresh section for that vendor. No homepage banner.

### 6. Billing status probes

New `GET /api/provider-status` returns `{ providers: [{ id, billing: { state, label, url } }] }` where `state` is `ok` | `low` | `unknown` | `error`. Low threshold is `$1.00` remaining when a numeric remaining credit exists.

Probe strategy per vendor (best effort, 5s timeout each, `Promise.allSettled`):

| Provider | Approach |
|---|---|
| OpenAI | Use documented credit/billing endpoint available to the key; if unavailable, `unknown` + platform billing URL |
| Anthropic | Use documented usage/cost endpoint when the key can call it; else `unknown` + console credits URL |
| Google | AI Studio user keys often have no remaining-$ API → `unknown` + AI Studio / Cloud billing URL |
| xAI | Console credits endpoint if documented for the key; else `unknown` + console URL |
| Perplexity | Account API if documented; else `unknown` + account billing URL |

When a recent `POST /api/ask` failed with a quota/credit message, the next status load MAY mark that provider `low` or `error` with that short redacted reason. Do not scrape HTML consoles.

Dialog loads `/api/providers` then `/api/provider-status`. Homepage load stays free of billing calls. CSP remains `connect-src 'self'`.

### 7. Docs and live repair notes

Update `docs/ask-models.md` for Perplexity, Keychain migration, `expiresAt`, workspace id, Gemini default, prepaid credits, and per-provider refresh steps. Record the pong findings as operator checklist items: recreate Claude with Default workspace or set `workspaceId`, add OpenAI credits, set Gemini model if override still points at 2.5-pro.

## Risks / Trade-offs

- [Vendors hide remaining balance from ordinary API keys] → Show `unknown` and a console link. Prefer honesty over a fake dollar amount.
- [Keychain prompts or TCC blocks `security`] → Fall back to the JSON file and show a short server-side configuration error in status, not a key.
- [Migrating into Keychain duplicates the secret] → Document deleting the file after a successful Keychain load if the operator wants a single store.
- [Billing probes spend quota or get rate-limited] → Only on dialog open, short timeout, no retry storm.
- [Claude org-scoped keys need workspace id] → Optional `workspaceId`; docs tell the operator to prefer Default workspace keys.

## Migration Plan

1. Operator adds `expiresAt` (and Claude `workspaceId` if needed) to the JSON file.
2. Deploy build + `home-service.js update` (include any new server modules in the install copy set).
3. First Ask models open migrates JSON into Keychain on macOS.
4. Rollback: remove Keychain item or revert build; file still works.

## Open Questions

None for the first cut. Exact vendor billing URLs are filled from each console's current account/billing page during implementation and locked in docs.
