// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { auditEntries } from '../../scripts/audit-publication.js'

describe('publication audit', () => {
  it('rejects personal exports, secrets, and premium markers', () => {
    const accessKey = ['AKIA', 'IOSFODNN7EXAMPLE'].join('')
    const premiumImport = ['@tailwind', 'plus/elements'].join('')
    const failures = auditEntries([
      { path: 'home-preferences.json', content: '{}' },
      { path: 'notes.env', content: 'TOKEN=1' },
      { path: '.env', content: 'A=1' },
      { path: 'src/app.jsx', content: `const key = "${accessKey}"` },
      { path: 'src/components/catalyst-dialog.jsx', content: 'export const Dialog = () => null' },
      { path: 'src/ui.jsx', content: `import x from '${premiumImport}'` },
    ])
    expect(failures.join('\n')).toMatch(/home-preferences/)
    expect(failures.join('\n')).toMatch(/\.env/)
    expect(failures.join('\n')).toMatch(/possible secret/)
    expect(failures.join('\n')).toMatch(/premium/)
  })

  it('allows the example preferences file', () => {
    expect(
      auditEntries([{ path: 'examples/home-preferences.example.json', content: '{}\n' }]),
    ).toEqual([])
  })
})
