#!/usr/bin/env node
// Requirement gate for the design lab (subagent-standing-brief rule 5; docs/knowledge/req-coverage-lab.md "How the gate works").
// Reads docs/knowledge/req-coverage-lab.json (the audit: requirement -> screens -> variants, status, selectorHint) and, for every
// row with a selectorHint, opens each variant of the screen at 1440 x 900 with clean storage, runs the setup steps the row needs
// (open a sheet, go to a step) and asserts each expected control or text is present and visible (role + accessible name, label,
// placeholder, data attribute). The audit JSON is never rewritten: stable selectors, setup steps, URL params and MANUAL reasons
// live in scripts/req-gate-hints.json, keyed "<reqId>|<screen>" (all variant groups of that row) or "<reqId>|<screen>|<variants>"
// (one group, variants joined, for example "IM-11|admin/import-ai-review|C").
//
// Usage: node scripts/lab-req-gate.mjs [baseUrl] [--report|--strict|--negative] [--only=REQ,REQ] [--screen=persona/slug]
//                                     [--workers=n] [--json=path] [--verbose]
//   --report   (default) print the table and counts, exit 0.
//   --strict   exit 1 when a row the audit records as MET fails (regression guard), or any row listed in hints.mustPass fails.
//   --negative run the MET rows with every expected selector deliberately corrupted (text, name and regex get a nonsense suffix,
//              CSS gets an impossible attribute). Every check must FAIL; exit 0 only then (proves the gate can fail).
// Result per check: PASS (visible), FAIL (missing, hidden, setup failed, page error), MANUAL (cannot be automated; reason given).
import fs from "node:fs"
import path from "node:path"
import { APP_ROOT, ADMIN_ROOT, readJson, screens, screenUrl, freshPage, settle, pool, arg } from "./lib/lab-gate-common.mjs"

const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3017"
const MODE = args.includes("--negative") ? "negative" : args.includes("--strict") ? "strict" : "report"
const ONLY = arg(args, "only", "")?.split(",").filter(Boolean) ?? []
const ONLY_SCREEN = arg(args, "screen", "")
const WORKERS = Number(arg(args, "workers", 4))
const JSON_OUT = arg(args, "json", "")
const VERBOSE = args.includes("--verbose")
const VISIBLE_TIMEOUT = 6000

const audit = readJson(path.join(APP_ROOT, "docs/knowledge/req-coverage-lab.json"))
const hintsFile = path.join(ADMIN_ROOT, "scripts/req-gate-hints.json")
const hints = fs.existsSync(hintsFile) ? readJson(hintsFile) : { mustPass: [], rows: {} }
const registry = new Map(screens().map((s) => [`${s.persona}/${s.slug}`, s]))

// ---- expand the audit into checks -----------------------------------------------------------------------------------------------
/** Split an audit hint into expressions: "a; page.b" -> ["page.a", "page.b"]. Returns null when it is prose, not a selector. */
function parseHint(h) {
  if (!h || / then |->/.test(h)) return null
  return h.split(/;\s*(?=page\.|getBy|locator\(|#|\[)/).map((e) => normExpr(e.trim())).filter(Boolean)
}
function normExpr(e) {
  if (!e) return null
  if (e.startsWith("page.")) return e
  if (/^(getBy|locator\()/.test(e)) return `page.${e}`
  if (/^[#.[]/.test(e)) return `page.locator(${JSON.stringify(e)})`
  return null
}

const CHECKS = []
const MANUAL = []
for (const req of audit) {
  for (const row of req.screens) {
    const vkey = row.variants.join("")
    const id = `${req.reqId}|${row.screen}|${vkey}`
    const h = hints.rows?.[id] ?? hints.rows?.[`${req.reqId}|${row.screen}`] ?? {}
    // An audit row with no selectorHint is gateable when its hints entry supplies its own selector: expect, a check group or
    // per-variant expect, or a manual reason (2026-10-30: ST-03 request-signoff, SH-07 record and EV-07 lab grid had empty
    // hints and were skipped before the hints were read).
    const hintHasSelector = !!(h.expect || h.manual || (h.checks ?? []).some((g) => g.expect || Object.values(g.perVariant ?? {}).some((p) => p.expect || p.manual)) || Object.values(h.perVariant ?? {}).some((p) => p.expect || p.manual))
    if (!row.selectorHint && !hintHasSelector) continue
    const must = (hints.mustPass ?? []).includes(id) || (hints.mustPass ?? []).includes(`${req.reqId}|${row.screen}`)
    const baseRow = { reqId: req.reqId, rowId: id, auditStatus: row.status, priority: row.priority || "", must }
    if (ONLY.length && !ONLY.includes(req.reqId)) continue
    if (h.manual) { MANUAL.push({ ...baseRow, screen: row.screen, variants: vkey, reason: h.manual }); continue }
    // An override may replace the screen and variants (for composite audit rows such as "reviewer/approvals + admin/approvals").
    const groups = h.checks ?? [{}]
    for (const g of groups) {
      const screen = g.screen ?? h.screen ?? row.screen
      const variants = g.variants ?? h.variants ?? row.variants
      const def = registry.get(screen)
      const okVariants = def && variants.length && variants.every((v) => def.variants.some((x) => x.id === v))
      if (!okVariants) {
        MANUAL.push({ ...baseRow, screen, variants: variants.join(","), reason: def ? `variants "${variants.join(",")}" are not registry variant ids; add a hints override` : `"${screen}" is not one registered screen; add a hints override with screen + variants` })
        continue
      }
      for (const v of variants) {
        const pv = { ...(h.perVariant?.[v] ?? {}), ...(g.perVariant?.[v] ?? {}) }
        if (pv.manual) { MANUAL.push({ ...baseRow, screen, variants: v, reason: pv.manual }); continue }
        const expect = pv.expect ?? g.expect ?? h.expect ?? parseHint(row.selectorHint)
        if (!expect) { MANUAL.push({ ...baseRow, screen, variants: v, reason: `hint is prose or a multi-step action ("${row.selectorHint}"); add expect + setup in hints` }); continue }
        if (ONLY_SCREEN && screen !== ONLY_SCREEN) continue
        CHECKS.push({
          ...baseRow, screen, variant: v,
          params: { ...(h.params ?? {}), ...(g.params ?? {}), ...(pv.params ?? {}) },
          setup: pv.setup ?? g.setup ?? h.setup ?? [],
          expect: expect.map(normExpr),
          allowHidden: pv.allowHidden ?? g.allowHidden ?? h.allowHidden ?? false,
          viewport: pv.viewport ?? g.viewport ?? h.viewport ?? { width: 1440, height: 900 },
        })
      }
    }
  }
}
const runChecks = MODE === "negative" ? CHECKS.filter((c) => c.auditStatus === "MET") : CHECKS

// ---- negative control: a page proxy that corrupts every selector argument ----------------------------------------------------
const NEG = "zqx-req-gate-negative"
const corrupt = (a) => typeof a === "string" ? `${a} ${NEG}` : a instanceof RegExp ? new RegExp(`${a.source}${NEG}`, a.flags) : a && typeof a === "object" && a.name !== undefined ? { ...a, name: corrupt(a.name) } : a
function negativePage(page) {
  return {
    getByText: (t, o) => page.getByText(corrupt(t), o),
    getByLabel: (t, o) => page.getByLabel(corrupt(t), o),
    getByPlaceholder: (t, o) => page.getByPlaceholder(corrupt(t), o),
    getByTestId: (t) => page.getByTestId(corrupt(t)),
    getByRole: (r, o) => page.getByRole(r, o?.name !== undefined ? corrupt(o) : { ...(o ?? {}), name: NEG }),
    locator: (css, o) => page.locator(`${css}[data-${NEG}]`, o),
  }
}

// ---- runner --------------------------------------------------------------------------------------------------------------------
const toLocator = (expr, page) => new Function("page", `return (${expr})`)(page)

async function runStep(page, step) {
  const t = { timeout: 10000 }
  if (step.click) { const l = toLocator(normExpr(step.click), page).first(); await l.scrollIntoViewIfNeeded(t).catch(() => {}); await l.click(t) }
  else if (step.hover) await toLocator(normExpr(step.hover), page).first().hover(t)
  else if (step.fill) await toLocator(normExpr(step.fill[0]), page).first().fill(step.fill[1], t)
  else if (step.press) await page.keyboard.press(step.press)
  else if (step.select) await toLocator(normExpr(step.select[0]), page).first().selectOption(step.select[1], t)
  else if (step.goto) await settle(page, base, step.goto)
  if (step.wait !== 0) await page.waitForTimeout(step.wait ?? 600)
}

async function assertOne(page, expr, allowHidden) {
  let loc
  try { loc = toLocator(expr, page).first() } catch (e) { return { ok: false, why: `bad selector: ${String(e.message).slice(0, 80)}` } }
  try { await loc.waitFor({ state: "attached", timeout: VISIBLE_TIMEOUT }) } catch { return { ok: false, why: "not in the DOM" } }
  await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {})
  if (await loc.isVisible().catch(() => false)) return { ok: true }
  return allowHidden ? { ok: true, why: "in DOM, hidden (allowHidden)" } : { ok: false, why: "in DOM but not visible" }
}

// Checks with the same URL and setup share one page load.
const groups = new Map()
for (const c of runChecks) {
  const url = screenUrl(c.screen, c.variant, c.params)
  const key = `${url}|${JSON.stringify(c.setup)}|${JSON.stringify(c.viewport)}`
  if (!groups.has(key)) groups.set(key, { url, setup: c.setup, viewport: c.viewport, checks: [] })
  groups.get(key).checks.push(c)
}
// Order: grouped by screen so the dev server compiles each route once, early.
const queue = [...groups.values()].sort((a, b) => a.url.localeCompare(b.url))

const started = Date.now()
const results = (await pool(queue, WORKERS, async (g, browser) => {
  const out = []
  const { ctx, page } = await freshPage(browser, g.viewport)
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 100)))
  try {
    await settle(page, base, g.url)
    let setupErr = null
    for (const s of g.setup) { try { await runStep(page, s) } catch (e) { setupErr = `setup ${JSON.stringify(s).slice(0, 80)} failed: ${String(e.message).split("\n")[0].slice(0, 100)}`; break } }
    const p = MODE === "negative" ? negativePage(page) : page
    for (const c of g.checks) {
      if (setupErr) { out.push({ ...c, url: g.url, result: "FAIL", why: setupErr }); continue }
      const parts = []
      for (const e of c.expect) parts.push({ e, ...(await assertOne(p, e, c.allowHidden)) })
      const bad = parts.filter((x) => !x.ok)
      out.push({ ...c, url: g.url, result: bad.length ? "FAIL" : "PASS", why: bad.map((x) => `${x.e.replace(/^page\./, "")}: ${x.why}`).join("; ") })
    }
  } catch (e) {
    for (const c of g.checks) out.push({ ...c, url: g.url, result: "FAIL", why: `page error: ${String(e.message).split("\n")[0].slice(0, 120)}` })
  }
  if (VERBOSE) process.stderr.write(`${g.url} ${out.map((o) => `${o.reqId}:${o.result}`).join(" ")}\n`)
  await ctx.close().catch(() => {})
  return out
}, (g, e) => g.checks.map((c) => ({ ...c, url: g.url, result: "FAIL", why: `browser error: ${String(e?.message ?? e).split("\n")[0].slice(0, 100)}` })))).flat()

// ---- report --------------------------------------------------------------------------------------------------------------------
const order = (a, b) => a.reqId.localeCompare(b.reqId, undefined, { numeric: true }) || a.screen.localeCompare(b.screen) || a.variant.localeCompare(b.variant)
results.sort(order)
const short = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s)
const exprOf = (c) => c.expect.map((e) => e.replace(/^page\./, "")).join(" ; ")
console.log(`\nREQ GATE (${MODE}) against ${base}: ${results.length} automated checks, ${MANUAL.length} manual, ${((Date.now() - started) / 1000).toFixed(0)}s\n`)
console.log("| reqId | screen | variant | audit | expected | result | detail |")
console.log("|---|---|---|---|---|---|---|")
for (const r of results) console.log(`| ${r.reqId}${r.must ? " (must)" : ""} | ${r.screen} | ${r.variant} | ${r.auditStatus} | \`${short(exprOf(r), 90)}\` | ${r.result} | ${short(r.why ?? "", 140)} |`)
if (MANUAL.length && MODE !== "negative") {
  console.log("\nMANUAL (not automated)\n\n| reqId | screen | variants | audit | reason |\n|---|---|---|---|---|")
  for (const m of MANUAL.sort((a, b) => a.reqId.localeCompare(b.reqId, undefined, { numeric: true }))) console.log(`| ${m.reqId} | ${m.screen} | ${m.variants} | ${m.auditStatus} | ${m.reason} |`)
}
const tally = {}
for (const r of results) { tally[r.auditStatus] ??= { PASS: 0, FAIL: 0 }; tally[r.auditStatus][r.result]++ }
console.log("\nCounts by audit status (automated checks):")
for (const [s, t] of Object.entries(tally)) console.log(`  ${s.padEnd(12)} PASS ${t.PASS}  FAIL ${t.FAIL}`)
console.log(`  MANUAL rows/variant groups: ${MANUAL.length}`)
const regressions = results.filter((r) => r.result === "FAIL" && (r.auditStatus === "MET" || r.must))
const nowPassing = results.filter((r) => r.result === "PASS" && r.auditStatus !== "MET")
if (MODE !== "negative") {
  console.log(`\nMET or mustPass rows failing (strict blockers): ${regressions.length}`)
  for (const r of regressions) console.log(`  - ${r.reqId} ${r.screen} ${r.variant}: ${r.why}`)
  console.log(`\nGap rows whose selector now passes (re-audit; the selector may only prove presence, not the full requirement): ${nowPassing.length}`)
  for (const r of nowPassing) console.log(`  - ${r.reqId} ${r.screen} ${r.variant} (audit ${r.auditStatus})`)
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ mode: MODE, base, results, manual: MANUAL }, null, 1))

if (MODE === "negative") {
  const leaked = results.filter((r) => r.result === "PASS")
  if (!results.length) { console.log("\nNEGATIVE CONTROL BROKEN: no MET rows ran"); process.exit(1) }
  if (leaked.length) { console.log(`\nNEGATIVE CONTROL BROKEN: ${leaked.length} corrupted selector(s) still passed`); for (const r of leaked) console.log(`  - ${r.rowId} ${r.variant}`); process.exit(1) }
  console.log(`\nNEGATIVE CONTROL OK: all ${results.length} corrupted checks failed, as they must`)
  process.exit(0)
}
if (MODE === "strict") {
  console.log(regressions.length ? `\nREQ GATE FAILED (strict): ${regressions.length} blocker(s)` : "\nREQ GATE PASSED (strict)")
  process.exit(regressions.length ? 1 : 0)
}
console.log("\nREQ GATE report only (exit 0). Use --strict to block on MET regressions and mustPass rows.")
