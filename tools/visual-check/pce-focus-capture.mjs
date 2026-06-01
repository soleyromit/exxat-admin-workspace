import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

mkdirSync('/tmp/visual-check/wizard', { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

// Navigate and reach step 2
await page.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(1500)

const titleInput = page.locator('#survey-title')
await titleInput.fill('Fall 2026 Course Evaluations')
await page.waitForTimeout(300)
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1200)

// Tab to first button (Back) and capture focus ring
await page.keyboard.press('Tab')
await page.waitForTimeout(200)
await page.screenshot({ path: '/tmp/visual-check/wizard/step2-focus-back-btn.png', fullPage: false })

// Tab to Continue and capture
await page.keyboard.press('Tab')
await page.keyboard.press('Tab')
await page.keyboard.press('Tab')
await page.keyboard.press('Tab')
await page.keyboard.press('Tab')
await page.waitForTimeout(200)
await page.screenshot({ path: '/tmp/visual-check/wizard/step2-focus-continue.png', fullPage: false })

// Get the toolbar close-up (crop to toolbar area)
// Navigate back to get fresh step2 
await page.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(1500)
await titleInput.fill('Test Title')
await page.waitForTimeout(200)
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1200)

// Screenshot toolbar region
const toolbar = page.locator('div').filter({ hasText: /\d+ of \d+ selected/ }).first()
if (await toolbar.count() > 0) {
  await toolbar.screenshot({ path: '/tmp/visual-check/wizard/step2-toolbar.png' })
  console.log('Toolbar screenshot taken')
}

// Screenshot segmented control
const segCtrl = page.locator('[role="radiogroup"]').first()
if (await segCtrl.count() > 0) {
  await segCtrl.screenshot({ path: '/tmp/visual-check/wizard/step2-segmented-control.png' })
  console.log('Segmented control screenshot taken')
}

// Get full page with 375px mobile viewport
await browser.close()

// Mobile viewport check
const browser2 = await chromium.launch({ headless: true })
const ctx2 = await browser2.newContext({ viewport: { width: 375, height: 812 } })
const page2 = await ctx2.newPage()
await page2.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page2.waitForTimeout(1500)
await page2.locator('#survey-title').fill('Test Title')
await page2.waitForTimeout(200)
await page2.locator('button:has-text("Continue")').click({ force: true })
await page2.waitForTimeout(1200)
await page2.screenshot({ path: '/tmp/visual-check/wizard/step2-mobile.png', fullPage: true })
console.log('Mobile screenshot taken')

await browser2.close()
console.log('Done.')
