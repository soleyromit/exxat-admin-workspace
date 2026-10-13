import * as React from "react"
import { render } from "@testing-library/react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import axe from "axe-core"
import { expect } from "vitest"
import { HomeView, type HomeViewProps } from "@/components/home/home-view"
import type { Db, Skill } from "@/lib/domain/types"
import { scenarioDb, type HomeScenario } from "@/lib/home/scenarios"

export const db = (k: HomeScenario = "sample"): Db => scenarioDb(k)

export const renderHome = (p: Partial<HomeViewProps> & { scenario?: HomeScenario } = {}) => {
  const { scenario = "sample", db: given, ...rest } = p
  return render(
    <TooltipProvider>
      <main>
        <HomeView db={given ?? db(scenario)} {...rest} />
      </main>
    </TooltipProvider>,
  )
}

const BINARY = { kind: "binary", labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } }, qualifyingLabelId: "a" } as const

/** A library of `total` active skills of which `configured` are configured; nothing else (no evidence, no mappings). */
export function libraryOf(total: number, configured: number): Db {
  const base = db("firstRun")
  const skills: Skill[] = Array.from({ length: total }, (_, i) => ({
    id: `sk-t${i}`,
    name: `Sample skill ${i + 1}`,
    description: "Sample",
    categoryId: null,
    tagIds: [],
    active: true,
    model: i < configured ? (JSON.parse(JSON.stringify(BINARY)) as Skill["model"]) : null,
    criteria: { requiredCount: null, levelMinimums: {}, settingMinimums: {} } as Skill["criteria"],
    requiresApproval: false,
    allowedRoles: [],
    submissionFields: [],
    evaluatorComment: "optional",
    selfEvaluation: false,
    importBatchId: null,
    createdAt: "2026-04-01T10:00:00.000Z",
  }))
  return { ...base, skills }
}

// jsdom cannot compute colour contrast (checked in the real browser run), and the DS KeyMetrics renders both of its layouts
// into the DOM here (CSS hides one in a browser), so its landmark appears twice only in jsdom.
const rules = { rules: { "color-contrast": { enabled: false }, "landmark-unique": { enabled: false } } }
export async function expectNoAxeViolations(el: HTMLElement = document.body) {
  const r = await axe.run(el, rules)
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 120)).join(" | ")}`)).toEqual([])
}
