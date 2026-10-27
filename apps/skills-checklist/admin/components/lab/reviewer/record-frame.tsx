"use client"

/**
 * Chrome for the reviewer's Student record: breadcrumb Students > Student record, the student's name and cohort, the shared scope
 * carried in every link (the record is the whole student, so the scope only travels on), and the shared tables. `?student=` names
 * the student; without it the student of the oldest waiting submission opens. Counted evaluations offer "Request a correction",
 * never an edit [REQ RV-03, RV-05; strategy/03 D1]. Every evaluation opens in full, read only [REQ RP-07]: `?evaluation=` names
 * one (so the attainment peek and a pasted link land on it); `?skill=` without a skill panel opens every evaluation of that skill
 * (the director's Evidence count). The sheet is components/lab/reviewer/evaluation-sheet.tsx.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@exxatdesignux/ui/components/ui/breadcrumb"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { PageFrame } from "@/components/skills/page-header"
import { reviewItemHref, studentRecord, type RecordEvaluation, type RecordSkill, type StudentRecordModel } from "@/lib/lab/reviewer"
import { withScope, type LabScope } from "@/lib/lab/scope"
import { capitalize, skillNoun } from "@/lib/lab/terms"
import { DecisionBanner, DecisionProvider, useDecisionUi } from "@/components/lab/reviewer/decisions"
import { QueueSkeleton, RecordStatusBadge, SkillStateBadge } from "@/components/lab/reviewer/parts"
import { useReviewer, type ReviewerContext } from "@/components/lab/reviewer/use-reviewer"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { EmptyBlock } from "@/components/lab/empty-block"
import { LINK as LINK_U } from "@/components/lab/link-styles"
import { longDate } from "@/lib/v2/format"
import { evaluationView, evaluationViewsFor, type EvaluationView } from "@/lib/lab/evaluation-view"
import { EvaluationSheet } from "@/components/lab/reviewer/evaluation-sheet"

export interface RecordContext extends ReviewerContext {
  record: StudentRecordModel
}

/** Opens one evaluation in full (RP-07). The record's tables call it; the frame owns the sheet and the URL. */
const EvaluationOpenContext = React.createContext<((id: string) => void) | null>(null)
export const useOpenEvaluation = () => React.useContext(EvaluationOpenContext)

/** Records carry the year (consistency audit item 8: longDate in records). */
const dateLabel = longDate

export function RecordFrame({ variant, children, evaluationInPanel }: { variant: string; children: (ctx: RecordContext) => React.ReactNode; /** True when the variant shows the open evaluation inside its own panel (B's skill panel). */ evaluationInPanel?: (param: (k: string) => string | null) => boolean }) {
  const ctx = useReviewer()
  const evalId = ctx.param("evaluation")
  const skillParam = ctx.param("skill")
  const inPanel = evaluationInPanel ? evaluationInPanel(ctx.param) : false
  const views = React.useMemo<EvaluationView[] | null>(() => {
    if (!ctx.state || inPanel) return null
    if (evalId) {
      const v = evaluationView(ctx.state, evalId)
      return v ? [v] : null
    }
    const sid = ctx.param("student")
    return skillParam && sid ? evaluationViewsFor(ctx.state, sid, skillParam) : null
  }, [ctx, evalId, skillParam, inPanel])
  const openEvaluation = React.useCallback((id: string) => ctx.setParams({ evaluation: id }), [ctx])
  const closeEvaluation = React.useCallback(() => ctx.setParams({ evaluation: null, ...(evaluationInPanel ? {} : { skill: null }) }), [ctx, evaluationInPanel])
  const corrections = React.useMemo(() => new Set(ctx.decisions.flatMap((d) => (d.kind === "correction" ? [d.evaluationId] : []))), [ctx.decisions])
  const studentId = ctx.param("student") ?? ctx.scoped?.rows[0]?.studentId ?? null
  const record = React.useMemo(() => (ctx.state && studentId ? studentRecord(ctx.state, ctx.rows, studentId, corrections) : null), [ctx.state, ctx.rows, studentId, corrections])
  const crumbs = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={withScope("/lab/reviewer/students", ctx.scope)}>Students</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Student record</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
  if (!ctx.ready) {
    return (
      <PageFrame title="Student record" lead={crumbs}>
        <QueueSkeleton rows={6} />
      </PageFrame>
    )
  }
  if (!record) {
    return (
      <PageFrame title="Student record" lead={crumbs}>
        <p className="text-sm text-muted-foreground">No student with this link. Open a student from Students or Approvals.</p>
      </PageFrame>
    )
  }
  return (
    <DecisionProvider state={ctx.state} rows={ctx.rows}>
      <PageFrame title={record.name} lead={crumbs} actions={<SampleDataBadge />}>
        <div className="flex flex-col gap-4" data-page-type="detail" data-reviewer-lab={`student-record-${variant}`}>
          <p className="text-sm text-muted-foreground">{record.group ? `${record.cohort}, ${record.group}` : record.cohort}</p>
          <DecisionBanner />
          <EvaluationOpenContext.Provider value={openEvaluation}>{children({ ...ctx, record })}</EvaluationOpenContext.Provider>
        </div>
        <EvaluationSheet views={views} onClose={closeEvaluation} />
      </PageFrame>
    </DecisionProvider>
  )
}

export function EvaluationsTable({ rows, scope, compact = false }: { rows: RecordEvaluation[]; scope: LabScope; compact?: boolean }) {
  const ui = useDecisionUi()
  const openEvaluation = useOpenEvaluation()
  const columns: ColumnDef<RecordEvaluation>[] = [
    ...(compact ? [] : ([{ key: "skill", label: capitalize(skillNoun()), width: 260, sortable: true, cell: (r) => <span className="truncate text-sm font-medium">{r.skill}</span> }] as ColumnDef<RecordEvaluation>[])),
    { key: "date", label: "Date", width: compact ? 110 : 120, sortable: true, cell: (r) => <span className="text-sm tabular-nums">{dateLabel(r.date)}</span> },
    { key: "status", label: "Status", width: compact ? 170 : 190, sortable: true, cell: (r) => <RecordStatusBadge status={r.status} /> },
    { key: "evaluator", label: "Evaluator", width: compact ? 130 : 180, cell: (r) => <span className="truncate text-sm">{r.evaluator}{r.evaluatorUnverified ? <span className="text-muted-foreground"> (new name)</span> : null}</span> },
    ...(compact ? [] : ([{ key: "setting", label: "Setting", width: 150, cell: (r) => <span className="truncate text-sm text-muted-foreground">{r.setting}</span> }] as ColumnDef<RecordEvaluation>[])),
    {
      key: "act",
      label: "Action",
      width: 132,
      resizable: false,
      header: () => <span className="sr-only">Action</span>,
      cell: (r) =>
        r.queueKey ? (
          <Link className={`${LINK_U} text-sm`} href={reviewItemHref(scope, r.queueKey)}>Review</Link>
        ) : (
          <span className="flex items-center gap-1">
            {/* RP-07: every recorded evaluation opens in full, read only. */}
            {openEvaluation ? (
              <Button type="button" variant="link" size="sm" className="h-auto p-0" aria-label={`View ${r.skill}, ${dateLabel(r.date)}`} onClick={() => openEvaluation(r.id)} {...railTriggerProps()}>
                View
              </Button>
            ) : null}
            {r.status === "Counted" || r.status === "Unmet" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`More for ${r.skill}, ${dateLabel(r.date)}`}>
                <i className="fa-light fa-ellipsis" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => ui.openCorrection({ id: r.id, skill: r.skill })}>Request a correction</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            ) : null}
          </span>
        ),
    },
  ]
  return (
    <DataTable<RecordEvaluation>
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      selectable={false}
      searchable={!compact}
      showQueryControls={!compact}
      edgeInset={false}
      lazyLoading={{ enabled: rows.length > 60 }}
      emptyState={<EmptyBlock compact title="No evaluations yet" />}
    />
  )
}

export function SkillsTable({ rows, onOpen }: { rows: RecordSkill[]; onOpen?: (skillId: string) => void }) {
  const columns: ColumnDef<RecordSkill>[] = [
    {
      key: "skill",
      label: capitalize(skillNoun()),
      width: 300,
      sortable: true,
      cell: (r) =>
        onOpen ? (
          <Button type="button" variant="link" size="sm" className="h-auto p-0 font-medium text-foreground" onClick={() => onOpen(r.skillId)} {...railTriggerProps()}>{r.skill}</Button>
        ) : (
          <span className="text-sm font-medium">{r.skill}</span>
        ),
    },
    { key: "category", label: "Section", width: 200, sortable: true, cell: (r) => <span className="truncate text-sm text-muted-foreground">{r.category}</span> },
    { key: "state", label: "State", width: 210, sortable: true, cell: (r) => <SkillStateBadge state={r.state} /> },
    { key: "numbers", label: "Counted", width: 110, cell: (r) => <span className="text-sm tabular-nums">{r.numbers}</span> },
    { key: "awaiting", label: "Awaiting approval", width: 150, cell: (r) => (r.awaiting ? <span className="text-sm tabular-nums">{r.awaiting}</span> : <span className="sr-only">None</span>) },
  ]
  return (
    <DataTable<RecordSkill>
      data={rows}
      columns={columns}
      getRowId={(r) => r.skillId}
      selectable={false}
      searchable
      showQueryControls
      edgeInset={false}
      emptyState={<EmptyBlock compact title={`No evidence on any ${skillNoun()} yet`} />}
    />
  )
}
