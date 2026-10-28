import { describe, expect, it } from "vitest"
import { createV2Store } from "@/lib/v2/store"
import { createSeed } from "@/lib/v2/seed"
import { skillById } from "@/lib/v2/evidence-index"
import { isConfigured } from "@/lib/v2/population"
import { facts } from "@/lib/v2/facts"
import {
  configDraftOf,
  discardConfigDraft,
  emptyRule,
  fromV2,
  removeLevel,
  removeQuestion,
  saveConfigDraft,
  saveLabRule,
  setupSummary,
  checkGroups,
  openDecisions,
  saveBlockedReason,
  swapItems,
  validateRule,
  withModel,
  type LabRule,
} from "@/lib/lab/configure"
import { buildLibrary, countLibrary, draftToSkill, EMPTY_DRAFT, EMPTY_OVERLAY, nextToConfigure, parseSeveral, severalDrafts } from "@/lib/lab/library"
import { listsCarrying } from "@/lib/lab/lists"
import { selfEvalEnabled } from "@/lib/lab/student2"

/**
 * Decision D-X31 (Romit 2026-10-27: no publish stage; a skill is Not configured or Configured) and the requirement gaps the
 * coverage audit gave Configure (SC-05, SC-07, SC-13, SC-15, AE-07, IM-10, IM-14). Every setting is proved to survive a save and a
 * reload of the shared store, which is what the reviewer saw fail.
 */

const AT = "2026-10-27T09:00:00Z"
const BY = "u-admin"

/** An in-memory Storage, so "reload" is a second store reading what the first wrote. */
function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  }
}

function saveAndReload(skillId: string, rule: LabRule) {
  const storage = memoryStorage()
  const a = createV2Store({ storage, key: "t" })
  a.hydrate()
  a.update((s) => {
    const r = saveLabRule(s, skillId, rule, { at: AT, byId: BY, mode: null })
    if (!r.ok) throw new Error(r.error)
    return r.state
  })
  const b = createV2Store({ storage, key: "t" })
  b.hydrate()
  return b.getSnapshot()
}

const seed = createSeed()
const notConfigured = seed.skills.find((k) => !k.configured)!

/** A complete binary rule a reviewer could save. */
function binaryRule(): LabRule {
  return { ...withModel(emptyRule(), "binary"), qualifyingLabel: 0, need: 2, evaluatorRoles: ["preceptor"] }
}

describe("Save configuration (decision D-X31)", () => {
  it("makes the skill Configured, mappable and counted in the one shared figure", () => {
    const s = saveAndReload(notConfigured.id, binaryRule())
    const k = skillById(s, notConfigured.id)!
    expect(isConfigured(k)).toBe(true)
    expect(buildLibrary(s).find((r) => r.id === k.id)!.status).toBe("configured")
    expect(facts(s).skillsConfigured).toBe(facts(seed).skillsConfigured + 1)
    expect(countLibrary(buildLibrary(s)).notConfigured).toBe(countLibrary(buildLibrary(seed)).notConfigured - 1)
  })

  it("writes an audit line that never says published", () => {
    const s = saveAndReload(notConfigured.id, binaryRule())
    const last = s.audit[0]! // newest first
    expect(last.action).toMatch(/^Saved configuration, rule version \d+$/)
    expect(JSON.stringify(last)).not.toMatch(/publish/i)
  })

  it("refuses a configuration that cannot be satisfied [REQ SC-18]", () => {
    const r = saveLabRule(seed, notConfigured.id, { ...binaryRule(), need: Number.NaN }, { at: AT, byId: BY, mode: null })
    expect(r.ok).toBe(false)
  })
})

describe("Save draft keeps the status (decision D-X31, REQ SC-01, IM-10)", () => {
  it("keeps an incomplete configuration through reload, Not configured with Draft saved, never mappable", () => {
    const storage = memoryStorage()
    const a = createV2Store({ storage, key: "d" })
    a.hydrate()
    const partial: LabRule = { ...withModel(emptyRule(), "binary"), need: 3 }
    expect(validateRule(partial).length).toBeGreaterThan(0)
    a.update((s) => saveConfigDraft(s, notConfigured.id, partial, "rule", AT))
    const b = createV2Store({ storage, key: "d" })
    b.hydrate()
    const s = b.getSnapshot()
    const d = configDraftOf(s, notConfigured.id)!
    expect(d.step).toBe("rule")
    expect(d.rule.model).toBe("binary")
    expect(d.rule.need).toBe(3)
    const row = buildLibrary(s).find((r) => r.id === notConfigured.id)!
    expect(row.status).toBe("not-configured")
    expect(row.draft).toBe(true)
    expect(isConfigured(skillById(s, notConfigured.id)!)).toBe(false)
  })

  it("is cleared by Save configuration and by Discard draft", () => {
    const withDraft = saveConfigDraft(seed, notConfigured.id, binaryRule(), "check", AT)
    const r = saveLabRule(withDraft, notConfigured.id, binaryRule(), { at: AT, byId: BY, mode: null })
    expect(r.ok && r.written && configDraftOf(r.state, notConfigured.id)).toBe(null)
    expect(configDraftOf(discardConfigDraft(withDraft, notConfigured.id), notConfigured.id)).toBe(null)
  })

  it("Configure next is the first Not configured skill in library order, never the one just saved", () => {
    const rows = buildLibrary(seed)
    const first = rows.find((r) => r.status === "not-configured")!
    expect(nextToConfigure(rows, "x")!.id).toBe(first.id)
    expect(nextToConfigure(rows, first.id)!.id).not.toBe(first.id)
    expect(nextToConfigure(rows, first.id)!.status).toBe("not-configured")
  })
})

describe("settings survive save and reload", () => {
  it("SC-13: student fields, including a choice list and its choices, are kept", () => {
    const fields: LabRule["studentFields"] = [
      { label: "Date performed", type: "date", mandatory: true },
      { label: "Unit", type: "choice", mandatory: false, choices: ["ICU", "Med-surg", "ED"] },
      { label: "Case reference", type: "short", mandatory: true },
    ]
    const s = saveAndReload(notConfigured.id, { ...binaryRule(), studentFields: fields })
    expect(fromV2(skillById(s, notConfigured.id)!).studentFields).toEqual(fields)
  })

  it("SC-13: a choice list needs at least two choices", () => {
    const bad = { ...binaryRule(), studentFields: [{ label: "Unit", type: "choice" as const, mandatory: false, choices: ["ICU"] }] }
    expect(validateRule(bad).some((i) => i.id === "cfg-field-0:choices")).toBe(true)
  })

  it("SC-15: self-evaluation on is kept and drives the student flow", () => {
    const s = saveAndReload(notConfigured.id, { ...binaryRule(), selfEvaluation: true })
    const k = skillById(s, notConfigured.id)!
    expect(fromV2(k).selfEvaluation).toBe(true)
    expect(selfEvalEnabled(k)).toBe(true)
    const off = saveAndReload(notConfigured.id, { ...binaryRule(), selfEvaluation: false })
    expect(selfEvalEnabled(skillById(off, notConfigured.id)!)).toBe(false)
  })

  it("SC-15: saving a seeded skill unchanged does not change whether its students self-evaluate", () => {
    const k = seed.skills.find((x) => isConfigured(x) && x.model === "demonstration")!
    const before = selfEvalEnabled(k)
    const s = saveAndReload(k.id, fromV2(k))
    expect(selfEvalEnabled(skillById(s, k.id)!)).toBe(before)
  })

  it("SC-07: the scale top and its pass mark are kept", () => {
    const scored: LabRule = { ...withModel(emptyRule(), "scored"), questions: ["Prepares", "Performs"], scaleMax: 7, scoredRule: { kind: "average", value: 6 }, need: 1, evaluatorRoles: ["faculty"] }
    expect(validateRule(scored)).toEqual([])
    const back = fromV2(skillById(saveAndReload(notConfigured.id, scored), notConfigured.id)!)
    expect(back.scaleMax).toBe(7)
    expect(back.scoredRule).toEqual({ kind: "average", value: 6 })
    expect(validateRule(back)).toEqual([])
  })

  it("SC-05: a named-questions rule is kept with its questions", () => {
    const q: LabRule = { ...withModel(emptyRule(), "question"), questions: ["A", "B", "C"], questionRule: { kind: "subset", indices: [0, 2] }, need: 1, evaluatorRoles: ["preceptor"] }
    expect(fromV2(skillById(saveAndReload(notConfigured.id, q), notConfigured.id)!).questionRule).toEqual({ kind: "subset", indices: [0, 2] })
  })
})

describe("AE-07: removing or moving a question or level keeps every rule reference on its item", () => {
  it("removing a middle question drops it from the named set and moves later picks down", () => {
    const q: LabRule = { ...withModel(emptyRule(), "question"), questions: ["A", "B", "C", "D"], questionRule: { kind: "subset", indices: [1, 3] } }
    const r = removeQuestion(q, 1)
    expect(r.questions).toEqual(["A", "C", "D"])
    expect(r.questionRule).toEqual({ kind: "subset", indices: [2] })
    expect(r.questions[2]).toBe("D")
  })

  it("removing a middle level drops its minimum and moves later minimums down", () => {
    const d: LabRule = { ...withModel(emptyRule(), "demonstration"), levels: ["Observed", "Assisted", "Independent"], levelMinimums: [{ levelIndex: 1, min: 1 }, { levelIndex: 2, min: 2 }] }
    const r = removeLevel(d, 1)
    expect(r.levels).toEqual(["Observed", "Independent"])
    expect(r.levelMinimums).toEqual([{ levelIndex: 1, min: 2 }])
    expect(r.levels[r.levelMinimums[0]!.levelIndex]).toBe("Independent")
  })

  it("moving a level carries its minimum with it", () => {
    const d: LabRule = { ...withModel(emptyRule(), "demonstration"), levels: ["Observed", "Assisted", "Independent"], levelMinimums: [{ levelIndex: 2, min: 2 }] }
    const r = swapItems(d, "levels", 1, 2)
    expect(r.levels[r.levelMinimums[0]!.levelIndex]).toBe("Independent")
  })
})

describe("Check answers its four questions from the data", () => {
  it("summarises the setup in six groups, each pointing at the step its Edit opens", () => {
    const g = setupSummary(binaryRule())
    expect(g.map((x) => x.id)).toEqual(["model", "criteria", "rule", "student", "signers", "before", "checkoff"])
    expect(g.map((x) => x.step)).toEqual(["model", "outcomes", "rule", "signoff", "signoff", "signoff", "signoff"])
    expect(JSON.stringify(g)).not.toMatch(/publish/i)
  })

  it("Check groups by step as label and value pairs, marks what is missing, and carries what changed", () => {
    const empty = withModel(emptyRule(), "binary")
    const g = checkGroups(empty)
    expect(g.map((x) => x.step)).toEqual(["model", "outcomes", "rule", "signoff"])
    // Every row is a short pair, never a run-on sentence of several settings.
    for (const row of g.flatMap((x) => x.rows)) expect(row.label.split(" ").length).toBeLessThanOrEqual(4)
    const signoff = g.find((x) => x.step === "signoff")!.rows.map((r) => r.label)
    expect(signoff).toEqual(["Student adds", "Self-evaluation first", "Who signs", "Feedback required", "Approval before it counts", "Group check-off"])
    // A value still to choose is flagged, so the summary never reads a gap as an answer.
    expect(g.find((x) => x.step === "outcomes")!.rows.find((r) => r.label === "Counts when")).toMatchObject({ value: "Not chosen", missing: true })
    expect(g.find((x) => x.step === "rule")!.rows[0]).toMatchObject({ missing: true })
    const full = binaryRule()
    expect(checkGroups(full).flatMap((x) => x.rows).some((r) => r.missing)).toBe(false)
    const changed = { ...full, feedbackRequired: !full.feedbackRequired }
    const was = checkGroups(changed, full).flatMap((x) => x.rows).find((r) => r.label === "Feedback required")!
    expect(was.was).toBe(full.feedbackRequired ? "Yes" : "No")
    expect(JSON.stringify(checkGroups(changed, full))).not.toMatch(/publish/i)
  })

  it("Save on Check is blocked with its reason by a problem first, then by the unanswered evidence choice", () => {
    const issue = { id: "x", section: "rule" as const, field: "cfg-need", message: "Enter a number." }
    expect(saveBlockedReason([issue], true, null)).toBe("Fix 1 thing first.")
    expect(saveBlockedReason([], true, null)).toBe("Choose how evidence already held is treated.")
    expect(saveBlockedReason([], true, "reapply")).toBeUndefined()
    expect(saveBlockedReason([], false, null)).toBeUndefined()
    expect(openDecisions([issue, issue], true, null)).toBe(3)
    expect(openDecisions([], false, null)).toBe(0)
  })

  it("names the live lists that would carry a skill once configured (decision D-X27)", () => {
    const k = seed.skills.find((x) => x.hgtc && !isConfigured(x))
    if (!k) return
    const c = listsCarrying(seed, k.id)
    expect(c.length).toBeGreaterThan(0)
    expect(c.every((x) => x.list.status === "live")).toBe(true)
  })
})

describe("IM-14: applying one configuration to several writes each of them", () => {
  it("each target becomes Configured with its own rule version, and survives reload", () => {
    const ids = seed.skills.filter((k) => !k.configured).slice(0, 3).map((k) => k.id)
    const storage = memoryStorage()
    const a = createV2Store({ storage, key: "m" })
    a.hydrate()
    a.update((s) => ids.reduce((acc, id) => {
      const r = saveLabRule(acc, id, binaryRule(), { at: AT, byId: BY, mode: "reapply" })
      return r.ok && r.written ? r.state : acc
    }, s))
    const b = createV2Store({ storage, key: "m" })
    b.hydrate()
    const s = b.getSnapshot()
    for (const id of ids) {
      expect(isConfigured(skillById(s, id)!)).toBe(true)
      expect((s.ruleChanges ?? []).some((r) => r.skillId === id)).toBe(true)
    }
  })
})

describe("SL-02: every Add a skill path keeps an optional description", () => {
  it("the sheet and inline row draft carry it onto the skill and the library row", () => {
    const a = draftToSkill({ ...EMPTY_DRAFT, name: "Chest tube care", description: "  Set up, monitor and document a chest drain.  " }, "lab-desc-1")
    expect(a.description).toBe("Set up, monitor and document a chest drain.")
    const row = buildLibrary(seed, { ...EMPTY_OVERLAY, added: [a] }).find((r) => r.id === "lab-desc-1")!
    expect(row.description).toBe("Set up, monitor and document a chest drain.")
    expect(draftToSkill({ ...EMPTY_DRAFT, name: "No description" }, "x").description).toBeUndefined()
  })
  it("add several reads a fourth Description column from a pasted sheet", () => {
    const p = parseSeveral("Chest tube care\tSafety\tInvasive\tSet up and monitor a chest drain", [])
    expect(p.items[0]).toMatchObject({ name: "Chest tube care", category: "Safety", tags: ["Invasive"], description: "Set up and monitor a chest drain" })
    expect(severalDrafts(p.items, { category: "", tags: [] })[0]!.description).toBe("Set up and monitor a chest drain")
  })
})
