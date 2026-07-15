import { chromium } from 'playwright'
const OUT = '/Users/romitsoley/.claude/jobs/ddf507d6/tmp'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(e.message.split('\n')[0]))
// 1) clean default load (no localStorage) — is the hydration warning pre-existing?
await p.goto('http://localhost:3005/course-evaluation/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.waitForTimeout(3000)
console.log('clean-load pageerrors:', errs.length ? errs : 'none')
// 2) open the user menu → Demo account submenu
const trigger = p.locator('[aria-label*="profile and settings"], button:has-text("Dr. Anita Patel")').first()
await trigger.click({ timeout: 5000 }).catch(e => errs.push('trigger: ' + e.message))
await p.waitForTimeout(700)
const sub = p.getByText('Demo account', { exact: true }).first()
await sub.hover({ timeout: 4000 }).catch(e => errs.push('sub hover: ' + e.message))
await p.waitForTimeout(900)
await p.screenshot({ path: `${OUT}/switcher-menu.png`, clip: { x: 0, y: 250, width: 760, height: 720 } })
console.log('after-menu pageerrors:', errs.length ? errs : 'none')
await b.close()
