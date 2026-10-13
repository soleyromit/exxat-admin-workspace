"use client"

/**
 * S-13 Send for review (also hosts Revise and resend and Make a further attempt). Contract: docs/build/contracts/S-13-student-send-for-review.md.
 * R5 re-skin: the prototype's Send for review is a centred 1024px DIALOG (docs/build/prototype-parity.md P-11, C-4), not a Sheet.
 * Behaviour is unchanged (store actions, role x setting table, DEFECT-01/02 fixes).
 * Decisions that matter:
 *  - The role x setting table is DATA (OD-25) read through computeSendOptions; nothing here hardcodes which role can sign off what.
 *  - Changing performed-in, setting or role clears the person (fixes DEFECT-01). The reducer in send-form.ts owns that rule.
 *  - Send is disabled only WITH a visible reason (never silently). The ST-08 block is a warning banner with a way forward.
 *  - Self-evaluation is completed BEFORE send inside this sheet (DEC-001). There is no draft: OD-14 is open, no Save draft.
 *  - Setting and location are captured ONCE for the request and copied onto each item by the store (OD-07 open). The copy
 *    never says "per submission" or "per skill".
 *  - Wording on who corrects a returned item stays neutral (OD-16 open): the sheet only offers Resend.
 */
import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import type { Id, Submission } from "@/lib/domain/types"
import { isConfigured } from "@/lib/engine"
import { buttons, sendBlockedText, sendCopy, validation } from "@/lib/copy"
import { reviseAndResend, returnReason, roleLabel, sendForReview, startFurtherAttempt, type EvaluatorChoice } from "@/lib/store"
import { useActions } from "@/lib/store/react"
import { useActingStudent } from "./helpers"
import { modelNames, offeringTitle, r5 } from "@/lib/copy/r5-student-preceptor"
import { studentLocal as local } from "@/lib/copy"
import { SelfEvaluationForm } from "./answers"
import { formFromSubmission, initialForm, optionsFor, parseSettingKey, reduce, settingKey, validate, type FormState } from "./send-form"

const NAMED = "__named__"
const isEmailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

export type SendMode = { kind: "new" } | { kind: "revise"; submissionId: Id } | { kind: "further"; fromSubmissionId: Id }

/** ST-13: what the confirmation must name. */
export interface SentInfo {
  count: number
  skillNames: string[]
  evaluatorName: string
  roleLabel: string
  where: string
  message: string
}

export interface SendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  offeringId: Id
  skillIds: Id[]
  mode?: SendMode
  onSent: (info: SentInfo) => void
}

export function SendDialog({ open, onOpenChange, offeringId, skillIds, mode = { kind: "new" }, onSent }: SendDialogProps) {
  const { db, studentId } = useActingStudent()
  const { run } = useActions()
  const source: Submission | undefined = mode.kind === "revise" ? db.submissions.find((s) => s.id === mode.submissionId) : mode.kind === "further" ? db.submissions.find((s) => s.id === mode.fromSubmissionId) : undefined
  // The form starts once per open (the parent remounts with a new key), so the initial state is read once.
  const [initial] = React.useState<FormState>(() => (source && mode.kind !== "new" ? formFromSubmission(source, db, mode.kind) : initialForm(skillIds)))
  const [state, dispatch] = React.useReducer(reduce, initial)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [sendError, setSendError] = React.useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [separatelyNote, setSeparatelyNote] = React.useState(false)

  const opts = React.useMemo(() => optionsFor(db, studentId, offeringId, state), [db, studentId, offeringId, state])
  const v = React.useMemo(() => validate(db, opts, state), [db, opts, state])
  const dirty = React.useMemo(() => JSON.stringify(state) !== JSON.stringify(initial), [state, initial])
  const offering = db.offerings.find((o) => o.id === offeringId)
  const skills = state.skillIds.map((id) => db.skills.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s)
  const placementsCount = db.placements.filter((p) => p.studentId === studentId && p.offeringId === offeringId).length
  const revise = mode.kind === "revise"
  const further = mode.kind === "further"
  const reviewerNote = revise && source ? returnReason(db, source.id) : null

  // One valid role: choose it, so the student makes fewer decisions (the person is still chosen by the student).
  const rolesKey = opts.roles.join(",")
  React.useEffect(() => {
    if (state.roleId && !opts.roles.includes(state.roleId)) dispatch({ type: "role", roleId: "" })
    else if (!state.roleId && opts.roles.length === 1) dispatch({ type: "role", roleId: opts.roles[0] })
  }, [rolesKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const skillName = (id: Id) => db.skills.find((s) => s.id === id)?.name ?? id
  const blocked = opts.blocked ? sendBlockedText(opts.blocked, db, state.performedIn, skillName) : null
  const persons = state.roleId ? (opts.evaluatorsByRole[state.roleId] ?? []) : []
  const isLabRole = state.roleId === "lab_instructor"
  const reasonText =
    v.reason === "blocked" ? local.disabledReason.blocked : v.reason === "setting" ? local.disabledReason.setting : v.reason === "person" ? local.disabledReason.person : v.reason === "fields" ? local.disabledReason.fields(v.requiredMissing) : v.reason === "selfEval" ? local.disabledReason.selfEval : null

  const handleOpenChange = (next: boolean) => {
    if (!next && dirty && !sending) {
      setConfirmDiscard(true)
      return
    }
    onOpenChange(next)
  }

  const evaluatorChoice = (): EvaluatorChoice => (state.namedOpen ? { roleId: "lab_instructor", named: { name: state.named.name.trim(), email: state.named.email.trim() } } : { roleId: state.roleId, personId: state.personId })
  const settingChoice = (): { settingId: Id; locationId: Id | null } | undefined => {
    if (state.performedIn !== "clinical") return undefined
    if (opts.settingMode === "inferred") return opts.settings[0]
    return parseSettingKey(state.settingKey) ?? undefined
  }

  const summary = (): { evaluatorName: string; role: string } => {
    if (state.namedOpen) return { evaluatorName: state.named.name.trim(), role: roleLabel(db, "lab_instructor") }
    const p = persons.find((x) => x.personId === state.personId)
    return { evaluatorName: p?.name ?? "", role: roleLabel(db, state.roleId) }
  }

  const send = () => {
    if (!v.canSend || sending) return
    setSending(true)
    setSendError(null)
    const sk = state.skillIds.map((id) => {
      const d = state.drafts[id]
      return { skillId: id, values: d.values, studentNote: d.note, selfEvaluation: d.selfEval }
    })
    const setting = settingChoice()
    const evaluator = evaluatorChoice()
    const r = revise && source
      ? run((d, ctx) => reviseAndResend(d, source.id, { values: sk[0].values, studentNote: sk[0].studentNote, selfEvaluation: sk[0].selfEvaluation, evaluator, setting }, ctx))
      : further && source
        ? run((d, ctx) => startFurtherAttempt(d, source.id, { studentId, offeringId, performedIn: state.performedIn, setting, evaluator, skill: sk[0] }, ctx))
        : run((d, ctx) => sendForReview(d, { studentId, offeringId, performedIn: state.performedIn, setting, evaluator, skills: sk }, ctx))
    setSending(false)
    if (!r.ok) {
      // P-14: non-optimistic and non-destructive. Every answer is still in the form.
      setTouched(Object.fromEntries(Object.keys(r.error.fields ?? {}).map((k) => [k, true])))
      setSendError(sendCopy.sendFailed)
      return
    }
    const who = summary()
    const settingName = setting ? (db.clinicalSettings.find((s) => s.id === setting.settingId)?.name ?? null) : null
    const locName = setting?.locationId ? (db.locations.find((l) => l.id === setting.locationId)?.name ?? null) : null
    const where = sendCopy.where(state.performedIn, settingName, locName)
    const names = skills.map((s) => s.name)
    onSent({ count: names.length, skillNames: names, evaluatorName: who.evaluatorName, roleLabel: who.role, where, message: sendCopy.confirmation(names, who.evaluatorName, who.role, where) })
    onOpenChange(false)
  }

  const title = revise ? buttons.reviseAndResend : further ? buttons.furtherAttempt : r5.send.title
  const primary = revise ? buttons.resend : r5.send.sendRequest
  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }))

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton className="flex max-h-[calc(100dvh-4rem)] w-[calc(100vw-1rem)] flex-col gap-0 p-0 sm:max-w-5xl [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:size-11">
          <DialogHeader className="border-b border-border px-4 py-3 text-left sm:px-6">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{r5.send.subtitle(skills.length, offering ? offeringTitle(offering.code, offering.name) : "")}</DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 sm:px-6">
            {reviewerNote ? (
              <LocalBanner variant="info" title={local.reviewerNoteHeading}>
                {reviewerNote}
                <span className="mt-1 block">{local.reviseNote}</span>
              </LocalBanner>
            ) : revise ? (
              <LocalBanner variant="info">{local.reviseNote}</LocalBanner>
            ) : null}
            {further ? <LocalBanner variant="info">{local.furtherNote}</LocalBanner> : null}
            {sendError ? (
              <LocalBanner variant="error" retry={{ label: buttons.retry, onClick: send }}>
                {sendError}
              </LocalBanner>
            ) : null}

            {blocked ? (
              <div role="status" className="flex flex-col gap-2">
                <LocalBanner variant="warning" action={blocked.switchTo ? { label: blocked.switchTo === "lab" ? local.switchTo.lab : local.switchTo.clinical, onClick: () => dispatch({ type: "performedIn", value: blocked.switchTo! }) } : undefined}>
                  {blocked.text}
                </LocalBanner>
                {blocked.separately ? (
                  <Button type="button" variant="link" size="sm" className="min-h-11 self-start" onClick={() => { dispatch({ type: "onlyFirstSkill" }); setSeparatelyNote(true) }}>
                    {local.sendSeparately}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {separatelyNote && !blocked ? <LocalBanner variant="info">{local.sendSeparatelyNote}</LocalBanner> : null}

            {/* ST-05 */}
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-foreground">{r5.send.where}</legend>
              {revise ? (
                <p className="text-sm text-foreground">{state.performedIn === "clinical" ? r5.send.clinical : r5.send.lab}</p>
              ) : (
                <RadioGroup value={state.performedIn} onValueChange={(x) => dispatch({ type: "performedIn", value: x as "clinical" | "lab" })} className="flex flex-row flex-wrap gap-2">
                  {([
                    ["clinical", r5.send.clinical],
                    ["lab", r5.send.lab],
                  ] as const).map(([val, label]) => (
                    <Label key={val} htmlFor={`perf-${val}`} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 font-normal ${state.performedIn === val ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground"}`}>
                      <RadioGroupItem id={`perf-${val}`} value={val} />
                      {label}
                    </Label>
                  ))}
                </RadioGroup>
              )}
              <p className="text-xs text-muted-foreground">{r5.send.whereHelper}</p>
            </fieldset>

            {/* ST-06, ST-07: setting derived from the placement; chosen only when several; full list when none */}
            {state.performedIn === "clinical" ? (
              <div className="flex flex-col gap-1.5">
                {opts.settingMode === "inferred" && opts.settings[0] ? (
                  <>
                    <p className="text-sm font-medium text-foreground">Clinical setting</p>
                    <p id="setting-inferred" className="text-sm text-foreground">
                      {sendCopy.single(db.clinicalSettings.find((s) => s.id === opts.settings[0].settingId)?.name ?? "", db.locations.find((l) => l.id === opts.settings[0].locationId)?.name ?? "")}
                    </p>
                  </>
                ) : (
                  <>
                    <Label htmlFor="setting-select" className="text-sm font-medium">
                      {r5.send.setting} <span aria-hidden="true">*</span>
                    </Label>
                    <Select value={state.settingKey} onValueChange={(k) => dispatch({ type: "setting", key: k })}>
                      <SelectTrigger id="setting-select" className="min-h-11 w-full" aria-required="true" aria-describedby="setting-help">
                        <SelectValue placeholder="Choose where this happened" />
                      </SelectTrigger>
                      <SelectContent>
                        {opts.settings.map((c) => {
                          const sName = db.clinicalSettings.find((s) => s.id === c.settingId)?.name ?? c.settingId
                          const lName = c.locationId ? db.locations.find((l) => l.id === c.locationId)?.name : null
                          return (
                            <SelectItem key={settingKey(c.settingId, c.locationId)} value={settingKey(c.settingId, c.locationId)}>
                              {lName ? `${sName} \u2014 ${lName}` : sName}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <p id="setting-help" className="text-xs text-muted-foreground">
                      {opts.settingMode === "full" ? sendCopy.noPlacement : r5.send.settingHelper(placementsCount)}
                    </p>
                  </>
                )}
              </div>
            ) : null}

            {/* ST-08, ST-09: role is constrained by the setting and by what the skills allow. Prototype: role and person side by side. */}
            {!blocked ? (
              <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="role-select" className="text-sm font-medium">
                    {r5.send.sendTo} <span aria-hidden="true">*</span>
                  </Label>
                  <Select value={state.roleId} onValueChange={(r) => dispatch({ type: "role", roleId: r })}>
                    <SelectTrigger id="role-select" className="min-h-11 w-full" aria-required="true" aria-describedby="role-help">
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {opts.roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabel(db, r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p id="role-help" className="text-xs text-muted-foreground">
                    {r5.send.roleHelper(state.performedIn)}
                  </p>
                </div>

                {state.roleId ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="person-select" className="text-sm font-medium">
                      {roleLabel(db, state.roleId)} <span aria-hidden="true">*</span>
                    </Label>
                    <Select
                      value={state.namedOpen ? NAMED : state.personId}
                      onValueChange={(p) => (p === NAMED ? dispatch({ type: "namedOpen", open: true }) : dispatch({ type: "person", personId: p }))}
                    >
                      <SelectTrigger id="person-select" className="min-h-11 w-full" aria-required="true" aria-describedby={persons.length === 0 ? "person-empty" : isLabRole ? "person-help" : undefined}>
                        <SelectValue placeholder={`Choose a ${roleLabel(db, state.roleId).toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {persons.map((p) => (
                          <SelectItem key={p.personId} value={p.personId}>
                            {isLabRole && p.email ? `${p.name} \u2014 ${p.email}` : p.name}
                          </SelectItem>
                        ))}
                        {opts.canNameLabInstructor && isLabRole ? <SelectItem value={NAMED}>{r5.send.notListed}</SelectItem> : null}
                      </SelectContent>
                    </Select>
                    {persons.length === 0 ? (
                      <p id="person-empty" className="text-xs text-muted-foreground">
                        {sendCopy.noPerson(roleLabel(db, state.roleId))}
                      </p>
                    ) : null}
                    {isLabRole ? (
                      <p id="person-help" className="text-xs text-muted-foreground">
                        {r5.send.labHelper}
                        {state.personId && !state.namedOpen ? ` ${r5.send.linkGoesTo(persons.find((x) => x.personId === state.personId)?.email ?? "")}` : state.namedOpen && isEmailOk(state.named.email) ? ` ${r5.send.linkGoesTo(state.named.email.trim())}` : ""}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {opts.canNameLabInstructor && isLabRole && state.namedOpen ? (
                  <fieldset className="flex flex-col gap-3 rounded-md border border-border p-3 sm:col-span-2">
                    <legend className="px-1 text-sm font-medium">{local.evaluatorNotListed}</legend>
                    <p className="text-xs text-muted-foreground">{sendCopy.namedPrompt}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="named-name">{local.lab.name}</Label>
                        <Input id="named-name" className="min-h-11" value={state.named.name} aria-invalid={touched.namedName && v.namedInvalid.name ? true : undefined} onBlur={() => touch("namedName")} onChange={(e) => dispatch({ type: "named", field: "name", value: e.target.value })} />
                        {touched.namedName && v.namedInvalid.name ? <FieldError>{validation.name}</FieldError> : null}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="named-email">{local.lab.email}</Label>
                        <Input id="named-email" type="email" className="min-h-11" value={state.named.email} aria-invalid={touched.namedEmail && v.namedInvalid.email ? true : undefined} onBlur={() => touch("namedEmail")} onChange={(e) => dispatch({ type: "named", field: "email", value: e.target.value })} />
                        {touched.namedEmail && v.namedInvalid.email ? <FieldError>{validation.emailSend}</FieldError> : null}
                      </div>
                    </div>
                    <Button type="button" variant="link" size="sm" className="min-h-11 self-start" onClick={() => dispatch({ type: "namedOpen", open: false })}>
                      {buttons.cancel}
                    </Button>
                  </fieldset>
                ) : null}
              </div>
            ) : null}

            {/* Prototype: SKILLS IN THIS REQUEST, one row per skill with its model badge */}
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">{r5.send.skillsInRequest}</p>
              <ul className="flex flex-col gap-1.5">
                {skills.map((skill) => (
                  <li key={skill.id} className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                    <span className="text-foreground">{skill.name}</span>
                    {isConfigured(skill) ? <Badge variant="outline">{modelNames[skill.model.kind]}</Badge> : null}
                  </li>
                ))}
              </ul>
            </div>

            {/* ST-10..ST-12, SC-13, SC-15 */}
            <div className="flex flex-col gap-4">
              {skills.map((skill) => {
                const d = state.drafts[skill.id]
                const sv = v.skills[skill.id]
                const complete = sv?.complete ?? false
                const headId = `skill-${skill.id}-heading`
                return (
                  <section key={skill.id} aria-labelledby={headId} className="rounded-md border border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
                      <h3 id={headId} className="text-sm font-semibold text-foreground">
                        {skill.name}
                      </h3>
                      <StatusBadge label={complete ? local.details.complete : local.details.incomplete} tone={complete ? "success" : "warning"} icon={complete ? "fa-circle-check" : "fa-circle-exclamation"} size="sm" />
                    </div>
                    <div className="flex flex-col gap-4 p-3">
                      <p className="text-xs text-muted-foreground">{r5.send.detailsTitle}</p>
                      {skill.submissionFields.map((f) => {
                        const key = `${skill.id}.${f.id}`
                        const err = sv?.fieldErrors[f.id]
                        const show = !!touched[key] && !!err
                        const inputId = `f-${key}`
                        const val = d.values[f.id] ?? ""
                        return (
                          <div key={f.id} className="flex flex-col gap-1.5">
                            <Label htmlFor={inputId} className="text-sm">
                              {f.label} {f.required ? <span aria-hidden="true">*</span> : null}
                              {f.required ? <span className="sr-only"> (required)</span> : null}
                            </Label>
                            {f.type === "longText" ? (
                              <Textarea id={inputId} className="min-h-24" value={String(val)} aria-required={f.required || undefined} aria-invalid={show || undefined} aria-describedby={show ? `${inputId}-err` : undefined} onBlur={() => touch(key)} onChange={(e) => dispatch({ type: "value", skillId: skill.id, fieldId: f.id, value: e.target.value })} />
                            ) : f.type === "choice" && f.options ? (
                              <Select value={String(val)} onValueChange={(x) => { dispatch({ type: "value", skillId: skill.id, fieldId: f.id, value: x }); touch(key) }}>
                                <SelectTrigger id={inputId} className="min-h-11 w-full" aria-required={f.required || undefined}>
                                  <SelectValue placeholder="Choose an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {f.options.map((o) => (
                                    <SelectItem key={o} value={o}>
                                      {o}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={inputId}
                                type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                                inputMode={f.type === "number" ? "decimal" : undefined}
                                className="min-h-11"
                                value={String(val)}
                                aria-required={f.required || undefined}
                                aria-invalid={show || undefined}
                                aria-describedby={show ? `${inputId}-err` : undefined}
                                onBlur={() => touch(key)}
                                onChange={(e) => dispatch({ type: "value", skillId: skill.id, fieldId: f.id, value: f.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value })}
                              />
                            )}
                            {show ? <FieldError id={`${inputId}-err`}>{err === "required" ? validation.required(f.label) : `${f.label} is not valid.`}</FieldError> : null}
                          </div>
                        )
                      })}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`note-${skill.id}`} className="text-sm">
                          {sendCopy.noteLabel}
                        </Label>
                        <Textarea id={`note-${skill.id}`} className="min-h-20" value={d.note} aria-describedby={`note-${skill.id}-help`} onChange={(e) => dispatch({ type: "note", skillId: skill.id, value: e.target.value })} />
                        <p id={`note-${skill.id}-help`} className="text-xs text-muted-foreground">
                          {sendCopy.noteHelper}
                        </p>
                      </div>
                      {skill.selfEvaluation && isConfigured(skill) ? (
                        <div className="flex flex-col gap-2 border-t border-border pt-3">
                          <p className="text-sm font-medium text-foreground">{sendCopy.selfEvalTitle}</p>
                          <p className="text-xs text-muted-foreground">{sendCopy.selfEvalBody}</p>
                          <SelfEvaluationForm idPrefix={`se-${skill.id}`} model={skill.model} value={d.selfEval} onChange={(r) => dispatch({ type: "selfEval", skillId: skill.id, value: r })} errors={!!touched[`se-${skill.id}`] && sv?.selfEvalIncomplete} />
                        </div>
                      ) : null}
                    </div>
                  </section>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">{sendCopy.footer}</p>
          </div>

          <DialogFooter className="mx-0 mb-0 flex flex-col gap-2 rounded-b-xl border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            {reasonText ? (
              <p id="send-reason" className="text-sm text-muted-foreground">
                {reasonText}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button size="default" type="button" variant="outline" className="min-h-11" onClick={() => handleOpenChange(false)}>
                {buttons.cancel}
              </Button>
              <Button size="default" type="button" variant="default" className="min-h-11" disabled={!v.canSend || sending} aria-describedby={reasonText ? "send-reason" : undefined} onClick={send}>
                <i className="fa-light fa-paper-plane" aria-hidden="true" />
                {primary}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{local.discard.title}</AlertDialogTitle>
            <AlertDialogDescription>{local.discard.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>{local.discard.keep}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscard(false)
                onOpenChange(false)
              }}
            >
              {local.discard.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
