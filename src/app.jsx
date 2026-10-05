import { useEffect, useState } from 'react'
import { AddLinkDialog } from './components/add-link-dialog'
import { PreferencesDialog } from './components/preferences-dialog'
import { DEFAULT_LINKS, DEFAULT_PREFERENCES, TOOLS } from './data'
import { ensureContrast, readableForeground } from './color'
import { downloadText } from './download'
import { parseImport, serializeBackup } from './backup'
import { host, searchDestination, LIMITS } from './records'
import { APP_KEYS, KEYS, removeKeys, writeText } from './persistence'
import { loadHomepage } from './state'

function fillsFor(prefs, index) {
  return [prefs.ink, prefs.secondary, prefs.accent, prefs.ink][index % 4]
}

export function App() {
  const [initial] = useState(() => loadHomepage(localStorage))
  const [links, setLinks] = useState(initial.links)
  const [notes, setNotes] = useState(initial.notes)
  const [prefs, setPrefs] = useState(initial.preferences)
  const [recovery, setRecovery] = useState(initial.recovery)
  const [storageError, setStorageError] = useState('')
  const [notesSaved, setNotesSaved] = useState(!initial.preserveNotes)
  const [searchError, setSearchError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const style = document.documentElement.style
    style.setProperty('--paper', prefs.paper)
    style.setProperty('--ink', prefs.ink)
    style.setProperty('--orange', prefs.accent)
    style.setProperty('--green', prefs.secondary)
    style.setProperty('--accent-text', ensureContrast(prefs.accent, prefs.paper))
    style.setProperty('--display-font', `'${prefs.font}', sans-serif`)
  }, [prefs])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
        return
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
        return
      event.preventDefault()
      document.querySelector('#search-input')?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function remember(result) {
    if (result.ok) {
      setStorageError('')
      return true
    }
    setStorageError(
      'This change is only in this tab. Browser storage did not save it. Export a backup before you close the page.',
    )
    return false
  }

  function changeLinks(next) {
    setLinks(next)
    remember(writeText(localStorage, KEYS.links, JSON.stringify(next)))
  }

  function changeNotes(next) {
    const bounded = next.slice(0, LIMITS.noteLength)
    setNotes(bounded)
    setNotesSaved(remember(writeText(localStorage, KEYS.notes, bounded)))
  }

  function changePrefs(next) {
    setPrefs(next)
    remember(writeText(localStorage, KEYS.preferences, JSON.stringify(next)))
  }

  function addLink(link) {
    if (links.length >= LIMITS.linkCount) return { ok: false, error: 'There are too many links' }
    changeLinks([...links, link])
    return { ok: true }
  }

  function exportBackup() {
    downloadText('code-home-backup.json', serializeBackup({ links, notes, preferences: prefs }))
  }

  async function importBackup(file) {
    if (file.size > LIMITS.importBytes) return 'That file is too large.'
    const result = parseImport(await file.text())
    if (!result.ok) return result.error
    if (result.kind === 'legacy') {
      changePrefs(result.preferences)
      return ''
    }
    setLinks(result.links)
    setNotes(result.notes)
    setPrefs(result.preferences)
    const writes = [
      writeText(localStorage, KEYS.links, JSON.stringify(result.links)),
      writeText(localStorage, KEYS.notes, result.notes),
      writeText(localStorage, KEYS.preferences, JSON.stringify(result.preferences)),
    ]
    if (writes.some((write) => !write.ok)) {
      setNotesSaved(false)
      setStorageError(
        'The backup is loaded in this tab, but browser storage did not save all of it. Export it before closing.',
      )
    } else {
      setNotesSaved(true)
      setStorageError('')
      setRecovery([])
    }
    return ''
  }

  function resetApplication() {
    const removed = removeKeys(localStorage, APP_KEYS)
    if (!removed.ok) {
      setStorageError('Reset did not finish. Saved data was left in place.')
      return false
    }
    setLinks(DEFAULT_LINKS)
    setNotes('')
    setPrefs({ ...DEFAULT_PREFERENCES })
    setRecovery([])
    setStorageError('')
    setNotesSaved(true)
    return true
  }

  function search(event) {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('query')
    try {
      const destination = searchDestination(typeof query === 'string' ? query : '')
      if (!destination) return
      setSearchError('')
      window.location.assign(destination)
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'That search could not be opened.')
    }
  }

  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const notices = [...recovery, storageError].filter(Boolean)

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <main>
        <header className="topbar">
          <a className="brand" href="./" aria-label="Home">
            <span className="brand-mark">C</span>
            <span>code / home</span>
          </a>
          <div className="top-actions">
            <div className="date-wrap">
              <span>
                {new Intl.DateTimeFormat('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }).format(now)}
              </span>
              <span className="dot">•</span>
              <span>
                {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(
                  now,
                )}
              </span>
            </div>
            <button
              className="palette-button"
              aria-label="Customize colors and fonts"
              title="Customize"
              onClick={() => setPrefsOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 0-3.6h-.7a1.5 1.5 0 0 1 0-3H15A6 6 0 0 0 15 3h-3Z" />
                <circle cx="7.6" cy="10.4" r=".8" />
                <circle cx="9.5" cy="6.9" r=".8" />
                <circle cx="14" cy="6.6" r=".8" />
              </svg>
            </button>
          </div>
        </header>
        {notices.length ? (
          <div role="alert" className="banner">
            <p>{notices[0]}</p>
            <button type="button" onClick={exportBackup}>
              Export backup
            </button>
          </div>
        ) : null}
        <section className="hero">
          <p className="eyebrow">YOUR WORKSPACE, ONE TAB</p>
          <h1>{greeting}.</h1>
          <form className="search" role="search" onSubmit={search}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              id="search-input"
              name="query"
              autoComplete="off"
              autoFocus
              placeholder="Search the web or type a URL"
              aria-label="Search the web or type a URL"
              aria-invalid={searchError ? 'true' : undefined}
              aria-describedby={searchError ? 'search-error' : undefined}
            />
            <kbd>/</kbd>
          </form>
          {searchError ? (
            <p id="search-error" role="alert" className="search-error">
              {searchError}
            </p>
          ) : null}
        </section>
        <section className="section-head">
          <div>
            <p className="eyebrow">QUICK ACCESS</p>
            <h2>Where to?</h2>
          </div>
          <button className="text-button" type="button" onClick={() => setAddOpen(true)}>
            + Add link
          </button>
        </section>
        <section className="link-grid" aria-label="Quick links">
          {links.map((link, index) => {
            const fill = fillsFor(prefs, index)
            return (
              <div className="link-card" key={`${link.url}-${link.name}`}>
                <a className="link-open" href={link.url}>
                  <span
                    className="link-icon"
                    style={{ background: fill, color: readableForeground(fill) }}
                  >
                    {link.short || link.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="link-copy">
                    <strong>{link.name}</strong>
                    <small>{host(link.url)}</small>
                  </span>
                  <span className="arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
                <button
                  className="remove-link"
                  type="button"
                  aria-label={`Remove ${link.name}`}
                  onClick={() => changeLinks(links.filter((_, item) => item !== index))}
                >
                  ×
                </button>
              </div>
            )
          })}
        </section>
        <section className="lower-grid">
          <article className="panel commands-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">LAUNCH PAD</p>
                <h2>Useful tools</h2>
              </div>
              <span className="status">
                <i /> ready
              </span>
            </div>
            <div className="tool-list">
              {TOOLS.map((tool, index) => (
                <a className="tool" href={tool.url} key={tool.url}>
                  <span className="tool-number">0{index + 1}</span>
                  <strong>{tool.name}</strong>
                  <small>{tool.detail} ↗</small>
                </a>
              ))}
            </div>
          </article>
          <article className="panel notes-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SCRATCHPAD</p>
                <h2>Keep a thought</h2>
              </div>
              <span className="save-status">{notesSaved ? 'saved locally' : 'not saved'}</span>
            </div>
            <textarea
              aria-label="Scratchpad"
              placeholder="Paste a command, leave a reminder, sketch an idea…"
              maxLength={LIMITS.noteLength}
              value={notes}
              onChange={(event) => changeNotes(event.target.value)}
            />
          </article>
        </section>
      </main>
      <AddLinkDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={addLink} />
      <PreferencesDialog
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        prefs={prefs}
        onChange={changePrefs}
        onImport={importBackup}
        onExport={exportBackup}
        onReset={resetApplication}
      />
    </>
  )
}
