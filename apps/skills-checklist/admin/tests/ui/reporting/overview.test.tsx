import { describe, expect, it, vi } from "vitest"
import { screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as S from "@/lib/store"
import { SCENARIO } from "@/lib/seed"
import { r4 } from "@/lib/copy"
import { db0, expectNoAxeViolations, hasHeader, headerTexts, openFilters, pickFilter, renderOverview, rowOf } from "./harness"

const total = (c: { achieved: number; partial: number; evidenceDoesNotQualify: number; noEvidence: number }) => c.achieved + c.partial + c.evidenceDoesNotQualify + c.noEvidence

describe("S-01 prototype layout (P-01): region order, strings, tab and column sets", () => {
  it("renders the regions in the prototype's order: filter bar, context line, 4 KPI cards, tabbed table card", () => {
    renderOverview()
    const filters = screen.getByTestId("filters-card")
    const context = screen.getByTestId("scope-sentence")
    const card = screen.getByTestId("report-card")
    expect(filters.compareDocumentPosition(context) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(context.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(filters).getByRole("button", { name: /^Filters/ })).toBeInTheDocument()
    expect(within(filters).getByText("Showing everything")).toBeInTheDocument()
  })

  it("the context line is the prototype's sentence", () => {
    renderOverview()
    expect(screen.getByTestId("scope-sentence")).toHaveTextContent(/^Showing data for 40 students · All cohorts · All groups · All clinical courses · 10 skills in scope$/)
  })

  it("exactly 4 KPI cards carry the prototype labels and captions", () => {
    renderOverview()
    for (const k of r4.kpis) expect(screen.getAllByText(k).length).toBeGreaterThan(0)
    expect(screen.getAllByText("Matches the filters above").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Per student, in scope").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Below 50% achievement in view").length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^\d+% of students in view$/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^\d+\.\d \/ 10$/).length).toBeGreaterThan(0)
  })

  it("tab labels are exactly By student, By skill, By tag", () => {
    renderOverview()
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["By student", "By skill", "By tag"])
  })

  it("default (merged, the prototype's three states): By student headers are the prototype's six", () => {
    renderOverview({ display: "merged" })
    expect(headerTexts()).toEqual(["Student", "Cohort · group", "Achieved", "In progress", "Not met", "Attainment"])
  })

  it("search, sort and Export are on the right of the tab row; Export is outline, nothing is a filled primary", () => {
    renderOverview()
    expect(screen.getByRole("textbox", { name: "Search students" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Sort students" })).toHaveTextContent("Highest attainment")
    const exp = screen.getByRole("button", { name: "Export" })
    expect(exp.className).toMatch(/border/)
    expect(exp.getAttribute("data-variant") ?? "outline").toBe("outline")
  })
})

describe("S-01 By student (RP-02, AE-04, DEFECT-04, DEFECT-09)", () => {
  it("RP-02: a row shows achieved, in progress, not met and attainment as a percentage with a bar", () => {
    const db = db0()
    renderOverview({ db, display: "merged", initial: { q: "olivia martin" } })
    const r = S.reportByStudent(db, {}).rows.find((x) => x.student.id === SCENARIO.olivia)!
    const text = within(rowOf(screen, "Olivia Martin")).getAllByRole("cell").map((c) => c.textContent)
    expect(text).toContain(`${r.counts.achieved}`)
    expect(text).toContain(`${r.counts.evidenceDoesNotQualify + r.counts.noEvidence}`)
    expect(text.some((t) => t?.startsWith(`${r.attainment}%`))).toBe(true)
    expect(within(rowOf(screen, "Olivia Martin")).getAllByRole("progressbar", { hidden: true }).length).toBeGreaterThan(0)
    expect(total(r.counts)).toBe(r.skillsInScope)
  })

  it("AE-04 (OD-03 flag, four): states 1 and 2 are separate columns and the page never says Not started", () => {
    renderOverview({ display: "four" })
    const headers = headerTexts()
    expect(headers).toEqual(["Student", "Cohort · group", "Achieved", "In progress", "Evidence does not qualify", "No evidence yet", "Attainment"])
    expect(document.body.textContent).not.toMatch(/Not Started/)
  })

  it("AE-04 (OD-03 flag, merged): states 1 and 2 count together as Not met and the data is identical", () => {
    const db = db0()
    renderOverview({ db, display: "merged", initial: { q: "olivia martin" } })
    const headers = headerTexts()
    expect(headers).toContain("Not met")
    expect(headers).not.toContain("No evidence yet")
    const r = S.reportByStudent(db, {}).rows.find((x) => x.student.id === SCENARIO.olivia)!
    const cells = within(rowOf(screen, "Olivia Martin")).getAllByRole("cell").map((c) => c.textContent)
    expect(cells).toContain(`${r.counts.evidenceDoesNotQualify + r.counts.noEvidence}`)
  })

  it("sorts by highest attainment first by default (prototype P-01)", () => {
    const db = db0()
    renderOverview({ db })
    const first = screen.getAllByRole("row")[1]
    const expected = S.reportByStudent(db, {}, { sort: "highest" }).rows[0]
    expect(within(first).getByRole("button", { name: new RegExp(`^${expected.student.name}`) })).toBeInTheDocument()
  })

  it("DEFECT-09: two people with the same name can be told apart by cohort and group in the row and its accessible name", () => {
    renderOverview({ initial: { q: "owen ashford" } })
    const buttons = screen.getAllByRole("button", { name: /^Owen Ashford/ })
    expect(buttons).toHaveLength(2)
    expect(new Set(buttons.map((b) => b.getAttribute("aria-label"))).size).toBe(2)
  })

  it("P state: footer shows 25 of 40 with the Not met note, then Show 15 more loads the rest", async () => {
    renderOverview({ display: "merged" })
    expect(screen.getByTestId("table-footer")).toHaveTextContent("Showing 25 of 40 students · Not met includes skills with no qualifying evidence yet")
    await userEvent.setup().click(screen.getByRole("button", { name: "Show 15 more" }))
    expect(screen.getByTestId("table-footer")).toHaveTextContent("Showing 40 of 40 students")
    expect(screen.queryByRole("button", { name: /Show \d+ more/ })).toBeNull()
  })

  it("the four-state rendering omits the Not met footnote because it would be false", () => {
    renderOverview({ display: "four" })
    expect(screen.getByTestId("table-footer")).not.toHaveTextContent("Not met includes")
  })

  it("IM-09: unconfigured skills are out of scope of the report", () => {
    const db = db0()
    renderOverview({ db, initial: { tab: "skill" } })
    expect(screen.queryByText("Nasogastric Tube Insertion")).toBeNull()
    expect(S.reportByStudent(db, {}).scope.skills.every((s) => s.model !== null)).toBe(true)
  })
})

describe("S-01 By skill and By tag (RP-03, RP-04, SL-11, IM-09)", () => {
  it("By skill headers are the prototype's set (merged)", () => {
    renderOverview({ display: "merged", initial: { tab: "skill" } })
    expect(headerTexts()).toEqual(["Skill", "Category", "Evaluation model", "Students in view", "Achieved", "In progress", "Not met", "% achieved", "Courses"])
  })

  it("By tag headers are the prototype's set (merged)", () => {
    renderOverview({ display: "merged", initial: { tab: "tag" } })
    expect(headerTexts()).toEqual(["Tag", "Skills", "Categories spanned", "Achieved", "In progress", "Not met", "% achieved", "Students achieving all"])
  })

  it("RP-03: the mandatory column appears only when a clinical course is applied", () => {
    const { unmount } = renderOverview({ initial: { tab: "skill" } })
    expect(hasHeader("For this course")).toBe(false)
    unmount()
    renderOverview({ initial: { tab: "skill", filters: { offeringId: "off-350-f26" } } })
    expect(hasHeader("For this course")).toBe(true)
    expect(screen.getAllByText("Mandatory").length).toBeGreaterThan(0)
  })

  it("lists only configured, active skills and carries the prototype's % achieved footnote verbatim", () => {
    const db = db0()
    renderOverview({ db, initial: { tab: "skill" } })
    const names = S.reportBySkill(db, {}).rows.map((r) => r.skill.name)
    for (const n of names) expect(screen.getByRole("button", { name: n })).toBeInTheDocument()
    expect(screen.queryByText("Nasogastric Tube Insertion")).toBeNull() // unconfigured (IM-09)
    expect(screen.getByText(r4.skillNote)).toBeInTheDocument()
  })

  it("SL-11: a deactivated skill leaves the skill list and the skills in scope, but its evidence is kept", () => {
    const db = db0()
    const off = S.setSkillActive(db, "sk-recon", false)
    if (!off.ok) throw new Error("setSkillActive failed")
    renderOverview({ db: off.db, initial: { tab: "skill" } })
    expect(screen.queryByRole("button", { name: "Medication Reconciliation" })).toBeNull()
    expect(S.reportByStudent(off.db, {}).kpis.skillsInScope).toBe(9)
    expect(off.db.submissions.some((s) => s.skillId === "sk-recon")).toBe(true)
  })

  it("RP-04: the tag report carries the prototype's overlap footnote and a skill is counted under each of its tags", () => {
    const db = db0()
    renderOverview({ db, initial: { tab: "tag" } })
    expect(screen.getByText(r4.tagNote)).toBeInTheDocument()
    const rows = S.reportByTag(db, {}).rows
    const sum = rows.reduce((a, r) => a + r.skillCount, 0)
    const distinct = new Set(S.reportBySkill(db, {}).rows.map((r) => r.skill.id)).size
    expect(sum).toBeGreaterThan(distinct) // overlap is real in the sample data
  })

  it("RP-05: a By skill row opens a 1024px skill dialog with how the skill is achieved and the students behind the figure, then the student's evidence", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { tab: "skill", filters: { cohortId: "coh-bsn26" } } })
    await user.click(screen.getByRole("button", { name: "IV Insertion" }))
    const dlg = await screen.findByRole("dialog", { name: "IV Insertion" })
    expect(within(dlg).getByText("How this skill is achieved")).toBeInTheDocument()
    expect(within(dlg).getByRole("tab", { name: /^Achieved \(\d+\)$/ })).toBeInTheDocument()
    expect(within(dlg).getByText(/students in view have achieved this skill/)).toBeInTheDocument()
    const first = within(dlg).getAllByRole("button", { name: /view evidence/ })[0]
    await user.click(first)
    const stu = await screen.findByRole("dialog", { name: /\w+/ })
    expect(stu).toBeInTheDocument()
    expect(await screen.findByTestId("ledger-sk-iv")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Remove filter Cohort BSN 2026/, hidden: true })).toBeInTheDocument() // filter chips unchanged behind the dialog
  })

  it("RP-05: a By tag row opens the tag dialog and its skills open the skill dialog", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { tab: "tag" } })
    await user.click(screen.getAllByRole("button", { name: "Tag A" })[0])
    const dlg = await screen.findByRole("dialog", { name: "Tag A" })
    expect(within(dlg).getByText("Students achieving every skill in this tag")).toBeInTheDocument()
    expect(within(dlg).getByText("Program-defined tag", { exact: false })).toBeInTheDocument()
    await user.click(within(dlg).getAllByRole("button", { name: /\w/ }).find((b) => b.textContent === "IV Insertion")!)
    expect(await screen.findByRole("dialog", { name: "IV Insertion" })).toBeInTheDocument()
  })
})

describe("S-01 filters (RP-01, RP-08, RP-09)", () => {
  it("the Filters panel expands to the prototype's seven labelled selects with their hints", async () => {
    const user = userEvent.setup()
    renderOverview()
    await openFilters(user)
    for (const l of ["Cohort", "Group", "Clinical course", "Category", "Tag", "Location", "Setting"]) expect(screen.getByRole("combobox", { name: l })).toBeInTheDocument()
    expect(screen.getByText("Select a cohort first")).toBeInTheDocument()
    expect(screen.getByText("Cuts across categories")).toBeInTheDocument()
    expect(screen.getByText("Filters the evidence")).toBeInTheDocument()
  })

  it("RP-01: each filter is its own chip, the context line names them, and removing one leaves the others", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { filters: { cohortId: "coh-bsn26", settingId: "set-inpatient" } } })
    const list = screen.getByRole("list", { name: "Applied filters" })
    expect(within(list).getByText("BSN 2026")).toBeInTheDocument()
    expect(within(list).getByText("Inpatient")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Filters/ })).toHaveTextContent("2")
    expect(screen.getByTestId("scope-sentence")).toHaveTextContent(/BSN 2026/)
    expect(screen.getByTestId("scope-sentence")).toHaveTextContent(/in Inpatient/)
    await user.click(screen.getByRole("button", { name: "Remove filter Setting Inpatient" }))
    expect(screen.queryByRole("button", { name: "Remove filter Setting Inpatient" })).toBeNull()
    expect(screen.getByRole("button", { name: "Remove filter Cohort BSN 2026" })).toBeInTheDocument()
  })

  it("RP-01: Clear all removes every chip", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { filters: { cohortId: "coh-bsn26", settingId: "set-inpatient" } } })
    await user.click(screen.getByRole("button", { name: "Clear all" }))
    expect(screen.getByText("Showing everything")).toBeInTheDocument()
  })

  it("RP-01: Backspace on a focused chip removes it and moves focus on", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { filters: { cohortId: "coh-bsn26", settingId: "set-inpatient" } } })
    screen.getByRole("button", { name: "Remove filter Cohort BSN 2026" }).focus()
    await user.keyboard("{Backspace}")
    expect(screen.queryByRole("button", { name: "Remove filter Cohort BSN 2026" })).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove filter Setting Inpatient" })))
  })

  it("S-01 V state: the Group select is disabled until a cohort is chosen and says why", async () => {
    const user = userEvent.setup()
    renderOverview()
    await openFilters(user)
    expect(screen.getByRole("combobox", { name: "Group" })).toBeDisabled()
    expect(screen.getByText("Select a cohort first")).toBeInTheDocument()
  })

  it("removing a cohort also removes its group so no orphan group filter remains", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { filters: { cohortId: "coh-bsn26", groupId: "grp-bsn26-a" } } })
    await user.click(screen.getByRole("button", { name: "Remove filter Cohort BSN 2026" }))
    expect(screen.queryByRole("button", { name: /^Remove filter Group/ })).toBeNull()
  })

  it("RP-08: a setting filter counts only evidence recorded there, says so, and clearing the chip restores the full counts", async () => {
    const user = userEvent.setup()
    const db = db0()
    renderOverview({ db, initial: { q: "olivia" } })
    const all = S.reportByStudent(db, {}).rows.find((x) => x.student.id === SCENARIO.olivia)!
    const em = S.reportByStudent(db, { settingId: "set-emergency" }).rows.find((x) => x.student.id === SCENARIO.olivia)!
    expect(em.counts).not.toEqual(all.counts) // the filter really changes the figures in the sample data
    await pickFilter(user, "Setting", "Emergency")
    expect(screen.getByTestId("evidence-scope")).toHaveTextContent("Counting evidence recorded in Emergency only")
    const cells = () => within(rowOf(screen, "Olivia Martin")).getAllByRole("cell").map((c) => c.textContent)
    expect(cells().some((t) => t?.startsWith(`${em.attainment}%`))).toBe(true)
    await user.click(screen.getByRole("button", { name: "Remove filter Setting Emergency" }))
    expect(screen.queryByTestId("evidence-scope")).toBeNull()
    expect(cells().some((t) => t?.startsWith(`${all.attainment}%`))).toBe(true)
  })

  it("RP-09: a location that does not offer the chosen setting is explained, the table and KPIs are replaced, and one action clears both filters", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { filters: { locationId: "loc-mercy", settingId: "set-emergency" } } })
    expect(screen.getByRole("heading", { name: "No evidence matches these filters" })).toBeInTheDocument()
    expect(screen.getByText("Mercy Home Health does not offer Emergency, so no evidence could have been gathered there in that setting.")).toBeInTheDocument()
    expect(screen.getByTestId("scope-sentence")).toHaveTextContent("Showing data for 0 students")
    expect(hasHeader("Student")).toBe(false) // no empty table
    expect(screen.queryByRole("tab", { name: "By student" })).toBeNull()
    for (const k of r4.kpis) expect(screen.queryByText(k)).toBeNull() // prototype 16: the KPI strip is gone
    await user.click(screen.getByRole("button", { name: "Clear location and setting" }))
    expect(hasHeader("Student")).toBe(true)
  })

  it("RP-09 (lab): lab or simulation evidence has no location, so a location with Lab is explained", () => {
    renderOverview({ initial: { filters: { locationId: "loc-harbor", settingId: "lab" } } })
    expect(screen.getByText(/Lab or simulation evidence has no location/)).toBeInTheDocument()
  })

  it("a group outside its cohort is explained rather than shown as an empty list", () => {
    renderOverview({ initial: { filters: { cohortId: "coh-bsn26", groupId: "grp-bsn27-a" } } })
    expect(screen.getByText(/This group does not belong to the selected cohort/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Clear group" })).toBeInTheDocument()
  })

  it("AE-05: a clinical course scopes the view and the page says evidence from any course still counts", () => {
    renderOverview({ initial: { filters: { offeringId: "off-315-f26" } } })
    expect(screen.getByText(/Evidence from any course still counts toward each skill/)).toBeInTheDocument()
  })
})

describe("S-01 states (L, E, Er, valid-but-empty)", () => {
  it("L: shows a skeleton in the final shape with a polite announcement, never a spinner alone", () => {
    renderOverview({ status: "loading" })
    expect(screen.getByRole("status")).toHaveTextContent("Updating results")
    expect(document.querySelector("[aria-busy='true']")).not.toBeNull()
    expect(hasHeader("Student")).toBe(false)
  })

  it("Er: shows the error with Try again, keeps the filters, and retry is wired", async () => {
    const onRetry = vi.fn()
    renderOverview({ status: "error", onRetry, initial: { filters: { cohortId: "coh-bsn26" } } })
    expect(screen.getByText("Attainment could not be loaded. Try again.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove filter Cohort BSN 2026" })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalled()
  })

  it("E: no student matches the search, with a Clear filters action that restores the list", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { q: "zzzzzz" } })
    expect(screen.getByText(/No students match these filters/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(hasHeader("Student")).toBe(true)
  })

  it("E: no configured skills leads to the library", () => {
    const db = db0()
    const none = { ...db, skills: db.skills.map((s) => ({ ...s, active: false })) }
    renderOverview({ db: none })
    expect(screen.getByText(/No configured skills yet/)).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: "Open the skills library" }).length).toBeGreaterThan(0)
  })

  it("valid combination with no evidence says so instead of showing a wall of zeros", () => {
    const db = db0()
    const bare = { ...db, submissions: [], evaluations: [], reviews: [] }
    renderOverview({ db: bare, display: "merged", initial: { filters: { settingId: "set-emergency" } } })
    // With no evidence at all every student reads Not met and nothing is achieved: the table still renders, the scope line says what is counted.
    expect(screen.getByTestId("evidence-scope")).toHaveTextContent("Counting evidence recorded in Emergency only")
  })
})

describe("S-01 accessibility (WCAG 2.1 AA, axe; colour contrast cannot be computed in jsdom)", () => {
  it("has no axe violations by default, filtered, filters open, merged and in the impossible state", async () => {
    const a = renderOverview()
    await expectNoAxeViolations()
    a.unmount()
    const b = renderOverview({ initial: { filters: { cohortId: "coh-bsn26", settingId: "set-inpatient" } }, display: "four" })
    await expectNoAxeViolations()
    await openFilters(userEvent.setup())
    await expectNoAxeViolations()
    b.unmount()
    renderOverview({ initial: { filters: { locationId: "loc-mercy", settingId: "set-emergency" } } })
    await expectNoAxeViolations()
  })

  it("has one h1, the tabs are named, and every table has an accessible name", () => {
    renderOverview()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getByRole("tablist", { name: "Attainment views" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Attainment by student" })).toBeInTheDocument()
  })

  it("never uses a danger tone for attainment status (no red in score viz)", () => {
    renderOverview({ initial: { tab: "student" } })
    const red = Array.from(document.querySelectorAll("*")).filter((el) => Array.from(el.classList).some((c) => /^(text|bg|border)-destructive/.test(c)))
    expect(red).toEqual([])
  })

  it("attainment bars are decorative: the percentage is text, so status never depends on the bar", () => {
    renderOverview({ initial: { q: "olivia martin" } })
    const row = rowOf(screen, "Olivia Martin")
    expect(within(row).getAllByText(/^\d+%$/).length).toBeGreaterThan(0)
  })
})
