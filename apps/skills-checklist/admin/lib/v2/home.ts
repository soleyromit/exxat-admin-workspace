import { coverageWarnings, type CoverageWarning } from "./coverage"
import { approvalsInScope, type ApprovalEntry } from "./approvals"
import { evaluatorOf, itemLabel, stalledRequests } from "./queue"
import type { PillValue } from "./status-pill"
import { behindPace, heatmap, NO_FILTERS, paceRows, type PaceRow } from "./reports"
import { MODEL_LABEL } from "./config"
import { skillName, personName } from "./selectors"
import type { EvalModel, Skill, V2State } from "./types"
import { verificationRows } from "./verification"

/**
 * Admin Home selectors. Pure functions of V2State. Rows name the work (skills, students), never a bare count. Confidential
 * concerns are never read here (D23).
 */

const ADMIN_BASE = "/v2/admin"
export const HOME_LINKS = {
  library: `${ADMIN_BASE}/starter-library`,
  courses: `${ADMIN_BASE}/map-courses`,
  review: `${ADMIN_BASE}/review-queue`,
  outcomes: `${ADMIN_BASE}/outcomes`,
  records: `${ADMIN_BASE}/verification`,
  reports: `${ADMIN_BASE}/reports`,
  configure: (skillId: string) => `${ADMIN_BASE}/configure-skill?skill=${skillId}`,
  publish: (skillId: string) => `${ADMIN_BASE}/validate-publish?skill=${skillId}`,
} as const

// ---------------------------------------------------------------------------------------------------------------------
// Set up

export interface SetupMeter {
  id: "configured" | "published" | "mapped"
  label: string
  value: number
  total: number
}

export interface SetupSummary {
  unconfigured: Skill[]
  unpublished: Skill[]
  unmapped: Skill[]
  warnings: CoverageWarning[]
  meters: SetupMeter[]
  /** True when no setup row has anything in it. */
  complete: boolean
}

export function setupSummary(s: V2State): SetupSummary {
  const mappedIds = new Set(s.mappings.filter((m) => m.courseId === s.course.id).map((m) => m.skillId))
  const unconfigured = s.skills.filter((k) => !k.configured)
  const unpublished = s.skills.filter((k) => k.configured && !k.published)
  const publishedSkills = s.skills.filter((k) => k.published)
  const unmapped = publishedSkills.filter((k) => !mappedIds.has(k.id))
  const warnings = coverageWarnings(s)
  return {
    unconfigured,
    unpublished,
    unmapped,
    warnings,
    meters: [
      { id: "configured", label: "Configured", value: s.skills.filter((k) => k.configured).length, total: s.skills.length },
      { id: "published", label: "In use", value: publishedSkills.length, total: s.skills.length },
      { id: "mapped", label: `Mapped to ${s.course.code}`, value: publishedSkills.length - unmapped.length, total: publishedSkills.length },
    ],
    complete: unconfigured.length + unpublished.length + unmapped.length + warnings.length === 0,
  }
}

export interface ModelCount {
  model: EvalModel
  label: string
  count: number
}

/** Configured skills grouped by evaluation model, in the order the wizard lists the models. Skills with no model chosen are not counted. */
export function configuredByModel(s: V2State): ModelCount[] {
  const order: EvalModel[] = ["binary", "question", "scored", "demonstration"]
  return order.map((model) => ({ model, label: MODEL_LABEL[model], count: s.skills.filter((k) => k.configured && k.model === model).length }))
}

// ---------------------------------------------------------------------------------------------------------------------
// Needs attention

export interface AttentionRow {
  key: string
  label: string
  href: string
}

export interface AttentionSummary {
  approvals: AttentionRow[]
  stalled: AttentionRow[]
  behind: Array<{ studentId: string; name: string; behindBy: number }>
  plans: AttentionRow[]
  changed: AttentionRow[]
  /** True when every list is empty. */
  clear: boolean
}

/** "Student, first skill" plus "and 1 more" when the item carries several skills. */
function compactLabel(s: V2State, item: { studentId: string; skillIds: string[] }): string {
  const [first, ...rest] = item.skillIds
  return `${personName(s, item.studentId)}, ${first ? skillName(s, first) : "no skill"}${rest.length ? ` and ${rest.length} more` : ""}`
}

/** The approval queue as every screen reads it (lib/v2/approvals.ts, default scope: current term). */
const approvalList = (s: V2State): ApprovalEntry[] => approvalsInScope(s).entries
const reviewHref = (i: ApprovalEntry) => (i.kind === "submission" ? `${HOME_LINKS.review}/${i.key}` : HOME_LINKS.review)

export function attentionSummary(s: V2State): AttentionSummary {
  const approvals = approvalList(s).map((i): AttentionRow => ({ key: i.key, label: compactLabel(s, i), href: reviewHref(i) }))
  const stalled = stalledRequests(s).map((x): AttentionRow => ({ key: x.id, label: `${itemLabel(s, x)}, with ${personName(s, x.candidateIds?.[0] ?? x.assignedToId)} for ${x.daysWaiting} ${x.daysWaiting === 1 ? "day" : "days"}`, href: HOME_LINKS.review }))
  const behind = behindPace(s).map((r) => ({ studentId: r.studentId, name: r.name, behindBy: r.behindBy }))
  const plans = s.remediations
    .filter((r) => r.status !== "closed")
    .map((r): AttentionRow => ({ key: r.id, label: `${personName(s, r.studentId)}, ${skillName(s, r.skillId)}`, href: `${ADMIN_BASE}/remediation/${r.id}` }))
  const changed = verificationRows(s)
    .filter((r) => r.status === "changed")
    .map((r): AttentionRow => ({ key: r.studentId, label: r.name, href: `${HOME_LINKS.records}/${r.studentId}` }))
  return { approvals, stalled, behind, plans, changed, clear: approvals.length + stalled.length + behind.length + plans.length + changed.length === 0 }
}

// ---------------------------------------------------------------------------------------------------------------------
// Cohort

export interface WeakSkill {
  skillId: string
  name: string
  achieved: number
  inProgress: number
  notMetYet: number
  notStarted: number
  students: number
}

/** The mandatory skills the fewest students have achieved, weakest first. Ties break by name. */
export function weakestSkills(s: V2State, n = 5): WeakSkill[] {
  const { skills, rows } = heatmap(s, { ...NO_FILTERS, mandatoryOnly: true })
  return skills
    .map((r, i): WeakSkill => {
      const cells = rows.map((row) => row.cells[i])
      return {
        skillId: r.skill.id,
        name: r.skill.name,
        achieved: cells.filter((c) => c.state === "achieved").length,
        inProgress: cells.filter((c) => c.state === "half" || c.state === "some").length,
        notMetYet: cells.filter((c) => c.state === "attempted").length,
        notStarted: cells.filter((c) => c.state === "none").length,
        students: cells.length,
      }
    })
    .sort((a, b) => a.achieved - b.achieved || b.notStarted - a.notStarted || a.name.localeCompare(b.name))
    .slice(0, n)
}

export interface PaceDot {
  id: string
  label: string
  /** Collected evaluations as a share of what the mandatory rules ask for, 0 to 100. */
  value: number
  flagged: boolean
  note?: string
}

export interface PaceStrip {
  dots: PaceDot[]
  /** Expected share by now, 0 to 100. */
  pace: number
  behind: number
}

const share = (r: PaceRow) => (r.needed === 0 ? 0 : Math.round((r.collected / r.needed) * 100))

export function paceStrip(s: V2State): PaceStrip {
  const rows = paceRows(s)
  const first = rows.find((r) => r.needed > 0)
  const pace = first ? Math.round((first.expected / first.needed) * 100) : 0
  return {
    pace,
    behind: rows.filter((r) => r.behindBy > 0).length,
    dots: rows.map((r) => ({ id: r.studentId, label: r.name, value: share(r), flagged: r.behindBy > 0, note: r.behindBy > 0 ? `${r.behindBy} short` : undefined })),
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Courses

export interface CourseCoverage {
  mandatory: number
  /** Optional and not expected. */
  other: number
  /** Configured but not mapped to the course. */
  unmapped: number
  /** Not mapped and not configured, so they cannot be mapped yet (IM-09). */
  blocked: number
  total: number
}

/** Where every library skill stands against the course. Each skill is counted once. */
export function courseCoverage(s: V2State): CourseCoverage {
  const level = new Map(s.mappings.filter((m) => m.courseId === s.course.id).map((m) => [m.skillId, m.level]))
  const out: CourseCoverage = { mandatory: 0, other: 0, unmapped: 0, blocked: 0, total: s.skills.length }
  for (const k of s.skills) {
    const l = level.get(k.id)
    if (l === "mandatory") out.mandatory++
    else if (l) out.other++
    else if (!k.configured) out.blocked++
    else out.unmapped++
  }
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Dashboard: KPI numbers and linked rows (contract V2-admin-home-dashboard). Remediation is out of scope (REQ section 14) and
// confidential concerns are never read (D23), so neither appears in anything below.

export interface HomeKpis {
  inUse: number
  totalSkills: number
  waiting: number
  stalled: number
  behind: number
  students: number
  warnings: number
  courseCode: string
}

/** The four numbers in the Home strip. Each is the length of a list the page also shows, so tile and rows cannot disagree. */
export function homeKpis(s: V2State): HomeKpis {
  const students = s.people.filter((p) => p.kind === "student").length
  return {
    inUse: s.skills.filter((k) => k.published).length,
    totalSkills: s.skills.length,
    waiting: approvalList(s).length,
    stalled: stalledRequests(s).length,
    behind: behindPace(s).length,
    students,
    warnings: coverageWarnings(s).length,
    courseCode: s.course.code,
  }
}

/** One status per row, always a value of the shared table in lib/v2/status-pill.ts. `label` overrides the word only. */
export type HomePill =
  | { kind: "skill"; value: PillValue<"skill">; label?: string }
  | { kind: "verify"; value: PillValue<"verify">; label?: string }
  | { kind: "queue"; value: PillValue<"queue">; label?: string }
  | { kind: "attempt"; value: PillValue<"attempt">; label?: string }
  | { kind: "cell"; value: PillValue<"cell">; label?: string }

export interface HomeRow {
  key: string
  pill: HomePill
  /** The skill or student, linked to its own screen. */
  name: string
  href: string
  detail: string
  action: { label: string; href: string; ariaLabel: string }
}

export interface HomeRowSet {
  rows: HomeRow[]
  /** Links standing in for rows that did not fit, for example "and 14 more skills to configure". */
  overflow: Array<{ key: string; text: string; href: string }>
}

/** Rows shown per kind before the rest collapse into one overflow link. */
export const ROWS_PER_KIND = 2

function capped(rows: HomeRow[], max: number, text: (rest: number) => string, href: string, key: string, into: HomeRowSet) {
  into.rows.push(...rows.slice(0, max))
  if (rows.length > max) into.overflow.push({ key, text: text(rows.length - max), href })
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/**
 * Set up rows, blocking first: coverage gaps that stop students submitting, in-use skills the course does not carry, configured
 * skills one step from live, then the unconfigured backlog (IM-09). A skill that already has a coverage row is not repeated.
 */
export function setupRows(s: V2State): HomeRowSet {
  const out: HomeRowSet = { rows: [], overflow: [] }
  const code = s.course.code
  const setup = setupSummary(s)
  const warned = new Set<string>()

  const warnings = setup.warnings.map((w): HomeRow => {
    if (w.skillId) warned.add(w.skillId)
    const unconfigured = w.kind === "unconfigured-mapped" && w.skillId
    return {
      key: `warn-${w.id}`,
      pill: { kind: "verify", value: "changed", label: "Coverage gap" },
      name: w.skillId ? skillName(s, w.skillId) : code,
      href: unconfigured ? HOME_LINKS.configure(w.skillId!) : HOME_LINKS.courses,
      detail: w.message,
      action: unconfigured
        ? { label: "Configure", href: HOME_LINKS.configure(w.skillId!), ariaLabel: `Configure ${skillName(s, w.skillId!)}` }
        : { label: "Open Courses", href: HOME_LINKS.courses, ariaLabel: `Open Courses for ${w.skillId ? skillName(s, w.skillId) : code}` },
    }
  })
  capped(warnings, ROWS_PER_KIND, (n) => `and ${n} more coverage ${plural(n, "warning", "warnings")}`, HOME_LINKS.courses, "more-warnings", out)

  const unmapped = setup.unmapped
    .filter((k) => !warned.has(k.id))
    .map((k): HomeRow => ({
      key: `unmapped-${k.id}`,
      pill: { kind: "skill", value: "in-use" },
      name: k.name,
      href: HOME_LINKS.courses,
      detail: `In use, not in ${code}`,
      action: { label: "Open Courses", href: HOME_LINKS.courses, ariaLabel: `Open Courses to add ${k.name}` },
    }))
  capped(unmapped, ROWS_PER_KIND, (n) => `and ${n} more ${plural(n, "skill", "skills")} not in ${code}`, HOME_LINKS.courses, "more-unmapped", out)

  const unpublished = setup.unpublished.map((k): HomeRow => ({
    key: `unpublished-${k.id}`,
    pill: { kind: "skill", value: "configured" },
    name: k.name,
    href: HOME_LINKS.publish(k.id),
    detail: "Configured, ready to review",
    action: { label: "Review and publish", href: HOME_LINKS.publish(k.id), ariaLabel: `Review and publish ${k.name}` },
  }))
  capped(unpublished, ROWS_PER_KIND, (n) => `and ${n} more configured ${plural(n, "skill", "skills")} not in use`, HOME_LINKS.library, "more-unpublished", out)

  const unconfigured = setup.unconfigured
    .filter((k) => !warned.has(k.id))
    .map((k): HomeRow => ({
      key: `unconfigured-${k.id}`,
      pill: { kind: "skill", value: "not-configured" },
      name: k.name,
      href: HOME_LINKS.configure(k.id),
      detail: "Cannot be mapped or submitted against yet",
      action: { label: "Configure", href: HOME_LINKS.configure(k.id), ariaLabel: `Configure ${k.name}` },
    }))
  capped(unconfigured, ROWS_PER_KIND, (n) => `and ${n} more ${plural(n, "skill", "skills")} to configure`, HOME_LINKS.library, "more-unconfigured", out)
  return out
}

/** Needs attention rows, blocking first: stalled requests, approvals, students behind pace, records changed since verified. */
export function attentionRows(s: V2State): HomeRowSet {
  const out: HomeRowSet = { rows: [], overflow: [] }

  const stalled = stalledRequests(s).map((x): HomeRow => ({
    key: `stalled-${x.id}`,
    pill: { kind: "attempt", value: "waiting", label: `Stalled, ${x.daysWaiting} ${plural(x.daysWaiting, "day", "days")}` },
    name: itemLabel(s, x),
    href: HOME_LINKS.review,
    detail: `With ${personName(s, evaluatorOf(x))}, no response yet`,
    action: { label: "Open Review and approve", href: HOME_LINKS.review, ariaLabel: `Open Review and approve for ${itemLabel(s, x)}` },
  }))
  capped(stalled, ROWS_PER_KIND, (n) => `and ${n} more stalled ${plural(n, "request", "requests")}`, HOME_LINKS.review, "more-stalled", out)

  const approvals = approvalList(s).map((i): HomeRow => {
    const [first, ...rest] = i.skillIds
    const who = personName(s, i.studentId)
    return {
      key: `approval-${i.key}`,
      pill: i.needsOutcome ? { kind: "queue", value: "needs-outcome" } : { kind: "queue", value: "ready" },
      name: who,
      href: reviewHref(i),
      detail: `${first ? skillName(s, first) : "No skill"}${rest.length ? ` and ${rest.length} more` : ""}`,
      action: { label: "Review", href: reviewHref(i), ariaLabel: `Review the request from ${who}` },
    }
  })
  capped(approvals, 3, (n) => `and ${n} more waiting for approval`, HOME_LINKS.review, "more-approvals", out)

  const behind = behindPace(s).map((r): HomeRow => ({
    key: `behind-${r.studentId}`,
    pill: { kind: "cell", value: "attempted", label: `${r.behindBy} short` },
    name: r.name,
    href: `${HOME_LINKS.records}/${r.studentId}`,
    detail: `${r.behindBy} ${plural(r.behindBy, "evaluation", "evaluations")} short of the expected pace`,
    action: { label: "Open record", href: `${HOME_LINKS.records}/${r.studentId}`, ariaLabel: `Open the record of ${r.name}` },
  }))
  capped(behind, 3, (n) => `and ${n} more ${plural(n, "student", "students")} behind pace`, HOME_LINKS.reports, "more-behind", out)

  const changed = verificationRows(s)
    .filter((r) => r.status === "changed")
    .map((r): HomeRow => ({
      key: `changed-${r.studentId}`,
      pill: { kind: "verify", value: "changed" },
      name: r.name,
      href: `${HOME_LINKS.records}/${r.studentId}`,
      detail: "Record changed since it was verified",
      action: { label: "Open record", href: `${HOME_LINKS.records}/${r.studentId}`, ariaLabel: `Open the record of ${r.name}` },
    }))
  capped(changed, ROWS_PER_KIND, (n) => `and ${n} more ${plural(n, "record", "records")} changed since verified`, HOME_LINKS.records, "more-changed", out)
  return out
}
