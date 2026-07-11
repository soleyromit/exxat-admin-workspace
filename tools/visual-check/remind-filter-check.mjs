import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// A. Default: only below-target courses listed
await page.goto('http://localhost:3005/surveys/remind?from=term:pt1', { waitUntil: 'domcontentloaded' })
await page.getByLabel('Select all courses').waitFor({ timeout: 30000 })
console.log('A.', await page.locator('label[for="remind-all"]').textContent())
console.log('A. on-target DPT-540 (91%) shown:', await page.getByText('DPT-540').count())
console.log('A. DPT-530 (73%) shown:', await page.getByText('DPT-530').count())
await page.screenshot({ path: '/tmp/visual-check/remind-w3-filtered.png', fullPage: true })

// B. Explicit ids for an on-target course still enters (mon3 = DPT-540, 91%)
await page.goto('http://localhost:3005/surveys/remind?ids=mon3&from=term:pt1', { waitUntil: 'domcontentloaded' })
await page.getByLabel('Select all courses').waitFor({ timeout: 30000 })
console.log('B.', await page.locator('label[for="remind-all"]').textContent())
console.log('B. DPT-540 shown when requested:', await page.getByText('DPT-540').count())
await browser.close()
