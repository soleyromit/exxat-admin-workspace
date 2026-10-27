import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { EMPTY_SCOPE, clearFilters, removeScope, withBasis, withDidactic, type LabScope } from "@/lib/lab/scope"
import { ScopeBar, ScopeContext, appliedChips } from "@/components/lab/dashboard/scope-bar"

/**
 * Romit 2026-10-27: "looks clunky with so many dropdowns and asking user to refresh for the latest data". One Filters button,
 * applied values as removable chips (REQ RP-01), Clear all, the term and course scope in the header subtitle, no Refresh.
 */
const root = join(__dirname, "..", "..")
const src = (p: string) => readFileSync(join(root, p), "utf8")

const options = {
  terms: [{ value: "Spring 2026", label: "Spring 2026" }],
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

  it("the header subtitle names the term, the course scope and when the figures were read", () => {
    render(<ScopeContext termName="Fall 2026" scope={EMPTY_SCOPE} at={new Date()} />)
    expect(screen.getByText("Fall 2026 · Clinical courses")).toBeTruthy()
    expect(screen.getByText(/Updated just now/)).toBeTruthy()
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
