# Tasks

## 1. Model-ask core

- [x] 1.1 Add the provider catalog, secrets-file parsing, error redaction, prompt validation, and dossier formatter in `src/model-ask.js`. Verify `tests/unit/model-ask.test.js` treats a missing file, invalid JSON, and an empty `apiKey` as not configured, applies a `model` override, strips a configured key from error text, rejects an empty prompt and a 32001-character prompt, and formats a dossier that contains the prompt, one reply, and one failure.
- [x] 1.2 Add `askProvider` with injected `fetch` for Anthropic, OpenAI, Google, and xAI. Verify `tests/unit/model-ask.test.js` checks each request URL and auth header, that the Google key is not in the URL, that a success returns the reply text, and that a non-OK response and a 60-second abort become `ok: false` without calling the other providers.

## 2. Loopback routes

- [x] 2.1 Accept `GET /api/providers` and `POST /api/ask` on documented hosts in `src/server.js`, with injectable `fetchImpl` and `secretsFile`. Set `connect-src 'self'`. Keep POST to every other path at 405, and keep host and static-file checks. Verify `tests/unit/server.test.js` shows four providers and no `apiKey`, a 400 for an empty or oversized prompt with zero outbound calls, independent success and failure results, a rejected unexpected host, and a 405 for `POST /`.
- [x] 2.2 Document the default secrets path, the two routes, `connect-src 'self'`, and the ban on logging prompts, replies, and keys in `docs/architecture.md` and `docs/threat-model.md`. Add `examples/model-secrets.example.json` with empty `apiKey` strings and ignore `model-secrets.json` in git. Verify those docs name `~/Library/Application Support/browser-home/model-secrets.json` and that the example contains no real key.

## 3. Ask models dialog

- [x] 3.1 Add an Ask models control and `src/components/ask-models-dialog.jsx` using the existing dialog parts. Load providers when the dialog opens, start configured providers checked, disable unconfigured ones, abort in-flight requests on close, and copy the dossier only after a result has settled. Do not write a `code-home-*` key, and leave the in-progress link-import behavior in `src/app.jsx` in place. Verify `tests/unit/app.test.jsx` or a focused dialog test lists Claude, ChatGPT, Gemini, and Grok, disables an unconfigured provider, keeps copy unavailable until a result exists, and copies a dossier that includes the prompt, a reply, and a failure.
- [x] 3.2 Document Ask models, the secrets file, and that the routes are on the production server in `README.md`. Verify the README names the default secrets path and `npm start`.

## 4. Integration

- [x] 4.1 Run `npm run test:all` and verify format, lint, unit tests, build, end-to-end tests, and the publication audit pass.

## Workflow follow-up

- Archive the change after review with `/opsx-archive`.
- A manual Safari check on `http://home.localhost:4173` stays a human gate until someone runs it with a real secrets file.
