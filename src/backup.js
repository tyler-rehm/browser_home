import { DEFAULT_PREFERENCES } from './data.js'
import {
  LIMITS,
  PREFERENCE_KEYS,
  validateLinkList,
  validateNotes,
  validateStrictPreferences,
} from './records.js'

export function createBackup({ links, notes, preferences }) {
  return {
    version: 1,
    links,
    notes,
    preferences,
  }
}

export function serializeBackup(data) {
  return `${JSON.stringify(createBackup(data), null, 2)}\n`
}

function legacyPreferences(data) {
  const keys = Object.keys(data)
  if (!keys.length || keys.some((key) => !PREFERENCE_KEYS.includes(key))) {
    return { ok: false, error: 'That file is not a recognized backup.' }
  }
  const preferences = validateStrictPreferences(data, DEFAULT_PREFERENCES)
  if (!preferences.ok) return preferences
  return { ok: true, kind: 'legacy', preferences: preferences.value }
}

export function parseImport(text) {
  if (typeof text !== 'string') return { ok: false, error: 'That file could not be read.' }
  if (new TextEncoder().encode(text).length > LIMITS.importBytes) {
    return { ok: false, error: 'That file is too large.' }
  }
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'That file is not a backup object.' }
  }
  if (!('version' in data)) return legacyPreferences(data)
  if (data.version !== 1) return { ok: false, error: 'That backup version is not supported.' }
  if (
    Object.keys(data).some((key) => !['version', 'links', 'notes', 'preferences'].includes(key))
  ) {
    return { ok: false, error: 'That backup contains an unknown field.' }
  }
  const links = validateLinkList(data.links, { strictUnknown: true, rejectPartial: true })
  if (!links.ok) return { ok: false, error: links.error }
  const notes = validateNotes(data.notes)
  if (!notes.ok) return { ok: false, error: notes.error }
  if (!data.preferences) return { ok: false, error: 'Appearance settings are malformed' }
  const preferences = validateStrictPreferences(data.preferences, DEFAULT_PREFERENCES)
  if (!preferences.ok) return preferences
  if (PREFERENCE_KEYS.some((key) => !(key in data.preferences))) {
    return { ok: false, error: 'Appearance settings are incomplete' }
  }
  return {
    ok: true,
    kind: 'backup',
    links: links.value,
    notes: notes.value,
    preferences: preferences.value,
  }
}
