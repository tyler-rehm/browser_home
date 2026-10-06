# browser-data-management Specification

## Purpose
Keep personal links, notes, and appearance settings usable and recoverable in local browser storage, even when stored or imported data is invalid or persistence fails.

## Requirements

### Requirement: Validated local records
The application SHALL validate persisted links and preferences before use. Links SHALL have bounded names and HTTP or HTTPS URLs; colors SHALL have a supported format and fonts SHALL come from a supported set. Invalid records SHALL not crash rendering or introduce executable URL protocols. Recovery SHALL not silently overwrite rejected user data.

#### Scenario: Stored links contain invalid data
- **WHEN** stored links are not an array or contain malformed records or unsafe protocols
- **THEN** the homepage remains usable, unsafe records are not rendered, and the user receives a recovery indication

#### Scenario: Stored preferences contain invalid field types
- **WHEN** a stored color is null or a font is not supported
- **THEN** validated fallback values are used without a render exception

### Requirement: Honest persistence state
The application SHALL handle storage access, quota, and write failures without crashing. It SHALL indicate when data is not durably saved and allow export of the current in-memory data. It SHALL never display a successful-save state after a failed write.

#### Scenario: Browser storage rejects a write
- **WHEN** a link, note, or preference update cannot be written
- **THEN** the application retains the current in-memory value and shows an actionable failure state

### Requirement: Scratchpad durability
Scratchpad edits SHALL persist before same-page application navigation can discard them. The application SHALL handle page lifecycle changes without relying solely on a delayed save. Existing notes SHALL remain available after a successful save and reload.

#### Scenario: A user types and immediately follows a link
- **WHEN** the user edits a note and immediately navigates through the homepage
- **THEN** the most recent edit is persisted or a save failure is explicitly reported

### Requirement: Versioned and bounded imports
The application SHALL support versioned backups and recognized legacy appearance files. It SHALL reject malformed JSON, oversized files, unsupported versions, unknown fields, and invalid values before changing active state. Imports SHALL be atomic with respect to validation.

#### Scenario: A recognized legacy appearance export is imported
- **WHEN** the user imports a valid legacy appearance object
- **THEN** supported appearance values are migrated without replacing links or notes

#### Scenario: A backup fails validation
- **WHEN** an imported backup contains an unsupported version or an invalid field
- **THEN** existing links, notes, and preferences remain unchanged and the error is explained

### Requirement: Portable backup and deliberate reset
The application SHALL allow the user to export and restore links, notes, and preferences without transmitting them. Destructive reset SHALL require confirmation and affect only the application's own storage keys.

#### Scenario: The user exports and restores a backup
- **WHEN** a valid backup is exported and then restored into cleared application state
- **THEN** the links, notes, and preferences match the exported state

#### Scenario: Reset is cancelled
- **WHEN** the user cancels reset confirmation
- **THEN** no application or unrelated browser data is removed
