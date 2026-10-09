# Spec Delta

## ADDED Requirements

### Requirement: Model accounts lives in Settings
Settings SHALL include a Model accounts section that lists Claude, ChatGPT, Gemini, Grok, and Perplexity. The section SHALL be available without starting an Ask models run.

#### Scenario: The user opens Settings
- **WHEN** the user opens Settings
- **THEN** Model accounts is visible with the five providers listed

### Requirement: Each provider shows connection status without secrets
For each provider, Model accounts SHALL show whether it is configured, the configured model id when present, and any expiry warning. The page, browser storage, and API responses used by this panel MUST NOT include an API key.

#### Scenario: A provider is configured
- **WHEN** Settings Model accounts loads and a provider has a key in the secret store
- **THEN** that provider shows as configured with its model id and no API key is present in the page

#### Scenario: A provider is not configured
- **WHEN** a provider has no key in the secret store
- **THEN** that provider shows as not configured

### Requirement: Billing status and operator links
For each provider, Model accounts SHALL show the best-effort billing or credit label when status has loaded, a link to that vendor’s console URL, and a link to that provider’s refresh steps documentation on the homepage origin. An explicit refresh control SHALL reload billing status without requiring a full page reload.

#### Scenario: Status loads for configured providers
- **WHEN** Model accounts is shown and billing status returns
- **THEN** each provider shows its billing label and links for console and refresh steps

#### Scenario: The operator refreshes status
- **WHEN** the user activates Refresh status in Model accounts
- **THEN** billing status is requested again and the labels update when the response arrives

### Requirement: Operator note points at docs, not secrets
Model accounts SHALL include a short note that API keys are managed outside the browser (Keychain or local secrets file) and SHALL link to the Ask models documentation served under `/docs/ask-models.md`.

#### Scenario: The operator needs setup help
- **WHEN** Model accounts is shown
- **THEN** a docs link to `/docs/ask-models.md` is available
