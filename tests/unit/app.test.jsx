import { readFileSync } from 'node:fs'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../src/app'
import { KEYS } from '../../src/persistence'

afterEach(() => {
  document.documentElement.removeAttribute('style')
})

describe('homepage', () => {
  it('adds and removes a quick link', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /add link/i }))
    await user.type(screen.getByLabelText(/^name$/i), 'Example')
    await user.type(screen.getByLabelText(/^url$/i), 'example.com')
    await user.click(screen.getByRole('button', { name: 'Add link' }))
    expect(screen.getByText('Example')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove Example' }))
    expect(screen.queryByText('Example')).not.toBeInTheDocument()
  })

  it('moves a quick link with the arrow keys and saves the order', async () => {
    const user = userEvent.setup()
    render(<App />)
    screen.getByRole('button', { name: 'Reorder Cursor' }).focus()
    await user.keyboard('{ArrowLeft}')
    const names = within(screen.getByRole('region', { name: 'Quick links' }))
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(names[0]).toMatch(/Cursor/)
    expect(names[1]).toMatch(/GitHub/)
    expect(JSON.parse(localStorage.getItem(KEYS.links))[0].name).toBe('Cursor')
    expect(screen.getByText('Cursor moved before GitHub')).toBeInTheDocument()
  })

  it('opens links in a new tab until the preference is turned off', async () => {
    const user = userEvent.setup()
    render(<App />)
    const quickLinks = () => screen.getByRole('region', { name: 'Quick links' })
    const github = within(quickLinks()).getByRole('link', { name: /GitHub/ })
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', 'noopener noreferrer')
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('checkbox', { name: /open links in a new tab/i }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(within(quickLinks()).getByRole('link', { name: /GitHub/ })).not.toHaveAttribute('target')
    expect(JSON.parse(localStorage.getItem(KEYS.preferences)).openInNewTab).toBe(false)
  })

  it('archives a link, then restores or deletes it from the archive table', async () => {
    const user = userEvent.setup()
    render(<App />)
    const quickLinks = () => screen.getByRole('region', { name: 'Quick links' })
    await user.click(screen.getByRole('button', { name: 'Archive GitHub' }))
    expect(within(quickLinks()).queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^archive \(1\)$/i }))
    expect(screen.getByRole('table', { name: 'Archived links' })).toBeInTheDocument()
    expect(within(quickLinks()).getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Restore GitHub' }))
    expect(screen.getByText('No archived links')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^archive$/i }))
    expect(within(quickLinks()).getByRole('link', { name: /GitHub/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Archive GitHub' }))
    await user.click(screen.getByRole('button', { name: /^archive \(1\)$/i }))
    await user.click(screen.getByRole('button', { name: 'Delete GitHub' }))
    expect(screen.getByText('No archived links')).toBeInTheDocument()
    expect(
      JSON.parse(localStorage.getItem(KEYS.links)).some((link) => link.name === 'GitHub'),
    ).toBe(false)
  })

  it('offers a skip link to the main content', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#content',
    )
    expect(document.getElementById('content')?.tagName).toBe('MAIN')
  })

  it('keeps a link icon color when the card moves', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      KEYS.links,
      JSON.stringify([
        { name: 'One', url: 'https://one.example/', short: 'ON', color: '#112233' },
        { name: 'Two', url: 'https://two.example/', short: 'TW', color: '#445566' },
      ]),
    )
    render(<App />)
    screen.getByRole('button', { name: 'Reorder Two' }).focus()
    await user.keyboard('{ArrowLeft}')
    const two = screen.getByRole('link', { name: /Two/ })
    expect(two.querySelector('.link-icon').style.backgroundColor).toBe('rgb(68, 85, 102)')
    await user.click(screen.getByRole('button', { name: 'Edit Two' }))
    fireEvent.change(screen.getByLabelText('Icon color'), { target: { value: '#abcdef' } })
    await user.click(screen.getByRole('button', { name: 'Save link' }))
    expect(JSON.parse(localStorage.getItem(KEYS.links))[0].color).toBe('#abcdef')
    expect(
      screen.getByRole('link', { name: /Two/ }).querySelector('.link-icon').style.backgroundColor,
    ).toBe('rgb(171, 205, 239)')
  })

  it('keeps an unsafe link form open and does not navigate from remove', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /add link/i }))
    await user.type(screen.getByLabelText(/^name$/i), 'Bad')
    await user.type(screen.getByLabelText(/^url$/i), 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: 'Add link' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/HTTP/)
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('Bad')
    expect(screen.queryByRole('link', { name: /Bad/ })).not.toBeInTheDocument()
  })

  it('does not overwrite rejected storage on mount', () => {
    localStorage.setItem(KEYS.links, '{')
    localStorage.setItem('unrelated', 'keep')
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent(/left untouched/i)
    expect(localStorage.getItem(KEYS.links)).toBe('{')
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })

  it('flashes the scratchpad save and then hides it', () => {
    vi.useFakeTimers()
    try {
      render(<App />)
      expect(screen.queryByText('saved locally')).not.toBeInTheDocument()
      fireEvent.change(screen.getByLabelText('Scratchpad'), { target: { value: 'hello' } })
      expect(screen.getByText('saved locally')).toBeInTheDocument()
      act(() => vi.advanceTimersByTime(1600))
      expect(screen.queryByText('saved locally')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Scratchpad')).toHaveValue('hello')
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows a failure when storage rejects a note', async () => {
    const user = userEvent.setup()
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      const error = new Error('quota')
      error.name = 'QuotaExceededError'
      throw error
    }
    try {
      render(<App />)
      await user.type(screen.getByLabelText('Scratchpad'), 'hello')
      expect(screen.getByText('not saved')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent(/did not save/i)
    } finally {
      Storage.prototype.setItem = setItem
    }
  })

  it('cancels reset without removing data and confirms an app-only reset', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      KEYS.links,
      JSON.stringify([{ name: 'Keep', url: 'https://example.com/', short: 'K' }]),
    )
    localStorage.setItem('unrelated', 'keep')
    render(<App />)
    expect(screen.getByText('Keep')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Reset app data' }))
    await user.click(screen.getByRole('button', { name: 'Cancel reset' }))
    expect(localStorage.getItem('unrelated')).toBe('keep')
    await user.click(screen.getByRole('button', { name: 'Reset app data' }))
    await user.click(screen.getByRole('button', { name: 'Confirm reset' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem(KEYS.links)).toBeNull()
    expect(localStorage.getItem(KEYS.groups)).toBeNull()
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })

  it('shows one link in Favorites, its group, and All, and the star toggles without navigating', async () => {
    const user = userEvent.setup()
    localStorage.setItem(KEYS.groups, JSON.stringify([{ id: 'work', name: 'Work' }]))
    localStorage.setItem(
      KEYS.links,
      JSON.stringify([
        {
          id: 'gh',
          name: 'GitHub',
          url: 'https://github.com/',
          short: 'GH',
          groupId: 'work',
          favorite: true,
        },
        { id: 'ex', name: 'Example', url: 'https://example.com/', short: 'EX' },
      ]),
    )
    render(<App />)
    const quickLinks = () => screen.getByRole('region', { name: 'Quick links' })
    await user.click(screen.getByRole('tab', { name: 'Favorites' }))
    expect(within(quickLinks()).getByRole('link', { name: /GitHub/ })).toBeInTheDocument()
    expect(within(quickLinks()).queryByRole('link', { name: /Example/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Work' }))
    expect(within(quickLinks()).getByRole('link', { name: /GitHub/ })).toBeInTheDocument()
    expect(within(quickLinks()).queryByRole('link', { name: /Example/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'All' }))
    expect(within(quickLinks()).getByRole('link', { name: /Example/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove GitHub from Favorites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Remove GitHub from Favorites' }))
    expect(within(quickLinks()).getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/',
    )
    expect(screen.getByRole('button', { name: 'Add GitHub to Favorites' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await user.click(screen.getByRole('tab', { name: 'Favorites' }))
    expect(within(quickLinks()).queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument()
  })

  it('pages more than 8 links and omits the pager at 8', async () => {
    const user = userEvent.setup()
    const links = Array.from({ length: 8 }, (_, index) => ({
      id: `l${index}`,
      name: `Link ${index}`,
      url: `https://example.com/${index}`,
      short: 'L',
    }))
    localStorage.setItem(KEYS.links, JSON.stringify(links))
    const view = render(<App />)
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
    expect(screen.getByText('Link 7')).toBeInTheDocument()
    view.unmount()
    localStorage.setItem(
      KEYS.links,
      JSON.stringify([
        ...links,
        { id: 'l8', name: 'Link 8', url: 'https://example.com/8', short: 'L' },
      ]),
    )
    render(<App />)
    expect(screen.queryByText('Link 8')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Link 8')).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
  })

  it('creates, renames, and deletes a group while keeping the link', async () => {
    const user = userEvent.setup()
    localStorage.setItem(KEYS.groups, JSON.stringify([{ id: 'work', name: 'Work' }]))
    localStorage.setItem(
      KEYS.links,
      JSON.stringify([
        { id: 'ex', name: 'Example', url: 'https://example.com/', short: 'EX', groupId: 'work' },
      ]),
    )
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Delete group' })).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('New group'), 'Clients')
    await user.click(screen.getByRole('button', { name: 'Add group' }))
    expect(screen.getByRole('tab', { name: 'Clients' })).toHaveAttribute('aria-selected', 'true')
    await user.clear(screen.getByLabelText('New group'))
    await user.type(screen.getByLabelText('New group'), 'clients')
    await user.click(screen.getByRole('button', { name: 'Add group' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i)
    await user.click(screen.getByRole('tab', { name: 'Work' }))
    await user.clear(screen.getByLabelText('Rename group'))
    await user.type(screen.getByLabelText('Rename group'), 'Studio')
    await user.click(screen.getByRole('button', { name: 'Save name' }))
    expect(screen.getByRole('tab', { name: 'Studio' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete group' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete group' }),
    )
    expect(screen.queryByRole('tab', { name: 'Studio' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Example/ })).toBeInTheDocument()
  })

  it('saves a new link into a new group from the dialog', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /add link/i }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/^name$/i), 'Example')
    await user.type(within(dialog).getByLabelText(/^url$/i), 'example.com')
    await user.type(within(dialog).getByLabelText(/^new group$/i), 'Work')
    await user.click(within(dialog).getByRole('button', { name: 'Add link' }))
    await user.click(screen.getByRole('tab', { name: 'Work' }))
    expect(screen.getByRole('link', { name: /Example/ })).toBeInTheDocument()
  })

  it('assigns a link by dropping it on a group, Favorites, or All', () => {
    localStorage.setItem(KEYS.groups, JSON.stringify([{ id: 'work', name: 'Work' }]))
    localStorage.setItem(
      KEYS.links,
      JSON.stringify([{ id: 'ex', name: 'Example', url: 'https://example.com/', short: 'EX' }]),
    )
    render(<App />)
    const grip = () => screen.getByRole('button', { name: 'Reorder Example' })
    fireEvent.dragStart(grip())
    fireEvent.drop(screen.getByRole('tab', { name: 'Work' }))
    expect(JSON.parse(localStorage.getItem(KEYS.links))[0].groupId).toBe('work')
    expect(screen.getByText('Example moved to Work')).toBeInTheDocument()
    fireEvent.dragStart(grip())
    fireEvent.drop(screen.getByRole('tab', { name: 'Favorites' }))
    expect(JSON.parse(localStorage.getItem(KEYS.links))[0]).toMatchObject({
      groupId: 'work',
      favorite: true,
    })
    fireEvent.dragStart(grip())
    fireEvent.drop(screen.getByRole('tab', { name: 'All' }))
    const cleared = JSON.parse(localStorage.getItem(KEYS.links))[0]
    expect(cleared.groupId).toBeUndefined()
    expect(cleared.favorite).toBe(true)
  })

  it('filters to Results and leaves the slash shortcut on hero search', async () => {
    const user = userEvent.setup()
    render(<App />)
    const quickLinks = screen.getByRole('region', { name: 'Quick links' })
    await user.type(screen.getByLabelText('Filter links'), 'git')
    expect(screen.getByRole('tab', { name: 'Results' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Favorites' })).not.toBeInTheDocument()
    expect(within(quickLinks).getByRole('link', { name: /GitHub/ })).toBeInTheDocument()
    expect(within(quickLinks).queryByRole('link', { name: /Cursor/ })).not.toBeInTheDocument()
    expect(screen.getByText('1 result')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Filter links'))
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true')
    await user.type(screen.getByLabelText('Filter links'), 'zzzz-no-match')
    expect(screen.getByText('No matching links')).toBeInTheDocument()
    expect(screen.getByText('0 results')).toBeInTheDocument()
    screen.getByLabelText('Filter links').blur()
    await user.keyboard('/')
    expect(screen.getByLabelText('Search the web or type a URL')).toHaveFocus()
    expect(screen.getByLabelText('Filter links')).not.toHaveFocus()
  })

  it('credits Tyler Rehm in the footer and uses the shared focus style', () => {
    render(<App />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('Tyler Rehm')
    expect(footer).toHaveTextContent('Ivy League Tech, LLC')
    expect(within(footer).getByRole('link', { name: 'TylerRehm.com' })).toHaveAttribute(
      'href',
      'https://tylerrehm.com',
    )
    expect(within(footer).getByRole('link', { name: 'IvyLeagueTech.com' })).toHaveAttribute(
      'href',
      'https://ivyleaguetech.com',
    )
    expect(within(footer).getByRole('link', { name: 'MIT license' })).toHaveAttribute(
      'href',
      'https://github.com/tyler-rehm/browser_home/blob/main/LICENSE',
    )
    expect(within(footer).getByRole('link', { name: 'GitHub repository' })).toHaveAttribute(
      'href',
      'https://github.com/tyler-rehm/browser_home',
    )
    expect(within(footer).getByRole('link', { name: 'Email Tyler Rehm' })).toHaveAttribute(
      'href',
      'mailto:tyler@ivyleaguetech.com',
    )
    const css = readFileSync('styles.css', 'utf8')
    const rule = css.slice(css.indexOf('.link-open:focus-visible'), css.indexOf('.link-icon'))
    expect(rule).toContain('.text-button:focus-visible')
    expect(rule).toContain('.site-footer a:focus-visible')
    expect(rule).toContain('outline: 2px solid var(--ink)')
  })
})
