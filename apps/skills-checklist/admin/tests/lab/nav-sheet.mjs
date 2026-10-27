// Runtime check (2026-10-27): the sidebar navigation stays closed after a page change and every sidebar row navigates.
// At 375 (phone flyout) the sheet must start closed on each page, open from the trigger, and close after a row click; at 1440
// a row click must reach its page. Personas: student, admin, reviewer.
// Usage: node tests/lab/nav-sheet.mjs [http://localhost:3017]
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { chromium } = require("/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js")

const base = process.argv[2] ?? "http://localhost:3017"
const TERM = "term=Fall%202026"
const START = { student: "/lab/student/home", admin: "/lab/admin/dashboard", reviewer: "/lab/reviewer/approvals" }
let failed = 0
const check = (name, ok, detail) => {
  if (!ok) failed++
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail === undefined ? "" : `  ${JSON.stringify(detail)}`}`)
}
// The DS flyout is the sidebar with data-nav-flyout; it is open when its data-state is expanded.
const flyoutOpen = (p) => p.evaluate(() => {
  const el = document.querySelector("[data-slot=sidebar][data-nav-flyout=true]")
  return el ? el.getAttribute("data-state") === "expanded" : false
})
const rowsOf = (p) => p.$$eval("a[data-sidebar=menu-button]", (as) => as.map((a) => ({ label: a.textContent.trim(), href: a.getAttribute("href") })))
const settle = async (p) => { await p.waitForLoadState("load"); await p.waitForTimeout(2500) }

const browser = await chromium.launch()
try {
  for (const width of [375, 1440]) {
    for (const [persona, start] of Object.entries(START)) {
      const ctx = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 900 } })
      const p = await ctx.newPage()
      await p.goto(`${base}${start}?${TERM}`, { waitUntil: "load", timeout: 240000 })
      await settle(p)
      const tag = `${persona} @${width}`
      if (width === 375) check(`${tag}: the navigation sheet is closed on first load`, !(await flyoutOpen(p)))
      const rows = (await rowsOf(p)).filter((r) => r.href?.startsWith("/lab/"))
      check(`${tag}: has sidebar rows`, rows.length > 0, rows.map((r) => r.label))
      // Click every row except the first (the landing page) and a row whose panel opens in place (admin Skills).
      for (const row of rows.slice(1)) {
        if (persona === "admin" && /^(Skills|Competencies|EPAs)$/.test(row.label)) continue
        if (width === 375) {
          await p.locator("[data-sidebar=trigger]").first().click({ timeout: 15000 })
          await p.waitForTimeout(600)
          check(`${tag}: the trigger opens the sheet before "${row.label}"`, await flyoutOpen(p))
        }
        const path = row.href.split("?")[0]
        await p.locator(`a[data-sidebar=menu-button][href="${row.href}"]`).first().click({ timeout: 15000 })
        await p.waitForURL((u) => u.pathname.startsWith(path), { timeout: 120000 }).catch(() => {})
        await settle(p)
        check(`${tag}: "${row.label}" navigates`, new URL(p.url()).pathname.startsWith(path), { want: path, got: new URL(p.url()).pathname })
        if (width === 375) check(`${tag}: the sheet is closed after "${row.label}"`, !(await flyoutOpen(p)))
      }
      // A page change that does not come from the sidebar (browser back) also leaves the sheet closed.
      if (width === 375 && rows.length > 1) {
        await p.goBack({ waitUntil: "load" })
        await settle(p)
        check(`${tag}: the sheet is closed after going back`, !(await flyoutOpen(p)))
      }
      await ctx.close()
    }
  }
} finally {
  await browser.close()
}
console.log(failed ? `\n${failed} failed. NAV SHEET CHECK FAILED` : "\nNAV SHEET CHECK PASSED")
process.exit(failed ? 1 : 0)
