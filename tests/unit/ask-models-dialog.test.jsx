import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AskModelsDialog } from '../../src/components/ask-models-dialog'

const providers = [
  {
    id: 'anthropic',
    label: 'Claude',
    model: 'claude-sonnet-5-5',
    modelOptions: ['claude-sonnet-5-5', 'claude-opus-4-1', 'claude-haiku-4-5'],
    configured: true,
    expiryWarning: 'API key expires in 3 days. See refresh steps in docs/ask-models.md.',
    refreshDoc: '/docs/ask-models.md#refresh-claude',
  },
  {
    id: 'openai',
    label: 'ChatGPT',
    model: 'gpt-4.1',
    modelOptions: ['gpt-4.1', 'gpt-4o', 'gpt-4.1-mini'],
    configured: true,
    expiryWarning: '',
    refreshDoc: '/docs/ask-models.md#refresh-chatgpt',
  },
  {
    id: 'google',
    label: 'Gemini',
    model: 'gemini-3.8-flash',
    modelOptions: ['gemini-3.8-flash', 'gemini-2.5-pro'],
    configured: false,
    expiryWarning: '',
    refreshDoc: '/docs/ask-models.md#refresh-gemini',
  },
  {
    id: 'xai',
    label: 'Grok',
    model: 'grok-3',
    modelOptions: ['grok-3', 'grok-3-mini'],
    configured: true,
    expiryWarning: '',
    refreshDoc: '/docs/ask-models.md#refresh-grok',
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    model: 'fast',
    modelOptions: ['fast', 'pro', 'reasoning'],
    configured: true,
    expiryWarning: '',
    refreshDoc: '/docs/ask-models.md#refresh-perplexity',
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

describe('Ask models dialog', () => {
  it('asks the checked providers, shows tabs, and copies a dossier', async () => {
    const calls = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        calls.push({ url: String(url), init })
        if (String(url).endsWith('/api/providers')) return json({ providers })
        if (String(url).endsWith('/api/provider-status')) {
          throw new Error('provider-status must not be fetched for balance')
        }
        const body = JSON.parse(init.body)
        if (body.id === 'anthropic') {
          return json({
            ok: true,
            id: 'anthropic',
            label: 'Claude',
            model: 'claude-sonnet-5-5',
            actualModel: 'claude-sonnet-5-5',
            text: `### Claude heading\n\n- point one\n\n${'long detail '.repeat(30)}`,
            httpStatus: 200,
            raw: '{"content":[{"text":"### Claude heading"}]}',
          })
        }
        if (body.id === 'openai') {
          return json({
            ok: false,
            id: 'openai',
            label: 'ChatGPT',
            model: 'gpt-4.1',
            error: 'upstream down',
            httpStatus: 500,
            raw: '{"error":"upstream down"}',
          })
        }
        if (body.id === 'perplexity') {
          return json({
            ok: true,
            id: 'perplexity',
            label: 'Perplexity',
            model: 'fast',
            actualModel: 'sonar-pro',
            text: 'See [4].',
            citations: [{ id: '4', title: 'Tailwind docs', url: 'https://tailwindcss.com/docs' }],
            httpStatus: 200,
            raw: '{"output_text":"See [4]."}',
          })
        }
        throw new Error(`unexpected ${body.id}`)
      }),
    )
    const user = userEvent.setup()
    render(<AskModelsDialog open onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
    expect(await screen.findByRole('checkbox', { name: /Claude/ })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: /ChatGPT/ })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: /Gemini/ })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /Grok/ })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: /Perplexity/ })).toBeEnabled()
    expect(screen.getByText(/expires in 3 days/i)).toBeTruthy()
    expect(screen.queryByText(/Low credit/i)).toBeNull()
    const refreshHrefs = screen
      .getAllByRole('link', { name: 'Refresh steps' })
      .map((link) => link.getAttribute('href'))
    expect(refreshHrefs).toEqual(['/docs/ask-models.md#refresh-claude'])
    fireEvent.click(screen.getByRole('checkbox', { name: /Grok/ }))
    expect(screen.getByRole('checkbox', { name: /Grok/ })).not.toBeChecked()
    await user.type(screen.getByRole('textbox', { name: 'Prompt' }), 'Compare these approaches')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled())
    expect(screen.getByText(/Asked 3 providers/i)).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Claude \(ok\)/i })).toBeTruthy()
    expect(document.querySelector('.ask-status--ok')).toBeTruthy()
    expect(document.querySelector('.ask-status--failed')).toBeTruthy()
    expect(screen.getByText(/Compiled JSON/i)).toBeTruthy()
    expect(screen.getByText(/rawOmitted/)).toBeTruthy()
    expect(screen.queryByText(/"raw":/)).toBeNull()
    const overviewPreview = document.querySelector('.ask-overview-preview')
    expect(overviewPreview?.textContent).toContain('Claude heading')
    expect(overviewPreview?.textContent.length).toBeLessThanOrEqual(97)
    const claudeOverview = screen.getByRole('button', { name: /Claude[\s\S]*Full reply/i })
    expect(claudeOverview).toBeTruthy()
    await user.click(claudeOverview)
    expect(screen.getByRole('tab', { name: /Claude \(ok\)/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('heading', { name: 'Claude heading' })).toBeTruthy()
    expect(screen.getByText('point one')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: /Perplexity \(ok\)/i }))
    expect(screen.getByText(/fast → sonar-pro/)).toBeTruthy()
    expect(screen.getByRole('link', { name: /Tailwind docs/ })).toHaveAttribute(
      'href',
      'https://tailwindcss.com/docs',
    )
    await user.click(screen.getByRole('tab', { name: /ChatGPT \(failed\)/i }))
    await user.click(screen.getByRole('tab', { name: 'Raw' }))
    expect(screen.getByText(/HTTP 500/)).toBeTruthy()
    expect(screen.getByText(/upstream down/)).toBeTruthy()
    const asked = calls
      .filter((call) => call.url.endsWith('/api/ask'))
      .map((call) => JSON.parse(call.init.body))
    expect(asked.map((body) => body.id).sort()).toEqual(['anthropic', 'openai', 'perplexity'])
    expect(asked.every((body) => typeof body.model === 'string' && body.model)).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(async () => {
      expect(await window.navigator.clipboard.readText()).toContain('Compare these approaches')
    })
    expect(await screen.findByText(/Dossier copied/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy()
    const dossier = await window.navigator.clipboard.readText()
    expect(dossier).toContain('Claude heading')
    expect(dossier).toContain('upstream down')
    expect(dossier).toContain('See [4].')
    expect(JSON.stringify(localStorage)).not.toContain('Compare these approaches')
  }, 15_000)

  it('offers a settings gear that opens Model accounts', async () => {
    const onManageAccounts = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).endsWith('/api/providers')) return json({ providers })
        throw new Error(`unexpected ${url}`)
      }),
    )
    const user = userEvent.setup()
    render(<AskModelsDialog open onClose={() => {}} onManageAccounts={onManageAccounts} />)
    await screen.findByRole('checkbox', { name: /Claude/ })
    await user.click(screen.getByRole('button', { name: 'Model accounts settings' }))
    expect(onManageAccounts).toHaveBeenCalled()
  })

  it('shows a low-credit hint after an ask fails for insufficient credits', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        if (String(url).endsWith('/api/providers')) {
          return json({
            providers: providers.map((provider) => ({
              ...provider,
              expiryWarning: '',
            })),
          })
        }
        const body = JSON.parse(init.body)
        if (body.id === 'openai') {
          return json({
            ok: false,
            id: 'openai',
            label: 'ChatGPT',
            model: 'gpt-4.1',
            error: 'You have insufficient credits',
            httpStatus: 402,
            raw: '',
          })
        }
        return json({
          ok: true,
          id: body.id,
          label: body.id,
          model: 'model',
          text: 'ok',
          httpStatus: 200,
          raw: '{}',
        })
      }),
    )
    const user = userEvent.setup()
    render(<AskModelsDialog open onClose={() => {}} />)
    await screen.findByRole('checkbox', { name: /ChatGPT/ })
    fireEvent.click(screen.getByRole('checkbox', { name: /Claude/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Grok/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Perplexity/ }))
    await user.type(screen.getByRole('textbox', { name: 'Prompt' }), 'Ping')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText(/Low credit — check Balance/i)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Refresh steps' })).toHaveAttribute(
      'href',
      '/docs/ask-models.md#refresh-chatgpt',
    )
  })

  it('does not show Refresh steps without expiry or quota failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).endsWith('/api/providers')) {
          return json({
            providers: providers.map((provider) => ({
              ...provider,
              expiryWarning: '',
            })),
          })
        }
        throw new Error(`unexpected ${url}`)
      }),
    )
    render(<AskModelsDialog open onClose={() => {}} />)
    await screen.findByRole('checkbox', { name: /Claude/ })
    expect(screen.queryByRole('link', { name: 'Refresh steps' })).toBeNull()
  })

  it('shows pending provider tabs and names the last waiting provider', async () => {
    let releaseGemini
    const geminiGate = new Promise((resolve) => {
      releaseGemini = resolve
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        if (String(url).endsWith('/api/providers')) {
          return json({
            providers: providers.map((provider) =>
              provider.id === 'google' ? { ...provider, configured: true } : provider,
            ),
          })
        }
        const body = JSON.parse(init.body)
        if (body.id === 'google') {
          await geminiGate
          return json({
            ok: true,
            id: 'google',
            label: 'Gemini',
            model: 'gemini-3.8-flash',
            text: 'gemini reply',
            httpStatus: 200,
            raw: '{}',
          })
        }
        return json({
          ok: true,
          id: body.id,
          label: providers.find((provider) => provider.id === body.id)?.label || body.id,
          model: 'model',
          text: `${body.id} reply`,
          httpStatus: 200,
          raw: '{}',
        })
      }),
    )
    const user = userEvent.setup()
    render(<AskModelsDialog open onClose={() => {}} />)
    await screen.findByRole('checkbox', { name: /Gemini/ })
    fireEvent.click(screen.getByRole('checkbox', { name: /Claude/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /ChatGPT/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Grok/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Perplexity/ }))
    await user.type(screen.getByRole('textbox', { name: 'Prompt' }), 'Ping')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByRole('tab', { name: /Gemini \(Asking/i })).toBeTruthy()
    expect(document.querySelector('.ask-status--asking')).toBeTruthy()
    await waitFor(() => expect(screen.getByText(/Waiting on Gemini/i)).toBeTruthy())
    releaseGemini()
    await waitFor(() => expect(screen.getByRole('tab', { name: /Gemini \(ok\)/i })).toBeTruthy())
    expect(screen.queryByRole('tab', { name: /Asking/i })).toBeNull()
  })

  it('aborts an in-flight ask when the dialog closes', async () => {
    let askSignal
    vi.stubGlobal(
      'fetch',
      vi.fn((url, init) => {
        if (String(url).endsWith('/api/providers')) return Promise.resolve(json({ providers }))
        askSignal = init.signal
        return new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            const error = new Error('aborted')
            error.name = 'AbortError'
            reject(error)
          })
        })
      }),
    )
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AskModelsDialog open onClose={onClose} />)
    await screen.findByRole('checkbox', { name: /Claude/ })
    await user.type(screen.getByRole('textbox', { name: 'Prompt' }), 'Still running')
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    await waitFor(() => expect(askSignal).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(askSignal.aborted).toBe(true)
    expect(onClose).toHaveBeenCalled()
  })
})
