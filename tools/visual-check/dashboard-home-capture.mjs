import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = '/tmp/visual-check/dashboard-home'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

await page.goto('http://localhost:3005/surveys/dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.waitForTimeout(2500)

// 1. Full dashboard home — nav active = Dashboard, 3 term cards, needs-attention
await page.screenshot({ path: `${OUT}/01-dashboard-home.png`, fullPage: false })
await page.screenshot({ path: `${OUT}/02-dashboard-full.png`, fullPage: true })

// 2. Click a Send reminder → optimistic "Reminder sent"
const remind = page.locator('button:has-text("Send reminder")').first()
if (await remind.count()) {
  await remind.click({ force: true })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/03-reminder-sent.png`, fullPage: false })
}

// 3. Configure Term Calendar opens the reused SetupTermSheet
await page.locator('button:has-text("Configure Term Calendar")').first().click({ force: true })
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/04-configure-from-dashboard.png`, fullPage: false })

console.log('console errors:', errors.length)
errors.slice(0, 8).forEach((e) => console.log('  -', e))
await browser.close()
