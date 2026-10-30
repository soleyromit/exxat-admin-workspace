#!/usr/bin/env node
// Runtime check for REQ RP-01 and RP-09 on every reporting screen (dev server on :3017).
//   node tests/lab/reporting-runtime.mjs chips  <screen?variant=X,...>   3 filters -> 3 chips -> remove the middle one
//   node tests/lab/reporting-runtime.mjs impossible <screen?variant=X> ...   location without the setting -> explanation, not zeros
// Screenshots land in docs/knowledge/design/lab-shots/wave2. Exit 1 on any failure.
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
const base = process.env.BASE ?? "http://localhost:3017"
const out = join(import.meta.dirname, "..", "..", "..", "docs", "knowledge", "design", "lab-shots", "wave2")
mkdirSync(out, { recursive: true })
const width = Number(process.env.WIDTH ?? 1440)
const browser = await chromium().launch()
const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 812 : 900 } })
await ctx.addInitScript(() => { try { localStorage.clear() } catch { /* */ } })
const page = await ctx.newPage()
const slug = (s) => s.replace(/[/?=&]+/g, "-")
async function go(p) {
  try { await page.goto(base + p, { waitUntil: "load", timeout: 240000 }) } catch (e) { if (!String(e).includes("ERR_ABORTED")) throw e }
  await page.waitForTimeout(3000)
  try { await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" }) } catch { await page.waitForTimeout(3000) }
}
const join2 = (s, q) => `/lab/${s}${s.includes("?") ? "&" : "?"}${q}`
let failed = 0
const [mode, ...args] = process.argv.slice(2)

if (mode === "chips") {
  for (const s of args.join(",").split(",")) {
    await go(join2(s, "cohort=BSN%202027&loc=Skills%20lab%202&setting=lab"))
    const chips = () => page.$$eval("[data-applied-filters] [data-scope-chip]", (els) => els.map((e) => e.getAttribute("data-scope-chip")))
    const before = await chips()
    await page.screenshot({ path: join(out, `RP-01-${slug(s)}-3chips-${width}.png`) })
    let after = []
    if (before.length === 3) {
      // Export A opens its export drawer on arrival (a modal): close it first, as a person would.
      if (await page.$("[role=dialog]")) { await page.keyboard.press("Escape"); await page.waitForTimeout(800) }
      await page.locator("[data-applied-filters] [data-scope-chip]").nth(1).click()
      for (let i = 0; i < 16 && (after = await chips()).length !== 2; i++) await page.waitForTimeout(500)
      await page.screenshot({ path: join(out, `RP-01-${slug(s)}-after-remove-${width}.png`) })
    }
    const ok = before.join() === "cohort,loc,setting" && after.join() === "cohort,setting"
    if (!ok) failed++
    console.log(`${ok ? "PASS" : "FAIL"} ${s} before=${before.join("|")} after=${after.join("|")}`)
  }
} else if (mode === "impossible") {
  for (const s of args) {
    await go(join2(s, "loc=Skills%20lab%202&setting=clinical"))
    const r = await page.evaluate(() => {
      const main = document.querySelector("main")?.innerText ?? document.body.innerText
      return {
        explained: /does not offer/.test(main),
        banner: !!document.querySelector("[data-impossible-scope]"),
        zeros: (main.match(/\b0 of \d+\b|\b0 rows\b|\b0 students\b/g) || []).slice(0, 5),
        chips: [...document.querySelectorAll("[data-applied-filters] [data-scope-chip]")].map((e) => e.getAttribute("data-scope-chip")),
      }
    })
    // Director pages open on the graduating cohort, so a Cohort chip may sit beside the two applied here.
    const ok = r.explained && r.zeros.length === 0 && r.chips.includes("loc") && r.chips.includes("setting")
    if (!ok) failed++
    console.log(`${ok ? "PASS" : "FAIL"} ${s} ${JSON.stringify(r)}`)
    await page.screenshot({ path: join(out, `RP-09-${slug(s)}-${width}.png`) })
  }
} else {
  console.error("usage: chips <screens> | impossible <screens...>")
  failed = 1
}
await browser.close()
process.exit(failed ? 1 : 0)
