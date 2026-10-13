// S-10 mapping selectors (CM-01..CM-08).
import type { CourseOffering, Db, Id, Requirement, Skill, Term } from "@/lib/domain/types"
import { isConfigured } from "@/lib/engine"
import { norm } from "../derive"
import { offeringLabel } from "./shared"

export interface OfferingFilters {
  q?: string
  cohortId?: Id
  term?: Term
  academicYear?: string
  professionalYear?: 1 | 2 | 3
  /** Entry mode from S-04 "Courses": only offerings where this skill is mapped. */
  skillId?: Id
}

export interface OfferingRow {
  offering: CourseOffering
  cohortNames: string[]
  mapped: number
  mandatory: number
}

/** CM-02, CM-04. "mandatory / total" is what the list shows next to each offering. */
export function listOfferings(db: Db, f: OfferingFilters = {}): OfferingRow[] {
  const q = f.q ? norm(f.q) : ""
  const rows: OfferingRow[] = []
  for (const o of db.offerings) {
    if (q && !norm(`${o.code} ${o.name}`).includes(q)) continue
    if (f.cohortId && !o.cohortIds.includes(f.cohortId)) continue
    if (f.term && o.term !== f.term) continue
    if (f.academicYear && o.academicYear !== f.academicYear) continue
    if (f.professionalYear && o.professionalYear !== f.professionalYear) continue
    const maps = db.offeringSkillMaps.filter((m) => m.offeringId === o.id)
    if (f.skillId && !maps.some((m) => m.skillId === f.skillId)) continue
    rows.push({
      offering: o,
      cohortNames: o.cohortIds.map((id) => db.cohorts.find((c) => c.id === id)?.name ?? id),
      mapped: maps.length,
      mandatory: maps.filter((m) => m.requirement === "mandatory").length,
    })
  }
  return rows
}

export interface MappingRow {
  skill: Skill
  requirement: Requirement | null
  /** "Also mapped in ..." (CM-07: one student record is shared across courses). */
  alsoMappedIn: Array<{ offeringId: Id; label: string; requirement: Requirement }>
}

/**
 * The right-hand panel for one offering. Only configured, active skills are mappable (IM-09, SL-11);
 * unconfigured ones are counted so the panel can say so and link to the library.
 */
export function offeringMapping(db: Db, offeringId: Id): { rows: MappingRow[]; unconfiguredHidden: number } {
  const rows: MappingRow[] = []
  for (const skill of db.skills) {
    if (!skill.active || !isConfigured(skill)) continue
    const mine = db.offeringSkillMaps.find((m) => m.offeringId === offeringId && m.skillId === skill.id)
    const others = db.offeringSkillMaps
      .filter((m) => m.skillId === skill.id && m.offeringId !== offeringId)
      .map((m) => {
        const o = db.offerings.find((x) => x.id === m.offeringId)!
        return { offeringId: o.id, label: offeringLabel(o), requirement: m.requirement }
      })
    rows.push({ skill, requirement: mine?.requirement ?? null, alsoMappedIn: others })
  }
  return { rows, unconfiguredHidden: db.skills.filter((s) => !isConfigured(s)).length }
}
