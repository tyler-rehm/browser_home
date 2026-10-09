# Spec Delta

## ADDED Requirements

### Requirement: Progress is visible while asking
While any selected provider request is in flight, Ask models SHALL show an overall progress message that indicates work is in progress. Each selected provider SHALL show its own status of waiting, asking, succeeded, or failed. Closing the dialog SHALL abort in-flight requests and clear the active progress state.

#### Scenario: Multiple providers are asked
- **WHEN** the user asks with more than one configured provider selected
- **THEN** an overall progress message is shown and each selected provider shows an asking or settled status before the run finishes

#### Scenario: One provider finishes first
- **WHEN** one selected provider settles while another is still in flight
- **THEN** the finished provider shows a settled status and the overall progress remains active until every selected request has settled or aborted

### Requirement: Results use Overview and per-provider tabs
After at least one selected request has settled, Ask models SHALL present results in a tablist. The first tab SHALL be Overview. There SHALL be one additional tab per provider that has a result for the current run, in catalog order.

#### Scenario: Results arrive
- **WHEN** at least one selected provider has settled
- **THEN** the Overview tab is available and that provider has its own tab

#### Scenario: Several providers settle
- **WHEN** more than one selected provider has settled
- **THEN** Overview is first and each settled provider has its own tab in catalog order

### Requirement: Overview includes a compiled JSON bundle
Overview SHALL summarize each settled provider and SHALL include one compiled JSON document for the run with the prompt and each provider's response data. The compiled JSON MUST NOT include API keys.

#### Scenario: Overview shows compiled JSON
- **WHEN** at least one selected provider has settled and Overview is shown
- **THEN** Overview lists that provider's outcome and the compiled JSON includes that provider's data without an API key

### Requirement: Provider tabs offer Rendered and Raw views
Each per-provider result tab SHALL let the user switch between a Rendered view and a Raw view. Rendered SHALL show the reply text or the short error. Raw SHALL show the HTTP status when known and the redacted upstream response body. Raw content MUST NOT include the API key.

#### Scenario: The user opens Raw
- **WHEN** a provider has settled and the user chooses Raw on that provider's tab
- **THEN** the HTTP status and redacted raw body for that provider are shown

#### Scenario: The user opens Rendered
- **WHEN** a provider has settled with a reply and the user chooses Rendered
- **THEN** the reply text is shown

### Requirement: Ask payloads include http status and redacted raw body
A settled Ask result from the server SHALL include `httpStatus` (a number or null) and `raw` (a redacted, length-limited upstream body string). Failure and success paths SHALL both carry these fields when a body was received. API keys MUST NOT appear in `raw` or `error`.

#### Scenario: A provider returns a body
- **WHEN** a selected provider responds with an HTTP body
- **THEN** the Ask result includes that status code and a redacted raw body

## MODIFIED Requirements

### Requirement: Copyable dossier
After at least one selected request has settled, Copy SHALL place one markdown dossier on the clipboard. The dossier SHALL include the prompt and, for each settled provider, its display name, the model id that was requested, its status, and either the reply text or a short error. The error MUST NOT include the API key. Copy SHALL be unavailable before any request has settled. Tabbed Overview and Raw views SHALL NOT replace Copy; they are additional surfaces for the same settled results. After a successful copy, Ask models SHALL show a short, visible confirmation in the dialog. After a failed copy, Ask models SHALL show an error. Confirmation MUST NOT imply success when the clipboard write failed.

#### Scenario: Two results are copied
- **WHEN** one selected provider has returned a reply, another has failed, and the user copies
- **THEN** the clipboard text contains the prompt, both display names, both model ids, the reply, and the failure, and the dialog shows that the dossier was copied

#### Scenario: Nothing has settled
- **WHEN** the user has not yet asked, or no selected request has settled
- **THEN** copy is unavailable

#### Scenario: Copy fails
- **WHEN** the clipboard write fails after results exist
- **THEN** the dialog shows a copy error and does not show a success confirmation
