#!/usr/bin/env node
// Page anatomy check for every lab screen and variant (Romit 2026-10-30: "unnecessary subtext, filters buttons at wrong
// places, dense text ... ensure that every page doesn't have these issues"). It enforces "subtitle default none" and
// "say it once" (strategy/07, design brief content budgets) on the RENDERED page, not the source.
//
// Usage (from apps/skills-checklist/admin, dev server running on :3017):
//   node scripts/lab-anatomy-check.mjs [baseUrl] [--report|--strict] [--json=path] [--screen=persona/slug[/V],...]
//        [--only=A1,A4] [--url=/lab/...] [--workers=n] [--no-extras]
//   --report  (default) prints the table and counts, exit 0.
//   --strict  exit 1 when any violation is not in scripts/anatomy-allow.json.
//   --url     check one arbitrary lab URL instead of the registry (persona is read from the path).
// Cases: every variant in lib/lab/screens.json at its default URL (?variant=X&term=Fall%202026), 1440 x 900, clean
// storage; student, evaluator and course-faculty also at 375 x 812. EXTRAS adds drill states reached only by URL params
// (the admin dashboard C records list Romit flagged on 2026-10-30).
//
// RULES (first viewport = top 900 px at 1440, 812 px at 375; lab chrome, sidebar and utility bar excluded):
//  A1 subtitle          Text under the page h1 inside the same header block (DS PageHeader subtitle slot, or any non-control
//                       text in the h1's header container) that is not a control. Allowed only via anatomy-allow.json.
//  A2 title-mismatch    On a drill or detail page (a body breadcrumb with 2+ crumbs, or a list=/row= URL param) the h1 equals
//                       the first (parent) crumb or the persona's active nav label: the title names where you came from.
//  A3 breadcrumb        A breadcrumb inside the page body whose top is below the h1's top, or any body breadcrumb when the
//                       shell utility bar already shows one (it always does on staff and student shells).
//  A4 lone-filter       A Filters / Filter / Sort / View / Columns / Search control whose visual row (+-8 px) holds nothing
//                       but filter chips, Clear all and other filter controls, and that is NOT in the toolbar of a table,
//                       grid, figure, chart or list (no ancestor within 3 levels contains one). Reports the gap to the table.
//  A5 repeated-number   A number >= 10 ("1,547" = "1547") in 2+ separate text blocks of the first viewport. Not counted:
//                       table body cells, chart text (svg, [data-viz-label]), years 1900-2099, times, sr-only text.
//  A6 restated-heading  An h2/h3/h4/p/[role=heading] whose content words overlap the h1 or the last crumb by 70% or more
//                       (overlap coefficient over content words, both sides 2+ words).
//  A7 banned-word       records, items, entries, entry, pending, ticket, reject(ed), fail(ed), retake, "Reopen to edit",
//                       "AI-powered", "Updated just now / N min ago / HH:MM" in non-table text (glossary.md "Not" column and brief banned list).
//  A8 dense-text        A prose block over 25 words, or more than 2 prose sentences above the first table or chart.
//                       Prose excludes headings, controls, labels, badges, tables, figures, quoted user content and
//                       [data-artifact-preview].
//  A9 duplicate-entry   More than one filter entry (Filters, Add filter, filter icon, Sort and filter) or more than one
//                       search entry (search box or search icon) for the same table or chart. Reports every control.
//  A10 clipped          A table cell cut by the table edge, a table wider than its container with no visible scroll cue,
//                       or text cut inside its own box (overflow hidden, no title). Added 2026-10-30.
//  A11 single-action    A menu trigger in the page header ("More", "…", ellipsis icon, aria-haspopup=menu) whose open menu
//      menu             holds exactly one action; that action should be a button (Romit 2026-10-30, ledger D-L8b).
//  A12 mangled-text     A word broken across two lines in a table header or cell (or hyphens:auto / break-all on table
//                       text); a "truncated identifier" (ellipsis on a row's name, even with a title); a group key repeated
//                       in 80%+ of its rows' second line. Added 2026-10-30.
//  D-L8b (2026-10-30) reversed D-L8: the scope subtitle is a plain A1, a lone Filters row a plain A4, and "Updated just
//  now", "Updated N min ago" and "Updated HH:MM" are A7 banned words.
import fs from "node:fs"
import path from "node:path"
import { ADMIN_ROOT, chromium, screens, screenUrl, pool, arg } from "./lib/lab-gate-common.mjs"

const args = process.argv.slice(2)
const BASE = args.find((a) => a.startsWith("http")) ?? "http://localhost:3017"
const STRICT = args.includes("--strict")
const JSON_OUT = arg(args, "json", null)
const ONLY = (arg(args, "only", "") || "").split(",").filter(Boolean)
const SCREENS = (arg(args, "screen", "") || "").split(",").filter(Boolean)
const ONE_URL = arg(args, "url", null)
const WORKERS = Number(arg(args, "workers", 3))
const ALLOW_PATH = path.join(ADMIN_ROOT, "scripts/anatomy-allow.json")
const PHONE = new Set(["student", "evaluator", "course-faculty"])
// Drill states reachable only by URL params. Each is checked at 1440 like its screen.
const EXTRAS = [
  { key: "admin/dashboard", variant: "C", params: { list: "records" }, note: "records drill (flagged 2026-10-30)" },
  { key: "admin/dashboard-drill", variant: "A", params: { list: "skills" }, note: "skills list" },
  { key: "admin/dashboard-drill", variant: "B", params: { list: "skills" }, note: "skills list" },
]
const RULE_NAME = { A1: "subtitle", A2: "title-mismatch", A3: "breadcrumb", A4: "lone-filter", A5: "repeated-number", A6: "restated-heading", A7: "banned-word", A8: "dense-text", A9: "duplicate-entry", A10: "clipped", A11: "single-action-menu", A12: "mangled-text" }

// ---- Cases
let CASES = []
if (ONE_URL) {
  // A file: or http: URL is a fixture (scripts/fixtures/anatomy-*.html), checked at 1440 as "fixture/<name>".
  const isAbs = /^(file|https?):/.test(ONE_URL)
  const persona = isAbs ? "fixture" : ONE_URL.split("/")[2] ?? "admin"
  const key = isAbs ? `fixture/${ONE_URL.split("/").pop().split("?")[0]}` : ONE_URL.split("?")[0].split("/").slice(2, 4).join("/")
  const variant = new URL(ONE_URL, BASE).searchParams.get("variant") ?? "?"
  for (const vp of PHONE.has(persona) ? [[1440, 900], [375, 812]] : [[1440, 900]]) CASES.push({ key, variant, url: ONE_URL, w: vp[0], h: vp[1], note: "url" })
} else {
  for (const s of screens()) {
    const key = `${s.persona}/${s.slug}`
    for (const v of s.variants) {
      if (!v.file) continue
      const id = `${key}/${v.id}`
      if (SCREENS.length && !SCREENS.some((o) => o === key || o === id)) continue
      const vps = PHONE.has(s.persona) ? [[1440, 900], [375, 812]] : [[1440, 900]]
      for (const [w, h] of vps) CASES.push({ key, variant: v.id, url: screenUrl(key, v.id), w, h, note: "" })
    }
  }
  if (!args.includes("--no-extras")) for (const x of EXTRAS) {
    if (SCREENS.length && !SCREENS.some((o) => o === x.key || o === `${x.key}/${x.variant}`)) continue
    CASES.push({ key: x.key, variant: x.variant, url: screenUrl(x.key, x.variant, x.params), w: 1440, h: 900, note: x.note })
  }
}

// ---- Settle. Own version: lab-gate-common's settle waits on "main, [data-page-type], body > div", and the first match is
// now Next's hidden <div hidden>, so it times out (found 2026-10-30). We wait for a visible h1 instead.
async function load(page, url) {
  let last
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      try { await page.goto(/^(file|https?):/.test(url) ? url : BASE + url, { waitUntil: "load", timeout: 240000 }) } catch (e) { if (!String(e).includes("ERR_ABORTED")) throw e }
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" }).catch(() => {})
      await page.waitForSelector("h1:visible, main:visible", { timeout: 90000 })
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
      for (let k = 0; k < 12; k++) { if (!(await page.$("main [data-slot=skeleton]"))) break; await page.waitForTimeout(500) }
      await page.waitForTimeout(900)
      return
    } catch (e) { last = e }
  }
  throw last
}

/** Runs in the page; self-contained. Returns raw findings [{ rule, text, where }]. */
function inspect({ FOLD, URLQ, DEBUG }) {
  const out = []
  const add = (rule, text, where) => out.push({ rule, text: String(text).replace(/\s+/g, " ").trim().slice(0, 140), where })
  const EXCL = "[data-lab-chrome], [data-slot=utility-bar], [data-sidebar=sidebar], [data-slot=sidebar], [data-slot=sidebar-container], nav[data-slot=utility-bar]"
  const excluded = (el) => !!el.closest(EXCL)
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width <= 1 || r.height <= 1) return false
    const cs = getComputedStyle(el)
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return false
    if (el.closest(".sr-only, [aria-hidden=true]")) return false
    return true
  }
  const above = (el) => { const r = el.getBoundingClientRect(); return r.top < FOLD && r.bottom > 0 }
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim()
  const lc = (s) => norm(s).toLowerCase()
  const STOP = new Set("a an the of in on for to and or with by at is are this that your you from as be it its into all".split(" "))
  const words = (s) => lc(s).replace(/(\d),(\d)/g, "$1$2").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w))
  const sel = (el) => {
    const slot = el.getAttribute("data-slot"); const region = el.closest("[data-region]")?.getAttribute("data-region")
    return `${el.tagName.toLowerCase()}${slot ? `[data-slot=${slot}]` : ""}${region ? ` in [data-region=${region}]` : ""}`
  }
  const main = document.querySelector("main") ?? document.body
  const roots = [main, ...[...document.querySelectorAll("[role=dialog][data-state=open]")].filter((d) => !main.contains(d) && !excluded(d))]
  const h1 = [...document.querySelectorAll("h1")].find((h) => !excluded(h) && visible(h))
  const h1Text = h1 ? norm(h1.textContent) : ""
  const h1Top = h1 ? h1.getBoundingClientRect().top : 0
  const CONTROL = "button, a[data-slot=button], input, select, textarea, [role=button], [role=combobox], [role=tab], [role=tablist], [role=switch], [role=checkbox], [role=radio], [role=radiogroup]"
  const TABLEISH = "table, [role=table], [role=grid], [data-slot=table], [data-slot=data-table], figure, [data-chart], [data-slot=chart], [data-slot=chart-card], ul, ol, [role=list], [role=radiogroup], [role=listbox]"
  // A preview of what another person sees (student card, evaluator form, email) repeats the record's name and numbers on
  // purpose; it is an artifact, not interface copy (density-budget "Previews" rule). Tuned 2026-10-30 after configure-skill
  // A/B/C reported the skill name in the Preview panel as a restated heading.
  const inPreview = (el) => {
    if (el.closest("[data-artifact-preview], [data-region=preview]")) return true
    for (let a = el.parentElement, i = 0; a && a !== main && i < 6; a = a.parentElement, i++) {
      if (/preview/i.test(a.getAttribute("aria-label") || "")) return true
      const first = a.querySelector(":scope > h2, :scope > h3, :scope > h4, :scope > p, :scope > div > h2, :scope > div > h3")
      if (first && /^preview\b/i.test(norm(first.textContent))) return true
    }
    return false
  }

  // ---- Breadcrumbs: the shell one (utility bar) and any in the body.
  const crumbsOf = (nav) => [...nav.querySelectorAll("li[data-slot=breadcrumb-item], [data-slot=breadcrumb-item], li")].map((li) => norm(li.textContent)).filter(Boolean)
  const allBc = [...document.querySelectorAll("nav[aria-label*=readcrumb i], [data-slot=breadcrumb]")].filter((n) => n.matches("nav, [data-slot=breadcrumb]"))
  const shellBc = allBc.find((n) => n.closest("[data-slot=utility-bar], nav[data-slot=utility-bar]") && visible(n))
  const bodyBc = allBc.filter((n) => !n.closest("[data-slot=utility-bar]") && !n.closest("[data-lab-chrome]") && roots.some((r) => r.contains(n)) && visible(n))
    .filter((n, i, a) => !a.some((o, j) => j !== i && o.contains(n)))
  const bodyCrumbs = bodyBc.length ? crumbsOf(bodyBc[0]) : []
  const lastCrumb = bodyCrumbs.length ? bodyCrumbs[bodyCrumbs.length - 1] : ""

  // ---- A1 subtitle
  if (h1) {
    const header = h1.closest("[data-slot=page-header]") ?? h1.closest("header") ?? h1.parentElement
    const subs = new Set()
    for (const s of header.querySelectorAll("[data-slot=page-header-subtitle], [data-slot=page-header-description]")) if (visible(s)) subs.add(s)
    // Non-PageHeader shells (student, evaluator): text siblings right under the h1 in its own container.
    if (!h1.closest("[data-slot=page-header]")) {
      let box = h1.parentElement
      // Climb while the parent only wraps the h1 (title wrappers).
      while (box && box.children.length === 1 && box !== main) box = box.parentElement
      if (box && box !== main) {
        let sib = (h1.parentElement === box ? h1 : [...box.children].find((c) => c.contains(h1)))?.nextElementSibling
        for (; sib; sib = sib.nextElementSibling) {
          if (!visible(sib)) continue
          if (sib.matches(CONTROL) || sib.querySelector(CONTROL) || sib.querySelector(TABLEISH) || sib.matches("nav, [data-slot=breadcrumb]")) break
          const gap = sib.getBoundingClientRect().top - h1.getBoundingClientRect().bottom
          if (gap > 24) break
          if (norm(sib.innerText)) subs.add(sib)
        }
      }
    }
    // Ledger D-L8b (Romit 2026-10-30) reversed D-L8: no header subtitle and no "Updated" time on any page, so the scope
    // subtitle is a plain A1 (no tag, no softening).
    // Filler between the title and the first content region (added 2026-10-30 after student/my-requests A passed with an
    // icon-led "Evaluators sign through a link, no account needed." line in the body, right under the header). Any
    // non-control text block below the header that sits above every content region (tabs, toolbar, filter bar, table,
    // card, chart, form, list, section heading, scope bar, region) and is not inside one counts as a subtitle.
    const hb = (h1.closest("[data-slot=page-header]") ?? h1).getBoundingClientRect().bottom
    const CONTENT = "[role=tablist], [data-slot=filter-bar], [role=toolbar], [data-region], [data-slot=card], table, [role=table], [role=grid], figure, [data-chart], form, section, ul, ol, [role=list], [data-scope-bar], h2, h3, input, select, textarea, [role=radiogroup], [role=alert], [role=status], [data-slot=local-banner], nav, [data-slot=breadcrumb]"
    const contents = roots.flatMap((r) => [...r.querySelectorAll(CONTENT)]).filter((c) => visible(c) && !excluded(c) && c.getBoundingClientRect().top >= hb - 1)
    const between = new Set()
    for (const r of roots) {
      const tw = document.createTreeWalker(r, NodeFilter.SHOW_TEXT)
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.nodeValue.trim()) continue
        const el = n.parentElement
        if (!el || excluded(el) || !visible(el) || header.contains(el) || el.closest(`button, a, label, [role=button], ${CONTENT}`)) continue
        let b = el; while (b && getComputedStyle(b).display.startsWith("inline") && b.parentElement) b = b.parentElement
        const top = b.getBoundingClientRect().top
        if (top < hb - 1 || top > FOLD) continue
        if (contents.some((c) => c.contains(b) || c.getBoundingClientRect().top <= top + 1)) continue
        // Report the whole line ("Sputum · 1 of 35 waiting · Next submission"), not its pieces: climb to the highest
        // ancestor that still holds no content region and starts below the header.
        let up = b
        while (up.parentElement && !roots.includes(up.parentElement) && up.parentElement !== main && !up.parentElement.contains(header)
          && up.parentElement.getBoundingClientRect().top >= hb - 1 && !up.parentElement.querySelector(CONTENT) && !up.parentElement.matches(CONTENT)) up = up.parentElement
        between.add(up)
      }
    }
    for (const b of between) if (![...subs].some((s) => s.contains(b) || b.contains(s))) subs.add(b)
    for (const s of subs) add("A1", norm(s.innerText), sel(s))
  }

  // ---- A2 title mismatch
  const drill = bodyCrumbs.length >= 2 || /(^|&)(list|row)=/.test(URLQ)
  if (h1 && drill) {
    const active = document.querySelector("[data-sidebar=menu-button][data-active=true], [data-sidebar] a[aria-current=page], [data-slot=sidebar] a[aria-current=page]")
    const navLabel = active ? norm(active.textContent).replace(/\d+$/, "").trim() : ""
    const strip = (s) => lc(s).replace(/\(\s*[\d,]+\s*\)/g, "").trim()
    if (bodyCrumbs.length >= 2 && strip(bodyCrumbs[0]) === strip(h1Text)) add("A2", `h1 "${h1Text}" = parent crumb "${bodyCrumbs[0]}"; page is "${lastCrumb}"`, "h1")
    else if (navLabel && strip(navLabel) === strip(h1Text)) add("A2", `h1 "${h1Text}" = nav label on a drill URL`, "h1")
  }

  // ---- A3 breadcrumb placement
  for (const n of bodyBc) {
    const t = crumbsOf(n).join(" > ")
    const below = h1 && n.getBoundingClientRect().top > h1Top + 1
    if (below) add("A3", `body breadcrumb "${t}" sits below the h1${shellBc ? "; shell already shows one" : ""}`, sel(n))
    else if (shellBc) add("A3", `body breadcrumb "${t}" duplicates the shell breadcrumb`, sel(n))
  }

  // ---- A4 lone filter row
  // "View" only as the bare control name or "View by": "View request" is an action, not a view switch (tuned 2026-10-30).
  const FILTER_RX = /^(filters?(\s+\d+(\s+applied)?)?|sort( by\b.*)?|view( by\b.*)?|columns|add filter|more filters)$|^search\b/i
  const CHIP_RX = /^(clear( all)?|reset)\b/i
  const isFilterish = (el) => {
    const t = norm(el.getAttribute("aria-label") || el.innerText || el.getAttribute("placeholder") || "")
    if (FILTER_RX.test(t) || CHIP_RX.test(t)) return true
    if (el.matches("input[type=search], input[placeholder^=Search i]")) return true
    if (/^remove\b/i.test(el.getAttribute("aria-label") || "")) return true
    if (el.closest("[data-slot=filter-chip], [data-filter-chip], [data-slot=badge]")) return true
    return false
  }
  const tables = roots.flatMap((r) => [...r.querySelectorAll("table, [role=table], [role=grid], [data-chart], [data-slot=chart], figure")]).filter((t) => visible(t) && !excluded(t))
  const filterCtrls = roots.flatMap((r) => [...r.querySelectorAll("button, input, [role=combobox], a[data-slot=button]")])
    .filter((el) => !excluded(el) && visible(el) && above(el) && !el.closest("table, [role=grid], [role=dialog] [role=grid]"))
    .filter((el) => { const t = norm(el.getAttribute("aria-label") || el.innerText || el.getAttribute("placeholder") || ""); return FILTER_RX.test(t) || el.matches("input[type=search], input[placeholder^=Search i]") })
  const seenRows = new Set()
  for (const c of filterCtrls) {
    const cr = c.getBoundingClientRect(); const cy = (cr.top + cr.bottom) / 2
    // In a toolbar: an ancestor within 4 levels also holds a table, grid, figure, chart or list that starts within 64 px
    // below the control (or beside it), with no heading or breadcrumb between them. (A page-wide wrapper holds every table,
    // so containment alone is not enough: the 2026-10-30 flagged drill had its scope bar 120 px and a breadcrumb above the table.)
    let a = c.parentElement, inToolbar = false
    const between = (top, bottom) => roots.some((r) => [...r.querySelectorAll("h1, h2, h3, nav, [data-slot=breadcrumb]")].some((h) => { if (!visible(h) || excluded(h)) return false; const hr = h.getBoundingClientRect(); return hr.top >= top - 1 && hr.bottom <= bottom + 1 }))
    for (let i = 0; i < 4 && a && a !== main; i++, a = a.parentElement) {
      const near = [...a.querySelectorAll(TABLEISH)].filter((t) => !t.contains(c) && visible(t) && !t.closest("[role=menu], [role=listbox], nav, [data-slot=breadcrumb]") && !(t.matches("ul, ol") && t.querySelectorAll(":scope > li").length < 3))
        .some((t) => { const tr = t.getBoundingClientRect(); const gap = tr.top - cr.bottom; const beside = tr.top <= cr.bottom && tr.bottom >= cr.top; return beside || (gap >= -2 && gap <= 64 && !between(cr.bottom, tr.top)) })
      if (near) { inToolbar = true; break }
    }
    if (inToolbar) continue
    // A search box with no table, grid or chart below it searches a picker or card list it sits on: that is its toolbar
    // (tuned 2026-10-30: evaluator pickers and "Search 145 skills" in Log a skill were reported as lone rows).
    const isSearch = c.matches("input") || /^search\b/i.test(norm(c.getAttribute("aria-label") || c.innerText || ""))
    if (isSearch && !tables.some((t) => t.getBoundingClientRect().top > cr.bottom)) continue
    // The visual row: interactive or text leaves whose vertical centre is within 8 px.
    const leaves = roots.flatMap((r) => [...r.querySelectorAll("button, a, input, select, [role=combobox], [role=tab], h1, h2, h3, p, span, label, li")])
      .filter((el) => !excluded(el) && visible(el) && el !== c && !c.contains(el) && !el.contains(c))
      .filter((el) => { const r = el.getBoundingClientRect(); return Math.abs((r.top + r.bottom) / 2 - cy) <= 8 && r.height < 80 })
      .filter((el) => el.matches("button, a, input, select, [role=combobox], [role=tab]") || (norm(el.innerText) && ![...el.children].some((k) => norm(k.innerText))))
    const others = leaves.filter((el) => !(el.closest("button, a, [role=combobox]") && isFilterish(el.closest("button, a, [role=combobox]"))) && !isFilterish(el))
    if (others.length) continue
    const rowKey = Math.round(cy / 10)
    if (seenRows.has(rowKey)) continue
    seenRows.add(rowKey)
    const nextT = tables.map((t) => t.getBoundingClientRect().top - cr.bottom).filter((d) => d >= 0).sort((x, y) => x - y)[0]
    add("A4", `"${norm(c.getAttribute("aria-label") || c.innerText || c.getAttribute("placeholder"))}" alone on its row; ${nextT == null ? "no table or chart below" : `${Math.round(nextT)} px above the table/chart`}`, sel(c))
  }

  // ---- Text blocks of the first viewport (A5, A7, A8)
  const NOT_TEXT = "table, [role=table], [role=grid], [role=row], svg, [data-viz-label], [data-chart] text, script, style, [data-user-content], blockquote, q, [data-artifact-preview], [role=tooltip], .sr-only"
  const blockOf = (node) => { let e = node.parentElement; while (e && getComputedStyle(e).display.startsWith("inline") && e.parentElement) e = e.parentElement; return e }
  const blocks = new Map()
  for (const r of roots) {
    const tw = document.createTreeWalker(r, NodeFilter.SHOW_TEXT)
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const t = n.nodeValue.trim(); if (!t) continue
      const el = n.parentElement; if (!el || excluded(el) || el.closest(NOT_TEXT) || !visible(el) || !above(el)) continue
      const b = blockOf(n); if (!b) continue
      if (!blocks.has(b)) blocks.set(b, [])
      blocks.get(b).push(n)
    }
  }
  const blockText = (b) => norm(blocks.get(b).map((n) => n.nodeValue).join(" "))

  // A5 repeated numbers
  const nums = new Map()
  for (const b of blocks.keys()) {
    // Tuned 2026-10-30 (hand review): drill links and buttons carry their count on purpose ("View the 28", "All 31": the
    // link's length equals its figure), pagination ("1–10 of 28"), list rows (two cards with the same count are not a
    // repeat), previews, and a bare number outside a KPI (heat-grid cell, badge) are not counted. Dates are dropped.
    if ((b.closest("[role=tab], [role=option], [role=menu], button, a, li, [role=listitem], [data-slot=pagination], [data-slot=badge]") && !b.closest("[data-slot=breadcrumb-page]")) || inPreview(b)) continue
    const raw = blockText(b)
    if (/^[\d,.%+]+$/.test(raw) && !b.closest("[data-figure], [data-slot=key-metrics]")) continue
    const t = raw.replace(/\b\d{1,2}:\d{2}\b/g, " ").replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, " ")
      .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.? \d{1,2}\b/g, " ").replace(/\b\d+\s*[–-]\s*\d+ of \d+\b/g, " ")
    for (const m of t.matchAll(/(?<![\d.,])\d{1,3}(?:,\d{3})+(?![\d,])|(?<![\d.,])\d+(?![\d,])/g)) {
      const v = Number(m[0].replace(/,/g, ""))
      if (v < 10 || (v >= 1900 && v <= 2099 && !m[0].includes(","))) continue
      if (!nums.has(v)) nums.set(v, [])
      const arr = nums.get(v)
      if (!arr.some((x) => x.b === b || x.b.contains(b) || b.contains(x.b))) arr.push({ b, t })
    }
  }
  for (const [v, arr] of nums) if (arr.length >= 2) add("A5", `${v.toLocaleString("en-US")} appears ${arr.length}x: ${arr.map((x) => `"${x.t.slice(0, 40)}"`).join(" | ")}`, arr.map((x) => sel(x.b)).join(" | "))

  // A5 small repeats (added 2026-10-30 on student/skill-detail A: "In progress (2 of 3)" and "Evaluations 2 of 3";
  // "Attempts 3" beside the select "All courses (3)").
  // (a) An "n of m" fraction of any size in 2+ separate text blocks. Badges count here (a status pill restating a figure
  //     is the repeat); tabs, menus, pagination, table cells and previews do not.
  // Own text walk: [data-viz-label] is excluded from the shared blocks (chart names), but a status line such as
  // "In progress (2 of 3)" carries that attribute outside any chart (found on skill-detail A, 2026-10-30).
  const fr = new Map()
  const FR_SKIP = "table, [role=table], [role=grid], svg, figure, [data-chart], script, style, [data-user-content], blockquote, q, [role=tooltip], .sr-only, [role=tab], [role=option], [role=menu], [data-slot=pagination]"
  const frBlocks = new Map()
  for (const r of roots) {
    const tw = document.createTreeWalker(r, NodeFilter.SHOW_TEXT)
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.nodeValue.trim()) continue
      const el = n.parentElement; if (!el || excluded(el) || el.closest(FR_SKIP) || !visible(el) || !above(el) || inPreview(el)) continue
      const b = blockOf(n); if (!b) continue
      frBlocks.set(b, (frBlocks.get(b) ?? "") + " " + n.nodeValue)
    }
  }
  for (const [b, raw] of frBlocks) {
    const text = norm(raw)
    for (const m of text.matchAll(/\b(\d+) of (\d+)\b/g)) {
      const k = `${m[1]} of ${m[2]}`
      if (!fr.has(k)) fr.set(k, [])
      const arr = fr.get(k)
      if (!arr.some((x) => x.b === b || x.b.contains(b) || b.contains(x.b))) arr.push({ b, t: text })
    }
  }
  // A fraction repeated only across the rows of ONE list ("0 of 1" on every card) is row data, not a repeat: skipped.
  // Stat lists (ul of label + value, "Evaluations 2 of 3") still count when the twin sits outside that list.
  const listOf = (b) => b.closest("ul, ol, [role=list], tbody")
  if (DEBUG) for (const [k, arr] of fr) out.push({ rule: "debug", text: `A5 fraction "${k}" in ${arr.length} block(s): ${arr.map((x) => x.t.slice(0, 30)).join(" | ")}`, where: "" })
  for (const [k, arr] of fr) if (arr.length >= 2 && !(listOf(arr[0].b) && arr.every((x) => listOf(x.b) === listOf(arr[0].b)))) add("A5", `"${k}" appears ${arr.length}x: ${arr.map((x) => `"${x.t.slice(0, 40)}"`).join(" | ")}`, arr.map((x) => sel(x.b)).join(" | "))
  // (b) A bare count under 10 is exempt, unless it is a count beside a heading ("Attempts 3") or inside a control label
  //     ("All courses (3)") and another such count shows the same number.
  const counts = []
  for (const h of roots.flatMap((r) => [...r.querySelectorAll("h2, h3, h4, [role=heading]")]).filter((h) => !excluded(h) && visible(h) && above(h) && !h.closest("[role=tab]"))) {
    const own = norm(h.innerText).match(/\s(\d+)$/)
    const sib = h.nextElementSibling && visible(h.nextElementSibling) ? norm(h.nextElementSibling.innerText).match(/^\(?(\d+)\)?$/) : null
    const v = own?.[1] ?? sib?.[1]
    if (v) counts.push({ v, t: `${norm(h.innerText)}${sib && !own ? " " + sib[1] : ""}`, el: h })
  }
  for (const c of roots.flatMap((r) => [...r.querySelectorAll("button, [role=combobox], select")]).filter((c) => !excluded(c) && visible(c) && above(c) && !c.closest("[role=tab], table, [role=grid]"))) {
    const m = norm(c.innerText || c.getAttribute("aria-label") || "").match(/\((\d+)\)\s*$/)
    if (m) counts.push({ v: m[1], t: norm(c.innerText), el: c })
  }
  const byV = counts.reduce((m, c) => ((m[c.v] ??= []).push(c), m), {})
  for (const [v, arr] of Object.entries(byV)) if (Number(v) < 10 && arr.length >= 2 && !arr.every((x) => x.el === arr[0].el)) add("A5", `count ${v} shown ${arr.length}x: ${arr.map((x) => `"${x.t.slice(0, 40)}"`).join(" | ")}`, arr.map((x) => sel(x.el)).join(" | "))

  // A6 restated heading
  const overlap = (a, b) => { const A = new Set(words(a)), B = new Set(words(b)); if (A.size < 2 || B.size < 2) return 0; let k = 0; for (const w of A) if (B.has(w)) k++; return k / Math.min(A.size, B.size) }
  const heads = roots.flatMap((r) => [...r.querySelectorAll("h2, h3, h4, p, [role=heading]")]).filter((el) => el !== h1 && !excluded(el) && visible(el) && above(el) && !el.closest("nav, [data-slot=breadcrumb], table, [role=grid], [data-slot=page-header-subtitle]"))
  for (const el of heads) {
    if (inPreview(el)) continue
    const t = norm(el.innerText); if (!t || t.length > 140) continue
    const ref = overlap(t, h1Text) >= 0.7 ? `h1 "${h1Text}"` : lastCrumb && overlap(t, lastCrumb) >= 0.7 ? `crumb "${lastCrumb}"` : null
    if (ref) add("A6", `"${t}" restates ${ref}`, sel(el))
  }

  // A7 banned words
  const BANNED = [
    [/\brecords\b/i, "records"], [/\bitems?\b/i, "items"], [/\bentries\b/i, "entries"], [/\bentry\b/i, "entry"], [/\bpending\b/i, "pending"],
    [/\btickets?\b/i, "ticket"], [/\breject(ed|s)?\b/i, "reject"], [/\bfail(ed|s)?\b/i, "fail"], [/\bretakes?\b/i, "retake"],
    [/\breopen to edit\b/i, "Reopen to edit"], [/\bAI-powered\b/i, "AI-powered"], [/\bupdated just now\b/i, "Updated just now"], [/\bupdated \d+ (min|mins|minutes?|hours?|hrs?) ago\b/i, "Updated N min ago"], [/\bupdated (at )?\d{1,2}:\d{2}\b/i, "Updated HH:MM"],
  ]
  for (const b of blocks.keys()) {
    const t = blockText(b)
    for (const [rx, w] of BANNED) if (rx.test(t)) add("A7", `"${w}" in "${t.slice(0, 90)}"`, sel(b))
  }

  // A8 dense text
  const NOT_PROSE = "h1, h2, h3, h4, h5, h6, [role=heading], button, a, label, legend, [data-slot=badge], [data-slot=status-badge], [role=status] [data-slot=badge], dt, dd, [role=tab], [role=option], [data-scope-context], [data-slot=breadcrumb], input, select, [data-figure], [data-slot=key-metrics]"
  // Subtitles are A1's job, previews are artifacts; neither is counted as prose here.
  const prose = [...blocks.keys()].filter((b) => !b.closest(NOT_PROSE) && !b.matches(NOT_PROSE) && !b.closest("[data-slot=page-header-subtitle]") && !inPreview(b))
  const firstViz = tables.filter((t) => above(t)).map((t) => t.getBoundingClientRect().top).sort((x, y) => x - y)[0] ?? FOLD
  let sentences = 0
  const sentenceSrc = []
  for (const b of prose) {
    const t = blockText(b); const n = t.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length
    if (n > 25) add("A8", `${n} words: "${t.slice(0, 100)}"`, sel(b))
    // A sentence is text that ends in . ! or ? and has 5+ words; labels, names and "Draft saved" status lines do not
    // count (tuned 2026-10-30: unpunctuated skill names and status lines were counted as sentences).
    if (b.getBoundingClientRect().top < firstViz && n >= 5) {
      const s = t.split(/(?<=[.!?])\s+/).filter((x) => /[.!?]$/.test(x) && x.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length >= 5).length
      if (s) { sentences += s; sentenceSrc.push(t.slice(0, 40)) }
    }
  }
  if (sentences > 2) add("A8", `${sentences} prose sentences above the first table or chart: ${sentenceSrc.slice(0, 4).map((x) => `"${x}"`).join(" | ")}`, "page")
  // ---- A9 duplicate filter or search entry points (added 2026-10-30 on the coordinator's review of dashboard C records:
  // a scope "Filters 1", a dashed "+ Add filter" and a toolbar filter icon all filtered one table).
  const iconOf = (el) => [...el.querySelectorAll("i, svg")].map((i) => String(i.getAttribute("class") || "") + " " + (i.getAttribute("data-icon") || "")).join(" ")
  const labelOf = (el) => norm(el.getAttribute("aria-label") || el.innerText || el.getAttribute("placeholder") || el.getAttribute("title") || "")
  const entryKind = (el) => {
    const t = labelOf(el), ic = iconOf(el)
    if (/^(filters?|add filter|more filters|sort and filter|filter and sort)\b/i.test(t) || /fa-filter|fa-sliders|filter/i.test(ic)) return "filter"
    if (el.matches("input[type=search], input[placeholder^=Search i], input[aria-label^=Search i]") || (el.matches("button, [role=button]") && (/^search\b/i.test(t) || /magnifying-glass|fa-search/.test(ic)))) return "search"
    return null
  }
  const vizTargets = roots.flatMap((r) => [...r.querySelectorAll("table, [role=table], [role=grid], [data-chart], [data-slot=chart], [data-slot=chart-card], figure")])
    .filter((t) => visible(t) && !excluded(t)).filter((t, i, a) => !a.some((o, j) => j !== i && o.contains(t)))
  const entries = roots.flatMap((r) => [...r.querySelectorAll("button, [role=button], input, [role=combobox]")])
    .filter((el) => !excluded(el) && visible(el) && above(el) && !el.closest("table, [role=grid], [role=menu], [role=listbox], [role=dialog] [role=grid]"))
    .map((el) => ({ el, kind: entryKind(el) })).filter((x) => x.kind)
  // Target: the table or chart the control sits in, else the nearest one that starts below it.
  const targetOf = (el) => {
    const r = el.getBoundingClientRect()
    const inside = vizTargets.find((t) => t.contains(el)); if (inside) return inside
    return vizTargets.map((t) => ({ t, d: t.getBoundingClientRect().top - r.top })).filter((x) => x.d > 0).sort((a, b) => a.d - b.d)[0]?.t ?? null
  }
  const groups = new Map()
  for (const x of entries) {
    const t = targetOf(x.el); if (!t) continue
    const k = `${x.kind}`; if (!groups.has(t)) groups.set(t, { filter: [], search: [] })
    groups.get(t)[k].push(x.el)
  }
  for (const [t, g] of groups) for (const kind of ["filter", "search"]) {
    if (g[kind].length < 2) continue
    const head = norm(t.querySelector("th, [role=columnheader]")?.innerText || t.getAttribute("aria-label") || t.tagName.toLowerCase())
    add("A9", `${g[kind].length} ${kind} entry points for one ${t.matches("table, [role=table], [role=grid]") ? "table" : "chart"} (starts "${head.slice(0, 24)}"): ${g[kind].map((el) => `"${labelOf(el).slice(0, 24)}"${/filter|magnifying/.test(iconOf(el)) && !el.innerText.trim() ? " (icon)" : ""}`).join(", ")}`, g[kind].map(sel).join(" | "))
  }

  // ---- A10 clipped content (added 2026-10-30: dashboard C records "Waiting" column cut at the table edge).
  // (a) A cell or toolbar whose box runs past the right edge of its nearest clipping ancestor (overflow hidden, auto,
  //     scroll or clip) while that edge is inside the viewport: the reader sees text cut by the table edge.
  // (b) A table wider than its scroll container with no visible horizontal-scroll affordance (the scrollbar sits below
  //     the fold or is an overlay of 0 px, and no edge fade is drawn).
  // (c) Text cut inside its own box: scrollWidth > clientWidth + 2 with overflow hidden, and no title or tooltip
  //     to read the rest. (Text that wraps is fine; text-overflow ellipsis WITH a title is an intended truncation.)
  const clipAncestor = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const ox = getComputedStyle(a).overflowX; if (ox !== "visible") return a } return null }
  const vw = document.documentElement.clientWidth
  const colName = (cell) => { const tr = cell.closest("tr, [role=row]"); const tbl = cell.closest("table, [role=table], [role=grid]"); if (!tr || !tbl) return ""; const i = [...tr.children].indexOf(cell); const th = tbl.querySelectorAll("thead th, [role=columnheader]")[i]; return th ? norm(th.innerText) : "" }
  const reported = new Set()
  for (const tbl of vizTargets.filter((t) => t.matches("table, [role=table], [role=grid]") && above(t))) {
    const box = clipAncestor(tbl)
    if (box) {
      const br = box.getBoundingClientRect(), edge = Math.min(br.right, vw)
      // A visible right-edge fade ([data-edge-fade], [data-scroll-fade]) is the scroll cue: a column cut under it is the
      // intended sideways-scroll design (attainment matrices, 2026-10-30). Found in the box or up to 2 ancestors, and only
      // counted when it sits on the box's right edge.
      const fades = []
      for (let a = box, i = 0; a && i < 3; a = a.parentElement, i++) for (const f of a.querySelectorAll("[data-edge-fade], [data-scroll-fade]")) {
        const fr = f.getBoundingClientRect(), cs = getComputedStyle(f)
        if (fr.width > 0 && fr.height > 0 && cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0" && fr.right >= edge - 4 && fr.left < edge && !fades.includes(f)) fades.push(f)
      }
      const underFade = (r) => fades.some((f) => { const fr = f.getBoundingClientRect(); return r.right > fr.left && r.top < fr.bottom && r.bottom > fr.top })
      const cells = [...tbl.querySelectorAll("tbody td, [role=row] [role=cell], [role=row] [role=gridcell], thead th, [role=columnheader]")].filter((c) => visible(c) && above(c))
        .sort((a, b) => Number(a.matches("th, [role=columnheader]")) - Number(b.matches("th, [role=columnheader]")))
      // hidden: some cell content sits fully past the edge (a whole column out of view). Rule (b) needs real hidden content.
      let hidden = cells.some((c) => { const r = c.getBoundingClientRect(); return r.left >= edge - 1 && norm(c.innerText) && getComputedStyle(c).position !== "sticky" })
      for (const c of cells) {
        const r = c.getBoundingClientRect()
        if (r.left >= edge - 1 || r.right <= edge + 2) continue
        // Sticky right columns (row actions) never clip.
        if (getComputedStyle(c).position === "sticky") continue
        // Group-header rows span every column; their box runs to the table's full width by design (library A, tuned 2026-10-30).
        if ((c.colSpan ?? 1) > 1 || c.getAttribute("aria-colspan")) continue
        // Only report a cut that hides content: the cell's own text or controls must reach past the edge.
        const kids = [...c.querySelectorAll("*")].filter((k) => visible(k) && norm(k.innerText || k.getAttribute("aria-label") || ""))
        // Text sitting directly in the cell has no element box: measure it with a Range (fixed 2026-10-30, a plain-text
        // cell was never reported).
        const rg = document.createRange(); rg.selectNodeContents(c)
        const textRight = [...rg.getClientRects()].reduce((m, x) => (x.width > 0 ? Math.max(m, x.right) : m), r.left)
        const contentRight = Math.max(r.left, textRight, ...kids.map((k) => k.getBoundingClientRect().right))
        if (contentRight <= edge + 12) continue // under 12 px is a border or rounding, not a cut a reader sees (tuned 2026-10-30: course-mapping 6 px, reports 4 px)
        hidden = true
        if (underFade(r)) { if (DEBUG) out.push({ rule: "debug", text: `A10 skipped "${colName(c)}": cut under a visible edge fade`, where: sel(box) }); continue }
        const name = colName(c) || norm(c.innerText).slice(0, 20)
        if (reported.has(tbl.tagName + name)) continue
        reported.add(tbl.tagName + name)
        add("A10", `column "${name}" cut by the table edge: ${Math.round(r.right - edge)} px hidden (e.g. "${norm(c.innerText).slice(0, 40)}")`, sel(box))
      }
      const ox = getComputedStyle(box).overflowX
      if ((ox === "auto" || ox === "scroll") && box.scrollWidth > box.clientWidth + 11) {
        const bar = box.offsetHeight - box.clientHeight - parseFloat(getComputedStyle(box).borderTopWidth) - parseFloat(getComputedStyle(box).borderBottomWidth)
        const barVisible = bar > 0 && br.bottom <= FOLD
        const fade = fades.length > 0
        // Only when content is actually out of view (tuned 2026-10-30: skills-library A overflowed 19 px with nothing hidden).
        if (hidden && !barVisible && !fade) add("A10", `table ${box.scrollWidth} px wide in a ${box.clientWidth} px container; no visible horizontal scroll cue (${bar > 0 ? `scrollbar ${Math.round(br.bottom - FOLD)} px below the fold` : "overlay scrollbar"})`, sel(box))
      }
    }
  }
  for (const r of roots) for (const el of r.querySelectorAll("td *, [role=cell] *, [role=gridcell] *, [data-slot=filter-bar] *, [role=toolbar] *, td, [role=cell]")) {
    if (excluded(el) || !visible(el) || !above(el) || el.children.length > 2) continue
    const cs = getComputedStyle(el)
    if (cs.overflowX === "visible" || el.scrollWidth <= el.clientWidth + 2 || !norm(el.innerText)) continue
    if (el.matches("input, textarea, select") || el.closest("[title], [data-slot=tooltip-trigger], [aria-describedby]")) continue
    const cell = el.closest("td, [role=cell], [role=gridcell]")
    const key = "c" + (cell ? colName(cell) : sel(el))
    if (reported.has(key)) continue
    reported.add(key)
    add("A10", `text cut inside its box${cell ? ` in column "${colName(cell)}"` : ""}: "${norm(el.innerText).slice(0, 40)}" (${el.scrollWidth} px in ${el.clientWidth} px, ${cs.textOverflow === "ellipsis" ? "ellipsis, no title" : "hard clip"})`, sel(el))
  }

  // ---- A10 outside tables (added 2026-10-30: student Log "Where" tiles ran past their card at 375 and nothing reported it).
  // (d) A visible element whose right edge passes its nearest clipping ancestor (overflow not visible) or its card by 12 px
  //     or more. Only the outermost offender is reported. Content of an intended scroll container is skipped when that
  //     container shows a cue (a scrollbar on screen, or [data-edge-fade] / [data-scroll-fade]).
  // (e) A card whose scrollWidth passes its clientWidth by 12 px or more, unless it is such a scroll container.
  const hasCue = (box) => {
    const ox = getComputedStyle(box).overflowX
    if (ox !== "auto" && ox !== "scroll") return false
    const bar = box.offsetHeight - box.clientHeight - parseFloat(getComputedStyle(box).borderTopWidth) - parseFloat(getComputedStyle(box).borderBottomWidth)
    if (bar > 0 && box.getBoundingClientRect().bottom <= FOLD) return true
    for (let a = box, i = 0; a && i < 3; a = a.parentElement, i++) if ([...a.querySelectorAll("[data-edge-fade], [data-scroll-fade]")].some((f) => { const r = f.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(f).opacity !== "0" })) return true
    return false
  }
  const overflowed = []
  for (const r of roots) for (const el of r.querySelectorAll("*")) {
    if (excluded(el) || el.closest("table, [role=table], [role=grid], svg, [data-chart], figure, [data-slot=sidebar], [role=tooltip]") || !visible(el) || !above(el)) continue
    const cs = getComputedStyle(el)
    if (cs.position === "fixed" || cs.position === "absolute") continue
    if (overflowed.some((o) => o.contains(el))) continue
    const er = el.getBoundingClientRect()
    let box = null
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { if (getComputedStyle(a).overflowX !== "visible" || a.matches("[data-slot=card]")) { box = a; break } }
    if (!box || box === document.documentElement || box.matches("main, [data-page-scroll]") && !box.matches("[data-slot=card]")) continue
    const br = box.getBoundingClientRect()
    if (er.right <= br.right + 12) continue
    const scroller = box.matches("[data-slot=card]") ? null : box
    if (scroller && hasCue(scroller)) continue
    // An unclipped card child past the card edge, or a clipped one cut by its box.
    overflowed.push(el)
    const label = norm(el.innerText || el.getAttribute("aria-label") || "").slice(0, 40)
    add("A10", `${el.tagName.toLowerCase()} runs ${Math.round(er.right - br.right)} px past its ${box.matches("[data-slot=card]") ? "card" : "container"}${label ? ` ("${label}")` : ""}`, sel(el))
  }
  for (const c of roots.flatMap((r) => [...r.querySelectorAll("[data-slot=card]")])) {
    if (excluded(c) || !visible(c) || !above(c) || c.closest("table, [role=grid]")) continue
    if (c.scrollWidth > c.clientWidth + 12 && !hasCue(c) && !overflowed.some((o) => c.contains(o))) add("A10", `card content ${c.scrollWidth} px wide in a ${c.clientWidth} px card; no scroll cue`, sel(c))
  }

  // ---- A12(2) outside tables (added 2026-10-30: ranked skill names truncated on dashboard cards). The identifier of a
  // list row or card row (its link, its heading line, or the first text line of the row) must not truncate, title or not.
  {
    const cutX = (x) => { const cs = getComputedStyle(x); return (cs.textOverflow === "ellipsis" && x.scrollWidth > x.clientWidth + 1) || (cs.webkitLineClamp && cs.webkitLineClamp !== "none" && x.scrollHeight > x.clientHeight + 1) }
    const seenIds = new Set()
    const rowsOut = roots.flatMap((r) => [...r.querySelectorAll("li, [role=listitem], [data-slot=card] [data-row], [data-slot=card] > div > div")])
      .filter((row) => !excluded(row) && visible(row) && above(row) && !row.closest("table, [role=grid], [role=menu], [role=listbox], nav, [role=tablist]"))
    for (const row of rowsOut) {
      const firstLine = (() => { const tw = document.createTreeWalker(row, NodeFilter.SHOW_TEXT); for (let n = tw.nextNode(); n; n = tw.nextNode()) { const el = n.parentElement; if (n.nodeValue.trim() && el && visible(el) && !el.closest("[data-slot=badge], [data-slot=status-badge], [data-slot=avatar], button")) return el } return null })()
      const cands = [...row.querySelectorAll("a, h2, h3, h4, [role=heading]"), firstLine].filter(Boolean)
      for (const el of cands) {
        const anc = []; for (let a = el.parentElement; a && a !== row; a = a.parentElement) anc.push(a)
        const target = [el, ...el.querySelectorAll("*"), ...anc].find((x) => visible(x) && cutX(x) && norm(x.innerText))
        if (!target) continue
        const k = norm(target.innerText)
        if (seenIds.has(k)) continue
        seenIds.add(k)
        add("A12", `truncated identifier: "${k.slice(0, 40)}" (${target.scrollWidth} px in ${target.clientWidth} px${target.closest("[title]") ? ", has a title" : ""}) in a list or card row`, sel(target))
      }
    }
  }

  // ---- A12 mangled text (added 2026-10-30 on admin/attainment A: "Emotio|nal", "Mobilit|y", "as-sess-ment" in column
  // headers, "ABSN 2027, Gro…" under an "ABSN 2027" group header).
  // (1) A word drawn on two line boxes in a table header or cell (Range.getClientRects per word; words are split on
  //     spaces, hyphens and slashes, so a break at a real hyphen is fine), or hyphens:auto / word-break:break-all on table text.
  // (2) "truncated identifier": an ellipsis on the primary line of the first data column or on a name link in a row,
  //     even with a title. Person and skill names must not truncate.
  // (3) A row fact repeated under its group header: the group key ("ABSN 2027") in the secondary line of 80% or more of
  //     the group's rows (3 rows or more).
  {
    const TBL = "table, [role=table], [role=grid]"
    const CELL = "th, td, [role=columnheader], [role=cell], [role=gridcell], [role=rowheader]"
    const tablesA12 = roots.flatMap((r) => [...r.querySelectorAll(TBL)]).filter((t) => visible(t) && !excluded(t) && above(t) && !t.parentElement.closest(TBL))
    for (const t of tablesA12) {
      const broken = new Map()
      let cssFlag = null
      for (const c of [...t.querySelectorAll(CELL)].filter((c) => visible(c) && above(c))) {
        const tw = document.createTreeWalker(c, NodeFilter.SHOW_TEXT)
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          const el = n.parentElement
          if (!el || !visible(el)) continue
          const cs = getComputedStyle(el)
          if (!cssFlag && (cs.hyphens === "auto" || cs.webkitHyphens === "auto" || cs.wordBreak === "break-all")) cssFlag = `${cs.wordBreak === "break-all" ? "word-break: break-all" : "hyphens: auto"} on "${norm(c.innerText).slice(0, 24)}"`
          for (const m of n.nodeValue.matchAll(/[^\s\-/·,()]+/g)) {
            if (m[0].length < 3 || !/[a-z]/i.test(m[0])) continue
            const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length)
            const tops = new Set([...rg.getClientRects()].filter((x) => x.width > 0.5).map((x) => Math.round(x.top)))
            if (tops.size > 1 && !broken.has(m[0])) broken.set(m[0], c.matches("th, [role=columnheader]") ? "header" : "cell")
          }
        }
      }
      if (broken.size) add("A12", `word broken across lines in ${[...new Set(broken.values())].join(" and ")}: ${[...broken.keys()].slice(0, 8).map((w) => `"${w}"`).join(", ")}${broken.size > 8 ? ` and ${broken.size - 8} more` : ""}`, sel(t))
      if (cssFlag) add("A12", `table text set to ${cssFlag}`, sel(t))

      // (2) and (3) read rows.
      const rows = [...t.querySelectorAll("tbody tr, [role=rowgroup] [role=row]")].filter((r) => visible(r) && above(r))
      const firstCell = (r) => [...r.children].find((c) => c.matches("td, th, [role=cell], [role=gridcell], [role=rowheader]") && visible(c) && !c.querySelector("input[type=checkbox], [role=checkbox]") && norm(c.innerText))
      const linesOf = (cell) => {
        const res = []
        const tw = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          const el = n.parentElement
          if (!n.nodeValue.trim() || !el || !visible(el) || el.closest("[data-slot=badge], [data-slot=avatar], [data-slot=avatar-fallback], [data-slot=status-badge]")) continue
          let b = el
          while (b !== cell && getComputedStyle(b).display.startsWith("inline") && b.parentElement !== cell) b = b.parentElement
          if (!res.some((o) => o.contains(b) || b.contains(o))) res.push(b)
        }
        return res
      }
      const isGroupRow = (r) => { const cells = [...r.children].filter((c) => visible(c)); return cells.length === 1 || cells.some((c) => (c.colSpan ?? 1) > 2) || r.hasAttribute("data-group-row") }
      const truncated = new Set()
      let group = null
      const groupsA12 = []
      for (const r of rows) {
        if (isGroupRow(r)) { group = { key: norm(r.innerText).split(/\s+·\s+|\s{2,}|\s\d+\s*$/)[0].trim(), rows: [] }; groupsA12.push(group); continue }
        const fc = firstCell(r); if (!fc) continue
        const lines = linesOf(fc)
        // Identifier columns: the first data column, plus any column headed by a person or skill noun (Student, Evaluator,
        // Preceptor, Faculty, Reviewer, Name, Skill, the program's noun), plus name links anywhere in the row.
        const heads = [...t.querySelectorAll("thead th, [role=columnheader]")]
        const idCells = [...r.children].filter((c, i) => c !== fc && /^(student|evaluator|preceptor|faculty|reviewer|instructor|name|person|skill|competency|epa|procedure)s?\b/i.test(norm(heads[i]?.innerText || "")))
        const primaries = [lines[0], ...idCells.map((c) => linesOf(c)[0]), ...r.querySelectorAll("a")].filter(Boolean)
        const cut = (x) => { const cs = getComputedStyle(x); return (cs.textOverflow === "ellipsis" && x.scrollWidth > x.clientWidth + 1) || (cs.webkitLineClamp && cs.webkitLineClamp !== "none" && x.scrollHeight > x.clientHeight + 1) }
        for (const el of primaries) {
          const anc = []
          for (let a = el.parentElement; a && !a.matches(CELL) && a !== t; a = a.parentElement) anc.push(a)
          const target = [el, ...el.querySelectorAll("*"), ...anc].find(cut)
          if (target && !truncated.has(norm(target.innerText))) {
            truncated.add(norm(target.innerText))
            add("A12", `truncated identifier: "${norm(target.innerText).slice(0, 40)}" (${target.scrollWidth} px in ${target.clientWidth} px${target.closest("[title]") ? ", has a title" : ""})`, sel(target))
          }
        }
        if (group) group.rows.push(lines.slice(1).map((l) => norm(l.innerText)).join(" "))
      }
      for (const g of groupsA12) {
        if (!g.key || g.key.length < 3 || g.rows.length < 3) continue
        const hits = g.rows.filter((x) => x.toLowerCase().includes(g.key.toLowerCase())).length
        if (hits / g.rows.length >= 0.8) add("A12", `row fact repeated under its group header: "${g.key}" in ${hits} of ${g.rows.length} rows' second line`, sel(t))
      }
    }
  }

  // ---- A12(4) rows repeating what a filter already says (added 2026-10-30 on student/skill-detail A: the course select
  // sits over attempts that all end "NURS 350"). For each select or filter control, the list or table it heads (3+ rows,
  // below it, within 5 ancestors): flag (a) every row containing the control's shown value, or (b) a fact segment
  // (comma or · separated, not a date or number, not button text) that every row repeats.
  {
    const ctrls = roots.flatMap((r) => [...r.querySelectorAll("[role=combobox], select, button[aria-haspopup=listbox], [data-slot=select-trigger]")])
      .filter((c) => !excluded(c) && visible(c) && above(c) && !c.closest("table, [role=grid], [role=dialog] form"))
    const seenLists = new Set()
    const rowText = (row) => { const parts = []; const tw = document.createTreeWalker(row, NodeFilter.SHOW_TEXT); for (let n = tw.nextNode(); n; n = tw.nextNode()) { const el = n.parentElement; if (!n.nodeValue.trim() || !el || !visible(el) || el.closest("button, a, [role=button], .sr-only")) continue; parts.push(n.nodeValue) } return parts.join(" , ") }
    const segs = (s) => new Set(s.split(/\n|,|\s+·\s+/).map((x) => norm(x).replace(/[.:]$/, "")).filter((x) => x.length >= 3 && /[a-z]/i.test(x) && !/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d/.test(x) && !/^attempt \d+/i.test(x)))
    for (const c of ctrls) {
      const cr = c.getBoundingClientRect()
      const shown = norm(c.innerText || c.value || "").replace(/\s*\(\d+\)\s*$/, "")
      let list = null
      for (let a = c.parentElement, i = 0; a && i < 5 && !list && a !== main; a = a.parentElement, i++) {
        list = [...a.querySelectorAll("ul, ol, [role=list], tbody")].find((l) => visible(l) && l.getBoundingClientRect().top >= cr.top && [...l.children].filter((x) => visible(x)).length >= 3)
      }
      if (!list || seenLists.has(list)) continue
      const rows = [...list.children].filter((x) => visible(x)).map(rowText)
      if (shown && !/^(all|any|every)\b/i.test(shown) && rows.every((t) => t.toLowerCase().includes(shown.toLowerCase()))) {
        seenLists.add(list); add("A12", `every row (${rows.length}) repeats the filter value "${shown}"`, sel(list)); continue
      }
      const sets = rows.map(segs)
      const common = [...sets[0]].filter((s) => sets.every((x) => x.has(s)))
      if (common.length) { seenLists.add(list); add("A12", `every row (${rows.length}) repeats ${common.slice(0, 4).map((x) => `"${x}"`).join(", ")} under the filter "${norm(c.innerText).slice(0, 30)}"`, sel(list)) }
    }
  }

  return { h1: h1Text, crumbs: bodyCrumbs, findings: out }
}

// ---- A11 single-action menu (Romit 2026-10-30, ledger D-L8b): a menu trigger in the page header (beside the h1: "More",
// "…", an ellipsis icon or any aria-haspopup=menu control) whose menu holds exactly one action. That action should be a
// button. The trigger is clicked, the open [role=menu] items are counted (disabled items count; separators and labels do
// not), then Escape closes it.
async function singleActionMenus(page) {
  const found = []
  const triggers = await page.$$eval("h1", (hs) => {
    const EXCL = "[data-lab-chrome], [data-slot=utility-bar], [data-sidebar=sidebar], [data-slot=sidebar]"
    const h1 = hs.find((h) => !h.closest(EXCL) && h.getBoundingClientRect().height > 0)
    if (!h1) return []
    const header = h1.closest("[data-slot=page-header]") ?? h1.closest("header") ?? h1.parentElement?.parentElement ?? h1.parentElement
    const els = [...header.querySelectorAll("button, [role=button]")].filter((b) => !b.closest(EXCL) && b.getBoundingClientRect().width > 0)
      .filter((b) => b.getAttribute("aria-haspopup") === "menu" || b.getAttribute("data-slot") === "dropdown-menu-trigger" || /^(more|…|\.\.\.|actions|more actions|options)$/i.test((b.getAttribute("aria-label") || b.innerText || "").trim()) || !!b.querySelector("i[class*=fa-ellipsis]"))
    return els.map((b, i) => { b.setAttribute("data-anatomy-a11", String(i)); return { i, label: (b.getAttribute("aria-label") || b.innerText || "").replace(/\s+/g, " ").trim() || "(icon)" } })
  }).catch(() => [])
  for (const t of triggers) {
    try {
      await page.click(`[data-anatomy-a11="${t.i}"]`, { timeout: 3000 })
      const menu = await page.waitForSelector("[role=menu]:visible", { timeout: 3000 }).catch(() => null)
      if (!menu) continue
      const items = await menu.$$eval("[role=menuitem], [role=menuitemcheckbox], [role=menuitemradio]", (xs) => xs.filter((x) => x.getBoundingClientRect().height > 0).map((x) => x.textContent.replace(/\s+/g, " ").trim()))
      if (process.env.LAB_ANATOMY_DEBUG) console.error(`A11 debug: trigger "${t.label}" opened a menu with ${items.length} item(s): ${items.join(" | ")}`)
      if (items.length === 1) found.push({ rule: "A11", text: `header menu "${t.label}" holds one action: "${items[0]}"`, where: `[page-header] trigger "${t.label}"` })
      await page.keyboard.press("Escape")
      await page.waitForTimeout(200)
    } catch { /* trigger not clickable: skip */ }
  }
  return found
}

// ---- Allow list
const allow = fs.existsSync(ALLOW_PATH) ? JSON.parse(fs.readFileSync(ALLOW_PATH, "utf8")).allow ?? [] : []
const allowed = (f) => allow.some((a) => a.rule === f.rule && a.screen === f.key && (!a.variant || a.variant === "*" || a.variant === f.variant) && (!a.match || f.text.includes(a.match)) && a.reason)

// ---- Run
const results = await pool(CASES, WORKERS, async (c, browser) => {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h } })
  await ctx.addInitScript(() => { try { if (!sessionStorage.getItem("__lab_gate")) { localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem("__lab_gate", "1") } } catch { /* private */ } })
  const page = await ctx.newPage()
  try {
    await load(page, c.url)
    const r = await page.evaluate(inspect, { FOLD: c.h, URLQ: c.url.split("?")[1] ?? "", DEBUG: !!process.env.LAB_ANATOMY_DEBUG })
    // A11 runs after inspect (it opens menus, which changes the DOM the other rules read).
    if (!ONLY.length || ONLY.includes("A11")) r.findings.push(...(await singleActionMenus(page)))
    return { ...c, ...r }
  } finally { await ctx.close().catch(() => {}) }
}, (c, e) => ({ ...c, error: String(e?.message ?? e).split("\n")[0], findings: [] }))
if (process.stderr.isTTY) process.stderr.write("\n")

const rows = []
for (const r of results.sort((a, b) => (a.key + a.variant + a.w + a.note).localeCompare(b.key + b.variant + b.w + b.note))) {
  for (const f of r.findings) {
    if (f.rule === "debug") { console.error(`debug ${r.key}/${r.variant} @${r.w}: ${f.text}`); continue }
    if (ONLY.length && !ONLY.includes(f.rule)) continue
    const row = { key: r.key, persona: r.key.split("/")[0], variant: r.variant, width: r.w, note: r.note, url: r.url, h1: r.h1, ...f }
    row.allowed = allowed(row)
    rows.push(row)
  }
}
const errors = results.filter((r) => r.error)
const esc = (s) => String(s).replace(/\|/g, "\\|")
console.log("| screen | variant | width | rule | text / selector |")
console.log("|---|---|---|---|---|")
for (const r of rows) console.log(`| ${r.key}${r.note ? ` (${r.note})` : ""} | ${r.variant} | ${r.width} | ${r.rule} ${RULE_NAME[r.rule]}${r.allowed ? " (allowed)" : ""} | ${esc(r.text)} — \`${esc(r.where)}\` |`)
const by = (k) => rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] ?? 0) + 1), m), {})
console.log(`\nCases ${results.length}, errors ${errors.length}, violations ${rows.length} (${rows.filter((r) => !r.allowed).length} not allow-listed)`)
console.log("By rule:", JSON.stringify(by("rule")))
console.log("By persona:", JSON.stringify(by("persona")))
for (const e of errors) console.log(`ERROR ${e.key}/${e.variant} @${e.w}: ${e.error}`)
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, at: new Date().toISOString(), cases: results.map(({ findings, ...c }) => ({ ...c, count: findings.length })), violations: rows }, null, 2))
const fail = STRICT && (rows.some((r) => !r.allowed) || errors.length > 0)
console.log(fail ? "ANATOMY CHECK FAILED" : STRICT ? "ANATOMY CHECK PASSED" : "ANATOMY REPORT DONE")
process.exit(fail ? 1 : 0)
