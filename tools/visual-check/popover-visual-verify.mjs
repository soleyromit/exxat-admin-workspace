// Visual + interaction verification for the sectioned-popover + ScoreTile round.
import { chromium } from 'playwright'

const BASE = 'http://localhost:3005'
const OUT = '/tmp/visual-check/interactions'
const report = {}
const b = await chromium.launch()

// 1) score row at desktop + tablet
for (const [name, width] of [['desktop', 1447], ['tablet', 768]]) {
  const pg = await (await b.newContext({ viewport: { width, height: 900 } })).newPage()
  await pg.goto(`${BASE}/results/s1`, { waitUntil: 'domcontentloaded' })
  await pg.waitForSelector('#scores')
  await pg.addStyleTag({ content: '*{transition:none!important;animation:none!important}' })
  const cards = pg.locator('#scores')
  await cards.evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await pg.waitForTimeout(200)
  await pg.screenshot({ path: `${OUT}/round5-cards-${name}.png`, clip: { x: width === 768 ? 0 : 330, y: 0, width: width === 768 ? 768 : 1117, height: 460 } })
  await pg.close()
}

// 2) popovers + jump + keyboard on desktop
const pg = await (await b.newContext({ viewport: { width: 1447, height: 900 } })).newPage()
await pg.goto(`${BASE}/results/s1`, { waitUntil: 'domcontentloaded' })
await pg.waitForSelector('#scores')
await pg.addStyleTag({ content: '*{transition:none!important;animation:none!important}' })

// prior-term popover
await pg.getByRole('button', { name: /Spring 2025/ }).first().click()
await pg.waitForTimeout(350)
await pg.screenshot({ path: `${OUT}/round5-prior-popover.png`, clip: { x: 330, y: 0, width: 1117, height: 500 } })
await pg.keyboard.press('Escape')

// theme popover
await pg.getByText('Question breakdown', { exact: true }).first().click()
await pg.waitForTimeout(400)
const themeBand = pg.locator('#themes button[aria-label$="distribution details"]').first()
await themeBand.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await pg.waitForTimeout(200)
await themeBand.click({ force: true })
await pg.waitForTimeout(350)
await pg.screenshot({ path: `${OUT}/round5-theme-popover.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })
// jump from theme popover
const pop = pg.locator('[data-slot="popover-content"], [role="dialog"]').first()
const qButtons = await pop.locator('button').count()
report.themePopoverQuestionButtons = qButtons
if (qButtons > 0) {
  await pop.locator('button').last().click()
  await pg.waitForTimeout(700)
  report.jumpWorked = await pg.locator('#questions [id^="question-"]').first().isVisible()
}

// person popover
const avatarBtn = pg.locator('#questions button[aria-label*="details"] img').first()
await avatarBtn.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await pg.waitForTimeout(200)
await avatarBtn.click({ force: true })
await pg.waitForTimeout(350)
await pg.screenshot({ path: `${OUT}/round5-person-popover.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })

// keyboard: Escape returns focus to trigger
await pg.keyboard.press('Escape')
await pg.waitForTimeout(250)
report.focusReturnsToTrigger = await pg.evaluate(() => {
  const el = document.activeElement
  return !!el && el.tagName === 'BUTTON' && (el.getAttribute('aria-label') || '').includes('details')
})

// keyboard open: focus band trigger via keyboard and press Enter
const band = pg.locator('#questions button[aria-label$="distribution details"]').first()
await band.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await band.focus()
await pg.keyboard.press('Enter')
await pg.waitForTimeout(350)
report.keyboardOpenWorks = (await pg.locator('[data-slot="popover-content"], [role="dialog"]').count()) > 0
await pg.keyboard.press('Escape')

// zero-response check: no popover triggers inside an empty plot (none in s1 seed; assert count parity instead)
report.plotCount = await pg.locator('#questions .relative.h-16').count()

console.log(JSON.stringify(report, null, 2))
await b.close()
