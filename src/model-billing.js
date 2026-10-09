import { BILLING_URLS, PROVIDERS } from './model-ask.js'

export const LOW_CREDIT_USD = 1

function status(state, label, id) {
  return {
    state,
    label,
    url: BILLING_URLS[id] || '',
  }
}

/** Detect ask errors that clearly mean prepaid credits or quota ran out. */
export function isQuotaCreditError(message) {
  if (typeof message !== 'string' || !message.trim()) return false
  const text = message.toLowerCase()
  return (
    /insufficient[_\s-]?credits?/.test(text) ||
    /insufficient[_\s-]?quota/.test(text) ||
    /quota[_\s-]?exceeded/.test(text) ||
    /no[_\s-]?api[_\s-]?credits?/.test(text) ||
    /out of credits/.test(text) ||
    /credit balance is too low/.test(text) ||
    /billing.*quota/.test(text)
  )
}

export function lowCreditHint(id) {
  return status('low', 'Low credit — check Balance at the vendor', id)
}

/**
 * Local-only billing stubs. Does not call vendor billing or credit endpoints.
 * Optional `fetch` is accepted for call-site compatibility and is never used.
 */
export async function loadProviderBilling(providers, options = {}) {
  void options.fetch
  void providers
  return PROVIDERS.map((entry) => ({
    id: entry.id,
    billing: status('unknown', '', entry.id),
  }))
}
