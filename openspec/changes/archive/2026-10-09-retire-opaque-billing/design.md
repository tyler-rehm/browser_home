# Design

## Context

See proposal.md — Why. `model-billing.js` still probes OpenAI `credit_grants`; other providers always return unknown. Model accounts UI already omits status lines; Ask models still fetches `/api/provider-status` and can show ok/low labels. Main specs still require probe-on-open behavior.

## Goals / Non-Goals

- Goals: no vendor balance HTTP from this app; specs match Balance-link UX; keep ask-quota hints if cheap.
- Non-Goals: new balance APIs; removing `billingUrl` fields; secret-store changes.

## Decisions

### Stop probes
- Remove OpenAI `credit_grants` (and any similar) calls from `model-billing.js`.
- Prefer deleting probe helpers and shrinking `loadProviderBilling` to a pure local map (configured → empty/unknown without network), or remove `/api/provider-status` if nothing needs it.
- If the route stays: return `{ id, billing: { state: 'unknown', label: '', url } }` (or omit billing) with zero upstream fetches.

### Ask UI
- Stop fetching provider-status on Ask open solely for balance, or ignore empty billing.
- Keep rendering a low hint only when an ask result error matches quota/credits (existing polish path).
- Do not show “$x.xx remaining” from probes.

### Model accounts
- Already link-only; ensure no status fetch remains. Refresh stays a docs link, not a balance re-probe.

### Spec Purpose
- On apply/archive, update `openspec/specs/model-billing-status/spec.md` Purpose to describe ask-quota hints and vendor links, not prepaid probes.
- Update `model-accounts` Purpose to drop “best-effort balance”.

## Risks / Trade-offs

- [OpenAI dashboard key could still read grants] → Out of scope; ordinary API keys are the supported case.
- [Keeping empty `/api/provider-status`] → Slight API surface; simpler for UI until cleaned. Prefer remove if unused after UI change.

## Migration

No secrets migration. Operators rely on vendor consoles for balances. Document the change in `docs/ask-models.md` (remove probe promises).
