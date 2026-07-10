import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const pg = await ctx.newPage()
await pg.goto('http://localhost:3005/templates/tmpl1', { waitUntil: 'domcontentloaded', timeout: 45000 })
await pg.waitForTimeout(4000)
await pg.getByRole('tab', { name: /Builder/i }).click().catch(()=>{})
await pg.waitForTimeout(1500)
// assert the removable Faculty chip + its remove button are actually present
const facultyTab = pg.getByRole('tab', { name: /^Faculty/i })
const removeBtn  = pg.getByRole('button', { name: /Remove Faculty group/i })
console.log('Faculty tab visible:', await facultyTab.isVisible().catch(()=>false))
console.log('Remove-Faculty button visible:', await removeBtn.isVisible().catch(()=>false))
// activate it to confirm roving focus
await facultyTab.click().catch(()=>{})
await pg.waitForTimeout(500)
console.log('Faculty tab state:', await facultyTab.getAttribute('data-state').catch(()=>null))
const res = await new AxeBuilder({ page: pg }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
console.log('VIOLATIONS:', res.violations.length)
res.violations.forEach(v => {
  console.log(`  [${v.impact}] ${v.id} — ${v.help}`)
  v.nodes.slice(0,1).forEach(n => console.log('     target:', n.target.join(' '), '| html:', (n.html||'').slice(0,120)))
})
await pg.screenshot({ path: '/tmp/pce-phase15/6-builder-groups-fixed.png' })
await b.close()
