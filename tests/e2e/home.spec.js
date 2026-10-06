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

test('drags a quick link into a new order and keeps it', async ({ page }) => {
  const grid = page.getByRole('region', { name: 'Quick links' })
  await page
    .getByRole('button', { name: 'Reorder ChatGPT', exact: true })
    .dragTo(grid.getByRole('link', { name: /GitHub/ }))
  await expect(grid.getByRole('link').nth(0)).toContainText('ChatGPT')
  await page.reload()
  await expect(grid.getByRole('link').nth(0)).toContainText('ChatGPT')
})

test('keeps an icon color on the link after it moves', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem(
      'code-home-links',
      JSON.stringify([
        { name: 'One', url: 'https://one.example/', short: 'ON', color: '#112233' },
        { name: 'Two', url: 'https://two.example/', short: 'TW', color: '#445566' },
      ]),
    )
  })
  await page.reload()
  const grid = page.getByRole('region', { name: 'Quick links' })
  await page
    .getByRole('button', { name: 'Reorder Two', exact: true })
    .dragTo(grid.getByRole('link', { name: /One/ }))
  await expect(grid.getByRole('link').nth(0)).toContainText('Two')
  await expect(grid.getByRole('link', { name: /Two/ }).locator('.link-icon')).toHaveCSS(
    'background-color',
    'rgb(68, 85, 102)',
  )
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
  await page.getByRole('button', { name: 'Appearance' }).click()
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

test('groups a link, favorites it, filters, and shows the credits', async ({ page }) => {
  await page.getByLabel('New group').fill('Work')
  await page.getByRole('button', { name: 'Add group' }).click()
  await expect(page.getByRole('tab', { name: 'Work' })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: /add link/i }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a link' })
  await dialog.getByLabel('Name', { exact: true }).fill('Example')
  await dialog.getByLabel('URL', { exact: true }).fill('example.com')
  await dialog.getByLabel('Group', { exact: true }).selectOption({ label: 'Work' })
  await dialog.getByRole('button', { name: 'Add link', exact: true }).click()
  await page.getByRole('tab', { name: 'Work' }).click()
  await expect(page.getByRole('link', { name: /Example/ })).toBeVisible()
  await page.getByRole('button', { name: 'Add Example to Favorites' }).click()
  await page.getByRole('tab', { name: 'Favorites' }).click()
  await expect(page.getByRole('link', { name: /Example/ })).toBeVisible()
  await page.getByLabel('Filter links').fill('exam')
  await expect(page.getByRole('tab', { name: 'Results' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Favorites' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Example/ })).toBeVisible()
  const footer = page.getByRole('contentinfo')
  await expect(footer).toContainText('Tyler Rehm')
  await expect(footer).toContainText('Ivy League Tech, LLC')
  await expect(footer.getByRole('link', { name: 'TylerRehm.com' })).toHaveAttribute(
    'href',
    'https://tylerrehm.com',
  )
  await expect(footer.getByRole('link', { name: 'IvyLeagueTech.com' })).toHaveAttribute(
    'href',
    'https://ivyleaguetech.com',
  )
  await expect(footer.getByRole('link', { name: 'MIT license' })).toHaveAttribute(
    'href',
    'https://github.com/tyler-rehm/browser_home/blob/main/LICENSE',
  )
  await expect(footer.getByRole('link', { name: 'GitHub repository' })).toHaveAttribute(
    'href',
    'https://github.com/tyler-rehm/browser_home',
  )
  await expect(footer.getByRole('link', { name: 'Email Tyler Rehm' })).toHaveAttribute(
    'href',
    'mailto:tyler@ivyleaguetech.com',
  )
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
  await expect(dialog.getByLabel('URL', { exact: true })).toHaveAttribute(
    'aria-describedby',
    'link-form-error',
  )
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
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toBeVisible()
  await page.getByRole('button', { name: 'Next page' }).click()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('Link 23 with a very long label')).toBeVisible()
  await page.getByLabel('Scratchpad').scrollIntoViewIfNeeded()
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
  await page.getByRole('button', { name: 'Settings' }).click()
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
