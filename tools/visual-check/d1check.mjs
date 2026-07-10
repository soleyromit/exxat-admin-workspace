import { chromium } from 'playwright'
const b = await chromium.launch({ headless:true })
const pg = await (await b.newContext({viewport:{width:1440,height:1000}})).newPage()
await pg.goto('http://localhost:3001/assessment-builder?draftId=demo&tab=build',{waitUntil:'networkidle'})
await pg.waitForTimeout(2500)
const r = await pg.evaluate(()=>{
  const headers=[...document.querySelectorAll('section')].map(s=>{const h=s.querySelector('span');return h?h.textContent.trim().slice(0,24):''}).filter(Boolean)
  const cards=document.querySelectorAll('[data-slot="card"]').length
  const addBtn=!!document.querySelector('button')&&[...document.querySelectorAll('button')].some(b=>/Add section/i.test(b.textContent))
  return { sectionHeaders: headers.slice(0,6), totalCards: cards, hasAddSectionFoot: addBtn }
})
console.log(JSON.stringify(r,null,1))
await b.close()
