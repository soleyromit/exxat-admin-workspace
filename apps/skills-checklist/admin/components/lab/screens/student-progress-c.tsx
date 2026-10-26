"use client"

/**
 * Student My progress, variant C: timeline and pace.
 * Tests: does a pace line against the term clock, the placement end and what each course expects now help a student plan
 * better than a to-do list or a map?
 * Regions (budget 4): header · pace (headline figure + chart) · placements (end date, likely skills not started) · courses.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { StudentFrame } from "@/components/lab/student/frame"
import { CourseTable, PaceChart, PlacementList } from "@/components/lab/student/progress"
import { NUM_LINK, SectionTitle } from "@/components/lab/student/parts"
import { VIZ } from "@/components/lab/viz"
import { studentHref } from "@/lib/lab/student"

export function StudentProgressC() {
  return (
    <StudentFrame title="My progress" primary={(c) => ({ label: "Send for evaluation", href: studentHref("request-signoff", {}, c.studentId) })}>
      {({ model, studentId }) => {
        const row = model.row
        const last = [...model.pace].reverse().find((p) => p.counted >= 0)
        const c = model.counts
        return (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12" data-student-lab="progress-C">
            <Card data-region="pace" className="py-0 lg:col-span-8">
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 className="flex flex-wrap items-baseline gap-x-2 font-heading text-foreground" data-figure="hero">
                    <span className="text-3xl font-semibold leading-none tabular-nums">{row?.collected ?? 0}</span>
                    <span className="font-sans text-sm font-normal text-muted-foreground">{`of ${row?.needed ?? 0} required evaluations counted, ${last?.expected ?? 0} expected by today`}</span>
                  </h2>
                  <p className="flex gap-4 text-sm text-muted-foreground">
                    <span data-figure="kpi"><Link className={`${NUM_LINK} tabular-nums`} href={studentHref("my-requests", {}, studentId)}>{c.waiting}</Link> waiting</span>
                    <span data-figure="kpi"><Link className={`${NUM_LINK} tabular-nums`} style={c.returned ? { color: VIZ.behindInk } : undefined} href={studentHref("my-requests", { show: "returned" }, studentId)}>{c.returned}</Link> returned</span>
                  </p>
                </div>
                <p className={model.behind ? "text-sm font-medium" : "text-sm text-muted-foreground"} style={model.behind ? { color: VIZ.behindInk } : undefined}>{`${model.verdict}, ${model.term.name}`}</p>
                <PaceChart model={model} />
              </CardContent>
            </Card>
            <Card data-region="placements" className="py-0 lg:col-span-4">
              <CardContent className="flex flex-col gap-3 py-4">
                <SectionTitle count={model.placements.length}>Placements</SectionTitle>
                <PlacementList model={model} studentId={studentId} />
              </CardContent>
            </Card>
            <Card data-region="courses" className="py-0 lg:col-span-12">
              <CardContent className="flex flex-col gap-3 py-4">
                <SectionTitle count={model.courses.length}>What each course expects now</SectionTitle>
                <CourseTable model={model} studentId={studentId} />
              </CardContent>
            </Card>
          </div>
        )
      }}
    </StudentFrame>
  )
}
