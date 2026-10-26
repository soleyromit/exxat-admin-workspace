import { describe, expect, it } from "vitest"
import { createSeed as createFullSeed, IDS } from "@/lib/v2/seed"
import type { V2State as FullState } from "@/lib/v2/types"

/**
 * These v2 courseWork tests predate the hero story (2026-10-26) that gave Maya a returned submission (sub-maya-2). A returned
 * submission is rightly her next action, so the ordering tests below run on the seed without it. v2 is to be replaced.
 */
const createSeed = (): FullState => { const s = createFullSeed(); return { ...s, submissions: s.submissions.filter((x) => x.id !== "sub-maya-2") } }
import { courseWork, createRequest, evaluatorChoices, logSkills, prerequisiteStatus, ratingKind, ratingOptions, skillProgress, unsentEntries, type LogInput } from "@/lib/v2/student"
import type { Evaluation, Setting, V2State } from "@/lib/v2/types"

const AT = "2026-10-19T10:00:00Z"
const ME = IDS.maya

function publishIv(s: V2State): V2State {
  return { ...s, skills: s.skills.map((k) => (k.id === IDS.ivCath ? { ...k, published: true } : k)) }
}

let n = 0
function ev(partial: Partial<Evaluation> & { skillId: string }): Evaluation {
  n++
  return { id: `t-${n}`, studentId: ME, evaluatorId: IDS.delgado, setting: "clinical", date: `2026-09-${String(10 + (n % 15)).padStart(2, "0")}T09:00:00Z`, status: "counted", outcome: "met", currentVersion: 1, versions: [], clinicalSetting: "Inpatient", ...partial }
}
const withEvals = (s: V2State, list: Evaluation[]): V2State => ({ ...s, evaluations: [...s.evaluations.filter((e) => e.studentId !== ME || e.skillId !== list[0].skillId), ...list] })
const IV = IDS.ivCath

describe("skillProgress (remaining-work calc)", () => {
  it("count rule: counts met evaluations against need", () => {
    const s = createSeed()
    const p = skillProgress(s, ME, IDS.urinaryCath)!
    expect(p).toMatchObject({ counted: 2, need: 3, achieved: false })
    expect(p.left[0]).toBe("1 more successful evaluation")
    expect(p.summary).toBe("2 of 3 successful evaluations")
  })

  it("is achieved when the rule holds, with nothing left", () => {
    const p = skillProgress(createSeed(), ME, "sk-vitals")!
    expect(p.achieved).toBe(true)
    expect(p.left).toEqual([])
  })

  it("last-n rule looks only at the newest window, setting minimums and distinct evaluators apply", () => {
    let s = publishIv(createSeed())
    // 4 met in Inpatient by 2 evaluators within the last 5, plus an older failure outside the window.
    s = withEvals(s, [
      ev({ skillId: IV, outcome: "not-yet", date: "2026-07-01T09:00:00Z" }),
      ev({ skillId: IV, date: "2026-09-01T09:00:00Z" }),
      ev({ skillId: IV, date: "2026-09-02T09:00:00Z", evaluatorId: "pre-castillo" }),
      ev({ skillId: IV, date: "2026-09-03T09:00:00Z" }),
      ev({ skillId: IV, date: "2026-09-04T09:00:00Z" }),
    ])
    const p = skillProgress(s, ME, IV)!
    expect(p.window).toBe(5)
    expect(p.counted).toBe(4)
    expect(p.distinct).toEqual({ have: 2, need: 2 })
    expect(p.achieved).toBe(true)
  })

  it("last-n: a failure inside the window keeps it from being achieved", () => {
    let s = createSeed()
    s = withEvals(s, [
      ev({ skillId: IV, date: "2026-09-01T09:00:00Z" }),
      ev({ skillId: IV, date: "2026-09-02T09:00:00Z", evaluatorId: "pre-castillo" }),
      ev({ skillId: IV, date: "2026-09-03T09:00:00Z", outcome: "not-yet" }),
      ev({ skillId: IV, date: "2026-09-04T09:00:00Z", outcome: "not-met" }),
      ev({ skillId: IV, date: "2026-09-05T09:00:00Z" }),
    ])
    const p = skillProgress(s, ME, IV)!
    expect(p.counted).toBe(3)
    expect(p.achieved).toBe(false)
    expect(p.notMet).toBe(2)
  })

  it("needs different evaluators when the rule says so", () => {
    let s = createSeed()
    s = withEvals(s, ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"].map((d) => ev({ skillId: IV, date: `${d}T09:00:00Z` })))
    const p = skillProgress(s, ME, IV)!
    expect(p.counted).toBe(4)
    expect(p.achieved).toBe(false)
    expect(p.left.join(" ")).toContain("1 more different evaluator")
  })

  it("lab and simulation evidence never satisfies a named clinical setting (hard stop)", () => {
    let s = createSeed()
    // Four met in the lab by two evaluators: the count and the evaluators are fine, Inpatient 2 is not.
    s = withEvals(s, [
      ev({ skillId: IV, setting: "lab", clinicalSetting: undefined, date: "2026-09-01T09:00:00Z" }),
      ev({ skillId: IV, setting: "lab", clinicalSetting: undefined, date: "2026-09-02T09:00:00Z", evaluatorId: IDS.whitmore }),
      ev({ skillId: IV, setting: "lab", clinicalSetting: undefined, date: "2026-09-03T09:00:00Z" }),
      ev({ skillId: IV, setting: "lab", clinicalSetting: undefined, date: "2026-09-04T09:00:00Z" }),
    ])
    const p = skillProgress(s, ME, IV)!
    expect(p.counted).toBe(4)
    expect(p.settings).toEqual([{ setting: "Inpatient", have: 0, min: 2 }])
    expect(p.achieved).toBe(false)
    expect(p.left.join(" ")).toContain("2 more in Inpatient (you have 0 of 2)")
    expect(p.notes.join(" ")).toContain("Lab and simulation do not count toward a clinical setting")
  })

  it("caps simulation at the configured share and says so", () => {
    let s = createSeed()
    s = withEvals(s, [
      ev({ skillId: "sk-med-admin", setting: "simulation", clinicalSetting: undefined, date: "2026-09-01T09:00:00Z" }),
      ev({ skillId: "sk-med-admin", setting: "simulation", clinicalSetting: undefined, date: "2026-09-02T09:00:00Z" }),
      ev({ skillId: "sk-med-admin", setting: "simulation", clinicalSetting: undefined, date: "2026-09-03T09:00:00Z" }),
    ])
    const p = skillProgress(s, ME, "sk-med-admin")!
    // default config: need 3, cap 33 percent -> 0 of 3 may come from simulation
    expect(p.counted).toBe(0)
    expect(p.simulationLeftOut).toBe(3)
    expect(p.notes.join(" ")).toContain("not counted because simulation can supply at most 0 of 3")
  })

  it("excludes evidence awaiting approval (AR-06) and returned or reopened evaluations", () => {
    const s = createSeed()
    const p = skillProgress(s, ME, "sk-blood-glucose")!
    expect(p.counted).toBe(0)
    expect(p.awaiting).toBe(1)
    expect(p.notes.join(" ")).toContain("waiting for approval")
  })

  it("applies a minimum level only when an evaluation recorded one", () => {
    let s = createSeed()
    s = withEvals(s, ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"].map((d, i) => ev({ skillId: IV, date: `${d}T09:00:00Z`, evaluatorId: i % 2 ? "pre-castillo" : IDS.delgado, levelIndex: 0 })))
    expect(skillProgress(s, ME, IV)!.counted).toBe(0)
  })

  it("returns null for an unconfigured skill", () => {
    expect(skillProgress(createSeed(), ME, "sk-pressure-injury")).toBeNull()
  })
})

describe("prerequisites", () => {
  it("holds for Maya on the seed: lab check-off, 3 practice trials, vital signs met", () => {
    const s = createSeed()
    const p = prerequisiteStatus(s, ME, s.skills.find((k) => k.id === IV)!)
    expect(p.met).toBe(true)
    expect(p.items.map((i) => i.id)).toEqual(["lab-checkoff", "practice", "skill:sk-vitals"])
  })

  it("every configured item is required and each unmet item says what to do", () => {
    const s = createSeed()
    const t = {
      ...s,
      labCheckoffs: [],
      logEntries: s.logEntries.filter((e) => e.id !== "log-maya-prac-3"),
      evaluations: s.evaluations.filter((e) => e.skillId !== "sk-vitals"),
    }
    const p = prerequisiteStatus(t, ME, t.skills.find((k) => k.id === IV)!)
    expect(p.met).toBe(false)
    expect(p.items.filter((i) => !i.met)).toHaveLength(3)
    expect(p.items.find((i) => i.id === "practice")).toMatchObject({ detail: "2 of 3 logged", todo: "Log 1 more practice trial in the lab or simulation." })
    expect(p.items.find((i) => i.id === "lab-checkoff")!.todo).toMatch(/lab check-off/)
    expect(p.items.find((i) => i.id === "skill:sk-vitals")!.todo).toBe("Get Vital signs and early warning score signed off first.")
  })

  it("a skill with no prerequisite is never locked", () => {
    const s = createSeed()
    expect(prerequisiteStatus(s, ME, s.skills.find((k) => k.id === "sk-med-admin")!)).toEqual({ required: false, met: true, items: [] })
  })
})

describe("courseWork", () => {
  it("groups by requirement level and lists mandatory skills the program has not opened", () => {
    const w = courseWork(createSeed())
    expect(w.mandatory.map((i) => i.skill.id)).not.toContain(IV)
    expect(w.notOpen.map((x) => x.skill.id)).toContain(IV)
    expect(w.notOpen.find((x) => x.skill.id === IV)!.reason).toBe("Your program has not opened this skill yet.")
    expect(w.notExpected.map((i) => i.skill.id)).toEqual([]) // the one not-expected skill is not in use, and not-expected skills are not listed as not open
    const s = publishIv(createSeed())
    const w2 = courseWork(s)
    expect(w2.mandatory.map((i) => i.skill.id)).toContain(IV)
    expect(w2.summary.mandatory).toBe(5)
    expect(w2.optional.map((i) => i.skill.id).sort()).toEqual(["sk-blood-glucose", "sk-handoff", "sk-ng-tube"])
  })

  it("next best action: conflict first, then unsent entries, then the closest mandatory skill, then a locked one, then up to date", () => {
    const s = publishIv(createSeed())
    expect(courseWork(s).next.kind).toBe("resolve")
    const noConflict = { ...s, syncQueue: s.syncQueue.filter((i) => i.state !== "conflict") }
    const w = courseWork(noConflict)
    expect(w.next.kind).toBe("log")
    // Urinary catheter and oral medication already have an open request on the seed; of the rest, the one already started comes first.
    expect(w.next.skillId).toBe("sk-sterile-dressing")
  })

  it("picks a locked skill's practice trial when nothing else is ready", () => {
    let s = publishIv(createSeed())
    s = { ...s, syncQueue: s.syncQueue.filter((i) => i.state !== "conflict"), logEntries: s.logEntries.filter((e) => e.id !== "log-maya-prac-3") }
    // make every other mandatory skill achieved or requested
    s = { ...s, submissions: [...s.submissions, { id: "x", studentId: ME, skillIds: ["sk-sterile-dressing"], method: "link", status: "with-evaluator", assignedToId: IDS.delgado, createdAt: AT, daysWaiting: 0 }] }
    const w = courseWork(s)
    expect(w.next.kind).toBe("practice")
    expect(w.next.skillId).toBe(IV)
    expect(w.next.reason).toMatch(/practice trial/)
  })

  it("says the student is up to date when every mandatory skill is achieved or waiting", () => {
    const s = createSeed()
    const done = { ...s, syncQueue: s.syncQueue.filter((i) => i.state !== "conflict"), mappings: s.mappings.filter((m) => m.level !== "mandatory" || m.skillId === "sk-vitals"), skills: s.skills.map((k) => (["sk-blood-glucose", "sk-ng-tube", "sk-handoff"].includes(k.id) ? { ...k, published: false } : k)) }
    expect(courseWork(done).next.kind).toBe("clear")
  })

  it("an unsent clinical entry makes asking for sign-off the next action", () => {
    const s = publishIv(createSeed())
    const base = { ...s, syncQueue: s.syncQueue.filter((i) => i.state !== "conflict") }
    const r = logSkills(base, input({ skillIds: ["sk-med-admin"], ratings: { "sk-med-admin": "Met" } }), AT)
    expect(r.ok).toBe(true)
    if (r.ok) expect(courseWork(r.state).next.kind).toBe("request")
  })
})

function input(over: Partial<LogInput> = {}): LogInput {
  return {
    skillIds: [IV, "sk-sterile-dressing"],
    setting: "clinical" as Setting,
    clinicalSetting: "Inpatient",
    location: "Harbor General, 4 West",
    ratings: { [IV]: "With assistance" },
    answers: { "sk-sterile-dressing": [] },
    notes: {},
    ...over,
  }
}

describe("self-rating uses the skill's own scale", () => {
  it("levels come from the configuration, never fixed labels", () => {
    const s = createSeed()
    const iv = s.skills.find((k) => k.id === IV)!
    expect(ratingKind(iv)).toBe("levels")
    expect(ratingOptions(iv)).toEqual(iv.config!.levels)
    const renamed = { ...iv, config: { ...iv.config!, levels: ["Starting", "Getting there", "Confident"] } }
    expect(ratingOptions(renamed)).toEqual(["Starting", "Getting there", "Confident"])
    expect(ratingKind(s.skills.find((k) => k.id === "sk-med-admin")!)).toBe("outcome")
    expect(ratingOptions(s.skills.find((k) => k.id === "sk-med-admin")!)).toEqual(["Met", "Not met"])
    expect(ratingKind(s.skills.find((k) => k.id === "sk-sterile-dressing")!)).toBe("questions")
    expect(ratingKind(s.skills.find((k) => k.id === "sk-handoff")!)).toBe("none")
  })
})

describe("logSkills", () => {
  const ready = () => publishIv({ ...createSeed(), syncQueue: createSeed().syncQueue.filter((i) => i.state !== "conflict") })
  const good = () => input({ answers: { "sk-sterile-dressing": ["yes", "yes", "no"] } })

  it("saves one entry per skill, queues them, audits, and clears the draft", () => {
    const s = { ...ready(), logDraft: { step: 4 as const, skillIds: [], where: "", location: "", ratings: {}, answers: {}, notes: {} } }
    const r = logSkills(s, good(), AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.entryIds).toHaveLength(2)
    expect(r.state.logEntries.filter((e) => r.entryIds.includes(e.id)).map((e) => e.skillId)).toEqual([IV, "sk-sterile-dressing"])
    expect(r.state.logDraft).toBeNull()
    expect(r.state.audit.length).toBe(s.audit.length + 2 + 3) // 2 logged, then 3 synced (the seeded queued practice trial goes too)
    expect(r.state.audit[0].action).toBe("Synced change")
    expect(new Set(r.state.logEntries.filter((e) => r.entryIds.includes(e.id)).map((e) => e.batchId)).size).toBe(1)
  })

  it("refuses with plain reasons", () => {
    const s = ready()
    const err = (i: LogInput, st: V2State = s) => {
      const r = logSkills(st, i, AT)
      return r.ok ? "ok" : r.error
    }
    expect(err(input({ skillIds: [] }))).toBe("Pick at least one skill to log.")
    expect(err(good(), createSeed())).toMatch(/IV catheter insertion is not open yet/)
    expect(err({ ...good(), skillIds: ["sk-pressure-injury"] })).toMatch(/not open yet/)
    expect(err({ ...good(), clinicalSetting: null })).toMatch(/Choose where you did it/)
    expect(err({ ...good(), location: "" })).toMatch(/Enter the location/)
    expect(err({ ...good(), ratings: {} })).toBe("Rate yourself on IV catheter insertion, or remove it from this log.")
    expect(err({ ...good(), ratings: { [IV]: "Observed" } })).toMatch(/Observed is not one of the choices/)
    expect(err({ ...good(), answers: { "sk-sterile-dressing": ["yes", null, "no"] } })).toMatch(/Answer every question for Sterile dressing change/)
    expect(err({ ...good(), notes: { [IV]: "x".repeat(501) } })).toMatch(/under 500/)
  })

  it("enforces prerequisites for a clinical attempt but never for lab or simulation practice", () => {
    const locked = { ...ready(), logEntries: ready().logEntries.filter((e) => e.id !== "log-maya-prac-3") }
    const r = logSkills(locked, good(), AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe("IV catheter insertion cannot be logged in a clinical setting yet. Log 1 more practice trial in the lab or simulation.")
    const lab = logSkills(locked, { ...good(), skillIds: [IV], setting: "lab", clinicalSetting: null, location: "Skills lab 2" }, AT)
    expect(lab.ok).toBe(true)
    if (lab.ok) {
      const t = prerequisiteStatus(lab.state, ME, lab.state.skills.find((k) => k.id === IV)!)
      expect(t.items.find((i) => i.id === "practice")!.met).toBe(true)
      // practice trials are not sent for sign-off
      expect(unsentEntries(lab.state).some((e) => e.id === lab.entryIds[0])).toBe(false)
    }
  })

  it("lets a published skill that is not mapped be logged (ST-02, CM-05)", () => {
    const s = ready()
    const r = logSkills(s, { ...good(), skillIds: ["sk-rad-chest"], answers: { "sk-rad-chest": ["yes", "yes", "yes"] } }, AT)
    expect(r.ok).toBe(true)
  })
})

describe("evaluatorChoices (qualified-evaluator filter)", () => {
  const s = createSeed()
  const byId = (c: ReturnType<typeof evaluatorChoices>, id: string) => c.find((x) => x.person.id === id)!

  it("one skill: qualified are eligible, the rest are disabled with the reason", () => {
    const c = evaluatorChoices(s, [IV])
    expect(byId(c, IDS.delgado).eligible).toBe(true)
    expect(byId(c, "pre-castillo").eligible).toBe(true)
    expect(byId(c, "pre-okonkwo")).toMatchObject({ eligible: false, reasons: ["Needs 2 or more years of practice (has 1)"] })
    expect(byId(c, "pre-aldridge")).toMatchObject({ eligible: false, reasons: ["Needs RN credential (has LPN)"] })
    expect(byId(c, IDS.whitmore)).toMatchObject({ eligible: false, reasons: ["Lab instructors sign off in the lab, not in clinical practice."] })
  })

  it("says a reason that applies to every skill once", () => {
    const c = evaluatorChoices(s, [IV, "sk-sterile-dressing"])
    expect(byId(c, IDS.whitmore).reasons).toEqual(["Lab instructors sign off in the lab, not in clinical practice."])
  })

  it("lists faculty only when qualified", () => {
    const ids = evaluatorChoices(s, [IV]).map((x) => x.person.id)
    expect(ids).not.toContain(IDS.reviewer)
    expect(ids).not.toContain(IDS.director)
  })

  it("two skills: must qualify for every skill, and the reason names the skill", () => {
    const tightened = { ...s, skills: s.skills.map((k) => (k.id === "sk-sterile-dressing" ? { ...k, config: { ...k.config!, qualification: { credentials: ["RN"], minYears: 5, training: [] } } } : k)) }
    const c = evaluatorChoices(tightened, [IV, "sk-sterile-dressing"])
    expect(byId(c, IDS.delgado).eligible).toBe(true)
    expect(byId(c, "pre-castillo")).toMatchObject({ eligible: false })
    expect(byId(c, "pre-castillo").reasons).toEqual(["Sterile dressing change: Needs 5 or more years of practice (has 4)"])
  })

  it("detects that nobody qualifies", () => {
    const strict = { ...s, skills: s.skills.map((k) => (k.id === IV ? { ...k, config: { ...k.config!, qualification: { credentials: ["MD"], minYears: 0, training: [] } } } : k)) }
    expect(evaluatorChoices(strict, [IV]).some((c) => c.eligible)).toBe(false)
  })

  it("respects the roles a skill permits", () => {
    const noPreceptor = { ...s, skills: s.skills.map((k) => (k.id === "sk-med-admin" ? { ...k, config: { ...k.config!, evaluatorRoles: ["faculty" as const] } } : k)) }
    expect(byId(evaluatorChoices(noPreceptor, ["sk-med-admin"]), IDS.delgado).reasons).toEqual(["This skill cannot be signed off by a preceptor."])
  })
})

describe("createRequest", () => {
  function logged(): { s: V2State; ids: string[] } {
    const base = publishIv({ ...createSeed(), syncQueue: createSeed().syncQueue.filter((i) => i.state !== "conflict") })
    const r = logSkills(base, { skillIds: [IV, "sk-sterile-dressing"], setting: "clinical", clinicalSetting: "Inpatient", location: "Harbor General, 4 West", ratings: { [IV]: "With assistance" }, answers: { "sk-sterile-dressing": ["yes", "yes", "yes"] }, notes: {} }, AT)
    if (!r.ok) throw new Error(r.error)
    return { s: r.state, ids: r.entryIds }
  }
  const png = { name: "form.jpg", sizeKb: 800, type: "image/jpeg" }

  it("creates a real request tied to both skills for each method", () => {
    for (const method of ["qr", "handover", "link"] as const) {
      const { s, ids } = logged()
      const r = createRequest(s, { entryIds: ids, method, evaluatorIds: [IDS.delgado] }, AT)
      expect(r.ok, method).toBe(true)
      if (!r.ok) continue
      const sub = r.state.submissions.find((x) => x.id === r.submissionId)!
      expect(sub).toMatchObject({ studentId: ME, method, status: "with-evaluator", assignedToId: IDS.delgado })
      expect(sub.skillIds).toEqual([IV, "sk-sterile-dressing"])
      expect(sub.entryIds).toEqual(ids)
      expect(r.state.logEntries.filter((e) => ids.includes(e.id)).every((e) => e.requestId === sub.id)).toBe(true)
      expect(r.state.audit.some((a) => a.action.startsWith("Requested sign-off"))).toBe(true)
    }
  })

  it("a link can go to several qualified evaluators at once, one request", () => {
    const { s, ids } = logged()
    const r = createRequest(s, { entryIds: ids, method: "link", evaluatorIds: [IDS.delgado, "pre-castillo"] }, AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.state.submissions.length).toBe(s.submissions.length + 1)
    expect(r.state.submissions.find((x) => x.id === r.submissionId)!.candidateIds).toEqual([IDS.delgado, "pre-castillo"])
  })

  it("a photo goes to the review queue as a paper submission, assigned to the reviewer", () => {
    const { s, ids } = logged()
    const r = createRequest(s, { entryIds: ids, method: "photo", evaluatorIds: [IDS.delgado], photo: png }, AT)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const sub = r.state.submissions.find((x) => x.id === r.submissionId)!
    expect(sub).toMatchObject({ method: "photo", status: "awaiting-review", assignedToId: IDS.reviewer, photo: { name: "form.jpg", sizeKb: 800 } })
  })

  it("refuses an unqualified evaluator, wrong counts, bad photos, repeated and practice entries", () => {
    const { s, ids } = logged()
    const err = (i: Parameters<typeof createRequest>[1], st = s) => {
      const r = createRequest(st, i, AT)
      return r.ok ? "ok" : r.error
    }
    expect(err({ entryIds: ids, method: "link", evaluatorIds: ["pre-okonkwo"] })).toBe("S. Okonkwo, RN cannot sign this off. IV catheter insertion: Needs 2 or more years of practice (has 1)")
    expect(err({ entryIds: ids, method: "qr", evaluatorIds: [IDS.delgado, "pre-castillo"] })).toBe("Choose one evaluator.")
    expect(err({ entryIds: ids, method: "link", evaluatorIds: [] })).toBe("Choose at least one evaluator for the link.")
    expect(err({ entryIds: [], method: "qr", evaluatorIds: [IDS.delgado] })).toBe("Choose at least one logged skill to send.")
    expect(err({ entryIds: ids, method: "photo", evaluatorIds: [IDS.delgado] })).toBe("Add a photo of the signed paper form.")
    expect(err({ entryIds: ids, method: "photo", evaluatorIds: [IDS.delgado], photo: { name: "a.pdf", sizeKb: 10, type: "application/pdf" } })).toMatch(/not a photo/)
    expect(err({ entryIds: ids, method: "photo", evaluatorIds: [IDS.delgado], photo: { name: "a.jpg", sizeKb: 20000, type: "image/jpeg" } })).toMatch(/under 10 MB/)
    expect(err({ entryIds: ["log-maya-prac-1"], method: "qr", evaluatorIds: [IDS.delgado] })).toMatch(/practice trial/)
    const once = createRequest(s, { entryIds: ids, method: "qr", evaluatorIds: [IDS.delgado] }, AT)
    if (!once.ok) throw new Error("setup")
    expect(err({ entryIds: ids, method: "link", evaluatorIds: [IDS.delgado] }, once.state)).toMatch(/already in a request/)
  })

  it("holds an entry that has a sync conflict until it is resolved", () => {
    const { s, ids } = logged()
    const conflicted = { ...s, syncQueue: s.syncQueue.map((i) => (i.entryId === ids[0] ? { ...i, state: "conflict" as const } : i)) }
    const r = createRequest(conflicted, { entryIds: ids, method: "qr", evaluatorIds: [IDS.delgado] }, AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/sync conflict/)
  })
})
