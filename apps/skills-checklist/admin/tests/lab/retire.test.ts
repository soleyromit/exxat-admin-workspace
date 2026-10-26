import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { buildAttainment } from "@/lib/lab/attainment"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { defaultSkillId, deletableSkillId, deleteImpact, intentEffects, retireImpact, validateListName } from "@/lib/lab/retire"

const seed = createSeed()

describe("deactivate, new list, delete (SL-11, CALL 10-09)", () => {
  const id = defaultSkillId(seed)
  const i = retireImpact(seed, id)!

  it("defaults to a skill with evidence, where delete is blocked with the count as the reason", () => {
    expect(i.evidence).toBeGreaterThan(0)
    expect(i.canDelete).toBe(false)
    expect(i.deleteBlocked).toMatch(/^[\d,]+ evaluations? (is|are) recorded against it$/)
  })

  it("allows delete only while nothing is recorded", () => {
    const free = deletableSkillId(seed)
    if (free) {
      const f = retireImpact(seed, free)!
      expect(f.evidence).toBe(0)
      expect(f.canDelete).toBe(true)
      expect(f.deleteBlocked).toBeNull()
    }
    expect(retireImpact(seed, "no-such-skill")).toBeNull()
  })

  it("counts students who have it now the same way Attainment does", () => {
    const m = buildAttainment(seed, EMPTY_SCOPE)
    const k = m.skills.find((s) => s.skillId === id)
    expect(i.requiredFor).toBe(k ? k.total : 0)
  })

  it("names what each intent changes", () => {
    expect(intentEffects("mistake", i).join(" ")).toMatch(/reactivate/)
    expect(intentEffects("mistake", i).join(" ")).toMatch(/kept/)
    expect(intentEffects("standard", i).join(" ")).toMatch(/new list/)
    expect(intentEffects("standard", i).join(" ")).toMatch(/old list keeps/)
  })

  it("lets a course mapping never block delete; it lists the courses to unmap (D-X15)", () => {
    const d = deleteImpact(seed, id)!
    expect(d.allowed).toBe(i.canDelete)
    expect(d.unmapFrom.length).toBe(i.courses)
    // A mapped skill with no evidence can still be deleted.
    const mappedFree = seed.skills.find((k) => seed.mappings.some((m) => m.skillId === k.id && m.level !== "not-expected") && retireImpact(seed, k.id)!.canDelete)
    if (mappedFree) {
      const f = deleteImpact(seed, mappedFree.id)!
      expect(f.allowed).toBe(true)
      expect(f.unmapFrom.length).toBeGreaterThan(0)
    }
  })

  it("validates the new list name", () => {
    expect(validateListName(" ", [])).toMatch(/Name/)
    expect(validateListName("Standard 6", ["standard 6"])).toMatch(/already/)
    expect(validateListName("Standard 6", [])).toBeNull()
  })
})
