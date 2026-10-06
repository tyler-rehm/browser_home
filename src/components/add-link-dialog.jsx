import { useRef, useState } from 'react'
import { readLinkIcon } from '../icon.js'
import { displayGroupId, validateLink } from '../records.js'
import { Button } from './button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from './dialog'

export function LinkDialog({
  open,
  onClose,
  initial,
  fallbackColor,
  groups,
  onCreateGroup,
  onSave,
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      {open ? (
        <LinkDialogBody
          initial={initial}
          fallbackColor={fallbackColor}
          groups={groups}
          onCreateGroup={onCreateGroup}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </Dialog>
  )
}

function LinkDialogBody({ initial, fallbackColor, groups, onCreateGroup, onClose, onSave }) {
  const fileRef = useRef(null)
  const editing = Boolean(initial)
  const [error, setError] = useState('')
  const [color, setColor] = useState(initial?.color || fallbackColor)
  const [icon, setIcon] = useState(initial?.icon || '')
  const [over, setOver] = useState(false)

  async function takeFile(file) {
    const result = await readLinkIcon(file)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    setIcon(result.value)
  }

  function submit(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const selectedGroup = String(fields.get('groupId') || '')
    const result = validateLink({
      name: fields.get('name'),
      url: fields.get('url'),
      short: fields.get('short'),
      color,
      icon,
      id: initial?.id,
      favorite: initial?.favorite === true,
      groupId: selectedGroup || undefined,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    const value = { ...result.value }
    const newGroup = String(fields.get('newGroup') || '')
    if (newGroup.trim()) {
      const created = onCreateGroup(newGroup)
      if (!created.ok) {
        setError(created.error)
        return
      }
      value.groupId = created.group.id
    } else if (!selectedGroup) {
      delete value.groupId
    }
    const saved = onSave(value)
    if (!saved.ok) {
      setError(saved.error)
      return
    }
    setError('')
    onClose()
  }

  return (
    <>
      <DialogTitle>{editing ? 'Edit link' : 'Add a link'}</DialogTitle>
      <form onSubmit={submit}>
        <DialogBody className="space-y-4">
          <label>
            Name
            <input
              name="name"
              required
              maxLength="60"
              autoComplete="off"
              autoFocus
              defaultValue={initial?.name ?? ''}
              placeholder="GitHub"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'link-form-error' : undefined}
            />
          </label>
          <label>
            URL
            <input
              name="url"
              required
              maxLength="2048"
              inputMode="url"
              defaultValue={initial?.url ?? ''}
              placeholder="https://github.com"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'link-form-error' : undefined}
            />
          </label>
          <label>
            Short label
            <input
              name="short"
              maxLength="2"
              autoComplete="off"
              defaultValue={initial?.short ?? ''}
              placeholder="GH"
            />
          </label>
          <label htmlFor="link-group">Group</label>
          <select id="link-group" name="groupId" defaultValue={displayGroupId(initial, groups)}>
            <option value="">No group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <label>
            New group
            <input
              name="newGroup"
              maxLength="40"
              autoComplete="off"
              placeholder="Work"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'link-form-error' : undefined}
            />
          </label>
          <label>
            Icon color
            <input
              aria-label="Icon color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </label>
          <div
            role="group"
            aria-label="Link icon"
            className={over ? 'icon-drop is-over' : 'icon-drop'}
            onDragOver={(event) => {
              event.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setOver(false)
              void takeFile(event.dataTransfer.files?.[0])
            }}
          >
            {icon ? (
              <img className="icon-preview" src={icon} alt="" />
            ) : (
              <span className="icon-preview" style={{ background: color }} />
            )}
            <p>Drop an image here, or choose a file. It is cropped to a circle.</p>
            <button type="button" onClick={() => fileRef.current?.click()}>
              {icon ? 'Replace image' : 'Choose image'}
            </button>
            {icon ? (
              <button type="button" onClick={() => setIcon('')}>
                Remove image
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              void takeFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          {error ? (
            <p id="link-form-error" role="alert" className="form-error">
              {error}
            </p>
          ) : null}
        </DialogBody>
        <DialogActions>
          <Button outline onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{editing ? 'Save link' : 'Add link'}</Button>
        </DialogActions>
      </form>
    </>
  )
}
