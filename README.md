# browser_home

A start page for Safari on your own Mac. Links, notes, and appearance stay in that browser, for one address. There is no account and no analytics.

The address is pinned in [`src/homepage.config.json`](src/homepage.config.json):

```text
http://home.localhost:4173
```

`home.localhost` is this Mac. The server listens only on loopback, on port 4173, including IPv6 `::1`. Change `publicHost` in that file when you want a different name. It has to end in `.localhost`, then rebuild and run `node scripts/home-service.js update`. Set Safari’s homepage to the new address. Names are separate saved-data buckets, so `127.0.0.1` and `localhost` will not show the links you saved on `home.localhost`.

Original code is MIT licensed. See `NOTICE` for fonts and dependencies. Tailwind Plus and Catalyst source is not included and must not be added.

## Requirements

Node.js 22.13 or newer, 24, or 26 or newer.

## Start

```sh
npm ci
npm run build
npm start
```

Open `http://home.localhost:4173`. `http://home.localhost:4173/health` returns `ok`.

`npm run dev` is the Vite server on `http://127.0.0.1:4173`. That is a different saved-data bucket from the pinned address. The installed homepage uses `npm start`.

## Safari

Set the homepage, new windows, and new tabs to the pinned address. Login startup is optional and does not open Safari by itself. The steps are in `docs/safari-setup.md`. The short click-path is `docs/finish-by-hand.md`.

## Checks

```sh
npm run test:all
```

That formats, lints, runs unit tests, builds, runs Chromium and WebKit against the production server, and audits tracked files. It does not change Safari or reboot the Mac. Shipping Safari and a reboot are still listed in `docs/release.md`.

## Layout

- `src/` — page, validation, the production server, and `homepage.config.json`
- `scripts/serve.js` — start the built site
- `scripts/home-service.js` — optional macOS login service
- `docs/` — architecture, backups, Safari, maintenance, release, and how the repo runs (`docs/operating.md`)
