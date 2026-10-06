import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const HEADER = /[\r\n]/

export function buildRawMessage({ from, to, subject, body, attachments = [] }) {
  assertHeader('from', from)
  assertHeader('to', to)
  assertHeader('subject', subject)
  const boundary = `pipeline-${attachmentToken()}`
  const parts = [
    headerBlock(from, to, subject, boundary),
    textPart(boundary, body),
    ...attachments.map((attachment) => filePart(boundary, attachment)),
    `--${boundary}--`,
    '',
  ]
  return parts.join('\r\n')
}

export function filesIn(directory) {
  if (!directory) return []
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(directory, entry.name))
    .sort()
}

function assertHeader(name, value) {
  if (typeof value !== 'string' || value.length === 0 || HEADER.test(value)) {
    throw new Error(`mail ${name} rejected`)
  }
}

function attachmentToken() {
  return Math.random().toString(16).slice(2)
}

function headerBlock(from, to, subject, boundary) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
  ].join('\r\n')
}

function textPart(boundary, body) {
  return [
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(Buffer.from(body, 'utf8')),
  ].join('\r\n')
}

function filePart(boundary, filePath) {
  const filename = safeFilename(filePath)
  return [
    `--${boundary}`,
    `Content-Type: text/plain; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    wrapBase64(fs.readFileSync(filePath)),
  ].join('\r\n')
}

function safeFilename(filePath) {
  const filename = path.basename(filePath)
  if (!filename || filename === '.' || filename === '..' || /["\r\n]/.test(filename)) {
    throw new Error('mail attachment name rejected')
  }
  return filename
}

function wrapBase64(buffer) {
  return buffer.toString('base64').replace(/.{76}/g, '$&\r\n')
}

function readArgs(argv) {
  let bodyPath = ''
  let attachDir = ''
  const attachments = []
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--body') bodyPath = argv[(index += 1)] || ''
    else if (arg === '--attach') attachments.push(argv[(index += 1)] || '')
    else if (arg === '--attach-dir') attachDir = argv[(index += 1)] || ''
    else throw new Error('mail argument rejected')
  }
  return { bodyPath, attachments: [...attachments, ...filesIn(attachDir)] }
}

function credentialsPresent() {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
}

export function sendRawMessage(raw) {
  if (!credentialsPresent()) {
    throw new Error('pipeline mail credentials are not set')
  }
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-mail-'))
  const payload = path.join(directory, 'payload.json')
  fs.writeFileSync(payload, JSON.stringify({ Data: Buffer.from(raw).toString('base64') }))
  const result = spawnSync(
    'aws',
    [
      'ses',
      'send-raw-email',
      '--region',
      process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
      '--raw-message',
      `file://${payload}`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
  )
  fs.rmSync(directory, { recursive: true, force: true })
  if (result.status !== 0) {
    const detail = (result.stderr || 'ses send failed').trim().split('\n').at(-1)
    throw new Error(detail || 'ses send failed')
  }
  const messageId = JSON.parse(result.stdout).MessageId
  if (!messageId) throw new Error('ses send returned no message id')
  return messageId
}

function main() {
  const { bodyPath, attachments } = readArgs(process.argv.slice(2))
  const raw = buildRawMessage({
    from: process.env.PIPELINE_MAIL_FROM,
    to: process.env.PIPELINE_MAIL_TO,
    subject: process.env.PIPELINE_MAIL_SUBJECT,
    body: fs.readFileSync(bodyPath, 'utf8'),
    attachments,
  })
  const messageId = sendRawMessage(raw)
  console.log(`sent ${messageId}`)
}

const invoked =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (invoked) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'pipeline mail failed')
    process.exitCode = 1
  }
}
