# model-ask Specification

## Purpose

Send one prompt to a chosen subset of configured model providers and collect each reply into a single copyable dossier, including Perplexity, expiry warnings, and billing status.

## Requirements

### Requirement: Provider list includes five models and hides secrets
The Ask models surface SHALL list Claude, ChatGPT, Gemini, Grok, and Perplexity. Each entry SHALL show whether that provider is configured. The page, browser storage, and provider-list response MUST NOT contain an API key.

#### Scenario: The dialog opens
- **WHEN** the user opens Ask models
- **THEN** the five providers are listed with a configured or not-configured state and no API key is present in the page

#### Scenario: The secrets store is empty
- **WHEN** the operator has not provided Keychain or file secrets
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
After at least one selected request has settled, Copy SHALL place one markdown dossier on the clipboard with the prompt and each settled provider's name, requested model id, status, and reply or short error. The error MUST NOT include the API key. Copy SHALL be unavailable before any request has settled. Tabbed Overview and Raw views SHALL NOT replace Copy.

#### Scenario: Two results are copied
- **WHEN** one selected provider has returned a reply, another has failed, and the user copies
- **THEN** the clipboard text contains the prompt, both display names, both model ids, the reply, and the failure, and the dialog shows that the dossier was copied

#### Scenario: Nothing has settled
- **WHEN** the user has not yet asked, or no selected request has settled
- **THEN** copy is unavailable

### Requirement: Copy confirmation is honest
After a successful copy, Ask models SHALL show a short, visible confirmation in the dialog. After a failed copy, Ask models SHALL show an error. Confirmation MUST NOT imply success when the clipboard write failed.

#### Scenario: Copy fails
- **WHEN** the clipboard write fails after results exist
- **THEN** the dialog shows a copy error and does not show a success confirmation

### Requirement: Prompt is not stored
The prompt and provider replies MUST NOT be written to browser storage or to server logs.

#### Scenario: An ask finishes
- **WHEN** the user sends a prompt and a provider returns a reply
- **THEN** that prompt and reply are absent from browser storage and from server logs

### Requirement: Perplexity uses the Agent API
Ask models SHALL treat Perplexity as a first-class provider. When configured and checked, Ask SHALL send the prompt to Perplexity's Agent API responses endpoint with an Agent preset (default `fast`) and include its settled result in the dossier. Ask SHALL NOT route other vendors through Perplexity Router; each other provider keeps its first-party API.

#### Scenario: Perplexity is checked
- **WHEN** the user checks a configured Perplexity provider and asks
- **THEN** Perplexity's Agent API is called and its reply or failure appears in the results and in the copied dossier

### Requirement: Expiry warning within seven days
When a configured provider has an `expiresAt` date and that date is within 7 days of now, Ask models SHALL show a warning on that provider. The warning SHALL name the provider and point the operator to the refresh steps for that provider in the Ask models documentation. A missing `expiresAt` SHALL NOT produce an expiry warning.

#### Scenario: A key expires in under seven days
- **WHEN** the user opens Ask models and a configured provider expires in fewer than 7 days
- **THEN** that provider shows an expiry warning with a pointer to its refresh steps

#### Scenario: No expiry is stored
- **WHEN** a configured provider has no `expiresAt`
- **THEN** Ask models does not show an expiry warning for that provider

### Requirement: Billing status is visible after open
After Ask models opens, the page SHALL NOT call a vendor billing or credit-grant endpoint. Ask models SHALL NOT show remaining-credit amounts from balance probes. A low-credit hint MAY appear only after an ask failure that clearly indicates insufficient credits or quota, and SHALL include that provider’s billing URL when shown. Opening the homepage without opening Ask models SHALL NOT call a model provider or vendor billing endpoint.

#### Scenario: Ask models opens with a low balance
- **WHEN** the user opens Ask models and a configured provider previously failed an ask for insufficient credits
- **THEN** that provider may show a low-credit hint with its billing URL, and no vendor billing endpoint is contacted on open

#### Scenario: The homepage loads alone
- **WHEN** Safari opens the homepage and the user does not open Ask models
- **THEN** no provider billing endpoint is contacted

#### Scenario: Ask models opens without probing balances
- **WHEN** the user opens Ask models with configured providers and no prior quota failure hint
- **THEN** no vendor billing or credit-grant endpoint is contacted and no remaining-credit amount from a probe is shown

### Requirement: Anthropic workspace support
When Anthropic secrets include a workspace id, Ask SHALL send that workspace on Anthropic requests. When the workspace id is absent, Ask SHALL call Anthropic without that header.

#### Scenario: A workspace id is stored
- **WHEN** Anthropic is configured with a workspace id and the user asks Claude
- **THEN** the Anthropic request includes that workspace id

### Requirement: Gemini default remains callable
The built-in Gemini default model id SHALL be one that accepts new API users. An operator model override in secrets SHALL still win when present.

#### Scenario: Gemini uses the built-in default
- **WHEN** Gemini is configured with an empty model override and the user asks
- **THEN** the request uses the built-in default model id, not a retired id that rejects new users

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

### Requirement: Pending providers appear while asking
When an ask run starts, Ask models SHALL show each selected provider in the results tablist with an asking state until that provider settles or the run is aborted.

#### Scenario: One provider is still in flight
- **WHEN** four selected providers have settled and one is still asking
- **THEN** that pending provider remains visible as asking in the results UI

#### Scenario: A provider times out
- **WHEN** a selected provider exceeds the ask timeout
- **THEN** that provider settles as failed with a timed-out error and is no longer shown as asking

### Requirement: Progress names remaining providers
While any selected provider request is in flight, Ask models SHALL show an overall progress message. When only one or two selected providers remain in flight, that message SHALL name those providers. Closing the dialog SHALL abort in-flight requests and clear the active progress state.

#### Scenario: Only one provider remains
- **WHEN** exactly one selected provider is still asking
- **THEN** the overall progress message names that provider

#### Scenario: Two providers remain
- **WHEN** exactly two selected providers are still asking
- **THEN** the overall progress message names both pending providers

### Requirement: Overview stays scannable
Overview SHALL summarize each settled provider with status, model information, latency when known, and a short text preview. Overview SHALL NOT paste each provider's full reply. Full reply text belongs on that provider's Rendered view.

#### Scenario: Several providers settle
- **WHEN** more than one selected provider has settled and Overview is shown
- **THEN** Overview shows a short preview per provider and not the full reply bodies

### Requirement: Compiled JSON omits full raw bodies
The Overview compiled JSON document SHALL include the prompt and per-provider comparison fields (status, models, latency, http status, reply or error). It SHALL NOT include each provider's full redacted raw upstream body. Full redacted raw content remains available on the provider Raw view only.

#### Scenario: Overview shows compiled JSON
- **WHEN** at least one selected provider has settled and Overview compiled JSON is shown
- **THEN** the JSON includes that provider's reply or error and does not include the full raw upstream body

### Requirement: Rendered view shows readable markdown
The Rendered view SHALL present the reply as readable rich text for common markdown constructs used in model answers (at least headings, emphasis, links, and lists), not only as a raw markdown source dump. Unsafe HTML MUST NOT be executed.

#### Scenario: A reply contains markdown headings
- **WHEN** a settled reply includes markdown headings or lists and the user opens Rendered
- **THEN** those structures are presented as readable rich text rather than only literal markdown markers

### Requirement: Actual upstream model is shown when known
When a provider response includes an upstream model id, Ask models SHALL expose it on the result. When that id differs from the requested model, the dialog SHALL show both the requested and actual model ids.

#### Scenario: Upstream model differs
- **WHEN** a provider was requested with one model id and the response reports a different model id
- **THEN** the result UI shows both the requested and actual model ids

### Requirement: Perplexity citations appear in Rendered
When a Perplexity (Agent) result includes search result citations with URLs, the Rendered view SHALL list those citations as links. Citation markers in the answer text MAY remain as numeric references matched to that list.

#### Scenario: Agent search results are present
- **WHEN** a settled Perplexity result includes search results with titles and URLs and the user opens Rendered
- **THEN** those citations are listed as links under the answer

### Requirement: Ask models can open Model accounts
Ask models SHALL offer a control that opens Settings Model accounts so the operator can review connection status without searching the UI. Activating that control MUST NOT expose an API key.

#### Scenario: Manage accounts from Ask models
- **WHEN** the user activates Manage accounts in Ask models
- **THEN** Settings opens with Model accounts available

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
