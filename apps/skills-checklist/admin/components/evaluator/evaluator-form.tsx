"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { evaluatorRequest, submitEvaluation, type EvaluatorRequestItem } from "@/lib/store"
import { useActions, useDb } from "@/lib/store/react"
import { SkillCard } from "./skill-card"
import { Confirmation, type ConfirmationEntry, type ProgressRow } from "./confirmation"
import { LinkMessage, type LinkProblem } from "./link-message"
import { buttons, criteriaSummary, evaluatorCopy as c } from "@/lib/copy"
import { modelNames, offeringTitle, preceptor } from "@/lib/copy/r5-student-preceptor"
import { criteriaParts, evidenceLedger, skillProgress } from "@/lib/store"
import { SkillStatusBadge } from "@/components/skills"
import { clearDrafts, emptyDraft, loadDrafts, saveDrafts, summarise, toResponses, type AnswerDraft, type DraftStorage, type Drafts, type Issue } from "./form-state"

/** False on the server and the first client paint, so persisted data never flashes the seed or a wrong "invalid link". */
function useMounted(): boolean {
  const [m, setM] = React.useState(false)
  React.useEffect(() => setM(true), [])
  return m
}

const browserStorage = (): DraftStorage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage
  } catch {
    return null
  }
}

/** The fieldset that holds the control for an unanswered key, so focus can land on its first radio. */
function fieldsetId(submissionId: string, key: string | undefined): string {
  const p = `ev-${submissionId}`
  if (!key || key === "labelId") return `${p}-binary`
  if (key === "levelId") return `${p}-level`
  return `${p}-${key.replace(/^(answers|scores)\./, "")}`
}

/**
 * S-16 Evaluator form. Opens from the emailed link with NO login, NO account and NO shell (EV-01). It shows only the
 * request behind the token (isolation, cross-cutting §10) and never the student's achievement status (OD-17).
 */
export function EvaluatorForm({ token, storage, showProgress = false, embedded = false, onBack }: { token: string; storage?: DraftStorage | null; showProgress?: boolean; embedded?: boolean; onBack?: () => void }) {
  const mounted = useMounted()
  const db = useDb()
  const { run } = useActions()
  const store = storage === undefined ? browserStorage() : storage

  const req = React.useMemo(() => evaluatorRequest(db, token), [db, token])
  const request = req.status === "ok" ? req.request : undefined
  const items = React.useMemo<EvaluatorRequestItem[]>(() => request?.items ?? [], [request])

  const [drafts, setDrafts] = React.useState<Drafts>({})
  const [attempted, setAttempted] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [blocked, setBlocked] = React.useState<LinkProblem | null>(null)
  const [result, setResult] = React.useState<{ studentName: string; entries: ConfirmationEntry[]; sent: Array<{ submissionId: string; skillName: string }> } | null>(null)
  const [saveState, setSaveState] = React.useState<"idle" | "saved" | "failed">("idle")
  const [announce, setAnnounce] = React.useState("")
  const [focusTarget, setFocusTarget] = React.useState<Issue | null>(null)

  const inFlight = React.useRef(false)
  const dirty = React.useRef(false)
  const loadedFor = React.useRef<string | null>(null)
  const h1 = React.useRef<HTMLHeadingElement>(null)

  const itemKey = items.map((i) => i.submissionId).join(",")

  // Load a saved draft once per link, after mount.
  React.useEffect(() => {
    if (!mounted || !request || loadedFor.current === token) return
    loadedFor.current = token
    setDrafts(loadDrafts(store, token, items.map((i) => i.submissionId)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, request, token, itemKey])

  // Autosave after the evaluator changes something (per field, against this device; contract §10 Er autosave).
  const persist = React.useCallback(
    (d: Drafts) => {
      const ok = saveDrafts(store, token, d)
      setSaveState(ok ? "saved" : "failed")
      return ok
    },
    [store, token],
  )
  React.useEffect(() => {
    if (!dirty.current || result) return
    persist(drafts)
  }, [drafts, persist, result])

  // The page title takes focus on load (contract §13).
  React.useEffect(() => {
    if (mounted && request && !result) h1.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, !!request])

  // Move focus to the first invalid control after a blocked submit.
  React.useEffect(() => {
    if (!focusTarget) return
    const item = items.find((i) => i.submissionId === focusTarget.submissionId)
    let el: HTMLElement | null = null
    if (focusTarget.target === "comment") el = document.getElementById(`ev-${focusTarget.submissionId}-comment`)
    else if (item) el = document.getElementById(fieldsetId(item.submissionId, focusTarget.key))?.querySelector<HTMLElement>('[role="radio"]') ?? null
    el?.focus()
    setFocusTarget(null)
  }, [focusTarget, items])

  const summary = React.useMemo(
    () => summarise(items.map((i) => ({ submissionId: i.submissionId, skillName: i.skillName, model: i.model, commentRule: i.commentRule })), drafts),
    [items, drafts],
  )
  const firstOpen = summary.issues[0]?.submissionId

  const setDraft = (id: string, next: AnswerDraft) => {
    dirty.current = true
    setError(null)
    setDrafts((p) => ({ ...p, [id]: next }))
  }

  const onSubmit = () => {
    if (inFlight.current || submitting || !request) return
    if (!summary.complete) {
      setAttempted(true)
      const issue = summary.issues[0]
      // The live region gives the count; the inline error and the focused control carry the detail (no double reading).
      setAnnounce(c.notSubmitted(summary.remaining.length))
      if (issue) setFocusTarget({ ...issue })
      return
    }
    inFlight.current = true
    setSubmitting(true)
    setError(null)
    const answers = items.map((i) => {
      const d = drafts[i.submissionId] ?? emptyDraft()
      return { submissionId: i.submissionId, responses: toResponses(i.model, d), comment: d.comment }
    })
    const r = run((d, ctx) => submitEvaluation(d, { token, answers }, ctx))
    if (r.ok) {
      clearDrafts(store, token)
      const names = new Map(items.map((i) => [i.submissionId, i.skillName]))
      setResult({
        studentName: request.studentName,
        entries: r.value.results.map((x) => ({ skillName: names.get(x.submissionId) ?? "", countsNow: x.countsNow })),
        // The link is spent after submit, so the request can no longer be read from the store: keep what was sent.
        sent: items.map((i) => ({ submissionId: i.submissionId, skillName: i.skillName })),
      })
      setAnnounce(c.resultHeading(request.studentName, r.value.results.length))
    } else {
      const code = r.error.code
      if (code === "alreadySubmitted") setBlocked("submitted")
      else if (code === "linkInvalid") setBlocked("invalid")
      else if (code === "linkSuperseded") setBlocked("superseded")
      else {
        setAttempted(true)
        setError(c.submitError)
      }
    }
    inFlight.current = false
    setSubmitting(false)
  }

  // C-6 [PROTO] post-submit table. Read from the store AFTER the action committed. Demo page only; never on /e/[token].
  const progressRows = React.useMemo<ProgressRow[] | undefined>(() => {
    if (!showProgress || !result) return undefined
    const rows: ProgressRow[] = []
    for (const it of result.sent) {
      const sub = db.submissions.find((s) => s.id === it.submissionId)
      if (!sub) continue
      const ledger = evidenceLedger(db, sub.studentId, sub.skillId).find((x) => x.submissionId === sub.id)
      const prog = skillProgress(db, sub.studentId, sub.skillId)
      const held = ledger?.state === "awaitingApproval"
      const rec = ledger?.recorded
      const recorded = !rec ? "" : rec.kind === "binary" ? rec.label : rec.kind === "demonstration" ? rec.level : rec.kind === "question" ? `${rec.yes} of ${rec.total} answered Yes` : `Average ${rec.average.toFixed(1)}`
      const t = prog?.total
      rows.push({
        skillName: it.skillName,
        recorded,
        qualifies: ledger?.state !== "didNotMeet",
        progress: held ? preceptor.result.held : t ? `${t.have} / ${t.needed ?? t.have} ${t.noun === "demonstrations" ? "demonstrations" : "qualifying evaluations"}` : "",
        status: held ? preceptor.result.awaiting : prog ? <SkillStatusBadge state={prog.evaluation.state} /> : null,
      })
    }
    return rows
  }, [showProgress, result, db])

  // ---------------------------------------------------------------- states
  if (!mounted) return <LoadingState />
  if (result) return <Confirmation studentName={result.studentName} entries={result.entries} progress={showProgress ? progressRows : undefined} onBack={onBack} />
  if (blocked) return <LinkMessage problem={blocked} />
  if (req.status !== "ok" || !request || items.length === 0) return <LinkMessage problem={req.status === "submitted" ? "submitted" : req.status === "superseded" ? "superseded" : "invalid"} />

  const requested = new Date(request.requestedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
  const evaluatorOffering = (() => {
    const o = db.offerings.find((x) => x.id === db.submissions.find((s) => s.id === items[0]?.submissionId)?.offeringId)
    return o ? offeringTitle(o.code, o.name) : request.offeringLabel
  })()
  const criteriaLineFor = (skillId: string): string | undefined => {
    const skill = db.skills.find((s) => s.id === skillId)
    if (!skill || !skill.model) return undefined
    return preceptor.form.achievement(modelNames[skill.model.kind], criteriaSummary(criteriaParts(db, skill)))
  }
  const settingLine = request.performedIn === "lab" ? c.settingLab : c.settingClinical(request.settingName, request.locationName)
  const stillNeeded = summary.remaining.map((r) => (r.kind === "comment" ? c.needComment(r.skillName) : c.needAnswers(r.skillName)))

  return (
    <div className="flex flex-col gap-6" data-testid="evaluator-form">
      <header className="flex flex-col gap-2">
        {embedded && onBack ? (
          <div>
            <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={onBack}>
              {preceptor.form.back}
            </Button>
          </div>
        ) : null}
        {embedded ? (
          <h2 ref={h1} tabIndex={-1} className="text-xl font-semibold text-foreground">
            {preceptor.form.heading}
          </h2>
        ) : (
          <h1 ref={h1} tabIndex={-1} className="text-2xl font-semibold text-foreground">
            {c.header(request.studentName)}
          </h1>
        )}
        <p className="text-sm text-muted-foreground">{embedded ? preceptor.form.sub(request.studentName, evaluatorOffering, request.evaluatorName, request.roleLabel) : c.subline(request.offeringLabel, requested, request.roleLabel)}</p>
        <p className="text-sm font-medium text-foreground">{c.progress(summary.answered, summary.total)}</p>
        {firstOpen ? (
          <a href={`#ev-${firstOpen}-h`} className="w-fit text-sm text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&:not(:focus)]:sr-only">
            {c.skipLink}
          </a>
        ) : null}
      </header>

      {error ? <LocalBanner variant="error" retry={{ label: buttons.retry, onClick: onSubmit }}>{error}</LocalBanner> : null}

      <div className="flex flex-col gap-6">
        {items.map((item, i) => {
          return (
            <SkillCard
              key={item.submissionId}
              index={i}
              item={item}
              settingLine={settingLine}
              draft={drafts[item.submissionId] ?? emptyDraft()}
              onChange={(next) => setDraft(item.submissionId, next)}
              showErrors={attempted}
              previousReturned={item.returnedEarlier}
              criteriaLine={showProgress ? criteriaLineFor(item.skillId) : undefined}
              heldLabel={embedded ? preceptor.form.goesToReview : undefined}
            />
          )
        })}
      </div>

      <footer className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6">
        <p className="text-sm text-muted-foreground">{c.footer}</p>
        <p id="ev-remaining" className="text-sm text-foreground">
          {summary.complete ? c.progress(summary.answered, summary.total) : c.stillNeeded(stillNeeded.length, stillNeeded[0])}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {saveState === "failed" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {c.notSaved}
              <Button type="button" variant="link" size="sm" onClick={() => persist(drafts)}>
                {c.retry}
              </Button>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{saveState === "saved" ? c.savedOnDevice : ""}</p>
          )}
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={onSubmit}
            disabled={submitting}
            aria-disabled={!summary.complete || submitting}
            aria-busy={submitting || undefined}
            aria-describedby="ev-remaining"
            className={summary.complete ? "min-h-11" : "min-h-11 bg-muted text-muted-foreground hover:bg-muted"}
          >
            {submitting ? c.submitting : c.submit}
          </Button>
        </div>
      </footer>
      <p role="status" aria-live="polite" className="sr-only" data-testid="live">
        {announce}
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" data-testid="loading">
      <p className="sr-only" role="status">
        {c.loading}
      </p>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
