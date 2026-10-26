import { describe, expect, it } from "vitest"
import { createSeed, IDS } from "@/lib/v2/seed"
import { createRequest, logSkills, type LogInput } from "@/lib/v2/student"
import { flushQueue, queueChange, resolutionAllowed, resolveConflict, retryItem, setDevice, simulateServerEdit, syncStateOf, syncSummary } from "@/lib/v2/sync"
import type { V2State } from "@/lib/v2/types"

const AT = "2026-10-19T10:00:00Z"
const ME = IDS.maya
const IV = IDS.ivCath

/** The seed with IV catheter insertion in use and the seeded conflict removed, so a test starts from a calm phone. */
const calm = (): V2State => {
  const s = createSeed()
  return { ...s, skills: s.skills.map((k) => (k.id === IV ? { ...k, published: true } : k)), syncQueue: s.syncQueue.filter((i) => i.state === "synced") }
}
const input = (over: Partial<LogInput> = {}): LogInput => ({ skillIds: [IV], setting: "clinical", clinicalSetting: "Inpatient", location: "Harbor General, 4 West", ratings: { [IV]: "With assistance" }, answers: {}, notes: { [IV]: "Went well" }, ...over })
const log = (s: V2State, over: Partial<LogInput> = {}) => {
  const r = logSkills(s, input(over), AT)
  if (!r.ok) throw new Error(r.error)
  return r
}
const stateOf = (s: V2State, id: string) => s.syncQueue.find((i) => i.id === id)!.state

describe("sync state machine", () => {
  it("online and signed in: a new entry is saved, queued, then synced in the same step", () => {
    const r = log(calm())
    const item = r.state.syncQueue.find((i) => i.entryId === r.entryIds[0])!
    expect(item.state).toBe("synced")
    expect(r.state.audit.map((a) => a.action)).toContain("Synced change")
  })

  it("offline: the entry is saved on the phone and stays queued; nothing is lost or blocked", () => {
    const off = setDevice(calm(), { offline: true }, AT).state
    const r = log(off)
    const item = r.state.syncQueue.find((i) => i.entryId === r.entryIds[0])!
    expect(item.state).toBe("queued")
    expect(r.state.logEntries.some((e) => e.id === r.entryIds[0])).toBe(true)
    expect(r.state.audit.some((a) => a.action.startsWith("Logged a skill, saved on this phone"))).toBe(true)
    expect(syncSummary(r.state).headline).toBe("Offline. 1 change is saved on this phone")
  })

  it("signed out and update pending: logging still works, items queue with the right words", () => {
    const so = setDevice(calm(), { signedOut: true, updatePending: true }, AT).state
    const r = log(so)
    expect(r.state.syncQueue.find((i) => i.entryId === r.entryIds[0])!.state).toBe("queued")
    expect(syncSummary(r.state).headline).toBe("Signed out. 1 change is waiting for sign in")
    // update pending alone never queues anything
    const up = log(setDevice(calm(), { updatePending: true }, AT).state)
    expect(up.state.syncQueue.find((i) => i.entryId === up.entryIds[0])!.state).toBe("synced")
  })

  it("going online or signing in sends what is waiting", () => {
    const off = log(setDevice(calm(), { offline: true }, AT).state).state
    const back = setDevice(off, { offline: false }, AT)
    expect(back.flush).toMatchObject({ attempted: 1, synced: 1, blocked: null })
    expect(syncSummary(back.state).waiting).toBe(0)
    const so = log(setDevice(calm(), { signedOut: true }, AT).state).state
    expect(setDevice(so, { signedOut: false }, AT).flush?.synced).toBe(1)
  })

  it("flush leaves everything alone while offline or signed out and says why", () => {
    const off = log(setDevice(calm(), { offline: true }, AT).state).state
    const r = flushQueue(off, AT)
    expect(r.state).toBe(off)
    expect(r.result.blocked).toBe("offline")
    const so = flushQueue({ ...off, device: { ...off.device, offline: false, signedOut: true } }, AT)
    expect(so.result.blocked).toBe("signed-out")
  })

  it("the next sync can fail once: items become failed, nothing is lost, retry succeeds", () => {
    const base = setDevice(calm(), { offline: true, failNextSync: true }, AT).state
    const two = log(log(base).state, { notes: { [IV]: "second" } }).state
    const online = setDevice(two, { offline: false }, AT)
    const failed = online.state.syncQueue.filter((i) => i.state === "failed")
    expect(failed).toHaveLength(2)
    expect(failed[0].error).toMatch(/still saved on this phone/)
    expect(online.state.device.failNextSync).toBe(false)
    expect(online.state.logEntries.length).toBe(two.logEntries.length)
    // one retry
    const one = retryItem(online.state, failed[0].id, AT)
    expect(stateOf(one.state, failed[0].id)).toBe("synced")
    expect(stateOf(one.state, failed[1].id)).toBe("failed")
    // bulk retry
    const all = flushQueue(one.state, AT)
    expect(all.result).toMatchObject({ attempted: 1, synced: 1 })
    expect(syncSummary(all.state).failed).toBe(0)
  })

  it("a server edit makes a waiting item a conflict the next time it syncs", () => {
    const off = log(setDevice(calm(), { offline: true }, AT).state).state
    const edited = simulateServerEdit(off, AT)
    if (!edited.ok) throw new Error(edited.error)
    expect(stateOf(edited.state, edited.itemId)).toBe("queued")
    const back = setDevice(edited.state, { offline: false }, AT)
    expect(back.flush).toMatchObject({ conflicts: 1, synced: 0 })
    const item = back.state.syncQueue.find((i) => i.id === edited.itemId)!
    expect(item.state).toBe("conflict")
    expect(item.conflict).toMatchObject({ field: "note", mine: "Went well" })
    expect(item.conflict!.theirs).toMatch(/other device/)
  })

  it("a server edit on an item that already synced makes it a conflict at once; with nothing to edit it says so", () => {
    const r = log(calm())
    const edited = simulateServerEdit(r.state, AT)
    if (!edited.ok) throw new Error(edited.error)
    expect(stateOf(edited.state, edited.itemId)).toBe("conflict")
    const none = simulateServerEdit({ ...calm(), logEntries: [] }, AT)
    expect(none.ok).toBe(false)
  })

  it("a rating conflict is made when the entry has no note", () => {
    const r = log(calm(), { notes: {} })
    const edited = simulateServerEdit(r.state, AT)
    if (!edited.ok) throw new Error(edited.error)
    const c = edited.state.syncQueue.find((i) => i.id === edited.itemId)!.conflict!
    expect(c.field).toBe("rating")
    expect(c.mine).toBe("With assistance")
    expect(c.theirs).not.toBe("With assistance")
  })

  it("a request saved offline is on-device until it syncs, then reaches the evaluator or the review queue", () => {
    const off = setDevice(calm(), { offline: true }, AT).state
    const logged = log(off, { skillIds: [IV, "sk-med-admin"], ratings: { [IV]: "With assistance", "sk-med-admin": "Met" } })
    for (const method of ["qr", "photo"] as const) {
      const r = createRequest(logged.state, { entryIds: logged.entryIds, method, evaluatorIds: [IDS.delgado], photo: { name: "f.jpg", sizeKb: 5, type: "image/jpeg" } }, AT)
      if (!r.ok) throw new Error(r.error)
      expect(r.state.submissions.find((x) => x.id === r.submissionId)!.status).toBe("on-device")
      const counters = (st: V2State) => ({ withEvaluator: st.submissions.filter((x) => x.status === "with-evaluator").length, queue: st.submissions.filter((x) => x.status === "awaiting-review").length })
      expect(counters(r.state)).toEqual(counters(logged.state))
      const online = setDevice(r.state, { offline: false }, AT).state
      expect(online.submissions.find((x) => x.id === r.submissionId)!.status).toBe(method === "photo" ? "awaiting-review" : "with-evaluator")
      expect(syncStateOf(online, { requestId: r.submissionId })).toBe("synced")
    }
  })

  it("syncSummary chooses the chip that needs the most attention", () => {
    const base = calm()
    expect(syncSummary(base)).toMatchObject({ chip: "synced", headline: "Everything is saved and sent" })
    let s = queueChange(base, { studentId: ME, label: "x" }, AT).state
    expect(syncSummary({ ...s, device: { ...s.device, offline: true } })).toMatchObject({ chip: "queued", waiting: 1 })
    s = { ...s, syncQueue: s.syncQueue.map((i) => (i.label === "x" ? { ...i, state: "failed" as const } : i)) }
    expect(syncSummary(s).chip).toBe("failed")
    const seeded = syncSummary(createSeed())
    expect(seeded).toMatchObject({ queued: 1, synced: 1, conflict: 1, chip: "conflict", headline: "1 conflict needs you" })
  })
})

describe("resolveConflict", () => {
  const conflicted = () => createSeed()
  const ID = "sy-3"
  const entry = (s: V2State) => s.logEntries.find((e) => e.id === "log-maya-uc-1")!

  it("keep mine: the phone's note stays, the item syncs, the audit log records it", () => {
    const r = resolveConflict(conflicted(), ID, "mine", AT)
    if (!r.ok) throw new Error(r.error)
    expect(entry(r.state).note).toMatch(/^Asked the preceptor/)
    const item = r.state.syncQueue.find((i) => i.id === ID)!
    expect(item.state).toBe("synced")
    expect(item.conflict).toBeUndefined()
    expect(r.state.audit.some((a) => a.action === "Resolved sync conflict: kept this phone's version" && a.target.includes("urinary"))).toBe(true)
  })

  it("keep theirs: the server's note replaces the phone's", () => {
    const r = resolveConflict(conflicted(), ID, "theirs", AT)
    if (!r.ok) throw new Error(r.error)
    expect(entry(r.state).note).toBe("Used a 14 Fr catheter. The preceptor stayed for the whole procedure.")
    expect(r.state.syncQueue.find((i) => i.id === ID)!.state).toBe("synced")
  })

  it("keep both for a note joins them into one note, server text first", () => {
    const r = resolveConflict(conflicted(), ID, "both", AT)
    if (!r.ok) throw new Error(r.error)
    expect(entry(r.state).note).toBe("Used a 14 Fr catheter. The preceptor stayed for the whole procedure.\n\nAsked the preceptor to check my sterile technique before I inserted the catheter.")
  })

  it("keep both is refused for a rating, which is one level", () => {
    expect(resolutionAllowed("rating", "both").ok).toBe(false)
    expect(resolutionAllowed("note", "both").ok).toBe(true)
    const s = log(calm(), { notes: {} })
    const e = simulateServerEdit(s.state, AT)
    if (!e.ok) throw new Error(e.error)
    const r = resolveConflict(e.state, e.itemId, "both", AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/one self-rating/)
    const t = resolveConflict(e.state, e.itemId, "theirs", AT)
    if (!t.ok) throw new Error(t.error)
    expect(t.state.logEntries.find((x) => x.id === s.entryIds[0])!.rating).toBe(e.state.syncQueue.find((i) => i.id === e.itemId)!.conflict!.theirs)
  })

  it("refuses an unknown or already resolved conflict", () => {
    expect(resolveConflict(conflicted(), "nope", "mine", AT).ok).toBe(false)
    const r = resolveConflict(conflicted(), ID, "mine", AT)
    if (!r.ok) throw new Error(r.error)
    expect(resolveConflict(r.state, ID, "mine", AT).ok).toBe(false)
  })

  it("a resolution made offline is a new change: queued, then synced on going online", () => {
    const off = setDevice(conflicted(), { offline: true }, AT).state
    const r = resolveConflict(off, ID, "theirs", AT)
    if (!r.ok) throw new Error(r.error)
    expect(r.state.syncQueue.find((i) => i.id === ID)!.state).toBe("queued")
    expect(r.flush.blocked).toBe("offline")
    const online = setDevice(r.state, { offline: false }, AT)
    expect(online.state.syncQueue.find((i) => i.id === ID)!.state).toBe("synced")
  })
})
