"use client"

/**
 * Student Offline and sync, variant B: one at a time (named alternative).
 * Tests: does resolving each conflict with the two versions side by side as a single choice, the rest summarised in one line,
 * resolve conflicts faster than a grouped ledger?
 * Regions (form budget 3): header · the current conflict (choose one version, then Keep) · one status line with every change behind it.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { FieldError, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { SyncBadge, VersionText, useSyncQueue, type Choice } from "@/components/lab/student2/sync-parts"
import { TOUCH_ROW } from "@/components/lab/student2/touch"
import { student2Href } from "@/lib/lab/student2"

export function StudentOfflineB() {
  return (
    <Student2Frame
      title="Offline and sync"
      showSync={false}
      width="reading"
      empty={(c) => <EmptyBlock title="Nothing waiting on this device" body="Everything you logged has reached your program." action={{ label: "Back to My progress", href: student2Href("home", {}, c.studentId) }} />}
    >
      {(ctx) => <OneAtATime ctx={ctx} />}
    </Student2Frame>
  )
}

function OneAtATime({ ctx }: { ctx: Student2Ctx }) {
  const q = useSyncQueue(ctx.state, ctx.studentId, ctx.demo, ctx.offline)
  const conflicts = q.rows.filter((r) => r.state === "conflict")
  const total = React.useRef(conflicts.length)
  if (conflicts.length > total.current) total.current = conflicts.length
  const current = conflicts[0]
  const [pick, setPick] = React.useState<Choice | "">("")
  const [tried, setTried] = React.useState(false)
  const [all, setAll] = React.useState(false)
  // The button stays enabled (no disabled control above the fold); pressing it without a choice says what is missing.
  const keep = () => {
    setTried(true)
    if (!current || !pick) return
    q.resolve(current.id, pick)
    setPick("")
    setTried(false)
  }
  const c = current?.conflict
  const n = total.current - conflicts.length + 1
  return (
    <div className="flex flex-col gap-5" data-student-lab="offline-B">
      {q.last ? <LocalBanner variant={ctx.offline ? "info" : "success"}>{q.last}</LocalBanner> : null}
      {current && c ? (
        <Card className="gap-0 py-0" data-region="conflict">
          <CardContent className="flex flex-col gap-4 py-4">
            <FieldSet>
              <FieldLegend variant="label">{total.current > 1 ? `Conflict ${n} of ${total.current}: ${current.label}` : current.label}</FieldLegend>
              <RadioGroup value={pick} onValueChange={(v) => setPick(v as Choice)} className="grid gap-2 sm:grid-cols-2" aria-label="Version to keep">
                <Version id="mine" title="This device" at={current.at} text={c.mine} />
                <Version id="theirs" title={c.theirsBy} at={c.theirsAt} text={c.theirs} />
                {c.field === "note" ? (
                  <Label htmlFor="v-both" className={cn("flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2 font-normal has-[[data-state=checked]]:border-foreground sm:col-span-2", TOUCH_ROW)}>
                    <RadioGroupItem value="both" id="v-both" />
                    <span className="text-sm text-foreground">Combine into one note</span>
                  </Label>
                ) : null}
              </RadioGroup>
              {tried && !pick ? <FieldError>Choose a version to keep.</FieldError> : null}
            </FieldSet>
            <Button type="button" variant="default" size="default" className="self-start max-sm:h-11 max-sm:w-full" onClick={keep}>Keep this version</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="gap-0 py-0" data-region="conflict">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-foreground">
            <i className="fa-solid fa-circle-check" aria-hidden="true" />
            No conflicts. Nothing on this device is lost.
          </CardContent>
        </Card>
      )}

      <Collapsible open={all} onOpenChange={setAll} data-region="status">
        <div className="flex flex-wrap items-center gap-2">
          <SyncBadge state="queued" count={q.counts.queued + q.counts.failed} />
          <SyncBadge state="synced" count={q.counts.synced} />
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" aria-expanded={all}>{all ? "Hide changes" : "Show every change"}</Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <ul className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border px-3">
            {q.rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{r.label}</span>
                <SyncBadge state={r.state} />
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function Version({ id, title, at, text }: { id: Choice; title: string; at: string; text: string }) {
  return (
    <Label htmlFor={`v-${id}`} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/40">
      <RadioGroupItem value={id} id={`v-${id}`} className="mt-0.5" />
      <VersionText who={title} at={at} text={text} />
    </Label>
  )
}
