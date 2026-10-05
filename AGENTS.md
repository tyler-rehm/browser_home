# Agent guide

## Project

Code Home is a local-first Safari homepage. React and Vite build a static page. A small Node server serves that build on `http://127.0.0.1:4173`. Browser storage stays in Safari. There is no backend, account, or analytics.

## Boundaries

- Do not copy Tailwind Plus or Catalyst source into this repository. Dialogs use Headless UI and local components.
- Do not commit secrets, `.env` files, `home-preferences.json`, backup exports, `dist/`, or test output.
- Do not add a remote, push, change Safari settings, or install the login service unless the task explicitly asks.
- Treat imported JSON and typed URLs as untrusted. Keep the validators in `src/records.js`.
- Production serving belongs in `src/server.js`. Do not point tests at the Vite dev server.

## Change workflow

Active work is specified under `openspec/changes/`. Implement the requested tasks, add focused tests, and leave manual Safari and GitHub release gates unchecked until they are actually done.

## Checks

Before handing off behavior changes, run `npm run test:all`. Report the commands that passed and any checks that were not run. A green local run is not a shipping Safari or reboot test.

## Storage

Keys are `code-home-links`, `code-home-notes`, and `code-home-preferences`. Invalid stored data stays in place until the user edits, imports, or confirms a reset. Do not show a saved state after a failed write.
