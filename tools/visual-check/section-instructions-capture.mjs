#!/usr/bin/env node
/** Capture the floating section-instructions button + popover in the exam view. */
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
  const f = join(OUT, `section-${name}.png`)
  await page.screenshot({ path: f })
  console.log('shot:', f)
}
async function axe(name) {
  try {
    const r = await new AxeBuilder({ page }).analyze()
    const bad = r.violations.filter(v => ['critical', 'serious'].includes(v.impact))
    await writeFile(join(OUT, `section-${name}.axe.json`), JSON.stringify(r.violations, null, 2))
    console.log(`axe ${name}: ${r.violations.length} total, ${bad.length} critical/serious`)
    bad.forEach(v => console.log(`   [${v.impact}] ${v.id}: ${v.help}`))
  } catch (e) { console.log('axe error', name, e.message) }
}

await page.goto(`${BASE}/exam/${ID}/take`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// Begin the first section (dismiss the section-start overlay)
const begin = page.getByRole('button', { name: /begin section/i })
if (await begin.count()) { await begin.first().click(); await page.waitForTimeout(700) }
await snap('1-exam-with-button'); await axe('1-exam-with-button')

// Open the floating section instructions popover
const fab = page.getByRole('button', { name: /section .* instructions/i })
if (await fab.count()) {
  await fab.first().click()
  await page.waitForTimeout(500)
  await snap('2-instructions-open'); await axe('2-instructions-open')
} else {
  console.log('!! floating section-instructions button not found')
}

await browser.close()
console.log('DONE')
