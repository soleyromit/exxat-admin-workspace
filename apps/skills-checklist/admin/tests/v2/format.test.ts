import { describe, expect, it } from "vitest"
import { ageLabel, fmt, initialsOf, longDate, pctOf, plural, shortDate } from "@/lib/v2/format"
import { OUTCOME_LABEL, RECORD_STATE_META } from "@/lib/v2/labels"
import { RECORD_STATE_LABEL } from "@/lib/lab/dashboard"
import { OUTCOME_WORD, shortDate as studentShortDate } from "@/lib/lab/student"
import { ATTENTION_LABEL } from "@/lib/lab/reviewer"

describe("one format and one wording", () => {
  it("formats numbers, shares, dates and initials one way", () => {
    expect(fmt(1547)).toBe("1,547")
    expect(plural(1, "student", "students")).toBe("1 student")
    expect(plural(28, "student", "students")).toBe("28 students")
    expect(pctOf(760, 1547)).toBe(49)
    expect(pctOf(1, 0)).toBe(0)
    expect(shortDate("2026-10-26T09:00:00Z")).toBe("Oct 26")
    expect(shortDate("2025-10-26")).toBe("Oct 26, 2025")
    expect(longDate("2026-10-26")).toBe("Oct 26, 2026")
    expect(ageLabel(0)).toBe("today")
    expect(initialsOf("Maya Ferreira")).toBe("MF")
    expect(initialsOf("Dr. K. Brennan")).toBe("KB")
  })

  it("initials skip credentials and titles (evaluator display names)", () => {
    expect(initialsOf("S. Okonkwo, RN")).toBe("SO")
    expect(initialsOf("J. Delgado, RN")).toBe("JD")
    expect(initialsOf("Courtney Norwood, MSN, RN")).toBe("CN")
    expect(initialsOf("Jon Delgado RN")).toBe("JD")
    expect(initialsOf("Dr. Ana Castillo, DNP, CCRN")).toBe("AC")
    expect(initialsOf("Dr Priya Raman")).toBe("PR")
    expect(initialsOf("Tom Aldridge, LPN")).toBe("TA")
    expect(initialsOf("Amara Nwosu-Bell, BSN")).toBe("AN")
    expect(initialsOf("Maya")).toBe("M")
    expect(initialsOf("")).toBe("?")
  })

  it("the lab libraries read the shared maps", () => {
    expect(studentShortDate("2026-10-12")).toBe(shortDate("2026-10-12"))
    expect(OUTCOME_WORD).toEqual(OUTCOME_LABEL)
    for (const k of Object.keys(RECORD_STATE_META) as Array<keyof typeof RECORD_STATE_META>) expect(RECORD_STATE_LABEL[k]).toBe(RECORD_STATE_META[k].label)
    expect(ATTENTION_LABEL.approval).toBe("Awaiting approval")
  })
})
