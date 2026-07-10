#!/usr/bin/env node
/** Capture the two-screen pre-exam flow (password → before you begin). */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:5174'
const ID = process.env.EXAM_ID || 'exam-active-001'
const OUT = '/tmp/visual-check'
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

async function snap(name) {
  await page.screenshot({ path: join(OUT, `preexam-${name}.png`) })
  console.log('shot:', name)
}
async function axe(name) {
  try {
    const r = await new AxeBuilder({ page }).analyze()
    const bad = r.violations.filter(v => ['critical', 'serious'].includes(v.impact))
    await writeFile(join(OUT, `preexam-${name}.axe.json`), JSON.stringify(r.violations, null, 2))
    console.log(`axe ${name}: ${r.violations.length} total, ${bad.length} critical/serious`)
    bad.forEach(v => console.log(`   [${v.impact}] ${v.id}: ${v.help}`))
  } catch (e) { console.log('axe error', name, e.message) }
}

await page.goto(`${BASE}/exam/${ID}/setup`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await snap('1-password'); await axe('1-password')

await page.fill('#exam-password', 'EXAM2026')
await page.waitForTimeout(150)
await page.getByRole('button', { name: /continue/i }).click()
await page.waitForTimeout(900)
await snap('2-review'); await axe('2-review')

// Scroll the body to the bottom to confirm the footer stays pinned
await page.evaluate(() => {
  const el = document.querySelector('[aria-label*="instructions"]')
  if (el) el.scrollTop = el.scrollHeight
})
await page.waitForTimeout(300)
await snap('3-review-scrolled')

await browser.close()
console.log('DONE')
