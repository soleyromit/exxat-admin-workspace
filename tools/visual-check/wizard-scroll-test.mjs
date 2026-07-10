import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

mkdirSync('/tmp/visual-check/success-step', { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

await page.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(2000)

// Quick navigation through all steps
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

// Scroll the table container to test sticky thead
const tableContainer = page.locator('.rounded-md.w-full').first()
await tableContainer.evaluate(el => el.scrollTop = 60)
await page.waitForTimeout(400)
await page.screenshot({ path: '/tmp/visual-check/success-step/success-scrolled.png', fullPage: true })
console.log('Scrolled screenshot taken')

// Also get the table's actual scroll height vs client height
const scrollInfo = await tableContainer.evaluate(el => ({
  scrollHeight: el.scrollHeight,
  clientHeight: el.clientHeight,
  scrollTop: el.scrollTop,
}))
console.log('Table scroll info:', scrollInfo)

// Check if sticky thead is working - measure thead top offset after scroll
const theadOffset = await page.locator('thead').evaluate(el => el.getBoundingClientRect().top)
console.log('Thead top offset after scroll:', theadOffset)

// Count total rows in table
const rowCount = await page.locator('tbody tr').count()
console.log('Total tbody rows:', rowCount)

// Check tab-focusability of the table container
const tabIndex = await tableContainer.getAttribute('tabindex')
console.log('Table container tabindex:', tabIndex)

await browser.close()
