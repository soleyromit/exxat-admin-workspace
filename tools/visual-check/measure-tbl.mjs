import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage()
await p.goto('http://localhost:3005/admin/eval-settings?section=templates', { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.waitForTimeout(4000)
const m = await p.evaluate(() => {
  const tbl = document.querySelector('table')
  const wrap = tbl?.parentElement
  const rect = (el) => el ? { w: Math.round(el.getBoundingClientRect().width), left: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right), sw: el.scrollWidth, cw: el.clientWidth } : null
  return {
    table: rect(tbl),
    tableMinWidth: tbl?.style.minWidth,
    wrap: rect(wrap),
    wrapOverflowX: wrap ? getComputedStyle(wrap).overflowX : null,
    wrapClass: wrap?.className,
    parentOfWrap: rect(wrap?.parentElement),
    main: rect(document.querySelector('main')),
  }
})
console.log(JSON.stringify(m, null, 2))
await b.close()
