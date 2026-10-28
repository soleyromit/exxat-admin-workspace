"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { KeyMetrics, type MetricItem } from "@exxatdesignux/ui/components/ui/key-metrics"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { SignalBarsCell } from "@exxatdesignux/ui/components/data-views/table-cells"
import type { ActiveFilter } from "@exxatdesignux/ui/lib/table-properties-types"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { PageFrame } from "@/components/skills/page-header"
import { useStaff } from "@/components/v2/outcomes/staff"
import { fmtDay } from "@/components/v2/outcomes/version-timeline"
import { StatusPill } from "@/components/v2/status-pill"
import { V2FilterBar, filterValue, v2SelectField } from "@/components/v2/v2-filter-bar"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { contextLine } from "@/lib/v2/page-context"
import { METHOD_WORD } from "@/lib/v2/student"
import { ageBucket, ageDays, agreementCounts, itemAgreement, oldestItem, type AgeBucket } from "@/lib/v2/queue-viz"
import { approveBlock, approveItems, itemLabel, joinNames, locationOf, queueItems, reassignOptions, reassignRequest, returnedItems, ROLE_LABEL, stalledRequests, type Agreement, type BlockedItem, type QueueItem, type ReturnedItem } from "@/lib/v2/queue"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { RoleId, Submission, V2State } from "@/lib/v2/types"
import { LoadingBlocks } from "@/components/v2/shared-loading"

type Tab = "awaiting" | "stalled" | "returned"
const AGREE_KEYS: Agreement[] = ["agreed", "differed", "not-comparable"]
const AGREE_LABEL: Record<Agreement, string> = { agreed: "Agreed", differed: "Differed", "not-comparable": "Not comparable" }
const SETTING_OPTIONS = [
  { value: "clinical", label: "Clinical" },
  { value: "lab", label: "Lab" },
  { value: "simulation", label: "Simulation" },
]
const SOURCE_OPTIONS = [
  { value: "evaluator", label: "Evaluator form" },
  { value: "paper-form", label: "Paper form" },
]

const BUCKET_BARS: Record<AgeBucket, number> = { recent: 1, waiting: 2, overdue: 3 }

/** Days waiting as text beside the DS signal bars (1 to 3 filled), so the bucket never relies on colour alone. */
function AgeCell({ since }: { since: string }) {
  const days = ageDays(since)
  const bucket = ageBucket(days)
  return (
    <span className="inline-flex items-center gap-2 tabular-nums" data-age={days} data-age-bucket={bucket}>
      <SignalBarsCell level={BUCKET_BARS[bucket]} max={3} tone={bucket === "overdue" ? "warning" : "neutral"} label="Days since the evaluator finished or the photo arrived" />
      {`${days} ${plural(days, "day", "days")}`}
    </span>
  )
}

interface Msg {
  kind: "success" | "warning" | "error"
  title: string
  text: string
  blocked?: BlockedItem[]
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const name = (s: V2State, id: string | null | undefined) => (id ? (s.people.find((p) => p.id === id)?.name ?? "Unknown person") : "Not named yet")
const skills = (s: V2State, ids: string[]) => joinNames(ids.map((id) => s.skills.find((k) => k.id === id)?.name ?? "A skill"))

function settingText(s: V2State, i: QueueItem): string {
  const parts = [...new Set(i.evaluations.map((e) => (e.setting === "clinical" ? `Clinical, ${e.clinicalSetting ?? "setting not recorded"}` : e.setting === "lab" ? "Lab" : "Simulation")))]
  return parts.length ? parts.join("; ") : "Clinical, set when the outcome is entered"
}

function locationText(s: V2State, i: QueueItem): string {
  const locs = [...new Set(i.skillIds.map((id) => locationOf(s, i.studentId, id, i.submission, i.evaluations.find((e) => e.skillId === id)?.clinicalSetting)).filter((x): x is string => !!x))]
  return locs.length ? locs.join("; ") : "Not recorded"
}

/** Walkthrough step 10: everything waiting for review, bulk approve, stalled requests to reassign, and what is out with students. */
export function ReviewQueuePage({ role }: { role: RoleId }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const { actorId, run } = useStaff(role)
  const [tab, setTab] = React.useState<Tab>("awaiting")
  const [msg, setMsg] = React.useState<Msg | null>(null)
  const [bulkKeys, setBulkKeys] = React.useState<string[] | null>(null)
  const msgRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (msg) msgRef.current?.scrollIntoView({ block: "nearest" })
  }, [msg])
  const [reassign, setReassign] = React.useState<Submission | null>(null)
  const items = queueItems(s)
  const stalled = stalledRequests(s)
  const returned = returnedItems(s)
  const base = `/v2/${role}/review-queue`
  const [filters, setFilters] = React.useState<ActiveFilter[]>([])
  const [method, setMethod] = React.useState(false)
  const counts = agreementCounts(s, items)
  const agreeSel = filterValue(filters, "agreement")
  const settingSel = filterValue(filters, "setting")
  const sourceSel = filterValue(filters, "source")
  const shown = items.filter((i) => (!agreeSel || itemAgreement(s, i) === agreeSel) && (!settingSel || i.evaluations.some((e) => e.setting === settingSel)) && (!sourceSel || i.source === sourceSel))
  const filterFields = [
    v2SelectField("agreement", "Self-rating", AGREE_KEYS.map((k) => ({ value: k, label: `${AGREE_LABEL[k]} (${counts[k]})` })), "fa-scale-balanced"),
    v2SelectField("setting", "Setting", SETTING_OPTIONS, "fa-hospital"),
    v2SelectField("source", "Source", SOURCE_OPTIONS, "fa-file-lines"),
  ]
  const oldest = oldestItem(items)
  const metrics: MetricItem[] = [
    { id: "awaiting", label: "Awaiting review", value: items.length, delta: "", trend: "neutral" },
    { id: "oldest", label: "Oldest waiting", value: oldest ? `${oldest.days} ${plural(oldest.days, "day", "days")}` : "None", delta: "", trend: "neutral", description: oldest ? `${name(s, oldest.item.studentId)}, ${skills(s, oldest.item.skillIds)}` : undefined },
    { id: "stalled", label: "Stalled requests", value: stalled.length, delta: "", trend: "neutral" },
    { id: "returned", label: "Returned to students", value: returned.length, delta: "", trend: "neutral" },
  ]

  if (!hydrated && items.length === 0) {
    return (
      <PageFrame title="Review and approve">
        <LoadingBlocks label="Opening the queue" rows={5} />
      </PageFrame>
    )
  }

  return (
    <PageFrame
      title="Review and approve"
      subtitle={contextLine(s)}
      actionItems={[{ id: "how", label: "How this is counted", icon: "fa-circle-info", placement: "overflow", onSelect: () => setMethod(true) }]}
    >
      <div className="flex flex-col gap-6" data-review-queue>
        <section aria-label="Review summary">
          <KeyMetrics variant="cards" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
        </section>

        <div ref={msgRef} role="status" aria-live="polite" className="flex scroll-mt-4 flex-col gap-2">
          {msg ? (
            <LocalBanner variant={msg.kind} title={msg.title} data-queue-message>
              <p>{msg.text}</p>
              {msg.blocked && msg.blocked.length > 0 ? (
                <ul className="mt-1 flex list-disc flex-col gap-1 ps-5" aria-label="Items that stayed in the queue" data-blocked-list>
                  {msg.blocked.map((b) => (
                    <li key={b.key}>{`${b.label}: ${b.reason}`}</li>
                  ))}
                </ul>
              ) : null}
            </LocalBanner>
          ) : null}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList variant="line" aria-label="Review queue sections" className="rounded-md focus-visible:ring-3 focus-visible:ring-ring/50">
            <TabsTrigger value="awaiting">{`Awaiting (${items.length})`}</TabsTrigger>
            <TabsTrigger value="stalled">{`Stalled (${stalled.length})`}</TabsTrigger>
            <TabsTrigger value="returned">{`Returned (${returned.length})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="awaiting" className="flex flex-col gap-3 rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {items.length === 0 ? (
              <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground" data-empty="awaiting">Nothing is waiting. New evaluations and paper form photos appear here.</p>
            ) : (
              <>
                <div data-agreement-filter>
                  <V2FilterBar fields={filterFields} filters={filters} onChange={setFilters} resultCount={shown.length} resultNoun="items" emptyMessage="No items match these filters." />
                </div>
                <V2Grid<QueueItem>
                  caption="Items awaiting review"
                  rows={shown}
                  id={(i) => i.key}
                  emptyText="Nothing matches this filter."
                  selectable
                  rowLabel={(i) => itemLabel(s, i)}
                  bulkActions={(keys) => (
                    <Button type="button" variant="default" size="sm" onClick={() => { setMsg(null); setBulkKeys(keys) }} data-bulk-approve>
                      {`Approve ${keys.length} ${plural(keys.length, "submission", "submissions")}`}
                    </Button>
                  )}
                  columns={[
                    // The DS DataTable draws its own checkbox cell for the column keyed "select".
                    v2col<QueueItem>("select", "Select", 48, () => null),
                    v2col<QueueItem>("student", "Student", 170, (i) => (
                      <Link href={`${base}/${i.key}`} aria-label={`Review ${itemLabel(s, i)}`} className="rounded-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {name(s, i.studentId)}
                      </Link>
                    )),
                    v2col<QueueItem>("skills", "Skills", 230, (i) => skills(s, i.skillIds)),
                    v2col<QueueItem>("evaluator", "Evaluator and role", 190, (i) => {
                      const p = s.people.find((x) => x.id === i.evaluatorId)
                      return p ? `${p.name}, ${ROLE_LABEL[p.kind].toLowerCase()}` : "Not named yet"
                    }),
                    v2col<QueueItem>("age", "Age", 120, (i) => <AgeCell since={i.since} />),
                    v2col<QueueItem>("status", "Status", 250, (i) => {
                      const why = approveBlock(s, i)
                      return why ? (
                        <Tip label={why}>
                          <span><StatusPill kind="queue" value={i.state === "needs-outcome" ? "needs-outcome" : "blocked"} /></span>
                        </Tip>
                      ) : <StatusPill kind="queue" value="ready" />
                    }),
                    v2col<QueueItem>("agreement", "Self-rating", 190, (i) => (
                      <Tip label="The student's self-rating compared with the evaluator's outcome">
                        <span><StatusPill kind="agreement" value={itemAgreement(s, i)} /></span>
                      </Tip>
                    )),
                    v2col<QueueItem>("setting", "Setting", 190, (i) => settingText(s, i)),
                    v2col<QueueItem>("location", "Location", 180, (i) => locationText(s, i)),
                    v2col<QueueItem>("course", "Course", 90, () => s.course.code),
                    v2col<QueueItem>("source", "Source", 130, (i) => (i.source === "paper-form" ? "Paper form" : i.source === "checkoff" ? "Group check-off" : "Evaluator form")),
                    v2col<QueueItem>("since", "Since", 90, (i) => fmtDay(i.since)),
                  ]}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="stalled" className="flex flex-col gap-3 rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {stalled.length === 0 ? (
              <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground" data-empty="stalled">No stalled requests.</p>
            ) : (
              <V2Grid<Submission>
                caption="Stalled requests"
                rows={stalled}
                id={(x) => x.id}
                selectable={false}
                columns={[
                  v2col<Submission>("student", "Student", 150, (x) => name(s, x.studentId)),
                  v2col<Submission>("skills", "Skills", 230, (x) => skills(s, x.skillIds)),
                  v2col<Submission>("with", "With", 180, (x) => name(s, x.assignedToId)),
                  v2col<Submission>("sent", "Sent by", 140, (x) => METHOD_WORD[x.method]),
                  v2col<Submission>("days", "Waiting", 110, (x) => `${x.daysWaiting} ${plural(x.daysWaiting, "day", "days")}`),
                  v2col<Submission>("act", "Action", 170, (x) => (
                    <Button type="button" variant="outline" size="sm" onClick={() => { setMsg(null); setReassign(x) }} aria-label={`Reassign request for ${itemLabel(s, x)}`} data-reassign={x.id}>
                      Reassign request
                    </Button>
                  )),
                ]}
              />
            )}
          </TabsContent>

          <TabsContent value="returned" className="flex flex-col gap-3 rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {returned.length === 0 ? (
              <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground" data-empty="returned">Nothing is out with a student.</p>
            ) : (
              <V2Grid<ReturnedItem>
                caption="Returned to students"
                rows={returned}
                id={(r) => r.key}
                selectable={false}
                columns={[
                  v2col<ReturnedItem>("student", "Student", 150, (r) => name(s, r.studentId)),
                  v2col<ReturnedItem>("skills", "Skills", 230, (r) => skills(s, r.skillIds)),
                  v2col<ReturnedItem>("by", "Returned by", 150, (r) => `${name(s, r.byId)}, ${fmtDay(r.at)}`),
                  v2col<ReturnedItem>("reason", "Reason given", 360, (r) => r.reason),
                  v2col<ReturnedItem>("rev", "Revision", 100, (r) => `${r.submission?.revisions ?? 0} sent again`),
                ]}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={method} onOpenChange={setMethod}>
        <SheetContent side="right" size="lg" data-how-counted-sheet>
          <SheetHeader>
            <SheetTitle>How this is counted</SheetTitle>
            <SheetDescription>
              Approved evaluations count toward the student&apos;s record at once. Returned items do not count, and the student reads your reason. A paper form photo has no outcome until you enter it from the form and approve. Age is days since the evaluator finished. Agreed means the self-rating matched.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
      <BulkDialog
        open={bulkKeys !== null}
        keys={bulkKeys ?? []}
        s={s}
        onClose={() => setBulkKeys(null)}
        onConfirm={(keys) => {
          const r = run((st, a, at) => approveItems(st, keys, a, at))
          setBulkKeys(null)
          if (r.ok) {
            const stayed = r.blocked.length
            const n = r.approvedKeys.length
            setMsg({
              kind: stayed ? "warning" : "success",
              title: stayed ? `Approved ${n} of ${keys.length} submissions` : `Approved ${n} ${plural(n, "submission", "submissions")}`,
              text: `${r.evaluations} ${plural(r.evaluations, "evaluation now counts", "evaluations now count")} toward the students' records.${r.plansOpened ? ` ${r.plansOpened} remediation ${plural(r.plansOpened, "plan was", "plans were")} opened.` : ""}${stayed ? ` ${stayed} stayed in the queue:` : ""}`,
              blocked: r.blocked,
            })
          } else {
            setMsg({ kind: "error", title: "Nothing was approved", text: r.error })
          }
        }}
      />
      <ReassignDialog
        x={reassign}
        s={s}
        actorId={actorId}
        onClose={() => setReassign(null)}
        onSave={(toId, reason) => {
          if (!reassign) return null
          const r = run((st, a, at) => reassignRequest(st, reassign.id, { toId, reason }, a, at))
          if (!r.ok) return r.error
          setMsg({ kind: "success", title: "Request reassigned", text: `${itemLabel(s, reassign)} now waits for ${r.toName}. The student sees the new name, and the audit log records the change.` })
          setReassign(null)
          return null
        }}
      />
    </PageFrame>
  )
}

function BulkDialog({ open, keys, s, onClose, onConfirm }: { open: boolean; keys: string[]; s: V2State; onClose: () => void; onConfirm: (keys: string[]) => void }) {
  const queue = queueItems(s)
  const chosen = keys.map((k) => queue.find((i) => i.key === k)).filter((i): i is QueueItem => !!i)
  const ready = chosen.filter((i) => !approveBlock(s, i))
  const blocked = chosen.filter((i) => approveBlock(s, i))
  const evals = ready.reduce((n, i) => n + i.evaluations.length, 0)
  const students = new Set(ready.map((i) => i.studentId)).size
  const count = keys.length
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg" data-bulk-dialog>
        <DialogHeader>
          <DialogTitle>{`Approve ${count} ${plural(count, "submission", "submissions")}?`}</DialogTitle>
          <DialogDescription>
            {ready.length > 0
              ? `${evals} ${plural(evals, "evaluation", "evaluations")} for ${students} ${plural(students, "student", "students")} will count toward their records.`
              : "None of the selected items can be approved right now."}
          </DialogDescription>
        </DialogHeader>
        {blocked.length > 0 ? (
          <LocalBanner variant="warning" title={`${blocked.length} of ${count} will stay in the queue`} data-bulk-blocked>
            <ul className="mt-1 flex list-disc flex-col gap-1 ps-5">
              {blocked.map((i) => (
                <li key={i.key}>{`${itemLabel(s, i)}: ${approveBlock(s, i)}`}</li>
              ))}
            </ul>
          </LocalBanner>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Keep in queue
          </Button>
          <Button type="button" variant="default" size="lg" disabled={ready.length === 0} onClick={() => onConfirm(keys)} data-bulk-confirm>
            {ready.length === count ? `Approve ${count} and count` : ready.length === 0 ? "Nothing to approve" : `Approve ${ready.length} of ${count} submissions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReassignDialog({ x, s, actorId, onClose, onSave }: { x: Submission | null; s: V2State; actorId: string; onClose: () => void; onSave: (toId: string, reason: string) => string | null }) {
  const [toId, setToId] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (x) {
      setToId("")
      setReason("")
      setError(null)
    }
  }, [x])
  void actorId
  const options = x ? reassignOptions(s, x) : []
  const eligible = options.filter((o) => o.eligible)
  const current = x ? name(s, x.assignedToId) : ""
  const chosenName = options.find((o) => o.person.id === toId)?.person.name
  return (
    <Dialog open={x !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg" data-reassign-dialog>
        <DialogHeader>
          <DialogTitle>Reassign this request?</DialogTitle>
          <DialogDescription>{x ? `${itemLabel(s, x)} has waited ${x.daysWaiting} days for ${current}. The first link stops working. Choose someone qualified for ${x.skillIds.length > 1 ? "every skill in it" : "this skill"}.` : ""}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); setError(onSave(toId, reason)) }}>
          {eligible.length === 0 ? (
            <LocalBanner variant="warning" title="No one else is qualified">
              No other evaluator on record can sign this off. Return it to the student, or add a qualified evaluator to the program.
            </LocalBanner>
          ) : null}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground">New evaluator</legend>
            <RadioGroup aria-label="New evaluator" value={toId} onValueChange={(v) => { setToId(v); setError(null) }} className="flex flex-col gap-2">
              {options.map((o) => {
                const id = `ra-${o.person.id}`
                return (
                  <Label key={o.person.id} htmlFor={id} className="flex min-h-(--control-height-touch) items-start gap-3 rounded-lg border border-border bg-card p-3 font-normal aria-disabled:opacity-70" aria-disabled={!o.eligible}>
                    <RadioGroupItem id={id} value={o.person.id} disabled={!o.eligible} aria-describedby={`${id}-d`} className="mt-0.5" />
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm text-foreground">{o.person.name}</span>
                      <span id={`${id}-d`} className="text-xs text-muted-foreground">{o.eligible ? o.person.title : `Not qualified. ${o.reasons[0]}`}</span>
                    </span>
                  </Label>
                )
              })}
            </RadioGroup>
          </fieldset>
          <Field>
            <FieldLabel htmlFor="reassign-reason">Reason (optional)</FieldLabel>
            <Textarea id="reassign-reason" rows={2} value={reason} aria-describedby={error ? "reassign-error" : undefined} aria-invalid={error ? true : undefined} onChange={(e) => setReason(e.target.value)} />
            <FieldDescription>Kept in the audit log with your name.</FieldDescription>
            {error ? <FieldError id="reassign-error" errors={[{ message: error }]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              {`Keep with ${current}`}
            </Button>
            <Button type="submit" variant="default" size="lg" disabled={!chosenName} data-reassign-confirm>
              {chosenName ? `Reassign to ${chosenName}` : "Choose who to reassign to"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
