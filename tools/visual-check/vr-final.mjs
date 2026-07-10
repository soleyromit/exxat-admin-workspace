import { chromium } from 'playwright'
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage()
const errs=[]; p.on('pageerror',e=>errs.push(e.message))
await p.goto('http://localhost:3005/surveys/push',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(6000)
// toggle a criterion to re-confirm correlation still works after layout changes
await p.getByRole('button',{name:'Instructor'}).click().catch(()=>{}); await p.waitForTimeout(700)
const heads1 = await p.evaluate(()=>[...document.querySelectorAll('th')].map(h=>h.innerText.trim()).filter(Boolean))
await p.getByRole('button',{name:'Instructor'}).click().catch(()=>{}); await p.waitForTimeout(700)
const heads2 = await p.evaluate(()=>[...document.querySelectorAll('th')].map(h=>h.innerText.trim()).filter(Boolean))
const overlay = await p.evaluate(()=>document.body.innerText.match(/A11y \d+|DS \d+/g))
console.log('columns after Instructor OFF:', JSON.stringify(heads1))
console.log('columns after Instructor ON :', JSON.stringify(heads2))
console.log('overlay:', JSON.stringify(overlay), '| pageerrors:', errs.length?errs:'none')
await b.close()
