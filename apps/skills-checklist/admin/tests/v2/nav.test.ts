import { describe, expect, it } from "vitest"
import { buildV2Nav } from "@/components/v2/v2-nav"
import { v2CrumbsFor } from "@/components/v2/v2-titles"
import { allKnownUrls, NAV_ROWS, ROLE_BY_ID, ROLES } from "@/lib/v2/roles"
import { createSeed, IDS } from "@/lib/v2/seed"
import { approvalsBadgeCount } from "@/lib/v2/approvals"
import { waitingFor } from "@/lib/v2/preceptor"
import { unsentEntries } from "@/lib/v2/student"
import type { RoleId } from "@/lib/v2/types"

const seed = createSeed()
const rows = (role: RoleId, actor = IDS.delgado) => buildV2Nav(role, seed, actor)
const pairs = (role: RoleId) => rows(role).map((r) => [r.title, r.url])

describe("nav rows per role", () => {
  it("administrator", () => {
    expect(pairs("admin")).toEqual([
      ["Dashboard", "/v2/admin"],
      ["Skills library", "/v2/admin/starter-library"],
      ["Courses", "/v2/admin/map-courses"],
      ["Review and approve", "/v2/admin/review-queue"],
      ["Outcomes", "/v2/admin/outcomes"],
      ["Records", "/v2/admin/verification"],
      ["Reports", "/v2/admin/reports"],
    ])
  })
  it("reviewer", () => {
    expect(pairs("reviewer")).toEqual([
      ["Review and approve", "/v2/reviewer/review-queue"],
      ["Outcomes", "/v2/reviewer/outcome-remediation"],
      ["Records", "/v2/reviewer/verification"],
    ])
  })
  it("director", () => {
    expect(pairs("director")).toEqual([
      ["Outcomes", "/v2/director/outcomes"],
      ["Records", "/v2/director/director-verification"],
      ["Reports", "/v2/director/reports"],
    ])
  })
  it("shared rows keep one relative order for every role: Outcomes, Records, Reports", () => {
    const order = ["Outcomes", "Records", "Reports"]
    for (const role of ["admin", "reviewer", "director"] as RoleId[]) {
      const titles = rows(role).map((r) => r.title).filter((t) => order.includes(t))
      expect(titles, role).toEqual(order.filter((t) => titles.includes(t)))
    }
  })
  it("every role has an explicit landing; the director lands on Records although it is the second row", () => {
    for (const r of ROLES) expect(r.landing, r.id).toMatch(/^\/v2\//)
    expect(ROLE_BY_ID.director.landing).toBe("/v2/director/director-verification")
    expect(NAV_ROWS.director[1].url).toBe(ROLE_BY_ID.director.landing)
    expect(NAV_ROWS.reviewer[0].url).toBe(ROLE_BY_ID.reviewer.landing)
    expect(NAV_ROWS.preceptor[0].url).toBe(ROLE_BY_ID.preceptor.landing)
  })
  it("preceptor", () => {
    expect(pairs("preceptor")).toEqual([
      ["Requests", "/v2/preceptor/preceptor-evaluation"],
      ["Lab sessions", "/v2/preceptor/lab-batch-grid"],
    ])
  })
  it("student", () => {
    expect(pairs("student")).toEqual([
      ["Home", "/v2/student"],
      ["Log skills", "/v2/student/pick-and-rate"],
      ["Requests", "/v2/student/request-signoff"],
      ["Record", "/v2/student/history"],
    ])
  })
  it("no title carries a step, scenario or number", () => {
    for (const r of ROLES) for (const row of rows(r.id)) expect(row.title).not.toMatch(/step|scenario|^\d/i)
  })
  it("every row url is a known url", () => {
    const known = new Set(allKnownUrls())
    for (const r of ROLES) for (const row of NAV_ROWS[r.id]) expect(known.has(row.url)).toBe(true)
  })
})

describe("nav badges", () => {
  it("count the work waiting and are omitted at 0", () => {
    const approvals = approvalsBadgeCount(seed)
    const waiting = waitingFor(seed, IDS.delgado).length
    const unsent = unsentEntries(seed).length
    expect(rows("admin")[3].badge).toBe(approvals > 0 ? approvals : undefined)
    expect(rows("reviewer")[0].badge).toBe(approvals > 0 ? approvals : undefined)
    expect(rows("preceptor")[0].badge).toBe(waiting > 0 ? waiting : undefined)
    expect(rows("student")[2].badge).toBe(unsent > 0 ? unsent : undefined)
  })
  it("hides a badge when nothing is waiting", () => {
    const empty = { ...seed, evaluations: [], submissions: [], logEntries: [] }
    expect(buildV2Nav("admin", empty, IDS.delgado)[3]).not.toHaveProperty("badge")
    expect(buildV2Nav("preceptor", empty, IDS.delgado)[0]).not.toHaveProperty("badge")
    expect(buildV2Nav("student", empty, IDS.delgado)[2]).not.toHaveProperty("badge")
  })
})

describe("breadcrumbs", () => {
  const q = (s: string) => new URLSearchParams(s)
  it("shows a single crumb on a nav row", () => {
    expect(v2CrumbsFor("/v2/admin/starter-library")).toEqual([{ label: "Skills library" }])
    expect(v2CrumbsFor("/v2/admin")).toEqual([{ label: "Dashboard" }])
    expect(v2CrumbsFor("/v2/student/history")).toEqual([{ label: "Record" }])
  })
  it("puts the parent nav row first on a sub-page", () => {
    const cases: [string, string, string, string][] = [
      ["/v2/admin/configure-skill", "", "Skills library", "Configure skill"],
      ["/v2/admin/validate-publish", "", "Skills library", "Review and publish"],
      ["/v2/admin/review-queue/abc", "", "Review and approve", "Review item"],
      ["/v2/reviewer/evaluation/e1", "", "Outcomes", "Evaluation"],
      ["/v2/director/remediation/r1", "", "Outcomes", "Remediation plan"],
      ["/v2/director/verification/s1", "", "Records", "Program record"],
      ["/v2/director/director-verification/s1", "", "Records", "Program record"],
      ["/v2/preceptor/preceptor-evaluation", "request=x", "Requests", "Evaluation"],
      ["/v2/student/offline-sync", "", "Home", "Sync and offline"],
      ["/v2/student/remediation/r1", "", "Home", "Remediation plan"],
      ["/v2/student/verified-record", "", "Record", "Share verified record"],
      ["/v2/student/evaluation/e1", "", "Record", "Evaluation"],
    ]
    for (const [path, search, parent, page] of cases) {
      const c = v2CrumbsFor(path, q(search))
      expect(c.map((x) => x.label), path).toEqual([parent, page])
      expect(c[0].href, path).toBeTruthy()
      expect(c[1].href, path).toBeUndefined()
    }
  })
  it("links the first crumb to the parent nav row", () => {
    expect(v2CrumbsFor("/v2/admin/configure-skill")[0].href).toBe("/v2/admin/starter-library")
    expect(v2CrumbsFor("/v2/director/evaluation/e1")[0].href).toBe("/v2/director/outcomes")
  })
  it("has no step numbers or scenario wording", () => {
    for (const p of ["/v2/admin/map-courses", "/v2/reviewer/outcome-remediation", "/v2/preceptor/lab-batch-grid"]) expect(v2CrumbsFor(p)[0].label).not.toMatch(/\d|scenario|step/i)
  })
})
