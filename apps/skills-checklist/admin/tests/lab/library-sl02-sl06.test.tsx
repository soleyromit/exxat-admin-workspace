import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createSeed } from "@/lib/v2/seed"
import { getVocabulary, setVocabActive } from "@/lib/v2/vocabulary"
import { buildLibrary, draftToSkill, EMPTY_DRAFT, parseSeveral, severalDrafts, vocabPickerOptions } from "@/lib/lab/library"
import { CategoryName, TagBadges, tagLineText } from "@/components/lab/library/category-tag-pickers"

/**
 * Library gaps from the Oct 27 audit (req-coverage-lab.md section 2, P0 rows 2 and 3, P1 rows 23 and 24).
 * REQ SL-02 "A skill has a name, a description and an active/inactive status."
 * REQ SL-06 "Only active categories and tags are available for assignment. One already assigned but since deactivated remains on
 * the skill, identifiable as inactive, so it can be removed deliberately rather than disappearing."
 */
vi.mock("next/navigation", () => ({
  usePathname: () => "/lab/admin/skills-library",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
  redirect: vi.fn(),
}))

const seed = createSeed()
const AT = "2026-10-30T09:00:00Z"

describe("SL-06: a deactivated category or tag stays on the skill, marked inactive, and is not offered", () => {
  const usedTag = getVocabulary(seed).tags.find((e) => seed.skills.some((k) => (k.tags ?? []).includes(e.name)))!
  const off = setVocabActive(seed, "tags", usedTag.id, false, "u", AT)
  if (!off.ok) throw new Error(off.error)

  it("is not offered in the Add a skill pickers once deactivated (one shared list)", () => {
    expect(vocabPickerOptions(seed).tags).toContain(usedTag.name)
    const o = vocabPickerOptions(off.state)
    expect(o.tags).not.toContain(usedTag.name)
    expect(o.inactiveTags).toContain(usedTag.name)
  })

  it("stays on every library row that carries it, listed in inactiveTags", () => {
    const rows = buildLibrary(off.state).filter((r) => r.tags.includes(usedTag.name))
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) expect(r.inactiveTags).toEqual([usedTag.name])
    expect(buildLibrary(seed).every((r) => r.inactiveTags.length === 0 && !r.categoryInactive)).toBe(true)
  })

  it("marks a deactivated category on its rows", () => {
    const cat = getVocabulary(seed).categories.find((e) => seed.skills.some((k) => k.category === e.name))!
    const r = setVocabActive(seed, "categories", cat.id, false, "u", AT)
    if (!r.ok) throw new Error(r.error)
    const rows = buildLibrary(r.state).filter((x) => x.category === cat.name)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((x) => x.categoryInactive)).toBe(true)
  })

  it("typing a deactivated tag's exact name and pressing Enter does not assign it", async () => {
    const { TagsPicker } = await import("@/components/lab/library/category-tag-pickers")
    const onChange = vi.fn()
    render(<TagsPicker id="t" labelId="tl" value={[]} options={["Wound care"]} inactive={["Patient safety"]} onChange={onChange} />)
    const box = screen.getByRole("combobox")
    await userEvent.type(box, "patient safety")
    expect(screen.getByRole("option", { name: /patient safety/i })).toHaveAttribute("aria-disabled", "true")
    await userEvent.keyboard("{Enter}")
    await userEvent.type(box, ",")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("renders the mark as glyph plus word, not colour alone", () => {
    render(<TagBadges tags={["Wound care", usedTag.name]} inactive={[usedTag.name]} />)
    expect(screen.getAllByText("Inactive")).toHaveLength(1)
    render(<CategoryName name="Nutrition" inactive />)
    expect(screen.getAllByText("Inactive")).toHaveLength(2)
    expect(tagLineText(["A", "B"], ["b"])).toBe("A, B (inactive)")
  })
})

describe("SL-02: description in every add path", () => {
  it("sheet A, inline row B and the edit sheet: a draft's description reaches the skill", () => {
    const a = draftToSkill({ ...EMPTY_DRAFT, name: "Chest tube care", description: "Dressing and drainage checks" }, "x1")
    expect(a.description).toBe("Dressing and drainage checks")
    expect(draftToSkill({ ...EMPTY_DRAFT, name: "No text" }, "x2").description).toBeUndefined()
  })

  it("add several C: a sheet's Description cell and a typed one both reach the draft", () => {
    const p = parseSeveral("Chest tube care\tRespiratory\t\tDrainage checks\nSuction", seed.skills.map((k) => k.name))
    const drafts = severalDrafts(p.items.map((it) => (it.name === "Suction" ? { ...it, description: "Oral and tracheal" } : it)), { category: "", tags: [] })
    expect(drafts.map((d) => d.description)).toEqual(["Drainage checks", "Oral and tracheal"])
  })
})

describe("SL-02: the skill panel shows the description and edits it in place", () => {
  it("saves a new description through onSaveDescription", async () => {
    const { SkillPanel } = await import("@/components/lab/library/skill-panel")
    const row = buildLibrary(seed)[0]!
    const onSave = vi.fn()
    const handlers = { onEdit: vi.fn(), onDeactivate: vi.fn(), onReactivate: vi.fn(), onDelete: vi.fn(), onSaveDescription: onSave }
    render(<SkillPanel row={{ ...row, description: "" }} rows={[row]} handlers={handlers} onOpen={vi.fn()} onClose={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: /Add a description/ }))
    await userEvent.type(screen.getByLabelText(`Description of ${row.name}`), "Done at the bedside")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: row.id }), "Done at the bedside")
  }, 20000)
})

describe("SL-11: row actions split Deactivate from Replace, and Delete explains a block", () => {
  const handlers = () => ({ onEdit: vi.fn(), onDeactivate: vi.fn(), onReactivate: vi.fn(), onDelete: vi.fn() })

  it("an active row offers Deactivate and Replace with a new version; a blocked Delete is disabled with its reason described", async () => {
    const { RowActions } = await import("@/components/lab/library/row-actions")
    const row = { ...buildLibrary(seed)[0]!, status: "configured" as const, evidence: 3, canDelete: false }
    const h = handlers()
    render(<RowActions row={row} handlers={h} />)
    await userEvent.click(screen.getByRole("button", { name: `Actions for ${row.name}` }))
    expect(screen.queryByRole("menuitem", { name: /Deactivate or replace/ })).toBeNull()
    // Without an in-place handler, Replace links to the library's replace flow carrying the skill (not a generic lists page).
    expect(screen.getByRole("menuitem", { name: "Replace with a new version" })).toHaveAttribute("href", expect.stringContaining(`replace=${encodeURIComponent(row.id)}`))
    const del = screen.getByRole("menuitem", { name: "Delete" })
    expect(del).toHaveAttribute("data-disabled")
    expect(del).toHaveAttribute("data-variant", "destructive")
    expect(del).toHaveAccessibleDescription("Has 3 evaluations, so it cannot be deleted")
    await userEvent.click(screen.getByRole("menuitem", { name: "Deactivate" }))
    expect(h.onDeactivate).toHaveBeenCalledWith([row])
  }, 20000)

  it("Replace opens in place with the row when the page handles it", async () => {
    const { RowActions } = await import("@/components/lab/library/row-actions")
    const row = { ...buildLibrary(seed)[0]!, status: "configured" as const }
    const h = { ...handlers(), onReplace: vi.fn() }
    render(<RowActions row={row} handlers={h} />)
    await userEvent.click(screen.getByRole("button", { name: `Actions for ${row.name}` }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Replace with a new version" }))
    expect(h.onReplace).toHaveBeenCalledWith(row)
  }, 20000)

  it("an inactive row offers Reactivate and no Replace", async () => {
    const { RowActions } = await import("@/components/lab/library/row-actions")
    const row = { ...buildLibrary(seed)[0]!, status: "inactive" as const }
    render(<RowActions row={row} handlers={handlers()} />)
    await userEvent.click(screen.getByRole("button", { name: `Actions for ${row.name}` }))
    expect(screen.getByRole("menuitem", { name: "Reactivate" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Replace with a new version" })).toBeNull()
    expect(screen.queryByRole("menuitem", { name: "Deactivate" })).toBeNull()
  }, 20000)

  it("choosing from the menu does not reach the row's click handler (no skill panel behind the dialog)", async () => {
    const { RowActions } = await import("@/components/lab/library/row-actions")
    const row = { ...buildLibrary(seed)[0]!, status: "configured" as const }
    const onRowClick = vi.fn()
    const h = handlers()
    render(<div onClick={onRowClick}><RowActions row={row} handlers={h} /></div>)
    await userEvent.click(screen.getByRole("button", { name: `Actions for ${row.name}` }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Deactivate" }))
    expect(h.onDeactivate).toHaveBeenCalled()
    expect(onRowClick).not.toHaveBeenCalled()
  }, 20000)

  it("the Deactivate dialog shows what it withdraws before confirm (SL-11)", async () => {
    const { DeactivateDialog } = await import("@/components/lab/library/row-actions")
    const { retireImpact } = await import("@/lib/lab/retire")
    const row = buildLibrary(seed).find((r) => r.status === "configured" && r.courses > 0)!
    render(<DeactivateDialog rows={[row]} impactOf={(id) => retireImpact(seed, id)} onOpenChange={vi.fn()} onConfirm={vi.fn()} />)
    const i = retireImpact(seed, row.id)!
    expect(screen.getByText("Leaves courses").nextSibling).toHaveTextContent(String(i.courses))
    expect(screen.getByText("Evaluations kept").nextSibling).toHaveTextContent(i.evidence.toLocaleString("en-US"))
  }, 20000)

  it("the Deactivate dialog is a plain confirm with no reason step", async () => {
    const { DeactivateDialog } = await import("@/components/lab/library/row-actions")
    const row = { ...buildLibrary(seed)[0]!, evidence: 2 }
    const onConfirm = vi.fn()
    render(<DeactivateDialog rows={[row]} onOpenChange={vi.fn()} onConfirm={onConfirm} />)
    expect(screen.getByRole("alertdialog", { name: `Deactivate ${row.name}?` })).toHaveAccessibleDescription("Evaluations are kept, and you can reactivate it later.")
    expect(screen.queryByRole("radiogroup")).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }))
    expect(onConfirm).toHaveBeenCalledWith([row.id])
  }, 20000)
})
