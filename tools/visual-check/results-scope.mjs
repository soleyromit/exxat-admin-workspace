import { chromium } from 'playwright'
const OUT = '/tmp/visual-check'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
// DPT-601 (two faculty) — find id: term table showed DPT-601 = Dr. Maria Williams +1
await page.goto('http://localhost:3005/course-evaluation/term/pt1', { waitUntil: 'domcontentloaded' })
await page.getByText('4 of 40 responded').first().waitFor({ timeout: 30000 })
await page.getByRole('link', { name: 'DPT-601' }).click()
await page.waitForTimeout(1500)
console.log('URL:', page.url())
// badge beside title
const titleBadge = await page.locator('h1:has-text("DPT-601")').getByText('Live').count()
  + await page.locator('h1').locator('..').getByText('Live').count()
console.log('Live badge near title:', titleBadge > 0 ? 'yes' : 'check-screenshot')
console.log('Faculty label:', await page.getByText('Faculty', { exact: true }).count())
console.log('naked 42% gone from strip:', await page.locator('div.flex.items-center.gap-3 >> text=/^42%$/').count() === 0 ? 'yes' : 'NO')
await page.screenshot({ path: `${OUT}/results-header-v2.png`, clip: { x: 260, y: 60, width: 1330, height: 420 } })
// Faculty switch changes data: capture Faculty Performance value at All, then switch
const fpAll = await page.locator('text=Faculty Performance').locator('xpath=ancestor::*[contains(@class,"card") or @data-slot="card"]').first().textContent().catch(() => '')
await page.getByRole('radio', { name: /Dr\. Kevin Chen|Dr\. Maria Williams/ }).or(page.getByRole('button', { name: /Dr\. Kevin Chen/ })).first().click({ force: true })
await page.waitForTimeout(600)
const fpOne = await page.locator('text=Faculty Performance').locator('xpath=ancestor::*[contains(@class,"card") or @data-slot="card"]').first().textContent().catch(() => '')
console.log('faculty switch changes data:', fpAll && fpOne && fpAll !== fpOne ? 'yes' : `all="${(fpAll||'').slice(0,40)}" one="${(fpOne||'').slice(0,40)}"`)
await page.screenshot({ path: `${OUT}/results-scoped.png`, clip: { x: 260, y: 60, width: 1330, height: 700 } })
await browser.close()
