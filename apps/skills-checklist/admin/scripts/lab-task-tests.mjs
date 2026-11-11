#!/usr/bin/env node
// Task tests for the admin setup design: section F of docs/build/2026-11-04-admin-workflow-map.md, as real user actions in headless
// Playwright. One test per script ID (W, L, E, B, A, S, K, C, T, N, M), the global checks G1 to G5 per page, plus the checks section F
// does not state: TRUTH (a success banner means the data changed), GUARD (dirty state asks to discard), NUMBERS (one count, same in two
// places), BLANK (bulk Set level with nothing chosen changes nothing), WIDE (saving settings leaves Custom skills and questions alone).
//
// The design is a target: a test fails when the design is not built, with a reason in plain words. Selectors use roles and visible text.
// Numbers are read from the page at runtime, never taken from the document. Every test gets its own browser context, so its seed is clean
// (stricter than one per group, and it means a script such as E7 can repeat the steps of E6 for itself).
//
// One skill is edited in its panel (helper `openEditPanel`); `openBulkConfigure` opens the bulk page (map D4).
//
// Usage: node scripts/lab-task-tests.mjs [baseUrl] [--group=<letter or name>] [--id=<id or prefix>] [--ids=<a,b,c>] [--json=<path>] [--out=<dir>] [--workers=<n>] [--diag=<path>]
// --diag writes JSON lines: browser, context and page closes and crashes with the running test, and every 15 s the dev server's RSS and pid (a new pid is a restart) and free system memory.
// Exit code 1 when anything fails. LATER results are reported separately and do not fail the run.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execSync } from "node:child_process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
function chromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* next */ }
  }
  throw new Error("Playwright not found")
}
const args = process.argv.slice(2)
const flag = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3)
const BASE = args.find((a) => a.startsWith("http")) ?? "http://localhost:3017"
const ONLY_GROUP = flag("group")?.toUpperCase()
const ONLY_ID = flag("id")
const ONLY_IDS = flag("ids")?.split(",").filter(Boolean)
const DIAG_PATH = flag("diag")
const JSON_PATH = flag("json")
const OUT = flag("out") ?? path.join(os.tmpdir(), "lab-task-tests")
const WORKERS = Number(flag("workers") ?? 3)
const TEST_TIMEOUT = 120_000
const ACT = 7_000 // a control that should be there, once the page has loaded
const QUICK = 3_500 // something that should appear right after an action
const LOAD = 60_000
const CLICK = 20_000 // a control that is there: a dev server under load can be slow to let it take the click

class Fail extends Error {}
class Infra extends Error {}
class Later extends Error {}
const fail = (m) => { throw new Fail(m) }
const later = (m) => { throw new Later(m) }
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const LIB = "/lab/admin/skills-library"
const SET = "/lab/admin/evaluation-settings"
const CATS = "/lab/admin/categories-tags"
const LISTS = "/lab/admin/lists-cohorts"
/** The footer's commit in Assign to students: it names who, and carries a key hint after a line break. */
const assignBtn = (d) => d.page().getByRole("button", { name: /^Assign to \d/ })
const assignText = async (d) => (await assignBtn(d).innerText()).split("\n")[0].trim()
const chooseSpecific = async (t) => { const d = t.p.locator("[data-add-dialog]"); await d.getByRole("radio", { name: /^Specific/ }).check(); await t.p.waitForTimeout(200); return d }
const ASSIGN = "/lab/admin/lists-cohorts?view=assign"
const MAP = "/lab/admin/course-mapping"
const BP = "Blood Pressure"
/** A seeded skill with nothing tracked against it and courses to leave, so its Delete is allowed and has something to say. */
const DELETE_MAPPED = "Sitz Bath"

/** Everything a test does goes through this: the page plus plain-word helpers that fail with a reason. */
class T {
  constructor(page) {
    this.p = page
    this.unloads = 0
    this.note = ""
    page.on("dialog", async (d) => {
      if (d.type() === "beforeunload") this.unloads++
      await d.accept().catch(() => {})
    })
    page.setDefaultTimeout(ACT)
    page.setDefaultNavigationTimeout(LOAD)
  }
  get main() { return this.p.locator("main").first() }

  async settle() {
    // The app hydrates after load; a click before that does nothing. Wait until the first control in main has React props.
    await this.p.waitForFunction(() => {
      const m = document.querySelector("main")
      const el = m?.querySelector("button, a, input")
      return el && Object.keys(el).some((k) => k.startsWith("__reactProps"))
    }, null, { timeout: LOAD }).catch(() => { throw new Infra(`page did not finish loading: ${this.p.url()}`) })
    // The lab's own option bar sits inside main and holds radios, buttons and words that are not the product. Hide it for the test, so a
    // role query can never pass or fail on it. Added after hydration, so React never sees it. The path bar stays.
    await this.p.addStyleTag({ content: "[aria-label='Design lab controls'] { display: none !important; }" }).catch(() => {})
    // Lazy chunks arrive after the first control hydrates. A click before they land is swallowed, which reads as "nothing happened".
    await this.p.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {})
    await this.p.waitForTimeout(250)
  }
  async open(url) {
    let res
    try {
      res = await this.p.goto(BASE + url, { waitUntil: "load" })
    } catch (e) { throw new Infra(`could not load ${url}: ${String(e).slice(0, 100)}`) }
    if ((res?.status() ?? 200) >= 500) throw new Infra(`${url} returned ${res.status()}`)
    await this.settle()
  }
  async reload() {
    await this.p.reload({ waitUntil: "load" })
    await this.settle()
  }
  /** Leave the page, come back through a fresh load, then reload: the persistence check. */
  async leaveAndReturn(url) {
    await this.open(CATS)
    await this.open(url)
    await this.reload()
  }
  /** After a soft navigation: wait for the URL, then for the new page. */
  async afterNav(ms = 1200) {
    await this.p.waitForLoadState("load").catch(() => {})
    await this.p.waitForTimeout(ms)
    await this.p.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {}) // a soft navigation in dev may still be compiling
  }

  async visible(loc, msg, timeout = ACT) {
    try { await loc.first().waitFor({ state: "visible", timeout }) } catch { fail(msg) }
    return loc.first()
  }
  async isVisible(loc, timeout = QUICK) {
    try { await loc.first().waitFor({ state: "visible", timeout }); return true } catch { return false }
  }
  async absent(loc, msg) {
    const n = await loc.count()
    for (let i = 0; i < n; i++) if (await loc.nth(i).isVisible()) fail(msg)
  }
  button(name, scope) { return (scope ?? this.p).getByRole("button", { name }) }
  link(name, scope) { return (scope ?? this.p).getByRole("link", { name }) }
  /** A control by name whichever element it is (a button, or a link styled as one). */
  action(name, scope) { const s = scope ?? this.p; return s.getByRole("button", { name }).or(s.getByRole("link", { name })) }
  async click(loc, msg) {
    await this.visible(loc, msg)
    try { await loc.first().click({ timeout: CLICK }) } catch (e) { fail(`${msg} (found it, but could not click: ${String(e).split("\n")[0].slice(0, 90)})`) }
  }

  // ---- surfaces
  dialog(name) { return name ? this.p.getByRole("dialog", { name }) : this.p.getByRole("dialog") }
  confirm() { return this.p.getByRole("alertdialog").or(this.p.getByRole("dialog")) }
  discardPrompt() { return this.p.getByRole("alertdialog").or(this.p.getByRole("dialog")).filter({ hasText: /discard/i }) }
  async expectDiscardPrompt(what) {
    await this.visible(this.discardPrompt(), `${what}: no "Discard your changes?" prompt appeared`, QUICK)
  }
  /** The result banner, by its visible words. Route announcers live outside main; a live region with these words is what the user reads. */
  // A result banner is role=status; a warning banner is role=alert. Either is the banner the user reads.
  // On Skill lists it sits in the open panel at every width (D-L106), and a panel that covers the page holds it too.
  banner(re) { const slot = this.p.locator("[data-panel-result-slot]"); return this.main.getByRole("status").or(this.main.getByRole("alert")).or(slot.getByRole("status")).or(slot.getByRole("alert")).filter({ hasText: re ?? /\S/ }) }
  async expectBanner(re, what) {
    const b = this.banner(re)
    if (!(await this.isVisible(b, QUICK))) {
      const any = await this.bannerText()
      fail(`${what}: expected a banner matching ${re}, ${any ? `banner read "${any.slice(0, 100)}"` : "no banner appeared"}`)
    }
    return b.first()
  }
  async bannerText() {
    const loc = this.main.getByRole("status").or(this.main.getByRole("alert")).or(this.p.locator("[data-panel-result-slot]").getByRole("status"))
    const n = await loc.count()
    for (let i = 0; i < n; i++) if (await loc.nth(i).isVisible()) { const t = (await loc.nth(i).innerText()).trim(); if (t) return t.replace(/\s+/g, " ") }
    return ""
  }
  /** The result must be where the admin is: inside the viewport, read from a row scrolled away from the top of the page. */
  async expectBannerInView(what) {
    const box = await this.main.locator("[data-region=banner]").first().boundingBox()
    if (!box) fail(`${what}: no result banner on the page`)
    const vh = this.p.viewportSize().height
    if (box.y < 0 || box.y + box.height > vh) fail(`${what}: the banner is off screen, at y ${Math.round(box.y)} of ${vh}`)
    // In the viewport is not enough: a fixed table head can sit over it.
    const seen = await this.p.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest("[data-region=banner]"), { x: box.x + box.width / 2, y: box.y + box.height / 2 })
    if (!seen) fail(`${what}: something covers the banner`)
    // Nor may the banner sit over the work: no table row or form control may share its area, measured as actually painted (clipped by what scrolls it).
    const over = await this.p.evaluate(() => {
      const banner = document.querySelector("main [data-region=banner]")
      const b = banner.getBoundingClientRect()
      const painted = (el) => {
        const r = el.getBoundingClientRect()
        if (r.width <= 2 || r.height <= 2 || getComputedStyle(el).visibility === "hidden") return null
        let { left, top, right, bottom } = r
        for (let a = el.parentElement; a; a = a.parentElement) {
          const s = getComputedStyle(a)
          if (s.overflowY === "visible" && s.overflowX === "visible") continue
          const c = a.getBoundingClientRect()
          left = Math.max(left, c.left); top = Math.max(top, c.top); right = Math.min(right, c.right); bottom = Math.min(bottom, c.bottom)
        }
        return right > left && bottom > top ? { left, top, right, bottom } : null
      }
      const work = "tr, [role=row], input, select, textarea, button, [role=radio], [role=checkbox], [role=combobox], [role=switch]"
      for (const el of document.querySelectorAll(work)) {
        if (banner.contains(el)) continue
        const p = painted(el)
        if (p && p.left < b.right && p.right > b.left && p.top < b.bottom && p.bottom > b.top) return `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40)}"`
      }
      return null
    })
    if (over) fail(`${what}: the banner overlaps ${over}`)
  }
  /** Scroll the page so a row sits at the top: the admin has left the page title behind. */
  async scrollRowToTop(name) {
    const r = await this.row(name)
    await r.evaluate((el) => el.scrollIntoView({ block: "start" }))
    await this.p.waitForTimeout(200)
    const y = await this.main.locator("h1").first().evaluate((h) => h.getBoundingClientRect().bottom)
    if (y > 0) fail(`could not scroll the page title away (title bottom at ${Math.round(y)}), so this is not a scrolled row`)
  }
  async pathBar() {
    const g = this.p.getByRole("group", { name: /walkthrough|student and evaluator/i, includeHidden: true }) // the student path is titled by who walks it; an open sheet hides the page from roles, and the bar stays
    await this.visible(g, "no path bar: no walkthrough control group in the page", ACT)
    return g.first()
  }
  async position() {
    const bar = await this.pathBar()
    const text = (await bar.innerText()).replace(/\s+/g, " ")
    const m = text.match(/(\d+) of (\d+)/)
    const name = await bar.locator("[aria-current=step]").innerText().catch(() => text)
    return { index: m ? +m[1] : null, total: m ? +m[2] : null, name: name.replace(/\d+ of \d+/, "").replace(/\s+/g, " ").trim(), text }
  }
  nextControl(bar) { return bar.getByRole("link", { name: /^Next/ }).or(bar.getByRole("button", { name: /^Next/ })) }
  async pressNext() {
    const bar = await this.pathBar()
    await this.click(this.nextControl(bar), "path bar has no Next")
    await this.afterNav(1500)
    await this.settle()
  }
  /** On the walkthrough, Next until the bar names this stop. */
  async walkTo(stop) {
    await this.open("/")
    const seen = []
    for (let i = 0; i < 10; i++) {
      const pos = await this.position()
      if (!/admin/i.test((await (await this.pathBar()).getAttribute("aria-label")) ?? "")) break // Next has left the admin path
      seen.push(pos.name)
      // W1 holds the bar to the exact words; this only finds the page.
      if (pos.name === stop || pos.name.startsWith(`${stop} `)) return pos
      if (!(await this.isVisible(this.nextControl(await this.pathBar()), 800))) break
      const nx = this.nextControl(await this.pathBar()).first()
      if (await nx.isDisabled().catch(() => false)) break
      await this.pressNext()
    }
    fail(`path has no stop "${stop}"; stops read: ${seen.join(", ")}`)
  }
  skillsPanelRow(name) { return this.p.getByRole("navigation", { name: "Skills" }).getByRole("link", { name, exact: true }) }

  // ---- library
  skillRows() { return this.main.getByRole("row").filter({ has: this.p.getByRole("checkbox", { name: /^Select row/ }) }) }
  rowOf(name) { return this.main.getByRole("row", { name: new RegExp(`(^|[ ,])${esc(name)}( |$)`) }) }
  async row(name) {
    const r = this.rowOf(name)
    await this.visible(r, `no library row for "${name}"`)
    return r.first()
  }
  /** Rows once the count has held still: filters write the URL, so a narrowed list arrives a moment later. */
  async rowCount() { return this.stableCount(this.skillRows()) }
  async stableCount(loc) {
    let last = -1
    let same = 0
    for (let i = 0; i < 25 && same < 3; i++) {
      await this.p.waitForTimeout(300)
      const n = await loc.count()
      same = n === last ? same + 1 : 0
      last = n
    }
    return last
  }
  /** Wait up to a few seconds for a count to meet a test, then return it. */
  async countUntil(loc, ok, ms = 8000) {
    const end = Date.now() + ms
    let n = await loc.count()
    while (!ok(n) && Date.now() < end) { await this.p.waitForTimeout(250); n = await loc.count() }
    return n
  }
  async tabCount(re) {
    const tab = this.main.getByRole("tab", { name: re })
    await this.visible(tab, `no status tab matching ${re}`)
    const text = await tab.first().innerText()
    const m = text.replace(/,/g, "").match(/(\d+)\s*$/)
    if (!m) fail(`status tab "${text}" shows no count`)
    return +m[1]
  }
  async allCount() { return this.tabCount(/^All\b/) }
  async times(name) { return (await this.row(name)).getByRole("spinbutton").first().inputValue() }
  /** Type a number in the cell and press Enter; confirm the impact dialog when one opens, unless told to leave it open. */
  async setTimes(name, value, { confirm = true } = {}) {
    const r = await this.row(name)
    const cell = r.getByRole("spinbutton")
    await this.visible(cell, `no Times needed input on the "${name}" row`)
    await cell.first().fill(String(value))
    await cell.first().press("Enter")
    await this.p.waitForTimeout(400)
    const d = this.p.locator("[data-impact-dialog]")
    if (confirm && (await this.isVisible(d, 400))) {
      await d.getByRole("button", { name: /^Save changes/ }).click()
      await this.p.waitForTimeout(400)
    }
  }
  /** The Status column's word. */
  statusOf(text) { return ["Inactive", "Active"].find((w) => text.includes(w)) ?? null }
  /** The Configuration column's word. */
  configOf(text) { return ["Not configured", "Custom", "Default"].find((w) => text.includes(w)) ?? null }
  async rowStatus(name) { return this.statusOf((await (await this.row(name)).innerText()).replace(/\s+/g, " ")) }
  async rowConfig(name) { return (await this.row(name)).locator("[data-configuration]").first().innerText().then((x) => x.trim()) }
  /** The page has stopped moving: its scroll height and scroll position hold still across several polls. */
  async settled() {
    let last = ""
    let same = 0
    for (let i = 0; i < 40 && same < 4; i++) {
      await this.p.waitForTimeout(150)
      const now = await this.p.evaluate(() => { const p = document.querySelector("[data-page-scroll]"); return p ? `${p.scrollHeight}|${p.clientHeight}|${p.scrollTop}` : "" })
      same = now === last ? same + 1 : 0
      last = now
    }
  }
  /** The result as a person sees it: painted inside the viewport and not covered, wherever the page is scrolled. */
  async expectBannerOnScreen(re, what) {
    const b = this.p.locator("[data-region=banner]").filter({ hasText: re }).first()
    await this.visible(b, `${what}: no banner reading ${re}`, ACT)
    await this.settled()
    const box = await b.boundingBox()
    const vh = this.p.viewportSize().height
    if (!box || box.y < 0 || box.y + box.height > vh) fail(`${what}: the banner is off screen, at y ${box ? Math.round(box.y) : "none"} of ${vh}`)
    const seen = await this.p.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest("[data-region=banner]"), { x: box.x + box.width / 2, y: box.y + box.height / 2 })
    if (!seen) fail(`${what}: something covers the banner`)
  }
  /** What Configuration reads for the draft: on the Configure one skill page, or the panel's row. */
  async panelConfig(where) {
    const onPage = await where.getAttribute("data-configure-word")
    const word = onPage ?? (await where.locator("[data-panel-configuration]").getAttribute("data-panel-configuration"))
    return { default: "Default", edited: "Custom", "not-configured": "Not configured" }[word]
  }
  /** The Configure one skill page for a row, by its Configuration word (map D1c). Returns the page. */
  async openConfigure(name = BP) {
    await this.open(LIB)
    await this.click((await this.row(name)).getByRole("link", { name: /^Configuration:/ }), `no Configuration link on the "${name}" row`)
    return this.configurePage()
  }
  async configurePage() {
    const page = this.p.locator("[data-configure-page]")
    await this.visible(page, "the Configure one skill page did not open", ACT)
    return page
  }
  /** Choose Custom on the page: one click, and every setting is a live control. */
  async chooseCustom(page) {
    const r = page.getByRole("radio", { name: "Custom", exact: true })
    await this.click(r, "no Custom choice under Evaluation settings")
    await this.waitFor(async () => (await r.getAttribute("aria-checked")) === "true", "Custom did not take")
    await this.visible(page.locator("[data-configure-sections], [data-skill-cards]").first(), "Custom shows no settings", QUICK)
  }
  async chooseDefault(page) {
    const r = page.getByRole("radio", { name: "Default", exact: true })
    await this.click(r, "no Default choice under Evaluation settings")
    await this.waitFor(async () => (await r.getAttribute("aria-checked")) === "true", "Default did not take")
  }
  /** The panel's Active switch. */
  activeSwitch(panel) { return panel.getByRole("switch", { name: /is active$/ }) }
  /** A condition, polled, not a fixed wait. */
  async waitFor(check, msg, ms = 8000) {
    const end = Date.now() + ms
    for (;;) {
      if (await Promise.resolve().then(check).catch(() => false)) return
      if (Date.now() > end) fail(typeof msg === "function" ? await msg() : msg)
      await this.p.waitForTimeout(100)
    }
  }
  async openGroup(panel, name) {
    // Configure one skill in cards (D-L135): every setting is on the page, nothing to open.
    if (await panel.locator("[data-skill-cards]").count()) return
    const trig = panel.getByRole("button", { name: new RegExp(`^${name}`) })
    await this.visible(trig, `no group ${name}`)
    if ((await trig.getAttribute("aria-expanded")) !== "true") await trig.click()
    await this.waitFor(async () => (await trig.getAttribute("aria-expanded")) === "true", `group ${name} did not open`)
    await this.p.waitForTimeout(250)
  }
  /** Rows under one Configuration filter, read from the Library: the filter's own count, which the map says equals the rows. */
  async filterConfigCount(word) {
    await this.open(`${LIB}?config=${{ Custom: "edited", Default: "default", "Not configured": "not-configured" }[word]}`)
    await this.visible(this.button(new RegExp(`^Remove filter ${word}`), this.main), `no chip for ${word}`)
    return this.allCount()
  }
  async selectRows(names) {
    for (const n of names) {
      const c = this.p.getByRole("checkbox", { name: new RegExp(`^Select row.*${esc(n)}$`) })
      await this.visible(c, `no selection checkbox on the "${n}" row`)
      // Changing a status tab clears the selection a moment later, so confirm each tick has held and tick again if not.
      for (let tries = 0; tries < 4; tries++) {
        await c.first().click({ timeout: CLICK }).catch(() => {})
        await this.p.waitForTimeout(500)
        if (await c.first().isChecked().catch(() => false)) break
      }
      if (!(await c.first().isChecked().catch(() => false))) fail(`could not select the "${n}" row`)
    }
    await this.p.waitForTimeout(350)
  }
  /** Labels in the bulk bar: climb from Clear to the first ancestor that holds other buttons too. */
  async bulkBar() {
    const clear = this.button(/clear( selection)?$/i, this.main)
    if (!(await this.isVisible(clear, 1200))) return null
    return clear.first().evaluate((el) => {
      let box = el.parentElement
      while (box && box.querySelectorAll("button, a").length < 2) box = box.parentElement
      const label = (e) => (e.getAttribute("aria-label") || e.textContent || "").trim()
      return { labels: [...box.querySelectorAll("button, a")].map(label).filter(Boolean), text: box.innerText.replace(/\s+/g, " ").trim() }
    })
  }
  async menuLabels() {
    const menu = this.p.getByRole("menu")
    await this.visible(menu, "no menu opened", QUICK)
    return menu.first().getByRole("menuitem").evaluateAll((els) => els.map((e) => (e.innerText || "").split("\n")[0].trim()))
  }
  /**
   * What a person sees, not what is in the DOM: this element must be the topmost thing at its own centre. An open menu sets pointer-events none on
   * the body, so a plain elementFromPoint looks straight through a panel painted over the menu and passes; the hit test turns pointer events back
   * on for the read, so it follows paint order.
   */
  async expectOnTop(loc, what) {
    await this.visible(loc, `${what} is not on the page`, QUICK)
    await this.p.waitForTimeout(350) // an opening menu is still animating its position
    const covered = await loc.first().evaluate((el) => {
      const force = document.createElement("style")
      force.textContent = "* { pointer-events: auto !important; }"
      document.head.append(force)
      const r = el.getBoundingClientRect()
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      force.remove()
      if (hit && (hit === el || el.contains(hit))) return null
      return hit ? `${hit.tagName.toLowerCase()} in ${hit.closest("[data-slot]")?.getAttribute("data-slot") ?? "the page"}` : "nothing at that point, it is off screen"
    })
    if (covered) fail(`${what} is in the DOM but cannot be seen: ${covered} is on top of it`)
  }
  /** Every entry of the open menu can be seen. */
  async expectMenuOnTop(what) {
    const items = this.p.getByRole("menu").first().getByRole("menuitem")
    const n = await items.count()
    if (!n) fail(`${what}: the menu has no entries`)
    for (let i = 0; i < n; i++) await this.expectOnTop(items.nth(i), `${what}, "${(await items.nth(i).innerText()).split("\n")[0]}"`)
  }
  async openRowMenu(name) {
    const r = await this.row(name)
    await this.click(r.getByRole("button", { name: /^(Actions|More)/i }), `no row menu on "${name}"`)
    return this.menuLabels()
  }
  async rowMenuItem(name, item) {
    const labels = await this.openRowMenu(name)
    const it = this.p.getByRole("menuitem", { name: item })
    if (!(await this.isVisible(it, 800))) fail(`row menu has no ${item}; it holds: ${labels.join(", ")}`)
    await it.first().click()
    await this.p.waitForTimeout(500)
  }
  /** Close a read-only panel and wait until it has gone, so the next click cannot land on it while it animates out. */
  async closePanel() {
    await this.p.keyboard.press("Escape")
    await this.dialog().first().waitFor({ state: "hidden", timeout: 3000 }).catch(async () => {
      await this.button(/^Close$/, this.dialog().first()).first().click({ timeout: 1000 }).catch(() => {})
      await this.dialog().first().waitFor({ state: "hidden", timeout: 3000 }).catch(() => {})
    })
    await this.p.waitForTimeout(250)
  }
  /** E1's door: click the row itself, on a part of it that is not a control. Fails unless it opens the editing form. */
  async openEditPanel(name = BP) {
    await this.open(LIB)
    const r = await this.row(name)
    await r.getByRole("cell").nth(-2).click({ position: { x: 4, y: 4 }, timeout: CLICK })
    const panel = this.dialog()
    if (!(await this.isVisible(panel, ACT))) fail("no Edit panel: clicking the row opened nothing")
    if (!(await this.isVisible(panel.first().getByRole("textbox", { name: /^Name/ }), 1500))) {
      const editable = await panel.first().getByRole("textbox").count()
      fail(`no Edit panel: row click opened read view${editable ? "" : ", no editable fields"}`)
    }
    return panel.first()
  }
  /** For tests about what editing does rather than the door: the panel when built, else today's row menu Edit. */
  async openEditForm(name = BP) {
    await this.open(LIB)
    const r = await this.row(name)
    await r.getByRole("cell").nth(-2).click({ position: { x: 4, y: 4 } })
    const panel = this.dialog().first()
    if ((await this.isVisible(panel, ACT)) && (await this.isVisible(panel.getByRole("textbox", { name: /^Name/ }), 800))) return panel
    await this.open(LIB) // a fresh load, so the row menu click cannot race the read panel closing
    await this.rowMenuItem(name, /^Edit/)
    const form = this.dialog().first()
    await this.visible(form.getByRole("textbox", { name: /^Name/ }), "row menu Edit opened no form")
    return form
  }
  /** Pick or create a category in an add or edit surface (Popover plus Command). */
  async pickCategory(scope, name, { create = false } = {}) {
    await this.click(scope.getByRole("button", { name: /^Category/ }).or(scope.getByRole("combobox", { name: /^Category/ })), "no Category control")
    const input = this.p.getByRole("combobox", { name: /category/i }).last()
    await this.visible(input, "Category control opened no picker", QUICK)
    if (create) {
      await input.fill(name)
      await this.p.waitForTimeout(300)
      const opt = this.p.getByRole("option", { name: new RegExp(esc(name), "i") })
      if (await this.isVisible(opt, 1500)) await opt.first().click()
      else await input.press("Enter")
    } else {
      const opt = this.p.getByRole("option", { name, exact: true })
      await this.click(opt, `no category "${name}" offered`)
    }
    await this.p.waitForTimeout(300)
  }
  async addTag(scope, tag) {
    const input = scope.getByRole("combobox", { name: /tags/i }).or(scope.getByRole("textbox", { name: /tags/i }))
    await this.visible(input, "no Tags box")
    await input.first().fill(tag)
    await input.first().press("Enter")
    await this.p.waitForTimeout(300)
  }
  async openAddMenu() {
    await this.click(this.button(/^More ways to add/i, this.main), "no chevron beside Add a skill")
    return this.menuLabels()
  }
  async openAddSeveral() {
    await this.openAddMenu()
    await this.click(this.p.getByRole("menuitem", { name: /^Add several/ }), "no Add several in the menu")
    const sheet = this.dialog().first()
    await this.visible(sheet, "Add several opened no sheet")
    return sheet
  }
  async openFilters() {
    await this.click(this.button(/filter/i, this.main), "no Filters button")
    await this.p.waitForTimeout(250)
  }

  // ---- bulk configure (map D4)
  async openBulkConfigure(names = [BP, "Height", "Weight"]) {
    await this.open(LIB)
    await this.selectRows(names)
    await this.click(this.action(new RegExp(`^Configure ${names.length} skills$`), this.main), `no Configure ${names.length} skills`)
    await this.afterNav(1500)
    await this.settle()
    await this.visible(this.main.getByRole("heading", { level: 1, name: `${names.length} skills` }), "the bulk page did not open", LOAD)
    await this.p.waitForTimeout(400)
  }
  /** Save the per-skill page; confirms an impact dialog if one opens. */
  async savePerSkill() {
    await this.click(this.button(/^Save( changes| settings| configuration| \d+ skills?)?$/, this.main), "no Save on the per-skill page")
    await this.p.waitForTimeout(600)
    // Not the edit panel: a save now lands on the Library with it open (map D1a), and its Save changes is not a confirm.
    const c = this.confirm().filter({ has: this.p.getByRole("button", { name: /^(Apply|Save|Confirm)/ }) }).filter({ hasNotText: "Used in" })
    if (await this.isVisible(c, 1200)) {
      // An impact dialog may ask how the change applies; take its first answer, since the test is about the save and not that choice.
      const radio = c.first().getByRole("radio").first()
      if (await this.isVisible(radio, 300)) await radio.click()
      await c.first().getByRole("button", { name: /^(Apply|Save|Confirm)/ }).first().click()
      await this.p.waitForTimeout(500)
    }
    await this.afterNav(1200)
  }

  /** Choose a model; today's page asks first when a model is already set, so answer yes. */
  /**
   * Evaluation settings B (D-L140): every decision is a row that opens on its Change or Edit. Opens row `id` when it is closed; a page without the
   * rows (other variants) has no such action, so this does nothing there. Questions and Scale open a side panel over the page.
   */
  async settingsRow(id) {
    const open = this.p.locator(`[data-decision-row="${id}"][data-open]`)
    if (await open.count()) return
    const a = this.p.locator(`[data-row-action="${id}"]`)
    if ((await a.count()) && (await a.first().isVisible())) { await a.first().click(); await this.p.waitForTimeout(400) }
  }
  /** The side panel covers the header's Save while it is open: Done first, as an admin would. */
  async closeSettingsPanel() {
    const done = this.p.locator("[data-settings-panel] [data-panel-done]")
    if ((await done.count()) && (await done.first().isVisible())) { await done.first().click(); await this.p.waitForTimeout(400) }
  }
  /** The level names behind Edit levels, open. */
  async levelNames() {
    await this.settingsRow("levels")
    const e = this.p.locator("[data-edit-levels]")
    if ((await e.count()) && /^Edit levels$/.test((await e.first().innerText()).trim())) { await e.first().click(); await this.p.waitForTimeout(250) }
  }
  async chooseModel(name, msg) {
    await this.settingsRow("judged")
    await this.click(this.main.getByRole("radio", { name }), msg)
    await this.p.waitForTimeout(400)
    const sure = this.p.getByRole("alertdialog").filter({ has: this.p.getByRole("button", { name: /^Switch/ }) })
    if (await this.isVisible(sure, 500)) { await sure.first().getByRole("button", { name: /^Switch/ }).click(); await this.p.waitForTimeout(400) }
  }

  // ---- evaluation settings
  saveSettingsButton() { return this.button(/^Save( settings| changes)$/, this.main) }
  levelBoxes() { return this.main.getByRole("textbox", { name: /^Level \d+/ }) }
  countsGroup() { return this.main.getByRole("radiogroup", { name: /levels? (that )?count/i }).or(this.main.getByRole("group", { name: /levels? (that )?count/i })) }
  feedbackSwitch() { return this.main.getByRole("switch", { name: /feedback/i }) }
  /** Today's and the new page both: pick Independence level and fill every row with a program's real values. */
  async fillIndependence(names = ["Underdeveloped", "Developing", "Developed"], times = "3") {
    await this.settingsRow("judged")
    await this.click(this.main.getByRole("radio", { name: /^Independence level/ }), "no Independence level option")
    await this.p.waitForTimeout(400)
    await this.levelNames()
    while ((await this.levelBoxes().count()) < names.length && (await this.isVisible(this.button(/^Add a level/, this.main), 500))) await this.button(/^Add a level/, this.main).click()
    const boxes = this.levelBoxes()
    const n = await boxes.count()
    if (!n) fail("Independence level shows no level names to fill")
    for (let i = 0; i < n; i++) if (!(await boxes.nth(i).inputValue())) await boxes.nth(i).fill(names[i] ?? `Level name ${i + 1}`)
    await this.p.waitForTimeout(300)
    const group = this.countsGroup()
    await this.visible(group, "no levels that count row")
    const boxesC = group.first().getByRole("checkbox")
    if (await boxesC.count()) {
      const c = boxesC.nth((await boxesC.count()) - 1)
      if (!(await c.isChecked())) await c.click()
    } else {
      // One radio per level (D-L141, highest first on screen): the top level counts. The segment's value is the level's index, lowest 0.
      const top = Math.max(...(await this.p.locator("[data-level-segment]").evaluateAll((a) => a.map((e) => Number(e.getAttribute("data-level-segment"))))))
      await this.p.locator(`[data-level-segment="${top}"]`).click()
    }
    await this.settingsRow("times")
    const need = this.main.getByRole("spinbutton", { name: /needed/i }).first()
    await this.visible(need, "no Times needed input")
    await need.fill(times)
    await this.settingsRow("signers")
    const role = this.main.getByRole("checkbox", { name: /^Preceptor/ })
    if ((await this.isVisible(role, 800)) && !(await role.first().isChecked())) await role.first().click()
    await this.p.waitForTimeout(250)
  }
  async pressSaveSettings() {
    await this.closeSettingsPanel()
    await this.click(this.saveSettingsButton(), "no Save on Evaluation settings")
    await this.p.waitForTimeout(600)
  }
  applyDialog() { return this.confirm().filter({ has: this.p.getByRole("button", { name: /^Apply/ }) }) }
  async applySettings() {
    await this.pressSaveSettings()
    const d = this.applyDialog()
    if (!(await this.isVisible(d))) {
      const alerts = await this.main.getByRole("alert").allInnerTexts()
      const other = this.confirm()
      const quoted = (await this.isVisible(other, 300)) ? `; a dialog says "${(await other.first().innerText()).replace(/\s+/g, " ").slice(0, 110)}"` : ""
      fail(`saving opened no Apply dialog${quoted}${alerts.length ? `; the page says: ${alerts.join(" | ").slice(0, 140)}` : ""}`)
    }
    const text = (await d.first().innerText()).replace(/\s+/g, " ")
    await d.first().getByRole("button", { name: /^Apply/ }).click()
    await this.p.waitForTimeout(800)
    return text
  }
  /**
   * "Seeded page" in section F assumes the seed holds saved program settings. When it does not (test SEED1 reports that), set them through
   * the page as an admin would, so S6 to S12 still test what they are about.
   */
  async seededSettings() {
    await this.open(SET)
    await this.settingsRow("judged")
    const radios = this.main.getByRole("radio")
    await this.visible(radios, "no model options on Evaluation settings")
    let any = false
    for (const r of await radios.all()) if (await r.isChecked()) any = true
    if (any) return false
    await this.fillIndependence()
    await this.applySettings()
    await this.open(SET)
    return true
  }

  // ---- skill lists and assign
  listRow(name) { return this.main.getByRole("row", { name: new RegExp(esc(name)) }) }
  /** Skill lists on a group or a student. The page has no state word: a row reads who has it, or "Not assigned" (D-L104). */
  assignedListRows() { return this.main.getByRole("row").filter({ has: this.p.locator("[data-list-link]") }).filter({ hasNotText: /Not assigned/ }) }
  unassignedListRows() { return this.main.getByRole("row").filter({ has: this.p.locator("[data-list-link]") }).filter({ hasText: /Not assigned/ }) }
  /** The one panel of Skill lists, open on a list named by its row. */
  async openListPanel(id) {
    await this.visible(this.main.locator(`[data-list-link="${id}"]`), `no row for ${id}`)
    await this.main.locator(`[data-list-link="${id}"]`).click()
    const panel = this.dialog().first()
    await this.visible(panel, "opening the list opened no panel", QUICK)
    return panel
  }
  /** Add students on a list, from the table. */
  async openAddStudents(id = "list-core") {
    await this.open(LISTS)
    const panel = await this.openListPanel(id)
    await this.click(panel.getByRole("button", { name: /^Assign to students$/ }), "the panel has no Assign to students")
    const d = this.p.locator("[data-add-dialog]")
    await this.visible(d, "Assign to students opened no level", QUICK)
    await d.getByRole("radio", { name: /^Specific/ }).check()
    await this.p.waitForTimeout(200)
    return d
  }
  /** Runtime: student groups on no list at all. "Also on" shows only once a row is ticked, so each row is ticked, read and unticked; it must read just its name and count until then. */
  async groupWithoutList(id = "list-core") {
    const d = await this.openAddStudents(id)
    const rows = d.locator("[data-add-groups] li")
    const out = []
    for (const r of await rows.all()) {
      const before = (await r.innerText()).replace(/\s+/g, " ")
      if (/Has it/.test(before)) continue
      if (/Also on/.test(before)) fail(`an unticked row reads "${before}"`)
      const box = r.getByRole("checkbox")
      await box.click()
      const also = /Also on/.test(await r.innerText())
      await box.click()
      if (!also) out.push({ name: before.split(/\s\d+ students?/)[0].trim(), box })
    }
    return out
  }
  async openNewList(name = "Test list") {
    await this.open(LISTS)
    await this.click(this.action(/^New skill list$/, this.main), "no New skill list button")
    const d = this.dialog(/New skill list/).first()
    await this.visible(d, "New skill list opened no panel")
    await d.getByRole("textbox", { name: /^Name/ }).fill(name)
    await this.absent(d.getByRole("radio"), "New skill list still asks where to start from")
  }
  async pickFive() {
    const d = this.dialog().first()
    await this.click(d.getByRole("button", { name: /^Choose from library$/ }), "no Choose from library")
    const picker = this.p.locator("[data-new-list-library]")
    await this.visible(picker, "Choose from library opened no level")
    const boxes = picker.getByRole("checkbox")
    await this.visible(boxes.first(), "the library level has no skills to select")
    for (let i = 0; i < 5; i++) await boxes.nth(i).click()
    await this.click(this.dialog().first().getByRole("button", { name: /^Add 5 skills/ }), "no Add 5 skills")
    await this.p.waitForTimeout(300)
    return this.dialog().first()
  }
  /** Step 1 Next creates the list; Back from step 2 lands on its panel, not assigned. */
  async saveNewList() {
    await this.click(this.dialog().first().getByRole("button", { name: /^Next/ }), "no Next")
    await this.visible(this.p.locator("[data-list-setup]"), "Next did not open step 2")
    await this.click(this.dialog().first().getByRole("button", { name: /^Back/ }).first(), "no Back on step 2")
    await this.p.waitForTimeout(500)
    return this.dialog().first()
  }

  // ---- course mapping
  async openMapBySkill(name = BP) {
    await this.open(MAP)
    const toggle = this.main.getByRole("radio", { name: "By skill" }).or(this.main.getByRole("tab", { name: "By skill" }))
    await this.click(toggle, "no By skill view")
    await this.p.waitForTimeout(1000)
    const search = this.main.getByRole("searchbox", { name: /skill/i }).filter({ visible: true })
    const picker = this.main.getByRole("combobox", { name: /^skill/i })
    if (await this.isVisible(picker, 600)) {
      await picker.first().click()
      await this.click(this.p.getByRole("option", { name: new RegExp(esc(name)) }), `"${name}" not in the skill picker`)
    } else {
      await this.visible(search, "By skill has no skill search or picker")
      await search.first().fill(name)
      await this.p.waitForTimeout(500)
      await this.click(this.link(name, this.main), `"${name}" not offered on By skill`)
      await this.afterNav(1500)
    }
    await this.settle()
    // The view can show another skill first, so wait for this skill's rows before anything reads them. Today's controls name the skill.
    await this.isVisible(this.main.getByRole("row").getByRole("combobox", { name: new RegExp(esc(name)) }), 10_000)
    await this.visible(this.levelControls(), `no level controls for "${name}"`)
  }
  levelControls() { return this.main.getByRole("row").getByRole("combobox") }
  async levels() { // in row order; compare with levelMap
    const loc = this.levelControls()
    const out = []
    for (const c of await loc.all()) out.push((await c.innerText()).replace(/\s+/g, " ").trim())
    return out
  }
  /** Levels by offering, not by position: mapped rows sort first, so a row can move when its level changes. */
  async levelMap() {
    const out = {}
    for (const c of await this.levelControls().all()) out[await this.levelKey(c)] = (await c.innerText()).replace(/\s+/g, " ").trim()
    return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b))) // `same` compares JSON, and rows move
  }
  async levelKey(c) { return ((await c.getAttribute("aria-label")) ?? (await c.locator("xpath=ancestor::*[@role='row' or self::tr][1]").innerText())).split(":")[0].replace(/\s+/g, " ").trim() }
  /** Change the level on the nth row to any other offered level; returns the new value, and the row's key in this.lastKey. */
  async setLevel(n, avoid) {
    const c = this.levelControls().nth(n)
    this.lastKey = await this.levelKey(c)
    const before = (await c.innerText()).trim()
    await c.click()
    const opts = this.p.getByRole("option")
    await this.visible(opts, "level control offers nothing", QUICK)
    const names = (await opts.allInnerTexts()).map((s) => s.trim().split("\n")[0])
    const pick = names.find((x) => x !== before && x !== avoid)
    await opts.filter({ hasText: new RegExp(`^${esc(pick)}`) }).first().click()
    await this.p.waitForTimeout(500)
    return pick
  }
  mapSave() { return this.button(/^Save\b/, this.main) }

  // ---- reading a whole page
  /** Visible text plus labels on the page, leaving out the lab's own controls (not the product). */
  async productText() {
    return this.p.evaluate(() => {
      const skip = (el) => el.closest("[data-lab-chrome], [aria-label='Design lab controls'], script, style, noscript, next-route-announcer")
      const out = []
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      while (walk.nextNode()) {
        const n = walk.currentNode
        const el = n.parentElement
        if (!el || skip(el) || !n.textContent.trim()) continue
        if (!el.getClientRects().length) continue
        out.push(n.textContent.trim())
      }
      for (const el of document.querySelectorAll("[aria-label], [placeholder], [title]")) {
        if (skip(el) || !el.getClientRects().length) continue
        for (const a of ["aria-label", "placeholder", "title"]) if (el.getAttribute(a)) out.push(el.getAttribute(a))
      }
      return out
    })
  }
  /** Space on the right of main's content: main's right edge less the rightmost visible content. */
  async rightGap() {
    return this.p.evaluate(() => {
      const main = document.querySelector("main")
      const box = main.getBoundingClientRect()
      let right = box.left
      for (const el of main.querySelectorAll("*")) {
        if (el.closest("[data-lab-chrome], [aria-label='Design lab controls']")) continue
        const leaf = !el.children.length && (el.textContent.trim() || /INPUT|TEXTAREA|SELECT|BUTTON|SVG/.test(el.tagName))
        if (!leaf) continue
        const r = el.getBoundingClientRect()
        if (r.width && r.height && r.right <= box.right + 1) right = Math.max(right, r.right)
      }
      return { gap: Math.round(box.right - right), width: Math.round(box.width) }
    })
  }
  async filledButtons() {
    return this.p.evaluate(() => {
      const main = document.querySelector("main")
      const seen = new Set()
      const out = []
      const scopes = [...document.querySelectorAll("[role=dialog], [role=alertdialog]")].filter((d) => d.getClientRects().length)
      const root = scopes.length ? scopes[scopes.length - 1] : main
      for (const b of root.querySelectorAll("[data-slot=button][data-variant=default]")) {
        if (b.closest("[data-lab-chrome], [aria-label='Design lab controls']") || !b.getClientRects().length) continue
        const group = b.closest("[role=group]")
        // A split button (primary plus its chevron) is one control.
        if (group && group.querySelectorAll("[data-slot=button][data-variant=default]").length === 2) { if (seen.has(group)) continue; seen.add(group) }
        out.push((b.getAttribute("aria-label") || b.textContent).trim())
      }
      return out
    })
  }
  /** Text straight below the page title: not a control. */
  async lineUnderTitle() {
    return this.p.evaluate(() => {
      const h = document.querySelector("main h1")
      if (!h) return null
      const hb = h.getBoundingClientRect()
      const out = []
      const walk = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT)
      while (walk.nextNode()) {
        const n = walk.currentNode
        const el = n.parentElement
        if (!el || !n.textContent.trim() || h.contains(el)) continue
        // A subtitle is loose text in the header. A section heading or a form row's own label is not one.
        if (el.closest("button, a, [role=tab], [role=tablist], [role=status], [role=radiogroup], [role=group], [role=region], fieldset, h2, h3, h4, [role=table], table, input, label, [data-lab-chrome], [aria-label='Design lab controls'], nav")) continue
        const r = el.getBoundingClientRect()
        if (!r.width) continue
        if (r.top >= hb.top + hb.height / 2 && r.top <= hb.bottom + 26 && r.left < hb.right && r.right > hb.left) out.push(n.textContent.trim())
      }
      return out.join(" ").slice(0, 100)
    })
  }
}

// ------------------------------------------------------------------ registry
const TESTS = []
const test = (id, group, title, fn, timeout = TEST_TIMEOUT) => TESTS.push({ id, group, title, fn, timeout })
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const unique = (s) => `${s} ${Date.now().toString(36).slice(-4)}`

// ------------------------------------------------------------------ W: walkthrough
test("W1", "W", "Next twice reads the three stops", async (t) => {
  await t.open("/")
  const want = ["Skill lists", "Evaluation settings", "Course mapping"]
  const got = [await t.position()]
  for (let i = 0; i < 2; i++) { await t.pressNext(); got.push(await t.position()) }
  const names = got.map((g) => g.name)
  if (!same(names, want)) fail(`stops read ${names.join(", ")}; want ${want.join(", ")}`)
  got.forEach((g, i) => { if (g.index !== i + 1 || g.total !== 3) fail(`stop ${g.name} says "${g.index} of ${g.total}"; want "${i + 1} of 3"`) })
})
test("W2", "W", "Next on the last stop opens the student path stop 1", async (t) => {
  const pos = await t.walkTo("Course mapping")
  if (pos.index !== 3) fail(`Course mapping is stop ${pos.index} of ${pos.total}; want stop 3`)
  await t.pressNext()
  const bar = await t.pathBar()
  const title = await bar.getAttribute("aria-label")
  const now = await t.position()
  if (!/student/i.test(title ?? "")) fail(`Next from Course mapping opened "${now.name}" on "${title}"; want the student path`)
  if (now.index !== 1) fail(`student path opened at stop ${now.index}; want stop 1`)
})
test("W3", "W", "Add several from the Library side step is a sheet; the path bar stays on Library", async (t) => {
  await t.open("/")
  const start = await t.position()
  if (start.name !== "Skill lists") fail(`stop 1 is "${start.name}"`)
  await t.open("/lab/flow/setup-walkthrough/library?set=1&present=1")
  // Decided 2026-11-04: Add several is a sheet on Library, and the path bar stays on Library (map F, W3).
  const sheet = await t.openAddSeveral()
  await t.p.waitForTimeout(500)
  const now = await t.position()
  if (now.name !== "Library") fail(`path bar reads "${now.name}" while the Add several sheet is open; want Library`)
  if (!/library$/.test(t.p.url().split("?")[0])) fail(`Add several left the Library: ${t.p.url()}`)
  await t.visible(sheet, "Add several opened no sheet")
})
test("W4", "W", "Setup summary and Configure the skill are not on the path", async (t) => {
  await t.open("/")
  const seen = []
  const bad = /Setup summary|Configure the skill/i
  for (let i = 0; i < 10; i++) {
    const bar = await t.pathBar()
    const labels = await bar.locator("a, button, [aria-current=step]").evaluateAll((els) => els.map((e) => `${e.getAttribute("aria-label") ?? ""} ${e.textContent ?? ""}`))
    const pos = await t.position()
    seen.push(pos.name)
    const hit = labels.find((l) => bad.test(l))
    if (hit) fail(`path bar on stop ${pos.index} names "${hit.match(bad)[0]}"`)
    const nx = t.nextControl(bar).first()
    if (!(await t.isVisible(nx, 500)) || (await nx.isDisabled().catch(() => false)) || pos.index === pos.total) break
    await t.pressNext()
  }
  if (seen.length < 2) fail(`only saw ${seen.length} stop on the path, cannot say the words are absent`)
  // The two configure pages are side steps of Skill lists, by way of the Library: the bar reads that stop.
  for (const q of ["skill=sk-vitals", "skills=sk-vitals,sk-handoff,sk-central-line"]) {
    await t.open(`/lab/flow/setup-walkthrough/configure?set=1&present=1&${q}`)
    await t.visible(t.main.locator("[data-configure-page], [data-configure-sections]").first(), `${q}: the page did not open`, ACT)
    const bar = await t.pathBar()
    const labels = await bar.locator("a, button, [aria-current=step]").evaluateAll((els) => els.map((e) => `${e.getAttribute("aria-label") ?? ""} ${e.textContent ?? ""}`))
    const hit = labels.find((l) => bad.test(l))
    if (hit) fail(`${q}: the path bar names "${hit.match(bad)[0]}"`)
    const pos = await t.position()
    if (pos.name !== "Skill lists" || pos.index !== 1) fail(`${q}: the path bar reads "${pos.text}"`)
  }
})

// ------------------------------------------------------------------ L: library
test("L1", "L", "Search narrows, clear restores", async (t) => {
  await t.open(LIB)
  const before = await t.rowCount()
  const all = await t.allCount()
  if (before < 2) fail(`only ${before} rows rendered before searching`)
  const box = t.main.getByRole("searchbox").first()
  await t.visible(box, "no search box")
  await box.fill("blood")
  await t.p.waitForTimeout(600)
  const narrowed = await t.rowCount()
  if (narrowed === 0 || narrowed >= before) fail(`search "blood" left ${narrowed} of ${before} rows`)
  const texts = await t.skillRows().allInnerTexts()
  const off = texts.find((x) => !/blood/i.test(x))
  if (off) fail(`search left a row without the word: ${off.replace(/\s+/g, " ").slice(0, 60)}`)
  const clear = t.button(/^clear/i, t.main).filter({ visible: true })
  if (await t.isVisible(clear, 400)) await clear.first().click()
  else await box.fill("")
  await t.p.waitForTimeout(600)
  const restored = await t.rowCount()
  if (restored !== before) fail(`after clearing ${restored} rows; before ${before}`)
  if ((await t.allCount()) !== all) fail(`All count changed from ${all} after clearing`)
})
test("L2", "L", "One category and one tag: chips, each removes alone, tab counts follow", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  await t.openFilters()
  const optAll = t.p.getByRole("option")
  await t.visible(optAll, "Filters opened no choices", QUICK)
  const group = (n) => t.p.getByRole("group", { name: n }).getByRole("option")
  const tagOpt = group("Tag").first()
  await t.visible(tagOpt, "no tags offered in Filters")
  const tagName = (await tagOpt.innerText()).trim().split("\n")[0].replace(/\s*\d+$/, "")
  await tagOpt.click()
  await t.p.waitForTimeout(800)
  if (!(await t.isVisible(group("Category").first(), 500))) await t.openFilters()
  const catOpt = group("Category").first()
  await t.visible(catOpt, "no categories offered in Filters")
  const catName = (await catOpt.innerText()).trim().split("\n")[0].replace(/\s*\d+$/, "")
  await catOpt.click()
  await t.p.waitForTimeout(800)
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(800)
  const chip = (n) => t.main.getByRole("button", { name: new RegExp(`(remove|clear).*${esc(n)}|${esc(n)}.*(remove|clear)`, "i") })
  if (!(await t.isVisible(chip(tagName), 1000))) fail(`no removable chip for the tag "${tagName}"`)
  if (!(await t.isVisible(chip(catName), 1000))) fail(`no removable chip for the category "${catName}"`)
  if ((await t.allCount()) >= all) fail(`All tab still ${all} with two filters on; tab counts do not follow`)
  await chip(tagName).first().click()
  await t.p.waitForTimeout(800)
  if (await t.isVisible(chip(tagName), 400)) fail("removing the tag chip left it there")
  if (!(await t.isVisible(chip(catName), 800))) fail("removing the tag chip also removed the category chip")
  await chip(catName).first().click()
  await t.p.waitForTimeout(800)
  if ((await t.allCount()) !== all) fail(`All tab ${await t.allCount()} after removing both; want ${all}`)
})
test("L3", "L", "Times needed cell: names students, confirm, Saved; Status and Configuration unchanged; survives reload", async (t) => {
  await t.open(LIB)
  const status = await t.rowStatus(BP)
  const conf = await t.rowConfig(BP)
  const before = await t.times(BP)
  const value = before === "5" ? "6" : "5"
  await t.setTimes(BP, value, { confirm: false })
  const d = t.p.locator("[data-impact-dialog]")
  await t.visible(d, "no dialog named the students whose progress changes", QUICK)
  if (!/Progress changes for \d+ students?: \S/.test((await d.innerText()).replace(/\s+/g, " "))) fail(`the dialog names nobody: ${(await d.innerText()).slice(0, 120)}`)
  await d.getByRole("button", { name: /^Save changes/ }).click()
  const row = await t.row(BP)
  await t.visible(row.getByText(/^Saved$/), 'no "Saved" shown in the cell', QUICK)
  const problems = []
  if ((await t.times(BP)) !== value) problems.push(`cell reads ${await t.times(BP)} after typing ${value}`)
  if ((await t.rowStatus(BP)) !== status) problems.push(`Status changed from ${status} to ${await t.rowStatus(BP)}`)
  if ((await t.rowConfig(BP)) !== conf) problems.push(`Configuration changed from ${conf} to ${await t.rowConfig(BP)}`)
  await t.leaveAndReturn(LIB)
  if ((await t.times(BP)) !== value) problems.push(`after reload the cell reads ${await t.times(BP)}, want ${value}`)
  if ((await t.rowConfig(BP)) !== conf) problems.push(`after reload Configuration is ${await t.rowConfig(BP)}, want ${conf}`)
  if (problems.length) fail(problems.join("; "))
})
test("L4", "L", "Filter Different number lists the changed skill", async (t) => {
  await t.open(LIB)
  const before = await t.times(BP)
  await t.setTimes(BP, before === "5" ? "6" : "5")
  const all = await t.allCount()
  await t.openFilters()
  const opt = t.p.getByRole("option", { name: /different number/i }).or(t.p.getByRole("menuitemcheckbox", { name: /different number/i })).or(t.p.getByRole("checkbox", { name: /different number/i }))
  if (!(await t.isVisible(opt, 1200))) fail("no Different number filter")
  await opt.first().click()
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(800)
  await t.row(BP)
  if ((await t.rowCount()) >= all) fail(`Different number did not narrow the list (${all} rows)`)
})
test("L5", "L", "Selecting 3 shows exactly the bulk bar", async (t) => {
  await t.open(LIB)
  await t.selectRows([BP, "Height", "Weight"])
  const bar = await t.bulkBar()
  if (!bar) fail("no bulk bar after selecting 3")
  const want = [/^Configure 3 skills$/, /^Edit 3 skills$/, /^Deactivate 3( skills)?$/, /^clear/i]
  const missing = want.filter((re) => !bar.labels.some((l) => re.test(l)))
  const extra = bar.labels.filter((l) => !want.some((re) => re.test(l)))
  const says = /3 selected/i.test(bar.text)
  if (!says || missing.length || extra.length) fail(`bar holds ${bar.labels.join(", ")}; ${says ? "" : 'does not say "3 selected"; '}missing ${missing.map(String).join(" ") || "none"}, extra ${extra.join(", ") || "none"}`)
})
test("L6", "L", "Clearing the selection removes the bar", async (t) => {
  await t.open(LIB)
  await t.selectRows([BP, "Height", "Weight"])
  if (!(await t.bulkBar())) fail("no bulk bar after selecting 3, nothing to clear")
  await t.click(t.button(/clear( selection)?$/i, t.main), "no clear on the bar")
  await t.p.waitForTimeout(500)
  if (await t.bulkBar()) fail("bar still there after clearing")
  const box = t.p.getByRole("checkbox", { name: new RegExp(`^Select row.*${esc(BP)}$`) }).first()
  if (await box.isChecked()) fail("row still selected after clearing")
})
test("L7", "L", "Empty state: message, three ways, no table", async (t) => {
  await t.open(`${LIB}?state=empty`)
  const msg = t.main.getByText(/add your program.s skills/i)
  if (!(await t.isVisible(msg, 1500))) {
    const h2 = await t.main.getByRole("heading", { level: 2 }).allInnerTexts()
    fail(`no "Add your program's skills." message${h2.length ? `; the page says "${h2[0]}"` : ""}`)
  }
  await t.visible(t.action(/^Add a skill$/, t.main), "no Add a skill on the empty state")
  const sev = t.action(/^Add several/, t.main)
  if (!(await t.isVisible(sev, 800))) fail("no Add several on the empty state")
  const up = t.action(/^Bulk upload/, t.main)
  if (!(await t.isVisible(up, 800))) fail("no Bulk upload on the empty state")
  await t.absent(t.main.getByRole("table"), "a table shows on the empty state")
})
test("L8", "L", "Row menu holds exactly the three verbs, no Replace with a new version (D-L105)", async (t) => {
  await t.open(LIB)
  const labels = await t.openRowMenu(BP)
  const want = ["Edit", "Deactivate", "Delete"]
  if (!same(labels, want)) fail(`row menu holds ${labels.join(", ")}; want ${want.join(", ")}`)
  await t.expectMenuOnTop("row menu")
})

test("L9", "L", "Tabs are Status; Status and Configuration are separate columns; the replaced words are gone", async (t) => {
  await t.open(LIB)
  const tabs = (await t.main.getByRole("tab").allInnerTexts()).map((x) => x.replace(/[\d,\s]+$/, "").trim())
  if (!same(tabs, ["All", "Active", "Inactive"])) fail(`tabs read ${tabs.join(", ")}`)
  const heads = (await t.main.getByRole("columnheader").allInnerTexts()).map((x) => x.trim())
  for (const h of ["Status", "Configuration"]) if (!heads.includes(h)) fail(`no ${h} column; columns read ${heads.join(", ")}`)
  const rows = await t.skillRows().allInnerTexts()
  for (const text of rows) {
    const line = text.replace(/\s+/g, " ")
    if (!t.statusOf(line)) fail(`a row has no Status word: ${line.slice(0, 80)}`)
    if (!t.configOf(line)) fail(`a row has no Configuration word: ${line.slice(0, 80)}`)
  }
  // Every Status and Configuration word is a status tag (D-L127).
  const badges = await t.main.locator("tbody [data-slot=status-badge]").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("aria-label") || e.textContent.trim()))])
  const stray = badges.filter((w) => !["Active", "Inactive", "Default", "Custom", "Not configured"].includes(w))
  if (stray.length) fail(`a badge with another word: ${stray.join(", ")}`)
  for (const w of ["Active", "Default", "Custom"]) if (!badges.includes(w)) fail(`no ${w} tag in the table`)
  if (/Program default|Own settings|\bEdited\b|Default configuration/i.test(await t.p.locator("body").innerText())) fail("a replaced word is on the page")
})
test("L10", "L", "Filter Configuration Custom: about 12 rows, the same as keep their settings; the chip removes alone", async (t) => {
  await t.open(LIB)
  await t.openFilters()
  for (const w of ["Default", "Custom", "Not configured"]) await t.visible(t.p.getByRole("option", { name: new RegExp(`^${w}`) }), `no Configuration choice ${w} in Filters`)
  await t.click(t.p.getByRole("option", { name: /^Custom/ }), "no Configuration choice Custom in Filters")
  await t.p.keyboard.press("Escape")
  const chip = t.button(/^Remove filter Custom/, t.main)
  await t.visible(chip, "no chip for Custom", QUICK)
  await t.waitFor(async () => (await t.allCount()) < 40, "the filter did not narrow the tab count")
  const n = await t.allCount()
  if (n < 8 || n > 16) fail(`${n} rows are Custom; want about 12`)
  await chip.click()
  await t.waitFor(async () => (await t.allCount()) > 100, "the chip did not remove the filter")
  await t.open(SET)
  await t.feedbackSwitch().first().click()
  await t.pressSaveSettings()
  const d = t.applyDialog()
  await t.visible(d, "no dialog", QUICK)
  const keep = +((await d.first().innerText()).replace(/\s+/g, " ").match(/(\d+) keep their settings/)?.[1] ?? -1)
  if (keep !== n) fail(`the dialog says ${keep} keep their settings; the filter finds ${n}`)
})
test("L11", "L", "Times needed cell, Cancel in the dialog: the old number returns, nothing saved", async (t) => {
  await t.open(LIB)
  const was = await t.times(BP)
  await t.setTimes(BP, String(Number(was) + 4), { confirm: false })
  const d = t.p.locator("[data-impact-dialog]")
  await t.visible(d, "no dialog", QUICK)
  await d.getByRole("button", { name: /^Cancel/ }).click()
  await t.waitFor(async () => (await t.times(BP)) === was, `the cell reads ${await t.times(BP).catch(() => "")}, not ${was}`)
  await t.reload()
  if ((await t.times(BP)) !== was) fail(`after reload the cell reads ${await t.times(BP)}`)
})
test("L12", "L", "New program: banner gives the count and Set how skills are judged; seeded: no banner, the filter finds 0", async (t) => {
  await t.open(`${LIB}?program=new`)
  await addOnNewProgram(t, unique("Bannered"))
  await t.reload() // the add's own result banner goes; the standing one remains
  const b = await t.expectBanner(/\d+ skills? not configured\./i, "not configured")
  await t.click(t.action(/^Set how skills are judged$/, b), "banner has no Set how skills are judged")
  await t.afterNav(1500)
  if (!/evaluation-settings/.test(t.p.url()) || !/program=new/.test(t.p.url())) fail(`the action opened ${t.p.url()}`)
  await t.open(LIB)
  const text = await t.bannerText()
  if (/not configured/i.test(text)) fail(`a seeded program shows "${text}"`)
  if ((await t.filterConfigCount("Not configured")) !== 0) fail("the Not configured filter finds rows on the seeded program")
})

test("L13", "L", "Search moves the tab counts, so No skills match never sits beside All 178", async (t) => {
  await t.open(LIB)
  const search = t.main.getByRole("searchbox").first()
  await search.fill("blood")
  await t.p.waitForTimeout(600)
  const rows = await t.rowCount()
  const all = await t.tabCount(/^All\b/)
  if (all !== rows) fail(`All reads ${all} with ${rows} rows`)
  await search.fill("zzzz no such skill")
  await t.visible(t.main.getByText(/^No skills match/), "no empty message", QUICK)
  await t.waitFor(async () => (await t.tabCount(/^All\b/)) === 0, `All reads ${await t.tabCount(/^All\b/)} beside No skills match`)
  await t.click(t.main.getByRole("button", { name: /^Clear/ }), "no Clear")
  await t.waitFor(async () => (await t.tabCount(/^All\b/)) > 100, "Clear did not restore the count")
})
test("L14", "L", "Filters has Came from and On no list, with chips that remove alone", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  await t.openFilters()
  await t.click(t.p.getByRole("option", { name: /^On no list/ }), "Filters has no On no list")
  await t.click(t.p.getByRole("option", { name: /^Program list/ }), "Filters has no Came from choice Program list")
  await t.p.keyboard.press("Escape")
  const chips = t.main.locator("[data-filter-chips]")
  await t.visible(chips.getByText("On no list"), "no On no list chip", QUICK)
  await t.visible(chips.getByText("Program list"), "no Program list chip", QUICK)
  await t.click(chips.getByRole("button", { name: "Remove filter On no list" }), "the chip has no remove")
  await t.click(chips.getByRole("button", { name: "Remove filter Program list" }), "the chip has no remove")
  await t.waitFor(async () => (await t.allCount()) === all, "removing the chips did not restore the count")
})
test("L15", "L", "Header Export with no More menu, Columns on the toolbar, Plain list kept after a reload, no column options, long name not cut off", async (t) => {
  await t.open(LIB)
  await t.absent(t.main.getByRole("button", { name: "More", exact: true }), "the header still has More")
  const [download] = await Promise.all([t.p.waitForEvent("download", { timeout: QUICK }), t.main.getByRole("button", { name: "Export", exact: true }).click()])
  if (!/\.csv$/.test(download.suggestedFilename())) fail(`Export gave ${download.suggestedFilename()}`)
  await t.expectBanner(/\d+ skills exported/i, "export")
  await t.click(t.main.getByRole("button", { name: /^View: / }), "no View menu")
  const names = await t.p.getByRole("menuitemradio").allInnerTexts()
  if (!names.includes("Plain list")) fail(`the View menu offers ${names.join(", ")}`)
  await t.p.getByRole("menuitemradio", { name: "Plain list" }).click()
  await t.click(t.main.getByRole("button", { name: "Columns" }), "no Columns")
  await t.click(t.p.getByRole("menuitemcheckbox", { name: "Came from" }), "Columns has no Came from")
  await t.p.keyboard.press("Escape")
  await t.visible(t.main.getByRole("columnheader", { name: /^Came from/ }), "Columns did not add the column", QUICK)
  await t.reload()
  await t.visible(t.main.getByRole("button", { name: "View: Plain list" }), "the view choice did not survive a reload", QUICK)
  await t.visible(t.main.getByRole("columnheader", { name: /^Came from/ }), "the column choice did not survive a reload", QUICK)
  if ((await t.p.locator('button[aria-label$=" column options"]').filter({ visible: true }).count()) > 0) fail("the column header menus (Pin, Wrap, Group, Conditional Rule) are still offered")
})
test("L16", "L", "Times needed: after the dialog's confirm, focus is on the next row's cell", async (t) => {
  await t.open(LIB)
  const cell = (await t.row(BP)).getByRole("spinbutton").first()
  await cell.fill("7")
  await cell.press("Enter")
  const d = await t.visible(t.p.locator("[data-impact-dialog]"), "no dialog for Blood Pressure", QUICK)
  await d.getByRole("button", { name: "Save changes" }).click()
  await t.waitFor(() => t.p.evaluate(() => /^times-cell-/.test(document.activeElement?.id ?? "")), "focus is not on a Times needed cell")
  const on = await t.p.evaluate(() => document.activeElement?.getAttribute("aria-label"))
  if (/Blood Pressure/.test(on ?? "")) fail("focus stayed on the same cell")
})
test("L17", "L", "Selection bar: inactive only shows no actions; one Tab from a selected row reaches it; it fits at 375", async (t) => {
  await t.open(`${LIB}?status=inactive`)
  const boxes = t.main.getByRole("checkbox", { name: /^Select (?!all)/ })
  await boxes.first().click()
  const bar = t.p.locator("[data-exxat-bulk-bar]")
  await t.visible(bar, "no bar", QUICK)
  const text = await bar.innerText()
  if (/\b0\b|Configure|Edit|Deactivate/.test(text)) fail(`with inactive rows alone the bar reads "${text}"`)
  await t.open(LIB)
  const row = await t.row(BP)
  const box = row.getByRole("checkbox").first()
  await box.focus()
  await t.p.keyboard.press("Space")
  await t.p.keyboard.press("Tab")
  const skip = t.main.locator("[data-skip-to-bar]:focus")
  await t.visible(skip, "one Tab from a selected row does not offer the bar", QUICK)
  await t.p.keyboard.press("Enter")
  await t.waitFor(() => t.p.evaluate(() => !!document.activeElement?.closest("[data-exxat-bulk-bar]")), "the skip did not reach the bar")
  await t.p.setViewportSize({ width: 375, height: 812 })
  await t.p.waitForTimeout(500)
  const fits = await bar.evaluate((b) => { const r = b.getBoundingClientRect(); return [...b.querySelectorAll("button, a")].every((c) => { const x = c.getBoundingClientRect(); return x.left >= r.left - 1 && x.right <= r.right + 1 }) })
  if (!fits) fail("at 375 a bar action is cut off")
})
test("L18", "L", "A new program with no skills: the same empty message as the demo state, no setup pointers", async (t) => {
  await t.open(`${LIB}?program=new`)
  await t.visible(t.main.getByRole("heading", { name: /^Add your program's skills/ }), "no empty message", QUICK)
  for (const name of [/^Add a skill$/, /^Add several$/, /^Bulk upload/]) await t.visible(t.action(name, t.main.locator('[data-region="empty"]')), `the empty message has no ${name}`, QUICK)
  await t.absent(t.main.getByText(/Setup paused|Continue setup/), "the Library still points into the setup wizard")
  await t.absent(t.action(/^Set up skills$/, t.main), "the Library still has Set up skills")
})
test("L19", "L", "A program with no categories: a plain list, no group row, no Category column, one banner under the title", async (t) => {
  await t.open(`${LIB}?program=new`)
  await addOnNewProgram(t, unique("Plain"))
  await t.visible(t.main.locator("[data-skill-link]"), "the added skill is not listed", QUICK)
  await t.absent(t.main.getByRole("columnheader", { name: /^Category/ }), "a Category column on a program with no categories")
  await t.absent(t.main.getByText("No category", { exact: true }), "a No category group row")
  const banners = t.p.locator('[data-region="banner"]')
  if ((await banners.count()) !== 1) fail(`${await banners.count()} banners at once`)
  const below = await banners.first().evaluate((b) => { const h = document.querySelector("main h1"); return h.getBoundingClientRect().bottom <= b.getBoundingClientRect().top })
  if (!below) fail("the banner is not under the title")
})
test("L20", "L", "Scenario, Reset all edits clears an added skill and the new program; Exit, Start again does too, on the Library stop", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  const sheet = await addSheet(t)
  await sheet.getByRole("textbox", { name: /^Name/ }).fill(unique("Reset me"))
  await t.click(sheet.getByRole("button", { name: /^Add skill$/ }), "no Add skill")
  await t.waitFor(async () => (await t.allCount()) === all + 1, "the skill was not added")
  await t.open(`${LIB}?program=new`)
  await addOnNewProgram(t, unique("Reset new"))
  await t.p.addStyleTag({ content: "[aria-label='Design lab controls'] { display: flex !important; }" })
  await t.click(t.p.getByRole("button", { name: "Scenario" }), "no Scenario")
  await t.click(t.p.getByRole("menuitem", { name: "Reset all edits" }), "no Reset all edits")
  await t.afterNav()
  await t.settle()
  await t.visible(t.main.getByRole("heading", { name: /^Add your program's skills/ }), "the new program kept its skill", ACT)
  await t.open(LIB)
  if ((await t.allCount()) !== all) fail(`All reads ${await t.allCount()} after the reset; it was ${all}`)
  // The walkthrough's Library side step.
  const sheet2 = await addSheet(t, "/lab/flow/setup-walkthrough/library?set=1&present=1")
  await sheet2.getByRole("textbox", { name: /^Name/ }).fill(unique("Start me"))
  await t.click(sheet2.getByRole("button", { name: /^Add skill$/ }), "no Add skill")
  await t.waitFor(async () => (await t.allCount()) === all + 1, "the skill was not added at the stop")
  await t.click(t.p.locator("[data-walkthrough-exit]"), "the Library side step has no Exit")
  await t.click(t.p.locator("[data-walkthrough-restart]"), "Exit has no Start again")
  await t.afterNav()
  await t.settle()
  await t.visible(t.main.locator("[data-list-link]").first(), "Start again did not open the first stop, Skill lists", LOAD)
  await t.open(LIB)
  if ((await t.allCount()) !== all) fail(`All reads ${await t.allCount()} after Start again; it was ${all}`)
})
// ------------------------------------------------------------------ E: edit a skill
/** A seeded Custom skill whose reset changes who has achieved it (lib/v2/seed.ts SEED_RESET_FIXTURE). */
const EDITED_FIXTURE = "Straight cath (in and out)"
/** Exists only with unsaved changes (D-L97, map D1c): the panel's footer, or the page's header. */
const saveChanges = (where) => where.getByRole("button", { name: /^Save changes/ })
/** Panel Save changes, and confirm the impact dialog when one opens. */
async function savePanel(t, panel) {
  await t.click(saveChanges(panel), "no Save changes")
  const d = t.p.getByRole("alertdialog")
  if (await t.isVisible(d, 1000)) await t.click(d.getByRole("button", { name: /^Save changes/ }), "dialog has no Save changes")
  await t.expectBanner(/saved\./i, "panel save")
}
/** The page's Save changes, confirming the dialog when one opens: it lands in the Library, with the panel open and the banner (map D1c). Returns the panel. */
async function savePage(t, page) {
  await t.click(saveChanges(page), "no Save changes")
  const d = t.p.getByRole("alertdialog")
  if (await t.isVisible(d, 1000)) await t.click(d.getByRole("button", { name: /^Save changes/ }), "dialog has no Save changes")
  await t.waitFor(() => /skills-library/.test(t.p.url()), () => `Save stayed on ${t.p.url()}`, ACT)
  await t.expectBanner(/saved\./i, "page save")
  const panel = t.dialog().first()
  await t.visible(panel.getByRole("textbox", { name: /^Name/ }), "the panel did not open on the saved skill")
  return panel
}
/** The page's Feedback switch, in Who evaluates under Custom. */
async function feedbackIn(t, page) {
  if ((await page.getByRole("radio", { name: "Custom", exact: true }).getAttribute("aria-checked")) !== "true") await t.chooseCustom(page)
  await t.openGroup(page, "Who evaluates")
  const sw = page.getByRole("switch", { name: /^Feedback is required/ })
  await t.visible(sw, "no Feedback is required switch in Who evaluates")
  return sw
}
/** E11: Feedback required flipped against the program. The map says off; the sample program has it off, so the flip is on [INFER]. */
async function flipFeedback(t, page) {
  const sw = await feedbackIn(t, page)
  const was = (await sw.getAttribute("aria-checked")) === "true"
  await sw.click()
  await t.waitFor(async () => ((await sw.getAttribute("aria-checked")) === "true") !== was, "Feedback did not change")
  return !was
}
const openSectionTiles = (t, page) => t.openGroup(page, "How this skill is judged")
/** E19's start: Blood Pressure on Questions, saved with none. Returns the panel the save lands on. */
async function savedWithNoQuestions(t) {
  const page = await t.openConfigure()
  await t.chooseCustom(page)
  await openSectionTiles(t, page)
  await t.click(page.getByRole("radio", { name: /^Questions/ }), "no Questions option")
  return savePage(t, page)
}
/** A deactivated skill's panel, through the panel's Active switch (E6's start). */
async function deactivateInPanel(t, name = BP) {
  const panel = await t.openEditPanel(name)
  await t.click(t.activeSwitch(panel), "no Active switch in the panel")
  const d = t.p.getByRole("alertdialog")
  await t.visible(d, "Deactivate opened no dialog", QUICK)
  await t.click(d.getByRole("button", { name: /^Deactivate/ }), "dialog has no Deactivate button")
  await t.waitFor(async () => (await t.rowStatus(name)) === "Inactive", "the row did not go Inactive")
  return panel
}
async function offeredOnMapping(t, name) {
  await t.open(MAP)
  await t.click(t.main.getByRole("radio", { name: "By skill" }).or(t.main.getByRole("tab", { name: "By skill" })), "no By skill view")
  await t.p.waitForTimeout(1000)
  const search = t.main.getByRole("searchbox", { name: /skill/i }).filter({ visible: true })
  await t.visible(search, "no skill search on By skill")
  await search.first().fill(name)
  await t.p.waitForTimeout(600)
  return t.isVisible(t.link(name, t.main), 800)
}

test("E1", "E", "Row opens on Details, library still there, no footer; Active switch, no Status row or button; Evaluation settings reads Default, with Configure to the full page", async (t) => {
  const panel = await t.openEditPanel()
  for (const n of [/^Name/, /^Description/]) {
    const f = panel.getByRole("textbox", { name: n })
    await t.visible(f, `panel has no ${n} field`)
    if (!(await f.first().isEditable())) fail(`${n} field is not editable`)
  }
  await t.visible(panel.getByRole("button", { name: /^Category/ }).or(panel.getByRole("combobox", { name: /^Category/ })), "panel has no Category control")
  await t.visible(panel.getByRole("combobox", { name: /tags/i }).or(panel.getByRole("textbox", { name: /tags/i })), "panel has no Tags box")
  await t.visible(t.main.getByRole("heading", { level: 1, name: /library/i }), "library title is hidden behind the panel")
  await t.visible(t.rowOf(BP), "library row is hidden behind the panel")
  const tabs = await panel.getByRole("tab").allInnerTexts()
  if (!same(tabs.map((x) => x.trim()), ["Details", "Used in"])) fail(`the panel's tabs read ${tabs.join(", ")}`)
  if ((await panel.getByRole("tab", { name: "Details" }).getAttribute("aria-selected")) !== "true") fail("the panel does not open on Details")
  await t.absent(saveChanges(panel), "a clean panel shows Save changes")
  await t.absent(panel.locator("[data-unsaved-footer]"), "a clean panel shows a footer")
  const sw = panel.getByRole("switch", { name: "Skill is active" })
  await t.visible(sw, 'no Active switch named "Skill is active"')
  if ((await sw.getAttribute("aria-checked")) !== "true") fail("the switch is off on an Active skill")
  await t.absent(panel.getByRole("button", { name: /^(Deactivate|Reactivate)$/ }), "the panel still has a status button")
  await t.absent(panel.getByText(/^Status$/), "the panel still has a Status row")
  if ((await t.panelConfig(panel)) !== "Default") fail(`Configuration reads ${await t.panelConfig(panel)}`)
  await t.absent(panel.getByRole("radio", { name: "Default", exact: true }), "the panel still has the segmented control")
  await t.visible(panel.getByRole("spinbutton", { name: /^Times needed/ }), "no Times needed on Details")
  await t.visible(panel.locator("[data-rule-sentence]"), "no rule sentence on Details")
  const configure = panel.getByRole("link", { name: /^Configure$/ })
  await t.visible(configure, "no Configure on the Evaluation settings row")
  if (!/configure/.test((await configure.getAttribute("href")) ?? "")) fail(`Configure goes to ${await configure.getAttribute("href")}`)
})
test("E2", "E", "Rename: banner names it, panel stays, row updates, Configuration unchanged, persists", async (t) => {
  const panel = await t.openEditPanel()
  await t.scrollRowToTop(BP)
  const name = unique("Blood Pressure renamed")
  await panel.getByRole("textbox", { name: /^Name/ }).fill(name)
  await t.click(saveChanges(panel), "no Save changes")
  await t.expectBanner(new RegExp(esc(name)), "rename")
  await t.expectBannerInView("rename")
  if (!(await t.isVisible(t.dialog().first(), 600))) fail("panel closed after Save changes; it should stay open")
  await t.row(name)
  if ((await t.rowConfig(name)) !== "Default") fail(`Configuration reads ${await t.rowConfig(name)} after a rename`)
  await t.leaveAndReturn(LIB)
  await t.row(name)
})
test("E3", "E", "Description, category, new tag: on the row, after reload, on Categories and tags; Configuration unchanged", async (t) => {
  const panel = await t.openEditPanel()
  const desc = unique("Measured with a cuff")
  const tag = unique("tagged").replace(/ /g, "-")
  await panel.getByRole("textbox", { name: /^Description/ }).fill(desc)
  await t.pickCategory(panel, "Assessment")
  await t.addTag(panel, tag)
  await t.click(saveChanges(panel), "no Save changes")
  await t.expectBanner(/saved/i, "edit")
  await t.leaveAndReturn(LIB)
  const row = await t.row(BP)
  const text = await row.innerText()
  if (!text.includes(tag)) fail(`new tag "${tag}" is not on the row after reload`)
  if (!text.includes("Default")) fail("Configuration changed with the details")
  if (!text.includes("Assessment")) {
    const grp = await row.evaluate((r) => { let e = r.previousElementSibling; while (e && e.querySelector("[type=checkbox][aria-label^='Select row']")) e = e.previousElementSibling; return e?.textContent ?? "" })
    if (!grp.includes("Assessment")) fail("category Assessment does not show on the row after reload")
  }
  await t.openEditPanel()
  const again = await t.dialog().first().getByRole("textbox", { name: /^Description/ }).inputValue()
  if (again !== desc) fail(`description reads "${again}" after reload`)
  await t.open(CATS)
  await t.click(t.main.getByRole("tab", { name: /^Tags/ }), "no Tags tab")
  await t.p.waitForTimeout(500)
  await t.visible(t.main.getByRole("row", { name: new RegExp(esc(tag)) }), `new tag "${tag}" is not on Categories and tags`)
})
test("E4", "E", "Cancel with a change asks; Keep editing stays; Discard reverts", async (t) => {
  const panel = await t.openEditPanel()
  const name = panel.getByRole("textbox", { name: /^Name/ })
  await name.fill("Unsaved name")
  await t.click(panel.getByRole("button", { name: /^Cancel$/ }), "no Cancel on the panel")
  await t.expectDiscardPrompt("Cancel with a change")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Keep editing/ }), "prompt has no Keep editing")
  await t.p.waitForTimeout(300)
  if ((await name.inputValue()) !== "Unsaved name") fail("Keep editing lost the typed name")
  await t.click(panel.getByRole("button", { name: /^Cancel$/ }), "no Cancel on the panel")
  await t.expectDiscardPrompt("second Cancel")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "prompt has no Discard")
  await t.p.waitForTimeout(400)
  await t.row(BP)
  await t.absent(t.rowOf("Unsaved name"), "the discarded name reached the list")
})
test("E5", "E", "Another row with a change asks before switching", async (t) => {
  const panel = await t.openEditPanel()
  await panel.getByRole("textbox", { name: /^Name/ }).fill("Unsaved name")
  const other = await t.row("Height")
  // The open panel covers the right of the page, so click a part of the row left of it (nth(-2) sits behind the panel at 1440).
  await other.getByRole("cell").nth(3).click({ position: { x: 4, y: 4 } }).catch((e) => fail(`could not click another row: ${String(e).split("\n")[0].slice(0, 80)}`))
  await t.expectDiscardPrompt("switching row with a change")
})
test("E6", "E", "Deactivate from the panel: counts, Inactive, Configuration unchanged, banner Reactivate, muted, persists", async (t) => {
  const panel = await t.openEditPanel()
  await t.scrollRowToTop(BP)
  const sw = t.activeSwitch(panel)
  await t.click(sw, "no Active switch in the panel")
  const d = t.p.getByRole("alertdialog").or(t.dialog(/Deactivate/))
  await t.visible(d, "turning the switch off opened no dialog", QUICK)
  // Cancel returns the switch and changes nothing.
  await t.click(d.first().getByRole("button", { name: /^Keep active/ }), "dialog has no Keep active")
  await t.p.waitForTimeout(300)
  if ((await sw.getAttribute("aria-checked")) !== "true") fail("Keep active did not return the switch")
  if ((await t.rowStatus(BP)) !== "Active") fail("Keep active changed the row")
  await t.click(sw, "no Active switch in the panel")
  await t.visible(d, "turning the switch off a second time opened no dialog", QUICK)
  const text = (await d.first().innerText()).replace(/\s+/g, " ")
  for (const [w, re] of [["courses", /course/i], ["students", /student/i], ["evaluations", /evaluation/i]]) if (!re.test(text) || !/\d/.test(text)) fail(`dialog has no count for ${w}: "${text.slice(0, 120)}"`)
  await t.click(d.first().getByRole("button", { name: /^Deactivate/ }), "dialog has no Deactivate button")
  await t.p.waitForTimeout(600)
  const b = await t.expectBanner(/deactivat|inactive/i, "deactivate")
  await t.expectBannerInView("deactivate")
  await t.visible(t.action(/^Reactivate/, b), "banner has no Reactivate")
  if ((await t.rowStatus(BP)) !== "Inactive") fail(`status reads ${await t.rowStatus(BP)}; want Inactive`)
  if ((await sw.getAttribute("aria-checked")) !== "false") fail("the switch still reads on after deactivating")
  if ((await t.rowConfig(BP)) !== "Default") fail(`Configuration reads ${await t.rowConfig(BP)} after deactivating`)
  const muted = await (await t.row(BP)).evaluate((r, other) => {
    const style = (row) => { const c = getComputedStyle(row.querySelector("a, td span, td") ?? row); return `${c.color} ${c.opacity} ${getComputedStyle(row).opacity}` }
    const live = [...document.querySelectorAll("tr")].find((x) => x.textContent.includes(other))
    return style(r) !== style(live)
  }, "Height")
  if (!muted) fail("row is not muted: it looks the same as an active row")
  await t.leaveAndReturn(LIB)
  if ((await t.rowStatus(BP)) !== "Inactive") fail(`after reload status reads ${await t.rowStatus(BP)}; want Inactive`)
})
async function deactivateViaMenu(t) {
  await t.open(LIB)
  await t.rowMenuItem(BP, /^Deactivate/)
  const d = t.p.getByRole("alertdialog").or(t.dialog(/Deactivate/))
  await t.visible(d, "Deactivate opened no dialog", QUICK)
  await t.click(d.first().getByRole("button", { name: /^Deactivate/ }), "dialog has no Deactivate button")
  await t.p.waitForTimeout(700)
}
test("E7", "E", "A deactivated skill is not in the Course mapping picker", async (t) => {
  await deactivateViaMenu(t)
  if (await offeredOnMapping(t, BP)) fail(`deactivated "${BP}" is still offered on By skill`)
  if (!(await offeredOnMapping(t, "Height"))) fail("control skill Height not offered either, cannot judge")
})
test("E8", "E", "Reactivate: Status Active, Configuration as it was", async (t) => {
  await deactivateViaMenu(t)
  await t.open(LIB)
  if ((await t.rowStatus(BP)) !== "Inactive") fail(`deactivation did not hold across a page load: status ${await t.rowStatus(BP)}`)
  await t.scrollRowToTop(BP)
  await t.rowMenuItem(BP, /^Reactivate/)
  // Map D0 rule 9, 2026-11-05: it has evaluations, so coming back changes those students' pages, and they are named first.
  const named = await t.visible(t.p.locator("[data-impact-dialog]"), "Reactivate ran with no dialog, though the skill holds evaluations", QUICK)
  if (!/Progress changes for \d+ students?:/.test(await named.innerText())) fail(`the Reactivate dialog names nobody: ${await named.innerText()}`)
  await t.click(named.getByRole("button", { name: /^Reactivate/ }), "the dialog has no Reactivate")
  await t.expectBanner(/reactivated/i, "reactivate")
  await t.expectBannerInView("reactivate")
  if ((await t.rowStatus(BP)) !== "Active") fail(`status reads ${await t.rowStatus(BP)}; want Active`)
  if ((await t.rowConfig(BP)) !== "Default") fail(`Configuration reads ${await t.rowConfig(BP)}`)
  await t.leaveAndReturn(LIB)
  if ((await t.rowStatus(BP)) !== "Active") fail(`after reload status reads ${await t.rowStatus(BP)}`)
})
test("E9", "E", "The page: three cards as on Evaluation settings; Default reads the program's values in place with the skill's own rows live; Custom makes every row live; each card says Default or Custom", async (t) => {
  const page = await t.openConfigure()
  await t.visible(page.locator("[data-settings-glance] [data-rule-sentence]"), "no rule sentence atop What counts as achieved")
  await t.absent(page.locator("[data-preview-panel] [data-rule-sentence]"), "the preview says the rule again")
  await t.visible(page.getByRole("spinbutton", { name: /^Times needed/ }), "no Times needed")
  await t.visible(page.getByRole("radiogroup", { name: "Evaluation settings" }), 'no segmented control named "Evaluation settings"')
  await t.absent(page.locator("[data-slot=accordion-trigger]"), "the page still has an accordion")
  const cards = await page.locator("[data-settings-section] h2").allInnerTexts()
  if (cards.join(" | ") !== "What counts as achieved | Steps before it counts | Forms") fail(`cards read ${cards.join(" | ")}`)
  const words = await page.locator("[data-card-word]").evaluateAll((els) => els.map((e) => e.getAttribute("data-card-word")))
  if (words.join() !== "default,default,default") fail(`card sources read ${words.join()}`)
  const readout = (await page.locator("[data-package-readout]").allInnerTexts()).join(" ").replace(/\s+/g, " ")
  for (const w of ["Judged by", "Levels", "Counts", "What the student fills in", "Who can sign off", "Feedback", "Group check-off"]) if (!readout.includes(w)) fail(`the read-out has no ${w}: ${readout}`)
  if ((await page.locator("[data-step-value]").count()) !== 2) fail("the path does not read the two optional steps as On or Off")
  const own = page.locator("[data-own-rows]")
  await t.visible(own.getByText(/^Set on this skill only$/), "the skill's own rows are not marked")
  await t.visible(own.getByRole("spinbutton", { name: /^Times needed/ }), "Times needed is not with the skill's own rows")
  await t.visible(page.getByRole("link", { name: /^Edit Evaluation settings/ }), "no link to Evaluation settings")
  await t.absent(page.getByRole("radio", { name: /^Independence level/ }), "Default shows the model as a form")
  await t.visible(page.getByRole("button", { name: /^Add minimum/ }), "no Add minimum under Default")
  await t.chooseCustom(page)
  const custom = await page.locator("[data-card-word]").evaluateAll((els) => els.map((e) => e.getAttribute("data-card-word")))
  if (custom.join() !== "custom,custom,custom") fail(`card sources under Custom read ${custom.join()}`)
  const live = async (loc, what) => { await t.visible(loc, `no ${what}`); if (await loc.first().isDisabled()) fail(`${what} is not live`) }
  await live(page.getByRole("checkbox", { name: / counts$/ }), "a Counts box")
  await live(page.getByRole("textbox", { name: /^Level 1$/ }), "a level name")
  await live(page.getByRole("button", { name: /^Add minimum/ }), "Add minimum")
  for (const m of [/^Independence level/, /^Approved or not approved/, /^Questions/, /^Score on a scale/]) await live(page.getByRole("radio", { name: m }), String(m))
  await live(page.getByRole("button", { name: /^Edit fields/ }), "Edit fields")
  for (const m of [/^Student rates themselves first/, /^Feedback is required/, /^Faculty can check off a group/, /^Approval before it counts/]) await live(page.getByRole("switch", { name: m }), String(m))
  await live(page.getByRole("group", { name: /^Who can sign off/ }).getByRole("checkbox"), "Who can sign off")
  // Choosing Default again with nothing changed leaves nothing to save.
  await t.chooseDefault(page)
  await t.waitFor(async () => (await saveChanges(page).count()) === 0, "Custom then Default, with no change, still offers Save changes")
})
test("E10", "E", "Panel header menu: Delete, no Replace, no Configure (D-L105)", async (t) => {
  const panel = await t.openEditPanel()
  await t.click(panel.getByRole("button", { name: /^(Actions|More)/i }), 'no "..." in the panel header')
  const labels = await t.menuLabels()
  if (!same(labels, ["Delete"])) fail(`panel menu holds ${labels.join(", ")}; want Delete`)
  await t.expectMenuOnTop("panel menu")
})
test("E11", "E", "A package change shows Save changes and Cancel; the table row does not change yet", async (t) => {
  const page = await t.openConfigure()
  await flipFeedback(t, page)
  await t.waitFor(async () => (await t.panelConfig(page)) === "Custom", `Configuration reads "${await t.panelConfig(page)}" in the form; want Custom`)
  await t.visible(page.getByRole("link", { name: /^Cancel$/ }), "no Cancel in the header")
  if (!(await saveChanges(page).first().isEnabled())) fail("Save changes is not enabled")
  await t.click(page.getByRole("link", { name: /^Cancel$/ }), "no Cancel")
  await t.expectDiscardPrompt("Cancel with a change")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "prompt has no Discard")
  await t.visible(t.main.getByRole("heading", { level: 1, name: /library/i }), "Cancel did not return to the Library", ACT)
  if ((await t.rowConfig(BP)) !== "Default") fail(`the table row reads ${await t.rowConfig(BP)} after a discard`)
})
test("E12", "E", "Save changes: lands on the panel, row Custom, Status Active, persists; Custom filter one higher", async (t) => {
  await t.open(LIB)
  const before = await t.filterConfigCount("Custom")
  const page = await t.openConfigure()
  const on = await flipFeedback(t, page)
  const panel = await savePage(t, page)
  await t.expectBannerOnScreen(/saved\./, "landing")
  await t.waitFor(async () => (await panel.locator("[data-unsaved-footer]").count()) === 0, "the panel arrived with unsaved changes")
  if (!(await panel.evaluate((el) => el.contains(document.activeElement)))) fail("focus is not in the panel on landing")
  if ((await t.rowConfig(BP)) !== "Custom") fail(`row reads ${await t.rowConfig(BP)}; want Custom`)
  if ((await t.rowStatus(BP)) !== "Active") fail(`Status reads ${await t.rowStatus(BP)}`)
  const again = await t.openConfigure()
  if ((await t.panelConfig(again)) !== "Custom") fail(`after reload the page reads ${await t.panelConfig(again)}`)
  const sw = await feedbackIn(t, again)
  if (((await sw.getAttribute("aria-checked")) === "true") !== on) fail("Feedback did not survive a reload")
  const after = await t.filterConfigCount("Custom")
  if (after !== before + 1) fail(`Custom filter reads ${after}; before ${before}`)
})
async function savedCustom(t) {
  const page = await t.openConfigure()
  const on = await flipFeedback(t, page)
  await savePage(t, page)
  return { on }
}
test("E13", "E", "Default then Cancel: the page reads Default, asked to discard; Discard leaves the skill Custom", async (t) => {
  const { on } = await savedCustom(t)
  const page = await t.openConfigure()
  await t.chooseDefault(page)
  await t.waitFor(async () => (await t.panelConfig(page)) === "Default", "the form did not reset")
  await t.click(page.getByRole("link", { name: /^Cancel$/ }), "no Cancel")
  await t.expectDiscardPrompt("Cancel after choosing Default")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "prompt has no Discard")
  await t.visible(t.main.getByRole("heading", { level: 1, name: /library/i }), "Cancel did not return to the Library", ACT)
  if ((await t.rowConfig(BP)) !== "Custom") fail(`row reads ${await t.rowConfig(BP)}`)
  const again = await t.openConfigure()
  const sw = await feedbackIn(t, again)
  if (((await sw.getAttribute("aria-checked")) === "true") !== on) fail("Feedback changed")
})
test("E14", "E", "Default, Save: Default, no dialog, Times untouched, Feedback follows the program", async (t) => {
  const { on } = await savedCustom(t)
  const times = await t.times(BP)
  const page = await t.openConfigure()
  await t.chooseDefault(page)
  await t.click(saveChanges(page), "no Save changes")
  if (await t.isVisible(t.p.getByRole("alertdialog"), 800)) fail("an impact dialog opened, though no progress changes")
  await t.expectBanner(/saved\./i, "reset")
  if ((await t.rowConfig(BP)) !== "Default") fail(`row reads ${await t.rowConfig(BP)}`)
  if ((await t.times(BP)) !== times) fail("Times needed changed")
  const again = await t.openConfigure()
  const readout = (await again.locator("[data-package-readout]").allInnerTexts()).join("\n")
  if (on ? /Feedback\s+Required/.test(readout) : /Feedback\s+Optional/.test(readout)) fail(`Feedback does not follow the program: ${readout.replace(/\s+/g, " ")}`)
})
test("E15", "E", "Default that changes who achieved: counts them with Show names; Cancel changes nothing; confirm applies", async (t) => {
  const page = await t.openConfigure(EDITED_FIXTURE)
  await t.chooseDefault(page)
  await t.click(saveChanges(page), "no Save changes")
  const d = t.p.getByRole("alertdialog")
  await t.visible(d, "no impact dialog", QUICK)
  if (!/Students whose progress changes \d+/.test((await d.innerText()).replace(/\s+/g, " "))) fail(`the dialog counts nobody: ${(await d.innerText()).slice(0, 120)}`)
  await t.click(d.getByRole("button", { name: /^Show names/ }), "no Show names")
  await t.visible(d.locator("[data-impact-names] li").first(), "Show names lists nobody", QUICK)
  await t.click(d.getByRole("button", { name: /^Cancel/ }), "dialog has no Cancel")
  await t.p.waitForTimeout(400)
  if (!/configure/.test(t.p.url())) fail("Cancel left the page")
  await t.click(saveChanges(page), "no Save changes")
  await t.click(t.p.getByRole("alertdialog").getByRole("button", { name: /^Save changes/ }), "dialog has no Save changes")
  await t.expectBanner(/saved\./i, "reset")
  if ((await t.rowConfig(EDITED_FIXTURE)) !== "Default") fail(`row reads ${await t.rowConfig(EDITED_FIXTURE)}`)
})
async function toApproved(t) {
  const page = await t.openConfigure()
  await t.chooseCustom(page)
  await openSectionTiles(t, page)
  await t.click(page.getByRole("radio", { name: /^Approved or not approved/ }), "no Approved or not approved option")
  await t.openGroup(page, "What counts as achieved")
  await t.visible(page.getByRole("textbox", { name: /^First label/ }), "no Labels after choosing the model")
  return page
}
test("E16", "E", "Choose Approved or not approved: rows rebuild, nothing preselected", async (t) => {
  const page = await toApproved(t)
  await t.absent(page.getByRole("button", { name: /^Edit levels/ }), "Levels is still in the form")
  await t.absent(page.getByRole("checkbox", { name: / counts$/ }), "Counts is still in the form")
  for (const r of await page.getByRole("group", { name: /^Which one qualifies/ }).getByRole("radio").all()) if (await r.isChecked()) fail("Which one qualifies is preselected")
  if ((await page.getByRole("textbox", { name: /^First label/ }).inputValue()) !== "") fail("a label is preselected")
  await t.visible(page.getByRole("button", { name: /^Add minimum/ }), "clinical setting minimums went")
  await t.visible(page.getByRole("spinbutton", { name: /^Times needed/ }), "Times needed went")
})
test("E17", "E", "Save without filling: problems listed, focus on the first, no dialog", async (t) => {
  const page = await toApproved(t)
  await t.click(saveChanges(page), "no Save changes")
  await t.visible(page.locator("[data-region=validation-summary]"), "no list of problems", QUICK)
  await t.absent(t.p.getByRole("alertdialog"), "the dialog opened")
  await t.waitFor(() => page.getByRole("textbox", { name: /^First label/ }).evaluate((e) => e === document.activeElement), "focus is not on the first problem")
})
test("E18", "E", "Fill both, Save: dialog lists what is cleared; confirm: Custom", async (t) => {
  const page = await toApproved(t)
  await page.getByRole("textbox", { name: /^First label/ }).fill("Approved")
  await page.getByRole("textbox", { name: /^Second label/ }).fill("Not approved")
  await t.click(page.getByRole("group", { name: /^Which one qualifies/ }).getByRole("radio").first(), "no Which one qualifies choice")
  await t.click(saveChanges(page), "no Save changes")
  const d = t.p.getByRole("alertdialog")
  await t.visible(d, "no dialog", QUICK)
  const text = (await d.innerText()).replace(/\s+/g, " ")
  for (const w of ["Cleared", "Levels that count", "Minimum at each level"]) if (!text.includes(w)) fail(`the dialog does not list ${w}: ${text.slice(0, 160)}`)
  await t.click(d.getByRole("button", { name: /^Save changes/ }), "dialog has no Save changes")
  await t.expectBanner(/saved\./i, "model change")
  if ((await t.rowConfig(BP)) !== "Custom") fail(`row reads ${await t.rowConfig(BP)}`)
})
test("E19", "E", "Questions with none: saved, the page says No questions yet with the single Add questions, Default still offered; off Course mapping", async (t) => {
  await savedWithNoQuestions(t)
  if ((await t.rowConfig(BP)) !== "Not configured") fail(`row reads ${await t.rowConfig(BP)}`)
  const page = await t.openConfigure()
  if ((await t.panelConfig(page)) !== "Not configured") fail(`the page reads ${await t.panelConfig(page)}`)
  await t.visible(page.locator("[data-questions-count]").filter({ hasText: /No questions yet/ }), "no No questions yet")
  if ((await page.getByRole("button", { name: /^Add questions/ }).count()) !== 1) fail("Add questions appears more than once")
  await t.visible(page.getByRole("radio", { name: "Default", exact: true }), "Default is not offered")
  await t.visible(page.locator("[data-preview-line]").filter({ hasText: /Add questions to see the evaluator's form/ }), "no preview line")
  if (await offeredOnMapping(t, BP)) fail("the skill is still offered on Course mapping")
})
test("E20", "E", "Not configured: Times needed saves in the panel, stays Not configured; the cell too; reload", async (t) => {
  const panel = await savedWithNoQuestions(t)
  await panel.getByRole("spinbutton", { name: /^Times needed/ }).fill("4")
  await t.click(saveChanges(panel), "no Save changes")
  await t.expectBanner(/saved\./i, "times")
  if ((await t.rowConfig(BP)) !== "Not configured") fail(`row reads ${await t.rowConfig(BP)}`)
  if ((await t.times(BP)) !== "4") fail(`the cell reads ${await t.times(BP)}`)
  await t.open(LIB)
  await t.setTimes(BP, "6", { confirm: false })
  if ((await t.times(BP)) !== "6") fail("the table cell did not save")
  if ((await t.rowConfig(BP)) !== "Not configured") fail(`row reads ${await t.rowConfig(BP)}`)
  await t.reload()
  if ((await t.times(BP)) !== "6") fail(`after reload the cell reads ${await t.times(BP)}`)
})
test("E21", "E", "Add questions, write 3, All Yes, Save: Custom, back on Course mapping, sentence states the 3 questions", async (t) => {
  await savedWithNoQuestions(t)
  const page = await t.openConfigure()
  await t.click(page.getByRole("button", { name: /^Add questions/ }), "no Add questions")
  const q = t.p.locator("[data-questions-dialog]")
  await t.visible(q, "Add questions opened no dialog", QUICK)
  for (let i = 0; i < 3; i++) {
    if (i > 0) await t.click(q.getByRole("button", { name: /^Add a question/ }), "no Add a question")
    await q.getByRole("textbox", { name: new RegExp(`^Question ${i + 1}`) }).fill(`Question text ${i + 1}`)
  }
  await t.click(q.getByRole("button", { name: /^Save$/ }), "no Save in the questions dialog")
  await t.click(page.locator("#cfg-qrule-all"), "no All Yes")
  await t.visible(page.locator("[data-questions-count]").filter({ hasText: "3 questions" }), "the form does not say 3 questions")
  const sentence = await page.locator("[data-rule-sentence]").first().innerText()
  if (!/\d+ evaluation/.test(sentence) || !/\b3 questions\b/.test(sentence)) fail(`the rule sentence does not state the 3 questions: "${sentence}"`)
  await savePage(t, page)
  if ((await t.rowConfig(BP)) !== "Custom") fail(`row reads ${await t.rowConfig(BP)}`)
  if (!(await offeredOnMapping(t, BP))) fail("the skill is not back on Course mapping")
})
test("E22", "E", "Raise Times needed: students named first; stays Default; Different number lists it", async (t) => {
  const panel = await t.openEditPanel()
  const was = await t.times(BP)
  const need = String(Number(was) + 3)
  const input = panel.getByRole("spinbutton", { name: /^Times needed/ })
  await input.fill(need)
  await t.click(saveChanges(panel), "no Save changes")
  const d = t.p.getByRole("alertdialog")
  await t.visible(d, "saved without naming the students whose progress changes", QUICK)
  const text = (await d.innerText()).replace(/\s+/g, " ")
  if (!/Progress changes for (\d+) students?: \S/.test(text)) fail(`the dialog does not name students: "${text.slice(0, 160)}"`)
  await t.expectOnTop(d.getByRole("button", { name: /^Cancel/ }), "the dialog")
  await t.click(d.getByRole("button", { name: /^Cancel/ }), "dialog has no Cancel")
  await t.p.waitForTimeout(400)
  if ((await input.inputValue()) !== need) fail("Cancel lost the typed number")
  if ((await t.times(BP)) !== was) fail(`Cancel applied the number: the table reads ${await t.times(BP)}`)
  await t.click(saveChanges(panel), "no Save changes")
  await t.click(t.p.getByRole("alertdialog").getByRole("button", { name: /^Save changes/ }), "dialog has no Save changes")
  await t.expectBanner(new RegExp(`${esc(BP)} saved`), "saved times")
  await t.waitFor(async () => (await t.times(BP)) === need, async () => `the table reads ${await t.times(BP)}, not ${need}`)
  if ((await t.rowConfig(BP)) !== "Default") fail(`row reads ${await t.rowConfig(BP)}`)
  await t.open(`${LIB}?different=1`)
  await t.row(BP)
  await t.visible(t.button(/^Remove filter Different number/, t.main), "no chip for Different number")
  await t.reload()
  if ((await t.times(BP)) !== need) fail(`after reload the table reads ${await t.times(BP)}`)
})
async function editedWhileInactive(t) {
  const panel = await deactivateInPanel(t)
  const desc = unique("Edited while inactive")
  await panel.getByRole("textbox", { name: /^Description/ }).fill(desc)
  await panel.getByRole("spinbutton", { name: /^Times needed/ }).fill("9")
  await t.click(saveChanges(panel), "no Save changes")
  await t.expectBanner(/saved\./i, "inactive panel save")
  await t.click(panel.getByRole("link", { name: /^Configure$/ }), "no Configure")
  const page = await t.configurePage()
  await flipFeedback(t, page)
  await t.click(saveChanges(page), "no Save changes")
  return { desc }
}
test("E23", "E", "An Inactive skill edits in full: saved, no impact dialog, Status Inactive, Custom, switch off; still off Course mapping", async (t) => {
  const { desc } = await editedWhileInactive(t)
  if (await t.isVisible(t.p.getByRole("alertdialog"), 800)) fail("an impact dialog opened on an Inactive skill")
  await t.expectBanner(/saved\./i, "inactive save")
  const panel = t.dialog().first()
  await t.visible(panel.getByRole("textbox", { name: /^Name/ }), "the panel did not open on landing")
  if ((await t.rowStatus(BP)) !== "Inactive") fail(`Status reads ${await t.rowStatus(BP)}`)
  if ((await t.rowConfig(BP)) !== "Custom") fail(`Configuration reads ${await t.rowConfig(BP)}`)
  if ((await t.activeSwitch(panel).getAttribute("aria-checked")) !== "false") fail("the Active switch is on for an Inactive skill")
  if ((await panel.getByRole("textbox", { name: /^Description/ }).inputValue()) !== desc) fail("the description did not save")
  if ((await t.times(BP)) !== "9") fail(`Times needed reads ${await t.times(BP)}`)
  if (await offeredOnMapping(t, BP)) fail("the Inactive skill is on Course mapping")
})
test("E24", "E", "Switch on after those edits: students named first; Active, Custom", async (t) => {
  await editedWhileInactive(t)
  await t.expectBanner(/saved\./i, "inactive save")
  const panel = t.dialog().first()
  await t.visible(panel.getByRole("textbox", { name: /^Name/ }), "the panel did not open on landing")
  await t.click(t.activeSwitch(panel), "no Active switch")
  const d = t.p.getByRole("alertdialog")
  await t.visible(d, "Reactivate did not name the students, though 9 evaluations changes progress", QUICK)
  if (!/Progress changes for \d+ students?: \S/.test((await d.innerText()).replace(/\s+/g, " "))) fail("the dialog names nobody")
  await t.click(d.getByRole("button", { name: /^Reactivate/ }), "dialog has no Reactivate")
  await t.expectBanner(/reactivated/i, "reactivate")
  if ((await t.rowStatus(BP)) !== "Active") fail(`Status reads ${await t.rowStatus(BP)}`)
  if ((await t.rowConfig(BP)) !== "Custom") fail(`Configuration reads ${await t.rowConfig(BP)}`)
})
test("E25", "E", "A program save counts the skill under keep their settings, and leaves it unchanged", async (t) => {
  const { on } = await savedCustom(t)
  await t.seededSettings()
  const sw = t.feedbackSwitch()
  await t.visible(sw, "no Feedback required switch on Evaluation settings")
  // Change it to anything that moves the rule's feedback on the program, whichever way this skill went.
  await sw.first().click()
  await t.pressSaveSettings()
  const d = t.applyDialog()
  await t.visible(d, "changing a setting opened no dialog", QUICK)
  const text = (await d.first().innerText()).replace(/\s+/g, " ")
  const m = text.match(/(\d+) keep their settings/)
  if (!m || +m[1] < 13) fail(`dialog says "${m?.[0] ?? "nothing"}"; want the 12 seeded plus this one: "${text.slice(0, 160)}"`)
  await d.first().getByRole("button", { name: /^Apply/ }).click()
  await t.p.waitForTimeout(700)
  const page = await t.openConfigure()
  if ((await t.panelConfig(page)) !== "Custom") fail(`the page reads ${await t.panelConfig(page)}`)
  const again = await feedbackIn(t, page)
  if (((await again.getAttribute("aria-checked")) === "true") !== on) fail("the program save changed this skill's Feedback")
})
/** A setting minimum larger than Times needed, from the Add minimum menu (D0 rule 5). Leaves the menu open on its settings. */
async function addMinimumMenu(t, page) {
  await t.click(page.getByRole("button", { name: /^Add minimum/ }), "no Add minimum")
  await t.visible(t.p.getByRole("menu"), "Add minimum opened no menu", QUICK)
  return t.p.getByRole("menu")
}
test("E26", "E", "Add minimum: clinical settings only; too many is blocked: the list names it, focus on the field; it stays Default", async (t) => {
  const page = await t.openConfigure(CFG_SKILL) // a skill with no minimums yet, so the menu offers all three kinds
  const menu = await addMinimumMenu(t, page)
  const text = (await menu.innerText()).replace(/\s+/g, " ")
  for (const w of ["At a level", "From a clinical setting", "Different evaluators"]) if (!text.includes(w)) fail(`the menu has no ${w}: ${text}`)
  const opts = await menu.getByRole("menuitem").allInnerTexts()
  const bad = opts.find((o) => /\b(lab|simulation)\b/i.test(o))
  if (bad) fail(`Add minimum offers "${bad.trim()}"`)
  await t.expectOnTop(menu.getByRole("menuitem").first(), "the menu")
  await t.click(menu.locator("[data-minimum-kind=setting]").first(), "no setting in the menu")
  const num = page.getByRole("spinbutton", { name: /^Minimum in / }).last()
  await t.waitFor(() => num.evaluate((e) => e === document.activeElement), "focus did not move to the new minimum")
  await num.fill("999")
  if ((await t.panelConfig(page)) !== "Default") fail("a skill's own minimum made it Custom")
  await t.click(saveChanges(page), "no Save changes")
  await t.visible(page.locator("[data-region=validation-summary]"), "no list of problems", QUICK)
  await t.visible(page.getByText(/more than the \d+ needed/).first(), "no reason shown", QUICK)
  await t.absent(t.p.getByRole("alertdialog"), "the dialog opened")
  await t.waitFor(() => num.evaluate((e) => e === document.activeElement), "focus is not on the minimum")
})
test("E27", "E", "A bad value in a card: Save lists it under the card's name and focuses the field", async (t) => {
  const page = await t.openConfigure(CFG_SKILL)
  await t.chooseCustom(page)
  const menu = await addMinimumMenu(t, page)
  await t.click(menu.locator("[data-minimum-kind=setting]").first(), "no setting in the menu")
  await page.getByRole("spinbutton", { name: /^Minimum / }).last().fill("999")
  await t.click(saveChanges(page), "no Save changes")
  const summary = page.locator("[data-region=validation-summary]")
  await t.visible(summary, "no list of problems", QUICK)
  if (!/What counts as achieved/.test(await summary.innerText())) fail(`the list does not name the card: ${(await summary.innerText()).replace(/\s+/g, " ")}`)
  await t.waitFor(() => page.getByRole("spinbutton", { name: /^Minimum / }).last().evaluate((e) => e === document.activeElement), "focus is not on the field")
})
test("E28", "E", "Preview: beside the form from 1100 px, Student and Evaluator, for this draft; below it a Dialog; closing keeps the draft", async (t) => {
  const page = await t.openConfigure()
  await flipFeedback(t, page)
  const panel = page.locator("[data-preview-panel]")
  await t.visible(panel, "no What they will see beside the form", QUICK)
  await t.click(panel.getByRole("tab", { name: /^Evaluator/ }), "no Evaluator tab")
  if (!/required/i.test(await panel.innerText())) fail("the evaluator view does not show this draft's Feedback")
  await t.click(panel.getByRole("tab", { name: /^Student/ }), "no Student tab")
  await t.p.setViewportSize({ width: 1000, height: 800 })
  await t.p.waitForTimeout(300)
  await t.absent(panel, "the panel stays beside the form below 1100 px")
  await t.click(page.getByRole("button", { name: /^Preview/ }), "no Preview")
  const d = t.p.locator("[data-panel-preview]")
  await t.visible(d, "Preview opened no dialog", QUICK)
  await t.expectOnTop(d.getByRole("button", { name: /^Close/ }), "the Preview dialog")
  for (const v of ["Evaluator view", "Student view"]) await t.visible(d.getByRole("region", { name: v }), `no ${v}`)
  await t.click(d.getByRole("button", { name: /^Close/ }), "no Close")
  await t.p.waitForTimeout(300)
  if ((await t.panelConfig(page)) !== "Custom") fail("closing lost the settings draft")
  await t.visible(saveChanges(page), "closing lost the unsaved change")
})
test("E29", "E", "New program: the panel reads Not configured with Configure; Times needed saves and it stays Not configured; no switch on the page", async (t) => {
  await t.open(`${LIB}?program=new`)
  const name = unique("Newprog")
  await addOnNewProgram(t, name)
  const row = await t.row(name)
  await row.getByRole("cell").nth(-2).click({ position: { x: 4, y: 4 }, timeout: CLICK })
  const panel = t.dialog().first()
  await t.visible(panel.getByRole("textbox", { name: /^Name/ }), "the row opened no panel")
  if ((await t.panelConfig(panel)) !== "Not configured") fail(`form reads ${await t.panelConfig(panel)}`)
  await t.visible(panel.getByRole("link", { name: /^Configure$/ }), "no Configure")
  await panel.getByRole("spinbutton", { name: /^Times needed/ }).fill("4")
  await t.click(saveChanges(panel), "no Save changes")
  await t.expectBanner(/saved\./i, "times")
  if ((await t.rowConfig(name)) !== "Not configured") fail(`row reads ${await t.rowConfig(name)}`)
  await t.waitFor(async () => (await panel.getByRole("spinbutton", { name: /^Times needed/ }).inputValue()) === "4", "Times needed did not stay")
  await t.reload()
  const again = t.dialog().first()
  await t.visible(again.getByRole("spinbutton", { name: /^Times needed/ }), "the panel did not reopen")
  if ((await again.getByRole("spinbutton", { name: /^Times needed/ }).inputValue()) !== "4") fail("Times needed did not survive a reload")
  await t.click(again.getByRole("link", { name: /^Configure$/ }), "no Configure")
  const page = await t.configurePage()
  await t.visible(page.locator("[data-no-program]").getByRole("link", { name: /^Set how skills are judged/ }), "no Set how skills are judged")
  // Nothing can be chosen yet, so Default and Custom stay hidden until the program has settings (designer 2026-11-05).
  await t.absent(page.getByRole("radio", { name: "Custom", exact: true }), "Custom is offered with no program settings")
  await t.absent(page.getByRole("radio", { name: "Default", exact: true }), "Default is offered with no program settings")
})
test("E30", "E", "The panel at 1440 and 375: no sideways scroll, footer in view, the header holds while the body scrolls", async (t) => {
  for (const [w, h] of [[1440, 900], [375, 812]]) {
    await t.p.setViewportSize({ width: w, height: h })
    await t.open(`${LIB}?skill=hgtc-basic-skills-11`) // the row's own cells sit behind the page's scroll at 375
    const panel = t.dialog().first()
    await t.visible(panel.getByRole("textbox", { name: /^Name/ }), "the panel did not open")
    await panel.getByRole("spinbutton", { name: /^Times needed/ }).fill("5")
    await t.p.waitForTimeout(400)
    const wide = await panel.evaluate((el) => [el, ...el.querySelectorAll("*")].filter((n) => { const s = getComputedStyle(n); return n.scrollWidth > n.clientWidth + 1 && (s.overflowX === "auto" || s.overflowX === "scroll") }).length)
    if (wide) fail(`at ${w}: ${wide} part(s) of the panel scroll sideways`)
    const box = await panel.boundingBox()
    if (box.x < -1 || box.x + box.width > w + 1) fail(`at ${w}: the panel runs off the screen`)
    for (const b of [/^Cancel$/, /^Save changes/]) {
      const bb = await panel.getByRole("button", { name: b }).boundingBox()
      if (!bb || bb.y + bb.height > h || bb.y < 0) fail(`at ${w}: ${b} is out of view`)
    }
    // Header and tabs stay put while the body scrolls.
    const fixed = [panel.getByRole("button", { name: /^Close$/ }).first(), t.activeSwitch(panel), panel.getByRole("tab", { name: /^Details/ })]
    const before = await Promise.all(fixed.map((l) => l.boundingBox()))
    await panel.locator("[data-panel-body]").evaluate((el) => { el.scrollTop = el.scrollHeight })
    await t.p.waitForTimeout(150)
    const after = await Promise.all(fixed.map((l) => l.boundingBox()))
    if (before.some((b, i) => Math.abs(b.y - after[i].y) > 1)) fail(`at ${w}: the header moved with the body`)
    await panel.getByRole("button", { name: /^Cancel$/ }).click()
    if (await t.isVisible(t.discardPrompt(), 800)) await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "no Discard")
  }
})

/** A press at the centre of a control, with the real mouse: what a person does, with nothing waiting for the control to be ready. */
const mouseOn = async (t, loc) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); if (!b) fail("the control is not on screen"); await t.p.mouse.click(b.x + b.width / 2, b.y + b.height / 2) }
const PANEL = '[data-slot="lab-skill-detail"]'
/** The press to the first frame painted in the new state, ms, from the event's own timestamp: "within a frame or two" as the eye sees it, not "closed in the end". */
const armFrameClock = (t, want) => t.p.evaluate(([sel, w]) => {
  const m = { t0: null, ms: null }
  window.__frameClock = m
  const onPress = (e) => { if (m.t0 === null) m.t0 = e.timeStamp }
  window.addEventListener("pointerdown", onPress, { capture: true, once: true })
  window.addEventListener("keydown", onPress, { capture: true, once: true })
  // The panel has answered once it is on its way out: its closed state, or the slide that starts on the press (skill-panel.tsx).
  const state = () => { const el = document.querySelector(sel); return !el ? "none" : el.getAnimations().some((a) => a.id === "panel-leaving") ? "closed" : el.getAttribute("data-state") || "open" }
  const loop = () => {
    if (m.t0 !== null && (w === "closed" ? state() !== "open" : state() === "open")) { m.ms = performance.now() - m.t0; return }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}, [PANEL, want])
const readFrameClock = async (t, what) => {
  await t.waitFor(() => t.p.evaluate(() => window.__frameClock.ms !== null), `${what}: no frame showed the panel's new state`, 8000)
  return Math.round(await t.p.evaluate(() => window.__frameClock.ms))
}
/** The dev server under other agents' load, with a margin: it was 800 to 950 ms before the table stopped rendering for the panel (map D1a). A build, unloaded, should be under 100: set E31_MAX_MS=100 there. */
const E31_MAX_MS = Number(process.env.E31_MAX_MS ?? 600)
test("E31", "E", "X, Esc, Esc over a tooltip and a click on the page close on the first press, in a frame or two, at the Library and the walkthrough root; so does opening", async (t) => {
  const worst = {}
  for (const root of [LIB, "/"]) {
    await t.open(root)
    const link = t.main.locator("[data-skill-link]", { hasText: new RegExp(`^${esc(BP)}$`) }).first()
    const ways = {
      X: async () => mouseOn(t, t.p.locator(PANEL).getByRole("button", { name: "Close", exact: true }).first()),
      Esc: async () => t.p.keyboard.press("Escape"),
      "Esc with X's tooltip showing": async () => { await t.p.locator(PANEL).getByRole("button", { name: "Close", exact: true }).first().hover(); await t.p.waitForTimeout(800); await t.p.keyboard.press("Escape") },
      "a click on the page": async () => mouseOn(t, t.main.locator("h1").first()),
    }
    for (const [how, press] of Object.entries(ways)) {
      for (let i = 0; i < 3; i++) {
        await link.scrollIntoViewIfNeeded()
        await armFrameClock(t, "open")
        await mouseOn(t, link)
        const opened = await readFrameClock(t, `${root}, opening, try ${i + 1}`)
        worst.open = Math.max(worst.open ?? 0, opened)
        await t.visible(t.p.locator(PANEL), "the row opened no panel", QUICK)
        await t.p.waitForTimeout(1200) // the reflow beside the panel has run, so the press is not queued behind it
        await armFrameClock(t, "closed")
        await press()
        const closed = await readFrameClock(t, `${root}, ${how}, try ${i + 1}`)
        worst[how] = Math.max(worst[how] ?? 0, closed)
        if (closed > E31_MAX_MS) fail(`${root}, ${how}, try ${i + 1}: the panel's first closing frame came ${closed} ms after the press (limit ${E31_MAX_MS})`)
        await t.waitFor(async () => (await t.p.locator(PANEL).count()) === 0 && !/[?&]skill=/.test(t.p.url()), `${root}, ${how}, try ${i + 1}: the panel did not close`, 2500)
        await t.p.mouse.move(5, 500)
        await t.p.waitForTimeout(900)
      }
    }
  }
  if (worst.open > E31_MAX_MS * 1.5) fail(`opening: the panel's first frame came ${worst.open} ms after the press`)
  t.note = `worst first frame, ms: ${JSON.stringify(worst)}`
}, 300_000)
test("E32", "E", "The Skills menu stays as the admin set it: through the panel, across a stop and a reload; Show labels with the panel open is theirs", async (t) => {
  await t.p.setViewportSize({ width: 1440, height: 900 })
  await t.open(LIB)
  const collapse = t.p.getByRole("button", { name: "Collapse to icons" })
  const show = t.p.getByRole("button", { name: "Show labels" })
  // Forced at this width, and given back on close, while the admin has not touched it.
  await mouseOn(t, t.main.locator("[data-skill-link]", { hasText: new RegExp(`^${esc(BP)}$`) }).first())
  await t.visible(show, "the panel did not fold the menu at 1440", QUICK)
  // The admin's press on the menu: the menu follows and the panel stays.
  await mouseOn(t, show)
  await t.visible(collapse, "Show labels did not expand the menu", QUICK)
  await t.p.waitForTimeout(500)
  await t.visible(t.p.locator(PANEL), "Show labels closed the panel", QUICK)
  if (await show.isVisible()) fail("the panel folded the menu again after Show labels")
  // Their collapse holds when the panel closes.
  await mouseOn(t, collapse)
  await t.visible(show, "Collapse to icons did not collapse", QUICK)
  await mouseOn(t, t.p.locator(PANEL).getByRole("button", { name: "Close", exact: true }).first())
  await t.waitFor(async () => (await t.p.locator(PANEL).count()) === 0, "the panel did not close")
  await t.p.waitForTimeout(600)
  if (!(await show.isVisible())) fail("closing the panel undid the admin's collapse")
  // A new panel, a reload and another page keep it.
  await mouseOn(t, t.main.locator("[data-skill-link]", { hasText: new RegExp(`^${esc(BP)}$`) }).first())
  await t.visible(t.p.locator(PANEL), "the row opened no panel", QUICK)
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(900)
  if (!(await show.isVisible())) fail("a panel cycle undid the admin's collapse")
  await t.reload()
  await t.visible(show, "a reload undid the admin's collapse", QUICK)
  await t.open(LISTS)
  await t.visible(show, "another Skills page undid the admin's collapse", QUICK)
  // And their expand holds too.
  await mouseOn(t, show)
  await t.visible(collapse, "Show labels did not expand", QUICK)
  await t.reload()
  await t.visible(collapse, "a reload undid the admin's expand", QUICK)
})
test("E33", "E", "The Configuration word is a link to the full page; the rest of the row opens Details; plain Default, a badge on Custom", async (t) => {
  await t.open(LIB)
  const row = await t.row(BP)
  const word = row.getByRole("link", { name: /^Configuration: Default/ })
  await t.visible(word, "no Configuration word to press")
  if (await word.locator("[data-slot=status-badge]").count()) fail("Default is a badge")
  await (await t.row(BP)).getByRole("cell").nth(-2).click({ position: { x: 4, y: 4 } })
  await t.visible(t.dialog().first(), "the row opened no panel", QUICK)
  await t.waitFor(async () => (await t.dialog().first().getByRole("tab", { name: /^Details/ }).getAttribute("aria-selected")) === "true", "the row did not open Details")
  await t.p.keyboard.press("Escape")
  await t.waitFor(async () => (await t.p.locator(PANEL).count()) === 0, "the panel did not close")
  if (!(await (await t.row(EDITED_FIXTURE)).locator("[data-configuration] , [data-slot=status-badge]").filter({ hasText: /^Custom$/ }).count())) fail("Custom has no badge")
  await t.click((await t.row(BP)).getByRole("link", { name: /^Configuration: Default/ }), "no Configuration word to press")
  const page = await t.configurePage()
  await t.visible(page.getByRole("heading", { level: 1, name: BP }), "the page is not on this skill")
})
test("E34", "E", "The footer does not move the scroll: appears with the body where it was", async (t) => {
  await t.p.setViewportSize({ width: 1280, height: 480 })
  await t.open(`${LIB}?skill=hgtc-basic-skills-11`)
  const panel = t.dialog().first()
  await t.visible(panel.getByRole("textbox", { name: /^Name/ }), "the panel did not open")
  const body = panel.locator("[data-panel-body]")
  await body.evaluate((el) => { el.scrollTop = 200 })
  await t.p.waitForTimeout(150)
  const input = panel.getByRole("spinbutton", { name: /^Times needed/ })
  const top = () => body.evaluate((el) => el.scrollTop)
  const y = async () => (await input.boundingBox()).y
  const [t0, y0] = [await top(), await y()]
  if (t0 < 100) fail(`could not scroll the body (scrollTop ${t0}), so this checks nothing`)
  await input.fill("7")
  await t.visible(panel.locator("[data-unsaved-footer]"), "no footer", QUICK)
  await t.p.waitForTimeout(200)
  if (Math.abs((await top()) - t0) > 1 || Math.abs((await y()) - y0) > 1) fail(`the footer moved the body: scrollTop ${t0} to ${await top()}`)
})

// Standing behaviours of the panel, from earlier rework, kept with their own numbers (ER = edit rework). Section F does not list them.
// What each of these starts from: a panel with an unsaved name.
async function dirtyPanel(t, name = BP) {
  const panel = await t.openEditPanel(name)
  const field = panel.getByRole("textbox", { name: /^Name/ })
  await field.fill("Unsaved name")
  await t.p.waitForTimeout(250)
  return { panel, field }
}
/** The list as a person reads it: which tab, which rows in which order, and the panel's arrows. */
async function listView(t, panel) {
  return {
    url: t.p.url(),
    tab: (await t.main.getByRole("tab", { selected: true }).innerText()).replace(/\s+/g, " "),
    rows: await t.skillRows().evaluateAll((rows) => rows.slice(0, 20).map((r) => r.querySelector("[data-skill-link]")?.textContent?.trim())),
    picked: await t.main.getByRole("checkbox", { checked: true }).count(),
    arrows: [await panel.getByRole("button", { name: /^Previous/ }).first().isEnabled(), await panel.getByRole("button", { name: /^Next/ }).first().isEnabled()],
  }
}
test("E35", "E", "Custom saved, then Default saved with the same values: no footer on landing, X closes with nothing to discard", async (t) => {
  const page = await t.openConfigure()
  await t.chooseCustom(page)
  await savePage(t, page)
  if ((await t.rowConfig(BP)) !== "Custom") fail(`Configuration reads ${await t.rowConfig(BP)} after the save to Custom`)
  const again = await t.openConfigure()
  await t.chooseDefault(again)
  const panel = await savePage(t, again)
  await t.waitFor(async () => (await t.rowConfig(BP)) === "Default", "the row did not go back to Default")
  await t.waitFor(async () => (await panel.locator("[data-unsaved-footer]").count()) === 0, "the panel arrived reading Unsaved changes")
  await t.click(panel.getByRole("button", { name: "Close", exact: true }), "no Close")
  await t.p.waitForTimeout(400)
  if (await t.isVisible(t.p.getByRole("alertdialog"), 600)) fail("X asks to discard, with nothing to discard")
  await t.waitFor(async () => (await t.p.locator(PANEL).count()) === 0, "the panel did not close")
})
test("E36", "E", "History: Back leaves the Library, and no entry reopens a panel on an older skill", async (t) => {
  await t.open(CATS)
  await t.click(t.p.getByRole("link", { name: "Library", exact: true }).first(), "no Library row")
  await t.afterNav()
  const title = () => t.p.locator(`${PANEL} h2`).first().innerText()
  const openRow = async (name) => { await mouseOn(t, t.main.locator("[data-skill-link]", { hasText: new RegExp(`^${esc(name)}$`) }).first()); await t.visible(t.p.locator(PANEL), `${name} opened no panel`, QUICK); await t.p.waitForTimeout(700) }
  await openRow("Height")
  // A change and a discard: the guard's extra entry is the one that used to hold the old skill.
  const panel = t.p.locator(PANEL)
  await panel.getByRole("textbox", { name: "Name" }).fill("Height changed")
  await panel.getByRole("button", { name: "Cancel", exact: true }).click()
  await t.click(t.p.getByRole("alertdialog").getByRole("button", { name: "Discard" }), "no Discard")
  await t.waitFor(async () => (await t.p.locator(PANEL).count()) === 0, "Discard left the panel open")
  await openRow(BP)
  await panel.getByRole("button", { name: /^Next/ }).first().click()
  await t.p.waitForTimeout(700)
  const last = await title()
  await t.p.goBack()
  await t.afterNav()
  if (!/categories-tags/.test(t.p.url())) fail(`Back stayed on ${t.p.url()}`)
  await t.p.goForward()
  await t.afterNav()
  if (/categor/.test(t.p.url())) return // Forward has nowhere to go: nothing to reopen
  if ((await t.p.locator(PANEL).count()) && (await title()) === "Height") fail("Forward reopened the panel on the older skill")
  if ((await t.p.locator(PANEL).count()) && (await title()) !== last) fail(`Forward opened ${await title()}; the last skill was ${last}`)
})
test("E37", "E", "Not configured for want of questions: the rule sentence stays, as far as it exists, in the panel and on the page", async (t) => {
  const panel = await savedWithNoQuestions(t)
  const inPanel = panel.locator("[data-rule-sentence]")
  await t.visible(inPanel, "the panel's rule sentence is gone on Not configured", QUICK)
  if (!/^Student needs \d+ evaluations?\.$/.test((await inPanel.innerText()).trim())) fail(`the panel's sentence reads "${await inPanel.innerText()}"`)
  await t.click(panel.getByRole("link", { name: /^Configure$/ }), "no Configure")
  const page = await t.configurePage()
  const sentence = page.locator("[data-rule-sentence]").first()
  await t.visible(sentence, "the page's rule sentence is gone on Not configured", QUICK)
  if (!/^Student needs \d+ evaluations?\.$/.test((await sentence.innerText()).trim())) fail(`the sentence reads "${await sentence.innerText()}"`)
})
test("ER1", "E", "Dirty panel, a status tab: nothing moves until Discard; Keep editing leaves all as it was, focus back in the field", async (t) => {
  const { panel, field } = await dirtyPanel(t)
  await field.focus()
  const before = await listView(t, panel)
  // The page behind a question is hidden from the accessibility tree, so the tab is still read while the dialog is up.
  const tab = t.main.getByRole("tab", { name: /^Inactive/, includeHidden: true })
  await t.click(tab, "no Inactive tab")
  await t.expectDiscardPrompt("a status tab with a change")
  await t.p.waitForTimeout(500)
  const asked = await t.p.url()
  if (asked !== before.url) fail(`the URL changed under the question: ${asked}`)
  const selected = (await tab.first().getAttribute("aria-selected")) === "true"
  if (selected) fail("the tab changed under the question")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Keep editing/ }), "prompt has no Keep editing")
  await t.p.waitForTimeout(500)
  const after = await listView(t, panel)
  if (!same(after, before)) fail(`Keep editing did not leave the list as it was: ${JSON.stringify(before).slice(0, 200)} became ${JSON.stringify(after).slice(0, 200)}`)
  if ((await field.inputValue()) !== "Unsaved name") fail("Keep editing lost the typed name")
  if (!(await field.evaluate((el) => el === document.activeElement))) fail(`Keep editing left focus on ${await t.p.evaluate(() => document.activeElement?.getAttribute("data-slot") ?? document.activeElement?.tagName)}, not the field in use`)
  await t.click(tab, "no Inactive tab")
  await t.expectDiscardPrompt("the tab again")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "prompt has no Discard")
  await t.p.waitForTimeout(900)
  if ((await tab.first().getAttribute("aria-selected")) !== "true") fail("Discard did not go on to the tab that was pressed")
  await t.absent(t.dialog(), "Discard left the panel open")
  await t.absent(t.rowOf("Unsaved name"), "the discarded name reached the list")
})
test("ER2", "E", "Dirty panel: a column sort asks first and the list does not change under the question; a row checkbox loses nothing", async (t) => {
  const { panel } = await dirtyPanel(t)
  const before = await listView(t, panel)
  await t.main.getByRole("columnheader", { name: /^Skill/ }).first().click({ position: { x: 40, y: 10 } })
  await t.expectDiscardPrompt("a column sort with a change")
  await t.p.waitForTimeout(400)
  await t.click(t.discardPrompt().getByRole("button", { name: /^Keep editing/ }), "prompt has no Keep editing")
  await t.p.waitForTimeout(400)
  if (!same(await listView(t, panel), before)) fail("the sort changed the list under the question")
  // A row checkbox is a DS rail trigger: selecting works beside an open panel, so it does not ask, and it must neither drop the edit nor move the rows.
  await t.main.getByRole("checkbox", { name: /^Select row/ }).first().click()
  await t.p.waitForTimeout(400)
  if (await t.isVisible(t.discardPrompt(), 300)) fail("selecting a row asked to discard, and it loses nothing")
  const picked = await listView(t, panel)
  if (!same(picked.rows, before.rows) || !same(picked.arrows, before.arrows) || picked.url !== before.url) fail("selecting a row moved the list")
  if ((await panel.getByRole("textbox", { name: /^Name/ }).inputValue()) !== "Unsaved name") fail("selecting a row lost the typed name")
})
test("ER4", "E", "Times needed in the panel that changes nobody's progress: saved with no question", async (t) => {
  const panel = await t.openEditPanel(DELETE_MAPPED) // nothing is tracked against it, so no number can move a student
  await panel.getByRole("spinbutton", { name: /^Times needed/ }).fill("4")
  await t.click(saveChanges(panel), "no Save changes")
  await t.p.waitForTimeout(500)
  if (await t.isVisible(t.p.getByRole("alertdialog"), 500)) fail("asked about students when nobody's progress changes")
  await t.expectBanner(new RegExp(`${esc(DELETE_MAPPED)} saved`), "saved times")
  if ((await t.times(DELETE_MAPPED)) !== "4") fail(`the table reads ${await t.times(DELETE_MAPPED)}, not 4`)
})
test("ER5", "E", "Delete blocked: the reason is in view with the menu, in the panel and on the row", async (t) => {
  const check = async (where) => {
    const del = t.p.getByRole("menuitem", { name: /^Delete/ })
    if ((await del.first().getAttribute("data-disabled")) === null) fail(`${where}: Delete is enabled on a skill with evaluations`)
    const reason = t.p.getByRole("menu").first().getByText(/^Has [\d,]+ evaluations?, so it cannot be deleted$/)
    await t.expectOnTop(reason, `${where}: the reason Delete is disabled`)
    const box = await reason.first().boundingBox()
    if (!box || box.height < 10) fail(`${where}: the reason is there for screen readers only`)
  }
  const panel = await t.openEditPanel()
  await t.click(panel.getByRole("button", { name: /^(Actions|More)/i }), 'no "..." in the panel header')
  await check("panel menu")
  await t.open(LIB)
  await t.openRowMenu(BP)
  await check("row menu")
})
test("ER6", "E", "Inactive: every field is a live control, the switch reads off, and the table cell edits too", async (t) => {
  await t.open(LIB)
  await t.click(t.main.getByRole("tab", { name: /^Inactive/ }), "no Inactive tab")
  await t.p.waitForTimeout(800)
  const first = t.skillRows().first()
  await t.visible(first.getByRole("spinbutton"), "an Inactive row has no Times needed input")
  await first.getByRole("cell").nth(3).click({ position: { x: 4, y: 4 } })
  const panel = t.dialog().first()
  await t.visible(t.activeSwitch(panel), "an Inactive panel has no Active switch")
  if ((await t.activeSwitch(panel).getAttribute("aria-checked")) !== "false") fail("the switch reads on for an Inactive skill")
  if (!(await panel.getByRole("textbox", { name: /^Name/ }).isEditable())) fail("the name is not editable on an Inactive skill")
  await t.visible(panel.getByRole("spinbutton", { name: /^Times needed/ }), "no Times needed on an Inactive skill")
  await t.click(panel.getByRole("link", { name: /^Configure$/ }), "no Configure on an Inactive skill")
  const page = await t.configurePage()
  await t.visible(page.locator("[data-skill-title]").filter({ hasText: /Inactive/ }), "the page has no Inactive badge")
  await t.chooseCustom(page)
  await t.openGroup(page, "How this skill is judged")
  await t.visible(page.getByRole("radio", { name: /^Independence level/ }), "no model on an Inactive skill")
})
test("ER7", "E", "Next follows the rows on screen in the grouped view; the ends are disabled", async (t) => {
  await t.open(LIB)
  await t.p.waitForTimeout(1500)
  const onScreen = await t.main.getByRole("row").filter({ has: t.p.getByRole("checkbox", { name: /^Select row/ }) }).evaluateAll((rows) => rows.slice(0, 7).map((r) => r.querySelector("[data-skill-link]")?.textContent?.trim()))
  await t.skillRows().first().getByRole("cell").nth(3).click({ position: { x: 4, y: 4 } })
  const panel = t.dialog().first()
  const nameBox = panel.getByRole("textbox", { name: /^Name/ })
  await t.visible(nameBox, "row click opened no panel")
  if (await panel.getByRole("button", { name: /^Previous/ }).first().isEnabled()) fail("Previous is enabled on the first row")
  for (let i = 1; i < onScreen.length; i++) {
    await t.click(panel.getByRole("button", { name: /^Next/ }), "no Next in the panel")
    // Wait on the form, not on a clock: a loaded dev server took longer than a fixed wait (it failed once at 350 ms).
    await t.waitFor(async () => (await nameBox.inputValue()) === onScreen[i], `Next ${i} opened "${await nameBox.inputValue().catch(() => "")}"; the next row on screen is "${onScreen[i]}"`)
  }
  // The current row is on screen, not left behind.
  const last = await nameBox.inputValue()
  await t.waitFor(async () => { const box = await (await t.row(last)).boundingBox(); return !!box && box.y >= 0 && box.y + box.height <= t.p.viewportSize().height }, `the current row "${last}" is off screen`)
  // The real end: the Inactive tab has two rows.
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(400)
  await t.click(t.main.getByRole("tab", { name: /^Inactive/ }), "no Inactive tab")
  await t.p.waitForTimeout(800)
  await t.skillRows().first().getByRole("cell").nth(3).click({ position: { x: 4, y: 4 } })
  const inactive = t.dialog().first()
  await t.visible(inactive.getByRole("button", { name: /^Next/ }), "no Next in the panel")
  await inactive.getByRole("button", { name: /^Next/ }).first().click()
  await t.waitFor(async () => !(await inactive.getByRole("button", { name: /^Next/ }).first().isEnabled()), "Next is enabled on the last row of the tab")
})
test("ER8", "E", "Delete lists the courses the skill leaves; the result names it; the URL is clean", async (t) => {
  await t.open(LIB)
  await t.click(t.button(/^Add a skill$/, t.main), "no Add a skill")
  const sheet = t.dialog().first()
  const name = unique("Delete check")
  await sheet.getByRole("textbox", { name: /^Name/ }).fill(name)
  await t.click(sheet.getByRole("button", { name: /^Add skill$/ }).or(sheet.getByRole("button", { name: /^Save for later$/ })), "no button to add")
  await t.p.waitForTimeout(800)
  await t.main.getByRole("searchbox").first().fill(name)
  await t.p.waitForTimeout(600)
  await t.rowMenuItem(name, /^Delete/)
  const d = t.p.getByRole("alertdialog")
  await t.visible(d, "Delete opened no dialog", QUICK)
  if (!/in no course/i.test(await d.first().innerText())) fail("an unmapped skill's dialog does not say it is in no course")
  await t.click(d.first().getByRole("button", { name: /^Delete/ }), "no Delete in the dialog")
  await t.p.waitForTimeout(600)
  await t.expectBanner(new RegExp(`${esc(name)} deleted\\.`), "delete")
  if (/[?&]skill=/.test(t.p.url())) fail(`?skill= stayed in the URL: ${t.p.url()}`)
  await t.open(`${LIB}?skill=does-not-exist`)
  await t.p.waitForTimeout(800)
  if (/[?&]skill=/.test(t.p.url())) fail("a bad ?skill= stayed in the URL")
})
test("ER9", "E", "A mapped skill's Delete dialog lists its courses", async (t) => {
  await t.open(LIB)
  await t.main.getByRole("searchbox").first().fill(DELETE_MAPPED)
  await t.p.waitForTimeout(600)
  await t.rowMenuItem(DELETE_MAPPED, /^Delete/)
  const d = t.p.getByRole("alertdialog")
  await t.visible(d, "Delete opened no dialog", QUICK)
  const items = await d.first().locator("[data-delete-courses] li").count()
  if (!items) fail("the dialog lists no courses for a mapped skill")
  if (!new RegExp(`leaves ${items} course`, "i").test(await d.first().innerText())) fail(`the dialog's count does not match the ${items} courses listed`)
})
test("ER10", "E", "The Active switch on a dirty panel goes through its dialog and keeps the unsaved form", async (t) => {
  const { panel, field } = await dirtyPanel(t)
  const times = panel.getByRole("spinbutton", { name: /^Times needed/ })
  await times.fill("7")
  await t.click(t.activeSwitch(panel), "no Active switch")
  if (await t.isVisible(t.discardPrompt(), 400)) fail("Deactivate asked to discard; the edits should stay in the form")
  const d = t.p.getByRole("alertdialog")
  await t.visible(d, "Deactivate opened no dialog", QUICK)
  await t.click(d.getByRole("button", { name: /^Deactivate/ }), "dialog has no Deactivate")
  await t.waitFor(async () => (await t.rowStatus(BP)) === "Inactive", "the row did not go Inactive")
  if ((await field.inputValue()) !== "Unsaved name") fail("deactivating lost the typed name")
  if ((await times.inputValue()) !== "7") fail("deactivating lost the typed number")
})
test("ER11", "E", "An old single-skill link opens the full page for that skill", async (t) => {
  await t.open(`/lab/admin/configure-skill?skill=hgtc-basic-skills-11`)
  const page = await t.configurePage()
  await t.visible(page.getByRole("heading", { level: 1, name: BP }), "the page opened on another skill")
})

// ------------------------------------------------------------------ B: bulk edit
async function bulkEditPanel(t) {
  await t.open(LIB)
  await t.selectRows([BP, "Height", "Weight"])
  await t.click(t.action(/^Edit 3 skills$/, t.main), "no Edit 3 skills on the bulk bar")
  const panel = t.dialog().first()
  await t.visible(panel, "Edit 3 skills opened no panel")
  return panel
}
test("B1", "B", "Bulk edit panel: every field Keep current, Update disabled", async (t) => {
  const panel = await bulkEditPanel(t)
  const text = await panel.innerText()
  for (const f of ["Category", "Times needed"]) if (!new RegExp(`${f}[\\s\\S]{0,40}Keep current`, "i").test(text)) fail(`${f} does not read Keep current`)
  const u = panel.getByRole("button", { name: /^Update/ })
  await t.visible(u, "panel has no Update")
  if (await u.first().isEnabled()) fail("Update is enabled before a field is set")
})
test("B2", "B", "Bulk category: banner, all 3 moved, selection cleared, persists", async (t) => {
  const panel = await bulkEditPanel(t)
  await t.pickCategory(panel, "Assessment")
  await t.click(panel.getByRole("button", { name: /^Update/ }), "panel has no Update")
  await t.expectBanner(/3 skills updated/i, "bulk edit")
  if (await t.bulkBar()) fail("selection not cleared after Update")
  await t.leaveAndReturn(CATS)
  const n = (await t.main.getByRole("row", { name: /^Assessment/ }).first().innerText()).match(/\d+/)
  if (!n) fail("cannot read the Assessment count")
  await t.open(LIB)
  for (const name of [BP, "Height", "Weight"]) {
    const grp = await (await t.row(name)).evaluate((r) => { let e = r.previousElementSibling; while (e && e.querySelector("[aria-label^='Select row']")) e = e.previousElementSibling; return e?.textContent ?? r.textContent })
    if (!grp.includes("Assessment")) fail(`"${name}" did not move to Assessment`)
  }
})
test("B3", "B", "Configure 3 skills: title, Mixed, Save disabled with no change", async (t) => {
  await t.open(LIB)
  await t.selectRows([BP, "Height", "Weight"])
  await t.click(t.action(/^Configure 3 skills$/, t.main), "no Configure 3 skills on the bulk bar")
  await t.afterNav(1500)
  await t.settle()
  await t.visible(t.main.getByRole("heading", { level: 1, name: "3 skills" }), 'page title is not "3 skills"', 20_000)
  await t.visible(t.main.getByText("Mixed"), "no field reads Mixed although the skills differ")
  const save = t.button(/^Save/, t.main)
  await t.visible(save, "no Save on the page")
  if (await save.first().isEnabled()) fail("Save is enabled with no change")
})
test("B4", "B", "Bulk edit with one inactive: panel names it as left out", async (t) => {
  await t.open(LIB)
  await t.click(t.main.getByRole("tab", { name: /^Inactive/ }), "no Inactive tab")
  await t.p.waitForTimeout(600)
  const rows = t.skillRows()
  await t.visible(rows, "Inactive tab shows no rows, cannot pick one")
  const label = await rows.first().getByRole("checkbox").first().getAttribute("aria-label")
  const inactive = label.replace(/^Select row,?\s*(Select\s*)?/, "").trim()
  await t.click(t.main.getByRole("tab", { name: /^All/ }), "no All tab")
  await t.p.waitForTimeout(600)
  await t.selectRows([inactive, BP, "Height"])
  const edit = t.action(/^Edit \d+ skills?$/, t.main)
  await t.click(edit, "no Edit N skills on the bulk bar")
  const panel = t.dialog().first()
  await t.visible(panel, "Edit opened no panel")
  const text = (await panel.innerText()).replace(/\s+/g, " ")
  if (!/1 inactive/i.test(text) || !text.includes(inactive)) fail(`panel does not say one inactive left out and name "${inactive}"`)
})

test("B5", "B", "Deactivate 3: summed counts; Keep active and Esc keep the selection; a double click on the dialog reports 3, and its Reactivate works", async (t) => {
  await t.open(LIB)
  const inactive = await t.tabCount(/^Inactive\b/)
  await t.selectRows([BP, "Height", "Weight"])
  const ask = async () => { await t.click(t.p.locator("[data-exxat-bulk-bar]").getByRole("button", { name: /^Deactivate 3/ }), "no Deactivate 3"); return t.visible(t.p.getByRole("alertdialog"), "no dialog", QUICK) }
  let d = await ask()
  const figures = await d.locator("[data-deactivate-impact]").innerText().catch(() => "")
  for (const w of ["Leaves courses", "Students who have them", "Evaluations kept"]) if (!figures.includes(w)) fail(`the bulk dialog has no ${w}: "${figures}"`)
  await d.getByRole("button", { name: "Keep active" }).click()
  await t.visible(t.p.locator("[data-exxat-bulk-bar]"), "Keep active lost the selection", QUICK)
  await t.p.waitForTimeout(300)
  d = await ask()
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(400)
  await t.visible(t.p.locator("[data-exxat-bulk-bar]"), "Esc lost the selection", QUICK)
  d = await ask()
  await d.getByRole("button", { name: /^Deactivate 3 skills/ }).dblclick()
  const b = await t.expectBanner(/3 skills deactivated/i, "bulk deactivate")
  await t.waitFor(async () => (await t.tabCount(/^Inactive\b/)) === inactive + 3, "three skills did not go inactive")
  await t.click(t.action(/^Reactivate/, b), "the banner has no Reactivate")
  await t.expectBanner(/3 skills reactivated/i, "bulk reactivate")
  await t.waitFor(async () => (await t.tabCount(/^Inactive\b/)) === inactive, "its Reactivate did nothing")
})
test("B6", "B", "Edit panel: clean Esc keeps the selection and returns focus to Edit; a double click on Update opens no row", async (t) => {
  const panel = await bulkEditPanel(t)
  await t.visible(panel, "no panel", QUICK)
  await t.p.keyboard.press("Tab")
  await panel.getByRole("button", { name: "Cancel" }).focus()
  await t.p.keyboard.press("Escape")
  await t.waitFor(async () => (await t.p.locator('[data-slot="lab-bulk-edit"]').count()) === 0, "Esc did not close the panel")
  await t.visible(t.p.locator("[data-exxat-bulk-bar]"), "Esc lost the selection, X keeps it", QUICK)
  await t.waitFor(() => t.p.evaluate(() => document.activeElement?.hasAttribute("data-bulk-edit-trigger")), "focus did not return to Edit 3 skills")
  await t.click(t.p.locator("[data-bulk-edit-trigger]"), "no Edit")
  const again = await t.visible(t.p.locator('[data-slot="lab-bulk-edit"]'), "no panel", QUICK)
  await t.pickCategory(again, "Assessment")
  await again.getByRole("button", { name: /^Update/ }).dblclick()
  await t.expectBanner(/3 skills updated/i, "bulk edit")
  await t.p.waitForTimeout(700)
  if (await t.p.locator(PANEL).count()) fail("the second press of the double click opened the row behind")
  if (await t.p.evaluate(() => document.activeElement === document.body)) fail("focus fell to the page body")
})
// ------------------------------------------------------------------ A: add
/** One skill on the new program's Library, through its Add a skill sheet (the page has no add row since 2026-11-05: map D2). Hoisted: L12, E29 and S5 use it. */
async function addOnNewProgram(t, name) {
  await t.click(t.button(/^Add a skill$/, t.main), "no Add a skill on the new program's Library")
  const sheet = t.dialog().first()
  await t.visible(sheet, "Add a skill opened no sheet")
  await sheet.getByRole("textbox", { name: /^Name/ }).fill(name)
  await t.click(sheet.getByRole("button", { name: /^Add skill$/ }), "no Add skill")
  // Until the sheet has gone, `t.dialog().first()` is still the sheet, and a fixed wait does not know how long its exit takes.
  await t.waitFor(async () => (await t.dialog().count()) === 0, "Add a skill did not close")
}
async function addSheet(t, url = LIB) {
  await t.open(url)
  await t.click(t.button(/^Add a skill$/, t.main), "no Add a skill")
  const sheet = t.dialog().first()
  await t.visible(sheet, "Add a skill opened no sheet")
  return sheet
}
const addButton = async (t, sheet) => {
  const b = sheet.getByRole("button", { name: /^Add skill$/ })
  if (!(await t.isVisible(b, 800))) {
    const names = await sheet.getByRole("button").allInnerTexts()
    fail(`no Add skill button; the sheet offers ${names.filter(Boolean).join(", ")}`)
  }
  return b.first()
}
test("A1", "A", "Empty name: error on the name, focus there", async (t) => {
  const sheet = await addSheet(t)
  await (await addButton(t, sheet)).click()
  await t.p.waitForTimeout(300)
  const name = sheet.getByRole("textbox", { name: /^Name/ })
  const invalid = await name.getAttribute("aria-invalid")
  const err = sheet.getByText(/name|required/i).filter({ hasNotText: /^Name$/ })
  if (invalid !== "true" && !(await t.isVisible(err, 500))) fail("no error on the empty name")
  if (!(await name.evaluate((e) => e === document.activeElement))) fail("focus is not on the name")
})
test("A2", "A", "Add one: sheet closes, row at top, Default, banner, no configure page, persists", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  const sheet = await addSheet(t)
  const name = unique("Test skill")
  const cat = unique("New cat")
  await sheet.getByRole("textbox", { name: /^Name/ }).fill(name)
  await t.pickCategory(sheet, cat, { create: true })
  await (await addButton(t, sheet)).click()
  await t.p.waitForTimeout(800)
  if (!/skills-library|\/library/.test(t.p.url())) fail(`a page opened after Add skill: ${t.p.url()}`)
  if (await t.isVisible(t.dialog(), 400)) fail("sheet did not close")
  await t.expectBanner(/uses the default configuration/i, "add one")
  const first = await t.skillRows().first().innerText()
  if (!first.includes(name)) fail(`row is not at the top; first row is "${first.replace(/\s+/g, " ").slice(0, 50)}"`)
  if ((await t.rowConfig(name)) !== "Default") fail(`Configuration reads ${await t.rowConfig(name)}; want Default`)
  if ((await t.rowStatus(name)) !== "Active") fail(`Status reads ${await t.rowStatus(name)}`)
  await t.leaveAndReturn(LIB)
  await t.row(name)
  if ((await t.allCount()) !== all + 1) fail(`All reads ${await t.allCount()} after reload; want ${all + 1}`)
  await t.open(CATS)
  await t.visible(t.main.getByRole("row", { name: new RegExp(esc(cat)) }), `new category "${cat}" is not on Categories and tags`)
})
test("A3", "A", "Duplicate name warns with Open it", async (t) => {
  const sheet = await addSheet(t)
  const name = sheet.getByRole("textbox", { name: /^Name/ })
  await name.fill(BP)
  await name.blur()
  await t.p.waitForTimeout(400)
  if (!(await t.isVisible(sheet.getByText(/already/i), 1500))) fail("no duplicate warning")
  await t.visible(t.action(/^Open( it)?\b/, sheet), "duplicate warning has no Open it")
  // Map F A3, changed 2026-11-05: the D2 default is Skip, and the primary never relabels to it (rule E4).
  const primary = sheet.getByRole("button", { name: /^Add skill$/ })
  await t.visible(primary, `with Skip chosen the primary is not Add skill; buttons: ${(await sheet.getByRole("button").allInnerTexts()).filter(Boolean).join(", ")}`)
  if (!(await primary.isDisabled())) fail("with Skip chosen Add skill is enabled")
})
test("A4", "A", "Add several: line check, count on button, banner, Show them, persists", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  const sheet = await t.openAddSeveral()
  const n = unique("Pasted")
  const lines = [`${n} alpha`, `${n} beta`, `${n} gamma`, `${n} delta`, `${n} alpha`]
  await sheet.getByRole("textbox", { name: /names/i }).fill(lines.join("\n"))
  await t.p.waitForTimeout(500)
  const text = (await sheet.innerText()).replace(/\s+/g, " ")
  if (!/4 new/i.test(text) || !/1 repeated/i.test(text)) fail(`line check does not read "4 new, 1 repeated"; sheet reads "${text.slice(0, 120)}"`)
  const add = sheet.getByRole("button", { name: /^Add 5 skills$/ })
  if (!(await t.isVisible(add, 800))) fail(`no Add 5 skills button; buttons: ${(await sheet.getByRole("button").allInnerTexts()).filter(Boolean).join(", ")}`)
  await add.first().click()
  await t.p.waitForTimeout(800)
  const b = await t.expectBanner(/5 skills added/i, "add several")
  await t.click(t.action(/^Show them$/, b), "banner has no Show them")
  await t.p.waitForTimeout(800)
  if ((await t.rowCount()) !== 5) fail(`Show them left ${await t.rowCount()} rows; want 5`)
  await t.leaveAndReturn(LIB)
  if ((await t.allCount()) !== all + 5) fail(`All reads ${await t.allCount()} after reload; want ${all + 5}`)
})
test("A5", "A", "Chevron menu: four ways, the last two marked Later", async (t) => {
  await t.open(LIB)
  const labels = (await t.openAddMenu()).map((l) => l.replace(/\s+/g, " "))
  const items = await t.p.getByRole("menuitem").allInnerTexts()
  const flat = items.map((i) => i.replace(/\s+/g, " ").trim())
  const want = ["Add several", "Bulk upload Later", "Starting points Later"]
  if (!same(flat, want)) fail(`menu holds ${flat.join(", ")} (labels ${labels.join(", ")}); want ${want.join(", ")}`)
})
test("A6", "A", "New program, Add several: Not configured, banner, not offered on Course mapping", async (t) => {
  await t.open(`${LIB}?program=new`)
  const sheet = await t.openAddSeveral()
  const n = unique("Newprog")
  const names = [`${n} one`, `${n} two`, `${n} three`]
  await sheet.getByRole("textbox", { name: /names/i }).fill(names.join("\n"))
  await t.p.waitForTimeout(300)
  await t.click(sheet.getByRole("button", { name: /^Add/ }), "no Add button")
  await t.p.waitForTimeout(800)
  const b = await t.expectBanner(/not configured|set how skills are judged/i, "add several")
  await t.visible(t.action(/^Set how skills are judged$/, b), "banner has no Set how skills are judged")
  for (const name of names) if ((await t.rowConfig(name)) !== "Not configured") fail(`"${name}" reads ${await t.rowConfig(name)}; want Not configured`)
  // Through the panel row, so the page stays in this new program: a bare URL would read the seeded program and pass for the wrong reason.
  await t.click(t.skillsPanelRow("Course mapping"), "no panel row Course mapping")
  await t.afterNav(1500)
  await t.settle()
  if (!/program=new/.test(t.p.url())) fail("the Course mapping row left the new program, so this cannot be judged")
  await t.click(t.main.getByRole("radio", { name: "By skill" }), "no By skill view")
  await t.p.waitForTimeout(800)
  const search = t.main.getByRole("searchbox", { name: /skill/i }).filter({ visible: true })
  // With nothing configured the page says so and has no list to search (map D8 states).
  if (await t.isVisible(search, 800)) {
    await search.first().fill(names[0])
    await t.p.waitForTimeout(600)
  }
  await t.absent(t.link(names[0], t.main), "Course mapping offers an unconfigured skill")
})

test("A7", "A", "A tag added: the suggestions close, and Tab stays in the sheet", async (t) => {
  for (const open of [async () => addSheet(t), async () => { await t.open(LIB); return t.openAddSeveral() }]) {
    const sheet = await open()
    const tags = sheet.getByRole("combobox").last()
    await tags.fill(unique("Tag"))
    await tags.press("Enter")
    await t.p.waitForTimeout(200)
    if (await t.isVisible(t.p.getByRole("listbox", { name: "Tag suggestions" }), 300)) fail("the suggestions stayed open after Enter")
    for (let i = 0; i < 12; i++) {
      await t.p.keyboard.press("Tab")
      const inside = await sheet.evaluate((el) => el.contains(document.activeElement))
      if (!inside) fail(`Tab ${i + 1} left the sheet, to ${await t.p.evaluate(() => document.activeElement?.outerHTML.slice(0, 80))}`)
    }
  }
})
test("A8", "A", "Add several: one choice above many repeats, and the list has no cap of its own", async (t) => {
  await t.open(LIB)
  const sheet = await t.openAddSeveral()
  const names = await t.main.locator("[data-skill-link]").evaluateAll((els) => els.slice(0, 20).map((e) => e.textContent.trim()))
  await sheet.getByRole("textbox", { name: /Names, one per line/ }).fill(names.join("\n"))
  const all = sheet.locator("[data-several-all]")
  await t.visible(all, "no choice for all the repeated names", QUICK)
  await all.getByRole("combobox").click()
  await t.p.getByRole("option", { name: "Keep both for all" }).click()
  await t.visible(sheet.getByRole("button", { name: /^Add 20 skills$/ }), "Keep both for all did not reach every line", QUICK)
  const box = await sheet.locator("[data-several-repeats]").evaluate((u) => ({ cap: getComputedStyle(u).maxHeight, height: u.getBoundingClientRect().height, scroll: u.scrollHeight }))
  if (box.cap !== "none" || box.scroll > box.height + 1) fail(`the repeats list is capped: ${JSON.stringify(box)}`)
})
test("A9", "A", "A replaced skill reads Updated, not New; Open it does not ask when only the repeated name was typed", async (t) => {
  await t.open(LIB)
  const fresh = unique("Replaced")
  let sheet = await addSheet(t)
  await sheet.getByRole("textbox", { name: /^Name/ }).fill(fresh)
  await t.click(sheet.getByRole("button", { name: /^Add skill$/ }), "no Add skill")
  await t.expectBanner(/added/i, "add")
  sheet = await addSheet(t)
  await sheet.getByRole("textbox", { name: /^Name/ }).fill(fresh)
  await t.click(t.action(/^Open it$/, sheet), "no Open it")
  await t.p.waitForTimeout(500)
  if (await t.isVisible(t.p.getByRole("alertdialog"), 500)) fail("Open it asks to discard, with only the repeated name typed")
  await t.visible(t.p.locator(PANEL), "Open it opened no panel", QUICK)
  await t.closePanel()
  sheet = await addSheet(t)
  await sheet.getByRole("textbox", { name: /^Name/ }).fill(fresh)
  await sheet.locator("#skill-duplicate").click()
  await t.p.getByRole("option", { name: "Replace" }).click()
  await t.click(sheet.getByRole("button", { name: /^Replace skill$/ }), "no Replace skill")
  await t.expectBanner(/replaced/i, "replace")
  const row = await t.row(fresh)
  const text = await row.innerText()
  if (/\bNew\b/.test(text)) fail(`the replaced skill reads New: "${text}"`)
  if (!/\bUpdated\b/.test(text)) fail(`the replaced skill does not read Updated: "${text}"`)
  await t.absent(t.main.getByText(/^Just added/), "a replaced skill sits under Just added")
})
// ------------------------------------------------------------------ S: evaluation settings
test("SEED1", "S", "The seeded program has settings (section F says Seeded page)", async (t) => {
  await t.open(SET)
  await t.settingsRow("judged")
  const radios = t.main.getByRole("radio")
  await t.visible(radios, "no model options on Evaluation settings")
  for (const r of await radios.all()) if (await r.isChecked()) return
  fail("Evaluation settings opens empty in the seed: no model saved, so there is no Seeded page")
})
test("S1", "S", "New program: only How skills are judged, nothing chosen, Save disabled", async (t) => {
  await t.open(`${SET}?program=new`)
  for (const r of await t.main.getByRole("radio").all()) if (await r.isChecked()) fail("an option is preselected")
  const save = t.saveSettingsButton()
  await t.visible(save, "no Save on the page")
  if (await save.first().isEnabled()) fail("Save is enabled with nothing chosen")
  // The left card keeps its title, What counts as achieved, and holds only How skills are judged (D-L140).
  await t.absent(t.main.getByRole("heading", { name: /steps|forms|many|who does/i }), "other sections show before a model is chosen")
  await t.absent(t.p.locator('[data-decision-row]:not([data-decision-row="judged"])'), "other rows show before a model is chosen")
  await t.absent(t.main.getByRole("spinbutton"), "other rows show before a model is chosen")
})
test("S2", "S", "Independence level: the rows appear, nothing preselected in Levels that count", async (t) => {
  await t.open(`${SET}?program=new`)
  await t.click(t.main.getByRole("radio", { name: /^Independence level/ }), "no Independence level option")
  await t.p.waitForTimeout(500)
  const text = await t.main.innerText()
  for (const w of ["Levels", "Times needed", "What the student fills in", "Who can sign off", "Approval before it counts"]) if (!text.includes(w)) fail(`no "${w}" row after choosing Independence level`)
  await t.levelNames()
  for (const [i, n] of ["Observed", "Assisted"].entries()) {
    if ((await t.levelBoxes().count()) <= i) await t.click(t.button(/^Add a level/, t.main), "no Add a level")
    await t.levelBoxes().nth(i).fill(n)
  }
  const group = t.countsGroup()
  await t.visible(group, "no Levels that count control")
  if (await t.p.locator("[data-level-segment][data-counts]").count()) fail("a level is preselected in Levels that count")
})
test("S3", "S", "Save without filling: problems listed, focus on the first", async (t) => {
  await t.open(`${SET}?program=new`)
  await t.click(t.main.getByRole("radio", { name: /^Independence level/ }), "no Independence level option")
  await t.p.waitForTimeout(500)
  await t.pressSaveSettings()
  const problems = t.main.getByRole("alert")
  if (!(await t.isVisible(problems, 1500))) fail("no problems listed after Save")
  if (await t.isVisible(t.applyDialog(), 300)) fail("an Apply dialog opened on an unfilled form")
  const focused = await t.p.evaluate(() => { const a = document.activeElement; return a && a !== document.body && !!a.closest("main") ? (a.getAttribute("aria-label") || a.tagName) : null })
  if (!focused) fail("focus did not move to the first problem")
  const firstBad = await t.main.getByRole("textbox", { name: "Level 1", exact: true }).evaluate((e) => e === document.activeElement).catch(() => false)
  if (!firstBad) fail(`focus is on "${focused}", not the first problem (Level 1, the lowest level's name)`)
})
test("S5", "S", "Open the library: Default on all, Not configured 0", async (t) => {
  // A new program holds no skills yet, so give it one to read.
  await t.open(`${LIB}?program=new`)
  await addOnNewProgram(t, unique("Saved first"))
  await t.open(`${SET}?program=new`)
  await t.fillIndependence()
  await t.applySettings()
  const b = await t.expectBanner(/saved/i, "first save")
  await t.click(t.action(/^Open the library$/, b), "banner has no Open the library")
  await t.afterNav(1500)
  await t.settle()
  await t.visible(t.skillRows(), "the library shows no rows after Open the library")
  const statuses = new Set((await t.skillRows().allInnerTexts()).map((x) => t.configOf(x.replace(/\s+/g, " "))))
  statuses.delete("Custom")
  if (!same([...statuses], ["Default"])) fail(`Configuration reads ${[...statuses].join(", ")}; want Default on all`)
})
test("S6", "S", "Levels that count are one cut-off: choosing a level counts it and every level above, and nothing below", async (t) => {
  await t.seededSettings()
  const segs = t.p.locator("[data-level-segment]")
  const n = await segs.count()
  if (n < 2) fail(`only ${n} level in the list; needs two to test the cut-off`)
  const seg = (i) => t.p.locator(`[data-level-segment="${i}"]`)
  // By level index, lowest 0 (the list shows them highest first, D-L141).
  const counting = () => segs.evaluateAll((a) => a.map((e) => [Number(e.getAttribute("data-level-segment")), e.hasAttribute("data-counts")]).sort((x, y) => x[0] - y[0]).map((x) => x[1]))
  await seg(n - 2).click()
  await t.p.waitForTimeout(200)
  let c = await counting()
  if (!c[n - 2] || !c[n - 1] || c.slice(0, n - 2).some(Boolean)) fail(`choosing the second highest level counts ${JSON.stringify(c)}`)
  await seg(n - 1).click()
  await t.p.waitForTimeout(200)
  c = await counting()
  if (c[n - 2] || !c[n - 1]) fail(`choosing the highest level counts ${JSON.stringify(c)}`)
  const top = (await t.levelBoxes().first().inputValue()).trim().toLowerCase()
  const said = (await t.p.locator("[data-rule-sentence]").innerText()).toLowerCase()
  if (!said.includes(top) || / or /.test(said.split("signed off")[0])) fail(`the rule does not say the top level only: "${said.slice(0, 120)}"`)
})
const reportNumbers = async (t) => {
  await t.open("/lab/flow/watch-the-cohort/attainment")
  await t.p.waitForTimeout(800)
  return (await t.main.innerText()).match(/\d[\d,.]*/g)?.join(" ") ?? ""
}
test("S7", "S", "Rename a level: no students line, Reports counts unchanged", async (t) => {
  await t.seededSettings()
  const before = await reportNumbers(t)
  if (!before) fail("Reports shows no figures, nothing to compare")
  await t.open(SET)
  await t.levelNames()
  const box = t.levelBoxes().first()
  await t.visible(box, "no level names on the page")
  await box.fill(unique("Renamed level"))
  await t.p.waitForTimeout(300)
  await t.pressSaveSettings()
  const d = t.applyDialog()
  await t.visible(d, "rename opened no dialog", QUICK)
  if (/student/i.test(await d.first().innerText())) fail("dialog has a students line for a rename")
  await d.first().getByRole("button", { name: /^Apply/ }).click()
  await t.p.waitForTimeout(700)
  const after = await reportNumbers(t)
  if (after !== before) fail(`Reports figures changed after a rename`)
})
test("S8", "S", "Change the program's number: dialog counts, followers change, own number stays", async (t) => {
  await t.open(LIB)
  await t.setTimes(BP, "5")
  await t.seededSettings()
  await t.open(LIB)
  const rows = t.skillRows()
  const nRows = await rows.count()
  let follower = null
  for (let i = 0; i < nRows && !follower; i++) {
    const r = rows.nth(i)
    const text = await r.innerText()
    // A follower is on the program's number: a Default row can carry its own (D0 rule 6), and the Library marks it "This skill's own number".
    if (!text.includes(BP) && /\bDefault\b/.test(text) && !/This skill's own number/.test(text)) follower = (await r.getByRole("checkbox").first().getAttribute("aria-label")).replace(/^Select row,?\s*(Select\s*)?/, "")
  }
  if (!follower) fail("no skill reads Default, so none follows the program's number")
  await t.open(SET)
  await t.settingsRow("times")
  const need = t.main.getByRole("spinbutton", { name: /^Times needed/i }).first()
  await t.visible(need, "no Times needed input on Evaluation settings")
  const was = await need.inputValue()
  const next = was === "7" ? "8" : "7"
  await need.fill(next)
  await t.pressSaveSettings()
  const d = t.applyDialog()
  await t.visible(d, "changing the number opened no dialog", QUICK)
  const text = (await d.first().innerText()).replace(/\s+/g, " ")
  if (!/\d+[^.]*(follow|will change)/i.test(text) || !/\d+[^.]*keep/i.test(text)) fail(`dialog does not say how many follow and how many keep their own: "${text.slice(0, 140)}"`)
  await d.first().getByRole("button", { name: /^Apply/ }).click()
  await t.p.waitForTimeout(700)
  await t.leaveAndReturn(LIB)
  if ((await t.times(BP)) !== "5") fail(`${BP} reads ${await t.times(BP)}; want its own 5`)
  if ((await t.times(follower)) !== next) fail(`follower "${follower}" reads ${await t.times(follower)}; want ${next}`)
})
test("S9", "S", "Link: skills use a different number, Library filtered, count matches", async (t) => {
  await t.seededSettings()
  const link = t.link(/skills? (uses? a different|uses? (its|their) own) number/i, t.main)
  if (!(await t.isVisible(link, 1500))) fail('no link "skills use their own number"')
  const n = +(await link.first().innerText()).replace(/,/g, "").match(/\d+/)?.[0]
  await link.first().click()
  await t.afterNav(1500)
  await t.settle()
  await t.visible(t.main.getByRole("heading", { level: 1, name: /library/i }), "the link did not open the Library")
  if ((await t.rowCount()) !== n) fail(`Library shows ${await t.rowCount()} rows; the link said ${n}`)
})
test("S10", "S", "Switch to Questions: rows change, no final result, Counts when options", async (t) => {
  await t.seededSettings()
  const q = t.main.getByRole("radio", { name: "Questions", exact: true })
  if (!(await t.isVisible(q, 1000))) {
    const names = await t.main.getByRole("radio").evaluateAll((e) => e.map((x) => x.getAttribute("aria-label") || x.parentElement?.textContent))
    fail(`no option named Questions; options read ${names.join(", ")}`)
  }
  await t.chooseModel("Questions", "no Questions option")
  const text = await t.main.innerText()
  if (/final result/i.test(text)) fail('"final result" still shows on the page')
  for (const w of ["Counts when", "Every question answered Yes", "At least", "Only the questions you choose answered Yes"]) if (!new RegExp(w, "i").test(text)) fail(`no "${w}" after choosing Questions`)
})
test("S11", "S", "Preview waits behind a button: closed at first, the rule leads the page; a dialog with both forms at 1440 and 1024", async (t) => {
  await t.seededSettings()
  await t.absent(t.p.locator("[data-preview-panel]"), "the preview shows before it is asked for")
  await t.visible(t.main.locator("[data-settings-glance] [data-rule-sentence]"), "the page does not lead with the rule sentence")
  for (const [w, h] of [[1440, 900], [1024, 800]]) {
    await t.p.setViewportSize({ width: w, height: h })
    await t.p.waitForTimeout(300)
    await t.click(t.button(/^Preview$/, t.main), `no Preview button at ${w}`)
    const d = t.dialog().first()
    await t.visible(d, `Preview opened no dialog at ${w}`, QUICK)
    const text = await d.innerText()
    if (!/student/i.test(text) || !/evaluator/i.test(text)) fail(`Preview does not show both student and evaluator at ${w}`)
    await t.p.keyboard.press("Escape")
    await t.p.waitForTimeout(300)
  }
})
test("S12", "S", "At 1920 the rows fill the width", async (t) => {
  await t.p.setViewportSize({ width: 1920, height: 1080 })
  await t.seededSettings()
  const { gap, width } = await t.rightGap()
  if (gap > width * 0.25) fail(`${gap}px empty on the right of a ${width}px page`)
  await t.absent(t.main.locator("aside:not([data-rule-panel])"), "the width is filled by a Summary aside, not by the rows")
})
/** Questions are on the page (D-L141): fill them in place. */
const fillQuestions = async (t, questions) => {
  const panel = t.main
  for (const [i, q] of questions.entries()) {
    if ((await panel.getByRole("textbox", { name: `Question ${i + 1}` }).count()) === 0) await t.click(panel.getByRole("button", { name: /^Add a question$/ }), "no Add a question")
    await panel.getByRole("textbox", { name: `Question ${i + 1}` }).fill(q)
  }
}
const modelSwitch = async (t, name) => {
  await t.chooseModel(name, `no ${name} option`)
  await t.p.waitForTimeout(300)
}
// ------------------------------------------------------------------ CFG: Configure one skill (map D1c, D-L115). Density is the acceptance test.
const CFG_SKILL = "Vital signs and early warning score"
const CFG_ID = "sk-vitals"
const cfgUrl = (id = CFG_ID) => `/lab/admin/configure-skill?skill=${id}`
async function cfgOpen(t, id = CFG_ID) {
  await t.open(cfgUrl(id))
  return t.configurePage()
}
const BUDGET = { fields: { Default: 3, Custom: 9 }, words: { Default: 65, Custom: 50 }, withPreview: 115, other: 3, sections: 4 }
/** The budget as map D1c counts it, in the first viewport, lab chrome left out. Fields count every radio and box, the switch included. */
const measureConfigure = (t) => t.p.evaluate(() => {
  const vh = window.innerHeight
  const vis = (el) => { const r = el.getBoundingClientRect(); const c = getComputedStyle(el); return r.width > 1 && r.height > 1 && c.visibility !== "hidden" && c.display !== "none" && !el.closest(".sr-only") }
  const fold = (el) => { const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0 }
  const form = document.querySelector("[data-configure-form]")
  const preview = document.querySelector("[data-preview-panel]")
  const page = document.querySelector("[data-configure-page]")
  const words = (root) => {
    if (!root) return { n: 0, texts: [] }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let n = 0
    const texts = []
    while (w.nextNode()) {
      const p = w.currentNode.parentElement
      const x = w.currentNode.textContent.trim()
      if (!x || !p || !vis(p) || !fold(p) || p.closest("script,style")) continue
      n += x.split(/\s+/).length
      texts.push(x)
    }
    return { n, texts }
  }
  const fields = [...form.querySelectorAll("input:not([type=hidden]),textarea,select,[role=combobox],[role=radio],[role=checkbox],[role=switch]")].filter(vis).filter(fold)
  const buttons = [...page.querySelectorAll("button,a[data-slot=button]")].filter(vis).filter(fold).filter((b) => !b.matches("[role=radio],[role=checkbox],[role=switch],[role=tab],[role=combobox],[data-slot=accordion-trigger]") && !b.closest("[data-preview-tray]"))
  const other = buttons.filter((b) => !/^(Save changes|Cancel)$/.test(b.textContent.trim()))
  const filled = buttons.filter((b) => { const m = getComputedStyle(b).backgroundColor.match(/[\d.]+/g).map(Number); if (m.length > 3 && m[3] === 0) return false; return m[0] + m[1] + m[2] < 300 })
  const helpers = [...form.querySelectorAll("p,span,div")].filter(vis).filter(fold).filter((el) => el.children.length === 0 && el.textContent.trim().split(/\s+/).length >= 5 && /text-muted-foreground/.test(el.className) && !el.closest("[data-model-tile],[data-package-readout]") && !el.hasAttribute("data-section-summary"))
  const f = words(form)
  const pv = words(preview)
  const seen = {}
  for (const x of f.texts) if (x.split(/\s+/).length >= 3) seen[x] = (seen[x] ?? 0) + 1
  const port = document.querySelector("[data-page-scroll]")
  return {
    fields: fields.length,
    other: other.length,
    otherNames: other.map((b) => b.textContent.trim()),
    wordsForm: f.n,
    wordsAll: f.n + pv.n,
    helpers: helpers.map((h) => h.textContent.trim()),
    tiles: [...form.querySelectorAll("[data-model-tile]")].filter(vis).length,
    filled: filled.map((b) => b.textContent.trim()),
    sections: [...form.querySelectorAll("[data-section-item],[data-settings-section]")].filter(vis).length,
    repeats: Object.entries(seen).filter(([, c]) => c > 1).map(([x]) => x),
    fits: port ? port.scrollHeight <= port.clientHeight + 1 : false,
    scroll: port ? [port.scrollHeight, port.clientHeight] : null,
  }
})
function holdsBudget(m, mode, label) {
  const bad = []
  if (m.fields > BUDGET.fields[mode]) bad.push(`${m.fields} fields, budget ${BUDGET.fields[mode]}`)
  if (m.other > BUDGET.other) bad.push(`${m.other} other buttons (${m.otherNames.join(", ")}), budget ${BUDGET.other}`)
  if (m.wordsForm > BUDGET.words[mode]) bad.push(`${m.wordsForm} words on the form side, budget ${BUDGET.words[mode]}`)
  if (m.wordsAll > BUDGET.withPreview) bad.push(`${m.wordsAll} words with the preview, budget ${BUDGET.withPreview}`)
  if (m.helpers.length) bad.push(`helper lines: ${m.helpers.join(" | ")}`)
  if (m.tiles) bad.push(`${m.tiles} lines for models not chosen`)
  if (m.filled.length) bad.push(`filled on arrival: ${m.filled.join(", ")}`)
  if (m.sections > BUDGET.sections) bad.push(`${m.sections} sections, budget ${BUDGET.sections}`)
  if (m.repeats.length) bad.push(`repeated: ${m.repeats.join(" | ")}`)
  if (!m.fits) bad.push(`does not fit 900 px: scroll ${m.scroll}`)
  if (bad.length) fail(`${label}: ${bad.join("; ")}`)
}
/** Evaluation settings on another model, so a Default skill reads it. */
async function programOn(t, model) {
  await t.seededSettings()
  await modelSwitch(t, model)
  if (model === "Approved or not approved") {
    await t.main.getByRole("textbox", { name: /^First label/ }).fill("Met")
    await t.main.getByRole("textbox", { name: /^Second label/ }).fill("Not met")
    await t.click(t.p.locator("#cfg-qualifying-0"), "no Which one qualifies")
  }
  if (model === "Questions") {
    await fillQuestions(t, ["Hand hygiene", "Checks the patient identity", "States the reason", "Documents the result"])
    await t.click(t.p.locator("#cfg-qrule-subsetopt"), "no Named questions")
    await t.click(t.p.locator("#cfg-qsub-0"), "no question box")
    await t.click(t.p.locator("#cfg-qsub-1"), "no question box")
  }
  if (model === "Score on a scale") {
    // From Questions the set stays [REQ SC-04].
    if (!(await t.main.getByRole("textbox", { name: "Question 1" }).inputValue().catch(() => ""))) await fillQuestions(t, ["Hand hygiene", "Checks the patient identity", "States the reason", "Documents the result"])
    await t.click(t.p.locator("#cfg-scale"), "no Scale")
    await t.click(t.p.getByRole("option", { name: "5", exact: true }), "no 5 on the scale")
    await t.click(t.p.locator("#cfg-srule-average"), "no Average")
    await t.p.locator("#cfg-srule-value").fill("3")
  }
  await t.applySettings()
}
const MODELS = ["Independence level", "Approved or not approved", "Questions", "Score on a scale"]
const MODEL_ID = { "Independence level": "demonstration", "Approved or not approved": "binary", Questions: "question", "Score on a scale": "scored" }

/** From the seed, as a person's first visit reads it. */
async function freshStore(t) {
  await t.p.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear() })
}
test("CFG1", "CFG", "Cards page at 1440 x 900 on every model, Default and Custom, from a fresh program: no repeats, no filled button on arrival, no helper lines, three cards, the tray in view; a long question set changes nothing", async (t) => {
  // D-L135 (2026-11-10): every card is open, so the D-L115 field count and the 900 px fit no longer hold. What still holds is checked; the counts are reported for Romit.
  await t.p.setViewportSize({ width: 1440, height: 900 })
  const report = []
  const trayOnScreen = async (label) => {
    const b = await t.p.locator("[data-preview-tray]").boundingBox()
    if (b && b.y + b.height > 900) fail(`${label}: the tray runs to ${Math.round(b.y + b.height)}, past the fold`)
  }
  const holds = (m, label, filled) => {
    const bad = []
    // Every card open carries Evaluation settings' own row actions (a level's menu, Add a level, Use a starting set): reported against the old budget, not failed.
    if (m.other > BUDGET.other) report.push(`${label}: ${m.other} other buttons (${m.otherNames.map((x) => x || "row menu").join(", ")}), D-L115 budget ${BUDGET.other}`)
    // The help lines are Evaluation settings' own (Levels, the two optional steps): reported, not failed, since the pages now share their rows.
    if (m.helpers.length) report.push(`${label}: help lines ${m.helpers.join(" | ")}`)
    if (m.filled.join() !== filled) bad.push(`filled: ${m.filled.join(", ") || "none"}`)
    if (m.sections > 3) bad.push(`${m.sections} cards in view`)
    if (m.repeats.length) bad.push(`repeated: ${m.repeats.join(" | ")}`)
    if (bad.length) fail(`${label}: ${bad.join("; ")}`)
  }
  for (const model of MODELS) {
    await t.open(LIB)
    await freshStore(t)
    if (model !== "Independence level") await programOn(t, model)
    const page = await cfgOpen(t)
    await t.settled()
    const d = await measureConfigure(t)
    report.push(`${model}, Default: ${d.fields} fields, ${d.other} buttons, ${d.wordsForm} and ${d.wordsAll} words in the first viewport`)
    holds(d, `${model}, Default`, "")
    await trayOnScreen(`${model}, Default`)
    await t.chooseCustom(page)
    await t.settled()
    const c = await measureConfigure(t)
    report.push(`${model}, Custom: ${c.fields} fields, ${c.other} buttons, ${c.wordsForm} and ${c.wordsAll} words in the first viewport`)
    // Choosing Custom is the change: its one filled button is Save changes.
    holds(c, `${model}, Custom`, "Save changes")
    await trayOnScreen(`${model}, Custom`)
  }
  // Long question text, and a scale of ten: the tray's words do not grow with them.
  await t.open(LIB)
  await freshStore(t)
  await t.seededSettings()
  await modelSwitch(t, "Score on a scale")
  await fillQuestions(t, Array.from({ length: 12 }, (_, i) => `Question number ${i + 1} is written out at length so that it runs across most of a line`))
  await t.click(t.p.locator("#cfg-scale"), "no Scale")
  await t.click(t.p.getByRole("option", { name: "10", exact: true }), "no 10 on the scale")
  await t.click(t.p.locator("#cfg-srule-average"), "no Average")
  await t.p.locator("#cfg-srule-value").fill("5")
  await t.applySettings()
  await cfgOpen(t)
  await t.settled()
  holds(await measureConfigure(t), "Long questions, Default", "")
  await trayOnScreen("Long questions, Default")
  console.log(report.join("\n"))
}, 560000)
test("CFG2", "CFG", "Doors: the panel's Configure, the Configuration cell, one row in the selection bar, an old section link", async (t) => {
  const sameSkill = async (how) => {
    const page = await t.configurePage()
    await t.visible(page.getByRole("heading", { level: 1, name: BP }), `${how}: the page is on another skill`)
  }
  const panel = await t.openEditPanel()
  await t.click(panel.getByRole("link", { name: /^Configure$/ }), "no Configure")
  await sameSkill("the panel's Configure")
  await t.open(LIB)
  await t.click((await t.row(BP)).getByRole("link", { name: /^Configuration:/ }), "no cell link")
  await sameSkill("the cell")
  await t.open(LIB)
  await t.selectRows([BP])
  await t.click(t.action(/^Configure 1 skill$/, t.main), "no Configure 1 skill")
  await sameSkill("the selection bar")
  // The old link goes straight there: the Library is never drawn first.
  await t.p.addInitScript(() => { const look = () => { if (document.querySelector("[data-library-table]")) window.__sawLibrary = true; requestAnimationFrame(look) }; requestAnimationFrame(look) })
  await t.open(`${LIB}?skill=hgtc-basic-skills-11&section=evaluation`)
  await sameSkill("an old section link")
  if (await t.p.evaluate(() => window.__sawLibrary === true)) fail("an old section link drew the Library first")
})
test("CFG3", "CFG", "Default read-out: only the rows that apply, with student fields and group check-off, on every model", async (t) => {
  const want = {
    "Independence level": ["Judged by", "Levels", "Counts"],
    "Approved or not approved": ["Judged by", "Labels", "Which one qualifies"],
    Questions: ["Judged by", "Counts"],
    "Score on a scale": ["Judged by", "Scale", "Counts"],
  }
  // The cards page (D-L135): card 1 then Forms; the two optional steps read On or Off on the path.
  const always = ["Who can sign off", "What the student fills in", "Feedback", "Group check-off"]
  for (const model of MODELS) {
    if (model !== "Independence level") await programOn(t, model)
    const page = await cfgOpen(t)
    const rows = await page.locator("[data-package-readout] dt").allInnerTexts()
    if (!same(rows, [...want[model], ...always])) fail(`${model}: the read-out rows are ${rows.join(", ")}`)
    if ((await page.locator("[data-step-value]").count()) !== 2) fail(`${model}: the path does not read its two optional steps`)
    if (await page.getByRole("button", { name: /^Edit levels/ }).count()) fail(`${model}: Edit levels shows under Default`)
    if (model === "Approved or not approved") {
      // The program's own words, on every side of the page.
      const labels = await page.locator('[data-readout="Labels"]').innerText()
      if (labels !== "Met, Not met") fail(`the read-out says "${labels}"`)
      await t.click(page.locator("[data-preview-panel]").getByRole("tab", { name: /^Evaluator/ }), "no Evaluator tab")
      const tray = await page.locator("[data-preview-tray]").innerText()
      if (!/Not met/.test(tray) || /Unmet/.test(tray)) fail(`the evaluator's form says: ${tray.replace(/\s+/g, " ").slice(0, 140)}`)
      await t.chooseCustom(page)
      await t.openGroup(page, "How this skill is judged")
      const tile = await page.locator("[data-model-tile=binary]").innerText()
      if (!/One result: Met or Not met/.test(tile)) fail(`the tile says "${tile}"`)
      await t.open(`${LIB}?program=new`)
      const name = unique("Newprog")
      await addOnNewProgram(t, name)
      await t.click((await t.row(name)).getByRole("link", { name: /^Configuration:/ }), "no cell link")
      const fresh = await t.configurePage()
      const empty = await fresh.locator("[data-model-tile=binary]").innerText()
      if (/Unmet|such as Met/.test(empty)) fail(`with no labels the tile implies a default: "${empty}"`)
      await t.open(LIB)
      continue
    }
    if (model === "Questions") {
      await t.visible(page.locator("[data-subset-count]").filter({ hasText: "2 of 4" }), "no Questions that must be Yes 2 of 4")
      await t.visible(page.getByRole("button", { name: /^Choose/ }), "no Choose")
      await t.visible(page.getByRole("button", { name: /^Edit questions/ }), "no Edit questions")
    }
    if (model === "Score on a scale") await t.visible(page.getByRole("button", { name: /^Edit questions/ }), "no Edit questions")
  }
}, 300000)
test("CFG4", "CFG", "Not configured (a): no switch, the line, the filled action, no tile chosen, the preview line; a tile starts Custom", async (t) => {
  await t.open(`${LIB}?program=new`)
  const name = unique("Newprog")
  await addOnNewProgram(t, name)
  await t.click((await t.row(name)).getByRole("link", { name: /^Configuration:/ }), "no cell link")
  const page = await t.configurePage()
  await t.absent(page.getByRole("radiogroup", { name: "Evaluation settings" }), "the switch shows with no program settings")
  await t.visible(page.getByText(/^Your program has not set how skills are judged\.$/), "no line")
  const m = await measureConfigure(t)
  if (m.filled.join() !== "Set how skills are judged") fail(`filled: ${m.filled.join(", ")}`)
  await t.visible(page.locator("[data-skill-title]").filter({ hasText: /Not configured/ }), "no Not configured badge")
  for (const model of MODELS) if (await page.locator(`#cfg-model-${MODEL_ID[model]}`).getAttribute("aria-checked") === "true") fail(`${model} is preselected`)
  await t.visible(page.locator("[data-preview-line]").filter({ hasText: /^Choose how this skill is judged first\.$/ }), "no preview line")
  await t.absent(saveChanges(page), "Save with nothing to save")
  await t.click(page.locator("#cfg-model-binary"), "no tile")
  await t.visible(page.locator("[data-tier=cfg-sec-steps]"), "the other cards did not appear", QUICK)
  await t.visible(saveChanges(page), "choosing a model offers no Save")
  await t.p.waitForTimeout(400) // the DS button's colour transition
  const after = await measureConfigure(t)
  if (after.filled.join() !== "Save changes") fail(`filled after a choice: ${after.filled.join(", ")}`)
})
test("CFG5", "CFG", "Not configured (b): No questions yet with Add questions, the preview line; questions bring the evaluator's form", async (t) => {
  await savedWithNoQuestions(t)
  const page = await t.openConfigure()
  await t.visible(page.locator("[data-skill-title]").filter({ hasText: /Not configured/ }), "no Not configured badge")
  await t.visible(page.locator("[data-questions-count]").filter({ hasText: /No questions yet/ }), "no No questions yet")
  await t.visible(page.locator("[data-preview-line]").filter({ hasText: /^Add questions to see the evaluator's form\.$/ }), "no preview line")
  await t.absent(page.locator("[data-preview-tray]"), "a form shows with no questions")
  await t.click(page.getByRole("button", { name: /^Add questions/ }), "no Add questions")
  const q = t.p.locator("[data-questions-dialog]")
  await q.getByRole("textbox", { name: /^Question 1/ }).fill("Hand hygiene")
  await t.click(q.getByRole("button", { name: /^Save$/ }), "no Save")
  await t.visible(page.locator("[data-preview-tray]"), "no form after adding a question", QUICK)
})
test("CFG6", "CFG", "Save and Cancel appear only after a change, and go when it is undone", async (t) => {
  const page = await cfgOpen(t)
  const was = await page.getByRole("spinbutton", { name: /^Times needed/ }).inputValue()
  await t.absent(saveChanges(page), "Save changes with nothing changed")
  await t.absent(page.getByRole("link", { name: /^Cancel$/ }), "Cancel with nothing changed")
  await page.getByRole("spinbutton", { name: /^Times needed/ }).fill(String(Number(was) + 1))
  await t.visible(saveChanges(page), "no Save changes after a change", QUICK)
  await t.visible(page.getByRole("link", { name: /^Cancel$/ }), "no Cancel after a change", QUICK)
  await page.getByRole("spinbutton", { name: /^Times needed/ }).fill(was)
  await t.waitFor(async () => (await saveChanges(page).count()) === 0, "Save changes stayed with the change undone")
})
test("CFG7", "CFG", "Invalid Save: sticky list naming the card, the field takes focus; the list's link focuses it again", async (t) => {
  const page = await cfgOpen(t)
  await t.chooseCustom(page)
  await page.getByRole("spinbutton", { name: /^Times needed/ }).fill("999")
  await t.click(saveChanges(page), "no Save changes")
  const summary = page.locator("[data-problems-sticky] [data-region=validation-summary]")
  await t.visible(summary, "no list of problems", QUICK)
  if (!/What counts as achieved/.test(await summary.innerText())) fail("the list does not name the card")
  await t.waitFor(() => page.locator("#cfg-need").evaluate((e) => e === document.activeElement), "focus is not on Times needed")
  await page.locator("#cfg-feedback").focus()
  await t.click(summary.getByRole("button").first(), "the list has no link")
  await t.waitFor(() => page.locator("#cfg-need").evaluate((e) => e === document.activeElement), "the list did not focus Times needed")
})
test("CFG8", "CFG", "Save lands: Library, same filters and scroll, panel open, banner, focus on Configure", async (t) => {
  await t.p.setViewportSize({ width: 1440, height: 900 })
  await t.open(`${LIB}?config=default`)
  await t.visible(t.button(/^Remove filter Default/, t.main), "no chip for the filter")
  const port = t.p.locator("[data-page-scroll]")
  await port.evaluate((el) => { el.scrollTop = 900 })
  await t.p.waitForTimeout(300)
  const scrolled = await port.evaluate((el) => el.scrollTop)
  if (scrolled < 500) fail(`could not scroll the Library (${scrolled}), so this checks nothing`)
  const link = t.main.getByRole("link", { name: /^Configuration:/ }).filter({ visible: true })
  const inView = await link.evaluateAll((els) => { const r = els.find((e) => { const b = e.getBoundingClientRect(); return b.top > 200 && b.bottom < window.innerHeight - 100 }); return r ? els.indexOf(r) : -1 })
  if (inView < 0) fail("no Configuration link in view")
  const label = await link.nth(inView).getAttribute("aria-label")
  const name = label.match(/Configure (.+)$/)[1]
  await t.click(link.nth(inView), "no cell link")
  const page = await t.configurePage()
  await t.chooseCustom(page)
  await savePageKeepLanding(t, page)
  if (!/config=default/.test(t.p.url())) fail(`the filter went: ${t.p.url()}`)
  await t.visible(t.button(/^Remove filter Default/, t.main), "the filter chip went")
  await t.waitFor(async () => Math.abs((await port.evaluate((el) => el.scrollTop)) - scrolled) < 60, async () => `scroll reads ${await port.evaluate((el) => el.scrollTop)}, left at ${scrolled}`, 6000)
  await t.expectBanner(new RegExp(`${esc(name)} saved\\.`), "landing")
  await t.expectBannerOnScreen(new RegExp(`${esc(name)} saved\\.`), "landing with the scroll restored")
  const panel = t.dialog().first()
  await t.visible(panel.getByRole("textbox", { name: /^Name/ }), "the panel did not open")
  if ((await panel.getByRole("textbox", { name: /^Name/ }).inputValue()) !== name) fail("the panel opened on another skill")
  await t.waitFor(() => panel.getByRole("link", { name: /^Configure$/ }).evaluate((e) => e === document.activeElement), "focus is not on Configure")
})
async function savePageKeepLanding(t, page) {
  await t.click(saveChanges(page), "no Save changes")
  const d = t.p.getByRole("alertdialog")
  if (await t.isVisible(d, 1000)) await t.click(d.getByRole("button", { name: /^Save changes/ }), "dialog has no Save changes")
  await t.waitFor(() => /skills-library/.test(t.p.url()), () => `Save stayed on ${t.p.url()}`, ACT)
}
test("CFG9", "CFG", "With a change every way off asks: Cancel, crumb, Skills panel row, sidebar, From Evaluation settings, Set how, Back, reload", async (t) => {
  const page = await cfgOpen(t)
  await page.getByRole("spinbutton", { name: /^Times needed/ }).fill("9")
  await t.visible(saveChanges(page), "no Save changes", QUICK)
  const keep = async (how) => {
    await t.expectDiscardPrompt(how)
    await t.click(t.discardPrompt().getByRole("button", { name: /^Keep editing/ }), "no Keep editing")
    await t.p.waitForTimeout(250)
    if ((await page.getByRole("spinbutton", { name: /^Times needed/ }).inputValue()) !== "9") fail(`${how}: Keep editing lost the change`)
    if (!/configure-skill/.test(t.p.url())) fail(`${how}: Keep editing left the page: ${t.p.url()}`)
  }
  await t.click(page.getByRole("link", { name: /^Cancel$/ }), "no Cancel")
  await keep("Cancel")
  await t.click(t.p.getByRole("navigation", { name: /location|breadcrumb/i }).first().getByRole("link", { name: "Library", exact: true }), "no crumb")
  await keep("the crumb")
  await t.click(t.skillsPanelRow("Categories and tags"), "no Skills panel row")
  await keep("a Skills panel row")
  await t.click(t.p.locator("[data-sidebar=menu-button][href]").filter({ visible: true }).last(), "no sidebar link")
  await keep("the sidebar")
  await t.click(page.getByRole("link", { name: /^Edit Evaluation settings/ }), "no From Evaluation settings")
  await keep("From Evaluation settings")
  await t.p.goBack().catch(() => undefined)
  await keep("Back")
  // Reload gets the browser's own prompt.
  let asked = false
  t.p.once("dialog", async (d) => { asked = d.type() === "beforeunload"; await d.dismiss() })
  await t.p.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); window.__unloadHeld = e.defaultPrevented })
  if (!(await t.p.evaluate(() => window.__unloadHeld))) fail("reload does not ask")
  void asked
  // Discard goes where the press was going.
  await t.click(page.getByRole("link", { name: /^Edit Evaluation settings/ }), "no From Evaluation settings")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "no Discard")
  await t.waitFor(() => /evaluation-settings/.test(t.p.url()), () => `Discard went to ${t.p.url()}`, ACT)
})
test("CFG9b", "CFG", "The walkthrough bar and Set how skills are judged ask with a change too", async (t) => {
  await t.open(`${LIB}?program=new`)
  const name = unique("Newprog")
  await addOnNewProgram(t, name)
  await t.click((await t.row(name)).getByRole("link", { name: /^Configuration:/ }), "no cell link")
  const page = await t.configurePage()
  await t.click(page.locator("#cfg-model-binary"), "no tile")
  await t.visible(saveChanges(page), "no Save changes", QUICK)
  await t.click(page.getByRole("link", { name: /^Set how skills are judged/ }), "no Set how skills are judged")
  await t.expectDiscardPrompt("Set how skills are judged")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Keep editing/ }), "no Keep editing")
  await t.open("/lab/flow/setup-walkthrough/configure?set=1&present=1&skill=sk-vitals")
  const onPath = await t.configurePage()
  await onPath.getByRole("spinbutton", { name: /^Times needed/ }).fill("9")
  await t.visible(saveChanges(onPath), "no Save changes on the path", QUICK)
  const bar = await t.pathBar()
  const link = bar.getByRole("link").first()
  await t.visible(link, "the path bar has no link")
  await t.click(link, "the path bar has no link")
  await t.expectDiscardPrompt("the walkthrough bar")
})
test("CFG10", "CFG", "Arrow keys on the model keep the cards and focus on the tiles", async (t) => {
  const page = await cfgOpen(t)
  await t.chooseCustom(page)
  await t.openGroup(page, "How this skill is judged")
  await t.p.locator("#cfg-model-demonstration").focus()
  for (const [key, id] of [["ArrowDown", "binary"], ["ArrowRight", "question"], ["ArrowDown", "scored"]]) {
    // Held as a person holds it: Radix checks the radio on the focus that follows, only while the key is down.
    await t.p.keyboard.press(key, { delay: 120 })
    await t.waitFor(() => t.p.locator(`#cfg-model-${id}`).evaluate((e) => e === document.activeElement && e.getAttribute("aria-checked") === "true"), `${key} did not move to ${id}`, 3000)
    if (!(await t.p.locator("[data-tier=cfg-sec-forms]").count())) fail(`${key} took the other cards away`)
    if (await t.isVisible(t.p.getByRole("alertdialog"), 150)) fail(`${key} asked a question`)
  }
})
test("CFG11", "CFG", "375 and 1920: no sideways scroll, Preview a Dialog at 375, two equal columns at 1920", async (t) => {
  const noSideways = async (what) => { const o = await t.p.evaluate(() => { const port = document.querySelector("[data-page-scroll]"); return [document.documentElement.scrollWidth - window.innerWidth, port ? port.scrollWidth - port.clientWidth : 0] }); if (o[0] > 1 || o[1] > 1) fail(`${what}: runs sideways by ${o}`) }
  await t.p.setViewportSize({ width: 375, height: 812 })
  let page = await cfgOpen(t)
  await noSideways("375, Default")
  await t.absent(page.locator("[data-preview-panel]"), "the panel stays at 375")
  await t.visible(page.getByRole("button", { name: /^Preview/ }), "no Preview in the header at 375")
  await t.click(page.getByRole("button", { name: /^Preview/ }), "no Preview")
  await t.visible(t.p.locator("[data-panel-preview]"), "Preview opened no dialog", QUICK)
  await t.click(t.p.locator("[data-panel-preview]").getByRole("button", { name: /^Close/ }), "no Close")
  await t.chooseCustom(page)
  await noSideways("375, Custom")
  await t.visible(page.locator("[data-rule-sentence]").first(), "no rule sentence at 375")
  for (const s of ["How this skill is judged", "What the student does", "Who evaluates"]) { await t.openGroup(page, s); await noSideways(`375, ${s}`) }
  await t.p.setViewportSize({ width: 1920, height: 1080 })
  page = await cfgOpen(t)
  await noSideways("1920")
  const cols = await page.locator("[data-settings-columns]").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").map(parseFloat))
  if (cols.length !== 2 || Math.abs(cols[0] - cols[1]) > 2) fail(`columns at 1920 read ${cols.join(", ")}`)
})
test("CFG12", "CFG", "Custom, change, Default, Custom: the draft is still there", async (t) => {
  const page = await cfgOpen(t)
  const on = await flipFeedback(t, page)
  await t.chooseDefault(page)
  await t.waitFor(async () => (await t.panelConfig(page)) === "Default", "Default did not take")
  await t.chooseCustom(page)
  await t.openGroup(page, "Who evaluates")
  if (((await page.getByRole("switch", { name: /^Feedback is required/ }).getAttribute("aria-checked")) === "true") !== on) fail("switching lost the Custom draft")
})
test("CFG13", "CFG", "Each model, each section: a change saves, survives a reload, and the student and evaluator views change", async (t) => {
  const views = async (page) => {
    const panel = page.locator("[data-preview-panel]")
    await t.click(panel.getByRole("tab", { name: /^Student/ }), "no Student tab")
    const student = (await panel.locator("[data-preview-tray]").innerText()).replace(/\s+/g, " ")
    await t.click(panel.getByRole("tab", { name: /^Evaluator/ }), "no Evaluator tab")
    const evaluator = (await panel.locator("[data-preview-tray]").innerText()).replace(/\s+/g, " ")
    await t.click(panel.getByRole("tab", { name: /^Student/ }), "no Student tab")
    return { student, evaluator }
  }
  const fillModel = {
    "Independence level": async (page) => { await t.openGroup(page, "What counts as achieved"); await t.click(page.getByRole("checkbox", { name: / counts$/ }).first(), "no Counts box") },
    "Approved or not approved": async (page) => {
      await t.openGroup(page, "What counts as achieved")
      await page.getByRole("textbox", { name: /^First label/ }).fill("Met")
      await page.getByRole("textbox", { name: /^Second label/ }).fill("Not met")
      await t.click(page.getByRole("group", { name: /^Which one qualifies/ }).getByRole("radio").first(), "no qualifies")
    },
    Questions: async (page) => {
      await t.openGroup(page, "What counts as achieved")
      await t.click(page.getByRole("button", { name: /^(Add|Edit) questions/ }), "no questions button")
      const q = t.p.locator("[data-questions-dialog]")
      await q.getByRole("textbox", { name: /^Question 1/ }).fill("Hand hygiene")
      await t.click(q.getByRole("button", { name: /^Save$/ }), "no Save")
      await t.click(page.locator("#cfg-qrule-all"), "no All Yes")
    },
    "Score on a scale": async (page) => {
      await t.openGroup(page, "What counts as achieved")
      await t.click(page.locator("#cfg-scale"), "no Scale")
      await t.click(t.p.getByRole("option", { name: "5", exact: true }), "no 5")
      await t.click(page.locator("#cfg-srule-average"), "no Average")
      await page.locator("#cfg-srule-value").fill("3")
      await t.click(page.getByRole("button", { name: /^(Add|Edit) questions/ }), "no questions button")
      const q = t.p.locator("[data-questions-dialog]")
      await q.getByRole("textbox", { name: /^Question 1/ }).fill("Hand hygiene")
      await t.click(q.getByRole("button", { name: /^Save$/ }), "no Save")
    },
  }
  for (const model of MODELS) {
    let page = await cfgOpen(t)
    const before = await views(page)
    await t.chooseCustom(page)
    if (model !== "Independence level") {
      await t.openGroup(page, "How this skill is judged")
      await t.click(page.locator(`#cfg-model-${MODEL_ID[model]}`), `no ${model}`)
    }
    await fillModel[model](page)
    await t.openGroup(page, "What the student does")
    const self = page.getByRole("switch", { name: /^Student rates themselves first/ })
    const selfOn = (await self.getAttribute("aria-checked")) === "true"
    await self.click()
    await t.openGroup(page, "Who evaluates")
    const fb = page.getByRole("switch", { name: /^Feedback is required/ })
    const fbOn = (await fb.getAttribute("aria-checked")) === "true"
    await fb.click()
    await savePage(t, page)
    if ((await t.rowConfig(CFG_SKILL)) !== "Custom") fail(`${model}: row reads ${await t.rowConfig(CFG_SKILL)}`)
    page = await cfgOpen(t)
    await t.reload()
    page = await t.configurePage()
    await t.openGroup(page, "How this skill is judged")
    if ((await page.locator(`#cfg-model-${MODEL_ID[model]}`).getAttribute("aria-checked")) !== "true") fail(`${model}: the model did not stick`)
    await t.openGroup(page, "What the student does")
    if (((await page.getByRole("switch", { name: /^Student rates themselves first/ }).getAttribute("aria-checked")) === "true") === selfOn) fail(`${model}: Student rates did not stick`)
    await t.openGroup(page, "Who evaluates")
    if (((await page.getByRole("switch", { name: /^Feedback is required/ }).getAttribute("aria-checked")) === "true") === fbOn) fail(`${model}: Feedback did not stick`)
    const after = await views(page)
    if (after.student === before.student) fail(`${model}: the student's view did not change`)
    if (after.evaluator === before.evaluator) fail(`${model}: the evaluator's view did not change`)
    // Back to the program's for the next model.
    await t.chooseDefault(page)
    await savePage(t, page)
    if ((await t.rowConfig(CFG_SKILL)) !== "Default") fail(`${model}: back to Default reads ${await t.rowConfig(CFG_SKILL)}`)
  }
}, 420000)
test("CFG14", "CFG", "Cancel, Discard: back at the origin with filters and scroll; nothing saved", async (t) => {
  await t.open(`${LIB}?config=default`)
  const port = t.p.locator("[data-page-scroll]")
  await port.evaluate((el) => { el.scrollTop = 900 })
  await t.p.waitForTimeout(300)
  const scrolled = await port.evaluate((el) => el.scrollTop)
  const link = t.main.getByRole("link", { name: /^Configuration:/ }).filter({ visible: true })
  const inView = await link.evaluateAll((els) => els.findIndex((e) => { const b = e.getBoundingClientRect(); return b.top > 200 && b.bottom < window.innerHeight - 100 }))
  if (inView < 0) fail("no Configuration link in view")
  const name = (await link.nth(inView).getAttribute("aria-label")).match(/Configure (.+)$/)[1]
  const times = await t.times(name)
  await t.click(link.nth(inView), "no cell link")
  const page = await t.configurePage()
  await page.getByRole("spinbutton", { name: /^Times needed/ }).fill(String(Number(times) + 4))
  await t.click(page.getByRole("link", { name: /^Cancel$/ }), "no Cancel")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "no Discard")
  await t.waitFor(() => /skills-library/.test(t.p.url()) && /config=default/.test(t.p.url()), () => `Cancel went to ${t.p.url()}`, ACT)
  await t.waitFor(async () => Math.abs((await port.evaluate((el) => el.scrollTop)) - scrolled) < 60, async () => `scroll reads ${await port.evaluate((el) => el.scrollTop)}, left at ${scrolled}`, 6000)
  if ((await t.times(name)) !== times) fail("Cancel saved the number")
})
test("CFG15", "CFG", "Two rows: the bulk page, the same sections, Edit levels, Add minimum, no switch; the selection beside them from 1100 px, Show skills below", async (t) => {
  await t.p.setViewportSize({ width: 1440, height: 900 })
  await t.open(LIB)
  await t.selectRows([BP, "Height"])
  await t.click(t.action(/^Configure 2 skills$/, t.main), "no Configure 2 skills")
  await t.visible(t.main.locator("[data-configure-sections]"), "no sections on the bulk page", ACT)
  await t.absent(t.main.getByRole("radiogroup", { name: "Evaluation settings" }), "the bulk page has the switch")
  const titles = await t.main.locator("[data-slot=accordion-trigger]").allInnerTexts()
  for (const n of ["How these skills are judged", "What counts as achieved", "What the student does", "Who evaluates"]) if (!titles.some((x) => x.startsWith(n))) fail(`no section ${n}: ${titles.join(" | ")}`)
  await t.visible(t.main.getByRole("button", { name: /^Edit levels/ }), "no Edit levels")
  await t.visible(t.main.getByRole("button", { name: /^Add minimum/ }), "no Add minimum")
  const list = t.main.locator("[data-many-list]")
  await t.visible(list, "no list of the selected skills beside the sections")
  await t.visible(list.getByRole("heading", { name: "Selected skills" }), "the list has no title")
  if ((await list.locator("[data-many-names] li").count()) !== 2) fail("the list does not hold the 2 skills")
  await t.p.setViewportSize({ width: 1000, height: 800 })
  if ((await t.main.locator("[data-many-list] [data-many-names] li").count()) !== 2) fail("the names leave the page below 1100 px")
})
test("CFG16", "CFG", "A long selection scrolls in its own list, and the page does not grow", async (t) => {
  await t.p.setViewportSize({ width: 1440, height: 900 })
  await t.open(LIB)
  await t.p.waitForTimeout(800)
  const ids = await t.main.locator("[data-skill-link]").evaluateAll((els) => els.map((e) => e.getAttribute("data-skill-link")))
  if (ids.length < 100) fail(`the Library lists ${ids.length} skills, so this checks nothing`)
  await t.open(`/lab/admin/configure-skill?skills=${ids.slice(0, 120).join(",")}`)
  const names = t.main.locator("[data-many-list] [data-many-names]")
  await t.visible(names, "no list of the selected skills", ACT)
  const m = await names.evaluate((el) => ({ own: el.scrollHeight > el.clientHeight + 1, bottom: el.getBoundingClientRect().bottom, rows: el.children.length }))
  if (m.rows !== 120) fail(`the list holds ${m.rows} rows`)
  if (!m.own) fail("the list does not scroll in its own box")
  if (m.bottom > 900) fail(`the list runs to ${m.bottom}, off the screen`)
  await t.settled()
  const port = await t.p.evaluate(() => { const p = document.querySelector("[data-page-scroll]"); return [p.scrollHeight, p.clientHeight] })
  if (port[0] > port[1] + 1) fail(`the page scrolls: ${port[0]} against ${port[1]}`)
  const sec = await t.main.locator("[data-many-list]").boundingBox()
  if (sec.y + sec.height > 900) fail(`the list column ends at ${Math.round(sec.y + sec.height)}, past the viewport`)
})
test("CFG17", "CFG", "Custom edits held aside under Default: every door asks; Discard drops them; no change, no question", async (t) => {
  const page = await cfgOpen(t)
  await flipFeedback(t, page)
  await t.chooseDefault(page)
  await t.waitFor(async () => (await saveChanges(page).count()) === 0, "Save changes shows with Default unchanged")
  const keep = async (how) => {
    await t.expectDiscardPrompt(how)
    await t.click(t.discardPrompt().getByRole("button", { name: /^Keep editing/ }), "no Keep editing")
    await t.p.waitForTimeout(250)
    if (!/configure-skill/.test(t.p.url())) fail(`${how}: Keep editing left the page: ${t.p.url()}`)
  }
  await t.click(t.p.getByRole("navigation", { name: /location|breadcrumb/i }).first().getByRole("link", { name: "Library", exact: true }), "no crumb")
  await keep("the crumb")
  await t.click(t.skillsPanelRow("Categories and tags"), "no Skills panel row")
  await keep("a Skills panel row")
  await t.click(t.p.locator("[data-sidebar=menu-button][href]").filter({ visible: true }).last(), "no sidebar link")
  await keep("the sidebar")
  await t.click(page.getByRole("link", { name: /^Edit Evaluation settings/ }), "no From Evaluation settings")
  await keep("From Evaluation settings")
  await t.p.goBack().catch(() => undefined)
  await keep("Back")
  await t.p.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); window.__unloadHeld = e.defaultPrevented })
  if (!(await t.p.evaluate(() => window.__unloadHeld))) fail("reload does not ask")
  // Keep editing kept it.
  await t.chooseCustom(page)
  await t.openGroup(page, "Who evaluates")
  await t.chooseDefault(page)
  await t.click(page.getByRole("link", { name: /^Edit Evaluation settings/ }), "no From Evaluation settings")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "no Discard")
  await t.waitFor(() => /evaluation-settings/.test(t.p.url()), () => `Discard went to ${t.p.url()}`, ACT)
  // Custom with no edit, then Default: nothing held, so nothing asks.
  const clean = await cfgOpen(t)
  await t.chooseCustom(clean)
  await t.chooseDefault(clean)
  await t.click(clean.getByRole("link", { name: /^Edit Evaluation settings/ }), "no From Evaluation settings")
  if (await t.isVisible(t.discardPrompt(), 800)) fail("asked with nothing held")
  await t.waitFor(() => /evaluation-settings/.test(t.p.url()), () => `the link went to ${t.p.url()}`, ACT)
})
const hrefOf = (ids) => `/lab/admin/configure-skill?skills=${ids.join(",")}`
test("CFG18", "CFG", "A name with stray spaces saves trimmed: the field shows it and the footer goes", async (t) => {
  const panel = await t.openEditPanel("Height")
  const name = panel.getByRole("textbox", { name: /^Name/ })
  await name.fill("  Height   ")
  await t.click(saveChanges(panel), "no Save changes")
  await t.expectBanner(/Height saved\./, "the save")
  await t.waitFor(async () => (await name.inputValue()) === "Height", async () => `the field holds "${await name.inputValue()}"`)
  await t.waitFor(async () => (await panel.locator("[data-unsaved-footer]").count()) === 0, "the footer stayed")
})
test("CFG19", "CFG", "Opened directly on the walkthrough: Save and Cancel stay on the path", async (t) => {
  const url = "/lab/flow/setup-walkthrough/configure?set=1&present=1&skill=sk-vitals"
  await t.open(url)
  let page = await t.configurePage()
  await t.chooseCustom(page)
  await t.click(saveChanges(page), "no Save changes")
  await t.waitFor(() => /\/(lab\/flow|walk)\/setup-walkthrough\/library/.test(t.p.url()), () => `Save left the path for ${t.p.url()}`, ACT)
  await t.expectBannerOnScreen(/saved\./, "on the path")
  await t.open(url)
  page = await t.configurePage()
  await page.getByRole("spinbutton", { name: /^Times needed/ }).fill("9")
  await t.click(page.getByRole("link", { name: /^Cancel$/ }), "no Cancel")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "no Discard")
  await t.waitFor(() => /\/(lab\/flow|walk)\/setup-walkthrough\/library/.test(t.p.url()), () => `Cancel left the path for ${t.p.url()}`, ACT)
  await t.pathBar()
})
test("CFG20", "CFG", "Copy: no signers says it plainly; a level mid-sentence goes through inSentence", async (t) => {
  const page = await cfgOpen(t)
  const check = await page.locator('[data-readout="Group check-off"]').innerText()
  if (check !== "On, each student at works alone") fail(`read-out: "${check}"`)
  await t.chooseCustom(page)
  await t.openGroup(page, "Who evaluates")
  for (const r of await page.getByRole("group", { name: /^Who can sign off/ }).getByRole("checkbox").all()) if (await r.isChecked()) await r.click()
  await t.click(page.locator("[data-preview-panel]").getByRole("tab", { name: /^Evaluator/ }), "no Evaluator tab")
  const said = await page.locator("[data-preview-tray]").evaluate((el) => el.textContent)
  if (/Who signs is not set/.test(said)) fail("the preview says Who signs is not set")
  if (!/Who can sign off is not chosen/.test(said)) fail(`the preview does not say who is missing: ${said.slice(0, 120)}`)
})
test("CFG21", "CFG", "Mixed model: What counts and Group check-off give the way forward, which opens How these skills are judged", async (t) => {
  await t.open(hrefOf(["sk-vitals", "sk-med-admin"]))
  await t.visible(t.main.locator("[data-configure-sections]"), "no sections", ACT)
  const way = t.main.locator('[data-needs-model][data-mixed-field="criteria"]')
  await t.visible(way, "What counts as achieved has no way forward")
  if (!/Mixed/.test(await way.innerText())) fail("the row does not say Mixed")
  await t.click(way.getByRole("button", { name: /^Choose how these skills are judged first/ }), "no link")
  const trig = t.main.locator("[data-slot=accordion-trigger]").filter({ hasText: /^How these skills are judged/ })
  await t.waitFor(async () => (await trig.getAttribute("aria-expanded")) === "true", "the link did not open How these skills are judged")
  await t.openGroup(t.main, "Who evaluates")
  await t.visible(t.main.locator('[data-needs-model][data-mixed-field="checkOff"]').getByRole("button", { name: /^Choose how these skills are judged first/ }), "Group check-off has no way forward")
})
test("CFG22", "CFG", "New program, several skills: the message and link, crumb as the title, no unexplained stay line, a reason on Use default configuration", async (t) => {
  await t.open(`${LIB}?program=new`)
  const names = [unique("Newprog a"), unique("Newprog b")]
  for (const n of names) await addOnNewProgram(t, n)
  await t.selectRows(names)
  await t.click(t.action(/^Configure 2 skills$/, t.main), "no Configure 2 skills")
  await t.visible(t.main.getByRole("heading", { level: 1, name: "2 skills" }), "the bulk page did not open", ACT)
  await t.visible(t.main.locator("[data-no-program]").getByRole("link", { name: /^Set how skills are judged/ }), "no message and link")
  const crumbs = (await t.p.getByRole("navigation", { name: /location|breadcrumb/i }).first().innerText()).replace(/\s+/g, " ")
  if (!/2 skills/.test(crumbs) || /0 skills/.test(crumbs)) fail(`crumb reads "${crumbs}"`)
  await t.click(t.main.locator("#cfg-model-binary"), "no tile") // with no model on any skill, How this skill is judged is the one section, and open
  if (/stays? not configured/.test(await t.main.innerText())) fail("an unexplained stay line shows")
  await t.click(t.main.locator("[data-many-more]").filter({ visible: true }).first(), "no ...")
  await t.visible(t.p.locator("[data-no-default-why]"), "Use default configuration gives no reason", QUICK)
  if (!(await t.p.getByRole("menuitem", { name: /^Use default configuration$/ }).isDisabled().catch(async () => (await t.p.getByRole("menuitem", { name: /^Use default configuration$/ }).getAttribute("aria-disabled")) === "true"))) fail("Use default configuration is not disabled")
})
test("CFG23", "CFG", "Bulk Cancel returns with the Library's search, tab and scroll", async (t) => {
  await t.p.setViewportSize({ width: 1440, height: 700 })
  await t.open(`${LIB}?status=active`)
  await t.main.getByRole("searchbox").first().fill("a")
  await t.p.waitForTimeout(800)
  const port = t.p.locator("[data-page-scroll]")
  await t.selectRows([BP, "Height"])
  await port.evaluate((el) => { el.scrollTop = 500 })
  await t.p.waitForTimeout(400)
  const scrolled = await port.evaluate((el) => el.scrollTop)
  if (scrolled < 200) fail(`could not scroll (${scrolled}), so this checks nothing`)
  await t.click(t.action(/^Configure 2 skills$/, t.main), "no Configure 2 skills")
  await t.visible(t.main.getByRole("heading", { level: 1, name: "2 skills" }), "the bulk page did not open", ACT)
  await t.click(t.main.getByRole("link", { name: /^Cancel$/ }).filter({ visible: true }).first(), "no Cancel")
  await t.waitFor(() => /skills-library/.test(t.p.url()), () => `Cancel went to ${t.p.url()}`, ACT)
  if (!/status=active/.test(t.p.url())) fail(`the tab went: ${t.p.url()}`)
  await t.waitFor(async () => (await t.main.getByRole("searchbox").first().inputValue()) === "a", "the search went")
  await t.waitFor(async () => Math.abs((await port.evaluate((el) => el.scrollTop)) - scrolled) < 60, async () => `scroll reads ${await port.evaluate((el) => el.scrollTop)}, left at ${scrolled}`, 6000)
})
test("CFG24", "CFG", "Inactive: named on the page and in the result; alone, the bar says why it has no actions", async (t) => {
  await t.open(`${LIB}?status=inactive`)
  await t.p.waitForTimeout(800)
  const inactive = (await t.skillRows().first().locator("[data-skill-link]").innerText()).trim()
  await t.selectRows([inactive])
  await t.visible(t.p.locator("[data-bulk-why]").filter({ hasText: /no bulk actions/ }), "the bar does not say why there are no actions")
  await t.open(LIB)
  await t.selectRows([inactive, "Height", "Weight"])
  await t.visible(t.p.locator("[data-bulk-why]").filter({ hasText: /1 inactive left out/ }), "the bar does not say one is left out")
  await t.click(t.action(/^Configure 2 skills$/, t.main), "no Configure 2 skills")
  const left = t.main.locator("[data-many-left-out]")
  await t.visible(left, "the page does not name who is left out", ACT)
  if (!(await left.innerText()).includes(inactive)) fail(`the page reads: ${await left.innerText()}`)
  await t.openGroup(t.main, "Who evaluates")
  await t.feedbackSwitch().first().click()
  await t.click(t.button(/^Save 2 skills$/, t.main), "no Save 2 skills")
  await t.expectBannerOnScreen(new RegExp(`Left out, Inactive: ${esc(inactive)}`), "the result")
})
test("CFG25", "CFG", "Add minimum across skills that differ: adds to each, keeps what each has, the same setting takes the number; a skill that fails is named", async (t) => {
  // One skill with a setting minimum and two different evaluators, one with neither.
  const page = await t.openConfigure(CFG_SKILL)
  const menu = await addMinimumMenu(t, page)
  await t.click(menu.locator("[data-minimum-kind=setting]").nth(0), "no setting")
  await page.getByRole("spinbutton", { name: /^Minimum in / }).last().fill("1")
  await savePage(t, page)
  await t.open(hrefOf(["sk-vitals", "sk-handoff"]))
  await t.visible(t.main.locator("[data-configure-sections]"), "no sections", ACT)
  const row = t.main.locator('[data-mixed-field="conditions"]')
  await t.visible(row, "Minimums do not read Mixed")
  if (/\bNone\b/.test(await row.innerText())) fail('"None" shows beneath Mixed')
  // A second setting goes to both; the first stays on the first skill.
  await t.click(t.main.getByRole("button", { name: /^Add minimum/ }), "no Add minimum")
  await t.click(t.p.getByRole("menu").locator("[data-minimum-kind=setting]").nth(1), "no second setting")
  await t.main.getByRole("spinbutton", { name: /^Minimum in / }).last().fill("999")
  await t.click(t.button(/^Save 2 skills$/, t.main), "no Save 2 skills")
  await t.visible(t.main.locator("[data-region=validation-summary]"), "too many was not blocked", QUICK)
  const said = await t.main.locator("[data-region=validation-summary]").innerText()
  if (!/Vital signs and early warning score|Bedside handoff report/.test(said)) fail(`the failing skill is not named: ${said}`)
  await t.main.getByRole("spinbutton", { name: /^Minimum in / }).last().fill("1")
  await t.click(t.button(/^Save 2 skills$/, t.main), "no Save 2 skills")
  const d = t.p.locator("[data-many-impact]")
  if (await t.isVisible(d, 1000)) await t.click(d.getByRole("button", { name: /^Save 2 skills/ }), "no Save in the dialog")
  await t.expectBannerOnScreen(/2 skills saved\./, "the bulk save")
  const count = async (id) => { const p = await cfgOpen(t, id); return p.getByRole("spinbutton", { name: /^Minimum in / }).count() }
  if ((await count("sk-vitals")) !== 2) fail("the first skill lost its own minimum, or did not get the new one")
  if ((await count("sk-handoff")) !== 1) fail("the second skill did not get the new minimum")
})
test("CFG26", "CFG", "Impact dialog: never a table of zeros; only when progress moves or something clears; it says how many others save", async (t) => {
  const ids = ["hgtc-basic-skills-11", "sk-handoff", "sk-central-line"] // Blood Pressure has evidence a higher number moves
  await t.open(hrefOf(ids))
  await t.visible(t.main.locator("[data-configure-sections]"), "no sections", ACT)
  await t.main.getByRole("spinbutton", { name: /^Times needed/ }).fill("9")
  await t.click(t.button(/^Save 3 skills$/, t.main), "no Save 3 skills")
  const d = t.p.locator("[data-many-impact]")
  await t.visible(d, "raising the number moved students with no dialog", QUICK)
  const text = (await d.innerText()).replace(/\s+/g, " ")
  if (/Achieved now|Students who change/.test(text) || (await d.getByRole("table").count())) fail(`the dialog holds a table: ${text.slice(0, 160)}`)
  if (!/progress changes/.test(text)) fail(`the dialog says nothing moves: ${text.slice(0, 160)}`)
  if (!/also saves?, with no student's progress changing/.test(text) && (await d.locator("[data-impact-row]").count()) < 3) fail(`skills are dropped silently: ${text.slice(0, 200)}`)
  await t.click(d.getByRole("button", { name: /^Keep editing/ }), "no Keep editing")
  await t.open(hrefOf(["sk-vitals", "sk-handoff", "sk-central-line"]))
  await t.visible(t.main.locator("[data-configure-sections]"), "no sections", ACT)
  await t.openGroup(t.main, "Who evaluates")
  await t.feedbackSwitch().first().click()
  await t.click(t.button(/^Save 3 skills$/, t.main), "no Save 3 skills")
  await t.absent(d, "a dialog opened with nothing moving", 800)
  await t.expectBannerOnScreen(/3 skills saved\./, "no dialog")
})
test("CFG27", "CFG", "Focus: back on Preview after its dialog; on the opener after a dialog that keeps the page; on the Library title after Discard", async (t) => {
  const active = (t) => t.p.evaluate(() => (document.activeElement?.textContent ?? "").trim().slice(0, 40))
  await t.open(hrefOf(["sk-vitals", "sk-handoff"]))
  await t.visible(t.main.locator("[data-configure-sections]"), "no sections", ACT)
  const preview = t.main.getByRole("button", { name: /^Preview$/ }).filter({ visible: true }).first()
  await t.click(preview, "no Preview")
  await t.visible(t.p.locator("[data-many-preview]"), "no dialog", QUICK)
  await t.p.keyboard.press("Escape")
  await t.waitFor(async () => (await active(t)) === "Preview", async () => `focus is on "${await active(t)}" after Preview`)
  await t.main.getByRole("spinbutton", { name: /^Times needed/ }).fill("7")
  await t.click(t.main.getByRole("link", { name: /^Cancel$/ }).filter({ visible: true }).first(), "no Cancel")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Keep editing/ }), "no Keep editing")
  await t.waitFor(async () => (await active(t)) === "Cancel", async () => `focus is on "${await active(t)}" after Keep editing`)
  await t.click(t.main.getByRole("link", { name: /^Cancel$/ }).filter({ visible: true }).first(), "no Cancel")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "no Discard")
  await t.waitFor(() => /skills-library/.test(t.p.url()), () => `Cancel went to ${t.p.url()}`, ACT)
  await t.waitFor(() => t.p.evaluate(() => document.activeElement?.tagName === "H1"), async () => `focus is on "${await active(t)}" after Discard`, 8000)
  const page = await cfgOpen(t)
  await page.getByRole("spinbutton", { name: /^Times needed/ }).fill("9")
  await t.click(page.getByRole("link", { name: /^Edit Evaluation settings/ }), "no link")
  await t.click(t.discardPrompt().getByRole("button", { name: /^Discard/ }), "no Discard")
  await t.waitFor(() => /evaluation-settings/.test(t.p.url()), () => `the link went to ${t.p.url()}`, ACT)
  await t.waitFor(() => t.p.evaluate(() => document.activeElement?.tagName === "H1"), async () => `focus is on "${await active(t)}" after leaving`, 8000)
})
test("CFG28", "CFG", "Bulk errors: one line per problem, in the page's words, and the banner's count is the sections' N to fix", async (t) => {
  await t.open(hrefOf(["sk-vitals", "sk-handoff", "sk-central-line"]))
  await t.visible(t.main.locator("[data-configure-sections]"), "no sections", ACT)
  await t.openGroup(t.main, "How these skills are judged")
  await t.click(t.main.locator("#cfg-model-binary"), "no tile")
  const sure = t.p.getByRole("alertdialog").getByRole("button", { name: /^Switch/ })
  if (await t.isVisible(sure, 600)) await sure.click()
  await t.click(t.button(/^Save 3 skills$/, t.main), "no Save 3 skills")
  const summary = t.main.locator("[data-region=validation-summary]")
  await t.visible(summary, "no list of problems", QUICK)
  const lines = await summary.getByRole("listitem").allInnerTexts()
  if (new Set(lines).size !== lines.length) fail(`a line repeats: ${lines.join(" | ")}`)
  if (lines.some((l) => /Choose which outcome qualifies/.test(l))) fail(`not in the page's words: ${lines.join(" | ")}`)
  const said = Number((await summary.innerText()).match(/Fix (\d+) problem/)?.[1])
  if (said !== lines.length) fail(`the title says ${said}, the list has ${lines.length}`)
  await t.openGroup(t.main, "Who evaluates")
  const tally = (await t.main.locator("[data-section-problems]").allInnerTexts()).reduce((n, x) => n + Number(x.match(/(\d+) to fix/)?.[1] ?? 0), 0)
  // The open section reads none, so what it holds is the rest.
  if (tally !== said) fail(`the sections' to-fix add up to ${tally}, the banner says ${said}`)
})
test("CFG29", "CFG", "Start from: searchable, and same-name skills read with their category", async (t) => {
  await t.open(hrefOf(["sk-vitals", "sk-handoff"]))
  await t.visible(t.main.locator("[data-configure-sections]"), "no sections", ACT)
  await t.click(t.main.getByRole("combobox", { name: /^Copy settings from/ }), "no Start from")
  const find = t.p.getByRole("combobox", { name: /^Find a skill/ }).or(t.p.getByRole("textbox", { name: /^Find a skill/ }))
  await t.visible(find, "Start from has no search", QUICK)
  await find.first().fill("Irrigation")
  await t.p.waitForTimeout(400)
  const opts = await t.p.getByRole("option").allInnerTexts()
  if (opts.length < 2) fail(`search finds ${opts.length}: ${opts.join(" | ")}`)
  if (new Set(opts).size !== opts.length) fail(`two rows read the same: ${opts.join(" | ")}`)
  if (!opts.some((o) => /\(.+\)/.test(o))) fail(`same-name skills carry no category: ${opts.join(" | ")}`)
})
test("CFG30", "CFG", "Bulk header: three actions and a menu; the primary names the count", async (t) => {
  await t.openBulkConfigure()
  await t.visible(t.button(/^Save 3 skills$/, t.main), "the primary does not read Save 3 skills")
  await t.absent(t.main.getByRole("button", { name: /^Use default configuration$/ }), "Use default configuration stays in the header")
  await t.click(t.main.locator("[data-many-more]").filter({ visible: true }).first(), "no ...")
  await t.visible(t.p.getByRole("menuitem", { name: /^Use default configuration$/ }), "not in the menu", QUICK)
})
test("CFG31", "CFG", "Small: a result is said once with a full stop; a link with one valid id goes to that page; no stray skill param; Mixed fits at 375; one discard wording", async (t) => {
  await t.openBulkConfigure()
  await t.openGroup(t.main, "Who evaluates")
  await t.feedbackSwitch().first().click()
  await t.click(t.button(/^Save 3 skills$/, t.main), "no Save 3 skills")
  await t.expectBannerOnScreen(/3 skills saved\./, "the save")
  await t.waitFor(() => !/[?&]saved=/.test(t.p.url()), () => `the URL keeps saved: ${t.p.url()}`)
  await t.reload()
  await t.p.waitForTimeout(800)
  if (await t.p.locator("[data-region=banner]").filter({ hasText: /saved\./ }).count()) fail("the banner came back on reload")
  await t.open("/lab/admin/configure-skill?skills=sk-vitals,not-a-skill")
  await t.visible(t.p.locator("[data-configure-page]"), "one valid id did not reach the one-skill page", ACT)
  await t.open("/lab/flow/setup-walkthrough/configure?set=1&present=1&skills=sk-vitals,sk-handoff")
  await t.visible(t.main.locator("[data-configure-sections]"), "no sections", ACT)
  if (/[?&]skill=/.test(t.p.url())) fail(`stray skill param: ${t.p.url()}`)
  await t.p.setViewportSize({ width: 375, height: 812 })
  await t.open(hrefOf(["sk-vitals", "hgtc-basic-skills-01"]))
  const need = t.main.getByRole("spinbutton", { name: /^Times needed/ })
  await t.visible(need, "no Times needed", ACT)
  if (await need.getAttribute("placeholder") === "Mixed") {
    const fits = await need.evaluate((el) => { const c = document.createElement("canvas").getContext("2d"); const s = getComputedStyle(el); c.font = s.font; return c.measureText("Mixed").width <= el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) - 16 })
    if (!fits) fail("Mixed clips in Times needed at 375")
  }
  await need.fill("7")
  await t.click(t.main.getByRole("link", { name: /^Cancel$/ }).filter({ visible: true }).first(), "no Cancel")
  const a = await t.discardPrompt().innerText()
  await t.click(t.discardPrompt().getByRole("button", { name: /^Keep editing/ }), "no Keep editing")
  // A second way off, the browser's Back: both ask in the same words.
  await t.p.goBack().catch(() => undefined)
  await t.expectDiscardPrompt("Back")
  const b = await t.discardPrompt().innerText()
  if (a !== b) fail(`two discard wordings: "${a}" and "${b}"`)
  if (!/Your changes have not been saved/.test(a)) fail(`the discard says: ${a}`)
})
test("S13", "S", "Questions: the set goes to skills on the default configuration; Not configured finds 0", async (t) => {
  await t.seededSettings()
  await modelSwitch(t, "Questions")
  await fillQuestions(t, ["Hand hygiene", "Clean field", "Explains each step"])
  await t.click(t.p.locator("#cfg-qrule-all"), "no Every question is answered Yes")
  const text = await t.applySettings()
  if (!/\d+ use them/.test(text)) fail(`dialog does not say who takes the questions: "${text.slice(0, 160)}"`)
  if (/not configured|no questions/i.test(text)) fail(`dialog says skills lose their setup: "${text.slice(0, 160)}"`)
  await t.open(LIB)
  if ((await t.filterConfigCount("Not configured")) !== 0) fail("skills went Not configured after saving questions")
})
test("S14", "S", "A skill with its own questions keeps them; the dialog's counts add up and name it once", async (t) => {
  const own = "Head to Toe Assessment"
  await t.seededSettings()
  await modelSwitch(t, "Questions")
  await fillQuestions(t, ["Hand hygiene", "Clean field", "Explains each step"])
  await t.click(t.p.locator("#cfg-qrule-all"), "no Every question is answered Yes")
  await t.applySettings()
  const panel = await t.openConfigure(own)
  await t.click(panel.getByRole("button", { name: /^Edit questions/ }), "no Edit questions")
  const editor = t.p.getByRole("dialog").last()
  await editor.getByRole("textbox", { name: /Question 1/ }).fill("Own hygiene check")
  await t.click(editor.getByRole("button", { name: /^(Save|Done|Apply)/ }), "no Save on the questions dialog")
  await t.p.waitForTimeout(400)
  await t.click(panel.getByRole("button", { name: /^Save changes/ }), "no Save changes in the panel")
  await t.p.waitForTimeout(700)
  const ask = t.p.getByRole("alertdialog")
  if (await t.isVisible(ask, 500)) { await ask.first().getByRole("button").last().click(); await t.p.waitForTimeout(500) }
  await t.open(SET)
  const qp = t.main
  await t.click(qp.getByRole("button", { name: /^Add a question$/ }), "no Add a question")
  await qp.getByRole("textbox", { name: "Question 4" }).fill("Documents the result")
  await t.pressSaveSettings()
  const d = t.applyDialog().first()
  await t.visible(d, "saving opened no dialog", QUICK)
  const text = (await d.innerText()).replace(/\s+/g, " ")
  const num = (re) => Number(text.match(re)?.[1] ?? 0)
  if (!/1 keep their own/.test(text)) fail(`dialog does not say "1 keep their own": "${text.slice(0, 220)}"`)
  if (/already match/.test(text)) fail(`the skill keeping its own questions also sits on Already on these settings: "${text.slice(0, 220)}"`)
  const title = num(/^Apply to (\d+)/), change = num(/(\d+) will change/), use = num(/(\d+) use them/), button = num(/Apply to (\d+) skills? (?:Close)?$/)
  if (title !== change || title !== use) fail(`title ${title}, will change ${change}, use them ${use}: they should match`)
  if (button && button !== title) fail(`button says ${button}, title says ${title}`)
  await d.getByRole("button", { name: /^Apply/ }).click()
  await t.p.waitForTimeout(800)
  const again = await t.openConfigure(own)
  await t.click(again.getByRole("button", { name: /^Edit questions/ }), "no Edit questions")
  const held = t.p.getByRole("dialog").last()
  if ((await held.getByRole("textbox", { name: /Question 1/ }).inputValue()) !== "Own hygiene check") fail("the skill lost its own questions")
  if (await held.getByRole("textbox", { name: /Question 4/ }).count()) fail("the skill took the fourth question")
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(300)
  if ((await t.panelConfig(again)) !== "Default") fail("the skill no longer reads Default")
})
test("S15", "S", "Score on a scale: no Outcome in the panel; the scale reaches it", async (t) => {
  await t.seededSettings()
  await modelSwitch(t, "Score on a scale")
  await fillQuestions(t, ["Technique"])
  await t.closeSettingsPanel()
  await t.click(t.p.getByRole("combobox", { name: /Top of the score scale/ }), "no scale")
  await t.click(t.p.getByRole("option", { name: "7", exact: true }), "no 7 on the scale")
  await t.closeSettingsPanel()
  await t.click(t.button(/^Preview$/, t.main), "no Preview button")
  const panel = t.dialog().first()
  await t.visible(panel, "Preview opened no dialog", QUICK)
  const tab = panel.getByRole("tab", { name: "Evaluator" })
  if (await t.isVisible(tab, 500)) await tab.click()
  const text = await panel.innerText()
  if (/\bOutcome\b/.test(text)) fail("the panel shows an Outcome on a scored model")
  if (!/1 to 7/.test(text)) fail("the panel does not use the configured scale")
})
// S16 goes through the real thing: the admin's labels, a real evaluator submit, then the student's record. The old script stopped at the dialog and passed while the form said the opposite.
const REQ_MAYA = "/lab/evaluator/evaluation-form?request=sub-maya-1"
const RECORD_MAYA = "/lab/student/skill-detail?student=stu-maya&skill=sk-urinary-cath"
/** Approved or not approved, labels renamed, the second one qualifying, applied. Says how the panel reads it. */
const secondLabelQualifies = async (t, first, second) => {
  await t.seededSettings()
  await modelSwitch(t, "Approved or not approved")
  await t.settingsRow("labels")
  await t.main.getByRole("textbox", { name: /^First label/ }).fill(first)
  await t.main.getByRole("textbox", { name: /^Second label/ }).fill(second)
  const group = t.main.getByRole("radiogroup", { name: /which (one|outcome) (qualifies|counts)/i })
  await t.visible(group, "no Which one qualifies row")
  for (const r of await group.first().getByRole("radio").all()) if (await r.isChecked()) fail("a label is preselected")
  await group.first().getByRole("radio").nth(1).click()
  await t.click(t.button(/^Preview$/, t.main), "no Preview button")
  const pv = t.dialog().first()
  await t.visible(pv, "Preview opened no dialog", QUICK)
  const tab = pv.getByRole("tab", { name: "Evaluator" })
  if (await t.isVisible(tab, 500)) await tab.click()
  const told = await pv.locator("[data-preview-approval]").first().innerText()
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(300)
  if (!told.includes(`${second} counts now`)) fail(`the panel says "${told}"; want ${second} to count now`)
  const text = await t.applySettings()
  if (!/students whose progress changes\s*\d+/i.test(text)) fail(`the dialog names nobody: "${text.slice(0, 160)}"`)
}
/** How many evaluations the record says count: "1 of 3" at the top of the skill's page. */
const recordHave = async (t) => {
  await t.open(RECORD_MAYA)
  const m = (await t.main.innerText()).replace(/\s+/g, " ").match(/View request (\d+) of \d+|(\d+) of \d+/)
  if (!m) fail("the student's record shows no count")
  return Number(m[1] ?? m[2])
}
/** Answers the real form: `choice` on the catheter skill, Met on the second skill, Submit. Returns the receipt line for the catheter skill. */
const submitOnForm = async (t, choice) => {
  await t.open(REQ_MAYA)
  await t.click(t.p.getByRole("radio", { name: choice, exact: true }), `the form does not offer ${choice}`)
  await t.click(t.p.getByRole("radio", { name: "Met", exact: true }), "the second skill offers no Met")
  await t.click(t.button(/^Submit/), "no Submit on the form")
  await t.p.waitForTimeout(800)
  const body = (await t.p.locator("body").innerText()).replace(/\s+/g, " ")
  if (!/Submitted for/.test(body)) fail(`the form did not submit: "${body.slice(0, 200)}"`)
  return body
}
test("S16", "S", "The label marked as qualifying counts on the real form and on the record, labels renamed", async (t) => {
  await secondLabelQualifies(t, "Alpha", "Beta")
  const before = await recordHave(t)
  const receipt = await submitOnForm(t, "Beta")
  if (!/Indwelling urinary catheter insertion Beta Counts now/.test(receipt)) fail(`choosing the qualifying label reads: "${receipt.slice(60, 240)}"`)
  const after = await recordHave(t)
  if (after !== before + 1) fail(`the record went from ${before} to ${after}; want one more`)
})
test("S16b", "S", "The other label does not count, on the real form or on the record", async (t) => {
  await secondLabelQualifies(t, "Alpha", "Beta")
  const before = await recordHave(t)
  const receipt = await submitOnForm(t, "Alpha")
  if (!/Indwelling urinary catheter insertion Alpha Did not meet criteria/.test(receipt)) fail(`choosing the other label reads: "${receipt.slice(60, 240)}"`)
  if (/Signed off\. .* counts? now/.test(receipt)) fail("the receipt's title says it counts")
  const after = await recordHave(t)
  if (after !== before) fail(`the record went from ${before} to ${after}; want no change`)
})
// The same two choices on the older form, /v2: this is the one that said the opposite when the review found it (2026-11-05).
const submitOnV2Form = async (t, choice) => {
  await t.open("/v2/preceptor/preceptor-evaluation?request=sub-maya-1")
  await t.click(t.p.getByRole("radio", { name: choice, exact: true }), `the form does not offer ${choice}`)
  await t.click(t.p.getByRole("radio", { name: "Met", exact: true }), "the second skill offers no Met")
  await t.click(t.p.getByRole("checkbox", { name: /credential|confirm|attest/i }), "no attestation")
  await t.click(t.button(/^Submit/), "no Submit on the form")
  await t.p.waitForTimeout(800)
  const item = t.p.locator('[data-receipt-item="sk-urinary-cath"]')
  await t.visible(item, "the form did not submit")
  return (await item.innerText()).replace(/\s+/g, " ")
}
test("S16d", "S", "v2 form: the qualifying label is told it counts, and the record agrees", async (t) => {
  await secondLabelQualifies(t, "Alpha", "Beta")
  const before = await recordHave(t)
  const line = await submitOnV2Form(t, "Beta")
  if (!/Beta/.test(line) || !/Counts toward Maya's record now/.test(line)) fail(`choosing the qualifying label reads: "${line}"`)
  const after = await recordHave(t)
  if (after !== before + 1) fail(`the record went from ${before} to ${after}; want one more`)
})
test("S16e", "S", "v2 form: the other label is told it does not count, and the record agrees", async (t) => {
  await secondLabelQualifies(t, "Alpha", "Beta")
  const before = await recordHave(t)
  const line = await submitOnV2Form(t, "Alpha")
  if (!/Alpha/.test(line) || !/does not count toward the rule/.test(line) || /Counts toward/.test(line)) fail(`choosing the other label reads: "${line}"`)
  const after = await recordHave(t)
  if (after !== before) fail(`the record went from ${before} to ${after}; want no change`)
})
test("S16c", "S", "Changing which label qualifies names students", async (t) => {
  await secondLabelQualifies(t, "Alpha", "Beta")
  await t.open(SET)
  await t.settingsRow("labels")
  await t.main.getByRole("radiogroup", { name: /which (one|outcome) (qualifies|counts)/i }).first().getByRole("radio").nth(0).click()
  await t.pressSaveSettings()
  const dialog = await t.applyDialog().first().innerText()
  if (!/students whose progress changes\s*\d+/i.test(dialog)) fail(`changing the qualifying label names nobody: "${dialog.replace(/\s+/g, " ").slice(0, 160)}"`)
})
test("S17", "S", "Lab instructor only: the dialog names the real reason, not No questions yet", async (t) => {
  await t.seededSettings()
  await t.settingsRow("signers")
  for (const r of ["Preceptor", "Clinical faculty"]) { const b = t.main.getByRole("checkbox", { name: new RegExp(`^${r}`) }); if (await b.isChecked()) await b.click() }
  await t.main.getByRole("checkbox", { name: /^Lab instructor/ }).click()
  await t.pressSaveSettings()
  const d = t.applyDialog()
  await t.visible(d, "saving opened no dialog", QUICK)
  const text = (await d.first().innerText()).replace(/\s+/g, " ")
  if (/no questions yet/i.test(text)) fail(`a role problem is labelled "No questions yet": "${text.slice(0, 160)}"`)
  if (/become not configured/.test(text) && !/lab instructor/i.test(text)) fail(`no reason named: "${text.slice(0, 160)}"`)
})

for (const bad of ["51", "-3"]) test(`S18${bad === "51" ? "" : "b"}`, "S", `Times needed ${bad}: "Enter 1 to 50." named for its row, in view, no dialog`, async (t) => {
  await t.seededSettings()
  await t.settingsRow("times")
  const need = t.main.getByRole("spinbutton", { name: /needed/i }).first()
  await need.fill(bad)
  await t.pressSaveSettings()
  await t.p.waitForTimeout(300)
  if (await t.isVisible(t.applyDialog(), 300)) fail("a bad number opened the dialog")
  const banner = t.main.locator('[data-region="validation-summary"]')
  await t.visible(banner, "no problems banner", QUICK)
  const text = (await banner.innerText()).replace(/\s+/g, " ")
  if (!/Times needed: [Ee]nter 1 to 50\./.test(text)) fail(`the banner reads "${text}"`)
  if (/minimum/i.test(text)) fail(`the banner talks about minimums: "${text}"`)
  if (!(await need.evaluate((e) => e === document.activeElement))) fail("focus is not on Times needed")
  // Both really on screen, under the chrome, not just in the page.
  const chrome = await t.p.evaluate(() => Math.max(0, ...[...document.querySelectorAll("header, [aria-label='Design lab controls'], [data-lab-bar]")].map((e) => e.getBoundingClientRect().bottom).filter((b) => b < 200)))
  const b = await banner.boundingBox()
  const f = await need.boundingBox()
  if (!b || b.y < chrome - 1 || b.y + b.height > 900) fail(`the banner sits at ${b?.y} to ${(b?.y ?? 0) + (b?.height ?? 0)}, chrome ends at ${chrome}`)
  if (!f || f.y < b.y + b.height || f.y + f.height > 900) fail(`the field sits at ${f?.y}, hidden by or below the banner`)
})
test("S19", "S", "An edit clears Saved; a bad value shows only the problems banner", async (t) => {
  await t.seededSettings()
  await t.settingsRow("times")
  const need = t.main.getByRole("spinbutton", { name: /needed/i }).first()
  await need.fill("2")
  await t.applySettings()
  await t.visible(t.main.getByText(/^Saved for \d+/), "no Saved banner", QUICK)
  await t.settingsRow("times")
  await need.fill("3")
  await t.p.waitForTimeout(250)
  await t.absent(t.main.getByText(/^Saved for \d+/), "Saved stayed after an edit")
  await need.fill("60")
  await t.pressSaveSettings()
  await t.absent(t.main.getByText(/^Saved for \d+/), "Saved shows beside the problems")
  await t.visible(t.main.locator('[data-region="validation-summary"]'), "no problems banner", QUICK)
  if ((await t.main.locator('[data-slot="banner"], [role="alert"], [role="status"]').filter({ hasText: /saved/i }).count()) > 0) fail("a second banner shows")
})
test("S19b", "S", "Double-clicking Apply: the second press does nothing", async (t) => {
  await t.seededSettings()
  const names = () => t.levelBoxes().evaluateAll((a) => a.map((x) => x.value))
  await t.levelNames()
  const before = await names()
  await t.settingsRow("times")
  await t.main.getByRole("spinbutton", { name: /needed/i }).first().fill("2")
  await t.pressSaveSettings()
  const b = await t.applyDialog().first().getByRole("button", { name: /^Apply/ }).boundingBox()
  await t.p.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await t.p.mouse.down(); await t.p.mouse.up()
  await t.p.waitForTimeout(140)
  await t.p.mouse.down(); await t.p.mouse.up()
  await t.p.waitForTimeout(800)
  await t.levelNames()
  if (JSON.stringify(await names()) !== JSON.stringify(before)) fail(`the second press moved a level: ${await names()}`)
  await t.visible(t.main.getByText(/^Saved for \d+/), "the second press cleared Saved", QUICK)
  if (!(await t.saveSettingsButton().first().isDisabled())) fail("Save is enabled again after a double click")
})
test("S20", "S", "Keyboard only: tiles, the Levels radios, a grip moves a level, switch, Save, Esc", async (t) => {
  await t.open(`${SET}?program=new`)
  const focused = () => t.p.evaluate(() => document.activeElement?.id ?? "")
  const press = async (k) => { await t.p.keyboard.down(k); await t.p.waitForTimeout(60); await t.p.keyboard.up(k); await t.p.waitForTimeout(350) }
  await t.main.locator("#cfg-model-demonstration").focus()
  await press("Space")
  if (!(await t.main.locator("#cfg-model-demonstration").isChecked())) fail("Space does not choose a tile")
  await press("ArrowRight")
  if (!(await t.main.locator("#cfg-model-binary").isChecked())) fail("an arrow key does not select the next tile")
  await press("ArrowLeft")
  await t.open(SET)
  // Levels (D-L141): one radio group, highest first; an arrow key moves the cut-off. The grip moves a level with the arrow keys.
  const checked = t.main.locator('#cfg-counts-from [role="radio"][aria-checked="true"]')
  await checked.first().focus()
  const i = Number((await focused()).split("-").pop())
  await press("ArrowUp")
  const j = await focused()
  if (!/^cfg-counts-from-\d+$/.test(j) || j === `cfg-counts-from-${i}` || (await t.main.locator(`#${j}`).getAttribute("aria-checked")) !== "true") fail(`an arrow key in Levels left focus on "${j}" and did not move the cut-off`)
  const names = () => t.p.evaluate(() => [...document.querySelectorAll("input[id^=cfg-level-]")].map((x) => ({ id: x.id, v: x.value })).sort((a, b) => Number(a.id.split("-").pop()) - Number(b.id.split("-").pop())).map((x) => x.v))
  const before = await names()
  await t.main.locator("#cfg-level-grip-0").focus()
  await press("ArrowUp")
  const after = await names()
  if (after[0] !== before[1] || after[1] !== before[0]) fail(`the arrow key on the lowest level's grip left ${after.join(", ")}`)
  if ((await focused()) !== "cfg-level-grip-1") fail(`focus did not stay with the moved level: "${await focused()}"`)
  await t.main.locator("#cfg-self").focus()
  const was = await t.main.locator("#cfg-self").getAttribute("aria-checked")
  await press("Space")
  if ((await t.main.locator("#cfg-self").getAttribute("aria-checked")) === was) fail("Space on a switch does not change it")
  const save = t.saveSettingsButton().first()
  await save.focus()
  await press("Enter")
  await t.visible(t.applyDialog(), "Enter on Save opened no dialog", QUICK)
  await press("Escape")
  if (!(await save.evaluate((e) => e === document.activeElement))) fail("Esc does not return focus to Save")
  // Switch dialog: Keep returns to the held tile.
  await t.main.locator("#cfg-model-demonstration").focus()
  await press("ArrowRight")
  const ask = t.p.getByRole("alertdialog")
  await t.visible(ask, "switching asked nothing", QUICK)
  await press("Escape")
  if ((await focused()) !== "cfg-model-demonstration") fail(`after Keep focus is on "${await focused()}"`)
})

// ------------------------------------------------------------------ K: per-skill settings
test("K1", "K", "Configure 3 skills: title, crumb, rows live, a field they differ on reads Mixed", async (t) => {
  await t.openBulkConfigure()
  const crumbs = (await t.p.getByRole("navigation", { name: /location|breadcrumb/i }).first().innerText()).replace(/\s+/g, " ")
  if (!/Skills.*Library.*3 skills/.test(crumbs)) fail(`crumb reads "${crumbs}"`)
  if (!(await t.main.getByText(/Mixed/).count()) && !(await t.main.getByRole("spinbutton", { name: /needed/i }).first().getAttribute("placeholder"))) fail("no field reads Mixed")
  await t.openGroup(t.main, "What the student does")
  await t.visible(t.main.getByRole("switch").first(), "no live switch")
})
test("K2", "K", "Minimum larger than Times needed: blocked, reason, focus", async (t) => {
  await t.openBulkConfigure()
  const add = t.action(/^Add( a)? minimum/, t.main)
  if (!(await t.isVisible(add, 1200))) fail('no "Add minimum" on the bulk page (map G9, a separate build)')
  await add.first().click()
  await t.click(t.p.getByRole("menu").locator("[data-minimum-kind=setting]").first(), "no clinical setting in the Add minimum menu")
  await t.p.waitForTimeout(400)
  const num = t.main.getByRole("spinbutton", { name: /minimum|at least/i }).last()
  await t.visible(num, "no number field for the minimum")
  await num.fill("999")
  await t.click(t.button(/^Save/, t.main), "no Save")
  await t.p.waitForTimeout(500)
  await t.visible(t.main.getByRole("alert"), "no reason shown for the blocked Save", QUICK)
  if (await t.isVisible(t.applyDialog(), 300)) fail("Save opened a dialog despite the bad minimum")
  if (!(await num.evaluate((e) => e === document.activeElement))) fail("focus is not on the minimum field")
})
const K_NAMES = [BP, "Height", "Weight"]
/** Set Feedback required for the 3 skills on the bulk page and save, whichever control it has while they agree. */
async function bulkFeedback(t) {
  await t.openBulkConfigure(K_NAMES)
  await t.openGroup(t.main, "Who evaluates")
  const sw = t.feedbackSwitch()
  await t.visible(sw, "no Feedback required switch on the bulk page")
  await sw.first().click()
  const on = (await sw.first().getAttribute("aria-checked")) === "true"
  await t.click(t.button(/^Save 3 skills$/, t.main), "no Save 3 skills")
  return on
}
test("K3", "K", "Change Feedback, Save: nobody's progress moves, so no dialog; Library, selection cleared; the 3 read Custom, others unchanged", async (t) => {
  await bulkFeedback(t)
  await t.absent(t.p.locator("[data-many-impact]"), "a dialog opened with no progress to change")
  await t.expectBannerOnScreen(/3 skills saved\./, "bulk save")
  await t.visible(t.main.getByRole("heading", { level: 1, name: /library/i }), "Save did not land in the Library")
  await t.absent(t.button(/clear( selection)?$/i, t.main), "the selection was not cleared")
  for (const n of K_NAMES) if ((await t.rowConfig(n)) !== "Custom") fail(`${n} reads ${await t.rowConfig(n)}; want Custom`)
  if ((await t.rowConfig("Bowel Sounds")) !== "Default") fail(`an unselected skill reads ${await t.rowConfig("Bowel Sounds")}`)
  await t.leaveAndReturn(LIB)
  if ((await t.rowConfig(BP)) !== "Custom") fail(`after reload ${BP} reads ${await t.rowConfig(BP)}`)
})
test("K4", "K", "Program change: these 3 counted under keep their settings, unchanged", async (t) => {
  const mine = await bulkFeedback(t)
  await t.seededSettings()
  const sw = t.feedbackSwitch()
  await t.visible(sw, "no Feedback required switch on Evaluation settings")
  await sw.first().click()
  await t.pressSaveSettings()
  const d = t.applyDialog()
  await t.visible(d, "changing a setting opened no dialog", QUICK)
  const text = (await d.first().innerText()).replace(/\s+/g, " ")
  const m = text.match(/(\d+) keep their settings/)
  if (!m || +m[1] < 15) fail(`dialog says "${m?.[0] ?? "nothing"}"; want the 12 seeded plus these 3`)
  await d.first().getByRole("button", { name: /^Apply/ }).click()
  await t.p.waitForTimeout(700)
  const page = await t.openConfigure()
  await t.openGroup(page, "Who evaluates")
  const again = (await page.getByRole("switch", { name: /^Feedback is required/ }).getAttribute("aria-checked")) === "true"
  if (again !== mine) fail("the skill's own Feedback setting changed")
})
test("K5", "K", "Use default configuration on the 3: Default on all", async (t) => {
  await bulkFeedback(t)
  await t.openBulkConfigure(K_NAMES)
  await t.click(t.main.locator("[data-many-more]").filter({ visible: true }).first(), "no ... on the bulk page")
  await t.click(t.p.getByRole("menuitem", { name: /^Use default configuration$/ }), "no Use default configuration in the menu")
  // Nobody's progress moves here, so it applies at once and the banner says what happened (map D4).
  await t.absent(t.p.locator("[data-impact-dialog]"), "a dialog opened with nothing to say")
  await t.expectBannerOnScreen(/3 skills use the default configuration\./, "Use default configuration")
  await t.p.waitForTimeout(400)
  for (const n of K_NAMES) if ((await t.rowConfig(n)) !== "Default") fail(`${n} reads ${await t.rowConfig(n)}`)
})
test("K7", "K", "Configure with one row selected opens that skill's full page, not the bulk page", async (t) => {
  await t.open(LIB)
  await t.selectRows([BP])
  await t.click(t.action(/^Configure 1 skill$/, t.main), "no Configure 1 skill")
  const page = await t.configurePage()
  await t.visible(page.getByRole("heading", { level: 1, name: BP }), "the page opened on another skill")
  if (/skills=/.test(t.p.url())) fail("the bulk page opened")
})
test("K6", "K", "Add minimum: clinical settings only", async (t) => {
  await t.openBulkConfigure()
  const add = t.action(/^Add minimum/, t.main)
  await t.visible(add, "no Add minimum on the bulk page")
  await add.first().click()
  const settings = t.p.getByRole("menu").locator("[data-minimum-kind=setting]")
  await t.visible(settings.first(), "no clinical setting in the Add minimum menu", QUICK)
  const opts = await settings.allInnerTexts()
  if (!opts.length) fail("the setting list offers nothing")
  const bad = opts.find((o) => /\b(lab|simulation)\b/i.test(o))
  if (bad) fail(`setting list offers "${bad.trim()}"`)
})

// ------------------------------------------------------------------ C: categories and tags
test("C1", "C", "Add a category: row added, one filled button, persists", async (t) => {
  await t.open(CATS)
  const name = unique("Airway test")
  await t.click(t.action(/^Add a category$/, t.main), "no Add a category")
  await t.p.waitForTimeout(300)
  const box = t.main.getByRole("textbox", { name: /category|name/i }).first()
  await t.visible(box, "Add a category opened no name box")
  await box.fill(name)
  await box.press("Enter")
  await t.p.waitForTimeout(500)
  await t.visible(t.main.getByRole("row", { name: new RegExp(esc(name)) }), "new category row not added")
  const filled = await t.filledButtons()
  if (filled.length !== 1 || !/^Add/.test(filled[0])) fail(`filled buttons read ${filled.join(", ") || "none"}; want one Add button`)
  await t.leaveAndReturn(CATS)
  await t.visible(t.main.getByRole("row", { name: new RegExp(esc(name)) }), "new category gone after reload")
})
test("C2", "C", "Skills count opens the Library filtered, row count equal", async (t) => {
  await t.open(CATS)
  const btn = t.main.getByRole("button", { name: /^Assessment: \d+ skills?/ }).or(t.main.getByRole("row", { name: /^Assessment/ }).getByRole("link", { name: /\d/ }))
  await t.visible(btn, "no count on the Assessment row")
  const n = +(await btn.first().innerText()).match(/\d+/)?.[0]
  await btn.first().click()
  await t.afterNav(1500)
  const lib = t.main.getByRole("heading", { level: 1, name: /library/i })
  if (!(await t.isVisible(lib, QUICK))) fail(`count opened ${t.p.url()} rather than the Library${(await t.isVisible(t.dialog(), 300)) ? " (a dialog opened in place)" : ""}`)
  await t.settle()
  if ((await t.rowCount()) !== n) fail(`Library shows ${await t.rowCount()} rows; the count said ${n}`)
})
test("C3", "C", "Status switch on a used category: at once, no dialog, Inactive and last after reload, skills keep it Inactive, not offered in Add a skill", async (t) => {
  await t.open(CATS)
  const name = "Airway"
  await t.click(t.main.getByRole("switch", { name: `${name} active`, exact: true }), "no Status switch on the row")
  await t.p.waitForTimeout(400)
  await t.absent(t.p.getByRole("alertdialog"), "the switch opened a dialog")
  if (!/Inactive/.test(await t.main.getByRole("row", { name: new RegExp(`^${name}`) }).first().innerText())) fail("the row does not read Inactive beside the switch")
  await t.click(t.button(new RegExp(`^Actions for ${name}$`), t.main), "no row menu")
  await t.absent(t.p.getByRole("menuitem", { name: /^(Deactivate|Reactivate)/ }), "the row menu still offers the verb")
  await t.p.keyboard.press("Escape")
  await t.leaveAndReturn(CATS)
  const rows = t.main.getByRole("row", { name: new RegExp(`^${name}`) })
  if (!/Inactive/.test(await rows.first().innerText())) fail("category row does not read Inactive after reload")
  if (!/Inactive/.test(await t.main.locator("tbody tr").last().innerText())) fail("the inactive row is not sorted last")
  await t.open(`${LIB}`)
  await t.click(t.button(/^Add a skill$/, t.main), "no Add a skill")
  const sheet = t.dialog().first()
  await t.click(sheet.getByRole("button", { name: /^Category/ }), "no Category control")
  await t.visible(t.p.getByRole("option").nth(1), "picker offers nothing, cannot judge", QUICK)
  await t.absent(t.p.getByRole("option", { name: name, exact: true }), `deactivated "${name}" is offered in Add a skill`)
  await t.p.keyboard.press("Escape")
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(400)
  if (await t.isVisible(t.discardPrompt(), 300)) await t.discardPrompt().getByRole("button", { name: /^Discard/ }).click()
  await t.open(LIB)
  const body = await t.main.innerText()
  if (!new RegExp(`${name}[\\s\\S]{0,40}Inactive`).test(body)) fail(`skills in "${name}" do not show it marked Inactive`)
})
test("C4", "C", "Row with skills: Delete disabled with a reason", async (t) => {
  await t.open(CATS)
  await t.click(t.button(/^Actions for Airway$/, t.main), "no row menu")
  const del = t.p.getByRole("menuitem", { name: /^Delete/ })
  await t.visible(del, "no Delete in the row menu", QUICK)
  if ((await del.first().getAttribute("aria-disabled")) !== "true" && (await del.first().getAttribute("data-disabled")) === null) fail("Delete is enabled on a used category")
  const text = (await del.first().innerText()).replace(/\s+/g, " ")
  const near = (await t.p.getByRole("menu").first().innerText()).replace(/\s+/g, " ")
  if (!/used|cannot|has \d|\d+ skill/i.test(text) && !/cannot be deleted/i.test(near)) fail(`no reason shown; Delete reads "${text}"`)
})

// ------------------------------------------------------------------ T: skill lists (one page, one table, one panel; D-L106)
test("T1", "T", "New skill list: Name, a drawing with Write a skill and Choose from library, no Create; the library is a level with search and ticks", async (t) => {
  await t.openNewList()
  const d = t.dialog().first()
  await t.absent(d.getByRole("button", { name: /^Create$/ }), "a Create button is back")
  const first = t.p.locator("[data-no-skills-yet]")
  await t.visible(first.locator("svg"), "no drawing while the list is empty")
  await t.visible(first.getByRole("button", { name: /^Write a skill$/ }), "no Write a skill under the drawing")
  await t.click(first.getByRole("button", { name: /^Choose from library$/ }), "no Choose from library under the drawing")
  const picker = t.p.locator("[data-new-list-library]")
  await t.visible(picker.getByRole("searchbox"), "the library level has no search")
  await t.visible(picker.getByRole("checkbox").first(), "the library level has no skills to select")
})
test("T2", "T", "Add 5 from the library, Next: table row 5 and a muted Not assigned, no button in the cell; persists", async (t) => {
  const name = unique("Test list")
  await t.openNewList(name)
  await t.pickFive()
  await t.saveNewList()
  const check = async () => {
    const row = t.listRow(name)
    await t.visible(row, "table has no row for the list")
    const text = (await row.first().innerText()).replace(/\s+/g, " ")
    if (!/\b5\b/.test(text) || !/Not assigned/.test(text)) fail(`row reads "${text.slice(0, 80)}"; want 5 skills, Not assigned`)
    if (/\b(Draft|Live)\b/.test(text)) fail(`row still says a state word: "${text.slice(0, 80)}"`)
    await t.absent(row.first().getByRole("button", { name: /^Assign/ }).or(row.first().getByRole("link", { name: /^Assign/ })), "a cell still has Assign")
  }
  await check()
  await t.leaveAndReturn(LISTS)
  await check()
})
test("T3", "T", "A list not yet assigned: its panel has Assign to students as the one filled button", async (t) => {
  const name = unique("Test list")
  await t.openNewList(name)
  await t.pickFive()
  const panel = await t.saveNewList()
  await t.visible(panel.getByText("Not assigned yet."), "the panel does not read Not assigned yet.")
  const add = panel.getByRole("button", { name: /^Assign to students$/ })
  await t.visible(add, "the panel has no Assign to students")
  if ((await add.first().getAttribute("data-variant")) !== "default") fail("Assign to students is not the filled button")
  if ((await panel.locator("[data-slot=button][data-variant=default]").count()) !== 1) fail("the panel has more than one filled button")
})
test("T4", "T", "An assigned list: View all is read only, with Change skills on the panel", async (t) => {
  await t.open(LISTS)
  const panel = await t.openListPanel("list-core")
  await t.visible(panel.getByRole("button", { name: /^Change skills$/ }), "assigned list panel has no Change skills")
  await t.click(panel.getByRole("button", { name: /^View all/ }), "no View all")
  await t.visible(panel.locator("[data-skill-rows] > li").first(), "panel shows no skills")
  await t.absent(panel.getByRole("checkbox"), "assigned list panel has checkboxes to change it")
  await t.absent(panel.getByRole("button", { name: /^(Save|Edit)/ }), "assigned list panel can be saved")
  if (/\b(Draft|Live)\b/.test(await panel.innerText())) fail("the panel says a state word")
})
test("T5", "T", "Assigned row menu: Rename, Change skills, nothing else", async (t) => {
  await t.open(LISTS)
  const row = t.assignedListRows().filter({ hasNotText: /Default/ }).first()
  await t.click(row.getByRole("button", { name: /^Actions/ }), "no menu on an assigned list")
  const labels = await t.menuLabels()
  if (!same(labels, ["Rename", "Change skills"])) fail(`menu holds ${labels.join(", ")}; want Rename, Change skills`)
})
test("T6", "T", "Change skills: nothing is made until Save as new list; then {name} v2, Not assigned; original unchanged; persists", async (t) => {
  await t.open(LISTS)
  const name = "Core clinical skills"
  const row = t.listRow(name).first()
  const before = (await row.innerText()).replace(/\s+/g, " ")
  await t.click(row.getByRole("button", { name: /^Actions/ }), "no menu on an assigned list")
  await t.click(t.p.getByRole("menuitem", { name: /^Change skills/ }), "no Change skills")
  await t.p.waitForTimeout(800)
  const panel = t.dialog().first()
  await t.absent(t.listRow(`${name} v2`), "a new list exists before Save")
  await panel.getByRole("checkbox").first().click()
  await t.click(panel.getByRole("button", { name: /^Save as new list/ }), "no Save as new list")
  await t.p.waitForTimeout(800)
  const check = async () => {
    const v2 = t.listRow(`${name} v2`)
    await t.visible(v2, `no row "${name} v2"`)
    const text = (await v2.first().innerText()).replace(/\s+/g, " ")
    if (!/Not assigned/.test(text)) fail(`v2 row reads "${text.slice(0, 80)}"; want Not assigned`)
    if (/BSN|Accelerated|Enrolled/.test(text)) fail(`v2 row is on a group: "${text.slice(0, 80)}"`)
    const orig = (await t.main.locator('tr:has([data-list-link="list-core"])').innerText()).replace(/\s+/g, " ")
    if (orig !== before) fail(`original row changed: "${orig.slice(0, 80)}" was "${before.slice(0, 80)}"`)
  }
  await check()
  await t.leaveAndReturn(LISTS)
  await check()
})
test("T7", "T", "The toggle moves the default: a note names who holds it, the badge moves, only one; on the default it cannot be turned off", async (t) => {
  await t.open(LISTS)
  const panel = await t.openListPanel("list-core")
  const note = panel.locator("[data-default-note]")
  if (!/New groups get Clinical skills checklist now\./.test(await note.innerText())) fail(`note reads "${await note.innerText()}"`)
  await t.click(panel.getByRole("switch"), "no toggle")
  await t.p.waitForTimeout(700)
  await t.leaveAndReturn(LISTS)
  const defaults = await t.main.getByRole("row", { name: / Default / }).allInnerTexts()
  if (defaults.length !== 1) fail(`${defaults.length} lists read Default after reload`)
  if (!defaults[0].includes("Core clinical skills")) fail(`Default is on "${defaults[0].replace(/\s+/g, " ").slice(0, 50)}"`)
  const again = await t.openListPanel("list-core")
  if (!(await again.getByRole("switch").isDisabled())) fail("the toggle can be turned off on the default")
  await t.closePanel()
  const was = await t.openListPanel("list-clinical")
  if (!/New groups get Core clinical skills now\./.test(await was.locator("[data-default-note]").innerText())) fail("the old default's note does not name the new one")
})
test("T8", "T", "No Map to courses, no New student group, in the table or its menus", async (t) => {
  await t.open(LISTS)
  await t.visible(t.main.getByRole("table"), "no skill list table")
  const bad = /Map to courses|New student group/i
  await t.absent(t.action(bad, t.main), "the page has Map to courses or New student group")
  const menus = t.main.getByRole("button", { name: /^Actions/ })
  const n = await menus.count()
  if (!n) fail("no row menus to check")
  for (let i = 0; i < n; i++) {
    await menus.nth(i).click()
    const labels = await t.menuLabels()
    const hit = labels.find((l) => bad.test(l))
    if (hit) fail(`a row menu has "${hit}"`)
    await t.p.keyboard.press("Escape")
    await t.p.waitForTimeout(150)
  }
})
test("T9", "T", "No state word and no Status column; an unassigned list's menu is Rename, Delete; Edit skills opens the picker", async (t) => {
  await t.open(LISTS)
  const text = (await t.main.innerText()).replace(/\s+/g, " ")
  if (/\b(Live|Draft)\b/.test(text)) fail(`the page still says ${text.match(/\b(Live|Draft)\b/)[0]}`)
  const heads = (await t.main.getByRole("columnheader").allInnerTexts()).map((h) => h.trim()).filter(Boolean)
  if (heads.some((h) => /^Status/.test(h))) fail(`a Status column remains: ${heads.join(", ")}`)
  const row = t.unassignedListRows().first()
  await t.visible(row, "the seed's unassigned list is not in the table")
  await t.click(row.getByRole("button", { name: /^Actions/ }), "no menu on an unassigned list")
  const labels = await t.menuLabels()
  if (!same(labels, ["Rename", "Delete"])) fail(`menu holds ${labels.join(", ")}; want Rename, Delete`)
  await t.p.keyboard.press("Escape")
  const panel = await t.openListPanel("list-clinical-2027")
  await t.click(panel.getByRole("button", { name: /^Edit skills$/ }), "no Edit skills")
  await t.visible(panel.getByRole("checkbox"), "no picker")
})

// ------------------------------------------------------------------ N: who a list is assigned to, in the panel and Add students (D-L106)
test("N1", "N", "An old Assign link opens Skill lists on that list's panel; Assign to students offers All or Specific, with one search box", async (t) => {
  await t.open(`${ASSIGN}&list=list-core`)
  await t.visible(t.main.getByRole("heading", { level: 1, name: /^Skill lists$/ }), 'title is not "Skill lists"')
  const panel = t.dialog().first()
  await t.visible(panel.getByRole("heading", { name: "Core clinical skills" }), "the old link did not open that list's panel")
  if (/view=assign/.test(t.p.url())) fail(`the URL still says view=assign: ${t.p.url()}`)
  await t.absent(t.button(/^Save$/, t.main), "the page has a Save")
  await t.absent(t.main.getByRole("combobox", { name: /^Skill list/ }), "the page has a list select")
  await t.click(panel.getByRole("button", { name: /^Assign to students$/ }), "no Assign to students")
  const d = t.p.locator("[data-add-dialog]")
  await t.visible(d, "no level")
  await t.visible(d.getByRole("radio", { name: /^All students/ }), "no All students choice")
  const specific = d.getByRole("radio", { name: /^Specific/ })
  await specific.check()
  await t.p.waitForTimeout(200)
  if ((await d.getByRole("searchbox").count()) !== 1) fail("Assign to students does not have one search box")
  await t.visible(d.getByRole("heading", { name: "Student groups", exact: true }), "no heading Student groups")
  await t.visible(d.getByRole("button", { name: /^Filters/ }), "no Filters")
  await t.visible(d.getByRole("button", { name: /^New student group$/ }), "no New student group")
  if (/Which students|goes to \d/.test(await d.innerText())) fail("old words on the level")
})
test("N2", "N", "Add a group: the button names the count, added at once, panel shows the row, banner with Undo, table shows it, persists", async (t) => {
  const free = await t.groupWithoutList()
  if (!free.length) fail("every student group is already on a list, so this script has no group to pick")
  const g = free[0]
  await g.box.click()
  const d = t.p.locator("[data-add-dialog]")
  const add = assignBtn(d)
  const n = +((await add.innerText()).match(/\d+/)?.[0] ?? 0)
  if (!n) fail(`the button reads "${await add.innerText()}"`)
  await add.click()
  await t.p.waitForTimeout(600)
  await t.absent(d, "the dialog did not close")
  const b = await t.expectBanner(new RegExp(`assigned to ${esc(g.name)}`), "add a group")
  await t.visible(t.action(/^Undo$/, b), "no Undo")
  const panel = t.dialog().first()
  await t.visible(panel.getByRole("button", { name: `Remove ${g.name} from Core clinical skills` }), "the panel has no new row")
  await t.absent(t.action(/^Map to courses$/, b), "banner has Map to courses")
  await t.leaveAndReturn(LISTS)
  if (!(await t.listRow("Core clinical skills").first().innerText()).includes(g.name)) fail(`Skill lists does not show "${g.name}" after reload`)
})
test("N3", "N", "Someone on another list: nothing until ticked, then a muted Also on, and no choice", async (t) => {
  const d = await t.openAddStudents()
  await t.absent(d.locator("[data-add-note]").filter({ hasText: "Also on" }), "an unticked row reads Also on")
  // BSN 2027 is on Practicum competencies (N5), and Core clinical skills does not have it.
  const row = d.locator("[data-add-groups] li").filter({ hasText: /^BSN 2027/ }).first()
  await t.visible(row, "no group on another list to try")
  await row.getByRole("checkbox").click()
  await t.p.waitForTimeout(300)
  await t.visible(row.getByText(/^Also on /), "the ticked row does not read Also on")
  await t.absent(row.getByRole("radio"), "the row offers a choice")
  await t.absent(t.p.getByRole("radio", { name: /Keep both|Move off/ }), "Keep both or Move off is still offered")
  await t.absent(t.p.getByRole("alertdialog"), "selecting opened a question")
})
test("N4", "N", "Remove the only list: a question first, saying who has no list; then at once, with Undo", async (t) => {
  await t.open(LISTS)
  const panel = await t.openListPanel("list-core")
  await t.click(panel.getByRole("button", { name: "Remove BSN 2026 from Core clinical skills" }), "no x on BSN 2026")
  const a = t.p.getByRole("alertdialog")
  await t.visible(a, "no question before leaving students with no list", QUICK)
  const text = (await a.innerText()).replace(/\s+/g, " ")
  if (!/Remove BSN 2026 from Core clinical skills\?/.test(text) || !/38 students will have no skill list\. Their evaluations are kept\./.test(text)) fail(`the question reads "${text.slice(0, 120)}"`)
  await t.click(a.getByRole("button", { name: /^Remove BSN 2026$/ }), "no Remove")
  await t.p.waitForTimeout(500)
  const b = await t.expectBanner(/BSN 2026 removed from Core clinical skills/, "remove")
  await t.visible(panel.getByText("Not assigned yet."), "the panel still lists someone")
  await t.click(t.action(/^Undo$/, b), "no Undo")
  await t.p.waitForTimeout(500)
  await t.visible(panel.getByRole("button", { name: "Remove BSN 2026 from Core clinical skills" }), "Undo did not put it back")
})
test("N5", "N", "Remove a group that keeps another list: at once, no question, banner with Undo", async (t) => {
  await t.open(LISTS)
  const panel = await t.openListPanel("list-competencies")
  await t.click(panel.getByRole("button", { name: "Remove BSN 2027 from Practicum competencies" }), "no x on BSN 2027")
  await t.p.waitForTimeout(400)
  await t.absent(t.p.getByRole("alertdialog"), "it asked, though the group keeps another list")
  const b = await t.expectBanner(/BSN 2027 removed from Practicum competencies/, "remove")
  await t.visible(t.action(/^Undo$/, b), "no Undo")
  await t.absent(panel.getByRole("button", { name: "Remove BSN 2027 from Practicum competencies" }), "the row stayed")
})
test("N6", "N", "New student group opens in the same panel with the students listed; Back returns with nothing lost", async (t) => {
  const d = await t.openAddStudents()
  await t.click(d.getByRole("button", { name: /^New student group$/ }), "no New student group")
  const form = t.p.locator("[data-new-group-form]")
  await t.visible(form, "the form did not open in the panel")
  await t.visible(form.getByRole("checkbox").first(), "no students to tick by default")
  await t.click(t.dialog().first().getByRole("button", { name: /^Back to Assign to students$/ }), "no Back")
  await t.visible(t.p.locator("[data-add-dialog]"), "Back did not return to Assign to students")
})
test("N7", "N", "Add by search: one found and added; Skill lists reads \"BSN 2026 + 1 student\"; persists", async (t) => {
  const d = await t.openAddStudents()
  await d.getByRole("searchbox").fill("Abigail Yarborough")
  await t.p.waitForTimeout(400)
  await t.absent(d.locator("[data-add-groups] li"), "the search left groups that do not match")
  await d.locator("[data-add-student-rows] > li").first().getByRole("checkbox").click()
  const add = assignBtn(d)
  if ((await assignText(d)) !== "Assign to 1 student") fail(`the button reads "${await assignText(d)}"`)
  await add.click()
  await t.p.waitForTimeout(600)
  await t.expectBanner(/Core clinical skills assigned to Abigail Yarborough/, "add one student")
  await t.visible(t.dialog().first().locator('[data-assigned-row="student"]'), "the panel has no student row")
  await t.leaveAndReturn(LISTS)
  const row = (await t.listRow("Core clinical skills").first().innerText()).replace(/\s+/g, " ")
  if (!/BSN 2026 \+ 1 student\b/.test(row)) fail(`Skill lists reads "${row.slice(0, 80)}"`)
})
test("N8", "N", "Add by filter: chips remove, Select all takes what is shown, the button names it, a snapshot by name; persists", async (t) => {
  const d = await t.openAddStudents()
  await t.click(d.getByRole("button", { name: /^Filters/ }), "no Filters button")
  const panel = t.p.locator("[data-filters-panel]")
  await t.visible(panel, "no Filters panel")
  await panel.getByRole("combobox", { name: "Cohort" }).click()
  await t.p.getByRole("option", { name: "BSN 2028" }).click()
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(400)
  await t.visible(d.getByRole("button", { name: /^Remove Cohort BSN 2028/ }), "no removable chip")
  await t.absent(d.locator("[data-add-groups] li"), "groups still show while a filter is on")
  const rows = await d.locator("[data-add-student-rows] > li").count()
  if (rows !== 42) fail(`${rows} rows for BSN 2028; want 42`)
  await t.click(d.locator("[data-select-all]"), "no Select all")
  const add = assignBtn(d)
  if ((await assignText(d)) !== "Assign to 42 students") fail(`the button reads "${await assignText(d)}"`)
  await add.click()
  await t.p.waitForTimeout(800)
  await t.expectBanner(/Core clinical skills assigned to/, "add by filter")
  // More than five named students are one row that opens to the names; the groups stay listed.
  const assigned = t.dialog().first()
  await t.visible(assigned.getByRole("button", { name: "Remove BSN 2026 from Core clinical skills" }), "the group row went")
  await t.absent(assigned.locator('[data-assigned-row="student"]'), "named students are listed before the row is opened")
  const named = assigned.locator("[data-assigned-named-toggle]")
  if (!/^42 students$/.test((await named.innerText()).trim())) fail(`the row reads "${await named.innerText()}"`)
  await named.click()
  await t.p.waitForTimeout(300)
  const names = await assigned.locator('[data-assigned-row="student"]').count()
  if (names !== 42) fail(`${names} names after opening; want 42`)
  if ((await assigned.locator('[data-assigned-row="student"] button[aria-label^="Remove "]').count()) !== 42) fail("not every name has its x")
  await t.leaveAndReturn(LISTS)
  if (!/\+ 42 students\b/.test((await t.listRow("Core clinical skills").first().innerText()).replace(/\s+/g, " "))) fail("Skill lists does not read the students")
})
test("N9", "N", "Anyone already on the list: ticked, disabled, Has it", async (t) => {
  const d = await t.openAddStudents()
  const has = d.locator("[data-add-groups] li").filter({ hasText: /^BSN 2026/ })
  await t.visible(has.getByText("Has it"), "BSN 2026 does not read Has it")
  const box = has.getByRole("checkbox")
  if (!(await box.isChecked()) || !(await box.isDisabled())) fail("BSN 2026 is not ticked and disabled")
  await t.click(d.getByRole("button", { name: /^Filters/ }), "no Filters button")
  await t.p.locator("[data-filters-panel]").getByRole("combobox", { name: "Cohort" }).click()
  await t.p.getByRole("option", { name: "BSN 2026" }).click()
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(400)
  const student = d.locator("[data-add-student-rows] > li").filter({ hasText: "Has it" }).first()
  await t.visible(student, "no student reads Has it")
  if (!(await student.getByRole("checkbox").isDisabled())) fail("a student who has it can be changed")
})

// ------------------------------------------------------------------ M: course mapping
test("M1", "M", "Toggle three views on the same page, URL keeps view", async (t) => {
  await t.open(MAP)
  const path = new URL(t.p.url()).pathname
  const urls = []
  for (const v of ["By skill", "By course", "Coverage"]) {
    const c = t.main.getByRole("radio", { name: v }).or(t.main.getByRole("tab", { name: v }))
    if (!(await t.isVisible(c, 1200))) fail(`no ${v} view; the toggle has ${(await t.main.getByRole("radiogroup", { name: "View" }).getByRole("radio").allInnerTexts()).join(", ")}`)
    const from = t.p.url()
    await c.first().click()
    await t.p.waitForTimeout(1000)
    for (let i = 0; i < 16 && t.p.url() === from; i++) await t.p.waitForTimeout(500) // the view is written to the URL a moment later
    const u = new URL(t.p.url())
    if (u.pathname !== path) fail(`${v} changed the route to ${u.pathname}`)
    urls.push(u.search)
    await t.reload()
    const again = t.main.getByRole("radio", { name: v, checked: true }).or(t.main.getByRole("tab", { name: v, selected: true }))
    if (!(await t.isVisible(again, 5000))) fail(`URL did not keep ${v} across a reload`)
  }
  if (new Set(urls).size !== 3) fail(`URL does not differ per view: ${urls.join(", ")}`)
})
test("M2", "M", "Set a level: Save enables; reload without saving prompts and leaves it unchanged", async (t) => {
  await t.openMapBySkill()
  const save = t.mapSave()
  if (!(await t.isVisible(save, 1000))) fail("no Save on Course mapping: levels write silently")
  if (await save.first().isEnabled()) fail("Save is enabled before a change")
  const before = await t.levelMap()
  await t.setLevel(0)
  if (!(await save.first().isEnabled())) fail("Save did not enable after setting a level")
  await t.reload()
  if (!t.unloads) fail("reload with an unsaved level gave no discard prompt")
  if (!same(await t.levelMap(), before)) fail("levels changed after reloading without saving")
})
test("M3", "M", "Save: banner names skill and count, only that offering changed, persists", async (t) => {
  await t.openMapBySkill()
  const save = t.mapSave()
  if (!(await t.isVisible(save, 1000))) fail("no Save on Course mapping: levels write silently")
  const before = await t.levelMap()
  const lvl = await t.setLevel(0)
  const key = t.lastKey
  await save.first().click()
  await t.p.waitForTimeout(600)
  await t.expectBanner(new RegExp(`${esc(BP)}.*1 offering`, "i"), "save mapping")
  const url = t.p.url().replace(BASE, "")
  await t.leaveAndReturn(url)
  const after = await t.levelMap()
  if (after[key] !== lvl) fail(`${key} reads ${after[key]} after reload; want ${lvl}`)
  if (!same({ ...after, [key]: 0 }, { ...before, [key]: 0 })) fail("other offerings changed too")
})
test("M4", "M", "Same skill, different levels on two offerings: both kept", async (t) => {
  await t.openMapBySkill()
  const save = t.mapSave()
  if (!(await t.isVisible(save, 1000))) fail("no Save on Course mapping: levels write silently")
  const a = await t.setLevel(0)
  const keyA = t.lastKey
  const b = await t.setLevel(1, a)
  const keyB = t.lastKey
  await save.first().click()
  await t.p.waitForTimeout(600)
  const url = t.p.url().replace(BASE, "")
  await t.leaveAndReturn(url)
  const after = await t.levelMap()
  if (after[keyA] !== a || after[keyB] !== b) fail(`rows read ${after[keyA]}, ${after[keyB]}; want ${a}, ${b}`)
})
test("M5", "M", "By course: figures shown, they change after M3", async (t) => {
  await t.open(MAP)
  await t.click(t.main.getByRole("radio", { name: "By course" }).or(t.main.getByRole("tab", { name: "By course" })), "no By course view")
  await t.p.waitForTimeout(800)
  const legend = t.main.locator("[data-level-legend]")
  await t.visible(legend, "no Mapped and Mandatory figures")
  const body = await legend.innerText()
  if (!/mapped/i.test(body) || !/mandatory/i.test(body)) fail("no Mapped and Mandatory figures")
  const rowName = "NUR 101"
  const rowTextOf = async () => (await t.main.locator("[data-pick-row]").filter({ hasText: rowName }).first().innerText()).replace(/\s+/g, " ")
  const before = await rowTextOf()
  await t.openMapBySkill()
  const save = t.mapSave()
  if (!(await t.isVisible(save, 1000))) fail("figures cannot be retested: no Save on Course mapping")
  const box = t.main.getByRole("row").getByRole("combobox", { name: new RegExp(`in ${rowName}, Fall`) }).first()
  const current = (await box.innerText()).trim() // read first: an open select hides the rest of the page from roles
  await box.click()
  const opts = t.p.getByRole("option")
  await opts.filter({ hasNotText: current }).filter({ hasNotText: /Not mapped/ }).first().click()
  await save.first().click()
  await t.p.waitForTimeout(700)
  await t.open(MAP)
  await t.click(t.main.getByRole("radio", { name: "By course" }).or(t.main.getByRole("tab", { name: "By course" })), "no By course view")
  await t.p.waitForTimeout(800)
  if ((await rowTextOf()) === before) fail(`${rowName} figures did not change after saving a level`)
})
test("M6", "M", "By course filters: the left list narrows, chips removable; search a code", async (t) => {
  await t.open(MAP)
  await t.click(t.main.getByRole("radio", { name: "By course" }).or(t.main.getByRole("tab", { name: "By course" })), "no By course view")
  await t.p.waitForTimeout(800)
  const rows = t.main.locator("[data-pick-row]")
  const all = await t.stableCount(rows)
  const openFilters = async () => { await t.click(t.button(/^Filters/, t.main), "no Filters button"); await t.p.waitForTimeout(300) }
  await openFilters()
  const d = t.dialog(/Filters/).first()
  await t.visible(d, "Filters opened no choices", QUICK)
  const missing = []
  for (const n of ["Cohort", "Term", "Academic year", "Professional year"]) if (!(await t.isVisible(d.getByRole("combobox", { name: n }), 500))) missing.push(n)
  if (missing.length) fail(`no filter for ${missing.join(", ")}`)
  await d.getByRole("combobox", { name: "Cohort" }).click()
  const opts = t.p.getByRole("option")
  await t.visible(opts.nth(1), "Cohort offers no choices", QUICK)
  const choice = (await opts.nth(1).innerText()).trim()
  await opts.nth(1).click()
  await t.p.waitForTimeout(500)
  await t.p.keyboard.press("Escape")
  const narrowed = await t.countUntil(rows, (n) => n < all)
  if (narrowed >= all) fail(`Cohort ${choice} left ${narrowed} of ${all} rows`)
  const chip = t.main.getByRole("button", { name: new RegExp(`(remove|clear).*${esc(choice)}|${esc(choice)}.*(remove|clear)`, "i") })
  if (!(await t.isVisible(chip, 1000))) fail(`no removable chip for Cohort ${choice}`)
  await chip.first().click()
  if ((await t.countUntil(rows, (n) => n === all)) !== all) fail("removing the chip did not restore the list")
  const search = t.main.getByRole("searchbox").filter({ visible: true }).first()
  await search.fill("NUR 101")
  const searched = await t.countUntil(rows, (n) => n < all)
  if (searched >= all || searched < 2) fail(`search "NUR 101" left ${searched} of ${all} rows`)
})
test("M7", "M", "No clone button, term columns or Optional level", async (t) => {
  await t.openMapBySkill()
  await t.visible(t.main.getByRole("columnheader").first(), "no table, cannot judge")
  await t.absent(t.action(/clone/i, t.main), "the page has a clone button")
  const heads = (await t.main.getByRole("columnheader").allInnerTexts()).map((x) => x.trim())
  const term = heads.find((h) => /^(fall|spring|summer|winter)\b|\b20\d\d$/i.test(h))
  if (term) fail(`term column "${term}"`)
  await t.levelControls().first().click()
  const opts = (await t.p.getByRole("option").allInnerTexts()).map((x) => x.trim())
  if (!opts.length) fail("level control offers nothing, cannot judge")
  if (opts.some((o) => /^Optional/.test(o))) fail(`level control offers Optional: ${opts.join(", ")}`)
  if (!same(opts, ["Mandatory", "Recommended", "Not mapped"])) fail(`levels read ${opts.join(", ")}; want Mandatory, Recommended, Not mapped`)
})
test("M8", "M", "Coverage: In no course figure opens By skill filtered to that group, count equal", async (t) => {
  await t.open(MAP)
  const c = t.main.getByRole("radio", { name: "Coverage" }).or(t.main.getByRole("tab", { name: "Coverage" }))
  if (!(await t.isVisible(c, 1200))) fail("no Coverage view")
  await c.first().click()
  await t.p.waitForTimeout(800)
  await t.click(t.main.getByRole("button", { name: /^Totals by student group/ }), "no totals by student group")
  const fig = t.main.getByRole("row").getByRole("link", { name: /\d+ .*in no course for/i }).first()
  await t.visible(fig, "Coverage has no In no course figure to click")
  const n = +(await fig.innerText()).match(/\d+/)?.[0]
  await fig.click()
  await t.afterNav(1200)
  const on = t.main.getByRole("radio", { name: "By skill" }).or(t.main.getByRole("tab", { name: "By skill" }))
  if ((await on.first().getAttribute("aria-checked")) !== "true" && (await on.first().getAttribute("aria-selected")) !== "true") fail("the figure did not open By skill")
  await t.p.waitForTimeout(500)
  const rows = await t.main.locator("[data-pick-row]").count()
  if (rows !== n) fail(`By skill lists ${rows} skills; the figure said ${n}`)
  await t.visible(t.main.locator('[data-filter-chip="sg"]'), "the list does not say which student group it is for")
  await t.visible(t.main.locator('[data-filter-chip="show"]'), "the list does not say In no course")
})
test("M9", "M", "A Not configured skill is absent from the picker; a note links to Library", async (t) => {
  // The seeded program has none (D-L90), so make one: Questions, with none written.
  await savedWithNoQuestions(t)
  const name = BP
  await t.open(MAP)
  await t.click(t.main.getByRole("radio", { name: "By skill" }).or(t.main.getByRole("tab", { name: "By skill" })), "no By skill view")
  await t.p.waitForTimeout(800)
  const search = t.main.getByRole("searchbox", { name: /skill/i }).filter({ visible: true }).first()
  await search.fill(name)
  await t.p.waitForTimeout(700)
  await t.absent(t.link(name, t.main), `Not configured skill "${name}" is offered on By skill`)
  await search.fill("")
  await t.p.waitForTimeout(500)
  const note = t.link(/not configured/i, t.main)
  await t.visible(note, "no note with a link to Library")
  if (!/\d/.test(await note.first().innerText())) fail("the note has no count")
})
test("M10", "M", "No Copied from badge: OD-01 is open, so nothing says a mapping carried forward", async (t) => {
  await t.open(MAP)
  await t.click(t.main.getByRole("radio", { name: "By course" }).or(t.main.getByRole("tab", { name: "By course" })), "no By course view")
  await t.p.waitForTimeout(800)
  await t.visible(t.main.locator("[data-pick-row]").first(), "no offering to read")
  await t.absent(t.main.getByText(/copied from/i), 'By course shows "Copied from"')
  await t.click(t.main.getByRole("radio", { name: "By skill" }).or(t.main.getByRole("tab", { name: "By skill" })), "no By skill view")
  await t.p.waitForTimeout(800)
  await t.visible(t.main.locator("[data-pick-row]").first(), "no skill to read")
  await t.absent(t.main.getByText(/copied from/i), 'By skill shows "Copied from"')
})

test("M11", "M", "NUR 220: admin mapped equals the student's course page; a level moves both and Reports; Undo restores", async (t) => {
  const OFFER = `${MAP}?by=course&offering=off-nur220-fa26`
  const STUDENT = "/lab/student/home?variant=A&student=stu-g-038&course=crs-nur220" // M11 is a data check; the path follows Maya since D-L110
  const REPORT = "/lab/admin/attainment?course=crs-nur220&cohort=BSN%202026&required=term"
  const other = await t.p.context().newPage()
  try {
    const openOther = async (u) => { await other.goto(`${BASE}${u}`, { waitUntil: "domcontentloaded" }); await other.waitForSelector("main h1"); await other.waitForTimeout(3000) }
    const studentCount = async () => {
      await openOther(STUDENT)
      const text = await other.locator("[data-course-skills]").first().innerText()
      return [...text.matchAll(/(\d+) of (\d+) achieved/g)].reduce((n, m) => n + +m[2], 0)
    }
    const reportSkills = async () => {
      await openOther(REPORT)
      await other.getByRole("tab", { name: /^Skills/ }).first().waitFor()
      return +((await other.getByRole("tab", { name: /^Skills/ }).first().innerText()).match(/\d+/)?.[0] ?? -1)
    }
    const mapped = async () => +((await t.main.locator("[data-level-totals]").getAttribute("aria-label")).match(/^(\d+) mapped/)?.[1] ?? -1)
    await t.open(OFFER)
    const m0 = await mapped()
    const s0 = await studentCount()
    if (m0 !== s0) fail(`admin says ${m0} mapped; the student's course page lists ${s0}`)
    const r0 = await reportSkills()
    const row = t.main.getByRole("row").filter({ has: t.p.locator('[role=combobox][data-level="none"]') }).first()
    await row.getByRole("combobox").click()
    await t.p.getByRole("option", { name: /Mandatory/ }).click()
    await t.p.waitForTimeout(400)
    if ((await studentCount()) !== s0) fail("an unsaved level reached the student")
    await t.click(t.mapSave(), "no Save changes")
    await t.p.waitForTimeout(700)
    if ((await mapped()) !== m0 + 1) fail("admin figure did not move")
    if ((await studentCount()) !== s0 + 1) fail("the student's course page did not move")
    if ((await reportSkills()) !== r0 + 1) fail("Reports did not move")
    await t.p.bringToFront()
    await t.click(t.action(/^Undo$/, t.p), "no Undo on the banner")
    await t.p.waitForTimeout(700)
    if ((await mapped()) !== m0 || (await studentCount()) !== s0 || (await reportSkills()) !== r0) fail("Undo did not restore all three")
  } finally { await other.close() }
})

// ------------------------------------------------------------------ G: global checks on every page
const PAGES = [
  { key: "library", open: (t) => t.open(LIB) },
  { key: "settings", open: (t) => t.open(SET) },
  { key: "perskill", open: (t) => t.openBulkConfigure() },
  { key: "categories", open: (t) => t.open(CATS) },
  { key: "lists", open: (t) => t.open(LISTS) },
  { key: "mapping", open: (t) => t.open(MAP) },
]
for (const pg of PAGES) {
  test(`G1.${pg.key}`, "G", `${pg.key}: one filled button, one title, no line under it`, async (t) => {
    await pg.open(t)
    const titles = await t.main.locator("h1").count()
    if (titles !== 1) fail(`${titles} page titles; want one`)
    const filled = await t.filledButtons()
    if (filled.length !== 1) fail(`${filled.length} filled buttons (${filled.join(", ") || "none"}); want one`)
    const under = await t.lineUnderTitle()
    if (under) fail(`text under the title: "${under}"`)
  })
  test(`G4.${pg.key}`, "G", `${pg.key}: no em dash, items, tick or requirement ID`, async (t) => {
    await pg.open(t)
    const banned = [[/—/, "an em dash"], [/\bitems?\b/i, '"items"'], [/\bticks?\b/i, '"tick"'], [/\b(SL|IM|SC|CM|ST|EV|AR|RV|SH|RP|AE|OD)-\d+\b/, "a requirement ID"], [/\bD-[LXC]\d+\b/, "a decision ID"]]
    const texts = await t.productText()
    if (texts.length < 3) fail("page has almost no text, cannot judge")
    for (const [re, what] of banned) {
      const hit = texts.find((x) => re.test(x))
      if (hit) fail(`${what} in "${hit.slice(0, 80)}"`)
    }
  })
  test(`G5.${pg.key}`, "G", `${pg.key}: no page scroll sideways at 375, 1440, 1920; no large empty area at 1920`, async (t) => {
    await pg.open(t)
    const url = t.p.url().replace(BASE, "")
    for (const w of [1920, 1440, 375]) {
      await t.p.setViewportSize({ width: w, height: w === 375 ? 812 : 1000 })
      await t.open(url)
      await t.p.waitForTimeout(400)
      const over = await t.p.evaluate(() => {
        const out = []
        const check = (el, name) => { if (el && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "hidden") out.push(`${name} ${el.scrollWidth} in ${el.clientWidth}`) }
        check(document.documentElement, "page")
        check(document.body, "body")
        check(document.querySelector("main"), "main")
        // A shell that hides the overflow still cuts things off: a control partly past the right edge, with nothing to scroll it into view.
        for (const el of document.querySelectorAll("main button, main a, main input, main [role=combobox]")) {
          const r = el.getBoundingClientRect()
          if (!r.width || r.left >= innerWidth || r.right <= innerWidth + 1) continue
          let box = el.parentElement
          let scrolls = false
          while (box && box !== document.documentElement) { if (/auto|scroll/.test(getComputedStyle(box).overflowX)) { scrolls = true; break } box = box.parentElement }
          if (!scrolls && !el.closest("[aria-label='Design lab controls']")) { out.push(`"${(el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 30)}" is cut off`); break }
        }
        return out
      })
      if (over.length) fail(`at ${w} sideways scroll: ${over.join(", ")}`)
      if (w === 1920) {
        const { gap, width } = await t.rightGap()
        if (gap > width * 0.25) fail(`at 1920, ${gap}px empty on the right of a ${width}px page`)
      }
    }
  })
}
// G2: where Save, Cancel and Close sit and behave. Only surfaces with a Save. Categories has inline edits only.
const headerRight = async (loc) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); const m = document.querySelector("main").getBoundingClientRect(); return r.top < m.top + 260 && r.left > m.left + m.width / 2 })
const footerRight = async (loc, panel) => {
  const a = await loc.boundingBox()
  const b = await panel.boundingBox()
  return a && b && a.y > b.y + b.height * 0.6 && a.x > b.x + b.width * 0.4
}
test("G2.library", "G", "Edit panel: no Save until a change, then bottom right; Cancel, Close and Esc ask when dirty", async (t) => {
  const panel = await t.openEditPanel()
  await t.absent(panel.getByRole("button", { name: /^Save changes/ }), "Save changes with nothing to save (rule E3)")
  await panel.getByRole("textbox", { name: /^Name/ }).fill("Unsaved")
  if (!(await footerRight(panel.getByRole("button", { name: /^Save changes/ }), panel))) fail("Save changes is not bottom right in the panel")
  for (const c of [/^Cancel$/, /^Close$/]) {
    await t.click(panel.getByRole("button", { name: c }).first(), `no ${c} on the panel`)
    await t.expectDiscardPrompt(`${c} with a change`)
    await t.click(t.discardPrompt().getByRole("button", { name: /^Keep editing/ }), "prompt has no Keep editing")
    await t.p.waitForTimeout(250)
  }
  // The pointer still on Close, its tooltip showing: this test used to move away first, since a first Esc went to the tooltip. That was the bug (D-L98).
  await panel.getByRole("button", { name: /^Close$/ }).first().hover()
  await t.p.waitForTimeout(800)
  await t.p.keyboard.press("Escape")
  await t.expectDiscardPrompt("Esc with a change")
})
test("G2.settings", "G", "Evaluation settings: Save top right, no footer Save", async (t) => {
  await t.open(SET)
  const save = t.saveSettingsButton()
  await t.visible(save, "no Save")
  if (!(await headerRight(save.first()))) fail("Save is not top right in the page header")
  if ((await save.count()) !== 1) fail(`${await save.count()} Save buttons`)
})
test("G2.perskill", "G", "Bulk page: Cancel and Save top right; dirty Cancel asks", async (t) => {
  await t.openBulkConfigure()
  const save = t.button(/^Save/, t.main)
  await t.visible(save, "no Save")
  if (!(await headerRight(save.first()))) fail("Save is not top right in the page header")
  const cancel = t.action(/^Cancel$/, t.main)
  if (!(await t.isVisible(cancel, 1000))) fail("no Cancel in the page header")
  if (!(await headerRight(cancel.first()))) fail("Cancel is not top right in the page header")
  await t.openGroup(t.main, "What the student does")
  const sw = t.main.getByRole("switch").first()
  await t.visible(sw, "no control to change")
  await sw.click()
  await cancel.first().click()
  await t.expectDiscardPrompt("Cancel with a change")
})
test("G2.lists", "G", "List picker: Save bottom right, dirty Close asks", async (t) => {
  await t.openNewList()
  const picker = await t.pickFive()
  const save = picker.getByRole("button", { name: /^Save/ }).first()
  await t.visible(save, "picker has no Save")
  if (!(await footerRight(save, picker))) fail("Save is not bottom right in the picker")
  await t.click(picker.getByRole("button", { name: /^(Close|Cancel)$/ }).first(), "picker has no Close")
  await t.expectDiscardPrompt("Close with a change")
})
test("G2.addstudents", "G", "Add students: acts at once, the button bottom right, no Save on the page", async (t) => {
  const d = await t.openAddStudents()
  const add = assignBtn(d)
  await t.visible(add, "no Add button")
  if (!(await footerRight(add, d))) fail("Add is not bottom right in the dialog")
  await t.absent(t.button(/^Save$/, t.main), "the page has a Save")
})
test("G2.mapping", "G", "Course mapping: Save top right", async (t) => {
  await t.open(MAP)
  const save = t.mapSave()
  if (!(await t.isVisible(save, 1000))) fail("no Save on Course mapping: levels write silently")
  if (!(await headerRight(save.first()))) fail("Save is not top right in the page header")
})
/** G3 and GUARD: make each surface dirty. */
const DIRTY = {
  settings: { open: (t) => t.open(SET), go: async (t) => { await t.chooseModel(/^Approved/, "no model option to change") } }, // the seeded page has a model now, so switching asks first
  lists: { open: async (t) => { await t.open(LISTS); const panel = await t.openListPanel("list-clinical-2027"); await t.click(panel.getByRole("button", { name: /^Edit skills$/ }), "no Edit skills") }, go: async (t) => { await t.dialog().first().getByRole("checkbox").first().click() } },
  mapping: { open: (t) => t.openMapBySkill(), go: async (t) => { await t.setLevel(0) } },
  perskill: { open: (t) => t.openBulkConfigure(), go: async (t) => { await t.openGroup(t.main, "What the student does"); const s = t.main.getByRole("switch").first(); await t.visible(s, "no control to change"); await s.click() } },
  library: { open: (t) => t.openEditForm(), go: async (t) => { await t.dialog().first().getByRole("textbox", { name: /^Name/ }).fill("Unsaved name") } },
}
for (const key of Object.keys(DIRTY)) {
  test(`G3.${key}`, "G", `${key}: change something, click a Skills panel row, asked to discard`, async (t) => {
    await DIRTY[key].open(t)
    await DIRTY[key].go(t)
    await t.p.waitForTimeout(300)
    const before = t.p.url()
    const target = key === "mapping" ? "Library" : "Course mapping"
    await t.click(t.skillsPanelRow(target), key === "library" ? "no panel row to click: the edit surface is modal and hides it" : `no panel row ${target}`)
    await t.p.waitForTimeout(1000)
    if (!(await t.isVisible(t.discardPrompt(), QUICK))) fail(`no discard prompt; ${t.p.url() === before ? "nothing happened" : "the page changed without asking"}`)
    if (t.p.url() !== before) fail("the page changed before the answer")
  })
}
test("G3.lists", "G", "Skill lists picker: change, click a panel row, asked to discard", async (t) => {
  await t.openNewList()
  await t.pickFive()
  await t.click(t.skillsPanelRow("Library"), "no panel row Library")
  await t.expectDiscardPrompt("panel row from a dirty picker")
})

// ------------------------------------------------------------------ TRUTH: a success banner means the data changed
async function truthEdit(t, change, verify) {
  const form = await t.openEditForm()
  await change(form)
  await t.click(form.getByRole("button", { name: /^Save changes/ }), "no Save changes")
  await t.p.waitForTimeout(700)
  const b = await t.bannerText()
  if (!b) fail("no success banner after Save changes, so nothing tells the admin it worked")
  await t.leaveAndReturn(LIB)
  await verify(b)
}
test("TR-name", "TRUTH", "Edit name: banner then row, reload and Course mapping agree", async (t) => {
  const name = unique("Blood Pressure truth")
  await truthEdit(t, async (f) => f.getByRole("textbox", { name: /^Name/ }).fill(name), async (b) => {
    if (!(await t.isVisible(t.rowOf(name), 1500))) fail(`banner said "${b.slice(0, 60)}"; after reload no row is named "${name}"`)
    await t.open(MAP)
    await t.click(t.main.getByRole("radio", { name: "By skill" }), "no By skill view")
    await t.p.waitForTimeout(800)
    await t.main.getByRole("searchbox", { name: /skill/i }).filter({ visible: true }).first().fill(name)
    await t.p.waitForTimeout(600)
    if (!(await t.isVisible(t.link(name, t.main), 1500))) fail(`banner said saved; Course mapping does not know the name "${name}"`)
  })
})
test("TR-description", "TRUTH", "Edit description: value survives reload", async (t) => {
  const desc = unique("Truth description")
  await truthEdit(t, async (f) => f.getByRole("textbox", { name: /^Description/ }).fill(desc), async (b) => {
    const form = await t.openEditForm()
    const v = await form.getByRole("textbox", { name: /^Description/ }).inputValue()
    if (v !== desc) fail(`banner said "${b.slice(0, 60)}"; after reload description reads "${v}"`)
  })
})
test("TR-category", "TRUTH", "Edit category: skill in the new category after reload, count moved", async (t) => {
  await t.open(CATS)
  const n0 = +(await t.main.getByRole("row", { name: /^Assessment/ }).first().innerText()).match(/\d+/)?.[0]
  await truthEdit(t, async (f) => t.pickCategory(f, "Assessment"), async (b) => {
    const form = await t.openEditForm()
    const text = await form.getByRole("button", { name: /^Category/ }).or(form.getByRole("combobox", { name: /^Category/ })).first().innerText()
    if (!text.includes("Assessment")) fail(`banner said "${b.slice(0, 60)}"; after reload the category reads "${text.trim()}"`)
    await t.open(CATS)
    const n1 = +(await t.main.getByRole("row", { name: /^Assessment/ }).first().innerText()).match(/\d+/)?.[0]
    if (n1 !== n0 + 1) fail(`Assessment count reads ${n1}; want ${n0 + 1}`)
  })
})
test("TR-tags", "TRUTH", "Edit tags: tag on the skill after reload and on Categories and tags", async (t) => {
  const tag = unique("truth").replace(/ /g, "-")
  await truthEdit(t, async (f) => t.addTag(f, tag), async (b) => {
    if (!(await (await t.row(BP)).innerText()).includes(tag)) fail(`banner said "${b.slice(0, 60)}"; after reload the row has no tag "${tag}"`)
    await t.open(CATS)
    await t.click(t.main.getByRole("tab", { name: /^Tags/ }), "no Tags tab")
    await t.p.waitForTimeout(500)
    await t.visible(t.main.getByRole("row", { name: new RegExp(esc(tag)) }), `tag "${tag}" is not on Categories and tags`)
  })
})
test("TR-bulk-copy", "TRUTH", "Bulk copy settings: the target carries the source's model after reload", async (t) => {
  await t.open(LIB)
  const target = "Height"
  const SOURCE = "Oral medication administration" // Custom, on another model
  // Two rows: Configure with one row opens that skill's panel (K7); the bulk page holds Start from (map D4).
  await t.selectRows([target, "Weight"])
  const copy = t.button(/^Copy settings$/, t.main)
  if (!(await t.isVisible(copy, 800))) {
    await t.click(t.action(/^Configure \d* ?skills?$/, t.main), "no Copy settings and no Configure on the bulk bar")
    await t.afterNav(1500)
    await t.click(t.main.getByRole("combobox", { name: /^Copy settings from/ }), 'no "Start from" on the Configure page')
    await t.click(t.p.getByRole("option", { name: new RegExp(esc(SOURCE)) }), `"${SOURCE}" not offered under Start from`)
    await t.savePerSkill()
  } else {
    await copy.click()
    const d = t.dialog(/Copy settings/).first()
    await t.visible(d, "Copy settings opened no dialog", QUICK)
    await d.getByRole("combobox", { name: /^Copy from/ }).click()
    const src = t.p.getByRole("option", { name: new RegExp(esc(SOURCE)) })
    await t.click(src, `"${SOURCE}" is not offered as a source`)
    await t.p.waitForTimeout(300)
    await t.click(d.getByRole("button", { name: /^Copy settings/ }), "no Copy settings button")
    await t.p.waitForTimeout(800)
  }
  const b = await t.bannerText()
  if (!b) fail("no success banner after copying settings")
  await t.leaveAndReturn(LIB)
  const panel = await t.openConfigure(target)
  await t.chooseCustom(panel)
  await t.openGroup(panel, "How this skill is judged")
  if (!(await panel.getByRole("radio", { name: /^Approved or not approved/ }).isChecked())) fail(`banner said "${b.slice(0, 60)}"; "${target}" has no copied model after reload`)
})
test("TR-bulk-config", "TRUTH", "Bulk configure: the change is on each skill after reload", async (t) => {
  await t.open(LIB)
  const names = [BP, "Height", "Weight"]
  await t.selectRows(names)
  await t.click(t.action(/^Configure 3 skills$/, t.main), "no Configure 3 skills")
  await t.afterNav(1500)
  await t.settle()
  await t.visible(t.main.getByRole("heading", { level: 1, name: "3 skills" }), "the Configure page did not open", LOAD)
  await t.p.waitForTimeout(400)
  const need = t.main.getByRole("spinbutton", { name: /needed/i }).first()
  await t.visible(need, "no Times needed input on the Configure page")
  await need.fill("9")
  await t.savePerSkill()
  await t.p.waitForTimeout(600)
  const b = await t.bannerText()
  if (!b) fail("no success banner after configuring 3 skills")
  await t.leaveAndReturn(LIB)
  for (const n of names) if ((await t.times(n)) !== "9") fail(`banner said "${b.slice(0, 60)}"; "${n}" reads ${await t.times(n)} after reload, want 9`)
})
test("TR-add-one", "TRUTH", "Add one: row and count survive reload", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  await t.click(t.button(/^Add a skill$/, t.main), "no Add a skill")
  const sheet = t.dialog().first()
  const name = unique("Truth added")
  await sheet.getByRole("textbox", { name: /^Name/ }).fill(name)
  const b0 = sheet.getByRole("button", { name: /^Add skill$/ }).or(sheet.getByRole("button", { name: /^Save for later$/ }))
  await t.click(b0, "no button to add the skill")
  await t.p.waitForTimeout(800)
  const b = await t.bannerText()
  if (!b) fail("no success banner after adding")
  await t.leaveAndReturn(LIB)
  if (!(await t.isVisible(t.rowOf(name), 1500))) fail(`banner said "${b.slice(0, 60)}"; after reload no row "${name}"`)
  if ((await t.allCount()) !== all + 1) fail(`All reads ${await t.allCount()} after reload; want ${all + 1}`)
})
test("TR-add-several", "TRUTH", "Add several: rows and count survive reload", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  const sheet = await t.openAddSeveral()
  const n = unique("Truth pasted")
  await sheet.getByRole("textbox", { name: /names/i }).fill([`${n} one`, `${n} two`, `${n} three`].join("\n"))
  await t.p.waitForTimeout(400)
  await t.click(sheet.getByRole("button", { name: /^Add( \d+)? skills?$/ }), "no Add button")
  await t.p.waitForTimeout(800)
  const b = await t.bannerText()
  if (!b) fail("no success banner after adding several")
  await t.leaveAndReturn(LIB)
  if ((await t.allCount()) !== all + 3) fail(`banner said "${b.slice(0, 60)}"; All reads ${await t.allCount()} after reload, want ${all + 3}`)
  await t.row(`${n} two`)
})
test("TR-upload", "TRUTH", "Bulk upload (Later): if it reports success, the skills exist", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  await t.openAddMenu()
  const item = t.p.getByRole("menuitem", { name: /^Bulk upload/ })
  if (!(await t.isVisible(item, 800))) later("Bulk upload is not in the menu")
  await item.first().click()
  await t.afterNav(2000)
  await t.settle()
  const input = t.p.locator("input[type=file]")
  await input.first().waitFor({ state: "attached", timeout: ACT }).catch(() => later("Bulk upload has no file input yet"))
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lab-upload-"))
  const name = unique("Truth upload")
  const file = path.join(dir, "skills.csv")
  fs.writeFileSync(file, `Name,Description\n${name} alpha,First\n${name} beta,Second\n`)
  await input.first().setInputFiles(file)
  await t.p.waitForTimeout(2000)
  let done = false
  for (let i = 0; i < 8 && !done; i++) {
    const finish = t.main.getByRole("button", { name: /^(Add|Create|Import|Confirm|Finish)( \d+)?.*(skills?)?$/ }).filter({ visible: true })
    const next = t.main.getByRole("button", { name: /^(Next|Continue)/ }).filter({ visible: true })
    if (await t.isVisible(finish, 700)) { await finish.first().click(); done = true }
    else if ((await t.isVisible(next, 700)) && (await next.first().isEnabled())) { await next.first().click() }
    else break
    await t.p.waitForTimeout(1500)
  }
  if (!done) {
    const read = (await t.main.innerText()).match(/\d+ skills read[^.]*/)?.[0]
    later(`could not finish the upload: Next stays off until each proposal is decided by hand${read ? `. From a 2 line file the page says "${read}", so what it read is not the file` : ""}`)
  }
  const c = t.confirm().filter({ has: t.p.getByRole("button", { name: /^(Add|Create|Import|Confirm)/ }) })
  if (await t.isVisible(c, 800)) { await c.first().getByRole("button", { name: /^(Add|Create|Import|Confirm)/ }).first().click(); await t.p.waitForTimeout(1000) }
  await t.afterNav(1500)
  const b = await t.bannerText()
  await t.leaveAndReturn(LIB)
  const now = await t.allCount()
  if (now <= all) fail(`upload finished${b ? `, banner "${b.slice(0, 50)}"` : ""}; All still ${now}`)
  if (!(await t.isVisible(t.rowOf(`${name} alpha`), 1000))) fail(`upload added ${now - all} skills, but none is from the file: "${name} alpha" is not in the library`)
})
test("TR-starting", "TRUTH", "Starting points (Later): if it reports success, the skills exist", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  await t.openAddMenu()
  const item = t.p.getByRole("menuitem", { name: /^(Starting points|Copy from a starter)/ })
  if (!(await t.isVisible(item, 800))) later("Starting points is not in the menu")
  await item.first().click()
  await t.afterNav(2000)
  await t.settle()
  const preview = t.main.getByRole("button", { name: /^Preview / })
  await t.visible(preview.nth(1), "no Preview on a starting point")
  await preview.nth(1).click()
  const d = t.dialog().first()
  await t.visible(d, "Preview opened no panel", QUICK)
  const go = d.getByRole("button", { name: /^Copy \d+/ })
  await t.visible(go, "panel has no Copy N skills")
  const n = +(await go.first().innerText()).match(/\d+/)[0]
  await go.first().click()
  await t.afterNav(1500)
  const b = await t.bannerText()
  await t.leaveAndReturn(LIB)
  const now = await t.allCount()
  if (now !== all + n) fail(`copy of ${n} skills${b ? `, banner "${b.slice(0, 50)}"` : ""}; All reads ${now}, want ${all + n}`)
})
test("TR-deactivate", "TRUTH", "Deactivate: Inactive, Inactive count up, survives reload", async (t) => {
  await t.open(LIB)
  const before = await t.tabCount(/^Inactive/)
  await deactivateViaMenu(t)
  const b = await t.bannerText()
  if (!b) fail("no success banner after deactivating")
  await t.leaveAndReturn(LIB)
  if ((await t.rowStatus(BP)) !== "Inactive") fail(`banner said "${b.slice(0, 60)}"; after reload status is ${await t.rowStatus(BP)}`)
  if ((await t.tabCount(/^Inactive/)) !== before + 1) fail(`Inactive tab reads ${await t.tabCount(/^Inactive/)}; want ${before + 1}`)
})
test("TR-assign", "TRUTH", "Add students: Skill lists table shows the group after reload", async (t) => {
  const free = await t.groupWithoutList()
  if (!free.length) fail("no free group to assign")
  await free[0].box.click()
  await t.p.locator("[data-add-dialog] [data-add-dialog] ~ div button:last-child").click()
  await t.p.waitForTimeout(800)
  const b = await t.bannerText()
  if (!b) fail("no success banner after adding")
  await t.leaveAndReturn(LISTS)
  if (!(await t.listRow("Core clinical skills").first().innerText()).includes(free[0].name)) fail(`banner said "${b.slice(0, 60)}"; after reload "${free[0].name}" is not in the Skill lists table`)
})
test("TR-mapping", "TRUTH", "Save on Course mapping: the level survives reload", async (t) => {
  await t.openMapBySkill()
  const save = t.mapSave()
  if (!(await t.isVisible(save, 1000))) fail("no Save on Course mapping: levels write silently")
  const lvl = await t.setLevel(0)
  const key = t.lastKey
  await save.first().click()
  await t.p.waitForTimeout(700)
  const b = await t.bannerText()
  if (!b) fail("no success banner after Save")
  const url = t.p.url().replace(BASE, "")
  await t.leaveAndReturn(url)
  const now = (await t.levelMap())[key]
  if (now !== lvl) fail(`banner said "${b.slice(0, 60)}"; ${key} reads ${now} after reload, want ${lvl}`)
})

// ------------------------------------------------------------------ GUARD: dirty state plus each way of leaving
const STOP = { settings: "Evaluation settings", lists: "Skill lists", mapping: "Course mapping", library: "Library" }
for (const key of ["settings", "lists", "mapping", "perskill", "library"]) {
  const openOnPath = async (t) => {
    if (key === "perskill") { await t.openBulkConfigure(); return }
    await t.walkTo(STOP[key])
    if (key === "lists") { const panel = await t.openListPanel("list-clinical-2027"); await t.click(panel.getByRole("button", { name: /^Edit skills$/ }), "no Edit skills"); return }
    if (key === "mapping") {
      await t.click(t.main.getByRole("radio", { name: "By skill" }).or(t.main.getByRole("tab", { name: "By skill" })), "no By skill view")
      await t.p.waitForTimeout(800)
      const s = t.main.getByRole("searchbox", { name: /skill/i }).filter({ visible: true })
      await s.first().fill(BP)
      await t.p.waitForTimeout(500)
      await t.click(t.link(BP, t.main), `"${BP}" not offered`)
      await t.afterNav(1200)
      await t.visible(t.levelControls(), "no level controls")
    }
    if (key === "library") {
      const r = await t.row(BP)
      await r.getByRole("cell").nth(-2).click({ position: { x: 4, y: 4 } })
      const panel = t.dialog().first()
      if (!((await t.isVisible(panel, ACT)) && (await t.isVisible(panel.getByRole("textbox", { name: /^Name/ }), 800)))) {
        await t.walkTo("Library")
        await t.rowMenuItem(BP, /^Edit/)
      }
    }
  }
  const dirty = async (t) => {
    await DIRTY[key].go(t)
    await t.p.waitForTimeout(300)
  }
  test(`GD-next.${key}`, "GUARD", `${key}: dirty, Next on the path bar, asks to discard`, async (t) => {
    if (key === "perskill") {
      // The bulk page is a side step: open it from a walkthrough URL so the path bar is on it. Its only door is the selection bar (map D4).
      await t.walkTo("Library")
      await t.selectRows([BP, "Height", "Weight"])
      await t.click(t.action(/^Configure 3 skills$/, t.main), "no way to the bulk page")
      await t.afterNav(1500)
      await t.settle()
    } else await openOnPath(t)
    await dirty(t)
    const before = t.p.url()
    if (key === "library" && !(await t.isVisible(t.p.getByRole("group", { name: /walkthrough/i }), 800))) fail("no Next to click: the edit surface is modal and hides the path bar")
    const bar = await t.pathBar()
    await t.click(t.nextControl(bar), "no Next on the path bar")
    await t.p.waitForTimeout(1000)
    if (!(await t.isVisible(t.discardPrompt(), QUICK))) fail(`no discard prompt; ${t.p.url() === before ? "nothing happened" : "Next left the page without asking"}`)
  })
  test(`GD-panel.${key}`, "GUARD", `${key}: dirty, a panel row, asks to discard`, async (t) => {
    await openOnPath(t)
    await dirty(t)
    const before = t.p.url()
    await t.click(t.skillsPanelRow(key === "mapping" ? "Library" : "Course mapping"), key === "library" ? "no panel row to click: the edit surface is modal and hides it" : "no panel row")
    await t.p.waitForTimeout(1000)
    if (!(await t.isVisible(t.discardPrompt(), QUICK))) fail(`no discard prompt; ${t.p.url() === before ? "nothing happened" : "the row left the page without asking"}`)
  })
  test(`GD-reload.${key}`, "GUARD", `${key}: dirty, browser reload, asks to discard`, async (t) => {
    await openOnPath(t)
    await dirty(t)
    await t.reload()
    if (!t.unloads) fail("browser reload gave no discard prompt")
  })
}

// ------------------------------------------------------------------ MY PROGRESS: reads the skill list (D-L102)
const STUDENT_HOME = "/lab/student/home"
const openStudent = async (t, q = "") => {
  await t.p.goto(`${BASE}${STUDENT_HOME}${q}`, { waitUntil: "load", timeout: LOAD })
  await t.p.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {})
}
test("MP1", "MP", "A student on two lists: two tabs, each its own figure, no merged figure", async (t) => {
  await openStudent(t)
  const tabs = t.p.getByRole("tab").filter({ hasText: /\d+ of \d+/ })
  await t.visible(tabs, "no list tabs for a student on two lists")
  if ((await tabs.count()) !== 2) fail(`${await tabs.count()} list tabs; want 2`)
  const read = async () => { const h = t.p.locator("[data-required-achieved]"); return [await h.getAttribute("data-required-achieved"), await h.getAttribute("data-required-total")].join(" of ") }
  const first = await read()
  if (!(await tabs.first().innerText()).includes(first)) fail(`the tab says "${await tabs.first().innerText()}", the figure ${first}`)
  await tabs.nth(1).click()
  await t.waitFor(async () => (await read()) !== first, "the second tab did not change the figure")
  if (!(await tabs.nth(1).innerText()).includes(await read())) fail(`the tab says "${await tabs.nth(1).innerText()}", the figure ${await read()}`)
})
test("MP2", "MP", "Unassign a group: its student sees a plain message, can still log, and nothing reads as behind", async (t) => {
  await t.open(LISTS)
  const panel = await t.openListPanel("list-core")
  await t.click(panel.getByRole("button", { name: "Remove BSN 2026 from Core clinical skills" }), "no x on BSN 2026")
  const stop = t.p.getByRole("alertdialog")
  await t.visible(stop, "it asked nothing", QUICK)
  await t.click(stop.first().getByRole("button", { name: /^Remove BSN 2026$/ }), "no Remove")
  await t.p.waitForTimeout(800)
  await openStudent(t, "?student=stu-g-001")
  await t.visible(t.p.locator("[data-no-list]"), "no message for a student with no list")
  const text = (await t.p.locator("main").first().innerText()).replace(/\s+/g, " ")
  if (/behind|\bexpected\b/i.test(text)) fail(`a student with no list reads "${text.match(/.{0,40}(behind|expected).{0,20}/i)[0]}"`)
  await t.visible(t.p.getByRole("link", { name: /^Log a /i }).or(t.p.getByRole("button", { name: /^Log a /i })), "no Log a skill")
})

// ------------------------------------------------------------------ NUMBERS: one count, same in every place
test("NM-courses", "NUMBERS", "Courses for a skill: deactivate dialog, panel and Course mapping agree", async (t) => {
  await t.open(LIB)
  await t.rowMenuItem(BP, /^Deactivate/)
  const d = t.p.getByRole("alertdialog").or(t.dialog(/Deactivate/)).first()
  await t.visible(d, "no Deactivate dialog", QUICK)
  const dText = (await d.innerText()).replace(/\s+/g, " ")
  const fromDialog = +(dText.match(/(?:Leaves courses|courses?)\s*(\d+)/i)?.[1] ?? dText.match(/(\d+)\s*courses?/i)?.[1] ?? NaN)
  if (Number.isNaN(fromDialog)) fail(`deactivate dialog has no course count: "${dText.slice(0, 100)}"`)
  await t.open(LIB)
  const r = await t.row(BP)
  await r.getByRole("cell").nth(-2).click({ position: { x: 4, y: 4 } })
  const panel = t.dialog().first()
  await t.visible(panel, "row click opened no panel", QUICK)
  // The panel's course count sits on its Used in tab (D-L97), not on the Details tab it opens on.
  await t.click(panel.getByRole("tab", { name: /^Used in/ }), "the panel has no Used in tab")
  await t.p.waitForTimeout(300)
  const pText = (await panel.innerText()).replace(/\s+/g, " ")
  const fromPanel = +(pText.match(/(\d+)\s*courses?/i)?.[1] ?? pText.match(/Courses\s*(\d+)/i)?.[1] ?? NaN)
  if (Number.isNaN(fromPanel)) fail("panel has no course count")
  await t.open(MAP)
  await t.click(t.main.getByRole("radio", { name: "By skill" }).or(t.main.getByRole("tab", { name: "By skill" })), "no By skill view")
  await t.p.waitForTimeout(800)
  await t.main.getByRole("searchbox", { name: /skill/i }).filter({ visible: true }).first().fill(BP)
  await t.p.waitForTimeout(600)
  const mapRow = t.main.locator("[data-pick-row]").filter({ hasText: BP }).first()
  await t.visible(mapRow, "Course mapping has no row for the skill")
  // By skill is two panes since D-L100: the list row reads the skill's name, its category and its count of courses.
  const fromMap = +((await mapRow.innerText()).match(/(\d+)/g)?.at(-1) ?? NaN)
  if (![fromDialog, fromPanel, fromMap].every((n) => n === fromDialog)) fail(`courses for ${BP}: deactivate dialog ${fromDialog}, panel ${fromPanel}, Course mapping ${fromMap}`)
})
test("NM-students-have-it", "NUMBERS", "Deactivate dialog: a skill students hold evaluations on is not one nobody has", async (t) => {
  await t.open(LIB)
  await t.rowMenuItem("Sponge Bath", /^Deactivate/)
  const text = ((await t.p.getByRole("alertdialog").first().innerText()) || "").replace(/\s+/g, " ")
  const have = +(text.match(/Students who have it\s*([\d,]+)/)?.[1]?.replace(/,/g, "") ?? NaN)
  const kept = +(text.match(/Evaluations kept\s*([\d,]+)/)?.[1]?.replace(/,/g, "") ?? NaN)
  if (Number.isNaN(have) || Number.isNaN(kept)) fail(`the dialog does not give both figures: "${text.slice(0, 160)}"`)
  if (kept > 0 && have === 0) fail(`Students who have it reads 0 with ${kept} evaluations kept`)
})
test("NM-list-size", "NUMBERS", "Skill list size: the table number equals the members shown", async (t) => {
  await t.open(LISTS)
  const rows = t.main.getByRole("row").filter({ has: t.p.locator("[data-list-link]") })
  const n = await rows.count()
  if (!n) fail("no list rows to read")
  const bad = []
  for (let i = 0; i < n; i++) {
    const row = rows.nth(i)
    const name = (await row.locator("[data-list-link]").innerText()).trim()
    // D6 lets the cell read "154, 2 inactive": the panel lists all 154, the inactive two first and marked.
    const sizeCell = (await row.getByRole("cell").nth(1).innerText()).replace(/\s+/g, " ")
    const size = +sizeCell.match(/\d+/)?.[0]
    await row.locator("[data-list-link]").click()
    const panel = t.dialog().first()
    await t.visible(panel, "opening a list opened no panel", QUICK)
    await t.click(panel.locator("[data-list-skills]").first(), "the panel has no way to its skills")
    await t.p.waitForTimeout(400)
    // An unassigned list is a picker, where "N selected" is the members. An assigned list is its rows.
    const text = (await panel.innerText()).replace(/\s+/g, " ").replace(/,/g, "")
    const sel = text.match(/(\d+) selected/)
    const members = sel ? +sel[1] : await panel.locator("[data-skill-rows] > li").count()
    if (members !== size) bad.push(`${name}: table ${size}, members ${members}`)
    await t.closePanel()
  }
  if (bad.length) fail(bad.join("; "))
})
test("NM-settings-library", "NUMBERS", "Skills count on Evaluation settings equals the Library", async (t) => {
  await t.open(LIB)
  const all = await t.allCount()
  const inactive = await t.tabCount(/^Inactive/)
  await t.open(SET)
  await t.fillIndependence()
  await t.pressSaveSettings()
  const d = t.applyDialog()
  await t.visible(d, "saving opened no Apply dialog", QUICK)
  const text = (await d.first().innerText()).replace(/\s+/g, " ")
  // D3's dialog reads "Apply to 166 skills?" with Custom on a row of its own, and Inactive skills count like any other, so the rows add up to the Library.
  const count = (re) => +(text.replace(/,/g, "").match(re)?.[1] ?? 0)
  // D-L99: skills on the default with their own number have their own row, "27 keep their number".
  const n = count(/(\d+) will change/) + count(/(\d+) already match/) + count(/(\d+) keep their settings/) + count(/(\d+) keep their number/) + count(/(\d+) become not configured/) + count(/(\d+) stay not configured/)
  if (n !== all) fail(`settings accounts for ${n} skills ("${text.slice(0, 120)}"); Library says ${all}`)
})

test("NM-own-settings", "NUMBERS", "Impact dialog: Custom equals the Library's Configuration filter", async (t) => {
  const own = await t.filterConfigCount("Custom")
  const notConfigured = await t.filterConfigCount("Not configured")
  await t.open(SET)
  const need = t.main.getByRole("spinbutton", { name: /needed/i }).first()
  await t.visible(need, "no Times needed input")
  await need.fill("3")
  await t.pressSaveSettings()
  const d = t.applyDialog()
  await t.visible(d, "saving opened no Apply dialog", QUICK)
  const text = (await d.first().innerText()).replace(/\s+/g, " ").replace(/,/g, "")
  const keep = +text.match(/(\d+) keep their settings/)?.[1]
  if (keep !== own) fail(`dialog says ${keep} keep their settings; the Library's Custom filter says ${own}`)
  const stays = +(text.match(/(\d+) stay not configured/)?.[1] ?? 0)
  if (stays !== notConfigured) fail(`dialog says ${stays} stay not configured; the Library's filter says ${notConfigured}`)
  const labels = await d.first().locator("dt").allInnerTexts()
  if (new Set(labels).size !== labels.length) fail(`two rows share a label: ${labels.join(", ")}`)
})

// ------------------------------------------------------------------ QUESTIONS: the result comes from the answers (D-L73)
test("Q-legacy", "QUESTIONS", "Legacy evaluator form: a Questions skill has no outcome control", async (t) => {
  await t.p.goto(`${BASE}/v2/preceptor/preceptor-evaluation?request=sub-03`, { waitUntil: "load", timeout: LOAD })
  await t.p.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {})
  const q = t.p.locator("[data-skill-form]").filter({ has: t.p.getByRole("radio", { name: /^Yes/ }) })
  await t.visible(q, "the request shows no Questions skill, cannot judge")
  const legends = await q.first().locator("legend").allInnerTexts()
  const hit = legends.find((l) => /^Outcome for/i.test(l))
  if (hit) fail(`a Questions skill still asks: "${hit}"`)
})

// ------------------------------------------------------------------ BLANK and WIDE
test("BL-set-level", "BLANK", "Bulk Set level with nothing chosen changes nothing: choosing a level is the act, there is no second button (map D8, D-L100)", async (t) => {
  await t.openMapBySkill()
  const before = await t.levelMap()
  const boxes = t.main.getByRole("row").getByRole("checkbox", { name: /^Select row/ })
  await t.visible(boxes, "no rows to select")
  await boxes.nth(0).check()
  await boxes.nth(1).check()
  await t.p.waitForTimeout(400)
  await t.visible(t.main.getByRole("combobox").filter({ hasText: /^Set level$/ }), "no Set level on the bulk bar")
  await t.absent(t.button(/^(Set level|Apply|Set)$/, t.main), "the bulk bar has a second button; choosing a level is the act")
  await t.p.waitForTimeout(700)
  const after = await t.levelMap()
  const moved = Object.keys(before).filter((k) => before[k] !== after[k])
  if (moved.length) fail(`nothing was chosen, yet ${moved.length} levels changed, for one ${moved[0]}: ${before[moved[0]]} became ${after[moved[0]]}`)
  // The DS bulk bar is a live region too, so the result banner is any status outside it.
  const banner = (await t.main.getByRole("status").allInnerTexts()).filter((x) => !/\bselected\b/.test(x)).join(" ")
  if (/saved|set|updated|changed/i.test(banner)) fail(`nothing was chosen, yet a banner reads "${banner.slice(0, 70)}"`)
})
test("WD-own-settings", "WIDE", "Saving Evaluation settings leaves a Custom skill alone", async (t) => {
  const panel = await t.openConfigure()
  await t.chooseCustom(panel)
  await t.openGroup(panel, "Who evaluates")
  const sw = panel.getByRole("switch", { name: /approval/i })
  await t.visible(sw, "no Approval switch on the page")
  await sw.click()
  const mine = (await sw.getAttribute("aria-checked")) === "true"
  await savePage(t, panel)
  await t.open(SET)
  await t.fillIndependence()
  const swS = t.main.getByRole("switch", { name: /approval/i }).first()
  await t.visible(swS, "no Approval switch on Evaluation settings")
  const set = (await swS.getAttribute("aria-checked")) === "true"
  if (set === mine) await swS.click()
  await t.applySettings()
  const again = await t.openConfigure()
  await t.openGroup(again, "Who evaluates")
  const nowMine = (await again.getByRole("switch", { name: /approval/i }).getAttribute("aria-checked")) === "true"
  if (nowMine !== mine) fail(`saving Evaluation settings changed the skill's own Approval from ${mine ? "on" : "off"} to ${nowMine ? "on" : "off"}`)
  if ((await t.panelConfig(again)) !== "Custom") fail(`Configuration moved to ${await t.panelConfig(again)}`)
})
test("WD-questions", "WIDE", "Saving Evaluation settings leaves a skill's questions alone", async (t) => {
  const skill = "Sterile dressing change" // a seeded skill judged by questions
  const read = async () => {
    const panel = await t.openConfigure(skill)
    await t.click(panel.getByRole("button", { name: /^Edit questions/ }), `no Edit questions on "${skill}"`)
    const boxes = t.p.locator("[data-questions-dialog]").getByRole("textbox", { name: /question/i })
    await t.visible(boxes, `no questions shown on "${skill}", cannot judge`)
    const vals = []
    for (const b of await boxes.all()) vals.push(await b.inputValue())
    return vals
  }
  const before = await read()
  if (!before.some(Boolean)) fail(`"${skill}" has no question text, cannot judge`)
  await t.open(SET)
  await t.chooseModel(/^Questions/, "no Questions option on Evaluation settings")
  // Fill whatever this model asks for, the way an admin would: every empty box, the first answer in every unanswered choice.
  const texts = t.main.getByRole("textbox")
  for (let i = 0; i < (await texts.count()); i++) { const b = texts.nth(i); if ((await b.isVisible()) && !(await b.inputValue())) await b.fill(`Setting text ${i + 1}`) }
  await t.p.waitForTimeout(300)
  for (const g of await t.main.getByRole("radiogroup").all()) {
    const radios = g.getByRole("radio")
    let on = false
    for (const r of await radios.all()) if (await r.isChecked()) on = true
    if (!on && (await radios.count())) await radios.first().click()
  }
  const need = t.main.getByRole("spinbutton", { name: /needed/i }).first()
  if (await t.isVisible(need, 500)) await need.fill("2")
  const role = t.main.getByRole("checkbox", { name: /^Preceptor/ })
  if ((await t.isVisible(role, 500)) && !(await role.first().isChecked())) await role.first().click()
  await t.applySettings()
  const after = await read()
  if (!same(after, before)) fail(`saving Evaluation settings changed "${skill}"'s questions: first was "${before[0]?.slice(0, 40)}", now "${(after[0] ?? "none").slice(0, 40)}" (${before.length} became ${after.length})`)
})

// ------------------------------------------------------------------ fix round 2026-11-05: cases from the four fix workers, applied in one place
const LP = '[data-slot^="lab-admin-list"]'
const visibleOpen = (t, sel) => t.p.evaluate((s) => [...document.querySelectorAll(s)].some((e) => e.getAttribute("data-state") !== "closed"), sel)
const activeInfo = (t) => t.p.evaluate(() => { const a = document.activeElement; return { body: !a || a === document.body, tag: a?.tagName, id: a?.id ?? "", label: a?.getAttribute("aria-label") ?? "", text: (a?.textContent ?? "").trim().slice(0, 60), skill: a?.getAttribute("data-skill-link") ?? null } })
const noSideScroll = async (t, what) => { const o = await t.p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (o > 0) fail(`${what}: the page scrolls sideways by ${o} px`) }
const boxOf = async (loc) => { const b = await loc.boundingBox(); return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null }
const pageScroll = (t) => t.p.evaluate(() => document.querySelector("[data-page-scroll]")?.scrollTop ?? null)
const setPageScroll = async (t, y) => { await t.p.evaluate((v) => { document.querySelector("[data-page-scroll]").scrollTop = v }, y); await t.p.waitForTimeout(250) }
const bulkBarText = (t) => t.p.evaluate(() => document.querySelector("[data-exxat-bulk-bar]")?.innerText?.replace(/\s+/g, " ") ?? "")
const openSkillLink = async (t, name) => {
  await t.click(t.main.locator("[data-skill-link]", { hasText: new RegExp(`^${esc(name)}$`) }), `no skill link for ${name}`)
  const panel = t.p.locator(PANEL)
  await t.visible(panel.locator("#edit-skill-name"), `${name}: the panel did not open`)
  await t.p.waitForTimeout(500)
  return panel
}
const panelGone = (t, what) => t.waitFor(async () => !(await visibleOpen(t, PANEL)), what, 1500)

/** Bulk edit (map D1b): select, set what was asked, Update, confirm a question if one comes. */
async function bulkEdit(t, names, { times, tag } = {}) {
  await t.selectRows(names)
  await t.click(t.p.locator("[data-bulk-edit-trigger]"), "no Edit N skills")
  const pan = t.p.locator("[data-slot=lab-bulk-edit]")
  await t.visible(pan, "Edit N skills opened no sheet", QUICK)
  if (tag) { await pan.locator("#bulk-add-tags").fill(tag); await pan.locator("#bulk-add-tags").press("Enter"); await t.p.waitForTimeout(200) }
  if (times !== undefined) {
    await t.click(pan.locator("#bulk-times-mode"), "no Times needed mode")
    await t.click(t.p.getByRole("option", { name: "Set a number" }), "no Set a number")
    await pan.locator("#bulk-times").fill(String(times))
  }
  await t.click(pan.getByRole("button", { name: /^Update/ }), "no Update")
  await t.p.waitForTimeout(500)
  const asked = t.p.getByRole("alertdialog")
  if (await t.isVisible(asked, 700)) await asked.getByRole("button", { name: /^Save changes/ }).click()
  await t.waitFor(async () => (await pan.count()) === 0, "the bulk sheet stayed open after Update")
  await t.p.waitForTimeout(400)
}

/** The rows these cases rest on still hold what the case assumes, read from the page. */
const expectTimes = async (t, want) => { for (const [n, v] of Object.entries(want)) if ((await t.times(n)) !== v) fail(`${n} reads ${await t.times(n)}, this case needs ${v}: cannot judge`) }

test("E38", "E", "One Esc closes the Skill lists and Library panels with hover or focus on Close or Panel size; an open Panel size menu takes Esc alone", async (t) => {
  const surfaces = {
    Library: { url: LIB, open: async () => { await t.p.mouse.move(100, 800); await mouseOn(t, t.main.locator("[data-skill-link]").first()); await t.visible(t.p.locator(`${PANEL} #edit-skill-name`), "the Library panel did not open") }, sel: PANEL },
    "Skill lists": { url: LISTS, open: async () => { await t.p.mouse.move(100, 800); await t.main.locator('[data-list-link="list-core"]').click(); await t.visible(t.p.locator(LP), "the list panel did not open") }, sel: LP },
  }
  for (const [where, s] of Object.entries(surfaces)) {
    await t.open(s.url)
    for (const name of ["Close", "Panel size"]) for (const how of ["hover", "focus"]) {
      await s.open()
      await t.p.waitForTimeout(700)
      const b = t.p.locator(s.sel).getByRole("button", { name, exact: true }).first()
      if (how === "hover") await b.hover()
      else { await b.focus(); await t.p.keyboard.press("Shift+Tab"); await t.p.keyboard.press("Tab") }
      await t.p.waitForTimeout(800)
      await t.p.keyboard.press("Escape")
      await t.waitFor(async () => !(await visibleOpen(t, s.sel)), `${where}: one Esc with ${how} on ${name} left the panel open`, 1500)
      await t.p.waitForTimeout(400)
    }
    await s.open()
    await t.p.waitForTimeout(700)
    await t.click(t.p.locator(s.sel).getByRole("button", { name: "Panel size", exact: true }), "no Panel size")
    await t.visible(t.p.getByRole("menu"), `${where}: Panel size opened no menu`, QUICK)
    await t.p.keyboard.press("Escape")
    await t.waitFor(async () => (await t.p.getByRole("menu").count()) === 0, `${where}: Esc did not close the menu`, 1500)
    await t.p.waitForTimeout(400)
    if (!(await visibleOpen(t, s.sel))) fail(`${where}: Esc on the open menu also closed the panel`)
    await t.p.keyboard.press("Escape")
    await t.waitFor(async () => !(await visibleOpen(t, s.sel)), `${where}: the next Esc did not close the panel`, 1500)
  }
})
test("E39", "E", "A dirty Library panel asks on the first Esc, with Close hovered", async (t) => {
  await t.open(LIB)
  const panel = await openSkillLink(t, BP)
  await panel.locator("#edit-skill-name").fill(`${BP} edited`)
  await panel.getByRole("button", { name: "Close", exact: true }).first().hover()
  await t.p.waitForTimeout(800)
  await t.p.keyboard.press("Escape")
  await t.expectDiscardPrompt("first Esc on a dirty panel with a tooltip showing")
})
test("E40", "E", "A saved banner goes as soon as the panel changes again; a deactivated banner does not", async (t) => {
  await t.open(LIB)
  const panel = await openSkillLink(t, "Height")
  await panel.locator("#edit-skill-name").fill("Height two")
  await t.click(panel.getByRole("button", { name: "Save changes" }), "no Save changes")
  await t.expectBanner(/saved\./i, "panel save")
  await panel.locator("#edit-skill-name").fill("Height three")
  await t.waitFor(async () => (await t.banner(/saved\./i).count()) === 0, "the saved banner is still there after another change", 1500)
  await t.open(LIB)
  await t.rowMenuItem("Weight", /^Deactivate/)
  await t.click(t.p.getByRole("alertdialog").getByRole("button", { name: /^Deactivate/ }), "no Deactivate in the question")
  await t.expectBanner(/deactivated/i, "deactivate")
  const again = await openSkillLink(t, BP)
  await again.locator("#edit-skill-name").fill(`${BP} x`)
  await t.p.waitForTimeout(500)
  if (!(await t.banner(/deactivated/i).count())) fail("a change in the panel removed the deactivated banner")
})
test("E41", "E", "The rule sentence is absent while Times needed is out of range or empty", async (t) => {
  await t.open(LIB)
  await openSkillLink(t, "Height")
  const sentence = t.p.locator("[data-rule-sentence]")
  for (const v of ["999", ""]) {
    await t.p.locator("#cfg-need").fill(v)
    await t.waitFor(async () => (await sentence.count()) === 0, `the sentence still shows at Times needed "${v}"`, 2000)
  }
  await t.p.locator("#cfg-need").fill("3")
  await t.visible(sentence, "no sentence at 3", QUICK)
  const text = await sentence.first().innerText()
  if (!/^Student needs 3 evaluations/.test(text)) fail(`at 3 it reads "${text.slice(0, 80)}"`)
})
test("E42", "E", "375: a 90-character unbroken name wraps in the panel's title", async (t) => {
  await t.p.setViewportSize({ width: 375, height: 812 })
  await t.open(LIB)
  let panel = await openSkillLink(t, "Height")
  const long = "W".repeat(90)
  await panel.locator("#edit-skill-name").fill(long)
  await t.click(panel.getByRole("button", { name: "Save changes" }), "no Save changes")
  await t.expectBanner(/saved\./i, "panel save")
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(600)
  panel = await openSkillLink(t, long)
  const h2 = panel.locator("h2").first()
  const [sw, cw] = await h2.evaluate((e) => [e.scrollWidth, e.clientWidth])
  if (sw > cw) fail(`the title is cut: scrollWidth ${sw} over clientWidth ${cw}`)
  await noSideScroll(t, "panel open")
})
test("B7", "B", "Bulk Times needed: a skill that cannot take it is named with the reason, the rest are written", async (t) => {
  await t.open(LIB)
  await expectTimes(t, { "Basic airway management": "3", "Vital signs and early warning score": "3" })
  await bulkEdit(t, [BP, "Basic airway management", "Vital signs and early warning score"], { times: 1 })
  await t.expectBanner(/2 skills updated\.\s*Not updated: Blood Pressure\.\s*2 different evaluators cannot sign 1 evaluation\./, "bulk times")
})
test("B8", "B", "Bulk Times needed where nothing moves says so, as info", async (t) => {
  await t.open(LIB)
  await expectTimes(t, { Height: "1", Weight: "1" })
  await bulkEdit(t, ["Height", "Weight"], { times: 1 })
  const b = await t.expectBanner(/No skills changed\.\s*All 2 already have these values\./, "second bulk")
  // The DS's info variant is drawn with its chip-1 tokens and carries no data attribute.
  const cls = await b.evaluate((e) => e.className)
  if (!/border-chip-1\b/.test(cls)) fail(`the banner is not info: ${String(cls).slice(0, 120)}`)
})
test("B9", "B", "Bulk Times needed on one at the value and one not says both", async (t) => {
  await t.open(LIB)
  await expectTimes(t, { Height: "1", "Basic airway management": "3" })
  await bulkEdit(t, ["Height", "Basic airway management"], { times: 1 })
  await t.expectBanner(/1 skill updated\.\s*1 already has these values\./, "mixed bulk")
})
test("B10", "B", "Bulk edit keeps the tag when the number is refused, and names the field", async (t) => {
  await t.open(LIB)
  await bulkEdit(t, [BP], { times: 1, tag: "Fix round tag" })
  await t.expectBanner(/1 skill updated\.\s*Times needed not changed: Blood Pressure\.\s*2 different evaluators cannot sign 1 evaluation\./, "tag and number")
  const row = await t.row(BP)
  if (!/Fix round tag/.test(await row.innerText())) fail("the tag is not on the row")
})
test("B11", "B", "Selection persists under a search: N selected, M not shown", async (t) => {
  await t.open(LIB)
  await t.selectRows([BP, "Height", "Weight"])
  const s = t.main.getByRole("searchbox").first()
  await s.fill("zzzz nothing has this")
  await t.waitFor(async () => /3 selected, 3 not shown/.test(await bulkBarText(t)), async () => `bar reads "${await bulkBarText(t)}"`)
  await t.visible(t.p.locator("[data-exxat-bulk-bar]").getByRole("button", { name: /^Deactivate 3/ }), "no Deactivate 3")
  await s.fill("")
  await t.waitFor(async () => { const b = await bulkBarText(t); return /3 selected/.test(b) && !/not shown/.test(b) }, async () => `after clearing the search the bar reads "${await bulkBarText(t)}"`)
})
test("B12", "B", "Selection persists across tabs and still acts on what is not shown", async (t) => {
  await t.open(LIB)
  await t.selectRows([BP, "Height", "Weight"])
  await t.click(t.main.getByRole("tab", { name: /^Inactive/ }), "no Inactive tab")
  await t.waitFor(async () => /3 selected, 3 not shown/.test(await bulkBarText(t)), async () => `bar reads "${await bulkBarText(t)}"`)
  await t.click(t.p.locator("[data-exxat-bulk-bar]").getByRole("button", { name: /^Deactivate 3/ }), "no Deactivate 3")
  const d = t.p.getByRole("alertdialog")
  await t.visible(d, "no question", QUICK)
  if (!/Deactivate 3 skills\?/.test(await d.innerText())) fail(`the question reads "${(await d.innerText()).slice(0, 60)}"`)
  await d.getByRole("button", { name: "Keep active" }).click()
  await t.p.waitForTimeout(400)
  if (!/3 selected, 3 not shown/.test(await bulkBarText(t))) fail(`Keep active changed the bar to "${await bulkBarText(t)}"`)
  await t.click(t.main.getByRole("tab", { name: /^All/ }), "no All tab")
  for (const n of [BP, "Height", "Weight"]) await t.waitFor(() => t.p.getByRole("checkbox", { name: new RegExp(`^Select row.*${esc(n)}$`) }).first().isChecked(), `${n} is no longer ticked on All`)
})
test("B13", "B", "The header box on another tab adds to the selection and takes away only what it added", async (t) => {
  await t.open(LIB)
  await t.selectRows([BP, "Height", "Weight"])
  await t.click(t.main.getByRole("tab", { name: /^Inactive/ }), "no Inactive tab")
  await t.p.waitForTimeout(700)
  const inactive = await t.tabCount(/^Inactive/)
  const header = t.main.getByRole("checkbox", { name: /select all/i }).first()
  await t.click(header, "no header box")
  await t.waitFor(async () => new RegExp(`${3 + inactive} selected, 3 not shown`).test(await bulkBarText(t)), async () => `bar reads "${await bulkBarText(t)}", expected ${3 + inactive} selected, 3 not shown`)
  await t.click(header, "no header box")
  await t.waitFor(async () => /(^|\s)3 selected, 3 not shown/.test(await bulkBarText(t)), async () => `bar reads "${await bulkBarText(t)}"`)
})
test("B14", "B", "Back on a dirty bulk sheet asks; Keep editing keeps it; Discard leaves", async (t) => {
  await t.open(CATS)
  await t.open(LIB)
  await t.selectRows([BP, "Height"])
  await t.click(t.p.locator("[data-bulk-edit-trigger]"), "no Edit N skills")
  const pan = t.p.locator("[data-slot=lab-bulk-edit]")
  await t.click(pan.locator("#bulk-times-mode"), "no Times needed mode")
  await t.click(t.p.getByRole("option", { name: "Set a number" }), "no Set a number")
  await pan.locator("#bulk-times").fill("4")
  const at = t.p.url()
  await t.p.goBack().catch(() => {})
  await t.expectDiscardPrompt("Back on a dirty sheet")
  await t.p.getByRole("alertdialog").getByRole("button", { name: "Keep editing" }).click()
  await t.p.waitForTimeout(500)
  if ((await pan.locator("#bulk-times").inputValue()) !== "4") fail("Keep editing lost the value")
  if (t.p.url() !== at) fail(`Keep editing moved the URL to ${t.p.url()}`)
  await t.p.goBack().catch(() => {})
  await t.expectDiscardPrompt("Back again")
  await t.p.getByRole("alertdialog").getByRole("button", { name: "Discard" }).click()
  await t.waitFor(() => /categories-tags/.test(t.p.url()), () => `Discard did not go to the previous page: ${t.p.url()}`, 15_000)
})
test("B15", "B", "One tag in Add tags and Remove tags is stopped, in the sheet", async (t) => {
  await t.open(LIB)
  await t.selectRows(["Height", "Weight"])
  await t.click(t.p.locator("[data-bulk-edit-trigger]"), "no Edit N skills")
  const pan = t.p.locator("[data-slot=lab-bulk-edit]")
  await pan.locator("#bulk-add-tags").fill("Patient safety")
  await pan.locator("#bulk-add-tags").press("Enter")
  await pan.locator("#bulk-remove-tags").fill("patient safety")
  await pan.locator("#bulk-remove-tags").press("Enter")
  await t.p.waitForTimeout(300)
  const err = await pan.locator("#bulk-remove-tags-error").innerText().catch(() => "")
  if (!/^Patient safety is in both Add tags and Remove tags\. Keep it in one\./.test(err)) fail(`the message reads "${err}"`)
  await t.click(pan.getByRole("button", { name: /^Update/ }), "no Update")
  await t.p.waitForTimeout(500)
  if (!(await pan.count())) fail("Update closed the sheet")
  if ((await activeInfo(t)).id !== "bulk-remove-tags") fail(`focus is on ${JSON.stringify(await activeInfo(t))}, not Remove tags`)
  if ((await t.banner(/updated|changed/i).count())) fail("a banner says something was written")
})
test("L21", "L", "Dismissing a result banner brings the not configured banner back at once", async (t) => {
  await t.open(`${LIB}?program=new`)
  const name = unique("Dismissed")
  await addOnNewProgram(t, name)
  const added = await t.expectBanner(/added/i, "add")
  await added.getByRole("button", { name: /dismiss/i }).click()
  await t.expectBanner(/^1 skill not configured\./, "after dismissing added")
  const panel = await openSkillLink(t, name)
  await panel.locator("#edit-skill-name").fill(`${name} b`)
  await t.click(panel.getByRole("button", { name: "Save changes" }), "no Save changes")
  const saved = await t.expectBanner(/saved\./i, "panel save")
  await saved.getByRole("button", { name: /dismiss/i }).click()
  await t.expectBanner(/^1 skill not configured\./, "after dismissing saved")
})
test("L22", "L", "Clear on the bulk bar returns focus to the row", async (t) => {
  await t.open(LIB)
  await t.selectRows([BP])
  await t.click(t.p.locator("[data-exxat-bulk-bar]").getByRole("button", { name: /clear/i }), "no clear")
  await t.waitFor(async () => (await activeInfo(t)).text === BP && (await activeInfo(t)).skill, async () => `focus is on ${JSON.stringify(await activeInfo(t))}`, 2000)
})
test("L23", "L", "Reactivate from the banner returns focus to the row", async (t) => {
  await t.open(LIB)
  await t.rowMenuItem("Height", /^Deactivate/)
  await t.click(t.p.getByRole("alertdialog").getByRole("button", { name: /^Deactivate/ }), "no Deactivate in the question")
  const b = await t.expectBanner(/deactivated/i, "deactivate")
  await b.getByRole("button", { name: /^Reactivate/ }).click()
  const asked = t.p.getByRole("alertdialog")
  if (await t.isVisible(asked, 600)) await asked.getByRole("button", { name: /^Reactivate/ }).click()
  await t.waitFor(async () => (await activeInfo(t)).text === "Height" && (await activeInfo(t)).skill, async () => `focus is on ${JSON.stringify(await activeInfo(t))}`, 3000)
})
test("L24", "L", "After the impact question on a Times needed cell, focus goes to the next control in the row", async (t) => {
  const cell = t.main.getByRole("spinbutton", { name: `Times needed for ${BP}` })
  for (const [value, button] of [["7", /^Cancel/], ["7", /^Save changes/]]) {
    await t.open(LIB)
    await t.main.getByRole("searchbox").first().fill(BP)
    await t.p.waitForTimeout(800)
    await cell.fill(value)
    await t.p.keyboard.press("Tab")
    const d = t.p.getByRole("alertdialog")
    await t.visible(d, `Times needed ${value} asked no question`, QUICK)
    await d.getByRole("button", { name: button }).click()
    await t.waitFor(() => t.p.evaluate((name) => { const a = document.activeElement; const r = a?.closest("tr"); return !!r && r.textContent.includes(name) && /^Configuration\b/.test(a.getAttribute("aria-label") ?? "") }, BP), async () => `after ${button}, focus is on ${JSON.stringify(await activeInfo(t))}`, 2000)
  }
})
test("L25", "L", "Esc on a row's Deactivate question returns focus to its menu button", async (t) => {
  await t.open(LIB)
  await t.rowMenuItem("Height", /^Deactivate/)
  await t.visible(t.p.getByRole("alertdialog"), "no question", QUICK)
  await t.p.keyboard.press("Escape")
  await t.waitFor(async () => /^Actions for Height/.test((await activeInfo(t)).label), async () => `focus is on ${JSON.stringify(await activeInfo(t))}`, 2000)
})
test("L26", "L", "Loading keeps the table's own shape at every width", async (t) => {
  for (const [w, h, heads] of [[1440, 900, ["Skill", "Times needed", "Category", "Configuration", "Status"]], [1920, 1080, ["Skill", "Times needed", "Category", "Configuration", "Status"]], [375, 812, ["Skill", "Times needed"]]]) {
    await t.p.setViewportSize({ width: w, height: h })
    await t.open(`${LIB}?state=loading`)
    const read = (await t.main.locator("thead th, [role=columnheader]").filter({ visible: true }).allInnerTexts()).map((x) => x.trim()).filter(Boolean)
    for (const want of heads) if (!read.includes(want)) fail(`${w}: heads read ${read.join(", ")}, no ${want}`)
    if (w === 375 && read.some((x) => /Category|Configuration|Status/.test(x))) fail(`375: heads read ${read.join(", ")}`)
    if ((await t.main.locator("tbody [data-slot=skeleton], [data-slot=skeleton]").count()) < 3) fail(`${w}: no row skeletons`)
    if ((await t.main.locator("[data-loading-group]").count()) !== 1) fail(`${w}: no group row in the skeleton`)
    await noSideScroll(t, `${w}`)
  }
})
test("L27", "L", "With the Tags column on, the tags line under the name goes; off, it is back", async (t) => {
  await t.open(LIB)
  const lines = t.main.locator("[data-row-tags]")
  const anyVisible = async () => { for (const l of await lines.all()) if (await l.isVisible()) return true; return false }
  if (!(await anyVisible())) fail("no row shows a tags line to begin with")
  const toggle = async () => {
    await t.click(t.p.locator("[data-library-columns]"), "no Columns")
    await t.click(t.p.getByRole("menuitemcheckbox", { name: "Tags" }), "no Tags in Columns")
    await t.p.keyboard.press("Escape")
    await t.p.waitForTimeout(600)
  }
  await toggle()
  if (await anyVisible()) fail("the Tags column is on and a row still shows the tags line")
  await t.visible(t.main.getByRole("columnheader", { name: /^Tags/ }), "no Tags column", QUICK)
  await toggle()
  if (!(await anyVisible())) fail("the Tags column is off and the tags line did not come back")
})
const chipTexts = (t) => t.p.locator("[data-tags-picker] ul li").allInnerTexts().then((a) => a.map((x) => x.trim()))
test("A11", "A", "Tags: Enter makes the typed word; the program's spelling wins; an arrow picks the suggestion", async (t) => {
  await t.open(LIB)
  await t.click(t.p.locator("[data-add-skill-trigger]"), "no Add a skill")
  const tags = t.p.getByRole("combobox", { name: /Tags/ }).first()
  await t.click(tags, "no Tags box")
  await t.p.keyboard.type("Pa")
  await t.p.waitForTimeout(300)
  await t.p.keyboard.press("ArrowDown")
  await t.p.waitForTimeout(150)
  const lit = (await t.p.locator("[role=option][aria-selected=true]").first().innerText()).trim()
  await t.p.keyboard.press("Enter")
  await t.p.waitForTimeout(300)
  if (!(await chipTexts(t)).some((c) => c.includes(lit))) fail(`ArrowDown then Enter did not take "${lit}": ${await chipTexts(t)}`)
  await t.open(LIB)
  await t.click(t.p.locator("[data-add-skill-trigger]"), "no Add a skill")
  await t.click(tags, "no Tags box")
  await t.p.keyboard.type("Pa")
  await t.p.waitForTimeout(300)
  await t.p.keyboard.press("Enter")
  await t.p.waitForTimeout(300)
  if (!(await chipTexts(t)).some((c) => /^Pa\b/.test(c) && !/Patient/.test(c))) fail(`"Pa" and Enter gave: ${await chipTexts(t)}`)
  await t.click(tags, "no Tags box")
  await t.p.keyboard.type("patient safety")
  await t.p.waitForTimeout(300)
  await t.p.keyboard.press("Enter")
  await t.p.waitForTimeout(300)
  if (!(await chipTexts(t)).some((c) => /Patient safety/.test(c))) fail(`"patient safety" and Enter gave: ${await chipTexts(t)}`)
})
const groupOfRow = (t, name) => t.main.locator("[data-skill-link]", { hasText: new RegExp(`^${esc(name)}$`) }).first().evaluate((a) => { let r = a.closest("tr")?.previousElementSibling; while (r && r.querySelector("[data-skill-link]")) r = r.previousElementSibling; return r?.textContent?.replace(/\s+/g, " ").trim() ?? "" })
test("A12", "A", "Add several: new and Replace are named, shown, and persist under their real categories", async (t) => {
  await t.open(LIB)
  const before = await groupOfRow(t, DELETE_MAPPED)
  await t.click(t.p.locator("[data-add-menu-trigger]"), "no chevron")
  await t.click(t.p.getByRole("menuitem", { name: /Add several/ }), "no Add several")
  const name = unique("Brand new")
  await t.p.locator("#several-names").fill(`${name}\n${DELETE_MAPPED}`)
  await t.p.waitForTimeout(500)
  await t.click(t.p.locator("[data-several-repeats] li").nth(0).getByRole("combobox"), "no choice on the repeated line")
  await t.click(t.p.getByRole("option", { name: "Replace" }), "no Replace")
  await t.p.waitForTimeout(300)
  const prim = t.p.locator("[data-slot=lab-add-several] button[type=submit]")
  if ((await prim.innerText()).trim() !== "Add 1, replace 1") fail(`the primary reads "${(await prim.innerText()).trim()}"`)
  await prim.click()
  const b = await t.expectBanner(/added|replaced/i, "add several")
  await t.click(b.getByRole("button", { name: "Show them" }), "no Show them")
  await t.p.waitForTimeout(900)
  const shown = async () => (await t.main.locator("[data-skill-link]").allInnerTexts()).map((x) => x.trim()).sort()
  if (!same(await shown(), [name, DELETE_MAPPED].sort())) fail(`Show them lists: ${await shown()}`)
  await t.reload()
  if (!same(await shown(), [name, DELETE_MAPPED].sort())) fail(`after reload: ${await shown()}`)
  const after = await groupOfRow(t, DELETE_MAPPED)
  if (after.split(/\d/)[0].trim() !== before.split(/\d/)[0].trim()) fail(`${DELETE_MAPPED} moved from "${before}" to "${after}"`)
})
test("A13", "A", "Add several: the repeated-line selects line up; Category and Tags are one height", async (t) => {
  await t.open(LIB)
  await t.click(t.p.locator("[data-add-menu-trigger]"), "no chevron")
  await t.click(t.p.getByRole("menuitem", { name: /Add several/ }), "no Add several")
  await t.p.locator("#several-names").fill(`${DELETE_MAPPED}\n${BP}\nHeight\nWeight`)
  await t.p.waitForTimeout(500)
  const xs = await t.p.locator("[data-several-repeats] [role=combobox], [data-several-all] [role=combobox]").evaluateAll((a) => a.map((e) => Math.round(e.getBoundingClientRect().left)))
  if (xs.length < 5 || new Set(xs).size !== 1) fail(`select left edges: ${xs.join(", ")}`)
  const h1 = await t.p.locator("#several-category").evaluate((e) => Math.round(e.getBoundingClientRect().height))
  const h2 = await t.p.locator("[data-tags-picker]").last().evaluate((e) => Math.round(e.getBoundingClientRect().height))
  if (h1 !== h2) fail(`Category is ${h1} px, Tags ${h2} px`)
})

// ------------------------------------------------------------------ Evaluation settings
const setDialog = (t) => t.p.locator("[data-apply-dialog]")
const setText = async (t) => (await setDialog(t).innerText()).replace(/\s+/g, " ")
const needBox = (t) => t.p.locator("#cfg-need")
/** Times needed is a row that opens on Edit (D-L140): open it, then the field. */
const openNeed = async (t) => { await t.settingsRow("times"); return needBox(t) }
const pressSave = async (t) => { await t.closeSettingsPanel(); await t.click(t.p.getByRole("button", { name: /^Save (changes|settings)$/ }), "no Save on Evaluation settings"); await t.p.waitForTimeout(400) }
const pressApply = async (t) => { await t.click(setDialog(t).getByRole("button", { name: /^Apply/ }), "no Apply"); await t.p.waitForTimeout(800) }
const ownLinkCount = async (t) => { const l = t.main.getByRole("link", { name: /different number|own number/ }); await t.visible(l, "no different number link"); return +(await l.first().innerText()).replace(/,/g, "").match(/\d+/)[0] }
const timesInLibrary = async (t, name) => { await t.open(LIB); await t.main.getByRole("searchbox").first().fill(name); await t.p.waitForTimeout(800); const c = t.main.locator("[data-times-cell]").first(); return { value: await c.locator("input").inputValue(), differs: await c.getAttribute("data-times-differs") } }
const followerName = async (t) => { await t.open(LIB); for (const r of await t.skillRows().all()) { const x = await r.innerText(); if (!x.includes(BP) && /\bDefault\b/.test(x) && !/This skill's own number/.test(x)) return (await r.locator("[data-skill-link]").innerText()).trim() } fail("no skill follows the program's number") }
const chooseBinary = async (t, first, second, qualifying) => {
  await t.settingsRow("judged")
  await t.click(t.p.locator("#cfg-model-binary"), "no Approved or not approved")
  await t.p.waitForTimeout(400)
  const sure = t.p.getByRole("alertdialog")
  if (await t.isVisible(sure, 600)) await sure.getByRole("button", { name: /^Switch/ }).click()
  await t.p.waitForTimeout(400)
  await t.settingsRow("labels")
  await t.p.getByRole("textbox", { name: /^First label/ }).fill(first)
  await t.p.getByRole("textbox", { name: /^Second label/ }).fill(second)
  await t.p.getByRole("radiogroup", { name: /which (one|outcome) (qualifies|counts)/i }).getByRole("radio").nth(qualifying).click()
  await t.p.waitForTimeout(200)
}
const chooseQuestions = async (t) => {
  await t.settingsRow("judged")
  await t.click(t.p.locator("#cfg-model-question"), "no Questions")
  await t.p.waitForTimeout(400)
  const sure = t.p.getByRole("alertdialog")
  if (await t.isVisible(sure, 600)) await sure.getByRole("button", { name: /^Switch/ }).click()
  await t.p.waitForTimeout(400)
  // The questions open in a side panel over the page (D-L140).
  await t.settingsRow("questions")
}
const focusedIs = async (t, what, ok) => t.waitFor(async () => { const a = await activeInfo(t); return !a.body && ok(a) }, async () => `${what}: focus is on ${JSON.stringify(await activeInfo(t))}`, 2000)

test("S4a", "S", "No skills: 'Apply these settings?', no number, Settings saved, persists", async (t) => {
  await t.open(`${SET}?program=new`)
  await t.fillIndependence()
  await pressSave(t)
  await t.visible(setDialog(t), "saving opened no Apply dialog", QUICK)
  const text = await setText(t)
  if (!/Apply these settings\?/.test(text)) fail(`the title is not "Apply these settings?": "${text.slice(0, 80)}"`)
  if (!/New skills take these settings when they are added\./.test(text)) fail(`the dialog reads "${text.slice(0, 120)}"`)
  if (/\d/.test(text)) fail(`a number shows with no skills to count: "${text.slice(0, 120)}"`)
  if (await setDialog(t).locator("dt").count()) fail("the dialog has rows with nothing to say")
  await t.visible(setDialog(t).getByRole("button", { name: "Apply settings", exact: true }), "the button does not read Apply settings", QUICK)
  await pressApply(t)
  const b = await t.expectBanner(/^Settings saved\./, "first save, no skills")
  await t.visible(t.action(/^Open the library$/, b), "banner has no Open the library")
  await t.leaveAndReturn(`${SET}?program=new`)
  await t.settingsRow("judged")
  if (!(await t.main.getByRole("radio", { name: /^Independence level/ }).isChecked())) fail("the saved model did not survive a reload")
})
test("S4b", "S", "One skill: 'Apply to 1 skill?', Saved for 1 skill", async (t) => {
  await t.open(`${LIB}?program=new`)
  await addOnNewProgram(t, unique("One"))
  await t.open(`${SET}?program=new`)
  await t.fillIndependence()
  await pressSave(t)
  await t.visible(setDialog(t), "saving opened no Apply dialog", QUICK)
  if (!/Apply to 1 skill\?/.test(await setText(t))) fail(`the title is not "Apply to 1 skill?": "${(await setText(t)).slice(0, 80)}"`)
  await pressApply(t)
  await t.expectBanner(/^Saved for 1 skill\./, "first save, one skill")
})
test("S8b", "S", "A number that comes to match the program's stays the skill's own: dialog, link, Library, filter", async (t) => {
  // The dialog counts Default skills with their own number; the link counts every skill on another number, Custom ones too (D3).
  await t.open(`${LIB}?different=1&config=default`)
  const ownDefault = await t.allCount()
  await t.open(SET)
  const before = await ownLinkCount(t)
  await (await openNeed(t)).fill("2")
  await pressSave(t)
  const text = await setText(t)
  const said = +text.replace(/,/g, "").match(/(\d+) keep their number/)?.[1]
  if (said !== ownDefault) fail(`the dialog says ${said} keep their number; before this save the Library's Default rows on another number were ${ownDefault}`)
  await pressApply(t)
  if ((await ownLinkCount(t)) < before) fail(`the link fell from ${before} to ${await ownLinkCount(t)}`)
  const bp = await timesInLibrary(t, BP)
  if (bp.value !== "2") fail(`${BP} reads ${bp.value}`)
  await t.open(`${LIB}?different=1`)
  await t.main.getByRole("searchbox").first().fill(BP)
  await t.waitFor(async () => (await t.main.locator("[data-skill-link]").count()) === 1, `${BP} is not under the Different number filter`)
})
test("S8c", "S", "Past the match: it stays, a follower moves, the link equals the filter", async (t) => {
  const follower = await followerName(t)
  await t.open(SET)
  await (await openNeed(t)).fill("2")
  await pressSave(t)
  const keep2 = +(await setText(t)).replace(/,/g, "").match(/(\d+) keep their number/)?.[1]
  const change2 = (await setText(t)).replace(/,/g, "").match(/(\d+) will change/)?.[1]
  await pressApply(t)
  await (await openNeed(t)).fill("4")
  await pressSave(t)
  const text = (await setText(t)).replace(/,/g, "")
  if (+text.match(/(\d+) keep their number/)?.[1] !== keep2) fail(`keep their number moved from ${keep2}: "${text.slice(0, 120)}"`)
  if (text.match(/(\d+) will change/)?.[1] !== change2) fail(`will change moved from ${change2}: "${text.slice(0, 120)}"`)
  await pressApply(t)
  const link = await ownLinkCount(t)
  if ((await timesInLibrary(t, BP)).value !== "2") fail(`${BP} moved off its number`)
  if ((await timesInLibrary(t, follower)).value !== "4") fail(`${follower} did not follow to 4`)
  await t.open(`${LIB}?different=1`)
  const all = await t.allCount()
  if (all !== link) fail(`the link says ${link}, the filter holds ${all}`)
})
test("S8d", "S", "Typing the program's number on the skill is the way back", async (t) => {
  await t.open(SET)
  await (await openNeed(t)).fill("2")
  await pressSave(t); await pressApply(t)
  await (await openNeed(t)).fill("4")
  await pressSave(t); await pressApply(t)
  await t.open(LIB)
  await t.setTimes(BP, 4)
  await t.open(SET)
  await (await openNeed(t)).fill("5")
  await pressSave(t); await pressApply(t)
  const bp = await timesInLibrary(t, BP)
  if (bp.value !== "5") fail(`${BP} reads ${bp.value}, not 5`)
})
test("S2b", "S", "The switch-model question stays inside its card at every width", async (t) => {
  for (const [w, h] of [[375, 812], [1440, 900], [1920, 1080]]) {
    await t.p.setViewportSize({ width: w, height: h })
    await t.open(SET)
    await t.settingsRow("judged")
    await t.click(t.p.locator("#cfg-model-binary"), "no Approved or not approved")
    const al = t.p.getByRole("alertdialog")
    await t.visible(al, "no question", QUICK)
    await t.p.waitForTimeout(300)
    const box = await al.boundingBox()
    const rights = await al.locator("button").evaluateAll((a) => a.map((b) => b.getBoundingClientRect().right))
    if (rights.some((r) => r > box.x + box.width + 0.5)) fail(`${w}: a button's right edge ${Math.max(...rights)} is past the card's ${box.x + box.width}`)
  }
})
test("S21", "S", "Student fields edit in place: add, name, type, choices, Required; Save changes only once something changed", async (t) => {
  await t.open(SET)
  const save = t.p.getByRole("button", { name: /^Save changes/ }).first()
  if (!(await save.isDisabled())) fail("Save changes is enabled before anything changed")
  const n = await t.main.locator("[data-student-field]").count()
  await t.click(t.main.getByRole("button", { name: "Add a field", exact: true }), "no Add a field")
  await focusedIs(t, "Add a field", (a) => a.id === `cfg-field-${n}`)
  await t.p.locator(`#cfg-field-${n}`).fill("Site")
  await t.p.waitForTimeout(200)
  if (await save.isDisabled()) fail("Save changes stayed disabled after a field was added")
  await t.click(t.p.locator(`#cfg-field-${n}-type`), "no Type on the new field")
  await t.click(t.p.getByRole("option", { name: "Choice list" }), "no Choice list type")
  const chips = t.p.locator(`#cfg-field-${n}-choices`)
  await t.visible(chips, "a choice list shows no choices box", QUICK)
  for (const c of ["Clinic", "Hospital"]) { await chips.fill(c); await t.p.keyboard.press("Enter"); await t.p.waitForTimeout(150) }
  const row = t.main.locator("[data-student-field]").nth(n)
  if (!/Clinic/.test(await row.innerText()) || !/Hospital/.test(await row.innerText())) fail(`the choices did not become chips: "${(await row.innerText()).replace(/\s+/g, " ")}"`)
  await t.click(t.p.locator(`#cfg-field-${n}-req`), "no Required on the new field")
  if ((await t.p.locator(`#cfg-field-${n}-req`).getAttribute("aria-checked")) !== "true") fail("Required did not tick")
})
test("S22", "S", "Paste a list gives focus back to its opener; Add a field moves it to the new field, never the page", async (t) => {
  await t.open(SET)
  await chooseQuestions(t)
  const paste = t.p.getByRole("button", { name: "Paste a list" })
  await paste.focus(); await t.p.keyboard.press("Enter")
  await t.click(t.p.getByRole("dialog").getByRole("button", { name: "Cancel" }), "no Cancel on Paste a list")
  await focusedIs(t, "Paste a list, Cancel", (a) => /Paste a list/.test(a.text))
  await paste.click()
  await t.p.locator("#cfg-paste-questions").fill("Washes hands\nChecks ID")
  await t.click(t.p.getByRole("dialog").getByRole("button", { name: /^Add/ }), "no Add on Paste a list")
  await focusedIs(t, "Paste a list, Add", (a) => /Paste a list/.test(a.text))
  await t.open(SET)
  const addF = t.main.getByRole("button", { name: "Add a field", exact: true })
  const n = await t.main.locator("[data-student-field]").count()
  await addF.focus(); await t.p.keyboard.press("Enter")
  await focusedIs(t, "Add a field", (a) => a.id === `cfg-field-${n}`)
})
test("S23", "S", "No level chosen: no rule sentence; one chosen on the track: it returns", async (t) => {
  await t.open(`${SET}?program=new`)
  await t.fillIndependence(["Observed", "Assisted", "Independent"], "2")
  await t.waitFor(async () => (await t.p.locator("[data-rule-sentence]").count()) === 1, "no sentence with every row filled", 1500)
  // A new program again: the levels named, no level chosen, the number typed.
  await t.open(`${SET}?program=new`)
  await t.settingsRow("judged")
  await t.click(t.main.getByRole("radio", { name: /^Independence level/ }), "no Independence level option")
  await t.levelNames()
  for (const [i, n] of ["Observed", "Assisted"].entries()) {
    if ((await t.levelBoxes().count()) <= i) await t.click(t.button(/^Add a level/, t.main), "no Add a level")
    await t.levelBoxes().nth(i).fill(n)
  }
  await t.settingsRow("times")
  await (await openNeed(t)).fill("2")
  await t.settingsRow("signers")
  const role = t.main.getByRole("checkbox", { name: /^Preceptor/ })
  if (!(await role.isChecked())) await role.click()
  await t.waitFor(async () => (await t.p.locator("[data-rule-sentence]").count()) === 0, "a sentence shows with no level counting", 1500)
  await t.settingsRow("levels")
  await t.p.locator("[data-level-segment]").last().click()
  await t.visible(t.p.locator("[data-rule-sentence]"), "the sentence did not return", QUICK)
})
test("S24", "S", "One question, At least 9: says there is 1, not 'from 1 to 1'", async (t) => {
  await t.open(SET)
  await chooseQuestions(t)
  const q = t.p.locator("input[id^=cfg-question-]")
  if (!(await q.count())) await t.p.getByRole("button", { name: /Add a question/ }).click()
  await t.p.waitForTimeout(200)
  await q.first().fill("One question")
  while ((await q.count()) > 1) { await t.p.getByRole("button", { name: /Remove question/i }).last().click(); await t.p.waitForTimeout(100) }
  await t.p.locator("#cfg-qrule-atleast").click()
  await t.p.locator("#cfg-qrule-n").fill("9")
  await pressSave(t)
  const prob = (await t.p.locator("[data-rule-panel]").innerText()).replace(/\s+/g, " ")
  if (!/[Ee]nter 1\. There is 1 question\./.test(prob)) fail(`the problem reads "${prob.slice(0, 100)}"`)
})
test("S25", "S", "Paste a list leaves repeats out and says so; only repeats, nothing to add", async (t) => {
  await t.open(SET)
  await chooseQuestions(t)
  const paste = t.p.getByRole("button", { name: "Paste a list" })
  const values = () => t.p.locator("input[id^=cfg-question-]").evaluateAll((a) => a.map((i) => i.value).filter(Boolean))
  await paste.click()
  await t.p.locator("#cfg-paste-questions").fill("A\nA\na\nB")
  await t.p.waitForTimeout(200)
  const d = t.p.getByRole("dialog")
  await t.visible(d.getByRole("button", { name: "Add 2 questions", exact: true }), "the button does not read Add 2 questions", QUICK)
  if (!/2 repeats are left out\./.test(await d.innerText())) fail(`the dialog reads "${(await d.innerText()).replace(/\s+/g, " ").slice(0, 120)}"`)
  await d.getByRole("button", { name: "Add 2 questions", exact: true }).click()
  await t.p.waitForTimeout(400)
  const vals = await values()
  if (vals.filter((v) => /^(a|b)$/i.test(v)).length !== 2) fail(`questions read: ${vals.join(", ")}`)
  await paste.click()
  await t.p.locator("#cfg-paste-questions").fill("B")
  await t.p.waitForTimeout(200)
  if (!/These questions are already on the list\./.test(await d.innerText())) fail(`the dialog reads "${(await d.innerText()).replace(/\s+/g, " ").slice(0, 120)}"`)
  if (!(await d.getByRole("button", { name: /^Add/ }).first().isDisabled())) fail("Add is enabled with nothing to add")
})
test("S26", "S", "Off and on again is no change: Save stays disabled", async (t) => {
  await t.open(SET)
  const s = t.p.getByRole("button", { name: /^Save changes/ })
  if (!(await s.isDisabled())) fail("Save changes is enabled before anything changed")
  await t.p.locator("#cfg-checkoff").click(); await t.p.waitForTimeout(150)
  if (await s.isDisabled()) fail("the change did not enable Save changes")
  await t.p.locator("#cfg-checkoff").click(); await t.p.waitForTimeout(200)
  if (!(await s.isDisabled())) fail("back where it started, Save changes is still enabled")
})
test("S27", "S", "Nobody moves: no students row; first save with no skills: no zero", async (t) => {
  await t.open(SET)
  await t.p.locator("#cfg-self").click()
  await t.p.waitForTimeout(150)
  await pressSave(t)
  await t.visible(setDialog(t), "saving opened no Apply dialog", QUICK)
  if (/Students whose progress changes/.test(await setText(t))) fail(`a students row shows with nobody moving: "${await setText(t)}"`)
  await t.open(`${SET}?program=new`)
  await t.fillIndependence()
  await pressSave(t)
  await t.visible(setDialog(t), "saving opened no Apply dialog", QUICK)
  if (/\b0\b/.test(await setText(t))) fail(`a zero shows: "${await setText(t)}"`)
})
test("S28", "S", "1920: the sheet and the rule panel side by side, top aligned; Preview is a dialog", async (t) => {
  await t.p.setViewportSize({ width: 1920, height: 1080 })
  await t.open(SET)
  const [a, b] = await t.p.evaluate(() => [document.querySelector("[data-sheet]")?.getBoundingClientRect(), document.querySelector("[data-rule-panel]")?.getBoundingClientRect()].map((r) => (r ? { left: r.left, right: r.right, top: r.top } : null)))
  if (!a || !b) fail("no sheet or rule panel at 1920")
  if (!(b.left > a.right) || Math.abs(a.top - b.top) > 2) fail(`the sheet and the rule panel are not side by side: ${JSON.stringify([a, b])}`)
  const { gap, width } = await t.rightGap()
  if (gap > width * 0.1) fail(`${gap}px empty on the right of a ${width}px page`)
  await t.click(t.button(/^Preview$/, t.main), "no Preview button")
  await t.visible(t.dialog().first(), "Preview opened no dialog", QUICK)
})
test("S29", "S", "Model tiles: at most 3 lines, one row of four on desktop, full words", async (t) => {
  for (const [w, h] of [[375, 812], [1440, 900], [1920, 1080]]) {
    await t.p.setViewportSize({ width: w, height: h })
    await t.open(SET)
    await t.settingsRow("judged")
    const tiles = await t.p.locator("[data-model-tile]").evaluateAll((a) => a.map((e) => {
      const r = e.getBoundingClientRect()
      const lines = [...e.querySelectorAll("span[id]")].reduce((n, s) => n + Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight)), 0)
      const cut = [...e.querySelectorAll("span")].some((s) => s.scrollWidth > s.clientWidth + 1 && getComputedStyle(s).textOverflow === "ellipsis") || /…/.test(e.innerText)
      return { x: Math.round(r.left), y: Math.round(r.top), lines, cut, text: e.innerText }
    }))
    if (!tiles.length) fail(`${w}: no model tiles`)
    for (const x of tiles) { if (x.lines > 3) fail(`${w}: "${x.text.slice(0, 30)}" runs ${x.lines} lines`); if (x.cut) fail(`${w}: "${x.text.slice(0, 30)}" is cut`) }
    // Under How skills are judged (D-L141): 2 by 2 in the fields column.
    const rows = new Set(tiles.map((x) => x.y)).size
    if (w >= 1440 && rows > 2) fail(`${w}: tiles run ${rows} rows`)
    // The closed Levels row lists the names: "3 levels: Needs coaching, With assistance, Works alone".
    const listed = (await t.levelBoxes().evaluateAll((a) => a.map((x) => x.value.trim()).filter(Boolean)).catch(() => [])).reverse()
    const first = listed[0] ?? ""
    const last = listed[listed.length - 1] ?? ""
    const ind = tiles.find((x) => /^Independence level/.test(x.text))
    if (first && last && ind && !(new RegExp(esc(first), "i").test(ind.text) && new RegExp(esc(last), "i").test(ind.text))) fail(`${w}: Independence level reads "${ind.text.replace(/\s+/g, " ")}", without ${first} and ${last}`)
  }
})
const FORM_C = "/lab/evaluator/evaluation-form?request=sub-maya-1&variant=C"
test("S30", "S", "Form C: Mark all names the shared label, else says counting", async (t) => {
  await t.open(SET)
  await chooseBinary(t, "Alpha", "Beta", 1)
  await pressSave(t); await pressApply(t)
  await t.open(FORM_C)
  const m = t.p.getByRole("button", { name: /^Mark all/ })
  await t.visible(m, "no Mark all on Form C")
  if ((await m.innerText()).trim() !== "Mark all as counting") fail(`it reads "${(await m.innerText()).trim()}" with two sets of labels`)
  await t.open(SET)
  await chooseBinary(t, "Met", "Unmet", 0)
  await pressSave(t); await pressApply(t)
  await t.open(FORM_C)
  await t.visible(m, "no Mark all on Form C")
  if ((await m.innerText()).trim() !== "Mark all met") fail(`it reads "${(await m.innerText()).trim()}" with one set of labels`)
})

// ------------------------------------------------------------------ Skill lists
const listLevel = async (t) => t.p.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((x) => x.getAttribute("data-state") !== "closed"); return e ? e.getAttribute("data-slot") : "table" }, LP)
const expectLevel = (t, want, what) => t.waitFor(async () => (await listLevel(t)) === want, async () => `${what}: at ${await listLevel(t)}, not ${want}`, 3000)
const listBtn = (t, name) => t.p.locator(LP).getByRole("button", { name, exact: typeof name === "string" })
const pressClose = (t) => t.click(listBtn(t, "Close"), "no Close on the panel")

test("T10", "T", "An empty program has one filled button: New skill list", async (t) => {
  for (const q of ["?state=empty", "?program=new"]) {
    await t.open(`${LISTS}${q}`)
    const filled = await t.p.locator("main [data-slot=button][data-variant=default]").filter({ visible: true }).allInnerTexts()
    if (filled.length !== 1 || filled[0].trim() !== "New skill list") fail(`${q}: filled buttons read ${JSON.stringify(filled)}`)
  }
})
test("T11", "T", "View skills: X and Esc go back one level, with focus on View skills; one more Esc closes", async (t) => {
  await t.open(`${LISTS}?list=list-core`)
  for (const how of ["X", "Esc"]) {
    await t.click(listBtn(t, /^View all/), "no View all")
    await expectLevel(t, "lab-admin-list-picker", "View skills")
    if (how === "X") await pressClose(t); else await t.p.keyboard.press("Escape")
    await expectLevel(t, "lab-admin-list-panel", how)
    if (!/list=list-core/.test(t.p.url())) fail(`${how}: the URL lost the list: ${t.p.url()}`)
    await focusedIs(t, how, (a) => /View all/.test(a.text))
  }
  await t.p.keyboard.press("Escape")
  await expectLevel(t, "table", "the next Esc")
})
test("T12", "T", "A clean picker goes back with no question", async (t) => {
  await t.open(`${LISTS}?list=list-clinical-2027`)
  for (const how of ["Esc", "X"]) {
    await t.click(listBtn(t, "Edit skills"), "no Edit skills")
    await expectLevel(t, "lab-admin-list-picker", "Edit skills")
    if (how === "X") await pressClose(t); else await t.p.keyboard.press("Escape")
    await expectLevel(t, "lab-admin-list-panel", how)
    if (await t.p.getByRole("alertdialog").count()) fail(`${how}: a clean picker asked a question`)
  }
})
test("T13", "T", "A dirty picker asks on each way out; Keep editing stays; Discard lands on the list's panel", async (t) => {
  await t.open(`${LISTS}?list=list-clinical-2027`)
  await t.click(listBtn(t, "Edit skills"), "no Edit skills")
  await expectLevel(t, "lab-admin-list-picker", "Edit skills")
  await t.p.locator(LP).getByRole("checkbox").first().click()
  await t.p.waitForTimeout(200)
  for (const how of ["Esc", "X"]) {
    if (how === "X") await pressClose(t); else await t.p.keyboard.press("Escape")
    await t.expectDiscardPrompt(how)
    await t.p.getByRole("alertdialog").getByRole("button", { name: "Keep editing" }).click()
    await t.p.waitForTimeout(300)
    if ((await listLevel(t)) !== "lab-admin-list-picker") fail(`${how}, Keep editing: at ${await listLevel(t)}`)
    if (!(await t.p.locator(`${LP} [data-unsaved-footer]`).count())) fail(`${how}, Keep editing: the footer has gone`)
  }
  await t.click(listBtn(t, "Cancel"), "no Cancel")
  await t.expectDiscardPrompt("Cancel")
  await t.p.getByRole("alertdialog").getByRole("button", { name: "Discard" }).click()
  await expectLevel(t, "lab-admin-list-panel", "Discard")
})
const newListNamed = async (t, n) => {
  await t.click(t.action(/^New skill list$/, t.main), "no New skill list")
  await t.p.locator("#list-name").fill(n)
  await t.p.waitForTimeout(200)
}
const addNewSkill = async (t, n) => {
  await t.click(t.p.getByRole("button", { name: "Write a skill", exact: true }), "no Write a skill")
  await t.p.locator("#new-skill-name").fill(n)
  await t.p.locator("#new-skill-name").press("Enter")
  await t.p.waitForTimeout(300)
}
test("T14", "T", "A new list left or discarded leaves no row and no panel", async (t) => {
  await t.open(LISTS)
  for (const how of ["Esc", "X", "Cancel"]) {
    const n = unique(`Zz ${how}`)
    await newListNamed(t, n)
    const d = t.dialog().first()
    if (how === "Esc") await t.p.keyboard.press("Escape")
    if (how === "X") await t.click(d.getByRole("button", { name: "Close", exact: true }), "no Close")
    if (how === "Cancel") await t.click(d.getByRole("button", { name: /^Cancel/ }), "no Cancel")
    await t.p.getByRole("alertdialog").getByRole("button", { name: "Discard" }).click()
    await t.waitFor(async () => (await t.dialog().count()) === 0, `${how}: the panel did not close`)
    if (await t.main.getByText(n).count()) fail(`${how}: a row named ${n} is in the table`)
  }
})
test("T15", "T", "Clean picker: no footer. A tick: Unsaved changes, Cancel, Save list as the one filled button. Untick: gone", async (t) => {
  await t.open(`${LISTS}?list=list-clinical-2027`)
  await t.click(listBtn(t, "Edit skills"), "no Edit skills")
  await expectLevel(t, "lab-admin-list-picker", "Edit skills")
  const footer = t.p.locator(`${LP} [data-unsaved-footer]`)
  if (await footer.count()) fail("a footer shows before any change")
  if (await listBtn(t, "Save list").count()) fail("Save list shows before any change")
  if (await listBtn(t, "Cancel").count()) fail("Cancel shows before any change")
  const box = t.p.locator(LP).getByRole("checkbox").first()
  await box.click()
  await t.visible(footer, "no footer after a tick", QUICK)
  const text = (await footer.innerText()).replace(/\s+/g, " ")
  if (!/Unsaved changes/.test(text) || !/Cancel/.test(text) || !/Save list/.test(text)) fail(`the footer reads "${text}"`)
  const filled = await t.p.locator(`${LP} [data-slot=button][data-variant=default]`).filter({ visible: true }).allInnerTexts()
  if (filled.length !== 1 || filled[0].trim() !== "Save list") fail(`filled buttons read ${JSON.stringify(filled)}`)
  await box.click()
  await t.waitFor(async () => (await footer.count()) === 0, "untick left the footer")
})
test("T16", "T", "A fresh list: Next with no skills says so under the drawing; adding one clears it and moves the buttons up", async (t) => {
  await t.open(LISTS)
  await newListNamed(t, unique("Zz fresh"))
  const d = t.dialog().first()
  await t.click(d.getByRole("button", { name: /^Next/ }), "no Next")
  await t.visible(t.p.locator("[data-no-skills-yet] [data-skill-error]"), "no message under the drawing", QUICK)
  await addNewSkill(t, unique("Zz skill"))
  await t.absent(t.p.locator("[data-skill-error]"), "the message stayed")
  await t.absent(t.p.locator("[data-no-skills-yet]"), "the drawing stayed")
  await t.visible(d.getByRole("button", { name: /^Choose from library$/ }), "no Choose from library beside the count", QUICK)
  await t.absent(d.getByRole("button", { name: /^Write a skill$/ }), "Write a skill repeats the field beside the count")
  await t.absent(d.getByRole("button", { name: /^Done$/ }), "a Done button is back in the add row")
  await t.absent(d.locator("[data-add-new-row] [data-category-picker]"), "a category select is back in the add row")
  if ((await t.p.locator("#new-skill-name").evaluate((el) => el === document.activeElement)) !== true) fail("focus left the field after Enter")
})
test("T17", "T", "A result banner does not follow into the picker", async (t) => {
  await t.open(`${LISTS}?list=list-core`)
  await t.click(listBtn(t, "Assign to students"), "no Assign to students")
  const d = await chooseSpecific(t)
  await d.locator("[data-add-groups] li").filter({ hasText: "Enrolled in 2025" }).getByRole("checkbox").click()
  await assignBtn(d).click()
  await t.p.waitForTimeout(500)
  await t.click(listBtn(t, "Undo"), "no Undo")
  await t.p.waitForTimeout(300)
  await t.click(listBtn(t, /^View all/), "no View all")
  await expectLevel(t, "lab-admin-list-picker", "View skills")
  const n = await t.p.locator(`${LP} [data-region=banner]`).count()
  if (n) fail(`${n} banner(s) in the picker`)
})
test("T18", "T", "A saved list: no banner in the picker, none after coming back", async (t) => {
  await t.open(LISTS)
  await newListNamed(t, unique("Zz saved"))
  await addNewSkill(t, unique("Zz skill"))
  await t.saveNewList()
  await expectLevel(t, "lab-admin-list-panel", "Back from step 2")
  await t.click(listBtn(t, "Edit skills"), "no Edit skills")
  await expectLevel(t, "lab-admin-list-picker", "Edit skills")
  if (await t.p.locator(`${LP} [data-region=banner]`).count()) fail("a banner in the picker")
  await pressClose(t)
  await expectLevel(t, "lab-admin-list-panel", "X")
  if (await t.p.locator(`${LP} [data-region=banner]`).count()) fail("the banner came back after the picker")
})
test("T28", "T", "New skill list add row: Enter adds and keeps focus, newest on top, a name already on the list says so, a pasted list adds each line", async (t) => {
  await t.open(LISTS)
  await newListNamed(t, unique("Zz add row"))
  const d = t.dialog().first()
  const a = unique("Zz first"), b = unique("Zz second")
  await addNewSkill(t, a)
  const field = t.p.locator("#new-skill-name")
  await field.fill(b)
  await field.press("Enter")
  await t.p.waitForTimeout(300)
  const rows = d.locator("[data-list-rows] > li")
  if ((await rows.count()) !== 2) fail(`want 2 rows, have ${await rows.count()}`)
  if (!(await rows.first().innerText()).includes(b)) fail("the newest skill is not on top")
  if ((await d.locator("[data-picked-count]").getAttribute("data-picked-count")) !== "2") fail("the count does not read 2")
  await field.fill(a)
  await field.press("Enter")
  await t.visible(d.locator("[data-typed-error]"), "a name already on the list says nothing", QUICK)
  if ((await field.inputValue()) !== a) fail("the typed name was cleared on a duplicate")
  if ((await rows.count()) !== 2) fail("a duplicate was added")
  await field.fill("")
  await field.evaluate((el, text) => { const dt = new DataTransfer(); dt.setData("text", text); el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })) }, [unique("Zz p1"), unique("Zz p2"), unique("Zz p3")].join("\n"))
  await t.p.waitForTimeout(300)
  if ((await rows.count()) !== 5) fail(`a pasted list of 3 left ${await rows.count()} rows, want 5`)
  await t.absent(d.locator("[data-typed-error]"), "the duplicate message stayed after a good add")
  await t.visible(d.locator("[data-row-category] [data-category-picker]").first(), "a skill written here has no way to set its category")
})
test("T19", "T", "A press outside leaves the panel from the picker too", async (t) => {
  await t.open(`${LISTS}?list=list-clinical-2027`)
  await t.click(listBtn(t, "Edit skills"), "no Edit skills")
  await expectLevel(t, "lab-admin-list-picker", "Edit skills")
  await t.p.mouse.click(400, 800)
  await expectLevel(t, "table", "a press outside")
})
const addRow = (d, name) => d.locator("[data-add-groups] li").filter({ has: d.page().getByText(name, { exact: true }) })
test("N10", "N", "Overlapping group: 'N already have it', and the button counts only the new", async (t) => {
  await t.open(`${LISTS}?list=list-core`)
  await t.click(listBtn(t, "Assign to students"), "no Assign to students")
  const d = await chooseSpecific(t)
  const r = addRow(d, "Enrolled in 2025")
  await r.getByRole("checkbox").click()
  await t.p.waitForTimeout(250)
  if (!/33 already have it/.test(await r.innerText())) fail(`the row reads "${(await r.innerText()).replace(/\s+/g, " ")}"`)
  const b = await assignText(d)
  if (b !== "Assign to 12 students") fail(`the button reads "${b}"`)
  await r.getByRole("checkbox").click()
  await t.p.waitForTimeout(250)
  if (/already have it/.test(await r.innerText())) fail("the note stayed after unticking")
})
test("N11", "N", "A group with no overlap reads Also on and no already", async (t) => {
  await t.open(`${LISTS}?list=list-core`)
  await t.click(listBtn(t, "Assign to students"), "no Assign to students")
  const d = await chooseSpecific(t)
  const r = addRow(d, "BSN 2027")
  await r.getByRole("checkbox").click()
  await t.p.waitForTimeout(250)
  const text = await r.innerText()
  if (!/Also on/.test(text) || /already/.test(text)) fail(`the row reads "${text.replace(/\s+/g, " ")}"`)
  const b = await assignText(d)
  if (b !== "Assign to 29 students") fail(`the button reads "${b}"`)
})
test("N12", "N", "One student already named: the note is singular", async (t) => {
  await t.open(`${LISTS}?list=list-core`)
  await t.click(listBtn(t, "Assign to students"), "no Assign to students")
  let d = await chooseSpecific(t)
  const groupRow = addRow(d, "BSN 2027")
  const groupText = (await groupRow.innerText()).replace(/\s+/g, " ")
  // A student of BSN 2027: students show once a filter is on.
  await t.click(d.getByRole("button", { name: /^Filters/ }), "no Filters button")
  await t.p.locator("[data-filters-panel]").getByRole("combobox", { name: "Cohort" }).click()
  await t.p.getByRole("option", { name: "BSN 2027", exact: true }).click()
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(400)
  const student = d.locator("[data-add-student-rows] li").filter({ hasText: "BSN 2027" }).first()
  await t.visible(student, `no student of BSN 2027 to name (${groupText})`)
  await student.getByRole("checkbox").click()
  await assignBtn(d).click()
  await t.p.waitForTimeout(500)
  await t.click(listBtn(t, "Assign to students"), "no Assign to students")
  d = await chooseSpecific(t)
  const r = addRow(d, "BSN 2027")
  await r.getByRole("checkbox").click()
  await t.p.waitForTimeout(250)
  if (!/1 already has it/.test(await r.innerText())) fail(`the row reads "${(await r.innerText()).replace(/\s+/g, " ")}"`)
})

// ------------------------------------------------------------------ Categories and tags
const addCat = (t) => t.main.getByRole("button", { name: "Add a category", exact: true })
test("C5", "C", "Error state: tabs with no numbers, Try again with no icon, and it works", async (t) => {
  await t.open(`${CATS}?state=error`)
  const tabs = (await t.main.getByRole("tablist").first().innerText()).replace(/\s+/g, " ").trim()
  if (/\d/.test(tabs) || !/Categories/.test(tabs) || !/Tags/.test(tabs)) fail(`tabs read "${tabs}"`)
  const again = t.p.getByRole("button", { name: "Try again" })
  await t.visible(again, "no Try again")
  if (await again.locator("i, svg").count()) fail("Try again has an icon (E5)")
  await again.click()
  await t.waitFor(() => !/state=/.test(t.p.url()), `Try again left ${t.p.url()}`)
  await t.waitFor(async () => /\d/.test(await t.main.getByRole("tablist").first().innerText()), "the counts did not come back")
  await t.open(`${LISTS}?state=error`)
  await t.visible(again, "no Try again on Skill lists")
  if (await again.locator("i, svg").count()) fail("Skill lists: Try again has an icon (E5)")
})
test("C6", "C", "Rename dialog: title names the thing, no description, focus in the field", async (t) => {
  await t.open(CATS)
  await t.click(t.p.getByRole("button", { name: "Actions for Airway" }), "no row menu on Airway")
  await t.click(t.p.getByRole("menuitem", { name: "Rename" }), "no Rename")
  const d = t.p.getByRole("dialog", { name: "Rename Airway" })
  await t.visible(d, "the title is not Rename Airway", QUICK)
  if (await d.locator("[data-slot=dialog-description]").count()) fail("the dialog has a description")
  await focusedIs(t, "Rename", (a) => a.id === "vocab-rename")
})
test("C7", "C", "Add a category does not move when pressed, is the one filled button, and focus goes to the field", async (t) => {
  for (const [w, h] of [[1440, 900], [1920, 1080]]) {
    await t.p.setViewportSize({ width: w, height: h })
    await t.open(CATS)
    const before = await boxOf(addCat(t))
    await addCat(t).click()
    await t.p.waitForTimeout(300)
    const after = await boxOf(addCat(t))
    if (!same(before, after)) fail(`${w}: the button moved from ${JSON.stringify(before)} to ${JSON.stringify(after)}`)
    const filled = await t.p.locator("main [data-slot=button][data-variant=default]").filter({ visible: true }).allInnerTexts()
    if (filled.length !== 1 || filled[0].trim() !== "Add a category") fail(`${w}: filled buttons read ${JSON.stringify(filled)}`)
    if ((await activeInfo(t)).id !== "settings-new") fail(`${w}: focus is on ${JSON.stringify(await activeInfo(t))}`)
  }
})
test("C8", "C", "A repeated name: error under the field, nothing moves, focus stays", async (t) => {
  await t.open(CATS)
  await addCat(t).click()
  const field = t.p.locator("#settings-new")
  await field.fill("Airway")
  const f0 = await boxOf(field), b0 = await boxOf(addCat(t))
  await field.press("Enter")
  const err = t.p.locator("#settings-new-error")
  await t.visible(err, "no error for a repeated name", QUICK)
  const e = await boxOf(err), f1 = await boxOf(field), b1 = await boxOf(addCat(t))
  if (!same(f0, f1) || !same(b0, b1)) fail(`the field or the button moved: ${JSON.stringify([f0, f1, b0, b1])}`)
  if (e.y < f1.y + f1.h || e.y > f1.y + f1.h + 8 || e.x < f1.x || e.x + e.w > f1.x + f1.w + 1) fail(`the error sits at ${JSON.stringify(e)}, the field at ${JSON.stringify(f1)}`)
  if ((await activeInfo(t)).id !== "settings-new") fail(`focus is on ${JSON.stringify(await activeInfo(t))}`)
})
test("C9", "C", "Adding: the field holds still, the new row is first, the page does not scroll, focus stays", async (t) => {
  for (const [w, h] of [[1440, 900], [1920, 1080], [375, 812]]) {
    await t.p.setViewportSize({ width: w, height: h })
    await t.open(CATS)
    await addCat(t).click()
    const field = t.p.locator("#settings-new")
    const name = unique(`Zeta ${w}`)
    await field.fill(name)
    const y0 = (await boxOf(field)).y, s0 = await pageScroll(t)
    await field.press("Enter")
    await t.expectBanner(/added/i, "add")
    await t.p.waitForTimeout(300)
    if ((await boxOf(field)).y !== y0) fail(`${w}: the field moved from y ${y0} to ${(await boxOf(field)).y}`)
    if ((await pageScroll(t)) !== s0) fail(`${w}: the page scrolled from ${s0} to ${await pageScroll(t)}`)
    const first = await t.main.locator("tbody tr").first().innerText()
    if (!first.includes(name)) fail(`${w}: the first row reads "${first.replace(/\s+/g, " ").slice(0, 60)}"`)
    if ((await activeInfo(t)).id !== "settings-new") fail(`${w}: focus is on ${JSON.stringify(await activeInfo(t))}`)
  }
})
test("C10", "C", "375: Cancel and Add a category sit on one line, right-aligned", async (t) => {
  await t.p.setViewportSize({ width: 375, height: 812 })
  await t.open(CATS)
  await addCat(t).click()
  await t.p.waitForTimeout(300)
  const form = t.p.locator("[data-inline-create]")
  const c = await boxOf(form.getByRole("button", { name: "Cancel" }))
  const a = await boxOf(addCat(t))
  if (!c || !a) fail("no Cancel or no Add a category beside it")
  if (Math.abs(c.y + c.h / 2 - (a.y + a.h / 2)) > 2) fail(`not on one line: ${JSON.stringify([c, a])}`)
  if (c.x > a.x) fail("Cancel is not first")
})
test("C11", "C", "Scrolled with the form open: the field stays in view and the column head stays under the tabs", async (t) => {
  await t.open(CATS)
  await addCat(t).click()
  await setPageScroll(t, 600)
  const f = await boxOf(t.p.locator("#settings-new"))
  const port = await boxOf(t.p.locator("[data-page-scroll]"))
  if (f.y < port.y || f.y + f.h > port.y + port.h) fail(`the field is out of view at y ${f.y}`)
  // The DS keeps the head on screen by moving it as painted; so read what a person sees, just under the tabs.
  const seen = await t.p.evaluate(() => {
    const tabs = document.querySelector("[data-slot=tabs-sticky-subheader]").getBoundingClientRect()
    const hit = document.elementFromPoint(tabs.left + 60, tabs.bottom + 18)
    return { text: hit?.closest("th, [role=columnheader]")?.textContent?.trim() ?? null, bottom: tabs.bottom }
  })
  if (seen.text !== "Name") fail(`under the tabs (y ${seen.bottom}) the column head is not showing: ${JSON.stringify(seen)}`)
})
test("C12", "C", "Dismissing the banner with the form open puts focus in the field", async (t) => {
  await t.open(CATS)
  await addCat(t).click()
  await setPageScroll(t, 600)
  const field = t.p.locator("#settings-new")
  await field.fill(unique("Aaa scrolled"))
  await field.press("Enter")
  const b = await t.expectBanner(/added/i, "add")
  await setPageScroll(t, 600)
  await b.getByRole("button", { name: /dismiss/i }).click()
  await focusedIs(t, "Dismiss", (a) => a.id === "settings-new")
})
test("C13", "C", "Dismissing the banner with the form closed puts focus on Add a category", async (t) => {
  await t.open(CATS)
  await t.click(t.p.getByRole("button", { name: "Actions for Airway" }), "no row menu on Airway")
  await t.click(t.p.getByRole("menuitem", { name: "Rename" }), "no Rename")
  await t.p.locator("#vocab-rename").fill("Airway two")
  await t.p.keyboard.press("Enter")
  const b = await t.expectBanner(/saved|renamed/i, "rename")
  await b.getByRole("button", { name: /dismiss/i }).click()
  await focusedIs(t, "Dismiss", (a) => a.text === "Add a category")
})
test("C14", "C", "Back on a dirty Rename asks; Keep editing returns; Discard leaves", async (t) => {
  await t.open(LIB)
  await t.open(CATS)
  await t.click(t.p.getByRole("button", { name: "Actions for Airway" }), "no row menu on Airway")
  await t.click(t.p.getByRole("menuitem", { name: "Rename" }), "no Rename")
  await t.p.locator("#vocab-rename").fill("Airway X")
  const at = t.p.url()
  await t.p.goBack().catch(() => {})
  await t.expectDiscardPrompt("Back on a dirty Rename")
  if (t.p.url() !== at) fail(`the URL moved to ${t.p.url()}`)
  if ((await t.p.locator("#vocab-rename").inputValue()) !== "Airway X") fail("the name was lost")
  await t.p.getByRole("alertdialog").getByRole("button", { name: "Keep editing" }).click()
  await focusedIs(t, "Keep editing", (a) => a.id === "vocab-rename")
  await t.p.goBack().catch(() => {})
  await t.expectDiscardPrompt("Back again")
  await t.p.getByRole("alertdialog").getByRole("button", { name: "Discard" }).click()
  await t.waitFor(() => /skills-library/.test(t.p.url()), () => `Discard did not leave: ${t.p.url()}`, 15_000)
})
test("C15", "C", "Back from a row's Skills count keeps the search and the scroll", async (t) => {
  await t.open(CATS)
  await t.p.locator("#settings-search").pressSequentially("a")
  await t.p.waitForTimeout(400)
  if (!/[?&]q=a/.test(t.p.url())) fail(`the search is not in the URL: ${t.p.url()}`)
  const rows = await t.stableCount(t.main.locator("tbody tr"))
  const link = t.main.locator("tbody tr a").nth(25)
  await link.scrollIntoViewIfNeeded()
  await t.p.waitForTimeout(150)
  const y = await pageScroll(t)
  await link.click()
  await t.p.waitForURL(/skills-library|library/, { timeout: LOAD })
  await t.p.waitForTimeout(1200)
  await t.p.goBack()
  await t.waitFor(() => /[?&]q=a/.test(t.p.url()), () => `Back lost the search: ${t.p.url()}`, 10_000)
  await t.p.waitForTimeout(1800)
  if ((await t.p.locator("#settings-search").inputValue()) !== "a") fail("the search box is empty")
  if ((await t.stableCount(t.main.locator("tbody tr"))) !== rows) fail(`rows ${rows} became ${await t.main.locator("tbody tr").count()}`)
  const y2 = await pageScroll(t)
  if (Math.abs(y2 - y) > 2) fail(`scroll ${y} became ${y2}`)
})
test("C16", "C", "A name cut off can be read from the keyboard; a short one is no Tab stop", async (t) => {
  await t.open(CATS)
  await addCat(t).click()
  const long = "Interprofessional collaboration MMMMMMM WWWWWWW across acute community settings"
  await t.p.locator("#settings-new").fill(long)
  await t.p.keyboard.press("Enter")
  await t.expectBanner(/added/i, "add")
  await t.p.locator("[data-inline-create]").getByRole("button", { name: "Cancel" }).click()
  await t.p.waitForTimeout(400)
  const el = t.p.locator(`[data-settings-name="${long}"]`)
  if ((await el.getAttribute("tabindex")) !== "0") fail("a cut name has no Tab stop")
  if ((await t.p.locator('[data-settings-name="Airway"]').getAttribute("tabindex")) !== null) fail("a short name is a Tab stop")
  await el.focus()
  await t.p.keyboard.press("Shift+Tab")
  await t.p.keyboard.press("Tab")
  await t.p.waitForTimeout(800)
  const tip = await t.p.getByRole("tooltip").allInnerTexts()
  if (!tip.some((x) => x.includes(long))) fail(`the tooltip reads ${JSON.stringify(tip)}`)
})
test("C17", "C", "A double click on a Status switch changes it once; two separate clicks change it twice", async (t) => {
  await t.open(CATS)
  const sw = t.main.getByRole("switch", { name: "Baths active" })
  const start = await sw.getAttribute("aria-checked")
  await sw.dblclick()
  await t.p.waitForTimeout(400)
  const once = await sw.getAttribute("aria-checked")
  if (once === start) fail("a double click left the switch where it was, or changed it twice")
  await sw.click(); await t.p.waitForTimeout(800)
  await sw.click(); await t.p.waitForTimeout(800)
  if ((await sw.getAttribute("aria-checked")) !== once) fail("two separate clicks did not change it twice")
})
test("C18", "C", "A double click on Add a category opens the form with no error", async (t) => {
  await t.open(CATS)
  await addCat(t).dblclick()
  await t.p.waitForTimeout(300)
  await t.visible(t.p.locator("#settings-new"), "the form did not open", QUICK)
  if (await t.p.locator("#settings-new-error").count()) fail("an error shows on an empty form")
})

// ------------------------------------------------------------------ Course mapping
const mapChips = (t) => t.main.locator("[data-filter-chip]").count()
const pickRows = (t) => t.main.locator("[data-pick-row]")
const pickIds = (t) => pickRows(t).evaluateAll((e) => e.map((a) => a.getAttribute("data-pick-row")))
const urlHas = (t, keys) => { const q = new URL(t.p.url()).searchParams; return keys.filter((k) => q.has(k)) }
const openMap = async (t, q) => { await t.open(`${MAP}${q}`); await t.visible(t.p.locator("[data-view-toggle]"), "no view toggle", LOAD); await t.p.waitForTimeout(800) }
const noCourses = (t) => t.main.locator("[data-pick-row] .sr-only").evaluateAll((e) => e.filter((x) => x.textContent === "No courses").length)

test("M6b", "M", "Clear all clears every filter on By course", async (t) => {
  await openMap(t, "?by=course")
  const all = await t.stableCount(pickRows(t))
  await openMap(t, "?by=course&cohort=coh-2026&term=trm-fa26&ay=2026-27&year=4")
  if ((await mapChips(t)) !== 4) fail(`${await mapChips(t)} chips, expected 4`)
  await t.click(t.button("Clear all", t.main), "no Clear all")
  await t.waitFor(async () => (await mapChips(t)) === 0, "chips remain after Clear all")
  const left = urlHas(t, ["cohort", "term", "ay", "year"])
  if (left.length) fail(`the URL keeps ${left.join(", ")}`)
  const n = await t.stableCount(pickRows(t))
  if (n !== all) fail(`the list holds ${n}, unfiltered it holds ${all}`)
})
test("M6c", "M", "Clear all on By skill", async (t) => {
  await openMap(t, "?by=skill")
  const all = await t.stableCount(pickRows(t))
  await openMap(t, "?by=skill&show=nocourse&cat=Airway&incl=didactic")
  if ((await mapChips(t)) !== 3) fail(`${await mapChips(t)} chips, expected 3`)
  await t.click(t.button("Clear all", t.main), "no Clear all")
  await t.waitFor(async () => (await mapChips(t)) === 0, "chips remain after Clear all")
  const left = urlHas(t, ["show", "cat", "incl"])
  if (left.length) fail(`the URL keeps ${left.join(", ")}`)
  const n = await t.stableCount(pickRows(t))
  if (n !== all) fail(`the list holds ${n}, of ${all}`)
})
test("M6d", "M", "Clear filters beside the offerings table clears them", async (t) => {
  await openMap(t, "?by=skill&cohort=coh-2026&ay=2026-27&year=4")
  await t.click(t.button("Clear filters", t.main).filter({ visible: true }), "no Clear filters")
  await t.waitFor(() => !urlHas(t, ["cohort", "ay", "year"]).length, () => `the URL keeps ${urlHas(t, ["cohort", "ay", "year"]).join(", ")}`)
})
test("M8b", "M", "A Coverage figure clears filters that would contradict it", async (t) => {
  await openMap(t, "?by=course&cohort=coh-2026&year=4&ay=2026-27")
  await t.click(t.main.getByRole("radio", { name: "Coverage" }), "no Coverage")
  await t.p.waitForTimeout(1000)
  await t.click(t.main.getByRole("button", { name: /^Totals by student group/ }), "no totals by student group")
  const fig = t.main.getByRole("link", { name: /in no course for BSN 2028/i })
  await t.visible(fig, "no In no course figure for BSN 2028")
  const href = await fig.first().getAttribute("href")
  if (/cohort=/.test(href)) fail(`the link carries a cohort: ${href}`)
  const n = +(await fig.first().innerText()).replace(/,/g, "").match(/\d+/)?.[0]
  await fig.first().click()
  await t.waitFor(() => /show=nocourse/.test(t.p.url()), () => `no show=nocourse: ${t.p.url()}`)
  await t.p.waitForTimeout(1200)
  if (!new URL(t.p.url()).searchParams.has("sg")) fail(`no group in the URL: ${t.p.url()}`)
  const left = urlHas(t, ["cohort", "term", "terms", "ay", "year", "cat", "q", "oq", "offering"])
  if (left.length) fail(`the URL keeps ${left.join(", ")}`)
  const rows = await t.stableCount(pickRows(t))
  if (rows !== n) fail(`the figure says ${n}, the list holds ${rows}`)
  if (!(await t.main.locator("[data-offering-row]").count())) fail("the right pane has no offering rows")
  if (await t.main.getByText("No offerings match").count()) fail("the right pane reads No offerings match")
})
test("M12", "M", "In a course plus In no course is the whole list", async (t) => {
  await openMap(t, "?by=skill")
  const T = await t.stableCount(pickRows(t)), N = await noCourses(t)
  await t.click(t.main.locator("[data-filters-button]").first(), "no Filters")
  await t.p.waitForTimeout(300)
  await t.click(t.p.getByRole("combobox", { name: "Show" }), "no Show")
  const opts = (await t.p.getByRole("option").allInnerTexts()).map((x) => x.trim())
  if (!opts.includes(`In a course (${T - N})`) || !opts.includes(`In no course (${N})`)) fail(`Show offers ${opts.join(", ")}; ${T - N} and ${N} expected`)
  await openMap(t, "?by=skill&show=nocourse")
  const no = await t.stableCount(pickRows(t))
  if (no !== N || (await noCourses(t)) !== N) fail(`In no course lists ${no}, ${await noCourses(t)} reading No courses, of ${N}`)
  await openMap(t, "?by=skill&show=incourse")
  const yes = await t.stableCount(pickRows(t))
  if (yes !== T - N || (await noCourses(t)) !== 0) fail(`In a course lists ${yes}, ${await noCourses(t)} reading No courses, of ${T - N}`)
})
test("M12b", "M", "The Show count follows the category", async (t) => {
  await openMap(t, "?by=skill&cat=Airway&show=nocourse")
  const n = await t.stableCount(pickRows(t))
  const chip = (await t.main.locator('[data-filter-chip]').filter({ hasText: /no course/i }).first().innerText()).replace(/\s+/g, " ")
  if (+chip.match(/\d+/)?.[0] !== n) fail(`the chip reads "${chip}", the list holds ${n}`)
  if (!(await t.main.locator("[data-pick-row]").filter({ hasText: "Basic airway management" }).count())) fail("Basic airway management is not listed")
})
test("M12c", "M", "A group's In no course and In a course equal Coverage and add up to Assigned", async (t) => {
  await openMap(t, "?by=skill&sg=coh:BSN 2028&show=nocourse")
  const no = await t.stableCount(pickRows(t))
  await openMap(t, "?by=skill&sg=coh:BSN 2028&show=incourse")
  const yes = await t.stableCount(pickRows(t))
  await openMap(t, "?by=course")
  await t.click(t.main.getByRole("radio", { name: "Coverage" }), "no Coverage")
  await t.p.waitForTimeout(1000)
  await t.click(t.main.getByRole("button", { name: /^Totals by student group/ }), "no totals by student group")
  const fig = t.main.getByRole("link", { name: /in no course for BSN 2028/i }).first()
  await t.visible(fig, "no In no course figure for BSN 2028")
  const cov = +(await fig.innerText()).replace(/,/g, "").match(/\d+/)?.[0]
  if (no !== cov) fail(`the filter lists ${no} in no course, Coverage says ${cov}`)
  const row = (await fig.locator("xpath=ancestor::*[self::tr or @role='row'][1]").innerText()).replace(/,/g, "")
  if (!new RegExp(`\\b${no + yes}\\b`).test(row)) fail(`${no} and ${yes} do not add up to the group's Assigned: "${row.replace(/\s+/g, " ")}"`)
})
test("M13", "M", "A fresh URL opens what it says, with nothing remembered", async (t) => {
  await openMap(t, "?by=course&term=trm-fa25&cohort=coh-2026")
  await openMap(t, "?offering=off-nur101-fa26")
  const left = urlHas(t, ["term", "cohort"])
  if (left.length) fail(`the URL gained ${left.join(", ")}`)
  if (await mapChips(t)) fail(`${await mapChips(t)} chips on a fresh URL`)
  if (!(await t.main.locator('[data-pick-row="off-nur101-fa26"]').count())) fail("the offering's row is not listed")
  await t.open("/lab/admin/dashboard")
  const dash = urlHas(t, ["term", "cohort"])
  if (dash.length) fail(`the Dashboard gained ${dash.join(", ")}`)
})
test("M13b", "M", "An explicit link beats a filter on the same URL", async (t) => {
  await openMap(t, "?offering=off-nur101-fa26&term=trm-fa25&year=4")
  await t.waitFor(() => !urlHas(t, ["term", "year"]).length, () => `the URL keeps ${urlHas(t, ["term", "year"]).join(", ")}`)
  const row = t.main.locator('[data-pick-row="off-nur101-fa26"]')
  await t.visible(row, "the offering's row is not listed")
  if ((await row.getAttribute("aria-current")) === null) fail("the row is not aria-current")
  await openMap(t, "?offering=off-nur101-fa25")
  await t.p.waitForTimeout(800)
  const past = t.main.locator('[data-pick-row="off-nur101-fa25"]')
  await t.visible(past, "the past offering's row is not listed")
  if ((await past.getAttribute("aria-current")) === null) fail("the past row is not aria-current")
  const chips = (await t.main.locator("[data-filter-chip]").allInnerTexts()).join(" | ").replace(/\s+/g, " ")
  if (!/Term:? All terms/.test(chips)) fail(`chips read "${chips}"`)
})
test("M14", "M", "Order does not change between loads, a toggle or a save", async (t) => {
  await openMap(t, "?by=skill")
  const o0 = await pickIds(t)
  const id = o0[120]
  await openMap(t, `?by=skill&skill=${encodeURIComponent(id)}`)
  if (!same(await pickIds(t), o0)) fail("opening a skill changed the list's order")
  const seen = await t.p.evaluate((i) => { const r = document.querySelector(`[data-pick-row="${CSS.escape(i)}"]`).getBoundingClientRect(); const l = document.querySelector("[data-pick-list]").getBoundingClientRect(); return r.top >= l.top - 1 && r.bottom <= l.bottom + 1 }, id)
  if (!seen) fail("the selected row is outside the list's visible box")
  await t.click(t.main.getByRole("radio", { name: "Coverage" }), "no Coverage")
  await t.p.waitForTimeout(600)
  await t.click(t.main.getByRole("radio", { name: /By skill/ }), "no By skill")
  await t.p.waitForTimeout(1000)
  if (!same(await pickIds(t), o0)) fail("Coverage and back changed the order")
  await openMap(t, `?by=skill&skill=${encodeURIComponent(o0[3])}`)
  const groups = () => t.main.locator("[data-region=skill] table tbody a").evaluateAll((e) => e.map((a) => a.textContent).slice(0, 40))
  const g0 = await groups()
  const trig = t.main.locator("[data-level]").last()
  await trig.scrollIntoViewIfNeeded()
  await trig.click()
  await t.click(t.p.getByRole("option", { name: "Mandatory" }), "no Mandatory")
  await t.p.waitForTimeout(400)
  await t.click(t.p.locator("[data-mapping-save]"), "no Save")
  await t.p.waitForTimeout(800)
  await t.reload()
  await t.p.waitForTimeout(1200)
  if (!same(await groups(), g0)) fail("Save and reload changed the group order")
})
test("M15", "M", "Names cut off can be read from the keyboard", async (t) => {
  await openMap(t, "?by=course&offering=off-nur162-fa26")
  const row = t.main.locator('[data-pick-row="off-nur162-fa26"]')
  await row.focus()
  await t.p.keyboard.press("ArrowDown")
  await t.p.keyboard.press("ArrowUp")
  await t.p.waitForTimeout(1000)
  const tip = async () => (await t.p.getByRole("tooltip").allInnerTexts()).join(" ")
  if (!/NUR 162 Psychiatric and Mental Health Nursing/.test(await tip())) fail(`the tooltip reads "${await tip()}"`)
  await t.p.setViewportSize({ width: 1100, height: 900 })
  await openMap(t, "?by=course&offering=off-nur220-fa26")
  const name = "Thrombo Embolic Device/Sequential Compression Device"
  const a = t.main.locator("[data-region=offering] table tbody a", { hasText: name }).first()
  await t.visible(a, `no link for ${name}`)
  await a.focus()
  await t.p.keyboard.press("Tab")
  await t.p.keyboard.press("Shift+Tab")
  await t.p.waitForTimeout(1000)
  if (!(await tip()).includes(name)) fail(`at 1100 the tooltip reads "${await tip()}"`)
})
test("M16", "M", "The level select holds its place when the changed dot appears", async (t) => {
  for (const [q, region] of [["?by=course&offering=off-nur220-fa26", "offering"], ["?by=skill", "skill"]]) {
    await openMap(t, q)
    if (region === "skill") { const id = await t.main.locator("[data-pick-row]").nth(3).getAttribute("data-pick-row"); await openMap(t, `?by=skill&skill=${encodeURIComponent(id)}`) }
    const lv = t.main.locator(`[data-region=${region}] [data-level]`).first()
    const before = await boxOf(lv)
    const cur = await lv.getAttribute("data-level")
    await lv.click()
    await t.click(t.p.getByRole("option", { name: cur === "mandatory" ? "Recommended" : "Mandatory" }), "no other level")
    await t.visible(t.main.locator("[data-level-changed]"), `${region}: no changed mark`, QUICK)
    const after = await boxOf(t.main.locator(`[data-region=${region}] [data-level]`).first())
    if (before.x !== after.x || before.w !== after.w) fail(`${region}: ${JSON.stringify(before)} became ${JSON.stringify(after)}`)
  }
})
test("M17", "M", "Back between views keeps the draft; leaving asks", async (t) => {
  const toMapping = async () => {
    await t.open(LIB)
    await t.click(t.p.locator('a[href*="set-up-skills/map"], a[href*="course-mapping"]').first(), "no link to Course mapping")
    await t.visible(t.p.locator("[data-view-toggle]"), "Course mapping did not open", LOAD)
    await t.p.waitForTimeout(800)
  }
  await toMapping()
  await t.click(t.main.getByRole("radio", { name: /By course/ }), "no By course")
  await t.p.waitForTimeout(1000)
  const lv = t.main.locator("[data-level]").first()
  const cur = await lv.getAttribute("data-level")
  await lv.click()
  await t.click(t.p.getByRole("option", { name: cur === "mandatory" ? "Recommended" : "Mandatory" }), "no other level")
  await t.p.waitForTimeout(500)
  await t.click(t.main.getByRole("radio", { name: "Coverage" }), "no Coverage")
  await t.p.waitForTimeout(800)
  const save = t.p.locator("[data-mapping-save]")
  const back = async () => { await t.p.evaluate(() => history.back()); await t.p.waitForTimeout(1300) }
  await back()
  if (await t.p.getByRole("alertdialog").count()) fail("Back to By course asked a question")
  if (!/by=course/.test(t.p.url())) fail(`Back did not reach By course: ${t.p.url()}`)
  if (!(await save.isEnabled())) fail("Back to By course lost the draft")
  await back()
  if (await t.p.getByRole("alertdialog").count()) fail("Back to By skill asked a question")
  if (!(await save.isEnabled())) fail("Back to By skill lost the draft")
  await back()
  await t.expectDiscardPrompt("Back, leaving")
  await t.p.getByRole("alertdialog").getByRole("button", { name: "Keep editing" }).click()
  await t.p.waitForTimeout(600)
  if (!(await save.isEnabled())) fail("Keep editing lost the draft")
  await back()
  await t.expectDiscardPrompt("Back again")
  await t.p.getByRole("alertdialog").getByRole("button", { name: "Discard" }).click()
  await t.waitFor(() => /skills-library|\/library/.test(t.p.url()), () => `Discard did not reach the Library: ${t.p.url()}`, 15_000)
  await toMapping()
  await back()
  await t.waitFor(() => /skills-library|\/library/.test(t.p.url()), () => `clean Back did not reach the Library at one press: ${t.p.url()}`, 10_000)
  if (await t.p.getByRole("alertdialog").count()) fail("a clean Back asked a question")
})
test("M18", "M", "1920: the level stays near the name; no sideways scroll", async (t) => {
  await t.p.setViewportSize({ width: 1920, height: 1080 })
  await openMap(t, "?by=skill")
  const id = await t.main.locator("[data-pick-row]").nth(3).getAttribute("data-pick-row")
  for (const [q, region, cell] of [[`?by=skill&skill=${encodeURIComponent(id)}`, "skill", "[data-offering-cell]"], ["?by=course&offering=off-nur220-fa26", "offering", "table tbody a"]]) {
    await openMap(t, q)
    const c = await boxOf(t.main.locator(`[data-region=${region}] ${cell}`).first())
    const l = await boxOf(t.main.locator(`[data-region=${region}] [data-level]`).first())
    if (!c || !l) fail(`${region}: no name cell or no level`)
    if (l.x - c.x > 640) fail(`${region}: the level sits ${l.x - c.x} px from the name`)
    await noSideScroll(t, region)
  }
})

// ------------------------------------------------------------------ Round 2: Course mapping (M19 to M26, M7b), Save in view (M27 to M29)
// How much of the page scroller lies past the last pane.
const blankScroll = (t) => t.p.evaluate(() => {
  const s = document.querySelector("[data-page-scroll]")
  const top = s.getBoundingClientRect().top
  let b = 0
  for (const e of document.querySelectorAll("[data-pane],[data-region=coverage]")) if (e.getClientRects().length) b = Math.max(b, e.getBoundingClientRect().bottom)
  return { sh: s.scrollHeight, ch: s.clientHeight, blank: Math.round(s.scrollHeight - (b - top + s.scrollTop)) }
})

// FAILS ON THE BUG: with `position: static` put back on [data-pick-list], By skill at 1440 reads { sh: 8751, ch: 817, blank: 7353 }. Built: { sh: 1418, ch: 817, blank: 20 }.
test("M19", "M", "No blank scroll in any view, or under a search that leaves few rows", async (t) => {
  for (const [w, h] of [[375, 812], [1440, 900], [1920, 1080]]) {
    await t.p.setViewportSize({ width: w, height: h })
    for (const q of ["?by=skill", "?by=skill&q=blood", "?by=skill&fq=NUR%20220", "?by=course", "?by=course&oq=NUR%20220", "?by=course&offering=off-nur220-fa26&sq=blood", "?by=coverage"]) {
      await openMap(t, q)
      const m = await blankScroll(t)
      // A page that does not scroll has nothing blank to scroll into.
      if (m.sh > m.ch && m.blank > 40) fail(`${w} ${q}: ${m.blank}px of blank scroll (scroller ${m.sh}, viewport ${m.ch})`)
    }
  }
}, 240_000)

test("M20", "M", "The stuck header lines up with the body within 1 px", async (t) => {
  for (const [w, h] of [[375, 812], [1440, 900], [1920, 1080]]) {
    await t.p.setViewportSize({ width: w, height: h })
    // A phone shows the table once a record is picked.
    for (const q of [w === 375 ? "?by=skill&skill=sk-does-not-exist&terms=all" : "?by=skill", "?by=course&offering=off-nur101-fa26"]) {
      await openMap(t, q)
      await t.p.evaluate(() => { document.querySelector("[data-page-scroll]").scrollTop = 420 })
      await t.p.waitForTimeout(400)
      const a = await t.p.evaluate(() => {
        const fl = document.querySelector("body > div.pointer-events-auto table")
        if (!fl) return null
        const tr = [...document.querySelectorAll("main [data-region] table tbody tr")].find((r) => !r.querySelector("[data-dt-group-bar]"))
        const body = [...tr.querySelectorAll("td")].map((c) => c.getBoundingClientRect().left)
        return [...fl.querySelectorAll("th")].map((c, i) => Math.abs(c.getBoundingClientRect().left - body[i]))
      })
      if (!a) fail(`${w} ${q}: the header did not stick`)
      if (Math.max(...a) > 1.01) fail(`${w} ${q}: columns off by ${a.join(", ")}`)
    }
  }
})

test("M21", "M", "The pinned group row has no line that crosses the row arriving under it", async (t) => {
  await openMap(t, "?by=course&offering=off-nur220-fa26")
  await t.p.evaluate(() => { document.querySelector("[data-page-scroll]").scrollTop = 500 })
  await t.p.waitForTimeout(400)
  const b = await t.p.locator('body > div.pointer-events-auto [aria-hidden="true"]').evaluate((e) => getComputedStyle(e).borderBottomWidth)
  if (b !== "0px") fail(`the window keeps a ${b} line at its bottom edge`)
})

test("M7b", "M", "Group rows read the level words, and the column menus are gone", async (t) => {
  // The Coverage grid (D-L121) is a report: its columns sort, so it keeps the DS menu.
  for (const q of ["?by=course&offering=off-nur220-fa26", "?by=skill"]) {
    await openMap(t, q)
    if (await t.p.locator('button[aria-label$=" column options"]').count()) fail(`${q}: a column menu is still offered`)
  }
  // No way in through the page any more, so the table's own state groups it, to read what the column would say.
  await openMap(t, "?by=course&offering=off-nur220-fa26")
  await t.p.evaluate(() => {
    const el = document.querySelector("[data-region=offering] table")
    let f = el[Object.keys(el).find((k) => k.startsWith("__reactFiber"))]
    while (f && !f.memoizedProps?.state?.setGroupBy) f = f.return
    f.memoizedProps.state.setGroupBy("level")
  })
  await t.p.waitForTimeout(500)
  const words = (await t.main.locator("[data-region=offering] [data-dt-group-header]").allInnerTexts()).map((s) => s.replace(/\s*\d+\s*$/, "").trim()).sort().join("|")
  if (words !== "Mandatory|Not mapped|Recommended") fail(`group rows read ${words}`)
})

test("M22", "M", "An unsaved level moves no figure; Save moves both together", async (t) => {
  await openMap(t, "?by=course&offering=off-nur220-fa26")
  const read = async () => [(await t.main.locator("[data-level-legend]").first().getAttribute("aria-label")), (await t.main.locator('[data-pick-row="off-nur220-fa26"]').innerText()).replace(/\s+/g, " ")]
  const a = await read()
  await t.click(t.main.locator('[data-region=offering] [data-level="none"]').first(), "no Not mapped row")
  await t.click(t.p.getByRole("option", { name: "Mandatory" }), "no Mandatory")
  await t.p.waitForTimeout(400)
  const b = await read()
  if (a.join() !== b.join()) fail(`a draft moved a figure: ${a} to ${b}`)
  await t.click(t.p.locator("[data-mapping-save]"), "no Save")
  await t.p.waitForTimeout(600)
  const c = await read()
  if (!/^13 mapped: 4 mandatory/.test(c[0]) || !/13 skills mapped, 4 mandatory/.test(c[1])) fail(`after Save: ${c}`)
})

test("M23", "M", "375: picking from far down the list opens the detail at the top, and the way back returns to the row", async (t) => {
  await t.p.setViewportSize({ width: 375, height: 812 })
  for (const [q, back] of [["?by=skill", /All skills/], ["?by=course", /All offerings/]]) {
    await openMap(t, q)
    const at = await t.p.evaluate(() => { const s = document.querySelector("[data-page-scroll]"); s.scrollTop = 222; return s.scrollTop })
    await t.p.waitForTimeout(200)
    const box = await t.main.locator("[data-pick-row]").nth(6).boundingBox()
    await t.p.mouse.click(box.x + 20, box.y + 20)
    await t.p.waitForTimeout(900)
    const top = await t.p.evaluate(() => document.querySelector("[data-page-scroll]").scrollTop)
    if (top !== 0) fail(`${q}: the detail opened ${top}px down`)
    await t.visible(t.main.locator("main h1, h1").first(), "no title on screen")
    await t.click(t.main.getByRole("button", { name: back }), "no way back")
    await t.p.waitForTimeout(800)
    const again = await t.p.evaluate(() => document.querySelector("[data-page-scroll]").scrollTop)
    if (again !== at) fail(`${q}: the way back landed at ${again}, not ${at}`)
  }
})

test("M24", "M", "Mapped only is in the URL and survives a reload", async (t) => {
  await openMap(t, "?by=course&offering=off-nur220-fa26")
  const region = t.main.locator("[data-region=offering]")
  await t.click(region.getByRole("combobox", { name: "Show" }), "no Show")
  await t.click(t.p.getByRole("option", { name: "Mapped only" }), "no Mapped only")
  await t.p.waitForTimeout(600)
  if (!/[?&]lv=mapped/.test(t.p.url())) fail(`not in the URL: ${t.p.url()}`)
  const n = await region.locator("tbody [data-level]").count()
  await t.reload()
  await t.p.waitForTimeout(1000)
  if ((await region.locator("tbody [data-level]").count()) !== n) fail("a reload changed the rows")
  if (!/Mapped only/.test(await region.getByRole("combobox", { name: "Show" }).innerText())) fail("a reload changed the select")
})

test("M25", "M", "Each view keeps its own search", async (t) => {
  await openMap(t, "?by=skill")
  const left = (name) => t.main.getByRole("searchbox", { name })
  const right = (r) => t.main.locator(`[data-region=${r}]`).getByRole("searchbox")
  await left(/Search skills by name/).fill("blood")
  await right("skill").fill("NUR 2")
  await t.p.waitForTimeout(500)
  await t.click(t.main.getByRole("radio", { name: "By course" }), "no By course")
  await t.p.waitForTimeout(800)
  if (await left(/Search offerings/).inputValue()) fail("By skill's search reached Search courses")
  if (await right("offering").inputValue()) fail("By skill's search reached Search skills")
  await right("offering").fill("bath")
  await left(/Search offerings/).fill("NURS")
  await t.p.waitForTimeout(600)
  await t.click(t.main.getByRole("radio", { name: /By skill/ }), "no By skill")
  await t.p.waitForTimeout(800)
  if ((await left(/Search skills by name/).inputValue()) !== "blood" || (await right("skill").inputValue()) !== "NUR 2") fail("By skill lost its own search")
  await t.click(t.main.getByRole("radio", { name: "By course" }), "no By course")
  await t.p.waitForTimeout(800)
  if ((await left(/Search offerings/).inputValue()) !== "NURS" || (await right("offering").inputValue()) !== "bath") fail("By course lost its own search")
})

test("M26", "M", "Esc from the bulk bar returns focus to the selected row's box", async (t) => {
  for (const [q, r] of [["?by=course&offering=off-nur220-fa26", "offering"], ["?by=skill", "skill"]]) {
    await openMap(t, q)
    const box = t.main.locator(`[data-region=${r}] tbody tr:not(:has([data-dt-group-bar])) [role=checkbox]`).nth(2)
    const name = await box.getAttribute("aria-label")
    await box.click()
    await t.p.waitForTimeout(300)
    await t.p.locator("[data-bulk-bar] [role=combobox]").focus()
    await t.p.keyboard.press("Escape")
    await t.p.waitForTimeout(400)
    const at = await t.p.evaluate(() => [document.activeElement?.tagName, document.activeElement?.getAttribute("aria-label")])
    if (at[0] === "BODY") fail(`${q}: focus fell to the body`)
    if (at[1] !== name) fail(`${q}: focus went to ${at[1]}, not ${name}`)
  }
})

const SAVE_VIEWS = (w) => [[w === 375 ? "?by=skill&skill=sk-does-not-exist&terms=all" : "?by=skill&terms=all", "skill"], ["?by=course&offering=off-nur220-fa26", "offering"]]
/** Change a level far down the table, with the page's header scrolled away. */
const draftFarDown = async (t, r) => {
  const sel = t.main.locator(`[data-region=${r}] tbody [role=combobox][data-level]`)
  const pick = sel.nth(Math.floor((await sel.count()) * 0.7))
  await pick.scrollIntoViewIfNeeded()
  const level = await pick.getAttribute("data-level")
  await pick.click()
  await t.click(t.p.getByRole("option", { name: level === "mandatory" ? "Recommended" : "Mandatory" }), "no level to choose")
  await t.p.waitForTimeout(600)
}
const saveBar = (t) => t.p.locator("[data-mapping-save-bar]")
test("M27", "M", "Save stays in view while the page scrolls, over nothing it should not cover", async (t) => {
  for (const [w, h] of [[375, 812], [1440, 900], [1920, 1080]]) {
    await t.p.setViewportSize({ width: w, height: h })
    for (const [q, r] of SAVE_VIEWS(w)) {
      await openMap(t, q)
      await t.p.evaluate(() => { document.querySelector("[data-page-scroll]").scrollTop = 900 })
      await t.p.waitForTimeout(300)
      if (await saveBar(t).count()) fail(`${w} ${r}: a Save bar with nothing to save`)
      await draftFarDown(t, r)
      const m = await t.p.evaluate(() => {
        const port = document.querySelector("[data-page-scroll]").getBoundingClientRect()
        const bar = document.querySelector("[data-mapping-save-bar]")?.getBoundingClientRect()
        const head = document.querySelector("body > div.pointer-events-auto table")?.getBoundingClientRect()
        const save = document.querySelector("[data-mapping-save-bar] button")
        const s = save?.getBoundingClientRect()
        const hit = s ? document.elementFromPoint(s.left + s.width / 2, s.top + s.height / 2) : null
        const a = document.activeElement.getBoundingClientRect()
        return { bar: bar && { top: bar.top, bottom: bar.bottom, left: bar.left, right: bar.right }, port: { top: port.top, bottom: port.bottom }, headBottom: head?.bottom ?? null, onTop: !!hit && save.contains(hit), active: { tag: document.activeElement.tagName, bottom: a.bottom },
          filled: [...document.querySelectorAll("main [data-slot=button][data-variant=default]")].filter((e) => { const q = e.getBoundingClientRect(); return q.height > 0 && q.top >= port.top && q.bottom <= port.bottom }).map((e) => e.innerText) }
      })
      if (!m.bar) fail(`${w} ${r}: no Save in view with a draft and the header scrolled away`)
      if (m.bar.bottom > m.port.bottom + 1 || m.bar.top < m.port.top) fail(`${w} ${r}: the bar is not on screen: ${JSON.stringify(m)}`)
      if (!m.onTop) fail(`${w} ${r}: something covers Save`)
      if (m.headBottom !== null && m.headBottom > m.bar.top) fail(`${w} ${r}: the bar covers the stuck head: ${JSON.stringify(m)}`)
      if (m.active.bottom > m.bar.top) fail(`${w} ${r}: the bar covers the select just changed: ${JSON.stringify(m)}`)
      if (m.filled.length !== 1) fail(`${w} ${r}: filled buttons in view read ${JSON.stringify(m.filled)}`)
      // Saved from here: the page stays where it is, the result shows, focus is on screen, and the bar has gone.
      const before = await pageScroll(t)
      await t.click(saveBar(t).getByRole("button", { name: "Save changes" }), "no Save changes in the bar")
      await t.expectBannerInView(`${w} ${r}: saved from the bar`)
      await t.p.waitForTimeout(400)
      if (await saveBar(t).count()) fail(`${w} ${r}: the bar stayed after Save`)
      if (Math.abs((await pageScroll(t)) - before) > 80) fail(`${w} ${r}: Save moved the page from ${before} to ${await pageScroll(t)}`)
      const f = await t.p.evaluate(() => { const a = document.activeElement; const port = document.querySelector("[data-page-scroll]").getBoundingClientRect(); const b = a.getBoundingClientRect(); return { body: a === document.body, seen: b.top >= port.top && b.bottom <= port.bottom } })
      if (f.body || !f.seen) fail(`${w} ${r}: focus after Save ${JSON.stringify(f)}`)
      // Back at the top the header's Save is the one: never two.
      await draftFarDown(t, r)
      await setPageScroll(t, 0)
      await t.p.waitForTimeout(300)
      if (await saveBar(t).count()) fail(`${w} ${r}: a second Save with the header on screen`)
      if (await t.p.locator("[data-mapping-save]").isDisabled()) fail(`${w} ${r}: the header's Save is off with a draft`)
    }
  }
}, 240_000)
test("M28", "M", "With the bar showing, Tab never leaves a focused control under it (WCAG 2.4.11)", async (t) => {
  for (const [w, h] of [[375, 812], [1440, 900]]) {
    await t.p.setViewportSize({ width: w, height: h })
    await openMap(t, "?by=course&offering=off-nur220-fa26")
    await draftFarDown(t, "offering")
    await t.p.keyboard.press("Escape")
    let seen = 0
    for (let i = 0; i < 30; i++) {
      await t.p.keyboard.press("Tab")
      await t.p.waitForTimeout(60)
      const m = await t.p.evaluate(() => {
        const a = document.activeElement
        const bar = document.querySelector("[data-mapping-save-bar]")
        if (!bar || bar.contains(a) || !a.closest("[data-region]")) return null
        const r = a.getBoundingClientRect()
        const stack = bar.parentElement.getBoundingClientRect()
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        return { name: a.getAttribute("aria-label") ?? a.tagName, bottom: r.bottom, barTop: stack.top, covered: !hit || !(a === hit || a.contains(hit) || hit.contains(a)) }
      })
      if (!m) continue
      seen++
      if (m.bottom > m.barTop + 0.5) fail(`${w}: ${m.name} sits under the bar: ${JSON.stringify(m)}`)
    }
    if (seen < 15) fail(`${w}: only ${seen} controls were reached`)
    // Tab reaching Save in the bar is not a reason to move the page.
    const save = saveBar(t).getByRole("button", { name: "Save changes" })
    if (!(await save.count())) continue
    const at = await pageScroll(t)
    await save.evaluate((e) => e.focus())
    await t.p.waitForTimeout(200)
    if ((await pageScroll(t)) !== at) fail(`${w}: focusing Save moved the page from ${at} to ${await pageScroll(t)}`)
  }
})
test("M29", "M", "A selection with a draft: the bulk bar and Save stack, neither over the other", async (t) => {
  await openMap(t, "?by=course&offering=off-nur220-fa26")
  await draftFarDown(t, "offering")
  const box = t.main.locator("[data-region=offering] tbody tr:not(:has([data-dt-group-bar])) [role=checkbox]").nth(25)
  await box.scrollIntoViewIfNeeded()
  await box.click()
  await t.p.waitForTimeout(400)
  const bulk = await boxOf(t.p.locator("[data-exxat-bulk-bar]").last())
  const bar = await boxOf(saveBar(t))
  if (!bulk || !bar) fail(`bulk ${JSON.stringify(bulk)}, Save ${JSON.stringify(bar)}`)
  if (bulk.y + bulk.h > bar.y + 1) fail(`they overlap: ${JSON.stringify([bulk, bar])}`)
  if (bar.y + bar.h > 900) fail(`Save is off screen: ${JSON.stringify(bar)}`)
  // A level chosen in the bulk bar is a draft with the bar kept open: no remount, so focus is not lost.
  await t.click(t.p.locator("[data-bulk-bar] [role=combobox]"), "no level in the bulk bar")
  await t.click(t.p.getByRole("option", { name: "Recommended" }), "no Recommended")
  await t.p.waitForTimeout(400)
  if ((await activeInfo(t)).body) fail("focus fell to the body")
})

// ------------------------------------------------------------------ Round 2: Student path side step and bar (W5, W6)
const STUDENT_PATH = "/lab/walkthrough/student"
test("W5", "W", "A course on stop 1 moves the bar to Skills by course; Next keeps its pinned skill", async (t) => {
  await t.open(STUDENT_PATH)
  const first = await t.position()
  if (first.name !== "My progress" || first.index !== 1 || first.total !== 7) fail(`stop 1 reads ${first.text}`)
  const next = await t.nextControl(await t.pathBar()).first().getAttribute("href")
  if (!/skill=sk-ng-tube/.test(next) || !/course=crs-nurs350/.test(next)) fail(`Next on stop 1 lost its pinned skill: ${next}`)
  await t.click(t.main.getByRole("link", { name: /NURS 350/ }), "no NURS 350 link on My progress")
  await t.afterNav(1500)
  await t.settle()
  const now = await t.position()
  if (now.name !== "Skills by course" || now.index !== 2) fail(`the course page's bar reads ${now.text}; url ${t.p.url()}`)
  const main = (await t.main.locator("h1").first().innerText()).trim()
  if (!main.startsWith("NURS 350")) fail(`the page reads ${main}`)
  await t.pressNext()
  const third = await t.position()
  if (third.name !== "Self-evaluation" || third.index !== 3) fail(`Next from the course page reads ${third.text}`)
  if (!/skills=sk-ng-tube/.test(t.p.url())) fail(`Next dropped the sample skill: ${t.p.url()}`)
})
test("W6", "W", "Do this next's Fix and send and Make a further attempt keep the path bar; Back returns", async (t) => {
  for (const name of ["Fix and send", "Make a further attempt"]) {
    await t.open(STUDENT_PATH)
    await t.click(t.main.getByRole("link", { name }), `no ${name} on My progress`)
    await t.afterNav(1500)
    await t.settle()
    if (!/\/lab\/flow\/fulfillment-walkthrough\/fix\b/.test(t.p.url())) fail(`${name} left the path: ${t.p.url()}`)
    const pos = await t.position()
    if (pos.name !== "Fix or further attempt" || pos.index !== 1 || pos.total !== 7) fail(`${name}: the bar reads ${pos.text}`)
    const bar = await t.pathBar()
    await t.click(bar.getByRole("link", { name: /^Back/ }), "no Back on the path bar")
    await t.afterNav(1500)
    await t.settle()
    const back = await t.position()
    if (back.name !== "My progress") fail(`${name}: Back reads ${back.text}`)
  }
})

// ------------------------------------------------------------------ Round 2: the shared sheet, rule E6 (E43 to E46)
const SHEETS = {
  "Add a skill": { slot: "lab-add-skill", field: "#skill-name", open: async (t) => { await t.click(t.main.getByRole("button", { name: /^Add a skill$/ }), "no Add a skill") }, opener: /Add a skill/ },
  "Add several": { slot: "lab-add-several", field: "#several-names", open: async (t) => { await t.openAddSeveral() }, opener: /More ways to add|Add a skill/ },
  "Edit 3 skills": {
    slot: "lab-bulk-edit",
    dirty: async (t, d) => { await d.locator("#bulk-add-tags").fill("zed"); await d.locator("#bulk-add-tags").press("Enter") },
    open: async (t) => {
      await t.selectRows([BP, "Height", "Weight"])
      await t.click(t.main.getByRole("button", { name: /^Edit 3 skills$/ }), "no Edit 3 skills")
    },
    opener: /Edit 3 skills/,
  },
}
const openSheet = async (t, s) => {
  await t.open(LIB)
  await s.open(t)
  const d = t.p.locator(`[data-slot="${s.slot}"]`)
  await t.visible(d, `${s.slot} did not open`)
  await t.p.waitForTimeout(500)
  return d
}
const armClose = async (t, d, how) => {
  const x = d.getByRole("button", { name: "Close" }).first()
  if (how === "hover") await x.hover(); else await x.focus()
  await t.p.waitForTimeout(350)
}
test("E43", "E", "Add a skill, Add several, Edit 3 skills: with Close hovered or focused, one Esc closes a clean sheet and focus returns", async (t) => {
  for (const [name, s] of Object.entries(SHEETS)) for (const how of ["hover", "focus"]) {
    const d = await openSheet(t, s)
    await armClose(t, d, how)
    await t.p.keyboard.press("Escape")
    await t.waitFor(async () => (await d.count()) === 0 || !(await d.isVisible()), `${name}, ${how}: one Esc left the sheet open`, 1500)
    await focusedIs(t, `${name}, ${how}`, (a) => s.opener.test(`${a.label} ${a.text}`))
  }
}, 240_000)
test("E44", "E", "The same three, dirty: one Esc asks, the sheet stays, the tooltip has gone; Keep editing returns", async (t) => {
  for (const [name, s] of Object.entries(SHEETS)) for (const how of ["hover", "focus"]) {
    const d = await openSheet(t, s)
    if (s.dirty) await s.dirty(t, d); else await d.locator(s.field).fill("Zed test")
    await armClose(t, d, how)
    await t.p.keyboard.press("Escape")
    await t.expectDiscardPrompt(`${name}, ${how}`)
    if (!(await d.isVisible())) fail(`${name}, ${how}: the sheet closed behind the question`)
    await t.p.waitForTimeout(250)
    if (await t.p.locator('[data-slot="tooltip-content"]').count()) fail(`${name}, ${how}: the tooltip stayed over the question`)
    await t.click(t.p.getByRole("button", { name: /Keep editing/ }), "no Keep editing")
    await t.p.waitForTimeout(300)
    if (!(await d.isVisible())) fail(`${name}, ${how}: Keep editing lost the sheet`)
    if (await t.p.getByRole("alertdialog").count()) fail(`${name}, ${how}: the question stayed`)
  }
}, 240_000)
test("E45", "E", "Add a skill, tag suggestions open: one Esc closes the suggestions only", async (t) => {
  const d = await openSheet(t, SHEETS["Add a skill"])
  const tags = d.getByRole("combobox").last()
  await tags.fill("a")
  const list = t.p.getByRole("listbox", { name: "Tag suggestions" })
  await t.visible(list, "no tag suggestions", QUICK)
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(300)
  if (await list.isVisible().catch(() => false)) fail("the suggestions stayed open")
  if (!(await d.isVisible())) fail("one Esc also closed the sheet")
  if (await t.p.getByRole("alertdialog").count()) fail("one Esc also asked to discard")
})
test("E46", "E", "One Esc path: no keydown listener on the two panels; admin sheets use the shared FloatingSheetPanel", async () => {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
  for (const f of ["components/lab/admin-a/lists-panel.tsx", "components/lab/library/skill-panel.tsx"]) {
    const p = [f, f.replace("admin-a", "admin-b")].map((x) => path.join(root, x)).find((x) => fs.existsSync(x))
    if (!p) fail(`${f} is gone; update this check`)
    if (fs.readFileSync(p, "utf8").includes('addEventListener("keydown"')) fail(`${f} listens for keydown itself`)
  }
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".tsx") ? [path.join(d, e.name)] : [])
  const allowed = /(?:student\/logged|admin-starter-library-[ab]|shared\/sheet)\.tsx$/
  const bad = walk(path.join(root, "components/lab")).filter((f) => {
    if (allowed.test(f) || /\/student[^/]*\//.test(f)) return false
    const s = fs.readFileSync(f, "utf8")
    return s.includes("<FloatingSheetPanel") && !/from "@\/components\/lab\/shared\/sheet"/.test(s)
  })
  if (bad.length) fail(`not from shared/sheet: ${bad.map((f) => path.relative(root, f)).join(", ")}`)
})

// ------------------------------------------------------------------ Round 2: Categories and tags (C8b to C20)
const catLayout = async (t) => ({ field: (await boxOf(t.p.locator("#settings-new")))?.y, search: (await boxOf(t.p.locator("#settings-search")))?.y, table: (await boxOf(t.main.locator("table").first()))?.y, add: (await boxOf(addCat(t)))?.y })
const widths3 = [[1440, 900], [1920, 1080], [375, 812]]
const openCatForm = async (t, w, h) => { await t.p.setViewportSize({ width: w, height: h }); await t.open(CATS); await addCat(t).click(); await t.p.waitForTimeout(300); return t.p.locator("#settings-new") }
test("C8b", "C", "A repeated name holds every position, and so does clearing it", async (t) => {
  for (const [w, h] of widths3) {
    const f = await openCatForm(t, w, h)
    const a = await catLayout(t)
    await f.fill("Airway")
    await f.press("Enter")
    await t.visible(t.p.locator("#settings-new-error"), `${w}: no error`, QUICK)
    const b = await catLayout(t)
    if (!same(a, b)) fail(`${w}: the error moved something: ${JSON.stringify([a, b])}`)
    await f.fill("Airwayx")
    await t.p.waitForTimeout(250)
    if (await t.p.locator("#settings-new-error").count()) fail(`${w}: typing left the error`)
    const c = await catLayout(t)
    if (!same(a, c)) fail(`${w}: clearing the error moved something: ${JSON.stringify([a, c])}`)
  }
})
test("C8c", "C", "With a banner showing, an error holds the banner's room", async (t) => {
  for (const [w, h] of widths3) {
    const f = await openCatForm(t, w, h)
    await f.fill(unique(`Zeta ${w}`))
    await f.press("Enter")
    await t.expectBanner(/added/i, `${w}: add`)
    await t.p.waitForTimeout(300)
    const a = await catLayout(t)
    await f.fill("Airway")
    await f.press("Enter")
    await t.visible(t.p.locator("#settings-new-error"), `${w}: no error`, QUICK)
    const b = await catLayout(t)
    if (!same(a, b)) fail(`${w}: the error moved something: ${JSON.stringify([a, b])}`)
    await f.fill("Airwayx")
    await t.p.waitForTimeout(250)
    const c = await catLayout(t)
    if (!same(a, c)) fail(`${w}: typing moved something: ${JSON.stringify([a, c])}`)
    await f.fill(unique(`Yota ${w}`))
    await f.press("Enter")
    await t.p.waitForTimeout(400)
    const d = await catLayout(t)
    if (!same(a, d)) fail(`${w}: another add moved something: ${JSON.stringify([a, d])}`)
  }
})
test("C8d", "C", "The error's top is within 8 px of the field's bottom", async (t) => {
  for (const [w, h] of widths3) {
    const f = await openCatForm(t, w, h)
    await f.fill("Airway")
    await f.press("Enter")
    const err = t.p.locator("#settings-new-error")
    await t.visible(err, `${w}: no error`, QUICK)
    const e = await boxOf(err), b = await boxOf(f)
    if (e.y < b.y + b.h - 1 || e.y > b.y + b.h + 8) fail(`${w}: error at ${e.y}, field ends at ${b.y + b.h}`)
  }
})
test("C9b", "C", "Three new names, in no order: newest first, not alphabetical", async (t) => {
  const f = await openCatForm(t, 1440, 900)
  const names = ["Zeta", "Alpha", "Mid"].map(unique)
  for (const n of names) { await f.fill(n); await f.press("Enter"); await t.p.waitForTimeout(450) }
  const rows = (await t.main.locator("tbody tr").evaluateAll((r) => r.slice(0, 3).map((x) => x.innerText))).map((s) => s.split("\n")[0].trim())
  if (!same(rows, [names[2], names[1], names[0]])) fail(`the first rows read ${JSON.stringify(rows)}`)
})
test("C9c", "C", "Scrolled, with a banner already showing: an add leaves the scroll, the field and focus", async (t) => {
  const f = await openCatForm(t, 1440, 900)
  await f.fill(unique("First"))
  await f.press("Enter")
  await t.expectBanner(/added/i, "first add")
  await setPageScroll(t, 400)
  const s0 = await pageScroll(t), y0 = (await boxOf(f)).y
  await f.fill(unique("Second"))
  await f.press("Enter")
  await t.p.waitForTimeout(700)
  if ((await pageScroll(t)) !== s0) fail(`the page scrolled from ${s0} to ${await pageScroll(t)}`)
  if ((await boxOf(f)).y !== y0) fail(`the field moved from ${y0} to ${(await boxOf(f)).y}`)
  if ((await activeInfo(t)).id !== "settings-new") fail(`focus is on ${JSON.stringify(await activeInfo(t))}`)
})
test("C9d", "C", "Scrolled, no banner yet: an add leaves a row and the field where they are on screen", async (t) => {
  const f = await openCatForm(t, 1440, 900)
  await setPageScroll(t, 120)
  await f.fill(unique("Anchor"))
  await f.evaluate((e) => e.focus({ preventScroll: true }))
  const row = t.main.locator("tbody tr").filter({ hasText: "Airway" }).first()
  const r0 = (await boxOf(row)).y, y0 = (await boxOf(f)).y
  await t.p.keyboard.press("Enter")
  await t.p.waitForTimeout(900)
  // A row above Airway is new, so Airway may move down by one row and no more: read the field for the page, and the row against that.
  const r1 = (await boxOf(row)).y, y1 = (await boxOf(f)).y
  if (y1 !== y0) fail(`the field moved on screen from ${y0} to ${y1}`)
  const step = (await boxOf(t.main.locator("tbody tr").first())).h
  if (Math.abs(r1 - r0) > step + 1) fail(`Airway moved from ${r0} to ${r1}, more than the one new row (${step})`)
})
test("C18b", "C", "A double click on Add a category, then typing: the text is in the field", async (t) => {
  await t.open(CATS)
  await addCat(t).dblclick()
  await t.p.waitForTimeout(400)
  if ((await activeInfo(t)).id !== "settings-new") fail(`focus is on ${JSON.stringify(await activeInfo(t))}`)
  await t.p.keyboard.type("Typed name")
  if ((await t.p.locator("#settings-new").inputValue()) !== "Typed name") fail(`the field reads ${await t.p.locator("#settings-new").inputValue()}`)
})
test("C19", "C", "A search that hides the new row says so; Clear search shows it", async (t) => {
  const f = await openCatForm(t, 1440, 900)
  const search = t.p.locator("#settings-search")
  await search.fill("air")
  await t.p.waitForTimeout(500)
  const name = unique("Hidden")
  await f.fill(name)
  await f.press("Enter")
  await t.expectBanner(new RegExp(`^${esc(name)} added\\. Your search hides it\\.`), "add under a search")
  if ((await search.inputValue()) !== "air") fail(`the search reads ${await search.inputValue()}`)
  if (!/[?&]q=air\b/.test(t.p.url())) fail(`?q=air is gone: ${t.p.url()}`)
  await t.click(t.main.getByRole("button", { name: "Clear search" }), "no Clear search")
  await t.p.waitForTimeout(500)
  if (await search.inputValue()) fail("the search was not cleared")
  const first = await t.main.locator("tbody tr").first().innerText()
  if (!first.includes(name)) fail(`the first row reads ${first.slice(0, 60)}`)
  const text = await t.bannerText()
  if (!text.startsWith(`${name} added.`) || /hides/.test(text)) fail(`the banner reads ${text}`)
  if ((await activeInfo(t)).id !== "settings-new") fail(`focus is on ${JSON.stringify(await activeInfo(t))}`)
})
test("C20", "C", "A search that matches the new row: first row, no action on the banner", async (t) => {
  const f = await openCatForm(t, 1440, 900)
  const search = t.p.locator("#settings-search")
  await search.fill("air")
  await t.p.waitForTimeout(500)
  const name = unique("Airfield")
  await f.fill(name)
  await f.press("Enter")
  const b = await t.expectBanner(/added/i, "add under a search")
  if ((await search.inputValue()) !== "air") fail("the search changed")
  const first = await t.main.locator("tbody tr").first().innerText()
  if (!first.includes(name)) fail(`the first row reads ${first.slice(0, 60)}`)
  if (await t.main.getByRole("button", { name: "Clear search" }).count()) fail("Clear search offered with the row in view")
  if (/hides/.test(await b.innerText())) fail(`the banner reads ${await b.innerText()}`)
})

// ------------------------------------------------------------------ Round 2: Skill lists (T20 to T27)
const listRow = (t, name) => t.main.locator("tbody tr").filter({ hasText: name }).first()
const openListRow = async (t, name) => { await listRow(t, name).locator("td").first().click(); await t.visible(t.p.locator(LP), `${name}: no panel`); await t.p.waitForTimeout(600) }
const anyResult = (t) => t.p.locator("[data-region=banner]").filter({ visible: true })
const noResult = async (t, what) => { await t.p.waitForTimeout(250); if (await anyResult(t).count()) fail(`${what}: a banner reads "${(await anyResult(t).first().innerText()).replace(/\s+/g, " ").slice(0, 80)}"`) }
test("T20", "T", "A rename's banner does not follow into another list's panel, nor back to the page", async (t) => {
  await t.open(LISTS)
  await t.click(t.p.getByRole("button", { name: /^Actions for Core clinical/ }), "no row menu on Core clinical skills")
  await t.click(t.p.getByRole("menuitem", { name: "Rename" }), "no Rename")
  await t.p.locator("#rename-list").fill(unique("Core renamed"))
  await t.click(t.p.getByRole("button", { name: "Save name" }), "no Save name")
  await t.p.waitForTimeout(500)
  await openListRow(t, "Practicum")
  await noResult(t, "in the Practicum panel")
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(500)
  await noResult(t, "after closing")
})
test("T21", "T", "A banner in list A's panel is not on list B's, or after B closes", async (t) => {
  await t.open(LISTS)
  await openListRow(t, "Practicum")
  await t.p.locator(LP).getByRole("switch").click()
  await t.p.waitForTimeout(500)
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(500)
  await openListRow(t, "Core clinical")
  await noResult(t, "in list B")
  if (await t.p.locator(LP).getByRole("button", { name: "Undo" }).count()) fail("B offers A's Undo")
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(500)
  await noResult(t, "after B closes")
})
test("T22", "T", "A banner in A's panel does not follow a direct click on row B", async (t) => {
  await t.open(LISTS)
  await openListRow(t, "Practicum")
  await t.p.locator(LP).getByRole("switch").click()
  await t.p.waitForTimeout(500)
  await openListRow(t, "Core clinical")
  await noResult(t, "in list B")
})
test("T23", "T", "Reopening A shows its banner and Undo; Undo reverts", async (t) => {
  await t.open(LISTS)
  await openListRow(t, "Practicum")
  const sw = t.p.locator(LP).getByRole("switch")
  const before = await sw.getAttribute("aria-checked")
  await sw.click()
  await t.p.waitForTimeout(500)
  await t.p.keyboard.press("Escape")
  await t.p.waitForTimeout(500)
  await openListRow(t, "Practicum")
  await t.click(t.p.locator(LP).getByRole("button", { name: "Undo" }), "reopened: no Undo")
  await t.p.waitForTimeout(500)
  if ((await sw.getAttribute("aria-checked")) !== before) fail("Undo did not revert the toggle")
})
test("T24", "T", "1440, 1280: the table has no sideways scroll, and a sideways wheel does not move it", async (t) => {
  for (const [w, h] of [[1440, 900], [1280, 800]]) {
    await t.p.setViewportSize({ width: w, height: h })
    await t.open(LISTS)
    const read = () => t.p.evaluate(() => { const e = document.querySelector("[data-region=lists] [data-slot=scroll-region]"); return { sw: e.scrollWidth, cw: e.clientWidth, left: e.scrollLeft } })
    const a = await read()
    if (a.sw !== a.cw) fail(`${w}: scrollWidth ${a.sw}, clientWidth ${a.cw}`)
    await t.p.mouse.move(w / 2, 300)
    await t.p.mouse.wheel(300, 0)
    await t.p.waitForTimeout(300)
    if ((await read()).left !== 0) fail(`${w}: a sideways wheel moved the table`)
  }
})
test("T25", "T", "The no-match action reads Clear, in the picker and in Add students", async (t) => {
  await t.open(LISTS)
  await openListRow(t, "Revised clinical")
  await t.click(listBtn(t, "Edit skills"), "no Edit skills")
  await t.p.waitForTimeout(600)
  const panel = t.p.locator(LP)
  await panel.getByRole("searchbox").or(panel.locator("input[type=search]")).first().fill("zzzqq")
  await t.p.waitForTimeout(400)
  await t.visible(panel.getByRole("button", { name: "Clear", exact: true }), "picker: no Clear")
  if (await panel.getByRole("button", { name: "Clear filters" }).count()) fail("picker offers Clear filters")
  await t.open(LISTS)
  await openListRow(t, "Core clinical")
  await t.click(listBtn(t, "Assign to students"), "no Assign to students")
  const d = await chooseSpecific(t)
  await d.getByRole("searchbox").or(d.locator("input")).first().fill("zzzqq")
  await t.p.waitForTimeout(400)
  await t.visible(d.getByRole("button", { name: "Clear", exact: true }), "Add students: no Clear")
  if (await d.getByRole("button", { name: "Clear filters" }).count()) fail("Add students offers Clear filters")
})
test("T26", "T", "Delete from the row menu or the panel menu: focus on New skill list, and still there 1.5 s later", async (t) => {
  const confirm = async () => { await t.click(t.p.getByRole("alertdialog").getByRole("button", { name: /^Delete/ }), "no Delete to confirm"); await t.p.waitForTimeout(1500) }
  const check = (how) => focusedIs(t, how, (a) => /New skill list/.test(a.text))
  await t.open(LISTS)
  await t.click(t.p.getByRole("button", { name: /^Actions for Revised clinical/ }), "no row menu")
  await t.click(t.p.getByRole("menuitem", { name: "Delete" }), "no Delete in the row menu")
  await confirm()
  await check("row menu")
  await t.reload()
  await t.p.evaluate(() => localStorage.clear())
  await t.open(LISTS)
  await openListRow(t, "Revised clinical")
  await t.click(t.p.locator(LP).getByRole("button", { name: /^Actions for/ }), "no panel menu")
  await t.click(t.p.getByRole("menuitem", { name: "Delete" }), "no Delete in the panel menu")
  await confirm()
  await check("panel menu")
})
test("T27", "T", "Lab batch grid variant B: Mark the rest {label}, with no capital mid-sentence", async (t) => {
  await t.open("/lab/course-faculty/lab-batch-grid?variant=B")
  const marks = await t.p.getByRole("button", { name: /^Mark the rest/ }).allInnerTexts()
  if (!marks.length) fail("no Mark the rest action")
  for (const m of marks) if (!/^Mark the rest [a-z]/.test(m.trim())) fail(`the action reads "${m.trim()}"`)
})

// ------------------------------------------------------------------ SEND: one Send design on variants A, B and C (2026-11-10)
// C reaches Send through its own Self-evaluation step; A and B are one page, with the self-evaluation behind "Rate yourself".
const SEND_URL = { A: "/lab/student/request-signoff?variant=A", B: "/lab/student/request-signoff?variant=B", C: "/lab/student/request-signoff?variant=C&course=crs-nurs350&step=self&skills=sk-ng-tube" }
async function sendAnswerSelf(t) {
  const open = t.p.locator("[data-self-open]")
  if (await open.count()) { await open.first().click(); await t.p.waitForTimeout(300) }
  const ids = await t.p.locator("[data-self-card] [id]").evaluateAll((els) => els.map((e) => e.id).filter((id) => /^self-.*-(q\d+|overall)$/.test(id)))
  for (const id of ids) await t.p.locator(`[id="${id}"] button`).first().click()
}
async function sendOpen(t, v, extra = "", answer = false) {
  await t.open(SEND_URL[v] + extra)
  await t.visible(t.p.locator(`[data-student-lab=request-${v}]`), `Send ${v} did not render`)
  if (v === "C") {
    await sendAnswerSelf(t)
    await t.click(t.p.getByRole("button", { name: /^Continue$/ }), "no Continue on the self-evaluation step")
    await t.visible(t.p.locator("[data-student-lab=request-C][data-step=send]"), "Continue did not open the Send step")
  } else if (answer) await sendAnswerSelf(t)
}
const sendButton = (t) => t.p.getByRole("button", { name: /^(Send|Keep and send later)$/ }).first()
for (const v of ["A", "B", "C"]) {
  test(`SEND-${v}1`, "SEND", `Send ${v}: summary card, three suggested evaluators and Someone not listed, four illustrated ways, Add a note; no sideways scroll`, async (t) => {
    await sendOpen(t, v)
    await t.visible(t.p.locator("[data-visit]"), "no summary card (What you are sending)")
    await t.visible(t.p.locator("[data-visit-change]"), "the summary card has no Change")
    const rows = await t.p.locator("[data-who-row]").count()
    if (rows !== 3) fail(`${rows} suggested evaluators, expected 3`)
    await t.visible(t.p.locator("label[for=who-new]"), "no Someone not listed")
    await t.visible(t.p.locator("[data-who-show-all]"), "no Search all evaluators")
    const ways = await t.p.locator("[data-method]").count()
    if (ways !== 4) fail(`${ways} ways to sign, expected 4`)
    if ((await t.p.locator("[data-method] svg").count()) < 4) fail("a way to sign has no drawing")
    await t.visible(t.p.locator("[data-add-note]"), "no Add a note for the evaluator")
    const wide = await t.p.evaluate(() => document.scrollingElement.scrollWidth - innerWidth)
    if (wide > 0) fail(`the page scrolls sideways by ${wide} px`)
  })
  test(`SEND-${v}2`, "SEND", `Send ${v}: Date performed cannot be picked after the program's today`, async (t) => {
    await sendOpen(t, v)
    await t.click(t.p.locator("[data-visit-change]"), "no Change on the summary card")
    await t.click(t.p.locator("#req-detail-date"), "no Date performed field behind Change")
    const day = t.p.locator("[data-slot=popover-content] [role=gridcell] button").filter({ hasText: /^27$/ }).last()
    await t.visible(day, "the calendar did not open on the program's month")
    if (!(await day.isDisabled())) fail("Oct 27, after the program's today, can be picked")
  })
  test(`SEND-${v}3`, "SEND", `Send ${v}: one problem (a later date) focuses its field, with no summary; Send names it`, async (t) => {
    await sendOpen(t, v, "&date=2026-11-12", true)
    await t.click(t.p.locator("[role=radio][id^=who-]:not([disabled])"), "no evaluator to choose")
    await t.click(sendButton(t), "no Send")
    await t.p.waitForTimeout(600)
    const focus = await t.p.evaluate(() => document.activeElement?.id)
    if (focus !== "req-detail-date") fail(`focus went to "${focus}", not Date performed`)
    if (await t.p.locator("[data-region=validation-summary]").count()) fail("a summary appeared for one problem")
    if (!(await sendButton(t).isDisabled())) fail("Send stays enabled with the problem unfixed")
    const foot = (await t.main.innerText()).replace(/\s+/g, " ")
    if (!/Date performed is after today\. Choose Oct 26, 2026 or earlier\./.test(foot)) fail("the rule with the latest date is not named")
  })
  test(`SEND-${v}4`, "SEND", `Send ${v}: QR code and Send shows the QR code`, async (t) => {
    await sendOpen(t, v, "", true)
    await t.click(t.p.locator("[role=radio][id^=who-]:not([disabled])"), "no evaluator to choose")
    await t.click(t.p.locator("#method-qr"), "no QR code card")
    await t.click(sendButton(t), "no Send")
    await t.visible(t.p.locator("[data-region=result] svg[aria-label^='QR code']").or(t.p.locator("[data-region=result] [role=img]")), "no QR code after Send")
  })
  test(`SEND-${v}5`, "SEND", `Send ${v}: a chosen way and a chosen evaluator are marked the same way`, async (t) => {
    await sendOpen(t, v)
    await t.click(t.p.locator("[role=radio][id^=who-]:not([disabled])"), "no evaluator to choose")
    const look = (sel) => t.p.locator(sel).first().evaluate((el) => { const c = getComputedStyle(el.closest("label")); return `${c.backgroundColor} | ${c.borderTopColor}` })
    const way = await look("[data-method] [role=radio][aria-checked=true]")
    const who = await look("[data-who-row] [role=radio][aria-checked=true]")
    if (way !== who) fail(`chosen way reads "${way}", chosen evaluator "${who}"`)
  })
}

// ------------------------------------------------------------------ runner
const selected = TESTS.filter((x) => {
  if (ONLY_GROUP && x.group.toUpperCase() !== ONLY_GROUP) return false
  if (ONLY_ID && x.id !== ONLY_ID && !x.id.startsWith(`${ONLY_ID}.`)) return false
  if (ONLY_IDS && !ONLY_IDS.includes(x.id)) return false
  return true
})
if (!selected.length) { console.error("No test matches those flags."); process.exit(2) }
fs.mkdirSync(OUT, { recursive: true })

// Evidence for "Target page, context or browser has been closed": who closed what, and what the machine and the dev server were doing then.
const running = new Set()
const diag = (event, extra = {}) => { if (DIAG_PATH) fs.appendFileSync(DIAG_PATH, `${JSON.stringify({ at: new Date().toISOString(), event, running: [...running], ...extra })}\n`) }
const serverStats = () => {
  try {
    const port = new URL(BASE).port || "80"
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, { encoding: "utf8" }).trim().split("\n")[0]
    const rssKb = +execSync(`ps -o rss= -p ${pid}`, { encoding: "utf8" }).trim()
    const vm = execSync("vm_stat", { encoding: "utf8" })
    const pages = (k) => +(vm.match(new RegExp(`${k}:\\s+(\\d+)`))?.[1] ?? 0)
    const free = Math.round(((pages("Pages free") + pages("Pages inactive") + pages("Pages speculative")) * 16384) / 1048576)
    return { serverPid: pid, serverRssMb: Math.round(rssKb / 1024), availableMb: free }
  } catch (e) { return { statsError: String(e.message ?? e).slice(0, 80) } }
}
const launch = async () => { const b = await chromium().launch(); diag("browser-launch"); b.on("disconnected", () => diag("browser-disconnected", serverStats())); return b }
/**
 * tools/visual-check/reap-stale-chromium.sh (launchd, every 2 min) kills any chrome-headless-shell older than 15 minutes as a leak. One browser kept for a whole run outlives that, and
 * every test on it then dies with "Target page, context or browser has been closed" (2026-11-05: the reaper's log and this script's --diag agree to the second, twice). So a browser is
 * retired at 8 minutes, which with the longest test (5 minutes) keeps each one under the limit; it closes when the tests still on it end.
 */
const BROWSER_MAX_AGE = 8 * 60_000
let browser = await launch()
let bornAt = Date.now()
const onBrowser = new Map([[browser, 0]])
const live = async () => {
  if (!browser.isConnected() || Date.now() - bornAt > BROWSER_MAX_AGE) {
    const old = browser
    browser = await launch()
    bornAt = Date.now()
    onBrowser.set(browser, 0)
    if (!onBrowser.get(old)) { onBrowser.delete(old); await old.close().catch(() => {}) }
  }
  return browser
}
const release = async (b) => {
  onBrowser.set(b, onBrowser.get(b) - 1)
  if (b !== browser && !onBrowser.get(b)) { onBrowser.delete(b); await b.close().catch(() => {}) }
}
const sampler = DIAG_PATH ? setInterval(() => diag("sample", serverStats()), 15_000) : null

async function runOnce(x) {
  const host = await live()
  onBrowser.set(host, onBrowser.get(host) + 1)
  const ctx = await host.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const t = new T(page)
  let runnerClosing = false
  running.add(x.id)
  diag("test-start", { test: x.id })
  page.on("crash", () => diag("page-crash", { test: x.id, ...serverStats() }))
  page.on("close", () => diag("page-close", { test: x.id, byRunner: runnerClosing }))
  ctx.on("close", () => diag("context-close", { test: x.id, byRunner: runnerClosing }))
  let result
  let timer
  try {
    await Promise.race([
      x.fn(t),
      new Promise((_, rej) => { timer = setTimeout(() => { diag("test-timeout", { test: x.id }); rej(new Fail(`timed out after ${(x.timeout ?? TEST_TIMEOUT) / 1000}s at ${page.url().replace(BASE, "")}`)) }, x.timeout ?? TEST_TIMEOUT) }),
    ])
    result = { status: "PASS", reason: "" }
  } catch (e) {
    if (e instanceof Later) result = { status: "LATER", reason: e.message }
    else if (e instanceof Infra) result = { status: "INFRA", reason: e.message }
    else {
      const msg = e instanceof Fail ? e.message : `step could not run: ${String(e.message ?? e).split("\n")[0].slice(0, 140)}`
      result = { status: "FAIL", reason: msg }
    }
  }
  clearTimeout(timer)
  if (result.status === "FAIL" || result.status === "INFRA") {
    await page.screenshot({ path: path.join(OUT, `${x.id.replace(/[^\w.-]/g, "_")}.png`) }).catch(() => {})
  }
  if (/has been closed|Target closed|crashed/i.test(result.reason)) diag("closed-error", { test: x.id, reason: result.reason, browserConnected: host.isConnected(), pageClosed: page.isClosed(), ...serverStats() })
  // The browser itself was killed from outside (the reaper, a person): no verdict on the page. The worker runs it once more.
  if (!host.isConnected() && result.status !== "PASS") result = { status: "INFRA", reason: `the browser was killed from outside during this test: ${result.reason.slice(0, 100)}` }
  runnerClosing = true
  await ctx.close().catch(() => {})
  await release(host)
  running.delete(x.id)
  diag("test-end", { test: x.id, status: result.status })
  return result
}
const results = []
const queue = [...selected]
async function worker() {
  for (let x = queue.shift(); x; x = queue.shift()) {
    let r = await runOnce(x)
    if (r.status === "INFRA") r = await runOnce(x) // a dev-server recompile, not a verdict
    if (r.status === "INFRA") r = { status: "FAIL", reason: r.reason }
    results.push({ id: x.id, group: x.group, title: x.title, ...r })
    process.stderr.write(r.status === "PASS" ? "." : r.status === "LATER" ? "L" : "F")
  }
}
// Warm the routes first, so the first test on a page does not pay the compile.
{
  const ctx = await (await live()).newContext()
  const page = await ctx.newPage()
  for (const u of ["/", LIB, SET, CATS, LISTS, ASSIGN, MAP, "/lab/flow/watch-the-cohort/attainment"]) await page.goto(BASE + u, { waitUntil: "load", timeout: 180_000 }).catch(() => {})
  await ctx.close()
}
try {
  await Promise.all(Array.from({ length: WORKERS }, () => worker()))
} finally {
  if (sampler) clearInterval(sampler)
  await browser.close().catch(() => {})
}
process.stderr.write("\n")

const order = new Map(TESTS.map((x, i) => [x.id, i]))
results.sort((a, b) => order.get(a.id) - order.get(b.id))
const cell = (s) => String(s).replace(/\|/g, "/").replace(/\s+/g, " ")
console.log("| ID | Group | Result | Reason |")
console.log("|---|---|---|---|")
for (const r of results) console.log(`| ${r.id} | ${r.group} | ${r.status} | ${cell(r.reason)} |`)
const groups = [...new Set(TESTS.map((x) => x.group))].filter((g) => results.some((r) => r.group === g))
const counts = {}
console.log("\n| Group | PASS | FAIL | LATER |")
console.log("|---|---|---|---|")
for (const g of groups) {
  const of = (s) => results.filter((r) => r.group === g && r.status === s).length
  counts[g] = { PASS: of("PASS"), FAIL: of("FAIL"), LATER: of("LATER") }
  console.log(`| ${g} | ${of("PASS")} | ${of("FAIL")} | ${of("LATER")} |`)
}
const total = (s) => results.filter((r) => r.status === s).length
console.log(`\n${results.length} tests: ${total("PASS")} pass, ${total("FAIL")} fail, ${total("LATER")} later.`)
if (total("LATER")) {
  console.log("\nLATER, reported separately:")
  for (const r of results.filter((x) => x.status === "LATER")) console.log(`- ${r.id}: ${r.reason}`)
}
if (JSON_PATH) {
  fs.mkdirSync(path.dirname(path.resolve(JSON_PATH)), { recursive: true })
  fs.writeFileSync(JSON_PATH, JSON.stringify({ base: BASE, at: new Date().toISOString(), counts, total: { PASS: total("PASS"), FAIL: total("FAIL"), LATER: total("LATER") }, results }, null, 2))
}
process.exit(total("FAIL") ? 1 : 0)
