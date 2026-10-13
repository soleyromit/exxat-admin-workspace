"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card } from "@exxatdesignux/ui/components/ui/card"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import type { Db, SkillStatusDisplay } from "@/lib/domain/types"
import { buttons, filterIssueText, r4, reportingCopy as rc } from "@/lib/copy"
import { filterIssue, reportBySkill, reportByStudent, reportByTag, type FilterIssue, type StudentSort } from "@/lib/store"
import { EmptyState, PageFrame } from "@/components/skills"
import { ROUTES } from "@/lib/skills-routes"
import { ExportMenu, type ExportMenuProps } from "./export-menu"
import { KpiStrip } from "./kpi-strip"
import { ReportFilters, filterValueLabel } from "./report-filters"
import { ReportDialogs, type RailStatus } from "./report-dialogs"
import { SkillTable, StudentTable, TagTable } from "./report-tables"
import { clearFilters, hasEvidenceFilter, withFilter, type FilterKey, type OverviewParams, type ReportTab } from "./report-params"
import { surface } from "@/lib/copy"

export interface OverviewViewProps {
  db: Db
  display: SkillStatusDisplay
  params: OverviewParams
  /** `push` adds a history entry (opening a dialog), `replace` rewrites the current one (filters, search, sort). */
  onParams: (next: OverviewParams, mode?: "push" | "replace") => void
  /** L and Er states (S-01 §10). Data is local today, so the connected page always passes "ready". */
  status?: RailStatus
  onRetry?: () => void
  now?: ExportMenuProps["now"]
  onExported?: ExportMenuProps["onExported"]
}

const SORTS: Array<{ value: StudentSort; label: string }> = [
  { value: "highest", label: r4.sort.highest },
  { value: "lowest", label: r4.sort.lowest },
  { value: "name", label: r4.sort.name },
]

const TAB_ICON: Record<ReportTab, string> = { student: "fa-users", skill: "fa-list-check", tag: "fa-tag" }

/**
 * Context line (prototype P-01): "Showing data for 150 students · All cohorts · All groups · All clinical courses · 9 skills in scope".
 * Applied location and setting are appended as "at {location}" and "in {setting}" (prototype 16). An impossible combination
 * says 0 students: nobody is counted because nothing can match (RP-09).
 */
function contextLine(db: Db, p: OverviewParams, students: number, skills: number): string {
  const f = p.filters
  const parts = [
    r4.context.students(students),
    f.cohortId ? filterValueLabel(db, "cohortId", f) : r4.context.allCohorts,
    f.groupId ? filterValueLabel(db, "groupId", f) : r4.context.allGroups,
    f.offeringId ? filterValueLabel(db, "offeringId", f) : r4.context.allCourses,
  ]
  if (f.categoryId) parts.push(filterValueLabel(db, "categoryId", f))
  if (f.tagId) parts.push(filterValueLabel(db, "tagId", f))
  if (f.locationId) parts.push(`at ${filterValueLabel(db, "locationId", f)}`)
  if (f.settingId) parts.push(`in ${filterValueLabel(db, "settingId", f)}`)
  parts.push(r4.context.skillsInScope(skills))
  return parts.join(" · ")
}

/** Bl state (prototype 16): a combination that cannot produce evidence is explained with one way out, never an empty table (RP-09). */
function ImpossibleState({ issue, db, params, onParams }: { issue: FilterIssue; db: Db; params: OverviewParams; onParams: OverviewViewProps["onParams"] }) {
  const clearKeys: FilterKey[] = issue.code === "groupNotInCohort" ? ["groupId"] : ["locationId", "settingId"]
  const label = issue.code === "groupNotInCohort" ? "Clear group" : r4.impossible.clear
  return (
    <EmptyState
      icon="fa-filter"
      align="center"
      title={r4.impossible.title}
      description={issue.code === "locationDoesNotOfferSetting" ? r4.impossible.locationSetting(filterValueLabel(db, "locationId", params.filters), filterValueLabel(db, "settingId", params.filters)) : filterIssueText(issue, db)}
      footer={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onParams(clearKeys.reduce((acc, k) => withFilter(acc, k, undefined), params), "replace")}
        >
          {label}
        </Button>
      }
    />
  )
}

/** First-load skeleton in the final shape: KPI strip, tab bar, table rows (S-01 L state). */
function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <p className="sr-only" role="status">{rc.loading}</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-9 w-72" />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

export function OverviewView(props: OverviewViewProps) {
  const { db, display, params, onParams, status = "ready" } = props
  const f = params.filters
  const issue = filterIssue(db, f)
  const student = reportByStudent(db, f, { q: params.q, sort: params.sort })
  const skill = params.tab === "skill" ? reportBySkill(db, f) : null
  const tag = params.tab === "tag" ? reportByTag(db, f) : null
  const courseScoped = Boolean(f.offeringId)
  const noSkills = student.scope.skills.length === 0

  const set = (next: OverviewParams, mode: "push" | "replace" = "replace") => onParams(next, mode)

  const emptyStudents = (
    <EmptyState
      icon="fa-filter"
      title={surface.s01.emptyStudents}
      footer={
        <Button type="button" variant="outline" size="sm" onClick={() => set(clearFilters({ ...params, q: "" }))}>
          {buttons.clearFilters}
        </Button>
      }
    />
  )
  const emptySkills = (
    <EmptyState
      icon="fa-list-check"
      title={surface.s01.emptySkills}
      footer={
        <Button asChild variant="outline" size="sm">
          <a href={`${ROUTES.skills}?status=unconfigured`}>{rc.unconfiguredLink}</a>
        </Button>
      }
    />
  )

  const renderTable = () => {
    if (noSkills) return emptySkills
    if (params.tab === "student") return <StudentTable rows={student.rows} display={display} openStudentId={params.student} empty={emptyStudents} onOpen={(id) => set({ ...params, student: id, skill: null, evaluation: null, bySkill: null, byTag: null }, "push")} />
    if (params.tab === "skill") return <SkillTable rows={skill!.rows} db={db} display={display} courseScoped={courseScoped} openSkillId={params.bySkill} empty={emptyStudents} onOpen={(id) => set({ ...params, bySkill: id, byTag: null, student: null, skill: null, evaluation: null }, "push")} />
    return <TagTable rows={tag!.rows} display={display} openTagId={params.byTag} empty={emptyStudents} onOpen={(id) => set({ ...params, byTag: id, bySkill: null, student: null, skill: null, evaluation: null }, "push")} />
  }

  return (
    <PageFrame title={surface.s01.title} subtitle={surface.s01.subtitle}>
      <div className="flex flex-col gap-3">
        <ReportFilters db={db} filters={f} onChange={(k, v) => set(withFilter(params, k, v))} onClear={() => set(clearFilters(params))} />
        <div className="flex flex-col gap-1 text-xs text-muted-foreground" aria-live="polite">
          <p data-testid="scope-sentence">{contextLine(db, params, issue ? 0 : student.kpis.studentsInView, student.scope.skills.length)}</p>
          {hasEvidenceFilter(f) && !issue ? <p data-testid="evidence-scope">{rc.countingOnly([f.settingId ? filterValueLabel(db, "settingId", f) : "", f.locationId ? filterValueLabel(db, "locationId", f) : ""].filter(Boolean).join(" at "))}</p> : null}
          {courseScoped ? <p>{rc.courseScoped}</p> : null}
        </div>
      </div>

      {status === "loading" ? (
        <OverviewSkeleton />
      ) : status === "error" ? (
        <LocalBanner variant="error" action={props.onRetry ? { label: buttons.retry, onClick: props.onRetry } : undefined}>
          {surface.s01.error}
        </LocalBanner>
      ) : issue ? (
        <ImpossibleState issue={issue} db={db} params={params} onParams={set} />
      ) : (
        <>
          <KpiStrip kpis={student.kpis} />
          <Card className="gap-0 overflow-hidden py-0" data-testid="report-card">
            <Tabs value={params.tab} onValueChange={(t) => set({ ...params, tab: t as ReportTab })} className="gap-0">
              <div className="flex items-center justify-between gap-3 border-b border-border px-3">
                <div className="min-w-0 flex-1">
                <TabsList variant="line" aria-label="Attainment views">
                  {(["student", "skill", "tag"] as const).map((t) => (
                    <TabsTrigger key={t} value={t}>
                      <i className={`fa-light ${TAB_ICON[t]}`} aria-hidden="true" />
                      {r4.tabs[t]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                </div>
                <div className="flex shrink-0 items-center gap-2 py-2">
                  {params.tab === "student" ? (
                    <>
                      <Input aria-label={r4.search} placeholder={r4.search} value={params.q} onChange={(e) => set({ ...params, q: e.target.value })} className="w-48" />
                      <Select value={params.sort} onValueChange={(v) => set({ ...params, sort: v as StudentSort })}>
                        <SelectTrigger aria-label={r4.sortLabel} size="sm" className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORTS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : null}
                  <ExportMenu db={db} params={params} display={display} ready={status === "ready"} now={props.now} onExported={props.onExported} />
                </div>
              </div>
              <TabsContent value={params.tab} className="mt-0">
                {renderTable()}
              </TabsContent>
            </Tabs>
          </Card>
        </>
      )}

      <ReportDialogs db={db} display={display} params={params} onParams={onParams} status={status} onRetry={props.onRetry} />
    </PageFrame>
  )
}
