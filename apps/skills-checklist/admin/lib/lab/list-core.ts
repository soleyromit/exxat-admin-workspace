/**
 * The part of a skill list every figure needs: which lists exist and who is on them. No achievement, no screens. lib/v2/population.ts reads this, so it imports nothing that
 * imports the population; lists.ts holds the rest and re-exports this file.
 */
import type { Person, V2State } from "@/lib/v2/types"
import { CUSTOM_GROUP_PREFIX, TRACK_GROUP_PREFIX, customGroup, customGroupsOf, matchesRule, parseCustomGroup, type CustomGroup } from "@/lib/v2/filters"

export interface SkillList {
  id: string
  name: string
  /** The program's noun for what this list holds ("skill", "competency"). */
  noun: string
  nounPlural: string
  skillIds: string[]
  requiredIds: string[]
  /** Attached automatically to every new cohort. */
  isDefault: boolean
  /** Student groups the list applies to. */
  groupIds: string[]
  /** Students named on the list one by one, or found by a filter when they were added (a snapshot [INFER]; no later student joins by matching). Sankalp 11-04, 365abc25 ch 9. */
  studentIds?: string[]
  /** Completion rule: every required one achieved and at least this many achieved in total. */
  minTotal: number
  /** The standard this list measures, shown under the name. */
  standard: string
  /** The first list this one is a new version of ("New version" copies a list with no one on it; a list on a group or student is not edited in place). */
  versionOf?: string
  /**
   * Retired (D-L59): skills once assigned one at a time, stored as a list with id `ind:<groupId>`. A whole list is assigned now, so
   * no new one is made and a stored one is dropped on load (applyListsOverlay), counting in nothing.
   */
  individual?: boolean
}

export type GroupKind = "cohort" | "track" | "custom" | "all"

export interface StudentGroup {
  id: string
  label: string
  kind: GroupKind
  studentIds: string[]
}

export interface ListsOverlay {
  /** Lists created in this session. */
  created: SkillList[]
  /** Per list: replaced fields. */
  edits: Record<string, Partial<Pick<SkillList, "name" | "groupIds" | "studentIds" | "isDefault" | "minTotal" | "skillIds">>>
  /** Seeded lists the admin deleted. A created list is simply dropped from `created`. */
  deleted?: string[]
}


export const EMPTY_LISTS_OVERLAY: ListsOverlay = { created: [], edits: {} }


export const cohortGroupId = (name: string) => `coh:${name}`
/** Same value the scope bar's Group filter uses for a track (lib/v2/filters.ts TRACK_GROUP_PREFIX). */
const trackGroupId = (id: string) => `${TRACK_GROUP_PREFIX}${id}`


/**
 * Cohorts (by the program's cohort names), custom tracks, and custom groups made of filter rules [CALL 10-26], each with the students
 * in it. A custom group's id is its rule value (lib/v2/filters.ts customGroupValue), the same value the scope bar filters on, so a
 * list attached to it and the dashboard figures for it read the same students.
 */
/** The built-in group behind "All students". It is not a group an admin manages. */
export const ALL_STUDENTS_GROUP = "all-students"

export function studentGroups(s: V2State, custom: readonly CustomGroup[] = []): StudentGroup[] {
  const students = s.people.filter((p) => p.kind === "student")
  const cohorts: StudentGroup[] = s.program.cohorts.map((c) => ({ id: cohortGroupId(c), label: c, kind: "cohort", studentIds: students.filter((p) => p.cohort === c).map((p) => p.id) }))
  const tracks: StudentGroup[] = (s.tracks ?? []).map((t) => ({ id: trackGroupId(t.id), label: t.name, kind: "track", studentIds: students.filter((p) => p.trackIds?.includes(t.id)).map((p) => p.id) }))
  const customs: StudentGroup[] = customGroupsOf(custom).map((g) => ({ id: g.id, label: g.name, kind: "custom", studentIds: students.filter((p) => matchesRule(s, p, g.rule)).map((p) => p.id) }))
  // Everyone, whenever they join: past, current and future (Prism stores no cohort dates, so a "future batch" cannot be told apart) [CALL 11-06 Granola 741d1f1c ch 8-9, D-L122].
  const everyone: StudentGroup = { id: ALL_STUDENTS_GROUP, label: "All students", kind: "all", studentIds: students.map((p) => p.id) }
  return [...cohorts, ...tracks, ...customs, everyone]
}


/** The seeded lists, before their minimum totals (which read achievement). */
export function seedListShapes(s: V2State): SkillList[] {
  // A program with no skills has no skill lists yet (Set up skills starts from one, D-L44).
  if (s.skills.length === 0) return []
  const checklist = s.skills.filter((k) => k.hgtc)
  const COMPETENCY_SECTIONS = new Set(["Communication", "Documentation", "Teaching Learning Principles", "Psycho-social assessment", "Emotional/Cognitive"])
  const competencies = s.skills.filter((k) => !k.addedByHand && (COMPETENCY_SECTIONS.has(k.category) || (!k.hgtc && k.specialty === "bsn-med-surg")))
  const graduating = s.program.cohorts.includes("BSN 2026") ? [cohortGroupId("BSN 2026")] : []
  const cohorts = s.program.cohorts.map(cohortGroupId).filter((g) => !graduating.includes(g))
  const bsn2027 = s.program.cohorts.includes("BSN 2027") ? [cohortGroupId("BSN 2027")] : []
  const track = (s.tracks ?? [])[0]
  const lists: SkillList[] = [
    {
      id: "list-clinical",
      name: "Clinical skills checklist",
      noun: "skill",
      nounPlural: "skills",
      skillIds: checklist.map((k) => k.id),
      requiredIds: [],
      isDefault: true,
      groupIds: cohorts,
      minTotal: 120,
      standard: "Program checklist, 2024 edition",
    },
    {
      id: "list-competencies",
      name: "Practicum competencies",
      noun: "competency",
      nounPlural: "competencies",
      skillIds: competencies.map((k) => k.id),
      requiredIds: [],
      isDefault: false,
      groupIds: [...bsn2027, ...(track ? [trackGroupId(track.id)] : [])],
      minTotal: Math.round(competencies.length * 0.8),
      standard: "Senior practicum",
    },
    {
      // The list the graduating cohort was assigned when it started: the core of the checklist. "Done" means every skill on it.
      id: "list-core",
      name: "Core clinical skills",
      noun: "skill",
      nounPlural: "skills",
      skillIds: checklist.filter((k) => k.hgtc?.required).map((k) => k.id),
      requiredIds: [],
      isDefault: false,
      groupIds: graduating,
      minTotal: 0,
      standard: "",
    },
    {
      id: "list-clinical-2027",
      // A neutral name (Sankalp 2026-10-27 review): a list named after a standard contradicted "Standards are managed in Program
      // details". The id stays so saved overlays keep working.
      name: "Revised clinical skills checklist",
      noun: "skill",
      nounPlural: "skills",
      skillIds: checklist.map((k) => k.id),
      requiredIds: [],
      isDefault: false,
      groupIds: [],
      minTotal: 120,
      standard: "",
    },
  ]
  return lists
}


export function applyListsOverlay(base: SkillList[], o: ListsOverlay): SkillList[] {
  // Stored "individual skills" sets are retired (D-L59): hidden, and counted in no figure.
  const deleted = new Set(o.deleted ?? [])
  return [...base, ...o.created.filter((l) => !l.individual)].filter((l) => !deleted.has(l.id)).map((l) => ({ ...l, ...(o.edits[l.id] ?? {}) }))
}


/** The saved list edits, or none. */
export const listEditsOf = (s: V2State): ListsOverlay => (s.listEdits as ListsOverlay | undefined) ?? EMPTY_LISTS_OVERLAY


/**
 * Saved data may still hold exceptions (a group on a list "except 1 student"), which the UI and the data path no longer have (designer 2026-11-05, D-L106). Each such list is made plain with
 * the same people on it, so no figure moves: a group holding an excepted student is replaced by its other students, named [INFER]. A list with no exceptions comes back as it was.
 */
export function plainLists(s: V2State, lists: readonly SkillList[]): SkillList[] {
  type Stored = SkillList & { exceptStudentIds?: string[] }
  if (!(lists as readonly Stored[]).some((l) => "exceptStudentIds" in l)) return lists as SkillList[]
  const groups = studentGroups(s, customGroupsOn(s, lists))
  return (lists as readonly Stored[]).map((stored) => {
    if (!("exceptStudentIds" in stored)) return stored
    const { exceptStudentIds, ...l } = stored
    const off = new Set(exceptStudentIds ?? [])
    if (!off.size) return l
    const holding = groups.filter((g) => l.groupIds.includes(g.id) && g.studentIds.some((id) => off.has(id)))
    const named = new Set([...(l.studentIds ?? []), ...holding.flatMap((g) => g.studentIds)])
    for (const id of off) named.delete(id)
    return { ...l, groupIds: l.groupIds.filter((id) => !holding.some((g) => g.id === id)), studentIds: [...named] }
  })
}

/**
 * The lists as far as who is on them and which skills they hold: no achievement is read, so figures for an earlier date (a state with fewer
 * evaluations) do not recount anything. Same ids, skills and reach as `programLists`.
 */
const reachListsCache = new WeakMap<object, { people: unknown; edits: unknown; own: unknown; lists: SkillList[] }>()
export function reachLists(s: V2State): SkillList[] {
  const hit = reachListsCache.get(s.skills)
  if (hit && hit.people === s.people && hit.edits === s.listEdits && hit.own === s.ownListsOnly) return hit.lists
  const lists = plainLists(s, applyListsOverlay(s.ownListsOnly ? [] : seedListShapes(s), listEditsOf(s)))
  reachListsCache.set(s.skills, { people: s.people, edits: s.listEdits, own: s.ownListsOnly, lists })
  return lists
}

/** A custom group's id is its rule, so the lists themselves say who is in it; the group's name lives elsewhere and is not needed here. */
function customGroupsOn(s: V2State, lists: readonly SkillList[]): CustomGroup[] {
  const known = new Set(studentGroups(s).map((g) => g.id))
  return [...new Set(lists.flatMap((l) => l.groupIds))].filter((id) => !known.has(id) && id.startsWith(CUSTOM_GROUP_PREFIX)).flatMap((id) => {
    const rule = parseCustomGroup(id)
    return rule ? [customGroup(id, rule)] : []
  })
}

const byStudentCache = new WeakMap<object, Map<string, SkillList[]>>()
/**
 * Student id -> the skill lists assigned to them, through a group or by name; the default list first, then in the program's
 * order. A student with no list is absent: nothing falls back to the default list (designer, 2026-11-05, D-L103). Only lists that hold skills count.
 */
export function listsByStudent(s: V2State, lists: readonly SkillList[] = reachLists(s)): Map<string, SkillList[]> {
  const hit = byStudentCache.get(lists)
  if (hit) return hit
  const groups = studentGroups(s, customGroupsOn(s, lists))
  const out = new Map<string, SkillList[]>()
  for (const l of [...lists].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))) {
    if (l.individual || !l.skillIds.length) continue
    for (const id of studentsOnList(l, groups)) out.set(id, [...(out.get(id) ?? []), l])
  }
  byStudentCache.set(lists, out)
  return out
}

/** The lists a student is on. Empty: no list, which reads as unassigned everywhere. */
export const listsOfStudent = (s: V2State, studentId: string, lists: readonly SkillList[] = reachLists(s)): SkillList[] => listsByStudent(s, lists).get(studentId) ?? []

/** The one list a figure reads for this student: the named one if it reaches them, else their first (the default when they are on it). Lists never merge in a figure. */
export function listInForce(s: V2State, studentId: string, listId?: string | null, lists: readonly SkillList[] = reachLists(s)): SkillList | null {
  const mine = listsOfStudent(s, studentId, lists)
  return (listId ? mine.find((l) => l.id === listId) : mine[0]) ?? null
}

/** Students on no skill list, with their names sorted. Reports, Coverage and Skill lists all read this. */
export function studentsWithNoList(s: V2State, lists: readonly SkillList[] = reachLists(s)): Person[] {
  const on = listsByStudent(s, lists)
  return s.people.filter((p) => p.kind === "student" && !on.has(p.id)).sort((a, b) => a.name.localeCompare(b.name))
}


export type ListReach = Pick<SkillList, "groupIds" | "studentIds">

/** The students a list reaches: everyone in a student group it is assigned to and everyone named on it. */
export function studentsOnList(list: ListReach, groups: readonly StudentGroup[]): Set<string> {
  const out = new Set(groups.filter((g) => list.groupIds.includes(g.id)).flatMap((g) => g.studentIds))
  for (const id of list.studentIds ?? []) out.add(id)
  return out
}

