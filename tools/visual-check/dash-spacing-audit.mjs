import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:3005/course-evaluation/dashboard', { waitUntil: 'domcontentloaded' })
await page.getByText('122 students').waitFor({ timeout: 30000 })

const gaps = await page.evaluate(() => {
  const out = []
  const cards = document.querySelectorAll('[class*="grid-cols-"] > *')
  cards.forEach((card, ci) => {
    const kids = []
    // walk header + content children in order
    const header = card.querySelector(':scope > div:first-child')
    const rows = card.querySelectorAll(':scope > * > *')
    const items = []
    const title = card.querySelector('h3, [class*="CardTitle"], .truncate')
    const walker = card.querySelectorAll(':scope > div')
    walker.forEach(section => {
      Array.from(section.children).forEach(el => {
        const r = el.getBoundingClientRect()
        if (r.height > 0) items.push({ text: (el.textContent || '').slice(0, 28).trim(), top: Math.round(r.top), bottom: Math.round(r.bottom) })
      })
    })
    for (let i = 1; i < items.length; i++) {
      out.push({ card: ci, from: items[i-1].text, to: items[i].text, gap: items[i].top - items[i-1].bottom })
    }
  })
  return out
})
gaps.filter(g => g.card < 3).forEach(g => console.log(`card${g.card} | ${String(g.gap).padStart(3)}px | ${g.from} → ${g.to}`))

// close-up crop of the current card
const cardBox = await page.locator('[class*="grid-cols-"] > *').first().boundingBox()
await page.screenshot({ path: '/tmp/visual-check/dash-card-closeup.png', clip: cardBox })
await browser.close()
