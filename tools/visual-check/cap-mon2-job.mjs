import { chromium } from 'playwright'
const OUT = '/Users/romitsoley/.claude/jobs/7611964f/tmp'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
await page.goto('http://localhost:3005/results/mon2?from=term%3Apt1', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2200)
await page.screenshot({ path: `${OUT}/v2-full.png`, fullPage: true })
console.log('course content card count:', await page.getByText('Course Content', { exact: true }).count())

// Expand qualitative feedback + question breakdown
await page.getByRole('button', { name: /Qualitative feedback/ }).click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: /Question breakdown/ }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/v2-open.png`, fullPage: true })

// Hide a comment → hidden state
const hideBtn = page.getByRole('button', { name: 'Hide from faculty' }).first()
console.log('hide buttons:', await page.getByRole('button', { name: 'Hide from faculty' }).count())
if (await hideBtn.count()) {
  await hideBtn.click()
  await page.waitForTimeout(400)
  console.log('unhide visible:', await page.getByRole('button', { name: 'Unhide' }).count())
  console.log('hidden badge:', await page.getByText('Hidden from faculty').count())
  await page.screenshot({ path: `${OUT}/v2-hidden.png`, fullPage: true })
  await page.getByRole('button', { name: 'Unhide' }).first().click()
  await page.waitForTimeout(300)
}

// Written responses sheet
const wr = page.getByRole('button', { name: /View \d+ response/ }).first()
console.log('view-responses buttons:', await page.getByRole('button', { name: /View \d+ response/ }).count())
if (await wr.count()) {
  await wr.scrollIntoViewIfNeeded()
  await wr.click()
  await page.waitForTimeout(700)
  console.log('sheet quotes:', await page.getByText('office hours conflict', { exact: false }).count())
  await page.screenshot({ path: `${OUT}/v2-sheet.png` })
}
await browser.close()
console.log('done')
