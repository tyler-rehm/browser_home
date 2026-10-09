# Proposal

## Why

Ask models already fans out to five providers, but while requests are in flight the dialog looks idle, refresh-step links open a blank page (`/docs/ask-models.md` is not served from `dist/`), and settled replies are a flat stack of plain text that is hard to compare or inspect.

## What Changes

- Show an overall progress state while any Ask is running, plus a per-provider loading/done/failed indicator for each selected request.
- Serve Ask models documentation from the production server at `/docs/ask-models.md` (with fragment ids for refresh steps) so refresh links work in Safari. Install the doc file with the login helper.
- Replace the flat result list with tabs: an Overview tab (per-provider summary plus one compiled JSON bundle of all response data) and one tab per settled provider.
- Each provider tab SHALL offer Rendered (reply or error text) and Raw (HTTP status plus redacted upstream body / JSON).
- Ask responses SHALL include redacted `raw` and `httpStatus` fields for the Raw view. Keys stay redacted; prompts and bodies stay out of logs and browser storage.
- Copy SHALL give clear success or failure feedback in the dialog (not silent). Success feedback clears after a short time or on the next ask.

Out of scope: streaming tokens, markdown rendering engines, Router-only routing, and changing which providers are called.

## Capabilities

### New Capabilities

- `ask-models-docs`: production serving of Ask models operator documentation under `/docs/` with safe path containment and HTML rendering that preserves refresh fragment ids.

### Modified Capabilities

- `model-ask`: progress indicators, tabbed results (Overview + per provider), Rendered/Raw views, and compiled overview JSON.
- `local-homepage-serving`: allow GET (and HEAD) for `/docs/*` from a docs root beside the install or repo `docs/`.

## Impact

- `src/components/ask-models-dialog.jsx`, `src/model-ask.js`, `src/server.js`, `scripts/home-service.js`, styles, unit tests, and `docs/ask-models.md` link targets (`/docs/...`).
- Login helper copies `docs/ask-models.md` into the installed package.
