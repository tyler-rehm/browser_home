# Spec Delta

## MODIFIED Requirements

### Requirement: Production loopback serving
The application SHALL serve built public assets on a loopback address. It SHALL accept only documented local hosts. It SHALL serve GET and HEAD for those assets, GET for Ask models documentation under `/docs`, GET for the model-provider list, GET for provider billing status, and POST for a model ask. It SHALL reject every other method. It SHALL reject source-file access, path traversal, directory listings, and files escaping the asset root or docs root, including symbolic links.

#### Scenario: A local browser opens the homepage
- **WHEN** a user requests the documented homepage origin after building the application
- **THEN** the server returns the built homepage and its assets without requiring a development server

#### Scenario: A request crosses the server boundary
- **WHEN** a request uses an unexpected Host header, a method outside the set above, encoded traversal, or an asset resolving outside the public root
- **THEN** the server rejects it without exposing private paths or file contents

#### Scenario: A model route uses the documented host
- **WHEN** a documented local host requests the provider list with GET, provider status with GET, Ask models docs with GET, or a model ask with POST
- **THEN** the server accepts that route and still rejects POST for a static asset path

### Requirement: Browser security headers
Production responses SHALL include a documented content security policy and headers preventing MIME sniffing, framing, and unnecessary referrer disclosure. The policy SHALL allow required local UI behavior, including connections only to the homepage origin, without allowing remote script execution or connections to any other origin. Ask models documentation pages SHALL be served from the same origin under that policy.

#### Scenario: The built homepage is served
- **WHEN** a browser loads the production homepage
- **THEN** security headers are present, connections are allowed only to the homepage origin, and remote scripts remain disallowed

#### Scenario: Ask models docs are served
- **WHEN** a browser loads `/docs/ask-models.md` from the homepage origin
- **THEN** security headers are present and the document is readable without loading remote scripts
