import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
await page.goto('http://localhost:3005/course-evaluation/term-setup', { waitUntil: 'domcontentloaded' })
await page.getByText('Term details').first().waitFor({ timeout: 30000 })
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(700)
await page.getByText('Instructor', { exact: true }).click()
await page.waitForTimeout(900)
const boxes = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('[role="checkbox"], input[type="checkbox"]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0) return
    const row = el.closest('tr, [role="row"], thead, [data-group-row]')
    const kind = el.closest('thead') ? 'header'
      : (el.closest('tr')?.textContent || '').includes('record') ? 'group'
      : 'body'
    out.push({ kind, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) })
  })
  return out.slice(0, 8)
})
console.table(boxes)
await page.screenshot({ path: '/tmp/visual-check/cb-align.png', clip: { x: 280, y: 380, width: 600, height: 460 } })
await browser.close()
