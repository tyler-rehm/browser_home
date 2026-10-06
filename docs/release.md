# Release checklist

Local implementation can be complete while these gates stay open.

## Manual

- [x] Shipping Safari on the supported macOS version opens `http://home.localhost:4173` as the homepage. Confirmed 2026-10-05.
- [x] New windows use that homepage. Confirmed 2026-10-05 with Command-N.
- [x] New tabs use that homepage. Confirmed 2026-10-05 with Command-T.
- [x] Saved links, notes, and appearance survive a browser restart. Confirmed 2026-10-05: scratchpad note was still there.
- [ ] Keyboard use, zoom, and the dialogs work in shipping Safari.
- [x] Login startup comes back after reboot. Confirmed 2026-10-05: Safari opened the homepage after a restart.
- [x] The service restarts after a crash. Confirmed 2026-10-05: the process was stopped and launchd had it listening again within 2 seconds. `/health` returned `ok`.
- [x] `update` replaces the installed copy. Confirmed 2026-10-05 while shipping link reorder and icons.
- [ ] Uninstall has not been run. It would remove the login helper that is in daily use.

WebKit in Playwright is not that check.

## GitHub

- [x] Protected `main` and required checks are configured. Verified 2026-10-05: strict checks `test (22)`, `test (24)`, `test (26)`, and `analyze`, each bound to GitHub Actions. Pull requests need one code-owner approval. Force-push and branch deletion are off. Admin enforcement is off so the owner is not locked out of a one-person repo.
- [x] Secret scanning, dependency alerts, and private vulnerability reporting are enabled. Verified 2026-10-05: secret scanning and push protection enabled, vulnerability alerts return 204, Dependabot security updates enabled, private vulnerability reporting `enabled: true`. Hosted CI run 37384395895 and CodeQL `analyze` both succeeded.
- [x] The public history has been reviewed for proprietary source, personal exports, and secrets. 2026-10-05: `npm run audit` and `node scripts/audit-publication.js --history` passed. `git log --all --full-history -- home-preferences.json src/components` shows no personal export. The only component paths are the local dialog, button, and link files. The scanner does not prove a repository is clean.
- [x] The license, notices, and this checklist match the build that is being published. MIT, copyright 2026 Tyler Rehm. Fonts are SIL OFL via Fontsource. Tailwind Plus and Catalyst source are not included.

Do not archive the OpenSpec change until those gates are done. Do not push as part of a local implementation session unless publication was explicitly requested.
