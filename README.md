# browser_home

A private start page for Safari on your own Mac. It is served at `http://127.0.0.1:4173` and keeps links, notes, and appearance in that browser origin.

Original code is MIT licensed. See `NOTICE` for fonts and dependencies. Tailwind Plus and Catalyst source is not included and must not be added.

## Use it

Requirements: Node.js 22.13+, 24, or 26+.

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:4173`. Do not switch to `localhost`; the browser treats that as different saved data.

`npm run dev` is the contributor Vite server on the same origin. The installed homepage uses `npm start`.

Safari setup, login startup, backups, and troubleshooting are in `docs/safari-setup.md` and `docs/backups.md`. The short click-path for the remaining Safari and reboot steps is `docs/finish-by-hand.md`.

## Checks

```sh
npm run test:all
```

That command formats, lints, runs unit tests, builds, runs Chromium and WebKit against the production server, and audits tracked files. It does not change Safari or reboot the Mac. Those steps are listed in `docs/release.md` and are still open.

## Layout

- `src/` — page, validation, and the production server
- `scripts/serve.js` — start the built site
- `scripts/home-service.js` — optional macOS login service
- `docs/` — architecture, backups, Safari, maintenance, and release
