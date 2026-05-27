import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = 'http://localhost:3001'
const OUT_DIR = '/tmp/visual-check/builder-custom'

if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await ctx.newPage()

const consoleErrors = []
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

async function snap(name) {
  const p = `${OUT_DIR}/${name}.png`
  await page.screenshot({ path: p, fullPage: false })
  console.log(`Screenshot: ${p}`)
  return p
}

async function axe(name) {
  const p = `${OUT_DIR}/${name}.axe.json`
  const results = await new AxeBuilder({ page }).analyze()
  await writeFile(p, JSON.stringify(results.violations, null, 2))
  const critical = results.violations.filter(v => v.impact === 'critical').length
  const serious = results.violations.filter(v => v.impact === 'serious').length
  console.log(`Axe ${name}: critical=${critical} serious=${serious}`)
  return { violations: results.violations, critical, serious }
}

// 1. Navigate to builder
await page.goto(`${BASE_URL}/assessment-builder`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 2. Fill in assessment name (Step 1 required field)
await page.fill('input[placeholder="e.g. Midterm Exam"]', 'Test Assessment')

// 3. Click "Continue" to go to Step 2 Build
const continueBtn = page.locator('button:has-text("Continue")')
if (await continueBtn.count() > 0) {
  await continueBtn.click()
  await page.waitForTimeout(1000)
  console.log('Clicked Continue to Step 2')
} else {
  // Try the Build step directly
  const buildStep = page.locator('button:has-text("Build"), [aria-label*="Build"]')
  if (await buildStep.count() > 0) {
    await buildStep.first().click()
    await page.waitForTimeout(1000)
  } else {
    console.log('No Continue or Build button found — trying wizard step')
    // Try clicking the Build wizard step header
    const buildHeader = page.locator('text=Build')
    if (await buildHeader.count() > 0) await buildHeader.first().click()
    await page.waitForTimeout(1000)
  }
}

// 4. Screenshot Step 2 default
await snap('step2-default')
await axe('step2-default')

// 5. Add a section — click "Add section"
const addSectionBtn = page.locator('button:has-text("Add section"), button:has-text("+ Add section")')
if (await addSectionBtn.count() > 0) {
  await addSectionBtn.first().click()
  await page.waitForTimeout(500)
  // Type section title if an input appeared
  const sectionInput = page.locator('input[placeholder="Section title…"], input[aria-label="New section title"]')
  if (await sectionInput.count() > 0) {
    await sectionInput.fill('Part A: Foundations')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  }
  await snap('step2-after-add-section')
  console.log('Added section')
}

// 6. Click "Add questions" or the section to activate it
const addQuestionsBtn = page.locator('button:has-text("Add questions"), [aria-pressed="false"][aria-label*="Add questions"]')
if (await addQuestionsBtn.count() > 0) {
  await addQuestionsBtn.first().click()
  await page.waitForTimeout(500)
  await snap('step2-section-active')
  await axe('step2-section-active')
  console.log('Section activated — checking for instruction textareas')
}

// 7. Check if instruction textareas are visible
const instructions = page.locator('textarea[aria-label*="Instructions"], textarea[placeholder*="instructions"], textarea[placeholder*="Preread"], textarea[placeholder*="case vignette"]')
const count = await instructions.count()
console.log(`Instruction textareas found: ${count}`)
for (let i = 0; i < count; i++) {
  const ta = instructions.nth(i)
  const label = await ta.getAttribute('aria-label') || ''
  const placeholder = await ta.getAttribute('placeholder') || ''
  console.log(`  textarea[${i}]: label="${label}" placeholder="${placeholder}"`)
}

await snap('step2-section-active-final')

// 8. Now navigate back to Step 1 then open Settings sheet
// The settings sheet is triggered by a gear icon or Settings button in the builder toolbar
// Let's look for it — it's always mounted, so try clicking it from Step 2
const settingsBtn = page.locator('button[aria-label*="ettings"], button:has-text("Settings")')
if (await settingsBtn.count() > 0) {
  await settingsBtn.first().click()
  await page.waitForTimeout(1500)
  // Check if sheet opened
  const sheetContent = page.locator('[data-slot="sheet-content"]')
  if (await sheetContent.count() > 0) {
    await snap('settings-sheet-open')
    await axe('settings-sheet-open')
    console.log('Settings sheet opened')
    
    // Scroll to bottom of sheet to see Pre-exam setup section
    await sheetContent.evaluate(el => el.scrollTo(0, el.scrollHeight))
    await page.waitForTimeout(500)
    await snap('settings-sheet-scrolled')
    
    // Look for Pre-exam setup section
    const preExamHeading = page.locator('text=Pre-exam setup')
    const found = await preExamHeading.count()
    console.log(`Pre-exam setup heading found: ${found}`)
    
    // Look for the 4 blocks
    const blockLabels = ['Instructions', 'Ethics', 'Attestation', 'Tech check']
    for (const label of blockLabels) {
      const el = page.locator(`text=${label}`).first()
      const visible = await el.isVisible().catch(() => false)
      console.log(`  Block "${label}" visible: ${visible}`)
    }
    
    // Try toggling Instructions ON
    const instrToggle = page.locator('[aria-label="Pre-exam instructions"]')
    if (await instrToggle.count() > 0) {
      await instrToggle.click()
      await page.waitForTimeout(500)
      await snap('settings-sheet-instructions-toggled')
      console.log('Instructions toggle clicked')
    } else {
      // Try finding first toggle in the pre-exam section
      const preExamSection = page.locator('text=Pre-exam setup').locator('..')
      const firstToggle = preExamSection.locator('[role="switch"]').first()
      if (await firstToggle.count() > 0) {
        await firstToggle.click()
        await page.waitForTimeout(500)
        await snap('settings-sheet-toggle-on')
        console.log('Toggled first pre-exam switch')
      }
    }
  } else {
    console.log('Settings sheet did NOT open — no [data-slot="sheet-content"] found')
    // Try any sheet
    const anySheet = page.locator('[role="dialog"]')
    const sheetVisible = await anySheet.count()
    console.log(`Any dialog/sheet: ${sheetVisible}`)
    await snap('settings-attempt-failed')
  }
} else {
  console.log('No Settings button found on page')
  const allButtons = await page.locator('button').allTextContents()
  console.log('All buttons:', JSON.stringify(allButtons.slice(0, 20)))
  await snap('no-settings-button')
}

console.log('\nConsole errors:', consoleErrors)
await browser.close()
