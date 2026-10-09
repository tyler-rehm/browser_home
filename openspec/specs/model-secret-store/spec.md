# model-secret-store Specification

## Purpose

Load model API secrets and optional expiry metadata from the macOS Keychain, with a local file fallback and a one-way migration path.

## Requirements

### Requirement: Keychain is preferred on macOS
On macOS, the homepage server SHALL load model secrets from the macOS Keychain item for Code Home when that item exists. The browser and provider-list response MUST NOT receive API keys.

#### Scenario: Secrets are in Keychain
- **WHEN** the Keychain item exists and contains a provider key
- **THEN** that provider is configured and the key is not returned to the page

### Requirement: File fallback remains
When the Keychain item is missing or unreadable, the server SHALL load `CODE_HOME_SECRETS_FILE` when set, otherwise `~/Library/Application Support/browser-home/model-secrets.json`. A missing store means every provider is not configured.

#### Scenario: Only the JSON file exists
- **WHEN** Keychain has no Code Home secrets item and the JSON secrets file has a provider key
- **THEN** that provider is configured from the file

### Requirement: Optional expiry metadata
Each provider record MAY include an `expiresAt` ISO date string. Invalid or empty expiry values SHALL be treated as absent.

#### Scenario: A valid expiry is stored
- **WHEN** a provider record includes a valid `expiresAt`
- **THEN** Ask models can use that date for expiry warnings without exposing the API key

### Requirement: Migration copies file into Keychain once
On macOS, when the Keychain item is missing and the JSON secrets file is present and readable, the server SHALL write that file's provider records into Keychain and leave the file in place. Migration MUST NOT log API keys.

#### Scenario: First launch after Keychain support
- **WHEN** the JSON secrets file exists and Keychain has no Code Home secrets item
- **THEN** the server creates the Keychain item from the file and subsequent loads can use Keychain

### Requirement: Model override can be updated without exposing secrets
The server SHALL accept a loopback request that updates only a provider’s stored model id when the id is on that provider’s curated allowlist. The response MUST NOT include API keys. Persistence SHALL prefer Keychain on macOS when writable, otherwise the secrets file.

#### Scenario: A valid model is saved
- **WHEN** the operator saves an allowed model id for a configured provider
- **THEN** the secret store’s model field for that provider is updated and the API response contains no API key

#### Scenario: An unknown model is rejected
- **WHEN** the request includes a model id not on the curated allowlist for that provider
- **THEN** the server refuses the update and the stored model is unchanged
