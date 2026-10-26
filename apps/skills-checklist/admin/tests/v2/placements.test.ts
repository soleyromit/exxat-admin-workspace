import { describe, expect, it } from "vitest"
import { createSeed, IDS } from "@/lib/v2/seed"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { PLACEMENT_ENDING_DAYS, daysLeftIn, isEnding, placementStatus, placementsEnding, placementsOf } from "@/lib/v2/placements"
import { buildStudent, PLACEMENT_SOON } from "@/lib/lab/student"
import { skillById } from "@/lib/v2/evidence-index"

/** Dataset spec section 12: placements carry real start and end dates inside their term. */

const s = createSeed()
const terms = new Map((s.terms ?? []).map((t) => [t.id, t]))
const students = s.people.filter((p) => p.kind === "student")
/** The term whose window holds the date, or null for a date between terms (a break: no rotation runs then). */
const termOfDate = (d: string): string | null => (s.terms ?? []).find((t) => t.start <= d && d <= t.end)?.id ?? null
const DAY = 86_400_000
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY)

describe("placement dates", () => {
  it("every placement has a term, an ISO start and end inside it, and runs 4 to 8 weeks", () => {
    for (const p of s.placements) {
      expect(p.termId, p.id).toBeTruthy()
      const t = terms.get(p.termId!)!
      expect(p.startDate, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(p.endDate, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(p.startDate >= t.start && p.endDate <= t.end, p.id).toBe(true)
      const len = days(p.startDate, p.endDate)
      expect(len, p.id).toBeGreaterThanOrEqual(4 * 7 - 3)
      expect(len, p.id).toBeLessThanOrEqual(8 * 7 - 3)
    }
  })

  it("every student has at least one placement in every term they have evidence in", () => {
    for (const p of students) {
      const evidenceTerms = new Set(s.evaluations.filter((e) => e.studentId === p.id && e.setting === "clinical").map((e) => termOfDate(e.date.slice(0, 10))))
      const placed = new Set(s.placements.filter((x) => x.studentId === p.id).map((x) => x.termId))
      for (const t of evidenceTerms) if (t) expect(placed.has(t), `${p.id} ${t}`).toBe(true)
    }
  })

  it("points each placement at an offering of its course in its term", () => {
    for (const p of s.placements) {
      const o = (s.offerings ?? []).find((x) => x.id === p.offeringId)
      expect(o, p.id).toBeDefined()
      expect(o!.courseId, p.id).toBe(p.courseId)
      expect(o!.termId, p.id).toBe(p.termId)
    }
  })

  it("current-term placements overlap the demo day: some finished, some ending within 21 days, some just started", () => {
    const cur = s.placements.filter((p) => p.termId === "trm-fa26")
    const finished = cur.filter((p) => placementStatus(p) === "finished")
    const ending = cur.filter((p) => isEnding(p))
    const started = cur.filter((p) => placementStatus(p) === "current" && days(p.startDate, DEMO_TODAY) <= 7)
    expect(finished.length / cur.length).toBeGreaterThan(0.15)
    expect(ending.length / cur.length).toBeGreaterThan(0.15)
    expect(started.length).toBeGreaterThan(5)
    expect(placementsEnding(s)).toHaveLength(ending.length)
  })
})

describe("Maya's placement", () => {
  it("has a current rotation with a real start and end, ending within the window", () => {
    const mine = placementsOf(s, IDS.maya)
    expect(mine.length).toBeGreaterThanOrEqual(1)
    const current = mine.find((p) => placementStatus(p) === "current")!
    expect(current).toBeDefined()
    expect(daysLeftIn(current)).toBeGreaterThan(0)
    expect(daysLeftIn(current)).toBeLessThanOrEqual(PLACEMENT_ENDING_DAYS)
  })

  it("the student model reads the placement's own end date, not the term end, and the window constant", () => {
    expect(PLACEMENT_SOON).toBe(PLACEMENT_ENDING_DAYS)
    const m = buildStudent(s, IDS.maya)!
    const term = terms.get("trm-fa26")!
    expect(m.placements.length).toBeGreaterThanOrEqual(1)
    for (const p of m.placements) {
      expect(p.ends).not.toBe(term.end)
      expect(p.daysLeft).toBe(daysLeftIn({ endDate: p.ends }))
    }
  })

  it("likely-here skills derive from the placement's course mapping", () => {
    const m = buildStudent(s, IDS.maya)!
    for (const p of m.placements) {
      const mapped = new Set(s.mappings.filter((x) => x.courseId === p.courseId && x.level !== "not-expected").map((x) => x.skillId))
      for (const id of p.likelyIds) {
        expect(mapped.has(id), id).toBe(true)
        expect(skillById(s, id)?.configured).toBe(true)
      }
    }
  })
})
