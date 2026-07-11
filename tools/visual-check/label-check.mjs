import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
await page.goto('http://localhost:3005/course-evaluation/term/pt1', { waitUntil: 'domcontentloaded' })
await page.getByText('4 of 40 responded').first().waitFor({ timeout: 30000 })
console.log('visible "below target" labels:', await page.getByText('below target').locator('visible=true').count())
await page.screenshot({ path: '/tmp/visual-check/v5-term-table.png' })
await browser.close()
