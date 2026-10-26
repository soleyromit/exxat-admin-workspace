import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { ROLES, roleForPath } from "@/lib/v2/roles"
import { STEPS, stepForRoute } from "@/lib/v2/scenario"
import { COUNTER_BY_ID } from "@/lib/v2/selectors"

const REQ = fs.readFileSync(path.resolve(__dirname, "../../../docs/source/requirements.extracted.txt"), "utf8")
const VALID = new Set(
  REQ.split("\n")
    .map((l) => l.replace(/^\s*\d+\t/, "").trim())
    .filter((l) => /^(SL|IM|SC|CM|ST|EV|AR|RV|SH|RP|AE)-\d{2}$/.test(l)),
)

describe("scenario", () => {
  it("has exactly 14 numbered steps with unique ids and routes", () => {
    expect(STEPS).toHaveLength(14)
    expect(STEPS.map((s) => s.n)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1))
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(14)
    expect(new Set(STEPS.map((s) => s.route)).size).toBe(14)
  })

  it("routes match role and id, and resolve back to the step", () => {
    for (const s of STEPS) {
      expect(s.route).toBe(`/v2/${s.role}/${s.id}`)
      expect(stepForRoute(s.role, s.id)).toBe(s)
      expect(roleForPath(s.route)).toBe(s.role)
    }
  })

  it("only cites requirement IDs that exist in the requirements document", () => {
    expect(VALID.size).toBeGreaterThan(100)
    for (const s of STEPS) for (const id of s.reqIds) expect(VALID.has(id), `${s.id} cites ${id}`).toBe(true)
  })

  it("every precondition holds on the seed and every counter id exists", () => {
    const seed = createSeed()
    for (const s of STEPS) {
      expect(s.precondition.check(seed), s.id).toBe(true)
      for (const c of s.counters) expect(COUNTER_BY_ID[c], `${s.id} counter ${c}`).toBeDefined()
    }
  })

  it("every role has a home and at least one step", () => {
    for (const r of ROLES) expect(STEPS.some((s) => s.role === r.id), r.id).toBe(true)
  })

  it("keeps UI strings free of em dashes", () => {
    for (const s of STEPS) for (const t of [s.title, s.summary, s.precondition.text]) expect(t).not.toMatch(new RegExp("\\u2014"))
  })
})
