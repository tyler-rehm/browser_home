# Tasks

## 1. OpenSpec and Settings shell

- [x] 1.1 Finalize proposal, design, and delta specs for Model accounts in Settings, billing probe trigger, and Ask models Manage accounts link. Validate `model-accounts-panel` with OpenSpec strict mode.
- [x] 1.2 Add a Model accounts section to the Settings dialog that lists the five providers from `/api/providers` without showing secrets. Verify a unit test that a configured provider shows model id and a not-configured provider does not expose a key.

## 2. Billing, links, and refresh

- [x] 2.1 Load `/api/provider-status` when Model accounts mounts; merge billing labels; support Refresh status. Verify tests cover status render and that homepage-only load is unchanged (no new probe on app mount).
- [x] 2.2 Render Open console (`billingUrl`) and Refresh steps (`refreshDoc`) per provider, plus a docs note linking `/docs/ask-models.md`. Verify links use those public fields.

## 3. Ask models entry and docs

- [x] 3.1 Add Manage accounts from Ask models that opens Settings to Model accounts. Verify a dialog/app test that the control opens Settings.
- [x] 3.2 Document Model accounts in `docs/ask-models.md`. Verify the served doc still includes refresh anchors.

## 4. Verification

- [x] 4.1 Run `npm run test:all`, update the login helper if needed, and manually confirm Settings → Model accounts shows five rows, balance labels, console/refresh links, and no API key in the page. 2026-10-08: test:all green (88 unit / 30 e2e); service updated. Safari poke remains a human gate.

## Workflow follow-up

- Archive after review and sync into main specs.
- Manual Safari gate: Settings Model accounts + Manage accounts from Ask models.
