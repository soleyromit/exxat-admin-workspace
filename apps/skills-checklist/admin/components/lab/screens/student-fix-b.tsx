"use client"

/**
 * Student Fix a returned or did-not-qualify submission, variant B: before and after, side by side.
 * Tests: does seeing what the evaluator or reviewer saw next to the new draft (Platinum Planner's correction view) reduce a
 * second return better than a guided column?
 * Regions (form budget 4): header · path line · what they saw (read only) · your correction or attempt (form).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { StudentFrame, type StudentFrameCtx } from "@/components/lab/student/frame"
import { ChangeList, FixForm, NothingToFix, PathLine, ReasonBlock, useFix, useFixDraft } from "@/components/lab/student/fix"
import { NUM_LINK, SectionTitle } from "@/components/lab/student/parts"
import { fixTitleOf } from "@/components/lab/screens/student-fix-a"
import { shortDate, studentHref } from "@/lib/lab/student"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"

export function StudentFixB() {
  return (
    <StudentFrame title={fixTitleOf} back={(c) => ({ label: "My requests", href: studentHref("my-requests", {}, c.studentId) })}>
      {(ctx) => <Body ctx={ctx} />}
    </StudentFrame>
  )
}

function Body({ ctx }: { ctx: StudentFrameCtx }) {
  const f = useFix(ctx)
  const api = useFixDraft(f)
  if (!f) return <NothingToFix studentId={ctx.studentId} />
  return (
    <div className="flex flex-col gap-4" data-student-lab="fix-B">
      <div data-region="path"><PathLine f={f} /></div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Card data-region="original" className="py-0 lg:col-span-5">
          <CardContent className="flex flex-col gap-3 py-4">
            <SectionTitle>{f.case === "correction" ? "What the reviewer saw" : "The attempt that did not count"}</SectionTitle>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{capitalize(f.skillIds.length > 1 ? skillNounPlural() : skillNoun())}</dt>
              <dd className="flex flex-col gap-0.5">
                {f.skillIds.map((id, i) => <Link key={id} className={NUM_LINK} href={studentHref("skill-detail", { skill: id }, ctx.studentId)}>{f.skillNames[i]}</Link>)}
              </dd>
              <dt className="text-muted-foreground">Evaluator</dt>
              <dd className="text-foreground">{f.evaluatorName}</dd>
              <dt className="text-muted-foreground">Setting</dt>
              <dd className="text-foreground">{f.setting}</dd>
              <dt className="text-muted-foreground">{f.case === "correction" ? "Returned" : "Answered"}</dt>
              <dd className="text-foreground">{shortDate(f.reasonAt)}</dd>
              {f.studentNote ? (
                <>
                  <dt className="text-muted-foreground">Your note</dt>
                  <dd className="text-foreground">{f.studentNote}</dd>
                </>
              ) : null}
            </dl>
            <ReasonBlock f={f} />
          </CardContent>
        </Card>
        <Card data-region="form" className="py-0 lg:col-span-7">
          <CardContent className="flex flex-col gap-5 py-4">
            <SectionTitle>{f.case === "correction" ? `Your correction, revision ${f.nextNumber}` : `Your attempt ${f.nextNumber}`}</SectionTitle>
            {api.sent ? null : <ChangeList f={f} api={api} />}
            <FixForm f={f} api={api} offline={ctx.demo === "offline"} studentId={ctx.studentId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
