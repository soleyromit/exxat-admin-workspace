"use client"

/**
 * Student record A, tabs: Evaluations, Skills, Verification (placeholder: a director step, not in REQ). Tab counts are the counts
 * (TabsCountBadge), so the page carries no KPI strip. The tab is in the URL (`tab`). Awaiting approval evaluations link to their
 * submission; counted ones offer Request a correction.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { approvalsHref, plural } from "@/lib/lab/reviewer"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { CohortFact, EvaluationsTable, RecordFrame, SkillsTable } from "@/components/lab/reviewer/record-frame"
import { LINK as LINK_U } from "@/components/lab/link-styles"

const TABS = ["evaluations", "skills", "verification"] as const

export function ReviewerStudentRecordA() {
  return (
    <RecordFrame variant="A">
      {(ctx) => {
        const r = ctx.record
        const raw = ctx.param("tab")
        const tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as string) : "evaluations"
        return (
          <>
            <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-muted-foreground" data-region="summary">
              <CohortFact record={r} />
              <span>
                {`${plural(r.counts.achieved, `${skillNoun()} achieved`, `${skillNounPlural()} achieved`)}, ${r.counts.inProgress} in progress. `}
                {r.counts.awaiting ? <Link className={LINK_U} href={approvalsHref(ctx.scope)}>{`${r.counts.awaiting} awaiting approval`}</Link> : "Nothing awaiting approval."}
              </span>
            </p>
            <Tabs value={tab} onValueChange={(v) => ctx.setParams({ tab: v === "evaluations" ? null : v })} className="gap-3" data-region="tabs">
              <TabsList variant="line">
                <TabsTrigger value="evaluations">Evaluations <TabsCountBadge count={r.evaluations.length} /></TabsTrigger>
                <TabsTrigger value="skills">{capitalize(skillNounPlural())} <TabsCountBadge count={r.skills.length} /></TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
              </TabsList>
              <TabsContent value="evaluations">
                <EvaluationsTable rows={r.evaluations} scope={ctx.scope} />
              </TabsContent>
              <TabsContent value="skills">
                <SkillsTable rows={r.skills} />
              </TabsContent>
              <TabsContent value="verification">
                <Card size="sm" className="self-start">
                  <CardContent className="py-1 text-sm text-muted-foreground">Verification is a program director step. It is not designed in this lab yet.</CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )
      }}
    </RecordFrame>
  )
}
