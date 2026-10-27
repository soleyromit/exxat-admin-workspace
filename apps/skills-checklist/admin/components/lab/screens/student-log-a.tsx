"use client"

/**
 * Student quick entry (the former Log a skill), variant A: one form per sitting. Off the sidebar since 2026-10-27 (LEDGER D-L10:
 * logging is "Save for later" inside Send for evaluation); kept registered as the one-page alternative of Send. Its own actions are
 * the Send footer contract: Save for later (a draft in My requests, Drafts) and Continue to send (saves the draft and opens Send
 * with it, so nothing is typed twice).
 * Tests: does one form per sitting (skills, where, details, self-rating only where switched on), saved to the device first, with a
 * single next step "Send for evaluation", get a skill logged in under a minute and stop the v2 split between Log and Requests?
 * Save writes the sitting to the shared store (lib/lab/logged.ts); it waits in My requests, "Not sent yet", until it is sent or
 * deleted (Romit 2026-10-27: "where can I see the list of skills logged?").
 * Regions (form budget 5): header · what you did (picker) · where, when and your note · questions the program configured, with the
 * self-evaluation beside them only when on (Thursday flow S2) · this entry.
 * Clinical, lab and simulation entries all go on to Send (lab and simulation to a lab instructor or faculty, REQ ST-05, EV-02).
 * Inactive skills are not offered (SL-11). The note is the one note the request carries (ST-12).
 * [REQ ST-02, ST-04..ST-07, ST-10..ST-12, SC-13, SC-15, SL-11; COMP rec 9: device first, nothing lost]
 */
import * as React from "react"
import { LabLink as Link, useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { DetailsFields, EvaluatorChecks, NoteField, SelectedSkills, SelfEvalCards, SkillPicker, WhereField, selfEvalIssues, type SelfAnswers } from "@/components/lab/student2/log-parts"
import { SectionTitle } from "@/components/lab/student/parts"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { skillById } from "@/lib/v2/evidence-index"
import { aNoun, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { shortDate } from "@/lib/lab/student"
import { activeV2Store, updateActiveV2Store } from "@/lib/v2/react"
import { saveLogged } from "@/lib/lab/logged"
import { detailErrors, locationError, locationFor, loggedHandoff, noteError, pickRows, selfEvalEnabled, student2Href, whereChoices, type DetailValues } from "@/lib/lab/student2"
import { loggedSitting } from "@/lib/lab/logged"

export function StudentLogA() {
  return (
    <Student2Frame
      title={`Log ${aNoun()}`}
      empty={(c) => <EmptyBlock title={`No ${skillNounPlural()} open yet`} body={`Your program has not set up ${skillNounPlural()} to send. Check back once it has.`} action={{ label: "Back to My progress", href: student2Href("home", {}, c.studentId) }} />}
      loading={<FormSkeleton />}
    >
      {(ctx) => <LogForm ctx={ctx} />}
    </Student2Frame>
  )
}

export function FormSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-12" aria-hidden="true">
      <div className="flex flex-col gap-5 lg:col-span-8">
        <Skeleton className="h-80" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="h-56 lg:col-span-4" />
    </div>
  )
}

const unitOf = (location: string | null) => (location && location.includes(",") ? location.split(",").slice(1).join(",").trim() : "")

function LogForm({ ctx }: { ctx: Student2Ctx }) {
  const { state: s, model: m, studentId, offline, param } = ctx
  const rows = React.useMemo(() => pickRows(s, m), [s, m])
  const where = React.useMemo(() => whereChoices(s, studentId), [s, studentId])
  const [skills, setSkills] = React.useState<string[]>(() => (param("skill") ?? "").split(",").filter((id) => rows.some((r) => r.id === id)))
  const [whereVal, setWhere] = React.useState(where[0]?.value ?? "")
  const chosen = where.find((w) => w.value === whereVal)
  const [details, setDetails] = React.useState<DetailValues>(() => ({ date: DEMO_TODAY, unit: unitOf(where[0]?.location ?? null), case: "" }))
  const [ratings, setRatings] = React.useState<Record<string, string>>({})
  const [answers, setAnswers] = React.useState<SelfAnswers>({})
  const [location, setLocation] = React.useState("")
  const [note, setNote] = React.useState("")
  const [tried, setTried] = React.useState(false)
  const [saved, setSaved] = React.useState<{ ids: string[]; batchId: string | null } | null>(null)

  const toggle = (id: string) => {
    setSaved(null)
    setSkills((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]))
  }
  const onWhere = (v: string) => {
    setWhere(v)
    const w = where.find((x) => x.value === v)
    if (w?.location) setDetails((d) => ({ ...d, unit: unitOf(w.location) || d.unit }))
  }
  const errors = detailErrors(details)
  const locError = locationError(chosen, location)
  const nError = noteError(note)
  const selfIds = skills.filter((id) => selfEvalEnabled(skillById(s, id)))
  const skillError = skills.length === 0 ? `Pick at least one ${skillNoun()}.` : null
  const router = useLabRouter()
  const save = (thenSend = false) => {
    setTried(true)
    if (skillError || Object.keys(errors).length > 0 || !chosen || locError || nError) return
    // Kept in the shared store, so it is still there after a reload and has one home: My requests, "Not sent yet".
    let batchId: string | null = null
    updateActiveV2Store((st) => {
      const r = saveLogged(st, { skillIds: skills, where: whereVal, setting: chosen.setting, clinicalSetting: chosen.clinicalSetting, location: locationFor(chosen, location), date: details.date, unit: details.unit, case: details.case, note, ratings: Object.fromEntries(selfIds.filter((id) => ratings[id]).map((id) => [id, ratings[id]])), answers: Object.fromEntries(selfIds.filter((id) => answers[id]?.length).map((id) => [id, answers[id]])) }, studentId)
      batchId = r.batchId
      return r.state
    })
    setSaved({ ids: skills, batchId })
    if (thenSend && batchId) {
      const st = loggedSitting(activeV2Store()?.getSnapshot() ?? s, studentId, batchId)
      if (st) router.push(student2Href("request-signoff", loggedHandoff(st), studentId))
    }
  }
  const reset = () => {
    setSkills([])
    setRatings({})
    setNote("")
    setSaved(null)
    setTried(false)
  }
  // One sitting is one request: Send opens with the saved sitting (skills, place, details, note), so nothing is typed twice, and
  // marks it sent once it goes.
  const stored = saved ? loggedSitting(s, studentId, saved.batchId) : null
  const sendHref = stored ? student2Href("request-signoff", loggedHandoff(stored), studentId) : ""
  const requestsHref = student2Href("my-requests", { show: "drafts" }, studentId)

  return (
    <form className="grid gap-5 lg:grid-cols-12" noValidate onSubmit={(e) => { e.preventDefault(); save(true) }} data-student-lab="log-A">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
        <Card className="gap-0 py-0" data-region="what">
          <CardContent className="flex flex-col gap-3 py-4">
            <SectionTitle id="what-h" count={skills.length || undefined}>What you did</SectionTitle>
            <SelectedSkills s={s} ids={skills} onRemove={toggle} />
            <SkillPicker rows={rows} selected={skills} onToggle={toggle} />
            {tried && skillError ? <FieldError>{skillError}</FieldError> : null}
          </CardContent>
        </Card>
        <Card className="gap-0 py-0" data-region="where">
          <CardContent className="flex flex-col gap-4 py-4">
            <WhereField choices={where} value={whereVal} onChange={onWhere} location={location} onLocation={setLocation} locationError={locError} showErrors={tried} />
            <DetailsFields values={details} onChange={(id, v) => setDetails((d) => ({ ...d, [id]: v }))} errors={errors} showErrors={tried} />
            <NoteField value={note} onChange={setNote} error={tried ? nError : null} />
          </CardContent>
        </Card>
        {/* The evaluator's own criteria: answered for yourself where the skill asks for a self-evaluation [REQ ST-11, SC-15], else read
            behind "What the evaluator checks" (Thursday S2; no separate questions region). */}
        {skills.length > 0 ? (
          <div className="flex flex-col gap-3" data-region="self">
            {selfIds.length > 0 ? <SelfEvalCards s={s} ids={selfIds} ratings={ratings} answers={answers} onRating={(id, v) => setRatings((r) => ({ ...r, [id]: v }))} onAnswer={(id, i, v) => setAnswers((a) => { const row = [...(a[id] ?? [])]; row[i] = v; return { ...a, [id]: row } })} /> : null}
            {skills.filter((id) => !selfIds.includes(id)).map((id) => <EvaluatorChecks key={id} s={s} id={id} />)}
          </div>
        ) : null}
      </div>
      <div className="lg:col-span-4">
        <Card className="gap-0 py-0 lg:sticky lg:top-4" data-region="save">
          <CardContent className="flex flex-col gap-3 py-4">
            <SectionTitle>This entry</SectionTitle>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">{skills.length === 1 ? skillNoun().replace(/^./, (c) => c.toUpperCase()) : skillNounPlural().replace(/^./, (c) => c.toUpperCase())}</dt>
              <dd className="text-foreground">{skills.length ? countSkills(skills.length) : "None yet"}</dd>
              <dt className="text-muted-foreground">Where</dt>
              <dd className="truncate text-foreground">{chosen?.label ?? "Not chosen"}</dd>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="text-foreground">{details.date ? shortDate(details.date) : "Not set"}</dd>
              {selfIds.length > 0 ? (
                <>
                  <dt className="text-muted-foreground">Self-evaluation</dt>
                  <dd className="text-foreground">{`${selfIds.filter((id) => selfEvalIssues(s, [id], ratings, answers).length === 0).length} of ${selfIds.length} done`}</dd>
                </>
              ) : null}
            </dl>
            {saved ? (
              <div className="flex flex-col gap-3">
                <LocalBanner variant="success" title="Saved for later">
                  {offline ? "Find it in My requests, Drafts. It syncs when you reconnect." : "Find it in My requests, Drafts. Nothing counts until you send it."}
                </LocalBanner>
                {sendHref ? (
                  <Button asChild variant="default" size="default" className="w-full max-sm:h-11">
                    <Link href={sendHref}>Continue to send</Link>
                  </Button>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button asChild variant="link" size="sm" className="h-auto px-0">
                    <Link href={requestsHref}>View in Drafts</Link>
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={reset}>Start another</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button type="submit" variant="default" size="default" className="w-full sm:flex-1 max-sm:h-11">Continue to send</Button>
                <Button type="button" variant="outline" size="default" className="w-full sm:flex-1 max-sm:h-11" onClick={() => save(false)}>Save for later</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
