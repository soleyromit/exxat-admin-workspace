import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const pg = await ctx.newPage()
await pg.goto('http://localhost:3005/templates/tmpl1', { waitUntil: 'domcontentloaded', timeout: 30000 })
await pg.waitForTimeout(2500)
await pg.getByRole('tab', { name: /Builder/i }).click().catch(()=>{})
await pg.waitForTimeout(800)
const res = await new AxeBuilder({ page: pg }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
for (const v of res.violations) {
  console.log(`\n[${v.impact}] ${v.id}`)
  for (const n of v.nodes.slice(0,2)) {
    console.log('TARGET:', n.target.join(' '))
    console.log('HTML:', (n.html||'').slice(0,300))
    console.log('SUMMARY:', (n.failureSummary||'').replace(/\n/g,' | '))
  }
}
await b.close()
