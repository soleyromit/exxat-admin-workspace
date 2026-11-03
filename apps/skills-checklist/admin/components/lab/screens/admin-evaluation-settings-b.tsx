"use client"

/**
 * Evaluation settings, variant B: settings beside a live summary (Proposed 2026-11-02, recommended). The five groups on the left;
 * on the right, from 1024 px and sticky, the resulting settings as label and value pairs (judged by, counts, evaluations needed,
 * skills with a different number, who signs, approval, group check-off), updated as the admin edits. Each summary group links to
 * its section. Fills wide screens with something useful instead of stretched fields (D-X30). Labels and values only (D-L34).
 *
 * Regions: header, settings, summary, footer. URL: ?state=loading.
 */
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { PROGRAM_GROUPS, ProgramGroupBody, groupOfIssue, programSummaryRows, type ProgramGroupId } from "@/components/lab/configure/program-parts"
import { ProgramSettingsFrame } from "@/components/lab/configure/program-layout"

const anchor = (id: ProgramGroupId) => `prog-group-${id}`
const jump = (id: ProgramGroupId) => document.getElementById(anchor(id))?.scrollIntoView({ block: "start" })

export function AdminEvaluationSettingsB() {
  return (
    <ProgramSettingsFrame onIssue={(i) => jump(groupOfIssue(i))}>
      {(p) => {
        const rows = programSummaryRows(p.m, p.edits)
        return (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]" data-layout="summary">
            <div className="flex min-w-0 flex-col" data-region="settings">
              {PROGRAM_GROUPS.map((g, i) => (
                <div key={g.id} id={anchor(g.id)} role="group" aria-labelledby={`${anchor(g.id)}-h`} className={cn("flex scroll-mt-4 flex-col gap-4 py-6", i > 0 && "border-t border-border", i === 0 && "pt-0")}>
                  <h2 id={`${anchor(g.id)}-h`} className={TYPE.section}>{g.label}</h2>
                  <ProgramGroupBody id={g.id} m={p.m} edits={p.edits} setEdits={p.setEdits} />
                </div>
              ))}
            </div>
            <aside aria-labelledby="prog-summary-h" className="hidden lg:block" data-region="program-summary">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle id="prog-summary-h" className={TYPE.card}>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="flex flex-col gap-4">
                    {PROGRAM_GROUPS.map((g) => (
                      <div key={g.id} className="flex flex-col gap-1">
                        <dt>
                          <a href={`#${anchor(g.id)}`} className={cn(LINK_IN_TABLE, TYPE.group)} onClick={(e) => { e.preventDefault(); jump(g.id) }}>{g.label}</a>
                        </dt>
                        {rows.filter((r) => r.group === g.id).map((r) => (
                          <dd key={r.label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2 text-sm">
                            <span className="text-muted-foreground">{r.label}</span>
                            <span className="text-foreground" data-summary-value={r.label}>{r.value}</span>
                          </dd>
                        ))}
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            </aside>
          </div>
        )
      }}
    </ProgramSettingsFrame>
  )
}
