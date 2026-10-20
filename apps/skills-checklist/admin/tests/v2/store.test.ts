import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { createV2Store, isV2State, STORAGE_KEY, toggleStepReviewed } from "@/lib/v2/store"
import { COUNTER_BY_ID } from "@/lib/v2/selectors"

function mem(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    key: (i) => Array.from(m.keys())[i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
  }
}

const AT = "2026-10-19T10:00:00Z"

describe("seed", () => {
  it("is deterministic and a fresh object graph every call", () => {
    const a = createSeed()
    const b = createSeed()
    expect(a).toEqual(b)
    expect(a).not.toBe(b)
    expect(a.skills).not.toBe(b.skills)
  })

  it("covers the scenario scale", () => {
    const s = createSeed()
    expect(s.skills.length).toBeGreaterThanOrEqual(28)
    expect(new Set(s.skills.map((k) => k.specialty))).toEqual(new Set(["bsn-med-surg", "radiography", "surgical-tech", "paramedic"]))
    expect(s.people.filter((p) => p.kind === "student")).toHaveLength(12)
    expect(s.remediations.filter((r) => r.status === "in-progress")).toHaveLength(1)
    expect(s.submissions.filter((x) => x.status === "stalled")).toHaveLength(1)
    expect(new Set(s.syncQueue.map((x) => x.state))).toEqual(new Set(["queued", "synced", "conflict"]))
    expect(s.evaluations.some((e) => e.versions.length > 1)).toBe(true)
  })

  it("names IV catheter levels from the program, not a fixed scale", () => {
    const iv = createSeed().skills.find((k) => k.id === "sk-iv-cath")!
    expect(iv.config?.levels.length).toBeGreaterThan(1)
    expect(iv.config?.levels.join(" ")).not.toMatch(/Observed|Assisted|Independent/)
    expect(iv.config?.achievement).toEqual({ kind: "last-n", need: 4, window: 5 })
  })

  it("keeps every evaluation's latest outcome equal to its latest version", () => {
    for (const e of createSeed().evaluations) {
      expect(e.versions[e.versions.length - 1].outcome).toBe(e.outcome)
      expect(e.versions[e.versions.length - 1].version).toBe(e.currentVersion)
    }
  })

  it("references only people, skills and evaluations that exist", () => {
    const s = createSeed()
    const people = new Set(s.people.map((p) => p.id))
    const skills = new Set(s.skills.map((k) => k.id))
    const evals = new Set(s.evaluations.map((e) => e.id))
    for (const e of s.evaluations) {
      expect(people.has(e.studentId) && people.has(e.evaluatorId) && skills.has(e.skillId), e.id).toBe(true)
    }
    for (const m of s.mappings) expect(skills.has(m.skillId), m.skillId).toBe(true)
    for (const c of s.concerns) expect(evals.has(c.evaluationId), c.id).toBe(true)
    for (const r of s.remediations) expect(skills.has(r.skillId) && people.has(r.studentId), r.id).toBe(true)
    for (const x of s.submissions) expect(x.skillIds.every((k) => skills.has(k)), x.id).toBe(true)
  })
})

describe("reset", () => {
  it("restores exactly the seed and clears reviewed steps", () => {
    const store = createV2Store({ storage: mem() })
    store.update((s) => toggleStepReviewed(s, "reports", "Read cohort reports", "adm-ross", AT))
    expect(Object.keys(store.getSnapshot().stepsReviewed)).toHaveLength(1)
    expect(COUNTER_BY_ID.audit.value(store.getSnapshot())).toBe(createSeed().audit.length + 1)
    store.reset()
    expect(store.getSnapshot()).toEqual(createSeed())
  })

  it("notifies subscribers and stops after unsubscribe", () => {
    const store = createV2Store({ storage: mem() })
    let calls = 0
    const off = store.subscribe(() => calls++)
    store.reset()
    expect(calls).toBe(1)
    off()
    store.reset()
    expect(calls).toBe(1)
  })

  it("overwrites persisted changes so a reload also sees the seed", () => {
    const storage = mem()
    const a = createV2Store({ storage })
    a.update((s) => toggleStepReviewed(s, "reports", "t", "adm-ross", AT))
    a.reset()
    const b = createV2Store({ storage })
    b.hydrate()
    expect(b.getSnapshot()).toEqual(createSeed())
  })
})

describe("persistence round trip", () => {
  it("writes on update and restores in a new store after hydrate", () => {
    const storage = mem()
    const a = createV2Store({ storage })
    a.update((s) => toggleStepReviewed(s, "reports", "Read cohort reports", "adm-ross", AT))
    expect(storage.getItem(STORAGE_KEY)).toBeTruthy()

    const b = createV2Store({ storage })
    // Before hydrate the client renders the seed so markup matches the server.
    expect(b.getSnapshot()).toEqual(createSeed())
    expect(b.isHydrated()).toBe(false)
    b.hydrate()
    expect(b.isHydrated()).toBe(true)
    expect(b.getSnapshot()).toEqual(a.getSnapshot())
    expect(b.getSnapshot().stepsReviewed.reports).toBe(AT)
  })

  it("falls back to the seed on corrupt JSON, wrong version or wrong shape", () => {
    for (const raw of ["{not json", JSON.stringify({ v: 99, state: createSeed() }), JSON.stringify({ v: 1, state: { schema: 1 } })]) {
      const storage = mem()
      storage.setItem(STORAGE_KEY, raw)
      const s = createV2Store({ storage })
      s.hydrate()
      expect(s.getSnapshot()).toEqual(createSeed())
    }
  })

  it("keeps working in memory when storage throws or is missing", () => {
    const hostile = {
      ...mem(),
      getItem: () => {
        throw new Error("blocked")
      },
      setItem: () => {
        throw new Error("quota")
      },
    } as unknown as Storage
    for (const storage of [hostile, null]) {
      const s = createV2Store({ storage })
      expect(() => s.hydrate()).not.toThrow()
      expect(() => s.update((x) => toggleStepReviewed(x, "reports", "t", "adm-ross", AT))).not.toThrow()
      expect(Object.keys(s.getSnapshot().stepsReviewed)).toHaveLength(1)
    }
  })

  it("reload picks up another tab's write", () => {
    const storage = mem()
    const tabA = createV2Store({ storage })
    const tabB = createV2Store({ storage })
    tabB.hydrate()
    tabA.update((s) => toggleStepReviewed(s, "reports", "t", "adm-ross", AT))
    tabB.reload()
    expect(tabB.getSnapshot().stepsReviewed.reports).toBeDefined()
  })

  it("isV2State rejects partial objects", () => {
    expect(isV2State(createSeed())).toBe(true)
    expect(isV2State(null)).toBe(false)
    expect(isV2State({ ...createSeed(), skills: null })).toBe(false)
  })
})

describe("transitions are pure", () => {
  it("does not mutate the previous state", () => {
    const before = createSeed()
    const snapshot = JSON.stringify(before)
    toggleStepReviewed(before, "reports", "t", "adm-ross", AT)
    expect(JSON.stringify(before)).toBe(snapshot)
  })

  it("toggling twice returns to no reviewed steps and logs both actions", () => {
    const s0 = createSeed()
    const s1 = toggleStepReviewed(s0, "reports", "t", "adm-ross", AT)
    const s2 = toggleStepReviewed(s1, "reports", "t", "adm-ross", "2026-10-19T10:01:00Z")
    expect(s2.stepsReviewed).toEqual({})
    expect(s2.audit).toHaveLength(s0.audit.length + 2)
    expect(new Set(s2.audit.map((a) => a.id)).size).toBe(s2.audit.length)
  })
})
