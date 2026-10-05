# Design

## Context

See `proposal.md` for the release objective. The application currently uses React, Vite, Tailwind CSS, local storage, and five bundled Catalyst component files. `npm run test:all` passes lint, seven unit tests, and build, but fails four of eight Chromium/WebKit executions. Browser tests start Vite rather than the built application. Appearance imports only parse JSON; storage writes are unguarded; notes use a delayed save. The HTML requests Google Fonts. Existing CI, CodeQL, Dependabot, and contributor/security documents provide a foundation, but no application source has been committed.

The user authorized MIT licensing, independently authored replacements for premium source, and incremental commits, and expressly prohibited publishing proprietary Tailwind UI/Plus code. Git has been initialized locally without a remote. The first commit must contain planning material only; premium source must never enter history.

## Goals / Non-Goals

- Keep the existing React/Vite architecture, homepage visual direction, link destinations, and recognized stored user data.
- Prefer small explicit modules and the existing testing tools over a new application framework or service dependency.
- Separate pure data validation, browser persistence, and operating-system integration so each boundary has focused tests.
- Keep operational tooling opt-in: development must not configure Safari, install a LaunchAgent, reboot the machine, or publish a repository.
- Do not introduce a backend, telemetry, remote synchronization, authentication, cloud hosting, or a claim of protection from a compromised browser/OS.

## Decisions

### 1. Replace premium source rather than reinterpret its license

Independently author the component APIs actually needed by the dialogs, using documented Headless UI primitives for focus management and accessibility. Keep native buttons and semantic links where no extra abstraction is needed. Remove all bundled Catalyst files, unused premium exports, and documentation that permits their redistribution. Inspect imports, staged content, and history before committing replacements.

Alternatives: keeping Catalyst pending legal review leaves publication blocked; copying or lightly modifying its source does not remove the provenance problem. Headless UI and Tailwind CSS are separate MIT-licensed packages and can remain. Add an MIT license for original work and third-party notices for runtime dependencies, bundled font assets, and generated OpenSpec material.

### 2. Make data validation a shared boundary

Extend the existing utility module or a narrowly scoped neighboring module with pure validators for links, preferences, and backups. Retain the `code-home-*` storage keys and the documented `http://127.0.0.1:4173` origin. Accept only trimmed, bounded link names, bounded labels, and HTTP(S) URLs without embedded credentials. Validate colors as hex colors and fonts against a fixed set. Explicitly project accepted fields; do not merge arbitrary parsed objects into application state.

Define a version-1 backup containing links, notes, and preferences. Bound import bytes, note length, and link count using shared documented constants, with limits generous enough for normal homepage use. Validate the entire backup before updating state. Recognize the existing unversioned appearance-only object and migrate it separately. Unknown fields, unsupported versions, and invalid values fail with field-specific errors. Invalid persisted data is reported and held for recovery rather than overwritten on mount.

Alternatives: TypeScript alone does not validate runtime JSON; adding a schema library is unnecessary for this small fixed format unless implementation reveals substantial duplication. Do not build a generic validation framework.

### 3. Represent persistence outcomes explicitly

Centralize guarded storage reads/writes. Distinguish absent keys, malformed records, blocked access, quota failure, and successful saves. Keep usable in-memory state when persistence fails and expose an accessible warning plus backup export. Do not show saved status until a write succeeds.

For the bounded scratchpad, save synchronously on edits instead of depending on a debounce timer. This removes the same-tab navigation loss window. Any lifecycle fallback is secondary, not a durability guarantee after forced browser or OS termination. Import validation is atomic; multiple local-storage writes are not a transaction, so report partial persistence failures honestly while keeping a complete in-memory backup.

Provide explicit backup/restore and confirmed application-only reset in the existing preferences workflow. Rename the shipped appearance defaults to an example file and ignore user export names. Document that local storage is origin-bound, not encrypted, and may be cleared by browser settings.

### 4. Fix interaction semantics without redesigning the homepage

Make link navigation and removal sibling controls with a shared item container. Show or otherwise expose deletion on focus and touch, never only hover. Add visible focus styles and appropriately sized targets. Allow vertical document scrolling when content grows; keep the default desktop composition compact rather than enforcing hidden overflow.

Catch search normalization errors and show an accessible error. Exclude editable elements and modified shortcuts from slash-to-search behavior. Test Headless UI dialog visibility, focus trapping/restoration, Escape and backdrop dismissal with exact, scoped locators. Keep reduced-motion handling and check built-in theme contrast, long labels, and 200 percent zoom-equivalent layouts.

### 5. Use a bounded production static server

Implement a small standalone Node HTTP server, not a development or preview server. Use an allowlisted inventory of build files, explicit MIME types, real-path checks, and Node URL/path APIs. Serve only GET/HEAD from the build root, bind to `127.0.0.1`, restrict Host to documented loopback hosts and the configured port, and reject traversal and symlink escapes. Return generic errors without filesystem paths. Do not serve source files, arbitrary directories, or SPA fallbacks for unknown asset URLs.

The origin stays fixed; occupied ports and missing builds are startup errors. Add a health/status check without exposing configuration or personal data. Test headers, missing files, methods, encoding edge cases, Host validation, and file boundaries with an ephemeral test port. Production logs contain lifecycle errors, not notes, links, request bodies, or browsing history.

Apply CSP with local scripts/fonts, no outbound connections, and no framing or form submission. Allow only the style behavior actually needed by dynamic themes and Headless UI. Record any necessary inline-style allowance as a trade-off rather than claiming a fully strict style policy. Add MIME-sniffing, referrer, and permissions restrictions; do not add HSTS to plain local HTTP.

Alternatives: Vite dev/preview exposes development assumptions; opening the current root-relative module app as `file://` is not a supported deployment model; a general-purpose server framework adds more surface than this bounded static use requires.

### 6. Make macOS startup explicit and user-scoped

Provide install/update, status, and uninstall commands. Install built assets and the standalone server into a dedicated user Application Support directory, independent of the checkout. Generate a LaunchAgent with structured macOS `plutil` operations rather than interpolated XML. Use an absolute Node executable, a fixed user-owned service label, controlled log paths, and restart throttling. Refuse missing builds and unexpected paths. No sudo, system-wide daemon, or automatic installation during tests.

Validate installation assets before replacing an existing install; preserve a recoverable previous version until the replacement is valid. Preserve browser data during upgrades and uninstall. Test command construction, path escaping, asset copying, and failure handling with temporary directories and mocked service commands. Perform actual login/reboot behavior only as an explicit manual release check. Document reinstalling after a Node executable moves or is removed.

### 7. Remove external startup dependencies

Remove Google Fonts URLs and preconnect hints. Bundle the fonts needed to preserve the current appearance through licensed font packages or use available local fallbacks for platform fonts. Include their license notices. Record browser network requests during production tests and require all startup requests to use the local origin. Test external-network-unavailable operation while allowing the local server.

### 8. Keep automation proportionate and enforceable

Use supported Node versions matched to actual build-tool engine requirements; document a minimum and test supported LTS versions. Add formatting to the existing lint/test/build/browser gate, focused coverage of shared validation/storage/server logic, and browser assertions for accessibility. Avoid a numerical coverage badge without a useful threshold and scenario mapping.

Run Playwright against the production server, retaining Chromium and WebKit and adding targeted mobile/short-height cases. Preserve traces and screenshots on failure. Pin workflow actions to reviewed full commit SHAs with readable version comments, least-privilege job permissions, and unprivileged PR execution. Keep Dependabot and CodeQL; add dependency review, full-tree advisory checks, and an executable publication audit with documented limitations. Scan staged/tracked material and eventual history, not ignored local folders. A scanner does not prove absence of secrets or proprietary code.

Keep `AGENTS.md` as the central project contract; use small Copilot instructions and review prompts that reference it instead of duplicating rules. The generated OpenSpec workflows provide proposal/apply/archive support. No extra autonomous agents or hooks are necessary unless they enforce a demonstrated requirement.

### 9. Commit only reviewed, verified increments

Commit planning artifacts first with an explicit path allowlist. The next source commit introduces only independently authored redistributable code and safe configuration; it must not contain any of the current premium source. Avoid blanket staging until the source and export audit passes. Then commit data hardening, local server/startup, expanded tests/automation, and documentation in scoped increments, updating task evidence along the way.

Run the narrowest meaningful checks for each increment before committing and the complete required gate before handoff. Keep manual and GitHub-only tasks unchecked until performed. Do not add a remote, push, create a hosted repository, enable a background service, or change Safari settings as part of this change.

## Risks / Trade-offs

- Premium provenance can survive superficial rewrites: author replacements independently, remove unused premium files, inspect staged diffs, and never commit the original files.
- A first source commit necessarily introduces the untracked baseline: explicitly enumerate safe paths and document remaining test failures until their owning increment fixes them; do not claim a green gate prematurely.
- Storage can be cleared or denied by Safari: retain in-memory state, provide backups, and document origin and browser limitations.
- Arbitrary user colors can reduce contrast: verify built-in themes and document that custom palettes are user-controlled; do not claim every possible palette meets contrast requirements.
- A user-level server may restart before dependencies or assets are ready: install assets first, use stable paths, throttle restart, and expose actionable logs/status.
- Binding to loopback is not authentication: local processes, malicious extensions, and a compromised OS remain outside the security guarantee.
- WebKit automation is not the shipping Safari application: retain a real Safari and login/reboot checklist.
- Immutable action revisions still require maintenance: Dependabot updates them and reviewers verify provenance and behavior.

## Migration Plan

1. Commit only validated OpenSpec planning artifacts; no premium source or user data.
2. Independently replace premium components, remove their files/references, and introduce MIT/provenance records before the first source commit.
3. Preserve the existing storage keys and origin; migrate recognized appearance data, report invalid records, and offer backup before reset.
4. Introduce production serving and test it before making it the documented daily-use path. Keep development commands for contributors.
5. Add opt-in service lifecycle tooling without running installation on the user's behalf.
6. Finish automated gates and documentation, then run a clean-install and source/history audit.
7. Leave real Safari login/reboot and remote settings as explicit release gates. Archive the change only when implementation evidence is complete; do not mark pending manual gates done.

Rollback uses a previously verified source commit and rebuild, or the retained previous installed assets. Do not clear browser storage when rolling back. Version-1 exports allow recovery if future migrations change storage behavior.