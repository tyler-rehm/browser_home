# model-billing-status Specification

## Purpose

Show best-effort prepaid balance or credit status for configured model providers so a small credit balance is not spent unnoticed.

## Requirements

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

### Requirement: Opaque billing probes stay unknown
A failed or unauthorized billing probe without a numeric remaining balance SHALL be unknown, not low, even when the error text mentions billing or credits.

#### Scenario: Billing probe is forbidden or opaque
- **WHEN** a billing probe returns an error without a numeric remaining balance
- **THEN** Ask models shows unknown for that provider and does not claim that no API credits remain

### Requirement: Probe failures stay local
A failed billing probe SHALL mark that provider unknown or error without blocking Ask and without logging the API key or full upstream body.

#### Scenario: A billing probe fails
- **WHEN** a balance request times out or returns an error
- **THEN** that provider's billing status is unknown or error, other providers still load, and Ask remains available

### Requirement: Ask-time quota errors can mark low
When a provider ask fails with a short error that clearly indicates insufficient API credits or quota, the next provider-status load MAY report low for that provider. A successful ask SHALL NOT leave a stale low label that was based only on a failed billing probe.

#### Scenario: Ask fails for empty credits
- **WHEN** a provider ask fails with an insufficient-credits or quota error
- **THEN** Ask models may show low for that provider on the following status load

#### Scenario: Ask succeeds after an opaque billing probe
- **WHEN** a billing probe was unknown or falsely suggested no credits and a later ask for that provider succeeds
- **THEN** Ask models does not keep showing a low label that was based only on that opaque probe
