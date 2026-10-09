import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { useEffect, useRef, useState } from 'react'
import { LinkDialog } from './components/add-link-dialog'
import { AskModelsDialog } from './components/ask-models-dialog'
import { Button } from './components/button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from './components/dialog'
import { GroupDialog } from './components/group-dialog'
import { ImportLinksDialog } from './components/import-links-dialog'
import { PreferencesDialog, SettingsDialog } from './components/preferences-dialog'
import { DroppableTab, QuickLinkOverlay, SortableQuickLink } from './components/quick-link-card'
import { DEFAULT_LINKS, DEFAULT_PREFERENCES, TOOLS } from './data'
import { ensureContrast } from './color'
import { downloadText } from './download'
import { parseImport, serializeBackup } from './backup'
import { parseLinkImport } from './link-import'
import {
  host,
  reorderLinks,
  searchDestination,
  LIMITS,
  activeLinks,
  archivedLinks,
  filterLinks,
  linksInView,
  pageOf,
  validateGroupName,
  withLinkIds,
} from './records'
import { APP_KEYS, KEYS, removeKeys, writeText } from './persistence'
import { loadHomepage } from './state'

function stripGroup(link) {
  if (!link.groupId) return link
  const next = { ...link }
  delete next.groupId
  return next
}

function outboundLinkProps(openInNewTab) {
  if (!openInNewTab) return {}
  return { target: '_blank', rel: 'noopener noreferrer' }
}

function archiveLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function preferTabCollision(args) {
  const tabs = pointerWithin(args).filter((hit) => String(hit.id).startsWith('tab:'))
  if (tabs.length > 0) return tabs
  return closestCenter(args)
}

const dragInstructions = {
  draggable: 'Drag the grip to move a link. Arrow keys on the grip also change its order.',
}

const dragAnnouncements = {
  onDragStart() {
    return undefined
  },
  onDragOver() {
    return undefined
  },
  onDragEnd() {
    return undefined
  },
  onDragCancel() {
    return undefined
  },
}

export function App() {
  const [initial] = useState(() => loadHomepage(localStorage))
  const [links, setLinks] = useState(initial.links)
  const [groups, setGroups] = useState(initial.groups)
  const [notes, setNotes] = useState(initial.notes)
  const [prefs, setPrefs] = useState(initial.preferences)
  const [recovery, setRecovery] = useState(initial.recovery)
  const [storageError, setStorageError] = useState('')
  const [noteStatus, setNoteStatus] = useState('')
  const saveTimer = useRef(null)
  const [searchError, setSearchError] = useState('')
  const [editor, setEditor] = useState(null)
  const [reorderNote, setReorderNote] = useState('')
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState('')
  const [askOpen, setAskOpen] = useState(false)
  const [linkImport, setLinkImport] = useState(null)
  const [now, setNow] = useState(() => new Date())
  const [view, setView] = useState('all')
  const [page, setPage] = useState(1)
  const [linkQuery, setLinkQuery] = useState('')
  const [groupEditor, setGroupEditor] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [draggedId, setDraggedId] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

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

  useEffect(
    () => () => {
      clearTimeout(saveTimer.current)
      document.body.classList.remove('is-link-drag')
    },
    [],
  )

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
    const saved = remember(writeText(localStorage, KEYS.notes, bounded))
    setNoteStatus(saved ? 'saved locally' : 'not saved')
    clearTimeout(saveTimer.current)
    if (saved) saveTimer.current = setTimeout(() => setNoteStatus(''), 1600)
  }

  function changePrefs(next) {
    setPrefs(next)
    remember(writeText(localStorage, KEYS.preferences, JSON.stringify(next)))
  }

  function saveLink(link) {
    const record = link.id ? link : { ...link, id: globalThis.crypto.randomUUID() }
    if (editor?.index == null) {
      if (links.length >= LIMITS.linkCount) return { ok: false, error: 'There are too many links' }
      const next = [record, ...links]
      changeLinks(next)
      setLinkQuery('')
      setView('all')
      setArchiveOpen(false)
      setPage(1)
      return { ok: true }
    }
    const next = links.slice()
    next[editor.index] = record
    changeLinks(next)
    return { ok: true }
  }

  function createGroup(name) {
    const result = validateGroupName(name, groups)
    if (!result.ok) return result
    const group = { id: globalThis.crypto.randomUUID(), name: result.value }
    const next = [...groups, group]
    setGroups(next)
    if (!remember(writeText(localStorage, KEYS.groups, JSON.stringify(next)))) {
      return { ok: false, error: 'Browser storage did not save that group.' }
    }
    return { ok: true, group }
  }

  function renameGroup(id, name) {
    const result = validateGroupName(name, groups, { ignoreId: id })
    if (!result.ok) return result
    const next = groups.map((group) => (group.id === id ? { ...group, name: result.value } : group))
    setGroups(next)
    if (!remember(writeText(localStorage, KEYS.groups, JSON.stringify(next)))) {
      return { ok: false, error: 'Browser storage did not save that group.' }
    }
    return { ok: true }
  }

  function deleteGroup(id) {
    const nextGroups = groups.filter((group) => group.id !== id)
    const groupWrite = writeText(localStorage, KEYS.groups, JSON.stringify(nextGroups))
    if (!groupWrite.ok) {
      remember(groupWrite)
      return
    }
    setGroups(nextGroups)
    if (view === id) setView('all')
    const nextLinks = links.map((link) => (link.groupId === id ? stripGroup(link) : link))
    const linkWrite = writeText(localStorage, KEYS.links, JSON.stringify(nextLinks))
    if (!linkWrite.ok) {
      remember(linkWrite)
      return
    }
    setLinks(nextLinks)
    remember(linkWrite)
  }

  function selectView(next) {
    setView(next)
    setPage(1)
  }

  function moveLink(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return
    const from = links.findIndex((link) => link.id === fromId)
    const to = links.findIndex((link) => link.id === toId)
    if (from < 0 || to < 0) return
    const moved = links[from]
    const neighbor = links[to]
    changeLinks(reorderLinks(links, from, to))
    setReorderNote(
      neighbor
        ? `${moved.name} moved ${from > to ? 'before' : 'after'} ${neighbor.name}`
        : `${moved.name} moved`,
    )
  }

  function assignDropped(id, target) {
    if (!id) return
    const current = links.find((link) => link.id === id)
    if (!current) return
    if (target === 'favorites') {
      changeLinks(links.map((link) => (link.id === id ? { ...link, favorite: true } : link)))
      setReorderNote(`${current.name} added to Favorites`)
      return
    }
    if (target === 'all') {
      changeLinks(links.map((link) => (link.id === id ? stripGroup(link) : link)))
      setReorderNote(`${current.name} removed from its group`)
      return
    }
    const group = groups.find((item) => item.id === target)
    changeLinks(links.map((link) => (link.id === id ? { ...link, groupId: target } : link)))
    setReorderNote(`${current.name} moved to ${group?.name ?? 'a group'}`)
  }

  function onDragStart(event) {
    document.body.classList.add('is-link-drag')
    setDraggedId(String(event.active.id))
  }

  function onDragCancel() {
    document.body.classList.remove('is-link-drag')
    setDraggedId(null)
  }

  function onDragEnd(event) {
    document.body.classList.remove('is-link-drag')
    setDraggedId(null)
    const { active, over } = event
    if (!over) return
    const overId = String(over.id)
    if (overId.startsWith('tab:')) {
      assignDropped(String(active.id), overId.slice(4))
      return
    }
    moveLink(String(active.id), overId)
  }

  function onTabsKeyDown(event) {
    const order = ['favorites', 'all', ...groups.map((group) => group.id)]
    const current = order.indexOf(view)
    if (current < 0) return
    const nextIndex =
      event.key === 'ArrowRight'
        ? (current + 1) % order.length
        : event.key === 'ArrowLeft'
          ? (current - 1 + order.length) % order.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? order.length - 1
              : null
    if (nextIndex == null) return
    event.preventDefault()
    const next = order[nextIndex]
    selectView(next)
    globalThis.queueMicrotask(() => document.getElementById(`tab-${next}`)?.focus())
  }

  function saveGroup(name) {
    if (groupEditor?.group) return renameGroup(groupEditor.group.id, name)
    const result = createGroup(name)
    if (result.ok) selectView(result.group.id)
    return result
  }

  function exportBackup() {
    downloadText(
      'code-home-backup.json',
      serializeBackup({ links, groups, notes, preferences: prefs }),
    )
  }

  async function importBackup(file) {
    if (file.size > LIMITS.importBytes) return 'That file is too large.'
    const result = parseImport(await file.text())
    if (!result.ok) return result.error
    if (result.kind === 'legacy') {
      changePrefs(result.preferences)
      return ''
    }
    const nextLinks = withLinkIds(result.links)
    const nextGroups = result.groups || []
    setLinks(nextLinks)
    setGroups(nextGroups)
    setNotes(result.notes)
    setPrefs(result.preferences)
    setView('all')
    setLinkQuery('')
    setPage(1)
    const writes = [
      writeText(localStorage, KEYS.links, JSON.stringify(nextLinks)),
      writeText(localStorage, KEYS.groups, JSON.stringify(nextGroups)),
      writeText(localStorage, KEYS.notes, result.notes),
      writeText(localStorage, KEYS.preferences, JSON.stringify(result.preferences)),
    ]
    if (writes.some((write) => !write.ok)) {
      clearTimeout(saveTimer.current)
      setNoteStatus('not saved')
      setStorageError(
        'The backup is loaded in this tab, but browser storage did not save all of it. Export it before closing.',
      )
    } else {
      clearTimeout(saveTimer.current)
      setNoteStatus('')
      setStorageError('')
      setRecovery([])
    }
    return ''
  }

  async function stageLinkImport(file) {
    if (file.size > LIMITS.bookmarkImportBytes) return 'That file is too large.'
    let text
    try {
      text = await file.text()
    } catch {
      return 'That file could not be read.'
    }
    const result = parseLinkImport(text)
    if (!result.ok) return result.error
    setLinkImport(result)
    setSettingsOpen(false)
    return ''
  }

  function applyImportedLinks(nextLinks, nextGroups) {
    setLinks(nextLinks)
    setGroups(nextGroups)
    setView('all')
    setLinkQuery('')
    setPage(1)
    setArchiveOpen(false)
    const writes = [
      writeText(localStorage, KEYS.links, JSON.stringify(nextLinks)),
      writeText(localStorage, KEYS.groups, JSON.stringify(nextGroups)),
    ]
    if (writes.some((write) => !write.ok)) {
      setStorageError(
        'The links are loaded in this tab, but browser storage did not save them. Export a backup before closing.',
      )
    } else {
      setStorageError('')
      setRecovery([])
    }
    setLinkImport(null)
    return ''
  }

  function resetApplication() {
    const removed = removeKeys(localStorage, APP_KEYS)
    if (!removed.ok) {
      setStorageError('Reset did not finish. Saved data was left in place.')
      return false
    }
    setLinks(withLinkIds(DEFAULT_LINKS))
    setGroups([])
    setNotes('')
    setPrefs({ ...DEFAULT_PREFERENCES })
    setView('all')
    setLinkQuery('')
    setPage(1)
    setRecovery([])
    setStorageError('')
    clearTimeout(saveTimer.current)
    setNoteStatus('')
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
  const filtering = linkQuery.trim().length > 0
  const selectedGroup = groups.find((group) => group.id === view) || null
  const shownLinks = activeLinks(links)
  const archived = archivedLinks(links)
  const viewLinks = filtering
    ? filterLinks(shownLinks, groups, linkQuery)
    : linksInView(shownLinks, groups, view)
  const linkTarget = outboundLinkProps(prefs.openInNewTab)
  const paged = pageOf(viewLinks, page)
  const draggedLink = links.find((link) => link.id === draggedId) || null
  const activeTabId = filtering ? 'tab-results' : `tab-${view}`
  const emptyCopy = filtering
    ? 'No matching links'
    : view === 'favorites'
      ? 'No favorites yet'
      : selectedGroup
        ? 'No links in this group'
        : 'No links yet'

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="grain" aria-hidden="true" />
      <div className="live-region" aria-live="polite">
        {reorderNote}
      </div>
      <main id="content" tabIndex={-1}>
        <header className="topbar">
          <a className="brand" href="./" aria-label="Home">
            <span className="brand-mark">C</span>
            <span>code / home</span>
          </a>
          <div className="top-actions">
            <div className="date-wrap">
              <span className="date-day">
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
            <button type="button" className="ask-models-button" onClick={() => setAskOpen(true)}>
              Ask models
            </button>
            <button
              className="palette-button"
              aria-label="Settings"
              data-tip="Settings"
              onClick={() => {
                setSettingsSection('')
                setSettingsOpen(true)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
              </svg>
            </button>
            <button
              className="palette-button"
              aria-label="Appearance"
              data-tip="Appearance"
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
            <kbd aria-hidden="true">/</kbd>
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
          <div className="section-actions">
            <button
              className="section-icon"
              type="button"
              aria-pressed={archiveOpen}
              aria-label={archived.length ? `Archive (${archived.length})` : 'Archive'}
              data-tip={archived.length ? `Archive (${archived.length})` : 'Archive'}
              onClick={() => setArchiveOpen((open) => !open)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 3h12v2H2z" />
                <path d="M3 6h10v7H3z" />
              </svg>
              {archived.length ? (
                <span className="section-icon-count" aria-hidden="true">
                  {archived.length}
                </span>
              ) : null}
            </button>
            <button
              className="section-icon"
              type="button"
              aria-label="Add link"
              data-tip="Add link"
              onClick={() => setEditor({ link: null, index: null })}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 2.5v11M2.5 8h11" />
              </svg>
            </button>
            {archiveOpen ? null : (
              <form className="link-filter" onSubmit={(event) => event.preventDefault()}>
                <label htmlFor="link-filter">Filter links</label>
                <input
                  id="link-filter"
                  type="search"
                  value={linkQuery}
                  autoComplete="off"
                  onChange={(event) => {
                    setLinkQuery(event.target.value)
                    setPage(1)
                  }}
                />
              </form>
            )}
          </div>
        </section>
        <section className="quick-links" aria-label="Quick links">
          <DndContext
            sensors={sensors}
            collisionDetection={preferTabCollision}
            autoScroll={false}
            screenReaderInstructions={dragInstructions}
            announcements={dragAnnouncements}
            onDragStart={onDragStart}
            onDragCancel={onDragCancel}
            onDragEnd={onDragEnd}
          >
            {archiveOpen ? (
              <div className="archive-panel">
                {archived.length === 0 ? (
                  <p className="empty-links">No archived links</p>
                ) : (
                  <table className="archive-table">
                    <caption>Archived links</caption>
                    <thead>
                      <tr>
                        <th scope="col">Link</th>
                        <th scope="col">Archived</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archived.map((link) => (
                        <tr key={link.id}>
                          <td>
                            <a href={link.url} {...linkTarget}>
                              {link.name}
                            </a>
                            <small>{host(link.url)}</small>
                          </td>
                          <td>
                            <time dateTime={link.archivedAt}>{archiveLabel(link.archivedAt)}</time>
                          </td>
                          <td className="archive-actions">
                            <button
                              className="text-button"
                              type="button"
                              aria-label={`Restore ${link.name}`}
                              onClick={() => {
                                changeLinks(
                                  links.map((item) => {
                                    if (item.id !== link.id) return item
                                    const restored = { ...item }
                                    delete restored.archivedAt
                                    return restored
                                  }),
                                )
                                setReorderNote(`${link.name} restored`)
                              }}
                            >
                              Restore
                            </button>
                            <button
                              className="text-button"
                              type="button"
                              aria-label={`Delete ${link.name}`}
                              onClick={() => {
                                changeLinks(links.filter((item) => item.id !== link.id))
                                setReorderNote(`${link.name} deleted`)
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : null}
            {archiveOpen ? null : (
              <>
                <div className="link-toolbar">
                  <div
                    className="link-tabs"
                    role="tablist"
                    aria-label="Link groups"
                    onKeyDown={filtering ? undefined : onTabsKeyDown}
                  >
                    {filtering ? (
                      <button
                        id="tab-results"
                        className="link-tab"
                        role="tab"
                        type="button"
                        aria-selected="true"
                        aria-controls="link-panel"
                      >
                        Results
                      </button>
                    ) : (
                      <>
                        {[
                          ['favorites', 'Favorites'],
                          ['all', 'All'],
                        ].map(([id, label]) => (
                          <DroppableTab
                            key={id}
                            id={id}
                            label={label}
                            selected={view === id}
                            onSelect={() => selectView(id)}
                          />
                        ))}
                        {groups.map((group) => (
                          <DroppableTab
                            key={group.id}
                            id={group.id}
                            label={group.name}
                            selected={view === group.id}
                            onSelect={() => selectView(group.id)}
                          />
                        ))}
                      </>
                    )}
                  </div>
                  {filtering ? null : (
                    <div className="group-actions">
                      <button
                        className="group-action"
                        type="button"
                        aria-label="Add group"
                        onClick={() => setGroupEditor({ group: null })}
                      >
                        + Group
                      </button>
                      {selectedGroup ? (
                        <button
                          className="group-action"
                          type="button"
                          aria-label="Edit group"
                          onClick={() => setGroupEditor({ group: selectedGroup })}
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="live-region" aria-live="polite">
                  {filtering
                    ? `${viewLinks.length} ${viewLinks.length === 1 ? 'result' : 'results'}`
                    : ''}
                </div>
                <div
                  id="link-panel"
                  role="tabpanel"
                  aria-labelledby={activeTabId}
                  className="link-grid"
                >
                  {paged.total === 0 ? <p className="empty-links">{emptyCopy}</p> : null}
                  <SortableContext
                    items={paged.items.map((link) => link.id)}
                    strategy={rectSortingStrategy}
                  >
                    {paged.items.map((link) => (
                      <SortableQuickLink
                        key={link.id}
                        link={link}
                        fill={link.color || prefs.ink}
                        linkTarget={linkTarget}
                        onFavorite={() =>
                          changeLinks(
                            links.map((item) =>
                              item.id === link.id ? { ...item, favorite: !item.favorite } : item,
                            ),
                          )
                        }
                        onEdit={() =>
                          setEditor({
                            link,
                            index: links.findIndex((item) => item.id === link.id),
                          })
                        }
                        onArchive={() => {
                          changeLinks(
                            links.map((item) =>
                              item.id === link.id
                                ? { ...item, archivedAt: new Date().toISOString() }
                                : item,
                            ),
                          )
                          setReorderNote(`${link.name} archived`)
                        }}
                        onRemove={() => changeLinks(links.filter((item) => item.id !== link.id))}
                        onMoveKey={(event) => {
                          const delta =
                            event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                              ? -1
                              : event.key === 'ArrowRight' || event.key === 'ArrowDown'
                                ? 1
                                : 0
                          if (!delta) return
                          event.preventDefault()
                          const fromVisible = paged.items.findIndex((item) => item.id === link.id)
                          const toVisible = fromVisible + delta
                          if (toVisible < 0 || toVisible >= paged.items.length) return
                          moveLink(link.id, paged.items[toVisible].id)
                        }}
                      />
                    ))}
                  </SortableContext>
                </div>
                {viewLinks.length > LIMITS.pageSize ? (
                  <nav className="pager" aria-label="Pagination">
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setPage(paged.page - 1)}
                      disabled={paged.page <= 1}
                    >
                      Previous page
                    </button>
                    <span aria-live="polite">
                      Page {paged.page} of {paged.pages}
                    </span>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setPage(paged.page + 1)}
                      disabled={paged.page >= paged.pages}
                    >
                      Next page
                    </button>
                  </nav>
                ) : null}
              </>
            )}
            <DragOverlay>
              {draggedLink ? (
                <QuickLinkOverlay
                  link={draggedLink}
                  fill={draggedLink.color || prefs.ink}
                  linkTarget={linkTarget}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </section>
        <section className="lower-grid">
          <article className="panel commands-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">LAUNCH PAD</p>
                <h2>Useful tools</h2>
              </div>
            </div>
            <div className="tool-list">
              {TOOLS.map((tool, index) => (
                <a className="tool" href={tool.url} key={tool.url} {...linkTarget}>
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
              <span
                className={noteStatus === 'saved locally' ? 'save-status is-saved' : 'save-status'}
                aria-live="polite"
              >
                {noteStatus}
              </span>
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
      <footer className="site-footer">
        <p>Code Home by Tyler Rehm · Ivy League Tech, LLC</p>
        <a href="https://tylerrehm.com">TylerRehm.com</a>
        <a href="https://ivyleaguetech.com">IvyLeagueTech.com</a>
        <span className="footer-gap" aria-hidden="true" />
        <a href="https://github.com/tyler-rehm/browser_home/blob/main/LICENSE">MIT license</a>
        <a href="https://github.com/tyler-rehm/browser_home">GitHub repository</a>
        <a href="https://github.com/sponsors/tyler-rehm">Sponsor</a>
        <a href="mailto:tyler@ivyleaguetech.com">Email Tyler Rehm</a>
      </footer>
      <GroupDialog
        open={groupEditor !== null}
        onClose={() => setGroupEditor(null)}
        group={groupEditor?.group}
        onSave={saveGroup}
        onDelete={() => setPendingDelete(groupEditor?.group ?? null)}
      />
      <LinkDialog
        open={editor !== null}
        onClose={() => setEditor(null)}
        initial={editor?.link}
        fallbackColor={prefs.ink}
        groups={groups}
        onCreateGroup={createGroup}
        onSave={saveLink}
      />
      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        {pendingDelete ? (
          <>
            <DialogTitle>Delete {pendingDelete.name}?</DialogTitle>
            <DialogBody>
              <p>Links in this group stay in All.</p>
            </DialogBody>
            <DialogActions>
              <Button outline onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  deleteGroup(pendingDelete.id)
                  setPendingDelete(null)
                }}
              >
                Delete group
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
      <PreferencesDialog
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        prefs={prefs}
        onChange={changePrefs}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false)
          setSettingsSection('')
        }}
        prefs={prefs}
        onChange={changePrefs}
        onImport={importBackup}
        onImportLinks={stageLinkImport}
        onExport={exportBackup}
        onReset={resetApplication}
        focusSection={settingsSection}
      />
      <AskModelsDialog
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onManageAccounts={() => {
          setAskOpen(false)
          setSettingsSection('model-accounts')
          setSettingsOpen(true)
        }}
      />
      <ImportLinksDialog
        open={linkImport !== null}
        draft={linkImport}
        existingLinks={links}
        existingGroups={groups}
        onClose={() => setLinkImport(null)}
        onApply={applyImportedLinks}
      />
    </>
  )
}
