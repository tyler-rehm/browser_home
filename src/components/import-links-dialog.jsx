import { useState } from 'react'
import { BOOKMARK_PREVIEW_LIMIT, buildPreviewRows, commitLinkImport } from '../link-import.js'
import { LIMITS } from '../records.js'
import { Button } from './button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from './dialog'

function contextFor(mode, existingLinks) {
  return { existingLinks, mode }
}

function droppedFolders(rows, existingGroups, mode) {
  const names = []
  for (const row of rows) {
    if (!row.include || row.status === 'invalid' || !row.groupName) continue
    const key = row.groupName.toLocaleLowerCase()
    if (names.some((name) => name.toLocaleLowerCase() === key)) continue
    if (mode === 'add' && existingGroups.some((group) => group.name.toLocaleLowerCase() === key)) {
      continue
    }
    names.push(row.groupName)
  }
  const room = mode === 'replace' ? LIMITS.groupCount : LIMITS.groupCount - existingGroups.length
  return Math.max(0, names.length - Math.max(room, 0))
}

export function ImportLinksDialog(props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} size="xl">
      {props.open && props.draft ? <ImportLinksBody {...props} /> : null}
    </Dialog>
  )
}

function ImportLinksBody({ draft, existingLinks, existingGroups, onClose, onApply }) {
  const [mapping, setMapping] = useState(draft.mapping)
  const [mode, setMode] = useState('add')
  const [rows, setRows] = useState(() =>
    buildPreviewRows(draft.records, draft.mapping, contextFor('add', existingLinks)),
  )
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const selectable = rows.filter((row) => row.status !== 'invalid')
  const selected = selectable.filter((row) => row.include).length
  const allSelected = selectable.length > 0 && selectable.every((row) => row.include)
  const dropped = droppedFolders(rows, existingGroups, mode)

  function changeMapping(next) {
    setMapping(next)
    setConfirming(false)
    setError('')
    setRows(buildPreviewRows(draft.records, next, contextFor(mode, existingLinks)))
  }

  function changeMode(next) {
    setMode(next)
    setConfirming(false)
    setError('')
    setRows(buildPreviewRows(draft.records, mapping, contextFor(next, existingLinks)))
  }

  function toggle(id) {
    setConfirming(false)
    setError('')
    setRows((current) =>
      current.map((row) =>
        row.id === id && row.status !== 'invalid' ? { ...row, include: !row.include } : row,
      ),
    )
  }

  function toggleAll(include) {
    setConfirming(false)
    setError('')
    const room = mode === 'replace' ? LIMITS.linkCount : LIMITS.linkCount - existingLinks.length
    let used = 0
    setRows((current) =>
      current.map((row) => {
        if (row.status === 'invalid' || !include) return { ...row, include: false }
        if (used >= room) return { ...row, include: false }
        used += 1
        return { ...row, include: true }
      }),
    )
  }

  function apply() {
    const result = commitLinkImport({ rows, mode, existingLinks, existingGroups })
    if (!result.ok) {
      setError(result.error)
      return
    }
    const message = onApply(result.links, result.groups)
    if (message) setError(message)
  }

  return (
    <>
      <DialogTitle>Import links</DialogTitle>
      <p className="mt-1 font-mono text-[10px] tracking-[.18em] text-[var(--accent-text)]">
        {draft.sourceLabel}
      </p>
      <DialogBody>
        <fieldset className="import-map">
          <legend>Field mapping</legend>
          <FieldMap
            label="Name"
            value={mapping.name}
            fields={draft.fields}
            locked={draft.locked}
            onChange={(name) => changeMapping({ ...mapping, name })}
          />
          <FieldMap
            label="URL"
            value={mapping.url}
            fields={draft.fields}
            locked={draft.locked}
            onChange={(url) => changeMapping({ ...mapping, url })}
          />
          <FieldMap
            label="Group"
            value={mapping.group}
            fields={draft.fields}
            locked={draft.locked}
            allowEmpty
            onChange={(group) => changeMapping({ ...mapping, group })}
          />
        </fieldset>
        <div className="import-choice" role="radiogroup" aria-label="How to import">
          <label className="preference-toggle">
            <input
              type="radio"
              name="link-import-mode"
              checked={mode === 'add'}
              onChange={() => changeMode('add')}
            />
            Add to current links
          </label>
          <label className="preference-toggle">
            <input
              type="radio"
              name="link-import-mode"
              checked={mode === 'replace'}
              onChange={() => changeMode('replace')}
            />
            Replace current links
          </label>
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          {selected} selected
          {draft.skipped
            ? ` · ${draft.skipped} unsupported ${draft.skipped === 1 ? 'address' : 'addresses'} left out`
            : ''}
          {draft.truncated ? ` · only the first ${BOOKMARK_PREVIEW_LIMIT} bookmarks were read` : ''}
        </p>
        {dropped ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            {dropped === 1
              ? '1 folder will be imported without a group because only 24 groups can be saved.'
              : `${dropped} folders will be imported without a group because only 24 groups can be saved.`}
          </p>
        ) : null}
        <div className="import-preview">
          <table className="archive-table">
            <caption>Links to import</caption>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all importable links"
                    checked={allSelected}
                    disabled={!selectable.length}
                    onChange={(event) => toggleAll(event.target.checked)}
                  />
                </th>
                <th>Name</th>
                <th>URL</th>
                <th>Group</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Import ${row.name || 'untitled link'}`}
                      checked={row.include}
                      disabled={row.status === 'invalid'}
                      onChange={() => toggle(row.id)}
                    />
                  </td>
                  <td>
                    {row.name || 'Untitled'}
                    {row.reason ? <small>{row.reason}</small> : null}
                  </td>
                  <td className="import-url">{row.url}</td>
                  <td>{row.groupName || 'No group'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {confirming ? (
          <div className="mt-5 rounded-md border border-black/15 p-3">
            <p id="replace-links-warning" role="alert">
              Replace removes the links and groups on this page. They will be lost and cannot be
              recovered. Notes and appearance stay.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button outline onClick={() => setConfirming(false)}>
                Cancel replace
              </Button>
              <Button onClick={apply}>Confirm replace</Button>
            </div>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
      </DialogBody>
      <DialogActions>
        <Button outline onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (mode === 'replace') {
              setConfirming(true)
              setError('')
              return
            }
            apply()
          }}
          disabled={!selected}
          aria-describedby={confirming ? 'replace-links-warning' : undefined}
        >
          {mode === 'replace' ? 'Replace links' : 'Import links'}
        </Button>
      </DialogActions>
    </>
  )
}

function FieldMap({ label, value, fields, locked, allowEmpty = false, onChange }) {
  const id = `import-map-${label.toLowerCase()}`
  return (
    <div className="import-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        disabled={locked}
        onChange={(event) => onChange(event.target.value)}
      >
        {allowEmpty ? <option value="">No group</option> : null}
        {!value && !allowEmpty ? <option value="">Choose a field</option> : null}
        {fields.map((field) => (
          <option key={field.id} value={field.id}>
            {field.label}
          </option>
        ))}
      </select>
    </div>
  )
}
