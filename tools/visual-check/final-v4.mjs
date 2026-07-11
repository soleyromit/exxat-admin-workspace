import { chromium } from 'playwright'
const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })

// 1. Term table — DS ProgressCell anatomy in Response rate column
await page.goto('http://localhost:3005/course-evaluation/term/pt1', { waitUntil: 'domcontentloaded' })
await page.getByText('4 of 40 responded').first().waitFor({ timeout: 30000 })
console.log('progressbars in table:', await page.locator('[role="progressbar"]').count())
await page.screenshot({ path: `${OUT}/v4-term-table.png` })

// 2. Board — bar cards + spec'd Set up survey button
await page.getByRole('radio', { name: 'Board view' }).or(page.getByRole('button', { name: 'Board view' })).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/v4-term-board.png` })

// 3. Remind wizard step 2 — push-anatomy email card
await page.goto('http://localhost:3005/surveys/remind?from=term:pt1', { waitUntil: 'domcontentloaded' })
await page.getByLabel('Select all courses').waitFor({ timeout: 30000 })
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(500)
console.log('email card title:', await page.getByText('Send reminder', { exact: true }).count())
console.log('subject line:', await page.getByText(/^Subject:/).count() + await page.locator('p:has-text("Subject:")').count() > 0 ? 'present' : 'MISSING')
await page.screenshot({ path: `${OUT}/v4-remind-email.png` })

// 4. Edit → EmailTemplateSheet opens
await page.getByRole('button', { name: 'Edit', exact: true }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/v4-remind-sheet.png` })

await browser.close()
