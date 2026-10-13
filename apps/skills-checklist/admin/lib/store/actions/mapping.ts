// S-10 mapping (CM-01..CM-08). Mapping expresses EXPECTATION, never eligibility (CM-05): nothing here
// restricts what a student may submit. Only configured, active skills can be mapped (IM-09, SL-11).
import type { Db, Id, Requirement } from "@/lib/domain/types"
import { isConfigured } from "@/lib/engine"
import { fail, ok, type Result } from "../result"

export function mapSkill(db: Db, input: { offeringId: Id; skillId: Id; requirement?: Requirement }): Result<{ requirement: Requirement }> {
  const off = db.offerings.find((o) => o.id === input.offeringId)
  const skill = db.skills.find((s) => s.id === input.skillId)
  if (!off || !skill) return fail("notFound", "Not found.")
  if (!skill.active || !isConfigured(skill)) return fail("skillNotUsable", "Only configured, active skills can be mapped.")
  const requirement = input.requirement ?? "mandatory"
  const has = db.offeringSkillMaps.some((m) => m.offeringId === off.id && m.skillId === skill.id)
  const maps = has
    ? db.offeringSkillMaps.map((m) => (m.offeringId === off.id && m.skillId === skill.id ? { ...m, requirement } : m))
    : [...db.offeringSkillMaps, { offeringId: off.id, skillId: skill.id, requirement }]
  return ok({ ...db, offeringSkillMaps: maps }, { requirement })
}

export function unmapSkill(db: Db, input: { offeringId: Id; skillId: Id }): Result {
  if (!db.offeringSkillMaps.some((m) => m.offeringId === input.offeringId && m.skillId === input.skillId)) return fail("notFound", "Not mapped.")
  // Evidence already recorded against this skill is untouched: mapping is expectation only (CM-05, CM-07).
  return ok({ ...db, offeringSkillMaps: db.offeringSkillMaps.filter((m) => !(m.offeringId === input.offeringId && m.skillId === input.skillId)) }, undefined)
}

/** CM-06: requirement level differs per offering for the same skill. */
export function setRequirement(db: Db, input: { offeringId: Id; skillId: Id; requirement: Requirement }): Result {
  if (!db.offeringSkillMaps.some((m) => m.offeringId === input.offeringId && m.skillId === input.skillId)) return fail("notFound", "Not mapped.")
  return ok(
    { ...db, offeringSkillMaps: db.offeringSkillMaps.map((m) => (m.offeringId === input.offeringId && m.skillId === input.skillId ? { ...m, requirement: input.requirement } : m)) },
    undefined,
  )
}

/**
 * OD-01 is OPEN (carry-forward vs catalogue default). This is a plain "copy mapping from another offering" helper:
 * it commits to no inheritance model, and only copies skills that are still usable.
 */
export function copyMappings(db: Db, input: { fromOfferingId: Id; toOfferingId: Id }): Result<{ copied: number }> {
  if (!db.offerings.some((o) => o.id === input.fromOfferingId) || !db.offerings.some((o) => o.id === input.toOfferingId)) return fail("notFound", "Not found.")
  let next = db
  let copied = 0
  for (const m of db.offeringSkillMaps.filter((x) => x.offeringId === input.fromOfferingId)) {
    const r = mapSkill(next, { offeringId: input.toOfferingId, skillId: m.skillId, requirement: m.requirement })
    if (r.ok) {
      next = r.db
      copied += 1
    }
  }
  return ok(next, { copied })
}
