import { chromium } from 'playwright'
const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })

// 1. Dashboard: new labels, no sheet
await page.goto('http://localhost:3005/course-evaluation/dashboard', { waitUntil: 'domcontentloaded' })
await page.getByText('122 students').waitFor({ timeout: 30000 })
console.log('old label gone:', await page.getByText('Configure Term Calendar').count() === 0 ? 'yes' : 'NO')
console.log('Set up term link:', await page.getByRole('link', { name: 'Set up term' }).count())
console.log('Add missing info link:', await page.getByRole('link', { name: 'Add missing info' }).count())
console.log('Fix data gone:', await page.getByText('Fix data').count() === 0 ? 'yes' : 'NO')

// 2. Header "Set up term" → wizard step 1
await page.getByRole('link', { name: 'Set up term' }).first().click()
await page.getByText('Term details').first().waitFor({ timeout: 15000 })
console.log('wizard URL:', page.url().endsWith('/course-evaluation/term-setup') ? 'ok' : page.url())
await page.screenshot({ path: `${OUT}/term-setup-step1.png` })

// 3. Continue → readiness, finish with override
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(900)
console.log('readiness banner:', await page.getByText(/need more information/).count())
await page.screenshot({ path: `${OUT}/term-setup-step2.png` })
await page.getByRole('button', { name: 'Finish setup' }).click()
await page.waitForTimeout(400)
console.log('override dialog:', await page.getByText('Finish with missing info?').count())
await page.getByRole('button', { name: 'Finish anyway' }).click()
await page.waitForTimeout(400)
console.log('success:', await page.getByText('is set up').count(), '| handoff CTA:', await page.getByRole('link', { name: 'Send evaluations' }).count())
await page.screenshot({ path: `${OUT}/term-setup-success.png` })

// 4. ?phase=readiness deep entry (dashboard "Add missing info")
await page.goto('http://localhost:3005/course-evaluation/term-setup?phase=readiness', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1000)
console.log('deep entry at readiness:', await page.getByText('Course readiness').first().isVisible())
// nav active check
const dash = await page.locator('a[href="/course-evaluation/dashboard"]').first().getAttribute('aria-current')
console.log('Dashboard nav active on wizard:', dash)
await browser.close()
