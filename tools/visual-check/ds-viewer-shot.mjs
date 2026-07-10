import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
const pg = await (await b.newContext({ viewport:{width:1440,height:900} })).newPage()
await pg.goto('http://localhost:4000/dashboard', { waitUntil:'networkidle' })
await pg.waitForTimeout(1500)
await pg.screenshot({ path:'/tmp/visual-check/ds-viewer.png', fullPage:false })
const h1font = await pg.evaluate(()=>{const h=document.querySelector('h1,h2,[class*=title]');return h?{tag:h.tagName,text:h.textContent.slice(0,30),font:getComputedStyle(h).fontFamily,size:getComputedStyle(h).fontSize,weight:getComputedStyle(h).fontWeight}:null})
console.log('live DS heading:', JSON.stringify(h1font))
await b.close()
