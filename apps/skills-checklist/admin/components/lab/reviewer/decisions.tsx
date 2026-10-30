"use client"

/**
 * The reviewer's decisions, shared by every reviewer screen: Approve (counts toward progress now), Send back to student with a
 * required reason the student sees (REQ AR-05 "return"; renamed by Romit 2026-10-27, "what is Return?") (correction to the same evaluator,
 * to a different one, or a new attempt [REQ RV-01..04]), Adopt or merge an unverified evaluator name (decision seam only [REQ SL-09]),
 * Assign to someone else (the evidence goes to another evaluator as a new request link; Oct 26 call, RV-04 pattern),
 * Request a correction on a counted evaluation (no overwrite [REQ RV-03, RV-05; strategy/03 D1]), and bulk approve with the blockers
 * named before confirm. Feedback is a LocalBanner, never a toast. Nothing writes the v2 store: decide() adds to the session overlay.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { ABOVE_PANEL, ABOVE_PANEL_MENU } from "@/components/lab/overlay-layer"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { REASON_MAX } from "@/lib/v2/queue"
import { SEND_BACK_LABEL } from "@/lib/v2/labels"
import { RETURN_PATH_LABEL, bulkCheck, itemDetail, plural, type ReturnPath, type ReviewRow } from "@/lib/lab/reviewer"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { V2State } from "@/lib/v2/types"
import { decide } from "@/components/lab/reviewer/use-reviewer"

export interface Feedback {
  title: string
  body?: string
  tone: "promo" | "warning"
  href?: { label: string; href: string }
}

interface Api {
  /** Approve; `note` is the reviewer's note, kept with the evaluation (REQ AR-04). */
  approve: (rows: ReviewRow[], note?: string) => void
  /** Send back to student; `note` prefills the reason the student sees. */
  openReturn: (row: ReviewRow, note?: string) => void
  openAdopt: (row: ReviewRow) => void
  openAssign: (row: ReviewRow) => void
  openCorrection: (e: { id: string; skill: string }) => void
  openBulk: (selected: ReadonlySet<string | number>, gone?: ReadonlySet<string>) => void
  feedback: Feedback | null
  clearFeedback: () => void
}

const Ctx = React.createContext<Api | null>(null)
export const useDecisionUi = (): Api => {
  const v = React.useContext(Ctx)
  if (!v) throw new Error("useDecisionUi needs DecisionProvider")
  return v
}

const subject = (r: ReviewRow) => `${r.student}, ${r.skills.length > 1 ? `${r.skills.length} ${skillNounPlural()}` : r.skills[0]}`

export function DecisionProvider({ state, rows, onDecided, children }: { state: V2State | null; rows: ReviewRow[]; onDecided?: (keys: string[]) => void; children: React.ReactNode }) {
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [returning, setReturning] = React.useState<{ row: ReviewRow; note: string } | null>(null)
  const [adopting, setAdopting] = React.useState<ReviewRow | null>(null)
  const [assigning, setAssigning] = React.useState<ReviewRow | null>(null)
  const [correcting, setCorrecting] = React.useState<{ id: string; skill: string } | null>(null)
  const [bulk, setBulk] = React.useState<{ selected: ReadonlySet<string | number>; gone: ReadonlySet<string> } | null>(null)
  // REQ AR-04 "A reviewer may record a note, which is retained with the evaluation": optional, kept with each evaluation approved together.
  const [bulkNote, setBulkNote] = React.useState("")

  const approve = React.useCallback(
    (list: ReviewRow[], note?: string) => {
      const ok = list.filter((r) => !r.block)
      const kept = note?.trim()
      for (const r of ok) decide({ kind: "approve", key: r.key, ...(kept ? { note: kept } : {}) })
      if (ok.length === 0) return
      onDecided?.(ok.map((r) => r.key))
      setFeedback({ title: ok.length === 1 ? `Approved ${subject(ok[0])}` : `Approved ${plural(ok.length, "submission", "submissions")}`, body: "It counts toward progress now. The student sees it on their progress page.", tone: "promo" })
    },
    [onDecided],
  )

  const api: Api = {
    approve,
    openReturn: (row, note = "") => setReturning({ row, note }),
    openAdopt: setAdopting,
    openAssign: setAssigning,
    openCorrection: setCorrecting,
    openBulk: (selected, gone = new Set()) => {
      setBulkNote("")
      setBulk({ selected, gone })
    },
    feedback,
    clearFeedback: () => setFeedback(null),
  }
  const check = bulk ? bulkCheck(rows, bulk.selected, bulk.gone) : null

  return (
    <Ctx.Provider value={api}>
      {children}
      <ReturnDialog
        row={returning?.row ?? null}
        initialNote={returning?.note ?? ""}
        state={state}
        rows={rows}
        onClose={() => setReturning(null)}
        onDone={(row, path) => {
          onDecided?.([row.key])
          setFeedback({ title: `Sent back to the student: ${subject(row)}`, body: path === "new-attempt" ? "They are asked for a new attempt. This one stays on the record and does not count." : "They see your reason and send a correction. It does not count until then.", tone: "promo" })
        }}
      />
      <AdoptDialog
        row={adopting}
        state={state}
        rows={rows}
        onClose={() => setAdopting(null)}
        onDone={(row, mode, released) => {
          onDecided?.([row.key])
          setFeedback({ title: mode === "adopt" ? `Adopted ${row.evaluator}` : `Merged ${row.evaluator}`, body: `${plural(released, "held evaluation now counts", "held evaluations now count")} under the ${skillNoun()} rule.`, tone: "promo" })
        }}
      />
      <AssignDialog
        row={assigning}
        state={state}
        rows={rows}
        onClose={() => setAssigning(null)}
        onDone={(row, name) => {
          onDecided?.([row.key])
          setFeedback({ title: `Sent to ${name}`, body: `${subject(row)} left Approvals and waits with ${name}.`, tone: "promo" })
        }}
      />
      <CorrectionDialog
        target={correcting}
        onClose={() => setCorrecting(null)}
        onDone={(t) => setFeedback({ title: `Correction requested for ${t.skill}`, body: "The evaluator gets a new link. The evaluation keeps counting until the correction comes back.", tone: "promo" })}
      />
      <Dialog open={!!bulk} onOpenChange={(o) => (o ? null : setBulk(null))}>
        <DialogContent className={`sm:max-w-lg ${ABOVE_PANEL}`} overlayClassName={ABOVE_PANEL}>
          <DialogHeader>
            <DialogTitle>{check && check.approvable.length ? `Approve ${plural(check.approvable.length, "submission", "submissions")}` : "Nothing can be approved together"}</DialogTitle>
            <DialogDescription>{check?.approvable.length ? "Each one counts as soon as you approve. You cannot undo it." : "Choose submissions with the same reason."}</DialogDescription>
          </DialogHeader>
          {check && check.blocked.length ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{`${check.blocked.length} not included`}</p>
              <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto text-sm">
                {check.blocked.map((b) => (
                  <li key={b.row.key} className="flex flex-col">
                    <span className="font-medium">{subject(b.row)}</span>
                    <span className="text-muted-foreground">{b.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {check && check.approvable.length ? (
            <div className="flex flex-col gap-1.5" data-review-note>
              <Label htmlFor="bulk-review-note">Review note (optional), kept with each evaluation</Label>
              <Textarea id="bulk-review-note" rows={2} value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setBulk(null)}>Cancel</Button>
            {check && check.approvable.length ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  approve(check.approvable, bulkNote)
                  if (check.blocked.length) setFeedback({ title: `Approved ${check.approvable.length} of ${check.approvable.length + check.blocked.length}`, body: check.blocked.map((b) => `${subject(b.row)}: ${b.reason}`).join(" "), tone: "warning" })
                  setBulk(null)
                }}
              >
                {`Approve ${check.approvable.length}`}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  )
}

/** Decision feedback in place, polite. */
export function DecisionBanner() {
  const { feedback, clearFeedback } = useDecisionUi()
  if (!feedback) return null
  return (
    <div role="status" aria-live="polite" data-region="banner">
      <LocalBanner variant={feedback.tone} title={feedback.title} dismissible onDismiss={clearFeedback} action={feedback.href ? { label: feedback.href.label, href: feedback.href.href } : undefined}>
        {feedback.body ?? ""}
      </LocalBanner>
    </div>
  )
}

function ReturnDialog({ row, initialNote, state, rows, onClose, onDone }: { row: ReviewRow | null; initialNote: string; state: V2State | null; rows: ReviewRow[]; onClose: () => void; onDone: (row: ReviewRow, path: ReturnPath) => void }) {
  const [path, setPath] = React.useState<ReturnPath>("correct-same")
  const [toId, setToId] = React.useState("")
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (row) {
      setPath(row.outcome === "Unmet" ? "new-attempt" : "correct-same")
      setToId("")
      setNote(initialNote)
      setError(null)
    }
  }, [row, initialNote])
  const detail = React.useMemo(() => (row && state ? itemDetail(state, rows, row.key) : null), [row, state, rows])
  const submit = () => {
    if (!row) return
    const t = note.trim()
    if (!t) return setError("Add a reason. The student reads it.")
    if (t.length > REASON_MAX) return setError(`Shorten the note to ${REASON_MAX} characters or fewer.`)
    if (path === "correct-other" && !toId) return setError("Choose who gets the correction.")
    decide({ kind: "return", key: row.key, note: t, path, ...(path === "correct-other" ? { toId } : {}) })
    onDone(row, path)
    onClose()
  }
  return (
    <Dialog open={!!row} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className={`sm:max-w-lg ${ABOVE_PANEL}`} overlayClassName={ABOVE_PANEL}>
        <DialogHeader>
          <DialogTitle>{SEND_BACK_LABEL}</DialogTitle>
          <DialogDescription>{`${row ? subject(row) : ""} goes back to the student for correction. It does not count until it comes back and is approved.`}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">What happens next</legend>
            <RadioGroup value={path} onValueChange={(v) => setPath(v as ReturnPath)} className="gap-2">
              {(Object.keys(RETURN_PATH_LABEL) as ReturnPath[]).map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <RadioGroupItem id={`ret-${p}`} value={p} />
                  <Label htmlFor={`ret-${p}`} className="font-normal">{RETURN_PATH_LABEL[p]}</Label>
                </div>
              ))}
            </RadioGroup>
            {path === "correct-other" ? <EvaluatorSelect options={detail?.otherEvaluators ?? []} value={toId} onChange={setToId} label="Evaluator for the correction" /> : null}
            <p className="text-xs text-muted-foreground">{path === "new-attempt" ? "A new attempt is a separate record. This one stays as it is." : "A correction continues this record and adds one to its revision count."}</p>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ret-note">Reason the student sees</Label>
            <Textarea id="ret-note" value={note} onChange={(e) => { setNote(e.target.value); setError(null) }} rows={3} aria-invalid={!!error} aria-describedby={error ? "ret-error" : undefined} />
            {error ? <p id="ret-error" className="text-xs text-foreground"><i className="fa-solid fa-triangle-exclamation me-1" style={{ color: "var(--lab-viz-behind-ink)" }} aria-hidden="true" />{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">Send back</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** The compact evaluator picker: qualified, adopted evaluators other than the current one (RV-04). Return and Assign share it. */
function EvaluatorSelect({ options, value, onChange, label, invalid = false }: { options: Array<{ id: string; name: string; title: string }>; value: string; onChange: (v: string) => void; label: string; invalid?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-full" aria-label={label} aria-invalid={invalid || undefined}>
        <SelectValue placeholder="Choose an evaluator" />
      </SelectTrigger>
      <SelectContent className={ABOVE_PANEL_MENU}>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>{`${o.name}, ${o.title}`}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Assign to someone else: the evidence leaves Approvals and goes to another evaluator as a new request link (lab state, written to
 * the shared store like every reviewer decision). Evaluators open the link from an email and sign without an account.
 */
function AssignDialog({ row, state, rows, onClose, onDone }: { row: ReviewRow | null; state: V2State | null; rows: ReviewRow[]; onClose: () => void; onDone: (row: ReviewRow, name: string) => void }) {
  const [toId, setToId] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (row) {
      setToId("")
      setError(null)
    }
  }, [row])
  const detail = React.useMemo(() => (row && state ? itemDetail(state, rows, row.key) : null), [row, state, rows])
  const options = detail?.assignTo ?? []
  return (
    <Dialog open={!!row} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className={`sm:max-w-lg ${ABOVE_PANEL}`} overlayClassName={ABOVE_PANEL}>
        <DialogHeader>
          <DialogTitle>Assign to someone else</DialogTitle>
          <DialogDescription>{`${row ? subject(row) : ""} goes to them as a new request. They open an email link and sign without an account.`}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!row) return
            const to = options.find((o) => o.id === toId)
            if (!to) return setError("Choose who gets the request.")
            decide({ kind: "assign", key: row.key, toId: to.id })
            onDone(row, to.name)
            onClose()
          }}
        >
          <EvaluatorSelect options={options} value={toId} onChange={(v) => { setToId(v); setError(null) }} label="Evaluator" invalid={!!error} />
          {error ? <p className="text-xs text-foreground"><i className="fa-solid fa-triangle-exclamation me-1" style={{ color: "var(--lab-viz-behind-ink)" }} aria-hidden="true" />{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">Send request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AdoptDialog({ row, state, rows, onClose, onDone }: { row: ReviewRow | null; state: V2State | null; rows: ReviewRow[]; onClose: () => void; onDone: (row: ReviewRow, mode: "adopt" | "merge", released: number) => void }) {
  const [mode, setMode] = React.useState<"adopt" | "merge">("adopt")
  const [into, setInto] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (row) {
      setMode("adopt")
      setInto("")
      setError(null)
    }
  }, [row])
  const detail = React.useMemo(() => (row && state ? itemDetail(state, rows, row.key) : null), [row, state, rows])
  const held = row ? rows.filter((r) => r.evaluatorId === row.evaluatorId).reduce((n, r) => n + r.evaluationIds.length, 0) : 0
  return (
    <Dialog open={!!row} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className={`sm:max-w-lg ${ABOVE_PANEL}`} overlayClassName={ABOVE_PANEL}>
        <DialogHeader>
          <DialogTitle>{row ? `${row.evaluator} is a new name` : "New evaluator name"}</DialogTitle>
          <DialogDescription>{`A student named this evaluator. ${plural(held, "evaluation waits", "evaluations wait")} on your decision.`}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!row?.evaluatorId) return
            if (mode === "merge" && !into) return setError("Choose the evaluator this name belongs to.")
            decide({ kind: "adopt", evaluatorId: row.evaluatorId, mode, ...(mode === "merge" ? { intoId: into } : {}) })
            onDone(row, mode, held)
            onClose()
          }}
        >
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as "adopt" | "merge")} className="gap-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="adopt-new" value="adopt" />
              <Label htmlFor="adopt-new" className="font-normal">Adopt as a new evaluator</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="adopt-merge" value="merge" />
              <Label htmlFor="adopt-merge" className="font-normal">Merge with someone already on the list</Label>
            </div>
          </RadioGroup>
          {mode === "merge" ? (
            <Select value={into} onValueChange={(v) => { setInto(v); setError(null) }}>
              <SelectTrigger size="sm" className="w-full" aria-label="Existing evaluator">
                <SelectValue placeholder="Choose an evaluator" />
              </SelectTrigger>
              <SelectContent className={ABOVE_PANEL_MENU}>
                {(detail?.mergeCandidates ?? []).map((o) => (
                  <SelectItem key={o.id} value={o.id}>{`${o.name}, ${o.title}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {error ? <p className="text-xs">{error}</p> : null}
          <p className="text-xs text-muted-foreground">{`Their held evaluations then count under each ${skillNoun()} rule.`}</p>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">{mode === "adopt" ? "Adopt" : "Merge"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CorrectionDialog({ target, onClose, onDone }: { target: { id: string; skill: string } | null; onClose: () => void; onDone: (t: { id: string; skill: string }) => void }) {
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    setNote("")
    setError(null)
  }, [target])
  return (
    <Dialog open={!!target} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className={`sm:max-w-lg ${ABOVE_PANEL}`} overlayClassName={ABOVE_PANEL}>
        <DialogHeader>
          <DialogTitle>Request a correction</DialogTitle>
          <DialogDescription>{`The evaluation for ${target?.skill ?? ""} is a record and stays as it is. The evaluator is asked for a corrected version.`}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!target) return
            if (!note.trim()) return setError("Say what the evaluator should check.")
            decide({ kind: "correction", evaluationId: target.id, note: note.trim() })
            onDone(target)
            onClose()
          }}
        >
          <Label htmlFor="corr-note">Note to the evaluator</Label>
          <Textarea id="corr-note" rows={3} value={note} onChange={(e) => { setNote(e.target.value); setError(null) }} aria-invalid={!!error} />
          {error ? <p className="text-xs">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">Send request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * The two decisions that fit "Evaluator not assigned", in one outline menu: Adopt or merge the name, or Assign to someone else. One
 * control, so the decision bar stays inside the split and detail control budgets (strategy/07) while Approve stays the one filled
 * button.
 */
export function EvaluatorMenu({ row, adoptLabel = "Adopt or merge evaluator" }: { row: ReviewRow; adoptLabel?: string }) {
  const ui = useDecisionUi()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" aria-label={`Adopt, merge or assign: ${row.student}, ${row.skills.length > 1 ? `${row.skills.length} ${skillNounPlural()}` : row.skills[0]}`}>
          Adopt, merge or assign
          <i className="fa-light fa-chevron-down" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={ABOVE_PANEL_MENU}>
        <DropdownMenuItem onSelect={() => ui.openAdopt(row)}>{adoptLabel}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => ui.openAssign(row)}>Assign to someone else</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The one overflow beside every queue row's Review (design review 2026-10-30, others #3: one predictable action per row). It holds
 * the quick decisions that row allows: Approve and Send back on rows that can be decided without opening them, Adopt or merge and
 * Assign on a typed evaluator name. Rows with nothing quick to do get no menu, and Review still opens the full decision.
 */
export function RowActionsMenu({ row, approveHint }: { row: ReviewRow; /** What Approve does, under the item (AR-05, AR-06). */ approveHint?: string }) {
  const ui = useDecisionUi()
  const what = `${row.student}, ${row.skills.length > 1 ? `${row.skills.length} ${skillNounPlural()}` : row.skills[0]}`
  const quick = !!row.likeKey
  const evaluator = row.reason === "new-evaluator"
  if (!quick && !evaluator) return <span className="inline-block size-8" aria-hidden="true" />
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`More actions: ${what}`}>
          <i className="fa-light fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={ABOVE_PANEL_MENU}>
        {quick ? (
          <DropdownMenuItem className="flex-col items-start gap-0.5" onSelect={() => ui.approve([row])}>
            <span>Approve</span>
            {approveHint ? <span className="text-xs text-muted-foreground">{approveHint}</span> : null}
          </DropdownMenuItem>
        ) : null}
        {quick ? <DropdownMenuItem onSelect={() => ui.openReturn(row)}>{SEND_BACK_LABEL}</DropdownMenuItem> : null}
        {evaluator ? <DropdownMenuItem onSelect={() => ui.openAdopt(row)}>{`Adopt or merge ${row.evaluator}`}</DropdownMenuItem> : null}
        {evaluator ? <DropdownMenuItem onSelect={() => ui.openAssign(row)}>Assign to someone else</DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "Open" link styled as a small DS ghost button. */
export function OpenLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href={href} aria-label={label}>Open</Link>
    </Button>
  )
}
