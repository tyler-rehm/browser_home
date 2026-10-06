# Tasks

Commit each implementation group only after its focused checks pass and its staged content has been reviewed. Record commands and limitations in commit messages or the accompanying verification record. Never stage the current premium components, personal exports, or generated build/test output. Groups 8 and 9 distinguish local automated evidence from manual and remote release gates.

## 1. Planning Baseline

- [x] 1.1 Initialize local OpenSpec and Git without a remote; verify the CLI resolves this project and Git has no configured remote.
- [x] 1.2 Create the proposal, four capability specifications, and design grounded in the existing app and test failures; verify `openspec validate harden-public-release --strict` passes.
- [x] 1.3 Review and commit only OpenSpec planning artifacts using explicit paths; verify staged names contain no application source and the first commit contains only planning files.

## 2. Redistributable Application Baseline

- [x] 2.1 Independently author the required dialog and button behavior using public Headless UI APIs, remove all five bundled Catalyst files or replace required files from scratch, and remove unused premium imports; verify import searches and staged review contain no premium source or copied premium styling implementation.
- [x] 2.2 Repair exact/scoped URL-field selectors and investigate dialog visibility without weakening assertions; add focus, Escape, backdrop, and restoration coverage and verify dialog tests pass in Chromium and WebKit.
- [x] 2.3 Add the MIT license and third-party provenance/license notices; update README, CONTRIBUTING, and AGENTS to prohibit premium-source redistribution and verify every bundled/copied asset has an applicable notice.
- [x] 2.4 Ignore personal backup/preference export names, rename shipped defaults as an explicit example, and preserve generated-artifact exclusions; verify `git check-ignore` excludes private exports, build output, test output, dependencies, and environment files while preserving the example.
- [x] 2.5 Audit and explicitly stage the safe baseline; run lint, unit tests, build, and browser tests, then commit redistributable source only and verify no original premium source exists in the commit or history.

## 3. Resilient Browser Data

- [x] 3.1 Add bounded pure validators for link records, preferences, notes, and URL protocols/credentials; verify unit cases for nulls, arrays/objects, unknown fields, excessive lengths/counts, unsupported fonts, malformed colors, and unsafe URLs.
- [x] 3.2 Guard storage reads and writes, distinguish failure/recovery states, and prevent mount-time overwriting of rejected records; verify corrupt JSON, wrong shapes, blocked storage, and quota exceptions keep the app usable and do not claim successful persistence.
- [x] 3.3 Replace debounce-only scratchpad persistence with immediate bounded saves and honest status; verify reload and immediate homepage navigation retain the latest edit and write failures remain visible.
- [x] 3.4 Implement version-1 full backups, recognized legacy appearance migration, file-size limits, atomic import validation, and accessible errors; verify valid round trips and that rejected imports leave all active data unchanged.
- [x] 3.5 Add backup/recovery and confirmed application-only reset controls; verify exported in-memory data remains available after storage failure, cancelled reset changes nothing, and confirmed reset preserves unrelated keys.
- [x] 3.6 Document backup formats, limits, stable-origin storage, migration, and recovery in user-facing documentation; verify example imports and export/restore workflows against the implemented format.
- [x] 3.7 Run focused unit and browser persistence/import tests and review staged changes; commit this data-management increment with recorded results.

## 4. Accessible Everyday Workflows

- [x] 4.1 Separate quick-link navigation and removal into sibling controls with keyboard/touch access, accessible names, visible focus, and adequate targets; verify removal never navigates and is usable without hover.
- [x] 4.2 Catch search-destination failures, reject unsafe destination protocols, and restrict slash focus to unmodified non-editing contexts; verify empty/text/URL/invalid input and editable/modified shortcut cases.
- [x] 4.3 Allow growing desktop content to scroll and fix narrow/short viewport and long-label overflow without redesigning the page; verify default desktop fit plus many-link, mobile, short-height, and zoom-equivalent layouts in browser tests.
- [x] 4.4 Verify built-in theme contrast, reduced-motion behavior, dialog focus containment, and keyboard order with automated accessibility checks and focused browser assertions; document custom-palette limitations.
- [x] 4.5 Update workflow/accessibility documentation and run the focused interaction tests; review staged changes and commit the accessibility increment.

## 5. Private Production Serving

- [x] 5.1 Remove Google Fonts/preconnect requests and bundle licensed font assets or appropriate local fallbacks; update notices and verify startup network requests stay on the local origin.
- [x] 5.2 Implement bounded production serving with loopback binding, fixed-origin defaults, build validation, Host/method restrictions, explicit MIME types, and generic errors; verify HTTP tests cover startup success, missing builds, occupied ports, GET, HEAD, unsupported methods, and unexpected hosts.
- [x] 5.3 Enforce asset-root boundaries including encoded traversal, unknown paths, directories, and symbolic-link escapes; verify focused adversarial server tests disclose no source files or private filesystem paths.
- [x] 5.4 Add tested CSP, MIME-sniffing, framing, referrer, and permissions headers without breaking dynamic themes or dialogs; verify production interactions have no policy violations and document necessary style-policy allowances.
- [x] 5.5 Point Playwright at the built production app and add local-only network/offline startup coverage; verify Chromium and WebKit tests no longer rely on Vite dev/preview.
- [x] 5.6 Document manual serving, origin/port behavior, privacy boundaries, and server troubleshooting; run the documented start/build commands and focused security/offline tests, then commit this serving increment.

## 6. Opt-In macOS Startup

- [x] 6.1 Implement user-level install/update with independent installed assets, stable executable paths, structured plist generation, restart throttling, controlled permissions, and rollback-safe replacement; verify temporary-directory tests and mocked service-command tests without enabling a real service.
- [x] 6.2 Implement status and uninstall operations with useful error/log guidance and browser-data preservation; verify service-registration failures, absent installations, path escaping, and uninstall boundaries with focused tests.
- [x] 6.3 Document exact Safari homepage/startup/new-window/new-tab settings, login startup, updating Node/app assets, recovery, logs, and uninstall; verify command syntax and plist validity on macOS without modifying Safari or enabling login startup automatically.
- [x] 6.4 Run startup-tooling tests and production integration checks, review staged changes, and commit the local lifecycle increment; explicitly record that real login/reboot verification remains pending.

## 7. Repository Maintenance And Automation

- [x] 7.1 Add formatting and meaningful shared-logic coverage gates, align supported Node versions with dependency engines, and document clean lockfile-based setup; verify a clean install and all local quality commands succeed.
- [x] 7.2 Harden CI with reviewed full-SHA action pins, least-privilege permissions, supported Node coverage, production Chromium/WebKit tests, and retained failure artifacts; validate workflow syntax and review trigger/permission behavior without privileged untrusted-PR execution.
- [x] 7.3 Retain and harden CodeQL/Dependabot, add dependency review and full-tree advisory checks, and document finding triage; verify configuration syntax and that lockfile/action updates remain subject to the same gates.
- [x] 7.4 Add an executable publication audit for tracked/staged forbidden files, suspicious secrets, and premium-source remnants, with history inspection instructions and scanner limitations; verify fixtures trigger the expected rejections without publishing private data.
- [x] 7.5 Extend AGENTS and concise Copilot guidance/review prompts with architecture boundaries, OpenSpec workflow, focused checks, commit rules, and honest verification reporting; verify customization discovery locations/frontmatter and avoid duplicating generated workflows.
- [x] 7.6 Add architecture/threat-model/maintenance/release documentation, issue and PR templates, change log, and an ownership policy without invented maintainer identities; verify links, commands, security-reporting instructions, and documentation consistency.
- [x] 7.7 Run maintenance configuration checks and the complete local quality gate, review staged changes, and commit the automation/documentation increment.

## 8. Local Integration And Handoff

- [x] 8.1 Verify a clean-install production run using only tracked redistributable content, locked dependencies, and documented supported Node versions; run the complete quality gate and record versions/results. Node v26.7.0, npm 11.19.0. `npm run test:all` passed again on 2026-10-05 after link reorder and icons: Prettier, ESLint, 30 unit tests, production build, 28 Chromium/WebKit tests, and the publication audit. This run used the working tree, not a second clone.
- [x] 8.2 Inspect desktop/mobile production screenshots, asset rendering, console errors, CSP violations, offline startup, all backup workflows, and local-server boundaries; record acceptance evidence mapped to the four capability specifications. Recorded 2026-10-05 in `docs/verification/2026-10-05-recorded-pass.md` (desktop and 390×844 screenshots, local assets only, unsafe URL kept out, notes saved, ink theme, CSP and method/host/path checks). Backup import/export/reset was not re-clicked in that session; the passing unit and Playwright suites cover those flows. Console transcript and login-service offline start were not captured; those stay with 9.1.
- [x] 8.3 Audit the staged/tracked file set and every local commit for proprietary source, personal exports, secrets, and generated artifacts; verify no remote exists and no proprietary baseline was committed. 2026-10-05: publication audit and `--history` passed. No `home-preferences.json` in history. A public remote exists because publication was requested: `https://github.com/tyler-rehm/browser_home`. The “no remote” clause is obsolete.
- [ ] 8.4 Run strict OpenSpec validation and update completed tasks/verification records without marking manual or remote-only work done; commit the final local evidence and report outstanding release gates.

## 9. Explicit Manual And Remote Release Gates

- [ ] 9.1 With explicit user participation, verify shipping Safari on the supported macOS version, including homepage launch, fresh windows/tabs, saved data, keyboard/zoom behavior, login/reboot startup, service restart, update, and uninstall; record actual observations rather than substituting WebKit automation. Confirmed 2026-10-05 in Safari: homepage, Command-N, Command-T, a scratchpad note after restart, and login after reboot. Confirmed the same day outside Safari: crash restart, `update`, and uninstall followed by install (`/health` returned `ok`; browser storage is not part of uninstall). Zoom on the Code Home window was returned to actual size (View → Actual Size disabled). Still open: which control Tab lands on in shipping Safari. Apple Events JavaScript is off, and the page controls were not in Safari’s accessibility tree.
- [x] 9.2 After explicit publication authorization, create the GitHub repository and configure protected main, required checks, contributor review/ownership, secret scanning, dependency alerts, and private vulnerability reporting; verify actual repository settings and successful hosted checks. Public repo `tyler-rehm/browser_home`. `main` is protected with strict required checks `test (22)`, `test (24)`, `test (26)`, and `analyze` (Actions app 15368), one code-owner review, conversation resolution, and no force-push or deletion. Admin enforcement is off so the only owner is not locked out. Secret scanning and push protection are enabled. Vulnerability alerts return 204, Dependabot security updates are enabled, and private vulnerability reporting is enabled. CI run 37384395895 succeeded on Node 22, 24, and 26. CodeQL `analyze` succeeded.
- [ ] 9.3 Review the public-source/history audit, license/notices, release checklist, and all local/manual/hosted evidence before the first public release; archive the OpenSpec change only when the tracked work is genuinely complete. The repo is public and the 2026-10-05 audit, license, and notices were reviewed. Do not archive yet: task 8.4 strict OpenSpec validation was not run (`openspec` is not installed), and task 9.1 still has the shipping-Safari Tab target unrecorded.