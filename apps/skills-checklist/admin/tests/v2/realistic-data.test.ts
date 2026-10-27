import { describe, expect, it } from "vitest"
import { createSeed, IDS } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { HERITAGE, REAL_SYSTEM_DENY_LIST, UNVERIFIED_TYPED } from "@/lib/v2/pools"
import { mergeCandidates } from "@/lib/lab/evaluators"
import { evaluatorsFor } from "@/lib/lab/student2"

/**
 * Decision D-X23 (realistic but fictional sample data) and dataset spec section 13. The generated people, university and
 * sites must read as real while staying fictional: unique people, no digits in names, reserved example mail domains, no
 * real health-system trademark in a facility name, and the facts registry unchanged by the realistic pass.
 */

const s = createSeed()
const people = s.people
const students = people.filter((p) => p.kind === "student")
const evaluators = people.filter((p) => p.kind === "preceptor" || p.kind === "faculty" || p.kind === "lab-instructor")
const sites = s.sites ?? []

const RESERVED_DOMAIN = /@([a-z0-9-]+\.)*example$/
const word = (term: string) => new RegExp(`(^|[^A-Za-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`, "i")

describe("people read as real and stay fictional", () => {
  it("has no duplicate names and no duplicate emails", () => {
    const names = people.map((p) => p.name)
    expect(new Set(names).size).toBe(names.length)
    const emails = people.map((p) => p.email.toLowerCase())
    expect(new Set(emails).size).toBe(emails.length)
  })

  it("has no digits in any person's name, and no placeholder words", () => {
    for (const p of people) {
      expect(p.name, p.id).not.toMatch(/\d/)
      expect(p.name, p.id).not.toMatch(/\b(test|sample|student|user|lorem|foo|bar)\b/i)
    }
  })

  it("puts every email on a reserved example domain, students on the institution's student domain", () => {
    for (const p of people) expect(p.email, p.id).toMatch(RESERVED_DOMAIN)
    for (const p of students) expect(p.email, p.id).toMatch(/@students\.harbor\.example$/)
  })

  it("gives every student a student number and the generated students firstname.lastname mailboxes", () => {
    for (const p of students) expect(p.studentNumber, p.id).toMatch(/^S20\d{2}-\d{4}$/)
    expect(new Set(students.map((p) => p.studentNumber)).size).toBe(students.length)
    for (const p of students.filter((x) => x.id.startsWith("stu-g-"))) {
      const [given, ...rest] = p.name.split(" ")
      expect(p.email, p.id).toBe(`${given.toLowerCase().replace(/[^a-z-]/g, "")}.${rest.join("").toLowerCase().replace(/[^a-z-]/g, "")}@students.harbor.example`)
    }
  })

  it("draws names from several heritages (no single heritage holds more than half of the generated students)", () => {
    const gen = students.filter((p) => p.id.startsWith("stu-g-"))
    const counts = HERITAGE.map((h) => gen.filter((p) => h.surname.includes(p.name.split(" ").slice(1).join(" "))).length)
    expect(counts.filter((n) => n > 0).length).toBeGreaterThanOrEqual(6)
    expect(Math.max(...counts)).toBeLessThan(gen.length / 2)
  })

  it("gives evaluators credentials that keep the qualification tokens, and a home site that exists", () => {
    const siteIds = new Set(sites.map((x) => x.id))
    for (const p of evaluators.filter((x) => x.kind === "preceptor")) {
      expect(p.homeSiteId, p.id).toBeTruthy()
      expect(siteIds.has(p.homeSiteId!), p.id).toBe(true)
      expect((p.credentials ?? []).some((c) => ["RN", "LPN", "NP"].includes(c)), p.id).toBe(true)
    }
  })
})

describe("the 14 unverified names look typed, and two are spellings of adopted evaluators", () => {
  const unverified = evaluators.filter((p) => p.verified === false)
  it("keeps 14, with the typed forms from the pool", () => {
    expect(unverified).toHaveLength(14)
    const typed = new Set(UNVERIFIED_TYPED.filter(Boolean))
    expect(unverified.filter((p) => typed.has(p.name))).toHaveLength(13)
  })

  it("suggests the hero preceptor for 'Jon Delgado, RN' and an adopted same-surname preceptor for the nickname spelling", () => {
    const jon = unverified.find((p) => p.name === "Jon Delgado, RN")!
    expect(mergeCandidates(s, jon.id)[0]?.id).toBe(IDS.delgado)
    const nick = unverified.find((p) => !UNVERIFIED_TYPED.includes(p.name))!
    const top = mergeCandidates(s, nick.id)[0]
    expect(top?.why).toMatch(/Same surname/)
  })
})

describe("sites read as real and stay fictional", () => {
  it("has 120 sites, unique by facility and unit, each with a town, state and facility type", () => {
    expect(sites).toHaveLength(120)
    const keys = sites.map((x) => `${x.facility}|${x.unit}`)
    expect(new Set(keys).size).toBe(keys.length)
    for (const x of sites) {
      expect(x.city, x.id).toBeTruthy()
      expect(x.state, x.id).toMatch(/^(SC|NC)$/)
      expect(x.facilityType, x.id).toBeTruthy()
      expect(x.facility, x.id).not.toMatch(/\d/)
    }
  })

  it("uses no real health-system trademark in any facility, unit, location or evaluator title", () => {
    const texts = [...sites.flatMap((x) => [x.facility, x.unit, x.location]), ...people.map((p) => p.title), ...(s.program.locations ?? []).map((l) => l.name)]
    for (const term of REAL_SYSTEM_DENY_LIST) {
      const hits = texts.filter((t) => word(term).test(t))
      expect(hits, term).toEqual([])
    }
  })

  it("keeps the setting counts (69 sites count toward Inpatient) and the story sites", () => {
    const by = (k: string) => sites.filter((x) => x.clinicalSetting === k).length
    expect(by("Inpatient")).toBe(69)
    expect(sites.find((x) => x.id === "site-087")).toMatchObject({ clinicalSetting: "Inpatient", hasPreceptors: true })
  })

  it("lists every site with preceptors as a program location, and evidence names only listed places", () => {
    const listed = new Set((s.program.locations ?? []).map((l) => l.name))
    for (const x of sites.filter((y) => y.hasPreceptors)) expect(listed.has(x.location), x.id).toBe(true)
    for (const e of s.evaluations) if (e.location) expect(listed.has(e.location), `${e.id} ${e.location}`).toBe(true)
  })

  it("matches evaluators to a placement by site record, not by title text", () => {
    const placement = s.placements.find((p) => p.studentId === IDS.maya && p.siteId)!
    const site = sites.find((x) => x.id === placement.siteId)!
    const here = evaluatorsFor(s, [], placement.location).filter((o) => o.here)
    expect(here.length).toBeGreaterThan(0)
    for (const o of here) {
      const p = people.find((x) => x.id === o.id)!
      expect(sites.find((x) => x.id === p.homeSiteId)?.facility, o.id).toBe(site.facility)
    }
  })
})

describe("free text varies like real comments", () => {
  it("gives about 30 percent of evaluations an evaluator comment, with no one string dominating", () => {
    const fb = s.evaluations.map((e) => e.versions[e.versions.length - 1]?.detail?.feedback).filter((x): x is string => !!x)
    expect(fb.length / s.evaluations.length).toBeGreaterThan(0.25)
    expect(fb.length / s.evaluations.length).toBeLessThan(0.4)
    const top = Math.max(...[...fb.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>()).values()])
    expect(top / fb.length).toBeLessThan(0.05)
    const returns = s.submissions.flatMap((x) => x.returns ?? []).map((r) => r.reason)
    expect(new Set(returns).size).toBeGreaterThanOrEqual(6)
  })
})

describe("the facts registry is unchanged by the realistic pass", () => {
  it("keeps every headline number", () => {
    expect(facts(s)).toEqual({
      studentsTotal: 123, studentsInScope: 123, mandatoryRecords: 1547, mandatoryAchieved: 760, achievedPct: 49, behind: 28, waitingRequests: 251,
      awaitingApproval: 35, awaitingApprovalEvaluations: 41, awaitingApprovalStatusRows: 20, awaitingApprovalUnverifiedRows: 19, unverifiedEvaluators: 14,
      skillsTotal: 178, skillsConfigured: 147, skillsNotConfigured: 31, skillsInactive: 2, requiredToGraduate: 52, evaluators: 174, sites: 120, placementsEnding: 44,
    })
    expect((s.cohorts ?? []).map((c) => c.studentCount)).toEqual([38, 43, 42])
    expect(students.filter((p) => p.trackIds?.includes("trk-accelerated"))).toHaveLength(14)
    expect(s.offerings).toHaveLength(110)
  })
})
