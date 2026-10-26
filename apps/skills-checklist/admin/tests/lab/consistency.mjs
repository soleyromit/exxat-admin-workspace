#!/usr/bin/env node
// Visible-number consistency gate for the lab (Romit: "I don't want any inconsistencies in data or visual").
// Usage: node tests/lab/consistency.mjs [baseUrl] [--json]   (default http://localhost:3017, dev server must be running)
// Loads lab screens with an explicit term (term=fall-2026), reads the numbers each screen shows, and compares the ones that name
// the same fact: hero "N of 123", the Approvals nav badge vs the queue count and the dashboard figure, Maya's required achieved
// on her home vs her dashboard drill row, waiting counts, achieved records, the director's population. Exit 1 on any mismatch.
// The dashboard scope is remembered in localStorage and shared across tabs, so storage is cleared first and every URL carries
// the scope explicitly. Not a vitest file on purpose (.mjs): it needs a browser and a running server.
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
async function loadChromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* try next */ }
  }
  throw new Error("Playwright not found. Install it or run from the monorepo that has tools/visual-check.")
}

const base = process.argv.slice(2).find((a) => a.startsWith("http")) ?? "http://localhost:3017"
const asJson = process.argv.includes("--json")
const TERM = "term=fall-2026"
const SETTLE_MS = 4000

const num = (s) => (s == null ? null : Number(String(s).replace(/,/g, "")))

const chromium = await loadChromium()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

async function open(path, tries = 3) {
  try {
    return await read(path)
  } catch (e) {
    // A dev-server reload (another worker saved a file) destroys the page mid-read: load it again.
    // ERR_ABORTED: the dev server recompiled mid-load (a chunk failed to load); a fresh load gets the new chunk.
    if (tries > 1 && /context was destroyed|navigation|ERR_CONNECTION|ERR_ABORTED|Timeout/i.test(String(e))) return open(path, tries - 1)
    throw e
  }
}
async function read(path) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: 180_000 })
  await page.waitForTimeout(SETTLE_MS)
  return page.evaluate(() => {
    const main = document.querySelector("[data-page-scroll]") ?? document.querySelector("main") ?? document.body
    const nav = [...document.querySelectorAll("[data-sidebar=sidebar] a, [data-slot=sidebar] a")].map((a) => a.innerText.replace(/\s+/g, " ").trim())
    return { text: main.innerText, nav, url: location.href }
  })
}
const badgeOf = (nav) => {
  const row = nav.find((t) => /^Approvals\b/.test(t))
  if (!row) return null
  const m = row.match(/(\d[\d,]*)\s*$/)
  return m ? num(m[1]) : 0
}
const grab = (text, re) => {
  const m = text.match(re)
  return m ? m.slice(1).map(num) : null
}
async function rowText(name) {
  return page.evaluate((who) => {
    const rows = [...document.querySelectorAll("tr, [role=row]")]
    return rows.find((r) => r.innerText.includes(who))?.innerText ?? null
  }, name)
}

// Clear the remembered scope (localStorage) and the reviewer's session decisions before anything renders.
await page.goto(`${base}/lab`, { waitUntil: "domcontentloaded", timeout: 180_000 })
await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch { /* storage blocked */ } })

const seen = {}
const checks = []
const check = (name, values) => {
  const vals = Object.values(values)
  const missing = vals.some((v) => v == null || Number.isNaN(v))
  const ok = !missing && vals.every((v) => v === vals[0])
  checks.push({ name, ok, values, missing })
}

for (const scope of [{ id: "all", q: TERM }, { id: "BSN 2027", q: `${TERM}&cohort=BSN+2027` }]) {
  const tag = scope.id === "all" ? "" : ` [cohort ${scope.id}]`
  const a = await open(`/lab/admin/dashboard?${scope.q}&variant=A`)
  const heroA = grab(a.text, /(\d[\d,]*) of (\d[\d,]*) students? (?:is|are)? ?behind/)
  const kpiApproval = grab(a.text, /Awaiting approval\s+(\d[\d,]*)/)
  const kpiWaiting = grab(a.text, /Waiting with evaluators\s+(\d[\d,]*)/)
  const kpiAchieved = grab(a.text, /Required skills achieved\s+(\d+)%\s+(\d[\d,]*) of (\d[\d,]*)/)
  const badgeA = badgeOf(a.nav)
  const b = await open(`/lab/admin/dashboard?${scope.q}&variant=B`)
  const heroB = grab(b.text, /(\d[\d,]*) of (\d[\d,]*) students? (?:is|are)? ?behind/)
  const drillBehind = await open(`/lab/admin/dashboard-drill?${scope.q}&list=students&cond=behind`)
  const drillBehindN = grab(drillBehind.text, /(\d[\d,]*) students? behind/)
  const drillAll = await open(`/lab/admin/dashboard-drill?${scope.q}&list=students`)
  const inScope = grab(drillAll.text, /(\d[\d,]*) students? in scope/)
  const mayaRow = scope.id === "all" || scope.id === "BSN 2027" ? await rowText("Maya Ferreira") : null
  const drillWaiting = await open(`/lab/admin/dashboard-drill?${scope.q}&list=requests&cond=waiting`)
  const drillWaitingN = grab(drillWaiting.text, /(\d[\d,]*) requests? waiting with evaluators/)
  const drillApproval = await open(`/lab/admin/dashboard-drill?${scope.q}&list=requests&cond=approval`)
  const drillApprovalN = grab(drillApproval.text, /(\d[\d,]*) submissions? awaiting approval/)
  const drillSkills = await open(`/lab/admin/dashboard-drill?${scope.q}&list=skills`)
  const drillSkillsN = grab(drillSkills.text, /in scope: (\d[\d,]*) of (\d[\d,]*) achieved/)
  const q = await open(`/lab/reviewer/approvals?${scope.q}`)
  const queueN = grab(q.text, /(\d[\d,]*) submissions? wait/)
  const badgeQ = badgeOf(q.nav)
  seen[scope.id] = { heroA, heroB, drillBehindN, inScope, kpiApproval, drillApprovalN, queueN, badgeA, badgeQ, kpiWaiting, drillWaitingN, kpiAchieved, drillSkillsN, mayaRow }

  check(`Behind: hero A = hero B = drill list${tag}`, { heroA: heroA?.[0], heroB: heroB?.[0], drill: drillBehindN?.[0] })
  check(`Students in scope: hero "of N" = drill list${tag}`, { heroA: heroA?.[1], heroB: heroB?.[1], drill: inScope?.[0] })
  check(`Awaiting approval: badge (dashboard) = badge (queue) = queue = dashboard figure = drill${tag}`, { badgeDashboard: badgeA, badgeQueue: badgeQ, queue: queueN?.[0], kpi: kpiApproval?.[0], drill: drillApprovalN?.[0] })
  check(`Waiting with evaluators: figure = drill${tag}`, { kpi: kpiWaiting?.[0], drill: drillWaitingN?.[0] })
  check(`Required achieved records: figure = drill${tag}`, { kpiAchieved: kpiAchieved?.[1], drillAchieved: drillSkillsN?.[0] })
  check(`Required records: figure = drill${tag}`, { kpiRecords: kpiAchieved?.[2], drillRecords: drillSkillsN?.[1] })
  if (scope.id === "all") check("Students total: hero says of 123 (every student is in the current term)", { hero: heroA?.[1], expected: 123 })

  if (mayaRow) {
    const home = await open(`/lab/student/home`)
    const ach = grab(home.text, /(\d+)\s*of (\d+)\s*Required skills achieved/)
    const wait = grab(home.text, /\n(\d+)\s*\nWaiting\b/)
    const ret = grab(home.text, /\n(\d+)\s*\nReturned\b/)
    const inRow = ach ? (mayaRow.includes(`${ach[0]} of ${ach[1]}`) ? ach[0] : -1) : null
    check(`Maya: required achieved on her home = her dashboard drill row${tag}`, { home: ach?.[0], drillRow: inRow })
    if (scope.id === "all") {
      const reqs = await open(`/lab/student/my-requests`)
      const openN = grab(reqs.text, /Waiting and returned\s+(\d+)/)
      check("Maya: waiting + returned on her home = open rows on My requests", { home: wait && ret ? wait[0] + ret[0] : null, myRequests: openN?.[0] })
      seen.maya = { ach, wait, ret, openN }
    }
  }
}

// Director: the graduating cohort's population equals the admin drill for that cohort.
const dir = await open(`/lab/director/dashboard?${TERM}`)
const dirPop = grab(dir.text, /(\d[\d,]*) of (\d[\d,]*) complete/)
const drill26 = await open(`/lab/admin/dashboard-drill?${TERM}&cohort=BSN+2026&list=students`)
const in26 = grab(drill26.text, /(\d[\d,]*) students? in scope/)
check("Director: graduating cohort size = admin drill for BSN 2026", { director: dirPop?.[1], drill: in26?.[0] })
seen.director = { dirPop, in26 }

// Required to graduate (D-X11, D-X12): the director's readiness bands (complete / one short / short / far) equal the attainment
// matrix totals read against "Required to graduate", on the director's own Attainment (default basis for the graduating cohort)
// and on the admin Attainment with required=graduate for the same cohort.
async function bandsOn(path) {
  await open(path)
  return page.evaluate(() => {
    const band = (k) => { const el = document.querySelector(`[data-band="${k}"][data-band-count]`); return el ? Number(el.getAttribute("data-band-count")) : null }
    const mx = document.querySelector("[data-matrix]")
    return {
      readiness: ["complete", "one-short", "short", "far"].map(band),
      matrix: mx?.getAttribute("data-missing-bands")?.split("/").map(Number) ?? null,
      basis: mx?.getAttribute("data-required-basis") ?? null,
    }
  })
}
const dirAtt = await bandsOn(`/lab/director/attainment?${TERM}&variant=A`)
const admAtt = await bandsOn(`/lab/admin/attainment?${TERM}&cohort=BSN+2026&required=graduate&variant=A`)
const labels = ["complete", "one short", "short", "far behind"]
labels.forEach((l, i) => check(`Required to graduate: director readiness ${l} = director matrix = admin matrix (required=graduate)`, { readiness: dirAtt.readiness?.[i], directorMatrix: dirAtt.matrix?.[i], adminMatrix: admAtt.matrix?.[i] }))
check("Required to graduate: the graduating cohort reads 31 / 4 / 0 / 3 (dataset-spec 12.10)", { got: (dirAtt.readiness ?? []).join("/"), expected: "31/4/0/3" })
check("Required to graduate: director Attainment defaults to the graduate basis", { basis: dirAtt.basis === "toGraduate" ? 1 : 0, expected: 1 })
seen.requiredToGraduate = { dirAtt, admAtt }

// Oct 26 call (U3). Group is its own filter: with no cohort, a group's hero "of N" equals its drill list (program group and a
// custom rule group spanning cohorts). Clinical courses first: the scope bar shows "Clinical only" by default and including didactic
// leaves the Required this term population as it was. Three levels: one offering's mandatory + recommended + optional = mapped, and
// its mandatory equals the offerings table cell.
for (const [label, group] of [["Group A", "Group+A"], ["custom group Enrolled in 2025", "cg%3Aenr%3D2025"]]) {
  const ga = await open(`/lab/admin/dashboard?${TERM}&group=${group}&variant=A`)
  const gHero = grab(ga.text, /(\d[\d,]*) of (\d[\d,]*) students? (?:is|are)? ?behind/)
  const gDrill = await open(`/lab/admin/dashboard-drill?${TERM}&group=${group}&list=students`)
  const gIn = grab(gDrill.text, /(\d[\d,]*) students? in scope/)
  const gBehind = await open(`/lab/admin/dashboard-drill?${TERM}&group=${group}&list=students&cond=behind`)
  const gBehindN = grab(gBehind.text, /(\d[\d,]*) students? behind/)
  check(`Group with no cohort (${label}): hero "of N" = drill list`, { hero: gHero?.[1], drill: gIn?.[0] })
  check(`Group with no cohort (${label}): behind hero = drill list`, { hero: gHero?.[0], drill: gBehindN?.[0] })
  seen[`group ${label}`] = { gHero, gIn, gBehindN }
}
{
  const def = await open(`/lab/admin/dashboard?${TERM}&variant=A`)
  const kind = await page.evaluate(() => document.querySelector("#scope-course")?.getAttribute("data-course-kind") ?? null)
  const defHero = grab(def.text, /(\d[\d,]*) of (\d[\d,]*) students? (?:is|are)? ?behind/)
  const defAch = grab(def.text, /Required skills achieved\s+(\d+)%\s+(\d[\d,]*) of (\d[\d,]*)/)
  const did = await open(`/lab/admin/dashboard?${TERM}&incl=didactic&variant=A`)
  const didKind = await page.evaluate(() => document.querySelector("#scope-course")?.getAttribute("data-course-kind") ?? null)
  const didHero = grab(did.text, /(\d[\d,]*) of (\d[\d,]*) students? (?:is|are)? ?behind/)
  const didAch = grab(did.text, /Required skills achieved\s+(\d+)%\s+(\d[\d,]*) of (\d[\d,]*)/)
  check("Clinical only: the scope bar Course reads Clinical only by default and switches when didactic is included", { clinicalDefault: kind === "clinical" ? 1 : 0, allWithDidactic: didKind === "all" ? 1 : 0, expected: 1 })
  check("Clinical only: behind and students in scope are the same with didactic included", { behind: defHero?.[0], behindWithDidactic: didHero?.[0] })
  check("Clinical only: Required this term records are the same with didactic included", { records: defAch?.[2], recordsWithDidactic: didAch?.[2] })
  await open(`/lab/admin/course-mapping?${TERM}&variant=A`)
  const cmKind = await page.evaluate(() => document.querySelector("[data-course-kind]")?.getAttribute("data-course-kind") ?? null)
  check("Clinical only: Course mapping A lists clinical offerings by default", { clinicalDefault: cmKind === "clinical" ? 1 : 0, expected: 1 })
  const lv = await page.evaluate(() => {
    const label = document.querySelector("[data-level-totals]")?.getAttribute("aria-label") ?? ""
    const m = label.match(/(\d+) mapped: (\d+) mandatory, (\d+) recommended, (\d+) optional/)
    const code = document.querySelector("#offering-heading")?.textContent?.split(" ").slice(0, 2).join(" ") ?? ""
    const row = [...document.querySelectorAll("[data-region=offerings] tr, [data-region=offerings] [role=row]")].find((r) => r.textContent?.includes(code) && r.querySelector("[aria-current=true]"))
    const cells = row ? [...row.querySelectorAll("td, [role=cell], [role=gridcell]")].map((c) => c.textContent?.trim() ?? "") : []
    return { m: m ? m.slice(1).map(Number) : null, cells: cells.slice(-2) }
  })
  check("Three levels: mandatory + recommended + optional = mapped on the open offering", { mapped: lv.m?.[0], sum: lv.m ? lv.m[1] + lv.m[2] + lv.m[3] : null })
  check("Three levels: the open offering's mandatory = its Mandatory cell in the offerings table", { heading: lv.m?.[1], table: num(lv.cells[1]) })
  seen.clinical = { kind, didKind, defHero, didHero, defAch, didAch, cmKind, lv }
}

// Write path: approve one submission on Review item (the reviewer's decision is written to the shared store and saved as a delta),
// then load each screen fresh (a full page load re-reads storage) and re-read the badge, the queue, the dashboard figure, the
// drill and the student's own waiting count. Every one must move by exactly one.
const WRITE_ITEM = "sub-07"
const WRITE_STUDENT = "stu-05"
const homeBefore = await open(`/lab/student/home?student=${WRITE_STUDENT}`)
const waitBefore = grab(homeBefore.text, /\n(\d+)\s*\nWaiting\b/)
await open(`/lab/reviewer/review-item?${TERM}&item=${WRITE_ITEM}`)
const approveBtn = page.getByRole("button", { name: "Approve", exact: true }).first()
const clicked = (await approveBtn.count()) > 0
if (clicked) {
  await approveBtn.click()
  await page.waitForTimeout(1500)
}
const qAfter = await open(`/lab/reviewer/approvals?${TERM}`)
const queueAfter = grab(qAfter.text, /(\d[\d,]*) submissions? wait/)
const aAfter = await open(`/lab/admin/dashboard?${TERM}&variant=A`)
const kpiAfter = grab(aAfter.text, /Awaiting approval\s+(\d[\d,]*)/)
const dAfter = await open(`/lab/admin/dashboard-drill?${TERM}&list=requests&cond=approval`)
const drillAfter = grab(dAfter.text, /(\d[\d,]*) submissions? awaiting approval/)
const homeAfter = await open(`/lab/student/home?student=${WRITE_STUDENT}`)
const waitAfter = grab(homeAfter.text, /\n(\d+)\s*\nWaiting\b/)
const before = seen.all.queueN?.[0]
check(`Write: approve ${WRITE_ITEM}, then badge = queue = dashboard figure = drill = before minus 1 (after reload)`, {
  expected: clicked && before != null ? before - 1 : null,
  badgeQueue: badgeOf(qAfter.nav),
  badgeDashboard: badgeOf(aAfter.nav),
  queue: queueAfter?.[0],
  kpi: kpiAfter?.[0],
  drill: drillAfter?.[0],
})
check(`Write: ${WRITE_STUDENT}'s waiting count on her home drops by 1`, { expected: waitBefore ? waitBefore[0] - 1 : null, home: waitAfter?.[0] })
seen.write = { clicked, before, queueAfter, kpiAfter, drillAfter, waitBefore, waitAfter }

// Write path 2 (Oct 26 call, item 13): "Assign to someone else" on one row whose evaluator is not assigned. The evidence leaves
// Approvals and waits with the chosen evaluator, so after a reload the Approvals badge and queue drop by one and the dashboard
// "Waiting with evaluators" figure (and its drill) rise by the same one.
const asgQBefore = await open(`/lab/reviewer/approvals?${TERM}&variant=A`)
const asgQueueBefore = grab(asgQBefore.text, /(\d[\d,]*) submissions? wait/)?.[0] ?? null
const asgBadgeBefore = badgeOf(asgQBefore.nav)
// Since the UX critique (2026-10-26) the not-recorded rows carry one "Adopt, merge or assign" menu instead of two buttons.
const assignMenu = page.getByRole("button", { name: /^Adopt, merge or assign: / }).first()
let assigned = false
if ((await assignMenu.count()) > 0) {
  await assignMenu.click()
  await page.getByRole("menuitem", { name: "Assign to someone else", exact: true }).click()
  await page.getByRole("combobox", { name: "Evaluator", exact: true }).click()
  await page.getByRole("option").first().click()
  await page.getByRole("button", { name: "Send request", exact: true }).click()
  await page.waitForTimeout(1500)
  assigned = true
}
// The baseline for the dashboard is read after the first write path, so it is the same store the assign changed.
const asgAAfter = await open(`/lab/admin/dashboard?${TERM}&variant=A`)
const asgQAfter = await open(`/lab/reviewer/approvals?${TERM}&variant=A`)
const asgDrillW = await open(`/lab/admin/dashboard-drill?${TERM}&list=requests&cond=waiting`)
const waitingBase = seen.all.kpiWaiting?.[0] ?? null
check("Write: assign one row to someone else, then the Approvals badge and queue drop by 1 (after reload)", {
  expected: assigned && asgQueueBefore != null ? asgQueueBefore - 1 : null,
  badgeQueue: badgeOf(asgQAfter.nav),
  badgeDashboard: badgeOf(asgAAfter.nav),
  badgeBeforeMinus1: asgBadgeBefore != null ? asgBadgeBefore - 1 : null,
  queue: grab(asgQAfter.text, /(\d[\d,]*) submissions? wait/)?.[0],
  kpi: grab(asgAAfter.text, /Awaiting approval\s+(\d[\d,]*)/)?.[0],
})
check("Write: the same assign raises dashboard Waiting with evaluators by 1 (figure = drill)", {
  expected: assigned && waitingBase != null ? waitingBase + 1 : null,
  kpi: grab(asgAAfter.text, /Waiting with evaluators\s+(\d[\d,]*)/)?.[0],
  drill: grab(asgDrillW.text, /(\d[\d,]*) requests? waiting with evaluators/)?.[0],
})
seen.assign = { assigned, asgQueueBefore, asgBadgeBefore, waitingBase }

// Cohort inheritance (decision D-X27): a list assigned to a cohort makes its skills available in that cohort's clinical offerings,
// marked "From list". Read the open offering on Course mapping A, assign (or, for BSN 2027, which already has it, unassign) the
// practicum competencies list through the same lists overlay the Lists screen writes, reload, and read the offering again.
{
  const offTotals = async () => {
    await open(`/lab/admin/course-mapping?${TERM}&variant=A`)
    return page.evaluate(() => {
      const label = document.querySelector("[data-level-totals]")?.getAttribute("aria-label") ?? ""
      const m = label.match(/(\d+) mapped: (\d+) mandatory/)
      const meta = document.querySelector("[data-region=offering]")?.textContent ?? ""
      const cohort = (meta.match(/(A?BSN \d{4})/) ?? [])[1] ?? null
      return { mapped: m ? Number(m[1]) : null, mandatory: m ? Number(m[2]) : null, cohort, fromList: document.querySelectorAll("[data-level-source=list]").length }
    })
  }
  const before = await offTotals()
  const adding = before.cohort !== "BSN 2027"
  const groupIds = adding ? ["coh:BSN 2027", `coh:${before.cohort}`] : []
  await page.evaluate((ids) => {
    try { sessionStorage.setItem("lab.admin.lists.v1", JSON.stringify({ created: [], edits: { "list-competencies": { groupIds: ids } } })) } catch { /* storage blocked */ }
  }, groupIds)
  const after = await offTotals()
  check(`Inheritance: ${adding ? "assigning" : "removing"} a list on ${before.cohort} ${adding ? "raises" : "lowers"} the open offering's mapped count`, {
    moved: before.mapped != null && after.mapped != null ? (adding ? after.mapped > before.mapped : after.mapped < before.mapped) ? 1 : 0 : null,
    expected: 1,
  })
  check("Inheritance: a list never adds Mandatory (the open offering's mandatory is unchanged)", { before: before.mandatory, after: after.mandatory })
  check("Inheritance: inherited rows carry the From list tag", { tagged: after.fromList > 0 ? 1 : 0, expected: 1 })
  await page.evaluate(() => { try { sessionStorage.removeItem("lab.admin.lists.v1") } catch { /* storage blocked */ } })
  const restored = await offTotals()
  check("Inheritance: undoing the assignment restores the mapped count", { before: before.mapped, restored: restored.mapped })
  seen.inheritance = { before, after, restored }
}

// Rule write-back (decision D-X27): publish "at least 2 of 3 questions answered Yes" on sterile dressing change (Configure B), then
// after a reload Maya's attempt line applies the published rule, the impact the configure screen showed equals the students whose
// record changed, and the dashboard Required achieved figure moves by the impact's gains (none here: Maya is still short).
{
  const SK = "sk-sterile-dressing"
  const lineOf = async () => {
    await open(`/lab/student/skill-detail?skill=${SK}`)
    return page.evaluate(() => document.querySelector("[data-attempt-line]")?.textContent?.trim() ?? null)
  }
  const lineBefore = await lineOf()
  const dashBefore = await open(`/lab/admin/dashboard?${TERM}&variant=A`)
  const achBefore = grab(dashBefore.text, /Required skills achieved\s+(\d+)%\s+(\d[\d,]*) of (\d[\d,]*)/)
  await open(`/lab/admin/configure-skill?skill=${SK}&variant=B`)
  let published = false
  let changedSaid = null
  const atLeast = page.locator("label[for=cfg-qrule-atleast]").first()
  if ((await atLeast.count()) > 0) {
    await atLeast.click()
    const pub = page.getByRole("button", { name: "Publish", exact: true }).first()
    await pub.click()
    await page.waitForTimeout(800)
    const reapply = page.locator("label[for=cfg-mode-reapply]").first()
    if ((await reapply.count()) > 0 && !(await page.locator("[data-published]").count())) {
      await reapply.click()
      await pub.click()
    }
    await page.waitForSelector("[data-published]", { timeout: 15_000 }).catch(() => null)
    published = (await page.locator("[data-published]").count()) > 0
    changedSaid = await page.evaluate(() => {
      const t = document.querySelector("[data-published]")?.textContent ?? ""
      const m = t.match(/(\d+) students? now sees?/)
      return m ? Number(m[1]) : /see this .* as configured/.test(t) ? 0 : null
    })
  }
  const lineAfter = await lineOf()
  const dashAfter = await open(`/lab/admin/dashboard?${TERM}&variant=A`)
  const achAfter = grab(dashAfter.text, /Required skills achieved\s+(\d+)%\s+(\d[\d,]*) of (\d[\d,]*)/)
  check("Rule write-back: before publish, Maya's sterile dressing line counts on outcome", { ok: lineBefore === "2 attempts, 2 not valid: 0 count" ? 1 : 0, expected: 1 })
  check("Rule write-back: after publish and reload, Maya's line applies the published question rule", {
    ok: published && lineAfter === "2 attempts, 1 not valid: 1 counts. At least 2 of 3 questions answered Yes counts as one." ? 1 : 0,
    expected: 1,
  })
  check("Rule write-back: students the impact said would change = students whose record changed (Maya)", { impact: changedSaid, changed: lineAfter !== lineBefore ? 1 : 0 })
  check("Rule write-back: dashboard Required achieved moves by the impact's gains (0: Maya is still short)", { before: achBefore?.[1], after: achAfter?.[1] })
  seen.ruleWriteBack = { lineBefore, lineAfter, published, changedSaid, achBefore, achAfter }
}
// Leave the shared store as the seed for the next run.
await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch { /* storage blocked */ } })

await browser.close()

const failed = checks.filter((c) => !c.ok)
if (asJson) console.log(JSON.stringify({ base, checks, seen }, null, 2))
else {
  for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}  ${JSON.stringify(c.values)}${c.missing ? "  (a number was not found on the page)" : ""}`)
  console.log(`\n${checks.length - failed.length} of ${checks.length} checks pass.`)
}
process.exit(failed.length ? 1 : 0)
