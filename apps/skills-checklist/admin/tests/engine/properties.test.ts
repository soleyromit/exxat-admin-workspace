import { describe, expect, it } from "vitest"
import {
  evaluateSkill,
  renameBinaryLabel,
  renameLevel,
  renameQuestion,
  stateRank,
} from "@/lib/engine"
import type { ConfiguredSkill, Evidence, ModelConfig, Responses } from "@/lib/engine"
import { configured, ev, levels, questions } from "./fixtures"

// Deterministic, seeded property-style invariants (no extra dependency). docs/strategy/02 §6.
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T,>(r: () => number, a: readonly T[]): T => a[Math.floor(r() * a.length)]
const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))

function randomSkill(r: () => number): ConfiguredSkill {
  const kind = pick(r, ["binary", "question", "scored", "demonstration"] as const)
  const nq = int(r, 2, 4)
  let model: ModelConfig
  if (kind === "binary") model = { kind, labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } }, qualifyingLabelId: pick(r, ["a", "b"] as const) }
  else if (kind === "question") {
    const rule = pick(r, [{ kind: "all" as const }, { kind: "atLeast" as const, n: int(r, 1, nq) }, { kind: "subset" as const, questionIds: ["q1", "q2"] }])
    model = { kind, questions: questions(nq), rule }
  } else if (kind === "scored")
    model = { kind, questions: questions(nq), scale: { min: 1, max: 5, step: 1 }, rule: pick(r, [{ kind: "average" as const, min: 3 }, { kind: "minPerQuestion" as const, min: 3 }, { kind: "total" as const, min: 3 * nq }]) }
  else model = { kind, levels: levels.map((l) => ({ ...l })) }
  const settingMinimums: Record<string, number> = r() < 0.5 ? { inpatient: 1 } : r() < 0.5 ? { inpatient: 1, emergency: 1 } : {}
  return configured(model, {
    requiresApproval: r() < 0.4,
    criteria: { requiredCount: int(r, 1, 4), levelMinimums: kind === "demonstration" && r() < 0.5 ? { ind: 1 } : {}, settingMinimums },
  })
}

function randomResponses(r: () => number, m: ModelConfig): Responses {
  switch (m.kind) {
    case "binary":
      return { kind: "binary", labelId: pick(r, ["a", "b"] as const) }
    case "question":
      return { kind: "question", answers: Object.fromEntries(m.questions.map((q) => [q.id, r() < 0.7])) }
    case "scored":
      return { kind: "scored", scores: Object.fromEntries(m.questions.map((q) => [q.id, int(r, 1, 5)])) }
    case "demonstration":
      return { kind: "demonstration", levelId: pick(r, ["obs", "assist", "ind"] as const) }
  }
}

function randomEvidence(r: () => number, s: ConfiguredSkill, n: number): Evidence[] {
  return Array.from({ length: n }, () =>
    ev(randomResponses(r, s.model), {
      complete: r() < 0.9,
      approval: pick(r, ["notRequired", "pending", "approved", "returned"] as const),
      performedIn: pick(r, ["clinical", "clinical", "lab"] as const),
      clinicalSettingId: pick(r, ["inpatient", "emergency", "outpatient"] as const),
      locationId: pick(r, ["L1", "L2"] as const),
      courseId: pick(r, ["c1", "c2"] as const),
    }),
  )
}

function shuffle<T>(r: () => number, a: T[]): T[] {
  const out = [...a]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const RUNS = 300
describe("property invariants (seeded, deterministic)", () => {
  it("order independence: shuffling the evidence never changes the evaluation", () => {
    const r = rng(1)
    for (let i = 0; i < RUNS; i++) {
      const s = randomSkill(r)
      const e = randomEvidence(r, s, int(r, 0, 12))
      expect(evaluateSkill(s, shuffle(r, e))).toEqual(evaluateSkill(s, e))
    }
  })

  it("idempotence: recomputing gives the identical result, and duplicate evidence ids count once [INFER]", () => {
    const r = rng(2)
    for (let i = 0; i < RUNS; i++) {
      const s = randomSkill(r)
      const e = randomEvidence(r, s, int(r, 0, 10))
      const first = evaluateSkill(s, e)
      expect(evaluateSkill(s, e)).toEqual(first)
      expect(evaluateSkill(s, [...e, ...e])).toEqual(first)
    }
  })

  it("rename invariance: renaming any label never changes the evaluation (AE-06)", () => {
    const r = rng(3)
    for (let i = 0; i < RUNS; i++) {
      const s = randomSkill(r)
      const e = randomEvidence(r, s, int(r, 0, 10))
      let renamed: ConfiguredSkill = s
      if (s.model.kind === "binary") renamed = renameBinaryLabel(renameBinaryLabel(s, "a", "X"), "b", "Y")
      else if (s.model.kind === "demonstration") renamed = renameLevel(renameLevel(s, "obs", "Z"), "ind", "W")
      else renamed = renameQuestion(renameQuestion(s, "q1", "A?"), "q2", "B?")
      expect(evaluateSkill(renamed, e)).toEqual(evaluateSkill(s, e))
    }
  })

  it("monotonic: adding eligible evidence never lowers the state", () => {
    const r = rng(4)
    for (let i = 0; i < RUNS; i++) {
      const s = randomSkill(r)
      const e = randomEvidence(r, s, int(r, 0, 8))
      const extra = randomEvidence(r, s, 1)[0]
      expect(stateRank(evaluateSkill(s, [...e, extra]).state)).toBeGreaterThanOrEqual(stateRank(evaluateSkill(s, e).state))
    }
  })

  it("evidence that is not eligible (incomplete) never changes the evaluation (AE-01)", () => {
    const r = rng(5)
    for (let i = 0; i < RUNS; i++) {
      const s = randomSkill(r)
      const e = randomEvidence(r, s, int(r, 0, 8))
      const noise = randomEvidence(r, s, 3).map((x) => ({ ...x, complete: false }))
      expect(evaluateSkill(s, [...e, ...noise])).toEqual(evaluateSkill(s, e))
    }
  })

  it("filtering equals evaluating the pre-filtered evidence (RP-08, SH-06)", () => {
    const r = rng(6)
    for (let i = 0; i < RUNS; i++) {
      const s = randomSkill(r)
      const e = randomEvidence(r, s, int(r, 0, 12))
      const loc = pick(r, ["L1", "L2"] as const)
      expect(evaluateSkill(s, e, { locationId: loc })).toEqual(evaluateSkill(s, e.filter((x) => x.locationId === loc)))
      const c = pick(r, ["c1", "c2"] as const)
      expect(evaluateSkill(s, e, { courseId: c })).toEqual(evaluateSkill(s, e.filter((x) => x.courseId === c)))
    }
  })

  it("coherence: achieved <=> nothing unmet and at least one qualifying; unmet reasons are never satisfied", () => {
    const r = rng(7)
    for (let i = 0; i < RUNS; i++) {
      const s = randomSkill(r)
      const res = evaluateSkill(s, randomEvidence(r, s, int(r, 0, 12)))
      expect(res.state === "achieved").toBe(res.unmet.length === 0 && res.qualifyingCount > 0)
      for (const u of res.unmet) expect(u.have).toBeLessThan(u.needed)
      expect(res.qualifyingCount).toBeLessThanOrEqual(res.eligibleCount)
    }
  })
})
