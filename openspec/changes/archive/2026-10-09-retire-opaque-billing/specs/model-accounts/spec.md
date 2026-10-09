# Spec Delta

## REMOVED Requirements

### Requirement: Billing status and operator links
**Reason**: Contradicts the Balance/Console/Refresh button-link design; ordinary keys cannot load a useful remaining-credit label.
**Migration**: Use the Balance, Console, and Refresh button-links requirement. Do not show a billing status line in Model accounts.

## MODIFIED Requirements

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
