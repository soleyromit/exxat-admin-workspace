/**
 * Lists and cohort assignment (build prompt admassign). Pure functions over V2State; the store is never written. Lists are lab
 * objects: the v2 data model holds one implicit list, so this file derives the program's lists from the seed and keeps admin edits as
 * an overlay (`ListsOverlay`).
 *
 * From the Oct 9 call [CALL]: a list is attached to the cohorts (or other student groups) it applies to, by checking them off; a
 * program may attach two lists to one cohort (for example skills and competencies) and each list is its own report, never mixed; a new
 * standard means a new list, not an edit of one already in use; a default list is attached automatically to every new cohort. Cohort is a
 * filter, not the owner of the list [LEDGER]. Completion rule: every required skill achieved and at least `minTotal` achieved in total
 * [BUILD-PROMPT section 5]. The noun is per list, never "items" [LEDGER D-B].
 */
import type { Person, V2State } from "@/lib/v2/types"
import { skillProgress } from "@/lib/v2/student"
import { customGroup, customGroupValue, graduationYearOf, matchesRule, type CustomGroup, type GroupRule } from "@/lib/v2/filters"
import { applyListsOverlay, cohortGroupId, listEditsOf, listsByStudent, plainLists, seedListShapes, studentGroups, studentsOnList, type GroupKind, type ListReach, type ListsOverlay, type SkillList, type StudentGroup } from "./list-core"
import { isConfigured as isConfiguredSkill } from "@/lib/v2/population"
import { mapBlockReason } from "@/lib/v2/coverage"
import { LAB_ADMIN } from "./library"

/** Below this a median says more about one student than about the group. */
export const MEDIAN_MIN_N = 5

export * from "./list-core"

export const listsHref = (extra: Record<string, string | undefined> = {}): string => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v)
  const s = q.toString()
  return s ? `${LAB_ADMIN}/lists-cohorts?${s}` : `${LAB_ADMIN}/lists-cohorts`
}

/** Lists assigned to a cohort. A list's skill is Not mapped until a level is set on an offering (D-L76, lib/lab/mapping.ts resolvedLevels). */
export const listsForCohort = (lists: readonly SkillList[], cohort: string): SkillList[] => lists.filter((l) => l.groupIds.includes(cohortGroupId(cohort)))

// ---------------------------------------------------------------------------------------------------------------------
// Custom groups (filter rules: category, enrollment year, graduation year)

export interface GroupRuleOptions {
  categories: string[]
  enrollmentYears: number[]
  graduationYears: number[]
}

/** The values the rule builder offers: only values some student has (no rule can be built that no data could match). */
export function groupRuleOptions(s: V2State): GroupRuleOptions {
  const ps = s.people.filter((p) => p.kind === "student")
  const nums = (xs: Array<number | undefined>) => [...new Set(xs.filter((x): x is number => typeof x === "number"))].sort((a, b) => a - b)
  return {
    categories: [...new Set(ps.map((p) => p.enrollmentCategory).filter((x): x is string => !!x))].sort(),
    enrollmentYears: nums(ps.map((p) => p.enrollmentYear)),
    graduationYears: nums(ps.map((p) => graduationYearOf(s, p))),
  }
}

/** Students a rule picks right now (the live count beside the builder). */
export const studentsForRule = (s: V2State, rule: GroupRule): Person[] => s.people.filter((p) => p.kind === "student" && matchesRule(s, p, rule))

export const ruleIsEmpty = (r: GroupRule): boolean => !r.category && !r.enrollmentYear && !r.graduationYear && !r.studentIds?.length

/** One limit for a student group's name, and one for a list's: the field refuses with this message rather than cutting what was typed. */
export const GROUP_NAME_MAX = 60
export const LIST_NAME_MAX = 80
export const nameTooLong = (raw: string, max: number): string | null => {
  const n = raw.trim().length
  return n > max ? `Use ${max} characters or fewer. This name has ${n}.` : null
}

/** A name and at least one rule; no two groups with the same rules (they would be the same students under two names). */
export function validateCustomGroup(groups: readonly StudentGroup[], name: string, rule: GroupRule): string | null {
  if (!name.trim()) return "Give the group a name."
  const long = nameTooLong(name, GROUP_NAME_MAX)
  if (long) return long
  if (ruleIsEmpty(rule)) return "Select at least one student."
  if (groups.some((g) => g.label.toLowerCase() === name.trim().toLowerCase())) return "A group with this name exists. Choose another name."
  const hit = groups.find((g) => g.id === customGroupValue(rule))
  if (hit) return `${hit.label} already has these students.`
  return null
}

/** Renaming a student group: a name, not the name of another group. */
export function validateGroupName(groups: readonly StudentGroup[], name: string, exceptId: string): string | null {
  const n = name.trim().toLowerCase()
  if (!n) return "Give the group a name."
  const long = nameTooLong(name, GROUP_NAME_MAX)
  if (long) return long
  if (groups.some((g) => g.id !== exceptId && g.label.toLowerCase() === n)) return "A group with this name exists. Choose another name."
  return null
}

/** A new group's skill list: the default, once it holds skills (Aarti, 205da2dd ch 9). The group is then assigned it, for all to see; nothing reads a default for a group that has no list. */
export function defaultForNewGroup(lists: readonly SkillList[]): SkillList | undefined {
  return lists.find((l) => l.isDefault && !l.individual && l.skillIds.length > 0)
}

/** A removed student group leaves every list. */
export const detachGroup = (lists: readonly SkillList[], groupId: string): SkillList[] => lists.map((l) => (l.groupIds.includes(groupId) ? { ...l, groupIds: l.groupIds.filter((g) => g !== groupId) } : l))

export { customGroup, customGroupValue, type CustomGroup, type GroupRule }

/**
 * The program's lists as the seed implies them [INFER]: the imported clinical checklist is the default list on the current cohorts; the
 * graduating cohort stays on the shorter core list it started with (the program made a new list for later cohorts, stakeholder
 * review 2026-11-04, D-L62); the communication, documentation, teaching and psycho-social skills form a second list of practicum competencies on BSN 2027 and the accelerated track (two lists on one cohort, [CALL]); a list for
 * the next standard exists with no group yet.
 */
export function seedLists(s: V2State): SkillList[] {
  const lists = seedListShapes(s)
  if (lists.length === 0) return lists
  // The default list's minimum comes from the data, not a fixed 120 (UX critique 2026-10-26: with 120 of 154 every group
  // read "0 of N"). The unassigned 2027 list keeps the same minimum as the list it will replace.
  const clinicalMin = dataMinTotal(s, lists[0]!)
  lists[0]!.minTotal = clinicalMin
  lists[3]!.minTotal = clinicalMin
  lists[2]!.minTotal = dataMinTotal(s, lists[2]!)
  return lists
}

/**
 * The assigned lists that carry a skill and the student groups they are assigned to, for Configure's "Who it affects". A list gives no level:
 * its skill is Not mapped on every offering until someone sets it (D-L76).
 */
export function listsCarrying(s: V2State, skillId: string, lists: readonly SkillList[] = programLists(s)): Array<{ list: SkillList; level: "not-expected"; groups: string[] }> {
  const groups = studentGroups(s)
  return lists
    .filter((l) => listHasAssignment(l) && l.skillIds.includes(skillId))
    .map((l) => ({ list: l, level: "not-expected" as const, groups: groups.filter((g) => l.groupIds.includes(g.id)).map((g) => g.label) }))
}

/**
 * A deterministic default minimum total for a seeded list [INFER]: the median total achieved by the students in its assigned
 * groups who already have every required skill, clamped to the valid range (validateMinTotal). So about half of the students
 * who meet the required part also meet the total, and the groups differ (a graduating cohort meets it in part; earlier cohorts,
 * still short of the required skills, do not yet). Falls back to the list's own minimum when nobody has every required skill.
 */
export function dataMinTotal(s: V2State, list: SkillList): number {
  const achieved = achievedByStudent(s)
  const req = new Set(list.requiredIds)
  const all = new Set(list.skillIds)
  const groups = studentGroups(s).filter((g) => list.groupIds.includes(g.id))
  const ids = new Set(groups.flatMap((g) => g.studentIds))
  const totals: number[] = []
  for (const id of ids) {
    const a = achieved.get(id) ?? new Set<string>()
    let required = 0
    let total = 0
    for (const k of a) {
      if (all.has(k)) total++
      if (req.has(k)) required++
    }
    if (required >= req.size) totals.push(total)
  }
  if (totals.length === 0) return list.minTotal
  return Math.min(list.skillIds.length, Math.max(req.size, median(totals)))
}

const programListsCache = new WeakMap<V2State, SkillList[]>()
/**
 * The program's lists with the admin's saved edits: the one reading of "what is assigned", for screens and for shared code alike. Pure
 * over the state, so attainment, director and mapping read the same lists as Skill lists. A new program has no seeded lists.
 */
export function programLists(s: V2State): SkillList[] {
  let hit = programListsCache.get(s)
  if (!hit) {
    hit = plainLists(s, applyListsOverlay(s.ownListsOnly ? [] : seedLists(s), listEditsOf(s)))
    programListsCache.set(s, hit)
  }
  return hit
}

export const listById = (lists: readonly SkillList[], id: string | null | undefined): SkillList | undefined => lists.find((l) => l.id === id)

/** The default list, or the first assigned one. Its required skills are what course mapping checks coverage against. */
export function defaultList(lists: readonly SkillList[]): SkillList | undefined {
  return lists.find((l) => l.isDefault) ?? lists.find((l) => listHasAssignment(l) && !l.individual)
}

/** A list's size as the Skill lists page says it: "154, 2 inactive". Its panel lists all 154; a student's figure reads the 152 active ones (map D6). */
export function listSizeParts(s: V2State, l: Pick<SkillList, "skillIds">): { total: number; inactive: number } {
  const off = new Set(s.skills.filter((k) => k.active === false).map((k) => k.id))
  return { total: l.skillIds.length, inactive: l.skillIds.filter((id) => off.has(id)).length }
}

const assignedCache = new WeakMap<object, Map<string, Set<string>>>()
/**
 * What each student is assigned: every skill on any list that reaches them, used to ask "is this skill on one of their lists?" and to count who a
 * skill reaches. A figure reads one list at a time (`listInForce`), never this union. A student with no list has an empty set.
 */
export function assignedSkillIdsByStudent(s: V2State, lists: readonly SkillList[] = programLists(s)): Map<string, Set<string>> {
  const hit = assignedCache.get(lists)
  if (hit) return hit
  const by = listsByStudent(s, lists)
  const out = new Map<string, Set<string>>()
  for (const p of s.people) if (p.kind === "student") out.set(p.id, new Set((by.get(p.id) ?? []).flatMap((l) => l.skillIds)))
  assignedCache.set(lists, out)
  return out
}

/** How many students have this skill: it is on a list that reaches them (All assigned, D-L54), whether or not a course requires it this term. */
export function studentsAssigned(s: V2State, skillId: string, lists: readonly SkillList[] = programLists(s)): number {
  let n = 0
  for (const ids of assignedSkillIdsByStudent(s, lists).values()) if (ids.has(skillId)) n++
  return n
}

/** The program's skill lists (what the Skill lists page and every picker show). */
export const skillLists = (lists: readonly SkillList[]): SkillList[] => lists.filter((l) => !l.individual)

/**
 * The skill lists reaching a set of students (those holding any of them, through a group or by name): Reports shows one at a
 * time and never merges them (stakeholder review 2026-11-04).
 */
export function listsReaching(lists: readonly SkillList[], groups: readonly StudentGroup[], studentIds: ReadonlySet<string>): SkillList[] {
  return skillLists(lists).filter((l) => [...studentsOnList(l, groups)].some((id) => studentIds.has(id)))
}

const countStudents = (n: number): string => `${n.toLocaleString("en-US")} ${n === 1 ? "student" : "students"}`

/** "BSN 2028, 3 students": who a list is assigned to, in one phrase. Empty when it is on nobody. Hover on a Skill lists row and its label read this. */
export function assignedToText(list: ListReach, groups: readonly StudentGroup[]): string {
  const named = list.studentIds?.length ?? 0
  return [...list.groupIds.map((g) => groupLabel(groups, g)), ...(named ? [countStudents(named)] : [])].join(", ")
}

/** "BSN 2026, BSN 2028 + 1 more group + 3 students": the same phrase for a table cell, at most two groups named; the whole of it is `assignedToText`. */
export function assignedToShort(list: ListReach, groups: readonly StudentGroup[]): string {
  const named = list.studentIds?.length ?? 0
  const shown = list.groupIds.slice(0, 2).map((g) => groupLabel(groups, g))
  const more = list.groupIds.length - shown.length
  return [shown.join(", "), ...(more ? [`${more} more ${more === 1 ? "group" : "groups"}`] : []), ...(named ? [countStudents(named)] : [])].filter(Boolean).join(" + ")
}

/** True when a list holds anyone at all. */
export const listHasAssignment = (list: ListReach): boolean => list.groupIds.length > 0 || (list.studentIds?.length ?? 0) > 0

export const countNoun = (l: Pick<SkillList, "noun" | "nounPlural">, n: number): string => `${n.toLocaleString("en-US")} ${n === 1 ? l.noun : l.nounPlural}`

// ---------------------------------------------------------------------------------------------------------------------
// Achievement (through the v2 engine, cached per state)

const achievedCache = new WeakMap<V2State, Map<string, Set<string>>>()

/** Student id -> skill ids achieved under each skill's published rule. Only counted evidence counts (held evidence does not). */
export function achievedByStudent(s: V2State): Map<string, Set<string>> {
  const hit = achievedCache.get(s)
  if (hit) return hit
  const out = new Map<string, Set<string>>()
  const configured = s.skills.filter((k) => k.configured && k.config)
  for (const p of s.people) {
    if (p.kind !== "student") continue
    const set = new Set<string>()
    for (const k of configured) if (skillProgress(s, p.id, k.id)?.achieved) set.add(k.id)
    out.set(p.id, set)
  }
  achievedCache.set(s, out)
  return out
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const v = [...values].sort((a, b) => a - b)
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m]! : Math.round((v[m - 1]! + v[m]!) / 2)
}

export interface GroupStanding {
  groupId: string
  label: string
  kind: GroupKind
  students: number
  /** Students who meet the completion rule now. */
  meeting: number
  /** Median achieved in total and median required achieved; null when the group is too small to show a median. */
  medianTotal: number | null
  medianRequired: number | null
  /** Each student's (required achieved, total achieved), for the what-if. */
  points: Array<{ required: number; total: number }>
}

export function groupStanding(s: V2State, list: SkillList, group: StudentGroup, achieved = achievedByStudent(s)): GroupStanding {
  const req = new Set(list.requiredIds)
  const all = new Set(list.skillIds)
  const points = group.studentIds.map((id) => {
    const a = achieved.get(id) ?? new Set<string>()
    let required = 0
    let total = 0
    for (const k of a) {
      if (all.has(k)) total++
      if (req.has(k)) required++
    }
    return { required, total }
  })
  const small = points.length < MEDIAN_MIN_N
  return {
    groupId: group.id,
    label: group.label,
    kind: group.kind,
    students: points.length,
    meeting: meetsCount(points, list.requiredIds.length, list.minTotal),
    medianTotal: small ? null : median(points.map((p) => p.total)),
    medianRequired: small ? null : median(points.map((p) => p.required)),
    points,
  }
}

export const meetsCount = (points: ReadonlyArray<{ required: number; total: number }>, requiredCount: number, minTotal: number): number =>
  points.filter((p) => p.required >= requiredCount && p.total >= minTotal).length

export interface RuleImpact {
  groupId: string
  label: string
  students: number
  before: number
  after: number
}

/** What a new minimum total would change, per assigned group, before it is saved. */
export function ruleImpact(standings: readonly GroupStanding[], list: SkillList, nextMin: number): RuleImpact[] {
  return standings.map((g) => ({ groupId: g.groupId, label: g.label, students: g.students, before: g.meeting, after: meetsCount(g.points, list.requiredIds.length, nextMin) }))
}

/** A minimum total is valid when it is a whole number between the required count and the list size [REQ SC-18 by analogy]. */
export function validateMinTotal(list: SkillList, value: number): string | null {
  if (!Number.isInteger(value)) return "Enter a whole number."
  if (value < 1) return "Enter 1 or more."
  if (value > list.skillIds.length) return `Enter at most ${list.skillIds.length}, the number of ${list.nounPlural} on the list.`
  return null
}

// ---------------------------------------------------------------------------------------------------------------------
// Finding students by filter (Add students, 365abc25 ch 9). What matches when they are added is what is assigned: a snapshot [INFER].

export interface StudentFilter {
  cohort?: string
  trackId?: string
  termId?: string
  category?: string
  enrollmentYear?: number
}

export const studentFilterIsEmpty = (f: StudentFilter): boolean => !f.cohort && !f.trackId && !f.termId && !f.category && !f.enrollmentYear

/** The students a filter finds, by name. An empty filter finds nobody: nothing is assigned until the admin says who. A term finds the students whose cohort has an offering in it. */
export function studentsMatching(s: V2State, f: StudentFilter): Person[] {
  if (studentFilterIsEmpty(f)) return []
  const inTerm = f.termId ? new Set((s.offerings ?? []).filter((o) => o.termId === f.termId).map((o) => o.cohortId)) : null
  return s.people
    .filter((p) => p.kind === "student" && (!f.cohort || p.cohort === f.cohort) && (!f.trackId || !!p.trackIds?.includes(f.trackId)) && (!f.category || p.enrollmentCategory === f.category) && (!f.enrollmentYear || p.enrollmentYear === f.enrollmentYear) && (!inTerm || (!!p.cohortId && inTerm.has(p.cohortId))))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------------------------------------------------
// Who is on a list. Adding keeps other lists; taking someone off another list is done on that list (designer 2026-11-05, D-L106).

/** Attach a list to a group. Other lists stay as they are (evidence stays on each record, CM-07). */
export function assign(lists: readonly SkillList[], listId: string, groupId: string): SkillList[] {
  return lists.map((l) => (l.id === listId && !l.groupIds.includes(groupId) ? { ...l, groupIds: [...l.groupIds, groupId] } : l))
}

export function unassign(lists: readonly SkillList[], listId: string, groupId: string): SkillList[] {
  return lists.map((l) => (l.id === listId ? { ...l, groupIds: l.groupIds.filter((g) => g !== groupId) } : l))
}

/** Add students: groups and named students on to one list, at once. A student a group on the list already brings is not named as well. */
export function addToList(lists: readonly SkillList[], listId: string, add: { groupIds?: readonly string[]; studentIds?: readonly string[] }, groups: readonly StudentGroup[]): SkillList[] {
  return lists.map((l) => {
    if (l.id !== listId) return l
    const groupIds = [...l.groupIds, ...(add.groupIds ?? []).filter((id) => !l.groupIds.includes(id))]
    const reached = studentsOnList({ groupIds, studentIds: l.studentIds }, groups)
    return { ...l, groupIds, studentIds: [...(l.studentIds ?? []), ...(add.studentIds ?? []).filter((id) => !reached.has(id))] }
  })
}

/** One named student off one list. */
export const removeStudent = (lists: readonly SkillList[], listId: string, studentId: string): SkillList[] =>
  lists.map((l) => (l.id === listId ? { ...l, studentIds: (l.studentIds ?? []).filter((id) => id !== studentId) } : l))

/** The students a change leaves on no list that holds skills. Asked about before the change is made; they read as unassigned everywhere (listsByStudent). */
export function leftWithNoList(before: readonly SkillList[], after: readonly SkillList[], groups: readonly StudentGroup[]): string[] {
  const onSome = (lists: readonly SkillList[]) => new Set(skillLists(lists).filter((l) => l.skillIds.length > 0).flatMap((l) => [...studentsOnList(l, groups)]))
  const now = onSome(after)
  return [...onSome(before)].filter((id) => !now.has(id))
}

/** Which list an old link means: ?list=, else one a ?focus= group already uses, else the default. */
export function listForOldLink(lists: readonly SkillList[], list: string | null | undefined, focus: string | null | undefined): SkillList | undefined {
  const all = skillLists(lists)
  return listById(all, list) ?? all.find((l) => !!focus && l.groupIds.includes(focus)) ?? all.find((l) => l.isDefault) ?? all[0]
}

/** Up to three names, then how many more: a filter can reach most of a program. */
export const namesUpTo = (names: readonly string[], most = 3): string => (names.length <= most ? namesOf(names) : `${names.slice(0, most).join(", ")} and ${(names.length - most).toLocaleString("en-US")} more`)

/** Student groups named in a line: "BSN 2028 and ABSN 2027". */
export const namesOf = (names: readonly string[]): string => (names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`)

/** One default at a time [INFER]. Existing groups keep their lists; only new cohorts get the default. */
export function makeDefault(lists: readonly SkillList[], listId: string): SkillList[] {
  return lists.map((l) => ({ ...l, isDefault: l.id === listId }))
}

/** The edits that turn `base` into `next`, so the overlay only stores what changed. */
export function diffLists(base: readonly SkillList[], next: readonly SkillList[], created: readonly SkillList[]): ListsOverlay {
  const edits: ListsOverlay["edits"] = {}
  const createdIds = new Set(created.map((c) => c.id))
  for (const n of next) {
    if (createdIds.has(n.id)) continue
    const b = base.find((x) => x.id === n.id)
    if (!b) continue
    const e: ListsOverlay["edits"][string] = {}
    if (b.name !== n.name) e.name = n.name
    if (b.groupIds.join("|") !== n.groupIds.join("|")) e.groupIds = n.groupIds
    if ((b.studentIds ?? []).join("|") !== (n.studentIds ?? []).join("|")) e.studentIds = n.studentIds ?? []
    if (b.isDefault !== n.isDefault) e.isDefault = n.isDefault
    if (b.minTotal !== n.minTotal) e.minTotal = n.minTotal
    if (b.skillIds.join("|") !== n.skillIds.join("|")) e.skillIds = n.skillIds
    if (Object.keys(e).length) edits[n.id] = e
  }
  const deleted = base.filter((b) => !next.some((n) => n.id === b.id)).map((b) => b.id)
  return { created: next.filter((n) => createdIds.has(n.id)), edits, ...(deleted.length ? { deleted } : {}) }
}

export interface NewListInput {
  name: string
  noun: string
  nounPlural: string
  standard: string
  /** Start from the skills of an existing list, or empty. */
  fromListId: string | null
  /** Start from these skills instead (the whole library). */
  fromSkillIds?: readonly string[]
}

/** A name, not the name of another list. `exceptId` is the list being renamed. */
export function validateListName(lists: readonly SkillList[], raw: string, exceptId?: string): string | null {
  const name = raw.trim().toLowerCase()
  if (!name) return "Give the list a name."
  const long = nameTooLong(raw, LIST_NAME_MAX)
  if (long) return long
  if (lists.some((l) => l.id !== exceptId && l.name.toLowerCase() === name)) return "A list with this name exists. Choose another name."
  return null
}

export const renameList = (lists: readonly SkillList[], listId: string, name: string): SkillList[] => lists.map((l) => (l.id === listId ? { ...l, name: name.trim() } : l))

export function validateNewList(lists: readonly SkillList[], input: NewListInput): string | null {
  const named = validateListName(lists, input.name)
  if (named) return named
  if (!input.noun.trim() || !input.nounPlural.trim()) return "Say what the list holds, in the singular and the plural."
  if (/^items?$/i.test(input.noun.trim()) || /^items?$/i.test(input.nounPlural.trim())) return "Use the word your program uses, such as skill or competency."
  return null
}

/**
 * A new list starts on no group, so no student sees it until someone is added; a list on a group or student is never edited. A program's
 * first list is its default once it holds skills: a list with nothing on it has nothing to give a new group (setListSkills makes it the
 * default when its first skills are saved).
 */
export function createList(lists: readonly SkillList[], input: NewListInput, id: string): SkillList {
  const from = input.fromListId ? listById(lists, input.fromListId) : undefined
  const skillIds = from ? [...from.skillIds] : [...(input.fromSkillIds ?? [])]
  return {
    id,
    name: input.name.trim(),
    noun: input.noun.trim().toLowerCase(),
    nounPlural: input.nounPlural.trim().toLowerCase(),
    skillIds,
    requiredIds: from ? [...from.requiredIds] : [],
    isDefault: skillLists(lists).length === 0 && skillIds.length > 0,
    groupIds: [],
    minTotal: from ? from.minTotal : 0,
    standard: input.standard.trim(),
  }
}

/** "Clinical skills checklist v2": the next free version name of a list's family. */
function versionName(lists: readonly SkillList[], root: SkillList): string {
  let n = lists.filter((l) => l.id === root.id || l.versionOf === root.id).length + 1
  while (lists.some((l) => l.name === `${root.name} v${n}`)) n++
  return `${root.name} v${n}`
}

/** New version: the same skills and levels, on no one yet. The list it copies keeps its students until they are moved. */
export function newVersion(lists: readonly SkillList[], listId: string, id: string): SkillList | null {
  const from = listById(lists, listId)
  if (!from) return null
  const root = listById(lists, from.versionOf) ?? from
  return { ...from, id, name: versionName(lists, root), isDefault: false, groupIds: [], studentIds: [], versionOf: root.id, skillIds: [...from.skillIds], requiredIds: [...from.requiredIds] }
}

/**
 * What can change where (the rule of thumb, with no state word on screen): a list on a group or a student is not edited in place, New version instead;
 * a list on no one can be edited. An unassigned one can be deleted, unless it is the default.
 */
export const listCanEdit = (l: ListReach): boolean => !listHasAssignment(l)

/** Replace an unassigned list's skills. A list on anyone is not edited in place: nothing changes (make a new version). A program with no default gets this one once it holds skills. */
export function setListSkills(lists: readonly SkillList[], listId: string, skillIds: readonly string[]): SkillList[] {
  const noDefault = !lists.some((l) => l.isDefault)
  return lists.map((l) => (l.id === listId && listCanEdit(l) ? { ...l, skillIds: [...skillIds], isDefault: l.isDefault || (noDefault && skillIds.length > 0) } : l))
}

/** Skills that sit on no list: they still count on each record, but no list report shows them. */
export function skillsOnNoList(s: V2State, lists: readonly SkillList[]): number {
  const on = new Set(lists.flatMap((l) => l.skillIds))
  return s.skills.filter((k) => !on.has(k.id)).length
}

// ---------------------------------------------------------------------------------------------------------------------
// What an assignment does (read by the figures, Sankalp 2026-10-27: its consequence in one sentence)

/**
 * The skills on a list that can be mapped now: configured and active (REQ IM-09, decision D-X14). The rest join once they are configured.
 */
export function inheritableSkillIds(s: V2State, list: Pick<SkillList, "skillIds">): string[] {
  const usable = new Set(s.skills.filter((k) => k.active !== false && isConfiguredSkill(k) && mapBlockReason(k) === null).map((k) => k.id))
  return list.skillIds.filter((id) => usable.has(id))
}

/** Clinical course offerings of a cohort group; null for a track or a custom group, which no offering names (decision D-X27). */
export function clinicalOfferingsFor(s: V2State, group: Pick<StudentGroup, "id" | "kind" | "label">): number | null {
  if (group.kind !== "cohort") return null
  const cohort = (s.cohorts ?? []).find((c) => cohortGroupId(c.name) === group.id)
  if (!cohort) return 0
  const kind = new Map((s.courses ?? []).map((c) => [c.id, c.kind]))
  return (s.offerings ?? []).filter((o) => o.cohortId === cohort.id && (kind.get(o.courseId) ?? "clinical") === "clinical").length
}

/** The cohort's clinical courses, each once however many offerings it runs: the number Course mapping's rows show (D-L66). */
export function clinicalCoursesFor(s: V2State, group: Pick<StudentGroup, "id" | "kind" | "label">): number | null {
  if (group.kind !== "cohort") return null
  const cohort = (s.cohorts ?? []).find((c) => cohortGroupId(c.name) === group.id)
  if (!cohort) return 0
  const kind = new Map((s.courses ?? []).map((c) => [c.id, c.kind]))
  return new Set((s.offerings ?? []).filter((o) => o.cohortId === cohort.id && (kind.get(o.courseId) ?? "clinical") === "clinical").map((o) => o.courseId)).size
}

export interface AssignmentSummary {
  /** Groups the list is assigned to, and the distinct students in them. */
  groups: number
  students: number
  /** Assigned cohorts and their clinical course offerings (where the skills become available). */
  cohorts: number
  clinicalCourses: number
  /** Assigned tracks and custom groups: their students see the list, no course picks it up by itself. */
  otherGroups: number
  /** Skills those courses offer now, and skills that join once configured. */
  offered: number
  waiting: number
}

export function assignmentSummary(s: V2State, list: SkillList, groups: readonly StudentGroup[]): AssignmentSummary {
  const on = groups.filter((g) => list.groupIds.includes(g.id))
  const students = studentsOnList(list, groups)
  const offered = inheritableSkillIds(s, list).length
  let clinicalCourses = 0
  let cohorts = 0
  for (const g of on) {
    const n = clinicalOfferingsFor(s, g)
    if (n === null) continue
    cohorts++
    clinicalCourses += n
  }
  return { groups: on.length, students: students.size, cohorts, clinicalCourses, otherGroups: on.length - cohorts, offered, waiting: list.skillIds.length - offered }
}

export const groupLabel = (groups: readonly StudentGroup[], id: string): string => groups.find((g) => g.id === id)?.label ?? id

export const studentsOf = (s: V2State, g: StudentGroup): Person[] => g.studentIds.map((id) => s.people.find((p) => p.id === id)).filter((p): p is Person => !!p)
