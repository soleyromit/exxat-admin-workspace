import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { DEFAULT_SCOPE, FAR_BEHIND_MISSING, graduationStageOf, REQUIRED_SET_LABEL } from "@/lib/v2/population"
import { GRADUATION_STAGE_LABEL } from "@/lib/v2/labels"
import { buildAttainment, defaultRequiredSet, parseRequiredSet, REQUIRED_SET_OPTIONS } from "@/lib/lab/attainment"
import { buildReadiness, graduatingCohort, LIST_LABEL, STAGE_LABEL } from "@/lib/lab/director"
import { heatmap, NO_FILTERS, reportSummary } from "@/lib/v2/reports"
import type { LabScope } from "@/lib/lab/scope"

/**
 * The two required sets (decision D-X12) stay apart, and each view that names one shows the same totals: director readiness and
 * the Attainment matrix under "Required to graduate"; the v2 report summary and its heat grid under one population.
 */

const s = createSeed()
const grad = graduatingCohort(s)!
const gradScope: LabScope = { ...DEFAULT_SCOPE, cohort: grad }

describe("director graduation bands (D-X11)", () => {
  const r = buildReadiness(s, gradScope)

  it("one short = 1 missing, short = 2 to 3, far behind = 4 or more; the story reads 31 / 4 / 0 / 3", () => {
    expect([graduationStageOf(0), graduationStageOf(1), graduationStageOf(2), graduationStageOf(3), graduationStageOf(FAR_BEHIND_MISSING)]).toEqual(["complete", "one-short", "short", "short", "far"])
    expect(r.graduation).toEqual({ complete: 31, "one-short": 4, short: 0, far: 3 })
    expect(r.stage).toEqual({ complete: 31, short: 4, far: 3 })
    for (const row of r.rows) expect(row.graduationStage).toBe(graduationStageOf(row.gaps.length))
  })

  it("stage words come from lib/v2/labels.ts", () => {
    expect(STAGE_LABEL).toEqual({ complete: GRADUATION_STAGE_LABEL.complete, short: GRADUATION_STAGE_LABEL["one-short"], far: GRADUATION_STAGE_LABEL.far })
    expect(LIST_LABEL.notmet).toBe("Unmet")
  })
})

describe("Attainment basis: Required this term | Required to graduate", () => {
  it("the switch is labelled from REQUIRED_SET_LABEL and parses from the URL", () => {
    expect(REQUIRED_SET_OPTIONS.map((o) => o.label)).toEqual([REQUIRED_SET_LABEL.thisTerm, REQUIRED_SET_LABEL.toGraduate])
    expect([parseRequiredSet("graduate"), parseRequiredSet("term"), parseRequiredSet(null)]).toEqual(["toGraduate", "thisTerm", null])
  })

  it("the graduating cohort defaults to Required to graduate; other scopes to Required this term", () => {
    expect(defaultRequiredSet(s, gradScope)).toBe("toGraduate")
    expect(defaultRequiredSet(s, DEFAULT_SCOPE)).toBe("thisTerm")
  })

  it("under Required to graduate the matrix totals equal director readiness (31 / 4 / 3)", () => {
    const r = buildReadiness(s, gradScope)
    const m = buildAttainment(s, gradScope, undefined, { basis: "toGraduate" })
    expect(m.basisLabel).toBe(REQUIRED_SET_LABEL.toGraduate)
    expect(m.students).toHaveLength(r.rows.length)
    expect(m.total).toBe(r.rows.length * r.required.length)
    expect(m.totals.achieved).toBe(r.rows.reduce((t, x) => t + x.achieved, 0))
    const missing = (x: { total: number; counts: { achieved: number } }) => x.total - x.counts.achieved
    const bands = { complete: 0, "one-short": 0, short: 0, far: 0 }
    for (const st of m.students) bands[graduationStageOf(missing(st))]++
    expect(bands).toEqual(r.graduation)
    expect(m.behind).toBe(r.graduation.far)
    const byId = new Map(r.rows.map((x) => [x.id, x]))
    for (const st of m.students) expect(st.counts.achieved, st.id).toBe(byId.get(st.id)!.achieved)
  })

  it("under Required this term the same cohort reads the term set, and the two never mix", () => {
    const term = buildAttainment(s, gradScope)
    const g = buildAttainment(s, gradScope, undefined, { basis: "toGraduate" })
    expect(term.basis).toBe("thisTerm")
    expect(term.total).toBeLessThan(g.total)
    const termIds = new Set(term.records.map((x) => x.skillId))
    const gradIds = new Set(g.records.map((x) => x.skillId))
    expect([...termIds].every((id) => s.skills.find((k) => k.id === id))).toBe(true)
    expect(termIds.size).toBeLessThan(gradIds.size)
  })
})

describe("v2 report: the heat grid lists the students the summary counts", () => {
  const courses = s.courses ?? []
  it.each(["", ...courses.map((c) => c.id)])("course filter %s", (course) => {
    const f = { ...NO_FILTERS, ...(course ? { course } : {}) }
    expect(heatmap(s, f).rows.length).toBe(reportSummary(s, f).students)
  })
})
