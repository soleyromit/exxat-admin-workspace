import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import { buttonVariants } from "@exxatdesignux/ui/components/ui/button"

vi.mock("next/navigation", async () => (await import("./nav")).navigationMock)

import { HistoryView } from "@/components/student/history-view"
import { nav, resetNav } from "./nav"
import { SCENARIO, db, resetStore } from "./helpers"

const OFF = "off-350-f26"
const noContrast = { rules: { "color-contrast": { enabled: false } } }
const isFilled = (el: HTMLElement) => {
  const out = buttonVariants({ variant: "outline" }).split(/\s+/)
  const distinct = buttonVariants({ variant: "default" }).split(/\s+/).filter((t) => !out.includes(t))
  return distinct.length > 0 && distinct.every((t) => el.className.includes(t))
}

const attemptHeadings = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent ?? "")
const card = (n: number) => screen.getByRole("heading", { level: 3, name: new RegExp(`^Attempt ${n}\\.`) }).closest("li")!

beforeEach(() => {
  resetNav("/courses/off-350-f26/skills/sk-iv/history")
  resetStore(SCENARIO.olivia)
})

describe("S-14 every attempt, in order, with an explicit outcome (SH-01, SH-02, SH-04)", () => {
  it("SH-01: every attempt is listed and identified by attempt number, newest first, with an oldest-first toggle", async () => {
    const user = userEvent.setup()
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1, name: "Your submission history for IV Insertion" })
    expect(attemptHeadings().map((t) => t.match(/^Attempt (\d)/)![1])).toEqual(["5", "4", "3", "2", "1"])
    await user.click(screen.getByRole("button", { name: "Show oldest first" }))
    expect(attemptHeadings().map((t) => t.match(/^Attempt (\d)/)![1])).toEqual(["1", "2", "3", "4", "5"])
  })

  it("SH-02: each attempt carries exactly one outcome: counted or returned for IV Insertion", async () => {
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    expect(within(card(5)).getByText("Returned by the reviewer")).toBeInTheDocument()
    for (const n of [1, 2, 3, 4]) expect(within(card(n)).getByText("Counted")).toBeInTheDocument()
  })

  it("SH-02: a request that is waiting says who it is with", async () => {
    render(<HistoryView skillId="sk-med" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    expect(screen.getByText("Waiting with A. Whitfield, RN (Preceptor)")).toBeInTheDocument()
  })

  it("SH-04: the header shows how many counted, how many are outstanding and how many were returned", async () => {
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    const dl = screen.getByText("Counted so far").closest("dl")!
    // "In progress" is also the skill's status badge in the header (AE-04), so the counter is read by its <dt> (prototype wording, C-10)
    const val = (label: string) => screen.getAllByText(label).find((e) => e.tagName === "DT")!.closest("div")!.querySelector("dd")!.textContent
    expect(val("Counted so far")).toBe("4")
    expect(val("In progress")).toBe("0")
    expect(val("Returned")).toBe("1")
    expect(dl).toBeInTheDocument()
  })

  it("ST-13: each attempt says in which setting and location it was recorded and with whom", async () => {
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    expect(within(card(5)).getByRole("heading", { level: 3 }).textContent).toMatch(/Clinical \(Outpatient clinic\) at Harbor Family Practice/)
    expect(within(card(5)).getByText("M. Okonkwo, RN (Preceptor)")).toBeInTheDocument()
  })

  it("empty: a skill the student never sent says so", async () => {
    const seed = db()
    const unsent = seed.skills.find((s) => s.active && s.model && !seed.submissions.some((x) => x.studentId === SCENARIO.olivia && x.skillId === s.id))!
    render(<HistoryView skillId={unsent.id} offeringId={OFF} />)
    expect(await screen.findByText("You have not sent this skill for review yet.")).toBeInTheDocument()
  })

  it("error: an unknown skill shows the error banner", async () => {
    render(<HistoryView skillId="sk-missing" offeringId={OFF} />)
    expect(await screen.findByText("Your skills could not be loaded. Try again.")).toBeInTheDocument()
  })
})

describe("S-14 scope and the shared record (SH-06, CM-07, AE-04)", () => {
  it("SH-06: All courses is the default and a course narrows the attempts while the record's progress stays the same", async () => {
    const user = userEvent.setup()
    nav.pathname = "/my-skills/sk-iv"
    const { unmount } = render(<HistoryView skillId="sk-iv" />)
    await screen.findByRole("heading", { level: 1 })
    expect(screen.getByRole("radio", { name: "All courses (5)" })).toBeChecked()
    const progressAll = screen.getByText(/of 5 demonstrations/).textContent
    await user.click(screen.getByRole("radio", { name: /NURS 350 Clinical Practicum, Fall 2025 only \(2\)/ }))
    expect(nav.replace).toHaveBeenCalledWith("/my-skills/sk-iv?scope=off-350-f25")
    unmount()
    resetNav("/my-skills/sk-iv", "scope=off-350-f25")
    render(<HistoryView skillId="sk-iv" />)
    await screen.findByRole("heading", { level: 1 })
    expect(attemptHeadings()).toHaveLength(2)
    expect(screen.getByText(/of 5 demonstrations/).textContent).toBe(progressAll) // one record per skill across courses
    expect(screen.getByText(/Evidence counts toward this skill wherever it was gathered/)).toBeInTheDocument()
  })

  it("AE-04, DEC-003: the skill status says 'Evidence does not qualify' while each failed attempt says 'Did not meet criteria'", async () => {
    resetStore(SCENARIO.priya)
    render(<HistoryView skillId="sk-foley" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    expect(screen.getAllByText("Evidence does not qualify")).toHaveLength(1) // the skill record status, once, in the header
    expect(screen.getAllByText("Did not meet criteria").length).toBeGreaterThan(0) // the per-submission outcome
  })

  it("SH-05, DEFECT-07: the header shows progress against each named setting and what is still needed", async () => {
    render(<HistoryView skillId="sk-wound" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    expect(screen.getByText("Inpatient: 0 of 1")).toBeInTheDocument()
    expect(screen.getByText("Emergency: 0 of 1")).toBeInTheDocument()
    expect(screen.getByText(/You need 1 in emergency and have 0/)).toBeInTheDocument()
  })
})

describe("S-14 failed rule and read-only evaluation (SH-03, SH-07)", () => {
  it("SH-03: a did-not-meet attempt states the rule in the student's terms and that a further attempt is possible", async () => {
    resetStore(SCENARIO.priya)
    render(<HistoryView skillId="sk-foley" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    const warn = screen.getAllByText(/This evaluation did not meet the criteria because/)[0]
    expect(warn.textContent).toMatch(/these required questions were not answered Yes: .*procedure correctly/)
    expect(warn.textContent).toMatch(/Make a further attempt\./)
    expect(warn.textContent).not.toMatch(/failed/i)
  })

  it("SH-07: View evaluation opens the evaluator's full answers read-only as text, not as disabled inputs", async () => {
    const user = userEvent.setup()
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    const c = card(4)
    await user.click(within(c).getByRole("button", { name: "View evaluation" }))
    expect(within(c).getByText("Demonstration outcome")).toBeInTheDocument()
    expect(within(c).queryAllByRole("textbox")).toHaveLength(0)
    expect(within(c).queryAllByRole("radio")).toHaveLength(0)
  })
})

describe("S-14 revision versus a further attempt, and locked states (RV-01..RV-05, P-10, P-11)", () => {
  it("RV-05: counted and waiting-for-approval attempts have no edit or resend action and say why", async () => {
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    expect(within(card(4)).getByText("This submission counted and can no longer be changed.")).toBeInTheDocument()
    expect(within(card(4)).queryByRole("button", { name: /Revise and resend|further attempt/ })).toBeNull()
    resetStore(SCENARIO.jonah)
    // Jonah's IV Insertion is waiting for administrator approval
    const { unmount } = render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findAllByText("This submission is waiting for approval and cannot be changed.")
    expect(screen.queryByRole("button", { name: /Revise and resend|further attempt/ })).toBeNull()
    unmount()
  })

  it("P-10: Revise and resend appears only on the returned attempt and it is the one filled primary; never both actions", async () => {
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    const revise = screen.getAllByRole("button", { name: "Revise and resend" })
    expect(revise).toHaveLength(1)
    expect(within(card(5)).getByRole("button", { name: "Revise and resend" })).toBe(revise[0])
    expect(isFilled(revise[0])).toBe(true)
    expect(screen.queryByRole("button", { name: "Make a further attempt" })).toBeNull()
  })

  it("OD-16 stays neutral: the reviewer's reason is shown and no text says who must correct beyond the action offered", async () => {
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    expect(within(card(5)).getByText(/Reviewer note: /)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Return to preceptor/)
  })

  it("RV-01, RV-02: Revise and resend opens pre-filled with the reviewer's reason; Resend continues the SAME attempt with the revision count up", async () => {
    const user = userEvent.setup()
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    const before = db().submissions.find((s) => s.studentId === SCENARIO.olivia && s.skillId === "sk-iv" && s.attempt === 5)!
    expect(before.revision).toBe(1)
    await user.click(within(card(5)).getByRole("button", { name: "Revise and resend" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { name: "Revise and resend" })).toBeInTheDocument()
    expect(within(dialog).getByText(/The unit is still missing/)).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Completion date/)).toHaveValue(String(before.values["sk-iv-f-date"]))
    expect(within(dialog).getByRole("button", { name: "Resend" })).toBeEnabled()
    fireEvent.change(within(dialog).getByLabelText(/^Unit/), { target: { value: "5 East" } })
    await user.click(within(dialog).getByRole("button", { name: "Resend" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    const after = db().submissions.find((s) => s.id === before.id)!
    expect(after.attempt).toBe(5)
    expect(after.revision).toBe(2)
    expect(after.values["sk-iv-f-unit"]).toBe("5 East")
    expect(db().submissions.filter((s) => s.studentId === SCENARIO.olivia && s.skillId === "sk-iv")).toHaveLength(5) // no new record
    expect(await screen.findByText(/^Sent .+ to M\. Okonkwo, RN, Preceptor\. Clinical \(Outpatient clinic\) at Harbor Family Practice\.$/)).toBeInTheDocument()
    expect(within(card(5)).getByText("Waiting with M. Okonkwo, RN (Preceptor)")).toBeInTheDocument()
  })

  it("RV-04: the evaluator can be changed on resend, under the same role constraints", async () => {
    const user = userEvent.setup()
    render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    await user.click(within(card(5)).getByRole("button", { name: "Revise and resend" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("combobox", { name: /Send for review to/ }))
    expect((await screen.findAllByRole("option")).map((o) => o.textContent)).toEqual(["Preceptor", "Clinical faculty"])
  })

  it("RV-03: after a completed evaluation did not meet the criteria, Make a further attempt creates a NEW record and leaves the original untouched", async () => {
    resetStore(SCENARIO.priya)
    const user = userEvent.setup()
    render(<HistoryView skillId="sk-foley" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    const priyaSubs = () => db().submissions.filter((s) => s.studentId === SCENARIO.priya && s.skillId === "sk-foley")
    const original = JSON.stringify(priyaSubs())
    const prior = priyaSubs().length
    expect(isFilled(screen.getByRole("button", { name: "Make a further attempt" }))).toBe(true)
    expect(screen.queryByRole("button", { name: "Revise and resend" })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Make a further attempt" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { name: "Make a further attempt" })).toBeInTheDocument()
    expect(within(dialog).getByText("Your previous attempt is kept and still shown in your history.")).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText(/Completion date/), { target: { value: "2026-09-10" } })
    await user.click(within(dialog).getByRole("button", { name: "Send request" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    const now = priyaSubs()
    expect(now).toHaveLength(prior + 1)
    expect(JSON.stringify(now.slice(0, prior))).toBe(original) // RV-03: the original records are unchanged
    expect(now.at(-1)!.attempt).toBe(prior + 1)
  })

  it("P-10: a further attempt is not offered while another attempt is still open", async () => {
    resetStore(SCENARIO.priya)
    const seed = db()
    const last = seed.submissions.filter((s) => s.studentId === SCENARIO.priya && s.skillId === "sk-foley").at(-1)!
    // an open (awaiting evaluator) attempt that sits BEFORE the latest failed one: the latest is a did-not-meet, so only the "any open attempt" rule hides the action
    const { getRuntime } = await import("@/lib/store/react")
    const { ok } = await import("@/lib/store")
    const { act } = await import("@testing-library/react")
    act(() => {
      getRuntime().run((d) => ok({ ...d, submissions: [...d.submissions, { ...last, id: "sub-open", attempt: 0, revision: 0, lifecycle: "awaitingEvaluator" as const }] }, null) as never)
    })
    render(<HistoryView skillId="sk-foley" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    expect(screen.queryByRole("button", { name: "Make a further attempt" })).toBeNull()
    expect(screen.getByText("Finish your open submission first.")).toBeInTheDocument()
  })
})

describe("S-14 accessibility", () => {
  it("axe: no violations on the history page or with the revise sheet open; outcome is text, headings per attempt are h3 under one h1", async () => {
    const user = userEvent.setup()
    const { container } = render(<HistoryView skillId="sk-iv" offeringId={OFF} />)
    await screen.findByRole("heading", { level: 1 })
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect((await axe.run(container, noContrast)).violations).toEqual([])
    await user.click(within(card(5)).getByRole("button", { name: "Revise and resend" }))
    const dialog = await screen.findByRole("dialog")
    expect((await axe.run(dialog, noContrast)).violations).toEqual([])
  })
})
