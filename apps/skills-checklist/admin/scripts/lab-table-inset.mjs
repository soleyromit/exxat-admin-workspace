#!/usr/bin/env node
// Probe for the DS DataTable "Parent <div> adds ~Npx horizontal inset" warning on real lab pages (not jsdom).
// Usage: node scripts/lab-table-inset.mjs [<path> ...]. For each page it prints the DS console warnings it emitted and, for every
// DataTable root (the div holding the toolbar and grid), the parent's computed padding-left/right + margin-left/right in px.
// Exit 1 when a parent adds more than 8px (the DS threshold) or the DS warning fires.
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
function chromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* next */ }
  }
  throw new Error("Playwright not found")
}
const DEFAULT = ["/lab/admin/skills-library?variant=A", "/lab/admin/skills-library?variant=B", "/lab/admin/skills-library?variant=C", "/lab/reviewer/approvals?variant=A", "/lab/reviewer/approvals?variant=B", "/lab/reviewer/approvals?variant=C", "/lab/admin/approvals?variant=A", "/lab/lab-instructor/lab-batch-grid?variant=A", "/lab/lab-instructor/lab-batch-grid?variant=B"]
const paths = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT
const base = process.env.BASE ?? "http://localhost:3017"
const browser = await chromium().launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
let bad = 0
for (const p of paths) {
  const warns = []
  const onConsole = (m) => { if (m.text().includes("horizontal inset")) warns.push(m.text().slice(0, 90)) }
  page.on("console", onConsole)
  for (let attempt = 0; attempt < 2; attempt++) {
    try { await page.goto(base + p, { waitUntil: "load", timeout: 240000 }); break } catch (e) { if (attempt || !/closed|ERR_ABORTED/.test(String(e))) throw e }
  }
  await page.waitForTimeout(3000)
  const roots = await page.evaluate(() => {
    const px = (v) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0)
    // The DataTable root: "flex min-w-0 w-full flex-col gap-0" holding a grid or table.
    return [...document.querySelectorAll("div.min-w-0.w-full.flex-col.gap-0")].filter((d) => d.querySelector("[role=grid], table")).map((d) => {
      const par = d.parentElement
      const s = getComputedStyle(par)
      const inset = px(s.paddingLeft) + px(s.paddingRight) + px(s.marginLeft) + px(s.marginRight)
      return { inset, parent: `<${par.tagName.toLowerCase()} class="${(par.className || "").toString().slice(0, 80)}">` }
    })
  })
  page.off("console", onConsole)
  const over = roots.filter((r) => r.inset > 8)
  if (over.length || warns.length) bad++
  console.log(`${p}: ${roots.length} DataTable(s), parent inset px [${roots.map((r) => r.inset).join(", ")}], DS warnings ${warns.length}`)
  for (const r of roots) console.log(`   ${r.inset}px ${r.parent}`)
  for (const w of warns) console.log(`   WARN ${w}`)
}
await browser.close()
console.log(bad ? `\n${bad} page(s) with a stacked inset` : "\nNo stacked inset on any page")
process.exit(bad ? 1 : 0)
