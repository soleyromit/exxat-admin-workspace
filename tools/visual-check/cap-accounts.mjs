import { chromium } from 'playwright'
const OUT = '/Users/romitsoley/.claude/jobs/ddf507d6/tmp'
const URL = 'http://localhost:3005/course-evaluation/dashboard'
const ACCOUNTS = [
  ['acc-healthy', 'healthy'],
  ['acc-fresh', 'fresh'],
  ['acc-nodates', 'nodates'],
  ['acc-noroster', 'noroster'],
  ['acc-upcoming-only', 'upcoming-only'],
  ['acc-between', 'between'],
  ['acc-nolast', 'nolast'],
  ['acc-noupcoming', 'noupcoming'],
  ['acc-next-nodates', 'next-nodates'],
]
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage()
const errs = []
p.on('pageerror', e => errs.push('PAGEERR: ' + e.message))
// prime origin so localStorage is settable
await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.waitForTimeout(1500)
let i = 0
for (const [id, label] of ACCOUNTS) {
  await p.evaluate((v) => localStorage.setItem('pce.demoAccount', v), id)
  await p.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
  await p.waitForTimeout(2600)
  await p.screenshot({ path: `${OUT}/acct-${String(++i).padStart(2, '0')}-${label}.png`, clip: { x: 250, y: 55, width: 1150, height: 640 } })
}
console.log('pageerrors:', errs.length ? errs : 'none')
await b.close()
