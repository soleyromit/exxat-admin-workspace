#!/usr/bin/env node
// Present mode walk (granola 2026-10-26 items 6, 20, 21; lib/lab/present.ts). Loads /lab?present=1 with clean storage, reads the
// marquee list (the screens shown to a client) and asserts:
//   - exactly 11 marquee links, each carrying present=1;
//   - every "Not ready" reporting item is plain text: no link inside [data-not-ready];
//   - on each of the 11 marquee screens (after hydration), no internal lab label is in the DOM text or in an aria-label or title:
//     tier, build status (Built, Planned), the "Tests:" question line and its tooltip trigger, the Components drawer, the
//     Scenario menu, More variants, the variant switch, the "Design lab" crumb; and no lab chrome root ([data-lab-bar],
//     [data-ds-used-panel], [data-lab-question], [data-variant-bar]); the breadcrumb holds the screen title only; no tier or
//     build badge markers ([data-tier], [data-build-status], [data-lab-tier]).
// Then both walkthroughs (/lab/walkthrough/setup and /lab/walkthrough/fulfillment): every step in order, the presenter control as
// the only lab element, the agreed step string in the breadcrumb and heading, and two product buttons that lead on (--no-walkthrough
// skips this part).
// Prints a table and exits 1 on any failure. Usage: node scripts/lab-present-check.mjs [baseUrl]
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
function chromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* next */ }
  }
  throw new Error("Playwright not found")
}
const base = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3017"
// Internal labels (word-bounded where a word could also be ordinary copy).
const BANNED = [
  ["tier", /\bTier\b/i],
  ["build status: Built", /\bBuilt\b/],
  ["build status: Planned", /\bPlanned\b/],
  ["Tests tooltip / question line", /\bTests:|What this option tests/],
  ["Components drawer", /\bComponents\b|Design system components used/],
  ["Scenario menu", /\bScenario\b/],
  ["More variants", /More variants/],
  ["variant switch", /\bVariant [A-F]\b/],
  ["Design lab crumb", /\bDesign lab\b/],
]
const CHROME = "[data-lab-bar], [data-ds-used-panel], [data-lab-question], [data-variant-bar]"
// The marquee, in order (lib/lab/present.ts MARQUEE; UX critique 2026-10-26).
const MARQUEE_LABELS = ["Skills library", "Add a skill", "Configure a skill", "Assign to a cohort or group", "Course mapping", "My progress", "Log a skill", "My requests", "Evaluation form", "Evaluation submitted", "Approvals"]
const MARQUEE_COUNT = MARQUEE_LABELS.length
const STUDENT = new Set(["My progress", "Log a skill", "My requests"])
// Romit 2026-10-27 (LEDGER D-L11): "remove sample data tags from everywhere". No marquee screen carries a Sample data chip.
// --negative: run the same per-screen assertions on marquee screens WITHOUT present=1. They must FAIL there (negative control),
// proving the check can see the lab chrome and labels it bans. Exit 0 only when the control fails as expected.
const NEGATIVE = process.argv.includes("--negative")
// --walkthrough-only: skip the index and the marquee screens, walk only the two walkthroughs (machine load, 2026-10-27).
const WALK_ONLY = process.argv.includes("--walkthrough-only")
// --shots=<dir>: save a 1440 x 900 screenshot of every walkthrough step, as the presenter sees it (and the Send C confirmation).
const SHOTS = process.argv.find((a) => a.startsWith("--shots="))?.slice("--shots=".length) ?? null
if (SHOTS) (await import("node:fs")).mkdirSync(SHOTS, { recursive: true })
const shot = async (name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false }).catch(() => {}) }

let browser = await chromium().launch()
let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
let page = await ctx.newPage()
const rows = []
const fails = []
const check = (screen, name, ok, got) => { rows.push({ screen, check: name, result: ok ? "PASS" : "FAIL", got: ok ? "" : JSON.stringify(got).slice(0, 140) }); if (!ok) fails.push(`${screen}: ${name}`) }

// A browser lost under a busy dev server (several workers' servers on one machine) is relaunched, keeping the session storage
// empty as a fresh run would.
async function relaunch() {
  await browser.close().catch(() => {})
  browser = await chromium().launch()
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  page = await ctx.newPage()
}
async function load(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(`${base}${url}`, { waitUntil: "load", timeout: 240000 })
      await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {})
      await page.waitForTimeout(2000)
      return
    } catch (e) {
      // ERR_ABORTED: a dev-server reload (another worker's edit) cancelled the navigation; load it again.
      if (attempt === 2 || !/closed|ERR_ABORTED/.test(String(e))) throw e
      await new Promise((r) => setTimeout(r, 3000))
      if (String(e).includes("closed") || page.isClosed() || !browser.isConnected()) await relaunch()
    }
  }
}
const domText = () => page.evaluate(() => {
  const attrs = [...document.querySelectorAll("[aria-label], [title]")].map((el) => `${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("title") ?? ""}`)
  // DOM text, including visually hidden text, without script, style and template payloads (the framework's serialized page
  // data is not interface text).
  const clone = document.body.cloneNode(true)
  clone.querySelectorAll("script, style, noscript, template").forEach((n) => n.remove())
  return `${clone.textContent ?? ""}\n${attrs.join("\n")}`
})

await page.goto(`${base}/lab`, { waitUntil: "domcontentloaded", timeout: 240000 })
await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch { /* */ } })
await load("/lab?present=1")
const index = await page.evaluate(() => ({
  links: [...document.querySelectorAll("[data-marquee] a")].map((a) => ({ label: a.textContent.trim(), href: a.getAttribute("href") })),
  notReady: [...document.querySelectorAll("[data-not-ready] li")].map((li) => ({ text: li.textContent.trim(), links: li.querySelectorAll("a, [role=link]").length })),
}))
if (!NEGATIVE && !WALK_ONLY) {
  check("index", `${MARQUEE_COUNT} marquee links`, index.links.length === MARQUEE_COUNT, index.links.map((l) => l.label))
  check("index", "marquee in the agreed order", JSON.stringify(index.links.map((l) => l.label)) === JSON.stringify(MARQUEE_LABELS), index.links.map((l) => l.label))
  check("index", "every marquee link carries present=1", index.links.every((l) => /[?&]present=1\b/.test(l.href ?? "")), index.links.filter((l) => !/present=1/.test(l.href ?? "")))
  check("index", "Not ready items listed", index.notReady.length > 0, index.notReady)
  check("index", "Not ready items are not links", index.notReady.every((x) => x.links === 0), index.notReady.filter((x) => x.links))
  const idxText = await domText()
  for (const [name, re] of BANNED) check("index", `no ${name}`, !re.test(idxText), idxText.match(re)?.[0])
}

// Negative control: the same screens with present=0 (explicit, so the stored present flag cannot turn it back on).
const targets = WALK_ONLY ? [] : NEGATIVE ? index.links.filter((l) => l.label === "Skills library" || l.label === "My progress").map((l) => ({ ...l, href: l.href.replace(/([?&])present=1\b/, "$1present=0") })) : index.links
for (const l of targets) {
  await load(l.href)
  const chrome = await page.locator(CHROME).count()
  const text = await domText()
  const h1 = (await page.locator("main h1").first().textContent().catch(() => null)) ?? ""
  check(l.label, "page rendered (h1)", h1.trim().length > 0 || (await page.locator("main").count()) > 0, h1)
  check(l.label, "no lab chrome roots", chrome === 0, chrome)
  for (const [name, re] of BANNED) check(l.label, `no ${name}`, !re.test(text), text.match(re)?.[0])
  check(l.label, "still in present mode (URL)", /[?&]present=1\b/.test(page.url()), page.url())
  // Breadcrumb (2026-10-26 sweep): in present mode it holds the screen title only, never "Design lab" or the persona's lab name.
  const crumbs = await page.$$eval("[data-slot=breadcrumb-item]", (els) => els.map((e) => e.textContent.trim()))
  // A product parent crumb is allowed (D-L20: "Skills > Course mapping", "Settings > Evaluators"); never a lab one.
  check(l.label, "breadcrumb is the screen title only", (crumbs.length <= 1 || (crumbs.length === 2 && /^(Skills|Settings|My progress)$/.test(crumbs[0]))) && !crumbs.some((c) => /Design lab|^(Administrator|Reviewer|Student|Evaluator|Program director|Lab instructor)$/.test(c)), crumbs)
  // Tier and build badges, by their own markers as well as by text.
  const marked = await page.locator("[data-tier], [data-build-status], [data-lab-tier]").count()
  check(l.label, "no tier or build badge markers", marked === 0, marked)
  // D-L11: no Sample data chip on any screen.
  const sample = await page.getByText("Sample data", { exact: true }).count()
  check(l.label, "no Sample data chip", sample === 0, sample)
  // Offline sync is pending scope: the sync chip (queued, synced, conflict) is hidden on student screens in present mode.
  if (STUDENT.has(l.label)) {
    const chips = await page.locator("[data-sync-chip]").count()
    check(l.label, "no sync chip", chips === 0, chips)
  }
}
// The two walkthroughs (lib/lab/walkthrough.ts; Sankalp's Thursday order, docs/knowledge/design/thursday-flows-sankalp.md): one
// entry URL each, the recommended design of every step, the presenter control as the only lab element. Per step: lands where the
// presenter's next (or Skip) says, no lab chrome root, no banned label, the breadcrumb and the page heading use the agreed step
// string (comprehension audit 2026-10-27), still in present mode. Then the product's own buttons: "Save and configure" from the
// add sheet and "Map to courses" from the assign footer land on their walkthrough steps.
const WALKS = [
  {
    entry: "/lab/walkthrough/setup",
    flow: "setup-walkthrough",
    steps: [
      ["library", "Skills"],
      ["add", "Add a skill"],
      ["bulk", "Bulk upload"],
      ["categories", "Categories and tags"],
      ["configure", "Configure the skill"],
      ["publish", "Check and save"],
      ["lists", "Groups of skills"],
      ["assign", "Assign skills to student groups"],
      ["map", "Course mapping"],
    ],
  },
  {
    entry: "/lab/walkthrough/fulfillment",
    flow: "fulfillment-walkthrough",
    steps: [
      ["progress", "My progress"],
      ["course", "Skills by course"],
      ["skills", "Log a skill"],
      ["self", "Self-evaluation"],
      ["send", "Send for evaluation"],
    ],
  },
]
// The configure page's H1 is the skill's name by design; the wizard's own step heading carries the step. Configure the skill
// opens on the wizard's first section (its heading is that section's name), so it is not judged; Check and save is judged on the
// wizard's current step: since 2026-10-27 (Romit, "content hierarchy so the steps are cleaner") the step name lives in the DS rail
// (its aria-current step label) and the visible h2 is the question the admin answers ("Ready to save?").
const HEADING_EXEMPT = new Set(["setup-walkthrough/configure"])
// Log a skill keeps one page title across its steps (Romit 2026-10-27); the Self-evaluation step is judged on the stepper.
const WIZARD_HEADING = { "setup-walkthrough/publish": 'nav[aria-label^="Wizard steps"] li[aria-current="step"] p', "fulfillment-walkthrough/self": 'nav[aria-label^="Wizard steps"] li[aria-current="step"] p' }
const OPTIONAL = new Set(["setup-walkthrough/lists"])
const SKILLS_PANEL_STEPS = new Set(["setup-walkthrough/categories", "setup-walkthrough/lists", "setup-walkthrough/assign", "setup-walkthrough/map"])
if (!NEGATIVE && !process.argv.includes("--no-walkthrough")) {
  for (const walk of WALKS) {
    await page.evaluate(() => { try { sessionStorage.clear() } catch { /* */ } }).catch(() => {})
    await load(walk.entry)
    const n = walk.steps.length
    for (let i = 0; i < n; i++) {
      const [id, label] = walk.steps[i]
      const key = `${walk.flow}/${id}`
      const name = `${walk.flow === "setup-walkthrough" ? "Configuration" : "Fulfillment"} ${i + 1} ${label}`
      const u = new URL(page.url())
      check(name, "on the step", u.pathname === `/lab/flow/${walk.flow}/${id}`, u.pathname)
      check(name, "still in present mode (URL)", u.searchParams.get("present") === "1", page.url())
      if (key === "setup-walkthrough/assign") check(name, "assign mode (view=assign)", u.searchParams.get("view") === "assign" && (await page.locator("[data-lists-mode=assign]").count()) > 0, page.url())
      const chrome = await page.locator(CHROME).count()
      check(name, "no lab chrome roots", chrome === 0, chrome)
      check(name, "no floating present pill", (await page.locator("[data-lab-present]").count()) === 0, "pill")
      const text = (await domText()).replace(/Step \d+ of \d+(, optional)?/g, "")
      for (const [bn, re] of BANNED) check(name, `no ${bn}`, !re.test(text), text.match(re)?.[0])
      const pos = ((await page.locator("[data-walkthrough-position]").textContent().catch(() => "")) ?? "").trim()
      check(name, "presenter shows step n of N", pos === `Step ${i + 1} of ${n}${OPTIONAL.has(key) ? ", optional" : ""}`, pos)
      if (OPTIONAL.has(key)) check(name, "optional step offers Skip", (await page.locator("[data-walkthrough-skip]").count()) === 1, "no Skip")
      const crumbs = await page.$$eval("[data-slot=breadcrumb-item]", (els) => els.map((e) => e.textContent.trim()))
      if (key === "fulfillment-walkthrough/course") {
        // The course view is its own place (Romit 2026-10-27): "My progress > NURS 350", titled by the course.
        check(name, 'breadcrumb is "My progress > NURS 350"', crumbs.length === 2 && crumbs[0] === "My progress" && crumbs[1] === "NURS 350", crumbs)
        const h = ((await page.locator("main h1").first().textContent().catch(() => "")) ?? "").trim()
        check(name, "page heading is the course", h.startsWith("NURS 350, "), h)
        check(name, "Course select lists courses only, no My progress option", (await page.locator("#course-a-select").count()) === 1, "")
      } else if (SKILLS_PANEL_STEPS.has(key)) {
        // D-L20: a page in the Skills panel reads "Skills > {step}" (the library itself reads "Skills").
        check(name, `breadcrumb is "Skills > ${label}"`, crumbs.length === 2 && crumbs[0] === "Skills" && crumbs[1] === label, crumbs)
      } else check(name, `breadcrumb is "${label}"`, crumbs.length === 1 && crumbs[0] === label, crumbs)
      await shot(`${walk.flow === "setup-walkthrough" ? "config" : "fulfil"}-${String(i + 1).padStart(2, "0")}-${id}`)
      if (WIZARD_HEADING[key]) {
        const h = ((await page.locator(WIZARD_HEADING[key]).first().textContent().catch(() => "")) ?? "").trim()
        check(name, `wizard step heading is "${label}"`, h === label, h)
      } else if (!HEADING_EXEMPT.has(key) && key !== "fulfillment-walkthrough/course") {
        const heads = await page.$$eval("main h1, main h2, [role=dialog] h2", (els) => els.filter((e) => e.getClientRects().length).map((e) => e.textContent.trim()))
        // Add a skill is the sheet over the library: its sheet title is the step's heading.
        const ok = id === "add" ? heads.includes(label) : heads[0] === label
        check(name, `page heading is "${label}"`, ok, heads.slice(0, 3))
      }
      const next = await page.locator("[data-walkthrough-next]").first().getAttribute("href").catch(() => null)
      if (i < n - 1) {
        // Follow the presenter's href (a modal sheet on the add step covers the bar; the href is what a click opens).
        check(name, "presenter next names the following step", !!next && new URL(next, base).pathname === `/lab/flow/${walk.flow}/${walk.steps[i + 1][0]}`, next)
        if (next) await load(next)
      } else {
        check(name, "Finish returns to the present index", next === "/lab?present=1", next)
      }
    }
  }
  // The product's own primary buttons.
  await load("/lab/flow/setup-walkthrough/assign?set=1&present=1&view=assign")
  await page.getByRole("link", { name: "Map to courses" }).first().click().catch(() => {})
  await page.waitForURL((x) => x.pathname.endsWith("/map"), { timeout: 60000 }).catch(() => {})
  check("Walkthrough buttons", "assign footer Map to courses lands on the map step", new URL(page.url()).pathname === "/lab/flow/setup-walkthrough/map", page.url())
  await load("/lab/flow/setup-walkthrough/add?set=1&present=1")
  try {
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel(/^Name/).first().fill(`Walkthrough skill ${Date.now() % 10000}`)
    await dialog.getByRole("button", { name: /Save and configure/ }).click()
    await page.waitForURL((x) => x.pathname.endsWith("/configure"), { timeout: 60000 })
  } catch { /* judged below */ }
  const cu = new URL(page.url())
  check("Walkthrough buttons", "add sheet Save and configure lands on the configure step with the new skill", cu.pathname === "/lab/flow/setup-walkthrough/configure" && !!cu.searchParams.get("skill") && cu.searchParams.get("skill") !== "sk-pressure-injury", page.url())

  // Fulfillment by the product's own buttons only (Sankalp S1 to S2): the course view's Send for evaluation opens Send C on the
  // course's mandatory skills, Continue walks Questions, Self-evaluation and Send, and Send ends on the confirmation. Each page
  // must say the step it is on, in the presenter control and the breadcrumb.
  const B = "Fulfillment buttons"
  const pos = async () => ((await page.locator("[data-walkthrough-position]").textContent().catch(() => "")) ?? "").trim()
  const crumb = async () => (await page.$$eval("[data-slot=breadcrumb-item]", (els) => els.map((e) => e.textContent.trim())))[0] ?? ""
  const h1 = async () => ((await page.locator("main h1").first().textContent().catch(() => "")) ?? "").trim()
  const waitFor = async (re) => { await page.waitForURL((x) => re.test(x.search), { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(1500) }
  await load("/lab/flow/fulfillment-walkthrough/course?set=1&present=1&course=crs-nurs350")
  await page.locator("main").getByRole("link", { name: "Log a skill" }).first().click().catch(() => {})
  await page.waitForURL((x) => x.pathname.endsWith("/skills"), { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(2500)
  check(B, "course view Log a skill opens Log a skill (Send C)", new URL(page.url()).pathname === "/lab/flow/fulfillment-walkthrough/skills" && (await page.locator("[data-student-lab=request-C][data-step=skills]").count()) === 1, page.url())
  const picked = await page.locator("#fulfil-skills input[type=checkbox]:checked, #fulfil-skills [role=checkbox][data-state=checked]").count()
  check(B, "mandatory skills preselected", picked > 0, picked)
  // No Questions step since 2026-10-27 (Romit): Choose skills, then Evaluate yourself, then Send.
  const steps = [["self", "Self-evaluation", "Step 4 of 5"], ["send", "Send for evaluation", "Step 5 of 5"]]
  for (const [sid, label, p] of steps) {
    if (sid === "send") {
      // Answer every question and the overall result on each self-evaluation card: the first option of each group (Yes, then Met).
      for (const g of await page.locator("[data-self-card] [aria-labelledby]").all()) await g.locator("button").first().click().catch(() => {})
    }
    await page.getByRole("button", { name: "Continue" }).first().click().catch(() => {})
    await waitFor(new RegExp(`step=${sid}\\b`))
    check(B, `Continue reaches ${label}`, (await page.locator(`[data-student-lab=request-C][data-step=${sid}]`).count()) === 1, page.url())
    check(B, `${label}: presenter says ${p}`, (await pos()) === p, await pos())
    // The flow keeps one title, Log a skill, until its last step, Send for evaluation (Romit 2026-10-27).
    const wantH1 = sid === "send" ? label : "Log a skill"
    check(B, `${label}: breadcrumb says the step, H1 says ${wantH1}`, (await crumb()) === label && (await h1()) === wantH1, [await crumb(), await h1()])
    await shot(`fulfil-buttons-${sid}`)
  }
  // Send: the confirmation. Where defaults from the placement; the student chooses who signs and the date, as a presenter would.
  const sendStep = page.locator("[data-student-lab=request-C][data-step=send]")
  // Who signs off, by its own ids: "How they sign" (a radio group too) comes first on the page since 2026-10-27.
  await sendStep.locator("[role=radio][id^=who-]").first().click().catch(() => {})
  // The date is a DatePickerField (a button that opens a calendar): open it and pick a day this month.
  await page.locator("#req-detail-date").click().catch(() => {})
  await page.waitForTimeout(500)
  const day = page.locator("[role=dialog] [role=gridcell] button, [data-slot=popover-content] [role=gridcell] button").filter({ hasText: /^2[0-6]$/ }).first()
  await day.click().catch(() => {})
  await page.waitForTimeout(500)
  await page.getByRole("button", { name: /^(Send|Keep and send later)$/ }).first().click().catch(() => {})
  await page.waitForTimeout(2500)
  // The confirmation keeps the step's title (2026-10-27: heading and step name say the same thing); the result card says "Sent".
  check(B, "Send ends on the confirmation (Sent, under the step title)", (await h1()) === "Send for evaluation" && (await page.locator("[data-region=result]").count()) === 1, [await h1(), await pos()])
  await shot("fulfil-buttons-confirmation")
  check(B, "the path shows the self-evaluation step (demo data)", rows.some((r) => r.check === "Continue reaches Self-evaluation" && r.result === "PASS"), "")
}

await browser.close()

const summary = new Map()
for (const r of rows) {
  const s = summary.get(r.screen) ?? { screen: r.screen, checks: 0, failed: [] }
  s.checks++
  if (r.result === "FAIL") s.failed.push(`${r.check} ${r.got}`)
  summary.set(r.screen, s)
}
console.log("| Screen | Checks | Result | Failures |")
console.log("|---|---|---|---|")
for (const s of summary.values()) console.log(`| ${s.screen} | ${s.checks} | ${s.failed.length ? "FAIL" : "PASS"} | ${s.failed.join("; ")} |`)
if (NEGATIVE) {
  console.log(fails.length ? `\nNEGATIVE CONTROL OK: ${fails.length} check(s) failed on non-present pages, as they must` : "\nNEGATIVE CONTROL BROKEN: the checks passed on non-present pages")
  process.exit(fails.length ? 0 : 1)
}
console.log(fails.length ? `\n${fails.length} failed. PRESENT CHECK FAILED` : `\n${rows.length} checks on ${summary.size} pages. PRESENT CHECK PASSED`)
process.exit(fails.length ? 1 : 0)
