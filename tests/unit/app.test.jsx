import { render, screen, waitFor } from '@testing-library/react'
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
