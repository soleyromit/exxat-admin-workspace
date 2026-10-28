"use client"

/**
 * Student Send for evaluation, variant C: course first (Sankalp's fulfillment happy path, Thursday list S2, 2026-10-27).
 * Tests: does starting from the course (its mandatory skills first), then reading the questions the program configured, rating
 * yourself only where the program asks, and choosing who signs (preceptor or faculty for clinical work, lab instructor or faculty
 * for lab and simulation) get a student to a correct request with no guesswork?
 * One job per page; the page title is the step, and the confirmation keeps the step's title ("Send for evaluation") with the result
 * card saying "Sent to {name}". Steps: Course · Skills · Self-evaluation (only when a chosen skill asks for it) · Send. There is no
 * separate Questions step (Romit 2026-10-27: "Do we need this, since the student isn't entering anything?"): the evaluator's
 * questions are read on the Skills step ("What the evaluator checks", per chosen skill) or, when the skill asks for a
 * self-evaluation, answered on the Self-evaluation step, one card per skill on the evaluator's own criteria [REQ ST-11].
 * Full width (D-L5): from 1280 px "Your request" sits beside every step (what you picked, who, how, what the evaluator will see),
 * so the page has no empty half; below 1280 the footer carries the same summary in one line. ?course=<id> opens straight on the
 * course's skills. Method starts on "Email a link" (one link per request, D-L2). Same draft, checks and confirmation as A and B.
 * Footer (D-L10): Back on the left; Save for later (outline, from the skills step on) and the one primary on the right. Save for
 * later keeps the request in My requests, Drafts, with its course and step, so Continue reopens it here, prefilled.
 * [REQ ST-01, ST-02, ST-04..ST-13, SL-11, EV-02, EV-03, SC-15; hard stops: lab evidence never meets a clinical-setting minimum,
 * evaluators have no login]
 */
import { CheckoffDone } from "@/components/lab/student/checkoff"
import * as React from "react"
import { TYPE } from "@/components/lab/type-scale"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FieldError, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { WizardPanel, type WizardStep } from "@exxatdesignux/ui/components/ui/wizard"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { WizardPage } from "@/components/lab/layout/wizard-page"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { ValidationSummary, type ValidationIssue } from "@/components/lab/layout/validation-summary"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { useStudentPage } from "@/components/lab/student/use-student"
import { StateLabel } from "@/components/lab/student/parts"
import { Unit } from "@/components/lab/student/dashboard"
import { EvaluatorChecks, EvaluatorPicker, MethodTiles, SelfEvalCards, TOUCH_ROW } from "@/components/lab/student2/log-parts"
import { DetailsAndNote, PhotoField, RequestResult, SavedForLater, SendIssues, WherePick, scopeSentence, useRequestDraft, type RequestDraft } from "@/components/lab/student2/request-parts"
import type { Student2Ctx } from "@/components/lab/student2/frame"
import { MAPPING_LEVEL_LABEL } from "@/lib/v2/labels"
import { skillById } from "@/lib/v2/evidence-index"
import { aNoun, capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { methodById } from "@/lib/lab/student2"
import { courseLevels, type CourseExpectation, type SkillRecord, type StudentModel } from "@/lib/lab/student"

type StepId = "course" | "skills" | "self" | "send"

export function StudentRequestC() {
  const page = useStudentPage()
  if (!page.model) {
    return (
      <div className="flex flex-col gap-4 p-6" aria-hidden="true">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64" />
      </div>
    )
  }
  const ctx: Student2Ctx = { state: page.state, model: page.model, studentId: page.studentId, demo: null, offline: page.param("state") === "offline", param: page.param, setParams: page.setParams }
  return <CourseFirst ctx={ctx} />
}

function CourseFirst({ ctx }: { ctx: Student2Ctx }) {
  const m = ctx.model
  const d = useRequestDraft(ctx)
  const courses = React.useMemo(() => m.courses.filter((c) => c.skills.length > 0).sort((a, b) => b.mandatory - a.mandatory || a.code.localeCompare(b.code)), [m])
  const courseId = ctx.param("course")
  const course = courses.find((c) => c.id === courseId) ?? null
  const selfIds = d.selfIds
  const [issues, setIssues] = React.useState<ValidationIssue[]>([])

  // The self-rating step exists only when a chosen skill asks for one [REQ SC-15, ST-11].
  const order: StepId[] = ["course", "skills", ...(selfIds.length ? (["self"] as StepId[]) : []), "send"]
  const asked = ctx.param("step") as StepId | null
  const step: StepId = asked && order.includes(asked) ? asked : course ? "skills" : "course"
  const index = order.indexOf(step)
  const LABEL: Record<StepId, string> = { course: "Course", skills: capitalize(skillNounPlural()), self: "Self-evaluation", send: "Send" }
  // Romit 2026-10-27 ("I still can't find a place to log a skill"): the flow is Log a skill; its last step is Send for evaluation.
  // The step names live in the stepper (Course, Skills, Self-evaluation, Send).
  const TITLE: Record<StepId, string> = { course: `Log ${aNoun()}`, skills: `Log ${aNoun()}`, self: `Log ${aNoun()}`, send: "Send for evaluation" }
  const steps: WizardStep[] = order.map((id) => ({ id: `fulfil-${id}`, label: LABEL[id] }))

  const go = (to: StepId, extra: Record<string, string | null> = {}) => {
    setIssues([])
    ctx.setParams({ step: to, ...extra })
  }
  // Where defaults to the student's placement for that course [REQ ST-06]: the current one first, else the latest.
  const placeFor = (id: string) => {
    const p = m.placements.find((x) => x.courseId === id && x.status === "current") ?? m.placements.find((x) => x.courseId === id)
    const w = p ? d.where.find((x) => x.setting === "clinical" && x.location === p.location) : undefined
    if (w) d.setWhere(w.value)
  }
  const pickCourse = (id: string, stay = true) => {
    const c = courses.find((x) => x.id === id)
    if (!c) return
    // Entering a course starts from its mandatory skills not yet achieved and not already waiting [Thursday flow S2].
    d.setSkills(courseLevels(m, c).mandatory.filter((r) => r.state !== "achieved" && !r.waiting).map((r) => r.id))
    placeFor(id)
    // Choosing a course on the course page is an answer, not a move: Continue moves on (one job per page).
    ctx.setParams(stay ? { course: id, step: "course" } : { course: id })
  }
  // Arriving from My progress or a course link (?course=): preselect once, the same way.
  // A link that already names the skills (?skills=, a reload mid-flow) keeps them; with no course yet, nothing is chosen.
  const seeded = React.useRef(false)
  React.useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    if (ctx.param("skills")) {
      if (course && !ctx.param("where")) placeFor(course.id)
      return
    }
    if (course) pickCourse(course.id, false)
    else d.setSkills([])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    if (step === "course") {
      if (!course) return setIssues([{ fieldId: `course-${courses[0]?.id ?? ""}`, message: "Choose a course." }])
      return go("skills")
    }
    if (step === "skills") {
      if (d.skills.length === 0) return setIssues([{ fieldId: "fulfil-skills", message: `Choose at least one ${skillNoun()}.` }])
      return go(selfIds.length ? "self" : "send", { skills: d.skills.join(",") })
    }
    if (step === "self") {
      // Every question answered, and the overall result where the skill has one, before Continue [REQ ST-11].
      if (d.selfIssues.length) return setIssues(d.selfIssues)
      return go("send")
    }
    d.send()
  }
  const back = index > 0 ? () => go(order[index - 1]) : undefined
  const selfDone = selfIds.filter((id) => !d.selfIssues.some((x) => x.fieldId.startsWith(`self-${id}-`))).length
  const selfLine = selfIds.length ? `${selfDone} of ${selfIds.length} done` : null

  if (d.result) {
    // The confirmation keeps the step's title: the walkthrough step, the stepper and the heading all say "Send for evaluation".
    return (
      <WizardPage title={TITLE.send} actions={<SampleDataBadge />} steps={steps} current={order.length - 1} footer={<StickyFooter />}>
        <WizardPanel step={order.length - 1}>
          <div data-student-lab="request-C" data-step="sent">
            <RequestResult d={d} wide r={d.result} />
          </div>
        </WizardPanel>
      </WizardPage>
    )
  }

  // The reason the step cannot move on sits in the footer, beside the primary (Romit 2026-10-27, self-evaluation).
  const context = step === "self" && issues.length ? issues[0].message : course ? `${course.code} · ${d.skills.length ? countSkills(d.skills.length) : `no ${skillNounPlural()} yet`}` : null
  const saved = d.saveError || d.savedAt ? <SavedForLater d={d} /> : null
  // Self-evaluation says what is missing once, in the footer beside Continue (and on the card); no banner on top.
  const banner = step === "send" && d.tried && !d.valid ? <SendIssues d={d} /> : issues.length && step !== "self" ? <ValidationSummary issues={issues} title="Fix this to continue" /> : saved

  return (
    <WizardPage
      title={TITLE[step]}
      actions={<SampleDataBadge />}
      steps={steps}
      current={index}
      onStepClick={(i) => go(order[i])}
      banner={banner}
      aside={<RequestSummary d={d} model={m} course={course} selfLine={selfLine} step={step} />}
      footer={<StickyFooter back={back ? { onClick: back } : undefined} context={context} secondary={step !== "course" ? { label: "Save for later", onClick: () => { setIssues([]); d.saveForLater({ course: course?.id ?? null, step }) } } : undefined} primary={{ label: step === "send" ? (d.offline ? "Keep and send later" : "Send") : "Continue", onClick: next }} />}
    >
      <div data-student-lab="request-C" data-step={step}>
        <WizardPanel step={index}>
          {step === "course" ? <CourseStep courses={courses} value={course?.id ?? ""} onChange={pickCourse} model={m} /> : null}
          {step === "skills" && course ? <SkillsStep model={m} course={course} selected={d.skills} onToggle={d.toggle} d={d} /> : null}
          {/* The evaluator's own criteria, answered for yourself [REQ ST-11]: one card per skill, no third column. */}
          {step === "self" ? <SelfEvalCards s={d.s} ids={selfIds} ratings={d.ratings} answers={d.answers} onRating={(id, v) => d.setRatings((r) => ({ ...r, [id]: v }))} onAnswer={d.setAnswer} showErrors={issues.length > 0} /> : null}
          {step === "send" ? <SendStep d={d} /> : null}
        </WizardPanel>
      </div>
    </WizardPage>
  )
}

/**
 * "Your request", beside every step from 1280 px: what the student picked so far and what the evaluator will see. Values only
 * (a description list), no instructions, so it adds no prose; the footer carries the same course and count below 1280 px.
 */
function RequestSummary({ d, model, course, selfLine, step }: { d: RequestDraft; model: StudentModel; course: CourseExpectation | null; selfLine: string | null; step: StepId }) {
  const rec = new Map(model.all.map((r) => [r.id, r]))
  const chosen = d.skills.map((id) => ({ id, r: rec.get(id), name: d.picks.find((p) => p.id === id)?.name ?? skillById(d.s, id)?.name ?? skillNoun() }))
  const pick = d.who
  const who = pick?.kind === "person" ? d.options.find((o) => o.id === pick.id)?.name : pick?.kind === "new" ? d.fresh.name.trim() || "Someone not listed" : null
  return (
    <section aria-label="Your request" className="flex flex-col gap-4" data-request-summary>
      <h2 className={TYPE.section}>Your request</h2>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-3 text-sm">
        <dt className="text-muted-foreground">Course</dt>
        <dd className="min-w-0 text-foreground">{course ? `${course.code}, ${course.name}` : "Not chosen yet"}</dd>
        <dt className="text-muted-foreground">{capitalize(skillNounPlural())}</dt>
        <dd className="min-w-0">
          {chosen.length === 0 ? <span className="text-muted-foreground">None yet</span> : (
            <ul className="flex flex-col gap-2">
              {chosen.map((x) => (
                <li key={x.id} className="flex items-start gap-2">
                  {x.r ? <Unit r={x.r} studentId={d.studentId} size={20} /> : null}
                  <span className="flex min-w-0 flex-col">
                    <span className="text-foreground">{x.name}</span>
                    {x.r ? <span className="text-xs text-muted-foreground" data-viz-label>{x.r.label}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </dd>
        {selfLine ? (
          <>
            <dt className="text-muted-foreground">Self-evaluation</dt>
            <dd className="text-foreground">{selfLine}</dd>
          </>
        ) : null}
        {step === "send" ? (
          <>
            <dt className="text-muted-foreground">Who</dt>
            <dd className="min-w-0 text-foreground">{who ?? <span className="text-muted-foreground">Not chosen yet</span>}</dd>
            <dt className="text-muted-foreground">How</dt>
            <dd className="text-foreground">{methodById(d.method).label}</dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">They see</dt>
        <dd className="text-foreground">{scopeSentence(d).replace(/^They see /, "").replace(/^./, (c) => c.toUpperCase())}</dd>
      </dl>
    </section>
  )
}

/** Courses the student is on this term, each with one square per mandatory skill (the same squares My progress shows). */
function CourseStep({ courses, value, onChange, model }: { courses: CourseExpectation[]; value: string; onChange: (id: string) => void; model: StudentModel }) {
  return (
    <FieldSet>
      <FieldLegend className="sr-only">Course</FieldLegend>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-3" aria-label="Course">
        {courses.map((c) => {
          const place = model.placements.find((p) => p.courseId === c.id)
          const mand = courseLevels(model, c).mandatory
          return (
            <Label key={c.id} htmlFor={`course-${c.id}`} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal has-[[data-state=checked]]:border-foreground", TOUCH_ROW)}>
              <RadioGroupItem value={c.id} id={`course-${c.id}`} className="mt-0.5" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-medium text-foreground">{c.code}</span>
                <span className="truncate text-xs text-muted-foreground" data-viz-label>{place ? `${c.name} · ${place.location}` : c.name}</span>
                {mand.length ? (
                  <span className="flex flex-wrap items-center gap-1.5 pt-1" aria-hidden="true">
                    {mand.map((r) => <Unit key={r.id} r={r} studentId="" size={16} decorative />)}
                  </span>
                ) : null}
                <span className="text-xs tabular-nums text-foreground" data-viz-label>{c.mandatory ? `${c.mandatoryAchieved} of ${c.mandatory} mandatory achieved` : `${countSkills(c.skills.length)}, none mandatory`}</span>
              </span>
            </Label>
          )
        })}
      </RadioGroup>
    </FieldSet>
  )
}

/** The course's skills, mandatory first and chosen by default; recommended and optional one click away [REQ ST-01, ST-02]. */
function SkillsStep({ model, course, selected, onToggle, d }: { model: StudentModel; course: CourseExpectation; selected: string[]; onToggle: (id: string) => void; d: RequestDraft }) {
  const lv = courseLevels(model, course)
  const mandatory = lv.mandatory.map((r) => ({ level: "mandatory", r }))
  const others = [...lv.recommended.map((r) => ({ level: "recommended", r })), ...lv.optional.map((r) => ({ level: "optional", r }))]
  const [open, setOpen] = React.useState(mandatory.length === 0)
  const list = (items: Array<{ level: string; r: SkillRecord }>) => (
    <ul className="flex flex-col divide-y divide-border">
      {items.map(({ level, r }) => (
        <li key={r.id} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 py-2.5 @2xl:grid-cols-[auto_minmax(0,1fr)_16rem]">
          {r.waiting ? <i className="fa-light fa-clock w-4 text-center text-sm text-muted-foreground" aria-hidden="true" /> : <Checkbox id={`pick-${r.id}`} checked={selected.includes(r.id)} onCheckedChange={() => onToggle(r.id)} />}
          <Label htmlFor={r.waiting ? undefined : `pick-${r.id}`} className="min-w-0 truncate text-sm font-normal text-foreground">
            {r.name}
            {level !== "mandatory" ? <span className="ms-2 text-xs text-muted-foreground">{MAPPING_LEVEL_LABEL[level as "recommended" | "optional"]}</span> : null}
          </Label>
          <span className="col-start-2 text-sm @2xl:col-start-3">{r.waiting ? <span className="text-muted-foreground">{`Waiting for ${r.waiting.evaluatorName}`}</span> : <StateLabel record={r} />}</span>
          {/* The questions, read where the skill is chosen (no separate step); a self-evaluated skill shows them on its own step. */}
          {selected.includes(r.id) ? <div className="col-span-full col-start-2"><CheckoffDone s={d.s} studentId={d.studentId} ids={[r.id]} /></div> : null}
          {selected.includes(r.id) && !d.selfIds.includes(r.id) ? <div className="col-span-full col-start-2"><EvaluatorChecks s={d.s} id={r.id} /></div> : null}
        </li>
      ))}
    </ul>
  )
  return (
    <div className="flex flex-col gap-4" id="fulfil-skills" tabIndex={-1}>
      {mandatory.length ? (
        <section aria-label={`Mandatory on ${course.code}`}>
          <h2 className={TYPE.section}>{`Mandatory on ${course.code}`}</h2>
          {list(mandatory)}
        </section>
      ) : null}
      {others.length ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="-ms-2" aria-expanded={open}>
              <i className={cn("fa-light", open ? "fa-chevron-down" : "fa-chevron-right")} aria-hidden="true" />
              {`Recommended and optional (${others.length})`}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>{list(others)}</CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  )
}

/**
 * Where it was performed decides who may sign; how they sign starts on Email a link (D-L2); then who, the details and the one note
 * [REQ ST-05..ST-10, ST-12]. Two columns once the step is wide (size container), one column on a phone.
 */
function SendStep({ d }: { d: RequestDraft }) {
  return (
    <div className="grid items-start gap-x-8 gap-y-6 @2xl:grid-cols-2">
      <div className="flex flex-col gap-5">
        <WherePick d={d} />
        <MethodTiles value={d.method} onChange={d.setMethod} offline={d.offline} />
        {d.method === "photo" ? <PhotoField d={d} /> : null}
      </div>
      <div className="flex flex-col gap-2 @2xl:row-span-2">
        <EvaluatorPicker options={d.options} value={d.who} onChange={d.setWho} fresh={d.fresh} onFresh={d.setFresh} errors={d.freshErrors} showErrors={d.tried} compact />
        {d.tried && d.errors.who ? <FieldError>{d.errors.who}</FieldError> : null}
      </div>
      <DetailsAndNote d={d} columns={false} />
    </div>
  )
}
