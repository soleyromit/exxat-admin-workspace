import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next/navigation", async () => (await import("./harness")).navigationMock)

import { LibraryPage } from "@/components/library/library-page"
import { rosterEvaluationCount } from "@/lib/store"
import { surface } from "@/lib/copy"
import { r1 } from "@/lib/copy/r1-library"
import { axeViolations, filledPrimaries, getDb, renderPage, resetWorld, setDb } from "./harness"

const s07 = surface.s07
const rosterRow = (name: string) => within(screen.getByRole("region", { name: "Table data" })).getByText(name, { selector: "span.font-medium" }).closest("tr") as HTMLElement
const ready = () => screen.findByText("T. Ferreira", { selector: "span.font-medium" })
const namedItem = (name: string) => within(screen.getByRole("list", { name: "Named by students" })).getByText(name).closest("li") as HTMLElement
const setStatus = async (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, to: "Active" | "Inactive") => {
  await user.click(within(dialog).getByRole("combobox", { name: "Status" }))
  await user.click(await screen.findByRole("option", { name: to }))
}

beforeEach(() => resetWorld("/skills/library", "tab=lab-instructors"))

describe("P-05 Lab Instructors tab", () => {
  it("prototype frame: intro bar verbatim, Lab instructors card, Add instructor, columns, and 'Named by students, not on the roster' card", async () => {
    renderPage(<LibraryPage />)
    await ready()
    expect(screen.getByText(r1.labIntro)).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Lab instructors" })).toBeInTheDocument()
    expect(screen.getByText("Offered to students when a skill is signed off in the lab")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add instructor" })).toBeInTheDocument()
    const headers = within(document.querySelector("thead") as HTMLElement).getAllByRole("columnheader").map((h) => h.textContent?.trim()).filter(Boolean)
    expect(headers).toEqual(expect.arrayContaining(["Name", "Email", "Evaluations", "Status"]))
    expect(screen.getByRole("heading", { level: 2, name: "Named by students, not on the roster" })).toBeInTheDocument()
    expect(screen.getByText("Add them if they sign off regularly — otherwise the spelling drifts and reporting splits")).toBeInTheDocument()
  })

  it("SL-08 T1: a name and an email are enough; the entry is added, reported, and creates no account", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await ready()
    await user.click(screen.getByRole("button", { name: "Add instructor" }))
    const dialog = await screen.findByRole("dialog", { name: "Add lab instructor" })
    expect(dialog.className).toMatch(/sm:max-w-\[672px\]/)
    expect(within(dialog).getByText("Held by the Skills module only. No Prism account is created.")).toBeInTheDocument()
    expect(within(dialog).getByText("Where the delegator link is sent. Without it they cannot be sent a form.")).toBeInTheDocument()
    expect(within(dialog).getByRole("textbox", { name: "Email" })).toHaveAttribute("placeholder", "name@example.edu")
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "P. Bansal")
    await user.type(within(dialog).getByRole("textbox", { name: "Email" }), "p.bansal@example.edu")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await screen.findByText("P. Bansal added to the roster.")).toBeInTheDocument()
    const added = getDb().labInstructors.find((l) => l.name === "P. Bansal")!
    expect(Object.keys(added).sort()).toEqual(["active", "email", "id", "name"])
    expect(within(rosterRow("P. Bansal")).getByText("p.bansal@example.edu")).toBeInTheDocument()
  })

  it("SL-08 T4: an invalid email is explained and nothing is saved; two problems get a summary", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await ready()
    const before = getDb().labInstructors.length
    await user.click(screen.getByRole("button", { name: "Add instructor" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Email" }), "not-an-email")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(within(dialog).getAllByText("Enter a name.").length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText("Enter a valid email address.").length).toBeGreaterThan(0)
    expect(within(dialog).getByText("Check these entries.")).toBeInTheDocument()
    expect(within(dialog).getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-invalid", "true")
    expect(getDb().labInstructors).toHaveLength(before)
  })

  it("V: an email already on the roster is flagged and 'Open existing' opens that entry", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await ready()
    await user.click(screen.getByRole("button", { name: "Add instructor" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "Tom Ferreira")
    await user.type(within(dialog).getByRole("textbox", { name: "Email" }), "T.Ferreira@example.edu")
    await user.tab()
    expect(await within(dialog).findByText(/An instructor with this email is already on the roster\./)).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Open existing" }))
    const edit = await screen.findByRole("dialog", { name: "Edit lab instructor" })
    expect(within(edit).getByRole("textbox", { name: "Name" })).toHaveValue("T. Ferreira")
  })

  it("SL-09 T2: a name a student typed is listed with its email and how often it was named; 'Add to roster' opens the Edit dialog prefilled and Save adopts it", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await ready()
    const named = namedItem("R. Whitmore")
    expect(within(named).getByText("r.whitmore@example.edu")).toBeInTheDocument()
    expect(within(named).getByText(/named \d+ times?/)).toBeInTheDocument()
    await user.click(within(named).getByRole("button", { name: "Add to roster: R. Whitmore" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit lab instructor" })
    expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue("R. Whitmore")
    expect(within(dialog).getByRole("textbox", { name: "Email" })).toHaveValue("r.whitmore@example.edu")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await screen.findByText(s07.adoptSuccess("R. Whitmore"))).toBeInTheDocument()
    expect(getDb().labInstructors.some((l) => l.name === "R. Whitmore")).toBe(true)
    expect(getDb().namedLabInstructors.find((n) => n.id === "named-whitmore")!.adoptedAs).toBeTruthy()
    expect(screen.queryByRole("heading", { name: "Named by students, not on the roster" })).toBeNull()
  })

  it("SL-09 T3: two spellings of one person are merged so counts and selectors show one name", async () => {
    setDb((db) => ({ ...db, namedLabInstructors: [...db.namedLabInstructors, { id: "named-tom", name: "Tom Ferreira", email: "tom.ferreira@example.edu", namedByStudentId: "stu-07", adoptedAs: null }] }))
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await ready()
    const named = namedItem("Tom Ferreira")
    expect(within(named).getByText(/Looks like T\. Ferreira/)).toBeInTheDocument()
    const before = rosterEvaluationCount(getDb(), "lab-ferreira")
    await user.click(within(named).getByRole("button", { name: "Merge into Tom Ferreira" }))
    const dialog = await screen.findByRole("dialog", { name: "Merge Tom Ferreira into an existing instructor" })
    const confirm = within(dialog).getByRole("button", { name: "Merge" })
    expect(confirm).toBeDisabled()
    await user.click(within(dialog).getByRole("radio", { name: /T\. Ferreira/ }))
    expect(within(dialog).getByText(/will point to T\. Ferreira\./)).toBeInTheDocument()
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    expect(await screen.findByText(/now point to T\. Ferreira\.|now points to T\. Ferreira\./)).toBeInTheDocument()
    const after = getDb()
    expect(after.namedLabInstructors.find((n) => n.id === "named-tom")!.adoptedAs).toBe("lab-ferreira")
    expect(after.labInstructors.filter((l) => /ferreira/i.test(l.name))).toHaveLength(1)
    expect(rosterEvaluationCount(after, "lab-ferreira")).toBeGreaterThanOrEqual(before)
  })

  it("SL-09: completed evaluations keep the name they were recorded under after an adoption (RV-03)", async () => {
    const user = userEvent.setup()
    const evaluationsBefore = JSON.stringify(getDb().evaluations)
    renderPage(<LibraryPage />)
    await ready()
    await user.click(within(namedItem("R. Whitmore")).getByRole("button", { name: "Add to roster: R. Whitmore" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit lab instructor" })
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    await screen.findByText(s07.adoptSuccess("R. Whitmore"))
    expect(JSON.stringify(getDb().evaluations)).toBe(evaluationsBefore)
  })

  it("SL-08 T7: setting Status to Inactive reports it, keeps completed evaluations attributed, and can be undone by setting Active", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await ready()
    const evaluations = getDb().evaluations.length
    await user.click(screen.getByRole("button", { name: "K. Larsen: Edit" }))
    let dialog = await screen.findByRole("dialog", { name: "Edit lab instructor" })
    await setStatus(user, dialog, "Inactive")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await screen.findByText("K. Larsen updated.")).toBeInTheDocument()
    expect(within(rosterRow("K. Larsen")).getByText("Inactive")).toBeInTheDocument()
    expect(getDb().evaluations).toHaveLength(evaluations)
    expect(screen.getByRole("button", { name: "K. Larsen: Edit" })).toHaveFocus()
    await user.click(screen.getByRole("button", { name: "K. Larsen: Edit" }))
    dialog = await screen.findByRole("dialog", { name: "Edit lab instructor" })
    await setStatus(user, dialog, "Active")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(getDb().labInstructors.find((l) => l.id === "lab-larsen")!.active).toBe(true)
  })

  it("SL-01 T5: an empty roster explains how instructors arrive and hides the adoption card", async () => {
    setDb((db) => ({ ...db, labInstructors: [], namedLabInstructors: [] }))
    renderPage(<LibraryPage />)
    expect(await screen.findByRole("heading", { level: 2, name: s07.empty })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Named by students, not on the roster" })).toBeNull()
  })

  it("global: Add instructor is the only filled primary (the adoption buttons are outline), emails stay on this admin surface, and axe is clean", async () => {
    const { container } = renderPage(<LibraryPage />)
    await ready()
    expect(filledPrimaries(container).map((p) => p.textContent?.trim())).toEqual(["Add instructor"])
    expect(await axeViolations(container)).toEqual([])
  })
})
