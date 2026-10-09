# Tasks

## 1. Provider and secret-store core

- [x] 1.1 Add Perplexity to the catalog and `askProvider`, change the Gemini default to `gemini-3.8-flash`, and send `anthropic-workspace-id` when `workspaceId` is set. Verify `tests/unit/model-ask.test.js` covers the Perplexity Agent API URL and auth header, the new Gemini default, and an Anthropic request that includes the workspace header only when configured.
- [x] 1.2 Extend secret parsing for `expiresAt`, `workspaceId`, and `perplexity`, plus Keychain load/save/migrate helpers with injected `security` runners. Verify unit tests for valid/invalid expiry, file fallback, Keychain preference, and one-time file→Keychain migration without asserting raw key material in logs.
- [x] 1.3 Wire the server to the secret-store resolution order and copy any new server modules in `scripts/home-service.js` install. Verify `tests/unit/server.test.js` and `tests/unit/service.test.js` still pass, and that `/api/providers` lists five providers with no `apiKey`.

## 2. Billing status and expiry UI

- [x] 2.1 Add `GET /api/provider-status` with per-provider probes, `$1` low threshold, and unknown fallbacks. Verify server tests mock each probe path, keep homepage load free of billing calls, and redact keys from error text.
- [x] 2.2 Update Ask models dialog to show five providers, expiry warnings within 7 days, billing labels, and refresh pointers into `docs/ask-models.md`. Verify dialog tests for Perplexity, an expiry warning, a low-credit label, and copy still building a dossier.
- [x] 2.3 Document Perplexity Agent API, Keychain, `expiresAt`, Claude workspace scope, Gemini default, prepaid credits, balance states, and per-provider refresh steps in `docs/ask-models.md`, and link from `README.md`. Verify the doc names all five providers and the 7-day warning.

## 3. Live repair and integration

- [x] 3.1 Re-run a short pong ask against each configured provider after the operator repairs Claude workspace, OpenAI credits, and Gemini model as needed. Verify each configured provider returns a reply or a clear non-secret error, and record the outcome in the task notes without writing keys into the repo.
  - 2026-10-08 final (login service): Claude, ChatGPT, Gemini, Grok, and Perplexity all `HTTP 200 ok — pong`. Perplexity uses Agent API preset `fast`. `npm run service update` installed the build.
- [x] 3.2 Run `npm run test:all` and verify format, lint, unit tests, build, end-to-end tests, and the publication audit pass. 2026-10-08: format, lint, 79 unit tests, build, 30 Chromium/WebKit e2e, publication audit passed.

## Workflow follow-up

- Archived 2026-10-08 after syncing main specs: `model-ask`, `model-secret-store`, `model-billing-status`, and `local-homepage-serving`.
- Manual Safari check on `http://home.localhost:4173` stays a human gate.
- Optional later: delete `model-secrets.json` after confirming Keychain sync via iCloud Keychain.
