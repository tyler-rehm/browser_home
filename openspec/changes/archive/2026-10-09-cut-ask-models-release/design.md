# Design

## Context

See proposal.md — Why. Package is `1.0.0`; Ask models already merged to `main`. Changelog Unreleased holds vibe-check notes and (after this cut) Ask models bullets should land under `1.1.0`.

## Goals / Non-Goals

- Goals: honest `1.1.0` metadata + changelog; optional GitHub Release when asked.
- Non-Goals: changing product behavior in the version bump commit; auto-pushing tags without authorization.

## Decisions

### Version
- `1.1.0` — new capability (Ask models), compatible with existing homepage users.

### Changelog grouping
- Under `## 1.1.0 - <date>`: Ask models, Model accounts, secret store/Keychain docs, dossier UI, related ops.
- Keep vibe-check CI notes either in `1.1.0` (if shipping in the same cut) or leave in Unreleased if cut is Ask-only — prefer one cut that includes everything already on `main` since `1.0.0`.

### Tag / Release
- Local: version files + changelog only.
- Remote: `git tag` / `gh release create` only after explicit go; body summarizes Ask models and points to `docs/ask-models.md` and `docs/release.md`.

### Ordering
- Prefer merging/applying `retire-opaque-billing` and recording Safari smoke before the tag so `1.1.0` matches Safari.

## Risks / Trade-offs

- [Tag before Safari smoke] → Release notes must say Safari Ask gates are open if unchecked.
- [Self-approval on PR] → Working on `main` avoids PR self-approve; still need canary clear for protected merges if using PRs.

## Migration

None for user data. Installed login helper still needs `update` to pick up the built `1.1.0` assets.
