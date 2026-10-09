# Proposal

## Why

A live Ask models run showed the gatherer works, but several trust and UX gaps remain: billing labels falsely reported ChatGPT as out of credits while the ask succeeded; a slow Gemini request stayed on Asking with no tab and a vague footer; Overview duplicated full replies and dumped enormous redacted-but-huge `raw` blobs into Compiled JSON; Rendered showed markdown source; requested model ids did not match upstream model ids; Perplexity citation markers had no links; progress did not name who was still pending.

## What Changes

- Tighten billing probes so `low` / “no credits” is only shown from a real remaining-balance signal or a clear insufficient-quota ask failure—not from opaque 403 bodies that mention “billing”.
- Improve in-flight UX: pending provider tabs, name who is still asking, clearer timeout/failure when a provider exceeds the ask timeout, and keep Close able to abort without confusion.
- Slim Overview to status + short preview; keep full text on provider tabs. Compiled JSON omits or heavily truncates `raw` (full redacted raw stays on Raw only).
- Render markdown lightly in the Rendered view.
- Show requested model and, when different, the upstream/actual model id from the response.
- Surface Perplexity (Agent) citation links in Rendered when search results are present in the payload.
- Clarify overall progress copy (e.g. waiting on named providers).

Out of scope for this change: token/cost accounting UI, sorting tabs by latency, per-provider retry, richer dossier markdown export, and changing which providers are called.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `model-billing-status`: honest low vs unknown; do not invent “no credits” from unreadable billing endpoints.
- `model-ask`: pending tabs, progress naming, overview slimness, compiled JSON without full raw, rendered markdown, actual model id, Perplexity citations in Rendered.

## Impact

- `src/model-billing.js`, `src/model-ask.js`, `src/components/ask-models-dialog.jsx`, styles, unit tests, and Ask models docs if billing wording changes.
- Live Safari check after apply remains a human gate.
