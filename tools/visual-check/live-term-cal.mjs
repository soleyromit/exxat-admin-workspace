import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
await page.goto('https://pce-three.vercel.app/surveys/dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.waitForTimeout(2500)
// The live site opens a dialog on load — dismiss it before clicking anything.
await page.keyboard.press('Escape')
await page.waitForTimeout(600)
if (await page.locator('[data-slot="dialog-overlay"][data-state="open"]').count()) {
  await page.locator('[data-slot="dialog-close"], button:has-text("Close"), button[aria-label="Close"]').first().click().catch(() => {})
  await page.waitForTimeout(600)
}
await page.getByText('Configure Term Calendar').first().click()
await page.waitForTimeout(1200)
await page.screenshot({ path: '/tmp/visual-check/live-term-calendar.png' })
// open the dropdowns to see options
const combos = await page.getByRole('combobox').all()
console.log('comboboxes:', combos.length)
for (let i = 0; i < Math.min(combos.length, 3); i++) {
  console.log(`combo ${i}:`, await combos[i].textContent())
}
if (combos.length > 0) {
  await combos[0].click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/tmp/visual-check/live-term-dd1.png' })
  const opts = await page.getByRole('option').allTextContents()
  console.log('combo0 options:', opts)
  await page.keyboard.press('Escape')
  if (combos.length > 1) {
    await combos[1].click()
    await page.waitForTimeout(500)
    const opts2 = await page.getByRole('option').allTextContents()
    console.log('combo1 options:', opts2)
    await page.screenshot({ path: '/tmp/visual-check/live-term-dd2.png' })
  }
}
await browser.close()
