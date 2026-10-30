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
