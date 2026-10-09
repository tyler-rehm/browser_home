# Spec Delta

## MODIFIED Requirements

### Requirement: Known, low, and unknown states
Each configured provider MAY report remaining credit only when a usable numeric balance is available from a live vendor probe. Low applies when that amount is below one US dollar. When no usable remaining-balance signal exists, Model accounts SHALL NOT invent a status label; the operator uses the vendor Balance/Console links. Low and unknown responses that are shown in Ask models SHALL include a short label and a documented console URL when a label is present.

#### Scenario: Remaining credit is above the threshold
- **WHEN** a vendor returns a remaining credit of one dollar or more
- **THEN** Ask models shows that remaining credit for the provider

#### Scenario: Remaining credit is below one dollar
- **WHEN** a vendor returns a remaining credit under one dollar
- **THEN** Ask models shows a low-credit warning for that provider

#### Scenario: The vendor has no balance API
- **WHEN** a configured provider has no usable remaining-balance endpoint
- **THEN** Ask models does not show a fake balance amount and Model accounts still offers the vendor billing link
