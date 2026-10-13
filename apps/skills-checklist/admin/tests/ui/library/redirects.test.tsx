import { describe, expect, it } from "vitest"
import { LEGACY_REDIRECTS } from "@/lib/redirects"
import { libraryTabHref, parseTab } from "@/components/library/library-page"

const dest = (source: string) => LEGACY_REDIRECTS.find((r) => r.source === source)?.destination

/** Old library and overview URLs keep working: each is a (non-permanent) redirect into the hybrid IA. */
describe("legacy library routes redirect into /skills/*", () => {
  it.each([
    ["/library", "/skills/library"],
    ["/library/skills", "/skills/library"],
    ["/library/categories", "/skills/library?tab=categories"],
    ["/library/tags", "/skills/library?tab=tags"],
    ["/library/settings", "/skills/library?tab=settings"],
    ["/library/lab-instructors", "/skills/library?tab=lab-instructors"],
    ["/library/skills/new", "/skills/library?dialog=add"],
    ["/library/skills/:skillId/configure", "/skills/library?dialog=configure&skill=:skillId"],
    ["/library/import", "/skills/library?dialog=import"],
  ])("%s -> %s", (source, target) => {
    expect(dest(source)).toBe(target)
  })
})

describe("the former Skills nav children redirect to their tab on the Skills page", () => {
  it.each([
    ["/skills/kits", "kits"],
    ["/skills/categories", "categories"],
    ["/skills/tags", "tags"],
    ["/skills/settings", "settings"],
    ["/skills/lab-instructors", "labInstructors"],
  ] as const)("%s -> ?tab= of the %s tab", (source, tab) => {
    expect(dest(source)).toBe(libraryTabHref(tab))
    expect(parseTab(new URL(dest(source) as string, "http://x").searchParams.get("tab"))).toBe(tab)
  })
})

describe("S-02 and S-03 deep links redirect into the attainment dialogs", () => {
  it("/overview/students/:id opens the student level", () => {
    expect(dest("/overview/students/:studentId")).toBe("/attainment?student=:studentId")
  })
  it("/overview/students/:id/skills/:skill opens the evidence ledger", () => {
    expect(dest("/overview/students/:studentId/skills/:skillId")).toBe("/attainment?student=:studentId&skill=:skillId")
  })
  it("no legacy redirect is permanent", () => {
    expect(LEGACY_REDIRECTS.every((r) => r.permanent === false)).toBe(true)
  })
})
