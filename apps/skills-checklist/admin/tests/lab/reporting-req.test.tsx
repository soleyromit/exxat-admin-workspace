import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { createSeed } from "@/lib/v2/seed"
import { explainScope } from "@/lib/lab/dashboard"
import { EMPTY_SCOPE, removeScope, type LabScope } from "@/lib/lab/scope"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"
import { ImpossibleScopeBanner, IMPOSSIBLE_TITLE } from "@/components/lab/dashboard/impossible-scope"
import { buildReadiness, filterRows, graduatingCohort, reportModel } from "@/lib/lab/director"
import { RECORD_STATE_META } from "@/lib/v2/labels"

const seed = createSeed()
const root = join(__dirname, "..", "..")
const src = (p: string) => readFileSync(join(root, p), "utf8")

const options = {
  terms: [{ value: "Fall 2026", label: "Fall 2026" }],
  cohorts: ["BSN 2028"],
  groups: [{ value: "Group A", label: "Group A" }],
  courses: [{ value: "crs-nur101", label: "NUR 101", kind: "clinical" as const }],
  categories: [{ value: "Mobility", label: "Mobility" }],
  tags: [{ value: "Patient safety", label: "Patient safety" }],
  locations: [{ value: "Skills lab 2", label: "Skills lab 2" }],
  settings: [{ value: "clinical", label: "Clinical" }],
}

function bar(scope: LabScope, onChange = vi.fn()) {
  render(
    <TooltipProvider>
      <ScopeBar scope={scope} options={options as never} termName="Fall 2026" onChange={onChange} chipValue={(_k, v) => v} />
    </TooltipProvider>,
  )
  return onChange
}

describe("RP-01: what is applied is evident, each filter removable on its own", () => {
  // REQ RP-01: "Reporting must be filterable by cohort, group, clinical course, category, tag, location and setting. What is
  // currently applied must be evident, and each filter removable on its own."
  it("shows every applied popover filter as a chip on the bar, without opening Filters", () => {
    bar({ ...EMPTY_SCOPE, group: "Group A", cat: "Mobility", tag: "Patient safety", loc: "Skills lab 2", setting: "clinical" })
    const chips = within(screen.getByLabelText("Applied filters"))
    for (const name of [/Remove Group Group A/, /Remove Category Mobility/, /Remove Tag Patient safety/, /Remove Location Skills lab 2/, /Remove Setting clinical/i]) expect(chips.getByRole("button", { name })).toBeTruthy()
    expect(screen.queryByRole("dialog")).toBeNull()
  })
  it("removing one chip removes that filter only", () => {
    const scope = { ...EMPTY_SCOPE, cat: "Mobility", tag: "Patient safety" }
    const onChange = bar(scope)
    fireEvent.click(screen.getByRole("button", { name: /Remove Category Mobility/ }))
    expect(onChange).toHaveBeenCalledWith(removeScope(scope, "cat"))
  })
  it("shows no chip row when nothing is applied (the default view is unchanged)", () => {
    bar(EMPTY_SCOPE)
    expect(screen.queryByLabelText("Applied filters")).toBeNull()
  })
  it("every reporting screen uses the shared scope bar (19 variants)", () => {
    for (const f of ["components/lab/dashboard/frame.tsx", "components/lab/dashboard/ops-frame.tsx", "components/lab/admin-b/attainment-page.tsx", "components/lab/director/frame.tsx", "components/lab/screens/admin-dashboard-drill.tsx", "components/lab/screens/admin-dashboard-drill-b.tsx", "components/lab/screens/admin-export-b.tsx"]) expect(src(f)).toMatch(/<ScopeBar|<ScopeFiltersButton/)
  })
})

describe("RP-09: a filter combination that cannot produce evidence is explained", () => {
  // REQ RP-09: "A filter combination that cannot produce evidence (a location that does not offer the chosen setting) must be
  // explained rather than returned as an empty result."
  const impossible = { ...EMPTY_SCOPE, loc: "Simulation lab", setting: "clinical" }
  it("explainScope names the conflict and the filters to remove; null for a possible scope", () => {
    const e = explainScope(seed, impossible)
    expect(e?.text).toMatch(/does not offer/)
    expect(e!.remove.map((r) => r.key).sort()).toEqual(["loc", "setting"])
    expect(explainScope(seed, EMPTY_SCOPE)).toBeNull()
  })
  it("the banner explains and offers one Remove per offending filter", () => {
    const onChange = vi.fn()
    render(<ImpossibleScopeBanner state={seed} scope={impossible} onChange={onChange} />)
    expect(screen.getByText(IMPOSSIBLE_TITLE)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Remove location" }))
    expect(onChange).toHaveBeenCalledWith(removeScope(impossible, "loc"))
  })
  it("renders nothing for a scope that can produce evidence", () => {
    const { container } = render(<ImpossibleScopeBanner state={seed} scope={EMPTY_SCOPE} onChange={() => {}} />)
    expect(container.textContent).toBe("")
  })
  it("every non-dashboard reporting screen calls it in place of its figures (drill, attainment and export A, export B, director)", () => {
    for (const f of ["components/lab/admin-b/attainment-page.tsx", "components/lab/director/frame.tsx", "components/lab/screens/admin-dashboard-drill.tsx", "components/lab/screens/admin-dashboard-drill-b.tsx", "components/lab/screens/admin-export-b.tsx"]) expect(src(f)).toMatch(/ImpossibleScopeBanner/)
  })
})

describe("AE-04: director reports keep the four engine states apart (OD-03 not decided)", () => {
  // REQ AE-04: "Four states are distinguished: no evidence yet; evidence exists but none qualifies; some qualifying evidence with
  // criteria not yet met; and achieved."
  const scope = { ...EMPTY_SCOPE, cohort: graduatingCohort(seed)!, term: "Fall 2026" }
  const m = buildReadiness(seed, scope)
  const r = reportModel(m)
  it("each student row splits into achieved, in progress, does not qualify and no evidence, summing to required", () => {
    for (const s of r.students) {
      expect(s.achieved + s.progress + s.unqualified + s.noEvidence).toBe(s.required)
      expect(s.notMet).toBe(s.unqualified + s.noEvidence)
    }
  })
  it("each skill row sums to the students in scope, and both separated lists have the length of their figure", () => {
    for (const k of r.skills) {
      expect(k.achieved + k.progress + k.unqualified + k.noEvidence).toBe(k.students)
      expect(filterRows(m.rows, { list: "unqualified", skill: k.id }).length).toBe(k.unqualified)
      expect(filterRows(m.rows, { list: "noevidence", skill: k.id }).length).toBe(k.noEvidence)
    }
  })
  it("the data has both states, so the split is visible (not a merge by accident)", () => {
    expect(r.skills.some((k) => k.unqualified > 0)).toBe(true)
    expect(r.skills.some((k) => k.noEvidence > 0)).toBe(true)
  })
  it("the report columns use the engine state words and no merged Unmet column", () => {
    const t = src("components/lab/director/reports.tsx")
    expect(t).not.toMatch(/label: "Unmet"/)
    expect(t).toMatch(/RECORD_STATE_META\.unqualified\.label/)
    expect(t).toMatch(/RECORD_STATE_META\.none\.label/)
    expect(RECORD_STATE_META.unqualified.label).toBe("Evidence does not qualify")
    expect(RECORD_STATE_META.none.label).toBe("No evidence yet")
  })
})

// Romit 2026-10-27 on Reports: "can we improve the UI here?" and "is this placed correctly here?"
describe("Reports toolbar: one set control beside Filters, order shown by the table's sort", () => {
  it("the set control is one radiogroup: Required this term | Required to graduate, plus All skills where offered", async () => {
    const { RequiredSetControl } = await import("@/components/lab/admin-b/required-set-switch")
    const onChange = vi.fn()
    const paramsFor = (k: string) => ({ required: k === "toGraduate" ? "graduate" : null, skills: null, peek: null })
    const { unmount } = render(<RequiredSetControl basis="thisTerm" allSkills={false} paramsFor={paramsFor} onChange={onChange} />)
    const radios = within(screen.getByRole("radiogroup")).getAllByRole("radio")
    expect(radios.map((r) => r.textContent)).toEqual(["Required this term", "Required to graduate", "All skills"])
    expect(radios[0].getAttribute("aria-checked")).toBe("true")
    fireEvent.click(radios[2])
    expect(onChange).toHaveBeenLastCalledWith({ skills: "all", peek: null })
    fireEvent.click(radios[1])
    expect(onChange).toHaveBeenLastCalledWith({ required: "graduate", skills: null, peek: null })
    unmount()
    render(<RequiredSetControl basis="toGraduate" paramsFor={paramsFor} onChange={onChange} />)
    const two = within(screen.getByRole("radiogroup")).getAllByRole("radio")
    expect(two).toHaveLength(2)
    expect(two[1].getAttribute("aria-checked")).toBe("true")
  })
  it("admin and director Reports put the set control beside Filters, with no order sentence or Show links", () => {
    const page = src("components/lab/admin-b/attainment-page.tsx")
    // Admin Reports (Romit 2026-10-30, the dashboard treatment): Filters in the header actions; the set control leads the body
    // toolbar with the applied chips beside it only when something is applied.
    expect(page).toMatch(/actions=\{[\s\S]{0,40}<ScopeFiltersButton/)
    expect(page).toMatch(/data-region="toolbar"[\s\S]{0,200}<RequiredSetControl[\s\S]{0,300}<ScopeAppliedLine/)
    // D-L8c: the director's Attainment is a tab of the merged Reports page; the set control rides the toolbar on that tab only.
    const director = src("components/lab/director/reports-page.tsx")
    expect(director).toMatch(/toolbar=\{attainment \? \(ctx\) => <AttainmentSetControl/)
    expect(src("components/lab/director/frame.tsx")).toMatch(/data-region="toolbar"[\s\S]{0,120}toolbar\(ctx\)[\s\S]{0,120}<ScopeBar/)
    for (const t of [page, director]) {
      expect(t).not.toMatch(/most not (yet )?achieved first/)
      expect(t).not.toMatch(/Show all \$\{|Show only|RequiredSetSwitch/)
    }
  })
  it("every report table opens sorted on Achieved ascending, with aria-sort on the header (key equals sortKey)", async () => {
    const { DEFAULT_SORT } = await import("@/components/lab/admin-b/attainment-tables")
    expect(DEFAULT_SORT).toEqual({ key: "pct_achieved", dir: "asc" })
    const t = src("components/lab/admin-b/attainment-tables.tsx")
    expect(t.match(/defaultSort=\{DEFAULT_SORT\}/g)).toHaveLength(3)
    expect(t).toMatch(/sortKey: c\.key/)
  })
})
