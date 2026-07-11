import { chromium } from 'playwright'
const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })

await page.goto('http://localhost:3005/course-evaluation/term-setup', { waitUntil: 'domcontentloaded' })
await page.getByText('Term details').first().waitFor({ timeout: 30000 })

// Step 1 → 2
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(800)
console.log('locked scope line:', await page.getByText(/Fall 2026 · AY 2026–2027/).count())
console.log('no Term select:', await page.getByRole('combobox', { name: 'Term' }).count() === 0 ? 'yes' : 'NO')
// choose criteria to load the readiness table
await page.getByText('Instructor', { exact: true }).click()
await page.waitForTimeout(800)
console.log('readiness table rows:', await page.locator('[role="progressbar"], table, [data-slot]').count() > 0 ? 'rendered' : '?', '| Needs setup group:', await page.getByText('Needs setup').count())
await page.screenshot({ path: `${OUT}/ts2-readiness.png` })

// Step 2 → 3 (selection defaults all-on)
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(800)
console.log('Survey design step:', await page.getByText('Survey design').first().isVisible())
await page.screenshot({ path: `${OUT}/ts2-design.png` })

// 3 → 4 → 5
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(800)
console.log('Communication step:', await page.getByText('Communication').first().isVisible())
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/ts2-review.png` })
console.log('Review step reached:', page.url())

// Independence: open push wizard in a second tab — untouched state
const page2 = await browser.newPage({ viewport: { width: 1600, height: 950 } })
await page2.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded' })
await page2.waitForTimeout(1500)
console.log('push wizard at its own step 1:', await page2.getByText('Courses & evaluatees').count() > 0 ? 'yes (independent)' : '?')
await browser.close()
