import { describe, expect, it } from 'vitest'
import { buildPreviewRows, commitLinkImport, parseLinkImport } from '../../src/link-import'
import { LIMITS } from '../../src/records'

const chromeHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
  <DT><H3 ADD_DATE="1" LAST_MODIFIED="1" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks bar</H3>
  <DL><p>
    <DT><A HREF="https://github.com/" ADD_DATE="1">GitHub</A>
    <DT><H3 ADD_DATE="1">Work</H3>
    <DL><p>
      <DT><A HREF="https://linear.app/" ADD_DATE="1">Linear</A>
    </DL><p>
    <DT><A HREF="javascript:alert(1)">Bad</A>
  </DL><p>
</DL><p>`

const firefoxHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<TITLE>Bookmarks</TITLE>
<DL><p>
  <DT><H3 ADD_DATE="1" LAST_MODIFIED="1">Bookmarks Menu</H3>
  <DL><p>
    <DT><A HREF="https://example.com/" ICON_URI="https://example.com/favicon.ico">Example</A>
  </DL><p>
</DL>`

const safariHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<HTML><Title>Bookmarks</Title>
<DL><p>
  <DT><H3 FOLDED>Favorites</H3>
  <DL><p>
    <DT><A HREF="https://www.apple.com/">Apple</A>
    <DT><H3 FOLDED>News</H3>
    <DL><p>
      <DT><A HREF="https://news.example/">Daily</A>
    </DL><p>
  </DL><p>
</DL></HTML>`

const edgeHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>Bookmarks</TITLE>
<DL><p>
  <DT><H3>Favorites bar</H3>
  <DL><p>
    <DT><A HREF="https://www.bing.com/">Bing</A>
  </DL><p>
</DL>`

describe('link import', () => {
  it('detects browser bookmark exports and skips unsafe addresses', () => {
    const chrome = parseLinkImport(chromeHtml)
    expect(chrome).toMatchObject({
      ok: true,
      source: 'chrome',
      sourceLabel: 'Chrome bookmarks',
      locked: true,
      skipped: 1,
    })
    expect(chrome.records).toEqual([
      { name: 'GitHub', url: 'https://github.com/', groupName: '' },
      { name: 'Linear', url: 'https://linear.app/', groupName: 'Work' },
    ])

    const firefox = parseLinkImport(firefoxHtml)
    expect(firefox.source).toBe('firefox')
    expect(firefox.records).toEqual([
      { name: 'Example', url: 'https://example.com/', groupName: '' },
    ])

    const safari = parseLinkImport(safariHtml)
    expect(safari.source).toBe('safari')
    expect(safari.records.map((row) => [row.name, row.groupName])).toEqual([
      ['Apple', ''],
      ['Daily', 'News'],
    ])

    const edge = parseLinkImport(edgeHtml)
    expect(edge.source).toBe('edge')
    expect(edge.records[0].name).toBe('Bing')
    expect(edge.records[0].groupName).toBe('')
  })

  it('reads Chrome or Edge and Firefox bookmark JSON', () => {
    const chromium = parseLinkImport(
      JSON.stringify({
        checksum: 'abc',
        version: 1,
        roots: {
          bookmark_bar: {
            type: 'folder',
            name: 'Bookmarks bar',
            children: [
              { type: 'url', name: 'GitHub', url: 'https://github.com/' },
              {
                type: 'folder',
                name: 'Work',
                children: [{ type: 'url', name: 'Linear', url: 'https://linear.app/' }],
              },
              { type: 'url', name: 'Internal', url: 'chrome://settings' },
            ],
          },
          other: { type: 'folder', name: 'Other bookmarks', children: [] },
        },
      }),
    )
    expect(chromium.sourceLabel).toBe('Chrome or Edge bookmarks')
    expect(chromium.records.map((row) => row.name)).toEqual(['GitHub', 'Linear'])
    expect(chromium.records[1].groupName).toBe('Work')
    expect(chromium.skipped).toBe(1)

    const firefox = parseLinkImport(
      JSON.stringify({
        guid: 'root________',
        title: '',
        type: 'text/x-moz-place-container',
        root: 'placesRoot',
        children: [
          {
            title: 'toolbar',
            type: 'text/x-moz-place-container',
            root: 'toolbarFolder',
            children: [
              { title: 'Example', type: 'text/x-moz-place', uri: 'https://example.com/' },
              {
                title: 'Work',
                type: 'text/x-moz-place-container',
                children: [
                  { title: 'Linear', type: 'text/x-moz-place', uri: 'https://linear.app/' },
                ],
              },
            ],
          },
        ],
      }),
    )
    expect(firefox.source).toBe('firefox')
    expect(firefox.records).toEqual([
      { name: 'Example', url: 'https://example.com/', groupName: '' },
      { name: 'Linear', url: 'https://linear.app/', groupName: 'Work' },
    ])
  })

  it('maps a basic JSON list and remembers an existing group on add', () => {
    const parsed = parseLinkImport(
      JSON.stringify([
        { title: 'Docs', href: 'docs.example', folder: 'Notes' },
        { title: 'Docs again', href: 'https://docs.example/', folder: 'Notes' },
        { title: 'Bad', href: 'javascript:alert(1)' },
      ]),
    )
    expect(parsed).toMatchObject({
      ok: true,
      source: 'json',
      locked: false,
      mapping: { name: 'title', url: 'href', group: 'folder' },
    })
    const rows = buildPreviewRows(parsed.records, parsed.mapping, {
      existingLinks: [{ name: 'Keep', url: 'https://keep.example/' }],
      mode: 'add',
    })
    expect(rows[0]).toMatchObject({
      name: 'Docs',
      url: 'https://docs.example/',
      groupName: 'Notes',
      include: true,
      status: 'ready',
    })
    expect(rows[1].status).toBe('duplicate')
    expect(rows[1].include).toBe(false)
    expect(rows[2].status).toBe('invalid')
    const remapped = buildPreviewRows(parsed.records, { name: 'title', url: 'href', group: '' }, {})
    expect(remapped[0].groupName).toBe('')

    const committed = commitLinkImport({
      rows,
      mode: 'add',
      existingLinks: [{ id: 'keep', name: 'Keep', url: 'https://keep.example/', short: 'KE' }],
      existingGroups: [{ id: 'notes', name: 'notes' }],
    })
    expect(committed.ok).toBe(true)
    expect(committed.groups).toEqual([{ id: 'notes', name: 'notes' }])
    expect(committed.links).toHaveLength(2)
    expect(committed.links[0]).toMatchObject({
      name: 'Docs',
      url: 'https://docs.example/',
      groupId: 'notes',
    })
    expect(committed.links[1].name).toBe('Keep')
  })

  it('replaces links only after the selected rows fit, and rejects a huge file', () => {
    const parsed = parseLinkImport(
      JSON.stringify({ links: [{ name: 'Only', url: 'https://only.example/' }] }),
    )
    const rows = buildPreviewRows(parsed.records, parsed.mapping, { mode: 'replace' })
    const replaced = commitLinkImport({
      rows,
      mode: 'replace',
      existingLinks: [{ id: 'old', name: 'Old', url: 'https://old.example/', short: 'OL' }],
      existingGroups: [{ id: 'old', name: 'Old' }],
    })
    expect(replaced.ok).toBe(true)
    expect(replaced.links.map((link) => link.name)).toEqual(['Only'])
    expect(replaced.groups).toEqual([])
    expect(
      commitLinkImport({ rows: [], mode: 'add', existingLinks: [], existingGroups: [] }).ok,
    ).toBe(false)
    const full = Array.from({ length: LIMITS.linkCount }, (_, index) => ({
      id: `id-${index}`,
      name: `Link ${index}`,
      url: `https://example.com/${index}`,
      short: 'L',
    }))
    const extra = buildPreviewRows(
      [{ name: 'More', url: 'https://more.example/' }],
      { name: 'name', url: 'url', group: '' },
      { existingLinks: full, mode: 'add' },
    )
    expect(extra[0].include).toBe(false)
    expect(extra[0].reason).toMatch(/full/)
    extra[0].include = true
    expect(
      commitLinkImport({ rows: extra, mode: 'add', existingLinks: full, existingGroups: [] }).error,
    ).toMatch(/maximum/)
    expect(parseLinkImport('x'.repeat(LIMITS.bookmarkImportBytes + 1)).error).toMatch(/too large/)
    expect(parseLinkImport('{').error).toMatch(/JSON|bookmark/)
  })
})
