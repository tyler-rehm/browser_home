# Repository Maintenance

## Purpose

Make the public source independently redistributable, reproducibly testable, and understandable to contributors and users without relying on undocumented local setup or agent behavior.

## ADDED Requirements

### Requirement: Redistributable source and clean history
Public source and Git history SHALL exclude proprietary Tailwind UI/Plus/Catalyst source, secrets, personal exports, and generated application or test artifacts. Original code and documentation SHALL carry an MIT license. Third-party dependencies and copied/generated workflow material SHALL have documented provenance and applicable licenses.

#### Scenario: A commit is prepared
- **WHEN** a contributor stages a release-related commit
- **THEN** staged files are reviewed for proprietary code, secrets, personal data, generated artifacts, and licensing compatibility before committing

### Requirement: Reproducible quality gates
A clean checkout SHALL have documented, lockfile-based installation and executable checks for formatting, lint, unit behavior, production build, browser behavior, and server boundaries. Continuous integration SHALL test the production build in Chromium and WebKit and retain useful failure diagnostics.

#### Scenario: A pull request changes application behavior
- **WHEN** CI runs for that pull request
- **THEN** required checks exercise the built application and publish failure diagnostics when checks fail

### Requirement: Secure automation and dependency maintenance
Automation SHALL use least-privilege permissions and reviewed immutable action revisions. Dependency updates, dependency review, static security analysis, and known-advisory checks SHALL have documented review procedures. Automated findings SHALL not be represented as a security guarantee.

#### Scenario: A dependency update is proposed
- **WHEN** an update pull request changes the lockfile or workflow actions
- **THEN** the same quality gates and documented dependency/security review apply before merging

### Requirement: Complete user and contributor documentation
Documentation SHALL cover supported environments, clean installation, exact Safari startup settings, service lifecycle, stable-origin storage, backups, troubleshooting, architecture, security limitations, contribution requirements, and release procedures. It SHALL distinguish automated verification from manual Safari and reboot checks.

#### Scenario: A new user follows installation instructions
- **WHEN** the user starts with a clean checkout on a supported Mac
- **THEN** the documented commands lead to a running local homepage and explain how to configure Safari and recover from startup failures

### Requirement: Scoped agent workflows
Repository agent guidance SHALL define ownership boundaries, prohibited network/data changes, specification and test expectations, and truthful reporting of validation. Agent instructions SHALL complement executable checks rather than claim to enforce them.

#### Scenario: An agent changes a user-visible behavior
- **WHEN** the agent implements a scoped behavior change
- **THEN** it follows the tracked requirements, adds focused regression coverage, and reports checks run and remaining limitations

### Requirement: Incremental verified commits
Implementation SHALL proceed in reviewable commits with explicit scope and focused validation evidence. Unverified manual or remote-only gates SHALL remain visibly incomplete. Publication SHALL require explicit authorization separate from local development.

#### Scenario: Local implementation completes
- **WHEN** automated checks pass but real Safari reboot verification or GitHub settings are pending
- **THEN** the release checklist keeps those gates open and no remote is created or pushed automatically