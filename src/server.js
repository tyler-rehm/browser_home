import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEFAULT_HOST = '127.0.0.1'
export const DEFAULT_PORT = 4173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

export function securityHeaders() {
  return {
    'content-security-policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data:",
      "connect-src 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join('; '),
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'cache-control': 'no-store',
  }
}

export function assertBuild(root) {
  const index = path.join(root, 'index.html')
  if (!fs.existsSync(index) || !fs.statSync(index).isFile()) {
    return {
      ok: false,
      message: 'Built assets are missing. Run `npm run build`, then start the homepage again.',
    }
  }
  return { ok: true }
}

export function formatListenError(error, port = DEFAULT_PORT) {
  if (error?.code === 'EADDRINUSE') {
    return `Port ${port} is already in use. The homepage stays at http://${DEFAULT_HOST}:${port}. Stop the other process and retry.`
  }
  return 'The homepage server could not start.'
}

function send(req, res, status, body, type = 'text/plain; charset=utf-8', extra = {}) {
  const payload = Buffer.from(body)
  res.writeHead(status, {
    ...securityHeaders(),
    ...extra,
    'content-type': type,
    'content-length': String(payload.length),
  })
  if (req.method === 'HEAD') res.end()
  else res.end(payload)
}

function insideRoot(root, candidate) {
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`
  return candidate === root || candidate.startsWith(rootWithSep)
}

export function handleHomepageRequest(req, res, { root, port }) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(req, res, 405, 'Method not allowed', 'text/plain; charset=utf-8', { allow: 'GET, HEAD' })
    return
  }
  const allowedHosts = new Set([`${DEFAULT_HOST}:${port}`, `localhost:${port}`])
  if (!req.headers.host || !allowedHosts.has(req.headers.host)) {
    send(req, res, 421, 'Misdirected request')
    return
  }
  let pathname
  try {
    pathname = new URL(req.url ?? '/', `http://${DEFAULT_HOST}:${port}`).pathname
    pathname = decodeURIComponent(pathname)
  } catch {
    send(req, res, 400, 'Bad request')
    return
  }
  if (pathname.includes('\0') || pathname.includes('\\')) {
    send(req, res, 400, 'Bad request')
    return
  }
  if (pathname === '/health') {
    send(req, res, 200, 'ok')
    return
  }
  const relative = pathname.replace(/^\/+/, '')
  const target = relative ? path.resolve(root, relative) : path.join(root, 'index.html')
  if (!insideRoot(root, target)) {
    send(req, res, 404, 'Not found')
    return
  }
  let real
  try {
    const stat = fs.lstatSync(target)
    if (stat.isDirectory()) {
      send(req, res, 404, 'Not found')
      return
    }
    real = fs.realpathSync(target)
  } catch {
    send(req, res, 404, 'Not found')
    return
  }
  if (!insideRoot(root, real) || !fs.statSync(real).isFile()) {
    send(req, res, 404, 'Not found')
    return
  }
  const type = MIME[path.extname(real).toLowerCase()] ?? 'application/octet-stream'
  send(req, res, 200, fs.readFileSync(real), type)
}

export function createHomepageServer({ root, host = DEFAULT_HOST, port = DEFAULT_PORT }) {
  const rootReal = fs.realpathSync(root)
  const server = http.createServer((req, res) => {
    const address = server.address()
    const boundPort = address && typeof address === 'object' ? address.port : port
    handleHomepageRequest(req, res, { root: rootReal, port: boundPort })
  })
  return {
    server,
    listen() {
      return new Promise((resolve, reject) => {
        const onError = (error) => reject(error)
        server.once('error', onError)
        server.listen(port, host, () => {
          server.off('error', onError)
          resolve(server.address())
        })
      })
    },
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    },
  }
}

export function main(argv = process.argv.slice(2)) {
  const rootFlag = argv.indexOf('--root')
  const root = path.resolve(
    rootFlag >= 0
      ? argv[rootFlag + 1]
      : path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist'),
  )
  const build = assertBuild(root)
  if (!build.ok) {
    console.error(build.message)
    process.exitCode = 1
    return
  }
  const homepage = createHomepageServer({ root })
  homepage.listen().then(
    (address) => {
      console.log(`Homepage at http://${DEFAULT_HOST}:${address.port}`)
    },
    (error) => {
      console.error(formatListenError(error, DEFAULT_PORT))
      process.exitCode = 1
    },
  )
}
