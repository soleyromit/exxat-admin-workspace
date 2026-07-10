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

// Click an existing assessment row to open its detail/builder view.
const row = page.locator('text=/Cardiovascular Pharmacology — Midterm/').first()
await row.click({ timeout: 4000 }).catch(e => console.log('row click failed', e.message))
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/existing-1.png`, fullPage: true })

const controls = await page.$$eval('button,[role="tab"],h1,h2,h3', els =>
  [...new Set(els.map(e => (e.textContent || '').trim()).filter(t => t && t.length < 50))].slice(0, 50))
console.log('existing-assessment view controls:', JSON.stringify(controls))
await browser.close()
console.log('done')
