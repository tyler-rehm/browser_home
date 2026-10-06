# Changelog

## Unreleased

- Seed starter links with GitHub, Cursor, Gmail, Sheets, Slack, Lightsail, Cloudflare, and Stripe.
- Split appearance and general settings into the palette and a gear icon.
- Open quick links and tools in a new tab, with a preference to turn that off.
- Archive links off the main page and restore or delete them from an archive table.

- Replace the development-server homepage path with a loopback production server.
- Validate stored links, notes, appearance, and backups, and surface failed saves.
- Make link removal a separate control and keep the page usable when content grows.
- Bundle Manrope, DM Mono, and Inter instead of requesting Google Fonts.
- Add optional macOS login-service commands, CI, and a publication audit.
- Let quick links be reordered, and store each link’s icon color and optional circular image.
- Add a skip link, announce reorders and scratchpad saves, and tie link-form errors to the fields.
- Document install, configuration, Safari, and the login helper in the README.

The login helper was uninstalled and installed again on 2026-10-05. That command does not clear browser data. Shipping Safari keyboard focus was not readable from outside Safari.
