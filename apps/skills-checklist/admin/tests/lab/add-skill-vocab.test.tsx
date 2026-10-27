import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { skillById } from "@/lib/v2/evidence-index"
import { isConfigured } from "@/lib/v2/population"
import { addVocab, ensureVocab, getVocabulary, setVocabActive } from "@/lib/v2/vocabulary"
import { addSkillsToStore, buildLibrary, draftToSkill, EMPTY_DRAFT, MODEL_OPTIONS, notConfiguredBlock, vocabPickerOptions } from "@/lib/lab/library"
import { LAB_MODEL_LABEL, ruleSentence, emptyRule, withModel } from "@/lib/lab/configure"
import { CategoryPicker, TagsPicker } from "@/components/lab/library/category-tag-pickers"

/**
 * Thursday steps A1 to A3 (Sankalp 2026-10-27): every Add a skill path reads the ONE vocabulary Settings edits [REQ SL-03 to
 * SL-06], a skill added by hand is in the shared store so Configure opens on it [REQ IM-12, IM-09], and one word per model.
 */
const seed = createSeed()
const AT = "2026-10-27T09:00:00Z"

describe("SL-05: categories and tags created while adding a skill join the shared list", () => {
  it("adds only names that are new, in any case, and returns the same state when nothing is new", () => {
    const existing = getVocabulary(seed).categories[0]!.name
    expect(ensureVocab(seed, "categories", [existing.toUpperCase(), " "], "u", AT)).toBe(seed)
    const s = ensureVocab(seed, "tags", ["Thoracic", "thoracic", "Patient safety"], "u", AT)
    expect(getVocabulary(s).tags.filter((e) => e.name.toLowerCase() === "thoracic")).toHaveLength(1)
    expect(getVocabulary(s).tags.length).toBe(getVocabulary(seed).tags.length + 1)
  })
})

describe("SL-03, SL-06: the pickers read the Settings vocabulary", () => {
  it("offers active entries only and names the inactive ones", () => {
    const r = addVocab(seed, "categories", "Respiratory care", "u", AT)
    if (!r.ok) throw new Error(r.error)
    const off = setVocabActive(r.state, "categories", r.entry!.id, false, "u", AT)
    if (!off.ok) throw new Error(off.error)
    const o = vocabPickerOptions(off.state)
    expect(o.categories).not.toContain("Respiratory care")
    expect(o.inactiveCategories).toEqual(["Respiratory care"])
    expect(o.categories.length).toBe(getVocabulary(seed).categories.length)
    expect(o.tags).toEqual(getVocabulary(seed).tags.map((e) => e.name))
  })

  it("a deactivated category already on the skill shows marked Inactive and is not re-created", async () => {
    render(<CategoryPicker id="c" labelId="cl" value="Respiratory care" options={["Airway"]} inactive={["Respiratory care"]} onChange={() => {}} />)
    expect(screen.getByRole("button").textContent).toContain("Inactive")
  })

  it("a deactivated tag stays as a chip marked Inactive", () => {
    render(<TagsPicker id="t" labelId="tl" value={["Thoracic", "Patient safety"]} options={["Patient safety"]} inactive={["Thoracic"]} onChange={() => {}} />)
    const chips = screen.getByRole("list", { name: "Chosen tags" })
    expect(chips.textContent).toContain("ThoracicInactive")
    expect(chips.textContent).not.toContain("Patient safetyInactive")
  })

  it("Create \"{typed}\" is offered in the category picker for a new name", async () => {
    const user = userEvent.setup()
    render(<CategoryPicker id="c" labelId="cl" value="" options={["Airway", "Cardiac"]} onChange={() => {}} />)
    await user.click(screen.getByRole("button"))
    await user.keyboard("Respiratory")
    const create = document.querySelector("[data-create-category]") as HTMLElement | null
    expect(create).not.toBeNull()
    expect(create!.closest("[hidden]")).toBeNull()
    expect(screen.queryByText("No category matches.")).toBeNull()
  })
})

describe("A1 to A3: a skill added by hand is in the shared store, Not configured", () => {
  const draft = { ...EMPTY_DRAFT, name: "Chest tube care", description: "Set up and monitor a chest drain.", category: "Respiratory care", tags: ["Thoracic"] }

  it("is a store skill Configure can open, with its description, category and tags, and no model", () => {
    const added = draftToSkill(draft, "lab-skill-x")
    const s = addSkillsToStore(seed, [added], "u", AT)
    const k = skillById(s, "lab-skill-x")!
    expect(k).toBeTruthy()
    expect(k.model).toBeNull()
    expect(isConfigured(k)).toBe(false)
    expect(k).toMatchObject({ description: "Set up and monitor a chest drain.", category: "Respiratory care", tags: ["Thoracic"] })
    const row = buildLibrary(s).find((r) => r.id === "lab-skill-x")!
    expect(row.status).toBe("not-configured")
    expect(facts(s).skillsNotConfigured).toBe(facts(seed).skillsNotConfigured + 1)
  })

  it("a blank category is stored as No category (category is optional)", () => {
    const s = addSkillsToStore(seed, [draftToSkill({ ...EMPTY_DRAFT, name: "Lone skill" }, "lab-skill-y")], "u", AT)
    expect(skillById(s, "lab-skill-y")!.category).toBe("No category")
  })

  it("the sheet's picked category is the skill's category even when only the section was set", () => {
    expect(draftToSkill({ ...EMPTY_DRAFT, name: "A", section: "Airway" }, "z").category).toBe("Airway")
  })
})

describe("One word per model and one sentence for the IM-09 stop", () => {
  it("the library names each model as Configure does", () => {
    for (const o of MODEL_OPTIONS) expect(o.label).toBe(LAB_MODEL_LABEL[o.value])
  })
  it("an unset frequency reads Not set yet, with no internal aside", () => {
    expect(ruleSentence({ ...withModel(emptyRule(), "binary"), qualifyingLabel: 0 })).toBe("Not set yet.")
  })
  it("the not-configured sentence says it cannot be sent or mapped", () => {
    expect(notConfiguredBlock(true)).toMatch(/cannot be sent or mapped\.$/)
  })
})
