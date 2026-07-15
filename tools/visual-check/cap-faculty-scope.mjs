import { chromium } from 'playwright'
const OUT = '/Users/romitsoley/.claude/jobs/ddf507d6/tmp'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage()
const errs = []
p.on('pageerror', e => errs.push('PAGEERR: ' + e.message))
await p.goto('http://localhost:3005/results/s1', { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.waitForTimeout(4500)
// 1) Default — should read "All faculty" active + "Course overview · N in review"
await p.screenshot({ path: `${OUT}/scope-01-all-default.png`, clip: { x: 0, y: 0, width: 1400, height: 460 } })
// grab the Faculty Performance score under All faculty
const fpAll = await p.locator('text=/Faculty performance|Faculty Performance/i').first().textContent().catch(() => null)
// 2) Switch to Dr. Kevin Chen
const chen = p.getByRole('radio', { name: /Kevin Chen/ }).first()
await chen.click({ timeout: 5000 }).catch(async () => {
  await p.getByText(/Kevin Chen/).first().click().catch(e => errs.push('chen click: ' + e.message))
})
await p.waitForTimeout(1200)
await p.screenshot({ path: `${OUT}/scope-02-chen.png`, clip: { x: 0, y: 0, width: 1400, height: 460 } })
// 3) Switch to Dr. Anita Patel
const patel = p.getByRole('radio', { name: /Anita Patel/ }).first()
await patel.click({ timeout: 5000 }).catch(async () => {
  await p.getByText(/Anita Patel/).first().click().catch(e => errs.push('patel click: ' + e.message))
})
await p.waitForTimeout(1200)
await p.screenshot({ path: `${OUT}/scope-03-patel.png`, clip: { x: 0, y: 0, width: 1400, height: 460 } })
console.log('fp(all) label:', fpAll)
console.log('pageerrors:', errs.length ? errs : 'none')
await b.close()
