import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('homepage fits the desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ }),
  ).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight + 1,
  )
  expect(overflow).toBe(false)
})

test('add-link dialog closes on backdrop click', async ({ page }) => {
  await page.getByRole('button', { name: /add link/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.mouse.click(8, 8)
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('adds a link and persists it after reload', async ({ page }) => {
  await page.getByRole('button', { name: /add link/i }).click()
  await page.getByLabel('Name', { exact: true }).fill('Example')
  await page.getByLabel('URL', { exact: true }).fill('example.com')
  await page.getByRole('button', { name: 'Add link', exact: true }).click()
  await expect(page.getByText('Example', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Example', { exact: true })).toBeVisible()
})

test('preferences persist after reload', async ({ page }) => {
  await page.getByRole('button', { name: /customize/i }).click()
  await page.getByRole('button', { name: 'ink theme' }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await page.reload()
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(),
    ),
  ).toBe('#17181b')
})

test('dialog restores focus after Escape', async ({ page }) => {
  const trigger = page.getByRole('button', { name: /add link/i })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Add a link' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Name', { exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Add link', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('removing a link does not navigate', async ({ page }) => {
  await page.getByRole('button', { name: 'Remove GitHub' }).click()
  await expect(page.getByRole('button', { name: 'Remove GitHub' })).toHaveCount(0)
  await expect(page).toHaveURL('http://127.0.0.1:4173/')
})

test('unsafe link and malformed search stay on the page', async ({ page }) => {
  await page.getByRole('button', { name: /add link/i }).click()
  await page.getByLabel('Name', { exact: true }).fill('Bad')
  await page.getByLabel('URL', { exact: true }).fill('javascript:alert(1)')
  await page.getByRole('button', { name: 'Add link', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a link' })
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(dialog.getByLabel('Name', { exact: true })).toHaveValue('Bad')
  await page.keyboard.press('Escape')
  await page.getByLabel('Search the web or type a URL').fill('https://user:pass@example.com')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toContainText(/credentials/)
  await expect(page).toHaveURL('http://127.0.0.1:4173/')
})

test('slash does not steal focus from notes or modified keys', async ({ page }) => {
  const notes = page.getByLabel('Scratchpad')
  await notes.click()
  await page.keyboard.type('/')
  await expect(notes).toBeFocused()
  await page.locator('body').click()
  await page.keyboard.down('Shift')
  await page.keyboard.press('/')
  await page.keyboard.up('Shift')
  await expect(page.getByLabel('Search the web or type a URL')).not.toBeFocused()
})

test('scratchpad survives immediate navigation', async ({ page }) => {
  await page.getByLabel('Scratchpad').fill('remember this')
  await expect(page.getByText('saved locally')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Scratchpad')).toHaveValue('remember this')
})

test('many links, narrow widths, and short viewports stay reachable', async ({ page }) => {
  await page.evaluate(() => {
    const links = Array.from({ length: 24 }, (_, index) => ({
      name: `Link ${index} with a very long label`,
      url: `https://example.com/${index}`,
      short: 'LK',
    }))
    localStorage.setItem('code-home-links', JSON.stringify(links))
  })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.reload()
  const scrolls = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight + 1,
  )
  expect(scrolls).toBe(true)
  await page.getByText('Link 23 with a very long label').scrollIntoViewIfNeeded()
  await expect(page.getByLabel('Scratchpad')).toBeVisible()
  for (const size of [
    { width: 390, height: 700 },
    { width: 640, height: 360 },
    { width: 1280, height: 500 },
  ]) {
    await page.setViewportSize(size)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    expect(overflow).toBe(false)
  }
})

test('startup stays local and exposes security headers', async ({ page }) => {
  const external = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.hostname !== '127.0.0.1') external.push(request.url())
  })
  const response = await page.goto('/')
  expect(external).toEqual([])
  expect(response.headers()['content-security-policy']).toContain("default-src 'self'")
  await expect(page.getByRole('heading', { name: /Good/ })).toBeVisible()
})

test('rejected imports and cancelled reset leave data in place', async ({ page }) => {
  await page.getByLabel('Scratchpad').fill('keep me')
  await page.evaluate(() => localStorage.setItem('unrelated', 'keep'))
  await page.getByRole('button', { name: /customize/i }).click()
  await page.getByLabel('Import backup').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":9}'),
  })
  await expect(page.getByRole('alert')).toContainText(/version/)
  await page.getByRole('button', { name: 'Reset app data' }).click()
  await page.getByRole('button', { name: 'Cancel reset' }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByLabel('Scratchpad')).toHaveValue('keep me')
  expect(await page.evaluate(() => localStorage.getItem('unrelated'))).toBe('keep')
})
