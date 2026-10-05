import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const FORBIDDEN_PATH = [
  /(^|\/)home-preferences\.json$/,
  /(^|\/)code-home-backup\.json$/,
  /(^|\/)\.env($|\.)/,
  /(^|\/)dist\//,
  /(^|\/)node_modules\//,
  /(^|\/)coverage\//,
  /(^|\/)test-results\//,
  /(^|\/)playwright-report\//,
  /\.(pem|key)$/i,
]

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[baprs]-[0-9A-Za-z-]{10,}/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
]

export function isForbiddenPath(filePath) {
  const normalized = filePath.replaceAll('\\', '/')
  return FORBIDDEN_PATH.some((pattern) => pattern.test(normalized))
}

export function isPremiumSource(filePath, content) {
  const normalized = filePath.replaceAll('\\', '/')
  if (/\/catalyst[^/]*\.(jsx?|tsx?)$/i.test(normalized)) return true
  return /@tailwindplus\/|https?:\/\/tailwindui\.com/i.test(content)
}

export function auditEntries(entries) {
  const failures = []
  for (const entry of entries) {
    if (isForbiddenPath(entry.path)) failures.push(`${entry.path}: forbidden path`)
    if (isPremiumSource(entry.path, entry.content))
      failures.push(`${entry.path}: premium source marker`)
    if (SECRET_PATTERNS.some((pattern) => pattern.test(entry.content))) {
      failures.push(`${entry.path}: possible secret`)
    }
  }
  return failures
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

export function collectTrackedEntries(cwd = process.cwd()) {
  const names = new Set([
    ...git(['ls-files']).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean),
  ])
  return [...names].map((filePath) => ({
    path: filePath,
    content: fs.existsSync(path.join(cwd, filePath))
      ? fs.readFileSync(path.join(cwd, filePath), 'utf8')
      : '',
  }))
}

export function auditHistory() {
  const failures = []
  const commits = git(['rev-list', '--all']).split('\n').filter(Boolean)
  for (const commit of commits) {
    const listed = git(['ls-tree', '-r', '--name-only', commit]).split('\n').filter(Boolean)
    for (const filePath of listed) {
      if (isForbiddenPath(filePath) || /catalyst/i.test(filePath)) {
        failures.push(`${commit}:${filePath}: forbidden historical path`)
      }
    }
  }
  return failures
}

function printLimitations() {
  console.log(
    [
      'Scanner limitations:',
      '- Markdown prose is not treated as proprietary source unless it contains a Tailwind Plus import or tailwindui.com URL.',
      '- History inspection checks path names, not every blob for secrets.',
      '- A clean scan does not prove that secrets or proprietary code are absent.',
      '- Review `git log --all --full-history -- home-preferences.json src/components` before publishing.',
    ].join('\n'),
  )
}

export function auditRepository({ history = false } = {}) {
  const failures = auditEntries(collectTrackedEntries())
  if (history) failures.push(...auditHistory())
  return failures
}

const invoked =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (invoked) {
  const failures = auditRepository({ history: process.argv.includes('--history') })
  printLimitations()
  if (failures.length) {
    console.error(failures.join('\n'))
    process.exitCode = 1
  } else {
    console.log('Publication audit passed.')
  }
}
