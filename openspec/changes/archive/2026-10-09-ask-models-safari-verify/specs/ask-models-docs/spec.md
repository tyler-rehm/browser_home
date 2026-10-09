# Spec Delta

## ADDED Requirements

### Requirement: Ask models Safari smoke is documented
Ask models documentation SHALL include a short Safari smoke path that uses the installed login service origin after a documented service update, covers Model accounts configuration visibility without showing API keys, and covers one Ask models run with at least one configured provider. The path SHALL state that Playwright WebKit is not a substitute for shipping Safari.

#### Scenario: An operator prepares a Safari check
- **WHEN** the operator opens Ask models documentation to verify a local install
- **THEN** the document lists update, Model accounts, and Ask steps for Safari on the homepage origin
