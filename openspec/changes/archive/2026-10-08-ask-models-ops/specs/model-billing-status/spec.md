# Spec Delta

## Purpose

Show best-effort prepaid balance or credit status for configured model providers so a small credit balance is not spent unnoticed.

## ADDED Requirements

### Requirement: Status is user-initiated
Billing or credit probes SHALL run only after the user opens Ask models, or after an explicit refresh in that dialog. Homepage load and provider-list without Ask models SHALL NOT probe balances.

#### Scenario: The dialog opens
- **WHEN** the user opens Ask models with at least one configured provider
- **THEN** the server loads billing status for configured providers and the page shows each status without showing an API key

### Requirement: Known, low, and unknown states
Each configured provider SHALL report one of: remaining credit when the vendor exposes it, low when remaining credit is below one US dollar, or unknown when no usable remaining-balance signal exists. Low and unknown states SHALL include a short label and a documented console URL for that vendor.

#### Scenario: Remaining credit is above the threshold
- **WHEN** a vendor returns a remaining credit of one dollar or more
- **THEN** Ask models shows that remaining credit for the provider

#### Scenario: Remaining credit is below one dollar
- **WHEN** a vendor returns a remaining credit under one dollar
- **THEN** Ask models shows a low-credit warning for that provider

#### Scenario: The vendor has no balance API
- **WHEN** a configured provider has no usable remaining-balance endpoint
- **THEN** Ask models shows unknown for that provider and a link to that vendor's billing console

### Requirement: Probe failures stay local
A failed billing probe SHALL mark that provider unknown or error without blocking Ask and without logging the API key or full upstream body.

#### Scenario: A billing probe fails
- **WHEN** a balance request times out or returns an error
- **THEN** that provider's billing status is unknown or error, other providers still load, and Ask remains available
