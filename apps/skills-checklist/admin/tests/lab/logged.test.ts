import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { createV2Store } from "@/lib/v2/store"
import { DEFAULT_STUDENT, buildStudent, requestGroups } from "@/lib/lab/student"
import { deleteLogged, loggedNotSent, markLoggedSent, saveLogged, sendNew, type LoggedInput } from "@/lib/lab/logged"
import { loggedHandoff, pickRows, whereChoices } from "@/lib/lab/student2"
import type { Submission, V2State } from "@/lib/v2/types"

/** In-memory Storage, so a "reload" is a new store reading what the old one wrote. */
function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => { m.delete(k) },
    setItem: (k, v) => { m.set(k, v) },
  }
}

const seed = createSeed()
const maya = buildStudent(seed, DEFAULT_STUDENT)!
const where = whereChoices(seed, DEFAULT_STUDENT)[0]
const picks = pickRows(seed, maya).slice(0, 3).map((p) => p.id)

const input = (skillIds: string[], note = ""): LoggedInput => ({ skillIds, where: where.value, setting: where.setting, clinicalSetting: where.clinicalSetting, location: where.location ?? "Harbor General, 4 West", date: "2026-10-25", unit: "4 West", case: "", note, ratings: {} })

const twoSittings = (): { s: V2State; a: string; b: string } => {
  const one = saveLogged(seed, input(picks.slice(0, 2), "First sitting"), DEFAULT_STUDENT, "2026-10-26T09:00:00.000Z")
  const two = saveLogged(one.state, input(picks.slice(2, 3)), DEFAULT_STUDENT, "2026-10-26T10:00:00.000Z")
  return { s: two.state, a: one.batchId, b: two.batchId }
}

describe("logged, not sent yet", () => {
  it("has nothing in the seed (seeded practice trials are not listed)", () => {
    expect(loggedNotSent(seed, DEFAULT_STUDENT)).toEqual([])
    expect(maya.next.some((a) => a.kind === "logged")).toBe(false)
  })

  it("persists across a reload of the shared store", () => {
    const storage = memoryStorage()
    const store = createV2Store({ storage })
    store.hydrate()
    store.update((s) => saveLogged(s, input(picks.slice(0, 2), "My note"), DEFAULT_STUDENT, "2026-10-26T09:00:00.000Z").state)
    const reloaded = createV2Store({ storage })
    reloaded.hydrate()
    const rows = loggedNotSent(reloaded.getSnapshot(), DEFAULT_STUDENT)
    expect(rows).toHaveLength(1)
    expect(rows[0].skillIds).toEqual(picks.slice(0, 2))
    expect(rows[0].date).toBe("2026-10-25")
    expect(rows[0].note).toBe("My note")
  })

  it("lists each sitting once, newest first, with one note per sitting", () => {
    const { s, a, b } = twoSittings()
    const rows = loggedNotSent(s, DEFAULT_STUDENT)
    expect(rows.map((r) => r.batchId)).toEqual([b, a])
    expect(s.logEntries.filter((e) => e.batchId === a && e.note).length).toBe(1)
  })

  it("changes no fact: no request, no evaluation, nothing counted", () => {
    const { s } = twoSittings()
    expect(s.submissions).toBe(seed.submissions)
    expect(s.evaluations).toBe(seed.evaluations)
    const after = buildStudent(s, DEFAULT_STUDENT)!
    expect(after.counts).toEqual(maya.counts)
  })

  it("Do this next has one item whose count equals the drafts, opening My requests on Drafts", () => {
    const { s } = twoSittings()
    const next = buildStudent(s, DEFAULT_STUDENT)!.next.filter((a) => a.kind === "logged")
    expect(next).toHaveLength(1)
    const n = loggedNotSent(s, DEFAULT_STUDENT).length
    expect(n).toBe(2)
    expect(next[0].title).toBe(`${n} drafts not sent`)
    expect(next[0].href).toContain("/my-requests")
    expect(next[0].href).toContain("show=drafts")
  })

  it("saving a draft again replaces it in place, with its course, step, evaluator and self-ratings", () => {
    const first = saveLogged(seed, { ...input(picks.slice(0, 1)), course: "crs-nurs350", step: "questions" }, DEFAULT_STUDENT, "2026-10-26T09:00:00.000Z")
    const again = saveLogged(first.state, { ...input(picks.slice(0, 2), "Edited"), course: "crs-nurs350", step: "send", who: "p-1", method: "link", ratings: { [picks[0]]: "Met" }, batchId: first.batchId }, DEFAULT_STUDENT, "2026-10-26T10:00:00.000Z")
    expect(again.batchId).toBe(first.batchId)
    const rows = loggedNotSent(again.state, DEFAULT_STUDENT)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ skillIds: picks.slice(0, 2), note: "Edited", course: "crs-nurs350", step: "send", who: "p-1", method: "link", ratings: { [picks[0]]: "Met" } })
    expect(loggedHandoff(rows[0])).toMatchObject({ course: "crs-nurs350", step: "send", logged: first.batchId })
  })

  it("sendNew writes a request that waits in My requests and leaves no draft", () => {
    const sub: Submission = { id: "req-lab-new", studentId: DEFAULT_STUDENT, skillIds: picks.slice(0, 1), method: "link", status: "with-evaluator", assignedToId: "", createdAt: "2026-10-26T09:00:00.000Z", daysWaiting: 0, candidateIds: [] }
    const s = sendNew(seed, input(picks.slice(0, 1)), DEFAULT_STUDENT, sub, "2026-10-26T09:00:00.000Z")
    expect(loggedNotSent(s, DEFAULT_STUDENT)).toEqual([])
    expect(s.submissions.some((x) => x.id === "req-lab-new")).toBe(true)
    const waiting = requestGroups(s, DEFAULT_STUDENT).flatMap((g) => g.waiting).map((r) => r.id)
    expect(waiting).toContain("req-lab-new")
  })

  it("Send opens prefilled from the sitting", () => {
    const { s, a } = twoSittings()
    const row = loggedNotSent(s, DEFAULT_STUDENT).find((r) => r.batchId === a)!
    const h = loggedHandoff(row)
    expect(h.skills).toBe(picks.slice(0, 2).join(","))
    expect(h.where).toBe(where.value)
    expect(h.date).toBe("2026-10-25")
    expect(h.note).toBe("First sitting")
    expect(h.logged).toBe(a)
  })

  it("sending moves it from Not sent yet to a waiting request", () => {
    const { s, a } = twoSittings()
    const before = requestGroups(s, DEFAULT_STUDENT).reduce((n, g) => n + g.waiting.length, 0)
    const sub: Submission = { id: "req-lab-test", studentId: DEFAULT_STUDENT, skillIds: picks.slice(0, 2), method: "link", status: "with-evaluator", assignedToId: seed.people.find((p) => p.kind === "preceptor")?.id ?? "", createdAt: "2026-10-26T11:00:00.000Z", daysWaiting: 0 }
    const sent = markLoggedSent(s, DEFAULT_STUDENT, a, sub)
    expect(loggedNotSent(sent, DEFAULT_STUDENT).map((r) => r.batchId)).not.toContain(a)
    expect(sent.submissions.find((x) => x.id === "req-lab-test")?.entryIds).toHaveLength(2)
    expect(requestGroups(sent, DEFAULT_STUDENT).reduce((n, g) => n + g.waiting.length, 0)).toBe(before + 1)
    // Sending twice does not make a second request.
    expect(markLoggedSent(sent, DEFAULT_STUDENT, a, sub).submissions.length).toBe(sent.submissions.length)
  })

  it("delete removes it and nothing else", () => {
    const { s, a, b } = twoSittings()
    const gone = deleteLogged(s, DEFAULT_STUDENT, a)
    expect(loggedNotSent(gone, DEFAULT_STUDENT).map((r) => r.batchId)).toEqual([b])
    expect(gone.logEntries.length).toBe(s.logEntries.length - 2)
    expect(deleteLogged(gone, DEFAULT_STUDENT, b).logEntries.length).toBe(seed.logEntries.length)
  })
})
