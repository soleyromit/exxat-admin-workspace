"use client"

/**
 * Student My progress, variant A (recommended; the fulfillment walkthrough): the student dashboard.
 * Tests: do four regions that each answer one question (am I on pace, what is left per course, what is waiting on someone else,
 * what do I do next) get a student from a glance to the next sign-off faster than a map or a timeline?
 * Regions (dashboard budget 5, Romit 2026-10-27 "My progress is a dashboard for a student"): header (Send for evaluation) ·
 * Am I on pace (the list's figure and a burn-up) · Mandatory skills by course (one square per skill) · Do this next (3 shown) · Waiting on others.
 * Charts 2, figures 3 (achieved on the list, waiting, returned). What is owed reads the skill list; a course says where (D-L102). Two lists read as two tabs, never merged.
 * ?course=<id> is the course view [REQ ST-01; Thursday S1], its own place (Romit 2026-10-27: "why does the dropdown change when I
 * am changing a course on My progress?"): breadcrumb "My progress > NURS 350", title the course ("NURS 350, Clinical Practicum")
 * with "Skills by course" as context, and a "Course" select that lists courses only and stays on the course view. My progress has
 * no course select; its course rows link here. The header's one action opens Log a skill (Send C) on that course with its open
 * mandatory skills chosen [Thursday S2].
 * Demo states: ?state=loading|empty|done|offline|error, ?student=<id>.
 */
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { aNoun } from "@/lib/lab/terms"
import { StudentFrame, type StudentFrameCtx } from "@/components/lab/student/frame"
import { CourseSkillList, CourseSwitch, ListTabs, NextActions, NoListNotice } from "@/components/lab/student/progress"
import { CourseStrips, CourseSummary, PaceCard, WaitingCard } from "@/components/lab/student/dashboard"
import { courseLevels, studentHref, waitingRows, type SkillRecord } from "@/lib/lab/student"
import { selfEvalEnabled } from "@/lib/lab/student2"
import { skillById } from "@/lib/v2/evidence-index"

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

/** A row's own "Ask for evaluation": the same request flow, on this course and this skill, at its first unanswered step. */
const askHref = (c: StudentFrameCtx, courseId: string) => (r: SkillRecord): string | null =>
  r.state === "achieved" || r.waiting || r.active === false ? null : studentHref("request-signoff", { course: courseId, skills: r.id, step: selfEvalEnabled(skillById(c.state, r.id)) ? "self" : "send" }, c.studentId)

/** With nothing required left, the course that still has skills to ask for: the placement's course first. */
const openCourse = (c: StudentFrameCtx) => {
  const open = (k: { skills: Array<{ id: string }> }) => k.skills.some((x) => { const r = c.model.all.find((y) => y.id === x.id); return !!r && r.state !== "achieved" && !r.waiting })
  const current = c.model.placements.find((p) => p.status === "current")?.courseId
  const k = c.model.courses.find((x) => x.id === current && open(x)) ?? c.model.courses.find(open)
  return k ? { label: `See what else ${k.code} expects`, href: studentHref("home", { course: k.id, skill: c.param("skill") ?? undefined }, c.studentId) } : null
}

export function StudentProgressA() {
  return (
    <StudentFrame
      title={(c) => { const k = courseOf(c); return k ? `${k.code}, ${k.name}` : "My progress" }}
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
                    <CourseSkillList model={model} course={course} studentId={studentId} ask={askHref(c, course.id)} pin={c.param("skill")} />
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
          <ListTabs model={model} onChange={(id) => setParams({ list: id })}>
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12" data-student-lab="progress-A">
            {model.list ? null : <div className="lg:col-span-12"><NoListNotice /></div>}
            {model.list ? <div className="lg:col-span-5"><PaceCard model={model} studentId={studentId} height={250} /></div> : null}
            <div className={model.list ? "lg:col-span-7" : "lg:col-span-12"}><CourseStrips model={model} studentId={studentId} /></div>
            <div className="lg:col-span-7"><NextActions model={model} limit={3} exclude={["waiting"]} className="h-full" whenEmpty={openCourse(c)} /></div>
            {/* Returned lives once, in Do this next with its reason; the Waiting card counts only what waits on others. */}
            <div className="lg:col-span-5"><WaitingCard model={model} rows={rows} studentId={studentId} showReturned={false} /></div>
          </div>
          </ListTabs>
        )
      }}
    </StudentFrame>
  )
}
