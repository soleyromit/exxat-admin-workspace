"use client"

/**
 * Admin Dashboard, variant D: matrix explorer (concept D in design/dashboard-concepts; formerly variant B, the scope lens of
 * strategy/06 section 5.2 brought onto the landing to test it). The main canvas is
 * the Sections x scope matrix with the basis beside each cell; Split by adds cohort or group columns on demand; "Required |
 * All skills" widens the rows. The hero names the largest gap the matrix shows, and only that (strategy/07 B2). Needs you
 * sits alone in the right column; the students flagged are one click away through the hero action (strategy/07 B1).
 * Same scope bar, basis, as-of and drill rules as variant A.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { DashboardPage } from "@/components/lab/dashboard/frame"
import { CardError, HeroMetric, HeroTile, Kpis, NeedsYou, SetupHero, setupOnly } from "@/components/lab/dashboard/cards"
import { SectionMatrixTable } from "@/components/lab/dashboard/section-matrix"
import { ChartCard } from "@/components/chart-card"
import { drillHref, populationRows, sectionMatrix, type DashboardModel, type Split } from "@/lib/lab/dashboard"
import type { LabScope } from "@/lib/lab/scope"
import { skillNounPlural } from "@/lib/lab/terms"
import type { V2State } from "@/lib/v2/types"

const SPLIT = [
  { value: "none", label: "None" },
  { value: "cohort", label: "Cohort" },
  { value: "group", label: "Group" },
] as const

function Body({ data, model, scope, split, setSplit, skillsAll, setSkillsAll, demo, clearDemo }: { data: V2State; model: DashboardModel; scope: LabScope; split: Split; setSplit: (s: Split) => void; skillsAll: boolean; setSkillsAll: (v: boolean) => void; demo: string | null; clearDemo: () => void }) {
  const pop = React.useMemo(() => (skillsAll ? populationRows(data, scope, undefined, { includeOptional: true }) : model.pop), [skillsAll, data, scope, model.pop])
  const matrix = React.useMemo(() => sectionMatrix(pop, split), [pop, split])
  // The hero names the largest gap the matrix shows.
  let best: { section: string; col: string; pct: number; expected: number; short: number; cohort?: string; group?: string } | null = null
  for (const r of matrix.rows) for (const c of r.cells) {
    if (c.pct === null || c.expected === null) continue
    const col = matrix.columns.find((x) => x.id === c.colId)!
    const gap = c.expected - c.pct
    if (!best || gap > best.expected - best.pct) best = { section: r.section, col: col.label.replace(/ \(\d+\)$/, ""), pct: c.pct, expected: c.expected, short: c.short, cohort: col.cohort, group: col.group }
  }
  const shortCells = matrix.rows.reduce((n, r) => n + r.cells.filter((c) => c.short > 0).length, 0)
  const basisWord = model.basis === "expected" ? "expected now" : model.basis === "median" ? "for the scope" : "required"
  const heroScope: LabScope | null = best ? { ...scope, cat: best.section, ...(best.cohort ? { cohort: best.cohort, group: best.group ?? "" } : {}) } : null
  const gap = best && best.short > 0
  const summary = `Worst gap first. ${shortCells} ${shortCells === 1 ? "cell is" : "cells are"} 8 or more points under the basis.`
  return (
    <div className="flex flex-col gap-6">
      <Card data-dashboard-hero={gap ? "gap" : "clear"} id="hero" data-region="verdict" className="py-0">
        <CardContent className="grid gap-x-6 gap-y-4 py-4 lg:grid-cols-12 lg:items-center">
          <div className="flex min-w-0 items-start gap-4 lg:col-span-5">
            <HeroTile icon="fa-bullseye-arrow" tone={gap ? "behind" : "clear"} />
            <div className="flex min-w-0 flex-col gap-2">
              {best ? (
                <HeroMetric value={`${best.pct}%`} rest={`of ${best.section} counted${split === "none" ? "" : ` in ${best.col}`}, against ${best.expected}% ${basisWord}`} tip={model.basisCaption} />
              ) : (
                <h2 className="text-base font-semibold text-foreground">No required sections in this scope</h2>
              )}
              <p className="text-sm text-foreground">{gap ? "The largest gap in this scope." : "No section is 8 or more points under the basis."}</p>
              {heroScope ? (
                <Button asChild variant="outline" size="sm" className="self-start">
                  <Link href={drillHref(heroScope, { list: "students", from: "hero" })}>View the students</Link>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="min-w-0 border-t border-border pt-3 lg:col-span-7 lg:border-s lg:border-t-0 lg:ps-4 lg:pt-0">
            <Kpis model={model} />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {demo === "error" ? (
          <CardError className="lg:col-span-8" title="Sections behind" onRetry={clearDemo} />
        ) : (
          <div className="lg:col-span-8" data-region="matrix" data-chart>
            <ChartCard title="Sections behind" description={summary}>
              <div className="flex flex-col gap-3" id="matrix">
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground" aria-hidden="true">Split by</span>
                    <ViewSegmentedControl aria-label="Split by" value={split} onValueChange={(v) => setSplit(v as Split)} options={SPLIT} />
                  </div>
                  <ViewSegmentedControl aria-label="Rows" value={skillsAll ? "all" : "required"} onValueChange={(v) => setSkillsAll(v === "all")} options={[{ value: "required", label: "Required" }, { value: "all", label: `All ${skillNounPlural()}` }]} />
                </div>
                <SectionMatrixTable matrix={matrix} scope={scope} basis={model.basis} />
              </div>
            </ChartCard>
          </div>
        )}
        <NeedsYou className="lg:col-span-4" model={model} />
      </div>
    </div>
  )
}

export function AdminDashboardD() {
  return (
    <DashboardPage variant="D">
      {({ data, model, scope, split, setSplit, demo, clearDemo, param, setParams }) =>
        demo === "empty" ? (
          <div className="flex flex-col gap-4">
            <SetupHero termName={model.term.name} />
            <NeedsYou model={setupOnly(model)} />
          </div>
        ) : (
          <Body data={data} model={model} scope={scope} split={split} setSplit={setSplit} skillsAll={param("skills") === "all"} setSkillsAll={(v) => setParams({ skills: v ? "all" : null })} demo={demo} clearDemo={clearDemo} />
        )
      }
    </DashboardPage>
  )
}
