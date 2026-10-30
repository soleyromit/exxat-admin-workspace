"use client"

/**
 * Drafts: requests saved for later in Send for evaluation and not sent (Romit 2026-10-27: "can't we merge Log a skill with My
 * requests"; LEDGER D-L10). One home, My requests, Drafts. Each row says what (skills), the course, where, when performed and when
 * saved, with Continue (Send reopens at the step it was left, prefilled) and Delete (confirmed in a dialog). A draft is not
 * evidence; nothing counts until it is sent and an evaluator answers. Several drafts go together through Send selected (row
 * checkboxes and one review that groups them by who signs off, one request per group; Romit 2026-10-27, LEDGER D-L18).
 * [REQ ST-03 earlier submissions findable, ST-04 several together, ST-13 what was sent; INFER: the draft is the student's own]
 */
import { CheckoffDone } from "@/components/lab/student/checkoff"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, FloatingSheetPanelWorkflowFooter } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { reviewDrafts, sendDraftGroups, sentSentence, type DraftFixes } from "@/lib/lab/drafts-send"
import { TYPE } from "@/components/lab/type-scale"
import { updateActiveV2Store } from "@/lib/v2/react"
import type { V2State } from "@/lib/v2/types"
import { deleteLogged, loggedNotSent, type LoggedSitting } from "@/lib/lab/logged"
import { shortDate } from "@/lib/lab/student"
import { loggedHandoff, student2Href } from "@/lib/lab/student2"
import { countSkills } from "@/lib/lab/terms"

/** "Harbor General, 4 West", "Lab", "Simulation". */
export const loggedWhere = (x: Pick<LoggedSitting, "setting" | "location">) => x.location ?? (x.setting === "lab" ? "Lab" : x.setting === "simulation" ? "Simulation" : "Clinical")

const names = (list: string[]) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "")

/** The course code a draft was started from, when the program records it. */
const courseCode = (s: V2State, id: string | null) => (id ? s.courses?.find((c) => c.id === id)?.code ?? null : null)

export function useDrafts(state: V2State, studentId: string) {
  return React.useMemo(() => loggedNotSent(state, studentId), [state, studentId])
}
/** Former name, kept for older imports. */
export const useLoggedNotSent = useDrafts

/** One line of facts: course, where, performed, saved. */
export function draftMeta(s: V2State, x: LoggedSitting): string {
  return [courseCode(s, x.course), loggedWhere(x), x.date ? `Performed ${shortDate(x.date)}` : "No date yet", `Saved ${shortDate(x.loggedAt)}`].filter(Boolean).join(" · ")
}

/** The rows (each with a checkbox), Send selected, the delete confirmation and the send review. */
export function DraftList({ rows, studentId, state, empty }: { rows: LoggedSitting[]; studentId: string; state: V2State; /** Shown when there are no drafts; the list stays mounted so a send result is still said. */ empty?: React.ReactNode }) {
  const [confirm, setConfirm] = React.useState<LoggedSitting | null>(null)
  const [done, setDone] = React.useState("")
  const [picked, setPicked] = React.useState<string[]>([])
  const [reviewing, setReviewing] = React.useState(false)
  const [sent, setSent] = React.useState<{ sentence: string; requests: Array<{ id: string; whoName: string; skillIds: string[] }> } | null>(null)
  // Drop ticks of drafts that are gone (sent or deleted).
  const live = picked.filter((id) => rows.some((r) => r.batchId === id))
  const allOn = rows.length > 0 && live.length === rows.length
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const remove = () => {
    if (!confirm) return
    updateActiveV2Store((s) => deleteLogged(s, studentId, confirm.batchId))
    setDone(`Deleted the draft for ${names(confirm.skillNames)}.`)
    setConfirm(null)
  }
  return (
    <>
      {sent ? (
        <LocalBanner variant="success" title={sent.sentence} className="mt-3" data-drafts-sent>
          <span className="flex flex-col gap-0.5">
            {sent.requests.map((r) => (
              <span key={r.id}>
                {`${r.whoName}, ${countSkills(r.skillIds.length)}. `}
                <Link href={`/lab/evaluator/evaluation-form?request=${r.id}`} className="font-medium underline underline-offset-2">Open their link</Link>
              </span>
            ))}
          </span>
        </LocalBanner>
      ) : null}
      {rows.length === 0 ? empty : null}
      {rows.length === 0 ? null : (
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-border py-2" data-drafts-toolbar>
        <div className="flex items-center gap-2">
          <Checkbox id="drafts-all" checked={allOn ? true : live.length ? "indeterminate" : false} onCheckedChange={() => setPicked(allOn ? [] : rows.map((r) => r.batchId))} aria-label="Select all drafts" />
          <Label htmlFor="drafts-all" className="text-sm font-normal text-muted-foreground">{live.length ? `${live.length} selected` : "Select all"}</Label>
        </div>
        {live.length ? (
          <Button type="button" variant="default" size="sm" onClick={() => { setSent(null); setReviewing(true) }} data-send-selected>{`Send selected (${live.length})`}</Button>
        ) : null}
      </div>
      )}
      <ul className="flex flex-col divide-y divide-border" data-logged-list data-drafts>
        {rows.map((x) => (
          <li key={x.batchId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4" data-logged-row={x.batchId}>
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Checkbox id={`draft-${x.batchId}`} className="mt-0.5" checked={live.includes(x.batchId)} onCheckedChange={() => toggle(x.batchId)} aria-label={`Select the draft for ${names(x.skillNames)}`} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className={TYPE.label}>{names(x.skillNames)}</p>
                <p className={TYPE.meta}>{draftMeta(state, x)}</p>
                <CheckoffDone s={state} studentId={studentId} ids={x.skillIds} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 ps-7 sm:ps-0">
              <Button asChild variant="outline" size="sm" className="max-sm:h-11 max-sm:flex-1">
                <Link href={student2Href("request-signoff", loggedHandoff(x), studentId)} aria-label={`Continue the draft for ${names(x.skillNames)}`}>Continue</Link>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="max-sm:h-11" onClick={() => setConfirm(x)} aria-label={`Delete the draft for ${names(x.skillNames)}`}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
      <p role="status" className="sr-only">{done}</p>
      <SendDraftsSheet
        open={reviewing}
        onOpenChange={setReviewing}
        state={state}
        studentId={studentId}
        batchIds={live}
        onSent={(r) => {
          setSent(r)
          setPicked([])
          setReviewing(false)
        }}
      />
      <Dialog open={!!confirm} onOpenChange={(o) => (o ? null : setConfirm(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this draft?</DialogTitle>
            <DialogDescription>{confirm ? `${names(confirm.skillNames)}. It was never sent, so nothing in My evaluations changes.` : ""}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="default" onClick={() => setConfirm(null)}>Keep it</Button>
            <Button type="button" variant="destructive" size="default" onClick={remove}>{confirm ? `Delete draft, ${countSkills(confirm.skillIds.length)}` : "Delete draft"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * The one review step for Send selected (LEDGER D-L18): the drafts grouped by who signs off, one request per group with one link
 * (D-L2, ST-04). A draft missing its date or evaluator is listed first, with the field to fill once (ST-10); a lab or simulation
 * draft only offers lab instructors and faculty (ST-05, ST-08). Send is enabled once nothing is missing.
 */
function SendDraftsSheet({ open, onOpenChange, state, studentId, batchIds, onSent }: { open: boolean; onOpenChange: (o: boolean) => void; state: V2State; studentId: string; batchIds: string[]; onSent: (r: { sentence: string; requests: Array<{ id: string; whoName: string; skillIds: string[] }> }) => void }) {
  const [fixes, setFixes] = React.useState<DraftFixes>({})
  const review = React.useMemo(() => reviewDrafts(state, studentId, batchIds, fixes), [state, studentId, batchIds, fixes])
  const fix = (id: string, p: { date?: string; who?: string }) => setFixes((f) => ({ ...f, [id]: { ...f[id], ...p } }))
  const send = () => {
    let result: ReturnType<typeof sendDraftGroups> | null = null
    updateActiveV2Store((st) => {
      result = sendDraftGroups(st, studentId, reviewDrafts(st, studentId, batchIds, fixes))
      return result.state
    })
    const r = result as ReturnType<typeof sendDraftGroups> | null
    if (r && r.requests.length) {
      setFixes({})
      onSent({ sentence: sentSentence(r), requests: r.requests })
    }
  }
  const n = review.groups.length
  return (
    <FloatingSheetPanel open={open} onOpenChange={onOpenChange} modal>
      <FloatingSheetPanelContent contentSlot="lab-send-drafts" size="md" aria-modal="true">
        <FloatingSheetPanelToolbar showSize={false} />
        <FloatingSheetPanelHeader title="Send selected drafts" subtitle={review.ready ? `${n} ${n === 1 ? "request" : "requests"}, one link each` : `${review.blocked.length} need something first`} />
        <FloatingSheetPanelBody className="flex flex-col gap-5 px-4 pb-4" data-send-review>
          {review.blocked.length ? (
            <section className="flex flex-col gap-3" aria-labelledby="needs-h" data-review-blocked>
              <h3 id="needs-h" className={TYPE.group}>Needs something first</h3>
              {review.blocked.map((r) => (
                <div key={r.draft.batchId} className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-3" data-review-row={r.draft.batchId}>
                  <div className="flex flex-col gap-0.5">
                    <p className={TYPE.label}>{names(r.draft.skillNames)}</p>
                    <p className={TYPE.meta}>{draftMeta(state, r.draft)}</p>
                  </div>
                  {r.issues.some((i) => i.field === "date") ? (
                    <Field data-invalid>
                      <FieldLabel htmlFor={`fix-date-${r.draft.batchId}`}>Date performed</FieldLabel>
                      <Input id={`fix-date-${r.draft.batchId}`} type="date" value={fixes[r.draft.batchId]?.date ?? ""} max="2026-12-31" onChange={(e) => fix(r.draft.batchId, { date: e.target.value })} aria-invalid="true" className="w-full sm:w-48" />
                      <FieldError>{r.issues.find((i) => i.field === "date")!.message}</FieldError>
                    </Field>
                  ) : null}
                  {r.issues.some((i) => i.field === "details") ? (
                    <div className="flex flex-col gap-1" data-review-details>
                      <FieldError>{r.issues.find((i) => i.field === "details")!.message}</FieldError>
                      <Link href={student2Href("request-signoff", loggedHandoff(r.draft), studentId)} className="self-start text-sm font-medium underline underline-offset-2">Continue the draft</Link>
                    </div>
                  ) : null}
                  {r.issues.some((i) => i.field === "who") ? (
                    <Field data-invalid>
                      <FieldLabel htmlFor={`fix-who-${r.draft.batchId}`}>Who signs off</FieldLabel>
                      <Select value={fixes[r.draft.batchId]?.who ?? ""} onValueChange={(v) => fix(r.draft.batchId, { who: v })}>
                        <SelectTrigger id={`fix-who-${r.draft.batchId}`} size="sm" className="w-full sm:w-72" aria-invalid="true">
                          <SelectValue placeholder="Choose an evaluator" />
                        </SelectTrigger>
                        <SelectContent>
                          {r.options.filter((o) => o.eligible).map((o) => <SelectItem key={o.id} value={o.id}>{`${o.name}, ${o.role}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FieldError>{r.issues.find((i) => i.field === "who")!.message}</FieldError>
                    </Field>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}
          {review.groups.map((g) => (
            <section key={g.key} className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3" aria-label={`Request to ${g.whoName}`} data-review-group={g.who}>
              <div className="flex flex-col gap-0.5">
                <h3 className={TYPE.group}>{`To ${g.whoName}`}</h3>
                <p className={TYPE.meta}>{[g.role, g.location ?? "", countSkills(g.skillIds.length)].filter(Boolean).join(" · ")}</p>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {g.rows.map((r) => (
                  <li key={r.draft.batchId} className="flex flex-col gap-0.5 py-2">
                    <span className={TYPE.body}>{names(r.draft.skillNames)}</span>
                    <span className={TYPE.meta}>{draftMeta(state, { ...r.draft, date: r.date })}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </FloatingSheetPanelBody>
        <FloatingSheetPanelWorkflowFooter onCancel={() => onOpenChange(false)} cancelLabel="Cancel" primaryLabel={n > 1 ? `Send ${n} requests` : "Send request"} onPrimary={send} primaryDisabled={!review.ready} primaryIconClassName="" />
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
