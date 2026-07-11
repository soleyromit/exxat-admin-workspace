import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

// 1. Dashboard: enriched upcoming card
await page.goto('http://localhost:3005/course-evaluation/dashboard', { waitUntil: 'domcontentloaded' })
await page.getByText('122 students').waitFor({ timeout: 30000 })
console.log('offerings found row:', await page.getByText('Course offerings found').count())
console.log('window pending copy:', await page.getByText('Eval window not yet configured').count())
console.log('starts-in countdown:', await page.getByText(/starts in \d+d/).count())
console.log('missing-data block:', await page.getByText(/courses? missing data/).count(), '| Fix data btn:', await page.getByRole('button', { name: 'Fix data' }).count())
const grid = await page.locator('[class*="grid-cols-"]').first().boundingBox()
await page.screenshot({ path: '/tmp/visual-check/gaps-dashboard.png', clip: grid })

// 2. Remind wizard zero state for a no-setup term
await page.goto('http://localhost:3005/surveys/remind?from=term:pt5', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1200)
console.log('no-setup copy:', await page.getByText(/Fall 2026 has no evaluations yet/).count())
console.log('setup CTA:', await page.getByRole('link', { name: 'Set up evaluations' }).count())
await page.screenshot({ path: '/tmp/visual-check/gaps-remind-empty.png' })
await browser.close()
