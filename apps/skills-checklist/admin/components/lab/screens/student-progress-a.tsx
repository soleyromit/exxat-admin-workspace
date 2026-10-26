"use client"

/**
 * Student My progress, variant A: next actions first.
 * Tests: does a short list of what to do now (returned, did not count, one away, placement ending, waiting 3+ days) with a
 * thin progress verdict get a student to their next sign-off faster than a map or a timeline?
 * Regions (strategy/07 student budget 4): header (Send for evaluation) · hero (required ring, waiting, returned, pace verdict) ·
 * Do this next · required list start. Demo states: ?state=loading|empty|done|offline|error, ?student=<id>.
 */
import * as React from "react"
import { StudentFrame } from "@/components/lab/student/frame"
import { NextActions, ProgressHero, RequiredList } from "@/components/lab/student/progress"
import { studentHref } from "@/lib/lab/student"

export function StudentProgressA() {
  return (
    <StudentFrame title="My progress" primary={(c) => ({ label: "Send for evaluation", href: studentHref("request-signoff", {}, c.studentId) })}>
      {({ model, studentId }) => (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-student-lab="progress-A">
          <div className="lg:col-span-5">
            <ProgressHero model={model} studentId={studentId} />
          </div>
          <div className="lg:col-span-7">
            <NextActions model={model} limit={2} />
          </div>
          <div className="lg:col-span-12">
            <RequiredList model={model} studentId={studentId} />
          </div>
        </div>
      )}
    </StudentFrame>
  )
}
