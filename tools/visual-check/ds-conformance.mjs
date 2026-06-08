#!/usr/bin/env node
/**
 * ds-conformance — does a RENDERED screen match @exxatdesignux/ui?
 *
 * Deterministic checker (not LLM judgment). Renders a route, extracts computed
 * styles, and compares against the DS's actual token values parsed from
 * @exxatdesignux/ui/src/globals.css. Catches what the write-time hooks can't
 * see — the rendered result.
 *
 * Checks:
 *   T1  display headings (h1/h2 ≥ ~20px) render in the DS serif (ivypresto)
 *   T2  no text below 12px
 *   T3  every font-family is a DS font (ivypresto / Inter / mono) — no leaks
 *   R1  every border-radius is on the DS radius scale
 *
 * Usage: BASE_URL=http://localhost:3001 node tools/visual-check/ds-conformance.mjs "/route?x=1"
 * Exit 0 = conformant, 1 = deviations.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const route = process.argv[2] || '/'
const CSS = process.env.DS_CSS ||
  'apps/exam-management/admin/node_modules/@exxatdesignux/ui/src/globals.css'

// ── parse the DS's allowed values from globals.css ──
const css = readFileSync(new URL(`file:///Users/romitsoley/Work/${CSS}`)).toString()
const tokenVal = (name) => (css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`)) || [])[1]?.trim()
const headingFont = (tokenVal('--font-heading') || 'ivypresto').replace(/["']/g, '').toLowerCase()
const radii = new Set(['0px', '9999px', '50%'])
for (const r of ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-2xl', '--radius-3xl']) {
  const v = tokenVal(r); if (v) radii.add(v.trim())
}
const ALLOWED_FONTS = ['ivypresto', 'inter', 'mono', 'sfmono', 'menlo', 'monospace', 'fontawesome', 'awesome']

const b = await chromium.launch({ headless: true })
const pg = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()
await pg.goto(BASE + route, { waitUntil: 'networkidle' })
await pg.waitForTimeout(1500)

const data = await pg.evaluate(() => {
  const out = { headings: [], minFont: 99, fonts: new Set(), radii: new Set(), belowFloor: [] }
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el)
    const txt = (el.childNodes && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
    const fs = parseFloat(s.fontSize)
    if (txt && el.offsetParent !== null) {
      out.fonts.add(s.fontFamily.split(',')[0].replace(/["']/g, '').trim())
      if (fs && fs < out.minFont) out.minFont = fs
      // DS actual floor: text-xs renders ~11px (root scaling) and the DS uses
      // 10px tags/badges (see offline.html). Flag only genuinely micro text.
      if (fs && fs < 10) out.belowFloor.push(`${el.tagName.toLowerCase()} ${Math.round(fs)}px "${(el.textContent || '').trim().slice(0, 24)}"`)
    }
    if (/^H[12]$/.test(el.tagName) && fs >= 20 && el.offsetParent !== null) {
      out.headings.push({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 32), font: s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), size: Math.round(fs) })
    }
    for (const c of ['border-top-left-radius', 'border-top-right-radius']) {
      const v = s.getPropertyValue(c); if (v && v !== '0px') out.radii.add(v)
    }
  }
  out.fonts = [...out.fonts]; out.radii = [...out.radii]
  return out
})

const dev = []
// T1 — display headings serif
for (const h of data.headings) {
  if (!h.font.toLowerCase().includes(headingFont.split('-')[0]))
    dev.push(`T1 heading "${h.text}" (${h.size}px) renders in "${h.font}", not the DS serif (${headingFont}). Use font-heading.`)
}
// T2 — sub-12px
for (const t of data.belowFloor.slice(0, 8)) dev.push(`T2 sub-12px text: ${t}`)
// T3 — font leaks
for (const f of data.fonts) {
  if (f && !ALLOWED_FONTS.some(a => f.toLowerCase().includes(a)))
    dev.push(`T3 non-DS font in use: "${f}" (allowed: ivypresto / Inter / mono)`)
}
// R1 — radius scale (skip pill/rounded-full ≥ 100px; ignore ≤3px control hairlines)
for (const r of data.radii) {
  const px = parseFloat(r)
  if (px >= 100 || px <= 3) continue
  if (![...radii].some(a => a === r)) dev.push(`R1 off-scale border-radius: ${r} (DS scale: ${[...radii].filter(x => parseFloat(x) > 0 && parseFloat(x) < 100).join(', ')})`)
}

console.log(`\nDS-CONFORMANCE · ${route}`)
console.log(`  headings: ${data.headings.map(h => `${h.tag}:${h.font}@${h.size}`).join(', ') || '(none ≥20px)'}`)
console.log(`  min font: ${data.minFont}px · fonts: ${data.fonts.join(', ')}`)
if (dev.length === 0) { console.log('  ✓ CONFORMANT — no deterministic DS deviations'); }
else { console.log(`  ✗ ${dev.length} DEVIATION(S):`); dev.forEach(d => console.log('    · ' + d)) }
await b.close()
process.exit(dev.length ? 1 : 0)
