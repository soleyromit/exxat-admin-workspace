import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const SPEC = 'file:///Users/romitsoley/Downloads/Assessment_Platform_Migration_Pack/src/assessment-builder.html'
const OUT = '/tmp/visual-check/spec'
if (!existsSync(OUT)) await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(SPEC, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const tabs = ['structure', 'questions', 'collab', 'settings-tab', 'preread']
for (const t of tabs) {
  await page.evaluate(tab => window.switchTab && window.switchTab(tab), t)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/tab-${t}-full.png`, fullPage: true })
  await page.screenshot({ path: `${OUT}/tab-${t}-fold.png`, fullPage: false })
  const h = await page.evaluate(() => document.body.scrollHeight)
  console.log(`captured ${t} (height ${h}px)`)
}
await browser.close()
console.log('done →', OUT)
