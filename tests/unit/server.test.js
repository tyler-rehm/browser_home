// @vitest-environment node
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  assertBuild,
  createHomepageServer,
  formatListenError,
  securityHeaders,
} from '../../src/server'

const servers = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()))
})

function request({ port, method = 'GET', requestPath = '/', host }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        method,
        path: requestPath,
        headers: host ? { host } : undefined,
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
    req.end()
  })
}

async function site() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'home-site-'))
  fs.writeFileSync(path.join(root, 'index.html'), '<h1>home</h1>')
  fs.writeFileSync(path.join(root, 'app.js'), 'console.log(1)')
  const server = createHomepageServer({ root, port: 0 })
  servers.push(server)
  const address = await server.listen()
  return { root, port: address.port }
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
  })

  it('reports a missing build and an occupied port without changing origin', async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'home-empty-'))
    expect(assertBuild(empty).message).toMatch(/npm run build/)
    const { root, port } = await site()
    const conflict = createHomepageServer({ root, port })
    await expect(conflict.listen()).rejects.toMatchObject({ code: 'EADDRINUSE' })
    expect(formatListenError({ code: 'EADDRINUSE' }, 4173)).toContain('http://127.0.0.1:4173')
  })
})
