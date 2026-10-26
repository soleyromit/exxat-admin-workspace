import { describe, expect, it } from "vitest"
import {
  COUNTER_IDS,
  heatCell,
  heatmap,
  ledgerView,
  NO_FILTERS,
  scoped,
  skillLedger,
  studentLedger,
  type CellState,
  type ReportFilters,
} from "@/lib/v2/reports"
import { createSeed, IDS } from "@/lib/v2/seed"

const F = (patch: Partial<ReportFilters>): ReportFilters => ({ ...NO_FILTERS, ...patch })

/** The first student and skill whose heat cell is in the given state. */
function cellIn(state: CellState, f: ReportFilters = NO_FILTERS) {
  const s = createSeed()
  const hm = heatmap(s, f)
  for (const r of hm.rows) {
    const c = r.cells.find((x) => x.state === state)
    if (c) return { s, studentId: r.student.id, skillId: c.skillId }
  }
  throw new Error(`The seed has no ${state} cell`)
}

describe("the ledger reconciles with the figure that was clicked", () => {
  for (const state of ["achieved", "half", "none"] as CellState[]) {
    it(`for a ${state} cell the rows that count equal the grid figure`, () => {
      const { s, studentId, skillId } = cellIn(state)
      const cell = heatmap(s, NO_FILTERS).rows.find((r) => r.student.id === studentId)!.cells.find((c) => c.skillId === skillId)!
      const l = skillLedger(s, NO_FILTERS, studentId, skillId)!
      expect(l.counted).toBe(cell.counted)
      expect(l.need).toBe(cell.need)
      expect(l.rows.filter((r) => r.counts)).toHaveLength(cell.counted)
      expect(l.state).toBe(state)
      // Every row is a counted evaluation of this student on this skill.
      const ids = new Set(s.evaluations.filter((e) => e.status === "counted" && e.studentId === studentId && e.skillId === skillId).map((e) => e.id))
      expect(new Set(l.rows.map((r) => r.evaluationId))).toEqual(ids)
    })
  }

  it("holds for every cell in the seed", () => {
    const s = createSeed()
    for (const r of heatmap(s, NO_FILTERS).rows) {
      for (const c of r.cells) {
        const l = skillLedger(s, NO_FILTERS, r.student.id, c.skillId)!
        expect(l.rows.filter((x) => x.counts).length, `${r.student.name} ${c.skillId}`).toBe(c.counted)
        expect(l.rows.every((x) => x.skillId === c.skillId && x.studentId === r.student.id)).toBe(true)
      }
    }
  })

  it("narrows the rows and the figure together under a setting filter, and still reconciles", () => {
    const s = createSeed()
    const f = F({ setting: "simulation" })
    const sc = scoped(s, f)
    for (const r of heatmap(s, f).rows) {
      for (const c of r.cells) {
        const l = skillLedger(s, f, r.student.id, c.skillId)!
        expect(l.rows.every((x) => x.settingLabel === "Simulation")).toBe(true)
        expect(l.rows.filter((x) => x.counts)).toHaveLength(heatCell(sc, r.student.id, s.skills.find((k) => k.id === c.skillId)!).counted)
      }
    }
    const all = skillLedger(s, NO_FILTERS, IDS.maya, "sk-vitals") ?? skillLedger(s, NO_FILTERS, IDS.maya, heatmap(s, NO_FILTERS).skills[0].skill.id)!
    const sim = skillLedger(s, f, all.studentId, all.skillId)!
    expect(sim.rows.length).toBeLessThanOrEqual(all.rows.length)
  })

  it("is null for a skill that is not in view", () => {
    const s = createSeed()
    expect(skillLedger(s, NO_FILTERS, IDS.maya, "sk-central-line")).toBeNull()
    expect(skillLedger(s, NO_FILTERS, "nobody", heatmap(s, NO_FILTERS).skills[0].skill.id)).toBeNull()
  })

  it("never lists an evaluation that is not counted", () => {
    const s = createSeed()
    const notCounted = new Set(s.evaluations.filter((e) => e.status !== "counted").map((e) => e.id))
    for (const p of s.people.filter((x) => x.kind === "student")) {
      const l = studentLedger(s, NO_FILTERS, p.id)!
      for (const row of ledgerView(l, { skillId: null, only: null }).rows) expect(notCounted.has(row.evaluationId)).toBe(false)
    }
  })
})

describe("Show these only", () => {
  it("the four counters add up to the skills in view", () => {
    const s = createSeed()
    const l = studentLedger(s, NO_FILTERS, IDS.maya)!
    expect(COUNTER_IDS.reduce((n, id) => n + l.counters[id], 0)).toBe(l.skills.length)
    expect(l.skills.length).toBe(heatmap(s, NO_FILTERS).skills.length)
  })

  it("narrows the rows to the skills in that state", () => {
    const s = createSeed()
    const l = studentLedger(s, NO_FILTERS, IDS.maya)!
    const everything = ledgerView(l, { skillId: null, only: null })
    let narrowed = false
    for (const id of COUNTER_IDS) {
      const v = ledgerView(l, { skillId: null, only: id })
      expect(v.skills).toHaveLength(l.counters[id])
      expect(v.skills.every((k) => k.counter === id)).toBe(true)
      expect(v.rows.every((r) => v.skills.some((k) => k.skillId === r.skillId))).toBe(true)
      if (v.rows.length < everything.rows.length) narrowed = true
    }
    expect(narrowed).toBe(true)
  })

  it("combines with the skill chip and can leave nothing", () => {
    const s = createSeed()
    const l = studentLedger(s, NO_FILTERS, IDS.maya)!
    const k = l.skills[0]
    const other = COUNTER_IDS.find((id) => id !== k.counter)!
    expect(ledgerView(l, { skillId: k.skillId, only: k.counter }).skills).toHaveLength(1)
    expect(ledgerView(l, { skillId: k.skillId, only: other })).toEqual({ skills: [], rows: [] })
  })
})

describe("what the ledger leaves out", () => {
  it("carries no concern flag, count or note", () => {
    const s = createSeed()
    const concern = s.concerns[0]
    expect(concern).toBeTruthy()
    const l = studentLedger(s, NO_FILTERS, concern.studentId)!
    const json = JSON.stringify(l)
    expect(json).not.toContain(concern.note)
    expect(json.toLowerCase()).not.toContain("concern")
    expect(json).not.toContain(concern.id)
  })

  it("carries no reviewer note or return reason", () => {
    const s = createSeed()
    const notes = s.evaluations.map((e) => e.review?.note).filter((n): n is string => !!n)
    for (const p of s.people.filter((x) => x.kind === "student")) {
      const json = JSON.stringify(studentLedger(s, NO_FILTERS, p.id))
      for (const n of notes) expect(json).not.toContain(n)
    }
  })

  it("states the reason in staff words, never to 'you'", () => {
    const s = createSeed()
    for (const p of s.people.filter((x) => x.kind === "student")) {
      const l = studentLedger(s, NO_FILTERS, p.id)!
      const text = JSON.stringify(l.skills.map((k) => [k.left, k.rows.map((r) => r.reason)]))
      expect(text).not.toMatch(/\byou(r)?\b/i)
    }
  })
})
