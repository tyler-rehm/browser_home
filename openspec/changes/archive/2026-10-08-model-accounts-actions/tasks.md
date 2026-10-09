# Tasks

## 1. OpenSpec and action links

- [x] 1.1 Finalize proposal, design, and delta specs. Validate `model-accounts-actions` with OpenSpec strict mode.
- [x] 1.2 Style Balance, Console, and Refresh as icon button-links wired to billingUrl / billingUrl / refreshDoc. No in-app remaining-credit status. Verify unit tests for href targets.

## 2. Model options and persistence

- [x] 2.1 Add curated `MODEL_OPTIONS`, expose on `publicProviders`, implement persist + `POST /api/provider-model`. Verify unit tests for allowlist reject and successful save without leaking keys.
- [x] 2.2 Model dropdown in Model accounts for configured providers. Verify dialog/panel test changes model via the API mock.

## 3. Ask-time override and copy

- [x] 3.1 Accept optional `model` on `/api/ask`; add per-provider select in Ask models. Verify ask tests send override.
- [x] 3.2 Gear control to Model accounts; document Balance/Console/Refresh, model dropdown, ask override in `docs/ask-models.md`.

## 4. Verification

- [x] 4.1 Unit/build green; service updated during this change. Remaining: unsandboxed `npm run test:e2e`, Safari smoke, archive OpenSpec change.

## Workflow follow-up

- [ ] Archive `model-accounts-actions` after review.
- [ ] Manual Safari: Balance opens vendor billing; model save sticks; ask model override used once; gear opens Model accounts.
- [ ] Unsandboxed Playwright `npm run test:e2e`.
