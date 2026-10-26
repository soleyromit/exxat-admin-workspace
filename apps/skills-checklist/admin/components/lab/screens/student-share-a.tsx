"use client"

/**
 * Student Share record, variant A: the preview is the page (recommended).
 * Tests: does seeing exactly what a reader will get (evaluator sign-offs, gaps stated, what stays private) beside the link, expiry
 * and the PDF and CLR 2.0 exports build enough trust to share?
 * Regions (detail budget 4): back link + header · preview (the document) · status · link and exports.
 * Maya is not verified in the seed, so sharing is closed with the reason; `?state=verified` shows the open path (demo).
 * [COMP rec 11 portable verified record; glossary: verification is a v2 proposal, not REQ]
 */
import { skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Separator } from "@exxatdesignux/ui/components/ui/separator"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { ExportButtons, LinkPanel, SharePreview, ShareStatus, useShareLink } from "@/components/lab/student2/share-parts"
import { shareModel, student2Href } from "@/lib/lab/student2"

export function StudentShareA() {
  return (
    <Student2Frame
      title="Share record"
      back={(c) => ({ label: "Record", href: student2Href("record", {}, c.studentId) })}
      empty={(c) => <EmptyBlock title="Nothing to share yet" body={`Achieved ${skillNounPlural()} appear here once evaluators sign them off.`} action={{ label: "Send for evaluation", href: student2Href("request-signoff", {}, c.studentId) }} />}
      loading={<ShareSkeleton />}
    >
      {(ctx) => <PreviewPage ctx={ctx} />}
    </Student2Frame>
  )
}

export function ShareSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-12" aria-hidden="true">
      <Skeleton className="h-[28rem] lg:col-span-8" />
      <Skeleton className="h-64 lg:col-span-4" />
    </div>
  )
}

function PreviewPage({ ctx }: { ctx: Student2Ctx }) {
  const share = React.useMemo(() => shareModel(ctx.state, ctx.model, ctx.demo === "verified"), [ctx.state, ctx.model, ctx.demo])
  const api = useShareLink()
  const blocked = !!share.blocked
  return (
    <div className="grid gap-5 lg:grid-cols-12" data-student-lab="share-A">
      <Card className="order-2 gap-0 py-0 lg:order-1 lg:col-span-8">
        <CardContent className="py-5">
          <SharePreview student={ctx.model.student} share={share} school={ctx.state.program.school} />
        </CardContent>
      </Card>
      <div className="order-1 lg:order-2 lg:col-span-4">
        <Card className="gap-0 py-0 lg:sticky lg:top-4">
          <CardContent className="flex flex-col gap-4 py-4">
            <ShareStatus share={share} />
            {blocked ? null : (
              <>
                <Separator />
                <LinkPanel api={api} studentId={ctx.studentId} blocked={blocked} />
                <ExportButtons student={ctx.model.student} share={share} blocked={blocked} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
