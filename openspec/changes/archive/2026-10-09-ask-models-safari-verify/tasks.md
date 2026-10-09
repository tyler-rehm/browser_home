# Tasks

## 1. Documentation

- [x] 1.1 Add an Ask models (Safari) subsection to `docs/release.md` with unchecked gates for service update, Model accounts, one Ask run, and Balance/Console/Refresh destinations. Verify the section exists and boxes start unchecked.
- [x] 1.2 Add a Safari smoke section to `docs/ask-models.md` that lists update → Model accounts → Ask and states Playwright WebKit is not Safari. Verify `/docs/ask-models.md` still builds/serves after the edit (`npm run build` or existing docs serve test).

## 2. Manual verification (human)

- [x] 2.1 Run the documented service update from a clean build and confirm Safari on `http://home.localhost:4173` shows Ask models and serves `/docs/ask-models.md`. Record the date in `docs/release.md`.
- [x] 2.2 In shipping Safari: open Settings → Model accounts (no API keys visible), open Ask models, complete one ask or an honest error with at least one configured provider, and confirm Balance/Console/Refresh open the expected URLs. Check off gates with observations in `docs/release.md`.

## 3. Validation

- [x] 3.1 Run `npx @fission-ai/openspec validate ask-models-safari-verify --strict` and confirm it passes. Leave Safari boxes unchecked if a human has not run 2.x.

## Workflow follow-up

- Archive `ask-models-safari-verify` after Safari evidence is recorded.
- Prefer completing `retire-opaque-billing` before or with this smoke so UI matches final billing behavior.
