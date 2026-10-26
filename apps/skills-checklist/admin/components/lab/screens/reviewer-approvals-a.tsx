"use client"

/**
 * Approvals A, triage list. A thin summary line (waiting, oldest, median wait) over one DS DataTable ranked oldest first, with a
 * "Why held" column and inline Approve or Return on the obvious rows. Bulk approve only works on like rows (same reason, same outcome,
 * nothing blocking); anything else is named before confirm. `?state=error` shows the table's own error with retry; `?state=partial`
 * makes one selected row vanish mid-approve (a colleague got there first), so the bulk result is partial.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { bulkCheck, recordHref, reviewItemHref, type QueueSummary, type ReviewRow } from "@/lib/lab/reviewer"
import { capitalize, skillNoun } from "@/lib/lab/terms"
import type { LabScope } from "@/lib/lab/scope"
import { ApprovalsFrame, RegionError } from "@/components/lab/reviewer/approvals-frame"
import { EvaluatorMenu, useDecisionUi } from "@/components/lab/reviewer/decisions"
import { AgeText, EvaluatorName, ReasonBadge, SummaryLine } from "@/components/lab/reviewer/parts"
import { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"
import { EmptyBlock } from "@/components/lab/empty-block"
import { initialsOf } from "@/lib/v2/format"

export function ReviewerApprovalsA() {
  return (
    <ApprovalsFrame variant="A">
      {(ctx) => <Triage key={ctx.decisions.length} rows={ctx.rowsInScope} scope={ctx.scope} summary={ctx.summary!} errorDemo={ctx.demo === "error"} partialDemo={ctx.demo === "partial"} />}
    </ApprovalsFrame>
  )
}

function Triage({ rows, scope, summary, errorDemo, partialDemo }: { rows: ReviewRow[]; scope: LabScope; summary: QueueSummary; errorDemo: boolean; partialDemo: boolean }) {
  const ui = useDecisionUi()
  const [failed, setFailed] = React.useState(errorDemo)
  React.useEffect(() => setFailed(errorDemo), [errorDemo])
  const columns = React.useMemo(() => triageColumns(scope, ui), [scope, ui])

  return (
    <>
      <SummaryLine summary={summary} oldestHref={rows[0] ? reviewItemHref(scope, rows[0].key) : undefined} />
      {failed ? (
        <RegionError what="The queue" kept="The scope and counts above are current. Your decisions so far are kept." onRetry={() => setFailed(false)} />
      ) : (
        <div data-region="table">
          <DataTable<ReviewRow>
            data={rows}
            columns={columns}
            getRowId={(r) => r.key}
            getRowSelectionLabel={(r) => `${r.student}, ${r.skills.join(", ")}`}
            selectable
            searchable={false}
            showQueryControls={false}
            edgeInset={false}
            lazyLoading={{ enabled: rows.length > 60 }}
            bulkActionsSlot={(selected) => <BulkSlot rows={rows} selected={selected} partial={partialDemo} />}
            emptyState={<EmptyBlock compact title="No submissions wait in this scope" />}
          />
        </div>
      )}
    </>
  )
}

function BulkSlot({ rows, selected, partial }: { rows: ReviewRow[]; selected: Set<string | number>; partial: boolean }) {
  const ui = useDecisionUi()
  const check = bulkCheck(rows, selected)
  const gone = partial ? new Set([...selected].slice(0, 1).map(String)) : new Set<string>()
  if (!check.alike) return <span className="text-sm text-muted-foreground">Approve together only rows with the same reason</span>
  return (
    <Button type="button" variant="default" size="sm" onClick={() => ui.openBulk(selected, gone)}>
      {`Approve ${selected.size}`}
    </Button>
  )
}

function triageColumns(scope: LabScope, ui: ReturnType<typeof useDecisionUi>): ColumnDef<ReviewRow>[] {
  return [
    { key: "select", label: "Select", width: 44, resizable: false },
    {
      key: "student",
      label: "Student",
      width: 176,
      sortable: true,
      cell: (r) => <PersonIdentityCell name={r.student} initials={initialsOf(r.student)} renderName={(n) => <Link className={LINK} href={recordHref(scope, r.studentId)}>{n}</Link>} />,
    },
    {
      key: "skills",
      label: capitalize(skillNoun()),
      width: 210,
      cell: (r) => (
        <span className="flex min-w-0 flex-col py-0.5">
          <Link className={`${LINK} truncate`} href={reviewItemHref(scope, r.key)}>
            {r.skills.length > 1 ? `${r.skills[0]} and ${r.skills.length - 1} more` : r.skills[0]}
          </Link>
          <span className="truncate text-xs text-muted-foreground">{`${r.course} · ${r.setting}`}</span>
        </span>
      ),
    },
    { key: "days", label: "Waiting", width: 92, sortable: true, cell: (r) => <AgeText days={r.days} /> },
    {
      key: "why",
      label: "Why held",
      width: 210,
      cell: (r) => (
        <span className="flex min-w-0 flex-col items-start gap-1 py-0.5">
          <ReasonBadge reason={r.reason} />
          {r.reason === "disagree" || r.reason === "paper" ? <span className="max-w-full truncate text-xs text-muted-foreground" title={r.why}>{r.why}</span> : null}
        </span>
      ),
    },
    {
      key: "evaluator",
      label: "Evaluator",
      width: 160,
      sortable: true,
      cell: (r) => <EvaluatorName name={r.evaluator} role={r.evaluatorRole} unrecorded={!!r.evaluatorUnverified} />,
    },
    {
      key: "actions",
      label: "Decide",
      width: 210,
      resizable: false,
      defaultPin: "right",
      lockPin: true,
      header: () => <span className="sr-only">Decide</span>,
      cell: (r) =>
        r.likeKey ? (
          <span className="flex items-center gap-1">
            {/* Row Approve stays outline: a filled button on every row breaks the list budget (one primary per screen,
                strategy/07). The page's one filled action is the bulk "Approve n"; Return is the quieter ghost. */}
            <Button type="button" variant="outline" size="sm" onClick={() => ui.approve([r])} aria-label={`Approve ${r.student}, ${r.skills.join(", ")}`}>Approve</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => ui.openReturn(r)} aria-label={`Return ${r.student}, ${r.skills.join(", ")}`}>Return</Button>
          </span>
        ) : r.reason === "new-evaluator" ? (
          // One short menu instead of two buttons: adopt or merge the typed name, or assign the evidence to someone else.
          <EvaluatorMenu row={r} adoptLabel={`Adopt or merge ${r.evaluator}`} />
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href={reviewItemHref(scope, r.key)} aria-label={`Review ${r.student}, ${r.skills.join(", ")}`}>Review</Link>
          </Button>
        ),
    },
  ]
}
