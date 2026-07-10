import { chromium } from 'playwright'
const b = await chromium.launch({ headless:true })
// my wizard
const p1 = await (await b.newContext({viewport:{width:1440,height:900}})).newPage()
await p1.goto('http://localhost:3001/assessment-builder/create?courseId=course-phar101',{waitUntil:'domcontentloaded'})
await p1.waitForTimeout(2500)
await p1.screenshot({path:'/tmp/visual-check/cmp-mine.png'})
// offline target
const p2 = await (await b.newContext({viewport:{width:1440,height:900}})).newPage()
await p2.goto('file:///Users/romitsoley/Downloads/Assessment Creation (offline).html',{waitUntil:'networkidle'})
await p2.waitForTimeout(2000)
await p2.locator('text="Create Assessment"').first().click().catch(()=>{})
await p2.waitForTimeout(1200)
await p2.screenshot({path:'/tmp/visual-check/cmp-offline.png'})
console.log('captured both')
await b.close()
