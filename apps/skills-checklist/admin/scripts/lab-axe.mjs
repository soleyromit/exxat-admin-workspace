#!/usr/bin/env node
// axe-core (WCAG 2.1 A/AA rules) on lab screens through Playwright: node scripts/lab-axe.mjs <width> <path> [<path> ...]
// Transitions are frozen before the run (mid-transition colours give phantom contrast failures). Reports critical and serious
// violations per screen; exit 1 when any screen has one. Lab chrome ([data-lab-chrome]) is excluded, as in the density script.
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"

const require = createRequire(import.meta.url)
function chromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* next */ }
  }
  throw new Error("Playwright not found")
}
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8")
const [w, ...paths] = process.argv.slice(2)
const base = process.env.BASE ?? "http://localhost:3017"
const width = Number(w)
const browser = await chromium().launch()
const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 812 : 900 } })
await ctx.addInitScript(() => { try { localStorage.clear() } catch { /* */ } })
const page = await ctx.newPage()
let bad = 0
for (const p of paths) {
  try { await page.goto(base + p, { waitUntil: "load", timeout: 240000 }) } catch (e) { if (!String(e).includes("ERR_ABORTED")) throw e }
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" })
  await page.waitForTimeout(3500)
  await page.addScriptTag({ content: axeSource })
  const res = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run({ include: [["body"]], exclude: [["[data-lab-chrome]"]] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, experimental: v.tags.includes("experimental"), n: v.nodes.length, target: v.nodes.slice(0, 3).map((x) => x.target.join(" ")) }))
  })
  // Experimental rules (axe excludes them by default; label-content-name-mismatch is one) are listed, not counted.
  const cs = res.filter((v) => !v.experimental && (v.impact === "critical" || v.impact === "serious"))
  const crit = cs.filter((v) => v.impact === "critical").reduce((t, v) => t + v.n, 0)
  const ser = cs.filter((v) => v.impact === "serious").reduce((t, v) => t + v.n, 0)
  if (crit + ser) bad++
  console.log(`${p} @${width}: critical ${crit}, serious ${ser}, other ${res.length - cs.length} rule(s)`)
  for (const v of res) console.log(`   ${v.impact}${v.experimental ? " (experimental)" : ""} ${v.id} x${v.n}  ${v.target.join(" | ").slice(0, 200)}`)
}
await browser.close()
process.exit(bad ? 1 : 0)
