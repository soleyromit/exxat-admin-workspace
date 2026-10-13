// SAMPLE people and course offerings (deterministic). Names are generated; two students share a name
// on purpose (DEFECT-09: tables must disambiguate people with an extra field).
import type { Cohort, CourseOffering, Evaluator, Group, OfferingSkillMap, Student } from "@/lib/domain/types"
import { mulberry32 } from "@/lib/domain/ids"

export const COHORTS: Cohort[] = [
  { id: "coh-bsn26", name: "BSN 2026" },
  { id: "coh-bsn27", name: "BSN 2027" },
  { id: "coh-absn26", name: "ABSN 2026" },
]

export const GROUPS: Group[] = COHORTS.flatMap((c) =>
  ["A", "B", "C"].map((g) => ({ id: `grp-${c.id.slice(4)}-${g.toLowerCase()}`, cohortId: c.id, name: `Group ${g}` })),
)

export const EVALUATORS: Evaluator[] = [
  { id: "ev-delgado", name: "J. Delgado, RN", email: "j.delgado@example.org", roleId: "preceptor", active: true },
  { id: "ev-nakamura", name: "S. Nakamura, RN", email: "s.nakamura@example.org", roleId: "preceptor", active: true },
  { id: "ev-okonkwo", name: "M. Okonkwo, RN", email: "m.okonkwo@example.org", roleId: "preceptor", active: true },
  { id: "ev-whitfield", name: "A. Whitfield, RN", email: "a.whitfield@example.org", roleId: "preceptor", active: true },
  { id: "ev-castellano", name: "Dr. R. Castellano", email: "r.castellano@example.edu", roleId: "clinical_faculty", active: true },
  { id: "ev-bansal", name: "Dr. P. Bansal", email: "p.bansal@example.edu", roleId: "clinical_faculty", active: true },
]

const FIRST = ["Alex", "Maya", "Diego", "Amara", "Caleb", "Ivy", "Felix", "Lena", "Tobias", "Aisha", "Ethan", "Clara", "Samir", "Isla", "Jonah", "Yara", "Desmond", "Priya", "Marcus", "Noor"]
const LAST = ["Rivera", "Delgado", "Voss", "Prasad", "Kimura", "Fontaine", "Cardoza", "Ellery", "Odell", "Waverly", "Mensah", "Larsen", "Boone", "Quinn", "Beaumont", "Sandoval", "Ivanov", "Peterson", "Rios", "Castellano"]

/** Fixed names for the scenario students that the seed evidence scripts rely on. */
const NAMED: Record<number, string> = {
  1: "Olivia Martin",
  2: "Noah Zeller",
  3: "Priya Tran",
  4: "Jonah Nakamura",
  5: "Rina Okonkwo",
  6: "Marcus Ashford",
  7: "Elena Ferreira",
  9: "Milo Whitfield",
  10: "Nina Bansal",
  11: "Owen Ashford",
  20: "Owen Ashford", // same display name, different cohort (DEFECT-09)
}

const COHORT_OF = (n: number) => (n <= 14 ? "coh-bsn26" : n <= 27 ? "coh-bsn27" : "coh-absn26")

export function buildStudents(): Student[] {
  const rng = mulberry32(20261008)
  const out: Student[] = []
  for (let n = 1; n <= 40; n += 1) {
    const cohortId = COHORT_OF(n)
    const inCohort = n <= 14 ? n : n <= 27 ? n - 14 : n - 27
    const g = ["a", "b", "c"][(inCohort - 1) % 3]
    const name = NAMED[n] ?? `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`
    const id = `stu-${String(n).padStart(2, "0")}`
    out.push({
      id,
      name,
      email: `${id}@example.edu`,
      cohortId,
      groupId: `grp-${cohortId.slice(4)}-${g}`,
    })
  }
  return out
}

const off = (
  id: string,
  code: string,
  name: string,
  term: CourseOffering["term"],
  academicYear: string,
  professionalYear: CourseOffering["professionalYear"],
  cohortIds: string[],
): CourseOffering => ({ id, code, name, term, academicYear, professionalYear, cohortIds })

/** CM-01: same course across many terms and years; several offerings have no cohort enrolled yet. */
export const OFFERINGS: CourseOffering[] = [
  off("off-301-f26", "NURS 301", "Adult Health I", "Fall", "2026-2027", 1, ["coh-bsn27", "coh-absn26"]),
  off("off-301-s27", "NURS 301", "Adult Health I", "Spring", "2026-2027", 1, []),
  off("off-305-f26", "NURS 305", "Foundations of Clinical Practice", "Fall", "2026-2027", 1, []),
  off("off-305-s27", "NURS 305", "Foundations of Clinical Practice", "Spring", "2026-2027", 1, []),
  off("off-315-f26", "NURS 315", "Adult Health II", "Fall", "2026-2027", 2, ["coh-bsn27"]),
  off("off-315-s27", "NURS 315", "Adult Health II", "Spring", "2026-2027", 2, []),
  off("off-360-f26", "NURS 360", "Clinical Seminar", "Fall", "2026-2027", 2, []),
  off("off-360-u27", "NURS 360", "Clinical Seminar", "Summer", "2026-2027", 2, []),
  off("off-350-f25", "NURS 350", "Clinical Practicum", "Fall", "2025-2026", 3, ["coh-bsn26"]),
  off("off-350-f26", "NURS 350", "Clinical Practicum", "Fall", "2026-2027", 3, ["coh-bsn26", "coh-absn26"]),
  off("off-350-s27", "NURS 350", "Clinical Practicum", "Spring", "2026-2027", 3, []),
  off("off-350-u27", "NURS 350", "Clinical Practicum", "Summer", "2026-2027", 3, []),
  off("off-410-f26", "NURS 410", "Community Health", "Fall", "2026-2027", 3, ["coh-bsn26"]),
  off("off-410-s27", "NURS 410", "Community Health", "Spring", "2026-2027", 3, []),
]

const m = (offeringId: string, skillId: string, requirement: OfferingSkillMap["requirement"]): OfferingSkillMap => ({
  offeringId,
  skillId,
  requirement,
})

/** CM-03, CM-06: the same skill can be mandatory in one offering and not in another. */
export const MAPS: OfferingSkillMap[] = [
  m("off-301-f26", "sk-iv", "mandatory"),
  m("off-301-f26", "sk-foley", "mandatory"),
  m("off-301-f26", "sk-dressing", "mandatory"),
  m("off-301-f26", "sk-h2t", "nonMandatory"),
  m("off-315-f26", "sk-h2t", "mandatory"),
  m("off-315-f26", "sk-med", "mandatory"),
  m("off-315-f26", "sk-vitals", "nonMandatory"),
  m("off-315-f26", "sk-trach", "mandatory"),
  m("off-350-f25", "sk-iv", "mandatory"),
  m("off-350-f25", "sk-foley", "mandatory"),
  m("off-350-f25", "sk-wound", "nonMandatory"),
  m("off-350-f26", "sk-iv", "mandatory"),
  m("off-350-f26", "sk-foley", "mandatory"),
  m("off-350-f26", "sk-med", "mandatory"),
  m("off-350-f26", "sk-wound", "mandatory"),
  m("off-350-f26", "sk-recon", "nonMandatory"),
  m("off-410-f26", "sk-med", "nonMandatory"),
  m("off-410-f26", "sk-vitals", "mandatory"),
  m("off-410-f26", "sk-recon", "nonMandatory"),
  m("off-410-f26", "sk-h2t", "mandatory"),
  m("off-410-f26", "sk-o2", "nonMandatory"),
]
