# Threat model

## Assets

Links, notes, and appearance in local storage. The built files. The LaunchAgent plist and logs.

## Boundary

The server listens on `127.0.0.1` and `::1`, port 4173. It accepts GET and HEAD only when the Host header is `127.0.0.1:4173`, `localhost:4173`, or the pinned name from `src/homepage.config.json` (`home.localhost:4173`). Paths must stay inside the build directory after decoding and after `realpath`, including symbolic links. Errors are generic and do not include filesystem paths. Logs are lifecycle messages, not notes or request bodies.

## Accepted limits

Anything that can call loopback on this Mac can open the page. The content security policy blocks remote scripts and connections from the page, and it allows inline styles for themes and dialogs. Custom color pairs are not forced into a contrast ratio. Built-in theme text is adjusted for readability at render time; the stored color is unchanged.

Uninstall and reset do not promise to erase Safari's other data. Reset removes only `code-home-links`, `code-home-notes`, `code-home-preferences`, and `code-home-groups`.

## Out of scope

A compromised browser or operating system. Private vulnerability reports are handled through GitHub security advisories. Scanner output is not a guarantee.
