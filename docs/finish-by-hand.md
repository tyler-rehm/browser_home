# Finish this on your Mac

The app is built. What is left is your real Safari, and a few GitHub checks that only count after they have actually run. Nobody else can click through Safari for you, and a reboot has to be a real reboot.

The page only counts as your homepage when the address bar says `http://127.0.0.1:4173`. `localhost` is a different bucket, so notes saved there will not show up.

## 1. Start the page

In Terminal, from this folder:

```sh
npm ci
npm run build
npm start
```

Leave that window open. Open `http://127.0.0.1:4173` once and confirm you see “Good evening.” If the port is already taken, stop the other copy and start again. The address does not move to another port.

## 2. Tell Safari to open it

1. Open Safari.
2. Safari menu → Settings → General.
3. Homepage: paste `http://127.0.0.1:4173`.
4. “New windows open with” → Homepage.
5. “New tabs open with” → Homepage.
6. Close Settings.
7. Press Command-N. The new window should be this page.
8. Press Command-T. The new tab should be this page too.

Add one link and type a note. Quit Safari and open it again. The link and the note should still be there. They live in Safari for this exact address. Uninstalling the server does not delete them.

## 3. Start the server when you log in

The login helper starts the page server. It does not open Safari.

```sh
npm run build
node scripts/home-service.js install
node scripts/home-service.js status
```

Run those as yourself. Do not use sudo.

Then:

1. System Settings → General → Login Items.
2. Add Safari if you also want Safari itself to open at login.
3. Restart the Mac.
4. After you log in, wait a few seconds and open Safari. `http://127.0.0.1:4173/health` should say `ok`, and a new window should be the homepage.

If it does not come up, look at `~/Library/Logs/browser-home/home.err`.

To put a newer build in place later: `npm run build`, then `node scripts/home-service.js update`.

To remove the helper: `node scripts/home-service.js uninstall`. That stops the server at login. It does not clear your links or notes.

## 4. What “WebKit automation” is

It is already here. You do not install another tool.

```sh
npm run test:e2e
```

That starts the same production server and opens two automated browsers: Chromium, and WebKit dressed up as desktop Safari. WebKit is the engine Safari is built on. The tests click Add link, reject a bad URL, save a note, and walk the preferences dialog.

What that run does **not** do:

- It does not open the Safari app on your Mac.
- It does not change Homepage, new windows, or new tabs.
- It does not use your Safari profile, bookmarks, or saved links.
- It does not install the login helper.
- It does not survive a reboot, and it cannot stand in for one.

So the command is the right check that the page works in a Safari-like engine. Section 2 and section 3 are still yours to do once. After you have done them, write the date and what you saw in `docs/release.md`. Until that note exists, the Safari and reboot lines stay open.

## 5. After you push

GitHub has to go green on its own machines. Open the Actions tab for this repo. The CI job runs Node 22, 24, and 26. Required checks on `main` only stick once those job names have shown up from a real run.
