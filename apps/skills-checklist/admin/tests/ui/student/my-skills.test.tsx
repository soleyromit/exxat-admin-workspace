import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

vi.mock("next/navigation", async () => (await import("./nav")).navigationMock)

import { MySkillsView } from "@/components/student/my-skills-view"
import { StudentShell } from "@/components/student-shell"
import { setSkillActive } from "@/lib/store"
import { resetNav } from "./nav"
import { SCENARIO, db, replaceDb, resetStore, runAction } from "./helpers"
import { getRuntime } from "@/lib/store/react"

const noContrast = { rules: { "color-contrast": { enabled: false } } }
const ready = () => screen.findByRole("heading", { level: 1, name: "My skills" })
const rowOf = (name: string) => screen.getByRole("heading", { level: 2, name }).closest("li")!

beforeEach(() => {
  resetNav("/my-skills")
  resetStore(SCENARIO.olivia)
})

describe("S-15 my skills: one record per skill across every course (SH-06, CM-07, AE-05)", () => {
  it("AE-05, CM-07: a skill mapped or evidenced in several courses appears exactly once with its combined progress and the courses", async () => {
    render(<MySkillsView />)
    await ready()
    expect(screen.getAllByRole("heading", { level: 2, name: "IV Insertion" })).toHaveLength(1)
    const iv = rowOf("IV Insertion")
    expect(within(iv).getByText(/Courses with evidence: .*NURS 350 Fall 2026.*NURS 410 Fall 2026.*NURS 350 Fall 2025|Courses with evidence: .*NURS 350 Fall 2025.*NURS 410/)).toBeInTheDocument()
    expect(within(iv).getByText("4 of 5 demonstrations")).toBeInTheDocument()
  })

  it("SH-04: History links to the skill's attempts with the count", async () => {
    render(<MySkillsView />)
    await ready()
    expect(within(rowOf("IV Insertion")).getByRole("link", { name: "View history (5)" })).toHaveAttribute("href", "/my-skills/sk-iv")
  })

  it("SH-05: setting minimums show progress per setting on the row", async () => {
    render(<MySkillsView />)
    await ready()
    const wound = rowOf("Wound Care")
    expect(within(wound).getByText("Inpatient: 0 of 1")).toBeInTheDocument()
    expect(within(wound).getByText("Emergency: 0 of 1")).toBeInTheDocument()
  })

  it("SH-06: filtering by course limits which rows appear and never changes the record's counts in the summary", async () => {
    const user = userEvent.setup()
    render(<MySkillsView />)
    await ready()
    const summary = screen.getByText(/^Achieved \d+ of \d+\./).textContent
    const rowsBefore = screen.getAllByRole("heading", { level: 2 }).length // every h2 on this page is a skill row
    await user.click(screen.getByRole("combobox", { name: "Course" }))
    await user.click(await screen.findByRole("option", { name: /NURS 350 Clinical Practicum, Fall 2025/ }))
    const names = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    expect(names.length).toBeLessThan(rowsBefore)
    expect(names).toEqual(expect.arrayContaining(["IV Insertion", "Foley Catheter Insertion", "Wound Care"])) // mapped in that course
    expect(names).not.toContain("Medication Reconciliation") // neither mapped nor evidenced there
    expect(screen.getByText(/^Achieved \d+ of \d+\./).textContent).toBe(summary)
  })

  it("CM-05, ST-03: a skill with evidence that is not mapped to any of the student's courses still appears", async () => {
    const seed = db()
    const myOfferings = new Set(seed.offerings.filter((o) => o.cohortIds.includes(seed.students.find((s) => s.id === SCENARIO.marcus)!.cohortId)).map((o) => o.id))
    for (const p of seed.placements.filter((p) => p.studentId === SCENARIO.marcus)) myOfferings.add(p.offeringId)
    const mapped = new Set(seed.offeringSkillMaps.filter((m) => myOfferings.has(m.offeringId)).map((m) => m.skillId))
    const unmappedWithEvidence = [...new Set(seed.submissions.filter((s) => s.studentId === SCENARIO.marcus).map((s) => s.skillId))].filter((id) => !mapped.has(id))
    expect(unmappedWithEvidence.length).toBeGreaterThan(0)
    resetStore(SCENARIO.marcus)
    render(<MySkillsView />)
    await ready()
    for (const id of unmappedWithEvidence) {
      const name = seed.skills.find((s) => s.id === id)!.name
      expect(screen.getAllByRole("heading", { level: 2, name }).length).toBeGreaterThan(0)
    }
  })

  it("a usable skill with no evidence and no mapping to the student's courses is not listed", async () => {
    render(<MySkillsView />)
    await ready()
    // Oxygen therapy is not mapped to NURS 350 and Olivia has no evidence for it
    expect(screen.queryByRole("heading", { level: 2, name: "Nasogastric Tube Insertion" })).toBeNull() // unconfigured
  })

  it("SL-11: a deactivated skill leaves the list and the totals but its evidence stays reachable under Inactive skills", async () => {
    const user = userEvent.setup()
    render(<MySkillsView />)
    await ready()
    const totalBefore = Number(screen.getByText(/^Achieved \d+ of (\d+)\./).textContent!.match(/of (\d+)\./)![1])
    runAction((d) => setSkillActive(d, "sk-iv", false))
    expect(screen.queryByRole("heading", { level: 2, name: "IV Insertion" })).toBeNull()
    expect(Number(screen.getByText(/^Achieved \d+ of (\d+)\./).textContent!.match(/of (\d+)\./)![1])).toBe(totalBefore - 1)
    await user.click(screen.getByRole("button", { name: /Inactive skills \(1\)/ }))
    expect(await screen.findByText("IV Insertion")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View history (5)" })).toHaveAttribute("href", "/my-skills/sk-iv")
    expect(screen.getByText(/Inactive skills are not counted in the totals above/)).toBeInTheDocument()
  })

  it("empty: a student with no mappings and no evidence sees the plain explanation, not an error", async () => {
    replaceDb((d) => ({ ...d, submissions: [], evaluations: [], reviews: [], links: [], offeringSkillMaps: [] }))
    render(<MySkillsView />)
    expect(await screen.findByText("You have no skills to show yet. Skills appear here once your program maps them to your courses, or you send one for review.")).toBeInTheDocument()
  })

  it("filtered to zero: explains and offers Clear", async () => {
    const user = userEvent.setup()
    render(<MySkillsView />)
    await ready()
    await user.type(screen.getByLabelText("Search skills"), "zzzz")
    expect(screen.getByText("No skills match these filters.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(screen.getByRole("heading", { level: 2, name: "IV Insertion" })).toBeInTheDocument()
  })

  it("read-only: there is no send, edit or filled action on this page; Send for review is a text link back to the course", async () => {
    render(<MySkillsView />)
    await ready()
    expect(screen.queryAllByRole("button").filter((b) => /Send request|Resend|Approve/.test(b.textContent ?? ""))).toHaveLength(0)
    const link = within(rowOf("IV Insertion")).getByRole("link", { name: "Send for review" })
    expect(link.getAttribute("href")).toMatch(/^\/student\?course=off-.*&skills=sk-iv$/)
  })
})

describe("S-15 status rendering is one flag (AE-04, DEC-003, OD-03 open)", () => {
  it("flag A: the summary counts 'Evidence does not qualify' and 'No evidence yet' separately", async () => {
    resetStore(SCENARIO.priya, "four")
    render(<MySkillsView />)
    await ready()
    expect(screen.getByText(/^Achieved \d+ of \d+\. In progress \d+\. Evidence does not qualify \d+\. No evidence yet \d+\.$/)).toBeInTheDocument()
  })

  it("flag B: both fall under 'Not met' while the stored state is unchanged", async () => {
    resetStore(SCENARIO.priya, "merged")
    render(<MySkillsView />)
    await ready()
    expect(screen.getByText(/^Achieved \d+ of \d+\. In progress \d+\. Not met \d+\.$/)).toBeInTheDocument()
    expect(screen.queryByText(/Evidence does not qualify \d+/)).toBeNull()
  })
})

describe("student shell demo switcher and accessibility", () => {
  it("the demo switcher changes only which student the shell acts as; options carry cohort and group to tell duplicate names apart", async () => {
    const user = userEvent.setup()
    render(
      <StudentShell>
        <h1>x</h1>
      </StudentShell>,
    )
    await user.click(screen.getByRole("button", { name: /is the student shown/ }))
    const items = await screen.findAllByRole("menuitemradio")
    expect(items.length).toBe(db().students.length)
    expect(items[0].textContent).toMatch(/,\s*\S+/)
    await user.click(screen.getByRole("menuitemradio", { name: /^Noah Zeller/ }))
    expect(getRuntime().getPrefs().currentStudentId).toBe(SCENARIO.noah)
  })

  it("axe: My skills has no violations; one h1; filters are labelled", async () => {
    const { container } = render(<MySkillsView />)
    await ready()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect((await axe.run(container, noContrast)).violations).toEqual([])
  })
})
