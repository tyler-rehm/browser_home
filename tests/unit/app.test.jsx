import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
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
    screen.getByRole('button', { name: 'Reorder ChatGPT' }).focus()
    await user.keyboard('{ArrowLeft}')
    const names = within(screen.getByRole('region', { name: 'Quick links' }))
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(names[0]).toMatch(/ChatGPT/)
    expect(names[1]).toMatch(/GitHub/)
    expect(JSON.parse(localStorage.getItem(KEYS.links))[0].name).toBe('ChatGPT')
    expect(screen.getByText('ChatGPT moved before GitHub')).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: /customize/i }))
    await user.click(screen.getByRole('button', { name: 'Reset app data' }))
    await user.click(screen.getByRole('button', { name: 'Cancel reset' }))
    expect(localStorage.getItem('unrelated')).toBe('keep')
    await user.click(screen.getByRole('button', { name: 'Reset app data' }))
    await user.click(screen.getByRole('button', { name: 'Confirm reset' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem(KEYS.links)).toBeNull()
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })
})
