import { describe, expect, it, vi } from "vitest"
import { DB_VERSION, STORAGE_KEY_DB, STORAGE_KEY_PREFS } from "@/lib/config"
import * as S from "@/lib/store"
import { buildSeed } from "@/lib/seed"

class MemStorage implements S.StorageLike {
  map = new Map<string, string>()
  getItem(k: string) {
    return this.map.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
}
const make = (storage: S.StorageLike | null = new MemStorage()) => S.createRuntime({ storage, now: () => "2026-10-08T09:00:00.000Z", token: () => "t".repeat(24) })

describe("runtime store", () => {
  it("starts from the seed, commits successful actions, persists them and notifies subscribers", () => {
    const st = new MemStorage()
    const rt = make(st)
    const fn = vi.fn()
    rt.subscribe(fn)
    const r = rt.run((db, ctx) => S.createSkill(db, { name: "Runtime skill" }, ctx))
    expect(r.ok).toBe(true)
    expect(rt.getDb().skills.some((s) => s.name === "Runtime skill")).toBe(true)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(JSON.parse(st.getItem(STORAGE_KEY_DB)!).skills.some((s: { name: string }) => s.name === "Runtime skill")).toBe(true)
  })

  it("a failed action changes nothing, persists nothing and does not notify", () => {
    const st = new MemStorage()
    const rt = make(st)
    const fn = vi.fn()
    rt.subscribe(fn)
    const before = rt.getDb()
    const r = rt.run((db, ctx) => S.createSkill(db, { name: "" }, ctx))
    expect(r.ok).toBe(false)
    expect(rt.getDb()).toBe(before)
    expect(st.getItem(STORAGE_KEY_DB)).toBeNull()
    expect(fn).not.toHaveBeenCalled()
  })

  it("hydrates persisted state, ignoring a different version or corrupt data (versioned key)", () => {
    const st = new MemStorage()
    const a = make(st)
    a.run((db, ctx) => S.createSkill(db, { name: "Persisted skill" }, ctx))
    const b = make(st)
    expect(b.getDb().skills.some((s) => s.name === "Persisted skill")).toBe(false) // before hydrate: the SSR-safe seed
    b.hydrate()
    expect(b.getDb().skills.some((s) => s.name === "Persisted skill")).toBe(true)

    const old = new MemStorage()
    old.setItem(STORAGE_KEY_DB, JSON.stringify({ ...buildSeed(), version: DB_VERSION + 1, skills: [] }))
    const c = make(old)
    c.hydrate()
    expect(c.getDb().skills).toHaveLength(12)

    const bad = new MemStorage()
    bad.setItem(STORAGE_KEY_DB, "{not json")
    const d = make(bad)
    expect(() => d.hydrate()).not.toThrow()
    expect(d.getDb().skills).toHaveLength(12)
  })

  it("hydrate is idempotent and notifies once", () => {
    const rt = make()
    const fn = vi.fn()
    rt.subscribe(fn)
    rt.hydrate()
    rt.hydrate()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("reset returns to the seed and clears the stored copy", () => {
    const st = new MemStorage()
    const rt = make(st)
    rt.run((db, ctx) => S.createSkill(db, { name: "Gone soon" }, ctx))
    rt.reset()
    expect(rt.getDb().skills).toHaveLength(12)
    expect(st.getItem(STORAGE_KEY_DB)).toBeNull()
  })

  it("works with no storage at all (private mode): it stays in memory", () => {
    const rt = make(null)
    expect(rt.run((db, ctx) => S.createSkill(db, { name: "Memory only" }, ctx)).ok).toBe(true)
    expect(rt.getDb().skills).toHaveLength(13)
  })

  it("preferences (the OD-03 display flag, the acting student) persist separately from program data", () => {
    const st = new MemStorage()
    const rt = make(st)
    expect(rt.getPrefs().skillStatusDisplay).toBe("merged") // default since 2026-10-08 (parity spec C-1); OD-03 stays open
    rt.setPrefs({ skillStatusDisplay: "four", currentStudentId: "stu-02" })
    expect(JSON.parse(st.getItem(STORAGE_KEY_PREFS)!)).toMatchObject({ skillStatusDisplay: "four", currentStudentId: "stu-02" })
    const again = make(st)
    again.hydrate()
    expect(again.getPrefs()).toMatchObject({ skillStatusDisplay: "four", currentStudentId: "stu-02" })
    rt.reset() // reset clears program data, not the display preference
    expect(rt.getPrefs().skillStatusDisplay).toBe("four")
  })

  it("browser tokens are crypto-random, opaque and unique", () => {
    const set = new Set(Array.from({ length: 50 }, () => S.randomToken()))
    expect(set.size).toBe(50)
    expect([...set].every((t) => /^[a-z0-9]{24}$/.test(t))).toBe(true)
  })

  it("actions run through the runtime receive the injected clock and token", () => {
    const rt = make()
    const sub = rt.getDb().submissions.find((s) => s.studentId === "stu-03" && s.skillId === "sk-foley")!
    void sub
    const r = rt.run((db, ctx) => S.sendForReview(db, { studentId: "stu-03", offeringId: "off-350-f26", performedIn: "clinical", evaluator: { roleId: "preceptor", personId: "ev-delgado" }, skills: [{ skillId: "sk-foley", values: { "sk-foley-f-date": "2026-09-01" } }] }, ctx))
    expect(r.ok && r.value.token).toBe("t".repeat(24))
    expect(rt.getDb().submissions.at(-1)!.sentAt).toBe("2026-10-08T09:00:00.000Z")
  })
})
