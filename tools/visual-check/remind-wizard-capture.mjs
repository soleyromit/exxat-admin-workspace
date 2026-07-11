import { chromium } from 'playwright'

const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// A. Default entry (no ids): ALL live courses selected
await page.goto('http://localhost:3005/surveys/remind?from=term:pt1', { waitUntil: 'domcontentloaded' })
await page.getByLabel('Select all courses').waitFor({ timeout: 30000 })
console.log('A. default-all label:', await page.locator('label[for="remind-all"]').textContent())
await page.screenshot({ path: `${OUT}/remind-w2-step1-all.png`, fullPage: true })

// Master checkbox: deselect all → Continue disabled → reselect all
await page.getByLabel('Select all courses').click()
console.log('A. after master-toggle:', await page.locator('label[for="remind-all"]').textContent(),
  '| Continue disabled:', await page.getByRole('button', { name: 'Continue' }).isDisabled())
await page.getByLabel('Select all courses').click()
console.log('A. re-toggled:', await page.locator('label[for="remind-all"]').textContent())

// B. Row-level entry (?ids=mon2): only that course pre-checked
await page.goto('http://localhost:3005/surveys/remind?ids=mon2&from=term:pt1', { waitUntil: 'domcontentloaded' })
await page.getByLabel('Select all courses').waitFor({ timeout: 30000 })
console.log('B. ids=mon2 label:', await page.locator('label[for="remind-all"]').textContent())
await page.screenshot({ path: `${OUT}/remind-w2-step1-ids.png`, fullPage: true })

// C. Full flow: select all, step through, send, back to origin
await page.getByLabel('Select all courses').click() // indeterminate -> all? (click cycles)
console.log('C. after select-all click:', await page.locator('label[for="remind-all"]').textContent())
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/remind-w2-step3.png`, fullPage: true })
await page.getByRole('button', { name: /^Send \d+ emails?$/ }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/remind-w2-success.png`, fullPage: true })
await page.getByRole('button', { name: /Back to Spring 2026/ }).click()
await page.waitForTimeout(800)
console.log('C. URL after back:', page.url())

await browser.close()
