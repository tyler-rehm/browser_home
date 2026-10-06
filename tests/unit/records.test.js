import { describe, expect, it } from 'vitest'
import { contrastRatio, ensureContrast, readableForeground } from '../../src/color'
import { PRESETS } from '../../src/data'
import {
  LIMITS,
  filterLinks,
  normalizeUrl,
  pageOf,
  validateGroupList,
  validateGroupName,
  validateLink,
  validateLinkList,
  validateNotes,
  validateStoredPreferences,
} from '../../src/records'

describe('records', () => {
  it('rejects credentials, unsafe protocols, and oversized values', () => {
    expect(() => normalizeUrl('https://user:pass@example.com')).toThrow(/credentials/)
    expect(() => normalizeUrl('javascript:alert(1)')).toThrow(/HTTP/)
    expect(() => normalizeUrl(`https://example.com/${'a'.repeat(LIMITS.linkUrl)}`)).toThrow(
      /too long/,
    )
    expect(validateLink({ name: ' ', url: 'https://example.com' }).ok).toBe(false)
    expect(validateLink({ name: 'A', url: 'https://example.com', short: 12 }).ok).toBe(false)
    expect(
      validateLink({ name: 'A', url: 'https://example.com', extra: true }, { strictUnknown: true })
        .ok,
    ).toBe(false)
    expect(validateNotes('x'.repeat(LIMITS.noteLength + 1)).ok).toBe(false)
    expect(validateLinkList({ nope: true }).ok).toBe(false)
    expect(validateLink({ name: 'A', url: 'https://example.com', color: 'red' }).ok).toBe(false)
    expect(
      validateLink({ name: 'A', url: 'https://example.com', icon: 'data:image/svg+xml,x' }).ok,
    ).toBe(false)
    const saved = validateLink({
      name: 'A',
      url: 'https://example.com',
      color: '#ABCDEF',
      icon: 'data:image/jpeg;base64,aaaa',
    })
    expect(saved.ok).toBe(true)
    expect(saved.value.color).toBe('#abcdef')
    expect(saved.value.icon).toBe('data:image/jpeg;base64,aaaa')
  })

  it('falls back on invalid stored preferences without throwing', () => {
    const result = validateStoredPreferences(
      { paper: null, font: 'Comic Sans', ink: '#112233' },
      PRESETS.field,
    )
    expect(result.ok).toBe(true)
    expect(result.repaired).toBe(true)
    expect(result.value.paper).toBe(PRESETS.field.paper)
    expect(result.value.font).toBe('Manrope')
    expect(result.value.ink).toBe('#112233')
    expect(result.value.openInNewTab).toBe(true)
    const chosen = validateStoredPreferences({ openInNewTab: false }, PRESETS.field)
    expect(chosen.value.openInNewTab).toBe(false)
  })

  it('accepts a legacy link and rejects a bad favorite or too many groups', () => {
    const legacy = validateLink({ name: 'A', url: 'https://example.com' })
    expect(legacy.ok).toBe(true)
    expect(legacy.value.favorite).toBe(false)
    expect(legacy.value.groupId).toBeUndefined()
    expect(validateLink({ name: 'A', url: 'https://example.com', favorite: 'yes' }).ok).toBe(false)
    const archived = validateLink({
      name: 'A',
      url: 'https://example.com',
      archivedAt: '2026-10-06T13:00:00.000Z',
    })
    expect(archived.value.archivedAt).toBe('2026-10-06T13:00:00.000Z')
    expect(
      validateLink({ name: 'A', url: 'https://example.com', archivedAt: 'yesterday' }).ok,
    ).toBe(false)
    const groups = Array.from({ length: 24 }, (_, index) => ({
      id: `g${index}`,
      name: `Group ${index}`,
    }))
    expect(validateGroupList(groups).ok).toBe(true)
    expect(validateGroupList([...groups, { id: 'extra', name: 'Extra' }]).error).toMatch(/too many/)
    expect(
      validateGroupList([
        { id: 'a', name: 'Work' },
        { id: 'b', name: ' work ' },
      ]).error,
    ).toMatch(/already exists/)
    expect(validateGroupName('  Clients  ', [{ id: 'a', name: 'Work' }]).value).toBe('Clients')
  })

  it('matches a link by name, URL, short label, or group, ignoring case', () => {
    const groups = [{ id: 'work', name: 'Work' }]
    const links = [
      { id: '1', name: 'GitHub', url: 'https://github.com/', short: 'GH', groupId: 'work' },
      { id: '2', name: 'Notes', url: 'https://example.com/notes', short: 'NO' },
    ]
    expect(filterLinks(links, groups, 'git').map((link) => link.id)).toEqual(['1'])
    expect(filterLinks(links, groups, 'EXAMPLE').map((link) => link.id)).toEqual(['2'])
    expect(filterLinks(links, groups, 'gh').map((link) => link.id)).toEqual(['1'])
    expect(filterLinks(links, groups, 'work').map((link) => link.id)).toEqual(['1'])
    expect(pageOf(links, 1, 1).items).toHaveLength(1)
    expect(pageOf(links, 2, 1).items[0].id).toBe('2')
  })

  it('keeps built-in theme text readable', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(contrastRatio(preset.ink, preset.paper)).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(ensureContrast(preset.accent, preset.paper), preset.paper),
      ).toBeGreaterThanOrEqual(4.5)
      for (const fill of [preset.ink, preset.secondary, preset.accent]) {
        expect(contrastRatio(readableForeground(fill), fill)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})
