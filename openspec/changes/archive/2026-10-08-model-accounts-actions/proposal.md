# Proposal

## Why

Model accounts shows a billing label that looks actionable (“Open billing console…”) but is plain text, so clicks do nothing. Console and Refresh links are also easy to miss. Operators also need to pick a stored default model from a known list and optionally override it per Ask without editing the secrets file by hand. “Refresh status” is unclear.

## What Changes

- Replace the billing label CTA with a uniform **Balance** button-link (opens the vendor billing/console URL). Style **Console** and **Refresh** the same way, each with a small icon.
- Keep a short non-clickable billing state label (ok / low / unknown / remaining amount) separate from the Balance action.
- Add a curated **model** dropdown per configured provider in Model accounts that persists the `model` field in Keychain/secrets (never exposes API keys).
- In Ask models, let the operator pick a model per checked provider for that run (runtime override); omit or blank means use the stored default.
- Do not show remaining-credit status in Model accounts (ordinary API keys cannot read it); keep Balance/Console vendor links. Add a gear control on Ask models that opens Model accounts.
- Add `POST /api/provider-model` (or equivalent) to update only the model override for one provider.

Out of scope: editing API keys in the browser, free-text arbitrary model ids outside the curated list, purchasing credits.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `model-accounts`: Balance/Console/Refresh button-links with icons; model dropdown; clearer balance refresh control.
- `model-secret-store`: persist model override without returning secrets.
- `model-ask`: runtime model override on ask; expose curated model options to the UI.
- `model-billing-status`: clarify refresh-balances action (same probe semantics).

## Impact

- `src/components/model-accounts-panel.jsx`, `ask-models-dialog.jsx`, `model-ask.js`, `model-secret-store.js`, `server.js`, styles, docs, unit tests.
- New loopback write path for model id only; still no keys in browser responses.
