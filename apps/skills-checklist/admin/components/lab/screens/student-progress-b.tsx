"use client"

/**
 * Student My progress, variant B: my requirements map.
 * Tests: does seeing the whole list as a sections by skills mosaic (a requirement checklist that fills in), with progress by
 * section and a radar against the cohort median, tell a student where they stand better than a list of next actions?
 * Regions (budget 4): header · summary line (the three figures as links, one view switch) · one chart card that switches between
 * the mosaic and the by-section radar against the cohort (n >= 5). One chart in the first viewport (student budget), the
 * comparison one click away inside the card (strategy/07: comparison lives inside the chart card as a split control).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { StudentFrame } from "@/components/lab/student/frame"
import { Mosaic, SectionRadar } from "@/components/lab/student/progress"
import { NUM_LINK, SectionTitle } from "@/components/lab/student/parts"
import { VIZ } from "@/components/lab/viz"
import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import { studentHref } from "@/lib/lab/student"

type Show = "required" | "all"
type View = "map" | "cohort"

export function StudentProgressB() {
  return (
    <StudentFrame title="My progress" primary={(c) => ({ label: "Send for evaluation", href: studentHref("request-signoff", {}, c.studentId) })}>
      {({ model, studentId, param, setParams }) => {
        const show: Show = param("show") === "required" ? "required" : "all"
        const view: View = param("view") === "cohort" ? "cohort" : "map"
        const records = show === "required" ? model.required : model.all
        const c = model.counts
        return (
          <div className="flex flex-col gap-6" data-student-lab="progress-B">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" data-region="summary">
              <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span data-figure="hero">
                  <Link className={`${NUM_LINK} font-heading text-2xl font-semibold tabular-nums`} href={studentHref("home", { show: "required" }, studentId)}>{c.achieved}</Link>
                  {` of ${c.required} required achieved`}
                </span>
                <span data-figure="kpi">
                  <Link className={`${NUM_LINK} tabular-nums`} href={studentHref("my-requests", {}, studentId)}>{c.waiting}</Link>
                  {" waiting"}
                </span>
                <span data-figure="kpi">
                  <Link className={`${NUM_LINK} tabular-nums`} style={c.returned ? { color: VIZ.behindInk } : undefined} href={studentHref("my-requests", { show: "returned" }, studentId)}>{c.returned}</Link>
                  {" returned"}
                </span>
                <span className={model.behind ? "font-medium" : ""} style={model.behind ? { color: VIZ.behindInk } : undefined}>{model.verdict}</span>
              </p>
              {view === "map" ? (
                <ViewSegmentedControl<Show>
                  value={show}
                  onValueChange={(v) => setParams({ show: v === "all" ? null : v })}
                  options={[{ value: "all", label: `Whole list (${model.all.length})` }, { value: "required", label: `Required (${model.required.length})` }]}
                  aria-label="Show"
                />
              ) : null}
            </div>
            <Card data-region="map" id="map" className="py-0">
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {view === "map" ? (
                    <SectionTitle count={records.length}>{show === "required" ? `Required ${skillNounPlural()} by section` : `${capitalize(skillNounPlural())} by section`}</SectionTitle>
                  ) : (
                    <SectionTitle>You and your cohort</SectionTitle>
                  )}
                  <ViewSegmentedControl<View>
                    value={view}
                    onValueChange={(v) => setParams({ view: v === "map" ? null : v })}
                    options={[{ value: "map", label: "By section" }, { value: "cohort", label: "Against cohort" }]}
                    aria-label="Chart"
                  />
                </div>
                {view === "map" ? <Mosaic records={records} studentId={studentId} /> : <div className="mx-auto w-full max-w-md"><SectionRadar model={model} /></div>}
              </CardContent>
            </Card>
          </div>
        )
      }}
    </StudentFrame>
  )
}
