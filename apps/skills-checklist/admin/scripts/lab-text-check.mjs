#!/usr/bin/env node
// Text check: pages carry too much text (Romit, 2026-10-27). For every registered screen variant and every flow step, at
// 1440 x 900 with clean storage, the WHOLE page is scrolled (so lazy content renders) and measured:
//   words      visible prose words on the full page (not just the first viewport). The definition of prose is the one in
//              tests/lab/density-budget.mjs ("Prose" rule): not buttons, links, labels, table cells, headings h1-h3, legends,
//              badges, tooltips, dt/dd, figures, charts, SVG, [data-viz-label], quoted user content, artifact previews, the scope
//              bar, screen-reader-only text, nav, lab chrome; pure-number tokens dropped; SHORT-LABEL RULE (3 words or fewer
//              inside a chart, list item or table row is a data label). MODAL RULE: with a modal open only the modal counts.
//   sentences  explanatory sentences: prose sentences of 5 words or more.
//   same-page repeats  two sentences on one page whose content tokens (stop words removed, at least 3 each) overlap with
//              Jaccard >= 0.6, or are identical.
//   cross-page repeats an identical sentence (normalised) on 3 or more different screens (persona/slug; variants of one screen
//              sharing a sentence count once, since a variant is an alternative, not a second page).
// --report (default): worst 20 pages by words over budget, every same-page repeat, every cross-page repeat; exit 0.
// --strict: exit 1 when any page is over its budget or has a same-page repeat.
// --negative: inject 200 words of prose with a repeated sentence into <main> on one variant per screen; every page must fail.
// Usage: node scripts/lab-text-check.mjs [baseUrl] [--report|--strict|--negative] [--screen=persona/slug] [--no-flows]
//                                       [--workers=n] [--json=path]
import fs from "node:fs"
import { screens, flows, screenUrl, freshPage, settle, pool, arg, TERM } from "./lib/lab-gate-common.mjs"

// Full-page prose word budgets per page type. PLACEHOLDERS: to be replaced by the numbers in
// docs/knowledge/comprehension-audit-lab.md (being written 2026-10-27). Keep the keys aligned with screens.json pageType.
const BUDGET = { dashboard: 80, list: 60, detail: 120, wizard: 70, form: 70, split: 100, evaluator: 120, student: 80 }
const JACCARD = 0.6 // same-page near-duplicate threshold
const MIN_CONTENT_TOKENS = 3 // a sentence needs this many content tokens to be compared
const CROSS_PAGE_MIN = 3 // identical sentence on this many screens is reported

const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3017"
const MODE = args.includes("--negative") ? "negative" : args.includes("--strict") ? "strict" : "report"
const ONLY_SCREEN = arg(args, "screen", "")
const WORKERS = Number(arg(args, "workers", 4))
const JSON_OUT = arg(args, "json", "")
const FLOWS = !args.includes("--no-flows") && MODE !== "negative"

const reg = screens()
const typeOf = (key, v) => reg.find((s) => `${s.persona}/${s.slug}` === key)?.variants.find((x) => x.id === v)?.pageType ?? "unknown"
const CASES = []
const seenUrl = new Set()
for (const s of reg) {
  const key = `${s.persona}/${s.slug}`
  if (ONLY_SCREEN && key !== ONLY_SCREEN) continue
  for (const v of (MODE === "negative" ? s.variants.slice(0, 1) : s.variants)) {
    if (!v.file) continue
    const url = screenUrl(key, v.id)
    seenUrl.add(url)
    CASES.push({ page: `${key} ${v.id}`, key, variant: v.id, type: v.pageType ?? "unknown", url })
  }
}
if (FLOWS) for (const f of flows()) for (const set of f.sets) for (const st of f.steps) {
  if (ONLY_SCREEN && st.screen !== ONLY_SCREEN) continue
  const v = st.variants[set.id]
  const url = `/lab/flow/${f.id}/${st.id}?${new URLSearchParams({ set: set.id, term: TERM }).toString().replace(/\+/g, "%20")}`
  if (!v) continue
  CASES.push({ page: `flow ${f.id}/${st.id} set ${set.id}`, key: st.screen, variant: v, type: typeOf(st.screen, v), url, flow: true })
}

/** Runs in the page. Self-contained. Mirrors the density-budget prose rule, over the full page instead of the first viewport. */
function measure() {
  const main = document.querySelector("main") ?? document.body
  const EXCL = "[data-lab-chrome], [data-lab-bar], [data-variant-bar], [data-ds-used-panel], [data-lab-question], [data-slot=utility-bar], [data-sidebar=sidebar], [data-slot=sidebar], nav, [data-sonner-toaster]"
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return false
    const cs = getComputedStyle(el)
    return cs.visibility !== "hidden" && cs.display !== "none" && !el.closest("[aria-hidden=true]")
  }
  const dialogs = [...document.querySelectorAll("[role=dialog][data-state=open], [role=alertdialog][data-state=open]")].filter((d) => !main.contains(d) && !d.closest(EXCL))
  const modal = dialogs.length > 0 && (dialogs.some((d) => d.getAttribute("aria-modal") === "true") || document.body.style.pointerEvents === "none" || !!main.closest("[inert], [aria-hidden=true]"))
  const roots = modal ? dialogs : [main, ...dialogs]
  const skip = "button, a, label, th, td, [role=cell], [role=gridcell], [role=rowheader], [role=columnheader], [role=tab], table, [role=table], [role=grid], figure, svg, [data-figure], [data-scope-bar], h1, h2, h3, legend, [aria-label=Legend], [data-slot=badge], dt, dd, [data-viz-label], blockquote, q, [data-user-content], [data-artifact-preview], [role=tooltip], [aria-hidden=true], option, [role=option], .sr-only, " + EXCL
  const SHORT_LABEL_CTX = "[data-chart], [data-slot=chart], li, [role=listitem], [role=row]"
  let words = 0
  const sentences = []
  const sources = []
  for (const root of roots) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement
      if (!el || el.closest(skip) || !visible(el)) continue
      const text = n.textContent.trim().replace(/\s+/g, " ")
      if (!text) continue
      const tokens = text.split(/\s+/).filter((t) => !/^[\d.,%:/+()-]+$/.test(t) && /\p{L}/u.test(t))
      if (tokens.length <= 3 && el.closest(SHORT_LABEL_CTX)) continue
      words += tokens.length
      if (tokens.length) sources.push([tokens.length, text.slice(0, 90)])
      for (const s of text.split(/(?<=[.!?])\s+/)) if (s.split(/\s+/).length >= 5) sentences.push(s)
    }
  }
  sources.sort((a, b) => b[0] - a[0])
  return { words, sentences, top: sources.slice(0, 5).map(([n, t]) => `${n}: ${t}`), modal }
}

async function scrollAll(page) {
  await page.evaluate(async () => {
    const scrollers = [document.scrollingElement, ...document.querySelectorAll("main, [data-page-scroll], main *")].filter((el) => el && el.scrollHeight > el.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(el).overflowY + (el === document.scrollingElement ? "auto" : "")))
    for (const el of scrollers.slice(0, 6)) {
      for (let y = 0; y < el.scrollHeight; y += 700) { el.scrollTop = y; await new Promise((r) => setTimeout(r, 60)) }
      el.scrollTop = 0
    }
  })
  await page.waitForTimeout(300)
}

const NEG_TEXT = "This paragraph explains the page in many words so that the reader has to work through a long explanation before acting. This paragraph explains the page in many words so that the reader has to work through a long explanation before acting. " + "Each sentence here adds more explanatory prose that the page budget does not allow. ".repeat(12)
const started = Date.now()
const rows = await pool(CASES, WORKERS, async (c, browser) => {
  const { ctx, page } = await freshPage(browser, { width: 1440, height: 900 })
  try {
    await settle(page, base, c.url)
    if (MODE === "negative") await page.evaluate((t) => { const p = document.createElement("p"); p.textContent = t; (document.querySelector("main") ?? document.body).prepend(p) }, NEG_TEXT)
    await scrollAll(page)
    return { ...c, ...(await page.evaluate(measure)) }
  } finally { await ctx.close().catch(() => {}) }
}, (c, e) => ({ ...c, error: String(e?.message ?? e).split("\n")[0].slice(0, 120), words: 0, sentences: [] }))

// ---- repeats -----------------------------------------------------------------------------------------------------------------
const STOP = new Set("a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those you your we our they their he she his her them i me my not no do does did can could will would should may might must has have had than then so such into out up down over under about after before when where which who whom what why how all any each every more most other some only own same too very just also there here per via".split(" "))
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim()
const content = (s) => new Set(norm(s).split(" ").filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t)))
const jac = (a, b) => { let i = 0; for (const t of a) if (b.has(t)) i++; return i / (a.size + b.size - i || 1) }
for (const r of rows) {
  r.samePage = []
  const ss = (r.sentences ?? []).map((s) => ({ s, t: content(s) })).filter((x) => x.t.size >= MIN_CONTENT_TOKENS)
  for (let i = 0; i < ss.length; i++) for (let j = i + 1; j < ss.length; j++) {
    const k = jac(ss[i].t, ss[j].t)
    if (k >= JACCARD) r.samePage.push({ j: k, a: ss[i].s, b: ss[j].s })
  }
  r.budget = BUDGET[r.type]
  r.over = r.budget ? r.words - r.budget : 0
  r.sentenceCount = (r.sentences ?? []).length
}
const cross = new Map()
for (const r of rows) for (const s of new Set((r.sentences ?? []).map(norm))) {
  if (s.split(" ").length < 5) continue
  if (!cross.has(s)) cross.set(s, new Set())
  cross.get(s).add(r.key)
}
const crossRepeats = [...cross.entries()].filter(([, ks]) => ks.size >= CROSS_PAGE_MIN).sort((a, b) => b[1].size - a[1].size)

// ---- report ------------------------------------------------------------------------------------------------------------------
const short = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s)
console.log(`\nTEXT CHECK (${MODE}) against ${base}: ${rows.length} pages, ${((Date.now() - started) / 1000).toFixed(0)}s. Budgets (placeholder): ${JSON.stringify(BUDGET)}\n`)
const errs = rows.filter((r) => r.error)
const over = rows.filter((r) => r.over > 0).sort((a, b) => b.over - a.over)
const worst = [...rows].filter((r) => !r.error).sort((a, b) => (b.over - a.over) || (b.words - a.words)).slice(0, 20)
console.log("Worst 20 pages\n\n| page | type | words | budget | over | sentences | same-page repeats | biggest text nodes |\n|---|---|---|---|---|---|---|---|")
for (const r of worst) console.log(`| ${r.page} | ${r.type} | ${r.words} | ${r.budget ?? "-"} | ${r.over > 0 ? `+${r.over}` : r.over} | ${r.sentenceCount} | ${r.samePage.length} | ${short((r.top ?? []).slice(0, 2).join(" / "), 140)} |`)
const withRepeats = rows.filter((r) => r.samePage.length)
console.log(`\nSame-page repeats (Jaccard >= ${JACCARD}): ${withRepeats.reduce((n, r) => n + r.samePage.length, 0)} on ${withRepeats.length} pages`)
for (const r of withRepeats) for (const p of r.samePage) console.log(`  - ${r.page} (${p.j.toFixed(2)}): "${short(p.a, 90)}"  ~  "${short(p.b, 90)}"`)
if (MODE !== "negative") {
  console.log(`\nCross-page repeats (identical sentence on ${CROSS_PAGE_MIN}+ screens): ${crossRepeats.length}`)
  for (const [s, ks] of crossRepeats) console.log(`  - ${ks.size} screens: "${short(s, 110)}"  [${[...ks].join(", ")}]`)
}
if (errs.length) { console.log(`\nPages that did not load: ${errs.length}`); for (const r of errs) console.log(`  - ${r.page}: ${r.error}`) }
console.log(`\nSummary: ${over.length} of ${rows.length} pages over budget; ${withRepeats.length} pages with same-page repeats; ${crossRepeats.length} cross-page repeated sentences`)
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ mode: MODE, rows, crossRepeats: crossRepeats.map(([s, k]) => ({ s, screens: [...k] })) }, null, 1))
const failing = rows.filter((r) => r.over > 0 || r.samePage.length || r.error)
if (MODE === "negative") {
  const leaked = rows.filter((r) => !r.error && !(r.over > 0 && r.samePage.length))
  console.log(leaked.length || !rows.length ? `\nNEGATIVE CONTROL BROKEN: ${leaked.length} padded page(s) passed: ${leaked.map((r) => r.page).join(", ")}` : `\nNEGATIVE CONTROL OK: all ${rows.length} padded pages failed both the budget and the repeat check`)
  process.exit(leaked.length || !rows.length ? 1 : 0)
}
if (MODE === "strict") { console.log(failing.length ? `\nTEXT CHECK FAILED (strict): ${failing.length} page(s)` : "\nTEXT CHECK PASSED (strict)"); process.exit(failing.length ? 1 : 0) }
console.log("\nTEXT CHECK report only (exit 0). Use --strict to block on over-budget pages and same-page repeats.")
