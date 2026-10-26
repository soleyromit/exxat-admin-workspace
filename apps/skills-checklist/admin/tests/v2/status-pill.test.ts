import { describe, expect, it } from "vitest"
import { PILL_KINDS, pillSpec, skillPillValue, type PillKind } from "@/lib/v2/status-pill"

describe("status pill table", () => {
  const kinds = Object.keys(PILL_KINDS) as PillKind[]

  it("covers every v2 state family", () => {
    expect(kinds.sort()).toEqual(["agreement", "attempt", "cell", "eligibility", "outcome", "plan", "practice", "queue", "skill", "skill-progress", "sync", "verify"])
  })

  it("every value has a word, an icon and a tone that is never danger", () => {
    for (const kind of kinds) {
      for (const [value, spec] of Object.entries(PILL_KINDS[kind] as Record<string, { label: string; tone: string; icon: string }>)) {
        expect(spec.label.trim(), `${kind}.${value} label`).not.toBe("")
        expect(spec.icon, `${kind}.${value} icon`).toMatch(/^fa-[a-z0-9-]+$/)
        expect(["success", "info", "warning", "neutral"], `${kind}.${value} tone`).toContain(spec.tone)
        expect(spec.label, `${kind}.${value} no em dash`).not.toMatch(/—/)
      }
    }
  })

  it("no two values of one kind share a word", () => {
    for (const kind of kinds) {
      const labels = Object.values(PILL_KINDS[kind] as Record<string, { label: string }>).map((v) => v.label)
      expect(new Set(labels).size, kind).toBe(labels.length)
    }
  })

  it("outcome, record and queue triples follow the tone table", () => {
    expect(pillSpec("outcome", "met")).toMatchObject({ tone: "success", icon: "fa-circle-check" })
    expect(pillSpec("outcome", "not-met")).toMatchObject({ tone: "warning", icon: "fa-triangle-exclamation" })
    expect(pillSpec("verify", "changed")).toMatchObject({ tone: "warning" })
    expect(pillSpec("queue", "blocked")).toMatchObject({ tone: "warning" })
    expect(pillSpec("verify", "not-verified")).toMatchObject({ tone: "neutral" })
  })

  it("eligibility and the clinical lock keep their words", () => {
    expect(pillSpec("eligibility", "qualifies").label).toBe("Qualifies")
    expect(pillSpec("eligibility", "does-not-qualify").label).toBe("Does not qualify")
    expect(pillSpec("practice", "clinical-locked").label).toBe("Locked for clinical, practice is open")
  })

  it("keeps today's skill status words", () => {
    expect(pillSpec("skill", skillPillValue({ published: true, configured: true })).label).toBe("In use")
    expect(pillSpec("skill", skillPillValue({ published: false, configured: true })).label).toBe("Configured, not in use")
    expect(pillSpec("skill", skillPillValue({ published: false, configured: false })).label).toBe("Not configured")
  })
})
