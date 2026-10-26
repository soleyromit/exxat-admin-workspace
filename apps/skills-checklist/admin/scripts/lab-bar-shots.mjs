#!/usr/bin/env node
// Screenshots of the lab bar (and the first 140 px under it) for review. Usage:
//   node scripts/lab-bar-shots.mjs <outDir> <prefix> [widths=1440,1280,1024,768,375]
// Clean storage, transitions off, explicit term. Reports the bar height and any horizontal overflow, truncated text inside the
// bar (an element whose scrollWidth exceeds its clientWidth), and controls under 44 px at 640 or less.
import { createRequire } from "node:module"
import { mkdirSync } from "node:fs"
import { join } from "node:path"

const require = createRequire(import.meta.url)
function chromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* next */ }
  }
  throw new Error("Playwright not found")
}
const [out, prefix, w = "1440,1280,1024,768,375"] = process.argv.slice(2)
const base = process.env.BASE ?? "http://localhost:3017"
const T = "term=Fall%202026"
const PAGES = [
  ["setup-s1", `/lab/flow/set-up-skills/import?set=1&${T}`],
  ["setup-s2", `/lab/flow/set-up-skills/import?set=2&${T}`],
  ["setup-s3", `/lab/flow/set-up-skills/import?set=3&${T}`],
  ["student-s1", `/lab/flow/my-progress/detail?set=1&${T}`],
  ["student-s2", `/lab/flow/my-progress/detail?set=2&${T}`],
  ["student-s3", `/lab/flow/my-progress/detail?set=3&${T}`],
  ["evaluator-s1", `/lab/flow/sign-skills/form?set=1&${T}`],
  ["evaluator-s2", `/lab/flow/sign-skills/form?set=2&${T}`],
  ["evaluator-s3", `/lab/flow/sign-skills/form?set=3&${T}`],
  ["cohort-s2", `/lab/flow/watch-the-cohort/drill?set=2&${T}`],
  ["dashboard-d", `/lab/admin/dashboard?variant=D&set=1&${T}`],
]
mkdirSync(out, { recursive: true })
const browser = await chromium().launch()
for (const width of w.split(",").map(Number)) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 812 : 900 } })
  await ctx.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear() } catch { /* */ } })
  const page = await ctx.newPage()
  for (const [name, path] of PAGES) {
    try { await page.goto(base + path, { waitUntil: "load", timeout: 240000 }) } catch (e) { if (!String(e).includes("ERR_ABORTED")) throw e }
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" })
    await page.waitForTimeout(2500)
    const info = await page.evaluate((narrow) => {
      const bar = document.querySelector("[data-lab-bar]")
      if (!bar) return null
      const r = bar.getBoundingClientRect()
      const row = bar.firstElementChild?.getBoundingClientRect()
      const truncated = [...bar.querySelectorAll("*")].filter((el) => {
        const cs = getComputedStyle(el)
        if (cs.display === "none" || el.closest("[hidden]") || el.getClientRects().length === 0) return false
        return el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 1
      }).map((el) => el.textContent.trim().slice(0, 30))
      const small = narrow ? [...bar.querySelectorAll("button, a")].filter((el) => el.getClientRects().length && (el.getBoundingClientRect().height < 44 || el.getBoundingClientRect().width < 44)).map((el) => el.getAttribute("aria-label") || el.textContent.trim().slice(0, 20)) : []
      return { top: r.top, height: Math.round(row?.height ?? r.height), sw: document.documentElement.scrollWidth, truncated, small }
    }, width <= 640)
    const file = join(out, `${prefix}-${name}-${width}.png`)
    if (info) await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height: Math.min(260, info.top + info.height + 140) } })
    console.log(`${name}@${width}: bar ${info?.height ?? "missing"}px, scrollWidth ${info?.sw}${info && info.sw > width ? " OVERFLOW" : ""}${info?.truncated.length ? `, truncated: ${info.truncated.join(" | ")}` : ""}${info?.small.length ? `, under 44px: ${info.small.join(" | ")}` : ""}`)
  }
  await ctx.close()
}
await browser.close()
