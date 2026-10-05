import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const DEFAULT_HOST = '127.0.0.1'
export const DEFAULT_PORT = 4173
const CONFIG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'homepage.config.json')

export function loadHomepageConfig(filePath = CONFIG_PATH) {
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    throw new Error('homepage.config.json could not be read.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('homepage.config.json must be an object with publicHost.')
  }
  if (Object.keys(parsed).join(',') !== 'publicHost' || typeof parsed.publicHost !== 'string') {
    throw new Error('homepage.config.json only accepts publicHost.')
  }
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.localhost$/.test(parsed.publicHost)) {
    throw new Error('publicHost must be a hostname ending in .localhost.')
  }
  return { publicHost: parsed.publicHost }
}

export const HOMEPAGE = loadHomepageConfig()

export function isDirectRun(moduleUrl, argv1) {
  if (!argv1) return false
  return moduleUrl === pathToFileURL(path.resolve(argv1)).href
}

export function homepageOrigin(port = DEFAULT_PORT) {
  return `http://${HOMEPAGE.publicHost}:${port}`
}

export function allowedHosts(port) {
  return new Set([`${DEFAULT_HOST}:${port}`, `localhost:${port}`, `${HOMEPAGE.publicHost}:${port}`])
}

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
    return `Port ${port} is already in use. The homepage stays at ${homepageOrigin(port)}. Stop the other process and retry.`
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
  if (!req.headers.host || !allowedHosts(port).has(req.headers.host)) {
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

function listenOn(server, host, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => reject(error)
    server.once('error', onError)
    server.listen(port, host, () => {
      server.off('error', onError)
      resolve(server.address())
    })
  })
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    if (!server.listening) {
      resolve()
      return
    }
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

export function createHomepageServer({
  root,
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  also = [],
}) {
  const rootReal = fs.realpathSync(root)
  const onRequest = (req, res) => {
    const address = primary.address()
    const boundPort = address && typeof address === 'object' ? address.port : port
    handleHomepageRequest(req, res, { root: rootReal, port: boundPort })
  }
  const primary = http.createServer(onRequest)
  const extras = also.map(() => http.createServer(onRequest))
  return {
    server: primary,
    listen() {
      return listenOn(primary, host, port).then(async (address) => {
        for (const [index, extraHost] of also.entries()) {
          try {
            await listenOn(extras[index], extraHost, address.port)
          } catch (error) {
            const skip = error?.code === 'EADDRNOTAVAIL' || error?.code === 'EAFNOSUPPORT'
            if (!skip) throw error
          }
        }
        return address
      })
    },
    close() {
      return Promise.all([primary, ...extras].map((server) => closeServer(server)))
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
  const homepage = createHomepageServer({ root, also: ['::1'] })
  homepage.listen().then(
    (address) => {
      console.log(`Homepage at ${homepageOrigin(address.port)}`)
    },
    (error) => {
      console.error(formatListenError(error, DEFAULT_PORT))
      process.exitCode = 1
    },
  )
}

if (isDirectRun(import.meta.url, process.argv[1])) main()
