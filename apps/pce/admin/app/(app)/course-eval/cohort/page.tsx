'use client'

/**
 * Course Evaluation — Admin cohort overview (Sprint 2 of spec).
 *
 * Spec: apps/pce/docs/specs/course-evaluation.md §4
 *
 * Wireframe per §4.1: slope graph (paired Fall→Spring per course),
 * didactic vs clinical small-multiples split.
 *
 * Viz patterns applied:
 * - Slope graph (paired) → slope-paired.md (VIZ-PATTERN-004)
 * - Small multiples (didactic vs clinical split) → small-multiples.md (VIZ-PATTERN-006)
 * - Cleveland dot (current-term ranking within cohort) → cleveland-dot.md (VIZ-PATTERN-005)
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Button,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Card,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { SlopeGraph } from '@/components/pce/slope-graph'
import { SmallMultiples, type Multiple } from '@/components/pce/small-multiples'
import { ClevelandDot } from '@/components/pce/cleveland-dot'
import {
  COHORT_META, type CohortId,
  TERMS,
} from '@/lib/course-eval-mock'

export default function CohortOverview() {
  const [cohortId, setCohortId] = React.useState<CohortId>('class-2027')
  const [tab, setTab] = React.useState<'all' | 'didactic' | 'clinical'>('all')

  const cohort = COHORT_META[cohortId]
  const enteredTerm = TERMS.find(t => t.id === cohort.enteredTerm)?.label ?? cohort.enteredTerm

  const visiblePaired = tab === 'all'
    ? cohort.paired
    : cohort.paired.filter(p => p.type === tab)

  const didactic = cohort.paired.filter(p => p.type === 'didactic')
  const clinical = cohort.paired.filter(p => p.type === 'clinical')

  // Small multiples for didactic vs clinical — each panel = a course's
  // pre→post pair as a 2-point sparkline
  const splitMultiples = (rows: typeof cohort.paired): Multiple<unknown>[] =>
    rows.map(p => {
      const delta = p.post - p.pre
      return {
        id: p.courseId,
        label: p.courseName,
        series: [
          { x: 'pre', y: p.pre },
          { x: 'post', y: p.post },
        ],
        summary: `${p.pre.toFixed(1)} → ${p.post.toFixed(1)} (${delta >= 0 ? '+' : ''}${delta.toFixed(1)})`,
        isOutlier: Math.abs(delta) >= 0.3,
      }
    })

  // Cleveland dot — ranked current-term ratings within cohort
  const dotRows = cohort.paired.map(p => ({
    id: p.courseId,
    label: p.courseName,
    value: p.post,
    category: (p.type === 'didactic' ? 'a' : 'b') as 'a' | 'b',
  }))

  return (
    <>
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Admin
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <Link href="/course-eval" className="text-sm text-muted-foreground hover:underline">
          Course Evaluation
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Cohort Overview</h1>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 overflow-auto"
        style={{ padding: '20px 28px 40px', scrollPaddingTop: 60 }}
      >
        <div className="max-w-7xl flex flex-col gap-5">

          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{cohort.label}</span>
              {' · '}
              {cohort.studentCount} students · entered {enteredTerm} · currently in {cohort.termIndex} of 8 terms
            </p>
            <p className="text-xs text-muted-foreground">
              Didactic completed: {cohort.didacticCompleted} courses
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={cohortId} onValueChange={(v) => setCohortId(v as CohortId)}>
                <SelectTrigger className="h-8 w-44 text-sm" aria-label="Select cohort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(COHORT_META).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList variant="line">
              <TabsTrigger value="all">All courses ({cohort.paired.length})</TabsTrigger>
              <TabsTrigger value="didactic">Didactic ({didactic.length})</TabsTrigger>
              <TabsTrigger value="clinical">Clinical ({clinical.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="flex flex-col gap-5 mt-5">
              <Card className="p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-sm font-semibold">
                    Term-over-term — paired comparison
                  </h2>
                </div>
                {visiblePaired.length >= 2 ? (
                  <SlopeGraph
                    rows={visiblePaired.map(p => ({
                      id: p.courseId,
                      label: p.courseName,
                      pre: p.pre,
                      post: p.post,
                    }))}
                    preLabel="Prior term"
                    postLabel={TERMS[TERMS.length - 1].label}
                    min={3.0}
                    max={5.0}
                    ariaLabel={`Term-over-term comparison for ${cohort.label}`}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Cohort has insufficient term history — pre/post slope requires 2 terms.
                  </p>
                )}
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3">Didactic — {didactic.length} courses</h2>
                  {didactic.length > 0 ? (
                    <SmallMultiples
                      multiples={splitMultiples(didactic)}
                      yMin={3.0}
                      yMax={5.0}
                      panelWidth={120}
                      panelHeight={50}
                      sortBy={(a, b) => {
                        if (a.isOutlier && !b.isOutlier) return -1
                        if (!a.isOutlier && b.isOutlier) return 1
                        return 0
                      }}
                      ariaLabel="Didactic course pre-to-post comparisons"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No didactic courses yet.</p>
                  )}
                </Card>

                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3">Clinical — {clinical.length} courses</h2>
                  {clinical.length > 0 ? (
                    <SmallMultiples
                      multiples={splitMultiples(clinical)}
                      yMin={3.0}
                      yMax={5.0}
                      panelWidth={120}
                      panelHeight={50}
                      sortBy={(a, b) => {
                        if (a.isOutlier && !b.isOutlier) return -1
                        if (!a.isOutlier && b.isOutlier) return 1
                        return 0
                      }}
                      ariaLabel="Clinical course pre-to-post comparisons"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No clinical courses yet.</p>
                  )}
                </Card>
              </div>

              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3">
                  Current term — ranked within cohort
                </h2>
                <ClevelandDot
                  rows={dotRows}
                  threshold={4.0}
                  min={3.0}
                  max={5.0}
                  ariaLabel="Cohort courses ranked by current rating"
                />
                <p className="text-xs text-muted-foreground mt-3">
                  Coloring: <span style={{ color: 'var(--chart-1)' }}>indigo</span> = didactic, <span style={{ color: 'var(--chart-2)' }}>teal</span> = clinical, <span style={{ color: 'var(--chart-4)' }}>amber</span> = below threshold.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="didactic" className="flex flex-col gap-5 mt-5">
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3">Didactic courses — paired comparison</h2>
                {didactic.length >= 2 ? (
                  <SlopeGraph
                    rows={didactic.map(p => ({
                      id: p.courseId,
                      label: p.courseName,
                      pre: p.pre,
                      post: p.post,
                    }))}
                    preLabel="Prior term"
                    postLabel={TERMS[TERMS.length - 1].label}
                    min={3.0}
                    max={5.0}
                    ariaLabel={`Didactic term-over-term for ${cohort.label}`}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">Insufficient didactic history.</p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="clinical" className="flex flex-col gap-5 mt-5">
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3">Clinical courses — paired comparison</h2>
                {clinical.length >= 2 ? (
                  <SlopeGraph
                    rows={clinical.map(p => ({
                      id: p.courseId,
                      label: p.courseName,
                      pre: p.pre,
                      post: p.post,
                    }))}
                    preLabel="Prior term"
                    postLabel={TERMS[TERMS.length - 1].label}
                    min={3.0}
                    max={5.0}
                    ariaLabel={`Clinical term-over-term for ${cohort.label}`}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">Insufficient clinical history.</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
