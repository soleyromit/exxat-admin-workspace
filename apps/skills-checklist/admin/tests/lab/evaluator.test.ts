import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { binaryLabels } from "@/lib/v2/labels"
import {
  DEFAULT_OPTIONS,
  EV_STATES,
  blankResponse,
  buildInvitation,
  buildRequest,
  choicesFor,
  programLabels,
  doneCount,
  labSessionSkills,
  labTally,
  receipt,
  roster,
  rosterGroups,
  sampleResponses,
  validate,
  SEED_REQUEST_ID,
  type EvResponse,
} from "@/lib/lab/evaluator"

const s = createSeed()
const req = buildRequest(s, "request", "default")!

describe("evaluator: the program's labels, including the Configure presets (Oct 26 call)", () => {
  it("reads the program's labels by default and a preset when previewed", () => {
    const k = s.skills.find((x) => x.config && x.model === "binary")!
    expect(choicesFor(k, false).map((c) => c.label)).toEqual(binaryLabels(k.config!.outcomeLabels))
    expect(choicesFor(k, false, "approval").map((c) => c.label)).toEqual(["Approved", "Not approved"])
    const d = s.skills.find((x) => x.config && x.model === "demonstration" && x.config.levels.length === 3)!
    expect(programLabels(d, "independence").levels).toEqual(["Observed", "With assistance", "Independent"])
    expect(programLabels(d, null).levels).toEqual(d.config!.levels)
  })
  it("the form and the student's self-rating use the same preset labels, side by side", () => {
    const p = buildRequest(s, "long", "default", { ...DEFAULT_OPTIONS, labels: "approval" })!
    for (const sk of p.skills) {
      expect(sk.choices.slice(0, 2).map((c) => c.label)).toEqual(["Approved", "Not approved"])
      // A self-rating never shows the seed's binary words once a preset renames them.
      if (sk.self?.rating) expect(["Met", "Unmet", "Not met"]).not.toContain(sk.self.rating)
    }
    expect(buildRequest(s, "long", "default")!.skills[0].choices[0].label).not.toBe("Approved")
    // With the independence preset, a self-rating given as a level reads in the preset's level names.
    const lv = buildRequest(s, "long", "default", { ...DEFAULT_OPTIONS, labels: "independence" })!
    for (const sk of lv.skills.filter((x) => x.levels.length === 3 && x.self?.rating)) {
      expect([...sk.levels, ...sk.choices.map((c) => c.label)]).toContain(sk.self!.rating)
    }
  })
})

describe("evaluator request view model", () => {
  it("opens the seeded request with who, what and where from real data", () => {
    expect(req.id).toBe(SEED_REQUEST_ID)
    expect(req.student.name).toBe("Maya Ferreira")
    expect(req.evaluator.name).toBe("J. Delgado, RN")
    expect(req.skills.map((k) => k.name)).toEqual(["Indwelling urinary catheter insertion", "Oral medication administration"])
    expect(req.where).toEqual({ location: "Harbor General, 4 West", setting: "Inpatient" })
    expect(req.onRecord).toBe(true)
    expect(req.revision).toBe(1)
  })

  it("uses the program's own outcome labels and shows self-rating only where the student gave one (EV-03, EV-04)", () => {
    const cath = req.skills[0]
    // The program's own labels, with a stored legacy "Not met" shown as the default "Unmet" (lib/v2/labels.ts binaryLabels).
    expect(cath.choices.map((c) => c.label)).toEqual(binaryLabels(s.skills.find((k) => k.id === cath.id)!.config!.outcomeLabels))
    expect(cath.choices.map((c) => c.label)).not.toContain("Not met")
    expect(cath.self?.rating).toBe("With assistance")
    expect(req.skills[1].self).toBeNull()
    expect(cath.levels.length).toBeGreaterThan(0)
    expect(req.skills[1].levels).toEqual([])
  })

  it("keeps Feedback only off unless the pending option is on", () => {
    expect(req.skills[0].choices).toHaveLength(2)
    const on = buildRequest(s, "request", "default", { ...DEFAULT_OPTIONS, feedbackOnly: true })!
    expect(on.skills[0].choices.map((c) => c.label)).toContain("Feedback only")
  })

  it("covers every evaluation model in the long sample, only configured skills", () => {
    const long = buildRequest(s, "long", "default")!
    expect(long.sample).toBe(true)
    expect(new Set(long.skills.map((k) => k.model))).toEqual(new Set(["demonstration", "binary", "question", "scored"]))
  })

  it("carries revision and return reason on a corrected request, attempt on a further attempt, and the unverified name", () => {
    const c = buildRequest(s, "request", "corrected")!
    expect(c.revision).toBeGreaterThanOrEqual(2)
    expect(c.returnReason?.length).toBeGreaterThan(10)
    expect(c.skills.every((k) => k.prior)).toBe(true)
    const f = buildRequest(s, "request", "further-attempt")!
    expect(f.skills.every((k) => (k.attempt?.n ?? 0) >= 2)).toBe(true)
    expect(buildRequest(s, "request", "unverified")!.onRecord).toBe(false)
  })

  it("lists every lab state the brief names", () => {
    expect(EV_STATES.map((x) => x.id)).toEqual(["default", "corrected", "further-attempt", "forwarded", "expired", "not-for-you", "completed", "submitted", "offline", "errors", "unverified"])
  })
})

describe("validation", () => {
  it("needs an outcome per skill, then the level once graded", () => {
    expect(validate(req, {}).map((i) => i.message)).toEqual(["Choose an outcome.", "Choose an outcome."])
    const r: Record<string, EvResponse> = { [req.skills[0].id]: { ...blankResponse(req.skills[0]), outcome: "met" } }
    expect(validate(req, r).map((i) => i.field)).toEqual([`ev-lvl-${req.skills[0].id}`, `ev-out-${req.skills[1].id}`])
    expect(doneCount(req, r)).toBe(0)
  })

  it("blocks submit without feedback when the program requires it (EV-06)", () => {
    const fb = buildRequest(s, "request", "default", { ...DEFAULT_OPTIONS, requireFeedback: true })!
    const filled = Object.fromEntries(Object.entries(sampleResponses(fb)).map(([k, v]) => [k, { ...v, feedback: "" }]))
    expect(validate(fb, filled).every((i) => i.message.startsWith("Write feedback"))).toBe(true)
    expect(validate(fb, sampleResponses(fb))).toEqual([])
  })

  it("asks every criterion of a question-model skill once graded", () => {
    const long = buildRequest(s, "long", "default")!
    const q = long.skills.find((k) => k.answerKind === "yes-no")!
    const issues = validate(long, { [q.id]: { ...blankResponse(q), outcome: "met" } }).filter((i) => i.skillId === q.id)
    expect(issues.map((i) => i.message)).toEqual(["Answer every question."])
  })
})

describe("receipt (EV-07)", () => {
  it("says counts now, waits for approval, or queued offline per skill, glyph plus word", () => {
    const filled = sampleResponses(req)
    // The second skill (medication administration) asks for approval (SC-15, dataset spec 12.7), so its line waits.
    expect(receipt(req, filled).map((l) => l.word)).toEqual(["Counts now", "Waits for program approval"])
    const held = buildRequest(s, "request", "default", { ...DEFAULT_OPTIONS, holdForApproval: true })!
    expect(receipt(held, sampleResponses(held)).every((l) => l.status === "waits" && l.icon === "fa-clock")).toBe(true)
    expect(receipt(req, filled, { offline: true }).every((l) => l.status === "queued")).toBe(true)
  })
})

describe("invitation email", () => {
  const mail = buildInvitation(s)!

  it("lists every open request with its own link and names students and count in the first 40 characters", () => {
    expect(mail.rows).toHaveLength(2)
    expect(new Set(mail.rows.map((r) => r.link)).size).toBe(2)
    expect(mail.subject).toBe("Priya Raman and Maya Ferreira: 3 skills to sign off")
    expect(mail.subject.slice(0, 40)).toContain("Maya Ferreira")
  })

  it("states expiry once and has a plain text version with every link", () => {
    expect(mail.plainText.match(/until/g)).toHaveLength(1)
    for (const r of mail.rows) expect(mail.plainText).toContain(r.link)
  })

  it("narrows to one request", () => {
    expect(buildInvitation(s, undefined, SEED_REQUEST_ID)!.subject).toBe("Maya Ferreira asks you to sign off 2 skills")
  })
})

describe("lab batch grid", () => {
  it("works at cohort scale with search and group filter", () => {
    expect(roster(s, { query: "", group: "" })).toHaveLength(123)
    const groups = rosterGroups(s)
    expect(groups.reduce((n, g) => n + g.count, 0)).toBe(123)
    expect(roster(s, { query: "", group: groups[0].value }).length).toBe(groups[0].count)
    expect(roster(s, { query: "maya", group: "" }).map((r) => r.name)).toContain("Maya Ferreira")
  })

  it("offers published course skills and explains any that are blocked", () => {
    const skills = labSessionSkills(s)
    expect(skills.length).toBeGreaterThan(0)
    for (const k of skills) if (k.blocked) expect(k.blocked.length).toBeGreaterThan(5)
  })

  it("counts once: results, students done, absent", () => {
    const rows = roster(s, { query: "", group: "" }).slice(0, 3)
    const t = labTally(rows, ["a", "b"], { [`${rows[0].id}|a`]: "met", [`${rows[0].id}|b`]: "not-met", [`${rows[1].id}|a`]: "met", [`${rows[2].id}|*`]: "absent" })
    expect(t).toEqual({ results: 3, done: 1, left: 1, absent: 1 })
  })
})

describe("copy rules in evaluator files", () => {
  const root = path.resolve(__dirname, "../..")
  const files = [
    "lib/lab/evaluator.ts",
    ...fs.readdirSync(path.join(root, "components/lab/evaluator")).map((f) => `components/lab/evaluator/${f}`),
    ...fs.readdirSync(path.join(root, "components/lab/screens")).filter((f) => f.startsWith("evaluator-") || f.startsWith("lab-instructor-")).map((f) => `components/lab/screens/${f}`),
  ]
  it("has no em dash and never says items", () => {
    for (const f of files) {
      const src = fs.readFileSync(path.join(root, f), "utf8")
      expect(src.includes("—"), f).toBe(false)
      expect(/(?<![\w-])items(?![\w-])/i.test(src), f).toBe(false)
    }
  })
})

// Appended 2026-10-26: second and third variants (receipt summary, inbox preview, SMS drafts).
import { PREVIEW_CHARS, SMS_SEGMENT, STUDENT_SEES, inboxPreview, receiptSummary, smsDrafts, EVALUATOR_ID } from "@/lib/lab/evaluator"

describe("evaluator second variants", () => {
  it("summarises the receipt so the parts add up to the skills signed", () => {
    const held = buildRequest(s, "long", "submitted", { ...DEFAULT_OPTIONS, holdForApproval: true })!
    const lines = receipt(held, sampleResponses(held))
    const sum = receiptSummary(lines)
    expect(sum.counts + sum.waits + sum.queued + sum.feedback).toBe(lines.length)
    expect(sum.waits).toBe(lines.length)
    const open = receipt(req, sampleResponses(req))
    expect(receiptSummary(open).counts + receiptSummary(open).waits).toBe(req.skills.length)
  })

  it("tells the student's word for each receipt state, from the glossary", () => {
    expect(STUDENT_SEES.counts.word).toBe("Counted")
    expect(STUDENT_SEES.waits.word).toBe("Awaiting approval")
  })

  it("shows who and how many inside the first 40 characters of the inbox row", () => {
    const one = buildInvitation(s, EVALUATOR_ID, SEED_REQUEST_ID)!
    const p = inboxPreview(one)
    expect(p.subjectVisible.length).toBeLessThanOrEqual(PREVIEW_CHARS)
    expect(p.subjectVisible).toContain("Maya Ferreira")
    expect(p.preheader.length).toBeLessThanOrEqual(PREVIEW_CHARS)
  })

  it("drafts one text per request, each with its own link and within one segment", () => {
    const all = buildInvitation(s, EVALUATOR_ID)!
    const texts = smsDrafts(all, s.program.school)
    expect(texts.length).toBe(all.rows.length)
    expect(new Set(texts.map((t) => t.text.split(" ").pop())).size).toBe(texts.length)
    for (const t of texts) {
      expect(t.length).toBe(t.text.length)
      expect(t.length).toBeLessThanOrEqual(SMS_SEGMENT)
      expect(t.text).not.toMatch(/\bitems\b/)
    }
  })
})
