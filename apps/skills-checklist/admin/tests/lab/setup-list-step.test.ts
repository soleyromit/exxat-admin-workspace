import { describe, expect, it } from "vitest"
import {
  addSkillsToStore,
  draftToSkill,
  duplicateGroups,
  EMPTY_DRAFT,
  notReadReason,
  parseSeveral,
  pasteSummary,
  possibleDuplicates,
  removeSkillsFromStore,
  restoreSkillsToStore,
  setSkillDetailsInStore,
  validateDraft,
} from "@/lib/lab/library"
import { newProgramSeed } from "@/lib/lab/new-program"
import { parseProgress, serializeProgress } from "@/lib/lab/setup-wizard"
import { checkLine } from "@/components/lab/setup/skills-list-step"

// Set up skills step 1, list variant (D-L46): paste parsing, duplicates, and Undo on the new program's store.

describe("paste parsing", () => {
  it("strips the quotation marks a spreadsheet adds, and leaves a one character name in the box with a reason", () => {
    const p = parseSeveral('"Foley care"\tx\n"Say ""hi"" nicely"\n\u201cCurly name\u201d\nx', [])
    expect(p.ready).toEqual(["Foley care", 'Say "hi" nicely', "Curly name"])
    const left = p.lines.filter((l) => l.kind === "not-read")
    expect(left.map((l) => l.raw)).toEqual(["x"])
    expect(notReadReason(left[0]!)).toBe("only one character")
  })

  it("reads a line that starts with a tab (it used to be dropped without a word)", () => {
    const p = parseSeveral("Assessment\n\tVital signs\n\t\tPain assessment", [])
    expect(p.lines.map((l) => [l.name, l.kind])).toEqual([["Assessment", "ready"], ["Vital signs", "ready"], ["Pain assessment", "ready"]])
  })

  it("reads the first cell after indentation; other cells are reported, not read [REQ IM-03]", () => {
    const p = parseSeveral("\tIV insertion\tProcedures\tAdult; Core", [])
    expect(p.items).toEqual([{ name: "IV insertion" }])
    expect(p.lines[0]!.extra).toEqual(["Procedures", "Adult; Core"])
  })

  it("strips bullets and numbering, trims spaces, ignores blank lines", () => {
    const p = parseSeveral("• Hand hygiene\n\n   \n1. Vital  signs  \n- Wound care\n(3) Oxygen therapy", [])
    expect(p.lines.map((l) => l.name)).toEqual(["Hand hygiene", "Vital signs", "Wound care", "Oxygen therapy"])
    expect(p.lines.every((l) => l.kind === "ready")).toBe(true)
  })

  it("keeps a heading first line and a line of only digits out, with a reason", () => {
    const p = parseSeveral("Skill name\tCategory\nHand hygiene\n42\n(7)\nSkills", [])
    expect(p.ready).toEqual(["Hand hygiene", "Skills"])
    expect(p.lines.filter((l) => l.kind === "not-read").map((l) => notReadReason(l))).toEqual(["looks like a column heading", "only a number", "only a number"])
    expect(parseSeveral("Name:\nHand hygiene", []).ready).toEqual(["Hand hygiene"])
    expect(parseSeveral("Hand hygiene 2\nName", []).ready).toEqual(["Hand hygiene 2", "Name"])
  })
  it("lists a line it cannot read with its original text, never drops it silently", () => {
    const long = "x".repeat(130)
    const p = parseSeveral(`Hand hygiene\n---\n- \n${long}`, [])
    const notRead = p.lines.filter((l) => l.kind === "not-read" || l.kind === "too-long")
    expect(notRead.map((l) => l.raw)).toEqual(["---", "- ", long])
    expect(p.ready).toEqual(["Hand hygiene"])
  })

  it("flags repeats in the paste and against the list (exact, case and spaces ignored)", () => {
    const p = parseSeveral("Vital signs\nvital  SIGNS\nHand hygiene\nIV insertion", ["Hand Hygiene"])
    expect(p.lines.map((l) => l.kind)).toEqual(["ready", "in-paste", "in-library", "ready"])
  })

  it("does not treat near matches as duplicates", () => {
    const p = parseSeveral("IV insertion\nIV catheter insertion", [])
    expect(p.lines.every((l) => l.kind === "ready")).toBe(true)
  })

  it("summarises a paste in one line and adds every line it read", () => {
    const s = pasteSummary("Aa\nBb\nbb\nCc\n***\n", ["cc"])
    expect([s.fresh, s.repeated, s.notRead.length]).toEqual([2, 2, 1])
    expect(s.toAdd.map((i) => i.name)).toEqual(["Aa", "Bb", "bb", "Cc"])
    expect(checkLine(s.fresh, s.repeated, s.notRead.length)).toBe("2 new · 2 repeated · 1 not read")
    expect(checkLine(148, 0, 0)).toBe("148 new")
  })
})

describe("duplicate wording", () => {
  it("says list inside the wizard and library on the hub", () => {
    const d = { ...EMPTY_DRAFT, name: "hand hygiene" }
    expect(validateDraft(d, ["Hand hygiene"], "list").name).toBe("Hand hygiene is already in the list.")
    expect(validateDraft(d, ["Hand hygiene"]).name).toBe("Hand hygiene is already in the library.")
  })
})

describe("possible duplicates", () => {
  const rows = [
    { id: "1", name: "Vital signs" },
    { id: "2", name: "Hand hygiene" },
    { id: "3", name: "vital  signs" },
    { id: "4", name: "Vital Signs" },
  ]
  it("groups exact matches and flags every copy after the first", () => {
    expect(duplicateGroups(rows)).toEqual([["1", "3", "4"]])
    expect([...possibleDuplicates(rows)]).toEqual(["3", "4"])
  })
  it("drops the flag on a row the program chose to keep", () => {
    expect([...possibleDuplicates(rows, ["3"])]).toEqual(["4"])
  })
})

describe("remove and undo on the new program's store", () => {
  const at = "2026-11-04T10:00:00.000Z"
  const seed = () => addSkillsToStore(newProgramSeed(), ["Hand hygiene", "Vital signs", "Wound care", "Oxygen therapy"].map((name, i) => draftToSkill({ ...EMPTY_DRAFT, name, tags: i === 1 ? ["Core"] : [] }, `k${i}`)), "actor", at)

  it("removes several and puts them back at their places with their details", () => {
    const s0 = setSkillDetailsInStore(seed(), ["k1"], { category: "Assessment" }, "actor", at)
    const { state, removal } = removeSkillsFromStore(s0, ["k1", "k3"], "actor", at)
    expect(state.skills.map((k) => k.id)).toEqual(["k0", "k2"])
    const back = restoreSkillsToStore(state, removal, "actor", at)
    expect(back.skills.map((k) => k.id)).toEqual(["k0", "k1", "k2", "k3"])
    const k1 = back.skills.find((k) => k.id === "k1")!
    expect([k1.name, k1.category, k1.tags]).toEqual(["Vital signs", "Assessment", ["Core"]])
  })

  it("undo is idempotent: a second undo adds nothing twice", () => {
    const { state, removal } = removeSkillsFromStore(seed(), ["k0"], "actor", at)
    const once = restoreSkillsToStore(state, removal, "actor", at)
    expect(restoreSkillsToStore(once, removal, "actor", at).skills.length).toBe(4)
  })

  it("edits in place write the store; an empty name is refused", () => {
    const s = setSkillDetailsInStore(seed(), ["k0"], { name: "  Hand   washing ", tags: ["Safety", "safety"] }, "actor", at)
    const k0 = s.skills.find((k) => k.id === "k0")!
    expect([k0.name, k0.tags]).toEqual(["Hand washing", ["Safety"]])
    expect(setSkillDetailsInStore(s, ["k0"], { name: "   " }, "actor", at)).toBe(s)
    expect(setSkillDetailsInStore(s, ["k0"], { category: "" }, "actor", at).skills.find((k) => k.id === "k0")!.category).toBe("No category")
  })
})

describe("setup progress remembers the design", () => {
  it("keeps the variant so Continue setup reopens it", () => {
    expect(parseProgress(serializeProgress({ current: 0, skipped: [], variant: "D" })).variant).toBe("D")
    expect(parseProgress(JSON.stringify({ current: 0, skipped: [], variant: "../x" })).variant).toBeUndefined()
  })
})
