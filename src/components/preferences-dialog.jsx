import { useState } from 'react'
import { DEFAULT_PREFERENCES, PRESETS } from '../data'
import { FONTS, LIMITS } from '../records.js'
import { Button } from './button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from './dialog'

export function PreferencesDialog(props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} size="lg">
      {props.open ? <PreferencesBody {...props} /> : null}
    </Dialog>
  )
}

function PreferencesBody({ onClose, prefs, onChange, onImport, onExport, onReset }) {
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  async function importFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const message = await onImport(file)
    setError(message)
  }

  return (
    <>
      <DialogTitle>Make it yours</DialogTitle>
      <p className="mt-1 font-mono text-[10px] tracking-[.18em] text-[var(--accent-text)]">
        APPEARANCE
      </p>
      <DialogBody>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button
              type="button"
              key={name}
              onClick={() => onChange(preset)}
              className="flex min-h-11 justify-center gap-1.5 rounded-lg border border-black/15 p-3"
              aria-label={`${name} theme`}
            >
              {[preset.paper, preset.ink, preset.accent].map((color) => (
                <i key={color} className="size-5 rounded-full" style={{ background: color }} />
              ))}
            </button>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {['paper', 'ink', 'accent', 'secondary'].map((key) => (
            <label
              key={key}
              className="!mt-0 flex items-center justify-between rounded-lg border border-black/15 p-3"
            >
              {key}
              <span className="flex items-center gap-2">
                <input
                  aria-label={`${key} color`}
                  className="!m-0 !size-7 !p-0"
                  type="color"
                  value={prefs[key]}
                  onChange={(event) => onChange({ ...prefs, [key]: event.target.value })}
                />
                <code>{prefs[key].toUpperCase()}</code>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Built-in themes keep body text readable. Custom colors are stored as chosen and can fall
          below a comfortable contrast.
        </p>
        <label className="mt-4">
          Typeface
          <select
            className="mt-2 block w-full rounded-lg border border-black/15 bg-transparent p-3 text-sm"
            value={prefs.font}
            onChange={(event) => onChange({ ...prefs, font: event.target.value })}
          >
            {FONTS.map((font) => (
              <option key={font}>{font}</option>
            ))}
          </select>
        </label>
        <div className="mt-6 flex flex-wrap gap-4 font-mono text-xs">
          <label className="cursor-pointer underline">
            Import backup
            <input
              hidden
              type="file"
              accept="application/json,.json"
              aria-label="Import backup"
              onChange={importFile}
            />
          </label>
          <button type="button" onClick={onExport} className="underline">
            Export backup
          </button>
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Backups include links, notes, and appearance. Files over{' '}
          {Math.round(LIMITS.importBytes / 1024)} KB are rejected, and a failed import changes
          nothing.
        </p>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        {confirming ? (
          <div className="mt-5 rounded-md border border-black/15 p-3">
            <p id="reset-warning">
              This removes links, notes, and appearance stored by this homepage. Other browser data
              stays.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button outline onClick={() => setConfirming(false)}>
                Cancel reset
              </Button>
              <Button
                onClick={() => {
                  if (onReset()) onClose()
                }}
              >
                Confirm reset
              </Button>
            </div>
          </div>
        ) : null}
      </DialogBody>
      <DialogActions>
        <Button outline onClick={() => onChange(DEFAULT_PREFERENCES)}>
          Default appearance
        </Button>
        <Button
          outline
          onClick={() => setConfirming(true)}
          aria-describedby={confirming ? 'reset-warning' : undefined}
        >
          Reset app data
        </Button>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </>
  )
}
