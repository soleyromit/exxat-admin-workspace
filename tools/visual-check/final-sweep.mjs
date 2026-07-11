import { chromium } from 'playwright'
const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })

// 1. Term table: type column present
await page.goto('http://localhost:3005/course-evaluation/term/pt1', { waitUntil: 'domcontentloaded' })
await page.getByText('36 pending').first().waitFor({ timeout: 30000 })
console.log('type badges (table):', await page.getByText('Classroom based').count(), 'classroom /', await page.getByText('Practice based').count(), 'practice')
await page.screenshot({ path: `${OUT}/final-term-table.png` })

// 2. Board: no New card, no DPT-511 duplicate
await page.getByRole('radio', { name: 'Board view' }).or(page.getByRole('button', { name: 'Board view' })).click()
await page.waitForTimeout(600)
console.log('New card buttons visible:', await page.getByText('New card').locator('visible=true').count())
console.log('DPT-511 cards:', await page.getByText('DPT-511').count(), '(want 1)')
await page.screenshot({ path: `${OUT}/final-term-board.png` })

// 3. Remind wizard: type badges in rows
await page.goto('http://localhost:3005/surveys/remind?from=term:pt1', { waitUntil: 'domcontentloaded' })
await page.getByLabel('Select all courses').waitFor({ timeout: 30000 })
console.log('type badges (wizard):', await page.getByText('Classroom based').count() + await page.getByText('Practice based').count())
await page.screenshot({ path: `${OUT}/final-remind.png` })

// 4. Dashboard: RateStrip gone, target line present
await page.goto('http://localhost:3005/course-evaluation/dashboard', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1200)
console.log('dashboard target line:', await page.getByText(/below 70% target|on target/).count())
await page.screenshot({ path: `${OUT}/final-dashboard.png` })

await browser.close()
