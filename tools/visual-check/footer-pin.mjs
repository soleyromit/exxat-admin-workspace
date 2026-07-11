import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:3005/course-evaluation/dashboard', { waitUntil: 'domcontentloaded' })
await page.getByText('122 students').waitFor({ timeout: 30000 })
const ys = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[data-slot="card-footer"]')).slice(0, 4).map(el => {
    const r = el.getBoundingClientRect()
    const card = el.closest('[data-slot="card"]')?.getBoundingClientRect()
    return { footerBottom: Math.round(r.bottom), cardBottom: card ? Math.round(card.bottom) : null }
  })
})
console.table(ys)
const grid = await page.locator('[class*="grid-cols-"]').first().boundingBox()
await page.screenshot({ path: '/tmp/visual-check/footer-pinned.png', clip: grid })
await browser.close()
