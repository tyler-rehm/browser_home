import { describe, expect, it } from 'vitest'
import { KEYS } from '../../src/persistence'
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
