import { isHexColor } from './color.js'

export const LIMITS = {
  linkName: 60,
  linkShort: 2,
  linkUrl: 2048,
  linkIcon: 16_000,
  linkCount: 48,
  groupName: 40,
  groupCount: 24,
  pageSize: 8,
  noteLength: 8000,
  importBytes: 768 * 1024,
}

export const FONTS = ['Manrope', 'Inter', 'Avenir Next', 'Helvetica Neue', 'Georgia']

export const APPEARANCE_KEYS = ['paper', 'ink', 'accent', 'secondary', 'font']
export const PREFERENCE_KEYS = [...APPEARANCE_KEYS, 'openInNewTab']

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

export function reorderLinks(links, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return links
  if (from === to || from < 0 || to < 0 || from >= links.length || to >= links.length) return links
  const next = links.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
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

const LINK_FIELDS = [
  'id',
  'name',
  'url',
  'short',
  'color',
  'icon',
  'groupId',
  'favorite',
  'archivedAt',
]
const ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/

function optionalId(value, label) {
  if (value == null || value === '') return { ok: true, value: '' }
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    return { ok: false, error: `${label} is malformed` }
  }
  return { ok: true, value }
}

function linkColor(value) {
  if (value == null || value === '') return ''
  if (!isHexColor(value)) return null
  return value.toLowerCase()
}

function archivedAt(value) {
  if (value == null || value === '') return ''
  if (typeof value !== 'string') return null
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return null
  return new Date(parsed).toISOString()
}

function linkIcon(value) {
  if (value == null || value === '') return ''
  if (typeof value !== 'string' || value.length > LIMITS.linkIcon) return null
  if (!/^data:image\/jpeg;base64,[a-z0-9+/]+={0,2}$/i.test(value)) return null
  return value
}

export function validateLink(input, { strictUnknown = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'A link record is malformed' }
  }
  if (strictUnknown && Object.keys(input).some((key) => !LINK_FIELDS.includes(key))) {
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
  const color = linkColor(input.color)
  if (color == null) return { ok: false, error: 'Icon color must be a hex color' }
  const icon = linkIcon(input.icon)
  if (icon == null) return { ok: false, error: 'Icon image must be a small JPEG' }
  const id = optionalId(input.id, 'Link id')
  if (!id.ok) return id
  const groupId = optionalId(input.groupId, 'Group id')
  if (!groupId.ok) return groupId
  if ('favorite' in input && input.favorite != null && typeof input.favorite !== 'boolean') {
    return { ok: false, error: 'Favorite must be true or false' }
  }
  const archived = archivedAt(input.archivedAt)
  if (archived == null) return { ok: false, error: 'Archive date is malformed' }
  const value = { name: input.name.trim(), url, short, favorite: input.favorite === true }
  if (id.value) value.id = id.value
  if (groupId.value) value.groupId = groupId.value
  if (color) value.color = color
  if (icon) value.icon = icon
  if (archived) value.archivedAt = archived
  return { ok: true, value }
}

export function activeLinks(links) {
  return links.filter((link) => !link.archivedAt)
}

export function archivedLinks(links) {
  return links
    .filter((link) => link.archivedAt)
    .slice()
    .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
}

export function validateGroup(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'A group record is malformed' }
  }
  const id = optionalId(input.id, 'Group id')
  if (!id.ok || !id.value) return { ok: false, error: 'Group id is malformed' }
  if (typeof input.name !== 'string' || !input.name.trim()) {
    return { ok: false, error: 'Group name is required' }
  }
  const name = input.name.trim()
  if (name.length > LIMITS.groupName) return { ok: false, error: 'Group name is too long' }
  return { ok: true, value: { id: id.value, name } }
}

export function validateGroupList(input) {
  if (!Array.isArray(input)) return { ok: false, error: 'Groups must be a list' }
  if (input.length > LIMITS.groupCount) return { ok: false, error: 'There are too many groups' }
  const groups = []
  const names = new Set()
  const ids = new Set()
  for (const item of input) {
    const result = validateGroup(item)
    if (!result.ok) return result
    const key = result.value.name.toLocaleLowerCase()
    if (names.has(key)) return { ok: false, error: 'A group with that name already exists' }
    if (ids.has(result.value.id)) return { ok: false, error: 'A group id is duplicated' }
    names.add(key)
    ids.add(result.value.id)
    groups.push(result.value)
  }
  return { ok: true, value: groups }
}

export function validateGroupName(name, groups, { ignoreId } = {}) {
  if (!Array.isArray(groups)) return { ok: false, error: 'Groups must be a list' }
  if (typeof name !== 'string' || !name.trim()) {
    return { ok: false, error: 'Group name is required' }
  }
  const trimmed = name.trim()
  if (trimmed.length > LIMITS.groupName) return { ok: false, error: 'Group name is too long' }
  const key = trimmed.toLocaleLowerCase()
  const duplicate = groups.some(
    (group) => group.name.toLocaleLowerCase() === key && group.id !== ignoreId,
  )
  if (duplicate) return { ok: false, error: 'A group with that name already exists' }
  if (ignoreId == null && groups.length >= LIMITS.groupCount) {
    return { ok: false, error: 'There are too many groups' }
  }
  return { ok: true, value: trimmed }
}

export function displayGroupId(link, groups) {
  if (!link?.groupId || !Array.isArray(groups)) return ''
  return groups.some((group) => group.id === link.groupId) ? link.groupId : ''
}

export function withLinkIds(links) {
  return links.map((link) => (link.id ? link : { ...link, id: globalThis.crypto.randomUUID() }))
}

export function linksInView(links, groups, view) {
  if (view === 'favorites') return links.filter((link) => link.favorite)
  if (view === 'all') return links
  if (!groups.some((group) => group.id === view)) return []
  return links.filter((link) => link.groupId === view)
}

export function filterLinks(links, groups, query) {
  const needle = typeof query === 'string' ? query.trim().toLocaleLowerCase() : ''
  if (!needle) return links
  return links.filter((link) => {
    const groupName = groups.find((group) => group.id === link.groupId)?.name || ''
    return [link.name, link.url, link.short || '', groupName].some((part) =>
      part.toLocaleLowerCase().includes(needle),
    )
  })
}

export function pageOf(items, page, size = LIMITS.pageSize) {
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / size))
  const current = Math.min(Math.max(1, Number.isInteger(page) ? page : 1), pages)
  const start = (current - 1) * size
  return { items: items.slice(start, start + size), page: current, pages, total }
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
  if ('openInNewTab' in input) {
    if (typeof input.openInNewTab === 'boolean') value.openInNewTab = input.openInNewTab
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
    if (key === 'openInNewTab') {
      if (typeof input.openInNewTab !== 'boolean') {
        return { ok: false, error: 'New tab setting must be true or false' }
      }
      value.openInNewTab = input.openInNewTab
      continue
    }
    if (!isHexColor(input[key])) return { ok: false, error: `${key} must be a hex color` }
    value[key] = input[key].toLowerCase()
  }
  return { ok: true, value }
}
