import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { mkdirSync } from 'fs'
import AxeBuilder from '@axe-core/playwright'

mkdirSync('/tmp/visual-check/wizard', { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

// Navigate to push page
await page.goto('http://localhost:3005/surveys/push', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(2000)

// Screenshot Step 1 default
await page.screenshot({ path: '/tmp/visual-check/wizard/step1-properties.png', fullPage: true })
console.log('Step1 screenshot taken')

// Check button state before filling in title
const btnDisabledBefore = await page.locator('button:has-text("Continue")').getAttribute('disabled').catch(() => null)
console.log('Continue disabled before title:', btnDisabledBefore !== null ? 'yes' : 'no')

// Type survey title
const titleInput = page.locator('#survey-title')
await titleInput.fill('Fall 2026 Course Evaluations')
await page.waitForTimeout(300)

// Continue button should now be enabled (term is pre-selected)
const btnDisabledAfter = await page.locator('button:has-text("Continue")').getAttribute('disabled').catch(() => null)
console.log('Continue disabled after title:', btnDisabledAfter !== null ? 'yes' : 'no')

// Click Continue
await page.locator('button:has-text("Continue")').click({ force: true })
await page.waitForTimeout(1200)

// Screenshot Step 2 (Distribution)
await page.screenshot({ path: '/tmp/visual-check/wizard/step2-distribution.png', fullPage: true })

const h1Text = await page.locator('h1').first().textContent().catch(() => 'none')
console.log('H1 text after continue:', h1Text)

// Check ViewSegmentedControl - it should be role=radiogroup
const radiogroup = page.locator('[role="radiogroup"]')
const radiogroupCount = await radiogroup.count()
console.log('Radiogroup(s) found:', radiogroupCount)
for (let i = 0; i < radiogroupCount; i++) {
  const label = await radiogroup.nth(i).getAttribute('aria-label').catch(() => 'no aria-label')
  const html = await radiogroup.nth(i).innerHTML().catch(() => '')
  console.log(`  Radiogroup[${i}] aria-label="${label}", inner:`, html.substring(0, 200))
}

// Check search InputGroup in toolbar
const inputGroups = await page.locator('[data-slot="input-group"]').count()
console.log('InputGroup count on step2:', inputGroups)

// Check InputGroupAddon (magnifying glass)
const addons = await page.locator('[data-slot="input-group-addon"]').count()
console.log('InputGroupAddon count:', addons)

// Check scroll container
const scrollContainer = page.locator('[style*="max-height"]').filter({ has: page.locator('label') })
const scrollCount = await scrollContainer.count()
console.log('Potential scroll containers:', scrollCount)

// Try to find and click Manage button
const manageBtns = page.locator('button:has-text("Manage")')
const manageBtnCount = await manageBtns.count()
console.log('Manage buttons found:', manageBtnCount)

if (manageBtnCount > 0) {
  await manageBtns.first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: '/tmp/visual-check/wizard/dialog-open.png', fullPage: false })
  console.log('Dialog screenshot taken')
  
  const dialogTitle = await page.locator('[data-slot="dialog-title"]').first().textContent().catch(() => 'none')
  console.log('Dialog title:', dialogTitle)
  
  // Inspect tabs HTML for count chips
  const tabsList = page.locator('[data-slot="tabs-list"]').first()
  const tabsHTML = await tabsList.innerHTML().catch(() => 'none')
  console.log('Tabs HTML:', tabsHTML)
  
  // Screenshot just dialog
  const dialogContent = page.locator('[data-slot="dialog-content"]')
  if (await dialogContent.count() > 0) {
    await dialogContent.screenshot({ path: '/tmp/visual-check/wizard/dialog-close-up.png' })
    console.log('Dialog close-up screenshot taken')
  }
  
  // Check InputGroupAddon in dialog
  const dialogAddons = await page.locator('[data-slot="dialog-content"] [data-slot="input-group-addon"]').count()
  console.log('InputGroupAddon in dialog (Faculty tab):', dialogAddons)
  
  // Switch to Students tab
  const studentsTab = page.locator('[data-slot="tabs-trigger"]').filter({ hasText: 'Students' })
  if (await studentsTab.count() > 0) {
    await studentsTab.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: '/tmp/visual-check/wizard/dialog-students-tab.png', fullPage: false })
    
    // Close-up of dialog on students tab
    const dialogContentStudents = page.locator('[data-slot="dialog-content"]')
    if (await dialogContentStudents.count() > 0) {
      await dialogContentStudents.screenshot({ path: '/tmp/visual-check/wizard/dialog-students-close-up.png' })
    }
    
    const studentsAddons = await page.locator('[data-slot="dialog-content"] [data-slot="input-group-addon"]').count()
    console.log('InputGroupAddon in dialog (Students tab):', studentsAddons)
  }
  
  // Run axe while dialog is open
  const axeDialog = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  const dialogViolations = axeDialog.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
  writeFileSync('/tmp/visual-check/wizard/dialog.axe.json', JSON.stringify({
    violations: dialogViolations,
    summary: { 
      critical: dialogViolations.filter(v => v.impact === 'critical').length, 
      serious: dialogViolations.filter(v => v.impact === 'serious').length 
    }
  }, null, 2))
  console.log('Dialog axe violations (critical/serious):', dialogViolations.length)
  if (dialogViolations.length > 0) {
    dialogViolations.forEach(v => console.log(`  ${v.impact}: ${v.id} — ${v.nodes.length} nodes — ${v.help}`))
  }
  
  // Close dialog
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
}

// Run axe on step 2
const axeStep2 = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
  .analyze()
const step2Violations = axeStep2.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
writeFileSync('/tmp/visual-check/wizard/step2.axe.json', JSON.stringify({
  violations: step2Violations,
  summary: { 
    critical: step2Violations.filter(v => v.impact === 'critical').length, 
    serious: step2Violations.filter(v => v.impact === 'serious').length 
  }
}, null, 2))
console.log('Step2 axe violations (critical/serious):', step2Violations.length)
if (step2Violations.length > 0) {
  step2Violations.forEach(v => console.log(`  ${v.impact}: ${v.id} — ${v.nodes.length} nodes — ${v.help}`))
}

console.log('\nConsole errors:', errors.length > 0 ? errors : 'none')

await browser.close()
console.log('\nDone.')
