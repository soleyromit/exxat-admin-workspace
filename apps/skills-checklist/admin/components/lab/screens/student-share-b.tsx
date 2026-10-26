"use client"

/**
 * Student Share record, variant B: recipient first (named alternative).
 * Tests: does picking who it is for (employer, another school, licensing board) and letting that set the format and expiry share
 * faster and with fewer mistakes than a preview with controls?
 * Regions (form budget 4): back link + header · who it is for · what they get (summary, preview behind a disclosure) · the one action.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { TOUCH_ROW } from "@/components/lab/student2/touch"
import { LinkPanel, SharePreview, ShareStatus, downloadClr, useShareLink } from "@/components/lab/student2/share-parts"
import { ShareSkeleton } from "./student-share-a"
import { skillNounPlural } from "@/lib/lab/terms"
import { fmt } from "@/lib/v2/format"
import { shareModel, student2Href } from "@/lib/lab/student2"

type Recipient = "employer" | "school" | "board"

const RECIPIENTS: Array<{ id: Recipient; title: string; gets: string; icon: string }> = [
  { id: "employer", title: "An employer", gets: "A link for 30 days", icon: "fa-briefcase" },
  { id: "school", title: "Another school", gets: "A CLR 2.0 file", icon: "fa-building-columns" },
  { id: "board", title: "A licensing board", gets: "A PDF", icon: "fa-file-lines" },
]

export function StudentShareB() {
  return (
    <Student2Frame
      title="Share record"
      width="wide"
      back={(c) => ({ label: "Record", href: student2Href("record", {}, c.studentId) })}
      empty={(c) => <EmptyBlock title="Nothing to share yet" body={`Achieved ${skillNounPlural()} appear here once evaluators sign them off.`} action={{ label: "Send for evaluation", href: student2Href("request-signoff", {}, c.studentId) }} />}
      loading={<ShareSkeleton />}
    >
      {(ctx) => <RecipientFirst ctx={ctx} />}
    </Student2Frame>
  )
}

function RecipientFirst({ ctx }: { ctx: Student2Ctx }) {
  const share = React.useMemo(() => shareModel(ctx.state, ctx.model, ctx.demo === "verified"), [ctx.state, ctx.model, ctx.demo])
  const [to, setTo] = React.useState<Recipient>("employer")
  const [open, setOpen] = React.useState(false)
  const api = useShareLink()
  const blocked = !!share.blocked
  return (
    <div className="flex flex-col gap-5" data-student-lab="share-B">
      <Card className="gap-0 py-0" data-region="recipient">
        <CardContent className="flex flex-col gap-4 py-4">
          <FieldSet>
            <FieldLegend variant="label">Who is it for?</FieldLegend>
            <RadioGroup value={to} onValueChange={(v) => setTo(v as Recipient)} className="grid gap-2 sm:grid-cols-3" aria-label="Who is it for?">
              {RECIPIENTS.map((r) => (
                <Label key={r.id} htmlFor={`to-${r.id}`} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/40", TOUCH_ROW)}>
                  <RadioGroupItem value={r.id} id={`to-${r.id}`} className="mt-0.5" />
                  <span className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <i className={`fa-light ${r.icon} text-muted-foreground`} aria-hidden="true" />
                      {r.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{r.gets}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0" data-region="gets">
        <CardContent className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <dl className="flex flex-wrap gap-x-8 gap-y-3">
              <Figure value={share.skills.length} label={`${skillNounPlural()} achieved`} />
              <Figure value={share.evidence} label="evaluator sign-offs" />
              <Figure value={share.gaps.length} label="required gaps, stated" />
            </dl>
            <div className="sm:w-72"><ShareStatus share={share} /></div>
          </div>
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-expanded={open}>
                <i className={cn("fa-light", open ? "fa-chevron-down" : "fa-chevron-right")} aria-hidden="true" />
                {open ? "Hide what they see" : "See what they see"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 rounded-lg border border-border p-4">
                <SharePreview student={ctx.model.student} share={share} school={ctx.state.program.school} />
              </div>
            </CollapsibleContent>
          </Collapsible>
          {blocked ? null : (
            <div className="border-t border-border pt-4 sm:max-w-sm">
              {to === "employer" ? (
                <LinkPanel api={api} studentId={ctx.studentId} blocked={blocked} />
              ) : (
                <Button type="button" variant="default" size="default" className="w-full max-sm:h-11" onClick={() => (to === "school" ? downloadClr(ctx.model.student, share) : window.print())}>
                  {to === "school" ? "Download CLR 2.0 file" : "Download PDF"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse gap-0.5" data-figure="kpi">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl font-semibold leading-none tabular-nums text-foreground">{fmt(value)}</dd>
    </div>
  )
}
