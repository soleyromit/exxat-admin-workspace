'use client'

/**
 * Course Evaluation — Admin term overview (Sprint 1 of spec).
 *
 * Spec: apps/pce/docs/specs/course-evaluation.md §3
 * Source meeting: apps/pce/docs/research/meetings/2026-05-08-course-evaluation.md
 *
 * Wireframe: spec §3.1 (verbatim ASCII layout).
 *
 * Viz patterns applied (each cited per spec §3.2):
 * - AI insights row → ai-vs-pulled-lane.md (VIZ-PATTERN-AI-001)
 * - Faculty trajectory → small-multiples.md (VIZ-PATTERN-006)
 * - Course rankings → cleveland-dot.md (VIZ-PATTERN-005)
 * - Response cadence → calendar-heatmap.md (VIZ-PATTERN-007)
 * - Response funnel → progression-sankey.md (VIZ-PATTERN-008)
 *
 * A11Y rules in force (spec §3.3):
 * A11Y-001, -002, -003, -008, -012, -013, -016, -017, -019.
 *
 * TODO (spec §12 open questions, defer until Vishal validates):
 * - In-progress submissions when term ends — auto-discard or carry forward?
 * - Action plan visibility — private vs chair-shared default?
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Button,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Card,
  LocalBanner,
  SidebarTrigger, Separator,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxat/ds/packages/ui/src'
import { AiInsightCard, type AIConfidence } from '@/components/pce/ai-insight-card'
import { DesignToggle, DESIGN_PAIRS } from '@/components/pce/design-toggle'
import { SmallMultiples, type Multiple } from '@/components/pce/small-multiples'
import { ClevelandDot } from '@/components/pce/cleveland-dot'
import { CalendarHeatmap } from '@/components/pce/calendar-heatmap'
import { ProgressionSankey } from '@/components/pce/progression-sankey'
import {
  TERMS, CURRENT_TERM, FACULTY, COURSES, AI_THEMES, AI_INSIGHT_META,
  RESPONSE_FUNNEL, RESPONSE_CADENCE, DEPT_AVG, THRESHOLD,
  COHORTS, DEPARTMENTS, templateVariance, type TermId,
} from '@/lib/course-eval-mock'

export default function CourseEvalTermOverview() {
  const [termId, setTermId] = React.useState<TermId>(CURRENT_TERM)
  const [cohort, setCohort] = React.useState<string>('all')
  const [department, setDepartment] = React.useState<string>('all')
  const [activeTab, setActiveTab] = React.useState<'term' | 'cohort' | 'templates'>('term')

  const currentTerm = TERMS.find(t => t.id === termId)!

  // Filter courses by department
  const filteredCourses = department === 'all'
    ? COURSES
    : COURSES.filter(c => c.department === department)

  // Template variance — concern C-1 / C-2 from source meeting
  const variance = templateVariance(filteredCourses)

  // Faculty trajectories — for small multiples
  const facultyMultiples: Multiple<typeof FACULTY[number]>[] = FACULTY.map(f => {
    const first = f.trajectory[0].rating
    const last = f.trajectory[f.trajectory.length - 1].rating
    const delta = (last - first).toFixed(1)
    return {
      id: f.id,
      label: f.name,
      series: f.trajectory.map(p => ({ x: p.term, y: p.rating })),
      summary: `${first.toFixed(1)} → ${last.toFixed(1)} (${last >= first ? '+' : ''}${delta})`,
      isOutlier: f.isOutlier,
    }
  })

  // Course ranking rows — for Cleveland dot
  const courseRows = filteredCourses.map(c => ({
    id: c.id,
    label: c.name,
    value: c.currentRating,
  }))

  // Sankey stages
  const funnelStages = [
    { id: 'sent',      label: 'Sent',      count: RESPONSE_FUNNEL.sent },
    { id: 'opened',    label: 'Opened',    count: RESPONSE_FUNNEL.opened },
    { id: 'started',   label: 'Started',   count: RESPONSE_FUNNEL.started },
    { id: 'completed', label: 'Completed', count: RESPONSE_FUNNEL.completed },
  ]

  const totalResponses = filteredCourses.reduce((sum, c) => sum + c.responses, 0)
  const totalSent = filteredCourses.reduce((sum, c) => sum + c.sent, 0)
  const completionPct = totalSent > 0 ? Math.round((totalResponses / totalSent) * 1000) / 10 : 0
  const facultyCount = new Set(filteredCourses.map(c => c.facultyId)).size

  return (
    <>
      {/* A11Y-019: exactly one h1 per route. Sidebar nav not counted.
          Header pattern matches /analytics convention (Aarti-approved May 8 2026).
          h1 uses var(--font-heading) per DS convention from existing pages. */}
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
          Course Evaluation
        </h1>

        <DesignToggle
          active="new"
          legacyHref={DESIGN_PAIRS.termOverview.legacy}
          newHref={DESIGN_PAIRS.termOverview.new}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium" aria-label="Ask Leo about course evaluation">
              <i
                className="fa-duotone fa-solid fa-star-christmas text-xs"
                style={{ color: 'var(--brand-color)' }}
                aria-hidden="true"
              />
              Ask Leo
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ask Leo to summarize this term's evaluations</TooltipContent>
        </Tooltip>
      </header>

      {/* main content; A11Y-016 — scroll-padding for sticky chrome */}
      <main
        id="main"
        tabIndex={-1}
        className="flex-1 overflow-auto"
        style={{ padding: '20px 28px 40px', scrollPaddingTop: 60 }}
      >
        <div className="max-w-7xl flex flex-col gap-5">

          {/* Headline metric strip + filters */}
          <section aria-labelledby="overview-heading" className="flex flex-col gap-3">
            <h2 id="overview-heading" className="sr-only">Term overview</h2>

            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground max-w-3xl">
                <span className="text-foreground font-medium">{currentTerm.label}</span>
                {' · '}
                {filteredCourses.length} courses · {facultyCount} faculty ·{' '}
                {totalResponses.toLocaleString()} of {totalSent.toLocaleString()} responses ({completionPct}%)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={termId} onValueChange={(v) => setTermId(v as TermId)}>
                <SelectTrigger className="h-8 w-44 text-sm" aria-label="Select term">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cohort} onValueChange={setCohort}>
                <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by cohort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cohorts</SelectItem>
                  {COHORTS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-8 w-44 text-sm" aria-label="Filter by department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList variant="line">
              <TabsTrigger value="term">Term</TabsTrigger>
              <TabsTrigger value="cohort">Cohort</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="term" className="flex flex-col gap-5 mt-5">

              {/* AI insights — surface BEFORE pulled metrics per Aarti D14 */}
              <AiInsightCard
                title="Cross-course themes this term"
                themes={AI_THEMES.map(t => ({
                  id: t.id,
                  text: t.text,
                  mentionsCount: t.mentionsCount,
                  totalContext: t.totalCourses,
                  sentiment: t.sentiment,
                }))}
                source={`${AI_INSIGHT_META.responsesAnalyzed.toLocaleString()} qualitative responses`}
                confidence={AI_INSIGHT_META.confidence as AIConfidence}
                actions={
                  <>
                    <Button variant="outline" size="sm">View evidence</Button>
                    <Button variant="default" size="sm">Draft action plan</Button>
                  </>
                }
              />

              {/* Faculty trajectory — small multiples (VIZ-006/007) */}
              <Card className="p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-sm font-semibold">Faculty trajectory — last 4 terms</h2>
                  <span className="text-xs text-muted-foreground">
                    Shared y-axis 3.0–5.0 · click panel to drill in
                  </span>
                </div>
                <SmallMultiples
                  multiples={facultyMultiples}
                  yMin={3.0}
                  yMax={5.0}
                  sortBy={(a, b) => {
                    // Outliers first, then by latest rating descending
                    if (a.isOutlier && !b.isOutlier) return -1
                    if (!a.isOutlier && b.isOutlier) return 1
                    const aLast = a.series[a.series.length - 1].y
                    const bLast = b.series[b.series.length - 1].y
                    return bLast - aLast
                  }}
                  ariaLabel="Faculty trajectory across last 4 terms"
                />
              </Card>

              {/* Course rankings — Cleveland dot (VIZ-PATTERN-005) */}
              <Card className="p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-sm font-semibold">
                    Course rankings — {filteredCourses.length} courses
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Median: {DEPT_AVG.toFixed(1)} · Threshold: {THRESHOLD.toFixed(1)}
                  </span>
                </div>
                <ClevelandDot
                  rows={courseRows}
                  median={DEPT_AVG}
                  threshold={THRESHOLD}
                  min={3.0}
                  max={5.0}
                  ariaLabel={`${filteredCourses.length} courses ranked by current rating`}
                />
              </Card>

              {/* Bottom row: cadence + funnel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3">Response cadence</h2>
                  <CalendarHeatmap
                    days={RESPONSE_CADENCE}
                    ariaLabel="Daily response counts since term start; weekend dimmed"
                    tooltipText={(d) => `${d.date}: ${d.count} responses`}
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    Submissions cluster on Fridays. Weekend baseline near zero.
                  </p>
                </Card>

                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3">Response funnel</h2>
                  <ProgressionSankey
                    stages={funnelStages}
                    height={240}
                    ariaLabel="Survey response funnel from sent to completed"
                  />
                </Card>
              </div>

              {/* Template variance — concern C-1, C-2 from source meeting (§10) */}
              {variance.count > 1 && (
                <LocalBanner
                  variant={variance.count >= 4 ? 'warning' : 'info'}
                  title={`Template variance: ${variance.count} templates in use`}
                >
                  <p className="text-xs text-muted-foreground">
                    {variance.count >= 4
                      ? 'Heavy variance — cross-course analysis above is not reliable. Use per-course views.'
                      : 'Cross-course analysis above limited to shared 1–5 rating fields only.'}{' '}
                    <Link href="/course-eval/templates" className="underline">
                      See details
                    </Link>
                  </p>
                </LocalBanner>
              )}
            </TabsContent>

            <TabsContent value="cohort" className="mt-5">
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Cohort overview — Sprint 2 of the course-evaluation spec. Pending Vishal use-case validation.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  See: <code>apps/pce/docs/specs/course-evaluation.md</code> §4
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="mt-5">
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Template management — out of scope for v1. Pending separate ADR.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  See: <code>apps/pce/docs/specs/course-evaluation.md</code> §15 (PCE-ADR candidates)
                </p>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </>
  )
}
