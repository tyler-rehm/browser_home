# Spec Delta

## REMOVED Requirements

### Requirement: Status is user-initiated
**Reason**: Live vendor balance probes are retired; ordinary API keys cannot read remaining credit.
**Migration**: Operators use Balance/Console links in Model accounts. Optional ask-quota hints replace probe-on-open status.

### Requirement: Known, low, and unknown states
**Reason**: Remaining-credit amounts from vendor probes are unreliable or unavailable for ordinary keys.
**Migration**: Do not show invented balance amounts. Vendor billing URLs remain on each provider.

### Requirement: Opaque billing probes stay unknown
**Reason**: Billing probes are removed, so opaque probe classification is unused.
**Migration**: None.

### Requirement: Probe failures stay local
**Reason**: Billing probes are removed.
**Migration**: Ask failures still report per-provider errors without logging API keys.

## ADDED Requirements

### Requirement: No live remaining-credit probes
The homepage server SHALL NOT call vendor billing or credit-grant endpoints to learn remaining prepaid balance. Opening Ask models or Model accounts SHALL NOT trigger such probes.

#### Scenario: Ask models opens
- **WHEN** the user opens Ask models with configured providers
- **THEN** no vendor billing or credit-grant endpoint is contacted

#### Scenario: Model accounts opens
- **WHEN** the user opens Settings Model accounts
- **THEN** no vendor billing or credit-grant endpoint is contacted

## MODIFIED Requirements

### Requirement: Ask-time quota errors can mark low
When a provider ask fails with a short error that clearly indicates insufficient API credits or quota, Ask models MAY show a low-credit hint for that provider that includes the vendor billing URL. A successful ask SHALL NOT leave a stale low label from an earlier ask failure. Live billing probes SHALL NOT be used to set low.

#### Scenario: Ask fails for empty credits
- **WHEN** a provider ask fails with an insufficient-credits or quota error
- **THEN** Ask models may show a low-credit hint with that provider’s billing URL without calling a vendor balance endpoint

#### Scenario: Ask succeeds after an opaque billing probe
- **WHEN** a prior ask failed for quota and a later ask for that provider succeeds
- **THEN** Ask models does not keep showing a low label from the earlier ask failure
