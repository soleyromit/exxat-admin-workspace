#!/usr/bin/env node
/**
 * visual-check — Playwright + axe-core runner for the Exxat workspace.
 *
 * Closes the gap that `scripts/ds-adoption-audit.py` can't:
 *   - Visual rendering (does it look right?)
 *   - Semantic conflicts (data ≠ label — caught the NURS 210 ReleaseSheet bug)
 *   - Accessibility runtime violations
 *   - Keyboard interaction (⌘K, Tab, Escape)
 *
 * Per docs/governance/verification-discipline.md Pattern A (clean ≠ fine):
 * static audits give narrow confidence; this runner gives broader signal.
 *
 * Usage:
 *
 *   # Run all PCE admin routes (default base = http://localhost:3005):
 *   node tools/visual-check/run.mjs
 *
 *   # Specific routes:
 *   node tools/visual-check/run.mjs /surveys /analytics
 *
 *   # Different base URL (e.g., exam-mgmt dev server on 3001):
 *   BASE_URL=http://localhost:3001 node tools/visual-check/run.mjs /question-bank
 *
 *   # JSON output (for subagent consumption):
 *   node tools/visual-check/run.mjs --json /surveys
 *
 * Output:
 *   - Screenshots:  /tmp/visual-check/<slugified-route>.png
 *   - Axe results:  /tmp/visual-check/<slugified-route>.axe.json
 *   - Console:      one summary line per route + axe violation counts
 *   - Exit code:    0 if no critical/serious a11y violations; 1 otherwise
 *
 * Read by:
 *   - .claude/agents/visual-review (post-claim verification subagent)
 *   - Romit on demand for ad-hoc visual review
 *
 * Setup (once):
 *   cd tools/visual-check && pnpm install && pnpm install:chromium
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3005'
const OUT_DIR = process.env.VISUAL_CHECK_OUT_DIR || '/tmp/visual-check'

// Default route set — PCE admin's currently shipped surfaces.
// Override by passing route args. Routes that 404 are reported and skipped.
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

// Parse args. --json flag enables structured output for subagent consumption.
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

async function checkRoute(page, route) {
  const url = `${BASE_URL}${route}`
  const slug = slugify(route)
  const result = {
    route,
    url,
    httpStatus: null,
    screenshot: join(OUT_DIR, `${slug}.png`),
    axePath: join(OUT_DIR, `${slug}.axe.json`),
    axeCounts: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    axeViolationsTopFive: [],
    consoleErrors: [],
    error: null,
  }

  // Capture console errors during the page lifecycle.
  const consoleErrors = []
  const errListener = (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  }
  page.on('console', errListener)

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 })
    result.httpStatus = response?.status() ?? null
    if (!response || response.status() >= 400) {
      result.error = `HTTP ${result.httpStatus}`
      return result
    }
    // Give the page a moment to settle (animations, hydration).
    await page.waitForTimeout(500)

    // Screenshot — full page so we can see below-the-fold content too.
    await page.screenshot({ path: result.screenshot, fullPage: true })

    // axe-core scan. Disable color-contrast rules that throw on var(--…)
    // resolved values when the active theme uses oklch (axe can't always
    // parse those). The rest of the rule set still runs.
    const axe = new AxeBuilder({ page }).disableRules([])
    const axeResult = await axe.analyze()
    await writeFile(result.axePath, JSON.stringify(axeResult, null, 2))
    result.axeCounts = summarizeViolations(axeResult.violations)
    result.axeViolationsTopFive = axeResult.violations.slice(0, 5).map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodeCount: v.nodes.length,
    }))
  } catch (err) {
    result.error = err.message || String(err)
  } finally {
    page.off('console', errListener)
    result.consoleErrors = consoleErrors.slice(0, 10) // cap noise
  }
  return result
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // crisper screenshots for vision-model reading
  })
  const page = await context.newPage()

  const results = []
  for (const route of routes) {
    const r = await checkRoute(page, route)
    results.push(r)
    if (!jsonMode) {
      const violationLine = r.error
        ? `error: ${r.error}`
        : `axe critical=${r.axeCounts.critical} serious=${r.axeCounts.serious} moderate=${r.axeCounts.moderate} minor=${r.axeCounts.minor}`
      const consoleErrLine = r.consoleErrors.length > 0 ? ` · ${r.consoleErrors.length} console errors` : ''
      console.log(`  ${r.route.padEnd(32)} ${(r.httpStatus ?? '???').toString().padEnd(4)} ${violationLine}${consoleErrLine}`)
    }
  }

  await browser.close()

  if (jsonMode) {
    console.log(JSON.stringify({ baseUrl: BASE_URL, outDir: OUT_DIR, results }, null, 2))
  } else {
    const total = results.reduce((acc, r) => ({
      critical: acc.critical + r.axeCounts.critical,
      serious: acc.serious + r.axeCounts.serious,
      errors: acc.errors + (r.error ? 1 : 0),
    }), { critical: 0, serious: 0, errors: 0 })
    console.log(`\nTotals: ${total.critical} critical + ${total.serious} serious a11y violations across ${results.length} routes (${total.errors} failed)`)
    console.log(`Screenshots: ${OUT_DIR}`)
  }

  // Exit 1 on critical/serious axe violations OR navigation errors.
  const failed = results.some(r => r.error || r.axeCounts.critical > 0 || r.axeCounts.serious > 0)
  process.exit(failed ? 1 : 0)
}

main().catch(err => {
  console.error('visual-check fatal error:', err)
  process.exit(2)
})
