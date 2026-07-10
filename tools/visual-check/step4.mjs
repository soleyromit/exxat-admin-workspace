import { chromium } from 'playwright'
const b = await chromium.launch({ headless:true })
const pg = await (await b.newContext({viewport:{width:1440,height:1000}})).newPage()
await pg.goto('http://localhost:3001/assessment-builder/create?courseId=course-phar101&step=4',{waitUntil:'networkidle'})
await pg.waitForTimeout(2000)
await pg.screenshot({path:'/tmp/visual-check/wiz-step4.png',fullPage:false})
const t = await pg.$$eval('h3,label', e=>[...new Set(e.map(x=>(x.textContent||'').trim()).filter(t=>t&&t.length<30))].slice(0,8))
console.log('step4 on screen:', JSON.stringify(t))
await b.close()
