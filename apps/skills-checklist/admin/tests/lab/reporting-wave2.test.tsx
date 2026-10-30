import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { createSeed } from "@/lib/v2/seed"
import { buildDashboard } from "@/lib/lab/dashboard"
import { EMPTY_SCOPE, type LabScope } from "@/lib/lab/scope"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"

/**
 * Wave 2 re-check of the reporting P1 rows (req-coverage-lab.md rows 18 to 20). RP-01, RP-09 and AE-04 were already met in code
 * when this ran; these tests pin the three behaviours the brief asked for and the two seams found at runtime.
 * Runtime companion (every variant, dev server): tests/lab/reporting-runtime.mjs.
 */
const seed = createSeed()
const root = join(__dirname, "..", "..")
const src = (p: string) => readFileSync(join(root, p), "utf8")

const options = {
  terms: [{ value: "Fall 2026", label: "Fall 2026" }],
  cohorts: ["BSN 2027"],
  groups: [],
  courses: [],
  categories: [],
  tags: [],
  locations: [{ value: "Skills lab 2", label: "Skills lab 2" }],
  settings: [{ value: "lab", label: "Lab" }],
}

describe("RP-01: three filters give three chips; removing the middle one removes only it", () => {
  it("cohort, location, setting -> three chips on the bar; Remove Location keeps cohort and setting", () => {
    const scope: LabScope = { ...EMPTY_SCOPE, cohort: "BSN 2027", loc: "Skills lab 2", setting: "lab" }
    const onChange = vi.fn()
    render(
      <TooltipProvider>
        <ScopeBar scope={scope} options={options as never} termName="Fall 2026" onChange={onChange} chipValue={(_k, v) => v} />
      </TooltipProvider>,
    )
    const chips = within(screen.getByLabelText("Applied filters")).getAllByRole("button").filter((b) => b.hasAttribute("data-scope-chip"))
    expect(chips.map((c) => c.getAttribute("data-scope-chip"))).toEqual(["cohort", "loc", "setting"])
    fireEvent.click(chips[1])
    const next = onChange.mock.calls[0][0] as LabScope
    expect(next.cohort).toBe("BSN 2027")
    expect(next.setting).toBe("lab")
    expect(next.loc ?? "").toBe("")
  })
})

describe("RP-09: no contradicting or silent lines beside the explanation", () => {
  const impossible: LabScope = { ...EMPTY_SCOPE, loc: "Skills lab 2", setting: "clinical" }
  it("the dashboard model drops 'Counting evidence from ...' when the scope cannot produce evidence", () => {
    const m = buildDashboard(seed, impossible)
    expect(m.kind).toBe("impossible")
    expect(m.recount).toBeNull()
    expect(buildDashboard(seed, { ...EMPTY_SCOPE, loc: "Skills lab 2" }).recount).toMatch(/Counting evidence from Skills lab 2/)
  })
  it("attainment and export A hide the recount line under the banner", () => {
    expect(src("components/lab/admin-b/attainment-page.tsx")).toMatch(/recount && !impossible/)
  })
  it("director pages announce the explanation to screen readers, never the zero figures", () => {
    expect(src("components/lab/director/frame.tsx")).toMatch(/impossible \? impossible\.text : announce/)
  })
})

describe("AE-04: director reports B keeps all four engine-state columns and Attainment in view", () => {
  it("the preview pane has a fixed width (no 8 of 12 split that pushed Attainment off at 1440)", () => {
    // D-L8c: director reports B is now the Readiness tab of the merged Reports page, variant B.
    const b = src("components/lab/director/reports-page.tsx")
    expect(b).toMatch(/xl:grid-cols-\[minmax\(0,1fr\)_20rem\]/)
    expect(b).not.toMatch(/xl:col-span-8/)
  })
})
