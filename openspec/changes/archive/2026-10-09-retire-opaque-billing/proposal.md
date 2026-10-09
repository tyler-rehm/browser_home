# Proposal

## Why

Ordinary API keys cannot read remaining prepaid credit for the five Ask providers. Model accounts already dropped the fake balance line, but `/api/provider-status` still probes OpenAI’s credit endpoint, Ask models can still show ok/low labels, and main specs still require billing probes and Model accounts status labels that contradict the shipped Balance/Console-link design.

## What Changes

- Stop live vendor balance probes (including OpenAI `credit_grants`). Do not invent remaining-credit amounts in the UI.
- Narrow or remove Ask-time billing status display that depended on those probes; keep vendor Balance/Console links and ask failure messages that clearly indicate quota/credits.
- Align `model-billing-status`, `model-accounts`, `model-ask`, and `local-homepage-serving` requirements with link-based operator billing (no probe-on-open balance load).
- Remove or gut unused billing probe code and tests; keep `billingUrl` / console URLs on public provider records.

Out of scope: purchasing credits, secret editing in the browser, new vendor balance APIs if a future key type gains them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `model-billing-status`: retire live remaining-credit probes; redefine status as optional ask-quota hints only, or document that Balance links replace probes.
- `model-accounts`: remove the requirement for loaded billing labels and in-panel balance refresh; keep Balance/Console/Refresh doc links.
- `model-ask`: stop requiring remaining-credit/low/unknown labels from billing probes on open.
- `local-homepage-serving`: stop requiring GET billing-status as a balance probe surface (endpoint may remain as a no-op/empty status or be removed).

## Impact

- `src/model-billing.js`, `src/server.js`, `ask-models-dialog.jsx`, related unit tests, docs that describe balance probes.
- Preferred apply order: this change before Safari smoke and the `1.1.0` cut so verification and release match final behavior.
