import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, within } from "@testing-library/react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { createSeed } from "@/lib/v2/seed"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { GRADUATION_LIST, GRADUATION_STAGES, buildReadiness, filterRows, graduatingCohort, type GraduationStage, type Readiness } from "@/lib/lab/director"
import { ReadinessPipeline, STAGE_HINT, shownBands } from "@/components/lab/director/pipeline"
import { ReadinessLine } from "@/components/lab/rbac/director-attainment"
import type { DirectorContext } from "@/components/lab/director/use-director"

/**
 * The director's fourth graduation band, "Short" (2 to 3 required skills missing, decision D-X11). It is empty in the generated
 * data (31 / 4 / 0 / 3), so a synthetic row moves one far-behind student into it and every band view must show it, link to a
 * list of the same length, and still sum to the cohort.
 */
const seed = createSeed()
const scope = { ...EMPTY_SCOPE, cohort: graduatingCohort(seed)!, term: "Fall 2026" }
const real = buildReadiness(seed, scope)

function withSyntheticShort(m: Readiness): Readiness {
  const i = m.rows.findIndex((r) => r.graduationStage === "far")
  const far = m.rows[i]
  const row = { ...far, gaps: far.gaps.slice(0, 2), achieved: far.required - 2, graduationStage: "short" as GraduationStage, stage: "far" as const }
  const rows = m.rows.map((r, k) => (k === i ? row : r))
  const graduation = { complete: 0, "one-short": 0, short: 0, far: 0 } as Record<GraduationStage, number>
  const graduationOpen = { complete: 0, "one-short": 0, short: 0, far: 0 } as Record<GraduationStage, number>
  for (const r of rows) {
    graduation[r.graduationStage] += 1
    if (r.open.length) graduationOpen[r.graduationStage] += 1
  }
  return { ...m, rows, graduation, graduationOpen }
}

describe("director graduation bands (four keys from graduationStageOf)", () => {
  it("the generated data reads 31 / 4 / 0 / 3, and the Short band is not drawn while empty", () => {
    expect(real.graduation).toEqual({ complete: 31, "one-short": 4, short: 0, far: 3 })
    expect(shownBands(real)).toEqual(["complete", "one-short", "far"])
    const { container } = render(<TooltipProvider><ReadinessPipeline m={real} /></TooltipProvider>)
    expect(container.querySelector('[data-band="short"]')).toBeNull()
    expect(container.querySelectorAll("[data-band]").length).toBe(3)
  })

  it("a synthetic 2-missing row shows the Short band in the pipeline, with hint, count and a list of the same length", () => {
    const m = withSyntheticShort(real)
    expect(m.graduation).toEqual({ complete: 31, "one-short": 4, short: 1, far: 2 })
    expect(GRADUATION_STAGES.reduce((t, s) => t + m.graduation[s], 0)).toBe(m.rows.length)
    const { container } = render(<TooltipProvider><ReadinessPipeline m={m} /></TooltipProvider>)
    const band = container.querySelector('[data-band="short"]') as HTMLElement
    expect(band).not.toBeNull()
    expect(within(band).getByText("Short")).toBeTruthy()
    const link = within(band).getByRole("link", { name: /^1 short\. Open the list/ })
    expect(link.getAttribute("href")).toContain("list=several")
    expect(STAGE_HINT.short).toBe("Two to 3 required skills not achieved")
    // Each band's list has exactly the band's count (figure equals list by construction).
    for (const st of GRADUATION_STAGES) expect(filterRows(m.rows, { list: GRADUATION_LIST[st] }).length).toBe(m.graduation[st])
  })

  it("the attainment readiness line prints all four bands and they sum to the cohort", () => {
    const m = withSyntheticShort(real)
    const ctx = { scope, model: m } as unknown as DirectorContext & { model: Readiness }
    const { container } = render(<ReadinessLine ctx={ctx} />)
    const counts = GRADUATION_STAGES.map((st) => Number(container.querySelector(`[data-band="${st}"]`)?.getAttribute("data-band-count")))
    expect(counts).toEqual([31, 4, 1, 2])
    expect(counts.reduce((a, b) => a + b, 0)).toBe(m.rows.length)
    expect(container.textContent).toContain("1short")
  })
})
