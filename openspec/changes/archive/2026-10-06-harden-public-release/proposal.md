# Proposal

## Why

Safari Home should be a useful, shareable public repository that reliably serves a private local homepage when Safari starts. The existing prototype has failing browser tests, unchecked persisted data, a manual development-server startup requirement, and bundled proprietary components that must not enter public source or Git history.

## What Changes

- Replace all bundled Tailwind UI/Plus/Catalyst source with independently authored components using the MIT-licensed Headless UI and Tailwind CSS packages. Preserve the current visual direction and accessible dialog behavior.
- License original code and documentation under MIT and document third-party provenance.
- Validate URLs, stored records, and versioned imports; handle storage failures and prevent silent scratchpad loss; add backup, recovery, and reset workflows.
- Serve built assets with a loopback-only production server and opt-in macOS login startup, with explicit install, update, status, and uninstall instructions.
- Remove unsolicited external startup requests and define a tested local security boundary.
- Fix browser failures and add production-build, persistence, accessibility, offline, server-security, and startup-tooling tests.
- Build maintainable documentation, agent guidance, CI, security workflows, and a release checklist with verifiable acceptance evidence.
- Use incremental, scoped commits after focused validation. Never stage proprietary components, personal exports, secrets, or generated build/test output.
- **BREAKING**: malformed records and unsupported import fields will no longer be accepted. Recognized legacy appearance preferences will be migrated rather than discarded.

## Capabilities

### New Capabilities

- `local-homepage-serving`: production asset serving, offline startup, stable origin, host restrictions, and macOS service lifecycle.
- `browser-data-management`: validated links and preferences, reliable notes, backups, migration, and storage recovery.
- `accessible-homepage`: safe navigation, keyboard/touch controls, dialog interactions, and responsive overflow behavior.
- `repository-maintenance`: redistributable source, documented installation, reproducible quality gates, agent workflows, and release governance.

### Modified Capabilities

None. This project has no existing OpenSpec requirements.

## Impact

Changes affect `src/`, styles, the HTML entry point, package scripts and lockfile, tests, local serving/startup tooling, documentation, and `.github/` automation. No backend, analytics, remote storage, authentication, or hosted deployment will be added. Repository creation on GitHub, remote publication, branch protection configuration, and reboot-based real Safari verification require a separate, explicit release step.