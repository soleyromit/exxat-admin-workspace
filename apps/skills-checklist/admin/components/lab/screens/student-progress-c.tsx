"use client"

/**
 * Student My progress, variant C: the term timeline.
 * Tests: does leading with time (my counted evaluations against the term clock, how long each request has waited, when each
 * course's placement ends) help a student plan the rest of the term better than a to-do dashboard or a map?
 * Regions (dashboard budget 5): header · Am I on pace (large burn-up) · How long have requests waited (four age bins, 15+ outlined
 * amber) · Do this next (3 shown, under the bins) · courses, under the pace line (one row per course: one square per mandatory skill,
 * evaluations against the clock, placement end; each row opens the skills that course expects, by level: REQ ST-01). Charts 2. D-X12: "Required this term".
 */
import { aNoun } from "@/lib/lab/terms"
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { StudentFrame } from "@/components/lab/student/frame"
import { CourseTable, NextActions } from "@/components/lab/student/progress"
import { SectionTitle } from "@/components/lab/student/parts"
import { AgingCard, PaceCard, Unit } from "@/components/lab/student/dashboard"
import { courseLevels, studentHref, waitingRows } from "@/lib/lab/student"

export function StudentProgressC() {
  return (
    <StudentFrame title="My progress" primary={(c) => ({ label: `Log ${aNoun()}`, href: studentHref("request-signoff", {}, c.studentId) })}>
      {({ model, studentId, state }) => {
        const rows = waitingRows(state, studentId)
        return (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12" data-student-lab="progress-C">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <PaceCard model={model} height={260} />
              <Card data-region="courses" className="gap-0 py-0">
                <CardContent className="flex flex-col gap-3 py-4">
                  <SectionTitle count={model.courses.length}>What each course expects now</SectionTitle>
                  <CourseTable
                    model={model}
                    studentId={studentId}
                    placement
                    compact
                    mandatoryCell={(c) => (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {courseLevels(model, c).mandatory.map((r) => <Unit key={r.id} r={r} studentId={studentId} size={22} />)}
                        <span className="ms-1 text-sm tabular-nums text-muted-foreground">{`${c.mandatoryAchieved} of ${c.mandatory}`}</span>
                      </span>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-4">
              <AgingCard model={model} rows={rows} studentId={studentId} />
              <NextActions model={model} limit={3} exclude={["waiting", "placement"]} />
            </div>
          </div>
        )
      }}
    </StudentFrame>
  )
}
