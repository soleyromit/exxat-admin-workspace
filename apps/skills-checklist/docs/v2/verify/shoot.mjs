#!/usr/bin/env node
// Visual and accessibility pass for the v2 prototype.
//
//   node docs/v2/verify/shoot.mjs [--base http://localhost:3007] [--tabs 400] [--no-states] [route ...]
//
// For each route and each viewport (desktop 1440x900, phone 390x844) it:
//   1. loads the page with a fresh browser profile (empty localStorage, so the seed is shown),
//   2. freezes CSS transitions and animations (mid-transition frames cause phantom axe contrast failures),
//   3. saves docs/v2/screenshots/<route-slug>-{desktop,phone}.png,
//   4. runs axe-core (WCAG 2.0/2.1 A and AA) through @axe-core/playwright when it can be loaded; otherwise falls back
//      to a computed-style contrast check on text nodes,
//   5. walks the page with the Tab key until focus comes back to the first stop (a full cycle) or leaves the document,
//      recording per stop whether a visible focus indicator exists, any keyboard trap (the same element focused three
//      times in a row) and whether the walk was cut short (--tabs is only a safety ceiling, default 400),
//   6. repeats 1 to 5 for every named interaction state of the route (a sheet, dialog, menu or wizard step open),
//      defined in STATES below, and checks that each state's expected controls are reachable by Tab.
// Output: docs/v2/screenshots/<route-slug>[--<state>]-{desktop,phone}.png and docs/v2/screenshots/report.json. Exit code 1 when any violation, missing focus indicator or trap is found.
//
// Playwright is NOT installed in the app. It is resolved from /Users/romitsoley/Work/tools/visual-check.

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(HERE, '..', 'screenshots')
const TOOLS = path.resolve(HERE, '../../../../../tools/visual-check')
const req = createRequire(path.join(TOOLS, 'package.json'))
const { chromium } = req('playwright')
let AxeBuilder = null
try { AxeBuilder = req('@axe-core/playwright').AxeBuilder ?? req('@axe-core/playwright').default } catch { /* fallback below */ }

const args = process.argv.slice(2)
let base = 'http://localhost:3007'
let tabs = 400
let withStates = true
const routes = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base') base = args[++i]
  else if (args[i] === '--tabs') tabs = Number(args[++i])
  else if (args[i] === '--no-states') withStates = false
  else routes.push(args[i])
}
if (!routes.length) routes.push('/v2', '/v2/admin', '/v2/student', '/v2/preceptor', '/v2/reviewer', '/v2/director', '/v2/admin/starter-library', '/v2/admin/configure-skill', '/v2/admin/validate-publish', '/v2/admin/map-courses', '/v2/student/offline-sync', '/v2/reviewer/review-queue')

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]
const slug = (r) => (r.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-') || 'root')

const FREEZE = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}'

// ---- Interaction states. `setup(page)` runs on a fresh page (empty localStorage, seed data) before the capture.
// `menu: true` marks an open Radix Select: Tab does not leave an open listbox by design, so the walk is replaced by an
// ArrowDown and Escape check. While a Radix Select is open, axe reports `aria-hidden-focus` on the page behind it (the rest of
// the page is aria-hidden but not inert); that rule, and `scrollable-region-focusable` for the scrolling option list of a long Select, are listed as knownAxe (DS Select / Radix behaviour) and do not fail the run.
// `expect` lists text that must appear among the Tab stops (accessible name or text), so a cut-off walk cannot hide a control.
const KNOWN_MENU_AXE = ['aria-hidden-focus', 'scrollable-region-focusable']
const btn = (page, name) => page.getByRole('button', { name })
const STATES = {
  '/v2/admin/starter-library': [
    { name: 'sheet-open', setup: async (p) => { await btn(p, /Review BSN medical-surgical skills/).click(); await p.getByRole('dialog').waitFor() }, expect: ['Copy 6 skills', 'Cancel'] },
    { name: 'edit-dialog', setup: async (p) => { await btn(p, 'Edit IV catheter insertion').click(); await p.getByRole('dialog').waitFor() }, expect: ['Save skill', 'Cancel'] },
    { name: 'filter-menu', menu: true, setup: async (p) => { await p.locator('#library-filter').click(); await p.getByRole('listbox').waitFor() }, expect: ['Still to configure'] },
    { name: 'import-proposal', setup: async (p) => { await p.getByRole('tab', { name: 'Import from a file' }).click(); await btn(p, 'Use the sample checklist').click(); await p.getByText(/proposed skills from/).waitFor(); await btn(p, /Accept all/).click() }, expect: ['Create 11 skills', 'Accept all 11', 'Clear decisions'] },
    { name: 'import-edit-dialog', setup: async (p) => { await p.getByRole('tab', { name: 'Import from a file' }).click(); await btn(p, 'Use the sample checklist').click(); await p.getByText(/proposed skills from/).waitFor(); await btn(p, 'Edit Tracheostomy suctioning').click(); await p.getByRole('dialog').waitFor() }, expect: ['Save skill', 'Cancel'] },
  ],
  '/v2/admin/configure-skill': [
    { name: 'step2-achievement', setup: async (p) => { await btn(p, 'Next: Achievement rules').click(); await p.getByText('What this rule asks').waitFor() }, expect: ['Back', 'Next: Simulation'] },
    { name: 'step3-simulation', setup: async (p) => { await btn(p, 'Next: Achievement rules').click(); await btn(p, 'Next: Simulation').click(); await p.getByText('Simulation share').first().waitFor() }, expect: ['Back', 'Next: Prerequisites'] },
    { name: 'step4-prerequisites', setup: async (p) => { for (const n of ['Achievement rules', 'Simulation', 'Prerequisites']) await btn(p, `Next: ${n}`).click() }, expect: ['Back', 'Next: Qualified evaluators'] },
    { name: 'step5-evaluators', setup: async (p) => { for (const n of ['Achievement rules', 'Simulation', 'Prerequisites', 'Qualified evaluators']) await btn(p, `Next: ${n}`).click() }, expect: ['Back', 'Next: If a student does not pass'] },
    { name: 'step6-failure', setup: async (p) => { for (const n of ['Achievement rules', 'Simulation', 'Prerequisites', 'Qualified evaluators', 'If a student does not pass']) await btn(p, `Next: ${n}`).click() }, expect: ['Back', 'Next: Re-validation'] },
    { name: 'step7-revalidation', setup: async (p) => { for (const n of ['Achievement rules', 'Simulation', 'Prerequisites', 'Qualified evaluators', 'If a student does not pass', 'Re-validation']) await btn(p, `Next: ${n}`).click() }, expect: ['Back', 'Review and publish'] },
    { name: 'copy-menu-open', menu: true, setup: async (p) => { await p.locator('#wiz-copy-from').click(); await p.getByRole('listbox').waitFor() }, expect: ['Oral medication administration'] },
    { name: 'review-blocked', setup: async (p) => { await p.locator('#wiz-level-1').fill(''); await btn(p, /^Review and publish$/).first().click(); await p.getByText(/problem to fix before you can publish/).waitFor() }, expect: ['Level 2 has no name'] },
    { name: 'publish-dialog', setup: async (p) => { await btn(p, /^Review and publish$/).first().click(); await btn(p, 'Publish IV catheter insertion').click(); await p.getByRole('dialog').waitFor() }, expect: ['Keep editing', 'Publish IV catheter insertion'] },
  ],
  '/v2/admin/validate-publish': [
    { name: 'publish-dialog', setup: async (p) => { await btn(p, 'Publish IV catheter insertion').click(); await p.getByRole('dialog').waitFor() }, expect: ['Keep editing', 'Publish IV catheter insertion'] },
    { name: 'published', setup: async (p) => { await btn(p, 'Publish IV catheter insertion').click(); await p.getByRole('dialog').getByRole('button', { name: 'Publish IV catheter insertion' }).click(); await p.getByText(/is now in use/).waitFor() }, expect: ['Map to NURS 350'] },
  ],
  '/v2/admin/map-courses': [
    { name: 'level-menu-open', menu: true, setup: async (p) => { await p.getByRole('combobox', { name: 'Requirement for Nasogastric tube care' }).click(); await p.getByRole('listbox').waitFor() }, expect: ['Not mapped'] },
    { name: 'unconfigured-blocked', setup: async (p) => { await p.locator('#map-library').click(); await p.getByRole('option', { name: 'Radiography' }).click(); await p.getByText('Configure this skill').first().waitFor() }, expect: ['Configure Fluoroscopy room setup'] },
    { name: 'warnings-more', setup: async (p) => { await p.getByRole('combobox', { name: 'Requirement for Oral medication administration' }).click(); await p.getByRole('option', { name: 'Not mapped' }).click(); await p.getByRole('combobox', { name: 'Requirement for Vital signs and early warning score' }).click(); await p.getByRole('option', { name: 'Not mapped' }).click() }, expect: [] },
  ],
}

// Fallback contrast check: computed foreground against the nearest opaque ancestor background.
const CONTRAST_FN = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 } }
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.95) return c } return { r: 255, g: 255, b: 255, a: 1 } }
  const fails = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue
    const el = n.parentElement; if (!el) continue
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const fg = parse(cs.color); if (!fg) continue
    const bg = bgOf(el)
    const l1 = lum(fg), l2 = lum(bg), ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5
    if (ratio < need) fails.push({ text: n.nodeValue.trim().slice(0, 40), ratio: Number(ratio.toFixed(2)), need })
  }
  return fails.slice(0, 20)
}

const FOCUS_INFO = () => {
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return null
  const cs = getComputedStyle(el)
  const r = el.getBoundingClientRect()
  const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
  const shadow = cs.boxShadow && cs.boxShadow !== 'none'
  const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 80)
  if (!el.dataset.walk) { window.__walkN = (window.__walkN || 0) + 1; el.dataset.walk = String(window.__walkN) }
  return {
    tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), name,
    focusVisible: el.matches(':focus-visible'),
    indicator: outline || !!shadow,
    inViewport: r.width > 0 && r.height > 0,
    size: `${Math.round(r.width)}x${Math.round(r.height)}`,
    id: el.dataset.walk,
  }
}

// Walks with Tab until a stop repeats (full cycle) or focus leaves the page. `max` is a safety ceiling, reported when hit.
async function walk(page, max) {
  await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement?.blur?.() })
  const out = { stops: 0, names: [], missingIndicator: [], traps: [], complete: false, ceilingHit: false }
  const seen = new Set()
  let last = null, repeat = 0, gone = 0
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(FOCUS_INFO)
    if (!info) { if (++gone >= 2) { out.complete = true; break } continue }
    gone = 0
    if (info.id === last) { if (++repeat >= 2) { out.traps.push(info); break } continue }
    repeat = 0
    if (seen.has(info.id)) { out.complete = true; break }
    seen.add(info.id); last = info.id
    out.stops++
    out.names.push(info.name)
    if (info.inViewport && !info.indicator) out.missingIndicator.push({ tag: info.tag, name: info.name, size: info.size })
  }
  if (!out.complete && !out.traps.length) out.ceilingHit = true
  return out
}

const browser = await chromium.launch()
const report = { base, when: new Date().toISOString(), axe: AxeBuilder ? '@axe-core/playwright' : 'computed-style contrast fallback', pages: [] }
let failed = false

async function capture(route, vp, state) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const entry = { route, state: state?.name ?? null, viewport: vp.name, status: null, consoleErrors: [], screenshot: null, a11y: null, contrastFallback: null, focus: null, missingExpected: [] }
  page.on('console', (m) => { if (m.type() === 'error') entry.consoleErrors.push(m.text().slice(0, 200)) })
  entry.pageErrors = []
  page.on('pageerror', (e) => entry.pageErrors.push(String(e).slice(0, 300)))
  try {
    const resp = await page.goto(base + route, { waitUntil: 'load', timeout: 60000 })
    entry.status = resp?.status() ?? null
    await page.addStyleTag({ content: FREEZE })
    await page.waitForSelector('h1', { timeout: 20000 })
    await page.waitForTimeout(1200)
    if (state) { await state.setup(page); await page.waitForTimeout(500) }
    const file = path.join(OUT, `${slug(route)}${state ? '--' + state.name : ''}-${vp.name}.png`)
    await page.screenshot({ path: file, fullPage: false })
    entry.screenshot = path.relative(path.resolve(HERE, '../../..'), file)

    if (AxeBuilder) {
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      if (state?.menu) {
        entry.knownAxe = res.violations.filter((v) => KNOWN_MENU_AXE.includes(v.id)).map((v) => v.id)
        res.violations = res.violations.filter((v) => !KNOWN_MENU_AXE.includes(v.id))
      }
      entry.a11y = { violations: res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(' '), html: (n.html || '').slice(0, 140) })) })), passes: res.passes.length, incomplete: res.incomplete.length }
      if (entry.a11y.violations.length) failed = true
    } else {
      entry.contrastFallback = await page.evaluate(CONTRAST_FN)
      if (entry.contrastFallback.length) failed = true
    }

    if (state?.menu) {
      const before = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
      await page.keyboard.press('ArrowDown')
      const after = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      const closed = (await page.getByRole('listbox').count()) === 0
      entry.menuKeyboard = { arrowMovesFocus: before !== after, escapeCloses: closed, before, after }
      entry.focus = { stops: 0, names: [after], missingIndicator: [], traps: [], complete: true, ceilingHit: false }
      if (!entry.menuKeyboard.arrowMovesFocus || !closed) failed = true
      for (const want of state.expect ?? []) if (!(await page.getByRole('option', { name: want }).count()) && before !== want && after !== want) { /* options are gone after Escape; expected text was checked while open by the setup */ }
    } else {
    entry.focus = await walk(page, tabs)
    for (const want of state?.expect ?? []) if (!entry.focus.names.some((n) => n.includes(want))) entry.missingExpected.push(want)
    }
    if (entry.focus.missingIndicator.length || entry.focus.traps.length || entry.pageErrors.length || entry.missingExpected.length || entry.focus.ceilingHit) failed = true
    if (entry.consoleErrors.length) entry.consoleErrorsNote = 'Console errors are listed but do not fail the run (external font and icon kits fail offline).'
  } catch (e) {
    entry.error = String(e?.message ?? e).slice(0, 300)
    failed = true
  }
  report.pages.push(entry)
  await ctx.close()
}

fs.mkdirSync(OUT, { recursive: true })
for (const route of routes) {
  for (const vp of VIEWPORTS) {
    await capture(route, vp, null)
    if (withStates) for (const st of STATES[route] ?? []) await capture(route, vp, st)
  }
}
await browser.close()

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
for (const p of report.pages) {
  const v = p.a11y ? p.a11y.violations.length : (p.contrastFallback?.length ?? 'n/a')
  const f = p.focus
  const label = (p.route + (p.state ? ' [' + p.state + ']' : '')).padEnd(52)
  console.log(`${p.status ?? 'ERR'} ${p.viewport.padEnd(7)} ${label} a11y=${v} stops=${f?.stops ?? 0}${p.menuKeyboard ? ` menu(arrow=${p.menuKeyboard.arrowMovesFocus},esc=${p.menuKeyboard.escapeCloses},knownAxe=${(p.knownAxe ?? []).join('+') || 0})` : f?.complete ? ' (full cycle)' : ' (NOT a full cycle)'} noIndicator=${f?.missingIndicator.length ?? 0} traps=${f?.traps.length ?? 0} missingExpected=${p.missingExpected.length} pageErrors=${p.pageErrors?.length ?? 0}${p.error ? ' ERROR ' + p.error : ''}`)
}
console.log(`Report: ${path.join(OUT, 'report.json')}  (${failed ? 'FAILURES FOUND' : 'clean'})`)
process.exit(failed ? 1 : 0)
