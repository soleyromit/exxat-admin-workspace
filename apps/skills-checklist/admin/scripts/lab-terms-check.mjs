#!/usr/bin/env node
// Noun refresh check (coordinator, 2026-10-26): change the program's noun in Settings > Naming, then, WITHOUT a reload, the
// sidebar row and a screen title use the new noun; after a reload they still do. Usage: node scripts/lab-terms-check.mjs
// [baseUrl]. Exit 1 on failure.
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
function chromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* next */ }
  }
  throw new Error("Playwright not found")
}
const base = process.argv[2] ?? "http://localhost:3017"
const browser = await chromium().launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const fails = []
const check = (name, ok, got) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${JSON.stringify(got)}`); if (!ok) fails.push(name) }
const navRows = () => page.$$eval("a[data-sidebar=menu-button]", (as) => as.map((a) => a.textContent.trim()))

await page.goto(`${base}/lab/admin/settings?variant=A&tab=naming&term=Fall%202026`, { waitUntil: "load", timeout: 240000 })
await page.evaluate(() => { try { localStorage.removeItem("lab:terms") } catch { /* */ } })
await page.reload({ waitUntil: "load" })
await page.waitForTimeout(2500)
check("starts with the default noun in the nav", (await navRows()).includes("Skills"), await navRows())

// Pick an example that is not the default, then save.
const example = page.getByRole("button", { name: "Use competency and competencies" })
const plural = "Competencies"
const has = (list, word) => list.some((t) => t.toLowerCase().includes(word.toLowerCase()))
await example.click()
await page.getByRole("button", { name: "Save names" }).click()
await page.waitForTimeout(1500)
const rows = await navRows()
check(`nav row reads "${plural}" without a reload`, has(rows, plural), rows)
const banner = await page.locator("[data-slot=local-banner], [role=status]").allTextContents()
check("the save is confirmed on the page", has(banner, plural), banner.map((t) => t.slice(0, 60)))

// Client-side navigation to the library (no reload): its title uses the noun.
await page.locator("a[data-sidebar=menu-button]", { hasText: /competencies/i }).first().click()
await page.waitForURL(/\/library|skills-library/, { timeout: 120000 })
await page.waitForTimeout(2500)
const h1 = await page.locator("main h1").first().textContent()
check(`library title uses "${plural}" without a reload`, has([h1 ?? ""], plural), h1)

await page.reload({ waitUntil: "load" })
await page.waitForTimeout(3000)
const afterReload = await navRows()
check(`after a reload the nav still reads "${plural}"`, has(afterReload, plural), afterReload)

// ARTICLE SWEEP (2026-10-26): with "competency" and then "EPA", the article before the noun must agree ("a competency",
// "an EPA", never "a EPA"). Checked on the library (title, Add button), the student nav and log title, the Send empty state,
// the add sheet and the present-mode list. The noun lives in sessionStorage, so every page stays in this tab.
const BAD = /\b[Aa] EPAs?\b|\b[Aa]n competenc/
const pageText = () => page.evaluate(() => document.body.innerText)
async function articleWalk(one, many, a) {
  const stops = [
    ["library", "/lab/admin/skills-library?variant=A"],
    ["add sheet", "/lab/admin/add-skill?variant=A"],
    ["student log", "/lab/student/log-skill?variant=A"],
    ["send empty state", "/lab/student/request-signoff?variant=A&state=empty"],
    ["present list", "/lab?present=1"],
  ]
  for (const [name, url] of stops) {
    await page.goto(`${base}${url}${url.includes("?") ? "&" : "?"}term=Fall%202026`, { waitUntil: "load", timeout: 240000 })
    await page.waitForTimeout(2500)
    const text = await pageText()
    check(`${one}: ${name} has no wrong article ("a EPA", "an competency")`, !BAD.test(text), (text.match(BAD) ?? []).slice(0, 3))
    if (name === "library") check(`${one}: library Add button reads "Add ${a}"`, (await page.getByRole("button", { name: `Add ${a}` }).count()) > 0, `Add ${a}`)
    if (name === "add sheet") check(`${one}: add sheet title reads "Add ${a}"`, text.includes(`Add ${a}`), text.slice(0, 0))
    if (name === "student log") {
      const rows = await navRows()
      check(`${one}: student nav row reads "Log ${a}"`, rows.includes(`Log ${a}`), rows)
      const h = await page.locator("main h1").first().textContent()
      check(`${one}: student log title reads "Log ${a}"`, (h ?? "").trim() === `Log ${a}`, h)
    }
    if (name === "send empty state") check(`${one}: Send empty state says "Log ${a} first"`, text.includes(`Log ${a} first`), null)
    if (name === "present list") check(`${one}: present list reads "Add ${a}"`, text.includes(`Add ${a}`), null)
  }
  void many
}
await articleWalk("competency", "competencies", "a competency")
await page.goto(`${base}/lab/admin/settings?variant=A&tab=naming&term=Fall%202026`, { waitUntil: "load", timeout: 240000 })
await page.waitForTimeout(2500)
await page.getByRole("button", { name: "Use EPA and EPAs" }).click()
await page.getByRole("button", { name: "Save names" }).click()
await page.waitForTimeout(1500)
check(`nav row reads "EPAs" after saving EPA`, has(await navRows(), "EPAs"), await navRows())
await articleWalk("EPA", "EPAs", "an EPA")

// Leave the lab on the default noun (the noun is kept in sessionStorage).
await page.evaluate(() => { try { sessionStorage.removeItem("lab:terms"); localStorage.removeItem("lab:terms") } catch { /* */ } })
await browser.close()
console.log(fails.length ? `\n${fails.length} failed. TERMS CHECK FAILED` : "\nTERMS CHECK PASSED")
process.exit(fails.length ? 1 : 0)
