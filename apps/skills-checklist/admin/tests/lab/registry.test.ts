import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { PERSONAS, PERSONA_BY_ID } from "@/lib/lab/personas"
import { SCREENS, builtVariants, findScreen, screenHref, resolveVariant } from "@/lib/lab/screens"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { VARIANT_COMPONENTS } from "@/components/lab/screens"

const root = path.resolve(__dirname, "../..")

describe("lab registry", () => {
  it("has every field on every screen", () => {
    expect(SCREENS.length).toBeGreaterThanOrEqual(30)
    for (const s of SCREENS) {
      expect(PERSONA_BY_ID[s.persona], s.slug).toBeTruthy()
      expect([1, 2, 3]).toContain(s.tier)
      expect(s.variants.length, s.slug).toBeGreaterThan(0)
      expect(s.requiredDsComponents.length, s.slug).toBeGreaterThan(0)
      expect(s.variants.some((v) => v.id === s.recommended), s.slug).toBe(true)
      for (const v of s.variants) expect(v.question.length).toBeGreaterThan(10)
    }
  })

  it("keeps tiers consistent with variant counts", () => {
    // Tier 1 screens explore at least 3 and at most 6 variants (the admin dashboard carries 6 concepts). LEDGER D-X4: every
    // screen gets at least 2 structurally different variants, so tier 2 and tier 3 have 2 or 3 (tier 3 may still have 1 while the
    // second is still being built; tighten to exactly 2 once every tier 3 screen has its second variant).
    for (const s of SCREENS) {
      if (s.tier === 1) {
        expect(s.variants.length, s.slug).toBeGreaterThanOrEqual(3)
        expect(s.variants.length, s.slug).toBeLessThanOrEqual(6)
      } else if (s.tier === 2) {
        expect(s.variants.length, s.slug).toBeGreaterThanOrEqual(2)
        expect(s.variants.length, s.slug).toBeLessThanOrEqual(3)
      } else {
        expect(s.variants.length, s.slug).toBeGreaterThanOrEqual(2)
        expect(s.variants.length, s.slug).toBeLessThanOrEqual(3)
      }
    }
  })

  // Romit, 2026-10-26: every screen has at least 2 structurally different variants, whatever its tier.
  it("gives every screen at least 2 variants", () => {
    for (const s of SCREENS) expect(s.variants.length, `${s.persona}/${s.slug}`).toBeGreaterThanOrEqual(2)
  })

  it("gives every variant a page type and every scenario a valid shape", () => {
    const types = ["list", "wizard", "form", "detail", "split", "dashboard", "evaluator", "student"]
    for (const s of SCREENS) {
      for (const v of s.variants) expect(types, `${s.persona}/${s.slug}/${v.id}`).toContain(v.pageType)
      for (const sc of s.scenarios ?? []) {
        expect(["States", "Data"], sc.label).toContain(sc.group)
        expect(!!sc.params !== !!sc.event || (!!sc.params && !sc.event), sc.label).toBe(true)
        expect(sc.label).not.toMatch(/\bitems?\b/i)
        if (sc.event) expect(sc.event).toBe("lab:reset")
      }
    }
    // Screens whose pages have demo states expose them in the Scenario menu.
    for (const k of ["admin/configure-skill", "admin/import-ai-review", "admin/skills-library", "admin/add-skill", "admin/dashboard", "evaluator/evaluation-form", "student/home", "reviewer/approvals", "director/dashboard"]) {
      const [p, slug] = k.split("/")
      expect(findScreen(p!, slug!)?.scenarios?.length, k).toBeGreaterThan(0)
    }
  })

  it("has unique persona/slug pairs and resolvable links", () => {
    const keys = SCREENS.map((s) => `${s.persona}/${s.slug}`)
    expect(new Set(keys).size).toBe(keys.length)
    for (const s of SCREENS) for (const v of s.variants) {
      const m = /^\/lab\/([^/]+)\/([^/?]+)\?variant=(\w+)$/.exec(screenHref(s.persona, s.slug, v.id))
      expect(m).toBeTruthy()
      expect(findScreen(m![1], m![2])).toBe(s)
      expect(resolveVariant(s, m![3]).id).toBe(v.id)
    }
  })

  it("points every nav row at a registered screen of the same persona", () => {
    for (const p of PERSONAS) {
      if (p.chrome === "light") expect(p.nav).toBeNull()
      for (const row of p.nav?.() ?? []) expect(findScreen(p.id, row.slug), `${p.id}/${row.slug}`).toBeTruthy()
      expect(findScreen(p.id, p.landing), `${p.id} landing`).toBeTruthy()
    }
  })

  it("labels the admin and director first row Dashboard, never Home", () => {
    expect(PERSONA_BY_ID.admin.nav!()[0].title).toBe("Dashboard")
    expect(PERSONA_BY_ID.director.nav!()[0].title).toBe("Dashboard")
    expect(PERSONA_BY_ID.admin.nav!().map((r) => r.title)).toEqual(["Dashboard", "Skills", "Approvals", "Attainment"])
    expect(PERSONA_BY_ID.reviewer.nav!().map((r) => r.title)).toEqual(["Approvals", "Students"])
  })

  it("registers a component and an existing file for every built variant", () => {
    for (const s of SCREENS) for (const v of builtVariants(s)) {
      expect(fs.existsSync(path.join(root, v.file!)), v.file).toBe(true)
      expect(VARIANT_COMPONENTS[`${s.persona}/${s.slug}/${v.id}`]).toBeTruthy()
    }
  })

  it("defaults the skill noun", () => {
    expect([skillNoun(), skillNounPlural()]).toEqual(["skill", "skills"])
  })
})
