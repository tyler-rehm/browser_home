# Spec Delta

## ADDED Requirements

### Requirement: Model override can be updated without exposing secrets
The server SHALL accept a loopback request that updates only a provider’s stored model id when the id is on that provider’s curated allowlist. The response MUST NOT include API keys. Persistence SHALL prefer Keychain on macOS when writable, otherwise the secrets file.

#### Scenario: A valid model is saved
- **WHEN** the operator saves an allowed model id for a configured provider
- **THEN** the secret store’s model field for that provider is updated and the API response contains no API key

#### Scenario: An unknown model is rejected
- **WHEN** the request includes a model id not on the curated allowlist for that provider
- **THEN** the server refuses the update and the stored model is unchanged
