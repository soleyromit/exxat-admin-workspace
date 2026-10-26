import { describe, expect, it } from "vitest"
import { evidenceStatusCounts, TARGETS } from "@/lib/v2/generate"
import { HGTC, UNCONFIGURED } from "@/lib/v2/generate-ref"
import { approvalsBadge, COUNTERS } from "@/lib/v2/selectors"
import { approvalEntries, approvalsInScope } from "@/lib/v2/approvals"
import { populationRows } from "@/lib/v2/population"
import { homeKpis } from "@/lib/v2/home"
import { approveItems, queueItems } from "@/lib/v2/queue"
import { behindPace, heatmap, NO_FILTERS, paceRows, studentsIn } from "@/lib/v2/reports"
import { buildHero, createSeed, IDS } from "@/lib/v2/seed"
import { skillProgress, courseWork } from "@/lib/v2/student"
import type { V2State } from "@/lib/v2/types"
import { mandatoryProgress, mandatoryProgressForCourse, pendingReasons, verificationRows, verifyRecord } from "@/lib/v2/verification"

/** Dataset spec section 6: the generated cohort keeps every number the product shows consistent with every other. */

const s = createSeed()
const students = s.people.filter((p) => p.kind === "student")
const isGen = (id: string) => id.startsWith("stu-g-")
const cohortSizes = (s.cohorts ?? []).map((c) => c.studentCount)
const total = cohortSizes.reduce((a, b) => a + b, 0)

describe("one student count, everywhere", () => {
  it("is the sum of the cohort sizes on every screen's selector", () => {
    expect(cohortSizes).toEqual([38, 43, 42])
    expect(students).toHaveLength(total)
    expect(studentsIn(s, NO_FILTERS)).toHaveLength(total)
    expect(verificationRows(s)).toHaveLength(total)
    expect(paceRows(s)).toHaveLength(total)
    expect(heatmap(s, NO_FILTERS).rows).toHaveLength(total)
    expect(homeKpis(s).students).toBe(total)
    expect(COUNTERS.find((c) => c.id === "students")!.value(s)).toBe(total)
  })

  it("splits 38 / 43 / 42, puts 14 in the accelerated track and no student in two cohorts", () => {
    for (const c of s.cohorts ?? []) expect(students.filter((p) => p.cohortId === c.id)).toHaveLength(c.studentCount)
    expect(students.filter((p) => p.trackIds?.includes("trk-accelerated"))).toHaveLength(14)
    expect(new Set(students.map((p) => p.id)).size).toBe(students.length)
    expect(students.every((p) => !!p.cohortId)).toBe(true)
  })
})

describe("the same student shows the same numbers (property over every student)", () => {
  const pace = new Map(paceRows(s).map((r) => [r.studentId, r]))
  const heat = new Map(heatmap(s, { ...NO_FILTERS, mandatoryOnly: true }).rows.map((r) => [r.student.id, r]))
  const pop = new Map(populationRows(s).rows.map((r) => [r.id, r]))
  const ver = new Map(verificationRows(s).map((r) => [r.studentId, r]))
  it("agrees across the population row, mandatoryProgress, pace and the verification list (own cohort offerings this term)", () => {
    for (const p of students) {
      const mp = mandatoryProgress(s, p.id)
      const achieved = mp.filter((m) => m.achieved).length
      expect(pop.get(p.id)!.achieved, p.id).toBe(achieved)
      expect(pop.get(p.id)!.required, p.id).toBe(mp.length)
      expect(pace.get(p.id)!.achieved, p.id).toBe(achieved)
      expect(ver.get(p.id)!.mandatoryAchieved, p.id).toBe(achieved)
      expect(ver.get(p.id)!.mandatoryTotal, p.id).toBe(mp.length)
    }
  })

  it("focus-course views (heat map, course work) agree with the focus-course mandatory view", () => {
    for (const p of students) {
      const achieved = mandatoryProgressForCourse(s, p.id).filter((m) => m.achieved).length
      expect(heat.get(p.id)!.achieved, p.id).toBe(achieved)
      expect(courseWork(s, p.id).summary.achieved, p.id).toBe(achieved)
    }
  })

  it("agrees with the verification snapshot when a record is verified", () => {
    const director = IDS.director
    // Not the records the director story already verified (chosen by id since the realistic-data pass): nothing new to verify there.
    const ready = verificationRows(s).filter((r) => r.pending === 0 && r.counted > 0 && r.status !== "verified").slice(0, 6)
    expect(ready.length).toBeGreaterThan(0)
    let state: V2State = s
    for (const r of ready) {
      const res = verifyRecord(state, r.studentId, { note: "", confirmed: true }, director, "2026-10-26T10:00:00Z")
      expect(res.ok, r.studentId).toBe(true)
      if (!res.ok) continue
      state = res.state
      const achieved = mandatoryProgress(state, r.studentId).filter((m) => m.achieved).length
      expect(res.verification.skills.filter((k) => k.achieved).length).toBe(achieved)
    }
  })
})

describe("queue counts equal status counts", () => {
  it("has one queue entry per request, and the badge and counter agree", () => {
    const awaiting = s.evaluations.filter((e) => e.status === "awaiting-approval")
    const items = queueItems(s)
    expect(items.flatMap((i) => i.evaluations)).toHaveLength(awaiting.length)
    expect(awaiting).toHaveLength(TARGETS.awaiting)
    // The badge counts approval entries in the current term (lib/v2/approvals.ts): status rows plus evidence held for an
    // unadopted evaluator name, grouped per evaluator and student. Raw status items are a subset of the entries.
    expect(approvalsBadge(s)).toBe(approvalsInScope(s).entries.length)
    const keys = new Set(approvalEntries(s).map((e) => e.key))
    expect(items.every((i) => keys.has(i.key))).toBe(true)
    expect(COUNTERS.find((c) => c.id === "queueWaiting")!.value(s)).toBe(s.submissions.filter((x) => x.status === "awaiting-review").length)
    expect(items.every((i) => i.state === "needs-outcome" || i.evaluations.length > 0)).toBe(true)
  })

  it("splits the 8,879 pieces of evidence into the five statuses the targets name", () => {
    const c = evidenceStatusCounts(s)
    expect(c).toEqual({ counted: TARGETS.counted, didNotQualify: TARGETS.didNotQualify, awaiting: TARGETS.awaiting, returned: TARGETS.returned, waiting: TARGETS.waiting })
    expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(8879)
  })

  it("moves the counts by exactly one when the reviewer approves a generated item", () => {
    const item = queueItems(s).find((i) => i.key.startsWith("sub-g-") && i.state === "ready")!
    const r = approveItems(s, [item.key], IDS.reviewer, "2026-10-26T10:00:00Z")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(queueItems(r.state)).toHaveLength(queueItems(s).length - 1)
    const c = evidenceStatusCounts(r.state)
    expect(c.awaiting).toBe(TARGETS.awaiting - item.evaluations.length)
    expect(c.counted + c.didNotQualify + c.awaiting + c.returned + c.waiting).toBe(8879)
  })
})

describe("referential integrity", () => {
  const people = new Set(s.people.map((p) => p.id))
  const skills = new Set(s.skills.map((k) => k.id))
  const sites = new Set((s.sites ?? []).map((x) => x.id))
  const subs = new Set(s.submissions.map((x) => x.id))
  it("points every row at something that exists", () => {
    for (const e of s.evaluations) {
      expect(people.has(e.studentId) && people.has(e.evaluatorId) && skills.has(e.skillId), e.id).toBe(true)
      if (e.siteId) expect(sites.has(e.siteId), e.id).toBe(true)
      if (e.submissionId) expect(subs.has(e.submissionId), e.id).toBe(true)
    }
    for (const x of s.submissions) {
      expect(people.has(x.studentId) && people.has(x.assignedToId), x.id).toBe(true)
      for (const k of x.skillIds) expect(skills.has(k), x.id).toBe(true)
      if (x.siteId) expect(sites.has(x.siteId), x.id).toBe(true)
    }
    for (const l of s.logEntries) {
      expect(people.has(l.studentId) && skills.has(l.skillId), l.id).toBe(true)
      if (l.requestId) expect(subs.has(l.requestId), l.id).toBe(true)
    }
    for (const m of s.mappings) expect(skills.has(m.skillId) && s.courses!.some((c) => c.id === m.courseId), `${m.courseId}/${m.skillId}`).toBe(true)
    for (const p of s.placements) expect(people.has(p.studentId) && (!p.siteId || sites.has(p.siteId)), p.id).toBe(true)
    for (const r of s.remediations) expect(s.evaluations.some((e) => e.id === r.evaluationId), r.id).toBe(true)
    for (const c of s.concerns) expect(s.evaluations.find((e) => e.id === c.evaluationId)?.studentId, c.id).toBe(c.studentId)
  })

  it("keeps clinical settings to clinical evidence and the program's named settings", () => {
    for (const e of s.evaluations) {
      if (e.setting === "clinical") {
        if (e.clinicalSetting) expect(s.program.clinicalSettings, e.id).toContain(e.clinicalSetting)
      } else expect(e.clinicalSetting, e.id).toBeUndefined()
    }
  })

  it("keeps each evaluation's latest outcome equal to its latest version", () => {
    for (const e of s.evaluations) expect(e.versions[e.versions.length - 1].outcome, e.id).toBe(e.outcome)
  })
})

// ---------------------------------------------------------------------------------------------------------------------

const required = s.skills.filter((k) => k.hgtc?.required && k.configured)
const attain = (id: string) => required.filter((k) => skillProgress(s, id, k.id)?.achieved).length / required.length
const cohortStudents = (cid: string) => students.filter((p) => p.cohortId === cid)
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length

describe("distributions that make charts honest", () => {
  it("has the starter library: 154 rows, ids unique, 142 configured, names from the list", () => {
    const linked = s.skills.filter((k) => k.hgtc)
    expect(linked).toHaveLength(HGTC.length)
    expect(new Set(linked.map((k) => k.hgtc!.id)).size).toBe(HGTC.length)
    expect(linked.filter((k) => k.configured)).toHaveLength(HGTC.length - UNCONFIGURED.size)
    expect(linked.filter((k) => !k.configured)).toHaveLength(12)
    for (const h of HGTC) {
      const k = linked.find((x) => x.hgtc!.id === h.id)!
      if (k.id === h.id) expect(k.name).toBe(h.name)
    }
    // The seven rows the hand-written library already has keep their hero id and name.
    expect(linked.filter((k) => !k.id.startsWith("hgtc-"))).toHaveLength(7)
    expect(s.skills.length).toBe(HGTC.length - 7 + s.skills.filter((k) => !k.id.startsWith("hgtc-")).length)
    expect(s.skills.length).toBeGreaterThanOrEqual(100)
  })

  it("graduating cohort: 31 complete, 4 one short (the same row), 3 far behind", () => {
    const ids = cohortStudents("coh-2026").map((p) => p.id)
    const miss = ids.map((id) => required.filter((k) => !skillProgress(s, id, k.id)?.achieved).map((k) => k.id))
    expect(miss.filter((m) => m.length === 0)).toHaveLength(31)
    const one = miss.filter((m) => m.length === 1)
    expect(one).toHaveLength(4)
    expect(new Set(one.map((m) => m[0])).size).toBe(1)
    expect(s.skills.find((k) => k.id === one[0][0])!.name).toBe("Hangs PB Med")
    const far = miss.filter((m) => m.length >= 4)
    expect(far).toHaveLength(3)
    // 4 or more missing rows is more than the form's 7 percent of the required rows.
    expect(far.every((m) => m.length / required.length > 0.07)).toBe(true)
    const shares = ids.map(attain)
    expect(mean(shares)).toBeGreaterThan(0.9)
    expect(Math.min(...shares)).toBeGreaterThanOrEqual(0.55)
    expect(Math.min(...shares)).toBeLessThan(0.9)
  })

  it("mid-program and first-year cohorts sit lower, with a real spread inside each", () => {
    const c27 = cohortStudents("coh-2027").map((p) => attain(p.id))
    const c28 = cohortStudents("coh-2028").map((p) => attain(p.id))
    expect(mean(c27)).toBeGreaterThan(0.35)
    expect(mean(c27)).toBeLessThan(0.75)
    expect(Math.min(...c27)).toBeLessThan(0.3)
    expect(Math.max(...c27)).toBeGreaterThan(0.6)
    expect(mean(c28)).toBeGreaterThan(0.1)
    expect(mean(c28)).toBeLessThan(0.4)
    expect(Math.max(...c28)).toBeLessThan(0.7)
    for (const c of [c27, c28]) {
      const m = mean(c)
      expect(Math.sqrt(mean(c.map((x) => (x - m) ** 2)))).toBeGreaterThan(0.08)
    }
    expect(mean(cohortStudents("coh-2026").map((p) => attain(p.id)))).toBeGreaterThan(mean(c27))
    expect(mean(c27)).toBeGreaterThan(mean(c28))
  })

  it("puts 15 to 30 percent of students behind the term clock (population method, own cohort offerings)", () => {
    // Before 2026-10-26 this read the focus course only (12 of 123). The single population method gives 28 of 123.
    const n = behindPace(s).length
    expect(n).toBe(populationRows(s).rows.filter((r) => r.behind).length)
    expect(n / total).toBeGreaterThanOrEqual(0.15)
    expect(n / total).toBeLessThanOrEqual(0.3)
  })

  it("has a long tail: evidence per skill is skewed, 25 or more configured skills have under 5 pieces", () => {
    const by = new Map<string, number>()
    for (const e of s.evaluations) by.set(e.skillId, (by.get(e.skillId) ?? 0) + 1)
    const sorted = [...by.values()].sort((a, b) => b - a)
    const top12 = sorted.slice(0, 12).reduce((a, b) => a + b, 0) / s.evaluations.length
    expect(top12).toBeGreaterThan(0.3)
    expect(top12).toBeLessThan(0.45)
    expect(s.skills.filter((k) => k.configured && (by.get(k.id) ?? 0) < 5).length).toBeGreaterThanOrEqual(25)
    expect(s.skills.filter((k) => !k.configured && k.hgtc).every((k) => !by.has(k.id))).toBe(true)
  })

  it("spreads evidence over many evaluators, none over 5 percent, with a heavy tail", () => {
    const by = new Map<string, number>()
    for (const e of s.evaluations) by.set(e.evaluatorId, (by.get(e.evaluatorId) ?? 0) + 1)
    const sorted = [...by.values()].sort((a, b) => b - a)
    expect(by.size).toBeGreaterThanOrEqual(100)
    expect(sorted[0] / s.evaluations.length).toBeLessThanOrEqual(0.05)
    expect(sorted.filter((n) => n >= 10).length).toBeGreaterThanOrEqual(60)
    expect(sorted.filter((n) => n < 5).length).toBeGreaterThanOrEqual(10)
  })

  it("ages the waiting requests into 0-3 / 4-7 / 8-14 / 15+ day buckets within 3 points of 40 / 25 / 22 / 13", () => {
    const open = s.submissions.filter((x) => x.status === "with-evaluator" || x.status === "stalled")
    const bucket = [0, 0, 0, 0]
    for (const x of open) bucket[x.daysWaiting <= 3 ? 0 : x.daysWaiting <= 7 ? 1 : x.daysWaiting <= 14 ? 2 : 3] += x.skillIds.length
    const n = bucket.reduce((a, b) => a + b, 0)
    expect(n).toBe(TARGETS.waiting)
    const pct = bucket.map((b) => (b / n) * 100)
    ;[40, 25, 22, 13].forEach((want, i) => expect(Math.abs(pct[i] - want), `bucket ${i}`).toBeLessThanOrEqual(3))
  })

  it("has outlier evaluators on returns and on did-not-qualify, each with enough evidence to mean something", () => {
    const by = new Map<string, { n: number; returned: number; dnq: number }>()
    for (const e of s.evaluations) {
      const r = by.get(e.evaluatorId) ?? { n: 0, returned: 0, dnq: 0 }
      r.n++
      if (e.status === "returned") r.returned++
      if ((e.status === "counted" && e.outcome !== "met") || e.status === "reopened") r.dnq++
      by.set(e.evaluatorId, r)
    }
    const meanRet = s.evaluations.filter((e) => e.status === "returned").length / s.evaluations.length
    const meanDnq = evidenceStatusCounts(s).didNotQualify / s.evaluations.length
    const big = [...by.values()].filter((r) => r.n >= 40)
    expect(big.filter((r) => r.returned / r.n >= 3 * meanRet).length).toBeGreaterThanOrEqual(2)
    expect(big.filter((r) => r.dnq / r.n >= 3 * meanDnq).length).toBeGreaterThanOrEqual(2)
  })

  it("has 14 unverified evaluators with 1 to 6 pieces each, and 3 of them hold requests older than 8 days", () => {
    const un = s.people.filter((p) => p.verified === false)
    expect(un).toHaveLength(14)
    for (const p of un) {
      const n = s.evaluations.filter((e) => e.evaluatorId === p.id).length
      expect(n, p.id).toBeGreaterThanOrEqual(1)
      expect(n, p.id).toBeLessThanOrEqual(6)
    }
    const stale = new Set(s.submissions.filter((x) => x.status === "with-evaluator" && x.daysWaiting > 8 && un.some((p) => p.id === x.assignedToId)).map((x) => x.assignedToId))
    expect(stale.size).toBe(3)
  })

  it("has 180 evaluators and faculty as an evaluator kind", () => {
    const staff = s.people.filter((p) => p.kind !== "student")
    expect(staff).toHaveLength(180)
    expect(staff.filter((p) => p.kind === "faculty")).toHaveLength(18)
    expect(staff.filter((p) => p.kind === "lab-instructor")).toHaveLength(6)
  })

  it("has one stalled site: nine placements this term and 14 requests, all older than 15 days; two more sites hold 4 to 6 older than 10 days", () => {
    const here = (id: string) => s.submissions.filter((x) => x.siteId === id && (x.status === "with-evaluator" || x.status === "stalled"))
    const stalled = here("site-087")
    expect(s.placements.filter((p) => p.siteId === "site-087" && p.termId === "trm-fa26")).toHaveLength(9)
    expect(stalled.reduce((n, x) => n + x.skillIds.length, 0)).toBe(14)
    expect(stalled.every((x) => x.daysWaiting > 15)).toBe(true)
    expect(stalled.filter((x) => x.status === "stalled").length).toBeGreaterThanOrEqual(3)
    for (const id of ["site-023", "site-056"]) {
      const old = here(id).filter((x) => x.daysWaiting > 10).reduce((n, x) => n + x.skillIds.length, 0)
      expect(old, id).toBeGreaterThanOrEqual(4)
      expect(old, id).toBeLessThanOrEqual(6)
    }
  })

  it("has nine students in the mid cohort behind in IV therapy, and 12 of their requests older than 15 days", () => {
    const iv = s.skills.filter((k) => k.hgtc?.group === "IV Therapy" && k.hgtc.required && k.config?.achievement.minLevelIndex !== undefined).map((k) => k.id)
    expect(iv).toHaveLength(6)
    const behind = cohortStudents("coh-2027").filter((p) => isGen(p.id) && iv.filter((k) => skillProgress(s, p.id, k)?.achieved).length <= 1)
    expect(behind).toHaveLength(9)
    const peers = cohortStudents("coh-2027").filter((p) => isGen(p.id) && !behind.includes(p))
    expect(peers.every((p) => iv.filter((k) => skillProgress(s, p.id, k)?.achieved).length >= 4)).toBe(true)
    const ids = new Set(behind.map((p) => p.id))
    const old = s.submissions.filter((x) => ids.has(x.studentId) && (x.status === "with-evaluator" || x.status === "stalled") && x.daysWaiting > 15).reduce((n, x) => n + x.skillIds.length, 0)
    expect(old).toBe(12)
  })

  it("keeps lab evidence off clinical-setting minimums, and about 20 students show the shortfall", () => {
    const needInpatient = s.skills.filter((k) => k.config?.achievement.settingMinimums.some((m) => m.setting === "Inpatient") && k.hgtc)
    let short = 0
    for (const p of students) {
      if (needInpatient.some((k) => {
        const mine = s.evaluations.filter((e) => e.studentId === p.id && e.skillId === k.id && e.status === "counted" && e.outcome === "met")
        return mine.length > 0 && mine.every((e) => e.setting !== "clinical")
      })) short++
    }
    expect(short).toBeGreaterThanOrEqual(15)
    expect(short).toBeLessThanOrEqual(30)
  })

  it("has 12 students with two sign-offs from the same person on a two-evaluator skill", () => {
    const twoEval = s.skills.filter((k) => k.config?.achievement.distinctEvaluators === 2 && k.hgtc)
    const stuck = students.filter((p) => twoEval.some((k) => {
      const pr = skillProgress(s, p.id, k.id)
      return !!pr && pr.counted >= 2 && pr.distinct.have < pr.distinct.need
    }))
    expect(stuck).toHaveLength(12)
  })

  it("exercises each rule type at both ends: achieved and in progress", () => {
    const kinds = {
      count: (k: V2State["skills"][number]) => k.hgtc && k.config!.achievement.need === 1 && k.config!.achievement.distinctEvaluators === 1 && k.config!.achievement.minLevelIndex === null && k.config!.achievement.settingMinimums.length === 0,
      distinct: (k: V2State["skills"][number]) => !!k.hgtc && k.config!.achievement.distinctEvaluators === 2,
      level: (k: V2State["skills"][number]) => !!k.hgtc && k.config!.achievement.minLevelIndex === 1,
      setting: (k: V2State["skills"][number]) => !!k.hgtc && k.config!.achievement.settingMinimums.length > 0,
    }
    for (const [name, test] of Object.entries(kinds)) {
      const ks = s.skills.filter((k) => k.configured && test(k))
      let done = false
      let partial = false
      for (const k of ks) {
        for (const p of students) {
          const pr = skillProgress(s, p.id, k.id)
          if (!pr) continue
          if (pr.achieved) done = true
          else if (pr.counted > 0 || pr.awaiting > 0 || pr.notMet > 0 || pr.leftOut) partial = true
        }
      }
      expect(done, `${name} achieved`).toBe(true)
      expect(partial, `${name} in progress`).toBe(true)
    }
  })

  it("keeps 29 of the 38 graduating students free of anything open, so they are ready to verify", () => {
    // 29 since 2026-10-26: the director story answered one waiting request Unmet (spec section 12).
    const ids = cohortStudents("coh-2026").map((p) => p.id)
    expect(ids.filter((id) => pendingReasons(s, id).length === 0)).toHaveLength(29)
  })

  it("has 22 courses, 110 offerings, 5 terms, 120 sites and 40 sites with preceptors", () => {
    expect(s.courses).toHaveLength(22)
    expect(s.offerings).toHaveLength(110)
    expect(s.terms).toHaveLength(5)
    expect(s.terms!.filter((t) => t.current)).toHaveLength(1)
    expect(s.sites).toHaveLength(120)
    expect(s.sites!.filter((x) => x.hasPreceptors)).toHaveLength(40)
    expect(new Set(s.sites!.map((x) => x.setting)).size).toBe(6)
    const per = new Map<string, number>()
    for (const m of s.mappings) per.set(m.courseId, (per.get(m.courseId) ?? 0) + 1)
    for (const c of s.courses!) {
      if (c.id === s.course.id) continue
      expect(per.get(c.id) ?? 0, c.code).toBeGreaterThanOrEqual(18)
      expect(per.get(c.id) ?? 0, c.code).toBeLessThanOrEqual(60)
    }
  })

  it("splits evidence by setting: about 25 percent lab, 72 clinical, 3 simulation, and the current term holds about a third", () => {
    const n = s.evaluations.length
    const share = (f: (e: V2State["evaluations"][number]) => boolean) => s.evaluations.filter(f).length / n
    expect(share((e) => e.setting === "lab")).toBeGreaterThan(0.2)
    expect(share((e) => e.setting === "lab")).toBeLessThan(0.3)
    expect(share((e) => e.setting === "simulation")).toBeGreaterThan(0.015)
    expect(share((e) => e.setting === "simulation")).toBeLessThan(0.05)
    const termStart = Date.parse("2026-08-24T00:00:00Z")
    expect(share((e) => Date.parse(e.date) >= termStart)).toBeGreaterThan(0.25)
    expect(share((e) => Date.parse(e.date) >= termStart)).toBeLessThan(0.45)
  })
})

describe("determinism and the hand-written layer", () => {
  it("generates the same state twice", () => {
    expect(createSeed()).toEqual(createSeed())
  })

  it("pins a fingerprint of the seed: change SEED_VERSION and this number together, on purpose", () => {
    const text = JSON.stringify(createSeed())
    let h = 2166136261
    for (let i = 0; i < text.length; i += 7) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
    expect([text.length, h >>> 0]).toEqual(PINNED)
  })

  it("never edits the hand-written layer: its evaluations, submissions and people are a prefix of the seed", () => {
    const hero = buildHero()
    // The hero layer itself was extended on purpose on 2026-10-26 (dataset spec section 12): Maya has one returned submission
    // with a return reason and one did-not-qualify attempt (Unmet), so the student screens demo both cases for the hero.
    const ret = hero.submissions.find((x) => x.id === "sub-maya-2")!
    expect(ret).toMatchObject({ studentId: IDS.maya, status: "returned" })
    expect(ret.returns?.[0].reason.length).toBeGreaterThan(10)
    expect(hero.evaluations.find((e) => e.studentId === IDS.maya && e.skillId === "sk-sterile-dressing" && e.outcome === "not-met" && e.status === "counted")).toBeDefined()
    expect(s.evaluations.slice(0, hero.evaluations.length)).toEqual(hero.evaluations)
    expect(s.submissions.slice(0, hero.submissions.length)).toEqual(hero.submissions)
    for (const p of hero.people) {
      const q = s.people.find((x) => x.id === p.id)!
      expect({ ...q, cohortId: undefined, trackIds: undefined }).toMatchObject({ ...p })
    }
  })

  it("has no NaN, undefined or Infinity in any student's view models", () => {
    const text = JSON.stringify([paceRows(s), verificationRows(s), heatmap(s, NO_FILTERS).rows.map((r) => r.cells.map((c) => c.text)), students.map((p) => courseWork(s, p.id).summary)])
    expect(text).not.toMatch(/NaN|undefined|Infinity/)
  })
})

// SEED_VERSION 2026-10-26.3: placement dates, Maya story, director story, self-evaluations and review notes, two deactivated
// skills, cohort professional year (dataset spec section 12).
// SEED_VERSION 2026-10-26.4: rule holds sit only on skills that ask for approval (medication administration and point-of-care
// blood glucose now ask; generated holds moved onto the six list skills that ask), and counted evaluations on those skills carry
// the approval (dataset spec section 12.7).
// SEED_VERSION 2026-10-26.5-realistic: realistic but fictional people, sites, university and free text from lib/v2/pools.ts
// (decision D-X23, dataset spec section 13). Every fact in facts.ts is unchanged; story students are now chosen by id, not name.
// SEED_VERSION 2026-10-26.6-levels-groups (CALL 10-26): non-mandatory mapping rows split by position into recommended (1st, 3rd,
// 5th... per course) and optional; students gain enrollmentYear and enrollmentCategory (position-based, no PRNG draw). Every fact in
// facts.ts is unchanged (tests/v2/consistency-levels.test.ts).
// SEED_VERSION 2026-10-26.7-level-words: the assisted level reads "With assistance" (lib/v2/config.ts ASSISTED_LEVEL), as the configure
// preset says it, in place of "Works with prompts"; the seed is otherwise identical (label-swapped JSON compared equal) and every
// fact in facts.ts is unchanged.
// To re-pin after a pool or generator change: run this test, paste the new pair, bump SEED_VERSION.
const PINNED: [number, number] = [4928768, 897679549]
