import { describe, expect, it, vi } from "vitest"
import { render, screen, within, waitFor } from "@testing-library/react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import userEvent from "@testing-library/user-event"
import * as S from "@/lib/store"
import { ExportMenu } from "@/components/reporting/export-menu"
import { EMPTY_PARAMS } from "@/components/reporting/report-params"
import { db0, expectNoAxeViolations, parseCsv, renderOverview } from "./harness"

type User = ReturnType<typeof userEvent.setup>

/** Opens the Export popover (prototype P-03) and returns it. */
async function openExport(user: User) {
  await user.click(screen.getByRole("button", { name: "Export" }))
  return screen.findByRole("dialog", { name: "Export (CSV, opens in Excel)" })
}

async function runExport(user: User, item: RegExp, opts: Parameters<typeof renderOverview>[0] = {}) {
  let out: { csv: string; table: S.ExportTable } | null = null
  const view = renderOverview({ ...opts, now: () => "2026-10-08T09:00:00.000Z", onExported: (csv, table) => (out = { csv, table }) })
  const pop = await openExport(user)
  await user.click(within(pop).getByRole("button", { name: item }))
  await within(pop).findByText(/^Export started:/)
  expect(out).not.toBeNull()
  return { ...out!, parsed: parseCsv(out!.csv), dialog: pop, view }
}

describe("S-17 scope and the file (RP-10, RP-11, OD-10, OD-11)", () => {
  it("AT-1: the file covers the FULL filtered scope, not the 25 visible rows, and records the filters in its header", async () => {
    const user = userEvent.setup()
    const a = await runExport(user, /this table/)
    expect(a.parsed.rows).toHaveLength(40)
    expect(a.parsed.rows.length).toBeGreaterThan(25)
    a.view.unmount()
    const b = await runExport(user, /this table/, { initial: { filters: { cohortId: "coh-bsn26" } } })
    expect(b.parsed.rows).toHaveLength(14)
    expect(b.parsed.header).toEqual(expect.arrayContaining(["Cohort: BSN 2026", "Rows: 14", "Scope: all rows matching these filters"]))
  })

  it("AT-3: two different filter sets give two different headers that reproduce the filters", async () => {
    const user = userEvent.setup()
    const a = await runExport(user, /this table/, { initial: { filters: { cohortId: "coh-bsn26" } } })
    a.view.unmount()
    const b = await runExport(user, /this table/, { initial: { filters: { cohortId: "coh-bsn27", settingId: "set-inpatient" } } })
    expect(a.parsed.header).not.toEqual(b.parsed.header)
    expect(b.parsed.header).toEqual(expect.arrayContaining(["Cohort: BSN 2027", "Setting: Inpatient"]))
  })

  it("AT-2 and RP-07: evidence detail has one row per evaluation with feedback, setting, location, self-evaluation and review note", async () => {
    const user = userEvent.setup()
    const db = db0()
    const e = await runExport(user, /Evidence detail/, { db })
    for (const c of ["evaluator_comment", "clinical_setting", "location", "self_evaluation", "review_note", "recorded", "student_supplied", "submission_state", "attempt", "revisions"]) expect(e.parsed.columns).toContain(c)
    // RP-10: one row per EVALUATION, including earlier ones that a resend superseded (marked in the `superseded` column).
    expect(e.parsed.rows).toHaveLength(db.evaluations.length)
    const idx = (c: string) => e.parsed.columns.indexOf(c)
    expect(e.parsed.columns).toEqual(expect.arrayContaining(["superseded", "evaluation_revision"]))
    expect(e.parsed.rows.filter((r) => r[idx("superseded")] === "yes").length).toBeGreaterThan(0)
    expect(e.parsed.rows.some((r) => r[idx("review_note")] !== "")).toBe(true)
    expect(e.parsed.rows.some((r) => r[idx("self_evaluation")] !== "")).toBe(true)
    // RP-07: the recorded cell holds the answers, not a summary
    const withQuestions = e.parsed.rows.find((r) => r[idx("skill")] === "Foley Catheter Insertion")!
    expect(JSON.parse(withQuestions[idx("recorded")]).kind).toBe("question")
    expect(JSON.parse(withQuestions[idx("recorded")]).items.length).toBe(3)
  })

  it("OD-11: the evaluator name and email are NOT in the file; the evaluator role is", async () => {
    const user = userEvent.setup()
    const db = db0()
    const e = await runExport(user, /Evidence detail/, { db })
    expect(e.parsed.columns).not.toContain("evaluator")
    expect(e.parsed.columns).toContain("evaluator_role")
    // Student names can share a surname with an evaluator, so check the evaluators' full recorded names.
    for (const name of new Set(db.submissions.map((s) => s.evaluator.name))) expect(e.csv).not.toContain(name)
    expect(e.csv).not.toContain("@")
  })

  it("AT-12 and ST-05/ST-06: lab rows have no clinical setting and clinical rows carry setting and location", async () => {
    const user = userEvent.setup()
    const e = await runExport(user, /Evidence detail/)
    const idx = (c: string) => e.parsed.columns.indexOf(c)
    const lab = e.parsed.rows.filter((r) => r[idx("performed_in")] === "lab")
    const clin = e.parsed.rows.filter((r) => r[idx("performed_in")] === "clinical")
    expect(lab.length).toBeGreaterThan(0)
    expect(lab.every((r) => r[idx("clinical_setting")] === "")).toBe(true)
    expect(clin.every((r) => r[idx("clinical_setting")] !== "" && r[idx("location")] !== "")).toBe(true)
  })

  it("AT-6 / RP-08: a setting filter exports only evidence recorded there and the file says so", async () => {
    const user = userEvent.setup()
    const e = await runExport(user, /Evidence detail/, { initial: { filters: { settingId: "set-inpatient" } } })
    const idx = (c: string) => e.parsed.columns.indexOf(c)
    expect(e.parsed.rows.length).toBeGreaterThan(0)
    expect(e.parsed.rows.every((r) => r[idx("clinical_setting")] === "Inpatient")).toBe(true)
    expect(e.parsed.header).toContain("Setting: Inpatient")
  })

  it("AT-8 / RP-04: the by-tag export says its rows overlap", async () => {
    const user = userEvent.setup()
    const e = await runExport(user, /this table/, { initial: { tab: "tag" } })
    expect(e.parsed.header.some((h) => /rows overlap/.test(h))).toBe(true)
    expect(e.parsed.header).toContain("Report: Attainment by tag")
  })

  it("AT-16 / RP-02 and AT-17 / RP-03: by student and by skill follow the active tab, and by skill says which skills are mandatory for a course", async () => {
    const user = userEvent.setup()
    const a = await runExport(user, /this table/)
    expect(a.parsed.columns).toEqual(expect.arrayContaining(["achieved", "in_progress", "attainment_percent"]))
    a.view.unmount()
    const b = await runExport(user, /this table/, { initial: { tab: "skill", filters: { offeringId: "off-350-f26" } } })
    const idx = b.parsed.columns.indexOf("requirement_in_course")
    expect(b.parsed.rows.some((r) => r[idx] === "mandatory")).toBe(true)
  })

  it("AT-10 / AE-04 (flag merged): the label note says Not met, and the file still carries the four-state values in separate columns", async () => {
    const user = userEvent.setup()
    const e = await runExport(user, /this table/, { display: "merged" })
    expect(e.parsed.columns).toEqual(expect.arrayContaining(["evidence_does_not_qualify", "no_evidence_yet"]))
    expect(e.parsed.header.some((h) => /merged/.test(h))).toBe(true)
  })

  it("AT-13: text that starts with a formula character is neutralised, and commas, quotes and line breaks survive a round trip", async () => {
    const user = userEvent.setup()
    const db = db0()
    const clone = structuredClone(db)
    const sub = S.evidenceLedger(clone, "stu-01", "sk-foley")[0]
    const ev = clone.evaluations.find((x) => x.submissionId === sub.submissionId)!
    ;(ev as { comment: string }).comment = '=HYPERLINK("http://x")'
    const ev2 = clone.evaluations.find((x) => x.submissionId === S.evidenceLedger(clone, "stu-01", "sk-med")[0].submissionId)!
    ;(ev2 as { comment: string }).comment = 'He said "ok", then left\nnext line'
    const e = await runExport(user, /Evidence detail/, { db: clone })
    const idx = e.parsed.columns.indexOf("evaluator_comment")
    const cells = e.parsed.rows.map((r) => r[idx])
    expect(cells).toContain('\'=HYPERLINK("http://x")')
    expect(cells).toContain('He said "ok", then left\nnext line')
    expect(cells.some((c) => c.startsWith("="))).toBe(false)
  })

  it("AT-18 / SL-11: a deactivated skill stays in the evidence export marked inactive, and leaves the attainment summary", async () => {
    const user = userEvent.setup()
    const off = S.setSkillActive(db0(), "sk-recon", false)
    if (!off.ok) throw new Error("failed")
    const e = await runExport(user, /Evidence detail/, { db: off.db })
    const i = e.parsed.columns.indexOf("skill_inactive")
    const s = e.parsed.columns.indexOf("skill")
    const rows = e.parsed.rows.filter((r) => r[s] === "Medication Reconciliation")
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r[i] === "yes")).toBe(true)
    e.view.unmount()
    const a = await runExport(user, /this table/, { db: off.db, initial: { tab: "skill" } })
    expect(a.parsed.rows.some((r) => r[0] === "Medication Reconciliation")).toBe(false)
  })
})

describe("S-17 popover behaviour (prototype P-03; RP-01, RP-09, RP-11)", () => {
  it("opens a popover (not a sheet) under the button with the prototype's heading, two items with helper lines, and the footnote", async () => {
    const user = userEvent.setup()
    renderOverview()
    const pop = await openExport(user)
    expect(within(pop).getByText("Export (CSV, opens in Excel)")).toBeInTheDocument()
    expect(within(pop).getByRole("button", { name: /By student — this table/ })).toHaveTextContent("Exactly what is on screen, filters applied")
    expect(within(pop).getByRole("button", { name: /Evidence detail/ })).toHaveTextContent("One row per evaluation, with comments and setting")
    expect(within(pop).getByText("The current filters are written into the file header.")).toBeInTheDocument()
    expect(pop.querySelectorAll("[data-variant='default']")).toHaveLength(0) // outline trigger, plain items: no filled primary
  })

  it("the first item follows the active tab: By skill and By tag", async () => {
    const user = userEvent.setup()
    const a = renderOverview({ initial: { tab: "skill" } })
    expect(within(await openExport(user)).getByRole("button", { name: /By skill — this table/ })).toBeInTheDocument()
    a.unmount()
    renderOverview({ initial: { tab: "tag" } })
    expect(within(await openExport(user)).getByRole("button", { name: /By tag — this table/ })).toBeInTheDocument()
  })

  it("AT-9 / RP-01: removing a filter chip on the Overview changes what the export covers", async () => {
    const user = userEvent.setup()
    let rows = -1
    renderOverview({ initial: { filters: { cohortId: "coh-bsn26" } }, onExported: (_c, t) => (rows = t.rows.length) })
    await user.click(screen.getByRole("button", { name: "Remove filter Cohort BSN 2026" }))
    const pop = await openExport(user)
    await user.click(within(pop).getByRole("button", { name: /this table/ }))
    expect(rows).toBe(40)
  })

  it("S: choosing an item announces the file, its row count and the filters recorded, with a download link", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { filters: { cohortId: "coh-bsn26", settingId: "set-inpatient" } }, now: () => "2026-10-08T09:00:00.000Z" })
    const pop = await openExport(user)
    await user.click(within(pop).getByRole("button", { name: /this table/ }))
    const link = await within(pop).findByRole("link", { name: /^Download CSV, \d+ rows?$/ })
    expect(link).toHaveAttribute("download", "skills-student.csv")
    expect(within(pop).getByText(/Export started: skills-student\.csv, \d+ rows?\./)).toBeInTheDocument()
    expect(within(pop).getByText(/Filters recorded in the file: .*Cohort: BSN 2026.*Setting: Inpatient/)).toBeInTheDocument()
    expect(within(pop).getByText(/^Export started:/).closest("[role='status']")).not.toBeNull()
  })

  it("AT-4 / RP-11 (OD-10 open): only CSV is offered and nothing claims a native Excel workbook", async () => {
    const user = userEvent.setup()
    renderOverview()
    const pop = await openExport(user)
    expect(within(pop).getByText(/CSV/)).toBeInTheDocument()
    expect(pop.textContent).not.toMatch(/workbook|\.xlsx/i)
  })

  it("AT-7 / RP-09: an impossible combination replaces the toolbar; the menu itself, given that scope, is disabled with the explanation", async () => {
    const user = userEvent.setup()
    const db = db0()
    const params = { ...EMPTY_PARAMS, filters: { locationId: "loc-mercy", settingId: "set-emergency" } }
    const a = renderOverview({ initial: params })
    expect(screen.queryByRole("button", { name: "Export" })).toBeNull() // prototype 16: no tabs, no toolbar
    a.unmount()
    render(
      <TooltipProvider>
        <ExportMenu db={db} params={params} display="merged" />
      </TooltipProvider>,
    )
    const pop = await openExport(user)
    expect(within(pop).getAllByText(/Mercy Home Health does not offer Emergency/).length).toBeGreaterThan(0)
    expect(within(pop).getByRole("button", { name: /this table/ })).toBeDisabled()
    expect(within(pop).getByRole("button", { name: /Evidence detail/ })).toBeDisabled()
  })

  it("E: nothing to export says so and creates no file", async () => {
    const user = userEvent.setup()
    const db = db0()
    let called = false
    renderOverview({ db: { ...db, submissions: [], evaluations: [], reviews: [] }, onExported: () => (called = true) })
    const pop = await openExport(user)
    await user.click(within(pop).getByRole("button", { name: /Evidence detail/ }))
    expect(await within(pop).findByText("There is nothing to export for these filters.")).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it("Er: a failed export says so and offers Try again that retries the same file", async () => {
    const user = userEvent.setup()
    let boom = true
    renderOverview({ initial: { filters: { cohortId: "coh-bsn26" } }, now: () => { if (boom) throw new Error("x"); return "2026-10-08T09:00:00.000Z" } })
    const pop = await openExport(user)
    await user.click(within(pop).getByRole("button", { name: /this table/ }))
    expect(await within(pop).findByText("The export could not be created. Try again.")).toBeInTheDocument()
    boom = false
    await user.click(within(pop).getByRole("button", { name: "Try again" }))
    expect(await within(pop).findByText(/^Export started:/)).toBeInTheDocument()
  })

  it("AT-15: keyboard only, Escape closes the popover and focus returns to Export", async () => {
    const user = userEvent.setup()
    renderOverview()
    const trigger = screen.getByRole("button", { name: "Export" })
    await openExport(user)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Export (CSV, opens in Excel)" })).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it("has no axe violations with the popover open, after an export, and when blocked", async () => {
    const user = userEvent.setup()
    const a = renderOverview()
    const pop = await openExport(user)
    await expectNoAxeViolations()
    await user.click(within(pop).getByRole("button", { name: /this table/ }))
    await within(pop).findByText(/^Export started:/)
    await expectNoAxeViolations()
    a.unmount()
    render(
      <TooltipProvider>
        <ExportMenu db={db0()} params={{ ...EMPTY_PARAMS, filters: { locationId: "loc-mercy", settingId: "set-emergency" } }} display="merged" />
      </TooltipProvider>,
    )
    await openExport(user)
    await expectNoAxeViolations()
  })
})

vi.useRealTimers()
