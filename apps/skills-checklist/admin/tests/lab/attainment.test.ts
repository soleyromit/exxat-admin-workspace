import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { buildDashboard, pipelineModel, RECORD_STATES } from "@/lib/lab/dashboard"
import { buildAttainment, detailRows, exportFormats, parsePeek, peekParam, peekRecords, scopeLines, summaryRows, toCsv, unrequiredSkills } from "@/lib/lab/attainment"
import { EMPTY_SCOPE, setScope, withBasis } from "@/lib/lab/scope"

const seed = createSeed()
const m = buildAttainment(seed, EMPTY_SCOPE)

describe("attainment model at scale", () => {
  it("covers 123 students and every required record in scope", () => {
    expect(m.students).toHaveLength(123)
    expect(m.total).toBeGreaterThan(1000)
    expect(m.skills.length).toBeGreaterThanOrEqual(30)
    expect(m.sections.length).toBeGreaterThan(5)
  })

  it("uses the dashboard's population, behind flag and four engine states", () => {
    const d = buildDashboard(seed, EMPTY_SCOPE)
    expect(m.behind).toBe(d.heroValue)
    expect(m.students.filter((s) => s.behind).length).toBe(d.behind.length)
    const p = pipelineModel(seed, EMPTY_SCOPE)
    for (const st of RECORD_STATES) expect(m.totals[st]).toBe(p.all.counts[st])
  })

  it("adds up: students, skills and sections each partition the same records", () => {
    const sum = (xs: Array<{ total: number }>) => xs.reduce((t, x) => t + x.total, 0)
    expect(sum(m.students)).toBe(m.total)
    expect(sum(m.skills)).toBe(m.total)
    expect(sum(m.sectionRows)).toBe(m.total)
    for (const s of m.students) expect(Object.values(s.cells).reduce((t, c) => t + c.total, 0)).toBe(s.total)
  })

  it("says tags overlap rather than implying a partition (RP-04)", () => {
    const tagged = m.tagRows.reduce((t, x) => t + x.total, 0)
    expect(tagged + m.untagged).toBeGreaterThanOrEqual(m.total)
    expect(tagged + m.untagged - m.total).toBeLessThanOrEqual(m.multiTagged * 3)
  })
})

describe("every count opens a list of the same length (RP-05, RP-06)", () => {
  it("matrix cells and student totals", () => {
    for (const s of m.students.slice(0, 30)) {
      expect(peekRecords(m, seed, { kind: "student", id: s.id })!.records).toHaveLength(s.total)
      for (const [section, c] of Object.entries(s.cells)) {
        const p = peekRecords(m, seed, { kind: "cell", id: s.id, section })!
        expect(p.records).toHaveLength(c.total)
        expect(p.records.filter((r) => r.state === "achieved")).toHaveLength(c.achieved)
      }
    }
  })

  it("skill, section and tag state counts", () => {
    for (const k of m.skills.slice(0, 40)) for (const st of RECORD_STATES) expect(peekRecords(m, seed, { kind: "skill", id: k.skillId, state: st })!.records).toHaveLength(k.counts[st])
    for (const g of m.sectionRows) for (const st of RECORD_STATES) expect(peekRecords(m, seed, { kind: "section", id: g.key, state: st })!.records).toHaveLength(g.counts[st])
    for (const g of m.tagRows) {
      expect(peekRecords(m, seed, { kind: "tag", id: g.key })!.records).toHaveLength(g.total)
      for (const st of RECORD_STATES) expect(peekRecords(m, seed, { kind: "tag", id: g.key, state: st })!.records).toHaveLength(g.counts[st])
    }
  })

  it("round trips the peek reference through the URL", () => {
    const ref = { kind: "cell" as const, id: m.students[0].id, section: m.sections[0], state: "progress" as const }
    expect(parsePeek(peekParam(ref))).toEqual(ref)
    expect(parsePeek("nonsense~x")).toBeNull()
  })

  it("recounts under a cohort filter and keeps equality", () => {
    const cohort = m.students[0].cohort
    const c = buildAttainment(seed, setScope(EMPTY_SCOPE, "cohort", cohort))
    expect(c.students.length).toBeLessThan(m.students.length)
    expect(c.students.every((s) => s.cohort === cohort)).toBe(true)
    const s = c.students[0]
    expect(peekRecords(c, seed, { kind: "student", id: s.id })!.records).toHaveLength(s.total)
  })

  it("follows the basis for the behind flag", () => {
    const all = buildAttainment(seed, withBasis(EMPTY_SCOPE, "all"))
    expect(all.behind).toBe(buildDashboard(seed, withBasis(EMPTY_SCOPE, "all")).heroValue)
  })
})

describe("export (RP-10)", () => {
  it("offers a summary PDF and a row-per-evaluation CSV and Excel, each listing what it leaves out", () => {
    const f = exportFormats()
    expect(f.map((x) => x.id)).toEqual(["pdf", "csv", "xlsx"])
    // RP-10 (LEDGER D-X13): the detail carries self-evaluations and review notes; the PDF summary leaves them out.
    for (const id of ["csv", "xlsx"] as const) expect(f.find((x) => x.id === id)!.excludes.join(" ")).not.toMatch(/Self|Review note/)
    expect(f.find((x) => x.id === "csv")!.contains.join(" ")).toMatch(/Feedback, self-evaluation and review note/)
    expect(f.find((x) => x.id === "pdf")!.excludes).toEqual(expect.arrayContaining(["Feedback text", "Self-evaluations", "Review notes"]))
  })

  it("has one detail row per evaluation on a record in scope, and records the scope", () => {
    const rows = detailRows(m, seed)
    expect(rows.length).toBeGreaterThan(m.totals.achieved)
    expect(summaryRows(m, "students")).toBe(123)
    const lines = scopeLines(setScope(EMPTY_SCOPE, "cohort", "BSN 2027"), "Fall 2026", "Expected now", "Oct 26, 09:40", (_k, v) => v)
    expect(lines).toEqual(["Term: Fall 2026", "Cohort: BSN 2027", "Compare with: Expected now", "As of Oct 26, 09:40"])
    const csv = toCsv(rows.slice(0, 3), lines)
    expect(csv.split("\n")[0]).toBe("Term: Fall 2026")
    expect(csv).toMatch(/Student,Cohort,Group,Skill,Section,Date,Evaluator,Setting,Location,Outcome,Status,Feedback,Self-rating,Self-evaluation note,Review decision,Review note/)
    expect(csv.split("\n")[lines.length]).toBe("Rows (one per evaluation): 3")
  })

  it("fills self-evaluation and review note columns from the evaluation, the request's log entry and the review", () => {
    const rows = detailRows(m, seed)
    const evals = new Map(seed.evaluations.map((e) => [e.id, e]))
    expect(rows.some((r) => r.reviewNote.length > 0) || ![...evals.values()].some((e) => e.review?.note)).toBe(true)
    for (const r of rows) {
      expect(typeof r.selfRating).toBe("string")
      expect(typeof r.selfNote).toBe("string")
      if (!r.review) expect(r.reviewNote).toBe("")
    }
  })
})

describe("skills tab scope (D-X16)", () => {
  it("adds published skills nobody in scope needs this term, without touching any figure", () => {
    const extra = unrequiredSkills(seed, m)
    const req = new Set(m.skills.map((k) => k.skillId))
    for (const k of extra) expect(req.has(k.skillId)).toBe(false)
    // Together they are every published, configured skill: nothing hidden, nothing counted twice.
    expect(m.skills.length + extra.length).toBe(seed.skills.filter((k) => k.published && k.configured).length)
    expect(m.total).toBe(buildAttainment(seed, EMPTY_SCOPE).total)
  })
})
