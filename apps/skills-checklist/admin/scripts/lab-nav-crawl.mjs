#!/usr/bin/env node
// Navigation crawl for the design lab (Romit: "variants and nav inside the variants aren't matching").
// For every flow, every option set and every step: load /lab/flow/<flow>/<step>?set=n&term=Fall%202026 with clean storage,
// collect every internal /lab link on the page (sidebar, lab bar journey, in-page links, banner actions; whatever is in the DOM
// after load), resolve each link to (screen, variant) and assert:
//   - a link to a screen of the page's flow lands on the variant the page's set maps that screen to;
//   - a link into another flow carries the page's set when that flow has it, else that flow's recommended set;
//   - a query-only link (?x=y) keeps the set;
//   - a screen in no flow is free (its recommended variant), but must not name a variant letter.
// NAV IDENTITY (Romit, 2026-10-26: "left-side navigation is consistent across variants within each persona"): the sidebar
// rows (titles, in order) must be identical on every page of a persona, flow steps in every set AND every variant of every
// screen of that persona; and a flow's journey steps must be identical in every set. Any difference fails.
// Prints a table and exits 1 on any mismatch. Usage: node scripts/lab-nav-crawl.mjs [baseUrl] [--flow=id] [--workers=n]
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
function chromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* next */ }
  }
  throw new Error("Playwright not found")
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3017"
const onlyFlow = args.find((a) => a.startsWith("--flow="))?.slice(7)
const WORKERS = Number(args.find((a) => a.startsWith("--workers="))?.slice(10) ?? 3)
const flows = JSON.parse(fs.readFileSync(path.join(root, "lib/lab/flows.json"), "utf8")).flows
const screens = JSON.parse(fs.readFileSync(path.join(root, "lib/lab/screens.json"), "utf8")).screens
const screenDef = (key) => screens.find((s) => `${s.persona}/${s.slug}` === key)
const flowById = (id) => flows.find((f) => f.id === id)
const mainSteps = (f) => f.steps.filter((s) => !s.side)

/** (screen, variant, flow, set) a link resolves to, or null for links the crawl does not judge (/lab index, external). */
function resolveLink(href, page) {
  const u = new URL(href, base + page.url)
  if (u.origin !== new URL(base).origin || !u.pathname.startsWith("/lab/")) return null
  const parts = u.pathname.split("/").filter(Boolean) // lab, flow, f, step | lab, persona, slug
  const set = u.searchParams.get("set")
  if (parts[1] === "flow") {
    const f = flowById(parts[2])
    if (!f) return { error: `unknown flow ${parts[2]}` }
    const st = parts[3] ? f.steps.find((s) => s.id === parts[3]) : mainSteps(f)[0]
    if (!st) return { error: `unknown step ${parts[3]}` }
    const s = set && f.sets.some((x) => x.id === set) ? set : f.recommendedSet
    const variant = u.searchParams.get("variant") ?? st.variants[s]
    return { screen: st.screen, variant, flow: f.id, set, explicit: u.searchParams.has("variant") }
  }
  const key = `${parts[1]}/${parts[2]}`
  const def = screenDef(key)
  if (!def) return { error: `unknown screen ${key}` }
  return { screen: key, variant: u.searchParams.get("variant") ?? def.recommended, flow: null, set, explicit: u.searchParams.has("variant") }
}

function judge(link, page) {
  const pf = flowById(page.flow)
  if (link.error) return link.error
  const inPageFlow = pf.steps.filter((s) => s.screen === link.screen)
  if (inPageFlow.length) {
    const want = inPageFlow[0].variants[page.set]
    // A self link on the same screen keeps the page's own variant (which is the set's, on a flow page).
    if (link.variant !== want) return `${link.screen} lands on ${link.variant}, set ${page.set} maps it to ${want}`
    if (link.flow && link.flow !== page.flow && !flowById(link.flow).sets.some((x) => x.id === page.set)) return null
    if (link.flow && link.set !== page.set && flowById(link.flow).sets.some((x) => x.id === page.set)) return `${link.screen} drops the set (${link.set ?? "none"} instead of ${page.set})`
    return null
  }
  if (link.flow) {
    const f = flowById(link.flow)
    const want = f.sets.some((x) => x.id === page.set) ? page.set : f.recommendedSet
    if ((link.set ?? f.recommendedSet) !== want) return `${link.screen} in ${link.flow} opens set ${link.set ?? "none"}, expected ${want}`
    return null
  }
  if (link.explicit) return `${link.screen} names variant ${link.variant} on a screen URL`
  return null
}

const PAGES = []
for (const f of flows) {
  if (onlyFlow && f.id !== onlyFlow) continue
  for (const set of f.sets) for (const st of f.steps) PAGES.push({ flow: f.id, set: set.id, step: st.id, persona: st.screen.split("/")[0], url: `/lab/flow/${f.id}/${st.id}?set=${set.id}&term=Fall%202026` })
}
// Every variant of every screen, for the nav identity check only (their links are not judged: a screen URL has no set).
if (!onlyFlow) for (const s of screens) for (const v of s.variants) PAGES.push({ navOnly: true, persona: s.persona, step: `${s.slug}/${v.id}`, url: `/lab/${s.persona}/${s.slug}?variant=${v.id}&term=Fall%202026` })

// One browser, relaunched if it goes away (a long dev-server crawl can lose it), and one context per page so memory stays flat.
let browser = await chromium().launch()
async function liveBrowser() {
  if (!browser.isConnected()) browser = await chromium().launch()
  return browser
}
const SHELL = new Set(["admin", "reviewer", "director", "student"])
const results = []
async function visit(p) {
  const row = { ...p, links: 0, bad: [], status: 0 }
  const ctx = await (await liveBrowser()).newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear() } catch { /* */ } })
  const tab = await ctx.newPage()
  try {
    const res = await tab.goto(base + p.url, { waitUntil: "load", timeout: 240000 })
    row.status = res?.status() ?? 0
    await tab.waitForTimeout(2500)
    row.nav = await tab.$$eval("a[data-sidebar=menu-button]", (els) => els.map((e) => e.textContent.trim().replace(/\s*\d+$/, "")))
    row.journey = await tab.$$eval("[data-lab-dots] a", (els) => els.map((e) => e.getAttribute("aria-label")))
    // A shell persona page without a sidebar did not finish rendering (dev recompile): retry rather than report a difference.
    if (SHELL.has(p.persona) && row.nav.length === 0) throw new Error("no sidebar rendered")
    if (!p.navOnly) {
      const hrefs = await tab.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")).filter((h) => h && (h.startsWith("/lab") || h.startsWith("?"))))
      // Sidebar rows have bare urls (the DS highlights by path); the set rides along at click time (lab-frame SidebarCarry,
      // only when the target flow has that set), which the click check below verifies for real.
      const sidebar = new Set(await tab.$$eval("a[data-sidebar=menu-button]", (as) => as.map((a) => a.getAttribute("href"))))
      for (const raw of [...new Set(hrefs)]) {
        let h = raw
        if (sidebar.has(raw) && !raw.includes("?")) {
          const target = flowById(raw.split("/")[3])
          h = target && target.sets.some((x) => x.id === p.set) ? `${raw}?set=${p.set}` : raw
        }
        if (h === "/lab" || h.startsWith("/lab?") || h.startsWith("/lab#")) continue
        if (h.startsWith("?")) {
          row.links++
          if (!new URLSearchParams(h.slice(1)).get("set")) row.bad.push(`query link ${h.slice(0, 60)} drops the set`)
          continue
        }
        const link = resolveLink(h, p)
        if (!link) continue
        row.links++
        const why = judge(link, p)
        if (why) row.bad.push(`${why}  [${h.slice(0, 90)}]`)
      }
    }
  } catch (e) {
    row.error = String(e).slice(0, 120)
  }
  await ctx.close().catch(() => {})
  return row
}
async function work(queue) {
  for (let p = queue.shift(); p; p = queue.shift()) {
    let row = await visit(p)
    if (row.error) row = await visit(p) // one retry: a dev-server recompile or a lost browser
    if (row.error) row.bad.push(`load failed: ${row.error}`)
    results.push(row)
    process.stderr.write(".")
  }
}
const queue = [...PAGES]
await Promise.all(Array.from({ length: WORKERS }, () => work(queue)))

// Real clicks: on a page in a non-recommended set, click a sidebar row into another flow and check the landing keeps the set.
const clickFails = []
const clickRows = []
{
  // A fresh browser: the crawl browser can be gone after 200 dev-server pages.
  const clicker = await chromium().launch()
  const ctx = await clicker.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear() } catch { /* */ } })
  const tab = await ctx.newPage()
  for (const [from, set, row] of [["/lab/flow/set-up-skills/configure", "2", "Dashboard"], ["/lab/flow/watch-the-cohort/drill", "3", "Skills"], ["/lab/flow/my-progress/detail", "2", "Log a skill"], ["/lab/flow/clear-approvals/review", "3", "Students"]]) {
    if (onlyFlow) break
    try {
      await tab.goto(`${base}${from}?set=${set}&term=Fall%202026`, { waitUntil: "load", timeout: 240000 })
      await tab.waitForTimeout(2000)
      await tab.locator("a[data-sidebar=menu-button]", { hasText: row }).first().click()
      await tab.waitForURL((u) => !u.pathname.startsWith(from), { timeout: 120000 })
      await tab.waitForTimeout(1500)
      const u = new URL(tab.url())
      const ok = u.searchParams.get("set") === set && u.searchParams.get("term") === "Fall 2026"
      clickRows.push(`| ${from}?set=${set} | ${row} | ${u.pathname}${u.search} | ${ok ? "keeps set and term" : "LOST"} |`)
      if (!ok) clickFails.push(`sidebar ${row} from ${from} set ${set} landed on ${u.pathname}${u.search}`)
    } catch (e) {
      clickFails.push(`sidebar click ${row} from ${from}: ${String(e).slice(0, 100)}`)
    }
  }
  await ctx.close()
  await clicker.close()
}
if (browser.isConnected()) await browser.close()
process.stderr.write("\n")

results.sort((a, b) => PAGES.findIndex((p) => p.url === a.url) - PAGES.findIndex((p) => p.url === b.url))

// Nav identity: one sidebar per persona (light personas have none), one journey per flow.
const navFails = []
const byPersona = new Map()
for (const r of results) {
  const key = JSON.stringify(r.nav ?? [])
  if (!byPersona.has(r.persona)) byPersona.set(r.persona, new Map())
  const m = byPersona.get(r.persona)
  m.set(key, [...(m.get(key) ?? []), r.url])
}
for (const [persona, m] of byPersona) if (m.size > 1) navFails.push(`${persona}: ${m.size} different sidebars: ${[...m.entries()].map(([k, urls]) => `${k} on ${urls.length} page(s), e.g. ${urls[0]}`).join(" | ")}`)
const byFlow = new Map()
for (const r of results.filter((x) => !x.navOnly && x.journey?.length)) {
  const key = JSON.stringify(r.journey)
  if (!byFlow.has(r.flow)) byFlow.set(r.flow, new Set())
  byFlow.get(r.flow).add(key)
}
for (const [flow, keys] of byFlow) if (keys.size > 1) navFails.push(`${flow}: journey differs between sets: ${[...keys].join(" | ")}`)
console.log("| Flow | Set | Step | HTTP | Links | Mismatches |")
console.log("|---|---|---|---|---|---|")
for (const r of results.filter((x) => !x.navOnly)) console.log(`| ${r.flow} | ${r.set} | ${r.step} | ${r.status} | ${r.links} | ${r.bad.length} |`)
console.log("\n| Persona | Pages | Sidebar rows (identical on every page) |")
console.log("|---|---|---|")
for (const [persona, m] of byPersona) console.log(`| ${persona} | ${[...m.values()].flat().length} | ${m.size === 1 ? JSON.parse([...m.keys()][0]).join(", ") || "none (light frame)" : "DIFFERS"} |`)
const bad = results.filter((r) => r.bad.length)
if (bad.length) {
  console.log("\nMISMATCHES")
  for (const r of bad) for (const b of r.bad) console.log(`- ${r.flow} set ${r.set} ${r.step}: ${b}`)
}
if (clickRows.length) {
  console.log("\n| From | Sidebar row | Landed on | Result |")
  console.log("|---|---|---|---|")
  for (const r of clickRows) console.log(r)
}
navFails.push(...clickFails)
if (navFails.length) {
  console.log("\nNAV IDENTITY FAILURES")
  for (const n of navFails) console.log(`- ${n}`)
}
const total = results.reduce((t, r) => t + r.links, 0)
const failed = bad.length > 0 || navFails.length > 0
console.log(`\n${results.length} pages, ${total} links judged, ${bad.reduce((t, r) => t + r.bad.length, 0)} mismatches, ${navFails.length} nav identity failures. ${failed ? "CRAWL FAILED" : "CRAWL PASSED"}`)
process.exit(failed ? 1 : 0)
