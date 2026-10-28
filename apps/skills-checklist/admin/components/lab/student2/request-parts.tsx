"use client"

/**
 * Send for evaluation: the request being written (skills, where, who, how), its checks, and the result. One request carries every
 * skill from one sitting to one evaluator with one link [REQ EV-05; LEDGER D-L2]. "Save for later" keeps it as a draft in the shared
 * store (lib/lab/logged.ts), listed in My requests, Drafts, and `?logged=<id>` continues that draft (LEDGER D-L10). Send writes the
 * request to the shared store, so it waits in My requests; offline it stays a draft until it can go. The result says once what
 * happens next, then hands off to My requests [REQ ST-03, ST-13, EV-07].
 */
import { CheckoffDone } from "@/components/lab/student/checkoff"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { DetailsFields, EvaluatorChecks, LocationField, NoteField, SelectedSkills, SelfEvalCards, SkillPicker, TOUCH_ROW, WhereSelect, selfEvalIssues, selfShape, selfSummary, type SelfAnswers, type WhoValue } from "@/components/lab/student2/log-parts"
import { QrSvg } from "@/components/lab/student2/qr"
import { SectionTitle } from "@/components/lab/student/parts"
import { ValidationSummary, type ValidationIssue } from "@/components/lab/layout/validation-summary"
import type { Student2Ctx } from "@/components/lab/student2/frame"
import type { Setting, SignoffMethod, Submission } from "@/lib/v2/types"
import { skillById } from "@/lib/v2/evidence-index"
import { skillRecord } from "@/lib/lab/student"
import { labNow, loggedSitting, markLoggedSent, saveLogged, sendNew, type LoggedInput } from "@/lib/lab/logged"
import { updateActiveV2Store } from "@/lib/v2/react"
import { aNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { TYPE } from "@/components/lab/type-scale"
import {
  DEFAULT_METHOD,
  PRACTICE_LINE,
  STUDENT_NOTE_MAX,
  confirmationLines,
  countsWhen,
  detailErrors,
  evaluatorsFor,
  locationError,
  locationFor,
  methodById,
  needsApproval,
  newEvaluatorErrors,
  nextSentence,
  noteError,
  pickRows,
  selfEvalEnabled,
  settingWords,
  student2Href,
  whereChoices,
  type DetailValues,
  type EvaluatorOption,
  type NewEvaluator,
  type PickRow,
} from "@/lib/lab/student2"

export interface RequestResultInfo {
  id: string
  method: SignoffMethod
  who: string
  skillIds: string[]
  sentence: string
  queued: boolean
  /** What was submitted, to whom, in what role, setting and location [REQ ST-13]. */
  lines: Array<{ label: string; value: string }>
  /** When it counts, per skill, from that skill's own rule (never a generic "when they answer Met"). */
  counts: Array<{ id: string; name: string; text: string }>
  /**
   * The request as it is stored [REQ ST-12]: one `studentNote` per submission, apart from the evaluator's comment (the evaluator
   * reads it beside the request, EV-04; lib/lab/evaluation-view.ts reads `studentNote`). The lab keeps it local (the shared store
   * stays read only).
   */
  submission: Submission
}

const unitOf = (location: string | null | undefined) => (location && location.includes(",") ? location.split(",").slice(1).join(",").trim() : "")

export function useRequestDraft(ctx: Student2Ctx) {
  const { state: s, model: m, studentId, param, offline } = ctx
  // Every configured, active skill [REQ ST-02, SL-11]: a deactivated skill is never offered (pickRows reads openToLog).
  const picks = React.useMemo(() => pickRows(s, m), [s, m])
  // Every place [REQ ST-05, ST-06, ST-07]: placements (or the program's settings when none is recorded), then lab and simulation.
  const where = React.useMemo(() => whereChoices(s, studentId), [s, studentId])
  const initialSkills = React.useMemo(() => {
    const asked = (param("skills") ?? param("skill") ?? "").split(",").filter((id) => picks.some((p) => p.id === id))
    return asked.length ? asked : picks.filter((p) => p.likely && !p.waiting).slice(0, 2).map((p) => p.id)
  }, [param, picks])
  const [skills, setSkills] = React.useState<string[]>(initialSkills)
  const [whereVal, setWhereVal] = React.useState(() => {
    const asked = param("where")
    return asked && where.some((w) => w.value === asked) ? asked : where[0]?.value ?? ""
  })
  const chosen = where.find((w) => w.value === whereVal) ?? null
  const [location, setLocation] = React.useState(() => param("loc") ?? "")
  // Details the program requires [REQ ST-10]: handed over from Log when the student logged first, otherwise asked for here.
  const [details, setDetails] = React.useState<DetailValues>(() => ({ date: param("date") ?? "", unit: param("unit") ?? unitOf(chosen?.location), case: param("case") ?? "" }))
  const [note, setNote] = React.useState(() => (param("note") ?? "").slice(0, STUDENT_NOTE_MAX))
  const loc = locationFor(chosen, location)
  const setting: Setting = chosen?.setting ?? "clinical"
  const options = React.useMemo(() => evaluatorsFor(s, skills, loc, setting), [s, skills, loc, setting])
  // Continuing a draft (?logged=): the evaluator, method and self-ratings come back as they were saved.
  const draft = React.useMemo(() => loggedSitting(s, studentId, param("logged")), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [draftId, setDraftId] = React.useState<string | null>(() => draft?.batchId ?? null)
  const [savedAt, setSavedAt] = React.useState<string | null>(null)
  const [who, setWho] = React.useState<WhoValue>(() => (draft?.who ? { kind: "person", id: draft.who } : null))
  const [fresh, setFresh] = React.useState<NewEvaluator>({ name: "", email: "" })
  // One link per request, by email, is the default [LEDGER D-L2]; QR, hand over and the paper photo stay one click away.
  const [method, setMethod] = React.useState<SignoffMethod>(() => (draft?.method as SignoffMethod | undefined) ?? DEFAULT_METHOD)
  const [ratings, setRatings] = React.useState<Record<string, string>>(() => draft?.ratings ?? {})
  const [answers, setAnswers] = React.useState<SelfAnswers>(() => draft?.answers ?? {})
  const setAnswer = (id: string, i: number, v: "yes" | "no") => setAnswers((a) => {
    const n = selfShape(skillById(s, id)!).questions.length
    const row = Array.from({ length: n }, (_, k) => a[id]?.[k] ?? null)
    row[i] = v
    return { ...a, [id]: row }
  })
  // Skills that ask for a self-evaluation [REQ SC-15, ST-11], and what is still unanswered.
  const selfIds = skills.filter((k) => selfEvalEnabled(skillById(s, k)))
  const selfIssues = selfEvalIssues(s, selfIds, ratings, answers)
  const [photo, setPhoto] = React.useState<{ name: string; sizeKb: number } | null>(null)
  const [tried, setTried] = React.useState(false)
  const [result, setResult] = React.useState<RequestResultInfo | null>(null)

  const setWhere = (v: string) => {
    setWhereVal(v)
    const w = where.find((x) => x.value === v)
    if (w?.location) setDetails((d) => ({ ...d, unit: unitOf(w.location) || d.unit }))
  }

  // A picked person who stops qualifying when the skills or the place change is cleared, never silently kept.
  React.useEffect(() => {
    if (who?.kind === "person" && !options.some((o) => o.id === who.id && o.eligible)) setWho(null)
  }, [options, who])

  const freshErrors = who?.kind === "new" ? newEvaluatorErrors(fresh) : {}
  const detailErrs = detailErrors(details)
  const errors = {
    skills: skills.length === 0 ? `Pick at least one ${skillNoun()}.` : null,
    who: who === null ? (method === "photo" ? "Choose who signed the form." : "Choose who signs off.") : null,
    photo: method === "photo" && !photo ? "Add a photo of the signed form." : null,
    location: locationError(chosen, location),
    note: noteError(note),
  }
  // One summary after a failed Send [rule L9]: each entry focuses its field, in the order the form asks for them.
  const issues: ValidationIssue[] = [
    ...(errors.skills ? [{ fieldId: "req-skills-add", message: errors.skills }] : []),
    ...selfIssues,
    ...(errors.location ? [{ fieldId: "req-where-location", message: errors.location }] : []),
    ...Object.entries(detailErrs).map(([k, message]) => ({ fieldId: `req-detail-${k}`, message })),
    ...(errors.who ? [{ fieldId: options.find((o) => o.eligible) ? `who-${options.find((o) => o.eligible)!.id}` : "who-new", message: errors.who }] : []),
    ...(freshErrors.name ? [{ fieldId: "new-name", message: freshErrors.name }] : []),
    ...(freshErrors.email ? [{ fieldId: "new-email", message: freshErrors.email }] : []),
    ...(errors.photo ? [{ fieldId: "req-photo", message: errors.photo }] : []),
    ...(errors.note ? [{ fieldId: "req-note", message: errors.note }] : []),
  ]
  const valid = issues.length === 0
  const whoOption = who?.kind === "person" ? options.find((o) => o.id === who.id) : undefined
  const whoName = whoOption?.name ?? (who?.kind === "new" ? fresh.name.trim() || "your evaluator" : "your evaluator")
  const whoRole = whoOption?.role ?? (who?.kind === "new" ? (setting === "clinical" ? "Not yet recorded" : "Lab instructor, not yet recorded") : "")

  const inputFor = (extra: { course?: string | null; step?: string | null } = {}): LoggedInput | null => {
    if (!chosen) return null
    return {
      skillIds: skills, where: whereVal, setting: chosen.setting, clinicalSetting: chosen.clinicalSetting, location: loc, date: details.date, unit: details.unit, case: details.case, note,
      ratings: Object.fromEntries(skills.filter((k) => ratings[k]).map((k) => [k, ratings[k]])),
      answers: Object.fromEntries(skills.filter((k) => answers[k]?.length).map((k) => [k, answers[k]])),
      course: extra.course ?? param("course"), step: extra.step ?? param("step"), who: who?.kind === "person" ? who.id : null, method, batchId: draftId,
    }
  }
  // Save for later: a draft needs only one skill; nothing else is checked until Send. Saving again updates the same draft.
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const saveForLater = (extra: { course?: string | null; step?: string | null } = {}) => {
    const input = inputFor(extra)
    if (skills.length === 0 || !input) {
      setSaveError(`Choose at least one ${skillNoun()} to save it.`)
      return false
    }
    setSaveError(null)
    let id: string | null = null
    updateActiveV2Store((st) => {
      const r = saveLogged(st, input, studentId)
      id = r.batchId
      return r.state
    })
    if (id) setDraftId(id)
    setSavedAt(labNow())
    return true
  }

  const send = () => {
    setTried(true)
    setSaveError(null)
    if (!valid) return false
    const queued = offline && !methodById(method).offline
    const id = `req-lab-${Date.now().toString(36)}`
    const submission: Submission = { id, studentId, skillIds: skills, method, status: queued ? "on-device" : method === "photo" ? "awaiting-review" : "with-evaluator", assignedToId: whoOption?.id ?? "", createdAt: new Date().toISOString(), daysWaiting: 0, candidateIds: whoOption ? [whoOption.id] : [], ...(note.trim() ? { studentNote: note.trim() } : {}) }
    const base = confirmationLines({ skillNames: skills.map((k) => picks.find((p) => p.id === k)?.name ?? skillNoun()), who: whoName, role: whoRole, setting: settingWords(chosen), location: loc, date: details.date, note })
    // What the student rated themselves, per skill, said once in the confirmation [REQ ST-11, ST-13].
    const selfLine = selfIds.map((k) => `${skillById(s, k)?.name ?? skillNoun()}: ${selfSummary(s, k, ratings, answers)}`).join("; ")
    const lines = selfLine ? [...base, { label: "You rated yourself", value: selfLine }] : base
    const counts = skills.map((k) => {
      const r = m.all.find((x) => x.id === k) ?? skillRecord(s, studentId, k, "evidence", false)
      const name = r?.name ?? picks.find((p) => p.id === k)?.name ?? skillNoun()
      const approval = skillById(s, k)?.config?.approvalRequired === true
      return { id: k, name, text: r ? countsWhen({ counted: r.counted, need: r.need, achieved: r.state === "achieved", parts: r.parts }, approval) : approval ? "Met counts after a reviewer approves it." : "Met counts toward it." }
    })
    // Sent: the request is written to the shared store and waits in My requests. From a draft, the draft becomes that request and
    // leaves Drafts. Offline it is kept as a draft (My requests, Drafts) until it can go (LEDGER D-L10).
    const input = inputFor()
    if (queued) {
      if (input) updateActiveV2Store((st) => saveLogged(st, input, studentId).state)
    } else if (draftId) {
      // Keep the draft's latest values first, then send it.
      updateActiveV2Store((st) => (input ? markLoggedSent(saveLogged(st, input, studentId).state, studentId, draftId, { ...submission, createdAt: labNow() }) : st))
    } else if (input) {
      updateActiveV2Store((st) => sendNew(st, input, studentId, submission))
    }
    setResult({ id, method, who: whoName, skillIds: skills, queued, lines, counts, submission, sentence: nextSentence({ method, who: whoName, approval: needsApproval(s, skills), offline, newName: who?.kind === "new" }) })
    return true
  }
  const toggle = (id: string) => setSkills((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]))
  const reset = () => {
    setResult(null)
    setDraftId(null)
    setSavedAt(null)
    setTried(false)
    setWho(null)
    setPhoto(null)
    setNote("")
  }
  return { s, studentId, offline, picks, where, chosen, whereVal, setWhere, location, setLocation, details, setDetails, detailErrs, note, setNote, skills, setSkills, toggle, options, who, setWho, fresh, setFresh, freshErrors, method, setMethod, photo, setPhoto, tried, errors, issues, valid, send, result, reset, whoName, ratings, setRatings, answers, setAnswer, selfIds, selfIssues, saveForLater, saveError, savedAt, draftId }
}

export type RequestDraft = ReturnType<typeof useRequestDraft>

/**
 * What the evaluator sees, said once before Send [CALL 10-26]: only the chosen skills, and the student's self-rating where the
 * program asks for one (it sits beside the evaluator's answer). Preceptors and lab instructors open the same link, no account.
 */
export function scopeSentence(d: Pick<RequestDraft, "picks" | "skills">): string {
  const self = d.picks.some((p) => p.selfEval && d.skills.includes(p.id))
  return self ? `They see only the ${skillNounPlural()} you chose, with your self-rating.` : `They see only the ${skillNounPlural()} you chose.`
}

/** Skills as chips with an "Add" search, so the request can carry several from one sitting [REQ ST-04, EV-05]. */
export function SkillsField({ d, picks }: { d: RequestDraft; picks: PickRow[] }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="flex flex-col gap-2" data-region="skills">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle count={d.skills.length}>{skillNounPlural().replace(/^./, (c) => c.toUpperCase())}</SectionTitle>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button id="req-skills-add" type="button" variant="outline" size="sm">{`Add ${aNoun()}`}</Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(28rem,calc(100vw-2rem))] p-1">
            <SkillPicker rows={picks} selected={d.skills} onToggle={d.toggle} autoFocus listClassName="max-h-80" />
          </PopoverContent>
        </Popover>
      </div>
      <SelectedSkills s={d.s} ids={d.skills} onRemove={d.toggle} />
      <CheckoffDone s={d.s} studentId={d.studentId} ids={d.skills} />
      {/* What the evaluator checks, for skills with no self-evaluation (those show it in the self-evaluation cards). */}
      {d.skills.filter((k) => !d.selfIds.includes(k)).map((k) => <EvaluatorChecks key={k} s={d.s} id={k} />)}
      {d.tried && d.errors.skills ? <FieldError>{d.errors.skills}</FieldError> : null}
    </div>
  )
}

/** Self-evaluation cards for Send A and B (C has its own step): the same criteria the evaluator uses [REQ ST-11, SC-15]. */
export function SelfEvalPart({ d }: { d: RequestDraft }) {
  if (d.selfIds.length === 0) return null
  return <SelfEvalCards s={d.s} ids={d.selfIds} ratings={d.ratings} answers={d.answers} onRating={(id, v) => d.setRatings((r) => ({ ...r, [id]: v }))} onAnswer={d.setAnswer} showErrors={d.tried} />
}

/**
 * Where it was performed, decided before who signs [REQ ST-05, ST-08]: the place sets the roles (clinical: preceptor or faculty;
 * lab or simulation: lab instructor or faculty). The first placement is preselected (ST-06); the location is asked for only when
 * no placement supplies it (ST-07).
 */
export function WherePick({ d }: { d: RequestDraft }) {
  return (
    <div className="flex flex-col gap-3">
      <div className={cn("grid gap-3", d.chosen?.askLocation ? "sm:grid-cols-2" : "")}>
        <WhereSelect id="req-where" choices={d.where} value={d.whereVal} onChange={d.setWhere} />
        {d.chosen?.askLocation ? <LocationField id="req-where-location" value={d.location} onChange={d.setLocation} error={d.tried ? d.errors.location : null} /> : null}
      </div>
      {d.chosen && d.chosen.setting !== "clinical" ? <p className={TYPE.helper}>{PRACTICE_LINE}</p> : null}
    </div>
  )
}

/** The program's details and the one note, required ones enforced before Send [REQ ST-10, ST-12]. */
export function DetailsAndNote({ d, columns = true }: { d: RequestDraft; columns?: boolean }) {
  return (
    <div className="flex flex-col gap-4" data-region-part="details">
      <DetailsFields idPrefix="req-detail" values={d.details} onChange={(id, v) => d.setDetails((x) => ({ ...x, [id]: v }))} errors={d.detailErrs} showErrors={d.tried} columns={columns} />
      <NoteField id="req-note" value={d.note} onChange={d.setNote} error={d.tried ? d.errors.note : null} />
    </div>
  )
}

/**
 * After Save for later: one line, said once, with the way to the draft (D-L10). Nothing counts until it is sent. A failed save
 * (no skill chosen) shows its one fix instead.
 */
export function SavedForLater({ d }: { d: RequestDraft }) {
  if (d.saveError) return <LocalBanner variant="error" data-save-error>{d.saveError}</LocalBanner>
  if (!d.savedAt) return null
  return (
    <LocalBanner variant="success" title="Saved for later" data-saved-draft>
      <span>
        {"Nothing counts until you send it. "}
        <Link href={student2Href("my-requests", { show: "drafts" }, d.studentId)} className="font-medium underline underline-offset-2">View in Drafts</Link>
      </span>
    </LocalBanner>
  )
}

/** After a failed Send: one summary, each entry focusing its field [REQ ST-10; rule L9]. */
export function SendIssues({ d }: { d: RequestDraft }) {
  if (!d.tried || d.valid) return null
  return <ValidationSummary issues={d.issues} title="Fix these to send" />
}

export function PhotoField({ d }: { d: RequestDraft }) {
  return (
    <Field data-invalid={d.tried && !!d.errors.photo}>
      <FieldLabel htmlFor="req-photo">Photo of the signed form</FieldLabel>
      <Input
        id="req-photo"
        type="file"
        accept="image/*"
        capture="environment"
        className={TOUCH_ROW}
        aria-invalid={(d.tried && !!d.errors.photo) || undefined}
        onChange={(e) => {
          const f = e.target.files?.[0]
          d.setPhoto(f ? { name: f.name, sizeKb: Math.round(f.size / 1024) } : null)
        }}
      />
      {d.photo ? <FieldDescription>{`${d.photo.name}, ${d.photo.sizeKb.toLocaleString("en-US")} KB`}</FieldDescription> : <FieldDescription>Goes to your program for review.</FieldDescription>}
      {d.tried && d.errors.photo ? <FieldError>{d.errors.photo}</FieldError> : null}
    </Field>
  )
}

export const evaluatorLink = (id: string) => (typeof window === "undefined" ? `/lab/evaluator/evaluation-form?request=${id}` : `${window.location.origin}/lab/evaluator/evaluation-form?request=${id}`)

/**
 * After Send: the one thing to do now (scan, hand over, nothing for a link, nothing for a photo), the "what happens next"
 * sentence said once, then My requests. A sent request has no QR or link controls left anywhere else [AUDIT T2 RV-05 UI].
 */
export function RequestResult({ d, r, wide = false }: { d: RequestDraft; r: RequestResultInfo; /** Full-width page (Send C): what was sent beside what happens next, so the card fills the width. */ wide?: boolean }) {
  const link = evaluatorLink(r.id)
  const [copied, setCopied] = React.useState(false)
  const title = r.queued ? "Kept on this device" : r.method === "qr" ? `Ready for ${r.who} to scan` : r.method === "handover" ? `Hand your device to ${r.who}` : r.method === "photo" ? "Sent for review" : "Sent"
  const [first, ...rest] = r.counts
  return (
    <Card className="gap-0 py-0" data-region="result">
      <CardContent className={cn("grid gap-x-10 gap-y-4 py-5", wide ? "lg:grid-cols-2" : "")}>
        <div className="flex min-w-0 flex-col gap-4">
        <h2 className={TYPE.section}>{title}</h2>
        {/* What was submitted, to whom, in what role, setting and location [REQ ST-13]. */}
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm" data-confirmation>
          {r.lines.map((l) => (
            <React.Fragment key={l.label}>
              <dt className="text-muted-foreground">{l.label}</dt>
              <dd className="min-w-0 text-foreground" data-user-content={l.label === "Your note" ? "" : undefined}>{l.value}</dd>
            </React.Fragment>
          ))}
          {/* When it counts, per skill, from its own rule [REQ AE-02, EV-07]. */}
          {first ? (
            <>
              <dt className="text-muted-foreground">When it counts</dt>
              <dd className="min-w-0 text-foreground" data-counts-when>
                <ul className="flex flex-col gap-1">
                  {[first, ...rest].map((c) => <li key={c.id}>{r.counts.length > 1 ? <><span className="font-medium">{`${c.name}: `}</span>{c.text}</> : c.text}</li>)}
                </ul>
              </dd>
            </>
          ) : null}
        </dl>
        </div>
        <div className={cn("flex min-w-0 flex-col gap-4", wide ? "lg:border-s lg:border-border lg:ps-10" : "")}>
        {!r.queued && r.method === "qr" ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <QrSvg text={link} label={`QR code that opens this request for ${r.who}`} className="size-44 border border-border p-1" />
            <InputGroup className="w-full sm:max-w-sm">
              <InputGroupInput readOnly value={link} aria-label="Request link" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    void navigator.clipboard?.writeText(link)
                    setCopied(true)
                  }}
                >
                  {copied ? "Copied" : "Copy link"}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        ) : null}
        {!r.queued && r.method === "handover" ? (
          <Button asChild variant="outline" size="sm" className="self-start">
            <Link href={`/lab/evaluator/evaluation-form?request=${r.id}`}>Open the sign-off for them</Link>
          </Button>
        ) : null}
        <LocalBanner variant={r.queued ? "info" : "success"}>{r.sentence}</LocalBanner>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="default" size="default" className="max-sm:h-11">
            <Link href={student2Href("my-requests", {}, d.studentId)}>Go to My requests</Link>
          </Button>
          <Button type="button" variant="ghost" size="default" className="max-sm:h-11" onClick={d.reset}>Send another</Button>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}

export type { EvaluatorOption }
