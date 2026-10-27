"use client"

/**
 * Student My progress, variant A (recommended; the fulfillment walkthrough): the student dashboard.
 * Tests: do four regions that each answer one question (am I on pace, what is left per course, what is waiting on someone else,
 * what do I do next) get a student from a glance to the next sign-off faster than a map or a timeline?
 * Regions (dashboard budget 5, Romit 2026-10-27 "My progress is a dashboard for a student"): header (Send for evaluation) ·
 * Am I on pace (burn-up) · Mandatory skills by course (one square per skill) · Do this next (3 shown) · Waiting on others.
 * Charts 2, figures 4 (counted evaluations, mandatory achieved, waiting, returned). D-X12: the set is "Required this term".
 * ?course=<id> is the course view [REQ ST-01; Thursday S1], its own place (Romit 2026-10-27: "why does the dropdown change when I
 * am changing a course on My progress?"): breadcrumb "My progress > NURS 350", title the course ("NURS 350, Clinical Practicum")
 * with "Skills by course" as context, and a "Course" select that lists courses only and stays on the course view. My progress has
 * no course select; its course rows link here. The header's one action opens Log a skill (Send C) on that course with its open
 * mandatory skills chosen [Thursday S2].
 * Demo states: ?state=loading|empty|done|offline|error, ?student=<id>.
 */
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { aNoun, capitalize, skillNounPlural } from "@/lib/lab/terms"
import { StudentFrame, type StudentFrameCtx } from "@/components/lab/student/frame"
import { CourseSkillList, CourseSwitch, NextActions } from "@/components/lab/student/progress"
import { CourseStrips, CourseSummary, PaceCard, WaitingCard } from "@/components/lab/student/dashboard"
import { courseLevels, studentHref, waitingRows } from "@/lib/lab/student"

const courseOf = (c: StudentFrameCtx) => {
  const id = c.param("course")
  return c.model.courses.find((x) => x.id === id && x.skills.length > 0) ?? null
}

/** Send from the course view opens on that course with its open mandatory skills chosen (not achieved, not already waiting). */
function sendHref(c: StudentFrameCtx) {
  const course = courseOf(c)
  if (!course) return studentHref("request-signoff", {}, c.studentId)
  const open = courseLevels(c.model, course).mandatory.filter((r) => r.state !== "achieved" && !r.waiting && r.active !== false)
  return studentHref("request-signoff", { course: course.id, skills: open.map((r) => r.id).join(",") || undefined }, c.studentId)
}

export function StudentProgressA() {
  return (
    <StudentFrame
      title={(c) => { const k = courseOf(c); return k ? `${k.code}, ${k.name}` : "My progress" }}
      subtitle={(c) => (courseOf(c) ? `${capitalize(skillNounPlural())} by course` : null)}
      // The way back from the course view on a phone, where the breadcrumb (My progress > NURS 350) is hidden.
      back={(c) => (courseOf(c) ? { label: "My progress", href: studentHref("home", {}, c.studentId), phoneOnly: true } : null)}
      primary={(c) => ({ label: `Log ${aNoun()}`, href: sendHref(c) })}
    >
      {(c) => {
        const course = courseOf(c)
        const { model, studentId, state, setParams } = c
        if (course) {
          return (
            <div className="flex flex-col gap-4" data-student-lab="course-A">
              <CourseSwitch model={model} value={course.id} onChange={(v) => setParams({ course: v })} id="course-a-select" />
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                <Card data-region="list" className="order-2 gap-0 py-0 lg:order-1 lg:col-span-8" id="required">
                  <CardContent className="flex flex-col gap-1 py-4">
                    <CourseSkillList model={model} course={course} studentId={studentId} />
                  </CardContent>
                </Card>
                <div className="order-1 lg:sticky lg:top-4 lg:order-2 lg:col-span-4">
                  <CourseSummary model={model} course={course} studentId={studentId} />
                </div>
              </div>
            </div>
          )
        }
        const rows = waitingRows(state, studentId)
        return (
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12" data-student-lab="progress-A">
            <div className="lg:col-span-5"><PaceCard model={model} height={250} /></div>
            <div className="lg:col-span-7"><CourseStrips model={model} studentId={studentId} /></div>
            <div className="lg:col-span-7"><NextActions model={model} limit={3} exclude={["waiting"]} className="h-full" /></div>
            <div className="lg:col-span-5"><WaitingCard model={model} rows={rows} studentId={studentId} /></div>
          </div>
        )
      }}
    </StudentFrame>
  )
}
