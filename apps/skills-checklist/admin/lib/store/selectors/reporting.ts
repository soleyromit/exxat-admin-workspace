// S-01..S-03 reporting selectors (RP-01..RP-10, AE-01..AE-05). Everything is derived from retained evidence and the
// skills' CURRENT configuration (AE-02). Student names are not unique (DEFECT-09): rows carry cohort and group.
import type { Category, ConfiguredProductSkill, Db, Id, Skill, Student, Tag } from "@/lib/domain/types"
import {
  buildRecords,
  evaluateSkill,
  explainEvaluation,
  isConfigured,
  type EvidenceFilter,
  type Reason,
  type SkillEvaluation,
  type SkillState,
  type StateCounts,
  type StudentSkillRecord,
  type UnmetCriterion,
} from "@/lib/engine"
import { currentEvaluation, evidenceOf, indexOf, norm, reviewOf, skillOf, submissionState } from "../derive"
import { locationName, recordedDetail, roleLabel, settingName, type RecordedDetail } from "./shared"

export interface ReportFilters {
  cohortId?: Id
  groupId?: Id
  /** RP-01 "clinical course". Scopes the POPULATION (students enrolled) and the SKILLS (mapped); evidence from any course still counts (CM-07) [INFER]. */
  offeringId?: Id
  categoryId?: Id
  tagId?: Id
  /** RP-08: counts only evidence gathered there and recalculates progress. */
  locationId?: Id
  /** A clinical setting id, or "lab" for lab or simulation evidence. */
  settingId?: Id | "lab"
}

export type FilterIssue =
  | { code: "locationDoesNotOfferSetting"; locationId: Id; settingId: Id }
  | { code: "labHasNoLocation"; locationId: Id }
  | { code: "groupNotInCohort"; groupId: Id; cohortId: Id }

/** RP-09: a combination that cannot produce evidence is EXPLAINED, never returned as a silent empty result. */
export function filterIssue(db: Db, f: ReportFilters): FilterIssue | null {
  if (f.locationId && f.settingId === "lab") return { code: "labHasNoLocation", locationId: f.locationId }
  if (f.locationId && f.settingId) {
    const loc = db.locations.find((l) => l.id === f.locationId)
    if (loc && !loc.settingIds.includes(f.settingId)) return { code: "locationDoesNotOfferSetting", locationId: f.locationId, settingId: f.settingId }
  }
  if (f.cohortId && f.groupId) {
    const g = db.groups.find((x) => x.id === f.groupId)
    if (g && g.cohortId !== f.cohortId) return { code: "groupNotInCohort", groupId: f.groupId, cohortId: f.cohortId }
  }
  return null
}

export function evidenceFilterOf(f: ReportFilters): EvidenceFilter | undefined {
  const e: EvidenceFilter = {}
  if (f.locationId) e.locationId = f.locationId
  if (f.settingId === "lab") e.performedIn = "lab"
  else if (f.settingId) e.clinicalSettingId = f.settingId
  return Object.keys(e).length ? e : undefined
}

export interface ReportScope {
  students: Student[]
  skills: ConfiguredProductSkill[]
}

export function reportScope(db: Db, f: ReportFilters): ReportScope {
  const off = f.offeringId ? db.offerings.find((o) => o.id === f.offeringId) : undefined
  const students = db.students.filter((s) => {
    if (f.cohortId && s.cohortId !== f.cohortId) return false
    if (f.groupId && s.groupId !== f.groupId) return false
    if (off && !off.cohortIds.includes(s.cohortId)) return false
    return true
  })
  const mapped = off ? new Set(db.offeringSkillMaps.filter((m) => m.offeringId === off.id).map((m) => m.skillId)) : null
  const skills = db.skills.filter((s): s is ConfiguredProductSkill => {
    if (!s.active || !isConfigured(s)) return false // SL-11, IM-09: out of reporting scope
    if (f.categoryId && s.categoryId !== f.categoryId) return false
    if (f.tagId && !s.tagIds.includes(f.tagId)) return false
    if (mapped && !mapped.has(s.id)) return false
    return true
  })
  return { students, skills }
}

const emptyCounts = (): StateCounts => ({ noEvidence: 0, evidenceDoesNotQualify: 0, partial: 0, achieved: 0 })

/** One record per student per skill in scope, evidence narrowed by location/setting (RP-08). */
export function scopedRecords(db: Db, f: ReportFilters): { scope: ReportScope; records: StudentSkillRecord[] } {
  const scope = reportScope(db, f)
  const ids = new Set(scope.students.map((s) => s.id))
  const evidence = evidenceOf(db).filter((e) => ids.has(e.studentId))
  const records = buildRecords({ skills: scope.skills, evidence, studentIds: scope.students.map((s) => s.id), filter: evidenceFilterOf(f) })
  return { scope, records }
}

export interface Kpis {
  studentsInView: number
  skillsInScope: number
  /** Mean achieved skills per student. */
  averageAchieved: number
  studentsAchievingAll: number
  studentsAchievingAllPct: number
  /** Skills below 50% achieved in view. */
  skillsNeedingAttention: number
}

export interface StudentReportRow {
  student: Student
  cohortName: string
  groupName: string
  counts: StateCounts
  /** Achieved over skills in scope, 0..100. */
  attainment: number
  skillsInScope: number
}

export type StudentSort = "highest" | "lowest" | "name"

export function reportByStudent(db: Db, f: ReportFilters, opts: { q?: string; sort?: StudentSort } = {}): { rows: StudentReportRow[]; kpis: Kpis; scope: ReportScope; issue: FilterIssue | null } {
  const { scope, records } = scopedRecords(db, f)
  const per = new Map<Id, StateCounts>()
  for (const s of scope.students) per.set(s.id, emptyCounts())
  for (const r of records) per.get(r.studentId)![r.evaluation.state] += 1
  const n = scope.skills.length
  let rows: StudentReportRow[] = scope.students.map((student) => {
    const counts = per.get(student.id)!
    return {
      student,
      cohortName: db.cohorts.find((c) => c.id === student.cohortId)?.name ?? "",
      groupName: db.groups.find((g) => g.id === student.groupId)?.name ?? "",
      counts,
      attainment: n ? Math.round((counts.achieved / n) * 100) : 0,
      skillsInScope: n,
    }
  })
  const q = opts.q ? norm(opts.q) : ""
  if (q) rows = rows.filter((r) => norm(r.student.name).includes(q))
  const sort = opts.sort ?? "highest"
  rows.sort((a, b) =>
    sort === "name" ? a.student.name.localeCompare(b.student.name) || a.student.id.localeCompare(b.student.id) : sort === "lowest" ? a.attainment - b.attainment || a.student.name.localeCompare(b.student.name) : b.attainment - a.attainment || a.student.name.localeCompare(b.student.name),
  )
  const bySkill = reportBySkill(db, f)
  const all = scope.students.length ? Array.from(per.values()).filter((c) => n > 0 && c.achieved === n).length : 0
  const kpis: Kpis = {
    studentsInView: scope.students.length,
    skillsInScope: n,
    averageAchieved: scope.students.length ? Array.from(per.values()).reduce((a, c) => a + c.achieved, 0) / scope.students.length : 0,
    studentsAchievingAll: all,
    studentsAchievingAllPct: scope.students.length ? Math.round((all / scope.students.length) * 100) : 0,
    skillsNeedingAttention: bySkill.rows.filter((r) => r.percentAchieved < 50).length,
  }
  return { rows, kpis, scope, issue: filterIssue(db, f) }
}

export interface SkillReportRow {
  skill: ConfiguredProductSkill
  category: Category | null
  studentsInView: number
  counts: StateCounts
  percentAchieved: number
  courseCount: number
  /** RP-03: only when the report is scoped to a course. */
  requirement: "mandatory" | "nonMandatory" | null
}

export function reportBySkill(db: Db, f: ReportFilters): { rows: SkillReportRow[]; scope: ReportScope; issue: FilterIssue | null } {
  const { scope, records } = scopedRecords(db, f)
  const rows: SkillReportRow[] = scope.skills.map((skill) => {
    const counts = emptyCounts()
    for (const r of records) if (r.skillId === skill.id) counts[r.evaluation.state] += 1
    const n = scope.students.length
    return {
      skill,
      category: db.categories.find((c) => c.id === skill.categoryId) ?? null,
      studentsInView: n,
      counts,
      percentAchieved: n ? Math.round((counts.achieved / n) * 100) : 0,
      courseCount: db.offeringSkillMaps.filter((m) => m.skillId === skill.id).length,
      requirement: f.offeringId ? (db.offeringSkillMaps.find((m) => m.offeringId === f.offeringId && m.skillId === skill.id)?.requirement ?? null) : null,
    }
  })
  rows.sort((a, b) => a.percentAchieved - b.percentAchieved || a.skill.name.localeCompare(b.skill.name))
  return { rows, scope, issue: filterIssue(db, f) }
}

export interface TagReportRow {
  tag: Tag
  skillCount: number
  categoriesSpanned: number
  /** Student-skill records, NOT students (RP-04): a skill with several tags is counted under each, so rows overlap. */
  counts: StateCounts
  percentAchieved: number
  studentsAchievingAll: number
}

export function reportByTag(db: Db, f: ReportFilters): { rows: TagReportRow[]; scope: ReportScope; issue: FilterIssue | null } {
  const { scope, records } = scopedRecords(db, f)
  const rows: TagReportRow[] = db.tags.filter((t) => t.active).map((tag) => {
    const skills = scope.skills.filter((s) => s.tagIds.includes(tag.id))
    const ids = new Set(skills.map((s) => s.id))
    const counts = emptyCounts()
    const perStudent = new Map<Id, number>()
    for (const r of records) {
      if (!ids.has(r.skillId)) continue
      counts[r.evaluation.state] += 1
      if (r.evaluation.state === "achieved") perStudent.set(r.studentId, (perStudent.get(r.studentId) ?? 0) + 1)
    }
    const total = counts.noEvidence + counts.evidenceDoesNotQualify + counts.partial + counts.achieved
    return {
      tag,
      skillCount: skills.length,
      categoriesSpanned: new Set(skills.map((s) => s.categoryId).filter(Boolean)).size,
      counts,
      percentAchieved: total ? Math.round((counts.achieved / total) * 100) : 0,
      studentsAchievingAll: skills.length ? Array.from(perStudent.values()).filter((n) => n === skills.length).length : 0,
    }
  })
  return { rows, scope, issue: filterIssue(db, f) }
}

// ------------------------------------------------------------------ one student, one skill (S-02, S-03)

export interface SkillProgress {
  skill: ConfiguredProductSkill
  evaluation: SkillEvaluation
  total: { have: number; needed: number | null; noun: "demonstrations" | "qualifyingEvaluations" }
  /** SC-10: demonstration skills only. */
  levels: Array<{ levelId: Id; label: string; have: number; min: number }>
  /** SH-05, RP-08: progress against EACH named clinical setting. Lab evidence never satisfies one (SC-12). */
  settings: Array<{ settingId: Id; name: string; have: number; needed: number; labEvidence: number }>
}

export function skillProgress(db: Db, studentId: Id, skillId: Id, filter?: EvidenceFilter): SkillProgress | null {
  const skill = skillOf(db, skillId)
  if (!skill || !isConfigured(skill)) return null
  const mine = indexOf(db).evidenceByStudentSkill.get(`${studentId}:${skillId}`) ?? []
  const evaluation = evaluateSkill(skill, mine, filter)
  const m = skill.model
  return {
    skill,
    evaluation,
    total: { have: evaluation.qualifyingCount, needed: skill.criteria.requiredCount, noun: m.kind === "demonstration" ? "demonstrations" : "qualifyingEvaluations" },
    levels: m.kind === "demonstration" ? m.levels.map((l) => ({ levelId: l.id, label: l.label, have: evaluation.perLevel[l.id] ?? 0, min: skill.criteria.levelMinimums[l.id] ?? 0 })).filter((l) => l.min > 0 || l.have > 0) : [],
    settings: Object.entries(skill.criteria.settingMinimums).map(([id, needed]) => {
      const u = evaluation.unmet.find((x): x is Extract<UnmetCriterion, { rule: "settingMinimum" }> => x.rule === "settingMinimum" && x.settingId === id)
      return { settingId: id, name: settingName(db, id) ?? id, have: evaluation.perSetting[id] ?? 0, needed, labEvidence: u?.labEvidence ?? 0 }
    }),
  }
}

export interface StudentSkillRow {
  skill: ConfiguredProductSkill
  progress: SkillProgress
}

/** S-02: one student, every skill in scope. */
export function studentOverview(db: Db, studentId: Id, f: ReportFilters = {}): { student: Student; cohortName: string; groupName: string; rows: StudentSkillRow[]; counts: StateCounts } | null {
  const student = db.students.find((s) => s.id === studentId)
  if (!student) return null
  const scope = reportScope(db, { ...f, cohortId: undefined, groupId: undefined })
  const rows: StudentSkillRow[] = []
  const counts = emptyCounts()
  for (const skill of scope.skills) {
    const progress = skillProgress(db, studentId, skill.id, evidenceFilterOf(f))!
    rows.push({ skill, progress })
    counts[progress.evaluation.state] += 1
  }
  return { student, cohortName: db.cohorts.find((c) => c.id === student.cohortId)?.name ?? "", groupName: db.groups.find((g) => g.id === student.groupId)?.name ?? "", rows, counts }
}

// ------------------------------------------------------------------ evidence ledger (S-03) and failed rules (SH-03)

export interface LedgerRow {
  submissionId: Id
  evaluationId: Id | null
  attempt: number
  revision: number
  /** completedAt when evaluated, else sentAt. */
  date: string
  offeringId: Id
  performedIn: "clinical" | "lab"
  settingName: string | null
  locationName: string | null
  evaluatorName: string
  evaluatorRole: string
  state: ReturnType<typeof submissionState>
  /** RP-07: full responses, comment, supplied values. */
  recorded: RecordedDetail | null
  comment: string
  studentNote: string
  values: Array<{ label: string; value: string | number }>
  selfEvaluation: RecordedDetail | null
  reviewerNote: string | null
}

export function evidenceLedger(db: Db, studentId: Id, skillId: Id): LedgerRow[] {
  const skill = skillOf(db, skillId)
  if (!skill) return []
  const subs = indexOf(db).subsByStudentSkill.get(`${studentId}:${skillId}`) ?? []
  return subs
    .map((sub): LedgerRow => {
      const ev = currentEvaluation(db, sub)
      const rv = ev ? reviewOf(db, ev.id) : undefined
      return {
        submissionId: sub.id,
        evaluationId: ev?.id ?? null,
        attempt: sub.attempt,
        revision: sub.revision,
        date: ev?.completedAt ?? sub.sentAt,
        offeringId: sub.offeringId,
        performedIn: sub.performedIn,
        settingName: settingName(db, sub.clinicalSettingId),
        locationName: locationName(db, sub.locationId),
        evaluatorName: sub.evaluator.name,
        evaluatorRole: roleLabel(db, sub.evaluator.roleId),
        state: submissionState(db, sub),
        recorded: ev ? recordedDetail(skill, ev.responses) : null,
        comment: ev?.comment ?? "",
        studentNote: sub.studentNote,
        values: skill.submissionFields.filter((f) => sub.values[f.id] !== undefined).map((f) => ({ label: f.label, value: sub.values[f.id] })),
        selfEvaluation: sub.selfEvaluation ? recordedDetail(skill, sub.selfEvaluation) : null,
        reviewerNote: rv && rv.note ? rv.note : null,
      }
    })
    .sort((a, b) => a.attempt - b.attempt || a.revision - b.revision)
}

export interface FailedRule {
  /** Why one completed evaluation did not qualify (SH-03, docs/ux/09 §7.1). Empty for demonstration skills. */
  evaluationReasons: Reason[]
  /** Why the skill is not yet achieved even though evidence counts (docs/ux/09 §7.2), most actionable first, at most three. */
  skillReasons: UnmetCriterion[]
  waiting: Array<{ submissionId: Id; with: string }>
  returnedCount: number
}

const ACTIONABLE: Record<UnmetCriterion["rule"], number> = { settingMinimum: 0, levelMinimum: 1, requiredCount: 2 }

/** Structured data for the failed-rule explainer. Copy is generated from this at read time, never stored (AE-02). */
export function failedRule(db: Db, studentId: Id, skillId: Id, submissionId?: Id): FailedRule | null {
  const skill = skillOf(db, skillId)
  if (!skill || !isConfigured(skill)) return null
  const subs = indexOf(db).subsByStudentSkill.get(`${studentId}:${skillId}`) ?? []
  const target = submissionId ? subs.find((s) => s.id === submissionId) : undefined
  const ev = target ? currentEvaluation(db, target) : undefined
  const evaluationReasons = ev ? explainEvaluation(ev.responses, skill.model).reasons : []
  const prog = skillProgress(db, studentId, skillId)!
  const skillReasons = [...prog.evaluation.unmet].sort((a, b) => ACTIONABLE[a.rule] - ACTIONABLE[b.rule]).slice(0, 3)
  const waiting = subs.filter((s) => ["awaitingEvaluator", "revised", "awaitingApproval"].includes(submissionState(db, s))).map((s) => ({ submissionId: s.id, with: submissionState(db, s) === "awaitingApproval" ? "reviewer" : s.evaluator.name }))
  return { evaluationReasons, skillReasons, waiting, returnedCount: subs.filter((s) => submissionState(db, s) === "returned").length }
}

export type { SkillState }
export type { Skill }
