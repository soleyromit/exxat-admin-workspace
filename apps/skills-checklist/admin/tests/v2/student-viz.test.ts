import { describe, expect, it } from "vitest"
import { createSeed, IDS } from "@/lib/v2/seed"
import { mandatoryWaffle, paceSeries, skillDots } from "@/lib/v2/student-viz"
import { mandatoryProgressForCourse } from "@/lib/v2/verification"
import { skillProgress } from "@/lib/v2/student"

describe("student viz selectors", () => {
  // The v2 waffle is a focus-course view (courseWork reads one course), so it is checked against the focus-course mandatory
  // view, not the population row (which spans every offering of the cohort this term). v2 is to be replaced by the lab screens.
  it("Maya's waffle matches the focus-course mandatory view and is not behind", () => {
    const s = createSeed()
    const w = mandatoryWaffle(s)
    const mp = mandatoryProgressForCourse(s, IDS.maya)
    expect(w.squares).toHaveLength(w.needed)
    expect(w.collected).toBe(mp.reduce((n, m) => n + Math.min(m.counted, m.need), 0))
    expect(w.needed).toBe(mp.reduce((n, m) => n + m.need, 0))
    expect(w.behindBy).toBe(0)
    expect(w.line).toBe(`${w.collected} of ${w.needed} evaluations collected, on pace.`)
    expect(w.squares.filter((q) => q.state === "counted")).toHaveLength(w.collected)
    expect(w.skillsAchieved).toBeLessThan(w.skillsTotal)
  })

  it("squares are ordered counted, pending, remaining within each skill", () => {
    const w = mandatoryWaffle(createSeed())
    expect(w.squares.filter((q) => q.state === "pending")).toHaveLength(w.waiting)
  })

  it("says behind when the pace is well ahead", () => {
    const s = createSeed()
    const w = mandatoryWaffle({ ...s, evaluations: s.evaluations.filter((e) => e.studentId !== IDS.maya) })
    expect(w.collected).toBe(0)
    expect(w.behindBy).toBeGreaterThan(1)
    expect(w.line).toContain("behind the pace")
  })

  it("skill dots: one per needed evaluation, counted first", () => {
    const s = createSeed()
    const p = skillProgress(s, IDS.maya, IDS.urinaryCath)!
    const d = skillDots(p)
    expect(d).toHaveLength(p.need)
    expect(d.filter((x) => x.state === "met")).toHaveLength(Math.min(p.counted, p.need))
  })

  it("pace series is cumulative, non-decreasing, and ends at the waffle's collected count", () => {
    const s = createSeed()
    const { data, caption } = paceSeries(s)
    expect(data.length).toBeGreaterThan(4)
    for (let i = 1; i < data.length; i++) {
      expect(data[i].counted).toBeGreaterThanOrEqual(data[i - 1].counted)
      expect(data[i].pace).toBeGreaterThanOrEqual(data[i - 1].pace)
    }
    const last = data[data.length - 1]
    expect(last.counted).toBe(mandatoryWaffle(s).collected)
    expect(last.pace).toBe(mandatoryWaffle(s).expected)
    expect(caption).toContain("on pace")
  })
})
