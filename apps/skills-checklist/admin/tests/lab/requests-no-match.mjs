// Runtime check (2026-10-27): on My requests A and B, when search or filters leave the open tab with nothing, the page says
// "No requests match." with a "Clear filters" link, and the link clears them. 1440 and 375; search typed, filters in the URL.
// Usage: node tests/lab/requests-no-match.mjs [http://localhost:3017]
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { chromium } = require("/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js")

const base = process.argv[2] ?? "http://localhost:3017"
let failed = 0
const check = (name, ok, detail) => {
  if (!ok) failed++
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail === undefined ? "" : `  ${JSON.stringify(detail)}`}`)
}
// innerText of the visible line (what a reader sees), normalised to one line.
const noMatch = (p) => p.evaluate(() => {
  const el = [...document.querySelectorAll("[data-requests-no-match]")].find((e) => e.getBoundingClientRect().height > 0)
  return el ? el.innerText.replace(/\s+/g, " ").trim() : ""
})
const WANT = "No requests match. Clear filters"

const browser = await chromium.launch()
try {
  for (const [v, set] of [["A", "1"], ["B", "2"]]) {
    for (const width of [1440, 375]) {
      const p = await browser.newPage({ viewport: { width, height: width === 375 ? 812 : 900 } })
      const tag = `My requests ${v} @${width}`
      await p.goto(`${base}/lab/flow/ask-for-evaluation/requests?set=${set}&term=Fall%202026`, { waitUntil: "load", timeout: 240000 })
      await p.waitForTimeout(3000)
      check(`${tag}: no "No requests match" before searching`, (await noMatch(p)) === "")
      await p.locator("[data-requests-search]:visible").first().pressSequentially("zzzzqq", { delay: 40 })
      await p.waitForTimeout(2000)
      check(`${tag}: a search with no result says "${WANT}"`, (await noMatch(p)) === WANT, await noMatch(p))
      await p.getByRole("button", { name: "Clear filters" }).first().click()
      await p.waitForTimeout(2000)
      check(`${tag}: Clear filters clears the search`, !new URL(p.url()).searchParams.get("q") && (await noMatch(p)) === "", p.url())
      for (const extra of ["fsetting=simulation&show=done", "ffrom=2030-01-01&show=drafts"]) {
        await p.goto(`${base}/lab/flow/ask-for-evaluation/requests?set=${set}&term=Fall%202026&${extra}`, { waitUntil: "load", timeout: 240000 })
        await p.waitForTimeout(2500)
        check(`${tag}: filters ${extra} with no result say "${WANT}"`, (await noMatch(p)) === WANT, await noMatch(p))
      }
      await p.close()
    }
  }
} finally {
  await browser.close()
}
console.log(failed ? `\n${failed} failed. REQUESTS NO-MATCH CHECK FAILED` : "\nREQUESTS NO-MATCH CHECK PASSED")
process.exit(failed ? 1 : 0)
