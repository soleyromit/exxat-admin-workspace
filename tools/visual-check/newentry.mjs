import { chromium } from 'playwright'
const b = await chromium.launch({ headless:true })
const pg = await (await b.newContext({viewport:{width:1440,height:900}})).newPage()
await pg.goto('http://localhost:3001/assessment-builder?new=1&courseId=course-phar101',{waitUntil:'networkidle'})
await pg.waitForTimeout(2500)
const r = await pg.evaluate(()=>{
  const activeTab=[...document.querySelectorAll('[data-slot="tabs-trigger"]')].find(t=>t.getAttribute('data-active')==='true'||t.getAttribute('data-state')==='active')
  return { activeTab: activeTab?.textContent.trim(), hasSetupForm: !!document.querySelector('input[value="New Assessment"]') && !!document.body.textContent.match(/Assessment name/) }
})
console.log(JSON.stringify(r))
await pg.screenshot({path:'/tmp/visual-check/new-entry.png',fullPage:false})
await b.close()
