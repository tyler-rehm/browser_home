import { host, LIMITS, validateLink, withLinkIds } from './records.js'

export const BOOKMARK_PREVIEW_LIMIT = 400

const ROOT_FOLDERS = new Set([
  'bookmarks',
  'bookmarks bar',
  'bookmarks toolbar',
  'bookmarks menu',
  'bookmark menu',
  'other bookmarks',
  'mobile bookmarks',
  'favorites',
  'favorites bar',
  'favourites',
  'favourites bar',
  'links bar',
  'unfiled bookmarks',
  'menu',
  'toolbar',
  'unfiled',
  'tags',
  'mobile',
  'reading list',
  'imported',
])

const NAME_FIELDS = ['name', 'title', 'label', 'text']
const URL_FIELDS = ['url', 'href', 'uri', 'link', 'address']
const GROUP_FIELDS = ['group', 'groupname', 'folder', 'category']

function fail(error) {
  return { ok: false, error }
}

function clipName(value) {
  return value.trim().replace(/\s+/g, ' ').slice(0, LIMITS.linkName)
}

function clipGroup(value) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, LIMITS.groupName)
}

function isRootFolder(name) {
  return ROOT_FOLDERS.has(
    String(name || '')
      .trim()
      .toLocaleLowerCase(),
  )
}

function shortFrom(name) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const raw = words.length >= 2 ? `${words[0][0] || ''}${words[1][0] || ''}` : name
  return raw
    .replace(/[^\p{L}\p{N}]/gu, '')
    .slice(0, LIMITS.linkShort)
    .toUpperCase()
}

function readScalar(record, key) {
  if (!key || !record || typeof record !== 'object') return ''
  const value = record[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function guessField(fields, aliases) {
  const ranked = fields.map((field) => [field, field.toLowerCase().replace(/[\s_-]/g, '')])
  for (const alias of aliases) {
    const hit = ranked.find(([, normalized]) => normalized === alias)
    if (hit) return hit[0]
  }
  return ''
}

function scalarFields(records) {
  const keys = []
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      if (keys.includes(key)) continue
      if (typeof value === 'string' || typeof value === 'number') keys.push(key)
    }
  }
  return keys.slice(0, 24)
}

function looksLikeHtml(text) {
  if (/^<!doctype\s+netscape-bookmark-file-1/i.test(text)) return true
  return /<dl[\s>]/i.test(text) && /<a\s[^>]*href=/i.test(text)
}

function netscapeSource(html) {
  const sample = html.slice(0, 8000).toLowerCase()
  if (
    sample.includes('icon_uri') ||
    sample.includes('automatically generated file') ||
    sample.includes('mozilla firefox')
  ) {
    return { source: 'firefox', sourceLabel: 'Firefox bookmarks' }
  }
  if (/\bfolded\b/.test(sample) && !sample.includes('add_date')) {
    return { source: 'safari', sourceLabel: 'Safari bookmarks' }
  }
  if (sample.includes('favorites bar') || sample.includes('links bar')) {
    return { source: 'edge', sourceLabel: 'Edge bookmarks' }
  }
  if (
    sample.includes('add_date') ||
    sample.includes('personal_toolbar_folder') ||
    sample.includes('bookmarks bar')
  ) {
    return { source: 'chrome', sourceLabel: 'Chrome bookmarks' }
  }
  return { source: 'netscape', sourceLabel: 'Browser bookmarks' }
}

function supportedAddress(url) {
  if (typeof url !== 'string' || !url.trim()) return false
  const raw = url.trim()
  return !(/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw))
}

function pushBookmark(bucket, entry) {
  if (!supportedAddress(entry.url)) {
    bucket.skipped += 1
    return true
  }
  if (bucket.rows.length >= BOOKMARK_PREVIEW_LIMIT) {
    bucket.truncated = true
    return false
  }
  bucket.rows.push(entry)
  return true
}

function emptyBookmarks(bucket) {
  if (bucket.rows.length) return null
  if (bucket.skipped) return fail('That file has no HTTP or HTTPS links to import.')
  return fail('That file has no links to import.')
}

function parseNetscape(html) {
  const doc = new globalThis.DOMParser().parseFromString(html, 'text/html')
  const root = doc.querySelector('dl')
  if (!root) return fail('That file has no links to import.')
  const bucket = { rows: [], truncated: false, skipped: 0 }

  function walk(dl, groupName) {
    let pendingFolder = null
    for (const child of dl.children) {
      const tag = child.tagName
      if (tag === 'DT') {
        const heading = child.querySelector(':scope > h3')
        const anchor = child.querySelector(':scope > a')
        pendingFolder = null
        if (anchor) {
          const href = anchor.getAttribute('href') || ''
          const title = clipName(anchor.textContent || '')
          if (!pushBookmark(bucket, { name: title, url: href, groupName })) return
        }
        if (heading) {
          const folderName = heading.textContent || ''
          const toolbar = heading.getAttribute('personal_toolbar_folder') === 'true'
          pendingFolder = toolbar || isRootFolder(folderName) ? '' : clipGroup(folderName)
          const nested = child.querySelector(':scope > dl')
          if (nested) {
            walk(nested, pendingFolder)
            pendingFolder = null
          }
        }
      } else if (tag === 'DL' && pendingFolder != null) {
        walk(child, pendingFolder)
        pendingFolder = null
      }
      if (bucket.truncated) return
    }
  }

  walk(root, '')
  return browserDraft(bucket, netscapeSource(html))
}

function browserDraft(bucket, identity) {
  const empty = emptyBookmarks(bucket)
  if (empty) return empty
  return {
    ok: true,
    source: identity.source,
    sourceLabel: identity.sourceLabel,
    locked: true,
    truncated: bucket.truncated,
    skipped: bucket.skipped,
    fields: [
      { id: 'name', label: 'Bookmark title' },
      { id: 'url', label: 'Address' },
      { id: 'groupName', label: 'Folder' },
    ],
    mapping: { name: 'name', url: 'url', group: 'groupName' },
    records: bucket.rows,
  }
}

function isChromiumBookmarks(data) {
  const roots = data?.roots
  if (!roots || typeof roots !== 'object' || Array.isArray(roots)) return false
  return ['bookmark_bar', 'other', 'synced'].some(
    (key) => roots[key] && roots[key].type === 'folder' && Array.isArray(roots[key].children),
  )
}

function walkChromium(node, inherited, bucket) {
  if (!node || typeof node !== 'object' || bucket.truncated) return
  if (node.type === 'url') {
    pushBookmark(bucket, {
      name: clipName(typeof node.name === 'string' ? node.name : ''),
      url: typeof node.url === 'string' ? node.url : '',
      groupName: inherited || '',
    })
    return
  }
  if (node.type === 'folder' && Array.isArray(node.children)) {
    const next = inherited == null || isRootFolder(node.name) ? '' : clipGroup(node.name || '')
    for (const child of node.children) walkChromium(child, next, bucket)
  }
}

function parseChromium(data) {
  const bucket = { rows: [], truncated: false, skipped: 0 }
  for (const key of ['bookmark_bar', 'other', 'synced']) {
    if (data.roots[key]) walkChromium(data.roots[key], null, bucket)
  }
  return browserDraft(bucket, { source: 'chromium', sourceLabel: 'Chrome or Edge bookmarks' })
}

function isFirefoxBookmarks(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  if (data.type === 'text/x-moz-place-container') return true
  return data.type === 'text/x-moz-place' && typeof data.uri === 'string'
}

function firefoxChildGroup(node) {
  if (node.root || isRootFolder(node.title)) return ''
  return clipGroup(typeof node.title === 'string' ? node.title : '')
}

function walkFirefox(node, groupName, bucket) {
  if (!node || typeof node !== 'object' || bucket.truncated) return
  if (node.type === 'text/x-moz-place') {
    pushBookmark(bucket, {
      name: clipName(typeof node.title === 'string' ? node.title : ''),
      url: typeof node.uri === 'string' ? node.uri : '',
      groupName,
    })
    return
  }
  if (!Array.isArray(node.children)) return
  const childGroup = firefoxChildGroup(node) || groupName
  for (const child of node.children) walkFirefox(child, childGroup, bucket)
}

function parseFirefox(data) {
  const bucket = { rows: [], truncated: false, skipped: 0 }
  walkFirefox(data, '', bucket)
  return browserDraft(bucket, { source: 'firefox', sourceLabel: 'Firefox bookmarks' })
}

function basicRecords(data) {
  let list = null
  if (Array.isArray(data)) list = data
  else if (data && typeof data === 'object' && Array.isArray(data.links)) list = data.links
  else if (data && typeof data === 'object' && Array.isArray(data.bookmarks)) list = data.bookmarks
  if (!list) return null
  const groups = data && typeof data === 'object' && Array.isArray(data.groups) ? data.groups : []
  const nameById = new Map(
    groups
      .filter((group) => group && typeof group.id === 'string' && typeof group.name === 'string')
      .map((group) => [group.id, group.name]),
  )
  const records = []
  let truncated = false
  for (const item of list) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    if (records.length >= BOOKMARK_PREVIEW_LIMIT) {
      truncated = true
      break
    }
    if (typeof item.group === 'string' || typeof item.folder === 'string' || !item.groupId) {
      records.push(item)
      continue
    }
    const group = nameById.get(item.groupId)
    records.push(group ? { ...item, group } : item)
  }
  return { records, truncated }
}

function parseBasic(packed) {
  if (!packed.records.length) return fail('That file has no links to import.')
  const fields = scalarFields(packed.records).map((id) => ({ id, label: id }))
  const ids = fields.map((field) => field.id)
  return {
    ok: true,
    source: 'json',
    sourceLabel: 'JSON links',
    locked: false,
    truncated: packed.truncated,
    skipped: 0,
    fields,
    mapping: {
      name: guessField(ids, NAME_FIELDS),
      url: guessField(ids, URL_FIELDS),
      group: guessField(ids, GROUP_FIELDS),
    },
    records: packed.records,
  }
}

export function parseLinkImport(text) {
  if (typeof text !== 'string') return fail('That file could not be read.')
  if (new TextEncoder().encode(text).length > LIMITS.bookmarkImportBytes) {
    return fail('That file is too large.')
  }
  const trimmed = text.trim()
  if (!trimmed) return fail('That file is empty.')
  if (looksLikeHtml(trimmed)) return parseNetscape(trimmed)
  let data
  try {
    data = JSON.parse(trimmed)
  } catch {
    return fail('That file is not valid JSON or a bookmark export.')
  }
  if (isChromiumBookmarks(data)) return parseChromium(data)
  if (isFirefoxBookmarks(data)) return parseFirefox(data)
  const packed = basicRecords(data)
  if (!packed) return fail('That file has no links to import.')
  return parseBasic(packed)
}

export function buildPreviewRows(records, mapping, { existingLinks = [], mode = 'add' } = {}) {
  const capacity = mode === 'replace' ? LIMITS.linkCount : LIMITS.linkCount - existingLinks.length
  const existing = new Set()
  for (const link of existingLinks) {
    if (!link || typeof link.url !== 'string') continue
    const parsed = validateLink({ name: 'Link', url: link.url, short: '' })
    if (parsed.ok) existing.add(parsed.value.url)
  }
  const seen = new Set()
  let included = 0
  return records.map((record, index) => {
    const rawName = readScalar(record, mapping.name)
    const rawUrl = readScalar(record, mapping.url)
    const groupName = mapping.group ? clipGroup(readScalar(record, mapping.group)) : ''
    let url = ''
    let reason = ''
    if (!rawUrl.trim()) reason = 'URL is required'
    else {
      const parsed = validateLink({ name: 'Link', url: rawUrl, short: '' })
      if (parsed.ok) url = parsed.value.url
      else reason = parsed.error
    }
    const name = clipName(rawName) || (url ? clipName(host(url)) : '')
    if (!reason && !name) reason = 'Name is required'
    let status = 'ready'
    if (reason) status = 'invalid'
    else if (seen.has(url)) {
      status = 'duplicate'
      reason = 'Duplicate URL in this file'
    } else if (mode === 'add' && existing.has(url)) {
      status = 'saved'
      reason = 'Already on this page'
    }
    if (url && status !== 'invalid') seen.add(url)
    let include = false
    if (status === 'ready' && included < capacity) {
      include = true
      included += 1
    } else if (status === 'ready' && included >= capacity) {
      reason = capacity > 0 ? 'Over the link limit' : 'This page is already full'
    }
    return {
      id: String(index),
      name,
      url: url || rawUrl.trim(),
      groupName,
      include,
      status,
      reason,
    }
  })
}

function groupKey(name) {
  return name.toLocaleLowerCase()
}

export function commitLinkImport({ rows, mode, existingLinks, existingGroups }) {
  if (mode !== 'add' && mode !== 'replace') return fail('Choose add or replace.')
  const selected = rows.filter((row) => row.include && row.status !== 'invalid')
  const room = mode === 'replace' ? LIMITS.linkCount : LIMITS.linkCount - existingLinks.length
  if (!selected.length) return fail('Choose at least one link to import.')
  if (room <= 0) return fail('This page already has the maximum number of links.')
  if (selected.length > room) {
    if (mode === 'replace') return fail(`Only ${LIMITS.linkCount} links can be saved.`)
    return fail(
      room === 1 ? 'Only 1 more link can be added.' : `Only ${room} more links can be added.`,
    )
  }
  const prepared = []
  for (const row of selected) {
    const result = validateLink({ name: row.name, url: row.url, short: shortFrom(row.name) })
    if (!result.ok) return fail(result.error)
    prepared.push({ ...result.value, groupName: clipGroup(row.groupName) })
  }
  const wanted = []
  for (const row of prepared) {
    if (!row.groupName) continue
    if (!wanted.some((name) => groupKey(name) === groupKey(row.groupName)))
      wanted.push(row.groupName)
  }
  const groups = mode === 'replace' ? [] : existingGroups.map((group) => ({ ...group }))
  const idByName = new Map(groups.map((group) => [groupKey(group.name), group.id]))
  let droppedGroups = 0
  for (const name of wanted) {
    if (idByName.has(groupKey(name))) continue
    if (groups.length >= LIMITS.groupCount) {
      droppedGroups += 1
      continue
    }
    const id = globalThis.crypto.randomUUID()
    groups.push({ id, name })
    idByName.set(groupKey(name), id)
  }
  const imported = prepared.map((row) => {
    const link = { name: row.name, url: row.url, short: row.short }
    const groupId = row.groupName ? idByName.get(groupKey(row.groupName)) : ''
    if (groupId) link.groupId = groupId
    return link
  })
  const links =
    mode === 'replace' ? withLinkIds(imported) : [...withLinkIds(imported), ...existingLinks]
  return { ok: true, links, groups, droppedGroups }
}
