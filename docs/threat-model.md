# Threat model

## Assets

Links, notes, and appearance in local storage. The built files. The LaunchAgent plist and logs. Model API keys in the macOS Keychain item `local.browser-home.model-secrets` and, as a fallback, the model secrets file outside the repository.

## Boundary

The server listens on `127.0.0.1` and `::1`, port 4173. It accepts GET and HEAD for built assets, `GET /api/providers`, `GET /api/provider-status`, and `POST /api/ask` when the Host header is `127.0.0.1:4173`, `localhost:4173`, or the pinned name from `src/homepage.config.json` (`home.localhost:4173`). Other methods are rejected. Paths must stay inside the build directory after decoding and after `realpath`, including symbolic links. Errors are generic and do not include filesystem paths. Logs are lifecycle messages. They do not include notes, prompts, replies, or API keys. `GET /api/provider-status` returns local unknown stubs and does not call vendor billing endpoints. Homepage load does not request that route.

## Accepted limits

Anything that can call loopback on this Mac can open the page and can POST a prompt, which spends API quota for a configured provider. The content security policy blocks remote scripts. The page may connect only to its own origin (`connect-src 'self'`), and the policy allows inline styles for themes and dialogs. Custom color pairs are not forced into a contrast ratio. Built-in theme text is adjusted for readability at render time; the stored color is unchanged.

Uninstall and reset do not promise to erase Safari's other data. Reset removes only `code-home-links`, `code-home-notes`, `code-home-preferences`, and `code-home-groups`.

## Out of scope

A compromised browser or operating system. Private vulnerability reports are handled through GitHub security advisories. Scanner output is not a guarantee.
