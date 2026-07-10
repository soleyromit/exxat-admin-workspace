import { chromium } from 'playwright'
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1500,height:1000}})).newPage()
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR: '+e.message))
await p.goto('http://localhost:3005/surveys/push',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(6000)
await p.screenshot({path:'/tmp/visual-check/p2/01-all-columns.png',fullPage:true})
// pick Class of 2027 cohort to surface gaps (practice/lab courses)
await p.getByRole('checkbox',{name:/Class of 2027/}).click().catch(e=>errs.push('cohort: '+e.message)); await p.waitForTimeout(900)
await p.screenshot({path:'/tmp/visual-check/p2/02-cohort-gaps.png',fullPage:true})
// toggle OFF "Course Coordinator" → Coordinator column should disappear
await p.getByRole('button',{name:'Course Coordinator'}).click().catch(e=>errs.push('toggle coord: '+e.message)); await p.waitForTimeout(900)
await p.screenshot({path:'/tmp/visual-check/p2/03-coord-column-removed.png',fullPage:true})
console.log('pageerrors:', errs.length?errs:'none')
await b.close()
