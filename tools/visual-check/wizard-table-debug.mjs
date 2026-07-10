import { chromium } from 'playwright'

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

// Measure the table and container dimensions
const dims = await page.evaluate(() => {
  const container = document.querySelector('.gap-8 > .rounded-md.w-full')
  const table = container?.querySelector('table')
  const tbody = container?.querySelector('tbody')
  const allRows = container?.querySelectorAll('tbody tr')
  const thead = container?.querySelector('thead')
  
  return {
    container: container ? {
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      offsetHeight: container.offsetHeight,
      style: container.getAttribute('style'),
      computedMaxHeight: getComputedStyle(container).maxHeight,
      computedOverflow: getComputedStyle(container).overflow,
      computedOverflowY: getComputedStyle(container).overflowY,
    } : 'not found',
    table: table ? {
      scrollHeight: table.scrollHeight,
      offsetHeight: table.offsetHeight,
      clientHeight: table.clientHeight,
    } : 'not found',
    tbody: tbody ? {
      offsetHeight: tbody.offsetHeight,
      clientHeight: tbody.clientHeight,
    } : 'not found',
    rowCount: allRows?.length,
    thead: thead ? {
      offsetHeight: thead.offsetHeight,
      position: getComputedStyle(thead).position,
    } : 'not found',
    // Check parent containers
    parent: container?.parentElement ? {
      className: container.parentElement.className.slice(0, 60),
      offsetHeight: container.parentElement.offsetHeight,
    } : 'not found',
  }
})

console.log('Dimensions:', JSON.stringify(dims, null, 2))
await browser.close()
