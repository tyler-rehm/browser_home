export const PROMPT_MAX = 32000
export const ERROR_MAX = 200
export const RAW_MAX = 24 * 1024
export const BODY_MAX = 128 * 1024
export const ASK_TIMEOUT_MS = 60_000
export const EXPIRY_WARN_DAYS = 7

export const PROVIDERS = [
  { id: 'anthropic', label: 'Claude', model: 'claude-sonnet-5-5' },
  { id: 'openai', label: 'ChatGPT', model: 'gpt-4.1' },
  { id: 'google', label: 'Gemini', model: 'gemini-3.8-flash' },
  { id: 'xai', label: 'Grok', model: 'grok-3' },
  { id: 'perplexity', label: 'Perplexity', model: 'fast' },
]

/** Curated model ids selectable in Settings and as Ask-time overrides. */
export const MODEL_OPTIONS = {
  anthropic: ['claude-sonnet-5-5', 'claude-opus-4-1', 'claude-haiku-4-5'],
  openai: ['gpt-4.1', 'gpt-4o', 'gpt-4.1-mini'],
  google: ['gemini-3.8-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'],
  xai: ['grok-3', 'grok-3-mini', 'grok-2-1212'],
  perplexity: ['fast', 'pro', 'reasoning'],
}

export const BILLING_URLS = {
  anthropic: 'https://console.anthropic.com/settings/billing',
  openai: 'https://platform.openai.com/settings/organization/billing',
  google: 'https://aistudio.google.com/apikey',
  xai: 'https://console.x.ai/',
  perplexity: 'https://www.perplexity.ai/account/api/billing',
}

export const REFRESH_DOCS = {
  anthropic: '/docs/ask-models.md#refresh-claude',
  openai: '/docs/ask-models.md#refresh-chatgpt',
  google: '/docs/ask-models.md#refresh-gemini',
  xai: '/docs/ask-models.md#refresh-grok',
  perplexity: '/docs/ask-models.md#refresh-perplexity',
}

function blankProviders() {
  return PROVIDERS.map((entry) => ({
    id: entry.id,
    label: entry.label,
    model: entry.model,
    configured: false,
    apiKey: '',
    expiresAt: '',
    workspaceId: '',
  }))
}

function textField(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseExpiresAt(value) {
  const raw = textField(value)
  if (!raw) return ''
  const day = raw.match(/^(\d{4}-\d{2}-\d{2})$/)
  const date = day ? new Date(`${day[1]}T00:00:00.000Z`) : new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

export function daysUntilExpiry(expiresAt, now = new Date()) {
  const iso = parseExpiresAt(expiresAt)
  if (!iso) return null
  const end = new Date(iso).getTime()
  const start = now.getTime()
  return Math.ceil((end - start) / (24 * 60 * 60 * 1000))
}

export function expiryWarning(expiresAt, now = new Date()) {
  const days = daysUntilExpiry(expiresAt, now)
  if (days === null) return ''
  if (days < 0) return 'API key expired. See refresh steps in docs/ask-models.md.'
  if (days <= EXPIRY_WARN_DAYS) {
    return `API key expires in ${days} day${days === 1 ? '' : 's'}. See refresh steps in docs/ask-models.md.`
  }
  return ''
}

export function parseSecrets(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return blankProviders()
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return blankProviders()
  return PROVIDERS.map((entry) => {
    const raw = parsed[entry.id]
    const record = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    const apiKey = textField(record.apiKey)
    const model = textField(record.model) || entry.model
    return {
      id: entry.id,
      label: entry.label,
      model,
      configured: apiKey.length > 0,
      apiKey,
      expiresAt: parseExpiresAt(record.expiresAt),
      workspaceId: entry.id === 'anthropic' ? textField(record.workspaceId) : '',
    }
  })
}

export function loadProviderSecrets(filePath, readFileSync) {
  try {
    return parseSecrets(readFileSync(filePath, 'utf8'))
  } catch {
    return blankProviders()
  }
}

export function secretsDocument(providers) {
  const document = {}
  for (const provider of providers) {
    document[provider.id] = {
      apiKey: provider.apiKey || '',
      model:
        provider.model === PROVIDERS.find((entry) => entry.id === provider.id)?.model
          ? ''
          : provider.model || '',
      expiresAt: provider.expiresAt ? provider.expiresAt.slice(0, 10) : '',
    }
    if (provider.id === 'anthropic') document.anthropic.workspaceId = provider.workspaceId || ''
  }
  return document
}

export function modelOptionsFor(id, currentModel = '') {
  const base = MODEL_OPTIONS[id] ? [...MODEL_OPTIONS[id]] : []
  const current = textField(currentModel)
  if (current && !base.includes(current)) base.unshift(current)
  return base
}

export function isAllowedModel(providerId, model) {
  const value = textField(model)
  if (!value) return false
  const options = MODEL_OPTIONS[providerId]
  return Array.isArray(options) && options.includes(value)
}

export function publicProviders(providers, now = new Date()) {
  return providers.map(({ id, label, model, configured, expiresAt }) => ({
    id,
    label,
    model,
    modelOptions: modelOptionsFor(id, model),
    configured,
    expiresAt: expiresAt || '',
    expiryWarning: configured ? expiryWarning(expiresAt, now) : '',
    refreshDoc: REFRESH_DOCS[id] || '/docs/ask-models.md',
    billingUrl: BILLING_URLS[id] || '',
  }))
}

export function validatePrompt(prompt) {
  if (typeof prompt !== 'string' || prompt.trim() === '') return 'Enter a prompt.'
  if (prompt.length > PROMPT_MAX) return 'Prompt is too long.'
  return ''
}

export function redact(text, keys) {
  let value = typeof text === 'string' ? text : ''
  for (const key of keys) {
    if (!key) continue
    value = value.split(key).join('[redacted]')
  }
  if (value.length > ERROR_MAX) value = value.slice(0, ERROR_MAX)
  return value
}

export function formatDossier({ prompt, results }) {
  const sections = results.map((result) => {
    const status = result.ok ? 'ok' : 'failed'
    const body = result.ok ? result.text : result.error
    return `## ${result.label}\nModel: ${result.model}\nStatus: ${status}\n\n${body}`
  })
  return `# Prompt\n\n${prompt}\n\n${sections.join('\n\n')}\n`
}

export function previewText(text, max = 160) {
  const value = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : ''
  if (value.length <= max) return value
  return `${value.slice(0, max)}…`
}

export function formatCompiledBundle({ prompt, results, askedAt }) {
  return {
    prompt,
    askedAt: askedAt || new Date().toISOString(),
    results: results.map((result) => {
      const entry = {
        id: result.id,
        label: result.label,
        model: result.model,
        actualModel: result.actualModel || result.model,
        ok: Boolean(result.ok),
        latencyMs: Number.isFinite(result.latencyMs) ? result.latencyMs : null,
        httpStatus: Number.isFinite(result.httpStatus) ? result.httpStatus : null,
        text: result.ok ? result.text || '' : '',
        error: result.ok ? '' : result.error || '',
        rawOmitted: true,
      }
      if (Array.isArray(result.citations) && result.citations.length) {
        entry.citations = result.citations.map((citation) => ({
          id: citation.id,
          title: citation.title,
          url: citation.url,
        }))
      }
      return entry
    }),
  }
}

export function redactRaw(text, keys) {
  let value = typeof text === 'string' ? text : ''
  for (const key of keys) {
    if (!key) continue
    value = value.split(key).join('[redacted]')
  }
  if (value.length > RAW_MAX) value = `${value.slice(0, RAW_MAX)}\n…[truncated]`
  return value
}

function outcome(provider, started, fields) {
  return {
    id: provider.id,
    label: provider.label,
    model: provider.model,
    latencyMs: Date.now() - started,
    ...fields,
  }
}

function requestFor(provider, prompt) {
  if (provider.id === 'anthropic') {
    const headers = {
      'content-type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    }
    if (provider.workspaceId) headers['anthropic-workspace-id'] = provider.workspaceId
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers,
      body: {
        model: provider.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      },
    }
  }
  if (provider.id === 'google') {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(provider.model)}:generateContent`,
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': provider.apiKey,
      },
      body: { contents: [{ parts: [{ text: prompt }] }] },
    }
  }
  if (provider.id === 'perplexity') {
    // Sonar chat completions retired; Agent API accepts free credits. Router needs paid credits.
    return {
      url: 'https://api.perplexity.ai/v1/responses',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${provider.apiKey}`,
      },
      body: { preset: provider.model || 'fast', input: prompt },
    }
  }
  const url =
    provider.id === 'xai'
      ? 'https://api.x.ai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions'
  return {
    url,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: { model: provider.model, messages: [{ role: 'user', content: prompt }] },
  }
}

function replyText(provider, payload) {
  if (provider.id === 'anthropic') {
    const parts = Array.isArray(payload?.content) ? payload.content : []
    return parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('')
  }
  if (provider.id === 'google') {
    const parts = payload?.candidates?.[0]?.content?.parts
    if (!Array.isArray(parts)) return ''
    return parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('')
  }
  if (provider.id === 'perplexity') {
    if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
      return payload.output_text
    }
    const items = Array.isArray(payload?.output) ? payload.output : []
    const chunks = []
    for (const item of items) {
      if (item?.type !== 'message' || !Array.isArray(item.content)) continue
      for (const part of item.content) {
        if (part?.type === 'output_text' && typeof part.text === 'string') chunks.push(part.text)
      }
    }
    return chunks.join('')
  }
  const content = payload?.choices?.[0]?.message?.content
  return typeof content === 'string' ? content : ''
}

function upstreamModel(provider, payload) {
  if (typeof payload?.model === 'string' && payload.model.trim()) return payload.model.trim()
  if (provider.id === 'google') {
    const name = payload?.modelVersion || payload?.candidates?.[0]?.model
    if (typeof name === 'string' && name.trim()) return name.trim()
  }
  return provider.model
}

function citationList(provider, payload) {
  if (provider.id !== 'perplexity' || !payload || typeof payload !== 'object') return []
  const found = []
  const seen = new Set()
  const push = (entry, fallbackId) => {
    if (!entry || typeof entry !== 'object') return
    const url = typeof entry.url === 'string' ? entry.url.trim() : ''
    if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) return
    seen.add(url)
    const title =
      (typeof entry.title === 'string' && entry.title.trim()) ||
      (typeof entry.name === 'string' && entry.name.trim()) ||
      url
    const id =
      entry.id != null
        ? String(entry.id)
        : entry.citation_id != null
          ? String(entry.citation_id)
          : String(fallbackId)
    found.push({ id, title, url })
  }
  const items = Array.isArray(payload.output) ? payload.output : []
  for (const item of items) {
    if (item?.type !== 'search_results') continue
    const list = Array.isArray(item.results)
      ? item.results
      : Array.isArray(item.search_results)
        ? item.search_results
        : Array.isArray(item.content)
          ? item.content
          : []
    for (const entry of list) push(entry, found.length + 1)
  }
  if (Array.isArray(payload.search_results)) {
    for (const entry of payload.search_results) push(entry, found.length + 1)
  }
  if (Array.isArray(payload.citations)) {
    for (const entry of payload.citations) {
      if (typeof entry === 'string' && /^https?:\/\//i.test(entry)) {
        push({ url: entry, title: entry }, found.length + 1)
      } else {
        push(entry, found.length + 1)
      }
    }
  }
  return found
}

function failureMessage(error) {
  if (error?.name === 'TimeoutError') return 'Timed out'
  return 'The request was aborted.'
}

export async function askProvider({
  provider,
  prompt,
  fetch: fetchImpl,
  signal,
  timeoutMs = ASK_TIMEOUT_MS,
}) {
  const started = Date.now()
  const request = requestFor(provider, prompt)
  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  try {
    const response = await fetchImpl(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(request.body),
      signal: combined,
    })
    const raw = await response.text()
    const safeRaw = redactRaw(raw, [provider.apiKey])
    if (!response.ok) {
      const detail = raw.trim() || `HTTP ${response.status}`
      return outcome(provider, started, {
        ok: false,
        httpStatus: response.status,
        raw: safeRaw,
        actualModel: provider.model,
        citations: [],
        error: redact(detail, [provider.apiKey]),
      })
    }
    let payload = null
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = null
    }
    const text = replyText(provider, payload)
    if (!text) {
      return outcome(provider, started, {
        ok: false,
        httpStatus: response.status,
        raw: safeRaw,
        actualModel: upstreamModel(provider, payload),
        citations: [],
        error: 'The provider returned no text.',
      })
    }
    const actualModel = upstreamModel(provider, payload)
    const citations = citationList(provider, payload)
    return outcome(provider, started, {
      ok: true,
      httpStatus: response.status,
      raw: safeRaw,
      text,
      actualModel,
      citations,
    })
  } catch (error) {
    return outcome(provider, started, {
      ok: false,
      httpStatus: null,
      raw: '',
      actualModel: provider.model,
      citations: [],
      error: failureMessage(error),
    })
  }
}
