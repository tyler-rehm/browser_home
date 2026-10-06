import { DEFAULT_PREFERENCES } from './data.js'
import {
  LIMITS,
  APPEARANCE_KEYS,
  PREFERENCE_KEYS,
  validateGroupList,
  validateLinkList,
  validateNotes,
  validateStrictPreferences,
} from './records.js'

export function createBackup({ links, groups = [], notes, preferences }) {
  return {
    version: 2,
    links,
    groups,
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
  if (data.version === 1) return parseBackup(data, ['version', 'links', 'notes', 'preferences'], 1)
  if (data.version === 2) {
    return parseBackup(data, ['version', 'links', 'groups', 'notes', 'preferences'], 2)
  }
  return { ok: false, error: 'That backup version is not supported.' }
}

function parseBackup(data, allowed, version) {
  if (Object.keys(data).some((key) => !allowed.includes(key))) {
    return { ok: false, error: 'That backup contains an unknown field.' }
  }
  const links = validateLinkList(data.links, { strictUnknown: true, rejectPartial: true })
  if (!links.ok) return { ok: false, error: links.error }
  const notes = validateNotes(data.notes)
  if (!notes.ok) return { ok: false, error: notes.error }
  if (!data.preferences) return { ok: false, error: 'Appearance settings are malformed' }
  const preferences = validateStrictPreferences(data.preferences, DEFAULT_PREFERENCES)
  if (!preferences.ok) return preferences
  if (APPEARANCE_KEYS.some((key) => !(key in data.preferences))) {
    return { ok: false, error: 'Appearance settings are incomplete' }
  }
  let groups = []
  if (version === 2) {
    if (!('groups' in data)) return { ok: false, error: 'Groups are missing' }
    const parsedGroups = validateGroupList(data.groups)
    if (!parsedGroups.ok) return { ok: false, error: parsedGroups.error }
    groups = parsedGroups.value
    const ids = new Set(groups.map((group) => group.id))
    if (links.value.some((link) => link.groupId && !ids.has(link.groupId))) {
      return { ok: false, error: 'A link refers to an unknown group' }
    }
  }
  const restored = links.value.map((link) => {
    if (version === 1) {
      const next = { ...link, favorite: false }
      delete next.groupId
      return next
    }
    return link
  })
  return {
    ok: true,
    kind: 'backup',
    links: restored,
    groups,
    notes: notes.value,
    preferences: preferences.value,
  }
}
