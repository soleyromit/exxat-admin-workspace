/**
 * Add skills, variant H (D-ADD1117, Decided; Romit's handoff spec "Variant A, side panel"), rendered on the list's page with the shared store.
 * One Add skills button; Library tab with a source picker and search; Select all n not in this list; rows on the list disabled; Create only when nothing matches exactly;
 * a new skill joins Selected; Review with steppers and Required; Add puts Unsaved rows on the list; Discard leaves no new skill in the library; Save on a list students use
 * asks "Who gets these changes?"; A new list creates the list and says so in a banner.
 */
import * as React from "react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const nav = vi.hoisted(() => ({ pathname: "/lab/admin/skills-library", search: "variant=H" }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { LabProviders } from "@/components/lab/lab-frame"
import { AdminSkillsLibraryH } from "@/components/lab/screens/admin-skills-library-h"
import { ROW_STEP } from "@/components/lab/library/add-skills-h"
import { createV2Store } from "@/lib/v2/store"
import { diffLists, seedLists, type SkillList } from "@/lib/lab/lists"

beforeAll(() => {
  // Radix Select and Popover need these in jsdom.
  const p = window.HTMLElement.prototype as unknown as Record<string, unknown>
  p.hasPointerCapture ??= () => false
  p.releasePointerCapture ??= () => undefined
  p.scrollIntoView ??= () => undefined
})
afterEach(() => { cleanup(); window.localStorage.clear(); window.sessionStorage.clear() })

const NEW_NAME = "Zebra wound vac change"

// Each render carries the shell's result slot, where a LocalBanner lands when the title is out of view (jsdom has no layout).
async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  render(<><div data-result-slot="" /><LabProviders><AdminSkillsLibraryH /></LabProviders></>)
  const add = await screen.findByRole("button", { name: "Add skills" }, { timeout: 20000 })
  await user.click(add)
  return await screen.findByRole("dialog", { name: /Add skills/ }, { timeout: 10000 })
}

describe("Add skills H", () => {
  it("has one Add skills button and no split menu; the panel opens on Library with a source picker and a search", async () => {
    const user = userEvent.setup()
    render(<><div data-result-slot="" /><LabProviders><AdminSkillsLibraryH /></LabProviders></>)
    await screen.findByRole("button", { name: "Add skills" }, { timeout: 20000 })
    expect(screen.getAllByRole("button", { name: "Add skills" })).toHaveLength(1)
    expect(screen.queryByRole("button", { name: /More ways to add/ })).toBeNull()
    expect(screen.queryByText("Starting points")).toBeNull()
    await user.click(screen.getByRole("button", { name: "Add skills" }))
    const panel = await screen.findByRole("dialog", { name: /Add skills/ })
    // Approved draft (D-ADD1117-d): one title, one step line, one source control; no tabs, no step indicator.
    expect(within(panel).getByRole("heading", { name: /^Add skills to / })).toBeInTheDocument()
    expect(panel.querySelector("[data-h-step-line]")).toHaveTextContent("Step 1 of 2 · Choose")
    expect(within(panel).queryAllByRole("tab")).toHaveLength(0)
    // Draft7 (D-ADD1117-d): a controls band holds the mode switch, Skills from and the search with New skill.
    const band = panel.querySelector("[data-h-band]") as HTMLElement
    expect(within(band).getByRole("radio", { name: "Choose skills" })).toHaveAttribute("aria-checked", "true")
    expect(within(band).getByRole("combobox", { name: "Skills from" })).toHaveTextContent("Whole library")
    expect(within(band).getByRole("searchbox", { name: "Search skills" })).toHaveAttribute("placeholder", "Search skills")
    expect(within(band).getByRole("button", { name: "New skill" })).toBeInTheDocument()
    // Upload or paste: the band keeps only the switch; the results give way to the drop zone and the paste box. Choose skills returns.
    await user.click(within(band).getByRole("radio", { name: "Upload or paste" }))
    expect(within(panel).queryByRole("searchbox")).toBeNull()
    expect(panel.querySelector("[data-h-dropzone]")).toHaveTextContent("Drop a file here or Choose a file")
    expect(within(panel).getByRole("textbox", { name: "Or paste a list" })).toBeInTheDocument()
    expect(panel.textContent).not.toContain("No particular template")
    await user.click(within(panel).getByRole("radio", { name: "Choose skills" }))
    expect(within(panel).getByRole("searchbox", { name: "Search skills" })).toBeInTheDocument()
    expect(within(panel).getByRole("button", { name: "Review 0 skills" })).toBeDisabled()
    expect(within(panel).queryByRole("button", { name: /Keep browsing|Back to the library/ })).toBeNull()
  }, 90000)

  it("dragging a file over the panel on step 1 shows the drop overlay; dropping it reads the file", async () => {
    const user = userEvent.setup()
    const panel = await openPanel(user)
    const f = new File(["Arterial blood gas sampling\nPeak flow measurement"], "extra.txt", { type: "text/plain" })
    if (typeof (f as File & { text?: unknown }).text !== "function") Object.defineProperty(f, "text", { value: async () => "Arterial blood gas sampling\nPeak flow measurement" })
    const dataTransfer = { types: ["Files"], files: [f], items: [], dropEffect: "copy" }
    fireEvent.dragEnter(panel, { dataTransfer })
    expect(panel.querySelector("[data-h-drop-overlay]")).toHaveTextContent("Drop to read this file")
    fireEvent.drop(panel, { dataTransfer })
    expect(panel.querySelector("[data-h-drop-overlay]")).toBeNull()
    expect(await within(panel).findByRole("radio", { name: "Upload or paste" }, { timeout: 5000 })).toHaveAttribute("aria-checked", "true")
    await waitFor(() => expect(panel.querySelector("[data-h-import-rows]")).not.toBeNull(), { timeout: 5000 })
    // Demo mode (D-ADD1117-x): any file shows the sample, under the sample's name, never the dropped file's.
    expect(panel.querySelector("[data-h-file-name]")).toHaveTextContent("sample-nursing-skills.xlsx")
    expect(panel.textContent).not.toContain("extra.txt")
    expect(panel.textContent).not.toContain("Arterial blood gas sampling")
    expect(panel.querySelector('[data-h-import-row="Peak flow measurement"]')).not.toBeNull()
  }, 90000)

  it("Select all picks every skill not on the list; rows on the list are hidden until Show, then ticked and disabled", async () => {
    const user = userEvent.setup()
    const panel = await openPanel(user)
    const all = panel.querySelector<HTMLElement>("[data-h-select-all]")!
    const n = Number(all.getAttribute("data-h-select-all"))
    expect(n).toBeGreaterThan(0)
    expect(within(panel).getByText(`Select all ${n.toLocaleString("en-US")} not in this list`)).toBeInTheDocument()
    // In-list skills are hidden, and with an empty search there is no "already in list" link at all (D-ADD1117-v).
    expect(panel.querySelector("[data-h-in-list]")).toBeNull()
    expect(panel.querySelector("[data-h-already]")).toBeNull()
    // While searching, the link counts the in-list matches for that search; Show reveals them.
    const search = within(panel).getByRole("searchbox", { name: "Search skills" })
    await user.type(search, "a")
    const showToggle = await waitFor(() => { const el = panel.querySelector<HTMLElement>("[data-h-already]"); if (!el) throw new Error("no link yet"); return el })
    const m = Number(showToggle.getAttribute("data-h-already"))
    expect(showToggle.textContent).toBe(`Show ${m.toLocaleString("en-US")} already in list`)
    await user.click(showToggle)
    expect(panel.querySelector("[data-h-already]")!.textContent).toMatch(/^Hide \d+ already in list$/)
    // A long result draws its first rows; Show more draws the rest (scale, ROW_STEP).
    for (let i = 0; i < 5 && panel.querySelector("[data-h-show-more]"); i++) await user.click(panel.querySelector<HTMLElement>("[data-h-show-more]")!)
    expect(panel.querySelectorAll("[data-h-in-list]").length).toBe(m)
    const inList = panel.querySelector("[data-h-in-list]")
    expect(inList).not.toBeNull()
    const inListNames = [...panel.querySelectorAll<HTMLElement>("[data-h-in-list] label")].map((l) => l.textContent!)
    const box = within(inList as HTMLElement).getByRole("checkbox")
    expect(box).toBeDisabled()
    expect(box).toHaveAttribute("data-state", "checked")
    // A search that matches only in-list skills says so, with the link right under the message.
    // (A name whose search has no addable close matches.)
    let found = false
    for (const name of inListNames.slice(0, 12)) {
      await user.clear(search)
      // Past the 150 ms debounce: an empty search resets Show.
      await new Promise((r) => setTimeout(r, 250))
      await user.type(search, name)
      await new Promise((r) => setTimeout(r, 220))
      if (panel.querySelector("[data-h-none]")?.textContent?.includes("No skills to add match")) { found = true; break }
    }
    expect(found).toBe(true)
    expect(panel.querySelector("[data-h-none] [data-h-already]")?.textContent).toMatch(/^Show \d+ already in list$/)
    // D-ADD1117-e: no match at all is a placeholder naming the search, under the Create row; no sentence repeats the buttons.
    await user.clear(search)
    await new Promise((r) => setTimeout(r, 250))
    await user.type(search, "Zzqx")
    await waitFor(() => expect(panel.querySelector("[data-h-none]")?.textContent).toBe('No skills match "Zzqx"'))
    expect(panel.querySelector("[data-h-create]")?.compareDocumentPosition(panel.querySelector("[data-h-none]")!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(panel.textContent).not.toContain("import a file")
    // Clearing the search hides the in-list rows again and drops the link.
    await user.clear(search)
    await waitFor(() => expect(panel.querySelector("[data-h-already]")).toBeNull())
    await waitFor(() => expect(panel.querySelector("[data-h-group]")).not.toBeNull())
    expect(panel.querySelector("[data-h-in-list]")).toBeNull()
    // One grouping style (D-ADD1117-d): a heading above a bordered list; no row says "Not in a list".
    expect(panel.querySelector("[data-h-group]")?.nextElementSibling?.tagName).toBe("UL")
    expect(panel.textContent).not.toContain("Not in a list")
    await user.click(panel.querySelector<HTMLElement>("[data-h-select-all]")!)
    expect(panel.querySelector("[data-h-selected]")).toHaveAttribute("data-h-selected", String(n))
    // Step 1's footer says the count on the left, beside Review.
    expect(panel.querySelector("[data-h-footer-count]")).toHaveTextContent(`${n.toLocaleString("en-US")} selected`)
  }, 90000)

  it("New skill opens a form inside Created here and Add puts the skill there, ticked, with no tag; searching offers Create only with no exact match", async () => {
    const user = userEvent.setup()
    const panel = await openPanel(user)
    // The New skill button opens the form as the first row of Created here (shown even while empty).
    await user.click(within(panel).getByRole("button", { name: "New skill" }))
    const created = panel.querySelector("[data-h-created]") as HTMLElement
    expect(created.querySelector("[data-h-new-form]")).not.toBeNull()
    const nameBox = within(created).getByRole("textbox", { name: "Skill name" })
    expect(nameBox).toHaveFocus()
    // A name the library has is refused, with a way to select that skill instead.
    const existingName = panel.querySelector("[data-h-row] label")!.textContent!
    await user.type(nameBox, existingName)
    await user.keyboard("{Enter}")
    expect(within(created).getByRole("alert")).toHaveTextContent(`A skill called "${existingName}" already exists.`)
    expect(within(created).getByRole("button", { name: "Select it" })).toBeInTheDocument()
    // Esc cancels, the panel stays.
    await user.keyboard("{Escape}")
    expect(panel.querySelector("[data-h-new-form]")).toBeNull()
    expect(screen.getByRole("dialog", { name: /Add skills/ })).toBeInTheDocument()
    await user.click(within(panel).getByRole("button", { name: "New skill" }))
    await user.type(within(panel).getByRole("textbox", { name: "Skill name" }), "Zzz form created skill")
    await user.click(within(panel).getByRole("button", { name: "Add" }))
    const formRow = panel.querySelector('[data-h-new-row="Zzz form created skill"]') as HTMLElement
    expect(formRow.closest("[data-h-created]")).not.toBeNull()
    expect(within(formRow).getByRole("checkbox")).toHaveAttribute("data-state", "checked")
    expect(panel.querySelector("[data-h-new-form]")).toBeNull()
    const search = within(panel).getByRole("searchbox", { name: "Search skills" })
    const existing = panel.querySelector("[data-h-row] label")!.textContent!
    await user.type(search, existing.toUpperCase())
    await waitFor(() => expect(panel.querySelector("[data-h-rows]")!.getAttribute("data-h-rows")).not.toBe("0"))
    expect(panel.querySelector("[data-h-create]")).toBeNull()
    await user.clear(search)
    await user.type(search, NEW_NAME)
    const create = await within(panel).findByRole("button", { name: `Create "${NEW_NAME}" as a new skill` })
    await user.click(create)
    const row = panel.querySelector(`[data-h-new-row="${NEW_NAME}"]`) as HTMLElement
    expect(row).not.toBeNull()
    // Created skills sit under "Created here", first among the groups, with no New tag inside (the group says it).
    expect(panel.querySelector("[data-h-rows] [data-h-group]")).toHaveAttribute("data-h-group", "Created here")
    expect(row.closest("[data-h-created]")).not.toBeNull()
    expect(within(panel.querySelector("[data-h-created]") as HTMLElement).queryByText("New skill")).toBeNull()
    expect(panel.querySelector("[data-h-selected]")).toHaveAttribute("data-h-selected", "2")
  }, 90000)

  it("Review is step 2 with Back; rows show their own values; a category move regroups; a taken name blocks Add; Select all and the bar set several, with the result said above the bar; Add puts Unsaved rows on the list; Discard leaves no new skill in the library", async () => {
    const user = userEvent.setup()
    let panel = await openPanel(user)
    const search = within(panel).getByRole("searchbox", { name: "Search skills" })
    await user.type(search, NEW_NAME)
    await user.click(await within(panel).findByRole("button", { name: `Create "${NEW_NAME}" as a new skill` }))
    // And one library skill not on the list, once the cleared search has settled.
    const free = await waitFor(() => { const li = [...panel.querySelectorAll<HTMLElement>("[data-h-row]")].find((x) => !x.hasAttribute("data-h-in-list")); if (!li) throw new Error("no free row yet"); return li })
    await user.click(within(free).getByRole("checkbox"))
    // Step 2 (D-ADD1117-s, revised): Review is the next step in the same panel, titled by its count; Back returns with the selection kept.
    await user.click(within(panel).getByRole("button", { name: "Review 2 skills" }))
    expect(panel.querySelector("[data-h-step-line]")).toHaveTextContent("Step 2 of 2 · Review")
    // The summary counts by source: one picked in the library, one typed here.
    expect(panel.querySelector("[data-h-summary]")).toHaveAttribute("data-h-summary", "2 skills: 1 from library · 1 new")
    // Back leads with an arrow (Romit 2026-11-17, D-ADD1117-p), decorative to assistive tech.
    expect(within(panel).getByRole("button", { name: "Back" }).querySelector("i.fa-arrow-left[aria-hidden=true]")).not.toBeNull()
    await user.click(within(panel).getByRole("button", { name: "Back" }))
    expect(panel.querySelector("[data-h-step-line]")).toHaveTextContent("Step 1 of 2 · Choose")
    expect(within(panel).getByRole("combobox", { name: "Skills from" })).toHaveTextContent("Whole library")
    expect(panel.querySelector("[data-h-review-open]")).toHaveAttribute("data-h-selected", "2")
    await user.click(within(panel).getByRole("button", { name: "Review 2 skills" }))
    const review = panel.querySelector("[data-h-review]") as HTMLElement
    const rowOf = (name: string) => review.querySelector<HTMLElement>(`[data-h-review-row="${name}"]`)!
    const libName = [...review.querySelectorAll<HTMLElement>("[data-h-review-row]:not([data-h-review-new])")][0]!.getAttribute("data-h-review-row")!
    const groupOf = (name: string) => rowOf(name).closest("[data-h-review-group]")?.getAttribute("data-h-review-group")
    const toggle = (name: string) => user.click(rowOf(name).querySelector<HTMLElement>("[data-h-row-toggle]")!)
    // No For all strip (D-ADD1117-b); rows read-only until opened, each showing its own values; no evaluation method; the new skill has its tag, in No category.
    expect(review.querySelector("[data-h-batch]")).toBeNull()
    expect(review.querySelectorAll("[data-h-name]")).toHaveLength(0)
    expect(within(review).queryAllByRole("combobox", { name: /Evaluation method/ })).toHaveLength(0)
    expect(rowOf(NEW_NAME).querySelector("[data-h-new-tag]")).not.toBeNull()
    expect(groupOf(NEW_NAME)).toBe("No category")
    // D-ADD1117-u: every listed skill is included, so no boxes until Select; the shared values are said once in plain counts.
    expect(within(review).queryAllByRole("checkbox")).toHaveLength(0)
    expect(review.querySelector("[data-h-shared]")?.textContent).toMatch(/^1 new, 1 from the library · /)
    expect(review.querySelector("[data-h-change]")).toBeNull()
    expect(rowOf(libName).getAttribute("data-h-values")).toMatch(/^(\d+ times?|Times not set) · Required$/)
    // An edit in the open row shows in its values once closed; there is no "Use batch settings".
    await toggle(libName)
    const rowTimes = within(rowOf(libName)).getByRole("spinbutton", { name: "Times needed" })
    await user.clear(rowTimes)
    await user.type(rowTimes, "5")
    await user.click(within(rowOf(libName)).getByRole("checkbox", { name: "Required" }))
    expect(within(rowOf(libName)).queryByRole("button", { name: "Use batch settings" })).toBeNull()
    await toggle(libName)
    expect(rowOf(libName)).toHaveAttribute("data-h-values", "5 times · Optional")
    expect(within(rowOf(libName)).getByText("5 times · Optional")).toBeInTheDocument()
    // Moving the new skill to the library skill's category moves its row into that group, still open.
    const libGroup = groupOf(libName)!
    await toggle(NEW_NAME)
    await user.click(within(rowOf(NEW_NAME)).getByRole("combobox", { name: "Category" }))
    await user.click(await screen.findByRole("option", { name: libGroup }))
    expect(groupOf(NEW_NAME)).toBe(libGroup)
    expect(rowOf(NEW_NAME).querySelector("[data-h-row-editor]")).not.toBeNull()
    // A name another skill has is refused: the row says so, its closed form says Fix name, and Add opens it instead of adding.
    const nameBox = within(rowOf(NEW_NAME)).getByRole("textbox", { name: "Name" })
    await user.clear(nameBox)
    await user.type(nameBox, libName)
    expect(within(review).getByRole("alert")).toHaveTextContent(`A skill called "${libName}" already exists.`)
    await toggle(NEW_NAME)
    expect(rowOf(NEW_NAME).querySelector("[data-h-fix-name]")).not.toBeNull()
    await user.click(within(panel).getByRole("button", { name: "Add 2 skills" }))
    expect(screen.queryByText("2 unsaved changes")).toBeNull()
    await waitFor(() => expect(within(rowOf(NEW_NAME)).getByRole("textbox", { name: "Name" })).toHaveFocus())
    await user.clear(within(rowOf(NEW_NAME)).getByRole("textbox", { name: "Name" }))
    await user.type(within(rowOf(NEW_NAME)).getByRole("textbox", { name: "Name" }), NEW_NAME)
    expect(within(review).queryByRole("alert")).toBeNull()
    await toggle(NEW_NAME)
    // Several at once: Select all ticks both; the DS bar replaces the footer, with a neutral count; actions open menus and change nothing until a choice.
    await user.click(within(review).getByRole("button", { name: "Select" }))
    expect(within(review).getByRole("button", { name: "Done" })).toHaveAttribute("aria-pressed", "true")
    await user.click(within(review).getByRole("checkbox", { name: "Select all 2" }))
    expect(panel.querySelector("[data-h-bar]")).toHaveAttribute("data-h-bar", "2")
    expect(within(panel).queryByRole("button", { name: /^Add 2 skills$/ })).toBeNull()
    expect(panel.querySelector("[data-h-bar] [data-slot=badge]")?.closest("[data-exxat-bulk-bar]")?.className).toContain("[&_[data-slot=badge]]:bg-transparent")
    // Required: a menu; Optional sets both; the result is said right above the bar.
    await user.click(within(panel).getByRole("button", { name: "Required or optional for 2 skills" }))
    // The menu is titled by its question (D-ADD1117-p).
    expect(await screen.findByText("Set 2 skills as")).toBeInTheDocument()
    await user.click(await screen.findByRole("menuitemradio", { name: "Optional" }))
    expect(rowOf(libName)).toHaveAttribute("data-h-values", "5 times · Optional")
    expect(rowOf(NEW_NAME).getAttribute("data-h-values")).toMatch(/· Optional$/)
    const note = () => panel.querySelector("[data-h-bulk-note]")
    expect(note()).toHaveTextContent("2 skills set to optional.")
    expect(note()?.nextElementSibling).toHaveAttribute("data-h-bar", "2")
    // Times (D-ADD1117-p): a titled popover with the values now, quick picks, Other (text, no spinner), Cancel and Apply.
    const timesBefore = rowOf(NEW_NAME).getAttribute("data-h-values")!.split(" · ")[0]
    await user.click(within(panel).getByRole("button", { name: "Times needed for 2 skills" }))
    const pop = await waitFor(() => { const p = document.querySelector<HTMLElement>("[data-h-bar-times-popover]"); expect(p).not.toBeNull(); return p! })
    expect(within(pop).getByText("Times needed for 2 skills")).toBeInTheDocument()
    expect(pop.querySelector("[data-h-bar-times-now]")?.textContent).toMatch(/^Now: .*\(mixed\)$|^Now: \d+$/)
    expect(pop.querySelector("[data-h-bar-times-input]")).toHaveAttribute("type", "text")
    expect(within(pop).getByRole("button", { name: "Apply" })).toBeDisabled()
    // Cancel closes without change.
    await user.click(within(pop).getByRole("radio", { name: "2 times" }))
    expect(within(pop).getByRole("button", { name: "Apply" })).toBeEnabled()
    await user.click(within(pop).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(document.querySelector("[data-h-bar-times-popover][data-state=open]")).toBeNull())
    expect(rowOf(NEW_NAME).getAttribute("data-h-values")!.split(" · ")[0]).toBe(timesBefore)
    // Other out of range says so and cannot apply; a valid Other applies on Enter.
    await user.click(within(panel).getByRole("button", { name: "Times needed for 2 skills" }))
    const other = await waitFor(() => { const i = document.querySelector<HTMLElement>("[data-h-bar-times-popover][data-state=open] [data-h-bar-times-input]"); expect(i).not.toBeNull(); return i! })
    await user.type(other, "0")
    expect(screen.getByRole("alert")).toHaveTextContent(/^Enter 1 to \d+\.$/)
    await user.clear(other)
    await user.type(other, "4{Enter}")
    expect(rowOf(libName)).toHaveAttribute("data-h-values", "4 times · Optional")
    expect(rowOf(NEW_NAME)).toHaveAttribute("data-h-values", "4 times · Optional")
    expect(note()).toHaveTextContent("Times needed set to 4 for 2 skills.")
    // Category: a menu; choosing moves both.
    await user.click(within(panel).getByRole("button", { name: "Category for 2 skills" }))
    expect(await screen.findByText("Move 2 skills to")).toBeInTheDocument()
    await user.click(await screen.findByRole("menuitemradio", { name: "No category" }))
    expect(groupOf(libName)).toBe("No category")
    expect(groupOf(NEW_NAME)).toBe("No category")
    expect(note()).toHaveTextContent("Moved 2 to No category.")
    // Back to required for both, then Esc ends the selection and the footer returns; the panel stays.
    await user.click(within(panel).getByRole("button", { name: "Required or optional for 2 skills" }))
    await user.click(await screen.findByRole("menuitemradio", { name: "Required" }))
    await user.keyboard("{Escape}")
    expect(panel.querySelector("[data-h-bar]")).toBeNull()
    expect(within(panel).getByRole("button", { name: "Add 2 skills" })).toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: /Add skills/ })).toBeInTheDocument()
    // Remove from the bar ends the selection and offers Undo next to the footer; Undo brings the skill back; Remove again.
    await user.click(within(rowOf(libName)).getByRole("checkbox", { name: `Select ${libName}` }))
    await user.click(within(panel).getByRole("button", { name: "Remove 1 skill from this batch" }))
    expect(panel.querySelector("[data-h-bar]")).toBeNull()
    expect(note()).toHaveTextContent("1 removed.")
    await user.click(within(panel).getByRole("button", { name: "Undo" }))
    expect(panel.querySelector("[data-h-summary]")?.getAttribute("data-h-summary")).toMatch(/^2 skills/)
    await user.click(within(rowOf(libName)).getByRole("checkbox", { name: `Select ${libName}` }))
    await user.click(within(panel).getByRole("button", { name: "Remove 1 skill from this batch" }))
    expect(panel.querySelector("[data-h-summary]")?.getAttribute("data-h-summary")).toMatch(/^1 skill/)
    await user.click(within(panel).getByRole("button", { name: "Add 1 skill" }))
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /Add skills/ })).toBeNull())
    expect(await screen.findByText("1 unsaved change")).toBeInTheDocument()
    await waitFor(() => expect(document.querySelectorAll("[data-row-unsaved]").length).toBe(1), { timeout: 10000 })
    await user.click(screen.getByRole("button", { name: "Discard" }))
    expect(screen.queryByText("1 unsaved change")).toBeNull()
    expect(document.querySelectorAll("[data-row-unsaved]")).toHaveLength(0)
    // Nothing was written: the name is still free, so the panel offers to create it again.
    await user.click(screen.getByRole("button", { name: "Add skills" }))
    panel = await screen.findByRole("dialog", { name: /Add skills/ })
    await user.type(within(panel).getByRole("searchbox", { name: "Search skills" }), NEW_NAME)
    expect(await within(panel).findByRole("button", { name: `Create "${NEW_NAME}" as a new skill` })).toBeInTheDocument()
  }, 120000)

  it("Import duplicates (REQ IM-05, IM-06): Use library skill, Keep both and Replace carry into Review, apply only on Save; Discard leaves the library as it was", async () => {
    const user = userEvent.setup()
    const panel = await openPanel(user)
    // Library skills not on this list, by name.
    const free = [...panel.querySelectorAll<HTMLElement>("[data-h-row]:not([data-h-in-list]) label")].map((l) => l.textContent!).slice(0, 8)
    expect(free.length).toBeGreaterThan(2)
    const readPaste = async () => {
      await user.click(within(panel).getByRole("radio", { name: "Upload or paste" }))
      const box = within(panel).getByRole("textbox", { name: "Or paste a list" })
      await user.clear(box)
      await user.click(box)
      await user.paste(["Skill\tDescription", ...free.map((n) => `${n}\tFrom the file: ${n}`), "Zebra import only skill\t"].join("\n"))
      await user.click(within(panel).getByRole("button", { name: "Read the list" }))
    }
    const readPasteIn = async (p: HTMLElement) => {
      await user.click(within(p).getByRole("radio", { name: "Upload or paste" }))
      const box = within(p).getByRole("textbox", { name: "Or paste a list" })
      await user.click(box)
      await user.paste(["Skill\tDescription", ...free.map((n) => `${n}\tFrom the file: ${n}`), "Zebra import only skill\t"].join("\n"))
      await user.click(within(p).getByRole("button", { name: "Read the list" }))
    }
    const pickIn = async (p: HTMLElement, name: string, option: string) => {
      await user.click(within(p.querySelector<HTMLElement>(`[data-h-import-row="${name}"]`)!).getByRole("combobox", { name: `${name} is in the library` }))
      await user.click(await screen.findByRole("option", { name: option }))
    }
    await readPaste()
    // Every library match has the choice; the default is the library's own skill.
    const choiceRow = (name: string) => panel.querySelector<HTMLElement>(`[data-h-import-row="${name}"]`)!
    for (const n of free) expect(choiceRow(n).querySelector("[data-h-dup-choice]")).toHaveAttribute("data-h-dup-choice", "skip")
    const pick = async (name: string, option: string) => {
      await user.click(within(choiceRow(name)).getByRole("combobox", { name: `${name} is in the library` }))
      const opt = screen.queryByRole("option", { name: option })
      if (!opt) { await user.keyboard("{Escape}"); return false }
      await user.click(opt)
      return true
    }
    const keep = free[0]!
    expect(await pick(keep, "Keep both")).toBe(true)
    // Replace is offered only on a library skill with no evaluations recorded (the Add several rule).
    let replaced: string | null = null
    for (const n of free.slice(1)) if (await pick(n, "Replace")) { replaced = n; break }
    await user.click(within(panel).getByRole("button", { name: /^Review \d+ skills?$/ }))
    const review = panel.querySelector("[data-h-review]") as HTMLElement
    // Step 2 names the source in words: a pasted list, not "file".
    expect(panel.querySelector("[data-h-summary]")?.getAttribute("data-h-summary")).toContain("from a pasted list")
    expect(review.querySelector(`[data-h-review-row="${keep} (2)"] [data-h-new-tag]`)).not.toBeNull()
    expect(review.querySelector(`[data-h-review-row="${keep}"]`)).toBeNull()
    if (replaced) expect(review.querySelector(`[data-h-review-row="${replaced}"] [data-h-replaces]`)).toHaveTextContent("Replaces library skill")
    const count = review.querySelectorAll("[data-h-review-row]").length
    await user.click(within(panel).getByRole("button", { name: `Add ${count} skills` }))
    // Discard: nothing reached the library, so "{keep} (2)" is still free to create.
    await user.click(await screen.findByRole("button", { name: "Discard" }))
    await user.click(screen.getByRole("button", { name: "Add skills" }))
    const again = await screen.findByRole("dialog", { name: /Add skills/ })
    await user.type(within(again).getByRole("searchbox", { name: "Search skills" }), `${keep} (2)`)
    expect(await within(again).findByRole("button", { name: `Create "${keep} (2)" as a new skill` })).toBeInTheDocument()
    if (replaced) expect(document.body.textContent).not.toContain(`From the file: ${replaced}`)
    expect(replaced, "a library skill with no evaluations offers Replace").not.toBeNull()
    // Save: the same choices, applied for everyone on the list.
    await user.clear(within(again).getByRole("searchbox", { name: "Search skills" }))
    await readPasteIn(again)
    await pickIn(again, keep, "Keep both")
    await pickIn(again, replaced!, "Replace")
    await user.click(within(again).getByRole("button", { name: /^Review \d+ skills?$/ }))
    const n2 = again.querySelectorAll("[data-h-review-row]").length
    await user.click(within(again).getByRole("button", { name: `Add ${n2} skills` }))
    await user.click(await screen.findByRole("button", { name: "Save changes" }))
    await user.click(within(await screen.findByRole("dialog", { name: "Who gets these changes?" })).getByRole("button", { name: /Everyone on this list/ }))
    await waitFor(() => expect(screen.queryByText(/unsaved change/)).toBeNull())
    // Keep both made a second skill; Replace wrote the file's description onto the library skill.
    expect(document.querySelector(`[data-skill-link][title], a[data-skill-link]`)).not.toBeNull()
    expect([...document.querySelectorAll("a[data-skill-link]")].some((el) => el.textContent === `${keep} (2)`)).toBe(true)
    expect([...document.querySelectorAll("[data-row-description]")].some((el) => el.textContent === `From the file: ${replaced}`)).toBe(true)
  }, 180000)

  it("Save on a list students use asks who gets the changes; A new list creates the list and says the original is unchanged", async () => {
    const user = userEvent.setup()
    const panel = await openPanel(user)
    const free = [...panel.querySelectorAll<HTMLElement>("[data-h-row]")].find((li) => !li.hasAttribute("data-h-in-list"))!
    await user.click(within(free).getByRole("checkbox"))
    await user.click(within(panel).getByRole("button", { name: "Review 1 skill" }))
    await user.click(within(panel).getByRole("button", { name: "Add 1 skill" }))
    const title = document.querySelector("[data-list-title] h1")!.textContent!
    await user.click(await screen.findByRole("button", { name: "Save changes" }))
    const who = await screen.findByRole("dialog", { name: "Who gets these changes?" })
    expect(within(who).getByText(/students? already use this list\./)).toBeInTheDocument()
    expect(within(who).getByRole("button", { name: /Everyone on this list/ })).toBeInTheDocument()
    await user.click(within(who).getByRole("button", { name: /A new list/ }))
    const dlg = await screen.findByRole("dialog", { name: "A new list" })
    expect(within(dlg).getByRole("textbox", { name: "Name" })).toHaveValue(`${title}, new intake`)
    const create = within(dlg).getByRole("button", { name: "Create list" })
    expect(create).toBeDisabled()
    await user.click(within(dlg).getByRole("button", { name: /Who gets it/ }))
    const option = await screen.findAllByRole("option")
    await user.click(option.find((o) => o.getAttribute("data-h-who-option")?.startsWith("coh:")) ?? option[0]!)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(within(dlg).getByRole("button", { name: "Create list" })).toBeEnabled())
    await user.click(within(dlg).getByRole("button", { name: "Create list" }))
    expect(await screen.findByText(`New list created. ${title} is unchanged.`, {}, { timeout: 10000 })).toBeInTheDocument()
    expect(screen.queryByText(/unsaved change/)).toBeNull()
    // Skills from another list (D-X17): the new list is now another list here; choosing it changes the placeholder and the counts.
    const newName = `${title}, new intake`
    await user.click(screen.getByRole("button", { name: "Add skills" }))
    const p2 = await screen.findByRole("dialog", { name: /Add skills/ })
    const before = Number(p2.querySelector("[data-h-select-all]")?.getAttribute("data-h-select-all") ?? 0)
    await user.click(within(p2).getByRole("combobox", { name: "Skills from" }))
    await user.click(await screen.findByRole("option", { name: new RegExp(`^${newName.replace(/[,]/g, ",")} · \\d+ skills$`) }))
    expect(within(p2).getByRole("searchbox", { name: `Search in ${newName}` })).toHaveAttribute("placeholder", `Search in ${newName}`)
    // Its skills not on this list arrive selected; the row counts that source only.
    await waitFor(() => expect(p2.querySelector("[data-h-select-all]")).toHaveAttribute("data-h-select-all", "1"))
    expect(before).toBeGreaterThan(1)
  }, 120000)

  // Romit 2026-11-17 ("When I am selecting a skill list from the dropdown, shouldn't I see the skills?"): a list source reads whole.
  it("a source list whose skills are all on this list shows them all, ticked, disabled and In list; no Select all, no link, no empty state", async () => {
    const user = userEvent.setup()
    seedOneMoreList((clinical) => clinical.skillIds.slice(0, 6))
    const panel = await openPanel(user)
    await chooseSource(user, panel, "Subset list")
    await waitFor(() => expect(panel.querySelectorAll("[data-h-in-list]").length).toBe(6))
    for (const box of [...panel.querySelectorAll<HTMLElement>("[data-h-in-list] [role=checkbox]")]) {
      expect(box).toBeDisabled()
      expect(box).toHaveAttribute("data-state", "checked")
    }
    expect(panel.querySelectorAll("[data-h-row]").length).toBe(6)
    expect(panel.querySelector("[data-h-select-all]")).toBeNull()
    expect(panel.querySelector("[data-h-already]")).toBeNull()
    expect(panel.querySelector("[data-h-all-in]")).toBeNull()
    // Back to the whole library: in-list rows hide again.
    await user.click(within(panel).getByRole("combobox", { name: "Skills from" }))
    await user.click(await screen.findByRole("option", { name: "Whole library" }))
    await waitFor(() => expect(panel.querySelector("[data-h-in-list]")).toBeNull())
  }, 90000)

  it("a list source with skills to add shows every skill of the list: the ones to add, then the ones already here in place", async () => {
    const user = userEvent.setup()
    // The library skills this list does not have, read from a first render.
    let free: string[] = []
    {
      const panel = await openPanel(user)
      free = [...panel.querySelectorAll<HTMLElement>("[data-h-row]")].map((li) => li.getAttribute("data-h-row")!).slice(0, 2)
      cleanup()
      window.localStorage.clear()
    }
    expect(free.length).toBe(2)
    seedOneMoreList((clinical) => [...clinical.skillIds.slice(0, 6), ...free])
    const panel = await openPanel(user)
    await chooseSource(user, panel, "Subset list")
    // Arriving from the list selects what it holds that this list does not (spec 3.9); the rest is shown, In list, with no search typed.
    await waitFor(() => expect(panel.querySelector("[data-h-select-all]")).toHaveAttribute("data-h-select-all", "2"))
    expect(within(panel).getByText("Select all 2 not on this list")).toBeInTheDocument()
    expect(within(panel).getByRole("searchbox")).toHaveValue("")
    expect(panel.querySelectorAll("[data-h-in-list]").length).toBe(6)
    expect(panel.querySelectorAll("[data-h-row]").length).toBe(8)
    expect(panel.querySelector("[data-h-already]")).toBeNull()
  }, 120000)

  it("a long source draws the first rows and Show more draws the rest in order", async () => {
    const user = userEvent.setup()
    const panel = await openPanel(user)
    // The whole library with in-list rows shown is well over one step.
    await user.type(within(panel).getByRole("searchbox", { name: "Search skills" }), "a")
    const link = await waitFor(() => { const el = panel.querySelector<HTMLElement>("[data-h-already]"); if (!el) throw new Error("no link yet"); return el })
    await user.click(link)
    const more = await waitFor(() => { const el = panel.querySelector<HTMLElement>("[data-h-show-more]"); if (!el) throw new Error("no Show more"); return el })
    expect(panel.querySelectorAll("[data-h-row]").length).toBe(ROW_STEP)
    const rest = Number(more.getAttribute("data-h-show-more"))
    await user.click(more)
    await waitFor(() => expect(panel.querySelectorAll("[data-h-row]").length).toBe(Math.min(ROW_STEP * 4, ROW_STEP + rest)))
  }, 90000)

  it("Upload or paste (D-ADD1117-z, -x): the sample reads as a plain list, every line ticked under its heading; a name edits in place; a pasted letter is read as typed", async () => {
    const user = userEvent.setup()
    const panel = await openPanel(user)
    await user.click(within(panel).getByRole("radio", { name: "Upload or paste" }))
    await user.click(within(panel).getByRole("button", { name: "Use sample file" }))
    expect(panel.querySelector("[data-h-file-line]")).toHaveTextContent(/sample-nursing-skills\.xlsx\s*· \d+ lines/)
    // A plain list (Romit: "remove these unnecessary intelligence"): no verdict, no Not sure or Not added groups, no reason tags.
    expect(panel.querySelector("[data-h-verdict], [data-h-look], [data-h-skipped], [data-h-reason]")).toBeNull()
    expect(panel.querySelector("[data-h-import-rows]")).toHaveAttribute("data-h-import-rows", "24")
    expect([...panel.querySelectorAll("[data-h-import-category]")].map((g) => g.getAttribute("data-h-import-category"))).toEqual(["Airway", "Cardiac", "Medication", "Neurological"])
    // A heading the program does not have is tagged New category; no choice to make here (where skills go is changed in Review).
    expect(panel.querySelector('[data-h-import-category="Neurological"]')?.textContent).toContain("New category")
    expect(panel.querySelector('[data-h-import-category="Airway"]')?.textContent).not.toContain("New category")
    expect(within(panel).queryByRole("combobox", { name: /What to do with category/ })).toBeNull()
    // The library twin keeps the duplicate choice, Use library skill by default [REQ IM-06].
    expect(panel.querySelector('[data-h-import-row="Basic airway management"] [data-h-dup-choice]')).toHaveAttribute("data-h-dup-choice", "skip")
    expect(panel.querySelector("[data-h-review-open]")).toHaveAttribute("data-h-selected", "24")
    // Edit name in place: Esc leaves it, Enter keeps it; the row stays ticked.
    await user.click(within(panel).getByRole("button", { name: "Edit name: Peak flow measurement" }))
    await user.keyboard("{Escape}")
    expect(panel.querySelector('[data-h-import-row="Peak flow measurement"]')).not.toBeNull()
    expect(screen.getByRole("dialog", { name: /Add skills/ })).toBeInTheDocument()
    await user.click(within(panel).getByRole("button", { name: "Edit name: Peak flow measurement" }))
    const box = within(panel).getByRole("textbox", { name: "Skill name" })
    await user.clear(box)
    await user.type(box, "Peak expiratory flow measurement{Enter}")
    expect(panel.querySelector('[data-h-import-row="Peak expiratory flow measurement"] [role=checkbox]')).toHaveAttribute("data-state", "checked")
    // Untick one; Review counts what is ticked.
    await user.click(within(panel).getByRole("checkbox", { name: "Peak expiratory flow measurement" }))
    expect(panel.querySelector("[data-h-review-open]")).toHaveAttribute("data-h-selected", "23")
    // A pasted letter is read as typed: every line a row, ticked; nothing is judged.
    await user.click(within(panel).getByRole("button", { name: "Replace" }))
    await user.click(within(panel).getByRole("textbox", { name: "Or paste a list" }))
    await user.paste(["Dear hiring team,", "I am writing to apply for the role at your clinic.", "---", "Design systems", "", "Sincerely,", "Robin Hale"].join("\n"))
    await user.click(within(panel).getByRole("button", { name: "Read the list" }))
    expect(panel.querySelector("[data-h-file-name]")).toHaveTextContent("Pasted list")
    expect([...panel.querySelectorAll("[data-h-import-row]")].map((r) => r.getAttribute("data-h-import-row"))).toEqual(["Dear hiring team,", "I am writing to apply for the role at your clinic.", "Design systems", "Sincerely,", "Robin Hale"])
    expect(within(panel).getByRole("button", { name: "Review 5 skills" })).toBeEnabled()
  }, 90000)

  it("a file heading the program does not have becomes a new category: tagged on the heading, its skills grouped under it in Review, created on Save", async () => {
    const user = userEvent.setup()
    const panel = await openPanel(user)
    await user.click(within(panel).getByRole("radio", { name: "Upload or paste" }))
    await user.click(within(panel).getByRole("button", { name: "Use sample file" }))
    expect(panel.querySelector('[data-h-import-category="Neurological"]')?.textContent).toContain("New category")
    await user.click(within(panel).getByRole("button", { name: /^Review \d+ skills$/ }))
    expect(panel.querySelector('[data-h-review-row="Glasgow Coma Scale scoring"]')?.closest("[data-h-review-group]")?.getAttribute("data-h-review-group")).toBe("Neurological")
    // Not created yet: no row of the list's table names it before Save.
    expect([...document.querySelectorAll("tr, [role=row]")].some((r) => !r.closest("[data-h-panel]") && /Neurological/.test(r.textContent ?? ""))).toBe(false)
    await user.click(within(panel).getByRole("button", { name: /^Add \d+ skills$/ }))
    await user.click(await screen.findByRole("button", { name: "Save changes" }))
    await user.click(within(await screen.findByRole("dialog", { name: "Who gets these changes?" })).getByRole("button", { name: /Everyone on this list/ }))
    await waitFor(() => expect(screen.queryByText(/unsaved change/)).toBeNull())
    // Saved: the category exists, and the skill sits in it on the list.
    await waitFor(() => expect([...document.querySelectorAll("tr, [role=row]")].some((r) => !r.closest("[data-h-panel]") && /Neurological/.test(r.textContent ?? ""))).toBe(true))
  }, 120000)
})

/** A second list beside the seeded one, saved as the admin's own (as Save, A new list, or New skill list would leave it). */
function seedOneMoreList(pick: (clinical: SkillList) => string[]) {
  const store = createV2Store()
  store.hydrate()
  store.update((s) => {
    const base = seedLists(s)
    const clinical = base[0]!
    const sub: SkillList = { ...clinical, id: "list-subset", name: "Subset list", isDefault: false, groupIds: [], skillIds: pick(clinical), requiredIds: [] }
    return { ...s, listEdits: diffLists(base, [...base, sub], [sub]) }
  })
}

async function chooseSource(user: ReturnType<typeof userEvent.setup>, panel: HTMLElement, name: string) {
  await user.click(within(panel).getByRole("combobox", { name: "Skills from" }))
  await user.click(await screen.findByRole("option", { name: new RegExp(`^${name} · \\d+ skills?$`) }))
}
