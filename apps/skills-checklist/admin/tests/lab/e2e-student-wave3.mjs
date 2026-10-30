#!/usr/bin/env node
// Runtime check for the Wave 3 student and evaluator gaps (ST-03, SH-06, SH-07 at 375, EV-07, ST-12, ST-13 Log A).
// node tests/lab/e2e-student-wave3.mjs [outDir]   (dev server on BASE, default http://localhost:3017)
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
const out = process.argv[2] ?? "/tmp/wave3-shots"
mkdirSync(out, { recursive: true })
const results = []
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `  (${detail})` : ""}`) }

let browser = await chromium().launch()
async function open(path, w = 1440, h = 900, tries = 2) {
  if (!browser.isConnected()) browser = await chromium().launch()
  try { return await openOnce(path, w, h) } catch (e) { if (tries <= 1) throw e; if (!browser.isConnected()) browser = await chromium().launch(); return open(path, w, h, tries - 1) }
}
async function openOnce(path, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } })
  await ctx.addInitScript(() => { if (!sessionStorage.getItem("w3")) { try { localStorage.clear() } catch { /* */ } sessionStorage.setItem("w3", "1") } })
  const page = await ctx.newPage()
  try { await page.goto(base + path, { waitUntil: "load", timeout: 240000 }) } catch (e) { if (!String(e).includes("ERR_ABORTED")) throw e }
  await page.waitForTimeout(2000)
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" }).catch(() => {})
  await page.waitForTimeout(800)
  return { page, ctx }
}
const shot = (page, name) => page.screenshot({ path: join(out, `${name}.png`) })

// 1. ST-03: the picker isolates skills sent before (Log A, Log B, Send A, Send B).
for (const [screen, v] of [["log-skill", "A"], ["log-skill", "B"], ["request-signoff", "A"], ["request-signoff", "B"]]) {
  const { page, ctx } = await open(`/lab/student/${screen}?variant=${v}`)
  // Send B asks how the evaluator signs first; Log A shows the picker inline.
  if (screen === "request-signoff" && v === "B") await page.getByText("They are not here").click().catch(() => {})
  if (!(screen === "log-skill" && v === "A")) await page.locator(screen === "request-signoff" ? "#req-skills-add" : "#add-skill").first().click({ timeout: 8000 }).catch((e) => console.log("open picker:", String(e).slice(0, 160)))
  await page.waitForTimeout(500)
  const all = await page.locator("[cmdk-item]").count()
  const toggle = page.locator("[data-picker-scope]").getByText(/Sent before/)
  const has = (await toggle.count()) > 0
  if (has) await toggle.first().click()
  await page.waitForTimeout(400)
  const sent = await page.locator("[cmdk-item]").count()
  const label = has ? await toggle.first().innerText() : ""
  const n = Number(/\((\d+)\)/.exec(label)?.[1] ?? -1)
  check(`ST-03 ${screen} ${v}: "Sent before" isolates submitted skills`, has && sent > 0 && sent < all && sent === n, `all ${all}, sent ${sent}, label ${label}`)
  await shot(page, `ST-03-${screen}-${v}-1440`)
  await ctx.close()
}

// 2. SH-06: every attempt names its course; the Attempts card narrows to one course (skill detail A, B; 1440 and 375).
for (const v of ["A", "B"]) for (const [w, h] of [[1440, 900], [375, 812]]) {
  const { page, ctx } = await open(`/lab/student/skill-detail?variant=${v}`, w, h)
  const select = page.locator("[data-attempt-course]")
  const has = (await select.count()) > 0
  const region = page.locator(v === "A" ? "[data-region=attempts]" : "[data-region=ledger]")
  const text = await region.innerText()
  const named = /NURS 350|NUR \d+/.test(text)
  let narrowed = false
  if (has) {
    await select.first().click()
    const opts = page.getByRole("option")
    const count = await opts.count()
    if (count > 1) {
      const label = await opts.nth(1).innerText()
      await opts.nth(1).click()
      await page.waitForTimeout(600)
      narrowed = page.url().includes("course=") && (await select.first().innerText()).includes(label.split(" (")[0])
    }
  }
  check(`SH-06 skill-detail ${v} ${w}: course on every attempt and a course filter`, has && named && narrowed)
  await shot(page, `SH-06-skill-detail-${v}-${w}`)
  await ctx.close()
}

// 3. SH-07 at 375: one tap from a Record row to the completed evaluation (A, B).
for (const v of ["A", "B"]) {
  const { page, ctx } = await open(`/lab/student/record?variant=${v}`, 375, 812)
  const link = page.locator("[data-view-evaluation]").first()
  const visible = await link.isVisible().catch(() => false)
  const box = visible ? await link.boundingBox() : null
  if (visible) await link.click()
  await page.waitForTimeout(1500)
  const opened = page.url().includes("evaluation=") && (await page.getByText(/Read only\. A completed evaluation cannot be changed\./).count()) > 0
  console.log("url", page.url())
  check(`SH-07 record ${v} 375: View evaluation is one tap and opens it in full`, visible && opened && (box?.height ?? 0) >= 44, `height ${box?.height}`)
  await shot(page, `SH-07-record-${v}-375-open`)
  await ctx.close()
}

// 4. EV-07: the lab session receipt says counts now or waits for approval (A, B).
for (const v of ["A", "B"]) {
  const { page, ctx } = await open(`/lab/course-faculty/lab-batch-grid?variant=${v}`)
  const fill = v === "A" ? page.getByRole("button", { name: /Mark every visible student/ }).first() : page.getByRole("button", { name: /Mark the rest/ }).first()
  await fill.click().catch(() => {})
  await page.waitForTimeout(400)
  await page.getByRole("button", { name: "Save session" }).click()
  await page.waitForTimeout(800)
  const banner = await page.getByText(/results recorded/).first().innerText().catch(() => "")
  check(`EV-07 lab-batch-grid ${v}: receipt says count now or wait for approval`, /count now|counts now|wait for program approval|waits for program approval/.test(banner), banner.replace(/\s+/g, " ").slice(0, 140))
  await shot(page, `EV-07-lab-batch-grid-${v}-1440`)
  await ctx.close()
}

// 5. ST-12: a note conflict offers one combined note, never "Keep both" (offline A, B).
for (const v of ["A", "B"]) {
  const { page, ctx } = await open(`/lab/student/offline-sync?variant=${v}&state=conflict`)
  const combine = await page.getByText("Combine into one note").count()
  const both = await page.getByText(/Keep both/).count()
  check(`ST-12 offline-sync ${v}: "Combine into one note", no "Keep both"`, combine > 0 && both === 0, `combine ${combine}, keep both ${both}`)
  await shot(page, `ST-12-offline-sync-${v}-1440`)
  await ctx.close()
}

// 6. ST-13 Log A: Save for later names the skills saved.
{
  const { page, ctx } = await open(`/lab/student/log-skill?variant=A`)
  const first = page.locator("[cmdk-item]").first()
  const name = (await first.innerText()).split("\n")[0].trim()
  await first.click()
  await page.waitForTimeout(300)
  await page.getByRole("button", { name: "Save for later" }).click()
  await page.waitForTimeout(800)
  const banner = await page.getByText(/Find it in My requests, Drafts/).first().innerText().catch(() => "")
  check("ST-13 log-skill A: the saved banner names the skill", banner.includes(name), `${name} | ${banner.replace(/\s+/g, " ").slice(0, 120)}`)
  await shot(page, "ST-13-log-skill-A-1440-saved")
  await ctx.close()
}

await browser.close()
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed} of ${results.length} pass`)
process.exit(failed ? 1 : 0)
