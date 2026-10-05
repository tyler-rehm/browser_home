import { useState } from 'react'
import { validateLink } from '../records.js'
import { Button } from './button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from './dialog'

export function AddLinkDialog({ open, onClose, onAdd }) {
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const result = validateLink({
      name: fields.get('name'),
      url: fields.get('url'),
      short: fields.get('short'),
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    const added = onAdd(result.value)
    if (!added.ok) {
      setError(added.error)
      return
    }
    event.currentTarget.reset()
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add a link</DialogTitle>
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
              placeholder="https://github.com"
            />
          </label>
          <label>
            Short label
            <input name="short" maxLength="2" autoComplete="off" placeholder="GH" />
          </label>
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
          <Button type="submit">Add link</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
