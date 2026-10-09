# Tasks

## 1. Version and changelog

- [x] 1.1 Set `package.json` version to `1.1.0` and sync `package-lock.json` top-level version fields. Verify `node -p "require('./package.json').version"` prints `1.1.0`.
- [x] 1.2 Move Ask models and other post-`1.0.0` Unreleased notes that are already on `main` into `## 1.1.0 - <date>` in `CHANGELOG.md`. Verify Unreleased only holds truly unfinished items (or is empty).

## 2. Local quality gate

- [x] 2.1 Run `npm run test:all` on the version bump tree and confirm it passes. Do not mark Safari gates done from this run.

## 3. Publication (gated)

- [x] 3.1 With explicit authorization, commit the version cut on `main` (or the agreed branch). Verify `git show` includes only release metadata files unless a docs date note is intentional.
- [x] 3.2 With explicit authorization, create tag `v1.1.0` and a GitHub Release whose body summarizes Ask models and links `docs/ask-models.md` / `docs/release.md`. Verify `gh release view v1.1.0` succeeds.

## Workflow follow-up

- Archive `cut-ask-models-release` after the version commit (and tag if requested).
- Prefer Safari smoke evidence before tagging; if tagging earlier, say Ask Safari gates are still open in the release body.
