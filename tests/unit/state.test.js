import { describe, expect, it } from 'vitest'
import { APP_KEYS, KEYS, removeKeys } from '../../src/persistence'
import { displayGroupId } from '../../src/records'
import { loadHomepage } from '../../src/state'

function memory(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  }
}

describe('loadHomepage', () => {
  it('keeps rejected link storage unchanged and usable', () => {
    const storage = memory({ [KEYS.links]: '{' })
    const loaded = loadHomepage(storage)
    expect(loaded.preserveLinks).toBe(true)
    expect(loaded.recovery.join(' ')).toMatch(/left untouched/)
    expect(storage.getItem(KEYS.links)).toBe('{')
    expect(loaded.links.length).toBeGreaterThan(0)
  })

  it('reads a legacy link list when groups are absent and leaves a dangling group id on disk', () => {
    const raw = JSON.stringify([
      { name: 'A', url: 'https://a.example/', short: 'A', groupId: 'missing' },
    ])
    const storage = memory({ [KEYS.links]: raw })
    const loaded = loadHomepage(storage)
    expect(loaded.groups).toEqual([])
    expect(loaded.preserveGroups).toBe(false)
    expect(storage.getItem(KEYS.links)).toBe(raw)
    expect(storage.getItem(KEYS.groups)).toBeNull()
    expect(loaded.links[0].groupId).toBe('missing')
    expect(displayGroupId(loaded.links[0], loaded.groups)).toBe('')
  })

  it('removes the groups key on reset and leaves unrelated storage', () => {
    const storage = memory({
      [KEYS.groups]: '[{"id":"work","name":"Work"}]',
      [KEYS.links]: '[]',
      unrelated: 'keep',
    })
    expect(APP_KEYS).toContain(KEYS.groups)
    expect(removeKeys(storage, APP_KEYS).ok).toBe(true)
    expect(storage.getItem(KEYS.groups)).toBeNull()
    expect(storage.getItem(KEYS.links)).toBeNull()
    expect(storage.getItem('unrelated')).toBe('keep')
  })

  it('uses preference fallbacks for null colors and unknown fonts', () => {
    const raw = JSON.stringify({ paper: null, font: 'Papyrus', ink: '#112233' })
    const storage = memory({ [KEYS.preferences]: raw })
    const loaded = loadHomepage(storage)
    expect(loaded.preferences.paper).toBe('#eff1e9')
    expect(loaded.preferences.font).toBe('Manrope')
    expect(loaded.preferences.ink).toBe('#112233')
    expect(storage.getItem(KEYS.preferences)).toBe(raw)
  })
})
