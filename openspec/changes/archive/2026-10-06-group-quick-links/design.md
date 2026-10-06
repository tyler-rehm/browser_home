# Design

## Context

Quick links are a JSON array under `code-home-links`. Each record is `name`, `url`, `short`, and optional `color` and `icon`. `validateLink` drops unknown fields on read and rejects them on strict import. Backups are version 1 with `links`, `notes`, and `preferences`. The grid in `src/app.jsx` reorders by array index. Icons on the page are inline SVG. There is no footer. See proposal.md for why the views, filter, and credits are in scope.

`openspec/specs/` is empty. Behavior already required by the in-flight `harden-public-release` change still holds: do not overwrite malformed storage, do not claim a failed write succeeded, and do not add off-origin startup requests.

## Goals / Non-Goals

**Goals:**

- Keep the links array as the stored link document so a previous build can still read it.
- Put group order in its own storage value so an empty group survives and a rename does not rewrite every link.
- Make membership, filtering, and paging pure functions with unit tests.
- Keep group assignment available from the link dialog, not only from drag and drop.
- Add no runtime dependency and no timer beyond the existing 30-second clock.

**Non-Goals:**

- A resource monitor, telemetry, or server change. The homepage process was idle at about 50 MB; Spotlight, Cursor, and Safari WebContent were the load.
- Persisting the selected tab, the filter text, or the page index.
- A Font Awesome or icon-package dependency.
- An Ungrouped tab, group colors, or a Duplicate action.

## Decisions

### 1. Links stay an array; groups get a new key

`code-home-links` remains an array. Optional link fields are `id`, `groupId`, and `favorite`. `code-home-groups` stores an ordered array of `{ id, name }`. `APP_KEYS` includes the new key so reset removes it.

An `id` is required in memory. Records loaded without one get an id for that session and persist it on the next successful write. React keys and drag payloads use `id`, not `` `${url}-${name}` ``, so two copies of the same URL can both render.

Alternative: one envelope object `{ groups, links }` under the links key. Rejected. A previous build treats a non-array as unreadable and hides the list. Extra fields on array items are ignored until an edit, which is a safer rollback.

Alternative: store the group name on each link and derive tabs. Rejected. Empty groups would disappear, and a rename would rewrite every member.

### 2. Backup version 2, version 1 still imports

New exports use version 2 and add `groups` plus optional `id`, `groupId`, and `favorite` on links. Version 1 files import as they do now: no groups, `favorite` false, ids assigned in memory. A version 2 file with a `groupId` that is not in `groups` is rejected, so import stays atomic. A stored link whose `groupId` is missing from `code-home-groups` is shown with no group and is not rewritten until the user edits.

Limits live next to the existing ones in `LIMITS`: group name 40, group count 24, page size 8. Group names compare case-insensitively after trim. `favorite` must be a boolean when present. `groupId` must be a string when present.

### 3. Views are derived, not stored

Tab order is Favorites, All, then `code-home-groups`. Favorites is `favorite === true`. All is the full array. A user tab is `groupId` match. The selected tab and page index live in component state. Clearing the filter restores the selected tab. Changing tab or query sets the page to 1.

The visible page is a slice of the current view. Grip and arrow reorder swap those links inside the full array and do not cross pages. Dropping on a tab updates `groupId` or `favorite` by link id.

### 4. Dialog and tab controls share one group editor

The link dialog gains a group choice: no group, an existing group, or a new name. A non-empty new name creates the group and assigns it; the existing-group choice is ignored in that case. A duplicate or over-long name keeps the dialog open.

User-group tabs are the rename and delete surface, shown only while that tab is selected. Favorites and All have no rename or delete. New group, without a link, is a text control beside the tabs. Delete asks for confirmation, then removes the group and clears matching `groupId` values. Both storage writes go through the existing failure banner. If the group write succeeds and the link write fails, the dangling `groupId` displays as no group, which matches the stored-data rule.

### 5. Filter is local and separate from hero search

A labeled field in the quick-access heading filters in memory. Match is a case-insensitive substring of name, URL, short label, or group name. Non-empty query replaces the tab list with one Results tab. The hero form and the `/` shortcut are unchanged. A polite live region announces the match count, including zero.

### 6. Star and footer use the current SVG and link patterns

The star is a `type="button"` with `aria-pressed`. The SVG is `aria-hidden`. Empty is a stroke outline; filled is a solid star. Color is the ink token so contrast does not depend on the accent. Hit area stays at least the size of the existing icon buttons.

The footer is a `contentinfo` landmark after `main`. Site links are `https://tylerrehm.com` (TylerRehm.com) and `https://ivyleaguetech.com` (IvyLeagueTech.com), placed with the credit and ahead of the license. License href is `https://github.com/tyler-rehm/browser_home/blob/main/LICENSE`. Repository href is `https://github.com/tyler-rehm/browser_home`. Email href is `mailto:tyler@ivyleaguetech.com`. No `javascript:` URLs.

### 7. Tests and docs cover the contract, not a new harness

Unit tests cover validation, version 1 and 2 backups, filter matching, and page slices. Component tests cover tabs, star, drop assignment, filter, pager, footer, and a failed write. One Playwright path creates a group, favorites a link, filters, and checks the footer links. No axe package. Queries use roles and accessible names.

Update README quick-access copy, `docs/backups.md` (version 2 and four storage keys), and `docs/architecture.md` (groups key, no write-back of unknown group ids).

## Risks / Trade-offs

- [Two keys can diverge if the second write fails] → Show the existing storage error. A dangling `groupId` renders as no group and is left on disk until an edit.
- [A previous build drops `groupId` and `favorite` on the next link edit] → Document that rollback is safe to open, and organization survives until that edit. Do not change the array shape.
- [Drag indexes break once the grid is paged or filtered] → Drag payload is the link id. Reorder resolves ids in the full array.
- [Tab arrow keys could fight the grip arrows] → Only the tab list handles arrows for view changes. The grip keeps its own handler.
- [More DOM or a new dependency would work against the idle-server finding] → Page size 8, filter runs on at most 48 links, no new packages, no new intervals.
- [Footer links leave the homepage] → Same as the existing tool links. Mail uses `mailto` so it opens a mail client instead of a webmail page.

## Migration Plan

1. Read a legacy links array and a missing groups key as no groups and no favorites.
2. Write groups only when the user creates, renames, or deletes one. Write link fields when the user adds, edits, favorites, assigns, reorders, or imports.
3. Export version 2 from in-memory state. Keep accepting version 1 and legacy appearance files.
4. Ship docs in the same change. No service install, Safari setting, or rebuild of the login agent is required for the data model. A running installed copy keeps serving the old `dist/` until the user rebuilds and runs `home-service.js update`.
5. Rollback is the previous build. It ignores the groups key and unknown link fields until the user edits links.

## Open Questions

None. Selected tab, filter text, and page index stay in memory for the session.
