import * as React from "react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { EMPTY_PARAMS, clearFilters, parseParams, toSearch, withFilter } from "@/components/reporting/report-params"

const nav = { search: "", push: vi.fn(), replace: vi.fn() }
vi.mock("next/navigation", () => ({
  usePathname: () => "/attainment",
  useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn(), forward: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: (url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;replace;${url};307;` })
  },
}))

import { OverviewClient } from "@/components/reporting/overview-client"

const sp = (s: string) => new URLSearchParams(s)

describe("URL state for the Overview and its rail (docs/ux/08 P-07)", () => {
  it("a clean overview has a clean URL: defaults are omitted", () => {
    expect(toSearch(EMPTY_PARAMS)).toBe("")
  })

  it("round trips every parameter", () => {
    const p = { ...EMPTY_PARAMS, tab: "skill" as const, filters: { cohortId: "c", groupId: "g", offeringId: "o", categoryId: "k", tagId: "t", locationId: "l", settingId: "s" }, sort: "name" as const, q: "ada", student: "stu-01", skill: "sk-iv", evaluation: "sub-1", showAllEvidence: true }
    expect(parseParams(sp(toSearch(p).slice(1)))).toEqual(p)
  })

  it("keeps the rail levels coherent: a skill needs a student and an evaluation needs both", () => {
    expect(toSearch({ ...EMPTY_PARAMS, skill: "sk-iv" })).toBe("")
    expect(toSearch({ ...EMPTY_PARAMS, student: "stu-01", evaluation: "e" })).toBe("?student=stu-01")
    expect(toSearch({ ...EMPTY_PARAMS, bySkill: "sk-iv" })).toBe("?bySkill=sk-iv")
    expect(toSearch({ ...EMPTY_PARAMS, bySkill: "sk-iv", student: "stu-01" })).toBe("?student=stu-01")
  })

  it("falls back to defaults for unknown tab or sort values", () => {
    const p = parseParams(sp("tab=nope&sort=nope"))
    expect(p.tab).toBe("student")
    expect(p.sort).toBe(EMPTY_PARAMS.sort)
  })

  it("removing a cohort removes its group; clearing removes every filter and the show-all choice", () => {
    const p = { ...EMPTY_PARAMS, filters: { cohortId: "c", groupId: "g", settingId: "s" }, showAllEvidence: true }
    expect(withFilter(p, "cohortId", undefined).filters).toEqual({ settingId: "s" })
    expect(clearFilters(p)).toMatchObject({ filters: {}, showAllEvidence: false })
  })
})

describe("OverviewClient keeps view state in the address bar", () => {
  beforeEach(() => {
    nav.search = ""
    nav.push.mockReset()
    nav.replace.mockReset()
  })
  const mount = () =>
    render(
      <TooltipProvider>
        <OverviewClient />
      </TooltipProvider>,
    )

  it("opening a student pushes a history entry (so Back mirrors the level) without scrolling the page", async () => {
    nav.search = "q=olivia"
    mount()
    await userEvent.setup().click(screen.getAllByRole("button", { name: /^Olivia Martin/ })[0])
    expect(nav.push).toHaveBeenCalledWith("/attainment?q=olivia&student=stu-01", { scroll: false })
  })

  it("changing the search replaces the entry instead of stacking history", async () => {
    mount()
    await userEvent.setup().type(screen.getByRole("textbox", { name: "Search students" }), "z")
    expect(nav.replace).toHaveBeenCalledWith("/attainment?q=z", { scroll: false })
    expect(nav.push).not.toHaveBeenCalled()
  })

  it("reopens the same view from a shared link: filters, tab and rail level all come from the URL", async () => {
    nav.search = "tab=skill&cohort=coh-bsn26&student=stu-01&skill=sk-iv"
    mount()
    expect(screen.getByRole("button", { name: "Remove filter Cohort BSN 2026", hidden: true })).toBeInTheDocument()
    const dialog = await screen.findByRole("dialog", { name: "Olivia Martin" })
    expect(within(dialog).getByTestId("ledger-sk-iv")).toBeInTheDocument()
  })
})
