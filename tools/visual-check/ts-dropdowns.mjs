import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
await page.goto('http://localhost:3005/course-evaluation/term-setup', { waitUntil: 'domcontentloaded' })
await page.getByText('Term details').first().waitFor({ timeout: 30000 })
// Both dropdowns present with correct options
await page.getByRole('combobox').first().click()
await page.waitForTimeout(300)
console.log('term options:', (await page.getByRole('option').allTextContents()).join(', '))
await page.keyboard.press('Escape')
await page.getByRole('combobox').nth(1).click()
await page.waitForTimeout(300)
console.log('year options:', (await page.getByRole('option').allTextContents()).join(', '))
// pick a future year → derived name updates in the window box
await page.getByRole('option', { name: '2027–2028' }).click()
await page.waitForTimeout(300)
console.log('derived name:', await page.getByText(/Fall 2027 — evaluation window/).count())
await page.screenshot({ path: '/tmp/visual-check/ts-dropdowns.png' })
await browser.close()
