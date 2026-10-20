#!/usr/bin/env node
// Visual and accessibility pass for the v2 prototype.
//
//   node docs/v2/verify/shoot.mjs [--base http://localhost:3007] [--tabs 60] [route ...]
//
// For each route and each viewport (desktop 1440x900, phone 390x844) it:
//   1. loads the page with a fresh browser profile (empty localStorage, so the seed is shown),
//   2. freezes CSS transitions and animations (mid-transition frames cause phantom axe contrast failures),
//   3. saves docs/v2/screenshots/<route-slug>-{desktop,phone}.png,
//   4. runs axe-core (WCAG 2.0/2.1 A and AA) through @axe-core/playwright when it can be loaded; otherwise falls back
//      to a computed-style contrast check on text nodes,
//   5. walks the page with the Tab key and records, per stop, whether a visible focus indicator exists,
//      plus any keyboard trap (the same element receiving focus three times in a row).
// Output: docs/v2/screenshots/report.json. Exit code 1 when any violation, missing focus indicator or trap is found.
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
let tabs = 60
const routes = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base') base = args[++i]
  else if (args[i] === '--tabs') tabs = Number(args[++i])
  else routes.push(args[i])
}
if (!routes.length) routes.push('/v2', '/v2/admin', '/v2/student', '/v2/preceptor', '/v2/reviewer', '/v2/director', '/v2/admin/starter-library', '/v2/student/offline-sync', '/v2/reviewer/review-queue')

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]
const slug = (r) => (r.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-') || 'root')

const FREEZE = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}'

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
  if (!el || el === document.body) return null
  const cs = getComputedStyle(el)
  const r = el.getBoundingClientRect()
  const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
  const shadow = cs.boxShadow && cs.boxShadow !== 'none'
  const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 50)
  return {
    tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), name,
    focusVisible: el.matches(':focus-visible'),
    indicator: outline || !!shadow,
    inViewport: r.width > 0 && r.height > 0,
    size: `${Math.round(r.width)}x${Math.round(r.height)}`,
    key: `${el.tagName}|${name}|${Math.round(r.x)}|${Math.round(r.y)}`,
  }
}

const browser = await chromium.launch()
const report = { base, when: new Date().toISOString(), axe: AxeBuilder ? '@axe-core/playwright' : 'computed-style contrast fallback', pages: [] }
let failed = false

for (const route of routes) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    const entry = { route, viewport: vp.name, status: null, consoleErrors: [], screenshot: null, a11y: null, contrastFallback: null, focus: { stops: 0, missingIndicator: [], traps: [] } }
    page.on('console', (m) => { if (m.type() === 'error') entry.consoleErrors.push(m.text().slice(0, 200)) })
    entry.pageErrors = []
    page.on('pageerror', (e) => entry.pageErrors.push(String(e).slice(0, 300)))
    try {
      const resp = await page.goto(base + route, { waitUntil: 'load', timeout: 60000 })
      entry.status = resp?.status() ?? null
      await page.addStyleTag({ content: FREEZE })
      await page.waitForSelector('h1', { timeout: 20000 })
      await page.waitForTimeout(1500)
      const file = path.join(OUT, `${slug(route)}-${vp.name}.png`)
      await page.screenshot({ path: file, fullPage: false })
      entry.screenshot = path.relative(path.resolve(HERE, '../../..'), file)

      if (AxeBuilder) {
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        entry.a11y = { violations: res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(' '), html: (n.html || '').slice(0, 140) })) })), passes: res.passes.length, incomplete: res.incomplete.length }
        if (entry.a11y.violations.length) failed = true
      } else {
        entry.contrastFallback = await page.evaluate(CONTRAST_FN)
        if (entry.contrastFallback.length) failed = true
      }

      await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement?.blur?.() })
      let last = null, repeat = 0
      for (let i = 0; i < tabs; i++) {
        await page.keyboard.press('Tab')
        const info = await page.evaluate(FOCUS_INFO)
        if (!info) continue
        entry.focus.stops++
        if (info.key === last) { repeat++; if (repeat >= 2) { entry.focus.traps.push(info); break } } else { repeat = 0; last = info.key }
        if (info.inViewport && !info.indicator) entry.focus.missingIndicator.push({ tag: info.tag, name: info.name, size: info.size })
      }
      if (entry.focus.missingIndicator.length || entry.focus.traps.length || entry.pageErrors.length) failed = true
      if (entry.consoleErrors.length) entry.consoleErrorsNote = 'Console errors are listed but do not fail the run (external font and icon kits fail offline).'
    } catch (e) {
      entry.error = String(e?.message ?? e).slice(0, 300)
      failed = true
    }
    report.pages.push(entry)
    await ctx.close()
  }
}
await browser.close()

fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
for (const p of report.pages) {
  const v = p.a11y ? p.a11y.violations.length : (p.contrastFallback?.length ?? 'n/a')
  console.log(`${p.status ?? 'ERR'} ${p.viewport.padEnd(7)} ${p.route.padEnd(36)} a11y=${v} focusStops=${p.focus.stops} noIndicator=${p.focus.missingIndicator.length} traps=${p.focus.traps.length} pageErrors=${p.pageErrors?.length ?? 0}${p.error ? ' ERROR ' + p.error : ''}`)
}
console.log(`Report: ${path.join(OUT, 'report.json')}  (${failed ? 'FAILURES FOUND' : 'clean'})`)
process.exit(failed ? 1 : 0)
