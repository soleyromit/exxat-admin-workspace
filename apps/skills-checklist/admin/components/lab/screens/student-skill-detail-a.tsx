"use client"

/**
 * Student Skill detail, variant A: rule first, then the story of attempts.
 * Tests: does reading the rule as one sentence with its parts as fractions, above a timeline that says why each attempt counted
 * or not, answer "what is left and why" without opening anything else?
 * Regions (detail budget 5): header (state-driven primary) · rule and parts · why it did not count (only when it applies) ·
 * attempt timeline · where it counts. ?skill=<id>, ?student=<id>, ?evaluation=<id> opens a completed evaluation in full, read only
 * (responses and feedback, REQ SH-07).
 */
import { capitalize, skillNoun } from "@/lib/lab/terms"
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { StudentFrame, type StudentFrameCtx } from "@/components/lab/student/frame"
import { Overlay, Parts, SectionTitle, StateLabel } from "@/components/lab/student/parts"
import { AttemptCount, AttemptTimeline, WhereItCounts, WhyNotCounted, pickSkill, skillPrimary, useAttempts } from "@/components/lab/student/skill-detail"
import { studentHref } from "@/lib/lab/student"
import { EVALUATION_PARAM, StudentEvaluationSheet } from "@/components/lab/student/evaluation-sheet"

export function StudentSkillDetailA() {
  return (
    <StudentFrame
      title={(c) => pickSkill(c)?.name ?? capitalize(skillNoun())}
      width="wide"
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
  if (!r) return null
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12" data-student-lab="skill-A">
      <Card data-region="rule" className="py-0 lg:col-span-12">
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <StateLabel record={r} />
            <Overlay record={r} />
          </div>
          <p className="text-sm text-foreground">{r.rule}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div data-figure="parts"><Parts parts={r.parts} /></div>
            <AttemptCount state={ctx.state} studentId={ctx.studentId} skillId={r.id} />
          </div>
          <WhyNotCounted record={r} studentId={ctx.studentId} withAction={false} />
        </CardContent>
      </Card>
      <Card data-region="attempts" className="py-0 lg:col-span-8">
        <CardContent className="flex flex-col gap-3 py-4">
          <SectionTitle count={rows.length}>Attempts</SectionTitle>
          <AttemptTimeline rows={rows} onOpen={(id) => ctx.setParams({ [EVALUATION_PARAM]: id })} />
        </CardContent>
      </Card>
      <StudentEvaluationSheet state={ctx.state} studentId={ctx.studentId} evaluationId={ctx.param(EVALUATION_PARAM)} onClose={() => ctx.setParams({ [EVALUATION_PARAM]: null })} />
      <Card data-region="where" className="py-0 lg:col-span-4">
        <CardContent className="flex flex-col gap-3 py-4">
          <SectionTitle>Where it counts</SectionTitle>
          <WhereItCounts model={ctx.model} record={r} />
        </CardContent>
      </Card>
    </div>
  )
}
