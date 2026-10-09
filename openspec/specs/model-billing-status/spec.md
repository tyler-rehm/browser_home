# model-billing-status Specification

## Purpose

Point operators at vendor Balance/Console links for prepaid credit, and optionally hint low credit after an ask fails for quota—without live remaining-balance probes on ordinary API keys.

## Requirements

### Requirement: Ask-time quota errors can mark low
When a provider ask fails with a short error that clearly indicates insufficient API credits or quota, Ask models MAY show a low-credit hint for that provider that includes the vendor billing URL. A successful ask SHALL NOT leave a stale low label from an earlier ask failure. Live billing probes SHALL NOT be used to set low.

#### Scenario: Ask fails for empty credits
- **WHEN** a provider ask fails with an insufficient-credits or quota error
- **THEN** Ask models may show a low-credit hint with that provider’s billing URL without calling a vendor balance endpoint

#### Scenario: Ask succeeds after an opaque billing probe
- **WHEN** a prior ask failed for quota and a later ask for that provider succeeds
- **THEN** Ask models does not keep showing a low label from the earlier ask failure

### Requirement: No live remaining-credit probes
The homepage server SHALL NOT call vendor billing or credit-grant endpoints to learn remaining prepaid balance. Opening Ask models or Model accounts SHALL NOT trigger such probes.

#### Scenario: Ask models opens
- **WHEN** the user opens Ask models with configured providers
- **THEN** no vendor billing or credit-grant endpoint is contacted

#### Scenario: Model accounts opens
- **WHEN** the user opens Settings Model accounts
- **THEN** no vendor billing or credit-grant endpoint is contacted
