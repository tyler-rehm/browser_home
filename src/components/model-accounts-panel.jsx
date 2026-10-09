import { useEffect, useState } from 'react'

function IconBalance() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 1.5a3.5 3.5 0 0 0-3.5 3.5v.75H3.25A1.25 1.25 0 0 0 2 7v5.75C2 13.99 3.01 15 4.25 15h7.5C12.99 15 14 13.99 14 12.75V7c0-.69-.56-1.25-1.25-1.25H11.5V5A3.5 3.5 0 0 0 8 1.5Zm2.25 3.25V5h-4.5v-.25a2.25 2.25 0 1 1 4.5 0ZM3.25 6.75h9.5v6c0 .14-.11.25-.25.25h-7.5a.25.25 0 0 1-.25-.25v-6Z"
      />
    </svg>
  )
}

function IconConsole() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.5 3A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13h9a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 3h-9Zm.75 2.25h1.5l1.5 2-1.5 2h-1.5l1.5-2-1.5-2Zm4 3.5h3.5v1.25h-3.5V8.75Z"
      />
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 2.5a5.5 5.5 0 0 0-4.7 2.65V3.75H2.05v3.7h3.7V6.2H4.3A4.25 4.25 0 1 1 3.75 8H2.5A5.5 5.5 0 1 0 8 2.5Z"
      />
    </svg>
  )
}

function ActionLink({ href, label, icon }) {
  if (!href) return null
  return (
    <a className="model-accounts-action" href={href} target="_blank" rel="noreferrer">
      {icon}
      <span>{label}</span>
    </a>
  )
}

export function ModelAccountsPanel({ active = true, compact = false }) {
  const [providers, setProviders] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')

  useEffect(() => {
    if (!active) return undefined
    const controller = new AbortController()
    let ignore = false

    async function load() {
      setReady(false)
      setError('')
      try {
        const response = await fetch('/api/providers', { signal: controller.signal })
        if (!response.ok) throw new Error('list failed')
        const payload = await response.json()
        if (ignore) return
        setProviders(Array.isArray(payload?.providers) ? payload.providers : [])
        setError('')
      } catch (loadError) {
        if (ignore || loadError?.name === 'AbortError') return
        setError('Model account status could not be loaded.')
      } finally {
        if (!ignore) setReady(true)
      }
    }

    load()
    return () => {
      ignore = true
      controller.abort()
    }
  }, [active])

  async function saveModel(providerId, model) {
    setSavingId(providerId)
    setError('')
    try {
      const response = await fetch('/api/provider-model', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: providerId, model }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof payload?.error === 'string' ? payload.error : 'Could not save model.')
        return
      }
      setProviders(Array.isArray(payload?.providers) ? payload.providers : [])
    } catch {
      setError('Could not save model.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <section
      className={`model-accounts${compact ? ' model-accounts--compact' : ''}`}
      aria-labelledby="model-accounts-title"
    >
      <div className="model-accounts-header">
        <p id="model-accounts-title" className="model-accounts-note">
          Keys stay in Keychain or the local secrets file. Vendors do not expose remaining credit to
          ordinary API keys — use Balance or Console to check in the vendor site.{' '}
          <a href="/docs/ask-models.md" target="_blank" rel="noreferrer">
            Ask models docs
          </a>
        </p>
      </div>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      <ul className="model-accounts-list">
        {providers.map((provider) => {
          const options = Array.isArray(provider.modelOptions) ? provider.modelOptions : []
          return (
            <li key={provider.id} className="model-accounts-row">
              <div className="model-accounts-identity">
                <strong>{provider.label}</strong>
                <span className="model-accounts-meta">
                  {provider.configured ? (
                    <label className="model-accounts-model">
                      <select
                        aria-label={`Default model for ${provider.label}`}
                        value={provider.model}
                        disabled={savingId === provider.id}
                        onChange={(event) => saveModel(provider.id, event.target.value)}
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    'Not configured'
                  )}
                  {provider.expiryWarning ? (
                    <span className="model-accounts-expiry"> · {provider.expiryWarning}</span>
                  ) : null}
                </span>
              </div>
              <span className="model-accounts-links">
                <ActionLink href={provider.billingUrl} label="Balance" icon={<IconBalance />} />
                <ActionLink href={provider.billingUrl} label="Console" icon={<IconConsole />} />
                <ActionLink
                  href={provider.refreshDoc || '/docs/ask-models.md'}
                  label="Refresh"
                  icon={<IconRefresh />}
                />
              </span>
            </li>
          )
        })}
      </ul>
      {!ready && providers.length === 0 ? (
        <p className="model-accounts-note">Loading providers…</p>
      ) : null}
    </section>
  )
}
