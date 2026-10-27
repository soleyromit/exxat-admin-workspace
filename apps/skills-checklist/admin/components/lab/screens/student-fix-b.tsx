"use client"

/**
 * Student Fix a returned or did-not-qualify submission, variant B: before and after.
 * Tests: does seeing what the evaluator or reviewer saw next to the new draft (Platinum Planner's correction view) reduce a second
 * return better than a summary of the new one?
 * Same page as A (compact reason banner, path said once, numbered sections, Send footer; Romit 2026-10-27 "Need a better form
 * layout"); the column beside the form from 1280 px holds the original (read only) instead of the summary, and below 1280 px the
 * original sits above the form. [REQ RV-01..RV-05, ST-05..ST-10, ST-12, ST-13]
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import type { StudentFrameCtx } from "@/components/lab/student/frame"
import { FixPage } from "@/components/lab/student/fix"
import { NUM_LINK } from "@/components/lab/student/parts"
import { TYPE } from "@/components/lab/type-scale"
import { shortDate, studentHref, type FixModel } from "@/lib/lab/student"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"

function Original({ f, ctx }: { f: FixModel; ctx: StudentFrameCtx }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="fix-original-h" data-region="original">
      <h2 id="fix-original-h" className={TYPE.section}>{f.case === "attempt" ? `Attempt ${f.nextNumber - 1}` : f.origin === "waiting" ? "What you sent" : "What the reviewer saw"}</h2>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{capitalize(f.skillIds.length > 1 ? skillNounPlural() : skillNoun())}</dt>
        <dd className="flex flex-col gap-0.5">
          {f.skillIds.map((id, i) => <Link key={id} className={NUM_LINK} href={studentHref("skill-detail", { skill: id }, ctx.studentId)}>{f.skillNames[i]}</Link>)}
        </dd>
        <dt className="text-muted-foreground">Evaluator</dt>
        <dd className="text-foreground">{f.evaluatorName}</dd>
        <dt className="text-muted-foreground">Setting</dt>
        <dd className="text-foreground">{f.setting}</dd>
        <dt className="text-muted-foreground">{f.case === "attempt" ? "Answered" : f.origin === "waiting" ? "Sent" : "Returned"}</dt>
        <dd className="text-foreground">{shortDate(f.reasonAt)}</dd>
        {f.studentNote ? (
          <>
            <dt className="text-muted-foreground">Your note</dt>
            <dd className="text-foreground"><q data-user-content>{f.studentNote}</q></dd>
          </>
        ) : null}
      </dl>
    </section>
  )
}

export function StudentFixB() {
  return (
    <FixPage
      marker="fix-B"
      aside={(f, api, ctx) => (api.sent ? null : <Original f={f} ctx={ctx} />)}
      inline={(f, ctx) => (
        <Card className="max-w-[40rem] gap-0 py-0">
          <CardContent className="py-4"><Original f={f} ctx={ctx} /></CardContent>
        </Card>
      )}
    />
  )
}
