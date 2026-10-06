# Local Homepage Serving

## Purpose

Provide a reliable, offline-capable homepage served on the user's own Mac at a stable loopback origin, without exposing application files to other machines.

## ADDED Requirements

### Requirement: Production loopback serving
The application SHALL serve only built public assets on a loopback address. It SHALL accept only documented local hosts, serve GET and HEAD requests, and reject source-file access, path traversal, directory listings, and files escaping the asset root, including symbolic links.

#### Scenario: A local browser opens the homepage
- **WHEN** a user requests the documented homepage origin after building the application
- **THEN** the server returns the built homepage and its assets without requiring a development server

#### Scenario: A request crosses the server boundary
- **WHEN** a request uses an unexpected Host header, unsupported method, encoded traversal, or an asset resolving outside the public root
- **THEN** the server rejects it without exposing private paths or file contents

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
Rendering the homepage SHALL make no unsolicited requests to external origins. All required startup assets SHALL be available locally. User-initiated search and link navigation SHALL remain explicit external actions.

#### Scenario: Network access is unavailable
- **WHEN** Safari opens the homepage with external network access unavailable
- **THEN** the homepage, dialogs, saved links, preferences, and scratchpad remain usable

### Requirement: Browser security headers
Production responses SHALL include a documented content security policy and headers preventing MIME sniffing, framing, and unnecessary referrer disclosure. The policy SHALL allow required local UI behavior without allowing remote script execution or data transmission.

#### Scenario: The built homepage is served
- **WHEN** a browser loads the production homepage
- **THEN** security headers are present and supported interactions work without security-policy violations