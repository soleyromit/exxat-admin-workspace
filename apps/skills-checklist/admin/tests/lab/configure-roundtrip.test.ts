import { describe, expect, it } from "vitest"
import { createV2Store } from "@/lib/v2/store"
import { createSeed } from "@/lib/v2/seed"
import { skillById } from "@/lib/v2/evidence-index"
import { emptyRule, fromV2, saveLabRule, validateRule, withModel, type LabRule } from "@/lib/lab/configure"
import type { V2State } from "@/lib/v2/types"

/**
 * T2 (req-coverage-lab P0 rows 7, 8 and P1 row 6): the settings Configure A, B and C show must survive Save and a reload of the
 * shared store [REQ SC-13, SC-15, SC-07]. A and B save one skill through useConfigure (saveLabRule); C saves the same rule to each
 * selected skill in a loop (admin-configure-skill-c.tsx). Both paths are exercised here with the scenario a reviewer clicks through:
 * a mandatory choice list with three choices, self-evaluation on, a 1 to 7 scale with pass mark 6.
 */

const AT = "2026-10-30T09:00:00Z"
const BY = "u-admin"

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  }
}

/** Saves `rule` to every id (C's loop; one id is A and B), then reads the state back through a second store. */
function saveManyAndReload(ids: string[], rule: LabRule): V2State {
  const storage = memoryStorage()
  const a = createV2Store({ storage, key: "rt" })
  a.hydrate()
  a.update((s) => ids.reduce((acc, id) => {
    const r = saveLabRule(acc, id, rule, { at: AT, byId: BY, mode: null })
    if (!r.ok) throw new Error(r.error)
    return r.written ? r.state : acc
  }, s))
  const b = createV2Store({ storage, key: "rt" })
  b.hydrate()
  return b.getSnapshot()
}

const seed = createSeed()
const notConfigured = seed.skills.filter((k) => !k.configured)

const FIELDS: LabRule["studentFields"] = [
  { label: "Date performed", type: "date", mandatory: true },
  { label: "Unit", type: "choice", mandatory: true, choices: ["ICU", "Med-surg", "ED"] },
]

function scenario(): LabRule {
  return {
    ...withModel(emptyRule(), "scored"),
    questions: ["Prepares the site", "Performs the technique"],
    scaleMax: 7,
    scoredRule: { kind: "average", value: 6 },
    need: 2,
    evaluatorRoles: ["preceptor"],
    studentFields: FIELDS,
    selfEvaluation: true,
  }
}

function expectScenario(r: LabRule) {
  expect(r.studentFields).toEqual(FIELDS)
  expect(r.studentFields[1]!.mandatory).toBe(true)
  expect(r.studentFields[1]!.choices).toEqual(["ICU", "Med-surg", "ED"])
  expect(r.selfEvaluation).toBe(true)
  expect(r.scaleMax).toBe(7)
  expect(r.scoredRule).toEqual({ kind: "average", value: 6 })
  expect(validateRule(r)).toEqual([])
}

describe("Configure settings survive Save and reload [SC-13, SC-15, SC-07]", () => {
  it("the scenario rule is valid before saving", () => {
    expect(validateRule(scenario())).toEqual([])
  })

  it("A and B (one skill): fields with choices and mandatory, self-evaluation and scale top are read back", () => {
    const id = notConfigured[0]!.id
    const s = saveManyAndReload([id], scenario())
    const k = skillById(s, id)!
    expect(k.config!.selfEvaluation).toBe(true)
    expect(k.config!.scaleMax).toBe(7)
    expect(k.config!.studentFields).toEqual(FIELDS)
    expectScenario(fromV2(k))
  })

  it("C (several at once): every selected skill keeps the same settings", () => {
    const ids = notConfigured.slice(0, 3).map((k) => k.id)
    expect(ids).toHaveLength(3)
    const s = saveManyAndReload(ids, scenario())
    for (const id of ids) expectScenario(fromV2(skillById(s, id)!))
  })

  it("saving the read-back rule again changes nothing (no drift on re-open and save)", () => {
    const id = notConfigured[0]!.id
    const once = skillById(saveManyAndReload([id], scenario()), id)!
    const twice = skillById(saveManyAndReload([id], fromV2(once)), id)!
    expect(twice.config).toEqual(once.config)
  })

  it("turning self-evaluation off and editing a field are kept too", () => {
    const id = notConfigured[0]!.id
    const edited: LabRule = {
      ...scenario(),
      selfEvaluation: false,
      studentFields: [FIELDS[0]!, { label: "Unit", type: "choice", mandatory: false, choices: ["ICU", "ED"] }],
    }
    const back = fromV2(skillById(saveManyAndReload([id], edited), id)!)
    expect(back.selfEvaluation).toBe(false)
    expect(back.studentFields[1]).toEqual({ label: "Unit", type: "choice", mandatory: false, choices: ["ICU", "ED"] })
  })

  it("a field that stops being a choice list drops its choices", () => {
    const id = notConfigured[0]!.id
    const rule: LabRule = { ...scenario(), studentFields: [{ label: "Unit", type: "short", mandatory: true, choices: ["ICU", "ED"] }] }
    const back = fromV2(skillById(saveManyAndReload([id], rule), id)!)
    expect(back.studentFields[0]).toEqual({ label: "Unit", type: "short", mandatory: true })
  })
})
