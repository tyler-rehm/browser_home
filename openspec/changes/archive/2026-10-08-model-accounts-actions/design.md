# Design

## Context

Billing URLs already exist on each public provider (`billingUrl`). The UI rendered `billing.label` as inert text that read like a link. Model ids live in Keychain/file `model` fields with built-in defaults in `PROVIDERS`. There is no write API for non-secret fields yet.

## Goals / Non-Goals

- Goals: obvious Balance/Console/Refresh actions; persist default model; ask-time model override; clear “refresh balances” meaning.
- Non-Goals: secret editing UI; unbounded custom model strings; cost APIs beyond existing probes.

## Decisions

### Action buttons
- Three same-styled control links per row: **Balance** → `billingUrl`, **Console** → `billingUrl` (same destination today; kept as a distinct affordance matching operator language), **Refresh** → `refreshDoc`.
- Inline SVG icons (wallet/currency, external window, document)—no new icon package required.
- Billing state text stays non-interactive under the model (e.g. “Balance · $4.00 remaining” / “Balance · Unknown”) — do not repeat the word Balance in the probe label.

### Model options
- Curated `MODEL_OPTIONS` map per provider id in `model-ask.js` (includes current defaults).
- `GET /api/providers` includes `modelOptions` and current `model` for each provider.
- Settings dropdown saves via `POST /api/provider-model` `{ id, model }` where `model` must be in that provider’s options.
- Persist: load secrets → update model → write Keychain when possible, else secrets file. Response is public provider list only (no keys).

### Ask-time override
- `POST /api/ask` accepts optional `model`. When present and allowed for that provider, `askProvider` uses it for the request; stored default unchanged.
- Ask dialog: select next to each configured provider (disabled when unchecked/not configured).

### No in-app balance amount
- Ordinary API keys cannot read remaining credit for these vendors. Model accounts shows Balance/Console links only — no status line, refresh-balance control, or saved-credit field.

### Ask models settings gear
- Title-row gear button (aria-label “Model accounts settings”) opens Settings → Model accounts.

## Risks / Trade-offs

- [Balance ≈ Console URL] → Accept until separate console URLs exist; both remain useful labels.
- [Keychain write fails] → Fall back to file write; surface a short error if both fail.
- [Stale Ask list after Settings save] → Ask reloads providers on open; optional: no live sync required.

## Migration

No schema change beyond using existing `model` field. Document dropdown + ask override in `docs/ask-models.md`.
