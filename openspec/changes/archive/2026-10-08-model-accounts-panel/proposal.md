# Proposal

## Why

Ask models already shows a thin configured/expiry/billing line per provider, but there is no dedicated place to review AI connection status, open vendor consoles, or follow refresh steps without starting an ask. Operators need an accounts panel that makes Keychain/file-backed setup inspectable without ever putting API keys in the browser.

## What Changes

- Add a **Model accounts** section in Settings that lists Claude, ChatGPT, Gemini, Grok, and Perplexity.
- For each provider show: configured or not, current model id (no secrets), expiry warning when present, best-effort billing/credit status, a link to the vendor billing/console URL, and a link to that provider’s refresh steps in `/docs/ask-models.md`.
- Load billing status when the Model accounts section is shown (user-initiated), reusing `/api/providers` and `/api/provider-status`. Homepage load still MUST NOT probe balances.
- Keep Ask models focused on prompting; optionally add a short “Manage accounts” control that opens Settings to Model accounts.
- API keys, raw Keychain contents, and secret file contents MUST NOT appear in the page, browser storage, or client-visible responses.

Out of scope: editing or saving API keys from the UI, purchasing credits, Router-only routing, streaming, and new providers.

## Capabilities

### New Capabilities

- `model-accounts`: Settings-hosted Model accounts panel for connection status, balance, console links, and refresh docs—without exposing secrets.

### Modified Capabilities

- `model-billing-status`: allow billing probes when Model accounts (Settings) is opened, not only Ask models.
- `model-ask`: optional navigation affordance from Ask models to Model accounts in Settings.

## Impact

- `src/components/preferences-dialog.jsx` (Settings), possibly a small `model-accounts` component, Ask models dialog link, styles, unit tests, and docs cross-links in `docs/ask-models.md` if useful.
- Reuses existing provider-list and provider-status APIs; no new secret endpoints.
