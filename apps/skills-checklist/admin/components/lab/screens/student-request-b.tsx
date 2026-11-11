"use client"

/**
 * Student Send for evaluation, variant B: situation first (named alternative).
 * Tests: does asking "Is your evaluator with you?" first, with the four ways grouped under the answer (with me: QR code or hand
 * over; not here: email a link; on paper: photo of the signed form), route a student to the right way faster than choosing
 * skills and a person first?
 * The Send design is shared with A and C (student2/request-parts.tsx SendSection, Romit 2026-11-10): the same summary card with
 * Change, inline self-evaluation, who signs off, note disclosure and Send footer. What makes B itself: the way to sign comes
 * first on the page, under the situation question, before what is sent and who signs.
 * [REQ ST-04..ST-13, SL-11, EV-01, EV-02, EV-05, EV-07]
 */
import * as React from "react"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { RequestResult, SavedForLater, SendIssues, SendPageFooter, SendSection, useRequestDraft } from "@/components/lab/student2/request-parts"
import { FormSkeleton } from "./student-log-a"
import { aNoun, skillNounPlural } from "@/lib/lab/terms"
import { LATEST_DATE } from "@/lib/lab/student2"

export function StudentRequestB() {
  return (
    <Student2Frame
      title={`Log ${aNoun()}`}
      fill
      empty={() => <EmptyBlock title={`No ${skillNounPlural()} open yet`} body={`Your program has not set up ${skillNounPlural()} to send. Check back once it has.`} />}
      loading={<FormSkeleton />}
    >
      {(ctx) => <SituationFirst ctx={ctx} />}
    </Student2Frame>
  )
}

function SituationFirst({ ctx }: { ctx: Student2Ctx }) {
  const d = useRequestDraft(ctx, { defaultDate: LATEST_DATE })
  React.useEffect(() => { if (d.result) window.scrollTo({ top: 0 }) }, [!!d.result]) // eslint-disable-line react-hooks/exhaustive-deps
  if (d.result) return <div data-student-lab="request-B" data-step="sent"><RequestResult d={d} wide r={d.result} /></div>
  return (
    <div className="flex flex-1 flex-col gap-5" data-student-lab="request-B" data-step="send">
      <SendIssues d={d} />
      <SavedForLater d={d} />
      <SendSection d={d} editSkills situationFirst />
      <SendPageFooter d={d} />
    </div>
  )
}
