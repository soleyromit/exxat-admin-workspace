import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { listFilter, mappingLink, onSkillList, skillReach } from "@/lib/lab/mapping"
import { seedLists, skillLists } from "@/lib/lab/lists"
import { FROM_PARAM, RETURN_TARGETS, returnHref, returnTarget, withFrom } from "@/lib/lab/return-to"
import { labHref } from "@/lib/lab/links"
import { toLong } from "@/lib/short-urls"
import { capitalize, skillListsNoun } from "@/lib/lab/terms"

const src = (p: string) => readFileSync(join(__dirname, "../..", p), "utf8")

describe("Course mapping ?list= (By skill limited to one skill list)", () => {
  const s = labState(createSeed())
  const lists = skillLists(seedLists(s))
  const reach = skillReach(s, {}, "", lists, false)

  it("a known list limits the rows to the skills on it, and only those", () => {
    const list = lists.find((l) => l.skillIds.length > 0)!
    const rows = onSkillList(reach, listFilter(lists, list.id))
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => list.skillIds.includes(r.id))).toBe(true)
    expect(rows.length).toBe(reach.filter((r) => list.skillIds.includes(r.id)).length)
  })

  it("an unknown, empty or missing list id is no filter and does not throw", () => {
    for (const id of ["nope", "", null, undefined]) {
      expect(listFilter(lists, id)).toBeUndefined()
      expect(onSkillList(reach, listFilter(lists, id)).map((r) => r.id)).toEqual(reach.map((r) => r.id))
    }
  })

  it("a link carries list, and the page clears it with the chip", () => {
    expect(mappingLink({ by: "skill", list: "abc" })).toContain("list=abc")
    const views = src("components/lab/admin-a/mapping-views.tsx")
    expect(views).toMatch(/id: "list"[^\n]*query\.set\(\{ list: null, skill: null \}\)/)
    expect(views).toMatch(/chips=\{\[\.\.\.\(listField/)
  })
})

describe("the lists return target", () => {
  it("the crumb says the Skill lists nav word and the href reopens the same list in the short form", () => {
    const t = returnTarget("lists", "list-7")!
    expect(t.label()).toBe(capitalize(skillListsNoun()))
    expect(t.href).toBe("/as/admin/lists-cohorts?list=list-7")
    expect(toLong(t.href)).toBe("/lab/admin/lists-cohorts?list=list-7")
  })

  it("without a list id it returns to the lists page, and an unknown from is no target", () => {
    expect(returnTarget("lists")!.href).toBe("/as/admin/lists-cohorts")
    expect(returnHref("lists", "/x", "a b")).toBe("/as/admin/lists-cohorts?list=a%20b")
    expect(returnTarget("bogus")).toBeUndefined()
    expect(returnTarget("constructor")).toBeUndefined()
    expect(returnHref(null, "/fallback")).toBe("/fallback")
  })

  it("skills keeps working", () => {
    expect(returnTarget("skills", "ignored")!.href).toBe("/as/admin/skills-library")
    expect(Object.keys(RETURN_TARGETS)).toEqual(expect.arrayContaining(["skills", "lists"]))
    expect(withFrom("/lab/admin/x", "lists")).toBe(`/lab/admin/x?${FROM_PARAM}=lists`)
  })

  it("the panel's Map to courses button names the list and where it came from", () => {
    const url = labHref("admin/course-mapping", { by: "skill", list: "list-7", from: "lists" }, {})
    const q = new URL(url, "http://x").searchParams
    expect([q.get("by"), q.get("list"), q.get("from")]).toEqual(["skill", "list-7", "lists"])
    expect(src("components/lab/admin-a/lists-panel.tsx")).toContain('to("admin/course-mapping", { by: "skill", list: list.id, from: "lists" })')
  })
})
