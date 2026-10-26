import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { approvalEntries, approvalsInScope, approvalTotals, heldByRule, heldReason } from "@/lib/v2/approvals"
import { facts } from "@/lib/v2/facts"
import { approvalRules } from "@/lib/lab/rbac"
import { labState, reviewRows, scopeRows } from "@/lib/lab/reviewer"
import { EMPTY_SCOPE } from "@/lib/lab/scope"

/**
 * "Rule needs approval" comes only from skills whose configuration asks for approval (SC-15), and every stored hold sits on such a
 * skill (dataset spec section 12.7). The queue totals did not move: 35 entries, 41 evaluations in Fall 2026.
 */

const s = createSeed()
const flagged = new Set(s.skills.filter((k) => k.config?.approvalRequired).map((k) => k.id))

describe("rule holds and the approval setting agree", () => {
  it("every stored awaiting-approval evaluation sits on a skill that asks for approval", () => {
    const stored = s.evaluations.filter((e) => e.status === "awaiting-approval")
    expect(stored.length).toBeGreaterThan(0)
    for (const e of stored) expect(flagged.has(e.skillId), `${e.id} on ${e.skillId}`).toBe(true)
  })

  it("an entry lists 'rule' only when one of its evaluations is held by the skill's rule", () => {
    for (const e of approvalEntries(s)) {
      const byRule = e.evaluations.some((x) => heldByRule(s, x))
      expect(e.causes.includes("rule"), e.key).toBe(byRule)
      if (e.causes.includes("rule")) expect(e.skillIds.some((id) => flagged.has(id)), e.key).toBe(true)
    }
  })

  it("the queue totals are unchanged (35 entries, 41 evaluations; 20 stored, 19 unadopted)", () => {
    const f = facts(s)
    expect([f.awaitingApproval, f.awaitingApprovalEvaluations, f.awaitingApprovalStatusRows, f.awaitingApprovalUnverifiedRows]).toEqual([35, 41, 20, 19])
    const t = approvalTotals(s, approvalsInScope(s).entries)
    expect(t.byCause).toEqual({ "new-evaluator": 19, rule: 12, disagree: 2, paper: 2 })
  })

  it("Admin Approvals rules: every rule that holds evidence has the setting on (no 'Not set' beside a held count)", () => {
    const held = labState(s)
    const rows = scopeRows(held, reviewRows(held), EMPTY_SCOPE).rows
    const r = approvalRules(held, rows)
    expect(r.rules.length).toBeGreaterThan(0)
    for (const x of r.rules) expect(x.setting, x.name).toBe(true)
    expect(r.rules.filter((x) => x.holding > 0).length).toBeGreaterThan(3)
    expect(r.ruleCount).toBe(flagged.size)
  })

  it("counted evaluations on approval skills carry the approval, except evidence from names not adopted yet", () => {
    const unadopted = new Set(s.people.filter((p) => p.verified === false).map((p) => p.id))
    for (const e of s.evaluations) if (e.status === "counted" && flagged.has(e.skillId) && !unadopted.has(e.evaluatorId)) expect(e.review?.decision, e.id).toBe("approved")
  })

  it("heldReason: rule after any other cause, so the first cause does not change", () => {
    expect(heldReason({ needsOutcome: false, evaluatorUnverified: false, agreement: "differed", ruleApplies: true })).toEqual(["disagree", "rule"])
    expect(heldReason({ needsOutcome: false, evaluatorUnverified: false, agreement: "agreed", ruleApplies: true })).toEqual(["rule"])
    expect(heldReason({ needsOutcome: true, evaluatorUnverified: false, agreement: "none", ruleApplies: false })).toEqual(["paper"])
  })
})
