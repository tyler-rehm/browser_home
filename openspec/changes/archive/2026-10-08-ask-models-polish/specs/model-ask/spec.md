# Spec Delta

## ADDED Requirements

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
