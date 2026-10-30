#!/usr/bin/env node
// Runtime check for the Wave 3 B admin setup gaps: CM-01/02/04 (course mapping B), SC-19 (rule impact A), SC-06 (paste and
// range in configure B and C), IM-04/05/11 (import), IM-05/06 (add several).
// node tests/lab/e2e-w3b-setup-gaps.mjs [outDir]   (dev server on BASE, default http://localhost:3017)
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
const out = process.argv[2] ?? "../docs/knowledge/design/lab-shots/wave3"
mkdirSync(out, { recursive: true })
const results = []
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `  (${detail})` : ""}`) }

const browser = await chromium().launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => { if (!sessionStorage.getItem("w3b")) { try { localStorage.clear() } catch { /* */ } sessionStorage.setItem("w3b", "1") } })
const page = await ctx.newPage()
const go = async (p) => {
  try { await page.goto(base + p, { waitUntil: "load", timeout: 240000 }) } catch (e) { if (!String(e).includes("ERR_ABORTED")) throw e }
  await page.waitForTimeout(1500)
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" }).catch(() => {})
  await page.waitForTimeout(1200)
}
const shot = (name, full = false) => page.screenshot({ path: join(out, `${name}-1440.png`), fullPage: full })
const step = async (name, fn) => { try { await fn() } catch (e) { check(name, false, String(e).split("\n")[0]) } }

// 1. Course mapping B: academic year on each offering row, offering search and filters, mapped and mandatory per offering.
await step("CM-01/02/04 course mapping B", async () => {
  await go("/lab/admin/course-mapping?variant=B")
  const meta = await page.locator("[data-region='skill'] tbody tr").first().innerText()
  check("CM-01 B: offering row shows the academic year", /\d{4}[-–]\d{2,4}/.test(meta) || /\d{4}/.test(meta), meta.replace(/\s+/g, " ").slice(0, 90))
  check("CM-02 B: offering search, cohort and professional year in the pane", (await page.locator("[data-offering-filters]").count()) === 1 && (await page.getByRole("searchbox", { name: /Search offerings/ }).count()) + (await page.getByLabel(/Search offerings/).count()) > 0)
  const heads = await page.locator("[data-region='skill'] thead").innerText()
  check("CM-04 B: Mapped and Mandatory columns per offering", /Mapped/.test(heads) && /Mandatory/.test(heads), heads.replace(/\s+/g, " "))
  await shot("W3B-CM-course-mapping-B")
})

// 2. Rule impact A: student and evaluator views, together.
await step("SC-19 rule impact A", async () => {
  await go("/lab/admin/rule-change-impact?variant=A")
  await page.getByRole("button", { name: "What the student and evaluator see" }).click()
  await page.waitForTimeout(500)
  const s = await page.locator("[data-both-views] [data-preview='student']").isVisible()
  const e = await page.locator("[data-both-views] [data-preview='evaluator']").isVisible()
  check("SC-19 A: both previews open together", s && e)
  await shot("W3B-SC19-rule-impact-A", true)
})

// 3. SC-06: paste 60 questions, then tick a range, in configure B and C.
const sixty = Array.from({ length: 60 }, (_, i) => `${i + 1}. Checks step ${i + 1} of the procedure`).join("\n")
for (const v of ["B", "C"]) {
  await step(`SC-06 configure ${v}`, async () => {
    await go(`/lab/admin/configure-skill?variant=${v}&skill=hgtc-basic-skills-01`)
    const model = page.getByText("Questions, then a final result").first()
    await model.click()
    await page.waitForTimeout(700)
    // Switching from levels asks before it drops them.
    const confirm = page.getByRole("alertdialog")
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.getByRole("button").last().click()
      await page.waitForTimeout(500)
    }
    await page.getByRole("button", { name: "Paste a list" }).first().click()
    await page.locator("#cfg-paste-questions").fill(sixty)
    await page.getByRole("button", { name: "Add 60 questions" }).click()
    await page.waitForTimeout(600)
    const rows = await page.locator("[id^='cfg-question-']").count()
    check(`SC-06 ${v}: 60 pasted questions become 60 rows`, rows >= 60, `${rows} rows`)
    const subset = page.locator("#cfg-qrule-subsetopt")
    if (await subset.count()) {
      await subset.click()
    } else {
      // C: the sentence builder names the subset choice.
      const trig = page.getByRole("combobox", { name: /which|what counts|questions/i }).first()
      await trig.click()
      await page.getByRole("option", { name: /named|these questions/i }).first().click()
    }
    await page.waitForTimeout(500)
    await page.locator("#cfg-qsub-from").fill("12")
    await page.locator("#cfg-qsub-to").fill("40")
    await page.getByRole("button", { name: "Tick range" }).click()
    await page.waitForTimeout(300)
    const count = await page.locator("[data-subset-tools]").innerText()
    check(`SC-06 ${v}: range 12 to 40 ticks 29`, /29 of 60 ticked/.test(count), count.replace(/\s+/g, " "))
    await page.getByRole("button", { name: "Select all" }).click()
    check(`SC-06 ${v}: select all ticks 60`, /60 of 60 ticked/.test(await page.locator("[data-subset-tools]").innerText()))
    await page.locator("[data-subset-tools]").scrollIntoViewIfNeeded()
    await shot(`W3B-SC06-configure-${v}`)
  })
}

// 4. Import: name field in C; split, merge, add in review (A); description read from a pasted line (C).
await step("IM-11 import C", async () => {
  await go("/lab/admin/import-ai-review?variant=C&state=review")
  check("IM-11 C: import name field", (await page.getByLabel("Import name").count()) === 1)
})
await step("IM-05 import review edits", async () => {
  await go("/lab/admin/import-ai-review?variant=C")
  await page.locator("#import-paste").fill("Hygiene:\n  Hand washing – Washes for 20 seconds\n      Criteria: Removes jewelry\n  Oral care and denture care\n  Bed bath\n")
  await page.waitForTimeout(1200)
  const trigger = page.locator("[data-category-list] button[aria-expanded]").first()
  if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click()
  await page.waitForTimeout(400)
  const list = page.locator("[data-category-list]")
  check("IM-04: description read from the line", await list.getByText("Washes for 20 seconds").first().isVisible().catch(() => false))
  check("IM-04: criterion read under the skill", (await list.locator("[data-file-criteria]").count()) === 1)
  // Split line 4 (Oral care and denture care; line 3 is the criterion).
  await page.getByRole("button", { name: /More for line 4/ }).click()
  await page.getByRole("menuitem", { name: "Split into several" }).click()
  await page.locator("#import-edit-split").fill("Oral care\nDenture care")
  await page.getByRole("button", { name: "Split into 2" }).click()
  await page.waitForTimeout(400)
  check("IM-05: split makes two entries", (await list.getByRole("button", { name: /Name for line 4/ }).count()) + (await list.getByLabel(/Name for line 4/).count()) >= 2)
  // Merge line 5 (Bed bath) into Hand washing.
  await page.getByRole("button", { name: /More for line 5/ }).click()
  await page.getByRole("menuitem", { name: "Merge into another" }).click()
  await page.locator("#import-edit-merge").click()
  await page.getByRole("option", { name: /Hand washing/ }).first().click()
  await page.getByRole("button", { name: "Merge", exact: true }).click()
  await page.waitForTimeout(400)
  check("IM-05: merged line reads Merged into Hand washing", await list.getByText("Merged into Hand washing").first().isVisible())
  // Add an entry the file does not have.
  await list.getByRole("button", { name: /^Add a .* here$/ }).first().click()
  await page.locator("#import-edit-add").fill("Foot care")
  await page.getByRole("button", { name: /^Add (skill|.*)$/ }).last().click()
  await page.waitForTimeout(400)
  check("IM-05: added entry listed as New", await list.getByText("New", { exact: true }).first().isVisible())
  await list.scrollIntoViewIfNeeded()
  await shot("W3B-IM05-import-C-edits", true)
})

// 5. Add several: keep both / replace on a duplicate, per-line edit.
await step("IM-05/06 add several", async () => {
  await go("/lab/admin/add-skill?variant=C")
  const box = page.locator("#several-names")
  if (!(await box.count())) {
    await page.getByRole("button", { name: /Add several/ }).first().click()
    await page.waitForTimeout(600)
  }
  await page.locator("#several-names").fill("CPR (Independent Study)\nFoot care\nNail care")
  await page.waitForTimeout(400)
  const dup = page.getByRole("combobox", { name: /is already in the library/ }).first()
  check("IM-06: duplicate offers a choice", await dup.isVisible())
  await dup.click()
  const opts = await page.getByRole("option").allInnerTexts()
  check("IM-06: skip and keep both offered", opts.some((o) => /Keep both/.test(o)) && opts.some((o) => /Skip/.test(o)), opts.join(" / "))
  await page.getByRole("option", { name: "Keep both" }).click()
  await page.waitForTimeout(300)
  const summary = await page.locator("section[aria-label='What will be added']").innerText()
  check("IM-06: keep both adds the third name", /^3 /.test(summary.trim()), summary.replace(/\s+/g, " ").slice(0, 80))
  await page.getByRole("button", { name: "Review each line" }).click()
  await page.waitForTimeout(300)
  const dupRow = page.locator("[data-several-duplicate]").first()
  check("IM-06: duplicate row says why (Already in the library)", await dupRow.getByText("Already in the library").isVisible())
  check("IM-06: kept copy can take a description", await page.getByLabel("Description for CPR (Independent Study)").isVisible())
  await page.getByLabel("Description for CPR (Independent Study)").fill("Second copy for the BLS course")
  await shot("W3B-IM06-add-several-C-review")
  await page.getByLabel("Name on line 2").fill("Foot care and inspection")
  await page.getByRole("button", { name: /Leave out line 3/ }).click()
  await page.waitForTimeout(300)
  const text = await page.locator("#several-names").inputValue()
  check("IM-05: per-line rename and leave out edit the list", text.includes("Foot care and inspection") && !text.includes("Nail care"), JSON.stringify(text))
  await shot("W3B-IM06-add-several-C")
})

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length} of ${results.length} pass`)
process.exit(failed.length ? 1 : 0)
