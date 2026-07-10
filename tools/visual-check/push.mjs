import { chromium } from 'playwright'
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1380, height: 1050 } })
await pg.goto('http://localhost:3005/surveys/push', { waitUntil:'domcontentloaded' })
await pg.waitForTimeout(4000)
await pg.getByPlaceholder(/Fall 2026 Course Evaluations/i).fill('Spring 2026 Course Evaluations'); await pg.waitForTimeout(400)
async function adv(){ const x=pg.locator('button',{hasText:/^Continue$/}).first(); await x.scrollIntoViewIfNeeded().catch(()=>{}); await x.click({timeout:8000}).catch(()=>{}); await pg.waitForTimeout(1100) }
await adv(); await adv()
await pg.screenshot({ path:'/tmp/visual-check/PUSH-hint.png', clip:{x:250,y:60,width:760,height:260} })
console.log('hint visible:', await pg.getByText(/pre-filled from/i).isVisible().catch(()=>false))
await b.close()
