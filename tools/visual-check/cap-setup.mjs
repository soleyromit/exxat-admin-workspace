import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
const OUT='/tmp/visual-check/p1'; mkdirSync(OUT,{recursive:true})
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage()
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PAGEERR: '+e.message))
await p.goto('http://localhost:3005/surveys/setup',{waitUntil:'domcontentloaded',timeout:60000})
await p.waitForTimeout(6000) // turbopack compile on first hit
await p.screenshot({path:`${OUT}/01-empty.png`,fullPage:true})
// select Term = Fall
await p.locator('#term-season').click().catch(async()=>{await p.getByLabel('Term',{exact:false}).click()})
await p.waitForTimeout(500)
await p.getByRole('option',{name:'Fall'}).click().catch(e=>errs.push('term opt: '+e.message))
await p.waitForTimeout(500)
// select Academic year = 2026–2027
await p.locator('#academic-year').click(); await p.waitForTimeout(400)
await p.getByRole('option',{name:/2026/}).first().click().catch(e=>errs.push('year opt: '+e.message))
await p.waitForTimeout(1200)
await p.screenshot({path:`${OUT}/02-term-year-loaded.png`,fullPage:true})
// pick a cohort
const cb = p.getByRole('checkbox').first()
await cb.click().catch(e=>errs.push('cohort: '+e.message))
await p.waitForTimeout(900)
await p.screenshot({path:`${OUT}/03-cohort-selected.png`,fullPage:true})
// toggle off Coordinator criterion
await p.getByRole('button',{name:'Course Coordinator'}).click().catch(()=>p.getByText('Course Coordinator').click().catch(e=>errs.push('crit: '+e.message)))
await p.waitForTimeout(700)
await p.screenshot({path:`${OUT}/04-criteria-toggled.png`,fullPage:true})
console.log('ERRORS:', errs.length?JSON.stringify(errs,null,1):'none')
await b.close()
