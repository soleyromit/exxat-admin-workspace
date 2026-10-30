#!/usr/bin/env node
// Runtime check for SL-09 / ST-09: a name typed through "Someone not listed" on Send reaches Approvals, New evaluators and
// Settings > Evaluators as Not verified. node tests/lab/e2e-named-evaluator.mjs [outDir]  (dev server on BASE, default :3017)
import { createRequire } from "node:module"
import { mkdirSync } from "node:fs"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const chromium = (() => {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* next */ }
  }
  throw new Error("Playwright not found")
})()
const base = process.env.BASE ?? "http://localhost:3017"
const out = process.argv[2] ?? "/tmp/named-evaluator-shots"
mkdirSync(out, { recursive: true })
const results = []
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `  (${detail})` : ""}`) }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => { if (!sessionStorage.getItem("sl09")) { try { localStorage.clear() } catch { /* */ } sessionStorage.setItem("sl09", "1") } })
const page = await ctx.newPage()
const go = async (p) => {
  try { await page.goto(base + p, { waitUntil: "load", timeout: 240000 }) } catch (e) { if (!String(e).includes("ERR_ABORTED")) throw e }
  await page.waitForTimeout(2500)
}
const NAME = "Priya Lindqvist"
const EMAIL = "priya.lindqvist@example.org"

await go("/lab/student/request-signoff?variant=A")
await page.getByText("Someone not listed").first().click()
await page.waitForTimeout(400)
await page.locator("#new-name").fill(NAME)
await page.locator("#new-email").fill(EMAIL)
await page.locator("#req-detail-date").click()
await page.waitForTimeout(400)
const day = page.locator("[role=gridcell] button, button[name=day], td button").filter({ hasText: /^20$/ }).first()
if (await day.count()) await day.click()
await page.waitForTimeout(400)
await page.getByRole("button", { name: /^Send$/ }).click()
await page.waitForTimeout(1500)
const conf = await page.locator("[data-confirmation]").innerText().catch(() => "")
check("Send A: sent to the typed name", conf.includes(NAME), conf.replace(/\s+/g, " ").slice(0, 140))
await page.screenshot({ path: join(out, "SL-09-send-A-sent-1440.png") })

await go("/lab/admin/approvals?tab=new-evaluators")
const inQueue = await page.getByText(NAME).count()
check("Approvals, New evaluators lists the typed name", inQueue > 0, `matches ${inQueue}`)
await page.screenshot({ path: join(out, "SL-09-approvals-new-evaluators-1440.png") })

await go(`/lab/admin/settings?tab=evaluators&q=${encodeURIComponent("Lindqvist")}`)
const inDir = await page.getByText(NAME).count()
const notVerified = await page.getByText("Not verified").count()
check("Settings > Evaluators lists the typed name as Not verified", inDir > 0 && notVerified > 0, `name ${inDir}, not verified ${notVerified}`)
await page.screenshot({ path: join(out, "SL-09-settings-evaluators-1440.png") })

await browser.close()
const failed = results.filter((r) => !r).length
console.log(`\n${results.length - failed} of ${results.length} pass`)
process.exit(failed ? 1 : 0)
