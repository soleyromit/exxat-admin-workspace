"use client"

/**
 * Student record B, one page and no tabs. What needs the reviewer comes first (evaluations awaiting approval, each a link to its
 * submission), then the student's skills; a skill opens its evaluation history in a DS FloatingSheetPanel beside the list, so the
 * reviewer keeps their place; View on any evaluation shows it in full in the same panel, with Back to the history [REQ RP-07]. Tests whether "held first, skills second, history on demand" beats three tabs.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { evaluationView } from "@/lib/lab/evaluation-view"
import { EvaluationBody } from "@/components/lab/evaluation/evaluation-view"
import { reviewItemHref } from "@/lib/lab/reviewer"
import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import { CohortFact, EvaluationsTable, RecordFrame, SkillsTable } from "@/components/lab/reviewer/record-frame"
import { RecordStatusBadge } from "@/components/lab/reviewer/parts"
import { LINK as LINK_U } from "@/components/lab/link-styles"
import { OVERLAY_LABEL } from "@/lib/v2/labels"
import { fmt } from "@/lib/v2/format"

export function ReviewerStudentRecordB() {
  return (
    <RecordFrame variant="B" evaluationInPanel={(param) => !!param("skill")}>
      {(ctx) => {
        const r = ctx.record
        const open = ctx.param("skill")
        const held = r.evaluations.filter((e) => e.status === "Awaiting approval")
        const skill = open ? r.skills.find((k) => k.skillId === open) : undefined
        const evalId = ctx.param("evaluation")
        const view = skill && evalId && ctx.state ? evaluationView(ctx.state, evalId) : null
        return (
          <>
            <p className="text-sm" data-region="facts">
              <CohortFact record={r} />
            </p>
            <section aria-labelledby="held-h" className="flex flex-col gap-2" data-region="held">
              <h2 id="held-h" className={TYPE.section}>
                {held.length ? (
                  <>
                    {OVERLAY_LABEL.awaitingApproval} <span className="font-normal tabular-nums text-muted-foreground">{fmt(held.length)}</span>
                  </>
                ) : (
                  `Nothing ${OVERLAY_LABEL.awaitingApproval.toLowerCase()}`
                )}
              </h2>
              {held.length ? (
                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {held.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <span className="flex min-w-0 flex-col">
                        {e.queueKey ? <Link className={`${LINK_U} truncate text-sm`} href={reviewItemHref(ctx.scope, e.queueKey)}>{e.skill}</Link> : <span className="text-sm">{e.skill}</span>}
                        <span className="text-xs text-muted-foreground">{`${e.evaluator}${e.evaluatorUnverified ? ", new name" : ""} · ${e.setting}`}</span>
                      </span>
                      <RecordStatusBadge status={e.status} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
            <section aria-labelledby="skills-h" className="flex flex-col gap-2" data-region="skills">
              <h2 id="skills-h" className={TYPE.section}>
                {`${capitalize(skillNounPlural())} with evidence`} <span className="font-normal tabular-nums text-muted-foreground">{fmt(r.skills.length)}</span>
              </h2>
              <SkillsTable rows={r.skills} onOpen={(id) => ctx.setParams({ skill: id })} />
            </section>
            <FloatingSheetPanel open={!!skill} onOpenChange={(o) => (o ? null : ctx.setParams({ skill: null, evaluation: null }))} modal={false}>
              <FloatingSheetPanelContent contentSlot="lab-reviewer-record-skill" size="md">
                {skill && view ? (
                  <>
                    <FloatingSheetPanelToolbar onBack={() => ctx.setParams({ evaluation: null })} backLabel="Back to the history" />
                    <FloatingSheetPanelHeader title={skill.skill} subtitle={`${view.student} · read only`} />
                    <FloatingSheetPanelBody className="px-4 pb-4" data-evaluation-sheet>
                      <EvaluationBody v={view} />
                    </FloatingSheetPanelBody>
                  </>
                ) : skill ? (
                  <>
                    <FloatingSheetPanelHeader title={skill.skill} subtitle={`${skill.state} · ${skill.numbers} counted`} onClose={() => ctx.setParams({ skill: null })} />
                    <FloatingSheetPanelBody className="px-4 pb-4">
                      <EvaluationsTable rows={r.evaluations.filter((e) => e.skillId === skill.skillId)} scope={ctx.scope} compact />
                    </FloatingSheetPanelBody>
                  </>
                ) : null}
              </FloatingSheetPanelContent>
            </FloatingSheetPanel>
          </>
        )
      }}
    </RecordFrame>
  )
}
