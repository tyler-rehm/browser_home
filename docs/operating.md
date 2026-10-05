# How this repo runs

`main` is protected. Day-to-day work happens on a branch and a pull request.

## Make a change

```sh
git checkout main
git pull
git checkout -b your-branch
```

Run `npm run test:all` before you open the pull request. That is format, lint, unit tests, the production build, Chromium and WebKit, and the publication audit. It does not change Safari and it does not reboot the Mac.

Push the branch and open a pull request. The pull request template is the checklist. Use a bug or feature issue when there is one to link.

## What GitHub requires

A pull request into `main` waits on four checks:

- `test (22)`, `test (24)`, and `test (26)` — the same gate as `npm run test:all`
- `analyze` — CodeQL

The branch must be up to date with `main`. Force-push and deleting `main` are off. `.github/CODEOWNERS` names `@tyler-rehm` for the whole tree, and the pull request needs one code-owner approval.

You are that owner. GitHub will not let you approve your own pull request. Admin enforcement is off, so you can still merge your own pull request from the GitHub page, or push the branch to `main`. GitHub records that as a bypass. Use the bypass for your own work. Leave it off for anyone else: they need the checks and your review.

## Issues

- A bug uses the bug report.
- A feature uses the feature request.
- A vulnerability goes to a private advisory: https://github.com/tyler-rehm/browser_home/security/advisories/new. Do not file that as a public issue.

## Dependency updates

Dependabot opens a weekly pull request for npm and one for GitHub Actions. Treat them like any other pull request: read the lockfile or action diff, wait for the four checks, then merge. A green check is not a security guarantee.

## What stays manual

Shipping Safari, the homepage setting, login startup, and a reboot are `docs/finish-by-hand.md`. Do not mark those done from a Playwright run.
