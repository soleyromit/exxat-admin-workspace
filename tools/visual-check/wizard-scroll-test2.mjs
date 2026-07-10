import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

mkdirSync('/tmp/visual-check/success-step', { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

await page.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(2000)

await page.locator('#survey-title').fill('Fall 2026 Course Evaluations')
await page.waitForTimeout(200)
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1200)
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1200)
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1200)
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1200)
await page.locator('button:has-text("Push surveys")').click({ force: true })
await page.waitForTimeout(2000)

// Scroll the correct container via evaluate
await page.evaluate(() => {
  const container = document.querySelector('.gap-8 > .rounded-md.w-full')
  if (container) container.scrollTop = 100
})
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/visual-check/success-step/success-scrolled2.png', fullPage: true })
console.log('Scrolled-100 screenshot taken')

// Check if thead is still visible after scroll (sticky test)
const theadVisible = await page.evaluate(() => {
  const container = document.querySelector('.gap-8 > .rounded-md.w-full')
  const thead = container?.querySelector('thead')
  if (!container || !thead) return 'not found'
  const containerRect = container.getBoundingClientRect()
  const theadRect = thead.getBoundingClientRect()
  return {
    containerTop: Math.round(containerRect.top),
    theadTop: Math.round(theadRect.top),
    theadSticky: getComputedStyle(thead).position,
    scrollTop: container.scrollTop,
    // Is thead within container bounds after scroll?
    isVisibleAtContainerTop: Math.abs(theadRect.top - containerRect.top) < 5
  }
})
console.log('Sticky thead check:', JSON.stringify(theadVisible, null, 2))

await browser.close()
