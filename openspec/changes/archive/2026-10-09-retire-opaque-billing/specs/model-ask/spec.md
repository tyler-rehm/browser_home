# Spec Delta

## MODIFIED Requirements

### Requirement: Billing status is visible after open
After Ask models opens, the page SHALL NOT call a vendor billing or credit-grant endpoint. Ask models SHALL NOT show remaining-credit amounts from balance probes. A low-credit hint MAY appear only after an ask failure that clearly indicates insufficient credits or quota, and SHALL include that provider’s billing URL when shown. Opening the homepage without opening Ask models SHALL NOT call a model provider or vendor billing endpoint.

#### Scenario: Ask models opens with a low balance
- **WHEN** the user opens Ask models and a configured provider previously failed an ask for insufficient credits
- **THEN** that provider may show a low-credit hint with its billing URL, and no vendor billing endpoint is contacted on open

#### Scenario: The homepage loads alone
- **WHEN** Safari opens the homepage and the user does not open Ask models
- **THEN** no provider billing endpoint is contacted

#### Scenario: Ask models opens without probing balances
- **WHEN** the user opens Ask models with configured providers and no prior quota failure hint
- **THEN** no vendor billing or credit-grant endpoint is contacted and no remaining-credit amount from a probe is shown
