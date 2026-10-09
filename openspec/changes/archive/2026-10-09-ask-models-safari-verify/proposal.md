# Proposal

## Why

Ask models shipped on `main`, but the release checklist and operator docs still only record the pre–Ask-models Safari gates. Playwright WebKit is not shipping Safari, and the login helper may still be serving a build without the new UI and docs until `update` runs.

## What Changes

- Add an Ask models Safari smoke path to `docs/release.md` (and cross-link from `docs/ask-models.md`) that must be run on the installed login service, not only `npm run dev` or Playwright.
- Record that `node scripts/home-service.js update` (or the documented equivalent) copies Ask models assets and `docs/ask-models.md` into the installed package before smoke.
- Leave checklist items unchecked until a human actually runs them; do not mark Safari or reboot gates done from automation alone.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ask-models-docs`: require a documented Safari smoke path for Ask models on the installed service.
- `repository-maintenance`: release checklist SHALL distinguish Ask models Safari verification from Chromium/WebKit CI.

## Impact

- `docs/release.md`, `docs/ask-models.md`, possibly README pointers.
- No application behavior change. Manual gates need operator participation (Safari, service update).
- Depends on shipped Ask models on `main`; prefer running after `retire-opaque-billing` if that change lands first so smoke matches final billing UI.
