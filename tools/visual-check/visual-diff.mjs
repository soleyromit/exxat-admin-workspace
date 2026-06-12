#!/usr/bin/env node
/**
 * ds visual-diff — does a rendered PRODUCT surface match the DS at localhost:4000?
 *
 * The gap this closes: nothing else actually compares a product screen to the
 * live DS. ds-conformance.mjs checks a few things vs static globals.css; the
 * reviewers eyeball localhost:4000 by hand. This makes it a MEASUREMENT.
 *
 * How: localhost:4000 (the live DS) + globals.css radius tokens define the
 * legitimate VALUE VOCABULARY for each THEME-INDEPENDENT DS property — the
 * finite palette of radii, shadow geometries, font stacks, and font sizes the
 * DS actually uses. We render the product route and flag every computed value
 * NOT in that vocabulary: off-scale radius, hand-rolled shadow, leaked font,
 * sub-12px text — all surface deterministically.
 *
 * Color is deliberately NOT audited: the product runs a brand theme (e.g. prism
 * pink) while the DS viewer runs neutral, so colors legitimately differ. That's
 * the job of the "no hardcoded hex / use var(--token)" rule, not a cross-theme
 * pixel diff. Shadow COLOR is normalized out; only the geometry is compared.
 *
 * Usage:
 *   BASE_URL=http://localhost:3001 node tools/visual-check/visual-diff.mjs "/route?x=1"
 *   DS_URL defaults to http://localhost:4000
 *   DS_ROUTES (comma-sep) overrides the reference routes crawled for vocabulary
 *
 * Exit 0 = within the DS vocabulary, 1 = deviations, 2 = could not run.
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const DS_URL = process.env.DS_URL || 'http://localhost:4000'
const route = process.argv[2] || '/'
const DS_ROUTES = (process.env.DS_ROUTES ||
  '/dashboard,/data-list,/question-bank,/settings,/examples,/library/button,/library/data-table,/library/badge,/library/card')
  .split(',').map((s) => s.trim()).filter(Boolean)
const GLOBALS = process.env.DS_CSS ||
  '/Users/romitsoley/Work/apps/exam-management/admin/node_modules/@exxatdesignux/ui/src/globals.css'

// THEME-INDEPENDENT properties only — a diff against the DS is meaningful.
const PROPS = ['borderRadius', 'boxShadow', 'fontFamily', 'fontSize']

// ── In-page collector: normalized computed values for every visible element ────
const COLLECT = (props) => {
  // strip color functions so shadow GEOMETRY is compared, not its themed color
  const stripColor = (s) => s
    .replace(/(?:oklch|oklab|rgba?|lab|lch|hsla?|color|hwb)\([^)]*\)/g, '·')
    .replace(/\s+/g, ' ').trim()
  const vocab = Object.fromEntries(props.map((p) => [p, {}]))
  let scanned = 0
  for (const el of document.querySelectorAll('*')) {
    if (scanned > 6000) break
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    scanned++
    const tag = el.tagName.toLowerCase()
    const cls = (typeof el.className === 'string' ? el.className : '').slice(0, 56)
    const where = tag + (cls ? '.' + cls.trim().replace(/\s+/g, '.') : '')
    for (const p of props) {
      let v = cs[p]
      if (!v) continue
      if (p === 'boxShadow') v = stripColor(v)
      else if (p === 'fontFamily') v = v.toLowerCase().replace(/["']/g, '').trim()
      else if (p === 'fontSize' || p === 'borderRadius') v = v.replace(/(\d+\.\d)\d+px/g, '$1px')
      ;(vocab[p][v] ||= { count: 0, sample: where }).count++
    }
  }
  return { vocab, scanned }
}

async function collect(page, base, path) {
  await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2500)
  return page.evaluate(COLLECT, PROPS)
}

// ── Seed radius vocabulary from globals.css tokens (rem→px so it matches) ───────
function seedRadii() {
  const radii = new Set(['0px', '9999px', '50%'])
  try {
    const css = readFileSync(GLOBALS, 'utf8')
    const val = (n) => (css.match(new RegExp(`${n}\\s*:\\s*([^;]+);`)) || [])[1]?.trim()
    for (const r of ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-2xl', '--radius-3xl', '--radius-4xl', '--radius']) {
      const v = val(r); if (!v) continue
      const m = v.match(/^([\d.]+)rem$/); if (m) radii.add(`${Math.round(parseFloat(m[1]) * 16)}px`)
      else if (/^[\d.]+px$/.test(v)) radii.add(v)
    }
  } catch { /* no globals.css — rely on the live crawl */ }
  return radii
}

const b = await chromium.launch({ headless: true })
const page = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()

// 1) Reference vocabulary from the live DS (+ radius token seed)
const DS = Object.fromEntries(PROPS.map((p) => [p, new Set()]))
for (const v of seedRadii()) DS.borderRadius.add(v)

let dsRoutesOk = 0
for (const r of DS_ROUTES) {
  try {
    const { vocab } = await collect(page, DS_URL, r)
    for (const p of PROPS) for (const v of Object.keys(vocab[p])) DS[p].add(v)
    dsRoutesOk++
  } catch { /* route may not exist on this DS build — skip */ }
}
if (dsRoutesOk === 0) {
  console.error(`\n✗ Could not reach the DS at ${DS_URL} on any reference route.`)
  console.error(`  Start it (Exxat-DS-Workspace/apps/docs on :4000) or pass DS_ROUTES. Aborting.`)
  await b.close(); process.exit(2)
}

// 2) Audit the product surface against the vocabulary
let prod
try {
  prod = await collect(page, BASE, route)
} catch (e) {
  console.error(`\n✗ Could not render product route ${BASE}${route}: ${e.message}`)
  await b.close(); process.exit(2)
}
await b.close()

// 3) Report deviations: product values not in the DS vocabulary
const report = {}
for (const p of PROPS) {
  for (const [v, info] of Object.entries(prod.vocab[p])) {
    if (DS[p].has(v)) continue
    if (p === 'boxShadow' && (v === 'none' || v === '·')) continue
    ;(report[p] ||= []).push({ value: v, ...info })
  }
}

console.log(`\nDS visual-diff — ${BASE}${route}`)
console.log(`reference: ${DS_URL} (${dsRoutesOk}/${DS_ROUTES.length} routes) + radius tokens · theme-independent props only`)
console.log(`scanned ${prod.scanned} product elements\n`)

let total = 0
console.log('── DEVIATIONS (product values the DS never uses) ──')
for (const p of PROPS) {
  const rows = (report[p] || []).sort((a, c) => c.count - a.count)
  total += rows.length
  if (!rows.length) continue
  console.log(`  ${p}  — ${rows.length} off-DS value(s):`)
  for (const r of rows.slice(0, 8)) console.log(`     ✗ ${r.value}   ×${r.count}   e.g. <${r.sample}>`)
  if (rows.length > 8) console.log(`     … +${rows.length - 8} more`)
}
if (total === 0) console.log('  ✓ DS-MATCH — radii, shadows, fonts, and sizes are all in the DS vocabulary')

console.log(`\nresult: ${total} deviation(s) — each is a value the DS never uses; fix to the nearest DS token.`)

// Marker so the Stop hook (ds-claim-gate.py) can prove a real localhost:4000
// visual diff ran this turn — token checks can't be passed off as DS-match.
try {
  mkdirSync('.claude/state', { recursive: true })
  writeFileSync('.claude/state/last-visual-diff.json', JSON.stringify({
    ts: new Date().toISOString(),
    base: BASE, dsUrl: DS_URL, route,
    dsRoutesOk, scanned: prod.scanned, deviations: total,
    result: total === 0 ? 'DS-MATCH' : 'DEVIATIONS',
  }, null, 2))
} catch { /* marker is best-effort; never fail the diff over it */ }

process.exit(total > 0 ? 1 : 0)
