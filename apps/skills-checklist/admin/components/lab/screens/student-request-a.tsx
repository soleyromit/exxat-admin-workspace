"use client"

/**
 * Student Send for evaluation, variant A: one page, who then how (recommended).
 * Tests: on one page with no steps, do the skills (two likely ones chosen for you, changed in place), then the evaluator (three
 * suggestions, anyone by search, or someone not listed by name and email), then one of four illustrated ways to reach them, with
 * one Send, get a request out fastest?
 * The Send design is shared with B and C (student2/request-parts.tsx SendSection, Romit 2026-11-10: "This screen isn't simple at
 * all"): a summary card with Change (skills, where, date performed, capped at the program's today), the self-evaluation inline
 * when a chosen skill asks for one, who signs off, how they sign, a note behind a disclosure, and the Send footer. What makes A
 * itself: one page, skills chosen in place from the whole library, no course step (C) and no situation question first (B).
 * [REQ ST-04..ST-13, SL-11, EV-01, EV-02, EV-05, EV-07; LEDGER D-L2 one link per request]
 */
import * as React from "react"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { RequestResult, SavedForLater, SendIssues, SendPageFooter, SendSection, useRequestDraft } from "@/components/lab/student2/request-parts"
import { FormSkeleton } from "./student-log-a"
import { aNoun, skillNounPlural } from "@/lib/lab/terms"
import { LATEST_DATE } from "@/lib/lab/student2"

export function StudentRequestA() {
  return (
    <Student2Frame
      title={`Log ${aNoun()}`}
      fill
      empty={() => <EmptyBlock title={`No ${skillNounPlural()} open yet`} body={`Your program has not set up ${skillNounPlural()} to send. Check back once it has.`} />}
      loading={<FormSkeleton />}
    >
      {(ctx) => <RequestForm ctx={ctx} />}
    </Student2Frame>
  )
}

function RequestForm({ ctx }: { ctx: Student2Ctx }) {
  // Date performed starts on today, on the program's clock, as on C [REQ ST-10].
  const d = useRequestDraft(ctx, { defaultDate: LATEST_DATE })
  React.useEffect(() => { if (d.result) window.scrollTo({ top: 0 }) }, [!!d.result]) // eslint-disable-line react-hooks/exhaustive-deps
  if (d.result) return <div data-student-lab="request-A" data-step="sent"><RequestResult d={d} wide r={d.result} /></div>
  return (
    <div className="flex flex-1 flex-col gap-5" data-student-lab="request-A" data-step="send">
      <SendIssues d={d} />
      <SavedForLater d={d} />
      <SendSection d={d} editSkills />
      <SendPageFooter d={d} />
    </div>
  )
}
