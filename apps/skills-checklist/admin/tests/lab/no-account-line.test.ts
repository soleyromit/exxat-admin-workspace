import { describe, expect, it } from "vitest"
import { nextSentence, noAccountLine } from "@/lib/lab/student2"

// Romit 2026-11-02: only preceptors (and a new name with no Prism account) sign through a link; clinical faculty and lab
// instructors have a Prism login, so the compose screen says nothing about accounts for them.
describe("no-account line on Send for evaluation", () => {
  it("names a link signer and says nothing for a signer with a Prism login", () => {
    expect(noAccountLine(true, "J. Delgado")).toBe("J. Delgado signs through a link, no account needed.")
    expect(noAccountLine(false, "Dr. Patel")).toBe("")
  })
})

describe("no-account line, unnamed new evaluator", () => {
  it("starts the sentence with a capital", () => {
    expect(noAccountLine(true, "your evaluator")).toBe("Your evaluator signs through a link, no account needed.")
  })
})

describe("what happens next, by signer (Romit 2026-11-02)", () => {
  const base = { approval: false, offline: false, newName: false }
  it("says no account needed only for a link signer", () => {
    expect(nextSentence({ ...base, method: "qr", who: "J. Delgado, RN", signsByLink: true })).toBe("J. Delgado, RN scans the code and signs, no account needed.")
    expect(nextSentence({ ...base, method: "qr", who: "Dr. Patel", signsByLink: false })).toBe("Dr. Patel scans the code and signs.")
    expect(nextSentence({ ...base, method: "handover", who: "Dr. Patel" })).toBe("Dr. Patel signs on this device.")
    expect(nextSentence({ ...base, method: "handover", who: "Sam Lee", newName: true, signsByLink: true })).toBe("Sam Lee signs on this device, no account needed. Your program records their name first.")
  })
  it("drops credentials from the no-account line only", () => {
    expect(noAccountLine(true, "J. Delgado, RN")).toBe("J. Delgado signs through a link, no account needed.")
  })
})
