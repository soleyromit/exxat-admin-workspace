import { chromium } from 'playwright'
const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })

// 1. Visual fixes on the dashboard
await page.goto('http://localhost:3005/course-evaluation/dashboard', { waitUntil: 'domcontentloaded' })
await page.getByText('122 students').waitFor({ timeout: 30000 })
console.log('tight copy:', await page.getByText('Eval window not set').count())
console.log('released row:', await page.getByText('Released to faculty').count())
const grid = await page.locator('[class*="grid-cols-"]').first().boundingBox()
await page.screenshot({ path: `${OUT}/v7-triptych.png`, clip: grid })

// 2. New term (Spring 2027, no offerings) → save → card appears (client-side nav keeps state)
await page.getByRole('link', { name: 'Set up term' }).first().click()
await page.getByText('Term details').first().waitFor({ timeout: 15000 })
await page.getByRole('combobox').first().click()
await page.getByRole('option', { name: 'Spring' }).click()
await page.getByRole('combobox').nth(1).click()
await page.getByRole('option', { name: '2027' }).click()
// dates for spring 2027
await page.getByRole('button', { name: /Start date/ }).click()
await page.waitForTimeout(300)
// pick any visible day — navigate calendar is fiddly; instead just check Save flow needs valid dates.
await page.keyboard.press('Escape')
console.log('derived name visible:', await page.getByText(/Spring 2027 — evaluation window/).count())
// seed dates are Fall 2026 ones — still valid (start<end) so Continue enabled
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(800)
console.log('empty-offerings state:', await page.getByText('No course offerings in Prism yet').count())
await page.screenshot({ path: `${OUT}/v7-save-term.png` })
await page.getByRole('button', { name: 'Save term' }).click()
await page.waitForTimeout(500)
console.log('saved state:', await page.getByText('is on the calendar').count())
await page.getByRole('link', { name: 'Back to Dashboard' }).click()
await page.waitForTimeout(1000)
console.log('Spring 2027 card on dashboard:', await page.getByText('Spring 2027').count())
await page.screenshot({ path: `${OUT}/v7-new-term-card.png` })
await browser.close()
