import { useRef, useState } from 'react'
import { readLinkIcon } from '../icon.js'
import { validateLink } from '../records.js'
import { Button } from './button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from './dialog'

export function LinkDialog({ open, onClose, initial, fallbackColor, onSave }) {
  return (
    <Dialog open={open} onClose={onClose}>
      {open ? (
        <LinkDialogBody
          initial={initial}
          fallbackColor={fallbackColor}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </Dialog>
  )
}

function LinkDialogBody({ initial, fallbackColor, onClose, onSave }) {
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
    const result = validateLink({
      name: fields.get('name'),
      url: fields.get('url'),
      short: fields.get('short'),
      color,
      icon,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    const saved = onSave(result.value)
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
            <p role="alert" className="form-error">
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
