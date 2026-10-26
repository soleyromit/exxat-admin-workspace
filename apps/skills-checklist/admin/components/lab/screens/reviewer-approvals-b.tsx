"use client"

/**
 * Approvals B, split view. A narrow queue (student and skill, why held, waiting) stays in place while the DS FloatingSheetPanel beside
 * it shows the open submission: why held, the rule check in numbers, self versus evaluator answers, and one decision bar. The queue
 * beside it is the navigator (click any row); a decision moves the panel to the next submission, so you never lose your place. The
 * open submission is in the URL (`item`), so a pasted link restores it.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { EmptyBlock } from "@/components/lab/empty-block"
import { initialsOf } from "@/lib/v2/format"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { Separator } from "@exxatdesignux/ui/components/ui/separator"
import { itemDetail, reviewItemHref, ruleCheck, type ReviewRow } from "@/lib/lab/reviewer"
import { skillNoun } from "@/lib/lab/terms"
import { ApprovalsFrame, type ApprovalsContext } from "@/components/lab/reviewer/approvals-frame"
import { AgeText, ReasonBadge, SummaryLine } from "@/components/lab/reviewer/parts"
import { LINK as LINK_U } from "@/components/lab/link-styles"
import { CompareTable, DecisionBar, Facts, Feedback, RuleCheckLine, WhyHeld } from "@/components/lab/reviewer/review-parts"

export function ReviewerApprovalsB() {
  return <ApprovalsFrame variant="B">{(ctx) => <Split ctx={ctx} />}</ApprovalsFrame>
}

function Split({ ctx }: { ctx: ApprovalsContext }) {
  const rows = ctx.rowsInScope
  const want = ctx.param("item")
  // After a decision the open row leaves the queue: keep the same position, which is now the next submission.
  const lastIndex = React.useRef(0)
  const openKey = want === "none" ? null : rows.some((r) => r.key === want) ? want : (rows[Math.min(lastIndex.current, rows.length - 1)]?.key ?? null)
  const index = rows.findIndex((r) => r.key === openKey)
  if (index >= 0) lastIndex.current = index
  const go = (k: string | null) => ctx.setParams({ item: k ?? "none" })
  const detail = React.useMemo(() => (ctx.state && openKey ? itemDetail(ctx.state, ctx.rows, openKey) : null), [ctx.state, ctx.rows, openKey])
  const { setRail } = ctx
  React.useEffect(() => {
    setRail(!!detail)
    return () => setRail(false)
  }, [detail, setRail])
  const checks = React.useMemo(() => (ctx.state && detail ? ruleCheck(ctx.state, detail.row) : []), [ctx.state, detail])

  const columns: ColumnDef<ReviewRow>[] = [
    {
      key: "student",
      label: `Student and ${skillNoun()}`,
      width: 240,
      cell: (r) => (
        <PersonIdentityCell
          name={r.student}
          initials={initialsOf(r.student)}
          renderName={(n) => (
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{n}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{r.skills.length > 1 ? `${r.skills[0]} and ${r.skills.length - 1} more` : r.skills[0]}</span>
            </span>
          )}
        />
      ),
    },
    { key: "why", label: "Why held", width: 196, cell: (r) => <ReasonBadge reason={r.reason} /> },
    { key: "days", label: "Waiting", width: 92, cell: (r) => <AgeText days={r.days} /> },
  ]

  return (
    <>
      <SummaryLine summary={ctx.summary!} />
      <div data-region="table">
        <DataTable<ReviewRow>
          data={rows}
          columns={columns}
          getRowId={(r) => r.key}
          openRowId={openKey}
          onRowClick={(r) => go(r.key)}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          emptyState={<EmptyBlock compact title="No submissions wait in this scope" />}
        />
      </div>
      <FloatingSheetPanel open={!!detail} onOpenChange={(o) => (o ? null : go(null))} modal={false}>
        <FloatingSheetPanelContent contentSlot="lab-reviewer-split" size="md">
          {detail ? (
            <>
              {/* Split-view budget (strategy/07 section 3): the queue beside the panel is the navigator and a decision moves to the
                  next submission, so the panel keeps Close only (no size menu, no Previous/Next that repeat the visible list). */}
              <FloatingSheetPanelToolbar showSize={false} closeLabel="Close submission" />
              <FloatingSheetPanelHeader title={detail.row.student} subtitle={`${index + 1} of ${rows.length} · ${detail.row.skills.join(", ")}`} />
              <FloatingSheetPanelBody className="flex flex-col gap-4 px-4 pt-1 pb-4">
                <WhyHeld row={detail.row} />
                <section aria-label="What approval does" className="flex flex-col gap-1.5">
                  {checks.map((c) => <RuleCheckLine key={c.skillId} check={c} />)}
                </section>
                <Separator />
                <section aria-label="Self and evaluator answers" className="flex flex-col gap-4">
                  {detail.comparisons.length ? detail.comparisons.map((c) => <CompareTable key={c.evaluationId} c={c} />) : <p className="text-sm text-muted-foreground">The outcome is on the photo of the paper form and has not been entered.</p>}
                  <Feedback text={detail.feedback} />
                </section>
                <Separator />
                <Facts d={detail} scope={ctx.scope} />
                <Link className={`${LINK_U} self-start text-sm`} href={reviewItemHref(ctx.scope, detail.row.key)}>Open the full submission</Link>
              </FloatingSheetPanelBody>
              <FloatingSheetPanelFooter>
                <DecisionBar row={detail.row} />
              </FloatingSheetPanelFooter>
            </>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </>
  )
}
