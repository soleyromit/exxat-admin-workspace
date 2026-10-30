"use client"

/**
 * Student Skill detail, variant B: attempt ledger.
 * Tests: does a table of every attempt with a Result and Why column, the rule parts in one line above it, let a student audit
 * what counted faster than a narrative timeline?
 * Regions: header · state and parts line · ledger · side: why the last one did not count and the rule. Each completed attempt opens
 * in full, read only (?evaluation=, REQ SH-07).
 */
import { capitalize, skillNoun } from "@/lib/lab/terms"
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { StudentFrame, type StudentFrameCtx } from "@/components/lab/student/frame"
import { Overlay, Parts, SectionTitle, StateLabel } from "@/components/lab/student/parts"
import { AttemptCount, AttemptCourseSelect, AttemptLedger, WhereItCounts, WhyNotCounted, pickSkill, skillPrimary, useAttempts, useCourseNarrow } from "@/components/lab/student/skill-detail"
import { studentHref } from "@/lib/lab/student"
import { EVALUATION_PARAM, StudentEvaluationSheet } from "@/components/lab/student/evaluation-sheet"

export function StudentSkillDetailB() {
  return (
    <StudentFrame
      title={(c) => pickSkill(c)?.name ?? capitalize(skillNoun())}
      primary={(c) => skillPrimary(pickSkill(c), c.studentId)}
      back={(c) => ({ label: "My progress", href: studentHref("home", {}, c.studentId) })}
    >
      {(ctx) => <Body ctx={ctx} />}
    </StudentFrame>
  )
}

function Body({ ctx }: { ctx: StudentFrameCtx }) {
  const r = pickSkill(ctx)
  const rows = useAttempts(ctx.state, ctx.studentId, r?.id)
  const n = useCourseNarrow(rows, ctx.param("course"))
  if (!r) return null
  return (
    <div className="flex flex-col gap-6" data-student-lab="skill-B">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6" data-region="status">
        <div className="flex flex-wrap items-center gap-2">
          <StateLabel record={r} />
          <Overlay record={r} />
        </div>
        <div data-figure="parts"><Parts parts={r.parts} stateLabel={r.label} /></div>
        <AttemptCount state={ctx.state} studentId={ctx.studentId} skillId={r.id} rows={rows} />
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Card data-region="ledger" className="py-0 lg:col-span-8">
          <CardContent className="flex flex-col gap-3 py-4">
            {/* Every course, narrowed to one in the card's own header [REQ SH-06]. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <SectionTitle count={n.shown.length}>Attempts</SectionTitle>
              <AttemptCourseSelect id="skill-b-course" courses={n.courses} total={rows.length} value={n.course} onChange={(v) => ctx.setParams({ course: v === "all" ? null : v })} />
            </div>
            <AttemptLedger rows={n.shown} showCourse={n.course === "all"} onOpen={(id) => ctx.setParams({ [EVALUATION_PARAM]: id })} />
          </CardContent>
        </Card>
        <StudentEvaluationSheet state={ctx.state} studentId={ctx.studentId} evaluationId={ctx.param(EVALUATION_PARAM)} onClose={() => ctx.setParams({ [EVALUATION_PARAM]: null })} />
        <Card data-region="rule" className="py-0 lg:col-span-4">
          <CardContent className="flex flex-col gap-4 py-4">
            <WhyNotCounted record={r} studentId={ctx.studentId} withAction={false} />
            <div className="flex flex-col gap-1">
              <SectionTitle>The rule</SectionTitle>
              <p className="text-sm text-foreground">{r.rule}</p>
              {/* Only when a named setting is short and lab or simulation evidence is already counted [REQ SH-05, SC-12]. */}
              {r.settingNote ? <p className="text-sm text-muted-foreground" data-setting-note>{r.settingNote}</p> : null}
            </div>
            <WhereItCounts model={ctx.model} record={r} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
