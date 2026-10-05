export const KEYS = {
  links: 'code-home-links',
  notes: 'code-home-notes',
  preferences: 'code-home-preferences',
}

export const APP_KEYS = [KEYS.links, KEYS.notes, KEYS.preferences]

export function readText(storage, key) {
  try {
    const raw = storage.getItem(key)
    if (raw == null) return { state: 'absent' }
    return { state: 'present', raw }
  } catch {
    return { state: 'blocked' }
  }
}

export function writeText(storage, key, raw) {
  try {
    storage.setItem(key, raw)
    return { ok: true }
  } catch (error) {
    const quota = error?.name === 'QuotaExceededError' || error?.code === 22
    return { ok: false, reason: quota ? 'quota' : 'blocked' }
  }
}

export function removeKeys(storage, keys) {
  const snapshot = []
  try {
    for (const key of keys) snapshot.push([key, storage.getItem(key)])
  } catch {
    return { ok: false, reason: 'blocked' }
  }
  try {
    for (const key of keys) storage.removeItem(key)
    return { ok: true }
  } catch {
    for (const [key, value] of snapshot) {
      if (value == null) storage.removeItem(key)
      else storage.setItem(key, value)
    }
    return { ok: false, reason: 'blocked' }
  }
}
