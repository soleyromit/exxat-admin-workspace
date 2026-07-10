import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p.goto('http://localhost:3005/course-evaluation/dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 })
await p.waitForTimeout(2500)
await p.screenshot({ path: '/tmp/visual-check/ce-dashboard.png' })
console.log('url after load:', p.url())
await b.close()
