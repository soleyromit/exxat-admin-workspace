import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next/navigation", async () => (await import("./harness")).navigationMock)

import { LibraryPage } from "@/components/library/library-page"
import { surface } from "@/lib/copy"
import { r1 } from "@/lib/copy/r1-library"
import { tagRows } from "@/lib/store"
import { axeViolations, filledPrimaries, getDb, renderPage, resetWorld, setDb } from "./harness"

const s05 = surface.s05
const rowOf = (name: string) => screen.getByText(name, { selector: "td *" }).closest("tr") as HTMLElement
const setStatus = async (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, to: "Active" | "Inactive") => {
  await user.click(within(dialog).getByRole("combobox", { name: "Status" }))
  await user.click(await screen.findByRole("option", { name: to }))
}

describe("P-05 Categories tab", () => {
  beforeEach(() => resetWorld("/skills/library", "tab=categories"))

  it("prototype frame: intro bar verbatim, card title and subtitle, Add category, column set", async () => {
    renderPage(<LibraryPage />)
    expect(await screen.findByText(r1.categoriesIntro)).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Categories" })).toBeInTheDocument()
    expect(screen.getByText("Each skill belongs to at most one")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add category" })).toBeInTheDocument()
    const headers = within(document.querySelector("thead") as HTMLElement).getAllByRole("columnheader").map((h) => h.textContent?.trim()).filter(Boolean)
    expect(headers).toEqual(expect.arrayContaining(["Category", "Description", "Skills", "Status"]))
    expect(screen.getByRole("tab", { name: /^Categories \(/ })).toHaveAttribute("aria-selected", "true")
  })

  it("SL-01 T1: a new program has no categories and nothing is pre-supplied", async () => {
    setDb((db) => ({ ...db, categories: [], skills: db.skills.map((s) => ({ ...s, categoryId: null })) }))
    renderPage(<LibraryPage />)
    expect(await screen.findByRole("heading", { level: 2, name: s05.emptyCategories })).toBeInTheDocument()
    expect(document.querySelectorAll("tbody tr")).toHaveLength(0)
    expect(screen.getByText(/An import can propose categories from the headings in your list/)).toBeInTheDocument()
  })

  it("SL-03: the list shows name, description, a skills count that opens the skills list filtered by category, and a status in text", async () => {
    renderPage(<LibraryPage />)
    await screen.findByText("Category A")
    const a = rowOf("Category A")
    expect(within(a).getByText("Active")).toBeInTheDocument()
    const count = getDb().skills.filter((s) => s.categoryId === "cat-a").length
    expect(within(a).getByRole("link", { name: `${count} skills with category Category A` })).toHaveAttribute("href", "/skills/library?category=cat-a")
  })

  it("SL-05 T3: Add category (672px dialog: Name, Description, Status) creates it active and reports it in a banner (never a toast)", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Category A")
    await user.click(screen.getByRole("button", { name: "Add category" }))
    const dialog = await screen.findByRole("dialog", { name: "Add category" })
    expect(within(dialog).getByText("Each skill belongs to at most one category.")).toBeInTheDocument()
    expect(dialog.className).toMatch(/sm:max-w-\[672px\]/)
    expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveAttribute("placeholder", "Program-defined name")
    expect(within(dialog).getByRole("textbox", { name: "Description" })).toBeInTheDocument()
    expect(within(dialog).getByRole("combobox", { name: "Status" })).toHaveTextContent("Active")
    expect(within(dialog).getAllByRole("button").map((b) => b.textContent?.trim()).filter(Boolean)).toEqual(expect.arrayContaining(["Cancel", "Save"]))
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "Category D")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Category D added.")).toBeInTheDocument()
    expect(getDb().categories.find((c) => c.name === "Category D")?.active).toBe(true)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("SL-03 T7: a duplicate name (case-insensitive) is refused on blur and on Save, and nothing is created", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Category A")
    const before = getDb().categories.length
    await user.click(screen.getByRole("button", { name: "Add category" }))
    const dialog = await screen.findByRole("dialog")
    const name = within(dialog).getByRole("textbox", { name: "Name" })
    await user.type(name, "category a")
    await user.tab()
    expect(await within(dialog).findByText(s05.duplicate("category", "category a"))).toBeInTheDocument()
    expect(name).toHaveAttribute("aria-invalid", "true")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(getDb().categories).toHaveLength(before)
  })

  it("V: an empty name says what to do", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Category A")
    await user.click(screen.getByRole("button", { name: "Add category" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(within(dialog).getByText("Enter a name.")).toBeInTheDocument()
  })

  it("SL-06 T4: setting Status to Inactive in the dialog keeps the category on the skills that carry it, shows how many, and is never blocked; it can be reactivated", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Category A")
    const carrying = getDb().skills.filter((s) => s.categoryId === "cat-a").map((s) => s.id)
    await user.click(screen.getByRole("button", { name: "Category A: Edit" }))
    let dialog = await screen.findByRole("dialog", { name: "Edit category" })
    await setStatus(user, dialog, "Inactive")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Category A updated.")).toBeInTheDocument()
    const a = rowOf("Category A")
    expect(within(a).getByText("Inactive")).toBeInTheDocument()
    expect(within(a).getByText(`${carrying.length} skills still carry it.`)).toBeInTheDocument()
    expect(getDb().skills.filter((s) => s.categoryId === "cat-a").map((s) => s.id)).toEqual(carrying)
    // Focus returns to the row's Edit button, and the category can be reactivated the same way.
    expect(screen.getByRole("button", { name: "Category A: Edit" })).toHaveFocus()
    await user.click(screen.getByRole("button", { name: "Category A: Edit" }))
    dialog = await screen.findByRole("dialog", { name: "Edit category" })
    await setStatus(user, dialog, "Active")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(getDb().categories.find((c) => c.id === "cat-a")!.active).toBe(true)
  })

  it("Edit changes the name and description and reports it", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Category A")
    await user.click(screen.getByRole("button", { name: "Category A: Edit" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit category" })
    const name = within(dialog).getByRole("textbox", { name: "Name" })
    await user.clear(name)
    await user.type(name, "Category Alpha")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Category Alpha updated.")).toBeInTheDocument()
    expect(getDb().categories.find((c) => c.id === "cat-a")!.name).toBe("Category Alpha")
  })

  it("global: exactly one filled primary on the tab (Add category) and axe is clean", async () => {
    const { container } = renderPage(<LibraryPage />)
    await screen.findByText("Category A")
    expect(filledPrimaries(container).map((p) => p.textContent?.trim())).toEqual(["Add category"])
    expect(screen.queryByText("Add tag")).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })
})

describe("P-05 Tags tab", () => {
  beforeEach(() => resetWorld("/skills/library", "tab=tags"))

  it("prototype frame: intro bar verbatim, Tags card, Where each tag reaches card", async () => {
    renderPage(<LibraryPage />)
    expect(await screen.findByText(r1.tagsIntro)).toBeInTheDocument()
    expect(screen.getByText("Applied to any number of skills")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Where each tag reaches" })).toBeInTheDocument()
    expect(screen.getByText("A tag spanning several categories is doing the job a category cannot.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add tag" })).toBeInTheDocument()
  })

  it("SL-01 T5: a new program has no tags and no reach section", async () => {
    setDb((db) => ({ ...db, tags: [], skills: db.skills.map((s) => ({ ...s, tagIds: [] })) }))
    renderPage(<LibraryPage />)
    expect(await screen.findByRole("heading", { level: 2, name: s05.emptyTags })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Where each tag reaches" })).toBeNull()
  })

  it("SL-04 T2 T7: each tag's reach row states its skills and the categories it spans (a tag may span several)", async () => {
    renderPage(<LibraryPage />)
    await screen.findByRole("heading", { level: 2, name: "Where each tag reaches" })
    const expected = tagRows(getDb()).filter((r) => r.skillCount > 0)
    expect(expected.some((r) => r.categoriesSpanned > 1)).toBe(true)
    for (const r of expected) {
      const list = screen.getByRole("list", { name: `Skills with tag ${r.item.name}` })
      const li = list.closest("li") as HTMLElement
      expect(within(li).getByText(new RegExp(`${r.skillCount} skills across ${r.categoriesSpanned} categor`))).toBeInTheDocument()
      expect(within(list).getAllByRole("listitem")).toHaveLength(r.skillCount)
    }
  })

  it("SL-04 T1: any number of tags can be added and each reports a banner; the skills count links to the filtered skills list", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("Tag A", { selector: "td *" })
    for (const n of ["Tag E", "Tag F", "Tag G"]) {
      await user.click(screen.getByRole("button", { name: "Add tag" }))
      const dialog = await screen.findByRole("dialog", { name: "Add tag" })
      expect(within(dialog).getByText("Tags can be applied to any number of skills.")).toBeInTheDocument()
      await user.type(within(dialog).getByRole("textbox", { name: "Name" }), n)
      await user.click(within(dialog).getByRole("button", { name: "Save" }))
      expect(await screen.findByText(`${n} added.`)).toBeInTheDocument()
    }
    expect(getDb().tags.filter((t) => ["Tag E", "Tag F", "Tag G"].includes(t.name))).toHaveLength(3)
    expect(within(rowOf("Tag A")).getByRole("link", { name: /skills with tag Tag A/ })).toHaveAttribute("href", "/skills/library?tag=tag-a")
  })

  it("SL-06 T4: an inactive tag stays on its skills, is marked inactive in the list and the reach card, and has Edit to reactivate", async () => {
    renderPage(<LibraryPage />)
    await screen.findByText("Tag D", { selector: "td *" })
    const d = rowOf("Tag D")
    expect(within(d).getByText("Inactive")).toBeInTheDocument()
    expect(within(d).getByText(/1 skill still carries it\./)).toBeInTheDocument()
    expect(screen.getByText("Tag D (inactive)")).toBeInTheDocument()
    expect(within(d).getByRole("button", { name: "Tag D: Edit" })).toBeInTheDocument()
  })

  it("global: Add tag is the only filled primary and axe is clean", async () => {
    const { container } = renderPage(<LibraryPage />)
    await screen.findByText("Tag A", { selector: "td *" })
    expect(filledPrimaries(container).map((p) => p.textContent?.trim())).toEqual(["Add tag"])
    expect(await axeViolations(container)).toEqual([])
  })
})
