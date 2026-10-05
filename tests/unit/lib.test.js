import { describe, expect, it } from 'vitest'
import { host, normalizeUrl, searchDestination } from '../../src/lib'
describe('URL utilities', () => {
  it('normalizes domains to HTTPS', () =>
    expect(normalizeUrl('example.com')).toBe('https://example.com/'))
  it('allows local HTTP URLs', () =>
    expect(normalizeUrl('http://localhost:3000')).toBe('http://localhost:3000/'))
  it('rejects unsafe protocols', () =>
    expect(() => normalizeUrl('javascript://alert')).toThrow(/HTTP/))
  it('extracts a readable host', () => expect(host('https://www.github.com/a')).toBe('github.com'))
  it('builds encoded searches', () =>
    expect(searchDestination('tailwind ui')).toBe('https://www.google.com/search?q=tailwind%20ui'))
})
