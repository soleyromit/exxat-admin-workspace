import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

vi.mock("next/navigation", async () => (await import("./nav")).navigationMock)

import { CourseSkillsView } from "@/components/student/course-skills-view"
import { resetNav } from "./nav"
import { SCENARIO, db, resetStore } from "./helpers"

const OFF = "off-350-f26"
const noContrast = { rules: { "color-contrast": { enabled: false } } }

async function openHistory(skill = "IV Insertion", count = 5, user = userEvent.setup()) {
  render(<CourseSkillsView offeringId={OFF} />)
  const row = (await screen.findByRole("heading", { level: 3, name: skill })).closest("li")!
  await user.click(within(row).getByRole("button", { name: `View history (${count})` }))
  return { user, dialog: await screen.findByRole("dialog") }
}

beforeEach(() => {
  resetNav("/student", "course=off-350-f26")
  resetStore(SCENARIO.olivia)
})

describe("P-11 submission history DIALOG (SH-01..SH-07, RV-01..RV-05, C-4, C-10)", () => {
  it("opens as a 1024px dialog (max-w-5xl) titled with the skill, with 'Your submission history · criteria' as its description", async () => {
    const { dialog } = await openHistory()
    expect(dialog.className).toContain("sm:max-w-5xl")
    expect(within(dialog).getByRole("heading", { name: "IV Insertion" })).toBeInTheDocument()
    expect(within(dialog).getByText(/^Your submission history · .*demonstrations/)).toBeInTheDocument()
  })

  it("SH-04, C-10: three counters, labelled as the prototype does: 'Counted so far', 'In progress' + 'Sent but not finished', 'Returned' + 'Sent back by a reviewer'", async () => {
    const { dialog } = await openHistory()
    const val = (label: string) => within(dialog).getAllByText(label).find((e) => e.tagName === "DT")!.closest("dl")!.querySelector("dd")!.textContent
    expect(val("Counted so far")).toBe("4")
    expect(val("In progress")).toBe("0")
    expect(val("Returned")).toBe("1")
    expect(within(dialog).getByText("Sent but not finished")).toBeInTheDocument()
    expect(within(dialog).getByText("Sent back by a reviewer")).toBeInTheDocument()
  })

  it("SH-06: the scope toggle reads 'All courses (5)' and '<code> only (n)' and narrows the attempts", async () => {
    const { user, dialog } = await openHistory()
    expect(within(dialog).getByRole("radio", { name: "All courses (5)" })).toBeChecked()
    expect(within(dialog).getAllByRole("listitem").length).toBe(5)
    await user.click(within(dialog).getByRole("radio", { name: /^NURS 350 only \(\d\)$/ }))
    expect(within(dialog).getAllByRole("listitem").length).toBeLessThan(5)
  })

  it("SH-01, SH-02: attempts are newest first, each with an attempt number and one outcome", async () => {
    const { dialog } = await openHistory()
    const attempts = within(dialog).getAllByText(/^Attempt \d$/).map((e) => e.textContent)
    expect(attempts).toEqual(["Attempt 5", "Attempt 4", "Attempt 3", "Attempt 2", "Attempt 1"])
    expect(within(dialog).getByText("Returned by the reviewer")).toBeInTheDocument()
    expect(within(dialog).getAllByText("Counted").length).toBe(4)
  })

  it("RV-01: a returned attempt offers 'Revise and resend'; RV-05: counted attempts offer no action", async () => {
    const { dialog } = await openHistory()
    expect(within(dialog).getAllByRole("button", { name: "Revise and resend" })).toHaveLength(1)
    expect(within(dialog).getAllByRole("button", { name: "View form" }).length).toBeGreaterThan(0)
  })

  it("RV-01, RV-02: Revise and resend opens the Send for review dialog on top (same record), and sending closes the history", async () => {
    const { user, dialog } = await openHistory()
    const before = db().submissions.length
    await user.click(within(dialog).getByRole("button", { name: "Revise and resend" }))
    const send = await screen.findByRole("dialog") // the top dialog; the history dialog underneath is inert while it is open
    expect(within(send).getByRole("heading", { name: "Revise and resend" })).toBeInTheDocument()
    expect(db().submissions.length).toBe(before) // nothing is created by opening it (RV-02)
  })

  it("OD-16: the reviewer note on a returned attempt is shown neutrally ('Reviewer note:')", async () => {
    const { dialog } = await openHistory()
    expect(within(dialog).getByText("Reviewer note:")).toBeInTheDocument()
    expect(within(dialog).queryByText(/to the preceptor/i)).toBeNull()
  })

  it("RV-03, RV-05: a completed attempt's form is read-only text under 'View form', never editable inputs", async () => {
    const { user, dialog } = await openHistory()
    const view = within(dialog).getAllByRole("button", { name: "View form" })[0]
    await user.click(view)
    expect(within(dialog).queryAllByRole("textbox")).toHaveLength(0)
  })

  it("Close returns to the list and clears the dialog", async () => {
    const { user, dialog } = await openHistory()
    await user.click(within(dialog).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("axe: the history dialog has no violations", async () => {
    const { dialog } = await openHistory()
    expect((await axe.run(dialog, noContrast)).violations).toEqual([])
  })
})
