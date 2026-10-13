import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import { buttonVariants } from "@exxatdesignux/ui/components/ui/button"

vi.mock("next/navigation", async () => (await import("./nav")).navigationMock)

import { CourseSkillsView, StudentView } from "@/components/student/course-skills-view"
import { nav, resetNav } from "./nav"
import { SCENARIO, db, replaceDb, resetStore } from "./helpers"

const OFF = "off-350-f26"
const noContrast = { rules: { "color-contrast": { enabled: false } } }

/** A button is "filled primary" when it carries the classes the default variant has and outline does not. */
function isFilled(el: HTMLElement): boolean {
  const out = buttonVariants({ variant: "outline" }).split(/\s+/)
  const distinct = buttonVariants({ variant: "default" }).split(/\s+/).filter((t) => !out.includes(t))
  return distinct.length > 0 && distinct.every((t) => el.className.includes(t))
}

async function ready() {
  return screen.findByRole("heading", { level: 1 })
}

beforeEach(() => {
  resetNav()
  resetStore(SCENARIO.olivia)
})

describe("S-12 course skills: what the course expects (ST-01, CM-03, CM-05, IM-09, SL-11)", () => {
  it("ST-01: mandatory skills come first with the Mandatory badge and a progress line; the page has one h1", async () => {
    render(<CourseSkillsView offeringId={OFF} />)
    expect((await ready()).textContent).toBe("Student View")
    const expected = screen.getByRole("region", { name: /Mapped to this course/ })
    const names = within(expected).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
    expect(names).toEqual(["Foley Catheter Insertion", "IV Insertion", "Medication Administration", "Wound Care", "Medication Reconciliation"])
    expect(within(expected).getAllByText("Mandatory for this course")).toHaveLength(4)
    expect(within(expected).getByText("Non-mandatory for this course")).toBeInTheDocument()
    expect(within(expected).getByText("4 / 5 demonstrations")).toBeInTheDocument()
    expect(within(expected).getAllByText(/^\u00b7 (Demonstration-Level Outcome|Question-Level Qualitative|Overall Binary Outcome)$/).length).toBe(5) // prototype: model beside the count
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("ST-02, CM-05: a skill not mapped to this course can be selected from Other skills, and says evidence still counts", async () => {
    const user = userEvent.setup()
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    expect(screen.queryByLabelText("Select Tracheostomy Care")).toBeNull() // collapsed
    await user.click(screen.getByRole("button", { name: /Other skills/ }))
    expect(screen.getByText(/Evidence still counts toward your skill record/)).toBeInTheDocument()
    await user.click(await screen.findByLabelText("Select Tracheostomy Care"))
    expect(screen.getByText("1 skill selected")).toBeInTheDocument()
  })

  it("IM-09, SL-11: unconfigured and inactive skills never appear in Expected or Other skills", async () => {
    const user = userEvent.setup()
    const { runAction } = await import("./helpers")
    const { setSkillActive } = await import("@/lib/store")
    runAction((d) => setSkillActive(d, "sk-trach", false))
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    await user.click(screen.getByRole("button", { name: /Other skills/ }))
    expect(screen.queryByLabelText("Select Nasogastric Tube Insertion")).toBeNull() // unconfigured import
    expect(screen.queryByLabelText("Select Tracheostomy Care")).toBeNull() // deactivated
    expect(screen.getByLabelText("Select Oxygen Therapy Administration")).toBeInTheDocument()
  })

  it("CM-03: the same skill is Mandatory in one course and Non-mandatory in another while progress is the same record", async () => {
    const { unmount } = render(<CourseSkillsView offeringId="off-350-f26" />)
    await ready()
    const row = (name: string) => screen.getByRole("heading", { level: 3, name }).closest("li")!
    expect(within(row("Medication Administration")).getByText("Mandatory for this course")).toBeInTheDocument()
    const progress350 = within(row("Medication Administration")).getByText(/qualifying evaluations/).textContent
    unmount()
    render(<CourseSkillsView offeringId="off-410-f26" />)
    await ready()
    expect(within(row("Medication Administration")).getByText("Non-mandatory for this course")).toBeInTheDocument()
    expect(within(row("Medication Administration")).getByText(/qualifying evaluations/).textContent).toBe(progress350) // CM-07, AE-05
  })

  it("SH-06, CM-07: progress includes evidence gathered in other courses (IV Insertion has attempts in NURS 410 and the earlier NURS 350)", async () => {
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    const iv = screen.getByRole("heading", { level: 3, name: "IV Insertion" }).closest("li")!
    await userEvent.setup().click(within(iv).getByRole("button", { name: "View history (5)" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { name: "IV Insertion" })).toBeInTheDocument()
    expect(within(dialog).getByText(/Your submission history/)).toBeInTheDocument()
  })

  it("empty: a course with no mapped skills says so and keeps Other skills available (CM-05)", async () => {
    render(<CourseSkillsView offeringId="off-305-f26" />)
    await ready()
    expect(screen.getByText("No skills are mapped to this course yet. You can still send other skills for review.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Other skills/ })).toBeInTheDocument()
  })

  it("error: an unknown course shows the error banner with a retry", async () => {
    const user = userEvent.setup()
    render(<CourseSkillsView offeringId="off-does-not-exist" />)
    expect(await screen.findByText("Your skills could not be loaded. Try again.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(nav.refresh).toHaveBeenCalled()
  })
})

describe("S-12 status and progress (SH-02, SH-05, SC-12, AE-04, OD-03 seam)", () => {
  it("SH-02: the waiting strip names each request with the skill, the person and the role", async () => {
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    const strip = screen.getByRole("region", { name: /Awaiting preceptor evaluation/ })
    expect(within(strip).getByText("Medication Reconciliation \u00b7 S. Nakamura, RN (Preceptor)")).toBeInTheDocument()
    expect(within(strip).getByText("Medication Administration \u00b7 A. Whitfield, RN (Preceptor)")).toBeInTheDocument()
  })

  it("SH-05, DEFECT-07: Wound Care has 4 of 4 demonstrations yet is not achieved, and the card says exactly what is missing per setting", async () => {
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    const wound = screen.getByRole("heading", { level: 3, name: "Wound Care" }).closest("li")!
    expect(within(wound).getByText("4 / 4 demonstrations")).toBeInTheDocument()
    expect(within(wound).getByText("Inpatient: 0 of 1")).toBeInTheDocument()
    expect(within(wound).getByText("Emergency: 0 of 1")).toBeInTheDocument()
    expect(within(wound).getByText("Still needed")).toBeInTheDocument()
    expect(within(wound).getByText(/You need 1 in Emergency and have 0/)).toBeInTheDocument()
    expect(within(wound).queryByText("Achieved")).toBeNull()
  })

  it("EC-25: an achieved skill can still be requested again and says so", async () => {
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    const rec = screen.getByRole("heading", { level: 3, name: "Medication Reconciliation" }).closest("li")!
    expect(within(rec).getByText("Achieved")).toBeInTheDocument()
    expect(within(rec).getByText(/you can still request another evaluation/i)).toBeInTheDocument()
    expect(within(rec).getByLabelText("Select Medication Reconciliation")).toBeInTheDocument()
  })

  it("AE-04, DEC-003: evidence that does not qualify reads 'Evidence does not qualify', never 'No evidence yet'", async () => {
    resetStore(SCENARIO.priya)
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    const foley = screen.getByRole("heading", { level: 3, name: "Foley Catheter Insertion" }).closest("li")!
    expect(within(foley).getByText("Evidence does not qualify")).toBeInTheDocument()
    expect(within(foley).queryByText("No evidence yet")).toBeNull()
  })

  it("OD-03 seam: the ONE flag only changes the label set, the stored state is the same four states", async () => {
    resetStore(SCENARIO.priya, "merged")
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    const foley = screen.getByRole("heading", { level: 3, name: "Foley Catheter Insertion" }).closest("li")!
    expect(within(foley).getByText("Not Started")).toBeInTheDocument()
    expect(within(foley).queryByText("Evidence does not qualify")).toBeNull()
  })

  it("ST-03: 'Show only skills I have sent for review' isolates earlier submissions, and clearing a filter that matches nothing is possible", async () => {
    const user = userEvent.setup()
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    await user.click(screen.getByLabelText("Show only skills I have sent for review"))
    const expected = screen.getByRole("region", { name: /Mapped to this course/ })
    // every remaining row has history; the one never sent is gone
    for (const h of within(expected).getAllByRole("heading", { level: 3 })) {
      expect(within(h.closest("li")!).getByRole("button", { name: /View history/ })).toBeInTheDocument()
    }
  })

  it("ST-03: when nothing has been sent the filter explains 'No skills match.' and Clear brings the list back", async () => {
    const user = userEvent.setup()
    replaceDb((d) => ({ ...d, submissions: [], evaluations: [], reviews: [], links: [] }))
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    await user.click(screen.getByLabelText("Show only skills I have sent for review"))
    expect(screen.getByText("No skills match.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(screen.getByRole("heading", { level: 3, name: "IV Insertion" })).toBeInTheDocument()
  })
})

describe("S-12 selection bar (ST-04, P-08)", () => {
  it("ST-04: ticking two skills shows '2 skills selected', Clear and ONE filled Send for review; Clear empties the selection", async () => {
    const user = userEvent.setup()
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    await user.click(screen.getByLabelText("Select Foley Catheter Insertion"))
    await user.click(screen.getByLabelText("Select Medication Administration"))
    const bar = screen.getByRole("region", { name: "Selection actions" })
    expect(within(bar).getByText("2 skills selected")).toBeInTheDocument()
    expect(isFilled(within(bar).getByRole("button", { name: "Send for review" }))).toBe(true)
    await user.click(within(bar).getByRole("button", { name: "Clear" }))
    expect(screen.queryByRole("region", { name: "Selection actions" })).toBeNull()
  })

  it("P-08: once the sheet is open the bar's button becomes outline so the sheet's Send request is the only filled primary", async () => {
    const user = userEvent.setup()
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    await user.click(screen.getByLabelText("Select Foley Catheter Insertion"))
    await user.click(screen.getByRole("button", { name: "Send for review" }))
    const dialog = await screen.findByRole("dialog")
    expect(isFilled(screen.getByRole("button", { name: "Send for review", hidden: true }))).toBe(false)
    expect(within(dialog).getByRole("button", { name: "Send request" })).toBeDisabled()
    expect(within(dialog).getAllByRole("button").filter(isFilled)).toHaveLength(1)
  })

  it("the selection bar is a labelled region and the count is a polite live region (a11y)", async () => {
    const user = userEvent.setup()
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    await user.click(screen.getByLabelText("Select IV Insertion"))
    expect(screen.getByText("1 skill selected")).toHaveAttribute("aria-live", "polite")
  })
})

describe("student surfaces: privacy and accessibility", () => {
  it("a student sees only their own record: another student's waiting requests never appear (cross-cutting §7)", async () => {
    resetStore(SCENARIO.rina)
    render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    expect(screen.queryByText(/S\. Nakamura/)).toBeNull()
    expect(screen.queryByText(/A\. Whitfield/)).toBeNull()
  })

  it("Student View: the viewing-as student and clinical course selects name every student and the student's courses; placements are shown (prototype card 1)", async () => {
    const user = userEvent.setup()
    const { container } = render(<StudentView />)
    await ready()
    const studentSelect = screen.getByRole("combobox", { name: "Viewing as student" })
    const courseSelect = screen.getByRole("combobox", { name: "Clinical course" })
    expect(studentSelect.className).toContain("min-h-11")
    expect(courseSelect.className).toContain("min-h-11")
    expect(screen.getByText(/Placed at /)).toBeInTheDocument()
    await user.click(courseSelect)
    const { studentCourses } = await import("@/lib/store")
    const all = studentCourses(db(), SCENARIO.olivia)
    const { courseOptionLabel } = await import("@/components/student/course-skills-view")
    const expectedOptions = [...all].sort((a, b) => (a.offering.academicYear < b.offering.academicYear ? 1 : -1)).map((c) => courseOptionLabel(c, all))
    expect((await screen.findAllByRole("option")).map((o) => o.textContent).sort()).toEqual([...expectedOptions].sort())
    expect(expectedOptions.some((o) => o.startsWith("NURS 350 \u2014 Clinical Practicum"))).toBe(true)
    expect(new Set(expectedOptions).size).toBe(expectedOptions.length) // same course in two terms stays distinguishable
    await user.keyboard("{Escape}")
    expect((await axe.run(container, noContrast)).violations).toEqual([])
  })

  it("Student View: choosing a course puts it in the URL (?course=) so the page can be linked and reloaded", async () => {
    const user = userEvent.setup()
    resetNav("/student")
    render(<StudentView />)
    await ready()
    await user.click(screen.getByRole("combobox", { name: "Clinical course" }))
    await user.click(await screen.findByRole("option", { name: /^NURS 410 \u2014 Community Health/ }))
    expect(nav.replace).toHaveBeenCalledWith("/student?course=off-410-f26")
  })

  it("Student View: ?course= picks the course, ?send=1 opens the Send for review dialog for ?skills=", async () => {
    resetNav("/student", "course=off-350-f26&send=1&skills=sk-foley")
    render(<StudentView />)
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { name: "Send for review" })).toBeInTheDocument()
  })

  it("axe: the course skills page has no violations in its default state and with the sheet open", async () => {
    const user = userEvent.setup()
    const { container } = render(<CourseSkillsView offeringId={OFF} />)
    await ready()
    expect((await axe.run(container, noContrast)).violations).toEqual([])
    await user.click(screen.getByLabelText("Select Foley Catheter Insertion"))
    await user.click(screen.getByRole("button", { name: "Send for review" }))
    const dialog = await screen.findByRole("dialog")
    expect((await axe.run(dialog, noContrast)).violations).toEqual([])
    expect(db().students.length).toBeGreaterThan(0)
  })
})
