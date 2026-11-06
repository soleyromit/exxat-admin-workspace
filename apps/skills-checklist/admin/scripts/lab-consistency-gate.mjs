#!/usr/bin/env node
// Consistency gate for the admin path: section E of docs/build/2026-11-04-admin-workflow-map.md, checked across pages.
// Usage: node scripts/lab-consistency-gate.mjs [--base=http://localhost:3017] [--page=D3] [--static-only] [--json]
//        node scripts/lab-consistency-gate.mjs --self-test   shows every rule rejects a bad fixture and accepts a good one (no server)
// Rules: save-label (E4), one-filled (E5), save-position (E3), row-menu (E8), bulk-bar (E9), no-toast (E10), discard (E6), status-words (D0, E15).
// A check that could not run counts as a failure of the gate, listed under NOT RUN. Exit 1 on any finding or any NOT RUN.
// Romit, 2026-11-04: expected to fail until the build follows the map. Change the lists below only when the map changes.
// Not wired into any hook yet. Needs the dev server for the runtime half; never restarts it.
import fs from "node:fs"
import path from "node:path"
import { ADMIN_ROOT, APP_ROOT, arg, chromium, flows, freshPage, screens, settle } from "./lib/lab-gate-common.mjs"

const args = process.argv.slice(2)
const BASE = arg(args, "base", "http://localhost:3017")
const ONLY = arg(args, "page", null)
const STATIC_ONLY = args.includes("--static-only")
const AS_JSON = args.includes("--json")
const VIEWPORT = { width: 1440, height: 900 }

// ---------- The single lists, each taken from the map ----------

/** Words that commit a change. Only labels starting with one of these are held to the vocabulary. */
const COMMIT_VERB = /^(Save|Apply|Update|Publish|Submit|Confirm|Done|Finish|Store)\b/i
/** The allowed commit labels: D1a, D3, D4, D6, D8 (Save...; D6 Rename: Save name), D1b (Update N), D3 dialog (Apply to N, or Apply settings with no skills yet), D3 Edit fields (Save fields, Save field). N is a count. */
const SAVE_LABELS = [/^Save$/, /^Save N skills?$/, /^Save changes$/, /^Save settings$/, /^Save list$/, /^Save as new list$/, /^Save name$/, /^Save fields?$/, /^Update N skills?$/, /^Apply to N( skills?)?$/, /^Apply settings$/]
/** D0 status words, and the status tabs D1 draws from them. */
/** Every Status and Configuration word is a status tag (D-L127). */
const SKILL_STATUS = ["Active", "Inactive", "Not configured", "Default", "Custom"]
const LIBRARY_TABS = ["All", "Active", "Inactive"]
const DISCARD_TITLE = "Discard your changes?"
const DISCARD_KEEP = "Keep editing"
const DISCARD_GO = "Discard"
/** E8 order: Edit, lifecycle, Deactivate or Reactivate, then a separator, then Delete. Add skills and Rename are D6's edits. */
const MENU_CLASS = [
  [0, /^(Edit|Add skills|Rename)\b/],
  [1, /^(Assign|Make default|New version|Change skills)\b/],
  [2, /^(Deactivate|Reactivate)\b/],
  [3, /^Delete\b/],
]

const findings = []
const notRun = []
const add = (page, rule, mode, where, detail) => findings.push({ page, rule, mode, where, detail })
const skip = (page, rule, what, why) => notRun.push({ page, rule, what, why: String(why).split("\n")[0].slice(0, 140) })

const labelOk = (label) => SAVE_LABELS.some((re) => re.test(normalize(label)))
/** Turn figures into N and the program's noun into "skills", so a label is compared without its data. */
function normalize(label) {
  return label.replace(/[\d,]+/g, "N").replace(/\bN N\b/g, "N skills").replace(/\s+/g, " ").trim()
}

// ---------- Which files and pages are on the admin path ----------

const registry = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "docs/build/contracts/_page-registry.json"), "utf8"))
const flow = flows().find((f) => f.id === "setup-walkthrough")
const setId = flow.recommendedSet
const screenList = screens()
/** The recommended variant's file for each path step. Other variants are not on the path, so they are not judged here. */
const pathScreenFiles = new Set(flow.steps.map((s) => {
  const scr = screenList.find((x) => `${x.persona}/${x.slug}` === s.screen)
  return scr?.variants.find((v) => v.id === s.variants[setId])?.file
}).filter(Boolean).map((f) => `admin/${f}`))

const globRe = (g) => new RegExp(`^${g.split("**").map((p) => p.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*")).join(".*")}$`)
const pagesOfFile = (rel) => registry.pages.filter((p) => p.files.some((g) => globRe(g).test(rel))).map((p) => p.id)

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(e.name)) out.push(p)
  }
  return out
}
const staticFiles = [...new Set([
  // A preview file draws another person's form (the student's Submit), so its buttons are not this admin's Save.
  ...["library", "configure", "admin-a"].flatMap((d) => walk(path.join(ADMIN_ROOT, "components/lab", d))).filter((f) => !/preview/.test(path.basename(f))),
  ...walk(path.join(ADMIN_ROOT, "components/lab/screens")).filter((f) => pathScreenFiles.has(`admin/${path.relative(ADMIN_ROOT, f)}`)),
  ...registry.pages.flatMap((p) => p.files.filter((g) => !g.includes("*") && !g.includes("/screens/")).map((g) => path.join(APP_ROOT, g))).filter((f) => fs.existsSync(f)),
])]

// ---------- Static half ----------

/** Each <Tag ...>inner</Tag> in a file, with the tag walker skipping braces and quotes so an arrow function in a prop is not the end. */
function elements(src, tags) {
  const out = []
  const re = new RegExp(`<(${tags.join("|")})\\b`, "g")
  for (let m = re.exec(src); m; m = re.exec(src)) {
    let i = m.index + m[0].length
    let depth = 0
    let quote = null
    for (; i < src.length; i++) {
      const c = src[i]
      if (quote) { if (c === quote && src[i - 1] !== "\\") quote = null; continue }
      if (c === '"' || c === "'" || c === "`") { quote = c; continue }
      if (c === "{") depth++
      else if (c === "}") depth--
      else if (c === ">" && depth === 0) break
    }
    if (src[i - 1] === "/") continue
    const close = src.indexOf(`</${m[1]}>`, i)
    if (close === -1) continue
    out.push({ tag: m[1], inner: src.slice(i + 1, close), line: src.slice(0, m.index).split("\n").length, end: close })
  }
  return out
}

/** The text an element can show: every string in a { } expression, with ${} and non-string expressions as N. */
function labelsOf(inner) {
  const stripped = inner.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/<[^>]*\/>/g, " ").replace(/<\/?[a-zA-Z][^>]*>/g, " ").trim()
  const lit = (expr) => [...expr.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)].map((x) => (x[1] ?? x[2] ?? x[3]).replace(/\$\{[^}]*\}/g, "N"))
  const whole = stripped.match(/^\{([\s\S]*)\}$/)
  if (whole && !whole[1].includes("{")) return lit(whole[1]).map((s) => s.trim()).filter(Boolean)
  if (whole && lit(whole[1]).length) return lit(whole[1]).map((s) => s.trim()).filter(Boolean)
  return [stripped.replace(/\{[^}]*\}/g, (e) => lit(e)[0] ?? "N").replace(/\s+/g, " ").trim()].filter(Boolean)
}

/** The attributes of each opening <Tag ...>, including a self-closing one. */
function openingTags(src, tag) {
  const out = []
  const re = new RegExp(`<${tag}\\b`, "g")
  for (let m = re.exec(src); m; m = re.exec(src)) {
    let i = m.index + m[0].length
    let depth = 0
    let quote = null
    for (; i < src.length; i++) {
      const c = src[i]
      if (quote) { if (c === quote && src[i - 1] !== "\\") quote = null; continue }
      if (c === '"' || c === "'" || c === "`") { quote = c; continue }
      if (c === "{") depth++
      else if (c === "}") depth--
      else if (c === ">" && depth === 0) break
    }
    out.push({ attrs: src.slice(m.index + m[0].length, i), line: src.slice(0, m.index).split("\n").length })
  }
  return out
}

const COMPONENT_START = /^\s*(?:export\s+)?(?:default\s+)?(?:function\s+|const\s+)([A-Z]\w*)/
/** The only press a picker's strip may hold: it changes what is ticked, it does nothing to the things ticked. */
const PICKER_PRESS = /^(select|clear)\b/i

/**
 * A picker's selection is the value of a form: its count may stay in view above the checkbox rows, with a Select all or Clear beside it. It is exempt only when it is one:
 * the component is named a picker, draws its own checkbox rows, holds no DataTable (a table's selection belongs to the shared bar), and the strip acts on nothing.
 */
function stripOfPicker(lines, i) {
  let from = i
  while (from >= 0 && !COMPONENT_START.test(lines[from])) from--
  if (from < 0 || !/Picker$/.test(lines[from].match(COMPONENT_START)[1])) return false
  let to = i + 1
  while (to < lines.length && !COMPONENT_START.test(lines[to])) to++
  const body = lines.slice(from, to).join("\n")
  if (!/<Checkbox\w*\b/.test(body) || /<DataTable\b/.test(body)) return false
  // The rest of the strip: what follows the count, up to the rows.
  const after = lines.slice(i, to).join("\n")
  const rows = after.search(/<Checkbox\w*\b|<ul\b|<ol\b/)
  const strip = rows === -1 ? after : after.slice(0, rows)
  return elements(strip, ["Button"]).every((b) => {
    const words = b.inner.replace(/<[^>]*>/g, " ").match(/[A-Za-z]+/g) ?? []
    return words.some((w) => PICKER_PRESS.test(w)) && !/\b(delete|remove|deactivate|assign|archive|move|export|send)\b/i.test(words.join(" "))
  })
}

/** Static rules on one source file. `report(rule, line, detail)` records each break. */
function scanSource(src, report) {
    for (const el of elements(src, ["Button", "AlertDialogAction"])) {
      for (const label of labelsOf(el.inner)) {
        if (COMMIT_VERB.test(label) && !labelOk(label)) report("save-label", el.line, `"${label}" is not an allowed Save label`)
      }
    }

    const lines = src.split("\n")
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return
      if (/from\s+["']sonner["']|\btoast\s*[.(]|\buseToast\b|<Toaster\b/.test(line)) report("no-toast", i + 1, line.trim().slice(0, 90))
      // A count of selected rows in a fixed or sticky strip of its own is a hand-made bulk bar. Counts inside a picker are not.
      if (/(\$\{[^}]+\}|\{[^}]+\}|\d+)\s+selected\b/.test(line) && /\b(sticky|fixed)\b/.test(lines.slice(Math.max(0, i - 6), i + 1).join(" ")) && !stripOfPicker(lines, i)) {
        report("bulk-bar", i + 1, `hand-made selection bar: ${line.trim().slice(0, 80)}`)
      }
    })

    for (const t of openingTags(src, "DataTable")) {
      if (/\bselectable\b(?!=\{false\})/.test(t.attrs) && !/bulkActionsSlot|bulkActions\b/.test(t.attrs)) {
        report("bulk-bar", t.line, "a DataTable with selection and no bulkActionsSlot")
      }
    }

    for (const title of elements(src, ["AlertDialogTitle"])) {
      for (const label of labelsOf(title.inner)) {
        if (!/discard|unsaved|leave|lose\b|abandon/i.test(label)) continue
        if (label !== DISCARD_TITLE) report("discard", title.line, `title "${label}", must read "${DISCARD_TITLE}"`)
        const rest = src.slice(title.end, title.end + 900)
        const [cancel] = elements(rest, ["AlertDialogCancel"])
        const [go] = elements(rest, ["AlertDialogAction"])
        const cancelText = cancel ? labelsOf(cancel.inner)[0] : null
        const goText = go ? labelsOf(go.inner)[0] : null
        if (cancelText && cancelText !== DISCARD_KEEP) report("discard", title.line, `button "${cancelText}", must read "${DISCARD_KEEP}"`)
        if (goText && goText !== DISCARD_GO) report("discard", title.line, `button "${goText}", must read "${DISCARD_GO}"`)
      }
    }
}

function scanStatic() {
  for (const file of staticFiles) {
    const short = path.relative(ADMIN_ROOT, file)
    const pages = pagesOfFile(path.relative(APP_ROOT, file))
    scanSource(fs.readFileSync(file, "utf8"), (rule, line, detail) => {
      for (const p of pages.length ? pages : ["shared"]) add(p, rule, "static", `${short}:${line}`, detail)
    })
  }
}

// ---------- Runtime half ----------

const stepHref = (screen, params = {}) => {
  const step = flow.steps.find((s) => s.screen === screen && Object.entries(params).every(([k, v]) => s.params?.[setId]?.[k] === v) && (Object.keys(params).length || !s.params?.[setId]?.view))
  if (step) {
    const q = new URLSearchParams({ set: setId, ...(step.params?.[setId] ?? {}), present: "1" })
    return `/lab/flow/${flow.id}/${step.id}?${q}`
  }
  return `/lab/${screen}?${new URLSearchParams(params)}`
}

/** Reads one surface in the page. The whole read happens in the browser, so a list of labels and places comes back. */
const readSurfaces = (page) => page.evaluate(({ commit }) => {
  const commitRe = new RegExp(commit, "i")
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden" }
  const overlays = [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].filter(vis).filter((e) => !e.closest("[data-lab-chrome]"))
  const labelOf = (b) => (b.innerText || b.getAttribute("aria-label") || "").split("\n")[0].trim()
  const isFilled = (b) => ["default", "destructive-solid", "destructive"].includes(b.dataset.variant)
  const buttons = (root, skip) => [...root.querySelectorAll("button,a")].filter((b) => /^(button|alert-dialog-action|alert-dialog-cancel)$/.test(b.dataset.slot || "") || (b.closest("[role=alertdialog]") && b.dataset.variant))
    .filter(vis).filter((b) => !b.closest("[data-lab-chrome],[data-slot=sidebar],[data-sidebar=sidebar]")).filter((b) => !skip || !skip.some((o) => o.contains(b)))
  const describe = (root, kind, skip) => {
    const all = buttons(root, skip)
    const box = root.getBoundingClientRect()
    return {
      kind,
      title: kind === "page" ? (document.querySelector("h1")?.innerText ?? "") : (root.querySelector("h1,h2,[data-slot$=title]")?.innerText ?? "").split("\n")[0],
      // The two halves of one split button are one control (Romit 2026-11-06 asked that both halves match).
      filled: all.filter((b) => isFilled(b) && !b.hasAttribute("data-add-menu-trigger")).map(labelOf),
      secondary: all.filter((b) => b.dataset.variant === "secondary").map(labelOf),
      commits: all.filter((b) => commitRe.test(labelOf(b))).map((b) => {
        const r = b.getBoundingClientRect()
        return {
          label: labelOf(b),
          inHeader: !!b.closest("[data-slot=page-header]"),
          // Bottom right: within the last 120 px and in the right half of the surface.
          bottomRight: box.bottom - r.bottom < 120 && r.left + r.width / 2 > box.left + box.width / 2,
          stickyFooter: (() => { for (let a = b.parentElement; a && a !== root; a = a.parentElement) { const p = getComputedStyle(a).position; if ((p === "fixed" || p === "sticky") && !a.closest("[data-slot=page-header]") && a.getBoundingClientRect().top > 300) return true } return false })(),
        }
      }),
    }
  }
  return [describe(document.body, "page", overlays), ...overlays.map((o, i) => describe(o, o.getAttribute("role") === "alertdialog" ? "alert dialog" : `panel ${i + 1}`))]
}, { commit: COMMIT_VERB.source })

function judgeSurfaces(pageId, where, surfaces, { pageNeedsOne = true } = {}) {
  for (const s of surfaces) {
    const at = `${where}, ${s.kind}${s.kind === "page" ? "" : ` "${s.title}"`}`
    if (s.kind === "page") {
      // A page with an overlay open is judged when it stands alone, so its count is only taken here on request.
      if (pageNeedsOne && s.filled.length !== 1) add(pageId, "one-filled", "runtime", at, `${s.filled.length} filled button(s), must be 1: ${s.filled.join(", ") || "none"}`)
    } else if (s.filled.length > 1) add(pageId, "one-filled", "runtime", at, `${s.filled.length} filled buttons, must be at most 1: ${s.filled.join(", ")}`)
    if (s.secondary.length) add(pageId, "one-filled", "runtime", at, `secondary variant, everything else must be outline or ghost: ${s.secondary.join(", ")}`)
    for (const c of s.commits) {
      if (!labelOk(c.label)) add(pageId, "save-label", "runtime", at, `"${c.label}" is not an allowed Save label`)
      if (s.kind === "page") {
        if (!c.inHeader) add(pageId, "save-position", "runtime", at, `"${c.label}" is not in the page header`)
        if (c.stickyFooter) add(pageId, "save-position", "runtime", at, `"${c.label}" is in a sticky or floating footer`)
      } else if (!c.bottomRight) add(pageId, "save-position", "runtime", at, `"${c.label}" is not bottom right of the ${s.kind}`)
    }
  }
}

function judgeMenu(pageId, where, items) {
  const entries = items.filter((x) => x.role === "menuitem")
  const classes = entries.map((e) => ({ ...e, cls: MENU_CLASS.find(([, re]) => re.test(e.text))?.[0] ?? null }))
  for (const c of classes) if (c.cls === null) add(pageId, "row-menu", "runtime", where, `"${c.text}" is not a row action in the agreed order`)
  const known = classes.filter((c) => c.cls !== null)
  for (let i = 1; i < known.length; i++) {
    if (known[i].cls < known[i - 1].cls) add(pageId, "row-menu", "runtime", where, `"${known[i].text}" comes after "${known[i - 1].text}"; order is Edit, lifecycle, Deactivate or Reactivate, Delete`)
  }
  const del = items.findIndex((x) => x.role === "menuitem" && /^Delete\b/.test(x.text))
  if (del !== -1) {
    // A menu holding only Delete (the panel's "...") has nothing to separate it from.
    if (del > 0 && items[del - 1]?.role !== "separator") add(pageId, "row-menu", "runtime", where, "Delete has no separator before it")
    if (items[del].variant !== "destructive") add(pageId, "row-menu", "runtime", where, "Delete is not in destructive style")
    if (items.slice(del + 1).some((x) => x.role === "menuitem")) add(pageId, "row-menu", "runtime", where, "Delete is not last")
  }
}

const readMenu = (page) => page.evaluate(() => [...document.querySelectorAll("[role=menu] [role=menuitem], [role=menu] [role=separator]")].filter((e) => e.getBoundingClientRect().width > 0)
  .map((e) => ({ role: e.getAttribute("role"), text: (e.innerText || "").split("\n")[0].trim(), variant: e.dataset.variant ?? null })))

async function checkRowMenu(page, pageId, where, row) {
  const trigger = row.locator("[aria-haspopup=menu]").last()
  if (!(await trigger.count())) return skip(pageId, "row-menu", where, "no row menu found")
  await trigger.click({ timeout: 8000 })
  await page.waitForTimeout(350)
  judgeMenu(pageId, where, await readMenu(page))
  await page.keyboard.press("Escape")
  await page.waitForTimeout(200)
}

async function checkBulk(page, pageId, where, count = 3) {
  const boxes = page.locator('[data-slot=checkbox][aria-label^="Select row"]')
  if ((await boxes.count()) < count) return skip(pageId, "bulk-bar", where, `fewer than ${count} selectable rows`)
  if (await page.locator('[aria-label="Clear selection"]').count()) add(pageId, "bulk-bar", "runtime", where, "bar shown before any selection")
  for (let i = 0; i < count; i++) await boxes.nth(i).click({ timeout: 8000 })
  await page.waitForTimeout(500)
  const bar = await page.evaluate(() => {
    // The DS BulkSelectionBar is an <output> holding the actions and a Clear selection button. Anything else is hand made.
    const clear = document.querySelector('output [aria-label="Clear selection"]')
    if (!clear) return null
    const box = clear.closest("output")
    const label = (b) => (b.innerText || b.getAttribute("aria-label") || "").split("\n")[0].trim()
    return { actions: [...box.querySelectorAll("button")].filter((b) => b !== clear && b.getBoundingClientRect().width > 0).map(label) }
  })
  if (!bar) add(pageId, "bulk-bar", "runtime", where, "selecting rows shows no shared DataTable bulk bar")
  else if (bar.actions.length > 3) add(pageId, "bulk-bar", "runtime", where, `${bar.actions.length} actions, at most 3: ${bar.actions.join(", ")}`)
  judgeSurfaces(pageId, `${where}, rows selected`, await readSurfaces(page))
}

/** Click a sidebar row while the page is dirty and read the dialog that must appear. */
async function checkDiscardByLeaving(page, pageId, where) {
  const link = page.locator("[data-slot=secondary-panel] a").filter({ hasText: /^\s*Library\s*$/ }).first()
  if (!(await link.count())) return skip(pageId, "discard", where, "no panel row to leave by")
  const from = page.url()
  await link.click({ timeout: 8000 })
  await page.waitForTimeout(900)
  await readDiscard(page, pageId, where, from)
}

async function readDiscard(page, pageId, where, from) {
  const dialog = await page.evaluate(() => {
    const d = [...document.querySelectorAll("[role=alertdialog]")].find((e) => e.getBoundingClientRect().width > 0)
    if (!d) return null
    return { title: (d.querySelector("[data-slot=alert-dialog-title],h2")?.innerText ?? "").trim(), buttons: [...d.querySelectorAll("button,a")].map((b) => (b.innerText || "").split("\n")[0].trim()).filter(Boolean) }
  })
  if (!dialog) {
    add(pageId, "discard", "runtime", where, page.url() !== from ? "left with unsaved changes and nothing asked" : "nothing asked")
    return
  }
  if (dialog.title !== DISCARD_TITLE) add(pageId, "discard", "runtime", where, `title "${dialog.title}", must read "${DISCARD_TITLE}"`)
  for (const want of [DISCARD_KEEP, DISCARD_GO]) if (!dialog.buttons.includes(want)) add(pageId, "discard", "runtime", where, `no "${want}" button; has ${dialog.buttons.join(", ")}`)
  judgeSurfaces(pageId, `${where}, discard dialog`, (await readSurfaces(page)).filter((s) => s.kind === "alert dialog"))
}

async function checkSkillStatus(page, pageId, where) {
  const words = await page.evaluate(() => [...new Set([...document.querySelectorAll("tbody [data-slot=status-badge]")].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.getAttribute("aria-label") || e.innerText.trim()))])
  if (!words.length) return skip(pageId, "status-words", where, "no status badges in the table")
  for (const w of words) if (!SKILL_STATUS.includes(w)) add(pageId, "status-words", "runtime", where, `status "${w}" is not a D0 word`)
}

const rowsOf = (page) => page.locator("tbody tr").filter({ has: page.locator("[aria-haspopup=menu]") })

/** One function per page: what to open, what to read. Anything that throws is reported as NOT RUN for that rule. */
const SCENARIOS = {
  D1: async (go, page) => {
    await go(stepHref("admin/skills-library"))
    judgeSurfaces("D1", "Library", await readSurfaces(page))
    await checkSkillStatus(page, "D1", "Library table")
    const tabs = await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.innerText.replace(/\s+/g, " ").replace(/\s*[\d,]+$/, "").trim()))
    for (const t of tabs) if (!LIBRARY_TABS.includes(t)) add("D1", "status-words", "runtime", "Library tabs", `tab "${t}" is not a D0 word`)
    await checkRowMenu(page, "D1", "Library, first row menu", rowsOf(page).first())
    await checkRowMenu(page, "D1", "Library, sixth row menu", rowsOf(page).nth(5))
    await checkBulk(page, "D1", "Library")
  },
  D1a: async (go, page) => {
    await go(stepHref("admin/skills-library"))
    await rowsOf(page).first().locator("a,button:not([data-slot=checkbox])").first().click({ timeout: 8000 })
    await page.waitForTimeout(1000)
    const open = await readSurfaces(page)
    if (open.length < 2) return skip("D1a", "one-filled", "Edit panel", "clicking a row opened no panel")
    judgeSurfaces("D1a", "Edit panel", open, { pageNeedsOne: false })
    const panel = page.locator("[role=dialog]").last()
    const menu = panel.locator("[aria-haspopup=menu][aria-label^='More actions']").first() // the toolbar's size menu is the DS's, not a row menu
    if (await menu.count()) {
      await menu.click({ timeout: 8000 })
      await page.waitForTimeout(350)
      judgeMenu("D1a", 'Edit panel, header "..."', await readMenu(page))
      await page.keyboard.press("Escape")
      await page.waitForTimeout(200)
    } else skip("D1a", "row-menu", 'Edit panel, header "..."', "no menu in the panel header")
    const name = panel.locator("input:not([type=checkbox]):not([type=radio])").first()
    if (!(await name.count())) return skip("D1a", "discard", "Edit panel, Cancel when changed", "panel has no editable field, so it cannot be made dirty")
    await name.fill("Consistency check")
    await page.waitForTimeout(200)
    const cancel = panel.getByRole("button", { name: /^(Cancel|Close)/ }).last()
    const from = page.url()
    await cancel.click({ timeout: 8000 })
    await page.waitForTimeout(600)
    await readDiscard(page, "D1a", "Edit panel, Cancel when changed", from)
  },
  D1b: async (go, page) => {
    await go(stepHref("admin/skills-library"))
    const boxes = page.locator('[data-slot=checkbox][aria-label^="Select row"]')
    for (let i = 0; i < 3; i++) await boxes.nth(i).click({ timeout: 8000 })
    await page.waitForTimeout(400)
    const edit = page.getByRole("button", { name: /^Edit 3\b/ })
    if (!(await edit.count())) return skip("D1b", "save-label", "Bulk edit panel", 'the bar has no "Edit 3 skills"')
    await edit.first().click({ timeout: 8000 })
    await page.waitForTimeout(800)
    judgeSurfaces("D1b", "Bulk edit panel", await readSurfaces(page), { pageNeedsOne: false })
  },
  D2: async (go, page) => {
    await go(stepHref("admin/skills-library"))
    await page.locator("[data-slot=page-header]").getByRole("button", { name: /^Add a skill$/ }).first().click({ timeout: 8000 })
    await page.waitForTimeout(800)
    const surfaces = await readSurfaces(page)
    if (surfaces.length < 2) skip("D2", "one-filled", "Add a skill sheet", "the button opened no panel in place")
    else {
      judgeSurfaces("D2", "Add a skill sheet", surfaces, { pageNeedsOne: false })
      const sheet = page.locator("[role=dialog]").last()
      const input = sheet.locator("input,textarea").first()
      if (await input.count()) {
        await input.fill("Consistency check")
        const from = page.url()
        await page.keyboard.press("Escape")
        await page.waitForTimeout(600)
        await readDiscard(page, "D2", "Add a skill sheet, Esc when changed", from)
      }
    }
    await go(stepHref("admin/skills-library"))
    await page.getByRole("button", { name: "More ways to add skills" }).click({ timeout: 8000 })
    await page.waitForTimeout(300)
    const several = page.getByRole("menuitem", { name: /several/i }).first()
    if (!(await several.count())) return skip("D2", "one-filled", "Add several sheet", "no Add several in the menu")
    await several.click({ timeout: 8000 })
    await page.waitForTimeout(1200)
    const s2 = await readSurfaces(page)
    if (s2.length < 2) return judgeSurfaces("D2", "Add several, own page", s2)
    judgeSurfaces("D2", "Add several sheet", s2, { pageNeedsOne: false })
  },
  D3: async (go, page) => {
    await go(stepHref("admin/evaluation-settings"))
    judgeSurfaces("D3", "Evaluation settings", await readSurfaces(page))
    const radio = page.locator('main [role=radio][aria-checked=false], main [data-slot=radio-group-item]:not([data-state=checked])').first()
    if (!(await radio.count())) return skip("D3", "discard", "Evaluation settings, leave when changed", "no unselected choice to change")
    await radio.click({ timeout: 8000 })
    await page.waitForTimeout(300)
    // Changing the model asks first when it would lose what was typed [REQ SC-09]; that question is not the one under test.
    const sure = page.getByRole("alertdialog").getByRole("button", { name: /^Switch/ })
    if (await sure.count()) { await sure.first().click(); await page.waitForTimeout(300) }
    await checkDiscardByLeaving(page, "D3", "Evaluation settings, leave when changed")
  },
  D4: async (go, page) => {
    await go(stepHref("admin/configure-skill", { skills: "sk-vitals,sk-handoff,sk-central-line" }))
    judgeSurfaces("D4", "Per-skill settings", await readSurfaces(page))
    // Configure one skill (map D1c): Save appears only after a change, so there is no filled button on arrival.
    await go(stepHref("admin/configure-skill", { skill: "sk-ng-tube" }))
    judgeSurfaces("D4", "Configure one skill", await readSurfaces(page), { pageNeedsOne: false })
  },
  D5: async (go, page) => {
    await go(stepHref("admin/categories-tags"))
    judgeSurfaces("D5", "Categories and tags", await readSurfaces(page))
    await checkRowMenu(page, "D5", "Categories, first row menu", rowsOf(page).first())
  },
  D6: async (go, page) => {
    await go(stepHref("admin/lists-cohorts"))
    judgeSurfaces("D6", "Skill lists", await readSurfaces(page))
    const rows = rowsOf(page)
    await checkRowMenu(page, "D6", "Skill lists, assigned row menu", rows.filter({ hasText: "Default" }).first())
    await checkRowMenu(page, "D6", "Skill lists, unassigned row menu", rows.filter({ hasText: "Not assigned" }).first())
    await page.getByRole("button", { name: /^New skill list$/ }).first().click({ timeout: 8000 })
    await page.waitForTimeout(700)
    judgeSurfaces("D6", "New skill list panel", await readSurfaces(page), { pageNeedsOne: false })
    // Add students, merged into this page (D-L106). The picker's unsaved choices ask on the way out.
    await go(stepHref("admin/lists-cohorts", { list: "list-core" }))
    await page.getByRole("button", { name: /^Assign to students$/ }).first().click({ timeout: 8000 })
    await page.waitForTimeout(700)
    judgeSurfaces("D6", "Assign to students level", await readSurfaces(page), { pageNeedsOne: false })
    await go(stepHref("admin/lists-cohorts", { list: "list-clinical-2027" }))
    await page.getByRole("button", { name: /^Edit skills$/ }).first().click({ timeout: 8000 })
    await page.waitForTimeout(500)
    await page.locator("[data-skill-picker] [data-slot=checkbox]").first().click({ timeout: 8000 })
    await page.waitForTimeout(300)
    await checkDiscardByLeaving(page, "D6", "Skill lists picker, leave when changed")
  },
  D8: async (go, page) => {
    await go(stepHref("admin/course-mapping"))
    judgeSurfaces("D8", "Course mapping, first view", await readSurfaces(page))
    await checkBulk(page, "D8", "Course mapping, first view")
    await go(stepHref("admin/course-mapping"))
    const other = page.getByRole("radio", { name: "By course" }).first()
    const tab = page.getByRole("tab", { name: "By course" }).first()
    const toggle = (await other.count()) ? other : tab
    if (!(await toggle.count())) return skip("D8", "one-filled", "Course mapping, By course", "no By course control")
    await toggle.click({ timeout: 8000 })
    await page.waitForTimeout(1000)
    judgeSurfaces("D8", "Course mapping, By course", await readSurfaces(page))
  },
}

async function runRuntime(ids) {
  const browser = await chromium().launch()
  try {
    for (const id of ids) {
      const { ctx, page } = await freshPage(browser, VIEWPORT)
      const go = (url) => settle(page, BASE, url)
      try { await SCENARIOS[id](go, page) } catch (e) {
        // A partial run still reports what it found; the rest of this page is not run.
        skip(id, "all", `rest of ${id}`, e?.message ?? e)
      }
      await ctx.close().catch(() => {})
    }
  } finally {
    await browser.close().catch(() => {})
  }
}

// ---------- Self test: every rule rejects a bad fixture and accepts a good one ----------

async function selfTest() {
  const results = []
  const expect = (name, rule, bad) => {
    const hits = findings.filter((f) => f.rule === rule)
    results.push({ name, ok: bad ? hits.length > 0 : hits.length === 0, hits: hits.map((h) => h.detail) })
    findings.length = 0
  }
  const staticRun = (src) => scanSource(src, (rule, line, detail) => add("T", rule, "static", `fixture:${line}`, detail))

  staticRun(`<Button variant="default" size="sm" onClick={() => go()}>Save and configure</Button>`); expect("static: Save and configure", "save-label", true)
  staticRun(`<Button variant="default" size="sm">Save changes</Button><Button>{\`Update \${n} skills\`}</Button>`); expect("static: Save changes, Update N skills", "save-label", false)
  staticRun(`import { toast } from "sonner"\ntoast("Saved")`); expect("static: raw toast", "no-toast", true)
  staticRun(`// toast is banned here\nconst a = 1`); expect("static: toast only in a comment", "no-toast", false)
  staticRun(`<DataTable data={r} selectable />`); expect("static: selection with no shared bar", "bulk-bar", true)
  staticRun(`<DataTable data={r} selectable bulkActionsSlot={(s) => <X s={s} />} />`); expect("static: selection with shared bar", "bulk-bar", false)
  staticRun(`<DataTable data={r} selectable={false} />`); expect("static: no selection", "bulk-bar", false)
  const pickerStrip = (name, press) => `function ${name}() {\n  return (\n    <div>\n      <div className="sticky top-0 bg-background">\n        <p>{\`\${n} selected\`}</p>\n        ${press}\n      </div>\n      <ul><li><CheckboxDs id="a" /></li></ul>\n    </div>\n  )\n}`
  staticRun(pickerStrip("SkillPicker", `<Button onClick={all}>{allOn ? \`Clear \${scope}\` : \`Select \${scope}\`}</Button>`)); expect("static: sticky count in a picker, Select or Clear beside it", "bulk-bar", false)
  staticRun(pickerStrip("SkillRows", `<Button onClick={del}>Delete</Button>`)); expect("static: hand-made sticky bar with an action", "bulk-bar", true)
  staticRun(`function Bar() {\n  return (\n    <div className="fixed bottom-0">\n      <span>{n} selected</span>\n      <Button onClick={clear}>Clear</Button>\n    </div>\n  )\n}`); expect("static: hand-made fixed bar, not a picker", "bulk-bar", true)
  staticRun(pickerStrip("SkillPicker", `<Button onClick={del}>Delete selected</Button>`)); expect("static: a bar called a picker that acts on the rows", "bulk-bar", true)
  staticRun(`function RowPicker() {\n  return (\n    <div>\n      <div className="sticky top-0"><p>{n} selected</p></div>\n      <DataTable data={r} /><Checkbox />\n    </div>\n  )\n}`); expect("static: a table's selection called a picker", "bulk-bar", true)
  staticRun(`<AlertDialogTitle>Leave with unsaved changes?</AlertDialogTitle>`); expect("static: wrong discard title", "discard", true)
  staticRun(`<AlertDialogTitle>Discard your changes?</AlertDialogTitle><AlertDialogCancel>Stay</AlertDialogCancel><AlertDialogAction>Discard</AlertDialogAction>`); expect("static: wrong keep button", "discard", true)
  staticRun(`<AlertDialogTitle>Discard your changes?</AlertDialogTitle><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction>Discard</AlertDialogAction>`); expect("static: right discard wording", "discard", false)

  const menu = (...x) => x.map((t) => (t === "-" ? { role: "separator", text: "" } : { role: "menuitem", text: t, variant: t === "Delete" ? "destructive" : "default" }))
  judgeMenu("T", "m", menu("Delete", "Edit")); expect("menu: Delete first", "row-menu", true)
  judgeMenu("T", "m", menu("Deactivate", "Edit", "-", "Delete")); expect("menu: Edit after Deactivate", "row-menu", true)
  judgeMenu("T", "m", menu("Edit", "Configure", "-", "Delete")); expect("menu: verb not in the list", "row-menu", true)
  judgeMenu("T", "m", menu("Edit", "Delete")); expect("menu: no separator before Delete", "row-menu", true)
  judgeMenu("T", "m", menu("Edit", "Deactivate", "-", "Delete")); expect("menu: agreed order", "row-menu", false)
  judgeMenu("T", "m", menu("Delete")); expect("menu: Delete alone", "row-menu", false)

  const browser = await chromium().launch()
  const { ctx, page } = await freshPage(browser, VIEWPORT)
  const btn = (v, t) => `<button data-slot="button" data-variant="${v}">${t}</button>`
  const header = (x) => `<div data-slot="page-header"><h1>Page</h1>${x}</div>`
  const render = async (html) => { await page.setContent(`<!doctype html><body style="margin:0;height:800px">${html}</body>`); judgeSurfaces("T", "fixture", await readSurfaces(page)) }
  const panel = (footer) => `<div role="dialog" style="position:fixed;right:0;top:0;width:400px;height:600px;background:#fff"><h2>Panel</h2><div style="position:absolute;bottom:10px;${footer}">${btn("default", "Save changes")}</div></div>`

  await render(header(btn("default", "Save") + btn("default", "Preview"))); expect("runtime: two filled on a page", "one-filled", true)
  await render(header(btn("outline", "Save"))); expect("runtime: no filled on a page", "one-filled", true)
  await render(header(btn("default", "Save") + btn("outline", "Preview"))); expect("runtime: one filled on a page", "one-filled", false)
  await render(header(btn("default", "Keep going")) + `<main>${btn("outline", "Save")}</main>`); expect("runtime: page Save outside the header", "save-position", true)
  await render(header(btn("default", "Save"))); expect("runtime: page Save in the header", "save-position", false)
  await render(header(btn("default", "Go")) + panel("left:10px")); expect("runtime: panel Save bottom left", "save-position", true)
  await render(header(btn("default", "Go")) + panel("right:10px")); expect("runtime: panel Save bottom right", "save-position", false)
  await render(header(btn("default", "Save draft"))); expect("runtime: Save draft label", "save-label", true)

  await page.setContent(`<!doctype html><table><tbody><tr><td><span data-slot="status-badge" aria-label="Configured">Configured</span></td></tr></tbody></table>`)
  await checkSkillStatus(page, "T", "fixture"); expect("runtime: status Configured", "status-words", true)
  await page.setContent(`<!doctype html><table><tbody><tr><td><span data-slot="status-badge" aria-label="Custom">Custom</span></td></tr></tbody></table>`)
  await checkSkillStatus(page, "T", "fixture"); expect("runtime: status Custom", "status-words", false)

  await ctx.close()
  await browser.close()
  let bad = 0
  for (const r of results) {
    if (!r.ok) bad++
    console.log(`${r.ok ? "ok  " : "WRONG"} ${r.name}${r.hits.length ? `  -> ${r.hits[0]}` : ""}`)
  }
  console.log(`\n${results.length - bad} of ${results.length} self-test cases behave as they must.`)
  process.exit(bad ? 1 : 0)
}
if (args.includes("--self-test")) await selfTest()

// ---------- Run and report ----------

const pageIds = ONLY ? [ONLY] : registry.pages.map((p) => p.id)
scanStatic()
if (!STATIC_ONLY) await runRuntime(pageIds.filter((id) => SCENARIOS[id]))
const shownFindings = findings.filter((f) => !ONLY || f.page === ONLY)
const shownNotRun = notRun.filter((f) => !ONLY || f.page === ONLY)

const RULES = ["save-label", "one-filled", "save-position", "row-menu", "bulk-bar", "no-toast", "discard", "status-words"]
const unique = (list) => [...new Map(list.map((f) => [`${f.rule}|${f.where}|${f.detail}`, f])).values()]
if (AS_JSON) {
  console.log(JSON.stringify({ findings: shownFindings, notRun: shownNotRun }, null, 1))
} else {
  const order = [...new Set([...pageIds, ...shownFindings.map((f) => f.page)])]
  for (const id of order) {
    const name = registry.pages.find((p) => p.id === id)?.page ?? "Shared components on the path, no single page"
    const own = unique(shownFindings.filter((f) => f.page === id))
    const skipped = shownNotRun.filter((f) => f.page === id)
    console.log(`\n${own.length || skipped.length ? "FAIL" : "PASS"} ${id} ${name}: ${own.length} finding(s), ${skipped.length} not run`)
    for (const f of own) console.log(`  [${f.rule}] (${f.mode}) ${f.where}: ${f.detail}`)
    for (const f of skipped) console.log(`  NOT RUN [${f.rule}] ${f.what}: ${f.why}`)
  }
  const all = unique(shownFindings)
  console.log("\nBy rule (unique findings; a shared file counts once):")
  for (const r of RULES) {
    const list = all.filter((f) => f.rule === r)
    console.log(`  ${r.padEnd(14)} ${String(list.length).padStart(4)}   static ${list.filter((f) => f.mode === "static").length}, runtime ${list.filter((f) => f.mode === "runtime").length}`)
  }
  console.log(`\n${all.length} unique finding(s), ${shownNotRun.length} not run, ${staticFiles.length} files read${STATIC_ONLY ? ", runtime skipped" : ""}.`)
  console.log(all.length || shownNotRun.length || STATIC_ONLY ? "CONSISTENCY GATE FAILED" : "CONSISTENCY GATE PASSED")
}
process.exit(shownFindings.length || shownNotRun.length || STATIC_ONLY ? 1 : 0)
