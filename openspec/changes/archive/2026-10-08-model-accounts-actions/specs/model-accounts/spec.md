# Spec Delta

## ADDED Requirements

### Requirement: Balance, Console, and Refresh are button links
For each provider, Model accounts SHALL offer three same-styled button links with icons: Balance (vendor billing URL), Console (vendor console URL), and Refresh (homepage refresh-steps doc). Model accounts SHALL NOT show a remaining-credit status line, because ordinary API keys cannot read vendor balances.

#### Scenario: The operator opens Balance
- **WHEN** the user activates Balance for a provider
- **THEN** the browser opens that provider’s billing URL

#### Scenario: The operator opens Refresh
- **WHEN** the user activates Refresh for a provider
- **THEN** the browser opens that provider’s refresh-steps documentation on the homepage origin

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
