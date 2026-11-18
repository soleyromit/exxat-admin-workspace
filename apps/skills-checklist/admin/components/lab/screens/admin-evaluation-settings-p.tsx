"use client"

/**
 * Evaluation settings P, "One question at a time, answers stay on the page" (Proposed, D-EM1116-h; contract ADMIN-D3 "round 7 variants").
 * Romit 2026-11-16 on M: try the wizard for adding and editing, "but can you do it better".
 *
 * No stepper. Four short questions in one readable column, like a checkout whose finished parts fold into a line:
 *   how a skill is rated [REQ 4.1, SC-02], what the evaluator picks and what moves a student forward (worded for the type) [REQ SC-03 to
 *   SC-08], who can evaluate and what each evaluation needs [REQ SC-14, SC-15, SC-16], what the method is called.
 * One question is open at a time, as the page's one heading with its fields. An answered question is its text and the answer in plain words,
 * with Change. A question still to come is its text only, so the admin sees what is left. The evaluator's and student's forms are drawn
 * beside the column from the first choice [REQ SC-19].
 *   - Add (`?method=new`): Continue checks the open question and opens the next; on the last one the primary is Create method.
 *   - Edit (`?method=<id>`): the same page with every question answered. Change opens one, Done folds it back, Save method shows once
 *     something changed. `&step=rating|answers|who|needs|name` opens a question directly.
 * Each question is a DS Collapsible; Change is its trigger.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { TYPE } from "@/components/lab/type-scale"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { BackTitle } from "@/components/lab/shared/return-link"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { ProgramPreview } from "@/components/lab/configure/program-preview"
import { ProgramPreviewDialog } from "@/components/lab/configure/settings-dialogs"
import { CheckOffField, LoadingBlock, MethodDraft, NEW, NameFields, NeedsField, ProblemsLink, RolesField, SETTINGS_TITLE, UsedBy, useAskDiscard, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { MethodsHome, NAME_QUESTION, RatingFields, RatingTiles, StepProblems, WHO_AND_NEEDS_QUESTION, answersQuestion, issuesIn, methodWords, partOf, ratingQuestion, scoped, toField, type Part } from "@/components/lab/methods/method-wizard"
import type { EvaluationMethod } from "@/lib/lab/methods"

const QUESTIONS = ["rating", "answers", "who", "name"] as const
type QId = (typeof QUESTIONS)[number]
const LAST = QUESTIONS.length - 1
const isQuestion = (v: string | null | undefined): v is QId => !!v && (QUESTIONS as readonly string[]).includes(v)
const PARTS: Record<QId, readonly Part[]> = { rating: ["type"], answers: ["picks"], who: ["who", "needs"], name: [] }
const questionOfPart: Record<Part, QId> = { type: "rating", picks: "answers", who: "who", needs: "who" }

/** One question: open (the heading and its fields), answered (the question and the answer, with Change), or still to come (its text only). */
function Question({ id, title, open, reached, onOpen, answer, children }: { id: QId; title: string; open: boolean; reached: boolean; onOpen: () => void; answer: React.ReactNode; children: React.ReactNode }) {
  return (
    <Collapsible open={open} onOpenChange={(o) => { if (o) onOpen() }} asChild>
      <section className="flex min-w-0 flex-col border-b border-border py-4 first:pt-0 last:border-b-0" aria-labelledby={`question-${id}`} data-question={id} data-question-state={open ? "open" : reached ? "answered" : "to-come"}>
        {open ? (
          <h2 id={`question-${id}`} tabIndex={-1} className={cn(TYPE.section, "outline-none")}>{title}</h2>
        ) : (
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 id={`question-${id}`} className={cn(TYPE.helper, "font-normal")}>{title}</h2>
              {reached ? <div className={cn(TYPE.body, "flex min-w-0 flex-col gap-0.5 break-words")} data-answer>{answer}</div> : null}
            </div>
            {reached ? (
              <CollapsibleTrigger asChild>
                <Button type="button" variant="link" size="sm" className="h-auto min-h-6 shrink-0 p-0 font-normal" aria-label={`Change: ${title}`} data-change={id}>Change</Button>
              </CollapsibleTrigger>
            ) : null}
          </div>
        )}
        <CollapsibleContent className="min-w-0 pt-4">{children}</CollapsibleContent>
      </section>
    </Collapsible>
  )
}

const Lines = ({ lines }: { lines: Array<{ id: string; text: string; open?: boolean }> }) => <>{lines.map((s) => <span key={s.id} className={s.open ? "text-muted-foreground" : undefined}>{s.text}</span>)}</>

function Stack({ m, backHref, onLeave, startAt, editing }: { m: MethodModel; backHref: string; onLeave: () => void; startAt: QId | null; /** A saved method with a type: every question is answered. */ editing: boolean }) {
  const [open, setOpen] = React.useState<QId | null>(startAt)
  /** The furthest question opened so far: everything up to it has an answer on the page. */
  const [reached, setReached] = React.useState(editing ? LAST : 0)
  const [tried, setTried] = React.useState<Partial<Record<QId, boolean>>>({})
  const discard = useAskDiscard()
  const { rule, method } = m
  const words = methodWords(rule)
  const index = open ? QUESTIONS.indexOf(open) : -1
  const here = open ? issuesIn(m, PARTS[open]) : []
  const shown = open && tried[open] ? here : []
  const sm = scoped(m, !!(open && tried[open]))
  const walking = reached < LAST
  const show = (q: QId) => {
    setOpen(q)
    setReached((r) => Math.max(r, QUESTIONS.indexOf(q)))
    requestAnimationFrame(() => document.getElementById(`question-${q}`)?.focus())
  }
  const fold = (q: QId) => {
    setOpen(null)
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-change="${q}"]`)?.focus())
  }
  /** A problem opens the question it lives in, shows there, and takes the focus. */
  const openProblem = (q: QId) => {
    const issues = issuesIn(m, PARTS[q])
    setTried((t) => ({ ...t, [q]: true }))
    setOpen(q)
    setReached((r) => Math.max(r, QUESTIONS.indexOf(q)))
    if (issues[0]) toField(m, issues[0])
  }
  const save = () => {
    const r = m.save()
    if (r === "name") { setOpen("name"); requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("method-name")?.focus())) }
    else if (r === "type") openProblem("rating")
    else if (r === "rule" && m.issues[0]) openProblem(questionOfPart[partOf(m.issues[0].field)])
  }
  // The last question of a new method ends the wizard: its primary creates the method.
  const creating = !editing && open === "name"
  const next = () => {
    if (!open || creating) { save(); return }
    if (here.length) { setTried((t) => ({ ...t, [open]: true })); toField(m, here[0]!); return }
    if (walking) show(QUESTIONS[index + 1]!)
    else fold(open)
  }
  const quiet = editing && !open && !m.dirty
  const title: Record<QId, string> = { rating: ratingQuestion(), answers: answersQuestion(rule.model), who: WHO_AND_NEEDS_QUESTION, name: NAME_QUESTION }
  const answer: Record<QId, React.ReactNode> = {
    rating: words.type ? <span className="flex flex-wrap gap-x-2"><span>{words.type}</span>{m.settled && method ? <span className="text-muted-foreground"><UsedBy method={method} linked={!m.dirty} /></span> : null}</span> : <span className="text-muted-foreground">Not chosen yet</span>,
    answers: <Lines lines={words.picks} />,
    who: <Lines lines={[...words.who, ...words.needs]} />,
    name: m.meta.name.trim() ? <><span>{m.meta.name.trim()}</span>{m.meta.description.trim() ? <span className="text-muted-foreground">{m.meta.description.trim()}</span> : null}</> : <span className="text-muted-foreground">Not named yet</span>,
  }
  const fields: Record<QId, React.ReactNode> = {
    rating: <RatingTiles m={sm} />,
    answers: <RatingFields m={sm} />,
    who: (
      <div className="grid min-w-0 gap-6 sm:grid-cols-2" data-region="evaluation">
        <RolesField m={sm} />
        <div className="flex min-w-0 flex-col gap-4"><NeedsField m={sm} /><CheckOffField m={sm} /></div>
      </div>
    ),
    name: <NameFields m={m} />,
  }
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="wizard" data-method-page>
      <PageFrame title={<BackTitle href={backHref} label={`Back to ${SETTINGS_TITLE}`}>{method ? method.name : "New method"}</BackTitle>} className="flex-1">
        {/* A readable column of questions and the forms beside it from 1280 px; on a very wide screen both stop growing, so no line runs long. */}
        <div className={cn("grid flex-1 grid-cols-1 items-start gap-6", rule.model && "min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(20rem,34%)] min-[1800px]:grid-cols-[minmax(0,48rem)_minmax(20rem,40rem)]")} data-region="panel">
          <div className="@container flex min-w-0 flex-col gap-6">
            <div className="flex max-w-[48rem] min-w-0 flex-col" data-questions>
              {QUESTIONS.map((q, i) => (
                <Question key={q} id={q} title={title[q]} open={open === q} reached={i <= reached} onOpen={() => show(q)} answer={answer[q]}>
                  {open === q ? fields[q] : null}
                </Question>
              ))}
            </div>
            {/* Below 1280 px the forms are not beside the questions: they open from here [REQ SC-19]. */}
            {rule.model ? <div className="flex justify-start min-[1280px]:hidden"><ProgramPreviewDialog draft={withCarried(rule)} variant="ghost" /></div> : null}
          </div>
          {/* No empty frame before a type is chosen: the forms take their column once there is something to draw. */}
          {rule.model ? (
            <div className="hidden self-stretch rounded-[var(--radius)] border border-border min-[1280px]:block" data-preview-column>
              <div className="sticky top-4 p-4"><ProgramPreview draft={withCarried(rule)} /></div>
            </div>
          ) : null}
        </div>
        <StickyFooter
          back={walking && index > 0 ? { onClick: () => show(QUESTIONS[index - 1]!) } : undefined}
          context={<span aria-live="assertive" aria-atomic="true">{!open || open === "name" ? <ProblemsLink m={m} /> : <StepProblems m={m} issues={shown} />}</span>}
          secondary={{ label: quiet ? "Close" : "Cancel", onClick: () => discard.ask(m.dirty, () => { m.reset(); onLeave() }) }}
          primary={quiet ? undefined : { label: !open ? (method ? "Save method" : "Create method") : creating ? "Create method" : walking ? "Continue" : "Done", onClick: next }}
        />
      </PageFrame>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
      {discard.question}
    </div>
  )
}

export function AdminEvaluationSettingsP() {
  const nav = useMethodNav()
  const params = useSearchParams()
  const { open, missing, hydrated } = useOpenMethod(nav.id)
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  if (nav.id && !hydrated) return <div className="p-6"><LoadingBlock /></div>
  if (open) {
    const method: EvaluationMethod | null = open === NEW ? null : open
    // A method with a saved type opens with every question answered; a new one, or one with no type yet, starts at the first question.
    const editing = !!method && method.saved && !!method.rule.model
    const asked = params?.get("step")
    const startAt: QId | null = !editing ? "rating" : asked === "type" ? "rating" : asked === "needs" ? "who" : isQuestion(asked) ? asked : null
    return (
      <>
        {banner ? <ResultBanner banner={banner} onDismiss={() => setBanner(null)} /> : null}
        <MethodDraft key={method?.id ?? NEW} method={method} onSaved={(b, id) => { setBanner(b); if (id) nav.close() }}>
          {(m) => <Stack m={m} backHref={nav.href(null)} onLeave={nav.close} startAt={startAt} editing={editing} />}
        </MethodDraft>
      </>
    )
  }
  return <MethodsHome banner={banner} setBanner={setBanner} missing={missing} />
}
