import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const OUT = '/tmp/visual-check/qnav'
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await ctx.newPage()

const errors = []
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text())
})

async function dismissSectionDialog() {
  const beginBtn = page.locator('button:has-text("Begin Section")')
  if (await beginBtn.count() > 0) {
    await beginBtn.first().click()
    await page.waitForTimeout(800)
    return true
  }
  return false
}

// Navigate to the exam engine route
await page.goto('http://localhost:5174/exam/anat-401/take', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 1. Section start dialog
await page.screenshot({ path: `${OUT}/1-section-start-dialog.png`, fullPage: false })
console.log('1. section-start-dialog captured')

await dismissSectionDialog()

// 2. Exam default (panel closed)
await page.screenshot({ path: `${OUT}/2-exam-default.png`, fullPage: false })
console.log('2. exam-default captured')

const qPill = page.locator('button[aria-label="Toggle question navigator"]')
console.log(`Q pill found: ${await qPill.count() > 0}`)

// 3. Open the nav panel
await qPill.click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/3-panel-open.png`, fullPage: false })
console.log('3. panel-open captured')

const panelNav = await page.locator('nav[aria-label="Question navigator"]').count()
console.log(`Nav panel present: ${panelNav > 0}`)

// Check groups
const groups = await page.locator('nav[aria-label="Question navigator"] [role="group"]').all()
console.log(`Groups found: ${groups.length}`)
for (const g of groups) {
  const id = await g.getAttribute('aria-labelledby')
  const label = id ? await page.locator(`#${id}`).innerText().catch(() => id) : '?'
  const tiles = await g.locator('button').count()
  console.log(`  Group "${label.trim()}" → ${tiles} tiles`)
}

// Q pill active state check
const qPillStyle = await qPill.evaluate(el => {
  const s = window.getComputedStyle(el)
  return { bg: s.backgroundColor, color: s.color }
})
console.log(`Q pill active style: bg="${qPillStyle.bg}" color="${qPillStyle.color}"`)

// 4. Click a NON-close tile (use role="group" tiles)
// Tiles are inside [role="group"] divs — exclude Close button
const groupTiles = page.locator('nav[aria-label="Question navigator"] [role="group"] button')
const groupTileCount = await groupTiles.count()
console.log(`Group tiles (excl. header/close): ${groupTileCount}`)

if (groupTileCount > 0) {
  const tileLabel = await groupTiles.first().getAttribute('aria-label')
  console.log(`Clicking group tile: ${tileLabel}`)
  await groupTiles.first().click()
  await page.waitForTimeout(300)
  const panelStillOpen = await page.locator('nav[aria-label="Question navigator"]').count()
  console.log(`Panel still open after tile click: ${panelStillOpen > 0}`)
  await page.screenshot({ path: `${OUT}/4-after-tile-click.png`, fullPage: false })
  console.log('4. after-tile-click captured')
}

// 5. Hover a tile for tooltip
if (groupTileCount > 1) {
  const hoverTile = groupTiles.nth(1)
  await hoverTile.hover({ force: true })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/5-tooltip-hover.png`, fullPage: false })
  console.log('5. tooltip-hover captured')
}

// 6. Escape to close
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
const panelClosed = await page.locator('nav[aria-label="Question navigator"]').count()
console.log(`Panel closed after Escape: ${panelClosed === 0}`)
await page.screenshot({ path: `${OUT}/6-panel-closed-escape.png`, fullPage: false })
console.log('6. panel-closed-escape captured')

// 7. Close via X button
await qPill.click()
await page.waitForTimeout(400)
const closeBtn = page.locator('button[aria-label="Close question navigator"]')
if (await closeBtn.count() > 0) {
  await closeBtn.click()
  await page.waitForTimeout(300)
  const closedViaX = await page.locator('nav[aria-label="Question navigator"]').count()
  console.log(`Panel closed via X button: ${closedViaX === 0}`)
  await page.screenshot({ path: `${OUT}/7-closed-via-x.png`, fullPage: false })
  console.log('7. closed-via-x captured')
}

// 8. Flagged tile check
// Mark question as flagged, reopen panel
const flagBtn = page.locator('button[aria-label="Mark for review"]').first()
if (await flagBtn.count() > 0) {
  await flagBtn.click()
  await page.waitForTimeout(200)
}
await qPill.click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/8-flagged-tile.png`, fullPage: false })
console.log('8. flagged-tile captured')

// Check flagged group
const flaggedGroup = page.locator('nav[aria-label="Question navigator"] [role="group"]').first()
const flaggedGroupLabel = await flaggedGroup.locator('[id^="nav-group"]').innerText().catch(() => '?')
console.log(`First group after flagging: "${flaggedGroupLabel}"`)
const flaggedTile = flaggedGroup.locator('button').first()
if (await flaggedTile.count() > 0) {
  const flagStyle = await flaggedTile.evaluate(el => {
    const s = window.getComputedStyle(el)
    return { bg: s.backgroundColor }
  })
  console.log(`Flagged tile bg: "${flagStyle.bg}"`)
}

// 9. Mobile viewport
await page.setViewportSize({ width: 375, height: 812 })
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/9-mobile-panel-open.png`, fullPage: false })
console.log('9. mobile-panel-open captured')

const hasHorizontalOverflow = await page.evaluate(() => {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth
})
console.log(`Horizontal overflow on mobile: ${hasHorizontalOverflow}`)

// 10. Close panel, check content area only
await page.setViewportSize({ width: 1280, height: 800 })
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

console.log('\nConsole errors during session:', errors.length)
errors.slice(0, 5).forEach(e => console.log(' ERR:', e.slice(0, 300)))

await browser.close()
