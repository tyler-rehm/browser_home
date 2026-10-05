# Release checklist

Local implementation can be complete while these gates stay open.

## Manual

- [ ] Shipping Safari on the supported macOS version opens `http://127.0.0.1:4173` as the homepage.
- [ ] New windows and new tabs use that homepage.
- [ ] Saved links, notes, and appearance survive a browser restart.
- [ ] Keyboard use, zoom, and the dialogs work in shipping Safari.
- [ ] Login startup comes back after reboot, restarts after a crash, updates with `update`, and uninstalls without clearing browser data.

WebKit in Playwright is not that check.

## GitHub

- [x] Protected `main` and required checks are configured. Verified 2026-10-05: strict checks `test (22)`, `test (24)`, `test (26)`, and `analyze`, each bound to GitHub Actions. Pull requests need one code-owner approval. Force-push and branch deletion are off. Admin enforcement is off so the owner is not locked out of a one-person repo.
- [x] Secret scanning, dependency alerts, and private vulnerability reporting are enabled. Verified 2026-10-05: secret scanning and push protection enabled, vulnerability alerts return 204, Dependabot security updates enabled, private vulnerability reporting `enabled: true`. Hosted CI run 37384395895 and CodeQL `analyze` both succeeded.
- [ ] The public history has been reviewed for proprietary source, personal exports, and secrets.
- [ ] The license, notices, and this checklist match the build that is being published.

Do not archive the OpenSpec change until those gates are done. Do not push as part of a local implementation session unless publication was explicitly requested.
