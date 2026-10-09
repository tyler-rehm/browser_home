// @vitest-environment node
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { loadProviderSecrets } from '../../src/model-ask.js'
import { updateProviderModel } from '../../src/model-secret-store.js'
import {
  HOMEPAGE,
  allowedHosts,
  assertBuild,
  createHomepageServer,
  formatListenError,
  isDirectRun,
  loadHomepageConfig,
  securityHeaders,
} from '../../src/server'

const servers = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()))
})

function request({ port, method = 'GET', requestPath = '/', host, body }) {
  return new Promise((resolve, reject) => {
    const headers = {}
    if (host) headers.host = host
    if (body !== undefined) {
      headers['content-type'] = 'application/json'
      headers['content-length'] = Buffer.byteLength(body)
    }
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        method,
        path: requestPath,
        headers,
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          }),
        )
      },
    )
    req.on('error', reject)
    if (body !== undefined) req.write(body)
    req.end()
  })
}

async function site({ secrets = '', fetchImpl } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'home-site-'))
  fs.writeFileSync(path.join(root, 'index.html'), '<h1>home</h1>')
  fs.writeFileSync(path.join(root, 'app.js'), 'console.log(1)')
  const docsRoot = path.join(root, 'docs')
  fs.mkdirSync(docsRoot, { recursive: true })
  fs.writeFileSync(
    path.join(docsRoot, 'ask-models.md'),
    '# Ask models\n\n<a id="refresh-chatgpt"></a>\n### Refresh ChatGPT\nAdd credits.\n',
  )
  const secretsFile = path.join(root, 'model-secrets.json')
  if (secrets) fs.writeFileSync(secretsFile, secrets)
  const calls = []
  const fetch = async (url, init) => {
    calls.push(url)
    if (fetchImpl) return fetchImpl(url, init)
    throw new Error('unexpected outbound call')
  }
  const loadSecretsImpl = () =>
    secrets
      ? loadProviderSecrets(secretsFile, fs.readFileSync)
      : loadProviderSecrets(path.join(root, 'missing.json'), fs.readFileSync)
  const updateProviderModelImpl = (id, model) =>
    updateProviderModel(id, model, {
      platform: 'linux',
      env: { CODE_HOME_SECRETS_FILE: secretsFile },
      loadSecretsImpl,
    })
  const server = createHomepageServer({
    root,
    port: 0,
    secretsFile,
    fetchImpl: fetch,
    loadSecretsImpl,
    updateProviderModelImpl,
    docsRoot,
  })
  servers.push(server)
  const address = await server.listen()
  return { root, docsRoot, port: address.port, calls, secretsFile }
}

describe('production server', () => {
  it('serves the build and security headers for GET and HEAD', async () => {
    const { port } = await site()
    const response = await request({ port, requestPath: '/' })
    expect(response.status).toBe(200)
    expect(response.body).toContain('home')
    expect(response.headers['content-security-policy']).toContain("default-src 'self'")
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['referrer-policy']).toBe('no-referrer')
    const head = await request({ port, method: 'HEAD', requestPath: '/app.js' })
    expect(head.status).toBe(200)
    expect(head.body).toBe('')
    expect(head.headers['content-type']).toContain('javascript')
    expect(securityHeaders()['content-security-policy']).toContain('unsafe-inline')
    expect(securityHeaders()['content-security-policy']).toContain("connect-src 'self'")
    expect(securityHeaders()['content-security-policy']).toContain("script-src 'self'")
  })

  it('rejects bad methods, hosts, traversal, and escapes', async () => {
    const { root, port } = await site()
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'home-secret-'))
    fs.writeFileSync(path.join(outside, 'secret.txt'), 'TOP-SECRET-CONTENT')
    fs.symlinkSync(path.join(outside, 'secret.txt'), path.join(root, 'leak.txt'))
    fs.mkdirSync(path.join(root, 'folder'))
    const method = await request({ port, method: 'POST' })
    const host = await request({ port, host: 'evil.example' })
    const encoded = await request({ port, requestPath: '/%2e%2e/%2e%2e/secret.txt' })
    const leak = await request({ port, requestPath: '/leak.txt' })
    const folder = await request({ port, requestPath: '/folder' })
    const missing = await request({ port, requestPath: '/missing.js' })
    for (const response of [encoded, leak, folder, missing]) {
      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body).not.toContain('TOP-SECRET-CONTENT')
      expect(response.body).not.toContain(outside)
    }
    expect(method.status).toBe(405)
    expect(host.status).toBe(421)
    const named = await request({ port, host: `${HOMEPAGE.publicHost}:${port}` })
    expect(named.status).toBe(200)
    expect(allowedHosts(port).has(`${HOMEPAGE.publicHost}:${port}`)).toBe(true)
  })

  it('reports a missing build and an occupied port without changing origin', async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'home-empty-'))
    expect(assertBuild(empty).message).toMatch(/npm run build/)
    const { root, port } = await site()
    const conflict = createHomepageServer({ root, port })
    await expect(conflict.listen()).rejects.toMatchObject({ code: 'EADDRINUSE' })
    expect(formatListenError({ code: 'EADDRINUSE' }, 4173)).toContain('http://home.localhost:4173')
  })

  it('accepts only a loopback name in the address config', () => {
    const file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'home-config-')),
      'homepage.config.json',
    )
    fs.writeFileSync(file, '{"publicHost":"home.localhost"}\n')
    expect(loadHomepageConfig(file).publicHost).toBe('home.localhost')
    fs.writeFileSync(file, '{"publicHost":"example.com"}\n')
    expect(() => loadHomepageConfig(file)).toThrow(/\.localhost/)
    fs.writeFileSync(file, '{"publicHost":"home.localhost","port":80}\n')
    expect(() => loadHomepageConfig(file)).toThrow(/publicHost/)
  })

  it('lists providers and asks one at a time without leaking keys', async () => {
    const key = 'configured-test-key'
    const secrets = JSON.stringify({
      anthropic: { apiKey: key, model: 'claude-sonnet-5-5' },
      openai: { apiKey: key },
    })
    const fetchImpl = async (url) => {
      if (String(url).includes('anthropic')) {
        return new Response(JSON.stringify({ content: [{ text: 'from claude' }] }), { status: 200 })
      }
      return new Response(`upstream ${key}`, { status: 502 })
    }
    const { port, calls } = await site({ secrets, fetchImpl })
    const listed = await request({ port, requestPath: '/api/providers' })
    expect(listed.status).toBe(200)
    const providers = JSON.parse(listed.body).providers
    expect(providers.map((provider) => provider.label)).toEqual([
      'Claude',
      'ChatGPT',
      'Gemini',
      'Grok',
      'Perplexity',
    ])
    expect(
      providers.filter((provider) => provider.configured).map((provider) => provider.id),
    ).toEqual(['anthropic', 'openai'])
    expect(providers.find((provider) => provider.id === 'anthropic').modelOptions).toContain(
      'claude-sonnet-5-5',
    )
    expect(listed.body).not.toContain(key)
    expect(listed.body).not.toContain('apiKey')

    const logs = []
    const previous = console.log
    const previousError = console.error
    console.log = (...args) => logs.push(args.join(' '))
    console.error = (...args) => logs.push(args.join(' '))
    const empty = await request({
      port,
      method: 'POST',
      requestPath: '/api/ask',
      body: JSON.stringify({ id: 'anthropic', prompt: '' }),
    })
    const oversized = await request({
      port,
      method: 'POST',
      requestPath: '/api/ask',
      body: JSON.stringify({ id: 'anthropic', prompt: 'a'.repeat(32001) }),
    })
    expect(empty.status).toBe(400)
    expect(oversized.status).toBe(400)
    expect(calls).toEqual([])

    const success = await request({
      port,
      method: 'POST',
      requestPath: '/api/ask',
      body: JSON.stringify({ id: 'anthropic', prompt: 'Compare these' }),
    })
    const overridden = await request({
      port,
      method: 'POST',
      requestPath: '/api/ask',
      body: JSON.stringify({
        id: 'anthropic',
        prompt: 'Compare these',
        model: 'claude-opus-4-1',
      }),
    })
    const badModel = await request({
      port,
      method: 'POST',
      requestPath: '/api/ask',
      body: JSON.stringify({ id: 'anthropic', prompt: 'Compare these', model: 'not-a-model' }),
    })
    const failure = await request({
      port,
      method: 'POST',
      requestPath: '/api/ask',
      body: JSON.stringify({ id: 'openai', prompt: 'Compare these' }),
    })
    console.log = previous
    console.error = previousError
    expect(success.status).toBe(200)
    expect(JSON.parse(success.body)).toMatchObject({ ok: true, text: 'from claude' })
    expect(overridden.status).toBe(200)
    expect(JSON.parse(overridden.body)).toMatchObject({
      ok: true,
      model: 'claude-opus-4-1',
    })
    expect(badModel.status).toBe(400)
    expect(failure.status).toBe(200)
    const failed = JSON.parse(failure.body)
    expect(failed.ok).toBe(false)
    expect(failed.error).not.toContain(key)
    expect(success.body).not.toContain(key)
    expect(calls).toEqual([
      'https://api.anthropic.com/v1/messages',
      'https://api.anthropic.com/v1/messages',
      'https://api.openai.com/v1/chat/completions',
    ])
    expect(logs.join('\n')).not.toContain('Compare these')
    expect(logs.join('\n')).not.toContain(key)

    const saved = await request({
      port,
      method: 'POST',
      requestPath: '/api/provider-model',
      body: JSON.stringify({ id: 'anthropic', model: 'claude-haiku-4-5' }),
    })
    expect(saved.status).toBe(200)
    expect(
      JSON.parse(saved.body).providers.find((provider) => provider.id === 'anthropic'),
    ).toMatchObject({
      model: 'claude-haiku-4-5',
    })
    expect(saved.body).not.toContain(key)
    expect(saved.body).not.toContain('apiKey')
    const rejectedModel = await request({
      port,
      method: 'POST',
      requestPath: '/api/provider-model',
      body: JSON.stringify({ id: 'anthropic', model: 'not-a-model' }),
    })
    expect(rejectedModel.status).toBe(400)

    const beforeBilling = calls.length
    const status = await request({ port, requestPath: '/api/provider-status' })
    expect(status.status).toBe(200)
    const billing = JSON.parse(status.body).providers
    expect(billing).toHaveLength(5)
    expect(status.body).not.toContain(key)
    expect(calls.length).toBeGreaterThan(beforeBilling)

    const posted = await request({ port, method: 'POST', requestPath: '/' })
    expect(posted.status).toBe(405)
    const foreign = await request({ port, requestPath: '/api/providers', host: 'evil.example' })
    expect(foreign.status).toBe(421)
  })

  it('does not probe billing while serving the homepage', async () => {
    const { port, calls } = await site({
      secrets: JSON.stringify({ openai: { apiKey: 'configured-test-key' } }),
    })
    await request({ port, requestPath: '/' })
    await request({ port, requestPath: '/health' })
    expect(calls).toEqual([])
  })

  it('serves Ask models docs with refresh anchors and rejects traversal', async () => {
    const { port } = await site()
    const doc = await request({ port, requestPath: '/docs/ask-models.md' })
    expect(doc.status).toBe(200)
    expect(doc.headers['content-type']).toContain('text/html')
    expect(doc.body).toContain('id="refresh-chatgpt"')
    expect(doc.body).toContain('Refresh ChatGPT')
    const missing = await request({ port, requestPath: '/docs/missing.md' })
    expect(missing.status).toBe(404)
  })

  it('starts only when node executes server.js itself', () => {
    const server = path.join(os.tmpdir(), 'server.js')
    const wrapper = path.join(os.tmpdir(), 'serve.js')
    expect(isDirectRun(pathToFileURL(server).href, server)).toBe(true)
    expect(isDirectRun(pathToFileURL(server).href, wrapper)).toBe(false)
    expect(isDirectRun(pathToFileURL(server).href, undefined)).toBe(false)
  })
})
