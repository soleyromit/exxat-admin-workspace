import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:3005/course-evaluation/term/pt1', { waitUntil: 'domcontentloaded' })
await page.locator('text=Still to respond').locator('visible=true').first().waitFor({ timeout: 30000 })
console.log('tiles:', await page.locator('text=Response rate').locator('visible=true').count(),
  '| redundant 405/641 tile gone:', await page.getByText('405/641').count() === 0 ? 'yes' : 'NO')
await page.screenshot({ path: '/tmp/visual-check/kpi-strip.png', clip: { x: 380, y: 240, width: 1190, height: 240 } })
await browser.close()
