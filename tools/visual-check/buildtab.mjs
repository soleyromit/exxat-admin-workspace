import { chromium } from 'playwright'
const b = await chromium.launch({ headless:true })
const pg = await (await b.newContext({viewport:{width:1440,height:1000}})).newPage()
await pg.goto('http://localhost:3001/assessment-builder?draftId=demo&tab=build',{waitUntil:'networkidle'})
await pg.waitForTimeout(2500)
await pg.screenshot({path:'/tmp/visual-check/build-tab-now.png',fullPage:false})
const h = await pg.evaluate(()=>{const x=document.querySelector('h1,h2');return x?{t:x.tagName,txt:x.textContent.slice(0,30),f:getComputedStyle(x).fontFamily.split(',')[0]}:'(none)'})
console.log('build tab heading:', JSON.stringify(h))
await b.close()
