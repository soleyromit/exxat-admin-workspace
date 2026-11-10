import { describe, expect, it } from "vitest"
import { linkTo } from "@/lib/v2/link-to"

describe("linkTo", () => {
  it("sends the student record to the right records route for each role", () => {
    expect(linkTo({ role: "admin", kind: "student", id: "stu-maya" })).toBe("/v2/admin/verification/stu-maya")
    expect(linkTo({ role: "reviewer", kind: "student", id: "stu-maya" })).toBe("/v2/reviewer/verification/stu-maya")
    expect(linkTo({ role: "director", kind: "student", id: "stu-maya" })).toBe("/v2/director/director-verification/stu-maya")
  })
  it("has no student record for roles that cannot open one", () => {
    expect(() => linkTo({ role: "student", kind: "student", id: "x" })).toThrow()
    expect(() => linkTo({ role: "preceptor", kind: "student", id: "x" })).toThrow()
  })
  it("links an evaluation for every role", () => {
    expect(linkTo({ role: "admin", kind: "record", id: "ev-1" })).toBe("/v2/admin/evaluation/ev-1")
    expect(linkTo({ role: "student", kind: "record", id: "ev-1" })).toBe("/v2/student/evaluation/ev-1")
  })
  it("links skills, review items and reports only where the role has the page", () => {
    expect(linkTo({ role: "admin", kind: "skill", id: "sk-1" })).toBe("/v2/admin/configure-skill?skill=sk-1")
    expect(() => linkTo({ role: "director", kind: "skill", id: "sk-1" })).toThrow()
    expect(linkTo({ role: "reviewer", kind: "review", id: "q-1" })).toBe("/v2/reviewer/review-queue/q-1")
    expect(() => linkTo({ role: "director", kind: "review", id: "q-1" })).toThrow()
    expect(linkTo({ role: "director", kind: "reports" })).toBe("/v2/director/reports")
    expect(() => linkTo({ role: "reviewer", kind: "reports" })).toThrow()
  })
  it("escapes ids", () => {
    expect(linkTo({ role: "admin", kind: "student", id: "a b/c" })).toBe("/v2/admin/verification/a%20b%2Fc")
  })
})
