# model-accounts Specification

## Purpose

Show per-provider AI connection status in Settings—configured state, model id, expiry, and Balance/Console/Refresh links—without exposing API keys or inventing remaining-credit amounts from ordinary API keys.

## Requirements

### Requirement: Model accounts lives in Settings
Settings SHALL include a Model accounts tab that lists Claude, ChatGPT, Gemini, Grok, and Perplexity. The tab SHALL be available without starting an Ask models run.

#### Scenario: The user opens Settings
- **WHEN** the user opens Settings and selects Model accounts
- **THEN** the five providers are listed

#### Scenario: Manage accounts opens the tab
- **WHEN** the user opens Settings via Manage accounts from Ask models
- **THEN** the Model accounts tab is selected

### Requirement: Each provider shows connection status without secrets
For each provider, Model accounts SHALL show whether it is configured, the configured model id when present, and any expiry warning. The page, browser storage, and API responses used by this panel MUST NOT include an API key.

#### Scenario: A provider is configured
- **WHEN** Settings Model accounts loads and a provider has a key in the secret store
- **THEN** that provider shows as configured with its model id and no API key is present in the page

#### Scenario: A provider is not configured
- **WHEN** a provider has no key in the secret store
- **THEN** that provider shows as not configured

### Requirement: Operator note points at docs, not secrets
Model accounts SHALL include a short note that API keys are managed outside the browser (Keychain or local secrets file) and SHALL link to the Ask models documentation served under `/docs/ask-models.md`.

#### Scenario: The operator needs setup help
- **WHEN** Model accounts is shown
- **THEN** a docs link to `/docs/ask-models.md` is available

### Requirement: Balance, Console, and Refresh are button links
For each provider, Model accounts SHALL offer three same-styled button links with icons: Balance (vendor billing URL), Console (vendor console URL), and Refresh (homepage refresh-steps doc). Model accounts SHALL NOT show a remaining-credit status line and SHALL NOT call a vendor balance endpoint when the panel opens or when those links are used.

#### Scenario: The operator opens Balance
- **WHEN** the user activates Balance for a provider
- **THEN** the browser opens that provider’s billing URL

#### Scenario: The operator opens Refresh
- **WHEN** the user activates Refresh for a provider
- **THEN** the browser opens that provider’s refresh-steps documentation on the homepage origin

#### Scenario: Model accounts does not probe balances
- **WHEN** the user opens Model accounts
- **THEN** no vendor billing or credit-grant endpoint is contacted

### Requirement: Default model is chosen from a curated list
For each configured provider, Model accounts SHALL offer a dropdown of curated model ids. Choosing a value SHALL persist that provider’s stored model override without exposing an API key.

#### Scenario: The operator changes the stored model
- **WHEN** the user selects a different allowed model for a configured provider and the save succeeds
- **THEN** later provider-list responses show that model id and no API key is returned

### Requirement: Ask models links to Model accounts with a settings control
Ask models SHALL offer a settings (gear) control that opens Settings focused on Model accounts.

#### Scenario: The operator opens Model accounts from Ask models
- **WHEN** the user activates the settings gear in Ask models
- **THEN** Settings opens on the Model accounts tab
