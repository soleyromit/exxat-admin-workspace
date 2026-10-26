/**
 * Lists and cohort assignment (build prompt admassign). Pure functions over V2State; the store is never written. Lists are lab
 * objects: the v2 data model holds one implicit list, so this file derives the program's lists from the seed and keeps admin edits as
 * an overlay (`ListsOverlay`).
 *
 * From the Oct 9 call [CALL]: a list is attached to the cohorts (or other student groups) it applies to, by checking them off; a
 * program may attach two lists to one cohort (for example skills and competencies) and each list is its own report, never mixed; a new
 * standard means a new list, not an edit of the live one; a default list is attached automatically to every new cohort. Cohort is a
 * filter, not the owner of the list [LEDGER]. Completion rule: every required skill achieved and at least `minTotal` achieved in total
 * [BUILD-PROMPT section 5]. The noun is per list, never "items" [LEDGER D-B].
 */
import type { Person, V2State } from "@/lib/v2/types"
import { skillProgress } from "@/lib/v2/student"
import { SAMPLE_CUSTOM_GROUPS, TRACK_GROUP_PREFIX, customGroup, customGroupValue, graduationYearOf, matchesRule, type CustomGroup, type GroupRule } from "@/lib/v2/filters"
import { LAB_ADMIN } from "./library"

export type ListStatus = "live" | "draft"

export interface SkillList {
  id: string
  name: string
  /** The program's noun for what this list holds ("skill", "competency"). */
  noun: string
  nounPlural: string
  skillIds: string[]
  requiredIds: string[]
  status: ListStatus
  /** Attached automatically to every new cohort. */
  isDefault: boolean
  /** Student groups the list applies to. */
  groupIds: string[]
  /** Completion rule: every required one achieved and at least this many achieved in total. */
  minTotal: number
  /** The standard this list measures, shown under the name. */
  standard: string
  /**
   * The level each skill takes in the clinical offerings of an assigned cohort (cohort inheritance, decision D-X27). A skill the
   * list does not name here is Optional there (available, counts on the record, never required). Explicit course levels and the
   * per-offering edits override it (lib/lab/mapping.ts resolvedLevels). Absent on the seeded lists.
   */
  levels?: Partial<Record<string, ListLevel>>
}

/** The per-course levels a list can give its skills by inheritance. */
export type ListLevel = "mandatory" | "recommended" | "optional"

export type GroupKind = "cohort" | "track" | "custom"

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
  edits: Record<string, Partial<Pick<SkillList, "groupIds" | "isDefault" | "minTotal" | "status">>>
}

export const EMPTY_LISTS_OVERLAY: ListsOverlay = { created: [], edits: {} }

/** Below this a median says more about one student than about the group. */
export const MEDIAN_MIN_N = 5

export const listsHref = (extra: Record<string, string | undefined> = {}): string => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v)
  const s = q.toString()
  return s ? `${LAB_ADMIN}/lists-cohorts?${s}` : `${LAB_ADMIN}/lists-cohorts`
}

export const cohortGroupId = (name: string) => `coh:${name}`
/** Same value the scope bar's Group filter uses for a track (lib/v2/filters.ts TRACK_GROUP_PREFIX). */
const trackGroupId = (id: string) => `${TRACK_GROUP_PREFIX}${id}`

/**
 * Live lists assigned to a cohort: every skill on them is available in each CLINICAL offering of that cohort, at the list's level
 * (Optional unless the list names one); explicit course levels and per-offering edits override (lib/lab/mapping.ts resolvedLevels).
 */
export const listsForCohort = (lists: readonly SkillList[], cohort: string): SkillList[] => lists.filter((l) => l.status === "live" && l.groupIds.includes(cohortGroupId(cohort)))

/**
 * Cohorts (by the program's cohort names), custom tracks, and custom groups made of filter rules [CALL 10-26], each with the students
 * in it. A custom group's id is its rule value (lib/v2/filters.ts customGroupValue), the same value the scope bar filters on, so a
 * list attached to it and the dashboard figures for it read the same students.
 */
export function studentGroups(s: V2State, custom: readonly CustomGroup[] = []): StudentGroup[] {
  const students = s.people.filter((p) => p.kind === "student")
  const cohorts: StudentGroup[] = s.program.cohorts.map((c) => ({ id: cohortGroupId(c), label: c, kind: "cohort", studentIds: students.filter((p) => p.cohort === c).map((p) => p.id) }))
  const tracks: StudentGroup[] = (s.tracks ?? []).map((t) => ({ id: trackGroupId(t.id), label: t.name, kind: "track", studentIds: students.filter((p) => p.trackIds?.includes(t.id)).map((p) => p.id) }))
  const seen = new Set<string>()
  const customs: StudentGroup[] = []
  for (const g of [...SAMPLE_CUSTOM_GROUPS, ...custom]) {
    if (seen.has(g.id)) continue
    seen.add(g.id)
    customs.push({ id: g.id, label: g.name, kind: "custom", studentIds: students.filter((p) => matchesRule(s, p, g.rule)).map((p) => p.id) })
  }
  return [...cohorts, ...tracks, ...customs]
}

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

export const ruleIsEmpty = (r: GroupRule): boolean => !r.category && !r.enrollmentYear && !r.graduationYear

/** A name and at least one rule; no two groups with the same rules (they would be the same students under two names). */
export function validateCustomGroup(groups: readonly StudentGroup[], name: string, rule: GroupRule): string | null {
  if (!name.trim()) return "Give the group a name."
  if (ruleIsEmpty(rule)) return "Choose at least one rule."
  if (groups.some((g) => g.label.toLowerCase() === name.trim().toLowerCase())) return "A group with this name exists. Choose another name."
  const hit = groups.find((g) => g.id === customGroupValue(rule))
  if (hit) return `${hit.label} already has these rules.`
  return null
}

export { customGroup, customGroupValue, type CustomGroup, type GroupRule }

/**
 * The program's lists as the seed implies them [INFER]: the imported clinical checklist is the default list on every cohort; the
 * communication, documentation, teaching and psycho-social skills form a second list of practicum competencies on BSN 2027 and the accelerated track (two lists on one cohort, [CALL]); a draft list for
 * the next standard exists with no group yet.
 */
export function seedLists(s: V2State): SkillList[] {
  const checklist = s.skills.filter((k) => k.hgtc)
  const COMPETENCY_SECTIONS = new Set(["Communication", "Documentation", "Teaching Learning Principles", "Psycho-social assessment", "Emotional/Cognitive"])
  const competencies = s.skills.filter((k) => COMPETENCY_SECTIONS.has(k.category) || (!k.hgtc && k.specialty === "bsn-med-surg"))
  const compRequired = competencies.filter((k) => k.configured && (k.hgtc ? k.hgtc.required : true))
  const cohorts = s.program.cohorts.map(cohortGroupId)
  const bsn2027 = s.program.cohorts.includes("BSN 2027") ? [cohortGroupId("BSN 2027")] : []
  const track = (s.tracks ?? [])[0]
  const lists: SkillList[] = [
    {
      id: "list-clinical",
      name: "Clinical skills checklist",
      noun: "skill",
      nounPlural: "skills",
      skillIds: checklist.map((k) => k.id),
      requiredIds: checklist.filter((k) => k.hgtc?.required).map((k) => k.id),
      status: "live",
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
      requiredIds: compRequired.map((k) => k.id),
      status: "live",
      isDefault: false,
      groupIds: [...bsn2027, ...(track ? [trackGroupId(track.id)] : [])],
      minTotal: Math.max(compRequired.length, Math.round(competencies.length * 0.8)),
      standard: "Senior practicum",
    },
    {
      id: "list-clinical-2027",
      name: "Clinical skills checklist, 2027 standard",
      noun: "skill",
      nounPlural: "skills",
      skillIds: checklist.map((k) => k.id),
      requiredIds: checklist.filter((k) => k.hgtc?.required).map((k) => k.id),
      status: "draft",
      isDefault: false,
      groupIds: [],
      minTotal: 120,
      standard: "Program checklist, 2027 edition",
    },
  ]
  // The live default list's minimum comes from the data, not a fixed 120 (UX critique 2026-10-26: with 120 of 154 every group
  // read "0 of N"). The draft 2027 list keeps the same minimum as the live list it will replace.
  const clinicalMin = dataMinTotal(s, lists[0]!)
  lists[0]!.minTotal = clinicalMin
  lists[2]!.minTotal = clinicalMin
  return lists
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

export function applyListsOverlay(base: SkillList[], o: ListsOverlay): SkillList[] {
  return [...base, ...o.created].map((l) => ({ ...l, ...(o.edits[l.id] ?? {}) }))
}

export const listById = (lists: readonly SkillList[], id: string | null | undefined): SkillList | undefined => lists.find((l) => l.id === id)

/** The default list, or the first live one. Its required skills are what course mapping checks coverage against. */
export function defaultList(lists: readonly SkillList[]): SkillList | undefined {
  return lists.find((l) => l.isDefault) ?? lists.find((l) => l.status === "live")
}

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
  if (value < list.requiredIds.length) return `Enter at least ${list.requiredIds.length}, the number of required ${list.nounPlural}.`
  if (value > list.skillIds.length) return `Enter at most ${list.skillIds.length}, the number of ${list.nounPlural} on the list.`
  return null
}

// ---------------------------------------------------------------------------------------------------------------------
// Assignment, with no silent override

export interface AssignCheck {
  /** Other live lists the group already uses: shown before attaching, never replaced silently. */
  existing: SkillList[]
  /** Lists the group uses with the same noun: a second list of the same noun is likely a replacement (new standard). */
  sameNoun: SkillList[]
}

export function assignCheck(lists: readonly SkillList[], listId: string, groupId: string): AssignCheck {
  const target = listById(lists, listId)
  const existing = lists.filter((l) => l.id !== listId && l.groupIds.includes(groupId))
  return { existing, sameNoun: target ? existing.filter((l) => l.noun === target.noun) : [] }
}

export type AssignMode = "add" | "move"

/** Attach a list to a group. "move" also detaches the group from the same-noun lists it used (evidence stays on each record, CM-07). */
export function assign(lists: readonly SkillList[], listId: string, groupId: string, mode: AssignMode = "add"): SkillList[] {
  const target = listById(lists, listId)
  if (!target) return [...lists]
  return lists.map((l) => {
    if (l.id === listId) return { ...l, groupIds: l.groupIds.includes(groupId) ? l.groupIds : [...l.groupIds, groupId], status: "live" as const }
    if (mode === "move" && l.noun === target.noun && l.groupIds.includes(groupId)) return { ...l, groupIds: l.groupIds.filter((g) => g !== groupId) }
    return l
  })
}

export function unassign(lists: readonly SkillList[], listId: string, groupId: string): SkillList[] {
  return lists.map((l) => (l.id === listId ? { ...l, groupIds: l.groupIds.filter((g) => g !== groupId) } : l))
}

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
    if (b.groupIds.join("|") !== n.groupIds.join("|")) e.groupIds = n.groupIds
    if (b.isDefault !== n.isDefault) e.isDefault = n.isDefault
    if (b.minTotal !== n.minTotal) e.minTotal = n.minTotal
    if (b.status !== n.status) e.status = n.status
    if (Object.keys(e).length) edits[n.id] = e
  }
  return { created: next.filter((n) => createdIds.has(n.id)), edits }
}

export interface NewListInput {
  name: string
  noun: string
  nounPlural: string
  standard: string
  /** Start from the skills of an existing list, or empty. */
  fromListId: string | null
}

export function validateNewList(lists: readonly SkillList[], input: NewListInput): string | null {
  const name = input.name.trim()
  if (!name) return "Give the list a name."
  if (lists.some((l) => l.name.toLowerCase() === name.toLowerCase())) return "A list with this name exists. Choose another name."
  if (!input.noun.trim() || !input.nounPlural.trim()) return "Say what the list holds, in the singular and the plural."
  if (/^items?$/i.test(input.noun.trim()) || /^items?$/i.test(input.nounPlural.trim())) return "Use the word your program uses, such as skill or competency."
  return null
}

/** A new list starts as a draft with no group, so no student sees it until it is attached. The live list is never edited. */
export function createList(lists: readonly SkillList[], input: NewListInput, id: string): SkillList {
  const from = input.fromListId ? listById(lists, input.fromListId) : undefined
  return {
    id,
    name: input.name.trim(),
    noun: input.noun.trim().toLowerCase(),
    nounPlural: input.nounPlural.trim().toLowerCase(),
    skillIds: from ? [...from.skillIds] : [],
    requiredIds: from ? [...from.requiredIds] : [],
    status: "draft",
    isDefault: false,
    groupIds: [],
    minTotal: from ? from.minTotal : 0,
    standard: input.standard.trim(),
  }
}

/** Skills that sit on no list: they still count on each record, but no list report shows them. */
export function skillsOnNoList(s: V2State, lists: readonly SkillList[]): number {
  const on = new Set(lists.flatMap((l) => l.skillIds))
  return s.skills.filter((k) => !on.has(k.id)).length
}

export const groupLabel = (groups: readonly StudentGroup[], id: string): string => groups.find((g) => g.id === id)?.label ?? id

export const studentsOf = (s: V2State, g: StudentGroup): Person[] => g.studentIds.map((id) => s.people.find((p) => p.id === id)).filter((p): p is Person => !!p)
