# Release checklist

These gates were checked on the dates written beside them.

## Manual

- [x] Shipping Safari on the supported macOS version opens `http://home.localhost:4173` as the homepage. Confirmed 2026-10-05.
- [x] New windows use that homepage. Confirmed 2026-10-05 with Command-N.
- [x] New tabs use that homepage. Confirmed 2026-10-05 with Command-T.
- [x] Saved links, notes, and appearance survive a browser restart. Confirmed 2026-10-05: scratchpad note was still there.
- [x] Keyboard use, zoom, and the dialogs work in shipping Safari. On 2026-10-05 the Code Home window was zoomed one step and returned with Command-0. View → Actual Size was disabled afterward, so that window was back at actual size. On 2026-10-06 the same window was frontmost and still titled Code Home. The search field had focus on load. One Tab moved focus to Filter links. The first control in the page accessibility tree is the skip link, Skip to content. Settings opened its dialog, including Done and Open links in a new tab, and Done closed it. Zoom was not changed in that pass.
- [x] Login startup comes back after reboot. Confirmed 2026-10-05: Safari opened the homepage after a restart.
- [x] The service restarts after a crash. Confirmed 2026-10-05: the process was stopped and launchd had it listening again within 2 seconds. `/health` returned `ok`.
- [x] `update` replaces the installed copy. Confirmed 2026-10-05 while shipping link reorder and icons.
- [x] Uninstall removes the login helper and leaves browser data alone. Confirmed 2026-10-05: the launch agent and `~/Library/Application Support/browser-home` were removed, port 4173 stopped answering, and the helper was installed again. `/health` returned `ok` on `127.0.0.1` and `home.localhost`. The uninstall command does not touch Safari storage.

WebKit in Playwright is not that check.

## Ask models (Safari)

Playwright Chromium/WebKit is not shipping Safari. Leave these unchecked until a human runs them on the installed login service.

- [x] After `npm run build`, run the documented service update (`node scripts/home-service.js update` or equivalent). Confirm Safari at `http://home.localhost:4173` shows **ASK MODELS** and `/docs/ask-models.md` loads with refresh anchors. Confirmed 2026-10-09.
- [x] In shipping Safari: Settings → Model accounts lists Claude, ChatGPT, Gemini, Grok, and Perplexity without showing API keys. Configured vs not-configured state is honest. Confirmed 2026-10-09.
- [x] Open Ask models, select at least one configured provider (or confirm none are selectable when none are configured), and complete one ask or see an honest error. Copy remains available after a settled result when applicable. Confirmed 2026-10-09.
- [x] Balance, Console, and Refresh on Model accounts open the vendor billing URL, vendor console URL, and homepage refresh-steps doc respectively. Confirmed 2026-10-09.

## GitHub

- [x] Protected `main` and required checks are configured. Verified 2026-10-05: strict checks `test (22)`, `test (24)`, `test (26)`, and `analyze`, each bound to GitHub Actions. Pull requests need one code-owner approval. Force-push and branch deletion are off. Admin enforcement is off so the owner is not locked out of a one-person repo.
- [x] Secret scanning, dependency alerts, and private vulnerability reporting are enabled. Verified 2026-10-05: secret scanning and push protection enabled, vulnerability alerts return 204, Dependabot security updates enabled, private vulnerability reporting `enabled: true`. Hosted CI run 37384395895 and CodeQL `analyze` both succeeded.
- [x] The public history has been reviewed for proprietary source, personal exports, and secrets. 2026-10-05: `npm run audit` and `node scripts/audit-publication.js --history` passed. `git log --all --full-history -- home-preferences.json src/components` shows no personal export. The only component paths are the local dialog, button, and link files. The scanner does not prove a repository is clean.
- [x] The license, notices, and this checklist match the build that is being published. MIT, copyright 2026 Tyler Rehm. Fonts are SIL OFL via Fontsource. Tailwind Plus and Catalyst source are not included.

The manual and GitHub gates above are checked as of 2026-10-06. Do not push as part of a local implementation session unless publication was explicitly requested.
