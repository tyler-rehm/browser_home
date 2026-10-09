# Proposal

## Why

Ask models is live with four providers, but a first live ask showed three setup failures (Claude workspace scope, OpenAI credits empty, Gemini default model retired) and only Grok returned `pong`. The operator also wants Perplexity as a web-grounded fifth voice, macOS Keychain storage with iCloud sync, a 7-day key expiry warning with refresh steps, and prepaid balance awareness so a $5 credit is not spent silently.

## What Changes

- Add Perplexity as a fifth Ask models provider (OpenAI-compatible chat completions).
- Store provider secrets and metadata in the macOS Keychain (iCloud Keychain when the user has Keychain sync on). Keep the JSON file as a migration and fallback path.
- Let each provider record an optional `expiresAt`. When a key expires within 7 days, Ask models shows a warning on that provider and points at short refresh steps in `docs/ask-models.md`.
- On opening Ask models, load a best-effort balance or credit status per configured provider. Show low or unknown clearly. Never call billing APIs until the user opens Ask models.
- Fix the three live setup gaps observed on this Mac: Claude optional workspace id for workspace-scoped keys, a Gemini default model that still accepts new API users, and docs that say OpenAI and peers need prepaid credits before Ask works.
- Keep prompts, replies, and keys out of browser storage and server logs.

Out of scope: OpenRouter, DeepSeek, Mistral, Groq, Cursor as a provider, website automation, and automatic purchase of credits.

## Capabilities

### New Capabilities

- `model-ask`: five-provider ask dossier including Perplexity, expiry warnings, billing status in the dialog, Anthropic workspace id, and a callable Gemini default (`gather-model-replies` introduced this capability but is not archived into `openspec/specs/` yet, so this change carries the ADDED requirements)
- `model-secret-store`: load and migrate model API secrets from macOS Keychain (with file fallback), including optional expiry metadata
- `model-billing-status`: best-effort prepaid balance or credit status for configured providers, shown only after the user opens Ask models

### Modified Capabilities

None.

## Impact

- `src/model-ask.js`, `src/server.js`, Ask models dialog, login helper install set, `docs/ask-models.md`, threat model, and unit tests.
- Keychain access from the homepage Node process on macOS only. Non-macOS stays on the secrets file.
- Billing probes use each vendor's documented usage or credit endpoints where they exist. Providers without a usable remaining-balance API report `unknown` and a console link instead of inventing a number.
- Assumption from a live pong run on this Mac: Claude failed for workspace scope, ChatGPT for empty credits, Gemini for a retired default model id, Grok succeeded with `pong`.
