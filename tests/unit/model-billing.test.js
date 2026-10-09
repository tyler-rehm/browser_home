// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { isQuotaCreditError, loadProviderBilling, lowCreditHint } from '../../src/model-billing.js'

const KEY = 'configured-test-key'

describe('model billing status', () => {
  it('returns local unknown status without calling fetch', async () => {
    const fetch = vi.fn(async () => {
      throw new Error('vendor billing must not be contacted')
    })
    const statuses = await loadProviderBilling(
      [
        {
          id: 'openai',
          label: 'ChatGPT',
          model: 'gpt-4.1',
          configured: true,
          apiKey: KEY,
        },
        {
          id: 'google',
          label: 'Gemini',
          model: 'gemini-3.8-flash',
          configured: true,
          apiKey: KEY,
        },
      ],
      { fetch },
    )
    expect(fetch).not.toHaveBeenCalled()
    expect(statuses).toHaveLength(5)
    for (const entry of statuses) {
      expect(entry.billing.state).toBe('unknown')
      expect(entry.billing.label).toBe('')
    }
    expect(JSON.stringify(statuses)).not.toContain(KEY)
  })

  it('detects clear quota and credit ask errors', () => {
    expect(isQuotaCreditError('You have insufficient credits')).toBe(true)
    expect(isQuotaCreditError('quota exceeded for this key')).toBe(true)
    expect(isQuotaCreditError('No API credits remaining')).toBe(true)
    expect(isQuotaCreditError('upstream down')).toBe(false)
    expect(lowCreditHint('openai')).toMatchObject({
      state: 'low',
      url: expect.stringContaining('openai.com'),
    })
  })
})
