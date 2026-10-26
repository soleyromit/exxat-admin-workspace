"use client"

/**
 * Evidence peek (REQ RP-05, RP-06): the records behind any count, opened beside the report so the reader never leaves it or
 * searches again. Non-modal DS FloatingSheetPanel; the reference is the URL `peek`, so a pasted link reopens it and the
 * matrix cell stays marked while it is open.
 *
 * - One student (a cell or a name): each required skill with its state and the evaluations behind it (date, evaluator,
 *   setting, outcome, counted or held). The full evaluation (RP-07) opens on the student record.
 * - Many students (a skill, section or tag count): one line per record, student and state; the student opens their record.
 * The list length always equals the count that opened it.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { studentHref } from "@/lib/lab/dashboard"
import { recordEvidence, type PeekModel } from "@/lib/lab/attainment"
import type { LabScope } from "@/lib/lab/scope"
import type { V2State } from "@/lib/v2/types"
import { StateBadge } from "@/components/lab/admin-b/state-viz"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"


export function EvidencePeek({ peek, data, evidence, scope, onClose }: { peek: PeekModel | null; data: V2State; evidence: V2State; scope: LabScope; onClose: () => void }) {
  return (
    <FloatingSheetPanel open={!!peek} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <FloatingSheetPanelContent contentSlot="lab-attainment-peek" size="md">
        <FloatingSheetPanelToolbar />
        {peek ? (
          <>
            <FloatingSheetPanelHeader title={peek.title} subtitle={peek.summary} />
            <FloatingSheetPanelBody className="flex flex-col gap-3 px-4 pb-4" data-peek-count={peek.records.length}>
              {peek.oneStudent && peek.studentId ? (
                <Button asChild variant="outline" size="sm" className="self-start">
                  <Link href={studentHref(scope, peek.studentId)}>Open the full record</Link>
                </Button>
              ) : null}
              <ul className="flex flex-col divide-y divide-border" aria-label={peek.summary}>
                {peek.records.map((r) => (
                  <li key={r.key} className="flex flex-col gap-2 py-3" data-peek-record>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col">
                        {peek.oneStudent ? (
                          <span className="text-sm font-medium text-foreground">{r.skill}</span>
                        ) : (
                          <Link className={`${LINK_IN_TABLE} text-sm`} href={studentHref(scope, r.studentId)}>{r.student}</Link>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {peek.oneStudent ? r.section : `${r.cohort}, ${r.skill}`}
                          {` · ${r.counted} of ${r.need} counted`}
                          {r.waitingWith ? ` · waiting with ${r.waitingWith}, ${r.waitingDays} days` : ""}
                        </span>
                      </div>
                      <StateBadge state={r.state} />
                    </div>
                    {peek.oneStudent ? <EvidenceList data={data} evidence={evidence} studentId={r.studentId} skillId={r.skillId} /> : null}
                  </li>
                ))}
              </ul>
            </FloatingSheetPanelBody>
          </>
        ) : (
          <FloatingSheetPanelHeader title="Evidence" />
        )}
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}

function EvidenceList({ data, evidence, studentId, skillId }: { data: V2State; evidence: V2State; studentId: string; skillId: string }) {
  const rows = React.useMemo(() => recordEvidence(evidence, data, studentId, skillId), [evidence, data, studentId, skillId])
  if (rows.length === 0) return <p className="text-xs text-muted-foreground">No evaluations yet.</p>
  return (
    <ul className="flex flex-col gap-1 rounded-md bg-muted p-2" aria-label="Evaluations">
      {rows.map((e) => (
        <li key={e.id} className="grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-2 text-xs">
          <span className="tabular-nums text-muted-foreground">{e.date}</span>
          <span className="min-w-0 truncate text-foreground">{`${e.evaluator} · ${e.setting}`}</span>
          <span className="text-foreground">{e.status === "Counted" ? e.outcome : `${e.outcome}, ${e.status.toLowerCase()}`}</span>
        </li>
      ))}
    </ul>
  )
}
