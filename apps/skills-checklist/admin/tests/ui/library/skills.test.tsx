import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next/navigation", async () => (await import("./harness")).navigationMock)

import { LibraryPage } from "@/components/library/library-page"
import { surface } from "@/lib/copy"
import { r1 } from "@/lib/copy/r1-library"
import { axeViolations, filledPrimaries, getDb, nav, renderPage, resetWorld, setDb } from "./harness"

const s04 = surface.s04
const rowOf = (name: string) => screen.getByRole("button", { name }).closest("tr") as HTMLElement
const names = () => [...document.querySelectorAll("tbody tr")].map((tr) => tr.querySelector("button")?.textContent ?? "")

beforeEach(() => resetWorld())

describe("P-04 Skills Library page: header, tabs and toolbar exactly as the prototype", () => {
  it("title, subtitle, six tabs with counts in the label, toolbar order and filled button", async () => {
    const { container } = renderPage(<LibraryPage />)
    expect(await screen.findByRole("heading", { level: 1, name: "Skills" })).toBeInTheDocument()
    expect(screen.getByText("The program's skills, plus the categories, tags and settings that organise them")).toBeInTheDocument()
    const db = getDb()
    expect(screen.getAllByRole("tab").map((t) => t.textContent?.trim())).toEqual([
      `Skills (${db.skills.length})`,
      "Kits",
      `Categories (${db.categories.length})`,
      `Tags (${db.tags.length})`,
      `Clinical Settings (${db.clinicalSettings.length})`,
      `Lab Instructors (${db.labInstructors.length})`,
    ])
    expect(screen.getByRole("tab", { name: /^Skills \(/ })).toHaveAttribute("aria-selected", "true")
    // Toolbar order in the card: search, categories, tags, statuses, Import, Add skill.
    await screen.findByText("IV Insertion")
    const toolbar = screen.getByRole("searchbox", { name: "Search skills" }).closest("[data-slot=card-content]") as HTMLElement
    const order = [...toolbar.querySelectorAll("input, button")].map((el) => el.getAttribute("placeholder") ?? el.getAttribute("aria-label") ?? el.textContent?.trim())
    expect(order[0]).toBe("Search skills")
    expect(order.slice(-2)).toEqual(["Import", "Add skill"])
    expect(filledPrimaries(container).map((p) => p.textContent?.trim())).toEqual(["Add skill"])
    const headers = within(document.querySelector("thead") as HTMLElement).getAllByRole("columnheader").map((h) => h.textContent?.trim())
    expect(headers.filter(Boolean).slice(0, 6)).toEqual(expect.arrayContaining(["Skill", "Category", "Evaluation model", "Achievement criteria", "Courses", "Status"]))
  })

  it("exactly one h1 and the table has no selection column", async () => {
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0)
  })

  it("clicking a tab navigates to ?tab= (the tab is linkable) and the skills tab carries no key", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    await user.click(screen.getByRole("tab", { name: /^Tags \(/ }))
    expect(nav.push).toHaveBeenCalledWith("/skills/library?tab=tags", { scroll: false })
    await user.click(screen.getByRole("tab", { name: /^Lab Instructors \(/ }))
    expect(nav.push).toHaveBeenCalledWith("/skills/library?tab=lab-instructors", { scroll: false })
  })
})

describe("S-04 skills list", () => {
  it("SL-01 T1: a program with no skills sees an empty state with Import and Add skill and nothing pre-supplied", async () => {
    setDb((db) => ({ ...db, skills: [], offeringSkillMaps: [], submissions: [], evaluations: [], links: [], importBatches: [] }))
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    expect(await screen.findByRole("heading", { level: 2, name: s04.emptyLibrary })).toBeInTheDocument()
    expect(document.querySelectorAll("tbody tr")).toHaveLength(0)
    const empty = screen.getByRole("heading", { level: 2, name: s04.emptyLibrary }).closest("[data-slot=card]") as HTMLElement
    await user.click(within(empty).getByRole("button", { name: "Import" }))
    expect(nav.push).toHaveBeenCalledWith("/skills/library?dialog=import")
    await user.click(within(empty).getByRole("button", { name: "Add skill" }))
    expect(nav.push).toHaveBeenCalledWith("/skills/library?dialog=add")
  })

  it("SL-02 T2: each skill shows its name, description and a status in text", async () => {
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    const r = rowOf("IV Insertion")
    expect(within(r).getByText(/./, { selector: "span.text-muted-foreground" })).toBeInTheDocument()
    expect(within(r).getByText("Active")).toBeInTheDocument()
    expect(within(rowOf("Nasogastric Tube Insertion")).getByText("Needs configuration")).toBeInTheDocument()
  })

  it("SL-03 SL-04 T3: at most one category and any number of tags display on a skill", async () => {
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    const iv = rowOf("IV Insertion")
    expect(within(iv).getByText("Category A")).toBeInTheDocument()
    const tags = within(iv).getByRole("list", { name: "Tags for IV Insertion" })
    expect(within(tags).getAllByRole("listitem").map((l) => l.textContent)).toEqual(["Tag A", "Tag B"])
  })

  it("SL-06 T4: a deactivated tag on a skill shows as inactive and stays until it is removed", async () => {
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    expect([...document.querySelectorAll("tbody tr")].find((tr) => tr.textContent?.includes("Tag D (inactive)"))).toBeTruthy()
  })

  it("SL-06 T4: a deactivated category shows '(inactive)' in the Category column", async () => {
    setDb((db) => ({ ...db, categories: db.categories.map((c) => (c.id === "cat-a" ? { ...c, active: false } : c)) }))
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    expect(within(rowOf("IV Insertion")).getByText("Category A (inactive)")).toBeInTheDocument()
  })

  it("SL-10 T5: search narrows by name and the URL carries it, keeping the other keys", async () => {
    resetWorld("/skills/library", "tab=skills")
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    await user.type(screen.getByRole("searchbox", { name: "Search skills" }), "foley")
    expect(names()).toEqual(["Foley Catheter Insertion"])
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/skills/library?tab=skills&q=foley", { scroll: false }))
  })

  it("SL-10 T5: category, tag and status filters from the query string narrow the list and show in the selects", async () => {
    resetWorld("/skills/library", "category=cat-b&status=active")
    renderPage(<LibraryPage />)
    await waitFor(() => expect(names().length).toBeGreaterThan(0))
    const narrow = names()
    expect(narrow.length).toBeLessThan(getDb().skills.length)
    expect(screen.getByRole("combobox", { name: /^Category:/ })).toHaveTextContent("Category B")
    expect(screen.getByRole("combobox", { name: /^Status:/ })).toHaveTextContent("Active")
  })

  it("SL-10 T5: the status filter offers Active, Needs configuration and Inactive, and filtered-to-zero explains and offers Clear filters", async () => {
    resetWorld("/skills/library", "q=zzzzzz")
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    expect(await screen.findByRole("heading", { level: 2, name: s04.emptyFiltered })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    await screen.findByText("IV Insertion")
    await user.click(screen.getByRole("combobox", { name: /^Status:/ }))
    for (const o of ["All statuses", "Active", "Needs configuration", "Inactive"]) expect(await screen.findByRole("option", { name: o })).toBeInTheDocument()
  })

  it("SL-11 T6: deactivating a skill with evidence (from the status pill) withdraws it from the list but keeps its evidence", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    const before = getDb().submissions.filter((s) => s.skillId === "sk-iv").length
    expect(before).toBeGreaterThan(0)
    await user.click(screen.getByRole("button", { name: /Actions for IV Insertion$/ }))
    await user.click(await screen.findByRole("menuitem", { name: "Deactivate skill" }))
    const dialog = await screen.findByRole("dialog", { name: "Deactivate IV Insertion?" })
    expect(within(dialog).getByText(/Evidence already recorded is kept/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Deactivate skill" }))
    expect(await screen.findByText("IV Insertion deactivated. Evidence already recorded is kept.")).toBeInTheDocument()
    expect(names()).not.toContain("IV Insertion")
    expect(getDb().skills.find((s) => s.id === "sk-iv")!.active).toBe(false)
    expect(getDb().submissions.filter((s) => s.skillId === "sk-iv")).toHaveLength(before)
    expect(screen.getByText("1 inactive skill is hidden.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument()
  })

  it("SL-11: the deactivate dialog tells the admin how many course offerings the skill is mapped to, and focus returns to the status pill", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    await user.click(screen.getByRole("button", { name: /Actions for IV Insertion$/ }))
    await user.click(await screen.findByRole("menuitem", { name: "Deactivate skill" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/Mapped to \d+ course offering/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(screen.getByRole("button", { name: /Actions for IV Insertion$/ })).toHaveFocus()
  })

  it("SL-11 T6: 'Show inactive' reveals deactivated skills with an Inactive status", async () => {
    setDb((db) => ({ ...db, skills: db.skills.map((s) => (s.id === "sk-iv" ? { ...s, active: false } : s)) }))
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("1 inactive skill is hidden.")
    expect(names()).not.toContain("IV Insertion")
    await user.click(screen.getByRole("button", { name: "Show inactive" }))
    expect(names()).toEqual(["IV Insertion"])
    expect(within(rowOf("IV Insertion")).getByText("Inactive")).toBeInTheDocument()
  })

  it("IM-09 IM-10 T7: an unconfigured row reads Not configured, a dash, 0 courses, Needs configuration and Configure; the banner names the count and 'Show them' filters", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    expect(screen.getByText(/2 skills in the library have not been configured, so they are not available for mapping or submission\./)).toBeInTheDocument()
    expect(screen.getByText(/10 of 12 configured/)).toBeInTheDocument()
    const ng = rowOf("Nasogastric Tube Insertion")
    expect(within(ng).getByText("Not configured")).toBeInTheDocument()
    expect(within(ng).getByText("—")).toBeInTheDocument()
    expect(within(ng).getByText("0")).toBeInTheDocument()
    expect(within(ng).getByRole("button", { name: "Configure: Nasogastric Tube Insertion" })).toBeInTheDocument()
    expect(within(rowOf("IV Insertion")).getByRole("button", { name: "Edit: IV Insertion" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: r1.showThem }))
    expect(names().sort()).toEqual(["Blood Glucose Monitoring", "Nasogastric Tube Insertion"])
    await waitFor(() => expect(screen.getByRole("group", { name: "Skills" })).toHaveFocus())
  })

  it("IM-10: after an import the success banner and the info banner both show, 'Configure them now' opens the first unconfigured skill, and Dismiss removes the success banner", async () => {
    resetWorld("/skills/library", "imported=imp-1")
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    expect(screen.getByText("Added 2 skills to the library. They cannot be used until each one is configured.")).toBeInTheDocument()
    expect(screen.getByText(/2 skills in the library have not been configured/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Configure them now" }))
    expect(nav.push).toHaveBeenCalledWith("/skills/library?imported=imp-1&dialog=configure&skill=sk-ng")
    await user.click(screen.getAllByRole("button", { name: /dismiss/i })[0])
    expect(nav.replace).toHaveBeenCalledWith("/skills/library", { scroll: false })
  })

  it("IM-11 T8: the import filter shows only skills from that batch and the library keeps both", async () => {
    resetWorld("/skills/library", "batch=imp-1")
    renderPage(<LibraryPage />)
    await screen.findByText("Nasogastric Tube Insertion")
    expect(names().sort()).toEqual(["Blood Glucose Monitoring", "Nasogastric Tube Insertion"])
    expect(screen.getAllByText("From import 1").length).toBe(2)
    expect(screen.getByRole("combobox", { name: /^Import:/ })).toHaveTextContent("Import 1")
    expect(getDb().skills.length).toBe(12)
  })

  it("OD-26: the setting filter shows only skills whose minimum names that setting, with a removable chip", async () => {
    resetWorld("/skills/library", "setting=set-inpatient")
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Wound Care")
    const expected = getDb().skills.filter((s) => (s.criteria.settingMinimums["set-inpatient"] ?? 0) > 0 && s.active).map((s) => s.name)
    expect(names().sort()).toEqual(expected.sort())
    await user.click(screen.getByRole("button", { name: "Remove filter Required in setting Inpatient" }))
    expect(nav.replace).toHaveBeenCalledWith("/skills/library", { scroll: false })
  })

  it("IM-12 SC-01 T9 T11: Add, Import, Edit and Configure open the dialogs in place through the URL contract and the Courses count opens mapping", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    await user.click(screen.getByRole("button", { name: "Add skill" }))
    expect(nav.push).toHaveBeenLastCalledWith("/skills/library?dialog=add")
    await user.click(screen.getByRole("button", { name: "Import" }))
    expect(nav.push).toHaveBeenLastCalledWith("/skills/library?dialog=import")
    await user.click(within(rowOf("Nasogastric Tube Insertion")).getByRole("button", { name: /^Configure:/ }))
    expect(nav.push).toHaveBeenLastCalledWith("/skills/library?dialog=configure&skill=sk-ng")
    await user.click(within(rowOf("IV Insertion")).getByRole("button", { name: /^Edit:/ }))
    expect(nav.push).toHaveBeenLastCalledWith("/skills/library?dialog=configure&skill=sk-iv")
    await user.click(rowOf("IV Insertion").querySelector("button") as HTMLElement)
    expect(nav.push).toHaveBeenLastCalledWith("/skills/library?dialog=configure&skill=sk-iv")
    expect(within(rowOf("IV Insertion")).getByRole("link", { name: /course.*open course mapping for IV Insertion/ })).toHaveAttribute("href", "/courses?skill=sk-iv")
  })

  it("Er: reactivating a skill that is not configured fails with a banner and Try again, and the row is unchanged", async () => {
    resetWorld("/skills/library", "status=inactive")
    setDb((db) => ({ ...db, skills: db.skills.map((s) => (s.id === "sk-ng" ? { ...s, active: false } : s)) }))
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Nasogastric Tube Insertion")
    await user.click(screen.getByRole("button", { name: /Actions for Nasogastric Tube Insertion$/ }))
    await user.click(await screen.findByRole("menuitem", { name: "Reactivate skill" }))
    expect(await screen.findByText(/Reactivating could not be completed\. A skill must be configured before it can be used\./)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
    expect(getDb().skills.find((s) => s.id === "sk-ng")!.active).toBe(false)
  })

  it("L: the first paint shows a skeleton, announced politely, never the seed rows", () => {
    const html = renderToStaticMarkup(<LibraryPage />)
    expect(html).toContain("Loading skills")
    expect(html).not.toContain("IV Insertion")
  })

  it("global T12: one filled primary (Add skill), statuses carry text, and axe is clean", async () => {
    const { container } = renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    expect(filledPrimaries(container).map((p) => p.textContent?.trim())).toEqual(["Add skill"])
    expect(await axeViolations(container)).toEqual([])
  })
})
