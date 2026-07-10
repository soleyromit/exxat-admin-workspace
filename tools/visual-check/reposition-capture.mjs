import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const OUT = '/tmp/visual-check/reposition'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

// Dashboard = term band + reused DashboardMonitor
await page.goto('http://localhost:3005/surveys/dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.waitForTimeout(2800)
await page.screenshot({ path: `${OUT}/01-dashboard-reposition.png`, fullPage: true })

// Analytics = By Term / Faculty / Course (no Overview)
await page.goto('http://localhost:3005/analytics', { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/02-analytics-trimmed.png`, fullPage: false })

console.log('console errors:', errors.length)
errors.slice(0, 8).forEach((e) => console.log('  -', e))
await browser.close()
