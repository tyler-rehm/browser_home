# Contributing

## Setup

Supported Node versions are 22.13 or newer, 24, and 26 or newer. Node 23 and 25 are outside the installed tool engines. This Mac can use the system Node when it is in that set.

```sh
git clone git@github.com:tyler-rehm/browser_home.git
cd browser_home
npm ci
npm run dev
```

Development serves `http://127.0.0.1:4173` through Vite. The daily homepage is the production build:

```sh
npm run build
npm start
```

`npm run test:all` runs formatting, lint, unit tests, the production build, Chromium and WebKit against that build, and the publication audit.

## Changes

Keep a change scoped. Add a unit test for validation, storage, or server behavior, and a Playwright test for a user-visible regression. Do not commit secrets, personal exports, `home-preferences.json`, or generated `dist/` and test output.

Do not add Tailwind Plus or Catalyst source. New UI uses the local components and Headless UI.

## Review

Pull requests run the CI workflow on Node 22, 24, and 26. Dependency updates and lockfile changes go through the same checks plus dependency review. See `docs/maintenance.md` for how to read those findings.

Repository ownership is the GitHub owner listed in `.github/CODEOWNERS`.
