# Accessible Homepage

## Purpose

Make everyday homepage actions safe and usable with a keyboard, pointer, or touch, across supported Safari viewports and enlarged text settings.

## ADDED Requirements

### Requirement: Accessible link controls
Every link SHALL expose distinct navigation and removal controls without nested interactive elements. Removal SHALL be discoverable and operable with keyboard and touch, without requiring hover. Controls SHALL have descriptive accessible names and visible focus.

#### Scenario: A keyboard user removes a link
- **WHEN** the user tabs to a link's removal control and activates it
- **THEN** the link is removed without navigating to its destination

### Requirement: Predictable dialogs
Dialogs SHALL have accessible names, visible content, contained focus, Escape dismissal, backdrop dismissal, and focus restoration to their triggering control. Form errors SHALL be announced and SHALL not discard valid field input.

#### Scenario: The add-link dialog is dismissed
- **WHEN** the user opens the dialog and dismisses it using Escape or the backdrop
- **THEN** the dialog closes and focus returns to the add-link control

#### Scenario: An unsafe URL is entered
- **WHEN** the user submits a link with an unsupported protocol
- **THEN** the dialog remains open with an accessible error and unchanged field values

### Requirement: Safe and predictable search
Search SHALL encode textual queries and validate URL destinations. Empty input SHALL not navigate, and malformed destinations SHALL produce an accessible error instead of an uncaught exception. The search focus shortcut SHALL not interrupt editing or modified keyboard commands.

#### Scenario: A malformed URL is submitted
- **WHEN** search input is interpreted as a URL but cannot be safely normalized
- **THEN** the page stays open and reports the problem

#### Scenario: The user edits a note
- **WHEN** the user types a slash in an editable field or uses a modified slash shortcut
- **THEN** focus is not stolen by the search box

### Requirement: Responsive and growing content
The homepage SHALL preserve access to all links and tools as content grows, at narrow widths, short heights, and browser zoom. It SHALL not force content off-screen to satisfy an above-the-fold target. Long labels SHALL not cause horizontal overflow or obscure controls.

#### Scenario: The user adds many links
- **WHEN** link content exceeds the available desktop height
- **THEN** scrolling exposes every link and the scratchpad

#### Scenario: The user enlarges the page
- **WHEN** the user views the homepage at a narrow viewport or 200 percent zoom
- **THEN** primary controls remain reachable without overlapping content or horizontal page overflow

### Requirement: Accessible appearance and motion
Built-in themes SHALL provide readable text and focus indicators. The application SHALL respect reduced-motion preferences and SHALL not depend on animation to expose controls or state.

#### Scenario: Reduced motion is enabled
- **WHEN** the user opens and closes dialogs with reduced motion enabled
- **THEN** interactions remain functional without unnecessary movement