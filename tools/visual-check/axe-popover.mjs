// Popover-open axe sweep for /results/s1 — baseline, then each popover kind.
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1447, height: 900 } })
const pg = await ctx.newPage()
await pg.goto('http://localhost:3005/results/s1', { waitUntil: 'domcontentloaded', timeout: 30000 })
await pg.waitForSelector('#scores')
await pg.addStyleTag({ content: '*{transition:none!important;animation:none!important}' })

async function axe(label) {
  const res = await new AxeBuilder({ page: pg })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  console.log(`\n=== ${label}: ${res.violations.length} violation(s) ===`)
  for (const v of res.violations) {
    console.log(`[${v.impact}] ${v.id}`)
    for (const n of v.nodes.slice(0, 2)) {
      console.log('  TARGET:', n.target.join(' '))
      console.log('  HTML:', (n.html || '').slice(0, 240))
      console.log('  SUMMARY:', (n.failureSummary || '').replace(/\n/g, ' | '))
    }
  }
  return res.violations.length
}

let total = 0
total += await axe('baseline (all closed)')

// prior-term popover on a score tile
await pg.getByRole('button', { name: /Spring 2025/ }).first().click()
await pg.waitForTimeout(400)
total += await axe('prior-term popover open')
await pg.keyboard.press('Escape')

// expand breakdown, open theme-band popover
await pg.getByText('Question breakdown', { exact: true }).first().click()
await pg.waitForTimeout(400)
const themeBand = pg.locator('#themes button[aria-label$="distribution details"]').first()
await themeBand.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await pg.waitForTimeout(200)
await themeBand.click({ force: true })
await pg.waitForTimeout(400)
total += await axe('theme detail popover open')
await pg.keyboard.press('Escape')

// person marker popover in the breakdown
const avatarBtn = pg.locator('#questions button[aria-label*="details"] img').first()
await avatarBtn.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await pg.waitForTimeout(200)
await avatarBtn.click({ force: true })
await pg.waitForTimeout(400)
total += await axe('person popover open')
await pg.keyboard.press('Escape')

// program triangle popover
const progBtn = pg.locator('#questions button[aria-label^="Program average"]').first()
await progBtn.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await pg.waitForTimeout(200)
await progBtn.click({ force: true })
await pg.waitForTimeout(400)
total += await axe('program popover open')

console.log(`\nTOTAL violations across states: ${total}`)
await b.close()
process.exit(total > 0 ? 1 : 0)
