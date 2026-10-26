import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { heldState } from "@/lib/v2/approvals"
import { skillById } from "@/lib/v2/evidence-index"
import { populationRows, DEFAULT_SCOPE } from "@/lib/v2/population"
import { engineRuleOf, runRule } from "@/lib/v2/rules"
import { skillProgress } from "@/lib/v2/student"
import { createV2Store } from "@/lib/v2/store"
import type { V2State } from "@/lib/v2/types"
import { computeImpact, emptyRule, evaluateRule, fromV2, isInvalidResult, publishLabRule, validateRule, withModel, type LabRule, type RecordState } from "@/lib/lab/configure"
import { attemptCountLine, buildStudent, DEFAULT_STUDENT, type SkillState } from "@/lib/lab/student"
import { recordAttemptLine } from "@/lib/lab/student2"
import { recordStateOf } from "@/lib/lab/dashboard"

/**
 * Rule write-back (decision D-X27): a rule published from the lab configure screens is written to the shared v2 store and read
 * by the one engine (lib/v2/rules.ts), so the impact shown before publish equals what every student screen and the dashboard show
 * after it.
 */

const MED = "sk-med-admin"
const STERILE = "sk-sterile-dressing"
const AT = "2026-10-26T10:00:00Z"
const BY = "adm-ross"

const publish = (s: V2State, skillId: string, rule: LabRule): V2State => {
  const w = publishLabRule(s, skillId, rule, { at: AT, byId: BY, mode: "reapply" })
  if (!w.ok || !w.written) throw new Error(w.ok ? "not written" : w.error)
  return w.state
}

const FROM_DASH: Record<ReturnType<typeof recordStateOf>, RecordState> = { achieved: "achieved", progress: "in-progress", unqualified: "not-qualifying", none: "no-evidence" }
const FROM_STUDENT: Record<SkillState, RecordState> = { achieved: "achieved", progress: "in-progress", dnq: "not-qualifying", none: "no-evidence" }

/** Every student's state on one skill as the student screens and the dashboard read it (skillProgress on held evidence). */
function screenCounts(s: V2State, skillId: string): Record<RecordState, number> {
  const held = heldState(s)
  const out: Record<RecordState, number> = { achieved: 0, "in-progress": 0, "not-qualifying": 0, "no-evidence": 0 }
  for (const p of held.people) if (p.kind === "student") out[FROM_DASH[recordStateOf(skillProgress(held, p.id, skillId))]]++
  return out
}

describe("one engine", () => {
  it("v2 student progress and the lab engine are the same function: identical on every student for the seeded rules", () => {
    const s = heldState(createSeed())
    for (const id of [MED, STERILE, "sk-urinary-cath", "sk-vitals", "hgtc-safety-01"]) {
      const k = skillById(s, id)!
      const lab = fromV2(k)
      for (const p of s.people.filter((x) => x.kind === "student")) {
        const evals = s.evaluations.filter((e) => e.studentId === p.id && e.skillId === id)
        const v2 = skillProgress(s, p.id, id)!
        const r = evaluateRule(lab, evals)
        if (isInvalidResult(r)) throw new Error(r.message)
        const run = runRule(engineRuleOf(k)!, evals)
        expect(run.valid && [run.achieved, run.have]).toEqual([v2.achieved, v2.counted])
        expect([r.state === "achieved", r.have]).toEqual([v2.achieved, v2.counted])
      }
    }
  })

  it("an unset frequency is invalid everywhere: no silent need of 1", () => {
    const r: LabRule = { ...withModel(emptyRule(), "binary"), qualifyingLabel: 0, evaluatorRoles: ["preceptor"] }
    const out = evaluateRule(r, [])
    expect(isInvalidResult(out) && out.reason).toBe("need-unset")
    expect(validateRule(r).map((i) => i.id)).toContain("cfg-need:need")
    const s = createSeed()
    const w = publishLabRule(s, MED, r, { at: AT, byId: BY, mode: "reapply" })
    expect(w.ok).toBe(false)
    expect(!w.ok && w.issues.map((i) => i.id)).toContain("cfg-need:need")
    // The impact of an invalid draft changes nobody and says why.
    const im = computeImpact(s, MED, fromV2(skillById(s, MED)!), r)
    expect(im.changed).toHaveLength(0)
    expect(im.invalid?.reason).toBe("need-unset")
    // The v2 engine refuses it too.
    expect(runRule({ ...engineRuleOf(skillById(s, MED)!)!, need: Number.NaN }, []).valid).toBe(false)
  })
})

describe("publish writes to the shared store", () => {
  it("publishing the rule students already have changes no fact", () => {
    const s = createSeed()
    const before = facts(s)
    let next = s
    // (A question skill cannot be republished as it stands: the seed has no question rule, and Publish asks for one.)
    expect(validateRule(fromV2(skillById(s, STERILE)!)).map((i) => i.id)).toContain("cfg-qrule:missing")
    for (const id of [MED, "sk-urinary-cath", "sk-vitals"]) next = publish(next, id, fromV2(skillById(next, id)!))
    expect(facts(next)).toEqual(before)
    for (const id of [MED, "sk-urinary-cath", "sk-vitals"]) expect(screenCounts(next, id)).toEqual(screenCounts(s, id))
  })

  it("keeps a rule version per publish and leaves new-evidence-only unwritten (not decided)", () => {
    const s = createSeed()
    const k = skillById(s, MED)!
    const a = publish(s, MED, { ...fromV2(k), need: 2 })
    const b = publish(a, MED, { ...fromV2(skillById(a, MED)!), need: 4 })
    const seeded = (s.ruleChanges ?? []).filter((r) => r.skillId === MED)
    const top = Math.max(1, ...seeded.map((r) => r.version))
    const versions = (b.ruleChanges ?? []).filter((r) => r.skillId === MED && r.published)
    expect(versions.map((r) => [r.version, r.published?.need])).toEqual([
      [top + 1, 2],
      [top + 2, 4],
    ])
    expect(skillById(b, MED)!.config!.achievement.need).toBe(4)
    const w = publishLabRule(s, MED, { ...fromV2(k), need: 2 }, { at: AT, byId: BY, mode: "new-only" })
    expect(w.ok && w.written).toBe(false)
    expect(w.ok && w.state).toBe(s)
  })

  it("a stricter or looser rule: the impact after-counts equal the student screens and the dashboard after publish", () => {
    const s = createSeed()
    const cur = fromV2(skillById(s, MED)!)
    for (const next of [{ ...cur, need: 2 }, { ...cur, need: 4, distinctEvaluators: 2 }]) {
      const im = computeImpact(s, MED, cur, next)
      expect(im.changed.length).toBeGreaterThan(0)
      expect(screenCounts(s, MED)).toEqual(im.before)
      const after = publish(s, MED, next)
      expect(screenCounts(after, MED)).toEqual(im.after)

      // Two students' Student progress (lab student screen model) agree with the impact rows.
      for (const row of im.changed.slice(0, 2)) {
        const rec = buildStudent(after, row.studentId)!.all.find((r) => r.id === MED)
        expect(rec && FROM_STUDENT[rec.state]).toBe(row.after)
        const was = buildStudent(s, row.studentId)!.all.find((r) => r.id === MED)
        expect(was && FROM_STUDENT[was.state]).toBe(row.before)
      }

      // The dashboard "achieved" figure (facts.mandatoryAchieved) moves by exactly the impact's flips on required records.
      const required = new Set(populationRows(s, DEFAULT_SCOPE).rows.filter((r) => r.requiredIds.includes(MED)).map((r) => r.id))
      const gained = im.changed.filter((r) => required.has(r.studentId) && r.after === "achieved" && r.before !== "achieved").length
      const lost = im.changed.filter((r) => required.has(r.studentId) && r.before === "achieved" && r.after !== "achieved").length
      expect(facts(after).mandatoryAchieved - facts(s).mandatoryAchieved).toBe(gained - lost)
    }
  })

  it("the '2 of 3 questions' demo: a published question rule changes the hero's progress, line and record, and nothing else", () => {
    const s = createSeed()
    const cur = fromV2(skillById(s, STERILE)!)
    expect(cur.questionRule).toBeNull()
    const next: LabRule = { ...cur, questionRule: { kind: "atLeast", n: 2 } }
    expect(validateRule(next)).toEqual([])
    const im = computeImpact(s, STERILE, cur, next)
    // Only Maya carries per-question answers in the seed: her first attempt (Yes, Yes, No) becomes one valid attempt.
    expect(im.changed.map((r) => [r.studentId, r.before, r.after])).toEqual([[DEFAULT_STUDENT, "not-qualifying", "in-progress"]])
    expect(attemptCountLine(s, DEFAULT_STUDENT, STERILE)).toBe("2 attempts, 2 not valid: 0 count")

    const after = publish(s, STERILE, next)
    expect(screenCounts(after, STERILE)).toEqual(im.after)
    expect(skillProgress(heldState(after), DEFAULT_STUDENT, STERILE)!.counted).toBe(1)
    expect(skillProgress(heldState(after), DEFAULT_STUDENT, STERILE)!.rule).toMatch(/at least 2 of 3 questions answered Yes/)
    const line = "2 attempts, 1 not valid: 1 counts. At least 2 of 3 questions answered Yes counts as one."
    expect(attemptCountLine(after, DEFAULT_STUDENT, STERILE)).toBe(line)
    // The record (phone ledger) shows the same engine counts, compact.
    expect(recordAttemptLine(after, DEFAULT_STUDENT, STERILE)).toBe("2 attempts, 1 counts")
    expect(recordAttemptLine(s, DEFAULT_STUDENT, STERILE)).toBe("2 attempts, 0 count")
    const rec = buildStudent(after)!.all.find((r) => r.id === STERILE)!
    expect(rec.state).toBe("progress")
    // The required-this-term figures follow the engine; here Maya is still short, so the achieved count is unchanged.
    expect(facts(after).mandatoryAchieved).toBe(facts(s).mandatoryAchieved)
  })

  it("survives a reload: the published rule is part of the persisted delta", () => {
    const storage = window.localStorage
    storage.clear()
    const a = createV2Store({ storage })
    a.hydrate()
    a.update((s) => publish(s, STERILE, { ...fromV2(skillById(s, STERILE)!), questionRule: { kind: "atLeast", n: 2 } }))
    const b = createV2Store({ storage })
    b.hydrate()
    const k = skillById(b.getSnapshot(), STERILE)!
    expect(k.config?.questionRule).toEqual({ kind: "atLeast", n: 2 })
    expect(attemptCountLine(b.getSnapshot(), DEFAULT_STUDENT, STERILE)).toMatch(/1 counts/)
  })
})
