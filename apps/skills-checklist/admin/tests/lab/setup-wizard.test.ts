import { describe, expect, it } from "vitest"
import {
  EMPTY_PROGRESS,
  SETUP_STEPS,
  back,
  canOpen,
  firstBlocked,
  gateMet,
  goTo,
  next,
  parseProgress,
  resumeStep,
  serializeProgress,
  skip,
  stepIndex,
  type SetupFacts,
} from "@/lib/lab/setup-wizard"

const none: SetupFacts = { skills: 0, settingsSaved: false, groupsWithSkills: 0 }
const all: SetupFacts = { skills: 150, settingsSaved: true, groupsWithSkills: 3 }
const at = (id: string) => stepIndex(id)

describe("Set up skills workflow (D-L44)", () => {
  it("has six steps, optional only Categories and tags and Course mapping", () => {
    expect(SETUP_STEPS.map((s) => s.id)).toEqual(["skills", "categories", "settings", "assign", "mapping", "review"])
    expect(SETUP_STEPS.filter((s) => s.optional).map((s) => s.id)).toEqual(["categories", "mapping"])
  })

  it("gates: a skill, saved settings, a student group with skills", () => {
    expect(gateMet("skills", none)).toBe(false)
    expect(gateMet("skills", { ...none, skills: 1 })).toBe(true)
    expect(gateMet("settings", { ...none, skills: 1 })).toBe(false)
    expect(gateMet("assign", { ...all, groupsWithSkills: 0 })).toBe(false)
    expect(gateMet("categories", none)).toBe(true)
    expect(gateMet("mapping", none)).toBe(true)
  })

  it("Next stays on a step whose gate is unmet and moves on when met", () => {
    expect(next(EMPTY_PROGRESS, none).current).toBe(0)
    expect(next(EMPTY_PROGRESS, { ...none, skills: 150 }).current).toBe(1)
    const onSettings = { current: at("settings"), skipped: [] }
    expect(next(onSettings, { ...none, skills: 5 }).current).toBe(at("settings"))
    expect(next(onSettings, { ...none, skills: 5, settingsSaved: true }).current).toBe(at("assign"))
  })

  it("Skip works only on optional steps and is remembered; Next on it clears the mark", () => {
    const onCats = { current: at("categories"), skipped: [] }
    const skipped = skip(onCats)
    expect(skipped.current).toBe(at("settings"))
    expect(skipped.skipped).toEqual(["categories"])
    expect(skip({ current: at("settings"), skipped: [] }).current).toBe(at("settings"))
    expect(skip({ current: at("assign"), skipped: [] }).current).toBe(at("assign"))
    expect(next({ current: at("categories"), skipped: ["categories"] }, all).skipped).toEqual([])
  })

  it("cannot jump past Evaluation settings until it is saved", () => {
    const f = { ...none, skills: 10 }
    expect(canOpen(at("categories"), f)).toBe(true)
    expect(canOpen(at("settings"), f)).toBe(true)
    expect(canOpen(at("assign"), f)).toBe(false)
    expect(canOpen(at("review"), f)).toBe(false)
    expect(goTo({ current: 0, skipped: [] }, at("mapping"), f).current).toBe(0)
    expect(firstBlocked(f)).toBe(at("settings"))
  })

  it("done steps can be revisited; Back stops at the first step", () => {
    expect(goTo({ current: at("review"), skipped: [] }, at("skills"), all).current).toBe(0)
    expect(back({ current: 0, skipped: [] }).current).toBe(0)
    expect(back({ current: 3, skipped: [] }).current).toBe(2)
  })

  it("resume: saved progress round-trips, bad input starts over, a stale step opens its blocking gate", () => {
    const saved = serializeProgress({ current: 4, skipped: ["categories"] })
    expect(parseProgress(saved)).toEqual({ current: 4, skipped: ["categories"], finished: false })
    expect(parseProgress(saved, { ...all, settingsSaved: false }).current).toBe(at("settings"))
    expect(parseProgress("{nope")).toEqual(EMPTY_PROGRESS)
    expect(parseProgress(JSON.stringify({ current: 99, skipped: ["bogus"] }))).toEqual({ current: 5, skipped: [], finished: false })
    expect(resumeStep(parseProgress(saved))).toBe(5)
    expect(resumeStep({ current: 2, skipped: [], finished: true })).toBeNull()
    expect(resumeStep(null)).toBeNull()
  })
})

describe("Set up skills starts from a new program (D-L44, 2026-11-04)", async () => {
  const { newProgramSeed } = await import("@/lib/lab/new-program")
  const { seedLists } = await import("@/lib/lab/lists")
  const { buildLibrary } = await import("@/lib/lab/library")
  const { programSettingsOf } = await import("@/lib/lab/program-settings")
  const s = newProgramSeed()

  it("has no skills data but keeps the people, cohorts and courses", () => {
    expect(s.skills).toEqual([])
    expect(s.mappings).toEqual([])
    expect(s.evaluations).toEqual([])
    expect(buildLibrary(s)).toEqual([])
    expect(seedLists(s)).toEqual([])
    expect(programSettingsOf(s)?.at ?? null).toBeNull()
    expect(s.vocabulary).toEqual({ categories: [], tags: [] })
    expect(s.program.cohorts.length).toBeGreaterThan(0)
    expect((s.offerings ?? []).length).toBeGreaterThan(0)
    expect(s.people.length).toBeGreaterThan(100)
  })

  it("so every gate starts unmet and only step 1 can open", () => {
    const f: SetupFacts = { skills: buildLibrary(s).length, settingsSaved: false, groupsWithSkills: 0 }
    expect(SETUP_STEPS.filter((x) => !x.optional && x.id !== "review").map((x) => gateMet(x.id, f))).toEqual([false, false, false])
    expect(firstBlocked(f)).toBe(0)
    expect(canOpen(at("categories"), f)).toBe(false)
    expect(next(EMPTY_PROGRESS, f).current).toBe(0)
  })
})
