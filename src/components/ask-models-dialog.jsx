import { useEffect, useRef, useState } from 'react'
import { formatCompiledBundle, formatDossier, previewText, validatePrompt } from '../model-ask'
import { SafeMarkdown } from '../safe-markdown'
import { Button } from './button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from './dialog'

function mergeBilling(providers, statuses) {
  const byId = new Map((statuses || []).map((entry) => [entry.id, entry.billing]))
  return providers.map((provider) => ({
    ...provider,
    billing: byId.get(provider.id) || null,
  }))
}

function prettyRaw(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return '(empty)'
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function statusLabel(status) {
  if (status === 'asking') return 'Asking…'
  if (status === 'ok') return 'ok'
  if (status === 'failed') return 'failed'
  return ''
}

function AskStatusIcon({ status }) {
  if (status === 'asking') {
    return <span className="ask-status-icon ask-status-icon--asking" aria-hidden="true" />
  }
  if (status === 'ok') {
    return (
      <svg className="ask-status-icon ask-status-icon--ok" viewBox="0 0 16 16" aria-hidden="true">
        <path fill="currentColor" d="M6.4 11.2 3.2 8l1.13-1.13L6.4 8.93l5.27-5.26L12.8 4.8z" />
      </svg>
    )
  }
  if (status === 'failed') {
    return (
      <svg
        className="ask-status-icon ask-status-icon--failed"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M4.2 3.13 8 6.93l3.8-3.8 1.07 1.07L9.07 8l3.8 3.8-1.07 1.07L8 9.07l-3.8 3.8-1.07-1.07L6.93 8l-3.8-3.8z"
        />
      </svg>
    )
  }
  return null
}

function AskStatusBadge({ status, showLabel = true }) {
  if (!status) return null
  const label = statusLabel(status)
  return (
    <span className={`ask-status ask-status--${status}`} data-state={status}>
      <AskStatusIcon status={status} />
      {showLabel ? <span className="ask-status-label">{label}</span> : null}
    </span>
  )
}

function modelLabel(result) {
  const requested = result.model || ''
  const actual = result.actualModel || requested
  if (actual && requested && actual !== requested) return `${requested} → ${actual}`
  return actual || requested
}

function needsRefreshSteps(provider) {
  if (provider.expiryWarning) return true
  if (provider.billing?.state === 'low') return true
  return false
}

export function AskModelsDialog({ open, onClose, onManageAccounts }) {
  const [providers, setProviders] = useState([])
  const [checked, setChecked] = useState(() => new Set())
  const [modelOverrides, setModelOverrides] = useState(() => new Map())
  const [prompt, setPrompt] = useState('')
  const [results, setResults] = useState([])
  const [runStatus, setRunStatus] = useState(() => new Map())
  const [asking, setAsking] = useState(false)
  const [ready, setReady] = useState(false)
  const [formError, setFormError] = useState('')
  const [copyState, setCopyState] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [providerView, setProviderView] = useState('rendered')
  const [askedAt, setAskedAt] = useState('')
  const inflight = useRef(new Set())
  const runId = useRef(0)
  const copyTimer = useRef(0)

  useEffect(() => {
    if (!open) return undefined
    const controller = new AbortController()
    let ignore = false
    Promise.all([
      fetch('/api/providers', { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error('list failed')
        return response.json()
      }),
      fetch('/api/provider-status', { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { providers: [] }))
        .catch(() => ({ providers: [] })),
    ])
      .then(([listPayload, statusPayload]) => {
        if (ignore) return
        const list = Array.isArray(listPayload?.providers) ? listPayload.providers : []
        const withBilling = mergeBilling(list, statusPayload?.providers)
        setProviders(withBilling)
        setChecked(
          new Set(list.filter((provider) => provider.configured).map((provider) => provider.id)),
        )
        setModelOverrides(new Map(list.map((provider) => [provider.id, provider.model || ''])))
        setFormError('')
        setReady(true)
      })
      .catch((error) => {
        if (ignore || error?.name === 'AbortError') return
        setFormError('The provider list could not be loaded.')
        setReady(true)
      })
    return () => {
      ignore = true
      controller.abort()
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  function close() {
    runId.current += 1
    for (const controller of inflight.current) controller.abort()
    inflight.current.clear()
    setAsking(false)
    setCopyState('')
    onClose()
  }

  function toggle(id) {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function orderResults(list) {
    const order = new Map(providers.map((provider, index) => [provider.id, index]))
    return [...list].sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0))
  }

  function orderSelected(selected) {
    const order = new Map(providers.map((provider, index) => [provider.id, index]))
    return [...selected].sort(
      (left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0),
    )
  }

  async function ask(event) {
    event.preventDefault()
    const promptError = validatePrompt(prompt)
    if (promptError) {
      setFormError(promptError)
      return
    }
    const selected = orderSelected(
      providers.filter((provider) => provider.configured && checked.has(provider.id)),
    )
    if (!selected.length) {
      setFormError('Choose a provider.')
      return
    }
    const run = ++runId.current
    setFormError('')
    setCopyState('')
    setResults([])
    setActiveTab('overview')
    setProviderView('rendered')
    setAskedAt(new Date().toISOString())
    setAsking(true)
    setRunStatus(new Map(selected.map((provider) => [provider.id, 'asking'])))
    const controllers = selected.map(() => new AbortController())
    for (const controller of controllers) inflight.current.add(controller)

    await Promise.all(
      selected.map(async (provider, index) => {
        let nextResult
        try {
          const runtimeModel = modelOverrides.get(provider.id) || provider.model
          const askBody = { id: provider.id, prompt }
          if (runtimeModel) askBody.model = runtimeModel
          const response = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(askBody),
            signal: controllers[index].signal,
          })
          const payload = await response.json()
          if (!response.ok) {
            nextResult = {
              ok: false,
              id: provider.id,
              label: provider.label,
              model: provider.model,
              actualModel: provider.model,
              citations: [],
              httpStatus: response.status,
              raw: typeof payload?.raw === 'string' ? payload.raw : '',
              error: typeof payload?.error === 'string' ? payload.error : 'The ask was refused.',
            }
          } else {
            nextResult = {
              ...payload,
              actualModel: payload.actualModel || payload.model || provider.model,
              citations: Array.isArray(payload.citations) ? payload.citations : [],
            }
          }
        } catch (error) {
          if (error?.name === 'AbortError') return
          nextResult = {
            ok: false,
            id: provider.id,
            label: provider.label,
            model: provider.model,
            actualModel: provider.model,
            citations: [],
            httpStatus: null,
            raw: '',
            error: 'The ask failed.',
          }
        }
        if (run !== runId.current || !nextResult) return
        setResults((current) =>
          orderResults([...current.filter((item) => item.id !== nextResult.id), nextResult]),
        )
        setRunStatus((current) => {
          const next = new Map(current)
          next.set(provider.id, nextResult.ok ? 'ok' : 'failed')
          return next
        })
      }),
    )

    for (const controller of controllers) inflight.current.delete(controller)
    if (run !== runId.current) return
    setAsking(false)
  }

  async function copy() {
    const ordered = orderResults(results)
    try {
      await navigator.clipboard.writeText(formatDossier({ prompt, results: ordered }))
      setFormError('')
      setCopyState('Copied')
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopyState(''), 2500)
    } catch {
      setCopyState('')
      setFormError('The dossier could not be copied.')
    }
  }

  const selectedProviders = providers.filter((provider) => runStatus.has(provider.id))
  const settledCount = results.length
  const selectedCount = selectedProviders.length
  const pendingProviders = selectedProviders.filter(
    (provider) => runStatus.get(provider.id) === 'asking',
  )
  let progressText = ''
  if (asking) {
    if (pendingProviders.length === 1) {
      progressText = `Waiting on ${pendingProviders[0].label}…`
    } else if (pendingProviders.length === 2) {
      progressText = `Waiting on ${pendingProviders[0].label} and ${pendingProviders[1].label}…`
    } else {
      progressText = `Asking… ${settledCount} of ${selectedCount} settled`
    }
  } else if (settledCount > 0) {
    progressText = `Asked ${settledCount} provider${settledCount === 1 ? '' : 's'}.`
  }
  const showResults = selectedCount > 0
  const activeResult = results.find((result) => result.id === activeTab) || null
  const compiled = formatCompiledBundle({ prompt, results: orderResults(results), askedAt })

  return (
    <Dialog open={open} onClose={close} size="xl">
      <div className="ask-models-heading">
        <DialogTitle>Ask models</DialogTitle>
        {typeof onManageAccounts === 'function' ? (
          <button
            type="button"
            className="ask-models-settings"
            aria-label="Model accounts settings"
            title="Model accounts settings"
            onClick={() => {
              onManageAccounts()
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M11.49 3.17a.75.75 0 0 1 1.06.04l.7.84a.75.75 0 0 0 .78.25l1.06-.3a.75.75 0 0 1 .9.5l.36 1.05a.75.75 0 0 0 .52.49l1.08.27a.75.75 0 0 1 .54.9l-.3 1.06a.75.75 0 0 0 .25.78l.84.7a.75.75 0 0 1-.04 1.06l-.84.7a.75.75 0 0 0-.25.78l.3 1.06a.75.75 0 0 1-.54.9l-1.08.27a.75.75 0 0 0-.52.49l-.36 1.05a.75.75 0 0 1-.9.5l-1.06-.3a.75.75 0 0 0-.78.25l-.7.84a.75.75 0 0 1-1.06.04l-.7-.84a.75.75 0 0 0-.78-.25l-1.06.3a.75.75 0 0 1-.9-.5l-.36-1.05a.75.75 0 0 0-.52-.49l-1.08-.27a.75.75 0 0 1-.54-.9l.3-1.06a.75.75 0 0 0-.25-.78l-.84-.7a.75.75 0 0 1 .04-1.06l.84-.7a.75.75 0 0 0 .25-.78l-.3-1.06a.75.75 0 0 1 .54-.9l1.08-.27a.75.75 0 0 0 .52-.49l.36-1.05a.75.75 0 0 1 .9-.5l1.06.3a.75.75 0 0 0 .78-.25l.7-.84ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : null}
      </div>
      <form onSubmit={ask}>
        <DialogBody className="space-y-4">
          <label>
            Prompt
            <textarea
              className="ask-models-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              aria-invalid={formError ? 'true' : undefined}
              aria-describedby={formError ? 'ask-models-error' : undefined}
            />
          </label>
          <fieldset>
            <legend className="ask-providers-legend">
              <span>Providers</span>
            </legend>
            {providers.map((provider) => {
              const status = runStatus.get(provider.id) || ''
              const options = Array.isArray(provider.modelOptions) ? provider.modelOptions : []
              const selectedModel = modelOverrides.get(provider.id) || provider.model
              return (
                <div
                  key={provider.id}
                  className={`ask-provider${status ? ` ask-provider--${status}` : ''}`}
                >
                  <label className="ask-provider-check">
                    <input
                      type="checkbox"
                      checked={checked.has(provider.id)}
                      disabled={!provider.configured || asking}
                      onChange={() => toggle(provider.id)}
                    />
                    <span>{provider.label}</span>
                  </label>
                  {provider.configured ? (
                    <label className="ask-provider-model">
                      <select
                        aria-label={`Model for ${provider.label}`}
                        value={selectedModel}
                        disabled={!checked.has(provider.id) || asking}
                        onChange={(event) => {
                          const value = event.target.value
                          setModelOverrides((current) => {
                            const next = new Map(current)
                            next.set(provider.id, value)
                            return next
                          })
                        }}
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <small>Not configured</small>
                  )}
                  <small>
                    {provider.expiryWarning ? provider.expiryWarning : ''}
                    {provider.expiryWarning &&
                    (provider.billing?.state === 'ok' || provider.billing?.state === 'low') &&
                    provider.billing?.label
                      ? ' · '
                      : ''}
                    {provider.billing?.state === 'ok' || provider.billing?.state === 'low'
                      ? provider.billing.label
                      : ''}
                  </small>
                  <AskStatusBadge status={status} />
                  {needsRefreshSteps(provider) ? (
                    <a
                      className="ask-provider-doc"
                      href={provider.refreshDoc || '/docs/ask-models.md'}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Refresh steps
                    </a>
                  ) : null}
                </div>
              )
            })}
          </fieldset>
          {progressText ? (
            <p className="ask-progress" aria-live="polite">
              {progressText}
            </p>
          ) : null}
          {formError ? (
            <p id="ask-models-error" role="alert">
              {formError}
            </p>
          ) : null}
          {showResults ? (
            <div className="ask-results">
              <div className="ask-result-tabs" role="tablist" aria-label="Ask results">
                <button
                  type="button"
                  role="tab"
                  className="ask-result-tab"
                  aria-selected={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                {selectedProviders.map((provider) => {
                  const status = runStatus.get(provider.id)
                  const label = statusLabel(status)
                  const tabName = label ? `${provider.label} (${label})` : provider.label
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      role="tab"
                      className={`ask-result-tab${status ? ` ask-result-tab--${status}` : ''}`}
                      aria-selected={activeTab === provider.id}
                      aria-label={tabName}
                      onClick={() => {
                        setActiveTab(provider.id)
                        setProviderView('rendered')
                      }}
                    >
                      <AskStatusBadge status={status} showLabel={false} />
                      <span>{provider.label}</span>
                    </button>
                  )
                })}
              </div>
              {activeTab === 'overview' ? (
                <div className="ask-result-panel" role="tabpanel">
                  <ul className="ask-overview-list">
                    {selectedProviders.map((provider) => {
                      const result = results.find((item) => item.id === provider.id)
                      const status = runStatus.get(provider.id)
                      const openProvider = () => {
                        setActiveTab(provider.id)
                        setProviderView('rendered')
                      }
                      if (!result) {
                        return (
                          <li key={provider.id}>
                            <button
                              type="button"
                              className="ask-overview-item ask-overview-item--asking"
                              onClick={openProvider}
                            >
                              <span className="ask-overview-head">
                                <AskStatusBadge status={status || 'asking'} showLabel={false} />
                                <strong>{provider.label}</strong>
                                <span className="ask-overview-meta">Waiting…</span>
                              </span>
                              <span className="ask-overview-hint">Open tab</span>
                            </button>
                          </li>
                        )
                      }
                      const body = result.ok ? result.text : result.error
                      const settled = result.ok ? 'ok' : 'failed'
                      const latency = Number.isFinite(result.latencyMs)
                        ? `${Math.round(result.latencyMs / 100) / 10}s`
                        : ''
                      return (
                        <li key={provider.id}>
                          <button
                            type="button"
                            className={`ask-overview-item ask-overview-item--${settled}`}
                            onClick={openProvider}
                          >
                            <span className="ask-overview-head">
                              <AskStatusBadge status={settled} showLabel={false} />
                              <strong>{provider.label}</strong>
                              <span className="ask-overview-meta">
                                {[latency, modelLabel(result)].filter(Boolean).join(' · ')}
                              </span>
                            </span>
                            <span className="ask-overview-preview">{previewText(body, 96)}</span>
                            <span className="ask-overview-hint">
                              {result.ok ? 'Full reply' : 'Error details'}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  {settledCount > 0 ? (
                    <>
                      <h3 className="ask-overview-json-title">Compiled JSON</h3>
                      <pre className="ask-result-raw">{JSON.stringify(compiled, null, 2)}</pre>
                    </>
                  ) : null}
                </div>
              ) : runStatus.get(activeTab) === 'asking' && !activeResult ? (
                <div className="ask-result-panel ask-result-panel--asking" role="tabpanel">
                  <p className="ask-result-meta">
                    <AskStatusBadge status="asking" />
                  </p>
                  <p className="ask-result-pending">Waiting for this provider to settle.</p>
                </div>
              ) : activeResult ? (
                <div className="ask-result-panel" role="tabpanel">
                  <div
                    className="ask-result-views"
                    role="tablist"
                    aria-label={`${activeResult.label} view`}
                  >
                    <button
                      type="button"
                      role="tab"
                      className="ask-result-tab"
                      aria-selected={providerView === 'rendered'}
                      onClick={() => setProviderView('rendered')}
                    >
                      Rendered
                    </button>
                    <button
                      type="button"
                      role="tab"
                      className="ask-result-tab"
                      aria-selected={providerView === 'raw'}
                      onClick={() => setProviderView('raw')}
                    >
                      Raw
                    </button>
                  </div>
                  {providerView === 'rendered' ? (
                    <div>
                      <p className="ask-result-meta">
                        {activeResult.ok ? 'ok' : 'failed'} · {modelLabel(activeResult)}
                        {Number.isFinite(activeResult.latencyMs)
                          ? ` · ${activeResult.latencyMs}ms`
                          : ''}
                      </p>
                      {activeResult.ok ? (
                        <SafeMarkdown text={activeResult.text} />
                      ) : (
                        <pre className="ask-result-body">{activeResult.error}</pre>
                      )}
                      {activeResult.ok &&
                      Array.isArray(activeResult.citations) &&
                      activeResult.citations.length ? (
                        <div className="ask-citations">
                          <h4>Citations</h4>
                          <ol>
                            {activeResult.citations.map((citation) => (
                              <li key={`${citation.id}-${citation.url}`}>
                                <a href={citation.url} target="_blank" rel="noreferrer">
                                  [{citation.id}] {citation.title}
                                </a>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <p className="ask-result-meta">
                        HTTP{' '}
                        {Number.isFinite(activeResult.httpStatus)
                          ? activeResult.httpStatus
                          : 'none'}
                      </p>
                      <pre className="ask-result-raw">{prettyRaw(activeResult.raw)}</pre>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogBody>
        <DialogActions>
          <Button outline onClick={close}>
            Close
          </Button>
          <Button outline type="button" onClick={copy} disabled={results.length === 0}>
            {copyState === 'Copied' ? 'Copied' : 'Copy'}
          </Button>
          <Button type="submit" disabled={asking || !ready}>
            {asking ? 'Asking…' : 'Ask'}
          </Button>
        </DialogActions>
        {copyState === 'Copied' ? (
          <p className="ask-copy-status" aria-live="polite">
            Dossier copied to the clipboard.
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}
