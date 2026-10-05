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
  it('round-trips a version 1 backup and migrates legacy appearance', () => {
    const parsed = parseImport(serializeBackup(backup))
    expect(parsed).toMatchObject({ ok: true, kind: 'backup', notes: 'remember' })
    const legacy = parseImport(JSON.stringify({ paper: '#112233', font: 'Georgia' }))
    expect(legacy.ok).toBe(true)
    expect(legacy.kind).toBe('legacy')
    expect(legacy.preferences.paper).toBe('#112233')
    expect(legacy.preferences.font).toBe('Georgia')
    expect(legacy.preferences.ink).toBe(DEFAULT_PREFERENCES.ink)
  })

  it('rejects invalid imports without returning a partial backup', () => {
    expect(parseImport('{').ok).toBe(false)
    expect(
      parseImport(
        JSON.stringify({ version: 2, links: [], notes: '', preferences: DEFAULT_PREFERENCES }),
      ).error,
    ).toMatch(/version/)
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
