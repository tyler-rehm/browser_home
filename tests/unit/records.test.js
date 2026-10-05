import { describe, expect, it } from 'vitest'
import { contrastRatio, ensureContrast, readableForeground } from '../../src/color'
import { PRESETS } from '../../src/data'
import {
  LIMITS,
  normalizeUrl,
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
