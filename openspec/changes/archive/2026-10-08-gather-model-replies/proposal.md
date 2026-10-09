# Proposal

## Why

Comparing model answers means pasting one prompt into several AI tools and pasting each reply back into Cursor by hand. The homepage is already the local place this Mac stays open, so it can send that one prompt to the selected tools and return a single dossier.

## What Changes

- Add an Ask models dialog. The user writes one prompt, checks any subset of the configured providers, and sends. Each selected provider is requested on its own. Replies and failures appear as they finish. Copy builds one markdown dossier of the prompt plus every settled result.
- Providers in this change are Anthropic, OpenAI, Google Gemini, and xAI. A provider with no key is shown and cannot be selected. Cursor is the place the dossier is pasted, not a provider.
- API keys stay in a file outside the repository. The operator keeps that file in iCloud and points the homepage server at it. The browser never receives a key. The page does not store the prompt.
- Opening the homepage or the dialog does not call a provider. Only the Ask action does.
- Loading the page still works with no network. A missing secrets file, a bad key, a timeout, or an upstream error stays on that provider's card and does not discard the others.

Out of scope: a merged synthesis, token streaming, WebSockets, OpenRouter, driving provider websites, prompt history, and a plugin loader.

## Capabilities

### New Capabilities

- `model-ask`: one prompt sent to a chosen subset of configured model providers, with per-provider results and a copyable dossier

### Modified Capabilities

- `local-homepage-serving`: the loopback server accepts the model-ask routes in addition to GET and HEAD for built assets; the content security policy allows the page to call only its own origin; user-initiated model asks are an explicit external action, and startup still makes none

## Impact

- `src/server.js` gains loopback JSON routes and outbound provider calls. Static files, host checks, and path checks stay as they are.
- New page UI and a pure dossier formatter. No new runtime dependency. Tests mock provider HTTP.
- Secrets path, threat model, architecture notes, and the README. Keys are not committed. The checked-in example uses empty placeholders.
- Assumption: this Mac has no iCloud Drive folder under `~/Library/Mobile Documents`. The server reads whatever path the operator sets, including an iCloud-synced file, and ships no default key file.
