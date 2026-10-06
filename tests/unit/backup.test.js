import { describe, expect, it } from 'vitest'
import { parseImport, serializeBackup } from '../../src/backup'
import { DEFAULT_LINKS, DEFAULT_PREFERENCES } from '../../src/data'
import { LIMITS } from '../../src/records'

const backup = {
  links: [{ name: 'Example', url: 'https://example.com/', short: 'EX' }],
  notes: 'remember',
  preferences: DEFAULT_PREFERENCES,
}

describe('backups', () => {
  it('round-trips a version 2 backup, reads version 1, and migrates legacy appearance', () => {
    const parsed = parseImport(
      serializeBackup({ ...backup, groups: [{ id: 'work', name: 'Work' }] }),
    )
    expect(parsed).toMatchObject({
      ok: true,
      kind: 'backup',
      notes: 'remember',
      groups: [{ id: 'work', name: 'Work' }],
    })
    expect(JSON.parse(serializeBackup(backup)).version).toBe(2)
    const version1 = parseImport(JSON.stringify({ version: 1, ...backup }))
    expect(version1.ok).toBe(true)
    expect(version1.groups).toEqual([])
    expect(version1.links[0].favorite).toBe(false)
    expect(version1.links[0].groupId).toBeUndefined()
    const legacy = parseImport(JSON.stringify({ paper: '#112233', font: 'Georgia' }))
    expect(legacy.ok).toBe(true)
    expect(legacy.kind).toBe('legacy')
    expect(legacy.preferences.paper).toBe('#112233')
    expect(legacy.preferences.font).toBe('Georgia')
    expect(legacy.preferences.ink).toBe(DEFAULT_PREFERENCES.ink)
    const withoutTab = { ...DEFAULT_PREFERENCES }
    delete withoutTab.openInNewTab
    const older = parseImport(
      JSON.stringify({
        version: 2,
        groups: [],
        links: backup.links,
        notes: '',
        preferences: withoutTab,
      }),
    )
    expect(older.ok).toBe(true)
    expect(older.preferences.openInNewTab).toBe(true)
    const archived = parseImport(
      JSON.stringify({
        version: 2,
        groups: [],
        links: [{ ...backup.links[0], archivedAt: '2026-10-06T13:00:00.000Z' }],
        notes: '',
        preferences: { ...DEFAULT_PREFERENCES, openInNewTab: false },
      }),
    )
    expect(archived.links[0].archivedAt).toBe('2026-10-06T13:00:00.000Z')
    expect(archived.preferences.openInNewTab).toBe(false)
  })

  it('rejects invalid imports without returning a partial backup', () => {
    expect(parseImport('{').ok).toBe(false)
    expect(
      parseImport(
        JSON.stringify({ version: 3, links: [], notes: '', preferences: DEFAULT_PREFERENCES }),
      ).error,
    ).toMatch(/version/)
    expect(
      parseImport(
        JSON.stringify({
          version: 2,
          groups: [{ id: 'work', name: 'Work' }],
          links: [{ name: 'A', url: 'https://example.com/', short: 'A', groupId: 'missing' }],
          notes: '',
          preferences: DEFAULT_PREFERENCES,
        }),
      ).error,
    ).toMatch(/unknown group/)
    expect(
      parseImport(
        JSON.stringify({
          version: 1,
          links: backup.links,
          notes: '',
          preferences: DEFAULT_PREFERENCES,
          extra: true,
        }),
      ).error,
    ).toMatch(/unknown/)
    expect(
      parseImport(
        JSON.stringify({
          version: 1,
          links: [{ name: 'A', url: 'javascript:alert(1)' }],
          notes: '',
          preferences: DEFAULT_PREFERENCES,
        }),
      ).ok,
    ).toBe(false)
    expect(parseImport(JSON.stringify({ font: 'Not A Font' })).ok).toBe(false)
    expect(parseImport('x'.repeat(LIMITS.importBytes + 1)).error).toMatch(/too large/)
    expect(DEFAULT_LINKS[0].url).toMatch(/^https?:/)
  })
})
