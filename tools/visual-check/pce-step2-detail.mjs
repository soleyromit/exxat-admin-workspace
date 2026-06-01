import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

mkdirSync('/tmp/visual-check/wizard', { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

await page.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(1500)
await page.locator('#survey-title').fill('Test Title')
await page.waitForTimeout(200)
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1500)

// Get all radiogroups after navigation to step 2
const radiogroups = page.locator('[role="radiogroup"]')
const count = await radiogroups.count()
console.log('Radiogroups on step2:', count)
for (let i = 0; i < count; i++) {
  const label = await radiogroups.nth(i).getAttribute('aria-label').catch(() => 'no-label')
  console.log(`  radiogroup[${i}] aria-label="${label}"`)
  if (label && label.includes('Filter')) {
    await radiogroups.nth(i).screenshot({ path: '/tmp/visual-check/wizard/step2-view-segmented.png' })
    console.log('  -> ViewSegmentedControl screenshot taken')
  }
}

// Toolbar screenshot
const toolbarItems = page.locator('div').filter({ hasText: /\d+ of \d+ selected/ })
const toolbarCount = await toolbarItems.count()
console.log('Toolbar matches:', toolbarCount)
if (toolbarCount > 0) {
  // Get the smallest one
  for (let i = 0; i < Math.min(toolbarCount, 5); i++) {
    const bb = await toolbarItems.nth(i).boundingBox()
    console.log(`  toolbar[${i}] bbox:`, bb)
  }
  await toolbarItems.nth(toolbarCount - 1).screenshot({ path: '/tmp/visual-check/wizard/step2-toolbar-close.png' })
  console.log('Toolbar close-up taken')
}

// Focus on Continue button to test focus ring
await page.locator('button:has-text("Continue")').focus()
await page.waitForTimeout(200)
const continueBtn = page.locator('button:has-text("Continue")')
await continueBtn.screenshot({ path: '/tmp/visual-check/wizard/step2-continue-focus.png' })

// Focus on Back button
await page.locator('button:has-text("Back")').focus()
await page.waitForTimeout(200)
await page.locator('button:has-text("Back")').screenshot({ path: '/tmp/visual-check/wizard/step2-back-focus.png' })

await browser.close()
console.log('Done.')
