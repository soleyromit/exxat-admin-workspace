/**
 * One tone map and one vocabulary policy for every persona (design review 2026-10-30 CP-1, CP-2; lib/v2/labels.ts).
 */
import { describe, expect, it } from "vitest"
import { OUTCOME_LABEL, OUTCOME_TONE, RECORD_STATE_META, STUDENT_NOT_COUNTED, VERIFY_STATUS_TONE, answeredSentence, rowHeaderLabels, statusTone } from "@/lib/v2/labels"

describe("CP-1 tone map", () => {
  it("negative and attention words are amber, counted and ready words are neutral", () => {
    for (const w of ["Unmet", "Not yet", "Did not count", "Changed since verified", "Evidence does not qualify"]) expect(statusTone(w)).toBe("warning")
    for (const w of ["Counted", "Achieved", "Ready", "Met", "In progress", "Awaiting approval", "Verified"]) expect(statusTone(w)).toBe("neutral")
  })
  it("the keyed maps agree with the word map", () => {
    for (const k of Object.keys(OUTCOME_LABEL) as (keyof typeof OUTCOME_LABEL)[]) expect(OUTCOME_TONE[k]).toBe(statusTone(OUTCOME_LABEL[k]))
    expect(VERIFY_STATUS_TONE.changed).toBe(statusTone("Changed since verified"))
    expect(VERIFY_STATUS_TONE.ready).toBe("neutral")
    expect(RECORD_STATE_META.unqualified.tone).toBe(statusTone(RECORD_STATE_META.unqualified.label))
    expect(RECORD_STATE_META.achieved.tone).toBe("neutral")
  })
})

describe("CP-2 vocabulary policy", () => {
  it("'Did not count' leads; engine words leave the row header", () => {
    expect(rowHeaderLabels([STUDENT_NOT_COUNTED, "Unmet", "Evidence does not qualify", null])).toEqual([STUDENT_NOT_COUNTED])
    expect(rowHeaderLabels(["Counted", "Met"])).toEqual(["Counted", "Met"])
    expect(rowHeaderLabels(["Did not count", "Did not count"])).toEqual(["Did not count"])
  })
  it("the engine word goes inside the explanation, lowercase mid-sentence", () => {
    expect(answeredSentence("Unmet")).toBe("The evaluator answered unmet.")
    expect(answeredSentence("Not yet")).toBe("The evaluator answered not yet.")
  })
})
