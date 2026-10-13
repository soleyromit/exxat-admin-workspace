import { describe, expect, it } from "vitest"
import * as C from "@/lib/copy"
import * as S from "@/lib/store"
import { SCENARIO } from "@/lib/seed"
import { seed } from "../store/helpers"

const db = seed()

/** Walk every string the copy module can produce statically (not the function results). */
function strings(o: unknown, out: string[] = []): string[] {
  if (typeof o === "string") out.push(o)
  else if (Array.isArray(o)) o.forEach((x) => strings(x, out))
  else if (o && typeof o === "object") Object.values(o as Record<string, unknown>).forEach((x) => strings(x, out))
  return out
}

/**
 * VOICE-RULE EXCEPTION (Romit, 2026-10-08: "build the exact mockup"). The re-skin copy modules lib/copy/r1-*.ts .. r5-*.ts hold
 * Sankalp's prototype strings VERBATIM, including em-dashes. They are deliberately NOT walked by the voice test below, and the
 * test "the prototype-verbatim modules are the only exception" makes that exclusion explicit: any other module that grows an
 * em-dash fails the rule above. See docs/ux/09 appendix "Prototype-verbatim strings".
 */
describe("voice rules (docs/ux/09 §1)", () => {
  const all = [...strings(C.surface), ...strings(C.buttons), ...strings(C.term), ...strings(C.linkMessage), ...strings(C.heldOrCounts), ...strings(C.locked), ...strings(C.sendCopy)]
  // Copy added during the build lives in its own modules; the same voice rules apply to every static string in them.
  const built = [
    ...strings(C.libraryChrome), ...strings(C.skillsExtra), ...strings(C.taxonExtra), ...strings(C.settingsExtra), ...strings(C.labExtra),
    ...strings(C.studentLocal), ...strings(C.reviewCopy), ...strings(C.reportingCopy), ...strings(C.reportFilterLabels),
    ...strings(C.evaluatorCopy), ...strings(C.emailCopy), ...strings(C.configureExtra), ...strings(C.importReviewCopy), ...strings(C.mappingCopy),
    ...strings(C.applyConfig), ...strings(C.configParts), ...strings(C.common), ...strings(C.importAiCopy),
  ]
  const every = [...all, ...built]

  it("no em-dashes, no exclamation marks, no colloquialisms in any static string", () => {
    expect(built.length).toBeGreaterThan(300)
    for (const s of every) {
      expect(s, s).not.toMatch(/[—–]/)
      expect(s, s).not.toMatch(/!/)
      expect(s.toLowerCase(), s).not.toMatch(/\b(oops|uh oh|awesome|cool|hey)\b/)
    }
  })

  it("never claims accuracy or AI for the import (IM-13)", () => {
    for (const s of strings(C.surface.s08)) expect(s.toLowerCase(), s).not.toMatch(/\bai\b|smart|automatically|accura|understood/)
  })

  it("never shows requirement ids or internal notes (no SC-09, no OD-16, no stakeholder names)", () => {
    for (const s of every) expect(s, s).not.toMatch(/\b[A-Z]{2}-\d{2}\b|Sankalp|Aarti|Vishaka|Sarah/)
  })

  it("does not use the prototype's 'Return to preceptor' or 'recommended' (OD-16, glossary)", () => {
    expect(C.buttons.returnForCorrection).toBe("Return for correction")
    for (const s of every) expect(s).not.toMatch(/return to preceptor|recommended/i)
  })

  it("keeps the OD-1 / OD-18 / OD-10 copy neutral", () => {
    expect(C.surface.s11.returnPrompt).not.toMatch(/student|preceptor|evaluator will/i)
    expect(C.linkMessage.invalid).not.toMatch(/expire|days|hours/i)
    expect(C.surface.s17.formatLabel).not.toMatch(/xlsx|workbook/i)
    for (const s of strings(C.surface.s10)) expect(s.toLowerCase(), s).not.toMatch(/carry|carried|inherit/)
  })
})

describe("skill status labels behind the ONE display flag (OD-03, AE-04)", () => {
  it("four: four distinct labels", () => {
    const labels = (["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"] as const).map((s) => C.statusLabel(s, "four"))
    expect(labels).toEqual(["No evidence yet", "Evidence does not qualify", "In progress", "Achieved"])
    expect(new Set(labels).size).toBe(4)
  })
  it("merged: states 1 and 2 share 'Not met'", () => {
    expect(C.statusLabel("noEvidence", "merged")).toBe("Not met")
    expect(C.statusLabel("evidenceDoesNotQualify", "merged")).toBe("Not met")
    expect(C.statusLabel("partial", "merged")).toBe("In progress")
  })
  it("'Did not meet criteria' is a submission outcome and is never a skill status label", () => {
    for (const d of ["four", "merged"] as const) for (const s of ["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"] as const) expect(C.statusLabel(s, d)).not.toBe("Did not meet criteria")
    expect(C.submissionOutcome.didNotMeet).toBe("Did not meet criteria")
  })
  it("column headers follow the flag", () => {
    expect(C.studentColumns("four")).toContain("Evidence does not qualify")
    expect(C.studentColumns("merged")).not.toContain("Evidence does not qualify")
    expect(C.studentColumns("merged")).toContain("Not met")
  })
  it("helper text states the rule and the count", () => {
    expect(C.statusHelper("partial", { have: 2, need: 5 })).toBe("2 of 5 qualifying evaluations so far.")
  })
})

describe("failed-rule generator (SH-03, docs/ux/09 §7)", () => {
  it("per model: evaluation-level reasons read the CURRENT labels and questions", () => {
    const sub = db.submissions.find((s) => s.studentId === SCENARIO.priya && s.skillId === "sk-foley")!
    const skill = db.skills.find((s) => s.id === "sk-foley")!
    const r = S.failedRule(db, SCENARIO.priya, "sk-foley", sub.id)!
    const ctx = C.ruleContext(db, skill)
    expect(C.evaluationReasonText(r.evaluationReasons[0], ctx)).toBe("These required questions were not answered Yes: Performs the procedure correctly.")
    expect(C.didNotMeetSentence(C.evaluationReasonText(r.evaluationReasons[0], ctx))).toBe("This evaluation did not meet the criteria because these required questions were not answered Yes: Performs the procedure correctly. Make a further attempt.")
    // renaming a question changes the sentence, never the outcome (AE-06)
    const m = skill.model as Extract<NonNullable<typeof skill.model>, { kind: "question" }>
    const renamed = { ...skill, model: { ...m, questions: m.questions.map((q) => (q.id === "foley-q2" ? { ...q, text: "Performs the procedure safely" } : q)) } }
    expect(C.evaluationReasonText(r.evaluationReasons[0], C.ruleContext(db, renamed))).toContain("Performs the procedure safely")
  })

  const unit = (reason: C.EvalReason, text: string, model: Partial<(typeof db.skills)[number]> = {}) => {
    const skill = { ...db.skills.find((s) => s.id === "sk-iv")!, ...model }
    expect(C.evaluationReasonText(reason, C.ruleContext(db, skill))).toBe(text)
  }
  it("covers every rule type with the documented wording", () => {
    unit({ rule: "atLeast", needed: 3, have: 2, of: 4 }, "2 of 4 questions were answered Yes. At least 3 were needed.")
    unit({ rule: "average", needed: 3, have: 2.4 }, "The average score was 2.4. At least 3 was needed.")
    unit({ rule: "total", needed: 10, have: 7 }, "The total score was 7. At least 10 was needed.")
    unit({ rule: "binaryLabel", needed: "a", have: "b" }, "The outcome recorded was Unmet. The outcome needed is Met.", { model: { kind: "binary", labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } }, qualifyingLabelId: "a" } })
    unit({ rule: "allYes", needed: 3, have: 2, failedQuestionIds: ["x"] }, "1 question was answered No: x. Every question needed a Yes.")
  })

  it("skill-level reasons: criteria count, level and setting minimums, lab never counts toward a setting (SC-12)", () => {
    const c = C.ruleContext(db, db.skills.find((s) => s.id === "sk-wound")!)
    expect(C.skillReasonText({ rule: "requiredCount", needed: 5, have: 3 }, c)).toBe("You have 3 of 5 qualifying evaluations. 2 more needed.")
    expect(C.skillReasonText({ rule: "requiredCount", needed: 4, have: 4 }, c, "demonstrations")).toBe("You have 4 of 4 demonstrations.")
    expect(C.skillReasonText({ rule: "levelMinimum", levelId: "wound-l2", needed: 2, have: 1 }, c)).toBe('You need 2 at "Performed independently" and have 1. 1 more needed.')
    expect(C.skillReasonText({ rule: "settingMinimum", settingId: "set-emergency", needed: 1, have: 0, labEvidence: 0 }, c)).toBe("You need 1 in Emergency and have 0.")
    expect(C.skillReasonText({ rule: "settingMinimum", settingId: "set-emergency", needed: 1, have: 0, labEvidence: 2 }, c)).toContain("Lab or simulation evidence does not count toward Emergency. You need clinical evidence there.")
  })

  it("DEFECT-07 worked example: 4 of 4 demonstrations but not achieved, explained by the settings (resolved)", () => {
    const r = S.failedRule(db, SCENARIO.olivia, "sk-wound")!
    const c = C.ruleContext(db, db.skills.find((s) => s.id === "sk-wound")!)
    const text = r.skillReasons.map((u) => C.skillReasonText(u, c, "demonstrations"))
    expect(text).toEqual(["You need 1 in Inpatient and have 0.", "You need 1 in Emergency and have 0."])
    expect(text.join(" ")).not.toMatch(/failed/i)
  })

  it("waiting and returned lines name who it is with (SH-02)", () => {
    expect(C.waitingText(2, ["A. Whitfield, RN", "reviewer"])).toBe("2 submissions are waiting and do not count yet: A. Whitfield, RN and reviewer.")
    expect(C.returnedText(1)).toBe("1 submission was returned. Revise and resend it to count.")
  })
})

describe("explanations and structured text", () => {
  it("impossible filter combinations are explained by name (RP-09)", () => {
    const issue = S.filterIssue(db, { locationId: "loc-mercy", settingId: "set-emergency" })!
    expect(C.filterIssueText(issue, db)).toBe("No evidence can match this combination. Mercy Home Health does not offer Emergency. Choose a different setting or location.")
    expect(C.filterIssueText({ code: "labHasNoLocation", locationId: "loc-mercy" }, db)).toContain("Lab or simulation evidence has no location")
  })

  it("ST-08 blocked states name the skill and the constraint, and offer a way forward, never a dead end", () => {
    const o = S.computeSendOptions(db, { studentId: SCENARIO.priya, offeringId: "off-350-f26", skillIds: ["sk-o2"], performedIn: "clinical" })
    const t = C.sendBlockedText(o.blocked!, db, "clinical", (id) => db.skills.find((s) => s.id === id)!.name)
    expect(t.text).toBe("Oxygen Therapy Administration can only be signed off by Lab instructor, who cannot sign off clinical evidence. Choose Lab or simulation, or ask your program administrator.")
    expect(t.switchTo).toBe("lab")
  })

  it("criteria text is built from structure (S-04 column)", () => {
    const row = S.listSkills(db).find((r) => r.skill.id === "sk-wound")!
    expect(C.criteriaSummary(row.criteria)).toBe("4 demonstrations, 1 at Performed with supervision, 2 at Performed independently, 1 in Inpatient, 1 in Emergency")
    expect(C.criteriaSummary([])).toBe("No criteria set")
  })

  it("the lineage panel words the five steps and follows the display flag only in the last step (SC-17, OD-03)", () => {
    const skill = db.skills.find((s) => s.id === "sk-foley")!
    const parts = S.criteriaParts(db, skill)
    const four = C.lineageSteps(skill.model, skill.criteria, parts, "four")
    expect(four.map((s) => s.label)).toEqual(["Model", "Evidence per evaluation", "An evaluation qualifies when", "Achievement criteria", "Skill status"])
    expect(four[1].value).toBe("Yes or No for each question")
    expect(four[2].value).toBe("2 named questions are answered Yes")
    expect(four[3].value).toBe("3 qualifying evaluations")
    expect(four[4].value).toBe("No evidence yet, Evidence does not qualify, In progress, Achieved")
    expect(C.lineageSteps(skill.model, skill.criteria, parts, "merged")[4].value).toBe("Not met, In progress, Achieved")
    expect(C.lineageSteps(null, skill.criteria, [], "four")[0].value).toBe("Not chosen")
  })

  it("held vs counts-now wording is in the evaluator's and the student's words (EV-07)", () => {
    expect(C.heldOrCounts.beforeSubmit.held).toBe("This skill is held for administrator approval after you submit.")
    expect(C.heldOrCounts.afterSubmit.countsNow("IV Insertion")).toBe("IV Insertion: recorded. It counts toward the student's record now.")
    expect(C.heldOrCounts.student.held).toBe("Waiting for approval")
  })
})

describe("ST-13 confirmation names what was sent (e2e H1)", () => {
  it("lists one, two and three skills by name, then the evaluator, role, setting and location", () => {
    const where = "Clinical (Outpatient clinic) at Harbor Family Practice"
    expect(C.sendCopy.confirmation(["IV Insertion"], "A. Whitfield, RN", "Preceptor", where)).toBe("Sent IV Insertion to A. Whitfield, RN, Preceptor. Clinical (Outpatient clinic) at Harbor Family Practice.")
    expect(C.sendCopy.confirmation(["A", "B"], "X", "Preceptor", where)).toContain("Sent A and B to X")
    expect(C.sendCopy.confirmation(["A", "B", "C"], "X", "Preceptor", where)).toContain("Sent A, B and C to X")
  })
})

describe("voice-rule exception is explicit", () => {
  it("the prototype-verbatim modules are the only exception: they live in lib/copy/r<N>-*.ts and are not part of the voice walk", async () => {
    const fs = await import("node:fs")
    const path = await import("node:path")
    const dir = path.resolve(__dirname, "../../lib/copy")
    const exempt = fs.readdirSync(dir).filter((f) => /^r\d+-.*\.ts$/.test(f)).sort()
    expect(exempt.length).toBeGreaterThanOrEqual(5)
    // Every other copy module is clean of em-dashes at the source level (comments aside), so a new dash cannot hide elsewhere.
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts") && !exempt.includes(x))) {
      const code = fs.readFileSync(path.join(dir, f), "utf8").split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n")
      const strs = code.match(/"[^"\n]*"|`[^`\n]*`/g) ?? []
      for (const s of strs) expect(s, `${f}: ${s}`).not.toMatch(/[—–]/)
    }
  })
})
