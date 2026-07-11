import { chromium } from 'playwright'
const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })

// 1. Term workspace — table view with pending-first cells
await page.goto('http://localhost:3005/course-evaluation/term/pt1', { waitUntil: 'domcontentloaded' })
await page.getByText('36 pending').first().waitFor({ timeout: 30000 })
await page.screenshot({ path: `${OUT}/term-v3-table.png`, fullPage: false })

// 2. Toggle to Board
await page.getByRole('radio', { name: 'Board view' }).or(page.getByRole('button', { name: 'Board view' })).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/term-v3-board.png`, fullPage: false })
const cols = await page.getByText('No survey configured').count()
console.log('board columns visible:', cols > 0 ? 'yes' : 'NO')

// 3. Footer always visible (no scrolling) on a TALL wizard step
await page.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1800)
const pushFooter = await page.locator('.sticky.bottom-0').last().boundingBox()
console.log('push step1 footer visible in viewport:', pushFooter && pushFooter.y < 900 ? `yes (y=${Math.round(pushFooter.y)})` : 'NO')

await page.goto('http://localhost:3005/surveys/remind?from=term:pt1', { waitUntil: 'domcontentloaded' })
await page.getByLabel('Select all courses').waitFor({ timeout: 30000 })
const remindFooter = await page.locator('.sticky.bottom-0').last().boundingBox()
console.log('remind step1 footer visible:', remindFooter && remindFooter.y < 900 ? `yes (y=${Math.round(remindFooter.y)})` : 'NO')
await page.screenshot({ path: `${OUT}/remind-v3-step1.png`, fullPage: false })

await browser.close()
