# Design

## Context

Ask models posts one prompt per selected provider through `POST /api/ask`. Results today wait for every Promise to settle, then render stacked `<article>` blocks. Refresh links use `./docs/ask-models.md#…`, which resolves against the SPA origin and hits the static asset root — the markdown file is not in `dist/`, so Safari shows a blank/404 page.

Partial work already in the tree: `formatCompiledBundle`, `redactRaw`, and docs-serving helpers in `src/server.js`. The dialog UI and home-service doc copy still need to land against this design.

## Goals / Non-Goals

- Goals: visible progress (overall + per provider); working refresh docs; tabbed results with Overview compiled JSON and per-provider Rendered/Raw; keep secrets redacted.
- Non-Goals: live token streaming; rich markdown preview of replies; changing provider adapters beyond returning `httpStatus` and redacted `raw`.

## Decisions

### Progressive settlement
Keep parallel `fetch` calls. As each settles, update that provider's status and result immediately so per-provider spinners clear independently. Overall progress remains active until every selected request has settled or aborted.

### Progress UI
- Overall: a polite live region, e.g. `Asking 2 of 5…` / `Asked 5 providers`.
- Per provider: status text or spinner beside the checkbox row (`Waiting` / `Asking…` / `ok` / `failed`) for selected providers during and after a run.

### Result tabs
Primary tablist:
1. **Overview** (default after the first result settles) — table or short list of each provider's status, model, latency, and one-line preview; plus a `<pre>` of `formatCompiledBundle({ prompt, results, askedAt })` pretty-printed JSON.
2. **One tab per provider that has a result** (catalog order), labeled with the provider display name.

Inside each provider tab, a secondary control toggles **Rendered** vs **Raw**:
- Rendered: reply text or error string.
- Raw: `HTTP {status}` (or `none` on abort) and the redacted `raw` body. Prefer pretty-printed JSON when `raw` parses as JSON.

Copy still copies the markdown dossier (existing `formatDossier`). On success, set a short-lived `Copied` status on the Copy control or an adjacent polite live region (clear on next ask or after a few seconds). On failure, keep the existing alert error — never show Copied. Optionally later: copy compiled JSON from Overview — not required for this change.

### Response shape
`askProvider` / `POST /api/ask` success and failure payloads include:
- existing fields (`ok`, `id`, `label`, `model`, `latencyMs`, `text` | `error`)
- `httpStatus`: number or `null`
- `raw`: redacted upstream body string, truncated at `RAW_MAX`, never containing the API key

### Docs serving
- `GET`/`HEAD` `/docs` and `/docs/*` resolve under `docsRoot` with the same containment rules as static assets.
- Default `docsRoot`: repo `docs/` for `npm start`; for the login helper, `docs/` next to `dist/` after install copies `ask-models.md`.
- Markdown is wrapped in a minimal HTML page (`renderMarkdownDocPage`) so Safari displays text and preserves `<a id="refresh-…"></a>` fragment targets.
- Refresh links in the public provider payload use absolute paths: `/docs/ask-models.md#refresh-chatgpt`.

## Risks / Trade-offs

- [Large raw bodies] → Truncate with a clear marker; never log them.
- [Docs path escape] → `realpath` + `insideRoot`; reject `..` and absolute segments.
- [Tab clutter with five providers] → Overview first; provider tabs only for providers that have a result in the current run.

## Migration

No storage migration. After deploy, run `npm run service update` so the installed package includes `docs/ask-models.md` and the new server module.
