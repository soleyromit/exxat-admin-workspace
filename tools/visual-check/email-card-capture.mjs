import { chromium } from 'playwright'
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1380, height: 1050 } })
const errors = []
pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
pg.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))

await pg.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded' })
await pg.waitForTimeout(4000)
await pg.getByPlaceholder(/Fall 2026 Course Evaluations/i).fill('Spring 2026 Course Evaluations')
await pg.waitForTimeout(400)
async function adv() {
  const x = pg.locator('button', { hasText: /^(Continue|Next)$/ }).first()
  await x.scrollIntoViewIfNeeded().catch(() => {})
  await x.click({ timeout: 8000 }).catch(() => {})
  await pg.waitForTimeout(1200)
}
await adv(); await adv()

// Step 3 — Communication. Screenshot the Email notifications card region.
const onStep3 = await pg.getByText(/Email notifications/i).isVisible().catch(() => false)
console.log('on communication step:', onStep3)
await pg.getByText(/Email notifications/i).scrollIntoViewIfNeeded().catch(() => {})
await pg.waitForTimeout(300)
await pg.screenshot({ path: '/tmp/visual-check/EMAIL-card.png', clip: { x: 250, y: 250, width: 820, height: 620 } })

// Reminder card — scroll to the Schedule/reminder area and capture.
await pg.getByText(/Reminder · sent to non-respondents/i).scrollIntoViewIfNeeded().catch(() => {})
await pg.waitForTimeout(400)
await pg.screenshot({ path: '/tmp/visual-check/EMAIL-reminder.png', clip: { x: 250, y: 250, width: 820, height: 640 } })
// Open the reminder sheet.
await pg.locator('button[aria-label="Preview and edit the reminder email"]').click({ timeout: 8000 }).catch(() => {})
await pg.waitForTimeout(900)
await pg.screenshot({ path: '/tmp/visual-check/EMAIL-reminder-sheet.png' })
await pg.keyboard.press('Escape').catch(() => {})
await pg.waitForTimeout(500)

// Open the EMAIL sheet via the card thumbnail (unique aria-label), not the
// first "Edit" on the page (that's the Prism recipients row).
await pg.locator('button[aria-label="Preview and edit the invitation email"]').click({ timeout: 8000 }).catch(() => {})
await pg.waitForTimeout(1000)
await pg.screenshot({ path: '/tmp/visual-check/EMAIL-sheet.png' })
// Open the template dropdown.
await pg.locator('button[aria-label="Select email template"]').click({ timeout: 6000 }).catch(() => {})
await pg.waitForTimeout(600)
await pg.screenshot({ path: '/tmp/visual-check/EMAIL-dropdown.png' })

console.log('console errors:', errors.length ? errors.slice(0, 8) : 'none')
await b.close()
