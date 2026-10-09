# Design

## Context

Secrets live in Keychain (preferred) or `model-secrets.json`. The browser only sees public provider metadata (`configured`, `model`, `expiresAt` / expiry warning, `billingUrl`, `refreshDoc`) plus best-effort billing labels from `/api/provider-status`. Ask models already surfaces a compact version of that; Settings is the right home for a fuller accounts view.

## Goals / Non-Goals

- Goals: scannable per-provider account status in Settings; console + refresh links; user-initiated balance load; no keys in the browser.
- Non-Goals: in-app secret editors; Keychain write from Safari; cost dashboards; auto top-up.

## Decisions

### Placement: Settings section
- Add a **Model accounts** block inside the existing Settings dialog (below link/backup prefs or as a clear section with its own heading).
- Prefer Settings over an Ask models tab so asking stays prompt-focused and accounts stay with other operator prefs.
- Ask models MAY include a text button/link “Manage accounts” that closes Ask (or leaves it) and opens Settings scrolled/focused to Model accounts. Minimal: open Settings; nice-to-have: hash or prop `section=model-accounts`.

### Data loading
- When Settings opens (or when the Model accounts section mounts), fetch `/api/providers` and `/api/provider-status` with abort on close—same merge pattern as Ask models.
- Do not probe on homepage load. Opening Appearance alone MUST NOT be required to probe; opening Settings that includes Model accounts is enough user intent.
- Refresh control: a “Refresh status” button re-runs `/api/provider-status` without reloading the whole page.

### Row content
For each of the five providers, show:
- Display name
- Configured / Not configured
- Model id when configured
- Expiry warning text when present (same copy as Ask models)
- Billing label + state styling (ok / low / unknown / error)—no false “no credits” from opaque probes (existing billing honesty rules)
- External link: Open console (billingUrl)
- Same-origin link: Refresh steps (refreshDoc)
- Never show apiKey, workspaceId, or secret file paths that include home directory expansion beyond a generic “Keychain or local secrets file” note

### Operator help
- One short note under the section: keys are managed in Keychain / secrets file; see Ask models docs. Link to `/docs/ask-models.md` (not a repo-relative path).

## Risks / Trade-offs

- [Double probe Ask + Settings] → Acceptable; both are user-initiated. Cache in-memory for the dialog session only if cheap; not required.
- [Settings dialog gets long] → Keep Model accounts compact (one row/card per provider); no nested dialogs.
- [Secret leakage] → Reuse `publicProviders` only; no new fields that echo secrets.

## Migration

No storage migration. Document the Settings entry in `docs/ask-models.md` under a short “Model accounts” heading.
