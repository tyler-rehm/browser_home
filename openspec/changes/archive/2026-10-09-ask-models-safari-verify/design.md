# Design

## Context

See proposal.md — Why. Ask models code and `/docs/ask-models.md` already ship on `main`. `docs/release.md` still only records the 2026-10-05/06 homepage Safari gates.

## Goals / Non-Goals

- Goals: checklist + docs that force real Safari evidence; clear service-update prerequisite.
- Non-Goals: automating Safari; changing Ask models behavior; claiming reboot gates without a reboot.

## Decisions

### Checklist section
- Add an **Ask models (Safari)** subsection under Manual in `docs/release.md` with unchecked boxes and blank confirmation lines until filled.
- Minimum gates: service `update` serves Ask UI + docs; Settings → Model accounts lists providers without keys; Ask models opens, selects a configured provider, completes one ask or shows an honest error; Balance/Console/Refresh open expected destinations.

### Docs cross-link
- Add a short “Safari smoke” section near the end of `docs/ask-models.md` that points at `docs/release.md` and repeats the three-step path (update → accounts → ask).

### Evidence rule
- Tasks leave boxes unchecked; only the human operator marks them with the observation date.

## Risks / Trade-offs

- [Smoke run without keys] → Still valid: configured vs not-configured UI, docs link, ask rejection without selection.
- [Stale installed package] → First checklist item is always `home-service.js update` (or documented install path).

## Migration

Documentation-only. No data migration.
