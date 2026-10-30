import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { evaluationStatusLabel } from "@/lib/v2/labels"
import { sentElsewhereTo } from "@/lib/v2/student"
import { appendQuestions, parseQuestionLines, questionNumbers, setSubsetRange, type LabRule } from "@/lib/lab/configure"
import { NO_EDITS, applyReviewEdits, buildReview, readChecklist, resolve } from "@/lib/lab/import"
import { duplicateChoices, editPastedLine, keepBothSeveralName, parseSeveral, severalItemsWithChoices } from "@/lib/lab/library"
import { newEvaluatorRows, recordNamedEvaluator } from "@/lib/lab/new-evaluators"
import { offeringsForSkill, skillReach } from "@/lib/lab/mapping"
import { commitDecision, itemDetail, labState, reviewRows, scopeRows } from "@/lib/lab/reviewer"
import { EMPTY_SCOPE } from "@/lib/lab/scope"

/** Wave 3, worker B: the remaining admin setup gaps (req-coverage-lab.md, P1 row 21 and the P2 list). */

const seed = createSeed()

const rule = (over: Partial<LabRule>): LabRule => ({ questions: [], questionRule: null, ...over }) as unknown as LabRule

describe("SC-06: large question sets", () => {
  it("reads a pasted list, dropping numbering, bullets and blank lines", () => {
    expect(parseQuestionLines("1. Washes hands\n2) Explains the procedure\n\n- Checks the order\n• Documents\n  Disposes of sharps  ")).toEqual([
      "Washes hands",
      "Explains the procedure",
      "Checks the order",
      "Documents",
      "Disposes of sharps",
    ])
  })
  it("appends after the written questions and fills trailing empty rows, keeping every position", () => {
    const r = appendQuestions(rule({ questions: ["A", "B", ""] }), ["C", "D"])
    expect(r.questions).toEqual(["A", "B", "C", "D"])
  })
  it("holds 100 pasted questions and ticks a range in one step", () => {
    const text = Array.from({ length: 100 }, (_, i) => `${i + 1}. Question ${i + 1}`).join("\n")
    const r = appendQuestions(rule({ questions: [], questionRule: { kind: "subset", indices: [] } as LabRule["questionRule"] }), parseQuestionLines(text))
    expect(r.questions).toHaveLength(100)
    const ticked = setSubsetRange(r, 12, 40, true)
    expect(ticked.questionRule).toEqual({ kind: "subset", indices: Array.from({ length: 29 }, (_, i) => i + 11) })
    const all = setSubsetRange(ticked, 1, 100, true)
    expect((all.questionRule as { indices: number[] }).indices).toHaveLength(100)
    const cleared = setSubsetRange(all, 1, 100, false)
    expect((cleared.questionRule as { indices: number[] }).indices).toEqual([])
  })
  it("names a long subset as ranges, so 60 ticked reads '1 to 60'", () => {
    expect(questionNumbers(Array.from({ length: 60 }, (_, i) => i))).toEqual(["1 to 60"])
    expect(questionNumbers([0, 1, 2, 4, 6, 7, 8])).toEqual(["1 to 3", "5", "7 to 9"])
    expect(questionNumbers([3, 1])).toEqual(["2", "4"])
  })
  it("clamps a range past the end and ignores a reversed one", () => {
    const r = rule({ questions: ["a", "b", "c"], questionRule: { kind: "subset", indices: [] } as LabRule["questionRule"] })
    expect((setSubsetRange(r, 2, 99, true).questionRule as { indices: number[] }).indices).toEqual([1, 2])
    expect(setSubsetRange(r, 3, 1, true)).toBe(r)
  })
})

describe("IM-04: descriptions and questions from the file", () => {
  it("splits 'Name – description' and attaches criteria written under a skill", () => {
    const read = readChecklist("Hygiene\n  Hand washing – Washes for 20 seconds before contact\n      Criteria: Removes jewelry\n      Question: Dries with a clean towel?\n  Bed bath\n")
    expect(read.rows.map((r) => r.name)).toEqual(["Hand washing", "Bed bath"])
    expect(read.rows[0].description).toBe("Washes for 20 seconds before contact")
    expect(read.rows[0].criteria).toEqual(["Removes jewelry", "Dries with a clean towel?"])
    expect(read.rows[1].description).toBeUndefined()
  })
  it("a category line ending in a colon names the category without the colon", () => {
    const read = readChecklist("Hygiene:\n  Bed bath\n")
    expect(read.sections).toEqual(["Hygiene"])
    expect(read.rows[0].section).toBe("Hygiene")
  })
})

describe("IM-05: split, merge and add during review", () => {
  const text = "Hygiene\n  Hand washing\n  Oral care and denture care\n  Bed bath\n"
  const base = buildReview(text, [])
  const [hand, oral, bath] = base.rows

  it("splits one line into several skills, keeping the source line", () => {
    const r = applyReviewEdits(base, { ...NO_EDITS, splits: { [oral.id]: ["Oral care", "Denture care"] } }, [])
    const names = resolve(r, {}).filter((x) => x.status === "ready").map((x) => x.name)
    expect(names).toEqual(["Hand washing", "Oral care", "Denture care", "Bed bath"])
    expect(r.rows.filter((x) => x.splitFrom === oral.id).every((x) => x.sourceText === oral.sourceText)).toBe(true)
  })
  it("merges a line into another; it is listed as merged, not created", () => {
    const r = applyReviewEdits(base, { ...NO_EDITS, merges: { [bath.id]: hand.id } }, [])
    const out = resolve(r, {}).find((x) => x.row.id === bath.id)!
    expect(out.status).toBe("left-out")
    expect(out.outcome).toBe("Merged into Hand washing")
  })
  it("adds a new entry in its category; a name already in the library still asks for a decision (IM-06)", () => {
    const library = [{ id: "k1", name: "Catheter care", configured: false }]
    const r = applyReviewEdits(buildReview(text, library), { ...NO_EDITS, added: [{ id: "n1", name: "Foot care", section: "Hygiene" }, { id: "n2", name: "Catheter care", section: "Hygiene" }] }, library)
    const res = resolve(r, {})
    expect(res.find((x) => x.row.id === "n1")).toMatchObject({ status: "ready", name: "Foot care", section: "Hygiene" })
    expect(res.find((x) => x.row.id === "n2")).toMatchObject({ status: "look" })
    expect(r.exceptions.n2).toEqual(["duplicate-library"])
  })
  it("no edits leaves the reading untouched", () => {
    expect(applyReviewEdits(base, NO_EDITS, [])).toBe(base)
  })
})

describe("IM-05 / IM-06 in add several", () => {
  const rows = [
    { id: "a", name: "Hand washing", status: "not-configured" as const, evidence: 0 },
    { id: "b", name: "Bed bath", status: "configured" as const, evidence: 4 },
  ]
  const parsed = parseSeveral("Hand washing\tHygiene\nBed bath\nFoot care", rows.map((r) => r.name))

  it("offers replace only for an unconfigured twin with no evidence", () => {
    expect(duplicateChoices(rows[0])).toEqual(["skip", "keep-both", "replace"])
    expect(duplicateChoices(rows[1])).toEqual(["skip", "keep-both"])
  })
  it("skip adds nothing; keep both adds a '(2)' name; replace updates the twin in place", () => {
    expect(severalItemsWithChoices(parsed, rows, {}).map((i) => i.name)).toEqual(["Foot care"])
    const items = severalItemsWithChoices(parsed, rows, { "hand washing": "replace", "bed bath": "keep-both" })
    expect(items).toContainEqual({ name: "Hand washing", category: "Hygiene", replaces: "a", source: "Hand washing" })
    expect(items).toContainEqual({ name: "Bed bath (2)", source: "Bed bath" })
  })
  it("a replace on a configured twin is not applied", () => {
    expect(severalItemsWithChoices(parsed, rows, { "bed bath": "replace" }).map((i) => i.name)).toEqual(["Foot care"])
  })
  it("edits or leaves out one pasted line, keeping its other cells", () => {
    expect(editPastedLine("A\tCat\nB", 1, "A2")).toBe("A2\tCat\nB")
    expect(editPastedLine("A\nB\nC", 2, null)).toBe("A\nC")
    expect(keepBothSeveralName("Bed bath", ["Bed bath", "Bed bath (2)"])).toBe("Bed bath (3)")
  })
})

describe("SL-09: a name typed on Send reaches the directory", () => {
  const student = seed.people.find((p) => p.kind === "student")!
  const skill = seed.skills.find((k) => k.configured)!
  it("records the name as not verified, with its request, so New evaluators lists it", () => {
    const before = newEvaluatorRows(seed).length
    const r = recordNamedEvaluator(seed, { studentId: student.id, name: "  Dana  Okafor ", email: "dana.okafor@lab.example.edu", kind: "lab-instructor", skillIds: [skill.id] }, "2026-10-30")
    expect(r.reused).toBe(false)
    const rows = newEvaluatorRows(r.state)
    expect(rows.length).toBe(before + 1)
    const row = rows.find((x) => x.id === r.personId)!
    expect(row.name).toBe("Dana Okafor")
    expect(row.addedById).toBe(student.id)
    expect(r.state.submissions.find((x) => x.id === r.requestId)).toMatchObject({ status: "with-evaluator", assignedToId: r.personId, method: "link" })
  })
  it("one person per email: a second request to the same email reuses the record", () => {
    const first = recordNamedEvaluator(seed, { studentId: student.id, name: "Dana Okafor", email: "dana.okafor@lab.example.edu", kind: "lab-instructor", skillIds: [skill.id] }, "2026-10-30")
    const second = recordNamedEvaluator(first.state, { studentId: student.id, name: "Dana Okafore", email: "DANA.OKAFOR@lab.example.edu ", kind: "lab-instructor", skillIds: [skill.id] }, "2026-10-30")
    expect(second.reused).toBe(true)
    expect(second.personId).toBe(first.personId)
    expect(second.state.people.length).toBe(first.state.people.length)
  })
})

describe("D-X25: Assign to someone else is stored as a handoff, never as returned", () => {
  it("stores status 'reassigned'; the export word and the student cue follow", () => {
    const state = labState(seed)
    const row = scopeRows(state, reviewRows(state), EMPTY_SCOPE).rows.find((r) => r.kind === "unverified")!
    const to = itemDetail(state, reviewRows(state), row.key)!.assignTo[0]
    const next = commitDecision(seed, { kind: "assign", key: row.key, toId: to.id })
    const held = next.evaluations.filter((e) => row.evaluationIds.includes(e.id))
    expect(held.length).toBeGreaterThan(0)
    for (const e of held) {
      expect(e.status).toBe("reassigned")
      expect(evaluationStatusLabel(e.status)).toBe("Sent for a new evaluation")
      expect(sentElsewhereTo(next, e)?.id).toBe(to.id)
    }
  })
})

describe("CM-01 / CM-02 / CM-04 on course mapping B", () => {
  it("each offering row in B carries the academic year, a search haystack and its mapped and mandatory counts", () => {
    const term = seed.terms?.[0]
    if (!term) return
    const reach = skillReach(seed, {} as never, term.id, undefined as never, true)
    const skill = reach.find((r) => r.configured)
    if (!skill) return
    const rows = offeringsForSkill(seed, {} as never, skill.id, term.id, true)
    for (const r of rows) {
      expect(r.academicYear).toMatch(/\d{4}/)
      expect(typeof r.mapped).toBe("number")
      expect(typeof r.mandatory).toBe("number")
      expect(r.haystack.length).toBeGreaterThan(0)
    }
  })
})
