import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { attempts, buildStudent } from "@/lib/lab/student"
import { COMBINE_NOTES_LABEL, conflictChoices, pickRows, pickerGroups } from "@/lib/lab/student2"
import { labSavedLine, type LabSavedResult, type LabSkillRow } from "@/lib/lab/evaluator"
import { attemptCourses } from "@/components/lab/student/skill-detail"

const seed = createSeed()
const maya = buildStudent(seed)!

describe("Wave 3 student and evaluator gaps", () => {
  it("ST-03: the picker isolates the skills the student has sent before, and only those", () => {
    const rows = pickRows(seed, maya)
    const sent = new Set([
      ...seed.evaluations.filter((e) => e.studentId === maya.student.id).map((e) => e.skillId),
      ...seed.submissions.filter((x) => x.studentId === maya.student.id).flatMap((x) => x.skillIds),
    ])
    const flagged = rows.filter((r) => r.submitted)
    expect(flagged.length).toBeGreaterThan(0)
    expect(flagged.length).toBeLessThan(rows.length)
    for (const r of rows) expect(r.submitted).toBe(sent.has(r.id))
    const only = pickerGroups(rows, "", true).flatMap((g) => g.rows)
    expect(new Set(only.map((r) => r.id))).toEqual(new Set(flagged.map((r) => r.id)))
    // A search inside the isolated set still works, and the full list is unchanged without the switch.
    const one = flagged[0]
    expect(pickerGroups(rows, one.name, true).flatMap((g) => g.rows).some((r) => r.id === one.id)).toBe(true)
    expect(pickerGroups(rows).flatMap((g) => g.rows).length).toBe(rows.length)
  })

  it("SH-06: every attempt names its course, and the course list adds up to the attempts", () => {
    const skill = maya.all.find((r) => attempts(seed, maya.student.id, r.id).length >= 2)!
    const rows = attempts(seed, maya.student.id, skill.id)
    for (const r of rows) {
      expect(r.courseId).toBeTruthy()
      expect(r.courseCode).toBeTruthy()
    }
    const courses = attemptCourses(rows)
    expect(courses.reduce((n, c) => n + c.n, 0)).toBe(rows.length)
    for (const c of courses) expect(rows.filter((r) => r.courseId === c.id).length).toBe(c.n)
  })

  it("EV-07: the lab session receipt says whether results count now or wait for approval", () => {
    const skills: LabSkillRow[] = [
      { id: "a", name: "Hand hygiene", blocked: null, feedbackRequired: false, holds: false },
      { id: "b", name: "Sterile gloving", blocked: null, feedbackRequired: false, holds: true },
    ]
    const r = (skillId: string): LabSavedResult => ({ studentId: "s", skillId, outcome: "met", feedback: "" })
    expect(labSavedLine([r("a"), r("a")], skills)).toBe("They count now.")
    expect(labSavedLine([r("b")], skills)).toBe("It waits for program approval.")
    expect(labSavedLine([r("a"), r("a"), r("b")], skills)).toBe("2 results count now; 1 result for Sterile gloving waits for program approval.")
  })

  it("ST-12: a note conflict combines into the one note, it never offers two notes", () => {
    const note = conflictChoices({ field: "note", mine: "a", theirs: "b", theirsAt: "", theirsBy: "Your other device" })
    expect(note.find((c) => c.id === "both")?.label).toBe(COMBINE_NOTES_LABEL)
    expect(note.some((c) => /both/i.test(c.label))).toBe(false)
  })
})
