// Runtime check for the QuestionScalePlot round (v3 rows).
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

// expand Question breakdown
await page.getByText('Question breakdown', { exact: true }).first().click()
await page.waitForTimeout(500)

// count plots, program triangles, avatar images actually loaded
report.plots = await page.locator('#questions .relative.h-16').count()
report.avatarImgs = await page.locator('#questions .relative.h-16 img').count()
report.avatarImgsLoaded = await page.locator('#questions .relative.h-16 img').evaluateAll(
  (imgs) => imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
)
// value labels rendered at marks
report.valueLabels = await page.locator('#questions .relative.h-16 span.font-semibold').count()

// screenshots: course band + faculty band
await page.locator('#group-course').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: `${OUT}/scaleplot-course.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })
await page.locator('#group-faculty').scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
await page.screenshot({ path: `${OUT}/scaleplot-faculty.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })

// hover an instructor avatar -> formatted tooltip with name
const firstAvatar = page.locator('#questions .relative.h-16 img').first()
await firstAvatar.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(250)
await firstAvatar.hover({ force: true })
await page.waitForTimeout(450)
report.avatarTooltip = await page
  .locator('[data-slot="tooltip-content"], [role="tooltip"]')
  .first()
  .textContent()
  .catch(() => null)
await page.screenshot({ path: `${OUT}/scaleplot-tooltip.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })

// hover the middle-50% band -> distribution tooltip
await page.mouse.move(0, 0)
await page.waitForTimeout(250)
const band = page.locator('#questions .relative.h-16 > div.rounded-full[style*="brand-color"]').first()
await band.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(250)
await band.hover({ position: { x: 6, y: 5 }, force: true })
await page.waitForTimeout(450)
report.bandTooltip = await page
  .locator('[data-slot="tooltip-content"], [role="tooltip"]')
  .first()
  .textContent()
  .catch(() => null)

report.consoleErrors = consoleErrors.slice(0, 6)
console.log(JSON.stringify(report, null, 2))
await browser.close()
