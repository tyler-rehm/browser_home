# local-homepage-serving Specification

## Purpose
Provide a reliable, offline-capable homepage served on the user's own Mac at a stable loopback origin, without exposing application files to other machines.

## Requirements

### Requirement: Production loopback serving
The application SHALL serve built public assets on a loopback address. It SHALL accept only documented local hosts. It SHALL serve GET and HEAD for those assets, GET for Ask models documentation under `/docs`, GET for the model-provider list, and POST for a model ask. It MAY serve GET for a provider-status route that returns no live vendor balance data. It SHALL reject every other method. It SHALL reject source-file access, path traversal, directory listings, and files escaping the asset root or docs root, including symbolic links.

#### Scenario: A local browser opens the homepage
- **WHEN** a user requests the documented homepage origin after building the application
- **THEN** the server returns the built homepage and its assets without requiring a development server

#### Scenario: A request crosses the server boundary
- **WHEN** a request uses an unexpected Host header, a method outside the set above, encoded traversal, or an asset resolving outside the public root
- **THEN** the server rejects it without exposing private paths or file contents

#### Scenario: A model route uses the documented host
- **WHEN** a documented local host requests the provider list with GET, Ask models docs with GET, or a model ask with POST
- **THEN** the server accepts that route and still rejects POST for a static asset path

### Requirement: Stable origin and explicit failures
The application SHALL use a documented stable origin. Startup SHALL fail clearly when its configured port is occupied or built assets are missing, without silently selecting a new port or serving unrelated content.

#### Scenario: The homepage port is occupied
- **WHEN** another process occupies the configured port
- **THEN** startup reports the conflict and preserves the configured origin

#### Scenario: Built assets are absent
- **WHEN** the user starts the production server without a successful build
- **THEN** startup explains how to build the application and does not report a healthy homepage

### Requirement: Optional macOS login lifecycle
The repository SHALL provide explicit, user-level installation, status, update, and uninstall operations for login startup. Installation SHALL require no administrator privileges, use stable executable and asset paths, and expose service failures through documented logs. Uninstall SHALL preserve browser data.

#### Scenario: Login startup is installed
- **WHEN** the user explicitly installs and enables the service
- **THEN** macOS starts the production homepage at login and restarts it after an unexpected exit

#### Scenario: The service is removed
- **WHEN** the user runs the documented uninstall operation
- **THEN** the service stops and its registration is removed without clearing notes, links, or preferences

### Requirement: Offline startup privacy
Rendering the homepage SHALL make no unsolicited requests to external origins. All required startup assets SHALL be available locally. User-initiated search, link navigation, and model asks SHALL remain explicit external actions. Opening the homepage SHALL NOT call a model provider. Opening Ask models SHALL NOT call a vendor billing or credit-grant endpoint and SHALL NOT call a model provider until the user asks.

#### Scenario: Network access is unavailable
- **WHEN** Safari opens the homepage with external network access unavailable
- **THEN** the homepage, dialogs, saved links, preferences, and scratchpad remain usable

#### Scenario: The dialog opens with no ask
- **WHEN** the user opens the homepage or Ask models and does not ask
- **THEN** no model provider is contacted for a completion and no vendor billing endpoint is contacted

#### Scenario: The user asks selected providers
- **WHEN** the user asks with a subset of providers selected
- **THEN** only those providers are contacted, and only because of that action

### Requirement: Browser security headers
Production responses SHALL include a documented content security policy and headers preventing MIME sniffing, framing, and unnecessary referrer disclosure. The policy SHALL allow required local UI behavior, including connections only to the homepage origin, without allowing remote script execution or connections to any other origin. Ask models documentation pages SHALL be served from the same origin under that policy.

#### Scenario: The built homepage is served
- **WHEN** a browser loads the production homepage
- **THEN** security headers are present, connections are allowed only to the homepage origin, and remote scripts remain disallowed

#### Scenario: Ask models docs are served
- **WHEN** a browser loads `/docs/ask-models.md` from the homepage origin
- **THEN** security headers are present and the document is readable without loading remote scripts
