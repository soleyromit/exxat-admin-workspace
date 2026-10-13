import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next/navigation", async () => (await import("./harness")).navigationMock)

import { LibraryPage } from "@/components/library/library-page"
import { isReservedSettingName } from "@/components/library/entity-dialogs"
import { surface } from "@/lib/copy"
import { r1 } from "@/lib/copy/r1-library"
import { settingRows } from "@/lib/store"
import { axeViolations, filledPrimaries, getDb, renderPage, resetWorld, setDb } from "./harness"

const s06 = surface.s06
const rowOf = (name: string) => screen.getByText(name, { selector: "td *" }).closest("tr") as HTMLElement
const setStatus = async (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, to: "Active" | "Inactive") => {
  await user.click(within(dialog).getByRole("combobox", { name: "Status" }))
  await user.click(await screen.findByRole("option", { name: to }))
}

beforeEach(() => resetWorld("/skills/library", "tab=settings"))

describe("P-05 Clinical Settings tab", () => {
  it("prototype frame: intro bar verbatim, card 'Clinical settings' / subtitle, Add setting, columns Setting, Evidence recorded, Status", async () => {
    renderPage(<LibraryPage />)
    expect(await screen.findByText(r1.settingsIntro)).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Clinical settings" })).toBeInTheDocument()
    expect(screen.getByText("Offered to students when they record clinical evidence")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add setting" })).toBeInTheDocument()
    const headers = within(document.querySelector("thead") as HTMLElement).getAllByRole("columnheader").map((h) => h.textContent?.trim()).filter(Boolean)
    expect(headers).toEqual(expect.arrayContaining(["Setting", "Evidence recorded", "Status"]))
  })

  it("SL-07 T1: the list is the program's settings, in the order it created them (as the prototype), with evidence counts", async () => {
    renderPage(<LibraryPage />)
    await screen.findByText("Inpatient", { selector: "td *" })
    const names = [...document.querySelectorAll("tbody tr")].map((tr) => tr.querySelector("span.font-medium")?.textContent)
    expect(names).toEqual(getDb().clinicalSettings.map((x) => x.name))
    const evidence = settingRows(getDb()).find((r) => r.item.id === "set-outpatient")!.evidenceCount
    expect(within(rowOf("Outpatient clinic")).getByText(String(evidence))).toBeInTheDocument()
  })

  it("SL-01 T4: a new program has no settings, and the empty state says students cannot record clinical evidence yet", async () => {
    setDb((db) => ({ ...db, clinicalSettings: [], skills: db.skills.map((s) => ({ ...s, criteria: { ...s.criteria, settingMinimums: {} } })) }))
    renderPage(<LibraryPage />)
    expect(await screen.findByRole("heading", { level: 2, name: s06.empty })).toBeInTheDocument()
    expect(screen.getByText("Students cannot record clinical evidence until at least one setting exists.")).toBeInTheDocument()
  })

  it("SC-12 T3: lab evidence never appears in a clinical setting's evidence count", async () => {
    renderPage(<LibraryPage />)
    await screen.findByText("Inpatient", { selector: "td *" })
    const db = getDb()
    expect(db.submissions.filter((s) => s.performedIn === "lab" && s.clinicalSettingId !== null)).toHaveLength(0)
    const total = settingRows(db).reduce((n, r) => n + r.evidenceCount, 0)
    const clinicalWithEvaluation = db.submissions.filter((s) => s.performedIn === "clinical" && db.evaluations.some((e) => e.submissionId === s.id)).length
    expect(total).toBe(clinicalWithEvaluation)
  })

  it("SL-07 T5: Add setting (672px dialog: Name, Status with helper) creates an active setting, reports it, and is the only filled primary", async () => {
    const user = userEvent.setup()
    const { container } = renderPage(<LibraryPage />)
    await screen.findByText("Inpatient", { selector: "td *" })
    expect(filledPrimaries(container).map((p) => p.textContent?.trim())).toEqual(["Add setting"])
    await user.click(screen.getByRole("button", { name: "Add setting" }))
    const dialog = await screen.findByRole("dialog", { name: "Add clinical setting" })
    expect(dialog.className).toMatch(/sm:max-w-\[672px\]/)
    expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveAttribute("placeholder", "Program-defined setting")
    expect(within(dialog).getByText("Inactive settings stay on existing evidence but are not offered to students.")).toBeInTheDocument()
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "Rehabilitation")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Rehabilitation added.")).toBeInTheDocument()
    expect(getDb().clinicalSettings.find((s) => s.name === "Rehabilitation")?.active).toBe(true)
  })

  it("SC-12: the names Lab and Simulation are refused because lab evidence is recorded separately", async () => {
    expect(["Lab", "simulation", "Lab / Simulation", "Lab and simulation"].map(isReservedSettingName)).toEqual([true, true, true, true])
    expect(["Inpatient", "Simulation hospital ward"].map(isReservedSettingName)).toEqual([false, false])
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Inpatient", { selector: "td *" })
    await user.click(screen.getByRole("button", { name: "Add setting" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "Lab")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(within(dialog).getByText("Lab and simulation are recorded separately and are not clinical settings.")).toBeInTheDocument()
    expect(getDb().clinicalSettings.some((s) => s.name === "Lab")).toBe(false)
  })

  it("V: duplicate and empty names are explained and nothing is saved", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Inpatient", { selector: "td *" })
    await user.click(screen.getByRole("button", { name: "Add setting" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(within(dialog).getByText("Enter a name.")).toBeInTheDocument()
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "inpatient")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(within(dialog).getByText('A setting named "inpatient" already exists. Use a different name.')).toBeInTheDocument()
    expect(getDb().clinicalSettings.filter((s) => s.name.toLowerCase() === "inpatient")).toHaveLength(1)
  })

  it("SC-11 SC-18 T2 T7 (OD-26, proposed): setting Status to Inactive on a setting named by a skill minimum is blocked, and the reason names the skills", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Inpatient", { selector: "td *" })
    const referenced = getDb().skills.filter((s) => (s.criteria.settingMinimums["set-inpatient"] ?? 0) > 0)
    expect(referenced.length).toBeGreaterThan(0)
    expect(within(rowOf("Inpatient")).getByText("1 skill")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Inpatient: Edit" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit clinical setting" })
    await setStatus(user, dialog, "Inactive")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await within(dialog).findByText("Inpatient cannot be deactivated yet.")).toBeInTheDocument()
    expect(within(dialog).getByText(new RegExp(`These skills require evidence from it: ${referenced.map((s) => s.name).join(", ")}\\.`))).toBeInTheDocument()
    expect(within(dialog).getByRole("link", { name: referenced[0].name })).toHaveAttribute("href", `/skills/library?dialog=configure&skill=${referenced[0].id}`)
    expect(getDb().clinicalSettings.find((s) => s.id === "set-inpatient")!.active).toBe(true)
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(screen.getByRole("button", { name: "Inpatient: Edit" })).toHaveFocus())
  })

  it("OD-26 T2: 'Required by' links to the skills list filtered to that setting", async () => {
    renderPage(<LibraryPage />)
    await screen.findByText("Inpatient", { selector: "td *" })
    expect(within(rowOf("Inpatient")).getByRole("link", { name: "1 skill" })).toHaveAttribute("href", "/skills/library?setting=set-inpatient")
    expect(within(rowOf("Community or home")).queryByRole("link")).toBeNull()
  })

  it("SL-07 T6: an unreferenced setting is deactivated from the dialog, evidence is kept, and it can be reactivated", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Perioperative", { selector: "td *" })
    const evidenceBefore = getDb().submissions.length
    await user.click(screen.getByRole("button", { name: "Perioperative: Edit" }))
    let dialog = await screen.findByRole("dialog", { name: "Edit clinical setting" })
    await setStatus(user, dialog, "Inactive")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Perioperative updated.")).toBeInTheDocument()
    expect(within(rowOf("Perioperative")).getByText("Inactive")).toBeInTheDocument()
    expect(getDb().submissions).toHaveLength(evidenceBefore)
    await user.click(screen.getByRole("button", { name: "Perioperative: Edit" }))
    dialog = await screen.findByRole("dialog", { name: "Edit clinical setting" })
    await setStatus(user, dialog, "Active")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(getDb().clinicalSettings.find((s) => s.id === "set-periop")!.active).toBe(true)
  })

  it("SL-07: a setting can be renamed and the change is reported", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Emergency", { selector: "td *" })
    await user.click(screen.getByRole("button", { name: "Emergency: Edit" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit clinical setting" })
    const name = within(dialog).getByRole("textbox", { name: "Name" })
    await user.clear(name)
    await user.type(name, "Emergency department")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Emergency department updated.")).toBeInTheDocument()
  })

  it("P: when every setting is inactive a warning says students cannot record clinical evidence", async () => {
    setDb((db) => ({ ...db, clinicalSettings: db.clinicalSettings.map((s) => ({ ...s, active: false })) }))
    renderPage(<LibraryPage />)
    await screen.findByText("Inpatient", { selector: "td *" })
    expect(screen.getAllByText("Students cannot record clinical evidence until at least one setting exists.").length).toBeGreaterThan(0)
  })

  it("L and a11y: the populated page has no axe violations", async () => {
    const { container } = renderPage(<LibraryPage />)
    await screen.findByText("Inpatient", { selector: "td *" })
    expect(await axeViolations(container)).toEqual([])
  })
})
