import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
mkdirSync('/tmp/visual-check/vr',{recursive:true})
const b=await chromium.launch()
for (const w of [1280,1440,1680]) {
  const p=await (await b.newContext({viewport:{width:w,height:1000}})).newPage()
  await p.goto('http://localhost:3005/surveys/push',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(5500)
  // measure table overflow + whether Type column is visible
  const info = await p.evaluate(() => {
    const scroller = document.querySelector('[class*="overflow-x"], [class*="HorizontalScroll"], .overflow-auto table, table')?.closest('div')
    const tbl = document.querySelector('table')
    const heads = [...document.querySelectorAll('th')].map(h=>h.innerText.trim()).filter(Boolean)
    const container = tbl?.parentElement
    return {
      viewport: window.innerWidth,
      headers: heads,
      tableScrollW: tbl?.scrollWidth, tableClientW: tbl?.clientWidth,
      containerClientW: container?.clientWidth,
      overflowX: tbl ? tbl.scrollWidth - (container?.clientWidth ?? 0) : null,
    }
  })
  console.log(JSON.stringify(info))
  await p.screenshot({path:`/tmp/visual-check/vr/full-${w}.png`,fullPage:true})
  // crop the table region
  const tbl = p.locator('table').first()
  if (await tbl.count()) await tbl.screenshot({path:`/tmp/visual-check/vr/table-${w}.png`}).catch(()=>{})
  await p.close()
}
await b.close()
