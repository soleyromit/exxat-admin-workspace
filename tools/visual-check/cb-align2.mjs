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
  const table = document.querySelector('table')
  if (!table) return 'no table'
  const out = []
  table.querySelectorAll('[role="checkbox"], input[type="checkbox"]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0) return
    const inHead = !!el.closest('thead')
    const tr = el.closest('tr')
    const isGroup = !inHead && !!tr && /record/.test(tr.textContent || '')
    const kind = inHead ? 'header' : isGroup ? 'group' : 'body'
    // padding chain of the containing cell
    const cell = el.closest('th, td')
    const cs = cell ? getComputedStyle(cell) : null
    out.push({ kind, x: Math.round(r.x), padLeft: cs?.paddingLeft, cellTag: cell?.tagName, colspan: cell?.getAttribute('colspan') })
  })
  return out.slice(0, 6)
})
console.table(boxes)
await browser.close()
