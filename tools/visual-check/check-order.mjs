import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage()
const errs = []
p.on('pageerror', e => errs.push(e.message.split('\n')[0]))
await p.goto('http://localhost:3005/course-evaluation/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.waitForTimeout(3500)
const order = await p.evaluate(() => {
  const badges = [...document.querySelectorAll('h2.sr-only ~ div [data-slot="card-title"], h2.sr-only ~ div .text-base')]
  // fallback: grab term titles in DOM order within the triptych grid
  const grid = document.querySelector('h2.sr-only')?.nextElementSibling
  if (!grid) return 'no grid'
  return [...grid.children].map(c => (c.textContent || '').replace(/\s+/g, ' ').slice(0, 40))
})
console.log('grid children order:', JSON.stringify(order, null, 2))
console.log('pageerrors:', errs.length ? errs : 'none')
await b.close()
