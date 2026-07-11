import { chromium } from 'playwright'

const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:3005/course-evaluation/term/pt1', { waitUntil: 'domcontentloaded' })
await page.getByRole('button', { name: /Send a reminder for DPT-611/ }).waitFor({ timeout: 30000 })

// 1. Sidebar: Dashboard child must be aria-current=page on the term route
const dashLink = page.locator('a[href="/course-evaluation/dashboard"]').first()
console.log('Dashboard aria-current:', await dashLink.getAttribute('aria-current'))

// 2. Texts removed + View results present
const html = await page.content()
console.log('evaluations-count text:', html.includes('13 evaluations') ? 'STILL THERE' : 'gone')
console.log('View results buttons:', await page.getByRole('link', { name: /View results for/ }).count())

await page.screenshot({ path: `${OUT}/term-v2.png`, fullPage: true })

// 3. Open the reminder sheet
await page.getByRole('button', { name: /Send a reminder for DPT-611/ }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/remind-sheet.png`, fullPage: false })

// 4. Send → banner; reopen → ack gate
await page.getByRole('button', { name: /^Send \d+ emails?$/ }).click()
await page.waitForTimeout(500)
console.log('Success banner:', await page.getByText(/ad-hoc reminder went out/).count())
await page.getByRole('button', { name: /Send a reminder for DPT-611/ }).click()
await page.waitForTimeout(500)
const sendBtn = page.getByRole('button', { name: /^Send \d+ emails?$/ })
console.log('Send disabled before ack:', await sendBtn.isDisabled())
await page.screenshot({ path: `${OUT}/remind-sheet-ack.png`, fullPage: false })
await page.getByText('Send another reminder anyway').click()
console.log('Send enabled after ack:', !(await sendBtn.isDisabled()))

await browser.close()
