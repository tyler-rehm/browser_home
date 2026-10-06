// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildRawMessage, filesIn } from '../../scripts/pipeline-mail.js'

describe('pipeline mail', () => {
  it('attaches the report without putting its text in the headers', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-mail-test-'))
    const report = path.join(directory, 'vibe-report.md')
    const reportText = 'Suggestion at src/app.jsx:10\nFrom: leaked@example.com'
    fs.writeFileSync(report, reportText)
    const raw = buildRawMessage({
      from: 'tyler@ivyleaguetech.com',
      to: 'tyler@ivyleaguetech.com',
      subject: 'Code Home vibe check success',
      body: 'Result: success\nReport: attached\n',
      attachments: [report],
    })
    const header = raw.split('\r\n\r\n')[0]
    expect(header).toContain('From: tyler@ivyleaguetech.com')
    expect(header).toContain('Subject: Code Home vibe check success')
    expect(header).not.toContain('src/app.jsx')
    expect(header).not.toContain('leaked@example.com')
    expect(raw).toContain('filename="vibe-report.md"')
    expect(raw).toContain(Buffer.from(reportText).toString('base64').slice(0, 40))
    fs.rmSync(directory, { recursive: true, force: true })
  })

  it('rejects a subject that breaks the header', () => {
    expect(() =>
      buildRawMessage({
        from: 'tyler@ivyleaguetech.com',
        to: 'tyler@ivyleaguetech.com',
        subject: 'ok\nBcc: other@example.com',
        body: 'Result: success\n',
      }),
    ).toThrow(/subject rejected/)
  })

  it('lists only files in the attachment directory', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-mail-dir-'))
    fs.writeFileSync(path.join(directory, 'pipeline-result-node-22.txt'), 'format success\n')
    fs.mkdirSync(path.join(directory, 'nested'))
    expect(filesIn(directory).map((file) => path.basename(file))).toEqual([
      'pipeline-result-node-22.txt',
    ])
    fs.rmSync(directory, { recursive: true, force: true })
  })
})
