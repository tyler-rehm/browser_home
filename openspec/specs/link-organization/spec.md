# Link Organization Specification

## Purpose

Organize quick-access links into Favorites, All, and user-defined groups, and keep that organization in local storage and backups.

## Requirements

### Requirement: Built-in views
The quick-access section SHALL always offer Favorites and All as the first two views, in that order. Those views SHALL NOT be renamed or deleted. All SHALL list every saved link. Favorites SHALL list only links marked favorite, including links that also belong to a user-defined group.

#### Scenario: A favorite link also belongs to a group
- **WHEN** a link is marked favorite and assigned to a user-defined group
- **THEN** it appears in Favorites, in that group, and in All

#### Scenario: The user tries to remove a built-in view
- **WHEN** the user looks for a way to rename or delete Favorites or All
- **THEN** no such control is available

### Requirement: User-defined groups
The user SHALL be able to create, rename, and delete groups. A group name SHALL be required, trimmed, unique among groups without regard to case, and no longer than 40 characters. The page SHALL hold at most 24 groups. Deleting a group SHALL keep its links and clear their group assignment.

#### Scenario: A group is created and renamed
- **WHEN** the user creates a group named Work and later renames it to Clients
- **THEN** the tab label becomes Clients and links assigned to that group stay assigned

#### Scenario: A group is deleted
- **WHEN** the user deletes a group that has links
- **THEN** those links remain saved, appear in All, and no longer appear under that group

#### Scenario: A duplicate group name is submitted
- **WHEN** the user submits a group name that matches an existing group after trimming and case folding
- **THEN** the group is not created or renamed and the error is announced

### Requirement: Single group membership
A link SHALL belong to at most one user-defined group. Favorite state SHALL be independent of that group. Two saved links MAY use the same URL and different groups. A link with no group SHALL still appear in All and, when favorited, in Favorites.

#### Scenario: The same destination is saved twice
- **WHEN** the user saves two links with the same URL and assigns each to a different group
- **THEN** each link stays in its own group and both appear in All

#### Scenario: A link has no group
- **WHEN** a link is not assigned to a user-defined group
- **THEN** it appears in All and does not appear under any user-defined group

### Requirement: Group assignment from add, edit, and drop
Add and edit SHALL let the user choose no group or one existing group, and SHALL let the user name a new group as part of saving the link. Dragging a link onto a user-defined group tab SHALL assign that group. Dropping a link on Favorites SHALL mark it favorite and SHALL NOT clear its group. Dropping a link on All SHALL clear its group and SHALL NOT change favorite state. Reordering with the grip or arrow keys SHALL keep working and SHALL NOT be the only way to assign a group.

#### Scenario: A new link is saved into a new group
- **WHEN** the user adds a link and enters a new group name
- **THEN** the group exists and the new link is assigned to it

#### Scenario: A link is dropped on a group tab
- **WHEN** the user drags a link onto a user-defined group tab
- **THEN** that link's group becomes the dropped tab and its favorite state stays the same

#### Scenario: A link is dropped on Favorites
- **WHEN** the user drags a link onto Favorites
- **THEN** the link is marked favorite and keeps its current group

#### Scenario: A link is dropped on All
- **WHEN** the user drags a grouped link onto All
- **THEN** the link has no group and its favorite state stays the same

### Requirement: Favorite star
Each link SHALL show a star control that is empty when the link is not a favorite and filled when it is. Activating the star SHALL toggle favorite state without navigating. The control SHALL have an accessible name that includes the link name and the resulting favorite state.

#### Scenario: The user favorites a link from the star
- **WHEN** the user activates the empty star on a link
- **THEN** the star is filled, the link appears in Favorites, and the page does not navigate

#### Scenario: The user clears a favorite
- **WHEN** the user activates the filled star on a favorite link
- **THEN** the star is empty and the link no longer appears in Favorites

### Requirement: Paged link sets
A view that contains more than 8 links SHALL show 8 links per page with a control to move between pages. A view with 8 or fewer links SHALL NOT show those page controls. Changing view or filter SHALL open on the first page. The current page SHALL be announced to assistive technology.

#### Scenario: A group has nine links
- **WHEN** the user opens a view that contains 9 links
- **THEN** the first page shows 8 links and a control reveals the ninth

#### Scenario: A short group has no pager
- **WHEN** the user opens a view that contains 8 or fewer links
- **THEN** every link in that view is shown and no page control is present

### Requirement: Durable organization
Group names, group order, each link's group, and each link's favorite state SHALL persist in browser storage and SHALL round-trip through a new backup. Existing stored links and version 1 backups SHALL remain readable, with missing group and favorite fields treated as no group and not favorite. An unknown group reference SHALL leave the stored record in place, show the link with no group, and SHALL NOT be written back until the user edits. A failed write SHALL NOT be presented as saved.

#### Scenario: The page reloads after a successful save
- **WHEN** the user assigns groups and favorites and reloads after storage accepts the write
- **THEN** the same groups, assignments, and favorite states are shown

#### Scenario: A version 1 backup is imported
- **WHEN** the user imports a valid version 1 backup that has no groups or favorite fields
- **THEN** its links, notes, and appearance are restored and every link has no group and is not favorite

#### Scenario: Storage rejects an organization change
- **WHEN** assigning a group or favorite cannot be written
- **THEN** the page shows the failure and does not claim the change was saved
