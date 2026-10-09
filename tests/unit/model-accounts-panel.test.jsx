import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModelAccountsPanel } from '../../src/components/model-accounts-panel'

const providers = [
  {
    id: 'anthropic',
    label: 'Claude',
    model: 'claude-sonnet-5-5',
    modelOptions: ['claude-sonnet-5-5', 'claude-opus-4-1', 'claude-haiku-4-5'],
    configured: true,
    expiryWarning: '',
    refreshDoc: '/docs/ask-models.md#refresh-claude',
    billingUrl: 'https://console.anthropic.com/settings/billing',
  },
  {
    id: 'openai',
    label: 'ChatGPT',
    model: 'gpt-4.1',
    modelOptions: ['gpt-4.1', 'gpt-4o', 'gpt-4.1-mini'],
    configured: false,
    expiryWarning: '',
    refreshDoc: '/docs/ask-models.md#refresh-chatgpt',
    billingUrl: 'https://platform.openai.com/settings/organization/billing',
  },
  {
    id: 'google',
    label: 'Gemini',
    model: 'gemini-3.8-flash',
    modelOptions: ['gemini-3.8-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    configured: true,
    expiryWarning: 'API key expires in 2 days.',
    refreshDoc: '/docs/ask-models.md#refresh-gemini',
    billingUrl: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'xai',
    label: 'Grok',
    model: 'grok-3',
    modelOptions: ['grok-3', 'grok-3-mini'],
    configured: true,
    expiryWarning: '',
    refreshDoc: '/docs/ask-models.md#refresh-grok',
    billingUrl: 'https://console.x.ai/',
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    model: 'fast',
    modelOptions: ['fast', 'pro', 'reasoning'],
    configured: true,
    expiryWarning: '',
    refreshDoc: '/docs/ask-models.md#refresh-perplexity',
    billingUrl: 'https://www.perplexity.ai/account/api/billing',
  },
]

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Model accounts panel', () => {
  it('lists Balance, Console, and Refresh links and saves a model without balance status', async () => {
    const calls = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        calls.push({ url: String(url), init })
        if (String(url).endsWith('/api/providers')) return json({ providers })
        if (String(url).endsWith('/api/provider-model')) {
          const body = JSON.parse(init.body)
          expect(body).toEqual({ id: 'anthropic', model: 'claude-opus-4-1' })
          return json({
            providers: providers.map((provider) =>
              provider.id === 'anthropic' ? { ...provider, model: 'claude-opus-4-1' } : provider,
            ),
          })
        }
        throw new Error(`unexpected ${url}`)
      }),
    )
    const user = userEvent.setup()
    render(<ModelAccountsPanel active compact />)
    expect(await screen.findByRole('combobox', { name: /Default model for Claude/i })).toBeTruthy()
    expect(screen.getByText('Not configured')).toBeTruthy()
    expect(screen.getByText(/expires in 2 days/i)).toBeTruthy()
    expect(screen.queryByText(/Not readable via API/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /Refresh balance/i })).toBeNull()
    expect(screen.getByRole('link', { name: 'Ask models docs' })).toHaveAttribute(
      'href',
      '/docs/ask-models.md',
    )
    expect(screen.getAllByRole('link', { name: 'Balance' })[0]).toHaveAttribute(
      'href',
      'https://console.anthropic.com/settings/billing',
    )
    expect(screen.getAllByRole('link', { name: 'Console' })[0]).toHaveAttribute(
      'href',
      'https://console.anthropic.com/settings/billing',
    )
    expect(screen.getAllByRole('link', { name: 'Refresh' })[0]).toHaveAttribute(
      'href',
      '/docs/ask-models.md#refresh-claude',
    )
    expect(document.body.textContent).not.toContain('sk-')
    expect(document.body.textContent).not.toContain('apiKey')
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Default model for Claude/i }),
      'claude-opus-4-1',
    )
    await waitFor(() =>
      expect(calls.some((call) => call.url.endsWith('/api/provider-model'))).toBe(true),
    )
    expect(calls.every((call) => !call.url.includes('/api/provider-status'))).toBe(true)
  })
})
