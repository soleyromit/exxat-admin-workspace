#!/usr/bin/env node
// Density budget audit for EVERY built lab screen and variant (docs/knowledge/strategy/07-ux-laws-and-density.md sections 3 and 6,
// with the delegated defaults D-X21 in docs/knowledge/02-decisions-ledger.md 3c).
//
// Usage: node tests/lab/density-budget.mjs [baseUrl] [--json] [--only=persona/slug[/V],...] [--shots=dir] [--debug] [--workers=n]
//   default base http://localhost:3017; the dev server must be running. Every route gets ?variant=X&term=Fall%202026 and a clean
//   localStorage (cleared before any page script runs). Staff (admin, reviewer, director, lab-instructor) are measured at 1440 x 900;
//   student and evaluator at 1440 x 900 and 375 x 812. Student My requests, Fix and Record are also measured for stu-g-067 (a student
//   with returned and did-not-count evidence), because the default student hides those states.
// Not a vitest file on purpose (.mjs): it needs a browser and a running server. Exit 1 when any case breaks its budget.
//
// COUNTING RULES (the first viewport is the top 900 px at 1440, 812 px at 375; shell, utility bar and [data-lab-chrome] are excluded)
//  Regions   Bounded blocks with their own question: [data-region], DS Card, scope bar, FilterBar, tablist, table or grid, banner
//            (role=alert/status with a border), section with its own h2/h3. Only top-level blocks count (a table inside a card is part
//            of the card). The page header (h1) counts 1. A block counts when it shows whole or at least 80 px of it shows.
//            An open Sheet, panel or Dialog (portalled outside <main>) is measured with the page: it is ONE region, and its
//            controls and words count like the page's.
//            D-X21: a grid of small tiles counts as ONE region. A tile grid is [data-tile-grid], or 3+ sibling blocks under one grid or
//            wrapping-flex parent, each under 200 px tall. At most 6 tiles may be visible.
//  Figures   [data-figure] above the fold: a "kpis" group counts each linked value, any other leaf counts 1. Tab counts are not
//            figures (strategy/07 S06 5.3: "tab counts are the counts"), so a [data-figure] inside [role=tab] is skipped, as is one
//            inside a table.
//  Charts    [data-chart] or the DS chart slot, at least 80 px tall, not inside a figure or a table (an in-cell viz column is a
//            table column, strategy/07 list budget). D-X21: at most 3 charts in the first viewport on a dashboard; other page types
//            keep their strategy/07 budget (list 0, form 0 or 1 impact preview, detail 1, student 1, evaluator 0).
//  Controls  Buttons (and links styled as DS buttons), selects, comboboxes, tabs, switches, checkboxes, inputs, textareas above the
//            first chart or table (lists, dashboards, details) or above the fold (forms, evaluator, student). Links in text and
//            controls inside a figure do not count.
//            SINGLE-CHOICE GROUP RULE: the options of one single choice (role=radio inside one radiogroup, a DS RadioGroup,
//            SelectionTileGrid or single ToggleGroup) count as ONE control. Why: the reader makes one decision; Hick's law prices
//            the options inside that decision, and strategy/07 already prices a Select (one control, n options) the same way. A set
//            of checkboxes is several decisions and counts each box. A TAB LIST is one single choice too (one view at a time) and
//            counts as ONE control, whatever its number of tabs (2026-10-26, B3 finding: counting each status tab pushed every
//            list over budget for a choice the reader makes once; strategy/07 section 3 updated to match). The named exceptions
//            for the admin dashboard B and C tabs were removed with this rule.
//            Forms count FIELDS (strategy/07: 7 fields per step); their action buttons are reported but sit under the primary and
//            disabled checks. Evaluator: 3 per visible skill (one outcome group, feedback, attach) plus Submit.
//            A disabled control above the fold fails (strategy/07 trap: hide until usable), except one half of a Previous/Next
//            pager at its first or last record (hiding it would shift the live half).
//  Prose     Words in text nodes above the fold that are NOT data, labels or buttons (strategy/07 K4). Not prose: buttons, links,
//            form labels, headings (h1 to h3), legends, status badges, tooltips, anything inside a table, grid, figure, chart, SVG or
//            [data-figure], description-list terms and values (dt is a label like th, dd is data like td), anything tagged
//            [data-viz-label] (names, axis titles, data labels), user-authored content quoted from the record (blockquote, q,
//            [data-user-content]: evaluator feedback, a student's note; it is record data, not interface copy), the scope bar, screen-reader-only text, and tokens that are pure
//            numbers. SHORT-LABEL RULE: inside a chart, a list item or a table row, a text node of 3 words or fewer is a data label
//            (a name, a category, a state word) and does not count; longer text in those places is prose and counts. Budget: 40 words at 1440 on every staff and student type, 25 for a student page at 375 (strategy/07 K4),
//            15 on every evaluator surface.
//  Hues      Distinct saturated colours above the fold. Every computed fill and stroke (SVG), background colour, and the colour of
//            icon glyphs (Font Awesome) is resolved by the browser (so var(), color-mix(), oklch(), oklab() and lab() all resolve),
//            painted on a 1 px canvas over white (so a 10% tint reads as the pale colour it is), converted to OKLCH, and kept when
//            chroma > 0.06. Hues within 25 degrees merge into one. Budget 2 (brand + amber); student progress may add the success
//            tone (3). This is a measurement of what is painted, not of class names.
//  Primary   Filled DS buttons ([data-slot=button][data-variant=default]) above the fold: at most 1. (Checkboxes and radios also
//            carry data-variant=default in the DS, so the data-slot is required.)
//  Repeats   Sentences of 5+ words appearing twice above the fold: 0.
//  Previews  ARTIFACT PREVIEW (strategy/07 evaluator budget, 2026-10-26): on an invitation screen the message being previewed (email
//            body, SMS text, inbox row) is the artifact, so text inside [data-artifact-preview] is data, not prose. Its frame (the
//            nearest [data-region] or Card) must say "preview" in its visible text or aria-label ("Email preview", "Text message
//            preview", "Inbox preview"), or the case fails ("previews"). The explanatory prose around it keeps the 15-word budget.
//  Modal     MODAL RULE (2026-10-26, strategy/07 section 3): when an open dialog or sheet is modal (aria-modal, Radix's modal
//            lock with body pointer-events none, or the page inert or aria-hidden), the page behind is unusable, so ONLY the
//            modal surface counts (regions, controls, words; the page h1 is not counted). Export A and Add a skill A are measured this way. A
//            non-modal panel (a default FloatingSheetPanel, split views) keeps counting page plus panel.
//  Split     SPLIT VIEW OR PANEL page type (strategy/07 section 3, added 2026-10-26): a list with an open record panel beside or over
//            it (VARIANT_TYPE). Budget regions 5, controls 8, words 40, primary 1; the open panel is ONE region and its controls and
//            words count. Controls are counted over the whole first viewport (the panel sits beside the table, not above it).
//  Wizard    WIZARD STEP page type (docs/knowledge/design/skill-setup-journey/01-layout-patterns.md section 3, added 2026-10-26
//            for the import and configure wizards): regions 4 (title, stepper, panel, footer), figures 1 (an impact or outcome
//            figure only), charts 1, controls 7 FIELDS in the step panel (counted like a form: the title Cancel and the footer Back
//            and primary are reported as actions, not counted), words 30 per step, primary 1. Measured on the step the default
//            URL opens (step 1); later steps are counted by hand in the builder's notes until the script takes a state param.
//  Exceptions (named in strategy/07 section 3; nothing else may exceed): none since the tab list rule (2026-10-26); the admin
//            dashboard B and C allowances for their 5 tabs were removed. Re-add one here only with its decision.
import { createRequire } from "node:module"
import { readFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const require = createRequire(import.meta.url)
async function loadChromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* try next */ }
  }
  throw new Error("Playwright not found. Install it or run from the monorepo that has tools/visual-check.")
}

const here = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3017"
const asJson = args.includes("--json")
const debug = args.includes("--debug")
const only = (args.find((a) => a.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean)
const SHOTS = args.find((a) => a.startsWith("--shots="))?.slice(8) ?? null
const WORKERS = Number(args.find((a) => a.startsWith("--workers="))?.slice(10) ?? 2)
const TERM = "Fall%202026"

// Page type per registered screen (strategy/07 section 3 columns). The registry has no page type, and the DOM attribute
// data-page-type is set by only some frames, so the script owns this map; a new screen without an entry fails loudly.
const PAGE_TYPE = {
  "admin/dashboard": "dashboard", "admin/dashboard-drill": "list", "admin/skills-library": "list", "admin/add-skill": "form",
  "admin/import-ai-review": "wizard", "admin/starter-library": "list", "admin/configure-skill": "form", "admin/rule-change-impact": "detail",
  "admin/retire-deactivate": "form", "admin/course-mapping": "list", "admin/lists-cohorts": "list", "admin/evaluator-directory": "list",
  "admin/settings": "list", "admin/attainment": "dashboard", "admin/export": "form", "admin/approvals": "list",
  "student/home": "student", "student/log-skill": "form", "student/request-signoff": "form", "student/my-requests": "list",
  "student/fix-returned": "form", "student/skill-detail": "detail", "student/record": "list", "student/share-record": "detail",
  "student/offline-sync": "list",
  "evaluator/evaluation-form": "evaluator", "evaluator/submitted": "evaluator", "evaluator/expired": "evaluator", "evaluator/invitation-email": "evaluator",
  "lab-instructor/lab-batch-grid": "list",
  "reviewer/approvals": "list", "reviewer/review-item": "detail", "reviewer/student-record": "detail", "reviewer/students": "list",
  "director/dashboard": "dashboard", "director/verification-detail": "detail", "director/reports": "list", "director/attainment": "dashboard",
}
// strategy/07 section 3; charts on a dashboard raised to 3 by D-X21. figuresNoTabs: a list page with no tabs may show 3.
const BUDGET = {
  dashboard: { regions: 5, figures: 4, charts: 3, controls: 8, words: 40, primary: 1, hues: 2 },
  list: { regions: 4, figures: 0, figuresNoTabs: 3, charts: 0, controls: 6, words: 40, primary: 1, hues: 2 },
  form: { regions: 4, figures: 1, charts: 1, controls: 7, words: 40, primary: 1, hues: 2 },
  // skill-setup-journey 01 section 3, wizard step column (see the header note "Wizard").
  wizard: { regions: 4, figures: 1, charts: 1, controls: 7, words: 30, primary: 1, hues: 2 },
  detail: { regions: 5, figures: 4, charts: 1, controls: 6, words: 40, primary: 1, hues: 2 },
  evaluator: { regions: 3, figures: 0, charts: 0, controls: 4, words: 15, primary: 1, hues: 2 },
  student: { regions: 4, figures: 3, charts: 1, controls: 4, words: 40, primary: 1, hues: 3 },
  // strategy/07 section 3 "Split view or panel": the open panel is ONE region and its own controls and words count.
  split: { regions: 5, figures: 3, charts: 0, controls: 8, words: 40, primary: 1, hues: 2 },
}
// Variants that are a split view or a panel over a page (strategy/07 section 3). Overrides PAGE_TYPE for that variant only.
// The registry carries pageType per variant (lib/lab/screens.json); this map is the fallback for an entry without one.
const VARIANT_TYPE = { "reviewer/approvals/B": "split", "admin/export/A": "split", "admin/import-ai-review/B": "split", "admin/configure-skill/A": "wizard", "admin/add-skill/A": "split" }
const PHONE_WORDS = 25
// Accepted exceptions, each with its decision. Extra allowance per line.
const EXCEPTIONS = {}
const STAFF = new Set(["admin", "reviewer", "director", "lab-instructor"])
const ALT_STUDENT = { "student/my-requests": "stu-g-067", "student/fix-returned": "stu-g-067", "student/record": "stu-g-067" }

const registry = JSON.parse(readFileSync(join(here, "../../lib/lab/screens.json"), "utf8")).screens
const CASES = []
for (const s of registry) {
  const key = `${s.persona}/${s.slug}`
  const type = PAGE_TYPE[key]
  if (!type) { console.error(`No page type for ${key}; add it to PAGE_TYPE.`); process.exit(2) }
  for (const v of s.variants) {
    if (!v.file) continue
    const id = `${key}/${v.id}`
    const vtype = v.pageType ?? VARIANT_TYPE[id] ?? type
    if (only.length && !only.some((o) => id === o || key === o || id.startsWith(o + "/"))) continue
    const viewports = STAFF.has(s.persona) ? [[1440, 900]] : [[1440, 900], [375, 812]]
    const students = ALT_STUDENT[key] ? [null, ALT_STUDENT[key]] : [null]
    for (const [w, h] of viewports) for (const stu of students) {
      const q = `variant=${v.id}&term=${TERM}${stu ? `&student=${stu}` : ""}`
      CASES.push({ id, key, title: s.title, variant: v.id, type: vtype, w, h, stu, route: `/lab/${s.persona}/${s.slug}?${q}` })
    }
  }
}

/** Runs in the page. Keep it self-contained. */
function measure({ FOLD, TYPE }) {
  const main = document.querySelector("main") ?? document.body
  const EXCL = "[data-lab-chrome], [data-slot=utility-bar], [data-sidebar=sidebar], [data-slot=sidebar]"
  const excluded = (el) => !!el.closest(EXCL)
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return false
    const cs = getComputedStyle(el)
    return cs.visibility !== "hidden" && cs.display !== "none" && !el.closest("[aria-hidden=true]")
  }
  const above = (el) => { const r = el.getBoundingClientRect(); return r.top < FOLD && r.bottom > 0 }
  const PEEK = 80
  const holds = (el) => { const r = el.getBoundingClientRect(); return Math.min(r.bottom, FOLD) - Math.max(r.top, 0) >= Math.min(PEEK, r.height - 1) }
  // An open Sheet or Dialog is portalled outside <main> but is part of the first viewport: measure it too. (Behind a modal,
  // Radix marks the page aria-hidden, so the page under a modal drops out of every count except colour.)
  const dialogs = [...document.querySelectorAll("[role=dialog][data-state=open], [role=alertdialog][data-state=open]")].filter((d) => !main.contains(d) && !excluded(d))
  // MODAL RULE (2026-10-26): when an open dialog or sheet is modal (aria-modal, or Radix's modal lock: body pointer-events
  // none, or the page marked inert or aria-hidden), the page behind cannot be used, so ONLY the modal surface is counted.
  // A non-modal panel (FloatingSheetPanel, split view) keeps counting page plus panel.
  const modal = dialogs.length > 0 && (dialogs.some((d) => d.getAttribute("aria-modal") === "true") || document.body.style.pointerEvents === "none" || !!main.closest("[inert], [aria-hidden=true]"))
  const roots = modal ? dialogs : [main, ...dialogs]
  const all = (sel) => roots.flatMap((r) => [...r.querySelectorAll(sel)]).filter((el) => !excluded(el) && visible(el))
  // Painted marks are often aria-hidden (decorative SVG, glyphs); colour counts what is painted, so it ignores aria-hidden.
  const painted = (el) => { const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false; const cs = getComputedStyle(el); return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0" }
  const label = (el) => (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28)

  // ---- Regions
  const header = modal ? undefined : all("h1").find(above)
  const headerBox = header ? (header.closest("[data-slot=page-header], header") ?? header) : null
  const REGION_SEL = "[data-region], [data-tile-grid], [data-slot=card], [data-scope-bar], [data-slot=filter-bar], [role=tablist], table, [role=table], [role=grid], [data-slot=local-banner], [role=alert], section"
  let cands = all(REGION_SEL).filter((el) => {
    if (headerBox && (headerBox.contains(el) || el.contains(headerBox))) return false
    if (el.tagName === "SECTION" && !el.querySelector("h2, h3")) return false
    if (el.matches("[role=alert]") && parseFloat(getComputedStyle(el).borderTopWidth) === 0 && !el.matches("[data-slot=local-banner]")) return false
    return true
  })
  // An open panel or dialog is ONE region (one bounded block, one question); its sections are not counted separately.
  cands = cands.concat((modal ? roots : roots.slice(1)).filter((d) => visible(d)))
  cands = cands.filter((el) => !cands.some((o) => o !== el && o.contains(el)))
  const shown = cands.filter(holds)
  // Tile grids (D-X21): collapse siblings.
  const regions = []
  const used = new Set()
  let tiles = 0
  for (const el of shown) {
    if (used.has(el)) continue
    if (el.hasAttribute("data-tile-grid")) { const n = el.children.length; tiles = Math.max(tiles, [...el.children].filter((c) => visible(c) && holds(c)).length); regions.push(`tiles(${n})`); used.add(el); continue }
    const p = el.parentElement
    const cs = p ? getComputedStyle(p) : null
    const gridish = cs && (cs.display.includes("grid") || (cs.display.includes("flex") && cs.flexWrap === "wrap"))
    const sibs = gridish ? shown.filter((o) => o.parentElement === p) : [el]
    if (sibs.length >= 3 && sibs.every((o) => o.getBoundingClientRect().height < 200)) {
      sibs.forEach((o) => used.add(o)); tiles = Math.max(tiles, sibs.length); regions.push(`tiles(${sibs.length})`); continue
    }
    used.add(el)
    const name = el.getAttribute("data-region") || el.getAttribute("data-slot") || el.getAttribute("role") || el.tagName.toLowerCase()
    const heading = el.querySelector("h2, h3, [data-slot=card-title]")
    regions.push(heading ? `${name}:${heading.textContent.trim().slice(0, 18)}` : name)
  }
  if (header) regions.unshift("page-header")

  // ---- Figures
  let figures = 0
  for (const el of all("[data-figure]").filter(above)) {
    if (el.parentElement.closest("[data-figure]") || el.closest("[role=tab], table, [role=table]")) continue
    const kind = el.getAttribute("data-figure")
    if (kind === "tab-count") continue
    if (kind === "kpis") figures += [...el.querySelectorAll("a[href]")].filter(visible).length || 1
    else figures += 1
  }
  const hasTabs = all("[role=tablist]").some(above)

  // ---- Charts
  const chartEls = all("[data-chart], [data-slot=chart]").filter((el) => holds(el) && el.getBoundingClientRect().height >= 80 && !el.closest("[data-figure], table, [role=table], [role=grid]"))
  const charts = chartEls.filter((el) => !chartEls.some((o) => o !== el && o.contains(el)))

  // ---- Controls
  const stopAtTable = TYPE === "dashboard" || TYPE === "list" || TYPE === "detail"
  // Split view: the page counts above its first table, the open panel (portalled outside main) over the whole first viewport.
  const pageData = TYPE === "split" ? [...main.querySelectorAll("[data-chart], [role=table], table, [role=grid]")].filter((el) => !excluded(el) && visible(el)) : all("[data-chart], [role=table], table, [role=grid]")
  const firstDataTop = stopAtTable || TYPE === "split" ? Math.min(FOLD, ...pageData.map((el) => el.getBoundingClientRect().top)) : FOLD
  const inPanel = (el) => (modal ? roots : roots.slice(1)).some((d) => d.contains(el))
  const FIELD = "[role=combobox], [role=switch], [role=checkbox], [role=radio], [role=slider], select, input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea"
  const ACTION = "button, [role=button], [role=tab], a[data-slot=button]"
  const ctlSel = `${FIELD}, ${ACTION}`
  const raw = all(ctlSel).filter((el) => {
    const r = el.getBoundingClientRect()
    if (!(r.top < (inPanel(el) ? FOLD : firstDataTop) && r.bottom > 0)) return false
    if (el.closest("[data-figure]") || el.closest("table, [role=table], [role=grid]")) return false
    if (el.tagName !== "A" && el.closest("a")) return false
    if (el.parentElement && el.parentElement.closest(ctlSel)) return false
    return true
  })
  const groups = new Map()
  const fields = []
  const actions = []
  for (const el of raw) {
    if (el.getAttribute("role") === "radio" || (el.tagName === "INPUT" && el.type === "radio")) {
      const g = el.closest("[role=radiogroup], [role=group], fieldset") ?? el
      if (!groups.has(g)) { groups.set(g, el); fields.push(g) }
      continue
    }
    if (el.matches(FIELD)) fields.push(el)
    else if (el.getAttribute("role") === "tab") {
      // A tab list is one single choice (see header, SINGLE-CHOICE GROUP RULE): the whole list counts as ONE control.
      const g = el.closest("[role=tablist]") ?? el
      if (!groups.has(g)) { groups.set(g, el); fields.push(g) }
    }
    else actions.push(el)
  }
  const isForm = TYPE === "form" || TYPE === "wizard"
  const isEval = TYPE === "evaluator"
  const counted = isForm ? fields : fields.concat(actions)
  const isDisabled = (el) => el.disabled || el.getAttribute("aria-disabled") === "true" || el.hasAttribute("data-disabled")
  // Pager exemption: a Previous/Next pair at its first or last record keeps the dead half in place (hiding it would move the
  // live half under the pointer, Fitts and Jakob), so a disabled "Previous ..." or "Next ..." is not a dead control.
  const pagerHalf = (el) => /^(previous|next)\b/i.test(el.getAttribute("aria-label") || el.textContent.trim())
  const disabledEls = fields.concat(actions).filter((el) => isDisabled(el) && !pagerHalf(el))
  const outcomeGroups = fields.filter((el) => el.matches?.("[role=radiogroup], [role=group], fieldset")).length
  const controlBudgetEval = 3 * Math.max(1, outcomeGroups) + 1

  // ---- Prose words
  const skip = "button, a, label, th, td, [role=cell], [role=gridcell], [role=rowheader], [role=columnheader], [role=tab], table, [role=table], [role=grid], figure, svg, [data-figure], [data-scope-bar], h1, h2, h3, legend, [aria-label=Legend], [data-slot=badge], dt, dd, [data-viz-label], blockquote, q, [data-user-content], [data-artifact-preview], [role=tooltip], [aria-hidden=true], option, [role=option], .sr-only, " + EXCL
  const SHORT_LABEL_CTX = "[data-chart], [data-slot=chart], li, [role=listitem], [role=row]"
  const sentences = []
  const wordSources = []
  let words = 0
  const textNodes = roots.flatMap((root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const a = []; for (let n = w.nextNode(); n; n = w.nextNode()) a.push(n); return a })
  for (const n of textNodes) {
    const el = n.parentElement
    if (!el || el.closest(skip) || !visible(el)) continue
    const r = el.getBoundingClientRect()
    if (r.top >= FOLD || r.bottom <= 0) continue
    const text = n.textContent.trim()
    if (!text) continue
    const tokens = text.split(/\s+/).filter((t) => !/^[\d.,%:/+()-]+$/.test(t) && /\p{L}/u.test(t))
    if (tokens.length <= 3 && el.closest(SHORT_LABEL_CTX)) continue
    words += tokens.length
    if (tokens.length) wordSources.push(`${tokens.length}: ${text.slice(0, 70)}`)
    for (const s of text.split(/(?<=[.!?])\s+/)) if (s.split(/\s+/).length >= 5) sentences.push(s.toLowerCase())
  }
  const seen = new Set()
  const repeats = sentences.filter((s) => (seen.has(s) ? true : (seen.add(s), false)))

  // ---- Artifact previews must be framed and labelled ("Email preview", "Text message preview", "Inbox preview").
  const unlabeledPreviews = all("[data-artifact-preview]").filter(above).filter((el) => {
    const frame = el.closest("[data-region], [data-slot=card]") ?? el
    return !/\bpreview\b/i.test(frame.getAttribute("aria-label") || "") && !/\bpreview\b/i.test(frame.innerText || "")
  }).length

  // ---- Primary actions
  const primary = all("[data-slot=button][data-variant=default]").filter(above)
  const primaryN = new Set(primary).size

  // ---- Hues: resolved by the browser, painted over white, read back as sRGB, then OKLCH.
  const cv = document.createElement("canvas"); cv.width = cv.height = 1
  const cx = cv.getContext("2d", { willReadFrequently: true })
  const paint = (str) => {
    cx.globalCompositeOperation = "copy"; cx.fillStyle = "#ffffff"; cx.fillRect(0, 0, 1, 1)
    cx.globalCompositeOperation = "source-over"; cx.fillStyle = "rgba(0,0,0,0)"; cx.fillStyle = str; cx.fillRect(0, 0, 1, 1)
    const d = cx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2]]
  }
  const oklch = ([R, G, B]) => {
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    const [r, g, b] = [lin(R), lin(G), lin(B)]
    const l = Math.cbrt(0.4122214708 * r + 0.5363015264 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    return { c: Math.hypot(A, Bb), h: ((Math.atan2(Bb, A) * 180) / Math.PI + 360) % 360 }
  }
  const hueHits = []
  for (const el of [...main.querySelectorAll("*")].filter((e) => !excluded(e) && painted(e) && above(e))) {
    const cs = getComputedStyle(el)
    const props = el instanceof SVGElement ? ["fill", "stroke"] : ["backgroundColor"]
    if (!(el instanceof SVGElement) && /(^|\s)fa-/.test(el.getAttribute("class") || "")) props.push("color")
    for (const prop of props) {
      const v = cs[prop]
      if (!v || v === "none" || v === "transparent" || v.startsWith("url(")) continue
      if (prop === "stroke" && parseFloat(cs.strokeWidth) === 0) continue
      const o = oklch(paint(v))
      if (o.c > 0.06) hueHits.push({ h: o.h, what: `${el.tagName.toLowerCase()}.${prop}` })
    }
  }
  hueHits.sort((a, b) => a.h - b.h)
  const clusters = []
  for (const hit of hueHits) {
    const last = clusters[clusters.length - 1]
    if (last && hit.h - last.max < 25) { last.max = hit.h; last.n++; last.what.add(hit.what) } else clusters.push({ min: hit.h, max: hit.h, n: 1, what: new Set([hit.what]) })
  }
  if (clusters.length > 1 && clusters[0].min + 360 - clusters[clusters.length - 1].max < 25) { const l = clusters.pop(); clusters[0].n += l.n; clusters[0].min = l.min }
  const hues = clusters.map((c) => ({ hue: Math.round((c.min + c.max) / 2) % 360, n: c.n, what: [...c.what].slice(0, 3).join(" ") }))

  return {
    regions, tiles, figures, hasTabs, charts: charts.length,
    controls: counted.length, fields: fields.length, actions: actions.length, controlNames: counted.map(label), actionNames: actions.map(label),
    disabled: disabledEls.length, disabledNames: disabledEls.map(label), controlBudgetEval,
    words, primary: primaryN, hues, repeats, wordSources, unlabeledPreviews,
  }
}

function judge(c, m) {
  const b = { ...BUDGET[c.type] }
  if (c.type === "list" && !m.hasTabs) b.figures = b.figuresNoTabs
  if (c.type === "evaluator") b.controls = m.controlBudgetEval
  if (c.w < 768 && c.type !== "evaluator") b.words = PHONE_WORDS
  const ex = EXCEPTIONS[c.id] ?? {}
  for (const k of Object.keys(ex)) if (typeof ex[k] === "number") b[k] += ex[k]
  const checks = {
    regions: m.regions.length <= b.regions,
    tiles: m.tiles <= 6,
    figures: m.figures <= b.figures,
    charts: m.charts <= b.charts && m.charts <= 3,
    controls: m.controls <= b.controls,
    disabled: m.disabled === 0,
    words: m.words <= b.words,
    primary: m.primary <= b.primary,
    hues: m.hues.length <= b.hues,
    repeats: m.repeats.length === 0,
    previews: !m.unlabeledPreviews,
  }
  return { b, checks, ok: Object.values(checks).every(Boolean), exception: ex.why ?? null }
}

const chromium = await loadChromium()
const browser = await chromium.launch()
if (SHOTS) mkdirSync(SHOTS, { recursive: true })
const out = []
const queue = [...CASES]
async function worker() {
  const ctx = await browser.newContext()
  await ctx.addInitScript(() => { try { window.localStorage.clear() } catch { /* private */ } })
  const page = await ctx.newPage()
  for (let c = queue.shift(); c; c = queue.shift()) {
    // One retry: a dev-server rebuild (another worker saving a file) can reload the page mid-measure.
    for (let attempt = 0; attempt < 2; attempt++) try {
      await page.setViewportSize({ width: c.w, height: c.h })
      try { await page.goto(base + c.route, { waitUntil: "load", timeout: 240000 }) } catch (e) {
        // A screen that replaces its own URL on mount aborts the first navigation; wait for the settled page instead.
        if (!String(e).includes("ERR_ABORTED")) throw e
        await page.waitForLoadState("load", { timeout: 60000 })
      }
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForSelector("main h1, main [data-slot=page-header], main", { timeout: 60000 })
      await page.waitForTimeout(1200)
      // Settle: a client screen may still be hydrating or showing skeletons; measure until two reads 800 ms apart agree.
      let m = await page.evaluate(measure, { FOLD: c.h, TYPE: c.type })
      for (let k = 0; k < 5; k++) {
        await page.waitForTimeout(800)
        const again = await page.evaluate(measure, { FOLD: c.h, TYPE: c.type })
        const same = again.regions.length === m.regions.length && again.controls === m.controls && again.words === m.words && again.figures === m.figures
        m = again
        if (same && !(await page.$("main [data-slot=skeleton]"))) break
      }
      const j = judge(c, m)
      if (SHOTS) {
        const name = `${c.id.replace(/\//g, "-")}${c.stu ? "-" + c.stu : ""}-${c.w}.png`
        await page.screenshot({ path: join(SHOTS, name) })
      }
      out.push({ ...c, ...m, ...j })
      break
    } catch (e) {
      if (attempt === 1) out.push({ ...c, error: String(e).slice(0, 200), ok: false, checks: {} })
    }
    if (!asJson) process.stderr.write(".")
  }
  await ctx.close()
}
await Promise.all(Array.from({ length: Math.max(1, WORKERS) }, worker))
await browser.close()
const order = new Map(CASES.map((c, i) => [c, i]))
out.sort((a, b) => CASES.findIndex((c) => c.route === a.route && c.w === a.w) - CASES.findIndex((c) => c.route === b.route && c.w === b.w))
void order

const failed = out.filter((r) => !r.ok)
if (asJson) console.log(JSON.stringify(out, null, 1))
else {
  console.log("\n| Screen | V | Viewport | Type | Regions | Figures | Charts | Controls | Words | Hues | Result | Over |")
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|")
  for (const r of out) {
    const who = r.stu ? ` (${r.stu})` : ""
    if (r.error) { console.log(`| ${r.key}${who} | ${r.variant} | ${r.w} | ${r.type} | | | | | | | ERROR | ${r.error.replace(/\|/g, "/")} |`); continue }
    const over = Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k).join(", ")
    const ctl = r.type === "form" || r.type === "wizard" ? `${r.controls}/${r.b.controls} fields` : `${r.controls}/${r.b.controls}`
    console.log(`| ${r.key}${who} | ${r.variant} | ${r.w} | ${r.type} | ${r.regions.length}/${r.b.regions}${r.tiles ? ` (${r.tiles} tiles)` : ""} | ${r.figures}/${r.b.figures} | ${r.charts}/${r.b.charts} | ${ctl}${r.disabled ? `, ${r.disabled} disabled` : ""} | ${r.words}/${r.b.words} | ${r.hues.length}/${r.b.hues} | ${r.ok ? "PASS" : "FAIL"} | ${over}${r.exception ? ` (exception: ${r.exception})` : ""} |`)
  }
  if (debug) {
    for (const r of out.filter((x) => !x.ok && !x.error)) {
      console.log(`\n## ${r.id}${r.stu ? " " + r.stu : ""} @${r.w}`)
      console.log(`  regions: ${r.regions.join(" | ")}`)
      console.log(`  controls: ${r.controlNames.join(" | ")}${r.type === "form" || r.type === "wizard" ? `  [actions: ${r.actionNames.join(" | ")}]` : ""}`)
      if (r.disabled) console.log(`  disabled: ${r.disabledNames.join(" | ")}`)
      console.log(`  hues: ${r.hues.map((h) => `${h.hue}deg x${h.n} (${h.what})`).join("; ")}`)
      console.log(`  words: ${r.wordSources.join(" || ")}`)
      if (r.repeats.length) console.log(`  repeats: ${r.repeats.join(" || ")}`)
    }
  }
  console.log(`\n${out.length - failed.length} of ${out.length} cases pass.`)
  console.log(failed.length ? "DENSITY BUDGET FAILED" : "DENSITY BUDGET PASSED")
}
process.exit(failed.length ? 1 : 0)
