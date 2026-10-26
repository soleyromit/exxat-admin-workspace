"use client"

/**
 * Student Offline and sync, variant A: queue ledger (recommended).
 * Tests: does one list of every change on the device, grouped conflict, queued, synced, with one-tap choices inline, make it
 * obvious that nothing is lost?
 * Regions (list budget 4): header · counts and Send now · conflicts (versions side by side, one tap) · queued and synced.
 * [COMP rec 9: device first, queued/synced/conflict visible; complaint digest: lost entries are the loudest complaint]
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { SyncBadge, VersionText, useSyncQueue } from "@/components/lab/student2/sync-parts"
import { SectionTitle } from "@/components/lab/student/parts"
import { VIZ } from "@/components/lab/viz"
import { student2Href, type SyncRow } from "@/lib/lab/student2"
import { shortDate } from "@/lib/v2/format"

export function StudentOfflineA() {
  return (
    <Student2Frame
      title="Offline and sync"
      showSync={false}
      width="wide"
      empty={(c) => <EmptyBlock title="Nothing waiting on this device" body="Everything you logged has reached your program." action={{ label: "Back to My progress", href: student2Href("home", {}, c.studentId) }} />}
    >
      {(ctx) => <Ledger ctx={ctx} />}
    </Student2Frame>
  )
}

const when = (iso: string) => shortDate(iso)

function Ledger({ ctx }: { ctx: Student2Ctx }) {
  const q = useSyncQueue(ctx.state, ctx.studentId, ctx.demo, ctx.offline)
  const [showSynced, setShowSynced] = React.useState(false)
  const conflicts = q.rows.filter((r) => r.state === "conflict")
  const waiting = q.rows.filter((r) => r.state === "queued" || r.state === "failed")
  const synced = q.rows.filter((r) => r.state === "synced")
  return (
    <div className="flex flex-col gap-5" data-student-lab="offline-A">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-region="counts">
        <div className="flex flex-wrap items-center gap-2">
          {q.counts.conflict ? <SyncBadge state="conflict" count={q.counts.conflict} /> : null}
          {q.counts.queued + q.counts.failed ? <SyncBadge state="queued" count={q.counts.queued + q.counts.failed} /> : null}
          {q.counts.synced ? <SyncBadge state="synced" count={q.counts.synced} /> : null}
        </div>
        {ctx.offline || waiting.length === 0 ? null : (
          <Button type="button" variant="outline" size="sm" onClick={q.sendAll}>
            Send now
          </Button>
        )}
      </div>
      {q.last ? <LocalBanner variant={ctx.offline ? "info" : "success"}>{q.last}</LocalBanner> : null}
      {q.sent && !ctx.offline ? <LocalBanner variant="success">Every queued change reached your program.</LocalBanner> : null}

      {conflicts.length ? (
        <section className="flex flex-col gap-3" aria-labelledby="conf-h" data-region="conflicts">
          <SectionTitle id="conf-h" count={conflicts.length}>Choose a version</SectionTitle>
          {conflicts.map((r) => <ConflictCard key={r.id} r={r} onChoose={(c) => q.resolve(r.id, c)} choices={r.conflict ? q.choices(r.conflict) : []} />)}
        </section>
      ) : null}

      <Card className="gap-0 py-0" data-region="queue">
        <CardContent className="flex flex-col gap-1 py-4">
          <SectionTitle count={waiting.length}>On this device</SectionTitle>
          {waiting.length === 0 ? <p className="py-1 text-sm text-muted-foreground">Nothing is waiting to send.</p> : <Rows rows={waiting} />}
          {synced.length ? (
            <Collapsible open={showSynced} onOpenChange={setShowSynced} className="mt-2 border-t border-border pt-2">
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" aria-expanded={showSynced}>
                  <i className={cn("fa-light", showSynced ? "fa-chevron-down" : "fa-chevron-right")} aria-hidden="true" />
                  {`Synced (${synced.length})`}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Rows rows={synced} />
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function Rows({ rows }: { rows: SyncRow[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-foreground" data-viz-label>{r.label}</span>
            <span className="text-xs text-muted-foreground">{`${r.detail} ${when(r.at)}.`}</span>
          </div>
          <SyncBadge state={r.state} />
        </li>
      ))}
    </ul>
  )
}

function ConflictCard({ r, onChoose, choices }: { r: SyncRow; onChoose: (c: "mine" | "theirs" | "both") => void; choices: Array<{ id: "mine" | "theirs" | "both"; label: string }> }) {
  const c = r.conflict
  if (!c) return null
  return (
    <Card className="gap-0 py-0" style={{ borderColor: VIZ.behindEdge }}>
      <CardContent className="flex flex-col gap-3 py-4">
        <h3 className="text-sm font-semibold text-foreground">{r.label}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border p-3"><VersionText who="This device" at={r.at} text={c.mine} /></div>
          <div className="rounded-md border border-border p-3"><VersionText who={c.theirsBy} at={c.theirsAt} text={c.theirs} /></div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {choices.map((x, i) => (
            <Button key={x.id} type="button" variant={i === 0 ? "default" : "outline"} size="sm" className="max-sm:h-11" onClick={() => onChoose(x.id)}>{x.label}</Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
