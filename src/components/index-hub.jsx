import { useState } from 'react'
import { HUB_DB_PORTS, HUB_DOCS, HUB_LOCATIONS, HUB_SECTIONS, HUB_TOOLS } from '../hub-index'

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

async function openLocalApp(app) {
  const response = await fetch('/api/open-app', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ app }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Could not open ${app}`)
  }
}

function SectionTabs({ section, onSelect }) {
  return (
    <div className="link-tabs hub-section-tabs" role="tablist" aria-label="Index sections">
      {HUB_SECTIONS.map((item) => (
        <button
          key={item.id}
          id={`hub-tab-${item.id}`}
          className="link-tab"
          type="button"
          role="tab"
          aria-selected={section === item.id}
          aria-controls={`hub-panel-${item.id}`}
          tabIndex={section === item.id ? 0 : -1}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function ToolsPanel({ linkTarget, onStatus }) {
  return (
    <div className="hub-list">
      {HUB_TOOLS.map((tool, index) => {
        const number = String(index + 1).padStart(2, '0')
        if (tool.action === 'url') {
          return (
            <a className="tool hub-row" href={tool.url} key={tool.name} {...linkTarget}>
              <span className="tool-number">{number}</span>
              <strong>{tool.name}</strong>
              <small>{tool.detail} ↗</small>
            </a>
          )
        }
        if (tool.action === 'open-app') {
          return (
            <div className="tool hub-row hub-row-action" key={tool.name}>
              <span className="tool-number">{number}</span>
              <div className="hub-row-copy">
                <strong>{tool.name}</strong>
                <small>{tool.detail}</small>
              </div>
              <div className="hub-row-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={async () => {
                    try {
                      await openLocalApp(tool.app)
                      onStatus(`Opened ${tool.app}`)
                    } catch {
                      const copied = await copyText(tool.command)
                      onStatus(
                        copied
                          ? `Server could not open ${tool.app}. Copied: ${tool.command}`
                          : `Run in Terminal: ${tool.command}`,
                      )
                    }
                  }}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={async () => {
                    const copied = await copyText(tool.command)
                    onStatus(copied ? `Copied ${tool.command}` : tool.command)
                  }}
                >
                  Copy command
                </button>
              </div>
            </div>
          )
        }
        return (
          <div className="tool hub-row hub-row-action" key={tool.name}>
            <span className="tool-number">{number}</span>
            <div className="hub-row-copy">
              <strong>{tool.name}</strong>
              <small>{tool.detail}</small>
            </div>
            <div className="hub-row-actions">
              <button
                type="button"
                className="text-button"
                onClick={async () => {
                  const copied = await copyText(tool.command)
                  onStatus(copied ? `Copied ${tool.command}` : tool.command)
                }}
              >
                Copy command
              </button>
              {tool.path ? (
                <button
                  type="button"
                  className="text-button"
                  onClick={async () => {
                    const copied = await copyText(tool.path)
                    onStatus(copied ? 'Copied script path' : tool.path)
                  }}
                >
                  Copy path
                </button>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DocsPanel({ linkTarget, onStatus }) {
  return (
    <div className="hub-list">
      {HUB_DOCS.map((doc, index) => (
        <div className="tool hub-row hub-row-action" key={doc.href}>
          <span className="tool-number">{String(index + 1).padStart(2, '0')}</span>
          <div className="hub-row-copy">
            <strong>{doc.name}</strong>
            <small>{doc.file}</small>
          </div>
          <div className="hub-row-actions">
            <a
              className="text-button"
              href={doc.href}
              {...linkTarget}
              aria-label={`Open ${doc.name}`}
            >
              Open
            </a>
            <button
              type="button"
              className="text-button"
              onClick={async () => {
                const copied = await copyText(doc.href)
                onStatus(copied ? `Copied ${doc.href}` : doc.href)
              }}
            >
              Copy link
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function LocationsPanel({ onStatus }) {
  return (
    <div className="hub-list">
      {HUB_LOCATIONS.map((place, index) => (
        <div className="tool hub-row hub-row-action" key={place.path}>
          <span className="tool-number">{String(index + 1).padStart(2, '0')}</span>
          <div className="hub-row-copy">
            <strong>{place.name}</strong>
            <small>
              {place.label} · <code className="hub-path">{place.path}</code>
            </small>
          </div>
          <div className="hub-row-actions">
            <button
              type="button"
              className="text-button"
              onClick={async () => {
                const copied = await copyText(place.path)
                onStatus(copied ? `Copied ${place.name} path` : place.path)
              }}
            >
              Copy path
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PortsPanel() {
  return (
    <div className="hub-ports">
      <p className="hub-note">
        Same labeled ports as the overnight DB dashboard. No passwords — pull from Keychain or
        project `.env` locally.
      </p>
      <table className="archive-table hub-ports-table">
        <caption>Local DB ports</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Engine</th>
            <th scope="col">Host</th>
            <th scope="col">Port</th>
            <th scope="col">Database</th>
            <th scope="col">User</th>
          </tr>
        </thead>
        <tbody>
          {HUB_DB_PORTS.map((row) => (
            <tr key={row.port}>
              <td>{row.label}</td>
              <td>{row.engine}</td>
              <td>
                <code>{row.host}</code>
              </td>
              <td>
                <strong>{row.port}</strong>
              </td>
              <td>
                <code>{row.database}</code>
              </td>
              <td>
                <code>{row.user}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hub-note">
        Pin stack: <code>~/Projects/local-db-forwards/dbeaver-db-forwards.sh up</code>
      </p>
    </div>
  )
}

export function IndexHub({ linkTarget }) {
  const [section, setSection] = useState('tools')
  const [status, setStatus] = useState('')

  function onStatus(message) {
    setStatus(message)
  }

  return (
    <section className="index-hub" aria-label="Index hub">
      <div className="section-head">
        <div>
          <p className="eyebrow">INDEX</p>
          <h2>Work surfaces</h2>
        </div>
        <p className="hub-status" aria-live="polite">
          {status}
        </p>
      </div>
      <SectionTabs section={section} onSelect={setSection} />
      <div
        id={`hub-panel-${section}`}
        role="tabpanel"
        aria-labelledby={`hub-tab-${section}`}
        className="hub-panel"
      >
        {section === 'tools' ? <ToolsPanel linkTarget={linkTarget} onStatus={onStatus} /> : null}
        {section === 'docs' ? <DocsPanel linkTarget={linkTarget} onStatus={onStatus} /> : null}
        {section === 'locations' ? <LocationsPanel onStatus={onStatus} /> : null}
        {section === 'ports' ? <PortsPanel /> : null}
      </div>
    </section>
  )
}
