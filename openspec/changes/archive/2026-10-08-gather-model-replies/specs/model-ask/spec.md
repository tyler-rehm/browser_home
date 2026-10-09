# Spec Delta

## Purpose

Send one prompt to a chosen subset of configured model providers and collect each reply into a single copyable dossier.

## ADDED Requirements

### Requirement: Provider list hides secrets
The Ask models surface SHALL list Claude, ChatGPT, Gemini, and Grok. Each entry SHALL show whether that provider is configured. The page, browser storage, and provider-list response MUST NOT contain an API key.

#### Scenario: The dialog opens
- **WHEN** the user opens Ask models
- **THEN** the four providers are listed with a configured or not-configured state and no API key is present in the page

#### Scenario: The secrets file is missing
- **WHEN** the operator has not provided a secrets file
- **THEN** every provider is not configured and no provider is called

### Requirement: Only selected configured providers are called
The user SHALL choose any subset of configured providers. Ask SHALL send the prompt only to the checked providers. A provider that is not configured MUST NOT be selectable or called.

#### Scenario: A subset is checked
- **WHEN** the user enters a prompt, checks two configured providers, leaves the others unchecked, and asks
- **THEN** only the two checked providers are called

#### Scenario: A provider has no key
- **WHEN** a provider is not configured
- **THEN** its control is unavailable and asking does not call it

### Requirement: Prompt limits
Ask SHALL reject an empty prompt and a prompt longer than 32000 characters. A rejected ask MUST NOT call any provider.

#### Scenario: The prompt is empty
- **WHEN** the user asks with an empty prompt
- **THEN** the ask is refused and no provider is called

#### Scenario: The prompt is too long
- **WHEN** the user asks with a prompt longer than 32000 characters
- **THEN** the ask is refused and no provider is called

### Requirement: Independent results
Each selected provider SHALL be requested on its own. A timeout of 60 seconds, an upstream error, or a bad key SHALL be reported on that provider only. Successful replies from the other selected providers SHALL be kept.

#### Scenario: One provider fails
- **WHEN** one selected provider times out or returns an error and another selected provider returns a reply
- **THEN** the failure is shown for the first provider and the reply is shown for the second

#### Scenario: The user closes the dialog
- **WHEN** the user closes Ask models while a request is still running
- **THEN** that request is aborted

### Requirement: Copyable dossier
After at least one selected request has settled, Copy SHALL place one markdown dossier on the clipboard. The dossier SHALL include the prompt and, for each settled provider, its display name, the model id that was requested, its status, and either the reply text or a short error. The error MUST NOT include the API key. Copy SHALL be unavailable before any request has settled.

#### Scenario: Two results are copied
- **WHEN** one selected provider has returned a reply, another has failed, and the user copies
- **THEN** the clipboard text contains the prompt, both display names, both model ids, the reply, and the failure

#### Scenario: Nothing has settled
- **WHEN** the user has not yet asked, or no selected request has settled
- **THEN** copy is unavailable

### Requirement: Prompt is not stored
The prompt and provider replies MUST NOT be written to browser storage or to server logs.

#### Scenario: An ask finishes
- **WHEN** the user sends a prompt and a provider returns a reply
- **THEN** that prompt and reply are absent from browser storage and from server logs
