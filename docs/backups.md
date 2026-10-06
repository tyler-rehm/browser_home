# Backups

Storage is per origin. Use `http://home.localhost:4173` every time. Data saved on `http://127.0.0.1:4173` or `http://localhost:4173` will not appear on the pinned address.

## Version 2

```json
{
  "version": 2,
  "groups": [{ "id": "work", "name": "Work" }],
  "links": [
    {
      "id": "link-1",
      "name": "Example",
      "url": "https://example.com/",
      "short": "EX",
      "groupId": "work",
      "favorite": true
    }
  ],
  "notes": "",
  "preferences": {
    "paper": "#eff1e9",
    "ink": "#182019",
    "accent": "#e56636",
    "secondary": "#4c7358",
    "font": "Manrope"
  }
}
```

`id`, `groupId`, `favorite`, and `archivedAt` are optional on a link. A missing favorite means not a favorite. `archivedAt` is the ISO date the link left the main page. `groupId` must match a group in `groups` or the file is rejected. Group names are unique, trimmed, at most 40 characters, and there are at most 24 groups. `openInNewTab` is an optional preference. Missing means links open in a new tab. New exports use version 2.

## Version 1

```json
{
  "version": 1,
  "links": [{ "name": "Example", "url": "https://example.com/", "short": "EX" }],
  "notes": "",
  "preferences": {
    "paper": "#eff1e9",
    "ink": "#182019",
    "accent": "#e56636",
    "secondary": "#4c7358",
    "font": "Manrope"
  }
}
```

Limits are 48 links, 60-character names, 2-character short labels, 2048-character URLs, 8000-character notes, and a 768 KB import. Links are HTTP or HTTPS without embedded usernames or passwords. A link may store a `#rrggbb` icon color and a small JPEG icon. Fonts must be one of Manrope, Inter, Avenir Next, Helvetica Neue, or Georgia. Colors are `#rrggbb`.

Version 1 files still import. Their links come back with no group and not favorite. Unknown fields, an unsupported version, or an invalid value reject the whole file. Nothing already on the page changes.

## Legacy appearance

An object with only `paper`, `ink`, `accent`, `secondary`, and `font` is treated as an older appearance export. Supported values update appearance. Links and notes stay as they are. `examples/home-preferences.example.json` is that shape and is safe to commit. `home-preferences.json` and `code-home-backup.json` are personal and ignored.

## Recovery

If saved data is malformed or storage cannot be read, the page stays usable and does not overwrite the saved value. The banner is the signal. Export writes the current in-memory page, which is useful when a later save fails. A confirmed reset deletes only this app's four storage keys: `code-home-links`, `code-home-notes`, `code-home-preferences`, and `code-home-groups`. A link whose `groupId` is not in `code-home-groups` is shown with no group. That stored value is not rewritten on load.

A save is immediate for the scratchpad. Closing the tab after a successful "saved locally" status keeps the note. A failed write stays visible and is not described as saved.
