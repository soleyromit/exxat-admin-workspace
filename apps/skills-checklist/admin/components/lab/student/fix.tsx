"use client"

/**
 * Fix a returned or did-not-qualify submission (build prompt stufix). Two paths, named on screen [REQ RV-01..RV-05]:
 * - Correction: the same submission, revision +1, return reason kept; defaults to the same evaluator.
 * - Further attempt: a new submission; the completed evaluation stays as it is (immutable).
 * Either path may go to a different evaluator [REQ RV-04]. Sending is local to the lab (read-only data): the outcome sentence says
 * what happens next (peak-end), in a LocalBanner, never a toast.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { VIZ } from "@/components/lab/viz"
import { EmptyBlock } from "@/components/lab/empty-block"
import { fixModel, shortDate, studentHref, type FixModel } from "@/lib/lab/student"
import type { StudentFrameCtx } from "@/components/lab/student/frame"

export function useFix(ctx: StudentFrameCtx): FixModel | null {
  const sub = ctx.param("submission")
  const skill = ctx.param("skill")
  return React.useMemo(() => fixModel(ctx.state, ctx.studentId, { submissionId: sub, skillId: skill }), [ctx.state, ctx.studentId, sub, skill])
}

export const fixTitle = (f: FixModel | null) => (!f ? "Nothing to fix" : f.case === "correction" ? "Fix a returned submission" : "Make a further attempt")

/** One line that names the path: what record this creates and what stays. */
export function PathLine({ f }: { f: FixModel }) {
  return (
    <p className="flex items-start gap-2 text-sm text-foreground" data-path={f.case}>
      <i className={`fa-light ${f.case === "correction" ? "fa-pen-to-square" : "fa-arrow-rotate-right"} mt-0.5 text-muted-foreground`} aria-hidden="true" />
      {f.case === "correction"
        ? `Correction: revision ${f.nextNumber} of this submission.`
        : `Further attempt ${f.nextNumber}, a new submission. Attempt ${f.nextNumber - 1} stays.`}
    </p>
  )
}

export function ReasonBlock({ f }: { f: FixModel }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border p-3" style={{ borderColor: VIZ.behindEdge, background: VIZ.behindWash }} data-reason>
      <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: VIZ.behindInk }}>
        <i className={f.case === "correction" ? "fa-solid fa-rotate-left" : "fa-solid fa-triangle-exclamation"} aria-hidden="true" />
        {f.case === "correction" ? `Returned by ${f.reasonBy}, ${shortDate(f.reasonAt)}` : `Did not count, ${shortDate(f.reasonAt)}`}
      </h3>
      <p className="text-sm text-foreground">{f.reason}</p>
    </div>
  )
}

export interface FixDraft {
  who: "same" | "other"
  otherId: string
  note: string
  done: Record<string, boolean>
}

export function useFixDraft(f: FixModel | null) {
  const [draft, setDraft] = React.useState<FixDraft>({ who: "same", otherId: "", note: "", done: {} })
  const [sent, setSent] = React.useState<string | null>(null)
  const [tried, setTried] = React.useState(false)
  const errors = {
    note: f?.case === "correction" && draft.note.trim().length < 3 ? "Say what you changed, so the reviewer can check it." : null,
    other: draft.who === "other" && !draft.otherId ? "Choose who to send it to." : null,
  }
  const send = (offline: boolean) => {
    setTried(true)
    if (!f || errors.note || errors.other) return
    const to = draft.who === "same" ? f.evaluatorName : f.others.find((o) => o.id === draft.otherId)?.name ?? "the evaluator"
    setSent(
      offline
        ? `Kept on this device. It goes to ${to} when you reconnect.`
        : f.case === "correction"
          ? `Sent to ${to} as revision ${f.nextNumber}. Their email holds a new link for this request. It counts after they answer Met.`
          : `Sent to ${to} as attempt ${f.nextNumber}. It counts after they answer Met.`,
    )
  }
  return { draft, setDraft, sent, tried, errors, send }
}

export function ChangeList({ f, api }: { f: FixModel; api: ReturnType<typeof useFixDraft> }) {
  return (
    <FieldSet>
      <FieldLegend variant="label">What to change</FieldLegend>
      <ul className="flex flex-col gap-2">
        {f.changes.map((c, i) => {
          const id = `change-${i}`
          return (
            <li key={c} className="flex items-center gap-2">
              <Checkbox id={id} checked={!!api.draft.done[c]} onCheckedChange={(v) => api.setDraft((d) => ({ ...d, done: { ...d.done, [c]: v === true } }))} />
              <Label htmlFor={id} className="text-sm font-normal">{c}</Label>
            </li>
          )
        })}
      </ul>
    </FieldSet>
  )
}

export function FixForm({ f, api, offline, studentId }: { f: FixModel; api: ReturnType<typeof useFixDraft>; offline: boolean; studentId: string }) {
  if (api.sent) {
    return (
      <div className="flex flex-col gap-3">
        <LocalBanner variant="success" title={f.case === "correction" ? "Correction sent" : "Attempt sent"}>{api.sent}</LocalBanner>
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={studentHref("my-requests", {}, studentId)}>Back to My requests</Link>
        </Button>
      </div>
    )
  }
  const { draft, setDraft, errors, tried } = api
  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        api.send(offline)
      }}
    >
      <FieldSet>
        <FieldLegend variant="label">Send to</FieldLegend>
        <RadioGroup value={draft.who} onValueChange={(v) => setDraft((d) => ({ ...d, who: v as FixDraft["who"] }))} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="same" id="who-same" />
            <Label htmlFor="who-same" className="text-sm font-normal">{`${f.evaluatorName}, again`}</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="other" id="who-other" />
            <Label htmlFor="who-other" className="text-sm font-normal">Someone else you have worked with</Label>
          </div>
        </RadioGroup>
        {draft.who === "other" ? (
          <Field data-invalid={tried && !!errors.other}>
            <Select value={draft.otherId} onValueChange={(v) => setDraft((d) => ({ ...d, otherId: v }))}>
              <SelectTrigger size="sm" className="w-full max-w-sm" aria-label="Evaluator" aria-invalid={tried && !!errors.other}>
                <SelectValue placeholder="Choose an evaluator" />
              </SelectTrigger>
              <SelectContent>
                {f.others.map((o) => <SelectItem key={o.id} value={o.id}>{`${o.name}, ${o.role}`}</SelectItem>)}
              </SelectContent>
            </Select>
            {tried && errors.other ? <FieldError>{errors.other}</FieldError> : null}
          </Field>
        ) : null}
      </FieldSet>
      <Field data-invalid={tried && !!errors.note}>
        <FieldLabel htmlFor="fix-note">{f.case === "correction" ? "What you changed" : "Note for the evaluator (optional)"}</FieldLabel>
        <Textarea id="fix-note" rows={3} maxLength={500} value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} aria-invalid={tried && !!errors.note} aria-describedby={f.case === "correction" ? undefined : "fix-note-help"} />
        {f.case === "correction" ? null : <FieldDescription id="fix-note-help">Kept apart from the evaluator&apos;s own comment.</FieldDescription>}
        {tried && errors.note ? <FieldError>{errors.note}</FieldError> : null}
      </Field>
      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{offline ? "Kept on this device until you reconnect." : null}</p>
        <Button type="submit" variant="default" size="sm" className="w-full sm:w-auto">{f.case === "correction" ? "Send correction" : "Send for evaluation"}</Button>
      </div>
    </form>
  )
}

export function NothingToFix({ studentId }: { studentId: string }) {
  return <EmptyBlock title="Nothing to fix" body="No submission is returned and no attempt failed to count." action={{ label: "See My requests", href: studentHref("my-requests", {}, studentId) }} />
}
