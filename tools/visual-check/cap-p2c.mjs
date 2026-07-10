import { chromium } from 'playwright'
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1600,height:1000}})).newPage()
const errs=[]; p.on('pageerror',e=>errs.push(e.message))
await p.goto('http://localhost:3005/surveys/push',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(6000)
await p.getByRole('checkbox',{name:/Class of 2027/}).click().catch(()=>{}); await p.waitForTimeout(900)
await p.screenshot({path:'/tmp/visual-check/p2/05-fixes.png',fullPage:true})
console.log('pageerrors:', errs.length?errs:'none')
await b.close()
