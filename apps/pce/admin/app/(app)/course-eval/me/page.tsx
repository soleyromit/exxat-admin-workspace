'use client'

/**
 * Course Evaluation — Faculty self-view (Sprint 4 of spec).
 *
 * Spec: apps/pce/docs/specs/course-evaluation.md §7
 *
 * CRITICAL GUARDRAIL (D-4 from source meeting):
 *   "Faculty cannot see peer comparisons — only their own performance
 *    vs averages."
 *
 * What is shown:
 *  ✅ Own term-over-term trajectory
 *  ✅ Department average (single number, not ranked)
 *  ✅ University average (when available)
 *  ✅ Threshold ("below 4.0")
 *  ✅ Own per-course breakdown
 *  ✅ AI themes from own evaluations
 *  ✅ Action plan (own)
 *
 * What is NOT shown (enforced by absence — see spec §7.3):
 *  ❌ Cleveland dot of faculty rankings (by name)
 *  ❌ Faculty leaderboard
 *  ❌ "Top 5 faculty this term"
 *  ❌ "Other faculty in your department" with names + ratings
 *  ❌ Percentile / rank ("you're #4 of 14") — peer rank reverse-encoded
 *
 * Implementation tests should verify these fields are NEVER reachable
 * from this surface or any of its sub-routes.
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Button,
  Card,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { TrendSparkline } from '@/components/pce/trend-sparkline'
import { AiInsightCard } from '@/components/pce/ai-insight-card'
import {
  FACULTY, getFacultyCourses, DEPT_AVG, SAMPLE_OFFERING_THEMES,
  CURRENT_FACULTY_ID, CURRENT_FACULTY_ACTION_PLAN,
} from '@/lib/course-eval-mock'

export default function FacultySelfView() {
  const me = FACULTY.find(f => f.id === CURRENT_FACULTY_ID)

  if (!me) {
    return (
      <main id="main" tabIndex={-1} className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Faculty profile not found.</p>
      </main>
    )
  }

  const courses = getFacultyCourses(me.id)
  const trajectory = me.trajectory.map(t => ({ label: t.term, value: t.rating }))
  const latest = me.trajectory[me.trajectory.length - 1]
  const earliest = me.trajectory[0]
  const totalDelta = latest.rating - earliest.rating
  const totalResponses = courses.reduce((s, c) => s + c.responses, 0)
  const totalSent = courses.reduce((s, c) => s + c.sent, 0)

  return (
    <>
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-semibold flex-1 truncate">My Course Evaluations</h1>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 overflow-auto"
        style={{ padding: '20px 28px 40px', scrollPaddingTop: 60 }}
      >
        <div className="max-w-5xl flex flex-col gap-5">

          <section>
            <p className="text-sm text-muted-foreground">
              Welcome, <span className="text-foreground font-medium">{me.name}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Spring 2026 · {courses.length} active courses · {totalResponses} of {totalSent} responses received
            </p>
          </section>

          <Card className="p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold">My trajectory across {me.trajectory.length} terms</h2>
              <span className="text-xs text-muted-foreground">
                Department avg: {DEPT_AVG.toFixed(1)}
              </span>
            </div>
            <TrendSparkline
              history={trajectory.slice(0, -1)}
              currentValue={latest.rating}
              currentLabel={latest.term}
              width={320}
              height={64}
              min={3.0}
              max={5.0}
              showExtremaMarkers
              showCurrentLabel
              band={{ low: DEPT_AVG - 0.2, high: DEPT_AVG + 0.2 }}
            />
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {trajectory.map(t => (
                <div key={t.label} className="flex items-baseline justify-between">
                  <span className="text-muted-foreground capitalize">{t.label.replace('-', ' ')}</span>
                  <span
                    className="tabular-nums font-medium"
                    style={t.value < DEPT_AVG ? { color: 'var(--chart-4)' } : undefined}
                  >
                    {t.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
            {totalDelta < -0.2 && (
              <p className="text-xs mt-3" style={{ color: 'var(--chart-4)' }}>
                <i className="fa-light fa-triangle-exclamation me-1" aria-hidden="true" />
                Your rating is {Math.abs(totalDelta).toFixed(1)} pts below {earliest.term.replace('-', ' ')}.
              </p>
            )}
            {/*
              Privacy guardrail: NO ranked-list of peers, NO percentile, NO
              "you are #N of M". Only the dept-avg single number shown above.
            */}
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">My courses — vs department average</h2>
            <div className="flex flex-col gap-3">
              {courses.map(c => {
                const ratingPct = ((c.rating - 3.0) / 2.0) * 100
                const deptPct = ((c.deptAvg - 3.0) / 2.0) * 100
                const belowDept = c.rating < c.deptAvg
                return (
                  <Link
                    key={c.courseId}
                    href={`/course-eval/me/courses/${c.courseId}`}
                    className="block rounded-md p-3 transition-colors hover:bg-muted"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium">{c.courseName}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.responses} of {c.sent} responses
                      </span>
                    </div>
                    <div className="relative h-3 my-2 rounded-sm" style={{ background: 'var(--muted)' }}>
                      <div
                        className="absolute inset-y-0 start-0 rounded-sm"
                        style={{
                          width: `${ratingPct}%`,
                          background: belowDept ? 'var(--chart-4)' : 'var(--chart-1)',
                        }}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute top-0 bottom-0 w-px"
                        style={{
                          left: `${deptPct}%`,
                          background: 'var(--foreground)',
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="tabular-nums">
                        Rating <span className="font-medium" style={belowDept ? { color: 'var(--chart-4)' } : undefined}>{c.rating.toFixed(1)}</span>
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        Dept avg: {c.deptAvg.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>

          <AiInsightCard
            title="Themes from your evaluations"
            themes={SAMPLE_OFFERING_THEMES.map(t => ({
              id: t.id,
              text: t.text,
              mentionsCount: t.mentionsCount,
              totalContext: t.totalCourses,
              sentiment: t.sentiment,
            }))}
            source={`${totalResponses} qualitative responses across both courses`}
            confidence="high"
            body={
              <p>
                Recommended action: revisit pacing for chapters 7–9.
              </p>
            }
            actions={
              <>
                <Button variant="default" size="sm">Save to my action plan</Button>
                <Button variant="outline" size="sm">Reject</Button>
              </>
            }
          />

          <Card className="p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold">My action plan</h2>
              <Link href="/course-eval/me/action-plans" className="text-xs text-muted-foreground hover:underline">
                View all →
              </Link>
            </div>
            <ul className="flex flex-col gap-2">
              {CURRENT_FACULTY_ACTION_PLAN.map(a => {
                const isDone = a.status === 'completed'
                const isInProgress = a.status === 'in-progress'
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <i
                      className={
                        isDone ? 'fa-solid fa-square-check text-xs' :
                        isInProgress ? 'fa-light fa-square-half-stroke text-xs' :
                        'fa-light fa-square text-xs'
                      }
                      style={{ color: isDone ? 'var(--chart-2)' : 'var(--muted-foreground)' }}
                      aria-hidden="true"
                    />
                    <span
                      className="flex-1"
                      style={isDone ? { textDecoration: 'line-through', color: 'var(--muted-foreground)' } : undefined}
                    >
                      {a.text}
                    </span>
                    {a.source === 'ai-suggested' && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <i className="fa-light fa-sparkles" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
                        AI
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Saved {a.createdAt}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </main>
    </>
  )
}
