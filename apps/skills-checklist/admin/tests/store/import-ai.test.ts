import { describe, expect, it } from "vitest"
import { confirmImport, proposeImport, proposeImportInterpreted } from "@/lib/store"
import type { InterpretationResult } from "@/lib/import-ai/types"
import { ctx, must, seed } from "./helpers"

// SYNTHETIC interpretation results (hand-authored) fed to the same store action the dialog calls.
const result = (over: Partial<InterpretationResult> = {}): InterpretationResult => ({
  rows: [
    { name: "Suction", description: "Clear the airway", categoryName: "Respiratory", sourceRef: "Suction - Clear the airway", line: 2, origin: "model" },
    { name: "Oxygen therapy", description: "", categoryName: "Respiratory", sourceRef: "Oxygen therapy", line: 3, origin: "model", cue: { reasons: ["lowSkillConfidence"] } },
  ],
  unread: [{ text: "Page 3 of 12", reason: "uncertain", location: "Line 4" }],
  meta: { mode: "ai", model: "jev-1.13.0", candidatesAsked: 2, requests: 1, inputTokens: 600 },
  ...over,
})
const input = (interpreted: InterpretationResult) => ({ text: "Suction\nOxygen therapy\nPage 3 of 12", sourceName: "pasted list", sourceKind: "paste" as const, interpreted })

describe("IM-05, IM-13: the AI reading only fills the same draft; nothing is created until Confirm", () => {
  it("IM-05: proposeImportInterpreted opens a batch in review with cues, origin and meta, and creates NOTHING", () => {
    const db = seed()
    const skills = db.skills.length
    const { db: next, value } = must(proposeImportInterpreted(db, input(result()), ctx))
    expect(next.skills).toHaveLength(skills)
    const b = next.importBatches.find((x) => x.id === value.batchId)!
    expect(b.status).toBe("review")
    expect(b.interpretation).toMatchObject({ mode: "ai", model: "jev-1.13.0" })
    expect(b.rows.map((r) => [r.name, r.origin, r.include])).toEqual([["Suction", "model", true], ["Oxygen therapy", "model", true]])
    expect(b.rows[1].cue).toEqual({ reasons: ["lowSkillConfidence"] })
    expect(b.unread[0]).toMatchObject({ text: "Page 3 of 12", reason: "uncertain", location: "Line 4" })
  })

  it("IM-06: duplicates against the library are computed in the browser (no library data leaves it); a cue never changes include", () => {
    const db = seed()
    const existing = db.skills[0]
    const r = result({ rows: [{ name: existing.name, description: "", categoryName: null, sourceRef: existing.name, line: 1, origin: "model", cue: { reasons: ["maybeDetail"] } }] })
    const { db: next, value } = must(proposeImportInterpreted(db, input(r), ctx))
    const row = next.importBatches.find((x) => x.id === value.batchId)!.rows[0]
    expect(row.match.status).toBe("duplicate")
    expect(row.duplicateChoice).toBe("skip")
    expect(row.include).toBe(true)
  })

  it("a repeated name inside the source starts excluded, as with the standard reader", () => {
    const row = { name: "Suction", description: "", categoryName: null, sourceRef: "Suction", line: 1, origin: "model" as const }
    const { db, value } = must(proposeImportInterpreted(seed(), input(result({ rows: [row, { ...row, line: 2 }] })), ctx))
    expect(db.importBatches.find((b) => b.id === value.batchId)!.rows.map((r) => r.include)).toEqual([true, false])
  })

  it("IM-09, IM-13: Confirm still creates skills UNCONFIGURED, tied to the batch, exactly as before", () => {
    const { db, value } = must(proposeImportInterpreted(seed(), input(result()), ctx))
    const done = must(confirmImport(db, value.batchId, ctx))
    expect(done.value.created).toBe(2)
    const created = done.db.skills.filter((s) => s.importBatchId === value.batchId)
    expect(created.map((s) => s.model)).toEqual([null, null])
  })

  it("the AI fallback is a normal draft from the standard reader, stamped ai-fallback with the reason", () => {
    const { db, value } = must(proposeImport(seed(), { text: "Suction\nOxygen therapy", sourceName: "pasted list", sourceKind: "paste", interpretation: { mode: "ai-fallback", fallbackReason: "timeout" } }, ctx))
    const b = db.importBatches.find((x) => x.id === value.batchId)!
    expect(b.interpretation).toEqual({ mode: "ai-fallback", fallbackReason: "timeout" })
    expect(b.rows.map((r) => r.name)).toEqual(["Suction", "Oxygen therapy"])
    expect(b.rows.every((r) => r.cue === undefined && r.origin === undefined)).toBe(true)
  })

  it("the standard reader is unchanged: no interpretation meta, same rows as before", () => {
    const { db, value } = must(proposeImport(seed(), { text: "-----\nSuction", sourceName: "pasted list", sourceKind: "paste" }, ctx))
    const b = db.importBatches.find((x) => x.id === value.batchId)!
    expect(b.interpretation).toBeUndefined()
    expect(b.unread[0]).toMatchObject({ text: "-----", reason: "unrecognised" })
  })
})
