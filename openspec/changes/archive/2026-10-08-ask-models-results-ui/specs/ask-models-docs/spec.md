# Spec Delta

## Purpose

Serve Ask models operator documentation from the production homepage origin so refresh-step links work in Safari.

## ADDED Requirements

### Requirement: Ask models docs are served under /docs
The production homepage server SHALL serve Ask models documentation at `/docs/ask-models.md` (and `/docs` as that document) from a configured docs root. Requests MUST stay inside the docs root after decoding and `realpath`. The response SHALL be HTML that displays the document text and preserves refresh fragment ids used by Ask models (`refresh-claude`, `refresh-chatgpt`, `refresh-gemini`, `refresh-grok`, `refresh-perplexity`).

#### Scenario: A refresh link is opened
- **WHEN** Safari requests `/docs/ask-models.md#refresh-chatgpt` on the homepage origin
- **THEN** the server returns an HTML page that includes the ChatGPT refresh section and the `refresh-chatgpt` fragment target

#### Scenario: A path escapes the docs root
- **WHEN** a request uses encoded traversal or a path outside the docs root
- **THEN** the server rejects it without exposing private paths

### Requirement: Login install includes the Ask models doc
Installing or updating the macOS login helper SHALL copy `docs/ask-models.md` into the installed package so the production service can serve it when the repo checkout is not the working directory.

#### Scenario: The service is updated
- **WHEN** the operator runs the documented service update after this change
- **THEN** the installed package contains `ask-models.md` under its docs directory
