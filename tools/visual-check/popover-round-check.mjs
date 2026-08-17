// Runtime check for the popover + theme-boxplot + stat-tile round.
import { chromium } from 'playwright'

const BASE = 'http://localhost:3005'
const OUT = '/tmp/visual-check/interactions'
const consoleErrors = []

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1447, height: 900 } })
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)) })

await page.goto(`${BASE}/results/s1`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('#scores')
await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' })

const report = {}

// 1) score cards — flattened stat tiles
await page.screenshot({ path: `${OUT}/round4-scorecards.png`, clip: { x: 330, y: 340, width: 1117, height: 340 } })
report.slopeSvgGone = (await page.locator('#scores svg[viewBox="0 0 208 58"]').count()) === 0

// 2) theme chart — boxplot rows with whiskers + photos
await page.locator('#themes').evaluate((el) => el.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(300)
report.themePlots = await page.locator('#themes .relative.h-16').count()
report.themeAvatars = await page.locator('#themes .relative.h-16 img').count()
await page.screenshot({ path: `${OUT}/round4-themes.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })

// 3) theme band click → popover with MiniRatingColumns + question links
const themeBand = page.locator('#themes button[aria-label$="distribution details"]').first()
await themeBand.click({ force: true })
await page.waitForTimeout(400)
const pop = page.locator('[data-slot="popover-content"], [role="dialog"]').first()
report.themePopoverText = (await pop.textContent().catch(() => null))?.slice(0, 200)
report.themePopoverHistogram = await pop.locator('.w-8').count() // MiniRatingColumns columns
report.themePopoverQuestionButtons = await pop.locator('button').count()
await page.screenshot({ path: `${OUT}/round4-theme-popover.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })

// 4) question-jump link from theme popover navigates to the question row
if (report.themePopoverQuestionButtons > 0) {
  await pop.locator('button').last().click()
  await page.waitForTimeout(700)
  report.jumpFromThemeWorked = await page.locator('#questions [id^="question-"]').first().isVisible()
}

// 5) question row: avatar popover with photo + histogram
await page.waitForTimeout(300)
const avatarBtn = page.locator('#questions button[aria-label*="details"] img').first()
await avatarBtn.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(250)
await avatarBtn.click({ force: true })
await page.waitForTimeout(400)
const pop2 = page.locator('[data-slot="popover-content"], [role="dialog"]').first()
report.personPopoverText = (await pop2.textContent().catch(() => null))?.slice(0, 160)
report.personPopoverHistogram = await pop2.locator('.w-8').count()
await page.screenshot({ path: `${OUT}/round4-person-popover.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })
await page.keyboard.press('Escape')

// 6) rail icons — layout glyph
report.railLayoutIcon = await page.locator('i.fa-table-columns').count()

report.consoleErrors = consoleErrors.slice(0, 5)
console.log(JSON.stringify(report, null, 2))
await browser.close()
