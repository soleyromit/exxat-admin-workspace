import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { directory } from "@/lib/lab/evaluators"
import { mergeTargets, newEvaluatorRows } from "@/lib/lab/new-evaluators"
import { commitDecision, labState } from "@/lib/lab/reviewer"
import { NEW_EVALUATORS_HREF } from "@/lib/lab/admin-ia"

/**
 * Admin Approvals, New evaluators tab (Romit 2026-10-27, "sure"): one row per evaluator name a student typed, the tab count equal to
 * the dashboard tile "Evaluators not yet verified" (one definition per figure), Confirm and Merge with... as the reviewer's adopt
 * decision with the reviewer note kept.
 */

const seed = createSeed()
const lab = (f: string) => readFileSync(join(__dirname, "../../components/lab", f), "utf8")

describe("New evaluators: one figure", () => {
  it("the tab rows, the facts registry and the directory agree (14 in the reference data)", () => {
    const s = labState(seed)
    const rows = newEvaluatorRows(s)
    expect(rows.length).toBe(facts(s).unverifiedEvaluators)
    expect(rows.length).toBe(directory(s).summary.awaiting)
    expect(rows.length).toBe(facts(seed).unverifiedEvaluators)
    expect(rows.length).toBe(14)
  })

  it("each row says who added the name, for which request, and how many sign-offs wait", () => {
    const rows = newEvaluatorRows(labState(seed))
    for (const r of rows) {
      expect(r.name).toBeTruthy()
      expect(r.email).toContain("@")
      expect(r.addedBy).toBeTruthy()
      expect(r.waiting).toBeGreaterThanOrEqual(0)
    }
    expect(rows.some((r) => r.addedById && r.request)).toBe(true)
    expect(rows.reduce((n, r) => n + r.waiting, 0)).toBeGreaterThan(0)
  })

  it("the dashboard tile links to this tab, and the admin variants turn the tab on", () => {
    expect(NEW_EVALUATORS_HREF).toBe("/lab/admin/approvals?tab=new-evaluators")
    expect(lab("screens/admin-dashboard-a.tsx")).toMatch(/UnverifiedEvaluatorsTile[^\n]*href=\{NEW_EVALUATORS_HREF\}/)
    expect(lab("screens/admin-approvals-a.tsx")).toMatch(/ApprovalsTabsContext\.Provider value/)
    expect(lab("screens/admin-approvals-b.tsx")).toMatch(/ApprovalsTabsContext\.Provider value/)
    expect(lab("reviewer/approvals-frame.tsx")).toMatch(/facts\(ctx\.state\)\.unverifiedEvaluators/)
    expect(lab("reviewer/new-evaluators.tsx")).toMatch(/Students added these names\. Confirm or merge them so their sign-offs can be trusted\./)
  })
})

describe("Confirm and Merge with...", () => {
  const s = labState(seed)
  const row = newEvaluatorRows(s).find((r) => r.waiting > 0)!

  it("Confirm adopts the name: the count drops by one, the held sign-offs count, the note is kept", () => {
    const next = commitDecision(seed, { kind: "adopt", evaluatorId: row.id, mode: "adopt", note: "Checked with the site." })
    const after = labState(next)
    expect(facts(after).unverifiedEvaluators).toBe(facts(s).unverifiedEvaluators - 1)
    expect(newEvaluatorRows(after).some((r) => r.id === row.id)).toBe(false)
    const released = after.evaluations.filter((e) => e.evaluatorId === row.id && e.review?.note === "Checked with the site.")
    expect(released.length).toBe(row.waiting)
    expect(released.every((e) => e.status === "counted")).toBe(true)
  })

  it("Merge moves the sign-offs to the chosen existing evaluator; any adopted evaluator can be found", () => {
    const targets = mergeTargets(s, [])
    expect(targets.length).toBeGreaterThan(20)
    const into = targets[0]
    const next = labState(commitDecision(seed, { kind: "adopt", evaluatorId: row.id, mode: "merge", intoId: into.id }))
    expect(next.evaluations.filter((e) => e.evaluatorId === row.id && e.status === "awaiting-approval").length).toBe(0)
    expect(facts(next).unverifiedEvaluators).toBe(facts(s).unverifiedEvaluators - 1)
  })
})
