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

- [ ] Protected `main` and required checks are configured.
- [ ] Secret scanning, dependency alerts, and private vulnerability reporting are enabled.
- [ ] The public history has been reviewed for proprietary source, personal exports, and secrets.
- [ ] The license, notices, and this checklist match the build that is being published.

Do not archive the OpenSpec change until those gates are done. Do not push as part of a local implementation session unless publication was explicitly requested.
