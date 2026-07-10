import { chromium } from 'playwright'
const b = await chromium.launch({ headless:true })
async function cards(url, label){
  const pg = await (await b.newContext({viewport:{width:1440,height:1000}})).newPage()
  await pg.goto(url,{waitUntil:'networkidle'}); await pg.waitForTimeout(2000)
  const r = await pg.evaluate(()=>{
    const out=[]
    document.querySelectorAll('[data-slot="card"]').forEach((el,i)=>{ if(i<4){const s=getComputedStyle(el); out.push({radius:s.borderRadius, pad:getComputedStyle(el.querySelector('[data-slot="card-content"]')||el).padding})} })
    return out
  })
  console.log(label, JSON.stringify(r))
  await pg.close?.()
}
await cards('http://localhost:4000/data-list','4000 /data-list cards:')
await cards('http://localhost:4000/question-bank','4000 /question-bank cards:')
await cards('http://localhost:3001/assessment-builder?draftId=demo&tab=build','MY build-tab cards:')
await b.close()
