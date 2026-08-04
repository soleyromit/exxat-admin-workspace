import { chromium } from 'playwright'
const OUT = '/Users/romitsoley/.claude/jobs/7611964f/tmp'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
await page.goto('http://localhost:3005/results/s1', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2200)
const qual = page.getByRole('button', { name: /Qualitative feedback/ })
if (await qual.count()) { await qual.click(); await page.waitForTimeout(400) }
const qb = page.getByRole('button', { name: /Question breakdown/ })
if (await qb.count()) { await qb.click(); await page.waitForTimeout(500) }
await page.screenshot({ path: `${OUT}/s1-open.png`, fullPage: true })
const wr = page.getByRole('button', { name: /View \d+ response/ }).first()
console.log('s1 view buttons:', await page.getByRole('button', { name: /View \d+ response/ }).count())
if (await wr.count()) {
  await wr.scrollIntoViewIfNeeded(); await wr.click(); await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/s1-sheet.png` })
}
await page.goto('http://localhost:3005/surveys/mon2', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1800)
await page.screenshot({ path: `${OUT}/surveys-mon2.png`, fullPage: true })
await browser.close()
console.log('done')
