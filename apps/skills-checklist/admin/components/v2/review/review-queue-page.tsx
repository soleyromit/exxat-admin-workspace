"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { useStaff } from "@/components/v2/outcomes/staff"
import { fmtDay } from "@/components/v2/outcomes/version-timeline"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { METHOD_WORD } from "@/lib/v2/student"
import { approveBlock, approveItems, itemLabel, joinNames, locationOf, queueItems, reassignOptions, reassignRequest, returnedItems, ROLE_LABEL, stalledRequests, type BlockedItem, type QueueItem, type ReturnedItem } from "@/lib/v2/queue"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { RoleId, Submission, V2State } from "@/lib/v2/types"

type Tab = "awaiting" | "stalled" | "returned"

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

/** Scenario step 10: everything waiting for review, bulk approve, stalled requests to reassign, and what is out with students. */
export function ReviewQueuePage({ role }: { role: RoleId }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const { actorId, run } = useStaff(role)
  const [tab, setTab] = React.useState<Tab>("awaiting")
  const [msg, setMsg] = React.useState<Msg | null>(null)
  const [bulkKeys, setBulkKeys] = React.useState<string[] | null>(null)
  const [picked, setPicked] = React.useState<string[]>([])
  const msgRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (msg) msgRef.current?.scrollIntoView({ block: "nearest" })
  }, [msg])
  const [reassign, setReassign] = React.useState<Submission | null>(null)
  const items = queueItems(s)
  const selected = picked.filter((k) => items.some((i) => i.key === k))
  const toggle = (key: string, on: boolean) => setPicked((cur) => (on ? [...new Set([...cur, key])] : cur.filter((k) => k !== key)))
  const stalled = stalledRequests(s)
  const returned = returnedItems(s)
  const base = `/v2/${role}/review-queue`
  const needs = items.filter((i) => i.state === "needs-outcome").length
  const summary: Array<[string, number, string]> = [
    ["Awaiting review", items.length, "awaiting"],
    ["Paper forms needing an outcome", needs, "needs-outcome"],
    ["Stalled requests", stalled.length, "stalled"],
    ["Returned to students", returned.length, "returned"],
  ]

  if (!hydrated && items.length === 0) {
    return (
      <PageFrame title="Review queue">
        <p role="status" className="text-sm text-muted-foreground">Opening the queue</p>
      </PageFrame>
    )
  }

  return (
    <PageFrame title="Review queue" subtitle={`${s.course.code}, ${s.course.term}. Evaluations waiting for approval and photos of signed paper forms. Nothing here counts until you approve it.`}>
      <div className="flex flex-col gap-6" data-review-queue>
        <Card>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4" aria-label="Queue summary">
              {summary.map(([label, n, key]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-foreground" data-summary={key}>{n}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

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
            <p className="text-sm text-muted-foreground">Tick several to approve them together. Open a student&apos;s name to compare the evaluation with their self-rating, or to send it back.</p>
            {items.length === 0 ? (
              <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground" data-empty="awaiting">Nothing is waiting for review. New evaluations and photos of paper forms appear here.</p>
            ) : (
              <>
                <Card size="sm" data-bulk-bar>
                  <CardContent className="flex flex-wrap items-center gap-3">
                  <div className="flex min-h-(--control-height-touch) items-center gap-2">
                    <Checkbox id="select-all" checked={selected.length === items.length ? true : selected.length > 0 ? "indeterminate" : false} onCheckedChange={(v) => setPicked(v === true ? items.map((i) => i.key) : [])} />
                    <Label htmlFor="select-all" className="text-sm font-normal text-foreground">{`Select all ${items.length}`}</Label>
                  </div>
                  <span className="text-sm text-muted-foreground" role="status" aria-live="polite" data-selected-count>{selected.length === 0 ? "None selected" : `${selected.length} selected`}</span>
                  {selected.length > 0 ? (
                    <>
                      <Button type="button" variant="default" size="lg" onClick={() => { setMsg(null); setBulkKeys(selected) }} data-bulk-approve>
                        {`Approve ${selected.length} ${plural(selected.length, "submission", "submissions")}`}
                      </Button>
                      <Button type="button" variant="outline" size="lg" onClick={() => setPicked([])}>
                        Clear selection
                      </Button>
                    </>
                  ) : null}
                  </CardContent>
                </Card>
                <V2Grid<QueueItem>
                  caption="Items awaiting review"
                  rows={items}
                  id={(i) => i.key}
                  selectable={false}
                  columns={[
                    v2col<QueueItem>("pick", "Select", 80, (i) => <Checkbox checked={selected.includes(i.key)} aria-label={`Select ${itemLabel(s, i)}`} onCheckedChange={(v) => toggle(i.key, v === true)} />),
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
                    v2col<QueueItem>("status", "Status", 200, (i) => {
                      const why = approveBlock(s, i)
                      return why ? <StatusBadge label={i.state === "needs-outcome" ? "Needs the paper form outcome" : "Blocked"} tone="warning" icon="fa-circle-exclamation" size="sm" /> : <StatusBadge label="Ready to approve" tone="success" icon="fa-circle-check" size="sm" />
                    }),
                    v2col<QueueItem>("setting", "Setting", 190, (i) => settingText(s, i)),
                    v2col<QueueItem>("location", "Location", 180, (i) => locationText(s, i)),
                    v2col<QueueItem>("course", "Course", 90, () => s.course.code),
                    v2col<QueueItem>("source", "Source", 130, (i) => (i.source === "paper-form" ? "Paper form" : "Evaluator form")),
                    v2col<QueueItem>("since", "Since", 90, (i) => fmtDay(i.since)),
                  ]}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="stalled" className="flex flex-col gap-3 rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <p className="text-sm text-muted-foreground">A request that has waited too long with its evaluator. Hand it to someone else who is qualified; the old link stops working for the first person.</p>
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
            <p className="text-sm text-muted-foreground">Sent back to the student with a reason. They come back to the queue when the student sends them again.</p>
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
                  v2col<ReturnedItem>("reason", "Reason the student reads", 360, (r) => r.reason),
                  v2col<ReturnedItem>("rev", "Revision", 100, (r) => `${r.submission?.revisions ?? 0} sent again`),
                ]}
              />
            )}
          </TabsContent>
        </Tabs>
        <PageSection title="Where each item goes" id="legend" description="Approved items count toward progress at once. Returned items do not count, and the student reads your reason.">
          <ul className="flex list-disc flex-col gap-1 ps-5 text-sm text-muted-foreground">
            <li>Approve counts the evaluation toward the student&apos;s record and closes the request.</li>
            <li>Return sends it back to the student with your reason and what to change.</li>
            <li>A photo of a paper form has no outcome yet. Open it, enter what the form says, then approve.</li>
          </ul>
        </PageSection>
      </div>

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
              ? `${evals} ${plural(evals, "evaluation", "evaluations")} for ${students} ${plural(students, "student", "students")} will count toward their records. A student sees the change at once.`
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
            {ready.length === count ? `Approve ${count} ${plural(count, "submission", "submissions")}` : ready.length === 0 ? "Nothing to approve" : `Approve ${ready.length} of ${count} submissions`}
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
          <DialogDescription>{x ? `${itemLabel(s, x)} has waited ${x.daysWaiting} days for ${current}. Choose someone qualified for ${x.skillIds.length > 1 ? "every skill in it" : "this skill"}.` : ""}</DialogDescription>
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
