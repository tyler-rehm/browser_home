# Contributing

## Setup

Supported Node versions are 22.13 or newer, 24, and 26 or newer. Node 23 and 25 are outside the installed tool engines. This Mac can use the system Node when it is in that set.

```sh
git clone git@github.com:tyler-rehm/browser_home.git
cd browser_home
npm ci
npm run dev
```

Development serves `http://127.0.0.1:4173` through Vite. The daily homepage is the production build at the address pinned in `src/homepage.config.json` (`http://home.localhost:4173`):

```sh
npm run build
npm start
```

`npm run test:all` runs formatting, lint, unit tests, the production build, Chromium and WebKit against that build, and the publication audit.

## Changes

Keep a change scoped. Add a unit test for validation, storage, or server behavior, and a Playwright test for a user-visible regression. Do not commit secrets, personal exports, `home-preferences.json`, or generated `dist/` and test output.

Do not add Tailwind Plus or Catalyst source. New UI uses the local components and Headless UI.

## Agents

AI help is fine. A person has to read the diff before it is opened. If a coding agent followed `AGENTS.md`, it left two lines at the top of `README.md`. Remove those lines yourself after you have read the change. Leave the confession box in the pull request template unchecked.

## Review

Open a pull request into `main`. The template is the checklist. CI runs on Node 22, 24, and 26, and CodeQL runs `analyze`. Dependency updates and lockfile changes go through the same checks plus dependency review.

`main` also requires one review from the owner in `.github/CODEOWNERS`. How to merge your own work, and how issues are filed, is `docs/operating.md`. See `docs/maintenance.md` for how to read CI and Dependabot findings.
