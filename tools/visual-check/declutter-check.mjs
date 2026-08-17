// Runtime interaction check for the results-declutter round.
// Run from /Users/romitsoley/Work/tools/visual-check (playwright installed there).
import { chromium } from 'playwright'

const BASE = 'http://localhost:3005'
const OUT = '/tmp/visual-check/interactions'
const consoleErrors = []

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1447, height: 900 } })
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)) })

// freeze transitions (axe-phantom discipline; also makes screenshots stable)
await page.goto(`${BASE}/results/s1`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('#scores');await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' })

const report = {}

// 1) expand Question breakdown → count rating-mix strips + segments
await page.getByText('Question breakdown', { exact: true }).first().click()
await page.waitForTimeout(400)
const strips = await page.locator('#questions .h-6.w-full').count()
report.stripCount = strips
report.segmentCount = await page.locator('#questions .h-6.w-full > div').count()
await page.screenshot({ path: `${OUT}/declutter-breakdown-open.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })

// 2) rail: expand "Course evaluation" group → question links appear
const railNav = page.getByRole('navigation', { name: 'On this page' })
await railNav.getByRole('button', { name: /Show Course evaluation question links/ }).click()
await page.waitForTimeout(300)
report.courseGroupLinks = await railNav.getByRole('button', { name: /course objectives were clearly/ }).count()
await page.screenshot({ path: `${OUT}/declutter-rail-group-open.png` })

// 3) click a question link → page scrolls to that question row
await railNav.getByRole('button', { name: /The pace of the course was appropriate/ }).first().click()
await page.waitForTimeout(500)
report.jumpTargetVisible = await page.locator('#question-c6').isVisible()
report.jumpTargetTop = await page.locator('#question-c6').evaluate((el) => Math.round(el.getBoundingClientRect().top))

// 4) collapse the rail → content grid reclaims width
const gridBefore = await page.locator('#scores').evaluate((el) => Math.round(el.getBoundingClientRect().width))
await page.getByRole('button', { name: 'Collapse the page navigator' }).click()
await page.waitForTimeout(300)
const gridAfter = await page.locator('#scores').evaluate((el) => Math.round(el.getBoundingClientRect().width))
report.contentWidth = { railOpen: gridBefore, railCollapsed: gridAfter }
report.expandButton = await page.getByRole('button', { name: 'Expand the page navigator' }).count()
await page.screenshot({ path: `${OUT}/declutter-rail-collapsed.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })
await page.getByRole('button', { name: 'Expand the page navigator' }).click()

// 5) rating strip hover → tooltip with counts + n
await page.locator('#questions .h-6.w-full').first().hover()
await page.waitForTimeout(400)
const tooltipText = await page.locator('[data-slot="tooltip-content"], [role="tooltip"]').first().textContent().catch(() => null)
report.stripTooltip = tooltipText ? tooltipText.slice(0, 140) : null

// 6) live survey — pace chart reminder marker + meta
await page.goto(`${BASE}/results/mon1`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('#scores');await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' })
await page.waitForTimeout(400)
report.paceReminderLabels = await page.getByText('Reminder', { exact: true }).count()
report.paceMeta = (await page.locator('#pace').textContent().catch(() => ''))?.includes('next reminder')
await page.screenshot({ path: `${OUT}/declutter-pace-live.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })

report.consoleErrors = consoleErrors
console.log(JSON.stringify(report, null, 2))
await browser.close()
