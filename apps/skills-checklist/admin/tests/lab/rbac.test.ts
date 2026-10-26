import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { approvalsBadgeCount } from "@/lib/v2/approvals"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { labState, reviewRows, reviewerStudents, scopeRows } from "@/lib/lab/reviewer"
import { ROLE_PERMISSIONS, SHOW_PAGE_ROLE_CHIP, approvalRules, can } from "@/lib/lab/rbac"
import { SCREENS, findScreen } from "@/lib/lab/screens"

const seed = createSeed()
const state = labState(seed)
const rows = reviewRows(state)
const inScope = scopeRows(state, rows, EMPTY_SCOPE).rows
const root = path.resolve(__dirname, "../..")

describe("role is a permission, not a path", () => {
  it("gives the admin every reviewer permission plus approval rules, and the director read and export only", () => {
    for (const p of ROLE_PERMISSIONS.reviewer) expect(can("admin", p)).toBe(true)
    expect(can("admin", "configureApprovalRules")).toBe(true)
    expect(can("reviewer", "configureApprovalRules")).toBe(false)
    expect(can("director", "export")).toBe(true)
    expect(can("director", "configure")).toBe(false)
    expect(can("director", "approve")).toBe(false)
  })

  it("puts no role chip on a page (strategy/01 7.2: the chip lives in the bar's role switch)", () => {
    expect(SHOW_PAGE_ROLE_CHIP).toBe(false)
    for (const f of ["admin-approvals-a.tsx", "admin-approvals-b.tsx", "director-attainment-a.tsx", "director-attainment-b.tsx"]) {
      expect(fs.readFileSync(path.join(root, "components/lab/screens", f), "utf8")).not.toMatch(/acting as/i)
    }
  })

  it("reuses the reviewer queue for admin Approvals A and the admin Attainment pieces for the director", () => {
    expect(fs.readFileSync(path.join(root, "components/lab/screens/admin-approvals-a.tsx"), "utf8")).toContain("ReviewerApprovalsA")
    const dir = fs.readFileSync(path.join(root, "components/lab/rbac/director-attainment.tsx"), "utf8")
    for (const piece of ["StudentMatrix", "SkillsTable", "EvidencePeek", "ExportPanel", "buildAttainment"]) expect(dir).toContain(piece)
    expect(dir).not.toMatch(/configure-skill|configureHref/)
  })

  it("registers the three permission screens with 2 or more variants, all built", () => {
    for (const key of ["admin/approvals", "reviewer/students", "director/attainment"]) {
      const [p, slug] = key.split("/")
      const s = findScreen(p, slug)!
      expect(s.variants.length, key).toBeGreaterThanOrEqual(2)
      for (const v of s.variants) expect(v.file, `${key}/${v.id}`).toBeTruthy()
    }
    expect(SCREENS.filter((s) => s.persona === "evaluator" && ["submitted", "expired", "invitation-email"].includes(s.slug)).every((s) => s.variants.length === 3)).toBe(true)
  })
})

describe("approval rules agree with the queue", () => {
  const m = approvalRules(state, inScope)
  it("splits the queue in scope into held by a rule and other reasons, adding up to the Approvals count", () => {
    expect(m.ruleHeld + m.otherReasons).toBe(inScope.length)
    expect(inScope.length).toBe(approvalsBadgeCount(state, EMPTY_SCOPE))
  })
  it("counts per skill only submissions that include that skill, never more than are held by a rule", () => {
    for (const r of m.rules) {
      expect(r.holding).toBeLessThanOrEqual(m.ruleHeld)
      expect(r.students).toBeLessThanOrEqual(r.holding)
    }
    expect(m.rules.filter((r) => r.setting).length).toBe(m.ruleCount)
    expect(m.rules.reduce((n, r) => n + r.holding, 0)).toBeGreaterThanOrEqual(m.ruleHeld)
  })
})

describe("reviewer students list at scale", () => {
  const list = reviewerStudents(state, rows, EMPTY_SCOPE)
  const f = facts(state, EMPTY_SCOPE)
  it("lists every student in scope (123), the same count as the facts registry", () => {
    expect(list.rows.length).toBe(f.studentsInScope)
    expect(list.rows.length).toBeGreaterThanOrEqual(100)
  })
  it("agrees with the dashboard on who is behind and with Approvals on what waits", () => {
    expect(list.rows.filter((r) => r.behind).length).toBe(f.behind)
    expect(list.behind).toBe(f.behind)
    expect(list.behind + list.onTrack).toBe(list.rows.length)
    expect(list.cohorts.reduce((n, c) => n + c.behind, 0)).toBe(f.behind)
    expect(list.waitingStudents).toBe(list.counts.aging + list.counts.approval)
    expect(list.waitingTotal).toBe(f.awaitingApproval)
    expect(list.rows.reduce((n, r) => n + r.waiting, 0)).toBeLessThanOrEqual(list.waitingTotal)
  })
  it("puts needs-attention first and the attention counts add up", () => {
    const order = ["aging", "approval", "behind", "none"]
    for (let i = 1; i < list.rows.length; i++) expect(order.indexOf(list.rows[i - 1].attention)).toBeLessThanOrEqual(order.indexOf(list.rows[i].attention))
    expect(Object.values(list.counts).reduce((a, b) => a + b, 0)).toBe(list.rows.length)
    expect(list.cohorts.reduce((n, c) => n + c.rows.length, 0)).toBe(list.rows.length)
  })
  it("says what is needed in plain words, never items", () => {
    for (const r of list.rows) {
      expect(r.next.length).toBeGreaterThan(5)
      expect(r.next).not.toMatch(/\bitems\b/)
    }
  })
})

describe("copy in the new files", () => {
  const files = [
    ...fs.readdirSync(path.join(root, "components/lab/rbac")).map((f) => `components/lab/rbac/${f}`),
    ...fs.readdirSync(path.join(root, "components/lab/screens")).filter((f) => /^(admin-approvals|reviewer-students|director-attainment)-/.test(f)).map((f) => `components/lab/screens/${f}`),
    "lib/lab/rbac.ts",
  ]
  it("has no em dash and never says items", () => {
    for (const f of files) {
      const src = fs.readFileSync(path.join(root, f), "utf8")
      expect(src.includes("—"), f).toBe(false)
      expect(/(?<![\w-])items(?![\w-])/i.test(src), f).toBe(false)
    }
  })
})
