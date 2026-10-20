"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { StudentPage } from "@/components/v2/student/student-frame"
import { SyncChip } from "@/components/v2/student/sync-chip"
import { Announce, TOUCH, useStudentRun, useStudentUpdate, BTN } from "@/components/v2/student/use-student"
import { useV2State } from "@/lib/v2/react"
import { courseWork, logSkills, STUDENT_ID, openToLog, prerequisiteStatus, ratingKind, ratingOptions, saveLogDraft, STATUS_LABEL, whereOptions, type CourseItem } from "@/lib/v2/student"
import { syncStateOf } from "@/lib/v2/sync"
import type { LogDraft, Skill, V2State } from "@/lib/v2/types"

const STEP_NAME = ["Pick skills", "Where did you do it?", "Rate yourself", "Review and save"] as const
const NOTE_MAX = 500

const emptyDraft = (where: string): LogDraft => ({ step: 1, skillIds: [], where, location: "", ratings: {}, answers: {}, notes: {} })

interface Row {
  skill: Skill
  group: "Mandatory" | "Optional" | "Other skills"
  line: string
  disabled: string | null
  clinicalLocked: string | null
}

/** Rows for the picker: mapped skills first, then other published skills (a skill need not be mapped to be logged, ST-02, CM-05). */
function pickerRows(s: V2State): Row[] {
  const w = courseWork(s)
  const row = (i: CourseItem, group: Row["group"]): Row => ({
    skill: i.skill,
    group,
    line: `${STATUS_LABEL[i.status]}. ${i.progress.summary}.`,
    disabled: null,
    clinicalLocked: i.prereq.met ? null : (i.prereq.items.find((x) => !x.met)?.todo ?? "A prerequisite is missing."),
  })
  const mapped = new Set([...w.mandatory, ...w.optional, ...w.notExpected].map((i) => i.skill.id))
  const rows: Row[] = [...w.mandatory.map((i) => row(i, "Mandatory")), ...w.optional.map((i) => row(i, "Optional")), ...w.notExpected.map((i) => row(i, "Other skills"))]
  for (const n of w.notOpen) rows.push({ skill: n.skill, group: n.level === "mandatory" ? "Mandatory" : "Optional", line: "", disabled: n.reason, clinicalLocked: null })
  const other = s.skills.filter((k) => k.specialty === "bsn-med-surg" && openToLog(k) && !s.mappings.some((m) => m.courseId === s.course.id && m.skillId === k.id) && !mapped.has(k.id))
  for (const k of other) rows.push({ skill: k, group: "Other skills", line: "Not mapped to this course. Evidence still counts toward your record.", disabled: null, clinicalLocked: prerequisiteStatus(s, STUDENT_ID, k).met ? null : "A prerequisite is missing." })
  return rows
}

/** Scenario step 5: log skills in four short steps. The draft is saved in the store on every edit. */
export function LogFlow() {
  const s = useV2State()
  const params = useSearchParams()
  const update = useStudentUpdate()
  const run = useStudentRun()
  const options = React.useMemo(() => whereOptions(s), [s])
  const rows = React.useMemo(() => pickerRows(s), [s])
  const draft: LogDraft = s.logDraft ?? emptyDraft(options[0]?.value ?? "lab")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState<string[] | null>(null)
  const [status, setStatus] = React.useState("")
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  const mounted = React.useRef(false)

  const patch = React.useCallback((p: Partial<LogDraft>) => update((st) => saveLogDraft(st, { ...(st.logDraft ?? emptyDraft(whereOptions(st)[0]?.value ?? "lab")), ...p })), [update])

  // Arriving from a skill card preselects that skill once.
  const preselect = params?.get("skill") ?? null
  const handled = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!preselect || handled.current === preselect) return
    handled.current = preselect
    update((st) => {
      const cur = st.logDraft ?? emptyDraft(whereOptions(st)[0]?.value ?? "lab")
      return saveLogDraft(st, { ...cur, step: 1, skillIds: cur.skillIds.includes(preselect) ? cur.skillIds : [...cur.skillIds, preselect] })
    })
  }, [preselect, update])

  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    headingRef.current?.focus()
  }, [draft.step, saved])

  const picked = draft.skillIds.map((id) => s.skills.find((k) => k.id === id)).filter((k): k is Skill => !!k)
  const where = options.find((o) => o.value === draft.where) ?? options[0]
  const clinical = where?.setting === "clinical"
  const locked = clinical ? picked.map((k) => ({ k, pre: prerequisiteStatus(s, STUDENT_ID, k) })).filter((x) => !x.pre.met) : []

  const go = (step: LogDraft["step"]) => {
    setErrors({})
    patch({ step })
  }

  const next1 = () => {
    if (picked.length === 0) return setErrors({ pick: "Pick at least one skill to log." })
    go(2)
  }
  const next2 = () => {
    if (locked.length) return setErrors({ where: "Remove the locked skill or log it as practice before you continue." })
    if (where?.askLocation && !draft.location.trim()) return setErrors({ location: "Enter the location, for example the unit or clinic name." })
    go(3)
  }
  const next3 = () => {
    const e: Record<string, string> = {}
    for (const k of picked) {
      const kind = ratingKind(k)
      if ((kind === "levels" || kind === "outcome") && !draft.ratings[k.id]) e[k.id] = `Rate yourself on ${k.name}, or remove it from this log.`
      if (kind === "questions") {
        const a = draft.answers[k.id] ?? []
        if (a.length !== (k.config?.questions.length ?? 0) || a.some((x) => x === null || x === undefined)) e[k.id] = `Answer every question for ${k.name}, or remove it from this log.`
      }
      if ((draft.notes[k.id] ?? "").length > NOTE_MAX) e[`note-${k.id}`] = `Keep the note under ${NOTE_MAX} characters.`
    }
    setErrors(e)
    if (Object.keys(e).length === 0) go(4)
  }

  const save = () => {
    if (!where) return
    setSaveError(null)
    const r = run((st, at) =>
      logSkills(
        st,
        {
          skillIds: draft.skillIds,
          setting: where.setting,
          clinicalSetting: where.clinicalSetting,
          location: where.location ?? (draft.location.trim() || null),
          ratings: draft.ratings,
          answers: draft.answers,
          notes: draft.notes,
        },
        at,
      ),
    )
    if (!r.ok) return setSaveError(r.error)
    setSaved(r.entryIds)
    setStatus(`${r.entryIds.length} ${r.entryIds.length === 1 ? "entry" : "entries"} saved on this phone.`)
  }

  if (saved) return <Saved ids={saved} status={status} onAgain={() => setSaved(null)} headingRef={headingRef} />

  return (
    <StudentPage title="Log skills" subtitle="Saved on this phone as you go, so nothing is lost if the signal drops.">
      <Announce message={`Step ${draft.step} of 4, ${STEP_NAME[draft.step - 1]}`} />
      <p className="text-sm text-muted-foreground" data-step={draft.step}>{`Step ${draft.step} of 4`}</p>
      <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {STEP_NAME[draft.step - 1]}
      </h2>
      {saveError ? (
        <LocalBanner variant="error" title="Not saved">
          {saveError}
        </LocalBanner>
      ) : null}

      {draft.step === 1 ? (
        <StepPick rows={rows} draft={draft} error={errors.pick} onToggle={(id, on) => { setErrors({}); patch({ skillIds: on ? [...draft.skillIds, id] : draft.skillIds.filter((x) => x !== id) }) }} onNext={next1} />
      ) : null}

      {draft.step === 2 && where ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Where did you do it?</legend>
          <p className="text-sm text-muted-foreground">{options.some((o) => o.value.startsWith("placement:")) ? `From your ${options.filter((o) => o.value.startsWith("placement:")).length} ${options.filter((o) => o.value.startsWith("placement:")).length === 1 ? "placement" : "placements"} for ${s.course.code}. Change it if this was somewhere else.` : "No placement is on record, so every setting in the program is offered."}</p>
          <RadioGroup aria-label="Where you did it" value={where.value} onValueChange={(v) => { setErrors({}); patch({ where: v }) }} className="flex flex-col gap-2">
            {options.map((o) => (
              <Label key={o.value} htmlFor={`where-${o.value}`} className={`${TOUCH} flex items-start gap-3 rounded-lg border border-border bg-card p-3 font-normal`}>
                <RadioGroupItem id={`where-${o.value}`} value={o.value} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{o.label}</span>
                  <span className="text-xs text-muted-foreground">{o.description}</span>
                </span>
              </Label>
            ))}
          </RadioGroup>
          {where.askLocation || where.setting !== "clinical" ? (
            <Field>
              <FieldLabel htmlFor="log-location">{where.askLocation ? "Location" : "Location (optional)"}</FieldLabel>
              <Input id="log-location" className={TOUCH} value={draft.location} aria-invalid={errors.location ? true : undefined} aria-describedby={errors.location ? "log-location-error" : undefined} onChange={(e) => patch({ location: e.target.value })} />
              {errors.location ? <FieldError id="log-location-error" errors={[{ message: errors.location }]} /> : null}
            </Field>
          ) : null}
          {where.setting !== "clinical" ? <p className="text-xs text-muted-foreground">Lab and simulation never count toward a clinical setting minimum.</p> : null}
          {locked.length > 0 ? (
            <LocalBanner variant="warning" title="Some skills are locked for a clinical attempt" data-prereq-block>
              <ul className="mt-1 flex flex-col gap-3">
                {locked.map(({ k, pre }) => (
                  <li key={k.id} className="flex flex-col gap-1">
                    <span className="font-medium">{`${k.name} cannot be logged in a clinical setting yet.`}</span>
                    {pre.items.filter((i) => !i.met).map((i) => (
                      <span key={i.id}>{i.todo}</span>
                    ))}
                    <span>
                      <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => patch({ skillIds: draft.skillIds.filter((x) => x !== k.id) })}>
                        {`Remove ${k.name} from this log`}
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="outline" size="lg" className={`${BTN} mt-3`} onClick={() => patch({ where: "lab" })}>
                Log as lab practice instead
              </Button>
            </LocalBanner>
          ) : null}
          {errors.where ? <FieldError errors={[{ message: errors.where }]} /> : null}
          <Nav back={() => go(1)} next={next2} nextLabel="Continue to rating" disabled={locked.length > 0} />
        </fieldset>
      ) : null}

      {draft.step === 3 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Rate yourself on each skill. The evaluator sees this as context for their own assessment.</p>
          {picked.map((k) => (
            <RateCard key={k.id} skill={k} draft={draft} errors={errors} patch={patch} />
          ))}
          <Nav back={() => go(2)} next={next3} nextLabel="Review" />
        </div>
      ) : null}

      {draft.step === 4 && where ? (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {picked.map((k) => {
              const kind = ratingKind(k)
              const a = draft.answers[k.id] ?? []
              return (
                <li key={k.id}>
                  <Card size="sm" role="group" aria-label={k.name}>
                    <CardHeader>
                      <CardTitle asChild className="text-base">
                        <h3>{k.name}</h3>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                        <dt className="text-muted-foreground">Setting</dt>
                        <dd>{where.setting === "clinical" ? `Clinical, ${where.clinicalSetting}` : where.label}</dd>
                        <dt className="text-muted-foreground">Location</dt>
                        <dd>{where.location ?? (draft.location.trim() || "Not given")}</dd>
                        <dt className="text-muted-foreground">Your rating</dt>
                        <dd>{kind === "questions" ? `${a.filter((x) => x === "yes").length} of ${a.length} answered yes` : kind === "none" ? "Not asked for this skill" : draft.ratings[k.id]}</dd>
                        <dt className="text-muted-foreground">Note</dt>
                        <dd>{draft.notes[k.id]?.trim() || "None"}</dd>
                      </dl>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
          <p className="text-sm text-muted-foreground">It is saved on this phone first and sends when you are online and signed in.</p>
          <Nav back={() => go(3)} next={save} nextLabel={`Save ${picked.length} ${picked.length === 1 ? "entry" : "entries"}`} />
        </div>
      ) : null}
    </StudentPage>
  )
}

function Nav({ back, next, nextLabel, disabled }: { back?: () => void; next: () => void; nextLabel: string; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <Button type="button" variant="default" size="lg" className={`${BTN} w-full`} disabled={disabled} onClick={next}>
        {nextLabel}
      </Button>
      {back ? (
        <Button type="button" variant="outline" size="lg" className={`${BTN} w-full`} onClick={back}>
          Back
        </Button>
      ) : null}
    </div>
  )
}

function StepPick({ rows, draft, error, onToggle, onNext }: { rows: Row[]; draft: LogDraft; error?: string; onToggle: (id: string, on: boolean) => void; onNext: () => void }) {
  const groups: Array<Row["group"]> = ["Mandatory", "Optional", "Other skills"]
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Pick one or more skills you performed. You can log several together.</p>
      {groups.map((g) => {
        const list = rows.filter((r) => r.group === g)
        if (!list.length) return null
        return (
          <fieldset key={g} className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-foreground">{g}</legend>
            {list.map((r) => {
              const id = `pick-${r.skill.id}`
              const on = draft.skillIds.includes(r.skill.id)
              return (
                <Label key={r.skill.id} htmlFor={id} className={`${TOUCH} flex items-start gap-3 rounded-lg border border-border bg-card p-3 font-normal`}>
                  <Checkbox id={id} checked={on} disabled={!!r.disabled} aria-describedby={`${id}-d`} onCheckedChange={(v) => onToggle(r.skill.id, v === true)} className="mt-0.5" />
                  <span className="flex flex-1 flex-col items-start gap-0.5 text-start">
                    <span className="text-sm font-medium text-foreground">{r.skill.name}</span>
                    <span id={`${id}-d`} className="text-xs text-muted-foreground">
                      {r.disabled ?? r.line}
                    </span>
                    {r.clinicalLocked ? <Badge variant="outline">Locked for clinical, practice is open</Badge> : null}
                  </span>
                </Label>
              )
            })}
          </fieldset>
        )
      })}
      {error ? <FieldError errors={[{ message: error }]} /> : null}
      <p className="text-sm text-foreground" aria-live="polite" data-picked-count>
        {`${draft.skillIds.length} ${draft.skillIds.length === 1 ? "skill" : "skills"} picked`}
      </p>
      <Nav next={onNext} nextLabel="Continue to setting" />
    </div>
  )
}

function RateCard({ skill, draft, errors, patch }: { skill: Skill; draft: LogDraft; errors: Record<string, string>; patch: (p: Partial<LogDraft>) => void }) {
  const kind = ratingKind(skill)
  const opts = ratingOptions(skill)
  const questions = skill.config?.questions ?? []
  const answers = draft.answers[skill.id] ?? new Array<"yes" | "no" | null>(questions.length).fill(null)
  const note = draft.notes[skill.id] ?? ""
  const errId = `rate-${skill.id}-error`
  return (
    <Card size="sm" role="group" aria-label={skill.name}>
      <CardHeader>
        <CardTitle asChild className="text-base">
          <h3>{skill.name}</h3>
        </CardTitle>
        {kind === "levels" ? <CardDescription>{`Levels run from lowest to highest, as your program names them.`}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {kind === "levels" || kind === "outcome" ? (
          <RadioGroup aria-label={`Your rating for ${skill.name}`} aria-describedby={errors[skill.id] ? errId : undefined} value={draft.ratings[skill.id] ?? ""} onValueChange={(v) => patch({ ratings: { ...draft.ratings, [skill.id]: v } })} className="flex flex-col gap-2">
            {opts.map((o) => (
              <Label key={o} htmlFor={`rate-${skill.id}-${o}`} className={`${TOUCH} flex items-center gap-3 rounded-lg border border-border bg-card px-3 font-normal`}>
                <RadioGroupItem id={`rate-${skill.id}-${o}`} value={o} />
                <span className="text-sm text-foreground">{o}</span>
              </Label>
            ))}
          </RadioGroup>
        ) : null}
        {kind === "questions" ? (
          <div className="flex flex-col gap-3" aria-describedby={errors[skill.id] ? errId : undefined}>
            {questions.map((q, i) => (
              <fieldset key={i} className="flex flex-col gap-1">
                <legend className="text-sm text-foreground">{q}</legend>
                <RadioGroup aria-label={`${q} for ${skill.name}`} value={answers[i] ?? ""} onValueChange={(v) => { const a = [...answers]; a[i] = v as "yes" | "no"; patch({ answers: { ...draft.answers, [skill.id]: a } }) }} className="grid grid-cols-2 gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <Label key={v} htmlFor={`rate-${skill.id}-${i}-${v}`} className={`${TOUCH} flex items-center gap-3 rounded-lg border border-border bg-card px-3 font-normal`}>
                      <RadioGroupItem id={`rate-${skill.id}-${i}-${v}`} value={v} />
                      <span className="text-sm text-foreground">{v === "yes" ? "Yes" : "No"}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>
            ))}
          </div>
        ) : null}
        {kind === "none" ? <p className="text-sm text-muted-foreground">Your evaluator scores this skill. You are not asked to rate yourself.</p> : null}
        {errors[skill.id] ? <FieldError id={errId} errors={[{ message: errors[skill.id] }]} /> : null}
        <Field>
          <FieldLabel htmlFor={`note-${skill.id}`}>{`Note on ${skill.name} (optional)`}</FieldLabel>
          <Textarea id={`note-${skill.id}`} rows={3} value={note} aria-describedby={`note-${skill.id}-count`} onChange={(e) => patch({ notes: { ...draft.notes, [skill.id]: e.target.value } })} />
          <FieldDescription id={`note-${skill.id}-count`}>{`${note.length} of ${NOTE_MAX} characters. One note per skill, kept apart from the evaluator's comment.`}</FieldDescription>
          {errors[`note-${skill.id}`] ? <FieldError errors={[{ message: errors[`note-${skill.id}`] }]} /> : null}
        </Field>
      </CardContent>
    </Card>
  )
}

function Saved({ ids, status, onAgain, headingRef }: { ids: string[]; status: string; onAgain: () => void; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const s = useV2State()
  const entries = ids.map((id) => s.logEntries.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e)
  const clinicalIds = entries.filter((e) => e.setting === "clinical").map((e) => e.id)
  return (
    <StudentPage title="Log skills" subtitle="Saved on this phone first.">
      <Announce message={status} />
      <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none" data-saved>
        {`${entries.length} ${entries.length === 1 ? "entry" : "entries"} saved`}
      </h2>
      <ul className="flex flex-col gap-2">
        {entries.map((e) => {
          const k = s.skills.find((x) => x.id === e.skillId)
          return (
            <li key={e.id}>
              <Card size="sm">
                <CardContent className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-foreground">{k?.name}</span>
                    <span className="text-xs text-muted-foreground">{e.setting === "clinical" ? `Clinical, ${e.clinicalSetting}, ${e.location}` : `${e.setting === "lab" ? "Lab" : "Simulation"} practice trial`}</span>
                  </span>
                  <SyncChip state={syncStateOf(s, { entryId: e.id })} />
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>
      <div className="flex flex-col gap-2">
        {clinicalIds.length > 0 ? (
          <Button asChild variant="default" size="lg" className={`${BTN} w-full`}>
            <Link href={`/v2/student/request-signoff?entries=${clinicalIds.join(",")}`}>Ask for sign-off</Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Practice trials are not sent for sign-off. They count toward your prerequisites.</p>
        )}
        <Button type="button" variant="outline" size="lg" className={`${BTN} w-full`} onClick={onAgain}>
          Log more skills
        </Button>
        <Button asChild variant="outline" size="lg" className={`${BTN} w-full`}>
          <Link href="/v2/student">Back to what&apos;s left</Link>
        </Button>
      </div>
    </StudentPage>
  )
}
