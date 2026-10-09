# Tasks

## 1. Specs and Purpose

- [x] 1.1 Update Purpose text in `openspec/specs/model-billing-status/spec.md` and `openspec/specs/model-accounts/spec.md` to match link-based billing (no prepaid probes). Verify Purpose no longer promises best-effort remaining balance on open.
- [x] 1.2 Keep this change’s delta specs as the requirement source of truth until archive. Validate with `npx @fission-ai/openspec validate retire-opaque-billing --strict`.

## 2. Server and billing module

- [x] 2.1 Remove live vendor balance probes from `model-billing.js` (including OpenAI credit grants). Verify unit tests assert no external billing URL is fetched.
- [x] 2.2 Adjust `/api/provider-status` to return local-only status (or remove the route and its clients). Verify server tests: open/status does not contact vendors; ask still works.

## 3. UI and docs

- [x] 3.1 Stop Ask models from showing probe-based remaining-credit labels; keep optional low hint only from clear ask quota/credit errors. Verify Ask dialog unit tests.
- [x] 3.2 Confirm Model accounts has no balance status fetch/line. Update `docs/ask-models.md` to say balances are checked at the vendor console via Balance/Console links. Verify docs wording.

## 4. Verification

- [x] 4.1 Run `npm run test:all` and confirm green. Leave Safari smoke to `ask-models-safari-verify`.

## Workflow follow-up

- Archive `retire-opaque-billing` after merge/apply and sync main specs.
- Then run `ask-models-safari-verify`, then `cut-ask-models-release`.
