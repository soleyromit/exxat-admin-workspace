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

async function click(txt) {
  const el = page.locator(`text="${txt}"`).first()
  if (await el.count() === 0) { console.log('  (no control:', txt, ')'); return false }
  await el.click({ timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(1200)
  return true
}

await click('Create Assessment')
await page.screenshot({ path: `${OUT}/step-1.png`, fullPage: true })

for (let step = 2; step <= 4; step++) {
  const ok = await click('Continue')
  if (!ok) break
  await page.screenshot({ path: `${OUT}/step-${step}.png`, fullPage: true })
  const heads = await page.$$eval('h1,h2,h3,h4,label,[role="tab"]', els =>
    [...new Set(els.map(e => (e.textContent || '').trim()).filter(t => t && t.length < 50))].slice(0, 30))
  console.log(`step ${step}:`, JSON.stringify(heads))
}
await browser.close()
console.log('done →', OUT)
