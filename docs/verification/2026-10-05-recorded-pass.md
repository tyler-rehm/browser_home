# Recorded pass — 2026-10-05

Production server: `node scripts/serve.js` at `http://127.0.0.1:4173`. Screenshots in this folder were taken in a desktop browser against that server, then at a 390×844 phone viewport.

## What passed

- Desktop home (field theme, 1920×1080 and 1280×720): heading, search, eight quick links, visible remove buttons, tools, scratchpad. No horizontal overflow. At both sizes the page fit the viewport (`scrollHeight` equaled `clientHeight`).
- Fonts and scripts loaded only from `127.0.0.1:4173` (Manrope and DM Mono woff2 plus the built JS/CSS). No Google Fonts request.
- Add-link dialog opened with the name field focused. Submitting name `Bad` and URL `javascript:alert(1)` stayed in the dialog, kept the fields, and showed “Only HTTP and HTTPS links are allowed”.
- Scratchpad text `remember this pass` was written to `localStorage` key `code-home-notes` immediately.
- Preferences opened with field colors `#eff1e9`, `#182019`, `#e56636`, `#4c7358` and typeface Manrope. Switching to the ink theme updated the stored colors to `#17181b`, `#f3f1ea`, `#c8ff45`, `#79a7ad` and the page went dark. The scratchpad text stayed.
- Phone viewport 390×844: `scrollWidth` 390 (no sideways scroll), `scrollHeight` 1600. Scrolling reached the tools and scratchpad. Remove buttons stayed visible.
- Response headers on `/health`: CSP with `connect-src 'none'`, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, empty camera/microphone/geolocation/payment, `Cache-Control: no-store`.
- Server boundaries: `POST /` → 405 `Method not allowed`; `GET /../package.json` and a missing file → 404 `Not found` (no filesystem path in the body); `Host: evil.example` → 421 `Misdirected request`.

## What this pass does not close

- Shipping Safari, homepage settings, login items, and a reboot. See `docs/finish-by-hand.md`.
- A saved browser-console log. The page rendered and every observed request was local; a console transcript was not captured.
- Clicking Export, Import, or Reset in this session. Those flows are covered by the unit and Playwright suites (`npm run test` and `npm run test:e2e`), which already passed on this machine on 2026-10-05.
- Offline start of the login service. The service was not installed.
