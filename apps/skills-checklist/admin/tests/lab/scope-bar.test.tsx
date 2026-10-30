import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { EMPTY_SCOPE, clearFilters, removeScope, withBasis, withDidactic, type LabScope } from "@/lib/lab/scope"
import { ScopeBar, appliedChips } from "@/components/lab/dashboard/scope-bar"

/**
 * Romit 2026-10-27: "looks clunky with so many dropdowns and asking user to refresh for the latest data". One Filters button,
 * applied values as removable chips (REQ RP-01), Clear all, no Refresh. D-L8b (2026-10-30): no header subtitle and no "Updated"
 * time; the term and course scope are said beside Filters, in the toolbar of the table or chart it filters.
 */
const root = join(__dirname, "..", "..")
const src = (p: string) => readFileSync(join(root, p), "utf8")

const options = {
  terms: [{ value: "Fall 2026", label: "Fall 2026" }, { value: "Spring 2026", label: "Spring 2026" }],
  currentTerm: "Fall 2026",
  cohorts: ["BSN 2028"],
  groups: [{ value: "Group A", label: "Group A" }],
  courses: [
    { value: "crs-nur101", label: "NUR 101", kind: "clinical" as const },
    { value: "crs-nur050", label: "NUR 050", kind: "didactic" as const },
  ],
  categories: [{ value: "Mobility", label: "Mobility" }],
  tags: [{ value: "Patient safety", label: "Patient safety" }],
  locations: [{ value: "Skills lab 2", label: "Skills lab 2" }],
  settings: [{ value: "clinical", label: "Clinical" }],
}

function bar(scope: LabScope, onChange = vi.fn(), showBasis = true) {
  const r = render(
    <TooltipProvider>
      <ScopeBar scope={scope} options={options as never} termName="Fall 2026" onChange={onChange} chipValue={(_k, v) => v} showBasis={showBasis} />
    </TooltipProvider>,
  )
  return { onChange, ...r }
}

describe("scope bar: one Filters button, removable chips, no refresh", () => {
  it("shows exactly one control when nothing is applied: the Filters button, no count, no chips", () => {
    const { container } = bar(EMPTY_SCOPE)
    const buttons = container.querySelectorAll("button, [role=combobox]")
    expect(buttons.length).toBe(1)
    expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy()
    expect(screen.queryByLabelText("Applied filters")).toBeNull()
  })

  it("renders every applied value as a chip and counts them on the Filters button", () => {
    const scope: LabScope = { ...EMPTY_SCOPE, cohort: "BSN 2028", tag: "Patient safety", basis: "median" }
    bar(scope)
    const chips = within(screen.getByLabelText("Applied filters"))
    for (const name of [/Remove Cohort BSN 2028/, /Remove Tag Patient safety/, /Remove Compare with Peer median/]) expect(chips.getByRole("button", { name })).toBeTruthy()
    expect(screen.getByRole("button", { name: /Filters\s*3 applied/ })).toBeTruthy()
  })

  it("each chip removes only itself", () => {
    const scope: LabScope = { ...EMPTY_SCOPE, cohort: "BSN 2028", tag: "Patient safety", basis: "median" }
    const { onChange } = bar(scope)
    fireEvent.click(screen.getByRole("button", { name: /Remove Cohort BSN 2028/ }))
    expect(onChange).toHaveBeenLastCalledWith(removeScope(scope, "cohort"))
    fireEvent.click(screen.getByRole("button", { name: /Remove Tag Patient safety/ }))
    expect(onChange).toHaveBeenLastCalledWith(removeScope(scope, "tag"))
    fireEvent.click(screen.getByRole("button", { name: /Remove Compare with/ }))
    expect(onChange).toHaveBeenLastCalledWith(withBasis(scope, "expected"))
  })

  it("the didactic chip returns to clinical only and drops a didactic course with it", () => {
    const scope: LabScope = withDidactic({ ...EMPTY_SCOPE, course: "crs-nur050" }, true)
    const { onChange } = bar(scope)
    fireEvent.click(screen.getByRole("button", { name: /Remove Courses Clinical and didactic/ }))
    expect(onChange).toHaveBeenLastCalledWith(withDidactic(removeScope(scope, "course"), false))
  })

  it("Clear all returns to the default scope", () => {
    const scope: LabScope = { ...EMPTY_SCOPE, cohort: "BSN 2028", cat: "Mobility", term: "Spring 2026", basis: "all" }
    const { onChange } = bar(scope)
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }))
    expect(onChange).toHaveBeenLastCalledWith(withBasis(clearFilters(scope), "expected"))
    expect(onChange.mock.lastCall?.[0]).toEqual(EMPTY_SCOPE)
  })

  it("leaves Compare with out of the chips where the page does not offer it", () => {
    expect(appliedChips({ ...EMPTY_SCOPE, basis: "median" }, (_k, v) => v, { showBasis: false })).toHaveLength(0)
  })

  it("has no refresh button and no as-of text", () => {
    const { container } = bar({ ...EMPTY_SCOPE, cohort: "BSN 2028" })
    expect(screen.queryByRole("button", { name: /refresh/i })).toBeNull()
    expect(container.textContent).not.toMatch(/As of|Refresh/)
  })

  it("says the default term and course scope beside Filters, with no Updated time (D-L8b, RP-01)", () => {
    const { container } = bar(EMPTY_SCOPE)
    expect(screen.getByText("Fall 2026 · Clinical courses")).toBeTruthy()
    expect(container.textContent).not.toMatch(/Updated/)
  })

  it("the current term named in the URL is the default: no chip, no count", () => {
    bar({ ...EMPTY_SCOPE, term: "Fall 2026" })
    expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy()
    expect(screen.queryByLabelText("Applied filters")).toBeNull()
    expect(screen.getByText("Fall 2026 · Clinical courses")).toBeTruthy()
  })

  it("another term is an applied chip, counted and removable on its own; the summary keeps the course scope", () => {
    const scope: LabScope = { ...EMPTY_SCOPE, term: "Spring 2026", cohort: "BSN 2028" }
    const { onChange } = bar(scope)
    expect(screen.getByRole("button", { name: /Filters\s*2 applied/ })).toBeTruthy()
    expect(screen.getByText("Clinical courses")).toBeTruthy()
    fireEvent.click(within(screen.getByLabelText("Applied filters")).getByRole("button", { name: /Remove Term Spring 2026/ }))
    expect(onChange).toHaveBeenLastCalledWith(removeScope(scope, "term"))
  })

  it("the stale demo shows its one warning beside the chips", () => {
    render(
      <TooltipProvider>
        <ScopeBar scope={EMPTY_SCOPE} options={options as never} termName="Fall 2026" onChange={vi.fn()} chipValue={(_k, v) => v} stale />
      </TooltipProvider>,
    )
    expect(screen.getByText("Figures from yesterday, 18:00")).toBeTruthy()
  })

  it("no reporting page renders a header subtitle or an Updated time (D-L8b)", () => {
    for (const f of ["components/lab/dashboard/frame.tsx", "components/lab/dashboard/ops-frame.tsx", "components/lab/admin-b/attainment-page.tsx", "components/lab/director/frame.tsx", "components/lab/reviewer/approvals-frame.tsx", "components/lab/rbac/students-frame.tsx", "components/lab/screens/admin-dashboard-drill.tsx", "components/lab/screens/admin-dashboard-drill-b.tsx", "components/lab/screens/admin-export-b.tsx"]) {
      expect(src(f), f).not.toMatch(/ScopeContext|subtitle=\{/)
    }
    expect(src("components/lab/dashboard/scope-bar.tsx")).not.toMatch(/Updated \$\{|useRelativeTime/)
  })

  it("no reporting page renders a Refresh figures button or the Refresh to update line", () => {
    for (const f of ["components/lab/dashboard/scope-bar.tsx", "components/lab/dashboard/frame.tsx", "components/lab/dashboard/ops-frame.tsx", "components/lab/admin-b/attainment-page.tsx"]) {
      expect(src(f)).not.toMatch(/Refresh figures|Refresh to update|fa-arrows-rotate/)
    }
  })

  it("dashboard A shows every view: no collapsed group, no riddle titles", () => {
    const a = src("components/lab/screens/admin-dashboard-a.tsx")
    expect(a).not.toMatch(/Collapsible|MoreViews|more views/)
    const tiles = src("components/lab/dashboard/status-tiles.tsx")
    expect(tiles).not.toMatch(/title=\{?["`][^"`]*\?["`]/)
  })
})
