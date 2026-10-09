# Tasks

## 1. Billing honesty

- [x] 1.1 Change OpenAI (and similar) billing probes so opaque or unauthorized probe failures become `unknown`, not `low`. Only report `low` from a numeric remaining balance under $1. Verify unit tests cover a 403 billing body that mentions credits without a number → unknown, and a numeric balance under $1 → low.
- [x] 1.2 Stop showing Refresh steps for unknown-only billing; keep it for expiry, true low, and optionally ask-time quota failures. Verify dialog tests do not show Refresh steps for an unknown billing label alone.

## 2. Pending UX and progress copy

- [x] 2.1 Show each selected provider in the results tablist (or pending strip) as soon as the run starts, with asking state until settle/abort/timeout. Verify a dialog test with a delayed provider shows that provider as asking while others are settled.
- [x] 2.2 Name remaining pending providers in overall progress when one or two remain. Verify copy like Waiting on Gemini when only Gemini is in flight.

## 3. Overview, compiled JSON, and Rendered

- [x] 3.1 Slim Overview to status, models, latency, and a short preview; move full text to provider Rendered. Verify Overview tests do not require the full reply body in the overview list.
- [x] 3.2 Change `formatCompiledBundle` to omit full `raw` (or replace with a tiny truncated stub). Verify unit tests assert compiled JSON has no full raw body while Raw view still receives `raw`.
- [x] 3.3 Add a minimal safe markdown presentation for Rendered. Verify a reply with a heading or list is not shown only as raw `###` markers.
- [x] 3.4 Parse and display `actualModel` when the upstream model differs from the requested id. Verify unit tests for OpenAI-shaped and Perplexity Agent payloads.
- [x] 3.5 Attach Perplexity citations from Agent search results and list linked citations in Rendered. Verify a unit or dialog test with a search_results fixture.

## 4. Verification

- [x] 4.1 Run `npm run test:all`, update the login helper if server modules changed, and re-check a five-provider ask: ChatGPT must not show false “no credits” when asks succeed; Overview must stay short; Gemini pending must be visible by name. 2026-10-08: format/lint/unit (86)/build/e2e (30)/audit passed; login helper not reinstalled (needs explicit go). Safari five-provider re-check remains a human gate.

## Workflow follow-up

- Archive after review and sync into main `model-ask` / `model-billing-status` specs.
- Manual Safari gate: false billing, pending Gemini, slim Overview, markdown Rendered, citations.
