import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const SPEC = 'file:///Users/romitsoley/Downloads/Assessment Creation (offline).html'
const OUT = '/tmp/visual-check/offline'
if (!existsSync(OUT)) await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
await page.goto(SPEC, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// open an existing assessment
await page.locator('text=/Cardiovascular Pharmacology — Midterm/').first().click({ timeout: 4000 }).catch(() => {})
await page.waitForTimeout(1500)

const tabs = ['Build', 'Configure', 'Delivery & Security', 'Review & Publish']
for (const t of tabs) {
  const el = page.locator(`text="${t}"`).first()
  if (await el.count()) { await el.click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(900) }
  const slug = t.toLowerCase().replace(/[^a-z]+/g, '-')
  await page.screenshot({ path: `${OUT}/builder-${slug}.png`, fullPage: true })
  const heads = await page.$$eval('h1,h2,h3,h4,label', els =>
    [...new Set(els.map(e => (e.textContent || '').trim()).filter(x => x && x.length < 44))].slice(0, 22))
  console.log(`${t}:`, JSON.stringify(heads))
}
await browser.close()
console.log('done')
