#!/usr/bin/env node
// Runtime check for the student submission P0 gaps (SL-11, ST-05/08/09, ST-10, ST-12, EV-04).
// node tests/lab/e2e-student-submission-p0.mjs [outDir]   (dev server on BASE, default http://localhost:3017)
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
const out = process.argv[2] ?? "/tmp/t3-shots"
mkdirSync(out, { recursive: true })
const results = []
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `  (${detail})` : ""}`) }

const browser = await chromium().launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
let cleared = false
await ctx.addInitScript(() => { if (!sessionStorage.getItem("t3")) { try { localStorage.clear() } catch { /* */ } sessionStorage.setItem("t3", "1") } })
const page = await ctx.newPage()
const go = async (p) => {
  try { await page.goto(base + p, { waitUntil: "load", timeout: 240000 }) } catch (e) { if (!String(e).includes("ERR_ABORTED")) throw e }
  await page.waitForTimeout(1500)
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" }).catch(() => {})
  await page.waitForTimeout(1500)
}

// 1. SL-11: deactivated skills absent from every Log and Send picker; an active one is found by the same search.
const pickers = [
  ["log-skill", "A"], ["log-skill", "B"], ["request-signoff", "A"], ["request-signoff", "B"], ["request-signoff", "C"],
]
for (const [screen, v] of pickers) {
  await go(`/lab/student/${screen}?variant=${v}`)
  // Send C starts on the course step; continue to the skills step.
  if (screen === "request-signoff" && v === "C") {
    await page.locator("label[for^='course-']").filter({ hasText: "NURS 350" }).first().click()
    await page.waitForTimeout(500)
    await page.getByRole("button", { name: /^Continue$/ }).last().click()
    await page.waitForTimeout(1500)
  }
  if (screen === "request-signoff" && v === "B") {
    await page.getByText("They are not here").first().click()
    await page.waitForTimeout(800)
  }
  if (screen === "request-signoff" && v === "C") {
    // Course first: the skills step lists the course's skills; a deactivated one must not be among them.
    const text = await page.locator("main").innerText().catch(() => "")
    await page.screenshot({ path: join(out, "send-C-skills-1440.png") })
    check("SL-11 request-signoff C: course skills step lists no deactivated skill", /Recommended and optional/.test(text) && !/\bStool\b|Sterile Urine/.test(text), text.slice(0, 80).replace(/\s+/g, " "))
    continue
  }
  const add = page.locator("#add-skill, #req-skills-add, #log-skills-add").or(page.getByRole("button", { name: /^Add (a|an) /i }))
  if (await add.count()) { await add.first().click(); await page.waitForTimeout(600) }
  const search = page.locator("[cmdk-input]").first()
  if (!(await search.count())) { check(`SL-11 ${screen} ${v}: picker search found`, false, "no cmdk input"); continue }
  const hits = async (q) => { await search.click(); await search.fill(q); await page.waitForTimeout(500); return page.locator("[cmdk-item], [role=option]").filter({ hasText: q }).count() }
  const stool = await hits("Stool")
  const urine = await hits("Sterile Urine")
  const oral = await hits("Oral Care")
  check(`SL-11 ${screen} ${v}: Stool and Urine: Sterile Urine not offered, Oral Care offered`, stool === 0 && urine === 0 && oral > 0, `stool=${stool} urine=${cleared ? "" : urine} oral=${oral}`)
  await page.keyboard.press("Escape")
}

// 2. Send A: Lab or simulation lists lab instructors; Send is blocked until the mandatory date is filled; note reaches the form.
await go("/lab/student/request-signoff?variant=A")
await page.locator("#req-where").click()
await page.getByRole("option", { name: /^Lab$/ }).click()
await page.waitForTimeout(600)
const whitmore = page.getByRole("radio", { name: /Whitmore/ })
const preceptorRadios = await page.locator("[role=radio]").evaluateAll((els) => els.map((e) => e.closest("label,li,div")?.textContent ?? "").filter((t) => /preceptor/i.test(t)).length)
check("ST-08/ST-09 Send A, Lab: recorded lab instructor R. Whitmore listed, no preceptor", (await whitmore.count()) > 0 && preceptorRadios === 0, `whitmore=${await whitmore.count()} preceptorRows=${preceptorRadios}`)
await page.screenshot({ path: join(out, "send-A-lab-1440.png") })
if (await whitmore.count()) await whitmore.first().check({ force: true })
const note = "Practised on the simulation manikin; the second attempt was smoother. " + "I checked the line twice before flushing it. ".repeat(8)
await page.locator("#req-note").fill(note.trim())
const send = page.getByRole("button", { name: /^Send$/ })
await send.click()
await page.waitForTimeout(600)
const dateErr = await page.getByText("Enter the date performed.").count()
const disabled = await send.isDisabled()
check("ST-10 Send A: Send with no date shows the error on the field and Send is disabled", dateErr > 0 && disabled, `errors=${dateErr} disabled=${disabled}`)
await page.screenshot({ path: join(out, "send-A-blocked-1440.png"), fullPage: true })
// Fill the date through the DS date picker.
await page.locator("#req-detail-date").click()
await page.waitForTimeout(400)
const day = page.locator("[role=gridcell] button, button[name=day], td button").filter({ hasText: /^20$/ }).first()
if (await day.count()) await day.click()
else await page.getByRole("button", { name: /October 20/ }).first().click()
await page.waitForTimeout(500)
const enabled = !(await send.isDisabled())
check("ST-10 Send A: Send is enabled again once the date is filled", enabled)
await send.click()
await page.waitForTimeout(1200)
const conf = await page.locator("[data-confirmation]").innerText().catch(() => "")
check("ST-05/ST-13 Send A: confirmation records the lab setting, R. Whitmore and the role", /Setting\s+Lab/.test(conf) && /R\. Whitmore, Lab instructor/.test(conf), conf.replace(/\s+/g, " ").slice(0, 160))
await page.screenshot({ path: join(out, "send-A-sent-1440.png"), fullPage: true })
const reqId = await page.evaluate(() => {
  for (let i = 0; i < localStorage.length; i++) {
    const v = localStorage.getItem(localStorage.key(i)) ?? ""
    const m = v.match(/"id":"(req-lab-[a-z0-9]+)"/g)
    if (m) return m[m.length - 1].slice(6, -1)
  }
  return null
})
check("ST-12 Send A: the request is in the shared store", !!reqId, String(reqId))
if (reqId) {
  await go(`/lab/evaluator/evaluation-form?variant=A&request=${reqId}`)
  const quote = await page.locator("[data-request-note] blockquote").innerText().catch(() => "")
  check("ST-12/EV-04 evaluator form A: the student's note shows in full, labelled as the student's", quote.replace(/[“”]/g, "").trim() === note.trim() && (await page.getByText(/^From /).count()) > 0, `${quote.length} chars vs ${note.trim().length + 2}`)
  const sub = await page.locator("[data-viz-label]").filter({ hasText: /NURS? \d/ }).first().innerText().catch(() => "")
  check("ST-05 evaluator form A: context reads Lab, performed Oct 20, no clinical setting", /Lab/.test(sub) && /Oct 20/.test(sub) && !/Inpatient|Outpatient|Clinical/.test(sub), sub)
  await page.screenshot({ path: join(out, "evaluator-form-A-note-1440.png"), fullPage: true })
  for (const v of ["B", "C"]) {
    await go(`/lab/evaluator/evaluation-form?variant=${v}&request=${reqId}`)
    const q = await page.locator("[data-request-note] blockquote").innerText().catch(() => "")
    check(`EV-04 evaluator form ${v}: note in full`, q.replace(/[“”]/g, "").trim() === note.trim(), `${q.length} chars`)
  }
}
await browser.close()
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed} of ${results.length} checks passed`)
process.exit(failed ? 1 : 0)
