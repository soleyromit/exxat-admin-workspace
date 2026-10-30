#!/usr/bin/env node
// Fill check: wizard and form pages use the full width with no white space (leadership direction, D-L5 "full-width wizards and
// forms" and D-X30 "fill width with structure, not stretched fields"; docs/knowledge/00-design-brief.md section 0).
//
// For every registered lab screen variant (lib/lab/screens.json pageType per variant, the same page types as
// tests/lab/density-budget.mjs) at 1920 x 1080 and 1440 x 900, with clean storage, it measures the content area (<main>, minus
// lab chrome, the sidebar and the utility bar):
//   width  = horizontal extent of rendered content boxes BELOW the page header (text, controls, media, tables, painted boxes such
//            as cards; unpainted wrappers do not count) divided by the main content width (main box minus its padding).
//            The page header is excluded because a right-aligned header action would otherwise hide a narrow body.
//   band   = the tallest empty vertical band inside the first viewport between the top of the body and the footer
//            ([data-region=footer]) or, without a footer, the bottom of the viewport (no content painted across it).
// FAIL (wizard, form, split): width < 85% at 1920, or band > 35% of the viewport height at either size.
// REPORT ONLY (list, dashboard, detail, student, evaluator, director pages): the same numbers, flagged "would fail", never exit 1.
//
// Usage: node scripts/lab-fill-check.mjs [baseUrl] [--report|--strict|--negative] [--screen=persona/slug] [--workers=n]
//                                       [--json=path] [--shots=dir]
//   --report   (default) print, exit 0.   --strict  exit 1 on any FAIL on wizard/form/split.
//   --negative inject a max-width 900px centred wrapper on every fail-tier page at 1920; every one must FAIL (exit 0 only then).
import fs from "node:fs"
import path from "node:path"
import { screens, screenUrl, freshPage, settle, pool, arg } from "./lib/lab-gate-common.mjs"

// Thresholds (D-L5, D-X30: no side white space on wizards and forms; values set by the 2026-10-27 gate brief).
const MIN_WIDTH_COVERAGE_1920 = 0.85 // content must span at least 85% of the main width at 1920
const MAX_EMPTY_BAND = 0.35 // no empty vertical band taller than 35% of the viewport between content and footer
const FAIL_TYPES = new Set(["wizard", "form", "split"])
const VIEWPORTS = [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }]

const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3017"
const MODE = args.includes("--negative") ? "negative" : args.includes("--strict") ? "strict" : "report"
const ONLY_SCREEN = arg(args, "screen", "")
const WORKERS = Number(arg(args, "workers", 4))
const JSON_OUT = arg(args, "json", "")
const SHOTS = arg(args, "shots", "")
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true })

const CASES = []
for (const s of screens()) {
  const key = `${s.persona}/${s.slug}`
  if (ONLY_SCREEN && key !== ONLY_SCREEN) continue
  for (const v of s.variants) {
    if (!v.file) continue
    const type = v.pageType ?? "unknown"
    if (MODE === "negative" && !FAIL_TYPES.has(type)) continue
    for (const vp of MODE === "negative" ? [VIEWPORTS[0]] : VIEWPORTS) CASES.push({ key, variant: v.id, type, vp, url: screenUrl(key, v.id) })
  }
}

/** Runs in the page. Self-contained. */
function measure() {
  const EXCL = "[data-lab-chrome], [data-lab-bar], [data-variant-bar], [data-ds-used-panel], [data-lab-question], [data-slot=utility-bar], [data-sidebar=sidebar], [data-slot=sidebar], [data-sonner-toaster]"
  const main = document.querySelector("main") ?? document.body
  const vh = window.innerHeight
  const cs = getComputedStyle(main)
  const mr = main.getBoundingClientRect()
  const left = mr.left + parseFloat(cs.paddingLeft), right = mr.right - parseFloat(cs.paddingRight)
  const mainW = Math.max(1, right - left)
  const footer = [...document.querySelectorAll("[data-region=footer]")].find((f) => { const r = f.getBoundingClientRect(); return r.height > 0 && r.top < vh })
  const header = main.querySelector("[data-slot=page-header]") ?? main.querySelector("h1")?.closest("header, [data-slot=page-header]") ?? null
  const headerBottom = header ? header.getBoundingClientRect().bottom : main.querySelector("h1")?.getBoundingClientRect().bottom ?? mr.top
  const bgOf = (el) => getComputedStyle(el).backgroundColor
  const pageBg = [bgOf(main), bgOf(document.body), "rgba(0, 0, 0, 0)", "transparent"]
  const painted = (el, st) => {
    if (st.backgroundColor && !pageBg.includes(st.backgroundColor)) return true
    if (["Top", "Right", "Bottom", "Left"].some((s) => parseFloat(st[`border${s}Width`]) > 0 && st[`border${s}Style`] !== "none")) return true
    return st.boxShadow && st.boxShadow !== "none"
  }
  const isLeaf = (el) => /^(INPUT|TEXTAREA|SELECT|BUTTON|IMG|SVG|CANVAS|VIDEO|TABLE|svg)$/i.test(el.tagName) || el.getAttribute("role") === "img" || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const boxes = []
  for (const el of main.querySelectorAll("*")) {
    if (el.closest(EXCL) || (footer && footer.contains(el)) || (header && header.contains(el))) continue
    const st = getComputedStyle(el)
    if (st.visibility === "hidden" || st.display === "none" || parseFloat(st.opacity) === 0) continue
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2 || r.bottom <= headerBottom || r.top >= vh) continue
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue
    if (el.closest(".sr-only") || (r.width <= 1 && r.height <= 1)) continue
    if (!isLeaf(el) && !painted(el, st)) continue
    boxes.push({ l: Math.max(r.left, left), r: Math.min(r.right, right), t: Math.max(r.top, headerBottom), b: Math.min(r.bottom, footer ? footer.getBoundingClientRect().top : vh) })
  }
  const bodyTop = headerBottom
  const bodyBottom = footer ? footer.getBoundingClientRect().top : Math.min(vh, Math.max(mr.bottom, vh))
  if (!boxes.length) return { width: 0, band: (bodyBottom - bodyTop) / vh, mainW, footer: !!footer, boxes: 0 }
  const minL = Math.min(...boxes.map((b) => b.l)), maxR = Math.max(...boxes.map((b) => b.r))
  // Tallest y-gap not covered by any content box, between bodyTop and bodyBottom (the band above the footer included).
  const ys = boxes.filter((b) => b.b > b.t).map((b) => [b.t, b.b]).sort((a, b) => a[0] - b[0])
  let cursor = bodyTop, gap = 0, gapAt = 0
  for (const [t, b] of ys) { if (t > cursor && t - cursor > gap) { gap = t - cursor; gapAt = cursor } cursor = Math.max(cursor, b) }
  if (bodyBottom - cursor > gap) { gap = bodyBottom - cursor; gapAt = cursor }
  return { width: (maxR - minL) / mainW, left: Math.round(minL - left), right: Math.round(right - maxR), band: gap / vh, bandAt: Math.round(gapAt), mainW: Math.round(mainW), footer: !!footer, boxes: boxes.length }
}

const NEG_CSS = "main > * { max-width: 900px !important; margin-inline: auto !important; }"
const started = Date.now()
const rows = await pool(CASES, WORKERS, async (c, browser) => {
  const { ctx, page } = await freshPage(browser, c.vp)
  try {
    await settle(page, base, c.url)
    if (MODE === "negative") { await page.addStyleTag({ content: NEG_CSS }); await page.waitForTimeout(300) }
    const m = await page.evaluate(measure)
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${c.key.replace("/", "-")}-${c.variant}-${c.vp.width}.png`) })
    const why = []
    if (c.vp.width === 1920 && m.width < MIN_WIDTH_COVERAGE_1920) why.push(`width ${(m.width * 100).toFixed(0)}% < ${MIN_WIDTH_COVERAGE_1920 * 100}% (empty L ${m.left}px R ${m.right}px of ${m.mainW}px)`)
    if (m.band > MAX_EMPTY_BAND) why.push(`empty band ${(m.band * 100).toFixed(0)}% of viewport at y=${m.bandAt}${m.footer ? " above the footer" : ""}`)
    return { ...c, ...m, issue: why.join("; "), result: why.length ? (FAIL_TYPES.has(c.type) ? "FAIL" : "WOULD-FAIL") : "PASS" }
  } catch (e) {
    return { ...c, result: FAIL_TYPES.has(c.type) ? "FAIL" : "WOULD-FAIL", issue: `page error: ${String(e.message).split("\n")[0].slice(0, 120)}` }
  } finally { await ctx.close().catch(() => {}) }
}, (c, e) => ({ ...c, result: FAIL_TYPES.has(c.type) ? "FAIL" : "WOULD-FAIL", issue: `browser error: ${String(e?.message ?? e).split("\n")[0].slice(0, 100)}` }))

rows.sort((a, b) => (FAIL_TYPES.has(b.type) - FAIL_TYPES.has(a.type)) || a.key.localeCompare(b.key) || a.variant.localeCompare(b.variant) || b.vp.width - a.vp.width)
const pct = (x) => (x === undefined ? "" : `${(x * 100).toFixed(0)}%`)
console.log(`\nFILL CHECK (${MODE}) against ${base}: ${rows.length} cases, ${((Date.now() - started) / 1000).toFixed(0)}s. Thresholds: width >= ${MIN_WIDTH_COVERAGE_1920 * 100}% at 1920, empty band <= ${MAX_EMPTY_BAND * 100}% of viewport (D-L5, D-X30)\n`)
console.log("| screen | variant | type | viewport | width | band | result | issue |\n|---|---|---|---|---|---|---|---|")
for (const r of rows) console.log(`| ${r.key} | ${r.variant} | ${r.type} | ${r.vp.width} | ${pct(r.width)} | ${pct(r.band)} | ${r.result} | ${r.issue} |`)
const fails = rows.filter((r) => r.result === "FAIL")
const would = rows.filter((r) => r.result === "WOULD-FAIL")
console.log(`\nwizard/form/split: ${rows.filter((r) => FAIL_TYPES.has(r.type)).length} cases, ${fails.length} FAIL`)
console.log(`other page types (report only): ${rows.filter((r) => !FAIL_TYPES.has(r.type)).length} cases, ${would.length} would fail`)
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ mode: MODE, rows }, null, 1))
if (MODE === "negative") {
  const leaked = rows.filter((r) => r.result === "PASS")
  console.log(leaked.length ? `\nNEGATIVE CONTROL BROKEN: ${leaked.length} narrowed page(s) still passed: ${leaked.map((r) => `${r.key}/${r.variant}`).join(", ")}` : `\nNEGATIVE CONTROL OK: all ${rows.length} narrowed pages failed, as they must`)
  process.exit(leaked.length || !rows.length ? 1 : 0)
}
if (MODE === "strict") { console.log(fails.length ? `\nFILL CHECK FAILED (strict): ${fails.length}` : "\nFILL CHECK PASSED (strict)"); process.exit(fails.length ? 1 : 0) }
console.log("\nFILL CHECK report only (exit 0). Use --strict to block on wizard/form/split failures.")
