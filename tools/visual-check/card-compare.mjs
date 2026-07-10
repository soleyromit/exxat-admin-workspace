import { chromium } from 'playwright'
const b = await chromium.launch({ headless:true })
const props = ['border-radius','border-top-width','border-color','box-shadow','padding','background-color','font-family']
async function cardStyle(url, waitText){
  const pg = await (await b.newContext({viewport:{width:1440,height:1000}})).newPage()
  await pg.goto(url,{waitUntil:'networkidle'})
  await pg.waitForTimeout(2000)
  return pg.evaluate((props)=>{
    const el = document.querySelector('[data-slot="card"]')
    if(!el) return {found:false}
    const s = getComputedStyle(el)
    const o = {found:true}
    for(const p of props) o[p]=s.getPropertyValue(p)
    return o
  }, props)
}
const ds = await cardStyle('http://localhost:4000/dashboard')
const mine = await cardStyle('http://localhost:3001/assessment-builder?draftId=demo&tab=build')
console.log('LIVE DS (localhost:4000) Card:', JSON.stringify(ds,null,1))
console.log('MY QuestionCard (localhost:3001):', JSON.stringify(mine,null,1))
await b.close()
