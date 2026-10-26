import { describe, expect, it } from "vitest"
import { FLOWS, findFlow, flowHref, flowsForScreen, mainSteps, neighbours, resolveSet, resolveStep, splitScreen, stepScreen, variantLetter } from "@/lib/lab/flows"
import { isPersonaId } from "@/lib/lab/personas"
import { findScreen } from "@/lib/lab/screens"

/**
 * flows.json integrity (03-lab-architecture.md section 5.2): every step resolves to a registered screen, every mapped letter
 * is a registered variant, every flow has 2 or more sets and every step maps every set, side steps hang off a real step, and
 * flowsForScreen round-trips.
 *
 * PENDING_VARIANTS lists letters the spec adds that builders B1 and B3 are building now; they may or may not be registered in
 * screens.json yet. The Phase 2 wire-up registers them and empties this list. Until then the flow route renders them as
 * "Planned".
 */
const PENDING_VARIANTS = new Set<string>()

describe("flows.json", () => {
  it("has unique flow ids and unique step ids per flow", () => {
    expect(new Set(FLOWS.map((f) => f.id)).size).toBe(FLOWS.length)
    for (const f of FLOWS) expect(new Set(f.steps.map((s) => s.id)).size, f.id).toBe(f.steps.length)
  })

  it("covers every persona with at least one flow", () => {
    for (const p of ["admin", "student", "evaluator", "reviewer", "director", "lab-instructor"]) {
      expect(FLOWS.some((f) => f.persona === p), p).toBe(true)
    }
  })

  it("names a real persona, 2 to 3 sets, a valid recommended set and 2 or more main steps", () => {
    for (const f of FLOWS) {
      expect(isPersonaId(f.persona), f.id).toBe(true)
      expect(f.sets.length, f.id).toBeGreaterThanOrEqual(2)
      expect(f.sets.length, f.id).toBeLessThanOrEqual(3)
      expect(f.sets.some((s) => s.id === f.recommendedSet), f.id).toBe(true)
      expect(mainSteps(f).length, f.id).toBeGreaterThanOrEqual(2)
      for (const s of f.sets) expect(s.label.trim().length > 0 && s.summary.trim().length > 0, `${f.id} set ${s.id}`).toBe(true)
    }
  })

  it("points every step at a registered screen", () => {
    for (const f of FLOWS) for (const st of f.steps) expect(stepScreen(st), `${f.id}/${st.id} -> ${st.screen}`).toBeDefined()
  })

  it("maps every set on every step to a registered variant (or a pending one)", () => {
    const missing: string[] = []
    for (const f of FLOWS) {
      for (const st of f.steps) {
        const screen = stepScreen(st)!
        for (const set of f.sets) {
          const letter = st.variants[set.id]
          if (!letter) { missing.push(`${f.id}/${st.id} set ${set.id}: no mapping`); continue }
          const key = `${st.screen}/${letter}`
          if (!screen.variants.some((v) => v.id === letter) && !PENDING_VARIANTS.has(key)) missing.push(`${f.id}/${st.id} set ${set.id}: ${key} not registered`)
        }
        for (const k of Object.keys(st.variants)) expect(f.sets.some((s) => s.id === k), `${f.id}/${st.id} maps unknown set ${k}`).toBe(true)
      }
    }
    expect(missing).toEqual([])
  })

  it("lists only screens that exist as pending", () => {
    for (const key of PENDING_VARIANTS) {
      const [persona, slug] = key.split("/")
      expect(findScreen(persona!, slug!), key).toBeDefined()
    }
  })

  it("hangs every side step off a main step of the same flow", () => {
    for (const f of FLOWS) {
      for (const st of f.steps.filter((s) => s.side)) {
        expect(mainSteps(f).some((m) => m.id === st.after), `${f.id}/${st.id} after ${st.after}`).toBe(true)
      }
    }
  })

  it("matches the spec's set up skills mapping exactly", () => {
    const f = findFlow("set-up-skills")!
    // Granola 2026-10-26 items 6 and 8: Library, Add, Configure, Publish, Assign, Map; import is Phase 2, an optional side step.
    expect(mainSteps(f).map((s) => s.label)).toEqual(["Library", "Add a skill", "Configure", "Impact and publish", "Assign to cohort or group", "Map to courses"])
    const imp = f.steps.find((s) => s.id === "import")!
    expect(imp).toMatchObject({ side: true, after: "add", tag: "Later" })
    const row = (id: string) => ["1", "2", "3"].map((s) => variantLetter(f, f.steps.find((x) => x.id === id)!, s)).join("")
    expect(row("library")).toBe("ABC")
    expect(row("add")).toBe("ABC")
    // Decided with Romit's defaults: Set 2 "One page" = B (split page), Set 3 "Many at once" = C (paste); spec 03 had C and B swapped.
    expect(row("import")).toBe("ABC")
    expect(row("configure")).toBe("ABC")
    expect(row("assign")).toBe("ABB")
    expect(row("publish")).toBe("ABC")
    expect(row("map")).toBe("ABA")
  })

  it("gives each set one summary line and builds every step of every set (no planned variant)", () => {
    for (const f of FLOWS) {
      for (const set of f.sets) {
        expect(set.summary, `${f.id} set ${set.id}`).not.toMatch(/\n/)
        expect(set.summary.length, `${f.id} set ${set.id}`).toBeLessThanOrEqual(90)
        expect(set.summary, `${f.id} set ${set.id}`).not.toMatch(/\bitems?\b|\u2014/i)
        for (const st of f.steps) {
          const r = resolveStep(f.id, st.id, set.id)!
          expect(r.planned, `${f.id}/${st.id} set ${set.id} -> ${st.screen}/${st.variants[set.id]}`).toBe(false)
        }
      }
    }
  })
})

describe("resolvers", () => {
  it("resolves every step in every set with no dead links", () => {
    for (const f of FLOWS) {
      for (const st of f.steps) {
        for (const set of f.sets) {
          const href = flowHref(f.id, st.id, set.id)
          const url = new URL(href, "http://lab.test")
          const [, , , flowId, stepId] = url.pathname.split("/")
          const r = resolveStep(flowId!, stepId!, url.searchParams.get("set"))
          expect(r, href).toBeDefined()
          expect(r!.set).toBe(set.id)
          expect(r!.variant.id).toBe(st.variants[set.id])
          expect(r!.screen.persona + "/" + r!.screen.slug).toBe(st.screen)
          // A letter with no built component (not registered yet, or registered without a file) is flagged planned.
          const v = r!.screen.variants.find((x) => x.id === st.variants[set.id])
          expect(r!.planned).toBe(!v?.file)
        }
      }
    }
  })

  it("falls back to the recommended set for an unknown or missing set", () => {
    const f = findFlow("set-up-skills")!
    expect(resolveSet(f, "9")).toBe("1")
    expect(resolveSet(f, null)).toBe("1")
    expect(resolveStep("set-up-skills", "import", "9")!.variant.id).toBe("A")
    expect(resolveStep("nope", "import", "1")).toBeUndefined()
    expect(resolveStep("set-up-skills", "nope", "1")).toBeUndefined()
  })

  it("gives the publish step its per-set params", () => {
    expect(resolveStep("set-up-skills", "publish", "1")!.params).toEqual({ step: "check", change: "sample" })
    expect(resolveStep("set-up-skills", "publish", "2")!.params).toEqual({ section: "check", change: "sample" })
    expect(resolveStep("set-up-skills", "publish", "3")!.params).toEqual({ impact: "open", change: "sample" })
    expect(resolveStep("set-up-skills", "configure", "1")!.params).toEqual({})
  })

  it("names previous and next steps, with ends open and side steps anchored", () => {
    const f = findFlow("set-up-skills")!
    expect(neighbours(f, "library")).toMatchObject({ index: 1, total: 6, prev: undefined, next: { id: "add" } })
    expect(neighbours(f, "configure")).toMatchObject({ index: 3, total: 6, prev: { id: "add" }, next: { id: "publish" } })
    expect(neighbours(f, "import")).toMatchObject({ index: 2, total: 6, prev: { id: "add" }, next: { id: "configure" } })
    expect(neighbours(f, "assign")).toMatchObject({ index: 5, total: 6, prev: { id: "publish" }, next: { id: "map" } })
    expect(neighbours(f, "map")).toMatchObject({ index: 6, total: 6, prev: { id: "assign" }, next: undefined })
    const p = findFlow("my-progress")!
    expect(neighbours(p, "offline")).toMatchObject({ index: 1, prev: { id: "home" }, next: { id: "detail" } })
  })

  it("carries the record and scope params, never step-local ones", () => {
    const carry = new URLSearchParams("skill=sk-1&term=Fall%202026&step=check&change=sample&variant=B")
    const href = flowHref("set-up-skills", "map", "2", carry)
    const q = new URL(href, "http://lab.test").searchParams
    expect(q.get("set")).toBe("2")
    expect(q.get("skill")).toBe("sk-1")
    expect(q.get("term")).toBe("Fall 2026")
    expect(q.has("step")).toBe(false)
    expect(q.has("change")).toBe(false)
    expect(q.has("variant")).toBe(false)
  })

  it("round-trips: a screen URL for (flow, step, set) finds that flow step", () => {
    for (const f of FLOWS) {
      for (const st of f.steps) {
        for (const set of f.sets) {
          const letter = st.variants[set.id]!
          const { persona, slug } = splitScreen(st.screen)
          const params = new URLSearchParams(st.params?.[set.id] ?? {})
          const hits = flowsForScreen(persona, slug, letter, params)
          const hit = hits.find((h) => h.flow.id === f.id && h.step.id === st.id)
          expect(hit, `${f.id}/${st.id} set ${set.id}`).toBeDefined()
          expect(hit!.step.variants[hit!.set]).toBe(letter)
        }
      }
    }
  })

  it("reads a plain configure URL as the configure step and a check URL as the publish step", () => {
    expect(flowsForScreen("admin", "configure-skill", "A")[0]).toMatchObject({ flow: { id: "set-up-skills" }, step: { id: "configure" }, set: "1" })
    expect(flowsForScreen("admin", "configure-skill", "A", new URLSearchParams("step=check&change=sample"))[0]).toMatchObject({ step: { id: "publish" } })
    expect(flowsForScreen("admin", "starter-library", "A")).toEqual([])
  })
})
