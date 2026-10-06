# Proposal

## Why

Quick access is one flat list. As the list grows, favorites, project sets, and everything else compete for the same grid, and there is no way to find a link without scanning it. The page also ends without saying who made it or how to reach them.

## What Changes

- Add two built-in views, Favorites and All, plus user-defined groups. Favorites and All cannot be renamed or deleted. All shows every link. Favorites shows links marked favorite, including those that also belong to a group.
- A link belongs to at most one user-defined group. Favorite is independent, so a link can be in one group and also in Favorites. The same URL may be saved more than once; each copy is its own record and may use a different group.
- Let the user create, rename, and delete groups. Deleting a group keeps its links and clears their group assignment.
- Set a link's group from add, from edit, and by dragging the link onto a group tab. Dropping on Favorites marks it favorite without removing its group. Dropping on All clears its group. The existing grip reorder stays.
- Toggle favorite with a star control: empty when not a favorite, filled when it is.
- When a visible set has more than 8 links, page that set 8 at a time.
- Add a quick-access filter beside Add link. A non-empty query hides the group tabs and shows one Results view of matching links. Clearing the query restores the tabs. The hero field still searches the web.
- Add a footer that credits Tyler Rehm and Ivy League Tech, LLC, links to the MIT license and the GitHub repository, and offers `mailto:tyler@ivyleaguetech.com`.
- Keep existing saved links and version 1 backups readable. New backups include groups and favorite state.

A runtime resource monitor is out of scope. A check on this Mac (up about two hours after restart) showed the homepage server at 0% CPU and about 50 MB, while Spotlight, Cursor, and Safari WebContent accounted for the load. This change must not add polling, background work, or a new icon package.

Deferred, not part of this change: an Ungrouped tab, group colors, dragging tabs to reorder them, number-key tab shortcuts, and a Duplicate button. Saving the same URL again is already enough to put copies in different groups.

## Capabilities

### New Capabilities

- `link-organization`: group and favorite membership, tab views, drag assignment, paging, and durable storage of that organization
- `quick-access-filter`: the quick-access query that narrows links and replaces group tabs with Results
- `site-credits`: the footer credit, license link, repository link, and mailto link

### Modified Capabilities

None. `openspec/specs/` has no synced capabilities yet. In-flight requirements in `harden-public-release` still apply: validated records, honest save state, accessible controls, and no startup requests off the local origin.

## Impact

- Link records, validation, load, and backup/import in `src/records.js`, `src/state.js`, `src/persistence.js`, and `src/backup.js`.
- Quick-access UI in `src/app.jsx`, `src/components/add-link-dialog.jsx`, and `styles.css`. Icons stay inline SVG, matching the controls already on the page.
- Unit tests, Playwright coverage, README, architecture notes, and the backup doc.
- No new runtime dependency, no new server, and no change to the loopback homepage service.
