# browser_home

A start page for Safari on your own Mac. Links, notes, and appearance stay in that browser, for one address. There is no account and no analytics.

The address is pinned in [`src/homepage.config.json`](src/homepage.config.json):

```text
http://home.localhost:4173
```

Original code is MIT licensed. See `NOTICE` for fonts and dependencies. Tailwind Plus and Catalyst source is not included and must not be added.

## Requirements

- macOS, for the Safari homepage and the optional login helper
- Node.js 22.13 or newer, 24, or 26 or newer (23 and 25 are outside the dependency engines)

## Install

```sh
git clone https://github.com/tyler-rehm/browser_home.git
cd browser_home
npm ci
npm run build
```

## Run it once

```sh
npm start
```

Open `http://home.localhost:4173`. `http://home.localhost:4173/health` returns `ok`.

Stop it with Control-C. `npm start` serves the files in `dist/`. After you change the page, run `npm run build` again.

`npm run dev` is the Vite server on `http://127.0.0.1:4173`. That is a different saved-data bucket from the pinned address. Use `npm start`, or the login helper below, for the page Safari should open.

## Start it at login

From the repository, as your own user (not `sudo`):

```sh
npm run build
node scripts/home-service.js install
```

That copies the build into `~/Library/Application Support/browser-home/current` and registers the launch agent `local.browser-home`. Logs go to `~/Library/Logs/browser-home/`. The helper does not open Safari. It only listens so the homepage is there when Safari asks for it.

```sh
node scripts/home-service.js status
node scripts/home-service.js update    # after a new build
node scripts/home-service.js uninstall # removes the helper, not your Safari data
```

`update` replaces the installed copy and restarts the agent. Links, notes, and colors stay in Safari.

## Configuration

`src/homepage.config.json` has one field:

```json
{ "publicHost": "home.localhost" }
```

`publicHost` must be a name ending in `.localhost`, such as `home.localhost` or `desk.localhost`. Those names resolve to this Mac without an `/etc/hosts` entry. The port stays `4173` because port 80 needs root.

To use another name:

1. Edit `publicHost`.
2. `npm run build`
3. `node scripts/home-service.js update` if the login helper is installed, otherwise `npm start`.
4. Point Safari at the new address.

Each hostname is its own saved-data bucket. Links saved on `home.localhost` do not appear on `127.0.0.1` or `localhost`. The server still answers those hosts so tests and old bookmarks load, but the page there starts empty.

The page itself is configured in Safari, not in a config file:

- Quick links: add, edit, remove, archive, and drag. Arrow keys on the grip move a link. Favorites and All are always there. Add your own groups, put a link in one group from the dialog or by dragging it onto a tab, and mark a favorite with the star. All shows every link that is not archived. Archive, beside Add link, lists archived links with the date, Restore, and Delete. A view with more than 8 links is paged. Filter links beside Add link. Each link can keep a color and a circular image. Quick links and tools open in a new tab. Turn that off under Settings. Search still uses this tab.
- Scratchpad: notes save as you type.
- Appearance, the palette icon: themes, colors, and type. Settings, the gear: new-tab behavior, backup import and export, and reset. Backups are JSON on your Mac. See `docs/backups.md`.

## Safari

In Safari → Settings → General:

1. Homepage: `http://home.localhost:4173`
2. New windows open with: Homepage
3. New tabs open with: Homepage

The Homepage field alone still opens Start Page if those two menus say Start Page. The click-path is `docs/finish-by-hand.md`. More detail is in `docs/safari-setup.md`.

## Accessibility

The page is keyboard operable. On load, focus is in the search field, and Tab moves on from there. A skip link is the first control in the page. Dialogs trap focus, name themselves, and restore focus on Escape. Form errors are announced and tied to the fields. Reordering with the arrow keys is announced. Text can grow without trapping the scratchpad or tool list. `prefers-reduced-motion` turns off movement. Icon letters use a contrasting color on the chosen fill.

## Checks

```sh
npm run test:all
```

That formats, lints, runs unit tests, builds, runs Chromium and WebKit against the production server, and audits tracked files. It does not change Safari or reboot the Mac. What was checked on a real Mac is listed in `docs/release.md`.

## Layout

- `src/` — page, validation, the production server, and `homepage.config.json`
- `scripts/serve.js` — start the built site
- `scripts/home-service.js` — optional macOS login service
- `docs/` — architecture, backups, Safari, maintenance, release, and how the repo runs (`docs/operating.md`)
