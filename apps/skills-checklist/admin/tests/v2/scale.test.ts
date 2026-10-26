import { describe, expect, it } from "vitest"
import { approveItems, queueItems } from "@/lib/v2/queue"
import { heatCell, heatmap, NO_FILTERS, paceRows } from "@/lib/v2/reports"
import { createSeed, IDS } from "@/lib/v2/seed"
import { setMapping } from "@/lib/v2/admin-actions"
import { createV2Store, STORAGE_KEY, toggleStepReviewed } from "@/lib/v2/store"
import { verificationRows, verifyRecord } from "@/lib/v2/verification"

/**
 * Scale budgets (strategy 05 section 9, dataset spec section 7). Coarse on purpose: they catch a quadratic selector or a store that writes
 * the whole generated state, not a few milliseconds of noise. Each test prints the measured figure so a reviewer can read it.
 */

const ms = (f: () => void) => {
  const t = performance.now()
  f()
  return performance.now() - t
}

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

describe("performance on the full generated dataset (123 students, 178 skills, about 8,500 evaluations)", () => {
  it("builds the seed in under 400 ms", () => {
    createSeed()
    const t = ms(() => void createSeed())
    console.log(`createSeed: ${t.toFixed(1)} ms`)
    expect(t).toBeLessThan(400)
  })

  it("computes the cohort pace and the heat map in under 300 ms", () => {
    const s = createSeed()
    const warm = createSeed()
    paceRows(warm)
    heatmap(warm, NO_FILTERS)
    const pace = ms(() => void paceRows(s))
    const heat = ms(() => void heatmap(s, NO_FILTERS))
    const both = ms(() => {
      const fresh = { ...s, evaluations: [...s.evaluations] }
      paceRows(fresh)
      heatmap(fresh, NO_FILTERS)
    })
    console.log(`paceRows (index cold): ${pace.toFixed(1)} ms · heatmap: ${heat.toFixed(1)} ms · both with a new evaluation list (index rebuilt): ${both.toFixed(1)} ms`)
    expect(pace + heat).toBeLessThan(300)
    expect(both).toBeLessThan(300)
  })

  it("computes every student against every configured skill (about 17,000 cells) in under 300 ms", () => {
    const s = createSeed()
    const students = s.people.filter((p) => p.kind === "student")
    const skills = s.skills.filter((k) => k.configured)
    const t = ms(() => {
      let n = 0
      for (const p of students) for (const k of skills) n += heatCell(s, p.id, k).counted
      expect(n).toBeGreaterThan(0)
    })
    console.log(`full matrix: ${students.length} x ${skills.length} = ${students.length * skills.length} cells in ${t.toFixed(1)} ms`)
    expect(t).toBeLessThan(300)
  })

  it("lists the director's 123 rows in under 300 ms", () => {
    const s = createSeed()
    const t = ms(() => void verificationRows(s))
    console.log(`verificationRows: ${t.toFixed(1)} ms`)
    expect(t).toBeLessThan(300)
  })
})

describe("what a session writes to storage", () => {
  it("stays well under 1 MB after a typical session, and under 150 ms per save", () => {
    const storage = mem()
    const store = createV2Store({ storage })
    const AT = "2026-10-26T10:00:00Z"
    const total = JSON.stringify(createSeed()).length
    // A typical walk-through: mark a step, approve the first three queue items, map and unmap a skill, verify three records.
    store.update((s) => toggleStepReviewed(s, "reports", "Read cohort reports", IDS.ross, AT))
    const keys = queueItems(store.getSnapshot()).slice(0, 3).map((i) => i.key)
    const saveTimes: number[] = []
    const run = (fn: () => void) => saveTimes.push(ms(fn))
    run(() =>
      store.update((s) => {
        const r = approveItems(s, keys, IDS.reviewer, AT)
        return r.ok ? r.state : s
      }),
    )
    run(() =>
      store.update((s) => {
        const r = setMapping(s, "sk-rad-chest", "optional", IDS.ross, AT)
        return r.ok ? r.state : s
      }),
    )
    const ready = verificationRows(store.getSnapshot()).filter((r) => r.pending === 0 && r.counted > 0).slice(0, 3)
    for (const row of ready) {
      run(() =>
        store.update((s) => {
          const r = verifyRecord(s, row.studentId, { note: "", confirmed: true }, IDS.director, AT)
          return r.ok ? r.state : s
        }),
      )
    }
    const raw = storage.getItem(STORAGE_KEY)!
    console.log(`state ${total} chars · saved ${raw.length} chars (${((raw.length / total) * 100).toFixed(2)}%) · slowest save ${Math.max(...saveTimes).toFixed(1)} ms`)
    expect(store.saveFailed()).toBe(false)
    expect(raw.length).toBeLessThan(1_000_000)
    expect(raw.length).toBeLessThan(total / 10)
    expect(Math.max(...saveTimes)).toBeLessThan(150)
    // A new tab restores the same state from the patch.
    const b = createV2Store({ storage })
    b.hydrate()
    expect(b.getSnapshot()).toEqual(store.getSnapshot())
  })
})
