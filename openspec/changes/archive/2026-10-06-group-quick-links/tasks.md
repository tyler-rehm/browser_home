# Tasks

## 1. Records, storage, and backups

- [x] 1.1 Extend link validation for optional `id`, `groupId`, and `favorite`, and add group-list validation (trimmed unique names, 40 characters, 24 groups) in `src/records.js`. Verify `tests/unit/records.test.js` accepts legacy links, rejects a non-boolean favorite, a duplicate group name, and a 25th group.
- [x] 1.2 Load `code-home-groups` in `src/state.js`, add it to `APP_KEYS`, and leave a dangling `groupId` on disk while showing that link with no group. Verify `tests/unit/state.test.js` covers a legacy links array, a missing groups key, a dangling `groupId` that is not rewritten, and reset removing the groups key.
- [x] 1.3 Write backup version 2 from `src/backup.js` and still accept version 1. Reject a version 2 file whose `groupId` is not in `groups`. Verify `tests/unit/backup.test.js` for a version 1 import, a version 2 round-trip, and that rejected file.
- [x] 1.4 Document version 2, `code-home-groups`, and reset of four storage keys in `docs/backups.md` and `docs/architecture.md`. Verify those docs name version 2 and `code-home-groups`, and that unknown group ids are not written back on load.

## 2. Group tabs, star, dialog, and paging

- [x] 2.1 Add a tab list whose first tabs are Favorites and All, a star button with `aria-pressed`, and paging at 8 links in the quick-access UI. Use inline SVG only. Verify `tests/unit/app.test.jsx` shows a favorited grouped link in Favorites, that group, and All; toggles the star without navigating; and shows a pager only when a view has more than 8 links.
- [x] 2.2 Let add and edit choose no group, an existing group, or a new group name, and let the user create, rename, and delete groups. Delete confirms, keeps the links, and clears their group. Verify `tests/unit/app.test.jsx` for create, rename, duplicate-name error, and delete.
- [x] 2.3 Assign a link by dropping it on a user group, on Favorites, or on All, using the link id as the drag payload. Keep grip and arrow reorder inside the visible page. Verify `tests/unit/app.test.jsx` for those three drops and that reorder still announces the move.
- [x] 2.4 Update the README quick-access paragraph for groups, the star, and paging. Verify the README names Favorites, All, and the star control.

## 3. Quick-access filter

- [x] 3.1 Add a pure matcher and a labeled filter beside Add link. A non-empty query replaces the tabs with Results and announces the count, including zero. Clearing it restores the previous tab. Leave the hero search and the slash shortcut on the hero field. Verify a unit test for case-insensitive name, URL, short label, and group name matches, and a component test that the slash shortcut still focuses the hero field.

## 4. Footer credits

- [x] 4.1 Add a footer landmark after main that credits Tyler Rehm and Ivy League Tech, LLC and links to the MIT license, `https://github.com/tyler-rehm/browser_home`, and `mailto:tyler@ivyleaguetech.com`. Verify `tests/unit/app.test.jsx` for those three destinations and that the footer links use the existing visible focus style.

## 5. Integration

- [x] 5.1 Add a Playwright test that creates a group, marks a link favorite, filters the grid, and checks the footer links. Verify `tests/e2e/home.spec.js` passes with `npm run test:e2e`.
- [x] 5.2 Run `npm run test:all` and verify format, lint, unit tests, build, end-to-end tests, and the publication audit pass.
