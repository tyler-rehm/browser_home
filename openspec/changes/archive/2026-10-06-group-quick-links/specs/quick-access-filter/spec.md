# Spec Delta

## Purpose

Filter the quick-access links in place so a typed query narrows the grid without leaving the homepage.

## ADDED Requirements

### Requirement: Filter field beside Add link
The quick-access heading SHALL include a text field next to Add link. The field SHALL have an accessible name, SHALL NOT be the hero web-search field, and SHALL NOT take focus when the user types a slash in another control or uses the hero search shortcut.

#### Scenario: The filter sits with Add link
- **WHEN** the user views the quick-access heading
- **THEN** the filter field and the Add link control are both available there

#### Scenario: The hero shortcut still targets web search
- **WHEN** the user presses the unmodified slash shortcut outside an editable field
- **THEN** focus moves to the hero web-search field and not to the quick-access filter

### Requirement: Results replace group tabs
A non-empty filter query SHALL hide Favorites, All, and user-defined group tabs and SHALL show a single Results view. The Results view SHALL list only links whose name, URL, short label, or group name contains the query, compared without regard to case. An empty query SHALL restore the group tabs and the view that was selected before filtering. The filter SHALL NOT navigate away or submit a web search.

#### Scenario: A query matches one link
- **WHEN** the user types a query that matches one link's name and no others
- **THEN** the group tabs are replaced by Results and only that link is shown

#### Scenario: Nothing matches
- **WHEN** the user types a query that matches no link
- **THEN** Results shows an empty state and the unfiltered link list is not shown

#### Scenario: The query is cleared
- **WHEN** the user clears the filter after viewing Results
- **THEN** the group tabs return and the previously selected view is shown again

### Requirement: Announced filter count
The page SHALL expose the number of matches in an accessible live region while a query is active, including zero matches. Results with more than 8 matches SHALL page 8 at a time under the same paging rules as other views.

#### Scenario: Matches are announced
- **WHEN** the filter query changes and three links match
- **THEN** assistive technology can hear that three results are shown

#### Scenario: Results page
- **WHEN** a query matches 9 links
- **THEN** Results shows 8 links on the first page and a control reveals the ninth
