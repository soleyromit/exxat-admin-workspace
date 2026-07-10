import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = '/tmp/visual-check/setup-term'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

await page.goto('http://localhost:3005/surveys', { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.waitForTimeout(2500)

// 1. Full dashboard — shows updated left nav + Configure Term Calendar button
await page.screenshot({ path: `${OUT}/01-dashboard-nav.png`, fullPage: false })

// Left nav close-up (the sidebar)
const sidebar = page.locator('[data-slot="sidebar"], aside, nav').first()
if (await sidebar.count()) {
  await sidebar.screenshot({ path: `${OUT}/02-left-nav.png` }).catch(() => {})
}

// 2. Open the Sheet via Configure Term Calendar
await page.locator('button:has-text("Configure Term Calendar")').first().click({ force: true })
await page.waitForTimeout(900)
await page.screenshot({ path: `${OUT}/03-config-phase.png`, fullPage: false })

// 3. Trigger date validation — open End date, pick a date before start to show FieldError
// (skip if pickers are fiddly headless; capture is best-effort)

// 4. Continue → loading → readiness
await page.locator('button:has-text("Continue")').first().click({ force: true })
await page.waitForTimeout(250)
await page.screenshot({ path: `${OUT}/04-readiness-loading.png`, fullPage: false })
await page.waitForTimeout(900)
await page.screenshot({ path: `${OUT}/05-readiness-loaded.png`, fullPage: false })

// 5. Push with gaps → soft-warning AlertDialog
await page.locator('button:has-text("Push survey")').first().click({ force: true })
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/06-soft-warning.png`, fullPage: false })

console.log('console errors:', errors.length)
errors.slice(0, 8).forEach((e) => console.log('  -', e))
console.log('screens written to', OUT)
await browser.close()
