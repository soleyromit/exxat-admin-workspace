import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { seedLists, studentGroups } from "@/lib/lab/lists"
import { configurationOf } from "@/lib/lab/program-settings"
import { NewListPage, ListSetupLevel } from "@/components/lab/admin-a/lists-new-page"
import { V2StoreProvider } from "@/lib/v2/react"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { FloatingSheetPanelContent } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import type { ListsModel } from "@/components/lab/admin-a/lists-parts"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {}, replace() {} }), usePathname: () => "/", useSearchParams: () => new URLSearchParams() }))
// Step 2 v3 renders the whole library (176 rows) per test; under the full suite's load a test can pass 5 s.
vi.setConfig({ testTimeout: 30000 })

/** ADMIN-D6 amendment a, b, e: name first, then skills; start from copies skills; configuring is a separate optional step. */
const state = labState(createSeed())
const lists = seedLists(state)
const model: ListsModel = {
  state, lists, groups: studentGroups(state), setLists: () => {}, addGroup: () => {}, renameGroup: () => {}, removeGroup: () => {}, applyNow: () => {},
}

/** Step 2 v3 puts focus in the search a frame after Next; wait for it so a later click is not undone by it. */
const settled = () => waitFor(() => expect(document.activeElement).toHaveAttribute("id", "new-skill-name"))
const active = state.skills.filter((k) => k.active !== false)
const pickedCount = () => Number(document.querySelector("[data-picked-count]")!.getAttribute("data-picked-count"))
const rowCount = () => Number(document.querySelector("[data-skill-rows]")!.getAttribute("data-skill-rows"))

describe("New skill list: name, then skills", () => {
  it("step 1 asks for the name only; Next with no name stays and says so", async () => {
    const user = userEvent.setup()
    render(<V2StoreProvider><NewListPage model={model} onClose={() => {}} onSaved={() => {}} /></V2StoreProvider>)
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument()
    expect(screen.queryByText(/skills on this list/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /^Next/ }))
    expect(await screen.findByText("Give the list a name.")).toBeInTheDocument()
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument()
  })
  it("a name moves on to adding skills, and Back keeps the name", async () => {
    const user = userEvent.setup()
    render(<V2StoreProvider><NewListPage model={model} onClose={() => {}} onSaved={() => {}} /></V2StoreProvider>)
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Spring 2027 skills")
    await user.click(screen.getByRole("button", { name: /^Next/ }))
    expect(await screen.findByText("Step 2 of 4 · Spring 2027 skills")).toBeInTheDocument()
    await settled()
    expect(pickedCount()).toBe(0)
    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Spring 2027 skills")
  })
  it("step 1 is the name only: no Start from and no hint lines", async () => {
    render(<V2StoreProvider><NewListPage model={model} onClose={() => {}} onSaved={() => {}} /></V2StoreProvider>)
    expect(screen.queryByRole("combobox", { name: "Start from" })).not.toBeInTheDocument()
    expect(screen.queryByText(/who has it|Or copy|replaced/i)).not.toBeInTheDocument()
  })
  it("Copy a list ticks that list's skills on the step itself, adds without removing, says so once, and Undo puts the selection back", async () => {
    const user = userEvent.setup()
    render(<V2StoreProvider><NewListPage model={model} onClose={() => {}} onSaved={() => {}} /></V2StoreProvider>)
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Copy of default")
    await user.click(screen.getByRole("button", { name: /^Next/ }))
    await screen.findByText("Step 2 of 4 · Copy of default")
    await settled()
    const def = lists.find((l) => l.isDefault)!
    // One skill not on the default list first, so the copy is seen to add to it rather than replace it.
    const keep = active.sort((a, b) => a.name.localeCompare(b.name)).find((k) => !def.skillIds.includes(k.id))!
    await user.click(screen.getByRole("checkbox", { name: keep.name }))
    expect(pickedCount()).toBe(1)
    await user.click(screen.getByRole("button", { name: /^Copy a list/ }))
    const item = await screen.findByRole("menuitem", { name: new RegExp(`^${def.name}`) })
    expect(item.textContent).toContain(String(def.skillIds.length))
    await user.click(item)
    const offered = active.filter((k) => def.skillIds.includes(k.id)).length
    // No level opens: the skills are ticked where they are.
    expect(document.querySelector("[data-new-list-library]")).toBeNull()
    expect(pickedCount()).toBe(offered + 1)
    expect(screen.getByRole("checkbox", { name: keep.name })).toBeChecked()
    expect(document.querySelector("[data-copied]")!.textContent).toContain(`Copied ${offered} from ${def.name}.`)
    await user.click(screen.getByRole("button", { name: "Undo" }))
    expect(pickedCount()).toBe(1)
    // Copying again adds nothing twice.
    await user.click(screen.getByRole("button", { name: /^Copy a list/ }))
    await user.click(await screen.findByRole("menuitem", { name: new RegExp(`^${def.name}`) }))
    await user.click(screen.getByRole("button", { name: /^Copy a list/ }))
    await user.click(await screen.findByRole("menuitem", { name: new RegExp(`^${def.name}`) }))
    expect(pickedCount()).toBe(offered + 1)
    expect(document.querySelector("[data-copied]")!.textContent).toContain(`Copied 0 from ${def.name}. ${offered} were already selected.`)
  })
})

/** ADMIN-D6a amendment 2026-11-15e (step 2 v3): the library is the step; the search finds, or adds when no skill has that name. */
describe("Step 2 v3: the library is the step", () => {
  const toStep2 = async (user: ReturnType<typeof userEvent.setup>) => {
    render(<V2StoreProvider><NewListPage model={model} onClose={() => {}} onSaved={() => {}} /></V2StoreProvider>)
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Fresh list")
    await user.click(screen.getByRole("button", { name: /^Next/ }))
    await screen.findByText(/^Step 2 of 4/)
    await settled()
    return screen.getByRole("textbox", { name: "Search or add a skill" })
  }
  it("arrival: every active skill listed with a box, All and Selected tabs, no method to choose and no drill-in", async () => {
    const user = userEvent.setup()
    const field = await toStep2(user)
    expect(field).toHaveAttribute("placeholder", "Search or add a skill")
    expect(rowCount()).toBe(active.length)
    expect(screen.getByRole("tab", { name: new RegExp(`^All\\s*${active.length}`) })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: /^Selected\s*0/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Choose skills" })).not.toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "Library" })).not.toBeInTheDocument()
    expect(screen.queryByText("Skills you add appear here.")).not.toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: `Select all ${active.length} skills` })).not.toBeChecked()
  })
  it("ticking puts a skill on, and the Selected tab shows only what is ticked, keeping an unticked row in view until the tab is left", async () => {
    const user = userEvent.setup()
    await toStep2(user)
    const [a, b] = active.sort((x, y) => x.name.localeCompare(y.name))
    await user.click(screen.getByRole("checkbox", { name: a.name }))
    await user.click(screen.getByRole("checkbox", { name: b.name }))
    expect(pickedCount()).toBe(2)
    await user.click(screen.getByRole("tab", { name: /^Selected/ }))
    expect(rowCount()).toBe(2)
    await user.click(screen.getByRole("checkbox", { name: a.name }))
    expect(pickedCount()).toBe(1)
    expect(rowCount()).toBe(2)
    await user.click(screen.getByRole("tab", { name: /^All/ }))
    await user.click(screen.getByRole("tab", { name: /^Selected/ }))
    expect(rowCount()).toBe(1)
  })
  it("a name no skill has: the search says so and offers to add it; Enter adds it ticked and keeps its name in the search", async () => {
    const user = userEvent.setup()
    const field = await toStep2(user)
    await user.type(field, "Zz brand new")
    expect(screen.getByText("No skill named “Zz brand new”.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add “Zz brand new” as a new skill" })).toBeInTheDocument()
    await user.keyboard("{Enter}")
    // The harness model is fixed, so the new row itself is checked in the browser; here the announcement and the count say it went on.
    expect(screen.getByText("Added Zz brand new.")).toHaveAttribute("role", "status")
    expect(field).toHaveValue("Zz brand new")
  })
  it("part of a name: the matches show, with Add as new under them; the exact name offers no add, and Enter ticks it", async () => {
    const user = userEvent.setup()
    const field = await toStep2(user)
    const lib = active.sort((a, b) => a.name.localeCompare(b.name))[0]
    await user.type(field, lib.name.slice(0, 4))
    expect(rowCount()).toBeGreaterThanOrEqual(1)
    expect(document.querySelector("[data-add-new]")).not.toBeNull()
    await user.clear(field)
    await user.type(field, lib.name)
    expect(document.querySelector("[data-add-new]")).toBeNull()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("checkbox", { name: lib.name })).toBeChecked()
    // Enter again on a name already ticked says so and keeps the text.
    await user.keyboard("{Enter}")
    expect(await screen.findByText(`${lib.name} is already on this list.`)).toBeInTheDocument()
    expect(field).toHaveValue(lib.name)
  })
  it("Esc with text clears the search and leaves the panel open", async () => {
    const user = userEvent.setup()
    const field = await toStep2(user)
    await user.type(field, "abc")
    await user.keyboard("{Escape}")
    expect(field).toHaveValue("")
    expect(screen.getByText(/^Step 2 of 4/)).toBeInTheDocument()
  })
  it("Save with nothing ticked says Select at least one skill under the tabs; the header box takes focus and is described by it; a tick clears it", async () => {
    const user = userEvent.setup()
    await toStep2(user)
    await user.click(screen.getByRole("button", { name: /^Save and continue/ }))
    const msg = await screen.findByText("Select at least one skill.")
    expect(msg).toHaveAttribute("id", "new-list-skills-error")
    const all = screen.getByRole("checkbox", { name: `Select all ${active.length} skills` })
    await waitFor(() => expect(all).toHaveFocus())
    expect(all).toHaveAttribute("aria-describedby", "new-list-skills-error")
    await user.click(screen.getByRole("checkbox", { name: active.sort((a, b) => a.name.localeCompare(b.name))[0].name }))
    expect(screen.queryByText("Select at least one skill.")).not.toBeInTheDocument()
  })
})

describe("Configure is its own optional step", () => {
  it("says how many skills are not configured, that they stay, and offers Configure skills without blocking Next", () => {
    const list = lists.find((l) => l.skillIds.length > 0)!
    const onNext = vi.fn()
    render(<V2StoreProvider><FloatingSheetPanel open><FloatingSheetPanelContent side="right" size="lg"><ListSetupLevel model={model} list={list} leaveRef={{ current: null }} onBack={() => {}} onNext={onNext} /></FloatingSheetPanelContent></FloatingSheetPanel></V2StoreProvider>)
    expect(screen.getByText(/Step 3 of 4 · Optional/)).toBeInTheDocument()
    const summary = document.querySelector("[data-configure-summary]")!
    const waiting = state.skills.filter((k) => list.skillIds.includes(k.id) && configurationOf(state, k) === "not-configured").length
    expect(Number(summary.getAttribute("data-configure-summary"))).toBe(waiting)
    // Adding is done: the step offers configuring and never requires it.
    expect(Boolean(screen.queryByRole("link", { name: /^Configure \d/ }))).toBe(waiting > 0)
    expect(screen.getByRole("button", { name: /^Next/ })).toBeEnabled()
  })
  it("a search over the rows narrows them by name, says n of N, and an empty result offers Clear search", async () => {
    const user = userEvent.setup()
    const list = lists.reduce((a, b) => (b.skillIds.length > a.skillIds.length ? b : a))
    render(<V2StoreProvider><FloatingSheetPanel open><FloatingSheetPanelContent side="right" size="lg"><ListSetupLevel model={model} list={list} leaveRef={{ current: null }} onBack={() => {}} onNext={() => {}} /></FloatingSheetPanelContent></FloatingSheetPanel></V2StoreProvider>)
    const rows = () => Number(document.querySelector("[data-list-setup-rows]")!.getAttribute("data-list-setup-rows"))
    const total = rows()
    expect(total).toBeGreaterThan(100)
    expect(document.querySelector("[data-list-setup-toolbar]")).toHaveClass("sticky")
    const search = screen.getByRole("textbox", { name: `Search skills on ${list.name}` })
    const target = state.skills.find((k) => list.skillIds.includes(k.id))!.name
    await user.type(search, target)
    expect(rows()).toBeGreaterThanOrEqual(1)
    expect(rows()).toBeLessThan(total)
    expect(screen.getByText(new RegExp(`^${rows()} of ${total} skills$`))).toBeInTheDocument()
    await user.clear(search)
    await user.type(search, "zzzz nothing")
    expect(rows()).toBe(0)
    await user.click(screen.getByText("Clear search", { selector: "button" }))
    expect(search).toHaveValue("")
    expect(rows()).toBe(total)
  })
})

/** Sankalp 2026-11-15 points 5 and 7 (ADMIN-D6a amendment 2026-11-15c). */
describe("Select all on the Add skills step, and Back from step 3", () => {
  it("the header box selects every skill shown and clears them again; with a search it acts on the matches only", async () => {
    const user = userEvent.setup()
    render(<V2StoreProvider><NewListPage model={model} onClose={() => {}} onSaved={() => {}} /></V2StoreProvider>)
    await user.type(screen.getByRole("textbox", { name: "Name" }), "All of them")
    await user.click(screen.getByRole("button", { name: /^Next/ }))
    await settled()
    const box = screen.getByRole("checkbox", { name: `Select all ${active.length} skills` })
    await user.click(box)
    expect(pickedCount()).toBe(active.length)
    expect(box).toBeChecked()
    await user.click(box)
    expect(pickedCount()).toBe(0)
    const word = active[0].name.split(" ")[0]
    await user.type(screen.getByRole("textbox", { name: "Search or add a skill" }), word)
    const n = rowCount()
    await user.click(screen.getByRole("checkbox", { name: `Select all ${n} matching` }))
    expect(pickedCount()).toBe(n)
  })
  it("the saved list opens again on step 2 with its name and skills, and Save and continue updates it rather than making another", async () => {
    const user = userEvent.setup()
    const list = lists.find((l) => !l.groupIds.length && !(l.studentIds ?? []).length && l.skillIds.length) ?? { ...lists[0], groupIds: [], studentIds: [] }
    const applied: Array<(ls: typeof lists) => typeof lists> = []
    const onSaved = vi.fn()
    const m: ListsModel = { ...model, applyNow: (f) => { applied.push(f as never) } }
    render(<V2StoreProvider><NewListPage model={m} editList={list} onClose={() => {}} onSaved={onSaved} /></V2StoreProvider>)
    expect(await screen.findByText(`Step 2 of 4 · ${list.name}`)).toBeInTheDocument()
    expect(document.querySelector("[data-picked-count]")!.getAttribute("data-picked-count")).toBe(String(state.skills.filter((k) => k.active !== false && list.skillIds.includes(k.id)).length))
    await user.click(screen.getByRole("button", { name: /^Save and continue/ }))
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: list.id }), expect.any(Number))
    const after = applied[0]([...lists, { ...list, groupIds: [], studentIds: [] }].filter((l, i, a) => a.findIndex((x) => x.id === l.id) === i))
    expect(after.filter((l) => l.name === list.name)).toHaveLength(1)
  })
})

