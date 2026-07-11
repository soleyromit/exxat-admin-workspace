import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

async function footerY(sel = 'button:has-text("Continue"), button:has-text("Send"), button:has-text("Push")') {
  const btn = page.locator('.mt-auto.border-t').last()
  const box = await btn.boundingBox()
  return box ? Math.round(box.y) : null
}

// Remind wizard: footer Y per step
await page.goto('http://localhost:3005/surveys/remind?from=term:pt1', { waitUntil: 'domcontentloaded' })
await page.getByLabel('Select all courses').waitFor({ timeout: 30000 })
const y1 = await footerY()
await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForTimeout(300)
const y2 = await footerY()
await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForTimeout(300)
const y3 = await footerY()
console.log('remind footer Y: step1=%s step2=%s step3=%s → %s', y1, y2, y3,
  (y1 === y2 && y2 === y3) ? 'FIXED ✓' : 'STILL DYNAMIC ✗')

// Push wizard: step 1 CE footer position (content may overflow; check it's at least at viewport bottom band)
await page.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)
const py1 = await footerY()
console.log('push step1 footer Y:', py1)
await browser.close()
