# Spec Delta

## MODIFIED Requirements

### Requirement: Production loopback serving
The application SHALL serve built public assets on a loopback address. It SHALL accept only documented local hosts. It SHALL serve GET and HEAD for those assets, GET for the model-provider list, and POST for a model ask. It SHALL reject every other method. It SHALL reject source-file access, path traversal, directory listings, and files escaping the asset root, including symbolic links.

#### Scenario: A local browser opens the homepage
- **WHEN** a user requests the documented homepage origin after building the application
- **THEN** the server returns the built homepage and its assets without requiring a development server

#### Scenario: A request crosses the server boundary
- **WHEN** a request uses an unexpected Host header, a method outside the set above, encoded traversal, or an asset resolving outside the public root
- **THEN** the server rejects it without exposing private paths or file contents

#### Scenario: A model route uses the documented host
- **WHEN** a documented local host requests the provider list with GET or a model ask with POST
- **THEN** the server accepts that route and still rejects POST for a static asset path

### Requirement: Offline startup privacy
Rendering the homepage SHALL make no unsolicited requests to external origins. All required startup assets SHALL be available locally. User-initiated search, link navigation, and model asks SHALL remain explicit external actions. Opening the homepage or Ask models SHALL NOT call a model provider.

#### Scenario: Network access is unavailable
- **WHEN** Safari opens the homepage with external network access unavailable
- **THEN** the homepage, dialogs, saved links, preferences, and scratchpad remain usable

#### Scenario: The dialog opens with no ask
- **WHEN** the user opens the homepage or Ask models and does not ask
- **THEN** no model provider is contacted

#### Scenario: The user asks selected providers
- **WHEN** the user asks with a subset of providers selected
- **THEN** only those providers are contacted, and only because of that action

### Requirement: Browser security headers
Production responses SHALL include a documented content security policy and headers preventing MIME sniffing, framing, and unnecessary referrer disclosure. The policy SHALL allow required local UI behavior, including connections only to the homepage origin, without allowing remote script execution or connections to any other origin.

#### Scenario: The built homepage is served
- **WHEN** a browser loads the production homepage
- **THEN** security headers are present, connections are allowed only to the homepage origin, and remote scripts remain disallowed
