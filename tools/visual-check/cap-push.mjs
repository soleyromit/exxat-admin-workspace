import { chromium } from 'playwright'
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage()
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR: '+e.message))
await p.goto('http://localhost:3005/surveys/push',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(5000)
await p.screenshot({path:'/tmp/visual-check/p1/push-01-default.png',fullPage:true})
// pick a cohort to filter
const cb = p.getByRole('checkbox').first()
await cb.click().catch(e=>errs.push('cohort click: '+e.message)); await p.waitForTimeout(800)
await p.screenshot({path:'/tmp/visual-check/p1/push-02-cohort.png',fullPage:true})
console.log('pageerrors:', errs.length?errs:'none')
await b.close()
