"use client"

/**
 * Student My progress, variant B: the requirements map.
 * Tests: does seeing every skill at once (a sections by skills mosaic that fills in, ringed where required) with four figures and a
 * comparison against the cohort median tell a student where they stand better than a to-do dashboard?
 * Regions (dashboard budget 5): header · key figures (Required this term achieved, in progress, waiting, returned; each a link. Not
 * the DS KeyMetrics: its linked cells fail axe label-content-name-mismatch, 2026-10-27) ·
 * the map (one course or every skill; the only controls sit in its header) · you and your cohort (radar, hidden under n = 5) ·
 * Do this next (3 shown). Charts 2. ST-01: the course choice narrows the map to what that course expects, its mandatory skills
 * ringed. D-X12: the default required set is "Required this term".
 */
import * as React from "react"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { ChartCard } from "@/components/chart-card"
import { FigureLink } from "@/components/lab/student/parts"
import { VIZ } from "@/components/lab/viz"
import { StudentFrame } from "@/components/lab/student/frame"
import { CourseSelect, Mosaic, NextActions, REQUIRED_THIS_TERM, SectionRadar } from "@/components/lab/student/progress"
import { aNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { studentHref } from "@/lib/lab/student"

type Show = "required" | "all"

export function StudentProgressB() {
  return (
    <StudentFrame title="My progress" primary={(c) => ({ label: `Log ${aNoun()}`, href: studentHref("request-signoff", {}, c.studentId) })}>
      {({ model, studentId, param, setParams }) => {
        const show: Show = param("show") === "required" ? "required" : "all"
        const course = model.courses.find((x) => x.id === param("course")) ?? null
        const levelOf = new Map(course?.skills.map((x) => [x.id, x.level]) ?? [])
        const scoped = course ? model.all.filter((r) => levelOf.has(r.id)).map((r) => ({ ...r, required: levelOf.get(r.id) === "mandatory" })) : model.all
        const records = show === "required" ? scoped.filter((r) => r.required) : scoped
        const c = model.counts
        const inProgress = model.required.filter((r) => r.state === "progress").length
        const figures = [
          { id: "achieved", label: `${REQUIRED_THIS_TERM}, achieved`, value: c.achieved, of: c.required, href: studentHref("record", {}, studentId) },
          { id: "progress", label: "In progress", value: inProgress, href: studentHref("home", { show: "required" }, studentId) },
          { id: "waiting", label: "Waiting", value: c.waiting, href: studentHref("my-requests", {}, studentId) },
          { id: "returned", label: "Returned to you", value: c.returned, href: studentHref("my-requests", { show: "returned" }, studentId), amber: true },
        ]
        const title = course ? `${course.code}: ${show === "required" ? "mandatory" : "expected"} ${skillNounPlural()}` : show === "required" ? REQUIRED_THIS_TERM : `Every ${skillNoun()} on your list`
        return (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12" data-student-lab="progress-B">
            <section aria-label="Key figures" data-figure="kpis" data-region="figures" className="lg:col-span-12">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-y border-border py-4 md:grid-cols-4">
                {figures.map((f) => (
                  <div key={f.id} className="flex flex-col gap-1">
                    <FigureLink href={f.href} value={f.value} label={f.of !== undefined ? `of ${f.of} ${REQUIRED_THIS_TERM.toLowerCase()}` : f.label} amber={f.amber} />
                    {f.id === "achieved" ? <span className="text-xs text-muted-foreground" style={model.behind ? { color: VIZ.behindInk } : undefined}>{model.verdict}</span> : null}
                  </div>
                ))}
              </div>
            </section>
            <div className="lg:col-span-8" data-region="map" id="map" data-chart-card>
              <ChartCard title={title} description={`${records.filter((r) => r.state === "achieved").length} of ${records.length} achieved. Ringed squares are required.`}>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <CourseSelect model={model} value={course?.id ?? "required"} onChange={(v) => setParams({ course: v === "required" ? null : v })} allLabel="Every course" id="progress-b-course" />
                    <ViewSegmentedControl<Show>
                      value={show}
                      onValueChange={(v) => setParams({ show: v === "all" ? null : v })}
                      options={course ? [{ value: "all", label: `All (${scoped.length})` }, { value: "required", label: `Mandatory (${scoped.filter((r) => r.required).length})` }] : [{ value: "all", label: `All (${model.all.length})` }, { value: "required", label: `${REQUIRED_THIS_TERM} (${model.required.length})` }]}
                      aria-label="Show"
                    />
                  </div>
                  <Mosaic records={records} studentId={studentId} />
                </div>
              </ChartCard>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-4">
              <div data-region="cohort" data-chart-card>
                <ChartCard title="You and your cohort" description="Share counted by section, against the median.">
                  <SectionRadar model={model} />
                </ChartCard>
              </div>
              <NextActions model={model} limit={3} />
            </div>
          </div>
        )
      }}
    </StudentFrame>
  )
}
