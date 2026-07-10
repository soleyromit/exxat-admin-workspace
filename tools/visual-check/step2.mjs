import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
const pg = await (await b.newContext({ viewport:{width:1440,height:1000} })).newPage()
await pg.goto('http://localhost:3001/assessment-builder/create?courseId=course-phar101&step=2', { waitUntil:'networkidle' })
await pg.waitForTimeout(2000)
const onscreen = await pg.$$eval('h1,h2,h3,label,[class*=step]', els =>
  [...new Set(els.map(e=>(e.textContent||'').trim()).filter(t=>t&&t.length<40))].slice(0,12))
console.log('on screen:', JSON.stringify(onscreen))
await pg.screenshot({ path:'/tmp/visual-check/wiz-step2.png', fullPage:false })
await b.close()
