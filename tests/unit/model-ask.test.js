// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  askProvider,
  expiryWarning,
  formatCompiledBundle,
  formatDossier,
  isAllowedModel,
  loadProviderSecrets,
  parseExpiresAt,
  parseSecrets,
  publicProviders,
  redact,
  validatePrompt,
} from '../../src/model-ask'

const KEY = 'configured-test-key'

function reader(text, error) {
  return () => {
    if (error) throw error
    return text
  }
}

describe('model secrets and dossier', () => {
  it('treats a missing file, invalid JSON, and an empty key as not configured', () => {
    for (const providers of [
      loadProviderSecrets('/missing/model-secrets.json', reader('', new Error('ENOENT'))),
      parseSecrets('{'),
      parseSecrets(JSON.stringify({ anthropic: { apiKey: '   ' } })),
    ]) {
      expect(providers).toHaveLength(5)
      expect(providers.every((provider) => provider.configured === false)).toBe(true)
      expect(providers.every((provider) => provider.apiKey === '')).toBe(true)
    }
  })

  it('publishes curated model options without api keys', () => {
    const providers = parseSecrets(
      JSON.stringify({ anthropic: { apiKey: KEY, model: 'legacy-model' } }),
    )
    const published = publicProviders(providers)
    const claude = published.find((provider) => provider.id === 'anthropic')
    expect(claude.modelOptions[0]).toBe('legacy-model')
    expect(claude.modelOptions).toContain('claude-sonnet-5-5')
    expect(JSON.stringify(published)).not.toContain(KEY)
    expect(JSON.stringify(published)).not.toContain('apiKey')
    expect(isAllowedModel('anthropic', 'claude-opus-4-1')).toBe(true)
    expect(isAllowedModel('anthropic', 'not-a-model')).toBe(false)
  })

  it('applies a model override and keeps the default when model is blank', () => {
    const providers = parseSecrets(
      JSON.stringify({
        anthropic: { apiKey: KEY, model: 'claude-opus-4-1', workspaceId: 'ws_123' },
        openai: { apiKey: KEY, model: '  ' },
        google: { apiKey: KEY },
        perplexity: { apiKey: KEY, expiresAt: '2030-01-15' },
      }),
    )
    expect(providers.find((provider) => provider.id === 'anthropic')).toMatchObject({
      configured: true,
      model: 'claude-opus-4-1',
      apiKey: KEY,
      workspaceId: 'ws_123',
    })
    expect(providers.find((provider) => provider.id === 'openai').model).toBe('gpt-4.1')
    expect(providers.find((provider) => provider.id === 'google').model).toBe('gemini-3.8-flash')
    expect(providers.find((provider) => provider.id === 'perplexity')).toMatchObject({
      configured: true,
      model: 'fast',
      expiresAt: '2030-01-15T00:00:00.000Z',
    })
  })

  it('parses expiry and warns inside seven days', () => {
    expect(parseExpiresAt('not-a-date')).toBe('')
    expect(parseExpiresAt('2030-01-15')).toBe('2030-01-15T00:00:00.000Z')
    const now = new Date('2026-10-08T12:00:00.000Z')
    expect(expiryWarning('2026-10-10', now)).toMatch(/expires in 2 days/)
    expect(expiryWarning('2026-10-01', now)).toMatch(/expired/i)
    expect(expiryWarning('2030-01-15', now)).toBe('')
    expect(expiryWarning('', now)).toBe('')
  })

  it('strips a configured key from error text', () => {
    const error = redact(`upstream said ${KEY} twice ${KEY}`, [KEY, ''])
    expect(error).toBe('upstream said [redacted] twice [redacted]')
    expect(error).not.toContain(KEY)
    expect(redact('x'.repeat(250), []).length).toBe(200)
  })

  it('rejects an empty prompt and a 32001-character prompt', () => {
    expect(validatePrompt('')).toBe('Enter a prompt.')
    expect(validatePrompt('   ')).toBe('Enter a prompt.')
    expect(validatePrompt('a'.repeat(32000))).toBe('')
    expect(validatePrompt('a'.repeat(32001))).toBe('Prompt is too long.')
  })

  it('formats a dossier with the prompt, one reply, and one failure', () => {
    const dossier = formatDossier({
      prompt: 'Compare these approaches',
      results: [
        {
          ok: true,
          label: 'Claude',
          model: 'claude-sonnet-5-5',
          text: 'Use a loopback proxy.',
        },
        {
          ok: false,
          label: 'ChatGPT',
          model: 'gpt-4.1',
          error: 'Timed out',
        },
      ],
    })
    expect(dossier).toContain('# Prompt')
    expect(dossier).toContain('Compare these approaches')
    expect(dossier).toContain('## Claude')
    expect(dossier).toContain('Status: ok')
    expect(dossier).toContain('## ChatGPT')
    expect(dossier).toContain('Status: failed')
  })
})

describe('askProvider', () => {
  const cases = [
    {
      id: 'anthropic',
      label: 'Claude',
      model: 'claude-sonnet-5-5',
      url: 'https://api.anthropic.com/v1/messages',
      header: 'x-api-key',
      payload: { content: [{ type: 'text', text: 'claude says' }, { text: ' more' }] },
      text: 'claude says more',
    },
    {
      id: 'openai',
      label: 'ChatGPT',
      model: 'gpt-4.1',
      url: 'https://api.openai.com/v1/chat/completions',
      header: 'authorization',
      payload: { choices: [{ message: { content: 'openai says' } }] },
      text: 'openai says',
    },
    {
      id: 'google',
      label: 'Gemini',
      model: 'gemini-3.8-flash',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      header: 'x-goog-api-key',
      payload: { candidates: [{ content: { parts: [{ text: 'gemini says' }] } }] },
      text: 'gemini says',
    },
    {
      id: 'xai',
      label: 'Grok',
      model: 'grok-3',
      url: 'https://api.x.ai/v1/chat/completions',
      header: 'authorization',
      payload: { choices: [{ message: { content: 'grok says' } }] },
      text: 'grok says',
    },
    {
      id: 'perplexity',
      label: 'Perplexity',
      model: 'fast',
      url: 'https://api.perplexity.ai/v1/responses',
      header: 'authorization',
      payload: {
        output: [
          {
            type: 'message',
            content: [{ type: 'output_text', text: 'perplexity says' }],
          },
        ],
      },
      text: 'perplexity says',
    },
  ]

  it.each(cases)('calls $label and returns the reply text', async (entry) => {
    const calls = []
    const fetch = async (url, init) => {
      calls.push({ url, init })
      return new Response(JSON.stringify(entry.payload), { status: 200 })
    }
    const result = await askProvider({
      provider: { id: entry.id, label: entry.label, model: entry.model, apiKey: KEY },
      prompt: 'Say hello',
      fetch,
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(entry.url)
    expect(calls[0].url).not.toContain(KEY)
    expect(calls[0].init.headers[entry.header]).toContain(KEY)
    const body = JSON.parse(calls[0].init.body)
    if (entry.id === 'google') expect(calls[0].url).toContain(entry.model)
    else if (entry.id === 'perplexity') {
      expect(body.preset).toBe(entry.model)
      expect(body.input).toBe('Say hello')
    } else expect(body.model).toBe(entry.model)
    expect(result).toMatchObject({ ok: true, text: entry.text, model: entry.model })
  })

  it('sends anthropic workspace id only when configured', async () => {
    const calls = []
    const fetch = async (_url, init) => {
      calls.push(init.headers)
      return new Response(JSON.stringify({ content: [{ text: 'ok' }] }), { status: 200 })
    }
    await askProvider({
      provider: {
        id: 'anthropic',
        label: 'Claude',
        model: 'claude-sonnet-5-5',
        apiKey: KEY,
        workspaceId: 'ws_abc',
      },
      prompt: 'hi',
      fetch,
    })
    expect(calls[0]['anthropic-workspace-id']).toBe('ws_abc')
    await askProvider({
      provider: { id: 'anthropic', label: 'Claude', model: 'claude-sonnet-5-5', apiKey: KEY },
      prompt: 'hi',
      fetch,
    })
    expect(calls[1]['anthropic-workspace-id']).toBeUndefined()
  })

  it('reports a non-OK response without calling another provider', async () => {
    const calls = []
    const fetch = async (url) => {
      calls.push(url)
      return new Response(`denied ${KEY}`, { status: 401 })
    }
    const result = await askProvider({
      provider: { id: 'anthropic', label: 'Claude', model: 'claude-sonnet-5-5', apiKey: KEY },
      prompt: 'Say hello',
      fetch,
    })
    expect(calls).toEqual(['https://api.anthropic.com/v1/messages'])
    expect(result.ok).toBe(false)
    expect(result.error).not.toContain(KEY)
    expect(result.raw).not.toContain(KEY)
    expect(result.httpStatus).toBe(401)
  })

  it('builds a compiled bundle without secrets or full raw bodies', () => {
    const hugeRaw = `{"ok":true,"signature":"${'x'.repeat(4000)}"}`
    const bundle = formatCompiledBundle({
      prompt: 'hi',
      askedAt: '2026-10-08T00:00:00.000Z',
      results: [
        {
          id: 'openai',
          label: 'ChatGPT',
          model: 'gpt-4.1',
          actualModel: 'gpt-4.1-2025-04-14',
          ok: true,
          latencyMs: 12,
          httpStatus: 200,
          text: 'pong',
          raw: hugeRaw,
        },
      ],
    })
    expect(bundle).toMatchObject({
      prompt: 'hi',
      askedAt: '2026-10-08T00:00:00.000Z',
      results: [
        {
          id: 'openai',
          ok: true,
          text: 'pong',
          httpStatus: 200,
          actualModel: 'gpt-4.1-2025-04-14',
          rawOmitted: true,
        },
      ],
    })
    expect(bundle.results[0].raw).toBeUndefined()
    expect(JSON.stringify(bundle)).not.toContain(KEY)
    expect(JSON.stringify(bundle)).not.toContain('signature')
  })

  it('exposes actualModel when OpenAI-shaped payloads differ from the request', async () => {
    const result = await askProvider({
      provider: { id: 'xai', label: 'Grok', model: 'grok-3', apiKey: KEY },
      prompt: 'hi',
      fetch: async () =>
        new Response(
          JSON.stringify({
            model: 'grok-4.3',
            choices: [{ message: { content: 'hello' } }],
          }),
          { status: 200 },
        ),
    })
    expect(result).toMatchObject({
      ok: true,
      model: 'grok-3',
      actualModel: 'grok-4.3',
      text: 'hello',
    })
  })

  it('attaches Perplexity Agent search result citations', async () => {
    const result = await askProvider({
      provider: { id: 'perplexity', label: 'Perplexity', model: 'fast', apiKey: KEY },
      prompt: 'hi',
      fetch: async () =>
        new Response(
          JSON.stringify({
            model: 'sonar-pro',
            output: [
              {
                type: 'search_results',
                results: [
                  {
                    id: 4,
                    title: 'Tailwind docs',
                    url: 'https://tailwindcss.com/docs',
                  },
                  {
                    id: 6,
                    title: 'Heroicons',
                    url: 'https://heroicons.com',
                  },
                ],
              },
              {
                type: 'message',
                content: [{ type: 'output_text', text: 'See [4] and [6].' }],
              },
            ],
          }),
          { status: 200 },
        ),
    })
    expect(result).toMatchObject({
      ok: true,
      text: 'See [4] and [6].',
      actualModel: 'sonar-pro',
      citations: [
        { id: '4', title: 'Tailwind docs', url: 'https://tailwindcss.com/docs' },
        { id: '6', title: 'Heroicons', url: 'https://heroicons.com' },
      ],
    })
  })

  it('reports a 60-second abort as a timeout', async () => {
    let calls = 0
    const fetch = (_url, init) => {
      calls += 1
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(init.signal.reason))
      })
    }
    const result = await askProvider({
      provider: { id: 'openai', label: 'ChatGPT', model: 'gpt-4.1', apiKey: KEY },
      prompt: 'Say hello',
      fetch,
      timeoutMs: 20,
    })
    expect(calls).toBe(1)
    expect(result).toMatchObject({ ok: false, error: 'Timed out' })
  })
})
