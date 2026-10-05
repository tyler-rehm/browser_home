# Maintenance

## Quality gate

`npm run test:all` is the local gate: Prettier, ESLint, Vitest, Vite build, Playwright on Chromium and WebKit against `npm start`, and `scripts/audit-publication.js`.

CI repeats that gate on Node 22, 24, and 26. Failed browser runs upload the Playwright report. Pull requests also run dependency review. CodeQL and Dependabot stay enabled. `npm audit --audit-level=high` runs in CI.

## Dependency and action updates

Dependabot opens npm and GitHub Actions updates. Review the lockfile diff, the action changelog, and the CI result. Pinned actions use a full commit SHA with a version comment. A green dependency update is still reviewed before merge. Findings are not a security guarantee.

## Publication audit

`npm run audit` checks tracked and staged paths for personal exports, private keys, common token shapes, and premium-source markers. `npm run audit -- --history` also checks historical path names. The script prints its limitations. It does not prove a repository is clean. Before the first public source push, also run:

```sh
git log --all --full-history -- home-preferences.json src/components
```

## Release

See `docs/release.md` and `docs/operating.md`. Branch protection and the hosted checks are already on. Real Safari login and reboot stay open until a person does them.
