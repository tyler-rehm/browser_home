# Spec Delta

## MODIFIED Requirements

### Requirement: Known, low, and unknown states
Each configured provider SHALL report one of: remaining credit when the vendor exposes a usable numeric remaining balance, low when that remaining credit is below one US dollar, or unknown when no usable remaining-balance signal exists. A failed or unauthorized billing probe that does not include a numeric remaining balance SHALL be unknown, not low, even if the error text mentions billing or credits. Low and unknown states SHALL include a short label and a documented console URL for that vendor.

#### Scenario: Remaining credit is above the threshold
- **WHEN** a vendor returns a remaining credit of one dollar or more
- **THEN** Ask models shows that remaining credit for the provider

#### Scenario: Remaining credit is below one dollar
- **WHEN** a vendor returns a remaining credit under one dollar
- **THEN** Ask models shows a low-credit warning for that provider

#### Scenario: The vendor has no balance API
- **WHEN** a configured provider has no usable remaining-balance endpoint
- **THEN** Ask models shows unknown for that provider and a link to that vendor's billing console

#### Scenario: Billing probe is forbidden or opaque
- **WHEN** a billing probe returns an error without a numeric remaining balance
- **THEN** Ask models shows unknown for that provider and does not claim that no API credits remain

## ADDED Requirements

### Requirement: Ask-time quota errors can mark low
When a provider ask fails with a short error that clearly indicates insufficient API credits or quota, the next provider-status load MAY report low for that provider. A successful ask SHALL NOT leave a stale low label that was based only on a failed billing probe.

#### Scenario: Ask fails for empty credits
- **WHEN** a provider ask fails with an insufficient-credits or quota error
- **THEN** Ask models may show low for that provider on the following status load

#### Scenario: Ask succeeds after an opaque billing probe
- **WHEN** a billing probe was unknown or falsely suggested no credits and a later ask for that provider succeeds
- **THEN** Ask models does not keep showing a low label that was based only on that opaque probe
