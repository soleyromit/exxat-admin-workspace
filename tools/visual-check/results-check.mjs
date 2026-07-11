import { chromium } from 'playwright'
const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
// mon3 = DPT-601 live (from the term table earlier) — use a live survey w/ 2 faculty: DPT-601 has Williams +1
await page.goto('http://localhost:3005/results/mon3?from=term%3Apt1', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1800)
console.log('scope chips:', await page.getByRole('radio', { name: 'All faculty' }).count() + await page.getByRole('button', { name: 'All faculty' }).count())
console.log('themes:', await page.getByText('Teaching Effectiveness').count(), await page.getByText('Assessment Practices').count())
console.log('header ellipsis:', await page.getByRole('button', { name: 'More actions' }).count())
console.log('share card gone:', await page.getByText('Students respond at this link').count() === 0 ? 'yes' : 'NO')
await page.screenshot({ path: `${OUT}/results-live.png`, fullPage: false })
// open the ⋯
const more = page.getByRole('button', { name: 'More actions' })
if (await more.count()) {
  await more.click()
  await page.waitForTimeout(400)
  console.log('menu items:', await page.getByRole('menuitem').allTextContents())
  await page.screenshot({ path: `${OUT}/results-more.png` })
}
await browser.close()
