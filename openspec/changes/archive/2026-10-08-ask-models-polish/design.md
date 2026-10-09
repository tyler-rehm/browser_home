# Design

## Context

Findings from a 2026-10-08 live run (Tailwind Pro alternatives prompt): ChatGPT billed as “No API credits remaining” while `ok`; Gemini still Asking with no result tab; Overview + Compiled JSON repeated full answers and megabyte-scale Anthropic `raw` (thinking signatures); Rendered showed `###` as plain text; UI model `grok-3` vs raw `grok-4.3`; Perplexity `[4]`/`[6]` without links; footer Ask button stuck on Asking….

Active change `ask-models-results-ui` delivered tabs, progress, docs, and copy feedback. This change polishes trust and density on top of that UI.

## Goals / Non-Goals

- Goals: trustworthy billing labels; clear pending/timeout UX; scannable Overview; safe-size compiled JSON; useful Rendered view (markdown + citations); honest model ids.
- Non-Goals: streaming; full CommonMark; cost dashboards; automatic credit purchase; Router migration.

## Decisions

### Billing honesty
- OpenAI: only report `low` with a numeric remaining balance under $1, or when an **ask** failure body clearly indicates insufficient quota/credits. A failed `credit_grants` (or similar) GET with HTML/JSON mentioning “billing” SHALL be `unknown`, not `low`.
- Anthropic and others: keep unknown when no balance API; do not treat generic org-endpoint failures as low.
- Refresh-steps link: show for expiry warning, true `low`, or after an ask failure whose error indicates credits/quota—not for unknown.

### Pending tabs and progress
- As soon as a run starts, create a result-tab placeholder (or include pending providers in the tablist) for each selected provider, labeled with Asking… until settled.
- Overall progress names remaining providers when few are left (e.g. `Waiting on Gemini…` or `Asking… 4 of 5 settled (Gemini)`).
- On timeout, settle that provider as failed with `Timed out` (existing server behavior) and clear Asking on that row/tab.
- Close continues to abort all in-flight requests.

### Overview and compiled JSON
- Overview list: provider name, ok/failed, model (requested → actual if different), latency, one-line preview (~160 chars), not the full reply.
- `formatCompiledBundle`: include prompt, askedAt, and per-result fields needed for comparison (`ok`, models, latency, httpStatus, text/error). Omit `raw` from the compiled bundle, or replace with a short truncated preview (≤512 chars) plus `rawOmitted: true`. Full redacted `raw` remains on the Raw tab only.

### Rendered markdown
- Use a minimal, dependency-light approach already acceptable to the repo (e.g. a tiny local renderer for headings, lists, bold/italic, links, and fenced code)—or `dangerouslySetInnerHTML` only after sanitizing a small allowlist. No new heavy markdown stack unless already present. Prefer plain enhancement over full GFM tables if that keeps the diff small; Grok’s comparison table MAY render as a preformatted block if tables are out of reach.

### Actual model id
- When parsing success payloads, extract upstream model if present (`payload.model` for OpenAI-shaped and Anthropic message; Perplexity Agent `model` field).
- Public result includes `model` (requested) and `actualModel` when different (or always set `actualModel` to requested when absent).
- Dialog shows `actualModel` when set and different: e.g. `grok-3 → grok-4.3`.

### Perplexity citations
- From Agent `output` items of type `search_results`, collect `{ id, title, url }` (and snippet optional).
- Attach `citations: [{ id, title, url }]` on the Ask result when present.
- Rendered view lists them under the answer (linked titles). Citation markers in text MAY stay as `[n]` with the list below.

## Risks / Trade-offs

- [False unknown instead of low] → Prefer under-alerting; ask failures still surface real quota errors.
- [Markdown XSS] → Allowlist tags/attrs only; default escape.
- [Huge raw still on Raw tab] → Keep `RAW_MAX` truncation; Overview no longer duplicates it.

## Migration

No storage migration. Re-run a five-provider ask after apply and confirm ChatGPT is not falsely low when asks succeed.
