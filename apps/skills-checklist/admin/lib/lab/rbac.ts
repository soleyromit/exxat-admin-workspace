/**
 * Role is a permission, not a path (strategy/01 IA-3). One staff screen is built once and rendered for several roles; what differs
 * is the set of actions a role may take. This file is the one place those sets live, so a screen asks `can(role, perm)` instead of
 * branching on the persona.
 *
 * Sources: [REQ SC-15] the program decides which skills need approval before evidence counts (an admin capability); [REQ AR-01..05]
 * the reviewer approves or returns; [REQ RP-05, RP-06] reports and export; strategy/01 IA-3 and 7.2 (a role chip lives in the bar
 * only for people who hold more than one role, never on a page). The director role is a v2 proposal, not REQ [AUDIT T3]: its set
 * here is the lab's reading (read and export, no configuration, no approval) [INFER].
 * Not decided here: director verification scope (ledger Q3), whether a reviewer is limited to assigned courses (no assignment data
 * exists in the dataset, so every role sees every program it holds; the dataset has one program) [INFER].
 */
import type { V2State } from "@/lib/v2/types"
import type { ReviewRow } from "./reviewer"

export type StaffRole = "admin" | "reviewer" | "director"

export type Permission =
  /** Approve or return held submissions, adopt or merge an evaluator name. */
  | "approve"
  /** Choose which skills hold evidence for approval (SC-15). */
  | "configureApprovalRules"
  /** Configure skills, rules and mappings. */
  | "configure"
  /** Download reports and evidence. */
  | "export"
  /** See every program and cohort the institution holds, not only assigned ones. */
  | "seeAllPrograms"

export const ROLE_PERMISSIONS: Record<StaffRole, ReadonlySet<Permission>> = {
  admin: new Set<Permission>(["approve", "configureApprovalRules", "configure", "export", "seeAllPrograms"]),
  reviewer: new Set<Permission>(["approve"]),
  director: new Set<Permission>(["export", "seeAllPrograms"]),
}

export const ROLE_LABEL: Record<StaffRole, string> = { admin: "Administrator", reviewer: "Reviewer", director: "Program director" }

export const can = (role: StaffRole, perm: Permission): boolean => ROLE_PERMISSIONS[role].has(perm)

/** Strategy/01 section 7.2: the role chip belongs to the shell's role switch, never to a page. Kept as data so a test pins it. */
export const SHOW_PAGE_ROLE_CHIP = false

// ---------------------------------------------------------------------------------------------------------------------
// Approval rules (admin/approvals variant B): which skills hold for approval and how many submissions each holds now.

export interface ApprovalRuleRow extends Record<string, unknown> {
  skillId: string
  name: string
  section: string
  /** The skill's configuration asks for approval now. */
  setting: boolean
  /** Submissions in scope that include this skill and wait because its rule holds them. */
  holding: number
  /** Students behind those submissions. */
  students: number
  oldestDays: number
  /** Oldest held submission for this skill, for a direct link. */
  oldestKey: string | null
}

export interface ApprovalRules {
  rules: ApprovalRuleRow[]
  /** Skills in the library whose configuration asks for approval. */
  ruleCount: number
  /** Configured skills that do not ask for approval. */
  openCount: number
  /** Queue rows in scope that wait for a reason other than a rule (new evaluator name, disagreement, paper form). */
  otherReasons: number
  /** Queue rows in scope held by a rule (one row may cover several rule skills). */
  ruleHeld: number
}

/**
 * `rows` are the queue rows already in scope (ApprovalsFrame `rowsInScope`), so the totals match the Approvals count.
 * Listed skills: every skill whose configuration asks for approval, plus every skill a rule-held submission covers. Since seed
 * 2026-10-26.4 the second set is inside the first: "Rule needs approval" comes only from skills with `config.approvalRequired`
 * (lib/v2/approvals.ts heldByRule) and the generator puts every stored hold on such a skill, so `setting` is true on every row
 * (tests/v2/approvals-rule.test.ts). The field stays so a skill whose flag is switched off while it still holds evidence shows.
 */
export function approvalRules(state: V2State, rows: ReviewRow[]): ApprovalRules {
  const held = rows.filter((r) => r.reasons.includes("rule"))
  const heldIds = new Set(held.flatMap((r) => r.skillIds))
  const flagged = state.skills.filter((k) => k.configured && k.config?.approvalRequired)
  const listed = state.skills.filter((k) => (k.configured && k.config?.approvalRequired) || heldIds.has(k.id))
  const rules = listed
    .map((k) => {
      const mine = held.filter((r) => r.skillIds.includes(k.id)).sort((a, b) => b.days - a.days)
      return { skillId: k.id, name: k.name, section: k.category, setting: !!k.config?.approvalRequired, holding: mine.length, students: new Set(mine.map((r) => r.studentId)).size, oldestDays: mine[0]?.days ?? 0, oldestKey: mine[0]?.key ?? null }
    })
    .sort((a, b) => b.holding - a.holding || b.oldestDays - a.oldestDays || a.name.localeCompare(b.name))
  return {
    rules,
    ruleCount: flagged.length,
    openCount: state.skills.filter((k) => k.configured).length - flagged.length,
    otherReasons: rows.length - held.length,
    ruleHeld: held.length,
  }
}
