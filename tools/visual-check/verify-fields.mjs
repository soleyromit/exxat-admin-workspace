import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
const OUT = '/tmp/visual-check/setup-live'; mkdirSync(OUT,{recursive:true})
const URL='https://pce-three.vercel.app/surveys/setup'
const b = await chromium.launch({headless:true})
const p = await (await b.newContext({viewport:{width:1440,height:1050}})).newPage()
const log=[]
await p.goto(URL,{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(3500)
await p.locator('button',{hasText:/^Close$/}).first().click({timeout:3000}).catch(()=>{})

// enumerate select options
const opts = await p.evaluate(()=>{
  const g=sel=>[...document.querySelectorAll(sel)].map(s=>({aria:s.getAttribute('aria-label'),opts:[...s.options].map(o=>o.label)}))
  return g('select')
})
log.push('SELECT OPTIONS: '+JSON.stringify(opts))

async function snap(term,year,tag){
  const sels = await p.locator('select').all()
  await sels[0].selectOption({label:term}).catch(e=>log.push(term+' term fail'))
  await sels[1].selectOption({label:year}).catch(e=>log.push(year+' year fail'))
  await p.waitForTimeout(1200)
  // select all evaluatee types
  for(const t of ['Course','Instructor','Course Coordinator']){
    await p.locator('button',{hasText:new RegExp('^'+t+'$')}).first().click({timeout:2500}).catch(()=>{})
  }
  await p.waitForTimeout(1000)
  // run audit if button exists
  await p.locator('button',{hasText:/^(Run|Re-run) Audit$/}).first().click({timeout:3000}).catch(()=>{})
  await p.waitForTimeout(2000)
  await p.screenshot({path:`${OUT}/V-${tag}.png`,fullPage:true}).catch(()=>{})
  const t = await p.evaluate(()=>{
    const rows=[...document.querySelectorAll('table tr,[role=row]')].map(r=>(r.innerText||'').replace(/\s+/g,' ').trim()).filter(Boolean)
    const heads=[...document.querySelectorAll('th,[role=columnheader]')].map(h=>(h.innerText||'').trim()).filter(Boolean)
    return {heads, rows: rows.slice(0,30)}
  })
  log.push('\n== '+tag+' ('+term+' '+year+') ==\nHEADERS: '+JSON.stringify(t.heads)+'\nROWS:\n'+t.rows.join('\n'))
}
await snap('Fall','2025-2026','fall2526')
await snap('Spring','2025-2026','spr2526')
await snap('Summer','2025-2026','sum2526')
await snap('Fall','2024-2025','fall2425')
await snap('Spring','2026-2027','spr2627')
writeFileSync(`${OUT}/_fields.txt`,log.join('\n'))
console.log('DONE'); await b.close()
