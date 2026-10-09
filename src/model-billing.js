import { BILLING_URLS, PROVIDERS, redact } from './model-ask.js'

export const LOW_CREDIT_USD = 1
export const BILLING_TIMEOUT_MS = 5000

function moneyLabel(amount) {
  if (!Number.isFinite(amount)) return ''
  return `$${amount.toFixed(2)} remaining`
}

function status(state, label, id) {
  return {
    state,
    label,
    url: BILLING_URLS[id] || '',
  }
}

async function readJson(fetchImpl, url, headers, signal) {
  const response = await fetchImpl(url, { method: 'GET', headers, signal })
  const raw = await response.text()
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    payload = null
  }
  return { ok: response.ok, status: response.status, raw, payload }
}

function fromAmount(id, amount, apiKey) {
  if (!Number.isFinite(amount)) return status('unknown', '', id)
  if (amount < LOW_CREDIT_USD) {
    return status('low', redact(`Low credit: ${moneyLabel(amount)}`, [apiKey]), id)
  }
  return status('ok', moneyLabel(amount), id)
}

async function probeOpenAI(provider, fetchImpl, signal) {
  const { ok, payload } = await readJson(
    fetchImpl,
    'https://api.openai.com/v1/dashboard/billing/credit_grants',
    { authorization: `Bearer ${provider.apiKey}` },
    signal,
  )
  if (!ok) return status('unknown', '', provider.id)
  const amount = Number(payload?.total_available ?? payload?.total_paid_available)
  return fromAmount(provider.id, amount, provider.apiKey)
}

async function probeOne(provider, fetchImpl) {
  if (!provider.configured) {
    return { id: provider.id, billing: status('unknown', '', provider.id) }
  }
  const timeout = AbortSignal.timeout(BILLING_TIMEOUT_MS)
  try {
    if (provider.id === 'openai') {
      return { id: provider.id, billing: await probeOpenAI(provider, fetchImpl, timeout) }
    }
    // Other vendors do not expose remaining credit to ordinary API keys.
    return { id: provider.id, billing: status('unknown', '', provider.id) }
  } catch {
    return {
      id: provider.id,
      billing: status('error', '', provider.id),
    }
  }
}

export async function loadProviderBilling(providers, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const settled = await Promise.allSettled(
    PROVIDERS.map((entry) => {
      const provider = providers.find((item) => item.id === entry.id) || {
        ...entry,
        configured: false,
        apiKey: '',
      }
      return probeOne(provider, fetchImpl)
    }),
  )
  return settled.map((entry, index) => {
    if (entry.status === 'fulfilled') return entry.value
    return {
      id: PROVIDERS[index].id,
      billing: status('error', '', PROVIDERS[index].id),
    }
  })
}
