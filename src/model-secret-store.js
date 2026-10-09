import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  isAllowedModel,
  loadProviderSecrets,
  parseSecrets,
  publicProviders,
  secretsDocument,
} from './model-ask.js'

export const KEYCHAIN_SERVICE = 'local.browser-home.model-secrets'
export const KEYCHAIN_ACCOUNT = 'model-secrets'

export function defaultSecretsFile(home = os.homedir()) {
  return path.join(home, 'Library', 'Application Support', 'browser-home', 'model-secrets.json')
}

export function resolveSecretsFile(env = process.env, home = os.homedir()) {
  const configured = env.CODE_HOME_SECRETS_FILE
  if (typeof configured === 'string' && configured.trim()) return configured.trim()
  return defaultSecretsFile(home)
}

function runSecurity(execFile, args) {
  return execFile('/usr/bin/security', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

export function readKeychainSecrets({
  execFile = execFileSync,
  service = KEYCHAIN_SERVICE,
  account = KEYCHAIN_ACCOUNT,
} = {}) {
  try {
    const stdout = runSecurity(execFile, [
      'find-generic-password',
      '-s',
      service,
      '-a',
      account,
      '-w',
    ])
    return parseSecrets(String(stdout || '').trim())
  } catch {
    return null
  }
}

export function writeKeychainSecrets(
  providers,
  { execFile = execFileSync, service = KEYCHAIN_SERVICE, account = KEYCHAIN_ACCOUNT } = {},
) {
  const payload = JSON.stringify(secretsDocument(providers))
  runSecurity(execFile, ['add-generic-password', '-U', '-s', service, '-a', account, '-w', payload])
}

export function loadSecrets({
  platform = process.platform,
  env = process.env,
  home = os.homedir(),
  readFileSync = fs.readFileSync,
  execFile = execFileSync,
  migrate = true,
} = {}) {
  if (platform === 'darwin') {
    const fromKeychain = readKeychainSecrets({ execFile })
    if (fromKeychain?.some((provider) => provider.configured)) return fromKeychain
  }

  const filePath = resolveSecretsFile(env, home)
  const fromFile = loadProviderSecrets(filePath, readFileSync)
  if (platform === 'darwin' && migrate && fromFile.some((provider) => provider.configured)) {
    try {
      writeKeychainSecrets(fromFile, { execFile })
    } catch {
      // File remains the source of truth when Keychain write is blocked.
    }
  }
  return fromFile
}

export function persistProviders(
  providers,
  {
    platform = process.platform,
    env = process.env,
    home = os.homedir(),
    writeFileSync = fs.writeFileSync,
    mkdirSync = fs.mkdirSync,
    execFile = execFileSync,
  } = {},
) {
  if (platform === 'darwin') {
    try {
      writeKeychainSecrets(providers, { execFile })
      return { ok: true, target: 'keychain' }
    } catch {
      // Fall through to the secrets file when Keychain write is blocked.
    }
  }
  const filePath = resolveSecretsFile(env, home)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(secretsDocument(providers), null, 2)}\n`, {
    mode: 0o600,
  })
  return { ok: true, target: 'file' }
}

export function updateProviderModel(
  id,
  model,
  {
    platform = process.platform,
    env = process.env,
    home = os.homedir(),
    readFileSync = fs.readFileSync,
    writeFileSync = fs.writeFileSync,
    mkdirSync = fs.mkdirSync,
    execFile = execFileSync,
    loadSecretsImpl = loadSecrets,
    persistProvidersImpl = persistProviders,
  } = {},
) {
  const value = typeof model === 'string' ? model.trim() : ''
  if (!isAllowedModel(id, value)) {
    return { ok: false, error: 'Unknown model.', status: 400 }
  }
  const providers = loadSecretsImpl({
    platform,
    env,
    home,
    readFileSync,
    execFile,
    migrate: false,
  })
  if (!providers.some((provider) => provider.id === id)) {
    return { ok: false, error: 'Unknown provider.', status: 400 }
  }
  const next = providers.map((provider) =>
    provider.id === id ? { ...provider, model: value } : provider,
  )
  try {
    persistProvidersImpl(next, {
      platform,
      env,
      home,
      writeFileSync,
      mkdirSync,
      execFile,
    })
  } catch {
    return { ok: false, error: 'Could not save model.', status: 500 }
  }
  return { ok: true, providers: publicProviders(next) }
}
