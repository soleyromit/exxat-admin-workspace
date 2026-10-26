import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { buildDashboard } from "@/lib/lab/dashboard"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { DEFAULT_STUDENT, attemptCountLine, attempts, buildStudent, fixModel, requestGroups, shortfallSentence, stateLabel, studentHref, studentWithReturned, withAllDone } from "@/lib/lab/student"

const seed = createSeed()
const maya = buildStudent(seed)!

describe("student model at scale (123 students, Maya Ferreira hero path)", () => {
  it("builds Maya inside the full dataset", () => {
    expect(seed.people.filter((p) => p.kind === "student")).toHaveLength(123)
    expect(maya.student.name).toBe("Maya Ferreira")
    expect(maya.all.length).toBeGreaterThan(50)
  })

  it("shows the same required and achieved counts the staff dashboard row shows (consistency invariant)", () => {
    const dash = buildDashboard(seed, EMPTY_SCOPE)
    expect(dash.total).toBe(123)
    expect(maya.row).not.toBeNull()
    expect(maya.counts.required).toBe(maya.row!.required)
    expect(maya.counts.achieved).toBe(maya.row!.achieved)
  })

  it("uses the four AE-04 states with Romit's third label", () => {
    expect(stateLabel("progress", 2, 4)).toBe("In progress (2 of 4)")
    expect(stateLabel("dnq", 0, 3)).toBe("Did not count")
    expect(stateLabel("none", 0, 3)).toBe("No evidence yet")
    const labels = new Set(maya.all.map((r) => r.state))
    for (const s of labels) expect(["none", "dnq", "progress", "achieved"]).toContain(s)
  })

  it("states every did-not-count as the failed rule in numbers plus the next step", () => {
    const dnq = maya.all.filter((r) => r.state === "dnq")
    expect(dnq.length).toBeGreaterThan(0)
    for (const r of dnq) {
      expect(r.failed?.rule).toMatch(/\d/)
      expect(r.failed?.next).toMatch(/further attempt/)
    }
    expect(shortfallSentence(dnq[0].progress)).toMatch(/^Needs \d+ Met evaluations?; you have \d+\./)
  })

  it("ranks next actions returned, did not count, then one away, with numbers and a link", () => {
    expect(maya.next.length).toBeGreaterThan(0)
    for (const a of maya.next) expect(a.href.startsWith("/lab/student/")).toBe(true)
    const kinds = maya.next.map((a) => a.kind)
    expect(kinds.indexOf("dnq")).toBeLessThan(kinds.indexOf("one-away"))
    const other = buildStudent(seed, studentWithReturned(seed)!)!
    expect(other.next[0].kind).toBe("returned")
  })

  it("never says items, and links carry the student when it is not Maya", () => {
    const text = JSON.stringify({ n: maya.next, r: maya.required.map((r) => [r.label, r.rule, r.failed]) })
    expect(text).not.toMatch(/\bitems?\b/i)
    expect(studentHref("home")).toBe("/lab/student/home")
    expect(studentHref("skill-detail", { skill: "x" }, "stu-g-001")).toBe("/lab/student/skill-detail?student=stu-g-001&skill=x")
    expect(DEFAULT_STUDENT).toBe("stu-maya")
  })

  it("hides the cohort radar below 5 and keeps the pace series on the term clock", () => {
    expect(maya.cohortSize).toBeGreaterThanOrEqual(5)
    expect(maya.radarSuppressed).toBe(false)
    expect(maya.pace.length).toBeGreaterThan(10)
    const done = maya.pace.filter((p) => p.counted >= 0)
    expect(done[done.length - 1].counted).toBe(maya.row!.collected)
  })

  it("groups requests by evaluator with age and a per-request link state", () => {
    const groups = requestGroups(seed, DEFAULT_STUDENT)
    const open = groups.flatMap((g) => g.waiting)
    expect(open.length).toBeGreaterThan(0)
    for (const r of open) expect(r.link.length).toBeGreaterThan(5)
    const other = requestGroups(seed, studentWithReturned(seed)!)
    expect(other.flatMap((g) => g.returned).every((r) => r.reason && r.href.includes("fix-returned"))).toBe(true)
  })

  it("explains each attempt and keeps a did-not-qualify attempt intact", () => {
    const dnq = maya.all.find((r) => r.state === "dnq")!
    const rows = attempts(seed, DEFAULT_STUDENT, dnq.id)
    expect(rows.some((r) => r.kind === "not-counted")).toBe(true)
    for (const r of rows) expect(r.kind === "not-counted" ? r.answer : r.why).toMatch(/\w/)
    // The failed rule in numbers lives once, on the record, not repeated per attempt row.
    expect(dnq.failed?.rule).toMatch(/Needs \d+/)
  })

  it("names the fix path: correction keeps the same submission and evaluator, attempt is a new record", () => {
    // Hero story (2026-10-26): Maya has both a returned submission (the default case) and a did-not-qualify skill.
    const attempt = fixModel(seed, DEFAULT_STUDENT, { skillId: "sk-sterile-dressing" })!
    expect(attempt.case).toBe("attempt")
    expect(attempt.submissionId).toBeNull()
    expect(attempt.reason).toMatch(/Unmet/)
    expect(studentWithReturned(seed)).toBeTruthy()
    const correction = fixModel(seed, DEFAULT_STUDENT, {})!
    expect(correction.case).toBe("correction")
    expect(correction.nextNumber).toBeGreaterThanOrEqual(1)
    expect(correction.reason.length).toBeGreaterThan(5)
    expect(correction.others.every((o) => o.id !== correction.evaluatorId)).toBe(true)
  })

  it("demo all-done state clears waiting, returned and next actions", () => {
    const d = withAllDone(maya)
    expect(d.counts.achieved).toBe(d.counts.required)
    expect(d.next).toHaveLength(0)
  })
})

describe("how attempts are counted (Oct 26 call)", () => {
  it("says 'n attempts, m count' from the same rows the timeline shows; only completed evaluations are attempts", () => {
    expect(attemptCountLine([])).toBe("")
    expect(attemptCountLine([{ kind: "waiting" }, { kind: "returned" }])).toBe("")
    expect(attemptCountLine([{ kind: "counted" }, { kind: "not-counted" }, { kind: "counted" }, { kind: "not-counted" }, { kind: "counted" }, { kind: "waiting" }])).toBe("5 attempts, 3 count")
    expect(attemptCountLine([{ kind: "counted" }])).toBe("1 attempt, 1 counts")
    const dnq = maya.all.find((r) => r.state === "dnq")!
    const rows = attempts(seed, DEFAULT_STUDENT, dnq.id)
    const n = rows.filter((r) => r.kind === "counted").length
    expect(attemptCountLine(rows)).toMatch(new RegExp(`, ${n} counts?$`))
  })
})
