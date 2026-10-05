# browser_home

A local-first personal start page for Safari, built with React, Vite, and
Tailwind CSS.

Public-release hardening is in progress. This initial repository contains the
OpenSpec plan; redistributable application source will follow in verified,
incremental commits. Proprietary Tailwind UI/Plus source is not included.

See [the implementation plan](openspec/changes/harden-public-release/tasks.md).

## Run locally

For the existing local checkout:

```sh
cd ~/Code/miscellaneous-tools/broswer_home
npm ci
npm run dev
```

Then open `http://127.0.0.1:4173`.

Quick links and scratchpad notes are saved only in the browser's local storage.

Appearance preferences are saved automatically in local storage. Use the palette
button to export or import a portable `home-preferences.json` file.
