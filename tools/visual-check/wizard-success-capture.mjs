import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import AxeBuilder from '@axe-core/playwright'

mkdirSync('/tmp/visual-check/success-step', { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

// ── Step 1: Properties ────────────────────────────────────────────
await page.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(2000)
await page.screenshot({ path: '/tmp/visual-check/success-step/step1.png', fullPage: true })
console.log('Step 1 screenshot taken')

// Fill title and continue
await page.locator('#survey-title').fill('Fall 2026 Course Evaluations')
await page.waitForTimeout(300)
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1500)

// ── Step 2: Distribution ────────────────────────────────────────────
await page.screenshot({ path: '/tmp/visual-check/success-step/step2.png', fullPage: true })
console.log('Step 2 screenshot taken')

// Click Continue on Distribution
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1500)

// ── Step 3: Survey Design ────────────────────────────────────────────
await page.screenshot({ path: '/tmp/visual-check/success-step/step3.png', fullPage: true })
console.log('Step 3 screenshot taken')

// Click Continue on Survey Design
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1500)

// ── Step 4: Communication ────────────────────────────────────────────
await page.screenshot({ path: '/tmp/visual-check/success-step/step4.png', fullPage: true })
console.log('Step 4 screenshot taken')

// Click Continue on Communication
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1500)

// ── Step 5: Report Access ────────────────────────────────────────────
await page.screenshot({ path: '/tmp/visual-check/success-step/step5.png', fullPage: true })
console.log('Step 5 screenshot taken')

// Click Push surveys button
const pushBtn = page.locator('button:has-text("Push surveys")')
const pushBtnCount = await pushBtn.count()
console.log('Push surveys button count:', pushBtnCount)

if (pushBtnCount > 0) {
  await pushBtn.click({ force: true })
  await page.waitForTimeout(2000)
} else {
  // Try other possible labels
  const altBtn = page.locator('button:has-text("Push")')
  const altCount = await altBtn.count()
  console.log('Fallback Push button count:', altCount)
  if (altCount > 0) {
    await altBtn.first().click({ force: true })
    await page.waitForTimeout(2000)
  }
}

// ── Success step ────────────────────────────────────────────
await page.screenshot({ path: '/tmp/visual-check/success-step/success.png', fullPage: true })
const h1Text = await page.locator('h1').textContent().catch(() => 'not found')
console.log('H1 on success:', h1Text)

// Check subtitle text
const subtitleText = await page.locator('p').first().textContent().catch(() => 'not found')
console.log('Subtitle text:', subtitleText)

// Run axe
const axeResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
  .analyze()
writeFileSync('/tmp/visual-check/success-step/success.axe.json', JSON.stringify(axeResults, null, 2))

console.log('Axe violations:', axeResults.violations.length)
axeResults.violations.forEach(v => {
  console.log(`  [${v.impact}] ${v.id}: ${v.description} — ${v.nodes.length} nodes`)
})

console.log('Console errors:', errors)
await browser.close()
