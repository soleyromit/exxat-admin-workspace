import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }))
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => "/library/skills",
  useSearchParams: () => new URLSearchParams(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { ImportDialog } from "@/components/import"
import { CHOOSE_SOURCE, preparePaste } from "@/components/import/import-input"
import { proposeImport, skillHasEvidence, unconfiguredCount } from "@/lib/store"
import { getRuntime } from "@/lib/store/react"
import { importAiCopy, surface } from "@/lib/copy"
import { SAMPLE_LIST } from "@/lib/copy/r2-import"

// jsdom lacks these; the DS Select and Dialog call them.
if (typeof Element !== "undefined") {
  const proto = Element.prototype as unknown as Record<string, unknown>
  proto.hasPointerCapture ??= () => false
  proto.setPointerCapture ??= () => undefined
  proto.releasePointerCapture ??= () => undefined
  proto.scrollIntoView ??= () => undefined
}

/**
 * S-08 coverage restored after the re-skin (R2 replaced the page-based tests with a few dialog tests): every behaviour the
 * contract names is asserted again against the 1024px Import dialog. REQ ids are in the test names.
 */
const noContrast = { rules: { "color-contrast": { enabled: false } } }
const clean = async (el: HTMLElement) => expect((await axe.run(el, noContrast)).violations).toEqual([])

// A list with a heading, descriptions, one section-like heading that is NOT a skill, and two lines with no letters.
const SAMPLE = [
  "Clinical skills:",
  "Peripheral IV removal - Documentation of site condition",
  "Lead ECG acquisition - Lead placement and trace quality",
  "Wound irrigation",
  "SECTION 2: ADVANCED PROCEDURES",
].join("\n")

const rt = () => getRuntime()
const db = () => rt().getDb()

function propose(text: string, sourceName = "Pasted list", sourceKind: "paste" | "file" = "paste"): string {
  const r = rt().run((d, ctx) => proposeImport(d, { text, sourceName, sourceKind }, ctx))
  if (!r.ok) throw new Error(r.error.message)
  return r.value.batchId
}

/** The review step of the dialog for an existing draft. */
function renderReview(batchId: string) {
  const onOpenChange = vi.fn()
  const onImported = vi.fn()
  const view = render(
    <TooltipProvider>
      <ImportDialog open batchId={batchId} onOpenChange={onOpenChange} onImported={onImported} />
    </TooltipProvider>,
  )
  return { ...view, onOpenChange, onImported, container: screen.getByRole("dialog") as HTMLElement }
}

function renderInput() {
  const onOpenChange = vi.fn()
  const onImported = vi.fn()
  render(
    <TooltipProvider>
      <ImportDialog open onOpenChange={onOpenChange} onImported={onImported} />
    </TooltipProvider>,
  )
  return { onOpenChange, onImported, container: screen.getByRole("dialog") as HTMLElement }
}

const filledPrimaries = (el: HTMLElement) => Array.from(el.querySelectorAll('button[data-slot="button"][data-variant="default"]')).filter((b) => b.getAttribute("role") !== "checkbox" && (b.textContent ?? "").trim() !== "")

beforeEach(() => {
  window.localStorage.clear()
  rt().reset()
  nav.push.mockClear()
  nav.replace.mockClear()
})

describe("S-08 dialog step 1: input (IM-01, IM-02, IM-03, IM-12, IM-13)", () => {
  it("IM-01, IM-03: pasted text with no template opens a review and creates nothing", async () => {
    const before = db().skills.length
    renderInput()
    await userEvent.type(screen.getByPlaceholderText(/Skill, Description, Category/), "Alpha skill\nBeta skill - a description")
    await userEvent.click(screen.getByRole("button", { name: "Read the list" }))
    const batch = db().importBatches.at(-1)!
    expect(batch.status).toBe("review")
    expect(batch.rows.map((r) => r.name)).toEqual(["Alpha skill", "Beta skill"])
    expect(db().skills).toHaveLength(before)
    expect(await screen.findByText(/Review 2 skills found/)).toBeInTheDocument()
  })

  it("IM-02: a CSV file is accepted as a source", async () => {
    renderInput()
    const file = new File(["Skill,Description\nAlpha skill,First\nBeta skill,Second\n"], "skills.csv", { type: "text/csv" })
    await userEvent.upload((document.querySelector("input[type=file]") as HTMLElement), file)
    await userEvent.click(screen.getByRole("button", { name: "Read the list" }))
    await waitFor(() => expect(db().importBatches.at(-1)?.sourceName).toBe("skills.csv"))
    const batch = db().importBatches.at(-1)!
    expect(batch.sourceKind).toBe("file")
    expect(batch.rows.map((r) => r.name)).toEqual(["Alpha skill", "Beta skill"])
  })

  it("IM-02: spreadsheets, documents and PDFs are offered, and a format that cannot be read shows the error without faking it", async () => {
    renderInput()
    const input = document.querySelector("input[type=file]") as HTMLInputElement
    for (const ext of [".xlsx", ".docx", ".pdf"]) expect(input.accept).toContain(ext)
    await userEvent.type(screen.getByPlaceholderText(/Skill, Description, Category/), "Kept pasted line")
    await userEvent.upload(input, new File(["binary"], "list.xlsx", { type: "application/vnd.ms-excel" }))
    await userEvent.click(screen.getByRole("button", { name: "Read the list" }))
    // No import server here (jsdom): the spreadsheet is not read and the honest message says so; nothing is faked.
    expect(await screen.findByText(importAiCopy.fileReaderUnavailable)).toBeInTheDocument()
    // one assertive region only (the LocalBanner's own), not a wrapper that would read it twice
    expect(document.querySelectorAll('[role="alert"]')).toHaveLength(1)
    expect(db().importBatches.filter((b) => b.status === "review")).toHaveLength(0)
    expect(screen.getByPlaceholderText(/Skill, Description, Category/)).toHaveValue("Kept pasted line")
  })

  it("empty submit: says what to do instead of failing silently", async () => {
    renderInput()
    await userEvent.click(screen.getByRole("button", { name: "Read the list" }))
    expect(screen.getByText(CHOOSE_SOURCE)).toBeInTheDocument()
    expect(db().importBatches.filter((b) => b.status === "review")).toHaveLength(0)
  })

  it("IM-09, IM-13: the dialog says imported skills need configuration and makes no accuracy claim", () => {
    const { container } = renderInput()
    expect(screen.getByText(/Skills arrive unconfigured/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\bAI\b|smart|automatically|accurate|understood/i)
  })

  it("T14: exactly one filled primary on step 1 and no icon inside the primary button", () => {
    const { container } = renderInput()
    expect(filledPrimaries(container)).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Read the list" }).querySelector("i, svg")).toBeNull()
  })

  it("preparePaste: a pasted header row is skipped by the store, line numbers are kept and the source stays 'pasted list'", () => {
    const p = preparePaste(SAMPLE_LIST)
    expect(p).toMatchObject({ sourceName: "pasted list", columns: true, skipHeader: true })
    expect(p.text).toBe(SAMPLE_LIST)
    expect(preparePaste("Alpha skill\nBeta skill")).toEqual({ text: "Alpha skill\nBeta skill", sourceName: "pasted list" })
  })

  it("IM-04: the prototype's sample (with a header row) reads 8 skills with 'Line 9' unread, and the header is not listed as unread", async () => {
    renderInput()
    await userEvent.click(screen.getByRole("button", { name: "Paste a sample list" }))
    await userEvent.click(screen.getByRole("button", { name: "Read the list" }))
    await screen.findByText("Review 8 skills found in pasted list")
    expect(screen.getByRole("dialog").textContent).toContain("Line 9: SECTION 2 — ADVANCED PROCEDURES")
    expect(screen.getByRole("dialog").textContent).not.toContain("Line 1: Skill")
  })

  it("has no axe violations on step 1", async () => {
    const { container } = renderInput()
    await clean(container)
  })
})

describe("S-08 dialog step 2: review (IM-04..IM-08, IM-13)", () => {
  it("IM-13: frames the list as a draft and shows the counters", async () => {
    const id = propose(SAMPLE)
    const { container } = renderReview(id)
    expect(await screen.findByText("Nothing is added until you confirm. Edit, exclude or rename anything before creating.")).toBeInTheDocument()
    // The prototype states it once (the dialog subtitle): no second copy of the line.
    expect(container.textContent!.match(/Nothing is added until you confirm/g)).toHaveLength(1)
    expect(container.textContent).not.toMatch(/\bAI\b|smart|automatically|accurate|understood/i)
    expect(screen.getByTestId("stat-found")).toHaveTextContent("3")
    expect(screen.getByTestId("stat-will-be-created")).toHaveTextContent("3")
    expect(screen.getByText("0 excluded")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Review 3 skills found in pasted list" })).toBeInTheDocument()
  })

  it("IM-04, IM-07: descriptions fill the description field and the heading is proposed as a category", async () => {
    const id = propose(SAMPLE)
    renderReview(id)
    expect(await screen.findByText("Documentation of site condition")).toBeInTheDocument()
    expect(screen.getByLabelText(/Create 1 new category from the groupings in this list/)).toBeChecked()
    expect(screen.getAllByText(/Clinical skills/).length).toBeGreaterThan(0)
  })

  it("T12 / SL-05: leaving the category opt-in unchecked creates no category", async () => {
    const id = propose(SAMPLE)
    const cats = db().categories.length
    renderReview(id)
    await userEvent.click(await screen.findByLabelText(/Create 1 new category/))
    await userEvent.click(screen.getByRole("button", { name: "Create 3 skills" }))
    expect(db().categories).toHaveLength(cats)
    expect(db().importBatches.find((b) => b.id === id)!.createdCategoryIds).toEqual([])
  })

  it("IM-08: every line that was not read is shown with its original text and reason, never dropped", async () => {
    const id = propose(SAMPLE)
    renderReview(id)
    const region = (await screen.findByRole("heading", { name: "1 lines were not read as skills" })).closest("section")!
    expect(within(region).getByText("SECTION 2: ADVANCED PROCEDURES")).toBeInTheDocument()
    expect(within(region).getByText("Looks like a section heading")).toBeInTheDocument()
    expect(within(region).getByText(/Line 5/)).toBeInTheDocument()
    // The three actions offered for an unread line.
    for (const name of ["Add as skill", "Add as category", "Ignore"]) expect(within(region).getByRole("button", { name })).toBeInTheDocument()
  })

  it("IM-08: when everything was read the region says so instead of disappearing", async () => {
    const id = propose("Alpha skill\nBeta skill")
    renderReview(id)
    expect(await screen.findByText(surface.s08.unreadNone)).toBeInTheDocument()
  })

  it("IM-08: an unread line can be added as a skill, and it joins the counters", async () => {
    const id = propose(SAMPLE)
    renderReview(id)
    await userEvent.click(await screen.findByRole("button", { name: "Add as skill" }))
    expect(db().importBatches.find((b) => b.id === id)!.rows.some((r) => /SECTION 2/.test(r.name))).toBe(true)
    expect(screen.getByText("Everything was read.")).toBeInTheDocument()
  })

  it("IM-08: an unread line can be added as a category choice, and the opt-in is switched on", async () => {
    const id = propose("Alpha skill\nBETA PROCEDURES")
    renderReview(id)
    await userEvent.click(await screen.findByRole("button", { name: "Add as category" }))
    expect(await screen.findByText(/"BETA PROCEDURES" is now available as a category/)).toBeInTheDocument()
    expect(db().importBatches.find((b) => b.id === id)!.createCategories).toBe(true)
  })

  it("IM-05: a name can be edited inline with Enter, and Escape cancels the edit", async () => {
    const id = propose("Alpha skill\nBeta skill")
    renderReview(id)
    await userEvent.click(await screen.findByRole("button", { name: /^Edit Skill name for Alpha skill: / }))
    const field = screen.getByLabelText("Skill name for Alpha skill")
    await userEvent.clear(field)
    await userEvent.type(field, "Alpha renamed{Escape}")
    expect(db().importBatches.find((b) => b.id === id)!.rows[0].name).toBe("Alpha skill")
    await userEvent.click(screen.getByRole("button", { name: /^Edit Skill name for Alpha skill: / }))
    const again = screen.getByLabelText("Skill name for Alpha skill")
    await userEvent.clear(again)
    await userEvent.type(again, "Alpha renamed{Enter}")
    expect(db().importBatches.find((b) => b.id === id)!.rows[0].name).toBe("Alpha renamed")
  })

  it("IM-05: a row can be excluded and included again", async () => {
    const id = propose("Alpha skill\nBeta skill")
    renderReview(id)
    await userEvent.click(await screen.findByLabelText("Include Alpha skill"))
    expect(db().importBatches.find((b) => b.id === id)!.rows[0].include).toBe(false)
    expect(screen.getByText("1 excluded")).toBeInTheDocument()
    expect(screen.getByTestId("stat-will-be-created")).toHaveTextContent("1")
    await userEvent.click(screen.getByLabelText("Include Alpha skill"))
    expect(db().importBatches.find((b) => b.id === id)!.rows[0].include).toBe(true)
  })

  it("IM-05: rows can be merged, split and added from the row menu", async () => {
    const id = propose("Alpha skill - first\nBeta skill - second")
    renderReview(id)
    // merge
    await userEvent.click(await screen.findByRole("button", { name: "Actions for Alpha skill" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "Merge with…" }))
    const mergeDialog = await screen.findByRole("dialog", { name: "Merge rows" })
    await userEvent.click(within(mergeDialog).getByRole("button", { name: "Merge rows" }))
    await waitFor(() => expect(db().importBatches.find((b) => b.id === id)!.rows).toHaveLength(1))
    expect(db().importBatches.find((b) => b.id === id)!.rows[0].description).toBe("first second")
    // split
    await userEvent.click(await screen.findByRole("button", { name: "Actions for Alpha skill" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "Split…" }))
    const splitDialog = await screen.findByRole("dialog", { name: "Split row" })
    const names = within(splitDialog).getByLabelText("Skill names, one per line")
    await userEvent.clear(names)
    await userEvent.type(names, "Alpha one{Enter}Alpha two")
    await userEvent.click(within(splitDialog).getByRole("button", { name: "Split row" }))
    await waitFor(() => expect(db().importBatches.find((b) => b.id === id)!.rows.map((r) => r.name)).toEqual(["Alpha one", "Alpha two"]))
    // add
    await userEvent.click(await screen.findByRole("button", { name: "Actions for Alpha one" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "Add a skill here…" }))
    const addDialog = await screen.findByRole("dialog", { name: "Add a skill" })
    await userEvent.type(within(addDialog).getByLabelText("Skill name"), "Gamma skill")
    await userEvent.click(within(addDialog).getByRole("button", { name: "Add skill" }))
    await waitFor(() => expect(db().importBatches.find((b) => b.id === id)!.rows.map((r) => r.name)).toContain("Gamma skill"))
  })

  it("IM-05, IM-13: Back after edits asks first, and discarding leaves the library untouched", async () => {
    const id = propose("Alpha skill\nBeta skill")
    const before = JSON.stringify(db().skills)
    renderReview(id)
    await userEvent.click(await screen.findByLabelText("Include Alpha skill"))
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    const dialog = await screen.findByRole("dialog", { name: surface.s08.discard.title })
    expect(within(dialog).getByText(surface.s08.discard.body)).toBeInTheDocument()
    // Keep editing leaves the draft open.
    await userEvent.click(within(dialog).getByRole("button", { name: surface.s08.discard.keep }))
    expect(db().importBatches.find((b) => b.id === id)!.status).toBe("review")
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    await userEvent.click(within(await screen.findByRole("dialog", { name: surface.s08.discard.title })).getByRole("button", { name: surface.s08.discard.confirm }))
    expect(db().importBatches.find((b) => b.id === id)!.status).toBe("cancelled")
    expect(JSON.stringify(db().skills)).toBe(before)
    // Back from the review returns to the input step of the same dialog.
    expect(await screen.findByText("Upload a file")).toBeInTheDocument()
  })

  it("Back with no edits leaves without a prompt", async () => {
    const id = propose("Alpha skill")
    renderReview(id)
    await userEvent.click(await screen.findByRole("button", { name: "Back" }))
    expect(screen.queryByRole("dialog", { name: surface.s08.discard.title })).toBeNull()
    expect(await screen.findByText("Upload a file")).toBeInTheDocument()
    expect(db().importBatches.find((b) => b.id === id)!.status).toBe("cancelled")
  })
})

describe("S-08 duplicates (IM-06, OD-13 safe default)", () => {
  it("IM-06: a name that matches the library offers skip, replace or keep both, defaulting to skip", async () => {
    const id = propose("Nasogastric Tube Insertion\nNew skill")
    renderReview(id)
    const group = await screen.findByRole("radiogroup", { name: "Decision for Nasogastric Tube Insertion" })
    expect(within(group).getByRole("radio", { name: "Skip" })).toBeChecked()
    expect(within(group).getByRole("radio", { name: "Replace" })).toBeEnabled()
    expect(within(group).getByRole("radio", { name: "Keep both" })).toBeEnabled()
    expect(screen.getByText(/"Nasogastric Tube Insertion" is already in your library\./)).toBeInTheDocument()
    expect(screen.getByTestId("stat-possible-duplicates")).toHaveTextContent("1")
  })

  it("IM-06 / OD-13: Replace is disabled, with the reason, when the existing skill already has evidence", async () => {
    expect(skillHasEvidence(db(), "sk-iv")).toBe(true)
    const id = propose("IV Insertion")
    renderReview(id)
    const group = await screen.findByRole("radiogroup", { name: "Decision for IV Insertion" })
    expect(within(group).getByRole("radio", { name: "Replace" })).toBeDisabled()
    expect(screen.getAllByText(surface.s08.replaceDisabled).length).toBeGreaterThan(0)
  })

  it("IM-06: Skip creates nothing for that row, Keep both creates a second skill", async () => {
    const id = propose("Nasogastric Tube Insertion\nBlood Glucose Monitoring")
    const before = db().skills.length
    renderReview(id)
    await userEvent.click(await screen.findByRole("radio", { name: "Keep both", description: /./ }).catch(() => screen.getAllByRole("radio", { name: "Keep both" })[0]))
    await userEvent.click(screen.getByRole("button", { name: /^Create \d+ skills?$/ }))
    // First row kept both (created), second row skipped by default.
    expect(db().skills).toHaveLength(before + 1)
  })

  it("filter: show only rows that need attention", async () => {
    const id = propose("Nasogastric Tube Insertion\nPlain new skill")
    renderReview(id)
    await userEvent.click(await screen.findByLabelText("Show only rows that need attention"))
    expect(screen.queryByText("Plain new skill")).toBeNull()
    expect(screen.getAllByText("Nasogastric Tube Insertion").length).toBeGreaterThan(0)
  })
})

describe("S-08 confirmation (IM-09, IM-10, IM-11, T13)", () => {
  it("IM-09, T13: skills are created unconfigured, with no model or criteria proposed", async () => {
    const id = propose(SAMPLE)
    const unconfiguredBefore = unconfiguredCount(db())
    renderReview(id)
    await userEvent.click(await screen.findByRole("button", { name: "Create 3 skills" }))
    const batch = db().importBatches.find((b) => b.id === id)!
    expect(batch.status).toBe("confirmed")
    expect(batch.createdSkillIds).toHaveLength(3)
    for (const sid of batch.createdSkillIds) {
      const s = db().skills.find((x) => x.id === sid)!
      expect(s.model).toBeNull()
      expect(s.importBatchId).toBe(id)
    }
    expect(unconfiguredCount(db())).toBe(unconfiguredBefore + 3)
  })

  it("IM-10: confirming closes the dialog and reports what was created, so the library can show the success and 'not configured' banners", async () => {
    const id = propose(SAMPLE)
    const { onImported, onOpenChange } = renderReview(id)
    await userEvent.click(await screen.findByRole("button", { name: "Create 3 skills" }))
    expect(onImported).toHaveBeenCalledWith(expect.objectContaining({ batchId: id, created: 3 }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("IM-11: a second import adds to the library without replacing it, and each skill is tied to its batch", async () => {
    const first = propose("First import skill")
    const r1 = renderReview(first)
    await userEvent.click(await screen.findByRole("button", { name: "Create 1 skill" }))
    r1.unmount()
    const count = db().skills.length
    const second = propose("Second import skill")
    renderReview(second)
    await userEvent.click(await screen.findByRole("button", { name: "Create 1 skill" }))
    expect(db().skills).toHaveLength(count + 1)
    const a = db().skills.find((s) => s.name === "First import skill")!
    const b = db().skills.find((s) => s.name === "Second import skill")!
    expect(a.importBatchId).toBe(first)
    expect(b.importBatchId).toBe(second)
    expect(a.importBatchId).not.toBe(b.importBatchId)
  })

  it("IM-09: imported skills cannot be mapped (the store refuses an unconfigured skill)", async () => {
    const id = propose("Unmappable skill")
    renderReview(id)
    await userEvent.click(await screen.findByRole("button", { name: "Create 1 skill" }))
    const sk = db().skills.find((s) => s.name === "Unmappable skill")!
    const { mapSkill } = await import("@/lib/store")
    const r = rt().run((d) => mapSkill(d, { offeringId: "off-350-f26", skillId: sk.id, requirement: "mandatory" }))
    expect(r.ok).toBe(false)
  })
})

describe("S-08 states (V, D, Bl, E, L)", () => {
  it("D: Create is disabled with a reason when no row is included", async () => {
    const id = propose("Alpha skill")
    renderReview(id)
    await userEvent.click(await screen.findByLabelText("Include Alpha skill"))
    const create = screen.getByRole("button", { name: "Create 0 skills" })
    expect(create).toBeDisabled()
    expect(screen.getByText("Include at least one row to create skills.")).toBeInTheDocument()
    expect(create).toHaveAccessibleDescription("Include at least one row to create skills.")
  })

  it("V / Bl: two included rows with the same name warn and block creating until resolved", async () => {
    const id = propose("Alpha skill\nAlpha skill")
    renderReview(id)
    // The repeated row starts excluded; including it creates the conflict.
    await userEvent.click(await screen.findAllByLabelText("Include Alpha skill").then((l) => l[1]))
    expect(await screen.findAllByText("Another included row has the same name.")).toHaveLength(2)
    const create = screen.getByRole("button", { name: /^Create 2 skills$/ })
    expect(create).toBeDisabled()
    expect(screen.getByText(/Two included rows have the same name/)).toBeInTheDocument()
  })

  it("E: a source with nothing readable says so and still lists what was not read", async () => {
    const id = propose("SECTION 1: HEADINGS ONLY")
    renderReview(id)
    expect(await screen.findByText(surface.s08.errorNothing.replace("Check the file, or paste the list.", "").trim(), { exact: false })).toBeInTheDocument()
    expect(screen.getByText("SECTION 1: HEADINGS ONLY")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create 0 skills" })).toBeDisabled()
  })

  it("Er: a failed create shows the error with Try again and keeps the draft", async () => {
    const id = propose("Nasogastric Tube Insertion")
    renderReview(id)
    // Force a Replace on a skill that gets evidence between review and confirm (race): the store refuses the create.
    await userEvent.click(await screen.findByRole("radio", { name: "Replace" }))
    const evidenceSkill = db().skills.find((s) => s.id === "sk-ng")!
    expect(evidenceSkill).toBeTruthy()
    const batch = db().importBatches.find((b) => b.id === id)!
    expect(batch.rows[0].duplicateChoice).toBe("replace")
    // Attach an evaluation so the store's confirm guard trips.
    const sub = db().submissions[0]
    rt().run((d) => ({ ok: true as const, db: { ...d, submissions: d.submissions.map((s, i) => (i === 0 ? { ...s, skillId: "sk-ng" } : s)) }, value: undefined }))
    void sub
    await userEvent.click(screen.getByRole("button", { name: /^Update 1 skill$/ }))
    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
    expect(db().importBatches.find((b) => b.id === id)!.status).toBe("review")
  })

  it("L: shows a skeleton until the store has hydrated, then the review", async () => {
    const id = propose("Alpha skill")
    const { container } = renderReview(id)
    // The first paint is the skeleton (aria-busy); after mount the review is there.
    expect(container.querySelector("[aria-busy='true']") !== null || screen.queryByText(/Nothing is added until you confirm/) !== null).toBe(true)
    expect(await screen.findByText(/Nothing is added until you confirm/)).toBeInTheDocument()
  })

  it("an unknown or discarded import shows a neutral message and a way to start again", async () => {
    renderReview("imp-does-not-exist")
    expect((await screen.findAllByText("This import is not open for review")).length).toBeGreaterThan(0)
  })
})

describe("S-08 accessibility (WCAG 2.1 AA, keyboard path)", () => {
  it("T14: exactly one filled primary on the review step", async () => {
    const id = propose(SAMPLE)
    const { container } = renderReview(id)
    await screen.findByRole("button", { name: "Create 3 skills" })
    const primaries = filledPrimaries(container)
    expect(primaries).toHaveLength(1)
    expect(primaries[0]).toHaveTextContent("Create 3 skills")
  })

  it("match status is text, not colour only, and every control has an accessible name", async () => {
    const id = propose("Nasogastric Tube Insertion\nPlain new skill")
    const { container } = renderReview(id)
    await screen.findByText("Possible duplicate")
    for (const el of container.querySelectorAll("input, button, [role=checkbox], [role=radio]")) {
      const name = el.getAttribute("aria-label") || el.textContent?.trim() || (el.id && container.querySelector(`label[for='${el.id}']`)?.textContent)
      expect(name, el.outerHTML.slice(0, 120)).toBeTruthy()
    }
  })

  it("has no axe violations on the review (default and with a duplicate)", async () => {
    const id = propose(SAMPLE + "\nNasogastric Tube Insertion")
    const { container } = renderReview(id)
    await screen.findByRole("button", { name: /^Create \d+ skills$/ })
    await clean(container)
  })

  it("has no axe violations on the confirmed state", async () => {
    const id = propose("Alpha skill")
    const { container } = renderReview(id)
    await userEvent.click(await screen.findByRole("button", { name: "Create 1 skill" }))
    await act(async () => {})
    await clean(container)
  })
})
