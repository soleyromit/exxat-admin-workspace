import { chromium } from 'playwright'
const OUT = '/Users/romitsoley/.claude/jobs/7611964f/tmp'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

// 1. results/mon2 — the target page
await page.goto('http://localhost:3005/results/mon2?from=term%3Apt1', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2200)
await page.getByRole('button', { name: /Qualitative feedback/ }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: /Question breakdown/ }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/final-mon2.png`, fullPage: true })
console.log('mon2 hide buttons:', await page.getByRole('button', { name: 'Hide from faculty' }).count())
const wr = page.getByRole('button', { name: /View \d+ response/ }).first()
if (await wr.count()) { await wr.scrollIntoViewIfNeeded(); await wr.click(); await page.waitForTimeout(600); await page.screenshot({ path: `${OUT}/final-mon2-sheet.png` }) }

// 2. surveys/mon2 — question-chart-block consumer
await page.goto('http://localhost:3005/surveys/mon2', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2000)
const wr2 = page.getByRole('button', { name: /View \d+ response/ }).first()
console.log('surveys/mon2 view buttons:', await page.getByRole('button', { name: /View \d+ response/ }).count())
if (await wr2.count()) { await wr2.scrollIntoViewIfNeeded(); await wr2.click(); await page.waitForTimeout(600) }
await page.screenshot({ path: `${OUT}/final-surveys-mon2.png`, fullPage: false })

// 3. results/s1 — scale check
await page.goto('http://localhost:3005/results/s1', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2000)
const qual = page.getByRole('button', { name: /Qualitative feedback/ })
if (await qual.count()) { await qual.click(); await page.waitForTimeout(400) }
await page.screenshot({ path: `${OUT}/final-s1.png`, fullPage: true })
console.log('s1 comment rows w/ chips:', await page.getByText('Constructive', { exact: true }).count())
await browser.close()
console.log('done')
