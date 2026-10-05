# Architecture

The browser loads a static React app. `src/records.js` validates links, notes, and appearance. `src/state.js` reads storage without repairing it on disk. `src/app.jsx` renders the page and writes only after a user edit, import, or confirmed reset.

`npm run build` writes `dist/`. `src/server.js` serves that directory on `127.0.0.1:4173`. It is a fixed-origin static server, not the Vite development server.

`scripts/home-service.js` is optional. It copies the build into `~/Library/Application Support/browser-home` and registers a user LaunchAgent. Tests call it with temporary directories and do not register a service on the developer machine.

Personal data stays in browser storage for the documented origin. `localhost` is a different origin and will not see those records.
