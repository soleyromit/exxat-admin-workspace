import { chromium } from 'playwright'
const URL='https://pce-three.vercel.app/surveys/setup'
const b=await chromium.launch({headless:true})
const p=await (await b.newContext({viewport:{width:1440,height:1050}})).newPage()
await p.goto(URL,{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(3500)
await p.locator('button',{hasText:/^Close$/}).first().click({timeout:3000}).catch(()=>{})
async function grab(term,year){
  const sels=await p.locator('select').all()
  await sels[0].selectOption({label:term}).catch(()=>{})
  await sels[1].selectOption({label:year}).catch(()=>{})
  await p.waitForTimeout(1000)
  for(const t of ['Course','Instructor','Course Coordinator']) await p.locator('button',{hasText:new RegExp('^'+t+'$')}).first().click({timeout:2000}).catch(()=>{})
  await p.waitForTimeout(700)
  await p.locator('button',{hasText:/^(Run|Re-run) Audit$/}).first().click({timeout:2500}).catch(()=>{})
  await p.waitForTimeout(1500)
  const txt=await p.evaluate(()=>{
    // grab the courses panel text after "selected"
    const all=(document.body.innerText||'').replace(/\r/g,'')
    const i=all.indexOf('COURSE')
    return i>=0? all.slice(i, i+1400): '(no COURSE header) '+all.slice(all.indexOf('loaded')-40, all.indexOf('loaded')+400)
  })
  console.log('\n===== '+term+' '+year+' =====\n'+txt)
}
for(const [t,y] of [['Fall','2025-2026'],['Spring','2025-2026'],['Summer','2025-2026'],['Fall','2024-2025'],['Fall','2026-2027'],['Spring','2024-2025']]) await grab(t,y)
await b.close()
