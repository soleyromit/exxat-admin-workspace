"use client"

import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { ProgressCell } from "@exxatdesignux/ui/components/data-views/table-cells"
import type { Db, SkillStatusDisplay } from "@/lib/domain/types"
import { stateRank, type SkillState, type SubmissionState } from "@/lib/engine"
import { buttons, criteriaSummary, didNotMeetSentence, evaluationReasonText, lineageSteps, ruleContext, submissionOutcome, surface } from "@/lib/copy"
import { counterGroups, r4, reportingCopy as rc } from "@/lib/copy"
import {
  criteriaParts,
  evidenceFilterOf,
  evidenceLedger,
  failedRule,
  reportBySkill,
  reportByTag,
  scopedRecords,
  skillProgress,
  studentOverview,
  type LedgerRow,
  type RecordedDetail,
  type ReportFilters,
} from "@/lib/store"
import { EmptyState, SkillStatusBadgeView } from "@/components/skills"
import { Grid, col, type Col } from "./report-tables"
import { SettingProgress, StillNeeded, totalText } from "./progress-parts"
import { hasEvidenceFilter, type OverviewParams } from "./report-params"

const isoDate = (iso: string) => iso.slice(0, 10)

export type RailStatus = "ready" | "loading" | "error"

export interface ReportDialogsProps {
  db: Db
  display: SkillStatusDisplay
  params: OverviewParams
  /** Replace or push the URL state. `push` for opening a deeper level so browser Back mirrors levels (P-07). */
  onParams: (next: OverviewParams, mode?: "push" | "replace") => void
  status?: RailStatus
  onRetry?: () => void
}

/** Evidence filter for the dialogs: the overview's location and setting, unless the admin chose "Show all evidence" (RP-08). */
const dialogFilters = (p: OverviewParams): ReportFilters => (p.showAllEvidence ? { ...p.filters, locationId: undefined, settingId: undefined } : p.filters)

const whereLabel = (db: Db, f: ReportFilters): string => {
  const parts: string[] = []
  if (f.settingId) parts.push(f.settingId === "lab" ? r4.filters.lab : (db.clinicalSettings.find((s) => s.id === f.settingId)?.name ?? f.settingId))
  if (f.locationId) parts.push(db.locations.find((l) => l.id === f.locationId)?.name ?? f.locationId)
  return parts.join(" at ")
}

/** Dialog width per the prototype: large = 1024px (the DS Dialog's default cap is smaller, so it is set here). */
const LARGE = "w-[calc(100%-2rem)] max-w-5xl sm:max-w-5xl max-h-[calc(100dvh-6rem)] gap-0 overflow-hidden p-0 flex flex-col"

/** Focus lands on the dialog itself (its title is announced), not on the first control inside a table header. */
const focusContent = (e: Event) => {
  e.preventDefault()
  ;(e.currentTarget as HTMLElement | null)?.focus()
}

function DialogShell({ open, onClose, title, description, children, footer, onCloseAutoFocus, label }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode; onCloseAutoFocus?: (e: Event) => void; label: string }) {
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className={LARGE} data-dialog={label} onCloseAutoFocus={onCloseAutoFocus} onOpenAutoFocus={focusContent}>
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description ? <DialogDescription className="text-xs">{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">{children}</div>
        {footer ? <DialogFooter className="m-0 rounded-none border-t border-border px-6 py-3">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}

/** Scope sentence for RP-08: states that only evidence recorded there is counted, with a control to see everything. */
function EvidenceScopeNote({ db, params, onParams }: { db: Db; params: OverviewParams; onParams: ReportDialogsProps["onParams"] }) {
  if (!hasEvidenceFilter(params.filters)) return null
  const active = !params.showAllEvidence
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <p>{active ? rc.countingOnly(whereLabel(db, params.filters)) : "Counting all evidence recorded."}</p>
      {active ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onParams({ ...params, showAllEvidence: true })}>
          {rc.showAllEvidence}
        </Button>
      ) : null}
    </div>
  )
}

// ----------------------------------------------------------------- result vocabulary (SH-02)

const RESULT_TONE: Record<SubmissionState, "success" | "warning" | "info" | "neutral"> = {
  counted: "success",
  didNotMeet: "warning",
  returned: "info",
  awaitingApproval: "info",
  awaitingEvaluator: "neutral",
  revised: "neutral",
  completed: "neutral",
  draft: "neutral",
  selfEvalPending: "neutral",
}

export function resultLabel(row: Pick<LedgerRow, "state" | "evaluatorName" | "evaluatorRole">): string {
  switch (row.state) {
    case "counted":
      return r4.studentDialog.counts
    case "didNotMeet":
      return submissionOutcome.didNotMeet
    case "returned":
      return submissionOutcome.returned
    case "awaitingApproval":
      return submissionOutcome.awaitingApproval
    case "awaitingEvaluator":
      return submissionOutcome.awaitingEvaluator(row.evaluatorName, row.evaluatorRole)
    case "revised":
      return submissionOutcome.revised(row.evaluatorName, row.evaluatorRole)
    case "selfEvalPending":
      return submissionOutcome.selfEvalPending
    case "draft":
      return submissionOutcome.draft
    default:
      return submissionOutcome.completed
  }
}

function ResultBadge({ row }: { row: LedgerRow }) {
  return <StatusBadge label={resultLabel(row)} tone={RESULT_TONE[row.state]} size="sm" />
}

/** Short ledger text for "Recorded". The full evaluation is one dialog away (RP-07). */
function recordedSummary(r: RecordedDetail | null): string {
  if (!r) return rc.dash
  switch (r.kind) {
    case "binary":
      return r.label
    case "demonstration":
      return r.level
    case "question":
      return `${r.yes} of ${r.total} Yes`
    case "scored":
      return rc.detail.average(r.average)
  }
}

// ----------------------------------------------------------------- the three dialog containers

export function ReportDialogs(props: ReportDialogsProps) {
  const { db, params, onParams } = props
  const student = params.student ? db.students.find((s) => s.id === params.student) : undefined
  const closeAll = () => onParams({ ...params, student: null, skill: null, evaluation: null, bySkill: null, byTag: null }, "push")
  const focusBack = (selector: string) => (e: Event) => {
    const target = document.querySelector<HTMLElement>(selector)
    if (target) {
      e.preventDefault()
      target.focus()
    }
  }
  return (
    <>
      <StudentDialog {...props} student={student} onClose={closeAll} onCloseAutoFocus={focusBack(params.student ? `[data-student-id="${params.student}"]` : "[data-rail-trigger]")} />
      <SkillDialog {...props} onClose={closeAll} onCloseAutoFocus={focusBack(params.bySkill ? `[data-skill-id="${params.bySkill}"]` : "[data-rail-trigger]")} />
      <TagDialog {...props} onClose={closeAll} onCloseAutoFocus={focusBack(params.byTag ? `[data-tag-id="${params.byTag}"]` : "[data-rail-trigger]")} />
    </>
  )
}

function Loading() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}

// ----------------------------------------------------------------- S-02: one student (prototype P-02)

function StudentDialog(props: ReportDialogsProps & { student?: { id: string; name: string }; onClose: () => void; onCloseAutoFocus: (e: Event) => void }) {
  const { db, display, params, onParams, status = "ready", student } = props
  const open = Boolean(params.student)
  const f = dialogFilters(params)
  const o = student ? studentOverview(db, student.id, f) : null
  const title = student?.name ?? rc.rail.label
  const subtitle = o ? r4.studentDialog.subline(o.cohortName, o.groupName, o.counts.achieved, o.rows.length) : undefined
  return (
    <DialogShell
      open={open}
      onClose={props.onClose}
      title={title}
      description={subtitle}
      label="student"
      onCloseAutoFocus={props.onCloseAutoFocus}
    >
      {status === "loading" ? (
        <Loading />
      ) : status === "error" ? (
        <LocalBanner variant="error" action={props.onRetry ? { label: buttons.retry, onClick: props.onRetry } : undefined}>
          {rc.rail.errorStudent}
        </LocalBanner>
      ) : !student || !o ? (
        <LocalBanner variant="info">{rc.rail.noAccess}</LocalBanner>
      ) : (
        <StudentBody db={db} display={display} params={params} onParams={onParams} overview={o} />
      )}
      <EvaluationDialog {...props} onCloseAutoFocus={props.onCloseAutoFocus} />
    </DialogShell>
  )
}

type Overview = NonNullable<ReturnType<typeof studentOverview>>

function StudentBody({ db, display, params, onParams, overview: o }: { db: Db; display: SkillStatusDisplay; params: OverviewParams; onParams: ReportDialogsProps["onParams"]; overview: Overview }) {
  const [only, setOnly] = React.useState<string | null>(null)
  const groups = counterGroups(display)
  const countOf = (states: SkillState[]) => o.rows.filter((r) => states.includes(r.progress.evaluation.state)).length
  const active = groups.find((g) => g.key === only)
  const rows = active ? o.rows.filter((r) => active.states.includes(r.progress.evaluation.state)) : o.rows
  const toggleSkill = (id: string) => onParams({ ...params, skill: params.skill === id ? null : id, evaluation: null }, "push")
  return (
    <>
      <EvidenceScopeNote db={db} params={params} onParams={onParams} />
      {params.filters.offeringId ? <p className="text-xs text-muted-foreground">{rc.courseScoped}</p> : null}
      <section aria-label={rc.rail.counters} className={`grid gap-3 ${groups.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        {groups.map((g) => {
          const n = countOf(g.states)
          return (
            <div key={g.key} className="flex flex-col gap-1 rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">{g.label}</p>
              <p className={`text-2xl font-semibold tabular-nums`} data-testid={`counter-${g.key}`}>
                {n}
              </p>
              {n > 0 ? (
                <Button type="button" variant="link" size="sm" className="h-auto justify-start p-0" aria-pressed={only === g.key} aria-label={`${g.label}: ${buttons.showTheseOnly.toLowerCase()}`} onClick={() => setOnly(only === g.key ? null : g.key)}>
                  {only === g.key ? r4.studentDialog.showAll : r4.studentDialog.showThese}
                  <i className="fa-light fa-chevron-right" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          )
        })}
      </section>
      {active ? <p className="text-sm text-muted-foreground">{rc.rail.onlyShowing(active.label)}</p> : null}
      {o.rows.length === 0 ? (
        <EmptyState icon="fa-list-check" title={surface.s02.empty} headingLevel={3} />
      ) : (
        <ul className="flex flex-col gap-3" aria-label={r4.studentDialog.skillsList}>
          {rows.map(({ skill, progress }) => {
            const expanded = params.skill === skill.id
            const model = rc.models[skill.model.kind]
            const parts = criteriaParts(db, skill)
            const noun = progress.total.noun === "demonstrations" ? "demonstrations" : "qualifying evaluations"
            const fr = failedRule(db, o.student.id, skill.id)
            const waiting = fr?.waiting.length ?? 0
            const pct = progress.total.needed ? Math.min(100, Math.round((progress.total.have / progress.total.needed) * 100)) : 0
            return (
              <li key={skill.id} className="rounded-lg border border-border" data-skill-row={skill.id}>
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-expanded={expanded}
                    aria-label={expanded ? r4.studentDialog.collapse(skill.name) : r4.studentDialog.expand(skill.name)}
                    onClick={() => toggleSkill(skill.id)}
                  >
                    <i className={`fa-light ${expanded ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true" />
                  </Button>
                  <div className="flex min-w-48 flex-1 flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto justify-start p-0 text-left font-medium"
                      aria-label={rc.rail.skillRow(skill.name, statusText(progress.evaluation.state, display), progress.total.have, progress.total.needed)}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {skill.name}
                    </Button>
                    <p className="text-xs text-muted-foreground">{r4.studentDialog.needs(model, criteriaSummary(parts))}</p>
                  </div>
                  <span className="w-28" aria-hidden="true">
                    <ProgressCell value={pct} max={100} tone={progress.evaluation.state === "achieved" ? "success" : "warning"} label={false} className="w-full min-w-0 max-w-none" />
                  </span>
                  <p className="text-xs text-muted-foreground tabular-nums">{r4.studentDialog.progress(progress.total.have, progress.total.needed, noun)}</p>
                  <SkillStatusBadgeView state={progress.evaluation.state} display={display} />
                </div>
                <div className="flex flex-col gap-1 px-3 pb-3 ps-14 empty:hidden">
                  <SettingProgress progress={progress} />
                  <StillNeeded progress={progress} />
                  {waiting > 0 ? <p className="text-xs text-muted-foreground">{rc.rail.waiting(waiting)}</p> : null}
                </div>
                {expanded ? <Ledger db={db} studentId={o.student.id} skillId={skill.id} params={params} onParams={onParams} /> : null}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

const statusText = (s: SkillState, d: SkillStatusDisplay) => (d === "four" ? { noEvidence: "No evidence yet", evidenceDoesNotQualify: "Evidence does not qualify", partial: "In progress", achieved: "Achieved" }[s] : { noEvidence: "Not met", evidenceDoesNotQualify: "Not met", partial: "In progress", achieved: "Achieved" }[s])

// ----------------------------------------------------------------- S-03: the evidence ledger inside the student dialog

function filterLedger(db: Db, rows: LedgerRow[], f: ReportFilters): LedgerRow[] {
  const ev = evidenceFilterOf(f)
  if (!ev) return rows
  const loc = f.locationId ? db.locations.find((l) => l.id === f.locationId)?.name : undefined
  const set = f.settingId && f.settingId !== "lab" ? db.clinicalSettings.find((s) => s.id === f.settingId)?.name : undefined
  return rows.filter((r) => {
    if (f.settingId === "lab" ? r.performedIn !== "lab" : set && r.settingName !== set) return false
    if (loc && r.locationName !== loc) return false
    return true
  })
}

function Ledger({ db, studentId, skillId, params, onParams }: { db: Db; studentId: string; skillId: string; params: OverviewParams; onParams: ReportDialogsProps["onParams"] }) {
  const skill = db.skills.find((s) => s.id === skillId)
  const f = dialogFilters(params)
  const all = evidenceLedger(db, studentId, skillId)
  const rows = filterLedger(db, all, f)
  const progress = skillProgress(db, studentId, skillId, evidenceFilterOf(f))
  if (!skill) return null
  const filterActive = hasEvidenceFilter(params.filters)
  const counted = rows.filter((r) => r.state === "counted").length
  const open = (r: LedgerRow) => onParams({ ...params, evaluation: r.submissionId }, "push")
  const cols: Col<LedgerRow>[] = [
    col<LedgerRow>("date", r4.studentDialog.ledgerHeaders[0], 110, (r) => <span className="tabular-nums">{isoDate(r.date)}</span>),
    col<LedgerRow>("setting", r4.studentDialog.ledgerHeaders[1], 200, (r) =>
      r.performedIn === "lab" ? (
        <Badge variant="outline">{r4.studentDialog.labSetting}</Badge>
      ) : (
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <Badge variant="secondary">{r4.studentDialog.clinical}</Badge>
            <span className="text-xs">{r.settingName ?? rc.dash}</span>
          </span>
          <span className="text-xs text-muted-foreground">{r.locationName ?? rc.dash}</span>
        </span>
      ),
    ),
    col<LedgerRow>("evaluator", r4.studentDialog.ledgerHeaders[2], 170, (r) => (
      <span className="flex flex-col">
        <span>{r.evaluatorName}</span>
        <span className="text-xs text-muted-foreground">{r.evaluatorRole}</span>
      </span>
    )),
    col<LedgerRow>("recorded", r4.studentDialog.ledgerHeaders[3], 170, (r) => (
      <span className="flex flex-col gap-1">
        <span>{recordedSummary(r.recorded)}</span>
        {r.comment ? <span className="text-xs italic text-muted-foreground">{r4.studentDialog.commentLine(r.evaluatorRole, r.comment)}</span> : null}
      </span>
    )),
    col<LedgerRow>("result", r4.studentDialog.ledgerHeaders[4], 320, (r) => (
      <span className="flex items-center justify-between gap-2">
        <ResultBadge row={r} />
        {r.evaluationId ? (
          <Button type="button" variant="ghost" size="sm" aria-label={r4.studentDialog.viewFormAria(isoDate(r.date), r.evaluatorName)} onClick={() => open(r)}>
            <i className="fa-light fa-eye" aria-hidden="true" />
            {r4.studentDialog.viewForm}
          </Button>
        ) : null}
      </span>
    )),
  ]
  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/30 p-3" data-testid={`ledger-${skillId}`}>
      {progress && progress.levels.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">{r4.studentDialog.levelsLabel}</span>
          {progress.levels.map((l) => (
            <Badge key={l.levelId} variant="outline">
              {l.label}: {l.have} / {l.min}
            </Badge>
          ))}
        </div>
      ) : null}
      {filterActive ? <p className="text-xs text-muted-foreground">{rc.evidence.countsFiltered}</p> : null}
      <h3 className="sr-only">{surface.s03.ledgerHeading(skill.name)}</h3>
      <p className="text-xs text-muted-foreground">{rc.evidence.countedHeader(counted, rows.length)}</p>
      {rows.length === 0 ? (
        all.length > 0 && filterActive && !params.showAllEvidence ? (
          <LocalBanner variant="info" action={{ label: rc.showAllEvidence, onClick: () => onParams({ ...params, showAllEvidence: true }) }}>
            {rc.evidence.filteredEmpty}
          </LocalBanner>
        ) : (
          <EmptyState icon="fa-clipboard-list" title={rc.evidence.empty} headingLevel={3} />
        )
      ) : (
        <Grid caption={surface.s03.ledgerHeading(skill.name)} rows={rows} id={(r) => r.submissionId} columns={cols} openRowId={params.evaluation} onOpen={(r) => (r.evaluationId ? open(r) : undefined)} empty={null} />
      )}
    </div>
  )
}

// ----------------------------------------------------------------- S-03: one evaluation, read-only (RP-07, RV-03), a second dialog stacked on the first

/** The answered control rendered read-only, like the prototype: the chosen option is marked with a check, the others are shown. */
function ReadOnlyOutcome({ db, skillId, r }: { db: Db; skillId: string; r: RecordedDetail }) {
  const skill = db.skills.find((s) => s.id === skillId)
  const model = skill?.model
  if (r.kind === "demonstration" && model?.kind === "demonstration") {
    return <Options options={model.levels.map((l) => l.label)} selected={r.level} label="Demonstration outcome" />
  }
  if (r.kind === "binary" && model?.kind === "binary") {
    return <Options options={[model.labels.a.label, model.labels.b.label]} selected={r.label} label="Outcome" />
  }
  if (r.kind === "question") {
    return (
      <>
        <p className="text-muted-foreground">{rc.detail.yesOf(r.yes, r.total)}</p>
        <dl className="flex flex-col gap-1">
          {r.items.map((i) => (
            <div key={i.id} className="flex justify-between gap-3">
              <dt>{i.text}</dt>
              <dd className="font-medium">{i.yes ? "Yes" : "No"}</dd>
            </div>
          ))}
        </dl>
      </>
    )
  }
  if (r.kind === "scored") {
    return (
      <>
        <p className="text-muted-foreground">
          {rc.detail.average(r.average)}. {rc.detail.total(r.total)}
        </p>
        <dl className="flex flex-col gap-1">
          {r.items.map((i) => (
            <div key={i.id} className="flex justify-between gap-3">
              <dt>{i.text}</dt>
              <dd className="font-medium">{i.score === undefined ? "Not scored" : rc.detail.score(i.score)}</dd>
            </div>
          ))}
        </dl>
      </>
    )
  }
  return <p>{recordedSummary(r)}</p>
}

function Options({ options, selected, label }: { options: string[]; selected: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="flex flex-wrap gap-2" aria-label={label}>
        {options.map((o) => {
          const on = o === selected
          return (
            <li key={o}>
              <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${on ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`} aria-current={on ? "true" : undefined}>
                <i className={`fa-light ${on ? "fa-circle-check" : "fa-circle"}`} aria-hidden="true" />
                {o}
                {on ? <span className="sr-only"> (recorded)</span> : null}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function EvaluationDialog({ db, params, onParams, onCloseAutoFocus }: ReportDialogsProps & { onCloseAutoFocus: (e: Event) => void }) {
  const studentId = params.student
  const skillId = params.skill
  const skill = skillId ? db.skills.find((s) => s.id === skillId) : undefined
  const student = studentId ? db.students.find((s) => s.id === studentId) : undefined
  const row = studentId && skillId ? evidenceLedger(db, studentId, skillId).find((r) => r.submissionId === params.evaluation) : undefined
  const open = Boolean(params.evaluation && skill && student && row)
  const closeThis = () => onParams({ ...params, evaluation: null }, "push")
  const fr = row && studentId && skillId ? failedRule(db, studentId, skillId, row.submissionId) : null
  const ctx = skill ? ruleContext(db, skill) : null
  const reasons = row && skill && ctx && row.state === "didNotMeet" ? (fr?.evaluationReasons ?? []).map((r) => didNotMeetSentence(evaluationReasonText(r, ctx), "").trim()) : []
  const offering = row ? db.offerings.find((o) => o.id === row.offeringId) : undefined
  const subline = row ? [isoDate(row.date), row.performedIn === "lab" ? r4.studentDialog.labSetting : `${r4.studentDialog.clinical} (${row.settingName ?? rc.dash})`, row.locationName ?? rc.dash, offering ? `${offering.code}` : ""].filter(Boolean).join(" · ") : ""
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? closeThis() : undefined)}>
      <DialogContent className={LARGE} data-dialog="evaluation" onCloseAutoFocus={onCloseAutoFocus} onOpenAutoFocus={focusContent}>
        {skill && student && row ? (
          <>
            <DialogHeader className="border-b border-border px-6 py-4 text-left">
              <DialogTitle className="text-base">{r4.evaluation.title(skill.name, student.name)}</DialogTitle>
              <DialogDescription className="text-xs">{subline}</DialogDescription>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={r4.evaluation.completed} tone="success" size="sm" />
                <ResultBadge row={row} />
                <span className="text-xs text-muted-foreground">
                  {row.evaluatorName} ({row.evaluatorRole})
                </span>
                {row.revision > 0 ? <Badge variant="outline">Revised and resent {row.revision} {row.revision === 1 ? "time" : "times"}</Badge> : null}
              </div>
              {row.state === "awaitingApproval" ? <LocalBanner variant="info">{rc.detail.waitingApproval}</LocalBanner> : null}
              {row.state === "returned" ? <LocalBanner variant="info">{rc.detail.returned}</LocalBanner> : null}
              {reasons.length ? (
                <LocalBanner variant="warning" title={rc.evidence.reasonTitle}>
                  {reasons.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </LocalBanner>
              ) : null}
              <section className="rounded-lg border border-border" aria-labelledby="eval-supplied">
                <h3 id="eval-supplied" className="border-b border-border px-4 py-3 text-sm font-semibold">
                  {r4.evaluation.supplied}
                </h3>
                <dl className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-3 text-xs">
                  {row.values.map((v) => (
                    <div key={v.label} className="flex gap-1">
                      <dt className="text-muted-foreground">{v.label}:</dt>
                      <dd>{String(v.value)}</dd>
                    </div>
                  ))}
                  {row.studentNote ? (
                    <div className="flex gap-1">
                      <dt className="text-muted-foreground">{rc.detail.note}:</dt>
                      <dd>{row.studentNote}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>
              <section className="rounded-lg border border-border" aria-labelledby="eval-responses">
                <div className="border-b border-border px-4 py-3">
                  <h3 id="eval-responses" className="text-sm font-semibold">
                    {r4.evaluation.responses(row.evaluatorRole)}
                  </h3>
                  {row.recorded ? <p className="text-xs text-muted-foreground">{recordedSummary(row.recorded)}</p> : null}
                </div>
                <div className="flex flex-col gap-3 px-4 py-3 text-sm">
                  {row.recorded ? <ReadOnlyOutcome db={db} skillId={skill.id} r={row.recorded} /> : <p className="text-muted-foreground">{rc.detail.noQuestions}</p>}
                  <div className="flex flex-col gap-1 border-t border-border pt-3" aria-labelledby="eval-comment">
                    <h4 id="eval-comment" className="text-xs font-medium text-muted-foreground">
                      {r4.evaluation.comment}
                    </h4>
                    <p className={row.comment ? "" : "text-muted-foreground"}>{row.comment || r4.evaluation.none}</p>
                  </div>
                </div>
              </section>
              {row.selfEvaluation ? (
                <section className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3 text-sm" aria-labelledby="eval-self">
                  <h3 id="eval-self" className="text-sm font-semibold">
                    {rc.detail.selfEval}
                  </h3>
                  <ReadOnlyOutcome db={db} skillId={skill.id} r={row.selfEvaluation} />
                </section>
              ) : null}
              {row.reviewerNote ? (
                <section className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3 text-sm" aria-labelledby="eval-review">
                  <h3 id="eval-review" className="text-sm font-semibold">
                    {rc.detail.reviewNote}
                  </h3>
                  <p>{row.reviewerNote}</p>
                </section>
              ) : null}
            </div>
            <DialogFooter className="m-0 rounded-none border-t border-border px-6 py-3">
              <Button type="button" variant="default" size="default" onClick={closeThis}>
                {r4.evaluation.close}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

// ----------------------------------------------------------------- RP-05: By skill row opens the skill dialog (prototype P-01b)

function SkillDialog(props: ReportDialogsProps & { onClose: () => void; onCloseAutoFocus: (e: Event) => void }) {
  const { db, display, params, onParams } = props
  const skill = params.bySkill && !params.student ? db.skills.find((s) => s.id === params.bySkill) : undefined
  const open = Boolean(skill)
  const [tab, setTab] = React.useState(0)
  React.useEffect(() => setTab(0), [params.bySkill])
  const data = React.useMemo(() => {
    if (!skill) return null
    const { records } = scopedRecords(db, params.filters)
    const mine = records.filter((r) => r.skillId === skill.id)
    const rows = mine
      .map((r) => {
        const st = db.students.find((s) => s.id === r.studentId)!
        const progress = skillProgress(db, r.studentId, skill.id, evidenceFilterOf(params.filters))
        const evidence = evidenceLedger(db, r.studentId, skill.id).length
        return { st, state: r.evaluation.state as SkillState, progress, evidence }
      })
      .sort((a, b) => stateRank(a.state) - stateRank(b.state) || a.st.name.localeCompare(b.st.name))
    const total = reportBySkill(db, params.filters).rows.find((x) => x.skill.id === skill.id)
    return { rows, total }
  }, [db, params.filters, skill])
  const groups = counterGroups(display)
  const tabs = groups.map((g) => ({ ...g, n: data ? data.rows.filter((r) => g.states.includes(r.state)).length : 0 }))
  const current = tabs[Math.min(tab, tabs.length - 1)]
  const shown = data && current ? data.rows.filter((r) => current.states.includes(r.state)) : []
  const steps = skill ? lineageSteps(skill.model, skill.criteria, criteriaParts(db, skill), display).slice(0, 4) : []
  const cols: Col<(typeof shown)[number]>[] = [
    col("student", r4.skillDialog.headers[0], 190, (r) => (
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-left font-medium"
        aria-label={`${r.st.name}: view evidence`}
        onClick={() => onParams({ ...params, student: r.st.id, skill: skill!.id, evaluation: null, bySkill: null, byTag: null }, "push")}
      >
        {r.st.name}
      </Button>
    )),
    col("group", r4.skillDialog.headers[1], 160, (r) => <span className="text-xs">{`${db.cohorts.find((c) => c.id === r.st.cohortId)?.name ?? ""} · ${db.groups.find((g) => g.id === r.st.groupId)?.name ?? ""}`}</span>),
    col("progress", r4.skillDialog.headers[2], 240, (r) => (
      <span className="flex items-center gap-3">
        <span className="w-24" aria-hidden="true">
          <ProgressCell value={r.progress?.total.needed ? Math.min(100, Math.round((r.progress.total.have / r.progress.total.needed) * 100)) : 0} max={100} tone={r.state === "achieved" ? "success" : "warning"} label={false} className="w-full min-w-0 max-w-none" />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">{r.progress ? totalText(r.progress).replace(" of ", " / ") : rc.dash}</span>
      </span>
    )),
    col("evidence", r4.skillDialog.headers[3], 100, (r) => <span className="tabular-nums">{r.evidence}</span>),
    col("status", r4.skillDialog.headers[4], 160, (r) => <SkillStatusBadgeView state={r.state} display={display} />),
  ]
  return (
    <DialogShell
      open={open}
      onClose={props.onClose}
      title={skill?.name ?? ""}
      description={data?.total ? r4.skillDialog.summary(data.total.counts.achieved, data.total.studentsInView, data.total.percentAchieved) : undefined}
      label="skill"
      onCloseAutoFocus={props.onCloseAutoFocus}
    >
      {skill && data ? (
        <>
          <section className="flex flex-col gap-2 rounded-lg border border-border p-4" aria-label={r4.skillDialog.how}>
            <h3 className="text-xs font-semibold text-muted-foreground">{r4.skillDialog.how}</h3>
            <ul className="flex flex-wrap items-center gap-2">
              {steps.map((s, i) => (
                <li key={s.label} className="flex items-center gap-2">
                  <Badge variant="outline">{s.value}</Badge>
                  {i < steps.length - 1 ? <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" /> : null}
                </li>
              ))}
            </ul>
          </section>
          <Tabs value={String(Math.min(tab, tabs.length - 1))} onValueChange={(v) => setTab(Number(v))}>
            <TabsList variant="line" aria-label="Students by status">
              {tabs.map((t, i) => (
                <TabsTrigger key={t.key} value={String(i)}>
                  {t.label} ({t.n})
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={String(Math.min(tab, tabs.length - 1))}>
              {shown.length === 0 ? <EmptyState icon="fa-users" title={surface.s01.emptyStudents} headingLevel={3} /> : <Grid caption={`Students for ${skill.name}`} rows={shown} id={(r) => r.st.id} columns={cols} openRowId={null} onOpen={(r) => onParams({ ...params, student: r.st.id, skill: skill.id, evaluation: null, bySkill: null, byTag: null }, "push")} empty={null} />}
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </DialogShell>
  )
}

// ----------------------------------------------------------------- RP-04/05: By tag row opens the tag dialog (prototype P-01b)

function TagDialog(props: ReportDialogsProps & { onClose: () => void; onCloseAutoFocus: (e: Event) => void }) {
  const { db, params, onParams } = props
  const tag = params.byTag && !params.student && !params.bySkill ? db.tags.find((t) => t.id === params.byTag) : undefined
  const open = Boolean(tag)
  const data = React.useMemo(() => {
    if (!tag) return null
    const t = reportByTag(db, params.filters).rows.find((r) => r.tag.id === tag.id)
    const skills = reportBySkill(db, params.filters).rows.filter((r) => r.skill.tagIds.includes(tag.id))
    return { t, skills }
  }, [db, params.filters, tag])
  const cols: Col<NonNullable<typeof data>["skills"][number]>[] = [
    col("skill", r4.tagDialog.headers[0], 220, (r) => (
      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-left font-medium" onClick={() => onParams({ ...params, byTag: null, bySkill: r.skill.id, student: null, skill: null, evaluation: null }, "push")}>
        {r.skill.name}
      </Button>
    )),
    col("category", r4.tagDialog.headers[1], 150, (r) => <span className="text-xs">{r.category?.name ?? rc.dash}</span>),
    col("model", r4.tagDialog.headers[2], 200, (r) => <Badge variant="secondary">{rc.models[r.skill.model.kind]}</Badge>),
    col("pct", r4.tagDialog.headers[3], 160, (r) => (
      <span className="flex items-center gap-3 tabular-nums">
        <span>{r.percentAchieved}%</span>
        <span className="w-20" aria-hidden="true">
          <ProgressCell value={r.percentAchieved} max={100} tone="warning" label={false} className="w-full min-w-0 max-w-none" />
        </span>
      </span>
    )),
  ]
  const kpis = data?.t ? [data.t.counts.achieved, data.t.counts.partial, data.t.studentsAchievingAll] : []
  return (
    <DialogShell open={open} onClose={props.onClose} title={tag?.name ?? ""} description={data?.t ? `${r4.tagDialog.summary(data.t.skillCount, data.t.percentAchieved)}. ${r4.tagDialog.description}` : undefined} label="tag" onCloseAutoFocus={props.onCloseAutoFocus}>
      {tag && data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Tag figures">
            {r4.tagDialog.kpis.map((label, i) => (
              <div key={label} className="flex flex-col gap-1 rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold tabular-nums">{kpis[i] ?? 0}</p>
              </div>
            ))}
          </section>
          <Grid caption={`Skills in ${tag.name}`} rows={data.skills} id={(r) => r.skill.id} columns={cols} openRowId={null} onOpen={(r) => onParams({ ...params, byTag: null, bySkill: r.skill.id, student: null, skill: null, evaluation: null }, "push")} empty={<EmptyState icon="fa-list-check" title={surface.s01.emptySkills} headingLevel={3} />} />
        </>
      ) : null}
    </DialogShell>
  )
}
