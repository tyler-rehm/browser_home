# Safari and login startup

The supported homepage origin is `http://127.0.0.1:4173`.

## Serve the page

```sh
npm ci
npm run build
npm start
```

If the port is taken, the process stops and the origin does not change. If `dist/index.html` is missing, run `npm run build` first. `GET /health` returns `ok` and no personal data.

## Safari settings

1. Safari → Settings → General.
2. Homepage: `http://127.0.0.1:4173`.
3. New windows open with: Homepage.
4. New tabs open with: Homepage.

These steps are manual. The repository does not change Safari for you.

## Login startup

The service starts the local server at login. It does not launch Safari. To open Safari itself at login, add Safari in System Settings → General → Login Items.

From the repository, after a production build:

```sh
node scripts/home-service.js install
node scripts/home-service.js status
node scripts/home-service.js update
node scripts/home-service.js uninstall
```

Install copies the build to `~/Library/Application Support/browser-home/current` and writes `~/Library/LaunchAgents/local.browser-home.plist` with `plutil`. The program arguments are an absolute Node path, the installed `server.js`, and `--root` pointed at the installed `dist`. `KeepAlive` is set and `ThrottleInterval` is 10 seconds. Logs are `~/Library/Logs/browser-home/home.log` and `home.err`.

Run the commands as your user, not with sudo. If you upgrade or move Node, run `update` so the plist points at the new executable. Uninstall removes the LaunchAgent and the installed copy. It does not clear notes, links, or appearance.

A reboot check of this service is still a manual release step. Automated tests use temporary directories and do not load a LaunchAgent.
