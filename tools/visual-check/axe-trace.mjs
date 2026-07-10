import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const targets = [
  { name: 'builder', url: 'http://localhost:3005/templates/tmpl1', prep: async (pg) => {
      await pg.getByRole('tab', { name: /Builder/i }).click().catch(()=>{})
      await pg.waitForTimeout(600)
      await pg.locator('text=The course objectives were clearly stated.').first().click().catch(()=>{})
      await pg.waitForTimeout(800)
  }},
  { name: 'detail-pending', url: 'http://localhost:3005/surveys/s1', prep: async () => {} },
]

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
for (const t of targets) {
  const pg = await ctx.newPage()
  await pg.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await pg.waitForTimeout(1800)
  await t.prep(pg)
  const res = await new AxeBuilder({ page: pg }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
  console.log(`\n═══ ${t.name} (${t.url}) — ${res.violations.length} violation(s) ═══`)
  for (const v of res.violations) {
    console.log(`\n[${v.impact}] ${v.id} — ${v.help}`)
    console.log(`  ${v.helpUrl}`)
    v.nodes.slice(0, 4).forEach(n => {
      console.log(`  • ${n.target.join(' ')}`)
      console.log(`    ${(n.html || '').slice(0, 160)}`)
      if (n.failureSummary) console.log(`    ↳ ${n.failureSummary.replace(/\n/g, ' ')}`.slice(0, 240))
    })
  }
  await pg.close()
}
await b.close()
