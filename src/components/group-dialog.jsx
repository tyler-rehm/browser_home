import { useState } from 'react'
import { LIMITS } from '../records'
import { Button } from './button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from './dialog'

export function GroupDialog({ open, onClose, group, onSave, onDelete }) {
  return (
    <Dialog open={open} onClose={onClose}>
      {open ? (
        <GroupDialogBody group={group} onClose={onClose} onSave={onSave} onDelete={onDelete} />
      ) : null}
    </Dialog>
  )
}

function GroupDialogBody({ group, onClose, onSave, onDelete }) {
  const editing = Boolean(group)
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const result = onSave(String(new FormData(event.currentTarget).get('name') || ''))
    if (!result.ok) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <>
      <DialogTitle>{editing ? 'Edit group' : 'Add a group'}</DialogTitle>
      <form onSubmit={submit}>
        <DialogBody>
          <label>
            Name
            <input
              name="name"
              required
              maxLength={LIMITS.groupName}
              autoComplete="off"
              autoFocus
              defaultValue={group?.name ?? ''}
              placeholder="Work"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'group-form-error' : undefined}
            />
          </label>
          {error ? (
            <p id="group-form-error" role="alert" className="form-error">
              {error}
            </p>
          ) : null}
        </DialogBody>
        <DialogActions>
          {editing ? (
            <Button
              outline
              className="mr-auto text-[var(--accent-text)]"
              onClick={() => {
                onDelete()
                onClose()
              }}
            >
              Delete group
            </Button>
          ) : null}
          <Button outline onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{editing ? 'Save group' : 'Add group'}</Button>
        </DialogActions>
      </form>
    </>
  )
}
