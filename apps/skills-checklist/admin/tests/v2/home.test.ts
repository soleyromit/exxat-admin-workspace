import { describe, expect, it } from "vitest"
import { attentionRows, attentionSummary, configuredByModel, courseCoverage, homeKpis, paceStrip, ROWS_PER_KIND, setupRows, setupSummary, weakestSkills } from "@/lib/v2/home"
import { stalledRequests } from "@/lib/v2/queue"
import { approvalsInScope } from "@/lib/v2/approvals"

/** The approval queue as every screen reads it (default scope: current term). */
const queueItems = (s: V2State) => approvalsInScope(s).entries
import { behindPace } from "@/lib/v2/reports"
import { createSeed } from "@/lib/v2/seed"
import type { V2State } from "@/lib/v2/types"
import { verificationRows } from "@/lib/v2/verification"

const seed = createSeed()

function setUp(s: V2State): V2State {
  const mapped = new Set(s.mappings.filter((m) => m.courseId === s.course.id).map((m) => m.skillId))
  return {
    ...s,
    skills: s.skills.map((k) => ({ ...k, configured: true, published: true })),
    mappings: [...s.mappings, ...s.skills.filter((k) => !mapped.has(k.id)).map((k) => ({ courseId: s.course.id, skillId: k.id, level: "optional" as const }))],
  }
}

describe("setupSummary", () => {
  it("matches hand counts from the seed", () => {
    const r = setupSummary(seed)
    expect(r.unconfigured).toHaveLength(seed.skills.filter((k) => !k.configured).length)
    expect(r.unpublished).toHaveLength(seed.skills.filter((k) => k.configured && !k.published).length)
    const mapped = new Set(seed.mappings.filter((m) => m.courseId === seed.course.id).map((m) => m.skillId))
    expect(r.unmapped.map((k) => k.id)).toEqual(seed.skills.filter((k) => k.published && !mapped.has(k.id)).map((k) => k.id))
    const [c, p, m] = r.meters
    expect(c.value).toBe(seed.skills.filter((k) => k.configured).length)
    expect(c.total).toBe(seed.skills.length)
    expect(p.value).toBe(seed.skills.filter((k) => k.published).length)
    expect(m.total).toBe(p.value)
    expect(r.complete).toBe(false)
  })
  it("a fully set-up state returns empty lists", () => {
    const r = setupSummary(setUp(seed))
    expect(r.unconfigured).toEqual([])
    expect(r.unpublished).toEqual([])
    expect(r.unmapped).toEqual([])
    expect(r.meters.every((m) => m.value === m.total)).toBe(true)
  })
})

describe("attentionSummary", () => {
  it("matches the queue, stalled, pace, plans and verification selectors", () => {
    const r = attentionSummary(seed)
    expect(r.approvals.map((a) => a.key)).toEqual(queueItems(seed).map((i) => i.key))
    expect(r.stalled).toHaveLength(stalledRequests(seed).length)
    expect(r.behind.map((b) => b.studentId)).toEqual(behindPace(seed).map((b) => b.studentId))
    expect(r.plans).toHaveLength(seed.remediations.filter((p) => p.status !== "closed").length)
    expect(r.changed).toHaveLength(verificationRows(seed).filter((v) => v.status === "changed").length)
    expect(r.clear).toBe(false)
  })
  it("rows name students and skills", () => {
    const r = attentionSummary(seed)
    for (const row of [...r.approvals, ...r.plans]) expect(row.label).toMatch(/\w+ \w+/)
  })
  it("has no concern field and never reads concern text", () => {
    const withConcern: V2State = { ...seed, concerns: [{ id: "c1", evaluationId: "x", studentId: "x", raisedById: "x", visibleTo: "faculty-only", note: "SECRET-NOTE", at: "2026-10-01" }] }
    const r = attentionSummary(withConcern)
    expect(JSON.stringify(r)).not.toContain("SECRET-NOTE")
    expect(Object.keys(r).join()).not.toMatch(/concern/i)
  })
  it("is clear when nothing is waiting", () => {
    // Nothing held: no stored awaiting status and every evaluator name adopted (an unadopted name holds its evidence).
    const empty: V2State = { ...seed, people: seed.people.map((p) => ({ ...p, verified: true })), evaluations: seed.evaluations.map((e) => (e.status === "awaiting-approval" ? { ...e, status: "counted" } : e)), submissions: [], remediations: [], verifications: [] }
    const r = attentionSummary(empty)
    expect(r.approvals).toEqual([])
    expect(r.stalled).toEqual([])
    expect(r.plans).toEqual([])
  })
})

describe("cohort", () => {
  it("weakestSkills is sorted weakest first, capped at five, and each row sums to the cohort", () => {
    const w = weakestSkills(seed)
    expect(w.length).toBeLessThanOrEqual(5)
    for (let i = 1; i < w.length; i++) expect(w[i].achieved).toBeGreaterThanOrEqual(w[i - 1].achieved)
    for (const k of w) expect(k.achieved + k.inProgress + k.notMetYet + k.notStarted).toBe(k.students)
  })
  it("paceStrip has one dot per student and flags exactly the behind-pace students", () => {
    const p = paceStrip(seed)
    expect(p.dots).toHaveLength(seed.people.filter((x) => x.kind === "student").length)
    expect(p.dots.filter((d) => d.flagged).map((d) => d.id).sort()).toEqual(behindPace(seed).map((b) => b.studentId).sort())
    expect(p.behind).toBe(behindPace(seed).length)
    for (const d of p.dots) expect(d.value).toBeGreaterThanOrEqual(0)
  })
})

describe("courseCoverage", () => {
  it("counts every library skill once", () => {
    const c = courseCoverage(seed)
    expect(c.mandatory + c.other + c.unmapped + c.blocked).toBe(seed.skills.length)
    expect(c.mandatory).toBe(seed.mappings.filter((m) => m.courseId === seed.course.id && m.level === "mandatory").length)
    expect(c.blocked).toBe(seed.skills.filter((k) => !k.configured && !seed.mappings.some((m) => m.skillId === k.id)).length)
  })
})

describe("homeKpis", () => {
  it("equals hand counts from the seed", () => {
    const k = homeKpis(seed)
    expect(k.inUse).toBe(seed.skills.filter((x) => x.published).length)
    expect(k.totalSkills).toBe(seed.skills.length)
    expect(k.waiting).toBe(queueItems(seed).length)
    expect(k.stalled).toBe(stalledRequests(seed).length)
    expect(k.behind).toBe(behindPace(seed).length)
    expect(k.students).toBe(seed.people.filter((p) => p.kind === "student").length)
    expect(k.warnings).toBe(setupSummary(seed).warnings.length)
    expect(k.courseCode).toBe(seed.course.code)
  })
  it("has no remediation or concern field", () => {
    expect(Object.keys(homeKpis(seed)).join()).not.toMatch(/remediation|plan|concern/i)
  })
})

describe("setupRows", () => {
  const set = setupRows(seed)
  it("every row has a status, a name, a real href, a detail and one action", () => {
    expect(set.rows.length).toBeGreaterThan(0)
    for (const r of set.rows) {
      expect(r.pill.kind).toBeTruthy()
      expect(r.name.length).toBeGreaterThan(0)
      expect(r.href).toMatch(/^\/v2\/admin\//)
      expect(r.action.href).toMatch(/^\/v2\/admin\//)
      expect(r.action.ariaLabel.length).toBeGreaterThan(r.action.label.length - 1)
      expect(r.detail.length).toBeGreaterThan(0)
    }
    expect(new Set(set.rows.map((r) => r.key)).size).toBe(set.rows.length)
  })
  it("orders blocking work first and caps each kind", () => {
    const order = ["warn-", "unmapped-", "unpublished-", "unconfigured-"]
    const idx = set.rows.map((r) => order.findIndex((p) => r.key.startsWith(p)))
    expect(idx).toEqual([...idx].sort((a, b) => a - b))
    for (const p of order) expect(set.rows.filter((r) => r.key.startsWith(p)).length).toBeLessThanOrEqual(ROWS_PER_KIND)
  })
  it("collapses the unconfigured backlog into an overflow link", () => {
    const n = seed.skills.filter((k) => !k.configured).length
    expect(n).toBeGreaterThan(ROWS_PER_KIND)
    expect(set.overflow.some((o) => /to configure$/.test(o.text))).toBe(true)
  })
  it("is empty when everything is set up", () => {
    const done = setUp(seed)
    const rows = setupRows(done)
    expect(rows.rows.filter((r) => /^(unconfigured|unpublished|unmapped)-/.test(r.key))).toEqual([])
  })
})

describe("attentionRows", () => {
  const set = attentionRows(seed)
  it("never carries a remediation or concern row", () => {
    expect(JSON.stringify(set)).not.toMatch(/remediation/i)
    expect(set.rows.every((r) => !r.href.includes("remediation"))).toBe(true)
  })
  it("orders stalled, approvals, behind, changed and links students to their record", () => {
    const order = ["stalled-", "approval-", "behind-", "changed-"]
    const idx = set.rows.map((r) => order.findIndex((p) => r.key.startsWith(p)))
    expect(idx).toEqual([...idx].sort((a, b) => a - b))
    for (const r of set.rows.filter((x) => x.key.startsWith("behind-"))) expect(r.href).toMatch(/\/v2\/admin\/verification\/[\w-]+$/)
  })
  it("rows plus overflow cover every approval and behind-pace student", () => {
    const shown = set.rows.filter((r) => r.key.startsWith("approval-")).length
    const more = set.overflow.find((o) => o.key === "more-approvals")
    const total = queueItems(seed).length
    expect(shown + (more ? Number(more.text.match(/\d+/)![0]) : 0)).toBe(total)
  })
})

describe("configuredByModel", () => {
  it("counts configured skills per model and sums to the configured total", () => {
    const r = configuredByModel(seed)
    expect(r.map((x) => x.model)).toEqual(["binary", "question", "scored", "demonstration"])
    for (const x of r) expect(x.count).toBe(seed.skills.filter((k) => k.configured && k.model === x.model).length)
    expect(r.reduce((n, x) => n + x.count, 0)).toBe(seed.skills.filter((k) => k.configured && k.model).length)
  })
})
