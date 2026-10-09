import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadProviderBilling } from './model-billing.js'
import {
  BODY_MAX,
  askProvider,
  isAllowedModel,
  publicProviders,
  validatePrompt,
} from './model-ask.js'
import { loadSecrets, resolveSecretsFile, updateProviderModel } from './model-secret-store.js'

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

export { resolveSecretsFile }

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
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

export function defaultDocsRoot() {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs')
}

export function renderMarkdownDocPage(title, markdown) {
  const escaped = String(markdown)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
  const withAnchors = escaped.replace(
    /&lt;a id="(refresh-[a-z0-9-]+)"&gt;&lt;\/a&gt;/g,
    '<a id="$1"></a>',
  )
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replaceAll('<', '')}</title>
<style>
  body { margin: 0; padding: 2rem; background: #f4f1ea; color: #1c1917; font: 15px/1.55 ui-sans-serif, system-ui, sans-serif; }
  main { max-width: 46rem; margin: 0 auto; white-space: pre-wrap; word-break: break-word; }
  a[id] { scroll-margin-top: 1.5rem; }
</style>
</head>
<body><main>${withAnchors}</main></body>
</html>
`
}

export function securityHeaders() {
  return {
    'content-security-policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
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

function sendJson(req, res, status, value) {
  send(req, res, status, JSON.stringify(value), 'application/json; charset=utf-8')
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let settled = false
    const fail = (error) => {
      if (settled) return
      settled = true
      reject(error)
    }
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        const error = new Error('too large')
        error.code = 'LIMIT'
        fail(error)
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (settled) return
      settled = true
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', (error) => fail(error))
  })
}

function insideRoot(root, candidate) {
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`
  return candidate === root || candidate.startsWith(rootWithSep)
}

function readProviders({ secretsFile, loadSecretsImpl }) {
  return loadSecretsImpl({
    env: { ...process.env, CODE_HOME_SECRETS_FILE: secretsFile },
    migrate: false,
  })
}

async function handleAsk(req, res, { fetchImpl, secretsFile, loadSecretsImpl }) {
  const declared = Number(req.headers['content-length'] || 0)
  if (Number.isFinite(declared) && declared > BODY_MAX) {
    sendJson(req, res, 400, { error: 'Prompt is too long.' })
    req.resume()
    return
  }
  let raw
  try {
    raw = await readBody(req, BODY_MAX)
  } catch (error) {
    if (!res.headersSent) {
      sendJson(req, res, 400, {
        error: error?.code === 'LIMIT' ? 'Prompt is too long.' : 'Bad request.',
      })
    }
    return
  }
  let body
  try {
    body = JSON.parse(raw)
  } catch {
    sendJson(req, res, 400, { error: 'Bad request.' })
    return
  }
  const promptError = validatePrompt(body?.prompt)
  if (promptError) {
    sendJson(req, res, 400, { error: promptError })
    return
  }
  const providers = readProviders({ secretsFile, loadSecretsImpl })
  const provider = providers.find((entry) => entry.id === body?.id)
  if (!provider) {
    sendJson(req, res, 400, { error: 'Unknown provider.' })
    return
  }
  if (!provider.configured) {
    sendJson(req, res, 400, { error: 'Provider is not configured.' })
    return
  }
  const modelOverride = typeof body?.model === 'string' ? body.model.trim() : ''
  if (
    modelOverride &&
    modelOverride !== provider.model &&
    !isAllowedModel(provider.id, modelOverride)
  ) {
    sendJson(req, res, 400, { error: 'Unknown model.' })
    return
  }
  const askTarget = modelOverride ? { ...provider, model: modelOverride } : provider
  const client = new AbortController()
  const stop = () => {
    if (!res.writableEnded) client.abort()
  }
  req.on('close', stop)
  try {
    const result = await askProvider({
      provider: askTarget,
      prompt: body.prompt,
      fetch: fetchImpl,
      signal: client.signal,
    })
    if (!res.headersSent) sendJson(req, res, 200, result)
  } catch {
    if (!res.headersSent) {
      sendJson(req, res, 200, {
        ok: false,
        id: askTarget.id,
        label: askTarget.label,
        model: askTarget.model,
        latencyMs: 0,
        error: 'The request failed.',
      })
    }
  } finally {
    req.off('close', stop)
  }
}

async function readJsonBody(req, res) {
  const declared = Number(req.headers['content-length'] || 0)
  if (Number.isFinite(declared) && declared > BODY_MAX) {
    sendJson(req, res, 400, { error: 'Bad request.' })
    req.resume()
    return null
  }
  let raw
  try {
    raw = await readBody(req, BODY_MAX)
  } catch {
    if (!res.headersSent) sendJson(req, res, 400, { error: 'Bad request.' })
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    sendJson(req, res, 400, { error: 'Bad request.' })
    return null
  }
}

function secretsUpdateOptions(secretsFile, loadSecretsImpl) {
  const env = { ...process.env, CODE_HOME_SECRETS_FILE: secretsFile }
  return {
    env,
    loadSecretsImpl: (options = {}) =>
      loadSecretsImpl({
        ...options,
        env: { ...env, ...(options.env || {}) },
        migrate: false,
      }),
  }
}

async function handleProviderModel(
  req,
  res,
  { secretsFile, loadSecretsImpl, updateProviderModelImpl },
) {
  const body = await readJsonBody(req, res)
  if (!body) return
  const result = updateProviderModelImpl(
    body?.id,
    body?.model,
    secretsUpdateOptions(secretsFile, loadSecretsImpl),
  )
  if (!result.ok) {
    sendJson(req, res, result.status || 400, { error: result.error || 'Bad request.' })
    return
  }
  sendJson(req, res, 200, { providers: result.providers })
}

export async function handleHomepageRequest(req, res, options) {
  const {
    root,
    port,
    fetchImpl = globalThis.fetch,
    secretsFile = resolveSecretsFile(),
    loadSecretsImpl = loadSecrets,
    updateProviderModelImpl = updateProviderModel,
    docsRoot = null,
  } = options
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
  if (req.method === 'GET' && pathname === '/api/providers') {
    const providers = readProviders({ secretsFile, loadSecretsImpl })
    sendJson(req, res, 200, { providers: publicProviders(providers) })
    return
  }
  if (req.method === 'GET' && pathname === '/api/provider-status') {
    const providers = readProviders({ secretsFile, loadSecretsImpl })
    const statuses = await loadProviderBilling(providers, { fetch: fetchImpl })
    sendJson(req, res, 200, { providers: statuses })
    return
  }
  if (req.method === 'POST' && pathname === '/api/ask') {
    await handleAsk(req, res, { fetchImpl, secretsFile, loadSecretsImpl })
    return
  }
  if (req.method === 'POST' && pathname === '/api/provider-model') {
    await handleProviderModel(req, res, {
      secretsFile,
      loadSecretsImpl,
      updateProviderModelImpl,
    })
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(req, res, 405, 'Method not allowed', 'text/plain; charset=utf-8', {
      allow: 'GET, HEAD, POST',
    })
    return
  }
  if (pathname === '/health') {
    send(req, res, 200, 'ok')
    return
  }
  if (docsRoot && (pathname === '/docs' || pathname.startsWith('/docs/'))) {
    const relative = pathname === '/docs' ? 'ask-models.md' : pathname.slice('/docs/'.length)
    if (!relative || relative.includes('..') || path.isAbsolute(relative)) {
      send(req, res, 404, 'Not found')
      return
    }
    const target = path.resolve(docsRoot, relative)
    if (!insideRoot(docsRoot, target)) {
      send(req, res, 404, 'Not found')
      return
    }
    let real
    try {
      real = fs.realpathSync(target)
    } catch {
      send(req, res, 404, 'Not found')
      return
    }
    if (!insideRoot(docsRoot, real) || !fs.statSync(real).isFile()) {
      send(req, res, 404, 'Not found')
      return
    }
    const markdown = fs.readFileSync(real, 'utf8')
    const title = path.basename(real)
    send(req, res, 200, renderMarkdownDocPage(title, markdown), 'text/html; charset=utf-8')
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
  fetchImpl = globalThis.fetch,
  secretsFile = resolveSecretsFile(),
  loadSecretsImpl = loadSecrets,
  updateProviderModelImpl = updateProviderModel,
  docsRoot = defaultDocsRoot(),
}) {
  const rootReal = fs.realpathSync(root)
  let docsReal = null
  if (docsRoot && fs.existsSync(docsRoot)) {
    try {
      docsReal = fs.realpathSync(docsRoot)
    } catch {
      docsReal = null
    }
  }
  const onRequest = (req, res) => {
    const address = primary.address()
    const boundPort = address && typeof address === 'object' ? address.port : port
    Promise.resolve(
      handleHomepageRequest(req, res, {
        root: rootReal,
        port: boundPort,
        fetchImpl,
        secretsFile,
        loadSecretsImpl,
        updateProviderModelImpl,
        docsRoot: docsReal,
      }),
    ).catch(() => {
      if (!res.headersSent) send(req, res, 500, 'Bad request')
    })
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
  const besideInstall = path.join(path.dirname(root), 'docs')
  const docsRoot = fs.existsSync(besideInstall) ? besideInstall : defaultDocsRoot()
  const homepage = createHomepageServer({ root, docsRoot, also: ['::1'] })
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
