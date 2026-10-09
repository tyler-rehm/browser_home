# Proposal

## Why

Ask models and related ops are on `main` under package version `1.0.0` with changelog entries still in Unreleased (plus vibe-check CI notes). Operators and GitHub Releases need a clear version that names Ask models as shipped.

## What Changes

- Bump the package version to `1.1.0` (semver minor: new user-facing capability, no breaking API for existing homepage users).
- Move Ask models (and related Unreleased notes that belong in this cut) into a dated `1.1.0` changelog section; leave truly unfinished Unreleased items in place.
- Align `package-lock.json` name/version metadata with `package.json`.
- Optionally create a GitHub Release / tag for `1.1.0` only with explicit authorization (not part of local coding by default).
- Do not invent Safari or reboot evidence; point release notes at `docs/release.md` Ask models gates when those are recorded.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Version and changelog are publication metadata; product behavior is unchanged by the cut itself.

This change sets `skip_specs: true` because no capability requirements change.

## Impact

- `package.json`, `package-lock.json`, `CHANGELOG.md`, possibly `docs/release.md` date notes.
- Git tag / `gh release` only when the operator asks.
- Preferred order: finish `retire-opaque-billing` and record `ask-models-safari-verify` evidence before tagging, so `1.1.0` matches what Safari actually runs.
