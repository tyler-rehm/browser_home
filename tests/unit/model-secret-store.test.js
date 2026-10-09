// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  loadSecrets,
  readKeychainSecrets,
  updateProviderModel,
  writeKeychainSecrets,
} from '../../src/model-secret-store.js'

const KEY = 'configured-test-key'

describe('model secret store', () => {
  it('prefers Keychain over the JSON file on macOS', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'secrets-'))
    const file = path.join(home, 'model-secrets.json')
    fs.writeFileSync(file, JSON.stringify({ openai: { apiKey: 'file-key' } }))
    const execFile = (_bin, args) => {
      if (args.includes('-w') && args.includes('find-generic-password')) {
        return JSON.stringify({ anthropic: { apiKey: KEY } })
      }
      throw new Error('unexpected')
    }
    const providers = loadSecrets({
      platform: 'darwin',
      home,
      env: { CODE_HOME_SECRETS_FILE: file },
      execFile,
      migrate: false,
    })
    expect(providers.find((provider) => provider.id === 'anthropic').configured).toBe(true)
    expect(providers.find((provider) => provider.id === 'openai').configured).toBe(false)
  })

  it('falls back to the JSON file and migrates into Keychain once', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'secrets-'))
    const file = path.join(home, 'model-secrets.json')
    fs.writeFileSync(file, JSON.stringify({ openai: { apiKey: KEY, expiresAt: '2030-01-01' } }))
    const writes = []
    const execFile = (_bin, args) => {
      if (args.includes('find-generic-password')) throw new Error('missing')
      if (args.includes('add-generic-password')) {
        writes.push(args[args.length - 1])
        return ''
      }
      throw new Error('unexpected')
    }
    const providers = loadSecrets({
      platform: 'darwin',
      home,
      env: { CODE_HOME_SECRETS_FILE: file },
      execFile,
      migrate: true,
    })
    expect(providers.find((provider) => provider.id === 'openai').configured).toBe(true)
    expect(writes).toHaveLength(1)
    expect(writes[0]).toContain(KEY)
    expect(writes[0]).toContain('2030-01-01')
  })

  it('returns null from Keychain when security fails', () => {
    expect(
      readKeychainSecrets({
        execFile: () => {
          throw new Error('missing')
        },
      }),
    ).toBeNull()
  })

  it('writes a JSON document through security', () => {
    const argsSeen = []
    writeKeychainSecrets([{ id: 'openai', apiKey: KEY, model: 'gpt-4.1', expiresAt: '' }], {
      execFile: (_bin, args) => {
        argsSeen.push(args)
        return ''
      },
    })
    expect(argsSeen[0]).toContain('add-generic-password')
    expect(argsSeen[0].at(-1)).toContain(KEY)
  })

  it('updates a stored model without returning the api key', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'secrets-'))
    const file = path.join(home, 'model-secrets.json')
    fs.writeFileSync(file, JSON.stringify({ anthropic: { apiKey: KEY, model: '' } }))
    const saved = updateProviderModel('anthropic', 'claude-opus-4-1', {
      platform: 'linux',
      env: { CODE_HOME_SECRETS_FILE: file },
      home,
    })
    expect(saved.ok).toBe(true)
    expect(saved.providers.find((provider) => provider.id === 'anthropic')).toMatchObject({
      model: 'claude-opus-4-1',
      configured: true,
    })
    expect(JSON.stringify(saved.providers)).not.toContain(KEY)
    expect(JSON.stringify(saved.providers)).not.toContain('apiKey')
    const onDisk = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(onDisk.anthropic.model).toBe('claude-opus-4-1')
    expect(onDisk.anthropic.apiKey).toBe(KEY)
    const rejected = updateProviderModel('anthropic', 'not-a-model', {
      platform: 'linux',
      env: { CODE_HOME_SECRETS_FILE: file },
      home,
    })
    expect(rejected.ok).toBe(false)
    expect(JSON.parse(fs.readFileSync(file, 'utf8')).anthropic.model).toBe('claude-opus-4-1')
  })
})
