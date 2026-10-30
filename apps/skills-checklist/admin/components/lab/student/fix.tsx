"use client"

/**
 * Fix a submission (build prompt stufix). Two paths, named on screen [REQ RV-01..RV-05]:
 * - Correction: the same submission, revision +1. For one a reviewer returned (reason kept, RV-02), or one nobody has assessed yet
 *   (RV-01: "or that has not yet been assessed"; the earlier link closes). Defaults to the same evaluator.
 * - Further attempt: a new submission; the completed evaluation stays exactly as it is (immutable, RV-03).
 * Both paths capture what a submission needs, never less than Send [REQ ST-05..ST-10, ST-12]: where it was performed (clinical,
 * lab or simulation; the location when no placement supplies it), the program's details (mandatory ones enforced, with one summary
 * on a failed send), who signs (anyone the place and the skills allow, or someone not listed, RV-04) and the one note.
 * Layout (Romit 2026-10-27, "Need a better form layout"): it is the Send flow for a correction or a further attempt, so it reads like
 * Send. Context first (the skill as the subtitle, one compact banner with why it is here and the evaluator's own words, the path
 * said once), then numbered sections in one readable column (1 Where and when, 2 Who signs, 3 Note), a summary beside them from
 * 1280 px, and the standard footer (Back left; Save for later and the one primary right). Save for later is offered on a further
 * attempt only: it is a new submission, so it can wait in My requests, Drafts; a correction is a revision of a request that
 * already exists, so it has nothing to save apart from it.
 * Sending is local to the lab (read-only data): the outcome sentence and what was sent are said once, in a LocalBanner, never a toast.
 */
import * as React from "react"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { FormPage } from "@/components/lab/layout/form-page"
import { useStudentPage } from "@/components/lab/student/use-student"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { TYPE } from "@/components/lab/type-scale"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { updateActiveV2Store } from "@/lib/v2/react"
import { labNow, saveLogged } from "@/lib/lab/logged"
import { recordNamedEvaluator } from "@/lib/lab/new-evaluators"
import { EmptyBlock } from "@/components/lab/empty-block"
import { ValidationSummary, type ValidationIssue } from "@/components/lab/layout/validation-summary"
import { DetailsFields, EvaluatorPicker, LocationField, NoteField, WhereSelect, type WhoValue } from "@/components/lab/student2/log-parts"
import { fixModel, shortDate, studentHref, type FixModel } from "@/lib/lab/student"
import { PRACTICE_LINE, confirmationLines, detailErrors, detailFieldsFor, evaluatorsFor, locationError, locationFor, newEvaluatorErrors, noteError, settingWords, siteIdFor, whereChoices, type DetailValues, type NewEvaluator, type WhereChoice } from "@/lib/lab/student2"
import type { V2State } from "@/lib/v2/types"
import type { StudentFrameCtx } from "@/components/lab/student/frame"

export function useFix(ctx: StudentFrameCtx): FixModel | null {
  const sub = ctx.param("submission")
  const skill = ctx.param("skill")
  return React.useMemo(() => fixModel(ctx.state, ctx.studentId, { submissionId: sub, skillId: skill }), [ctx.state, ctx.studentId, sub, skill])
}

/** The skill is in the title, never a subtitle (Romit 2026-10-30, D-L8b): "Fix Bedside handoff report". */
const fixSkills = (f: FixModel) => (f.skillNames.length > 1 ? `${f.skillNames[0]} and ${f.skillNames.length - 1} more` : f.skillNames[0] ?? "")
export const fixTitle = (f: FixModel | null) => (!f ? "Nothing to fix" : `${f.case === "attempt" ? "Another attempt at" : f.origin === "waiting" ? "Correct" : "Fix"} ${fixSkills(f)}`.trim())

/** The path, said once: what record this creates and what stays [REQ RV-01..RV-03]. */
export function pathSentence(f: FixModel): string {
  if (f.case === "attempt") return `This is attempt ${f.nextNumber}; attempt ${f.nextNumber - 1} stays in My evaluations.`
  return f.origin === "waiting" ? `This is revision ${f.nextNumber} of the same request. The earlier link closes.` : `This is revision ${f.nextNumber} of the same submission.`
}

/**
 * Why it is here, in one compact banner: amber (warning) for a return or a result that did not count, neutral (info) for a request
 * nobody has answered yet. The reviewer's or evaluator's own words are quoted (data, never instructions); the path follows once.
 */
export function FixContext({ f }: { f: FixModel }) {
  const waiting = f.origin === "waiting"
  const title = waiting ? `Sent to ${f.evaluatorName}, ${shortDate(f.reasonAt)}` : f.case === "correction" ? `Returned by ${f.reasonBy}, ${shortDate(f.reasonAt)}` : `Did not count, ${shortDate(f.reasonAt)}`
  return (
    <div className="flex flex-col gap-2" data-region="reason">
      <LocalBanner variant={waiting ? "info" : "warning"} title={title} data-reason={f.origin}>
        <span className="flex flex-col gap-1">
          <span>{f.origin === "returned" ? <q data-user-content>{f.reason}</q> : f.reason}</span>
          {f.feedback ? <span><span className="text-muted-foreground">{`${f.evaluatorName}: `}</span><q data-user-content>{f.feedback}</q></span> : null}
        </span>
      </LocalBanner>
      <p className={TYPE.helper} data-path={f.case}>{pathSentence(f)}</p>
    </div>
  )
}

export interface FixDraft {
  who: "same" | "other"
  other: WhoValue
  fresh: NewEvaluator
  note: string
  whereVal: string
  location: string
  details: DetailValues
}

/** The where choice the original was performed at: its placement, the program setting it named, or lab or simulation. */
function whereValueOf(choices: WhereChoice[], w: FixModel["where"]): { value: string; typed: string } {
  if (w.setting !== "clinical") return { value: choices.find((c) => c.setting === w.setting)?.value ?? choices[0]?.value ?? "", typed: w.location ?? "" }
  const byPlace = choices.find((c) => c.setting === "clinical" && c.location && c.location === w.location)
  if (byPlace) return { value: byPlace.value, typed: "" }
  const bySetting = choices.find((c) => c.setting === "clinical" && c.askLocation && c.clinicalSetting === w.clinicalSetting)
  if (bySetting) return { value: bySetting.value, typed: w.location ?? "" }
  return { value: choices.find((c) => c.setting === "clinical")?.value ?? choices[0]?.value ?? "", typed: "" }
}

export function useFixDraft(f: FixModel | null, state: V2State, studentId: string) {
  const choices = React.useMemo(() => whereChoices(state, studentId), [state, studentId])
  const start = React.useMemo(() => (f ? whereValueOf(choices, f.where) : { value: choices[0]?.value ?? "", typed: "" }), [f, choices])
  const [draft, setDraft] = React.useState<FixDraft>(() => ({ who: "same", other: null, fresh: { name: "", email: "" }, note: f?.case === "correction" && f.origin === "returned" ? "" : f?.studentNote ?? "", whereVal: start.value, location: start.typed, details: { date: f?.details.date ?? "", unit: f?.details.unit ?? "", case: "" } }))
  const [sent, setSent] = React.useState<{ sentence: string; lines: Array<{ label: string; value: string }> } | null>(null)
  const [tried, setTried] = React.useState(false)
  const chosen = choices.find((c) => c.value === draft.whereVal) ?? null
  const loc = locationFor(chosen, draft.location)
  const setting = chosen?.setting ?? "clinical"
  // Every evaluator on record for this place and setting [REQ RV-04, ST-08]: lab and simulation list the recorded lab instructors,
  // clinical lists the site's preceptors; faculty who qualify in both. A further attempt goes to someone other than the evaluator
  // whose answer did not count (review 2026-10-30), so they are left out; a correction can go back to the same person.
  const attempt = f?.case === "attempt"
  const all = React.useMemo(() => (f ? evaluatorsFor(state, f.skillIds, loc, setting).filter((o) => !(attempt && o.id === f.evaluatorId)) : []), [f, state, loc, setting, attempt])
  // The original evaluator can sign again only if the place still allows their role (a preceptor cannot sign lab evidence).
  const sameOk = !!f && !attempt && all.some((o) => o.id === f.evaluatorId && o.eligible)
  const others = all.filter((o) => o.id !== f?.evaluatorId)
  const who = sameOk ? draft.who : "other"
  const freshErrors = who === "other" && draft.other?.kind === "new" ? newEvaluatorErrors(draft.fresh) : {}
  // The details the skill's configuration asks for, as on Send [REQ SC-13, ST-10].
  const fields = React.useMemo(() => (f ? detailFieldsFor(state, f.skillIds) : []), [f, state])
  const detailErrs = detailErrors(draft.details, fields)
  const errors = {
    // A return needs the student to say what changed; a correction of a request nobody answered, or a further attempt, does not.
    note: f?.case === "correction" && f.origin === "returned" && draft.note.trim().length < 3 ? "Say what you changed, so the reviewer can check it." : noteError(draft.note),
    other: who === "other" && !draft.other ? "Choose who to send it to." : null,
    location: locationError(chosen, draft.location),
  }
  const issues: ValidationIssue[] = [
    ...(errors.location ? [{ fieldId: "fix-where-location", message: errors.location }] : []),
    ...Object.entries(detailErrs).map(([k, message]) => ({ fieldId: `fix-detail-${k}`, message })),
    ...(errors.other ? [{ fieldId: "who-new", message: errors.other }] : []),
    ...(freshErrors.name ? [{ fieldId: "new-name", message: freshErrors.name }] : []),
    ...(freshErrors.email ? [{ fieldId: "new-email", message: freshErrors.email }] : []),
    ...(errors.note ? [{ fieldId: "fix-note", message: errors.note }] : []),
  ]
  const pickOf = () => (!f ? undefined : who === "same" ? all.find((o) => o.id === f.evaluatorId) : draft.other?.kind === "person" ? others.find((o) => o.id === (draft.other as { id: string }).id) : undefined)
  const toName = () => (!f ? "" : who === "same" ? f.evaluatorName : pickOf()?.name ?? (draft.other?.kind === "new" ? draft.fresh.name.trim() || "Someone not listed" : ""))
  // Save for later, a further attempt only (a new submission): a draft in My requests, Drafts; Continue opens it in Send.
  const [savedId, setSavedId] = React.useState<string | null>(null)
  const saveForLater = () => {
    if (!f || f.case !== "attempt" || !chosen) return
    const p = pickOf()
    let id: string | null = null
    updateActiveV2Store((st) => {
      const r = saveLogged(st, { skillIds: f.skillIds, where: draft.whereVal, setting: chosen.setting, clinicalSetting: chosen.clinicalSetting, location: loc, date: draft.details.date, unit: draft.details.unit, case: draft.details.case, note: draft.note, ratings: {}, step: "send", who: p?.id ?? null, batchId: savedId }, studentId)
      id = r.batchId
      return r.state
    })
    if (id) setSavedId(id)
  }
  const send = (offline: boolean) => {
    setTried(true)
    if (!f || issues.length > 0) return
    const pick = who === "same" ? all.find((o) => o.id === f.evaluatorId) : draft.other?.kind === "person" ? others.find((o) => o.id === (draft.other as { id: string }).id) : undefined
    const to = who === "same" ? f.evaluatorName : pick?.name ?? (draft.fresh.name.trim() || "the evaluator")
    const role = pick?.role ?? (draft.other?.kind === "new" ? "Not yet recorded" : "")
    // "Someone not listed" [REQ SL-09, RV-04]: the typed name reaches New evaluators and Settings > Evaluators as Not verified, with
    // this request assigned to them (one person per email). Offline it waits on the device like the request.
    if (!offline && who === "other" && draft.other?.kind === "new" && chosen) {
      const named = { studentId, name: draft.fresh.name, email: draft.fresh.email, kind: chosen.setting === "clinical" ? ("preceptor" as const) : ("lab-instructor" as const), skillIds: f.skillIds, siteId: chosen.setting === "clinical" ? siteIdFor(state, loc) : undefined }
      updateActiveV2Store((st) => recordNamedEvaluator(st, named, labNow()).state)
    }
    const sentence = offline
      ? `Kept on this device. It goes to ${to} when you reconnect.`
      : f.case === "correction"
        ? `Sent to ${to} as revision ${f.nextNumber}. Their email holds a new link for this request. It counts after they answer met.`
        : `Sent to ${to} as attempt ${f.nextNumber}. It counts after they answer met.`
    setSent({ sentence, lines: confirmationLines({ skillNames: f.skillNames, who: to, role, setting: settingWords(chosen), location: loc, date: draft.details.date, note: draft.note }) })
  }
  return { draft, setDraft, sent, tried, errors, issues, send, choices, chosen, sameOk, who, others, freshErrors, detailErrs, fields, setting, loc, toName, saveForLater, savedId, all }
}

export type FixApi = ReturnType<typeof useFixDraft>

/** A numbered section in the Send and Configure style: "1  Where and when". */
function Numbered({ n, title, id, children }: { n: number; title: string; id: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={id} data-fix-section={n}>
      <h2 id={id} className={`flex items-center gap-2 ${TYPE.section}`}>
        <span className="inline-flex size-6 items-center justify-center rounded-full border border-border text-xs tabular-nums text-muted-foreground" aria-hidden="true">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** The form: three numbered sections in one column at a readable width (40rem). Its actions live in the page footer. */
export function FixSections({ f, api }: { f: FixModel; api: FixApi }) {
  const { draft, setDraft, errors, tried } = api
  const noteLabel = f.case === "correction" && f.origin === "returned" ? "What you changed" : undefined
  return (
    <form id="fix-form" className="flex w-full max-w-[40rem] flex-col gap-8" noValidate onSubmit={(e) => e.preventDefault()} data-region="form">
      {tried && api.issues.length > 0 ? <ValidationSummary issues={api.issues} title="Fix these to send" /> : null}
      <Numbered n={1} title="Where and when" id="fix-where-h">
        <WhereSelect id="fix-where" choices={api.choices} value={draft.whereVal} onChange={(v) => setDraft((d) => ({ ...d, whereVal: v }))} />
        {api.chosen?.askLocation ? <LocationField id="fix-where-location" value={draft.location} onChange={(v) => setDraft((d) => ({ ...d, location: v }))} error={tried ? errors.location : null} /> : null}
        {api.setting !== "clinical" ? <p className={TYPE.helper}>{PRACTICE_LINE}</p> : null}
        <DetailsFields idPrefix="fix-detail" fields={api.fields} values={draft.details} onChange={(id, v) => setDraft((d) => ({ ...d, details: { ...d.details, [id]: v } }))} errors={api.detailErrs} showErrors={tried} pairs />
      </Numbered>
      <Numbered n={2} title="Who signs" id="fix-who-h">
        {/* One search-first picker (Romit 2026-10-27): the previous evaluator pinned first with "Signed before", disabled with the
            reason when the place no longer allows their role; anyone else by search; someone not listed last [REQ RV-02, RV-04, ST-09]. */}
        <EvaluatorPicker
          legend="Who signs"
          legendHidden
          options={api.all}
          pinnedId={f.case === "attempt" ? undefined : f.evaluatorId}
          value={api.who === "same" ? { kind: "person", id: f.evaluatorId } : draft.other}
          onChange={(v) => setDraft((d) => (v?.kind === "person" && v.id === f.evaluatorId ? { ...d, who: "same" } : { ...d, who: "other", other: v }))}
          fresh={draft.fresh}
          onFresh={(n) => setDraft((d) => ({ ...d, fresh: n }))}
          errors={api.freshErrors}
          showErrors={tried}
        />
        {tried && errors.other ? <FieldError>{errors.other}</FieldError> : null}
      </Numbered>
      <Numbered n={3} title={noteLabel ?? "Note (optional)"} id="fix-note-h">
        <NoteField id="fix-note" value={draft.note} onChange={(v) => setDraft((d) => ({ ...d, note: v }))} error={tried ? errors.note : null} label={noteLabel ?? "Note for the evaluator"} helper={null} rows={3} />
      </Numbered>
    </form>
  )
}

/** After Send: the outcome said once and what was sent [REQ ST-13]. */
export function FixSent({ f, api }: { f: FixModel; api: FixApi }) {
  if (!api.sent) return null
  return (
    <div className="flex w-full max-w-[40rem] flex-col gap-3" data-region="result">
      <LocalBanner variant="success" title={f.case === "correction" ? "Correction sent" : "Attempt sent"}>{api.sent.sentence}</LocalBanner>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm" data-confirmation>
        {api.sent.lines.map((l) => (
          <React.Fragment key={l.label}>
            <dt className="text-muted-foreground">{l.label}</dt>
            <dd className="min-w-0 text-foreground">{l.value}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  )
}

/** The page footer: Back (My requests) on the left; Save for later (further attempt) and the one primary on the right. */
export function FixFooter({ f, api, offline, studentId }: { f: FixModel; api: FixApi; offline: boolean; studentId: string }) {
  const router = useLabRouter()
  const requests = studentHref("my-requests", {}, studentId)
  if (api.sent) return <StickyFooter back={{ label: "Back", onClick: () => router.push(requests) }} primary={{ label: "Go to My requests", href: requests }} />
  const label = f.case === "correction" ? (f.origin === "waiting" ? "Send corrected request" : "Send correction") : offline ? "Keep and send later" : "Send for evaluation"
  return (
    <StickyFooter
      back={{ label: "Back", onClick: () => router.push(requests) }}
      context={api.savedId ? <span data-saved-draft>Saved to Drafts</span> : offline ? "Kept on this device until you reconnect." : null}
      secondary={f.case === "attempt" ? { label: "Save for later", onClick: api.saveForLater } : undefined}
      primary={{ label, onClick: () => api.send(offline) }}
    />
  )
}

/** What is about to be sent, values only (variant A's aside from 1280 px). */
export function FixSummary({ f, api }: { f: FixModel; api: FixApi }) {
  const who = api.toName()
  return (
    <section aria-label={f.case === "attempt" ? "Your attempt" : "Your correction"} className="flex flex-col gap-4" data-fix-summary>
      <h2 className={TYPE.section}>{f.case === "attempt" ? `Your attempt ${f.nextNumber}` : `Your revision ${f.nextNumber}`}</h2>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-3 text-sm">
        <dt className="text-muted-foreground">{f.skillIds.length > 1 ? "Skills" : "Skill"}</dt>
        <dd className="min-w-0 text-foreground">{f.skillNames.join(", ")}</dd>
        <dt className="text-muted-foreground">Where</dt>
        <dd className="min-w-0 text-foreground">{api.loc ?? settingWords(api.chosen)}</dd>
        <dt className="text-muted-foreground">Date</dt>
        <dd className="text-foreground">{api.draft.details.date ? shortDate(api.draft.details.date) : <span className="text-muted-foreground">Not set</span>}</dd>
        <dt className="text-muted-foreground">Who signs</dt>
        <dd className="min-w-0 text-foreground">{who || <span className="text-muted-foreground">Not chosen yet</span>}</dd>
        <dt className="text-muted-foreground">Counts</dt>
        <dd className="text-foreground">When they answer met</dd>
      </dl>
    </section>
  )
}

export function NothingToFix({ studentId }: { studentId: string }) {
  return <EmptyBlock title="Nothing to fix" body="No submission is returned, waiting to be corrected, or failed to count." action={{ label: "See My requests", href: studentHref("my-requests", {}, studentId) }} />
}

/**
 * The further-attempt and correction page, shared by Fix A and B (2026-10-27): FormPage (full width, D-X30) with the context banner
 * under the title, the numbered sections in one 40rem column, `aside` beside them from 1280 px, and FixFooter. `aside` is the
 * variant's own: A shows what is about to be sent, B shows what the evaluator or reviewer saw. `inline` repeats B's reference above
 * the form below 1280 px, where the aside column is hidden.
 */
export function FixPage({ marker, aside, inline }: { marker: string; aside: (f: FixModel, api: FixApi, ctx: StudentFrameCtx) => React.ReactNode; inline?: (f: FixModel, ctx: StudentFrameCtx) => React.ReactNode }) {
  const page = useStudentPage()
  if (!page.model || page.demo === "loading") {
    return (
      <div className="flex flex-col gap-4 p-6" aria-hidden="true">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64" />
      </div>
    )
  }
  const ctx = { ...page, model: page.model } as StudentFrameCtx
  return <FixPageBody key={`${ctx.param("submission") ?? ""}|${ctx.param("skill") ?? ""}`} ctx={ctx} marker={marker} aside={aside} inline={inline} />
}

function FixPageBody({ ctx, marker, aside, inline }: { ctx: StudentFrameCtx; marker: string; aside: (f: FixModel, api: FixApi, ctx: StudentFrameCtx) => React.ReactNode; inline?: (f: FixModel, ctx: StudentFrameCtx) => React.ReactNode }) {
  const f = useFix(ctx)
  const api = useFixDraft(f, ctx.state, ctx.studentId)
  const offline = ctx.demo === "offline"
  if (!f) {
    return (
      <FormPage title={fixTitle(null)}>
        <NothingToFix studentId={ctx.studentId} />
      </FormPage>
    )
  }
  return (
    <FormPage title={fixTitle(f)} banner={api.sent ? null : <FixContext f={f} />} aside={aside(f, api, ctx)} footer={<FixFooter f={f} api={api} offline={offline} studentId={ctx.studentId} />}>
      <div className="flex flex-col gap-6" data-student-lab={marker}>
        {inline && !api.sent ? <div className="min-[1280px]:hidden">{inline(f, ctx)}</div> : null}
        {api.sent ? <FixSent f={f} api={api} /> : <FixSections f={f} api={api} />}
      </div>
    </FormPage>
  )
}
