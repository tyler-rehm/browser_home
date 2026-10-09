# Spec Delta

## ADDED Requirements

### Requirement: Curated model options are published
The provider-list response SHALL include, for each provider, the curated model options and the current model id. It MUST NOT include an API key.

#### Scenario: Ask models or Settings loads providers
- **WHEN** the page requests the provider list
- **THEN** each provider includes model options and the current model without an API key

### Requirement: Ask can override model for one run
`POST /api/ask` MAY include a `model` field. When present and on that provider’s curated allowlist, Ask SHALL use that model for the request without changing the stored default. When absent, Ask SHALL use the stored (or built-in) default.

#### Scenario: A runtime model is selected
- **WHEN** the user asks with a checked provider and an allowed runtime model different from the stored default
- **THEN** that ask uses the runtime model and the stored default remains unchanged

#### Scenario: Runtime model is omitted
- **WHEN** the user asks without a runtime model override
- **THEN** that ask uses the stored or built-in default model
