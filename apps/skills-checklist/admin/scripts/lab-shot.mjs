#!/usr/bin/env node
// Screenshot helper for lab screens: node scripts/lab-shot.mjs <outDir> <width> <path> [<path> ...]
// Clean localStorage, transitions off, waits for the page to settle, full first viewport (900 tall at 1440, 812 at 375).
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
const [out, w, ...paths] = process.argv.slice(2)
const base = process.env.BASE ?? "http://localhost:3017"
const width = Number(w)
const height = width < 768 ? 812 : 900
const full = process.env.FULL === "1"
mkdirSync(out, { recursive: true })
const browser = await chromium().launch()
const ctx = await browser.newContext({ viewport: { width, height } })
await ctx.addInitScript(() => { try { localStorage.clear() } catch { /* */ } })
const page = await ctx.newPage()
for (const p of paths) {
  try { await page.goto(base + p, { waitUntil: "load", timeout: 240000 }) } catch (e) { if (!String(e).includes("ERR_ABORTED")) throw e }
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" })
  await page.waitForTimeout(3500)
  const name = p.replace(/^\/lab\//, "").replace(/[/?&=%]+/g, "-").slice(0, 120) + `-${width}.png`
  const sw = await page.evaluate(() => document.documentElement.scrollWidth)
  await page.screenshot({ path: join(out, name), fullPage: full })
  console.log(`${name}  scrollWidth=${sw} viewport=${width}${sw > width ? "  HORIZONTAL OVERFLOW" : ""}`)
}
await browser.close()
