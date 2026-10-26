"use client"

/**
 * Student Fix a returned or did-not-qualify submission, variant A: guided, one column.
 * Tests: does reading the reason, ticking what to change, then sending, in one short column, get a correct resubmission in
 * one pass, with the path (correction or further attempt) named before the student acts?
 * Regions (form budget 4): header · reason and path · what to change and send. ?submission=<id> or ?skill=<id>, ?student=<id>.
 * Maya has no returned submission; ?student=stu-g-067 shows the correction path on real data.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { StudentFrame, type StudentFrameCtx } from "@/components/lab/student/frame"
import { ChangeList, FixForm, NothingToFix, PathLine, ReasonBlock, fixTitle, useFix, useFixDraft } from "@/components/lab/student/fix"
import { NUM_LINK } from "@/components/lab/student/parts"
import { fixModel, studentHref } from "@/lib/lab/student"

export const fixTitleOf = (c: StudentFrameCtx) => fixTitle(fixModel(c.state, c.studentId, { submissionId: c.param("submission"), skillId: c.param("skill") }))

export function StudentFixA() {
  return (
    <StudentFrame title={fixTitleOf} width="reading" back={(c) => ({ label: "My requests", href: studentHref("my-requests", {}, c.studentId) })}>
      {(ctx) => <Body ctx={ctx} />}
    </StudentFrame>
  )
}

function Body({ ctx }: { ctx: StudentFrameCtx }) {
  const f = useFix(ctx)
  const api = useFixDraft(f)
  if (!f) return <NothingToFix studentId={ctx.studentId} />
  return (
    <div className="flex flex-col gap-5" data-student-lab="fix-A">
      <section className="flex flex-col gap-3" data-region="reason" aria-label="Why it came back">
        <p className="text-sm text-muted-foreground">
          {f.skillIds.map((id, i) => (
            <React.Fragment key={id}>
              <Link className={NUM_LINK} href={studentHref("skill-detail", { skill: id }, ctx.studentId)}>{f.skillNames[i]}</Link>
              {i < f.skillIds.length - 1 ? ", " : ""}
            </React.Fragment>
          ))}
        </p>
        <ReasonBlock f={f} />
        <PathLine f={f} />
      </section>
      <Card data-region="form" className="py-0">
        <CardContent className="flex flex-col gap-5 py-4">
          {api.sent ? null : <ChangeList f={f} api={api} />}
          <FixForm f={f} api={api} offline={ctx.demo === "offline"} studentId={ctx.studentId} />
        </CardContent>
      </Card>
    </div>
  )
}
