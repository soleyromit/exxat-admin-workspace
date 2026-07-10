#!/usr/bin/env node
/**
 * audit-all — Live WCAG + axe-core sweep across ALL apps + ALL routes.
 *
 * Shows a live terminal dashboard that updates route-by-route as each page is
 * checked. Covers PCE admin (3005), EM admin (3001), and EM assessment-taker (5174).
 *
 * Usage:
 *   node tools/visual-check/audit-all.mjs
 *   node tools/visual-check/audit-all.mjs --json          # structured output
 *   node tools/visual-check/audit-all.mjs --app pce       # single app
 *   node tools/visual-check/audit-all.mjs --app em        # single app
 *   node tools/visual-check/audit-all.mjs --app ems       # student exam-taker only
 *
 * Output:
 *   - Live status lines as each route completes
 *   - Screenshots: /tmp/audit-all/<app>/<slug>.png
 *   - Axe JSON:    /tmp/audit-all/<app>/<slug>.axe.json
 *   - Final summary table: per-app violation counts
 *   - Exit code: 0 = clean; 1 = critical/serious violations found
 *
 * Requires: node tools/visual-check $ pnpm install (done once for run.mjs)
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const OUT_BASE = '/tmp/audit-all'

// ── Route registries ────────────────────────────────────────────────────────

const PCE_ROUTES = [
  // Hub pages
  '/',
  '/surveys',
  '/surveys/push',
  '/surveys/run-evaluation',
  '/surveys/programmatic',
  '/surveys/programmatic/push',
  '/surveys/otr1',           // survey detail
  '/analytics',
  '/moderation',
  '/my-surveys',
  '/my-surveys/otr1/results',
  '/programmatic-surveys',
  '/templates',
  '/templates/new',
  '/templates/tmpl1',        // template builder
  '/templates/programmatic',
  // Admin entity pages
  '/admin',
  '/admin/accommodations',
  '/admin/assessment-types',
  '/admin/competencies',
  '/admin/content-areas',
  '/admin/courses',
  '/admin/faculty',
  '/admin/offerings',
  '/admin/permissions',
  '/admin/standards',
  '/admin/students',
  '/admin/terms',
]

const EM_ROUTES = [
  // Hub
  '/',
  '/assessment-builder',
  '/question-bank',
  '/course-catalog',
  // Entity pages
  '/courses',
  '/courses/course-phar101',   // course detail
  '/courses/offerings/co-001', // offering detail
  '/faculty',
  '/faculty/fac-001',          // faculty detail
  '/students',
  '/students/stu-001',         // student detail
  '/questions/q-001',          // question detail
  '/questions/q-001/edit',
  '/questions/new',
  '/competency',
  '/access',
  '/accommodations',
  '/settings',
  '/terms',
]

const EMS_ROUTES = [
  '/',
  '/exam/exam-active-001/setup',     // pre-exam flow
  '/exam/exam-active-001/take',      // exam engine (full-screen)
  '/exam/exam-active-001/submitted', // post-submission
  '/exam/exam-active-001/results',   // results + competency breakdown
  '/exam/exam-active-001/review',    // scheduled review (lockdown)
  '/exam/exam-active-001/chat',      // faculty Q&A chat
  '/competency',
  '/history',
  '/resources',
  '/settings',
  '/help',
]

const APPS = {
  pce: { label: 'PCE Admin',        port: 3005, routes: PCE_ROUTES },
  em:  { label: 'EM Admin',         port: 3001, routes: EM_ROUTES  },
  ems: { label: 'EM Student Taker', port: 5174, routes: EMS_ROUTES },
}

// ── CLI flags ────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const jsonMode = argv.includes('--json')
const appFilter = argv.includes('--app') ? argv[argv.indexOf('--app') + 1] : null
const appsToRun = appFilter ? { [appFilter]: APPS[appFilter] } : APPS

if (appFilter && !APPS[appFilter]) {
  console.error(`Unknown app: "${appFilter}". Available: ${Object.keys(APPS).join(', ')}`)
  process.exit(2)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(route) {
  return route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '__')
}

function summarize(violations) {
  const c = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  for (const v of violations) c[v.impact || 'minor']++
  return c
}

function statusIcon(result) {
  if (result.error) return '💥'
  const { critical, serious } = result.axeCounts
  if (critical > 0) return '🔴'
  if (serious > 0) return '🟠'
  if (result.axeCounts.moderate > 0) return '🟡'
  return '✅'
}

function padR(str, n) { return String(str).padEnd(n) }
function padL(str, n) { return String(str).padStart(n) }

// ── Per-route check ──────────────────────────────────────────────────────────

async function checkRoute(page, baseUrl, route, outDir) {
  const url = `${baseUrl}${route}`
  const slug = slugify(route)
  const result = {
    route, url,
    httpStatus: null,
    screenshot: join(outDir, `${slug}.png`),
    axePath: join(outDir, `${slug}.axe.json`),
    axeCounts: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    axeViolations: [],
    consoleErrors: [],
    error: null,
  }

  const consoleErrors = []
  const onErr = (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) }
  page.on('console', onErr)

  try {
    // domcontentloaded avoids blocking on external CDN assets (Font Awesome kit,
    // Adobe Fonts) that can hang indefinitely in headless mode.
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 })
    // Let React hydrate and CSS tokens resolve before screenshot + axe
    await page.waitForTimeout(2500)
    result.httpStatus = response?.status() ?? null
    if (!response || response.status() >= 400) {
      result.error = `HTTP ${result.httpStatus}`
      return result
    }
    await page.screenshot({ path: result.screenshot, fullPage: true })
    const axeResult = await new AxeBuilder({ page }).analyze()
    await writeFile(result.axePath, JSON.stringify(axeResult, null, 2))
    result.axeCounts = summarize(axeResult.violations)
    result.axeViolations = axeResult.violations.map(v => ({
      id: v.id, impact: v.impact, help: v.help, nodeCount: v.nodes.length,
    }))
  } catch (err) {
    result.error = err.message || String(err)
  } finally {
    page.off('console', onErr)
    result.consoleErrors = consoleErrors.slice(0, 5)
  }
  return result
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(OUT_BASE, { recursive: true })

  const browser = await chromium.launch()
  const allResults = {}
  let totalCritical = 0, totalSerious = 0, totalErrors = 0, totalRoutes = 0

  for (const [appKey, app] of Object.entries(appsToRun)) {
    const outDir = join(OUT_BASE, appKey)
    await mkdir(outDir, { recursive: true })

    const baseUrl = `http://localhost:${app.port}`
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
    const page = await context.newPage()

    if (!jsonMode) {
      console.log(`\n${'─'.repeat(72)}`)
      console.log(`  ${app.label.toUpperCase()}  ·  ${baseUrl}`)
      console.log(`${'─'.repeat(72)}`)
      console.log(`  ${'Route'.padEnd(36)} ${'HTTP'.padEnd(5)} ${'Axe'.padEnd(18)} Status`)
      console.log(`${'─'.repeat(72)}`)
    }

    const appResults = []
    for (const route of app.routes) {
      const r = await checkRoute(page, baseUrl, route, outDir)
      appResults.push(r)

      if (!jsonMode) {
        const axeLine = r.error
          ? `error: ${r.error.slice(0, 28)}`
          : `crit=${r.axeCounts.critical} ser=${r.axeCounts.serious} mod=${r.axeCounts.moderate} min=${r.axeCounts.minor}`
        const icon = statusIcon(r)
        const httpStr = r.httpStatus ? String(r.httpStatus) : '???'
        console.log(`  ${icon} ${padR(route, 34)} ${padR(httpStr, 5)} ${padR(axeLine, 18)}`)

        // Print top violations inline for immediate feedback
        if (r.axeViolations.length > 0) {
          for (const v of r.axeViolations.slice(0, 3)) {
            console.log(`      ↳ [${v.impact}] ${v.id}: ${v.help} (${v.nodeCount} node${v.nodeCount !== 1 ? 's' : ''})`)
          }
        }
        if (r.consoleErrors.length > 0) {
          console.log(`      ↳ console: ${r.consoleErrors[0].slice(0, 80)}`)
        }
      }

      totalCritical += r.axeCounts.critical
      totalSerious  += r.axeCounts.serious
      if (r.error) totalErrors++
      totalRoutes++
    }

    allResults[appKey] = appResults
    await context.close()
  }

  await browser.close()

  if (jsonMode) {
    console.log(JSON.stringify({ outDir: OUT_BASE, apps: allResults }, null, 2))
  } else {
    console.log(`\n${'─'.repeat(72)}`)
    console.log(`  SUMMARY`)
    console.log(`${'─'.repeat(72)}`)
    console.log(`  Routes checked : ${totalRoutes}`)
    console.log(`  🔴 Critical    : ${totalCritical}`)
    console.log(`  🟠 Serious     : ${totalSerious}`)
    console.log(`  💥 Nav errors  : ${totalErrors}`)
    console.log(`\n  Screenshots + axe JSON → ${OUT_BASE}`)
    console.log(`${'─'.repeat(72)}\n`)
  }

  const failed = totalCritical > 0 || totalSerious > 0 || totalErrors > 0
  process.exit(failed ? 1 : 0)
}

main().catch(err => {
  console.error('audit-all fatal error:', err)
  process.exit(2)
})
