# Tasks

## 1. OpenSpec and response shape

- [x] 1.1 Finalize proposal, design, and delta specs for progress UI, tabbed results, raw/httpStatus fields, docs serving, and copy confirmation. Validate `ask-models-results-ui` with OpenSpec strict mode.
- [x] 1.2 Ensure `askProvider` returns `httpStatus` and redacted truncated `raw` on success and failure, plus `formatCompiledBundle` for Overview JSON. Verify unit tests cover redaction of the API key from `raw` and the compiled bundle shape.

## 2. Docs serving and install

- [x] 2.1 Serve `/docs` and `/docs/*` from a docs root with path containment and HTML wrapping that keeps refresh fragment ids. Verify a server test for `/docs/ask-models.md` returns HTML containing a refresh anchor and rejects a missing doc path.
- [x] 2.2 Copy `docs/ask-models.md` in `scripts/home-service.js` install/update and point public refresh links at `/docs/ask-models.md#…`. Verify the service unit test checks the installed docs file exists.

## 3. Dialog progress and tabs

- [x] 3.1 Add overall progress and per-provider asking/settled indicators; update each provider as its request settles. Verify dialog tests show settled progress text after a run.
- [x] 3.2 Replace the flat result list with Overview + per-provider tabs, Rendered/Raw toggles, Overview compiled JSON, and a Copied confirmation after clipboard write. Verify dialog tests open Overview, switch to a provider Raw view, copy a dossier, and show Copied feedback.
- [x] 3.3 Run `npm run test:all`, update the login helper, and confirm `/docs/ask-models.md#refresh-chatgpt` renders on the homepage origin. 2026-10-08: test:all passed (81 unit, 30 e2e); service updated; docs HTML includes refresh anchors.

## Workflow follow-up

- Archive with `/opsx-archive` after review and main-spec sync.
- Manual Safari check of progress, tabs, copy feedback, and a refresh link stays a human gate.
