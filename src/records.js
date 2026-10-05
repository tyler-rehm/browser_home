import { isHexColor } from './color.js'

export const LIMITS = {
  linkName: 60,
  linkShort: 2,
  linkUrl: 2048,
  linkCount: 48,
  noteLength: 8000,
  importBytes: 256 * 1024,
}

export const FONTS = ['Manrope', 'Inter', 'Avenir Next', 'Helvetica Neue', 'Georgia']

export const PREFERENCE_KEYS = ['paper', 'ink', 'accent', 'secondary', 'font']

export function normalizeUrl(value) {
  if (typeof value !== 'string') throw new Error('URL is required')
  const raw = value.trim()
  if (!raw) throw new Error('URL is required')
  if (raw.length > LIMITS.linkUrl) throw new Error('URL is too long')
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) {
    throw new Error('Only HTTP and HTTPS links are allowed')
  }
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  let parsed
  try {
    parsed = new URL(candidate)
  } catch {
    throw new Error('URL could not be read')
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS links are allowed')
  }
  if (parsed.username || parsed.password) {
    throw new Error('Links with embedded credentials are not allowed')
  }
  return parsed.href
}

export function host(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

export function searchDestination(value) {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null
  const urlLike = /^(https?:\/\/|localhost[:/]|[\w-]+\.[a-z]{2,})(.*)?$/i.test(raw)
  if (!urlLike) return `https://www.google.com/search?q=${encodeURIComponent(raw)}`
  return normalizeUrl(raw)
}

function shortLabel(value) {
  if (value == null || value === '') return ''
  if (typeof value !== 'string') return null
  return value.trim().slice(0, LIMITS.linkShort).toUpperCase()
}

export function validateLink(input, { strictUnknown = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'A link record is malformed' }
  }
  if (strictUnknown && Object.keys(input).some((key) => !['name', 'url', 'short'].includes(key))) {
    return { ok: false, error: 'A link contains an unknown field' }
  }
  if (typeof input.name !== 'string' || !input.name.trim()) {
    return { ok: false, error: 'Name is required' }
  }
  if (input.name.trim().length > LIMITS.linkName) {
    return { ok: false, error: 'Name is too long' }
  }
  let url
  try {
    url = normalizeUrl(input.url)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'URL could not be read' }
  }
  const short = shortLabel(input.short)
  if (short == null) return { ok: false, error: 'Short label is malformed' }
  return { ok: true, value: { name: input.name.trim(), url, short } }
}

export function validateLinkList(input, options = {}) {
  if (!Array.isArray(input)) return { ok: false, error: 'Links must be a list' }
  if (input.length > LIMITS.linkCount) return { ok: false, error: 'There are too many links' }
  const links = []
  const skipped = []
  for (const item of input) {
    const result = validateLink(item, options)
    if (result.ok) links.push(result.value)
    else skipped.push(result.error)
  }
  if (options.rejectPartial && skipped.length) return { ok: false, error: skipped[0] }
  return { ok: true, value: links, skipped }
}

export function validateNotes(value) {
  if (typeof value !== 'string') return { ok: false, error: 'Notes are malformed' }
  if (value.length > LIMITS.noteLength) return { ok: false, error: 'Notes are too long' }
  return { ok: true, value }
}

export function validateStoredPreferences(input, defaults) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Appearance settings are malformed' }
  }
  const value = { ...defaults }
  let repaired = false
  for (const key of ['paper', 'ink', 'accent', 'secondary']) {
    if (!(key in input)) continue
    if (isHexColor(input[key])) value[key] = input[key].toLowerCase()
    else repaired = true
  }
  if ('font' in input) {
    if (FONTS.includes(input.font)) value.font = input.font
    else repaired = true
  }
  return { ok: true, value, repaired }
}

export function validateStrictPreferences(input, defaults) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Appearance settings are malformed' }
  }
  if (Object.keys(input).some((key) => !PREFERENCE_KEYS.includes(key))) {
    return { ok: false, error: 'Appearance settings contain an unknown field' }
  }
  const value = { ...defaults }
  for (const key of PREFERENCE_KEYS) {
    if (!(key in input)) continue
    if (key === 'font') {
      if (!FONTS.includes(input.font)) return { ok: false, error: 'That font is not supported' }
      value.font = input.font
      continue
    }
    if (!isHexColor(input[key])) return { ok: false, error: `${key} must be a hex color` }
    value[key] = input[key].toLowerCase()
  }
  return { ok: true, value }
}
