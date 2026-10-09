// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { loadProviderBilling } from '../../src/model-billing.js'

const KEY = 'configured-test-key'

describe('model billing status', () => {
  it('marks OpenAI low when remaining credit is under one dollar', async () => {
    const fetch = async () =>
      new Response(JSON.stringify({ total_available: 0.25 }), { status: 200 })
    const statuses = await loadProviderBilling(
      [
        {
          id: 'openai',
          label: 'ChatGPT',
          model: 'gpt-4.1',
          configured: true,
          apiKey: KEY,
        },
      ],
      { fetch },
    )
    const openai = statuses.find((entry) => entry.id === 'openai')
    expect(openai.billing.state).toBe('low')
    expect(openai.billing.label).toMatch(/Low credit/)
    expect(JSON.stringify(openai)).not.toContain(KEY)
  })

  it('returns empty unknown labels for providers without a balance API', async () => {
    const statuses = await loadProviderBilling(
      [
        {
          id: 'google',
          label: 'Gemini',
          model: 'gemini-3.8-flash',
          configured: true,
          apiKey: KEY,
        },
      ],
      {
        fetch: async () => {
          throw new Error('should not call for google in this probe path')
        },
      },
    )
    const google = statuses.find((entry) => entry.id === 'google')
    expect(google.billing.state).toBe('unknown')
    expect(google.billing.label).toBe('')
  })

  it('treats an opaque OpenAI billing 403 as unknown, not low', async () => {
    const fetch = async () =>
      new Response(
        '{"error":{"message":"You have insufficient credits for this billing endpoint"}}',
        {
          status: 403,
        },
      )
    const statuses = await loadProviderBilling(
      [
        {
          id: 'openai',
          label: 'ChatGPT',
          model: 'gpt-4.1',
          configured: true,
          apiKey: KEY,
        },
      ],
      { fetch },
    )
    const openai = statuses.find((entry) => entry.id === 'openai')
    expect(openai.billing.state).toBe('unknown')
    expect(openai.billing.label).toBe('')
    expect(openai.billing.label).not.toMatch(/no api credits/i)
  })
})
