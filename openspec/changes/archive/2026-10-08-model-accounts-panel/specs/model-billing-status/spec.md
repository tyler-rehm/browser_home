# Spec Delta

## MODIFIED Requirements

### Requirement: Status is user-initiated
Billing or credit probes SHALL run only after the user opens Ask models, opens Settings Model accounts, or activates an explicit refresh in one of those surfaces. Homepage load and provider-list without those surfaces SHALL NOT probe balances.

#### Scenario: The dialog opens
- **WHEN** the user opens Ask models with at least one configured provider
- **THEN** the server loads billing status for configured providers and the page shows each status without showing an API key

#### Scenario: Model accounts opens
- **WHEN** the user opens Settings and Model accounts is shown
- **THEN** the server loads billing status for configured providers and Settings shows each status without showing an API key

#### Scenario: Homepage alone
- **WHEN** Safari opens the homepage and the user does not open Ask models or Settings Model accounts
- **THEN** no provider billing endpoint is contacted
