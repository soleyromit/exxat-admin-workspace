#!/usr/bin/env node
/**
 * visual-check/interactions — Playwright runner that drives real interactions
 * and captures state-transition screenshots + axe runs at each captured state.
 *
 * Closes the gap surfaced in docs/governance/verification-discipline.md
 * Pattern A discipline log entry 2026-05-11:
 *   "Claimed agents checked every page + every state when actually only
 *    static HTML + default-state screenshots were checked. Interaction
 *    states (hover, focus, open-dialog, validation-error, submission
 *    feedback, theme switch, responsive) were never exercised."
 *
 * Sibling to run.mjs (do NOT modify run.mjs — this is additive).
 *
 * Per route, this runner attempts the following interactions (best effort —
 * any failure is logged and the next interaction proceeds):
 *
 *   1. default                — full-page screenshot + axe (parity with run.mjs)
 *   2. focus-first-button     — Tab until focus lands on first button;
 *                               capture focus-ring rendering
 *   3. focus-first-input      — Tab until focus lands on first input
 *   4. focus-first-select     — Tab until focus lands on first select trigger
 *   5. focus-first-dropdown   — Tab until focus lands on first dropdown trigger
 *   6. open-dialog            — Click first Create/Add/New/Invite/Edit button;
 *                               wait for [data-slot="dialog-content"]
 *   7. dialog-validation      — Inside the open dialog, click primary submit
 *                               WITHOUT filling fields; capture form errors
 *   8. open-sheet             — Click first Share/Properties/Filter/Settings
 *                               button; wait for [data-slot="sheet-content"]
 *   9. open-dropdown          — Click first [data-slot="dropdown-menu-trigger"]
 *  10. command-palette        — Press Meta+K; capture command palette
 *  11. mobile-viewport        — Resize to 375x812 iPhone, re-screenshot default
 *  12. theme-toggle           — If a theme toggle exists, click it; capture
 *
 * Destructive controls (variant="destructive", text matches Delete|Remove)
 * are NEVER fired — only captured in default state.
 *
 * Usage:
 *
 *   # Run all PCE admin routes (default base = http://localhost:3005):
 *   node tools/visual-check/interactions.mjs
 *
 *   # Specific routes:
 *   node tools/visual-check/interactions.mjs /surveys /analytics
 *
 *   # Different base URL (e.g., exam-mgmt dev server on 3001):
 *   BASE_URL=http://localhost:3001 node tools/visual-check/interactions.mjs /question-bank
 *
 *   # JSON output (for subagent consumption):
 *   node tools/visual-check/interactions.mjs --json /surveys
 *
 * Output:
 *   - Screenshots:  /tmp/visual-check/interactions/<slug>.<interaction>.png
 *   - Axe results:  /tmp/visual-check/interactions/<slug>.<interaction>.axe.json
 *   - Console:      one summary line per route listing interactions captured
 *   - Exit code:    0 if no critical/serious a11y violations in any captured
 *                   state across any route; 1 otherwise
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3005'
const OUT_DIR = process.env.VISUAL_CHECK_OUT_DIR || '/tmp/visual-check/interactions'

// Per-interaction timeout cap (ms). Spec says 3000ms — keep it tight so a
// missing dialog doesn't stall the run.
const INTERACTION_TIMEOUT = 3000

// Default route set — mirrors run.mjs.
const DEFAULT_ROUTES = [
  '/',
  '/surveys',
  '/analytics',
  '/moderation',
  '/templates',
  '/my-surveys',
  '/admin',
  '/admin/accommodations',
  '/admin/competencies',
  '/admin/courses',
  '/admin/faculty',
  '/admin/students',
  '/admin/terms',
  '/admin/offerings',
  '/admin/standards',
  '/admin/content-areas',
  '/admin/assessment-types',
  '/admin/permissions',
]

// Trigger patterns (case-insensitive). Matched against button visible text.
const DIALOG_TRIGGER_PATTERN = /^(Create|Add|New|Invite|Edit)\b/i
const SHEET_TRIGGER_PATTERN = /^(Share|Properties|Filter|Settings)\b/i
const SUBMIT_PATTERN = /^(Create|Save|Add|Submit)\b/i
const DESTRUCTIVE_TEXT_PATTERN = /\b(Delete|Remove)\b/i

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const routes = (() => {
  const positional = args.filter(a => !a.startsWith('--'))
  return positional.length > 0 ? positional : DEFAULT_ROUTES
})()

function slugify(route) {
  return route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '__')
}

function summarizeViolations(violations) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  for (const v of violations) counts[v.impact || 'minor']++
  return counts
}

/**
 * Run axe inside the current page state. Returns { axePath, axeCounts, topFive }.
 * Failures are caught and reported in `error`.
 */
async function runAxe(page, outDir, slug, interaction) {
  const axePath = join(outDir, `${slug}.${interaction}.axe.json`)
  try {
    const axeResult = await new AxeBuilder({ page }).analyze()
    await writeFile(axePath, JSON.stringify(axeResult, null, 2))
    return {
      axePath,
      axeCounts: summarizeViolations(axeResult.violations),
      topFive: axeResult.violations.slice(0, 5).map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodeCount: v.nodes.length,
      })),
    }
  } catch (err) {
    return {
      axePath,
      axeCounts: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      topFive: [],
      error: err.message || String(err),
    }
  }
}

/**
 * Take a full-page screenshot, returning the path. Best effort — failures
 * are caught and surfaced.
 */
async function snap(page, outDir, slug, interaction, opts = {}) {
  const screenshot = join(outDir, `${slug}.${interaction}.png`)
  try {
    await page.screenshot({ path: screenshot, fullPage: opts.fullPage ?? true })
    return { screenshot }
  } catch (err) {
    return { screenshot, error: err.message || String(err) }
  }
}

/**
 * Capture one interaction (snapshot + axe). Returns an entry suitable for the
 * `interactions` array of the route result.
 */
async function captureState(page, outDir, slug, interaction, extra = {}) {
  const snapResult = await snap(page, outDir, slug, interaction, extra.snapOpts)
  const axeResult = await runAxe(page, outDir, slug, interaction)
  return {
    type: interaction,
    screenshot: snapResult.screenshot,
    axePath: axeResult.axePath,
    axeCounts: axeResult.axeCounts,
    axeViolationsTopFive: axeResult.topFive,
    ...(snapResult.error ? { snapshotError: snapResult.error } : {}),
    ...(axeResult.error ? { axeError: axeResult.error } : {}),
    ...extra.meta,
  }
}

/**
 * Try-wrap an interaction step so one failure doesn't kill the route.
 */
async function tryInteraction(label, fn) {
  try {
    return await fn()
  } catch (err) {
    return { type: label, skipped: true, reason: err.message || String(err) }
  }
}

/**
 * Step through focusable elements (Tab key) until focus matches `predicate`.
 * Caps at `maxTabs` to avoid infinite loops on long pages. Returns true if
 * matched, false if not.
 */
async function tabUntil(page, predicate, maxTabs = 60) {
  // Reset focus to the document body first so Tab starts from a known point.
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement !== document.body) {
      ;(document.activeElement).blur()
    }
  })
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab')
    const matched = await page.evaluate((sel) => {
      const el = document.activeElement
      if (!el) return false
      return el.matches(sel) || !!el.closest(sel)
    }, predicate)
    if (matched) return true
  }
  return false
}

/**
 * Best-effort click-by-text on the first DS Button matching `pattern`. Returns
 * { clicked: true, text } on success, { clicked: false, reason } on miss.
 * Excludes destructive controls.
 */
async function clickFirstButtonByText(page, pattern) {
  const buttons = page.locator('[data-slot="button"], button').filter({ hasText: pattern })
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i)
    const text = (await btn.innerText().catch(() => '')).trim()
    if (!text) continue
    if (DESTRUCTIVE_TEXT_PATTERN.test(text)) continue
    const variant = await btn.getAttribute('data-variant').catch(() => null)
    if (variant === 'destructive') continue
    const visible = await btn.isVisible().catch(() => false)
    if (!visible) continue
    const enabled = await btn.isEnabled().catch(() => false)
    if (!enabled) continue
    await btn.click({ timeout: INTERACTION_TIMEOUT })
    return { clicked: true, text }
  }
  return { clicked: false, reason: `no enabled non-destructive button matches ${pattern}` }
}

/**
 * Inside an open dialog, find the primary submit button and click it without
 * filling fields. Triggers validation rendering.
 */
async function clickDialogPrimarySubmit(page) {
  const submitBtns = page.locator('[data-slot="dialog-content"] [data-slot="button"]')
    .filter({ hasText: SUBMIT_PATTERN })
  const count = await submitBtns.count()
  for (let i = 0; i < count; i++) {
    const btn = submitBtns.nth(i)
    const text = (await btn.innerText().catch(() => '')).trim()
    if (DESTRUCTIVE_TEXT_PATTERN.test(text)) continue
    const variant = await btn.getAttribute('data-variant').catch(() => null)
    // Prefer the non-outline (primary) one — DS convention.
    if (variant === 'outline' || variant === 'ghost') continue
    const visible = await btn.isVisible().catch(() => false)
    if (!visible) continue
    await btn.click({ timeout: INTERACTION_TIMEOUT })
    return { clicked: true, text }
  }
  // Fall back to first matching submit button regardless of variant.
  if (count > 0) {
    const btn = submitBtns.first()
    const text = (await btn.innerText().catch(() => '')).trim()
    await btn.click({ timeout: INTERACTION_TIMEOUT })
    return { clicked: true, text }
  }
  return { clicked: false, reason: 'no submit button found in dialog' }
}

// ── WCAG 1.4.10 Reflow — 400% zoom (320px viewport width) ──────────────────
async function testReflow(page, route) {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto(route)
  await page.waitForLoadState('networkidle')

  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })

  const screenshotPath = `tools/visual-check/screenshots/reflow-${route.replace(/\//g, '-')}.png`
  await page.screenshot({ path: screenshotPath, fullPage: false })

  return {
    route,
    test: 'WCAG 1.4.10 Reflow (320px)',
    pass: !hasHorizontalScroll,
    violation: hasHorizontalScroll
      ? 'Horizontal scrollbar present at 320px viewport — reflow failure. Consequence: fails VPAT certification, blocks enterprise procurement.'
      : null,
    screenshot: screenshotPath,
  }
}

// ── WCAG 1.4.12 Text Spacing ────────────────────────────────────────────────
async function testTextSpacing(page, route) {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(route)
  await page.waitForLoadState('networkidle')

  await page.addStyleTag({
    content: `
      * {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      p { margin-bottom: 2em !important; }
    `,
  })

  await page.waitForTimeout(300)

  const clippedElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*')
    const clipped = []
    for (const el of elements) {
      const style = getComputedStyle(el)
      if (style.overflow === 'hidden' && el.scrollHeight > el.clientHeight) {
        clipped.push(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''))
      }
    }
    return clipped.slice(0, 10)
  })

  const screenshotPath = `tools/visual-check/screenshots/text-spacing-${route.replace(/\//g, '-')}.png`
  await page.screenshot({ path: screenshotPath, fullPage: true })

  return {
    route,
    test: 'WCAG 1.4.12 Text Spacing',
    pass: clippedElements.length === 0,
    violation: clippedElements.length > 0
      ? `Content clipped under text-spacing overrides in: ${clippedElements.join(', ')}. Consequence: affects dyslexic users with OS-level spacing.`
      : null,
    screenshot: screenshotPath,
  }
}

async function checkRoute(page, route) {
  const url = `${BASE_URL}${route}`
  const slug = slugify(route)
  const result = {
    route,
    url,
    httpStatus: null,
    interactions: [],
    consoleErrors: [],
    error: null,
  }

  const consoleErrors = []
  const errListener = (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  }
  page.on('console', errListener)

  try {
    // Reset to desktop viewport in case the previous route left it on mobile.
    await page.setViewportSize({ width: 1440, height: 900 })

    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 })
    result.httpStatus = response?.status() ?? null
    if (!response || response.status() >= 400) {
      result.error = `HTTP ${result.httpStatus}`
      return result
    }
    await page.waitForTimeout(500)

    // ===== 1. Default capture =====
    result.interactions.push(await captureState(page, OUT_DIR, slug, 'default'))

    // ===== 2-5. Focus walks =====
    for (const [label, selector] of [
      ['focus-first-button', '[data-slot="button"]'],
      ['focus-first-input', '[data-slot="input"]'],
      ['focus-first-select', '[data-slot="select-trigger"]'],
      ['focus-first-dropdown', '[data-slot="dropdown-menu-trigger"]'],
    ]) {
      const entry = await tryInteraction(label, async () => {
        const found = await tabUntil(page, selector, 60)
        if (!found) {
          return { type: label, skipped: true, reason: `no ${selector} reached after 60 Tab presses` }
        }
        return captureState(page, OUT_DIR, slug, label, {
          // Focus state is best seen above-the-fold; not full-page.
          snapOpts: { fullPage: false },
          meta: { selector },
        })
      })
      result.interactions.push(entry)
      // Blur to reset for next focus walk.
      await page.evaluate(() => {
        if (document.activeElement && document.activeElement !== document.body) {
          ;(document.activeElement).blur()
        }
      }).catch(() => {})
    }

    // ===== 6. Open first dialog =====
    let dialogOpened = false
    let dialogTriggerText = null
    const dialogEntry = await tryInteraction('open-dialog', async () => {
      const click = await clickFirstButtonByText(page, DIALOG_TRIGGER_PATTERN)
      if (!click.clicked) {
        return { type: 'open-dialog', skipped: true, reason: click.reason }
      }
      // Wait for the dialog content to mount.
      try {
        await page.waitForSelector('[data-slot="dialog-content"]', {
          state: 'visible',
          timeout: INTERACTION_TIMEOUT,
        })
        dialogOpened = true
        dialogTriggerText = click.text
      } catch {
        // Not all Create/Add buttons open a dialog — some may navigate or open a sheet.
        // Check for sheet as a fallback.
        const sheetVisible = await page.locator('[data-slot="sheet-content"]').isVisible().catch(() => false)
        if (sheetVisible) {
          // Capture as a sheet-from-dialog-trigger.
          const entry = await captureState(page, OUT_DIR, slug, 'open-dialog', {
            meta: { triggerText: click.text, note: 'opened a sheet, not a dialog' },
          })
          // Press Escape to close before returning.
          await page.keyboard.press('Escape').catch(() => {})
          await page.waitForTimeout(200)
          return entry
        }
        return {
          type: 'open-dialog',
          skipped: true,
          reason: `clicked "${click.text}" but no dialog mounted within ${INTERACTION_TIMEOUT}ms`,
          triggerText: click.text,
        }
      }
      await page.waitForTimeout(300) // settle animation
      return captureState(page, OUT_DIR, slug, 'open-dialog', {
        meta: { triggerText: click.text },
      })
    })
    result.interactions.push(dialogEntry)

    // ===== 7. Dialog validation error (only if dialog opened) =====
    if (dialogOpened) {
      const validationEntry = await tryInteraction('dialog-validation', async () => {
        const click = await clickDialogPrimarySubmit(page)
        if (!click.clicked) {
          return { type: 'dialog-validation', skipped: true, reason: click.reason }
        }
        await page.waitForTimeout(400) // let aria-invalid + error messages render
        return captureState(page, OUT_DIR, slug, 'dialog-validation', {
          meta: { submitText: click.text, dialogTriggerText },
        })
      })
      result.interactions.push(validationEntry)
      // Close the dialog.
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(300)
    }

    // ===== 8. Open first sheet =====
    const sheetEntry = await tryInteraction('open-sheet', async () => {
      const click = await clickFirstButtonByText(page, SHEET_TRIGGER_PATTERN)
      if (!click.clicked) {
        return { type: 'open-sheet', skipped: true, reason: click.reason }
      }
      try {
        await page.waitForSelector('[data-slot="sheet-content"]', {
          state: 'visible',
          timeout: INTERACTION_TIMEOUT,
        })
      } catch {
        return {
          type: 'open-sheet',
          skipped: true,
          reason: `clicked "${click.text}" but no sheet mounted within ${INTERACTION_TIMEOUT}ms`,
          triggerText: click.text,
        }
      }
      await page.waitForTimeout(300)
      const entry = await captureState(page, OUT_DIR, slug, 'open-sheet', {
        meta: { triggerText: click.text },
      })
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(300)
      return entry
    })
    result.interactions.push(sheetEntry)

    // ===== 9. Open first dropdown =====
    const dropdownEntry = await tryInteraction('open-dropdown', async () => {
      const triggers = page.locator('[data-slot="dropdown-menu-trigger"]')
      const count = await triggers.count()
      if (count === 0) {
        return { type: 'open-dropdown', skipped: true, reason: 'no [data-slot="dropdown-menu-trigger"] on page' }
      }
      // Find first visible enabled trigger.
      let clickedIdx = -1
      for (let i = 0; i < count; i++) {
        const t = triggers.nth(i)
        const visible = await t.isVisible().catch(() => false)
        const enabled = await t.isEnabled().catch(() => false)
        if (visible && enabled) {
          await t.click({ timeout: INTERACTION_TIMEOUT })
          clickedIdx = i
          break
        }
      }
      if (clickedIdx < 0) {
        return { type: 'open-dropdown', skipped: true, reason: 'no visible+enabled dropdown trigger' }
      }
      try {
        await page.waitForSelector('[data-slot="dropdown-menu-content"]', {
          state: 'visible',
          timeout: INTERACTION_TIMEOUT,
        })
      } catch {
        return {
          type: 'open-dropdown',
          skipped: true,
          reason: `clicked trigger #${clickedIdx} but no menu mounted within ${INTERACTION_TIMEOUT}ms`,
        }
      }
      await page.waitForTimeout(200)
      const entry = await captureState(page, OUT_DIR, slug, 'open-dropdown', {
        snapOpts: { fullPage: false },
        meta: { triggerIndex: clickedIdx },
      })
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(200)
      return entry
    })
    result.interactions.push(dropdownEntry)

    // ===== 10. Command palette (⌘K) =====
    const cmdEntry = await tryInteraction('command-palette', async () => {
      // Use Meta+K (macOS-friendly); Playwright also accepts ControlOrMeta.
      await page.keyboard.press('ControlOrMeta+KeyK').catch(() => {})
      try {
        await page.waitForSelector('[data-slot="command-input"]', {
          state: 'visible',
          timeout: INTERACTION_TIMEOUT,
        })
      } catch {
        return { type: 'command-palette', skipped: true, reason: 'no [data-slot="command-input"] mounted after ⌘K' }
      }
      await page.waitForTimeout(200)
      const entry = await captureState(page, OUT_DIR, slug, 'command-palette', {
        snapOpts: { fullPage: false },
      })
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(200)
      return entry
    })
    result.interactions.push(cmdEntry)

    // ===== 11. Mobile viewport =====
    const mobileEntry = await tryInteraction('mobile-viewport', async () => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.waitForTimeout(400) // let responsive layout settle
      const entry = await captureState(page, OUT_DIR, slug, 'mobile-viewport', {
        meta: { viewport: { width: 375, height: 812 } },
      })
      // Restore desktop viewport for any subsequent steps + next route.
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.waitForTimeout(300)
      return entry
    })
    result.interactions.push(mobileEntry)

    // ===== 12. Theme toggle =====
    const themeEntry = await tryInteraction('theme-toggle', async () => {
      const toggle = page.locator(
        '[aria-label="Theme"], [aria-label="Toggle theme"], [aria-label="Toggle Theme"]'
      ).first()
      const visible = await toggle.isVisible().catch(() => false)
      if (!visible) {
        return { type: 'theme-toggle', skipped: true, reason: 'no aria-label="Theme"/"Toggle theme" element on page' }
      }
      await toggle.click({ timeout: INTERACTION_TIMEOUT })
      await page.waitForTimeout(400)
      return captureState(page, OUT_DIR, slug, 'theme-toggle')
    })
    result.interactions.push(themeEntry)

    // ===== 13. WCAG 1.4.10 Reflow (320px) =====
    const reflowEntry = await tryInteraction('reflow-320px', async () => {
      const r = await testReflow(page, url)
      // Restore desktop viewport for subsequent steps + next route.
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.waitForTimeout(300)
      return {
        type: 'reflow-320px',
        screenshot: r.screenshot,
        pass: r.pass,
        ...(r.violation ? { violation: r.violation } : {}),
      }
    })
    result.interactions.push(reflowEntry)

    // ===== 14. WCAG 1.4.12 Text Spacing =====
    const spacingEntry = await tryInteraction('text-spacing', async () => {
      const r = await testTextSpacing(page, url)
      return {
        type: 'text-spacing',
        screenshot: r.screenshot,
        pass: r.pass,
        ...(r.violation ? { violation: r.violation } : {}),
      }
    })
    result.interactions.push(spacingEntry)
  } catch (err) {
    result.error = err.message || String(err)
  } finally {
    page.off('console', errListener)
    result.consoleErrors = consoleErrors.slice(0, 10)
  }
  return result
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true })

  let browser
  try {
    browser = await chromium.launch()
  } catch (err) {
    console.error('visual-check/interactions: failed to launch Chromium.')
    console.error('If this is the first run, install chromium:')
    console.error('  cd tools/visual-check && pnpm install:chromium')
    console.error(`Original error: ${err.message || err}`)
    process.exit(2)
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  // Detect dev-server-down up front by probing the base URL.
  try {
    const probe = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 5_000 })
    if (!probe) {
      console.error(`visual-check/interactions: dev server at ${BASE_URL} returned no response.`)
      console.error('Start it: cd apps/pce/admin && pnpm dev')
      await browser.close()
      process.exit(2)
    }
  } catch (err) {
    console.error(`visual-check/interactions: cannot reach ${BASE_URL} — ${err.message || err}`)
    console.error('Start the dev server first:')
    console.error('  cd apps/pce/admin && pnpm dev          # → http://localhost:3005')
    console.error('  cd apps/exam-management/admin && pnpm dev  # → http://localhost:3001')
    await browser.close()
    process.exit(2)
  }

  const results = []
  for (const route of routes) {
    const r = await checkRoute(page, route)
    results.push(r)
    if (!jsonMode) {
      const captured = r.interactions.filter(i => !i.skipped).length
      const skipped = r.interactions.filter(i => i.skipped).length
      const totalAxe = r.interactions.reduce((acc, i) => ({
        critical: acc.critical + (i.axeCounts?.critical || 0),
        serious: acc.serious + (i.axeCounts?.serious || 0),
      }), { critical: 0, serious: 0 })
      const errLine = r.error ? ` error=${r.error}` : ''
      const consoleLine = r.consoleErrors.length > 0 ? ` · ${r.consoleErrors.length} console errors` : ''
      console.log(
        `  ${r.route.padEnd(32)} ${(r.httpStatus ?? '???').toString().padEnd(4)} ` +
        `captured=${captured} skipped=${skipped} ` +
        `axe-critical=${totalAxe.critical} axe-serious=${totalAxe.serious}${errLine}${consoleLine}`
      )
    }
  }

  await browser.close()

  if (jsonMode) {
    console.log(JSON.stringify({ baseUrl: BASE_URL, outDir: OUT_DIR, results }, null, 2))
  } else {
    const totals = results.reduce((acc, r) => {
      for (const i of r.interactions) {
        if (i.skipped) acc.skipped++
        else acc.captured++
        acc.critical += i.axeCounts?.critical || 0
        acc.serious += i.axeCounts?.serious || 0
      }
      if (r.error) acc.errors++
      return acc
    }, { captured: 0, skipped: 0, critical: 0, serious: 0, errors: 0 })
    console.log(
      `\nTotals: ${totals.captured} interactions captured · ${totals.skipped} skipped · ` +
      `${totals.critical} critical + ${totals.serious} serious a11y violations across ` +
      `${results.length} routes (${totals.errors} routes errored)`
    )
    console.log(`Output: ${OUT_DIR}`)
  }

  // Exit 1 if any critical/serious a11y violations were captured in ANY state
  // across ANY route — interaction states surface bugs default state misses.
  const failed = results.some(r =>
    r.error ||
    r.interactions.some(i => (i.axeCounts?.critical || 0) > 0 || (i.axeCounts?.serious || 0) > 0)
  )
  process.exit(failed ? 1 : 0)
}

main().catch(err => {
  console.error('visual-check/interactions fatal error:', err)
  process.exit(2)
})
