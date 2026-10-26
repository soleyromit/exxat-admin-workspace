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
const MARQUEE_LABELS = ["Skills library", "Add a skill", "Configure a skill", "Assign to a cohort or group", "Course mapping", "My progress", "Log a skill", "Send for evaluation", "Evaluation form", "Evaluation submitted", "Approvals"]
const MARQUEE_COUNT = MARQUEE_LABELS.length
const STUDENT = new Set(["My progress", "Log a skill", "Send for evaluation"])
// Screens that show generated people or evidence and carry the Sample data chip outside present mode (D-X23). The library, add
// and configure screens show only the program's skills, and the evaluator screens have no app chrome; they carry no chip.
const SAMPLE = new Set(["Assign to a cohort or group", "Course mapping", "My progress", "Log a skill", "Send for evaluation", "Approvals"])
// --negative: run the same per-screen assertions on marquee screens WITHOUT present=1. They must FAIL there (negative control),
// proving the check can see the lab chrome and labels it bans. Exit 0 only when the control fails as expected.
const NEGATIVE = process.argv.includes("--negative")

const browser = await chromium().launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const rows = []
const fails = []
const check = (screen, name, ok, got) => { rows.push({ screen, check: name, result: ok ? "PASS" : "FAIL", got: ok ? "" : JSON.stringify(got).slice(0, 140) }); if (!ok) fails.push(`${screen}: ${name}`) }

async function load(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto(`${base}${url}`, { waitUntil: "load", timeout: 240000 })
      await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {})
      await page.waitForTimeout(2000)
      return
    } catch (e) {
      if (attempt === 1 || !String(e).includes("closed")) throw e
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
if (!NEGATIVE) {
  check("index", `${MARQUEE_COUNT} marquee links`, index.links.length === MARQUEE_COUNT, index.links.map((l) => l.label))
  check("index", "marquee in the agreed order", JSON.stringify(index.links.map((l) => l.label)) === JSON.stringify(MARQUEE_LABELS), index.links.map((l) => l.label))
  check("index", "every marquee link carries present=1", index.links.every((l) => /[?&]present=1\b/.test(l.href ?? "")), index.links.filter((l) => !/present=1/.test(l.href ?? "")))
  check("index", "Not ready items listed", index.notReady.length > 0, index.notReady)
  check("index", "Not ready items are not links", index.notReady.every((x) => x.links === 0), index.notReady.filter((x) => x.links))
  const idxText = await domText()
  for (const [name, re] of BANNED) check("index", `no ${name}`, !re.test(idxText), idxText.match(re)?.[0])
}

// Negative control: the same screens with present=0 (explicit, so the stored present flag cannot turn it back on).
const targets = NEGATIVE ? index.links.filter((l) => l.label === "Skills library" || l.label === "My progress").map((l) => ({ ...l, href: l.href.replace(/([?&])present=1\b/, "$1present=0") })) : index.links
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
  check(l.label, "breadcrumb is the screen title only", crumbs.length <= 1 && !crumbs.some((c) => /Design lab|^(Administrator|Reviewer|Student|Evaluator|Program director|Lab instructor)$/.test(c)), crumbs)
  // Tier and build badges, by their own markers as well as by text.
  const marked = await page.locator("[data-tier], [data-build-status], [data-lab-tier]").count()
  check(l.label, "no tier or build badge markers", marked === 0, marked)
  // D-X23: the Sample data chip stays visible in present mode.
  const sample = await page.getByText("Sample data", { exact: true }).first().isVisible().catch(() => false)
  if (SAMPLE.has(l.label)) check(l.label, "Sample data chip visible", sample, sample)
  // Offline sync is pending scope: the sync chip (queued, synced, conflict) is hidden on student screens in present mode.
  if (STUDENT.has(l.label)) {
    const chips = await page.locator("[data-sync-chip]").count()
    check(l.label, "no sync chip", chips === 0, chips)
  }
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
