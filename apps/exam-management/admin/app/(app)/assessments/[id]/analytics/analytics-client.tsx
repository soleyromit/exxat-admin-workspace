'use client'

/**
 * POST-EXAM ANALYTICS — Aarti's central differentiator.
 *
 * "Embedded workflow intelligence — Surfacing relevant data (e.g. point-biserial
 * correlations, difficulty distribution, negative-performing questions) at the
 * moment of decision-making, rather than in a separate reports section."
 *
 * Sections:
 *   1. Score distribution histogram + cohort summary
 *   2. Per-question matrix — sorted by problem severity
 *      (negative-discriminator → low pbis → outliers)
 *   3. Distractor analysis drill-down per question (modal-style inline)
 *   4. Content area performance breakdown
 *   5. Curving / question-removal action panel — applies adjustments
 *      with live preview of resulting distribution
 *
 * This is the surface where faculty makes publish decisions. Inline action
 * affordances replace the "go to a separate Reports tab" pattern.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Button, Badge,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tip,
  Tabs, TabsList, TabsTrigger, TabsContent,
  LocalBanner,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { StatusPill, KpiTile } from '@/components/faculty-ui-kit'
import { StubButton } from '@/components/stub-button'
import { mockAssessments, mockCourses, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import { facultyExtraAssessments, questionPsychometrics, courseObjectives } from '@/lib/faculty-mock-data'
import { useAssessmentReviews } from '@/lib/assessment-review-store'
import { useFacultySession } from '@/lib/faculty-session'

const ALL_ASSESSMENTS = [...mockAssessments, ...facultyExtraAssessments]

export default function AnalyticsClient({ assessmentId }: { assessmentId: string }) {
  const router = useRouter()
  const assessment = ALL_ASSESSMENTS.find(a => a.id === assessmentId)
  const course = assessment ? mockCourses.find(c => c.id === assessment.courseId) : null
  const { getReview, transition } = useAssessmentReviews()
  const { currentPersona } = useFacultySession()
  const review = getReview(assessmentId)
  const isPublished = review?.state === 'results-published'

  const [activeView, setActiveView] = useState<'overview' | 'items' | 'content-areas' | 'curve'>('overview')
  const [curveApplied, setCurveApplied] = useState(false)

  // Per-question regrading state — keyed by question order index
  const [invalidatedQs, setInvalidatedQs] = useState<Set<number>>(new Set())
  const [discardedQs, setDiscardedQs] = useState<Set<number>>(new Set())
  const [correctedKeys, setCorrectedKeys] = useState<Record<number, string>>({})
  const [additionalKeys, setAdditionalKeys] = useState<Record<number, string[]>>({})

  // Grade curve state
  const [curveMethod, setCurveMethod] = useState<'flat' | 'percentage' | 'top-100'>('flat')
  const [curveValue, setCurveValue] = useState<string>('')
  const [curveAppliedMethod, setCurveAppliedMethod] = useState<string | null>(null)

  // Audit log state
  const [auditLog, setAuditLog] = useState<{ timestamp: string; action: string; note: string }[]>([])
  const [pendingNote, setPendingNote] = useState<string>('')

  // Build data — psychometrics for first N questions in this assessment
  const items = useMemo(() => {
    if (!assessment) return []
    const N = assessment.questionCount
    return Array.from({ length: N }).map((_, i) => {
      const seed = (i + 1) * 17
      const realQ = MOCK_QB_QUESTIONS[i % MOCK_QB_QUESTIONS.length]
      const realPsy = questionPsychometrics[i % questionPsychometrics.length]
      // Synthesize across the whole assessment
      const difficultyIndex = realPsy ? realPsy.difficultyIndex : 0.4 + ((seed * 13) % 50) / 100
      const pointBiserial = realPsy && i < questionPsychometrics.length
        ? realPsy.pointBiserial
        : ((seed * 7) % 70 - 10) / 100
      const negativeDiscriminator = pointBiserial < 0
      const distractorRates = realPsy?.distractorRates ?? [
        difficultyIndex,
        (1 - difficultyIndex) * 0.55,
        (1 - difficultyIndex) * 0.30,
        (1 - difficultyIndex) * 0.15,
      ]
      return {
        order: i + 1,
        questionId: realQ.id,
        code: realQ.code,
        title: realQ.title,
        difficulty: realQ.difficulty,
        blooms: realQ.blooms,
        objectiveTitle: courseObjectives[i % courseObjectives.length]?.title ?? '—',
        difficultyIndex,
        pointBiserial,
        negativeDiscriminator,
        distractorRates,
      }
    })
  }, [assessment])

  if (!assessment || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="font-semibold text-foreground">Assessment not found</p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => router.push('/courses')}>
          Back to courses
        </Button>
      </div>
    )
  }

  // Score distribution synthesis
  const scoreDist = useMemo(() => generateScoreDistribution(28, 76, 11), [])
  const cohortAvg = scoreDist.mean
  const cohortMedian = scoreDist.median
  const passingPct = scoreDist.passingPct

  const negativeDiscCount = items.filter(i => i.negativeDiscriminator).length

  const breadcrumbs = [
    { label: 'Courses', href: '/courses' },
    { label: course.name, href: `/courses/${course.id}` },
    { label: 'Analytics' },
  ]

  const handlePublishResults = () => {
    transition(assessmentId, 'results-published', {
      reviewerName: `${currentPersona.title} ${currentPersona.name}`,
      notes: 'Results published to students.',
    })
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <StatusPill
        tone={isPublished ? 'success' : 'info'}
        icon={isPublished ? 'fa-eye' : 'fa-check-double'}
        label={isPublished ? 'Results published' : 'Submitted · awaiting publish'}
        uppercase
      />
      <StubButton variant="outline" size="sm" className="gap-1.5">
        <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
        Export
      </StubButton>
      {isPublished ? (
        <Button variant="outline" size="sm" className="gap-1.5" disabled>
          <i className="fa-solid fa-circle-check text-chart-2" aria-hidden="true" />
          Published
        </Button>
      ) : (
        <Button size="sm" className="gap-1.5" onClick={handlePublishResults}>
          <i className="fa-light fa-bullhorn" aria-hidden="true" />
          Publish results
        </Button>
      )}
    </div>
  )

  return (
    <>
      <SiteHeader title={`${assessment.title} — Analytics`} breadcrumbs={breadcrumbs} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none overflow-hidden">
        <PageHeader
          title={assessment.title}
          subtitle={`${course.name} · ${assessment.questionCount} questions · ${scoreDist.n} students submitted`}
          actions={headerActions}
        />

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)} className="flex flex-1 flex-col overflow-hidden">
          <div className="px-6 border-b border-border shrink-0">
            <TabsList variant="line" className="gap-0">
              <TabsTrigger value="overview" className="gap-2">
                <i className="fa-light fa-grid-2 text-xs" aria-hidden="true" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="items" className="gap-2">
                <i className="fa-light fa-list-tree text-xs" aria-hidden="true" />
                Per-question analysis
                {negativeDiscCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full text-[9px] font-bold min-w-4 h-4 px-1 bg-chart-4 text-primary-foreground">
                    {negativeDiscCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="curve" className="gap-2">
                <i className="fa-light fa-sliders text-xs" aria-hidden="true" />
                Curving & adjustments
              </TabsTrigger>
              <TabsTrigger value="content-areas" className="gap-2">
                <i className="fa-light fa-bullseye-pointer text-xs" aria-hidden="true" />
                Content areas
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
        <TabsContent value="overview" className="m-0">
          <OverviewView
            cohortAvg={cohortAvg}
            cohortMedian={cohortMedian}
            passingPct={passingPct}
            scoreDist={scoreDist}
            negativeDiscCount={negativeDiscCount}
            items={items}
            onJumpToItems={() => setActiveView('items')}
            onJumpToCurve={() => setActiveView('curve')}
          />
        </TabsContent>
        <TabsContent value="items" className="m-0">
          <ItemsView items={items} />
        </TabsContent>
            <TabsContent value="curve" className="m-0">
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* ── Section 1: Per-question adjustments ── */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 12 }}>Question-level adjustments</p>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--foreground)', width: 40 }}>#</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--foreground)' }}>Question</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--foreground)', width: 100 }}>Status</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--foreground)', width: 260 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.slice(0, 20).map((item) => {
                          const isInvalidated = invalidatedQs.has(item.order)
                          const isDiscarded = discardedQs.has(item.order)
                          const hasCorrectedKey = correctedKeys[item.order]
                          const hasAdditionalKeys = (additionalKeys[item.order] ?? []).length > 0
                          return (
                            <tr key={item.order} style={{ borderBottom: '1px solid var(--border)', background: isInvalidated || isDiscarded ? 'var(--muted)' : undefined }}>
                              <td style={{ padding: '8px 12px', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>{item.order}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--foreground)' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted-foreground)', marginRight: 8 }}>{item.code}</span>
                                <span style={{ textDecoration: isDiscarded ? 'line-through' : undefined }}>{item.title.length > 60 ? item.title.slice(0, 60) + '…' : item.title}</span>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                {isInvalidated && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>Full credit</span>}
                                {isDiscarded && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>Excluded</span>}
                                {hasCorrectedKey && !isInvalidated && !isDiscarded && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: 'var(--brand-tint)', color: 'var(--brand-color)', border: '1px solid var(--ring)' }}>Key: {hasCorrectedKey}</span>}
                                {hasAdditionalKeys && !isInvalidated && !isDiscarded && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: 'var(--brand-tint)', color: 'var(--brand-color)', border: '1px solid var(--ring)', marginLeft: 4 }}>+{additionalKeys[item.order].length} key{additionalKeys[item.order].length > 1 ? 's' : ''}</span>}
                                {!isInvalidated && !isDiscarded && !hasCorrectedKey && !hasAdditionalKeys && <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>—</span>}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                                  {!isDiscarded && (
                                    <Button
                                      variant={isInvalidated ? 'outline' : 'ghost'}
                                      size="xs"
                                      aria-pressed={isInvalidated}
                                      aria-label={`${isInvalidated ? 'Undo invalidate' : 'Invalidate'} question ${item.order}`}
                                      onClick={() => {
                                        setInvalidatedQs(prev => { const s = new Set(prev); isInvalidated ? s.delete(item.order) : s.add(item.order); return s })
                                        if (!isInvalidated) {
                                          setAuditLog(prev => [...prev, { timestamp: new Date().toISOString(), action: `Q${item.order}: Invalidated (full credit)`, note: pendingNote }])
                                          setPendingNote('')
                                        }
                                      }}
                                      style={isInvalidated ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', background: 'var(--brand-tint)' } : undefined}
                                    >{isInvalidated ? 'Undo' : 'Invalidate'}</Button>
                                  )}
                                  {!isInvalidated && (
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      aria-pressed={isDiscarded}
                                      aria-label={`${isDiscarded ? 'Undo discard' : 'Discard'} question ${item.order}`}
                                      onClick={() => {
                                        setDiscardedQs(prev => { const s = new Set(prev); isDiscarded ? s.delete(item.order) : s.add(item.order); return s })
                                        if (!isDiscarded) {
                                          setAuditLog(prev => [...prev, { timestamp: new Date().toISOString(), action: `Q${item.order}: Discarded (excluded from denominator)`, note: pendingNote }])
                                          setPendingNote('')
                                        }
                                      }}
                                      style={isDiscarded ? { background: 'var(--muted)' } : undefined}
                                    >{isDiscarded ? 'Undo discard' : 'Discard'}</Button>
                                  )}
                                  {!isInvalidated && !isDiscarded && (
                                    <select
                                      aria-label={`Correct answer key for question ${item.order}`}
                                      value={correctedKeys[item.order] ?? ''}
                                      onChange={e => {
                                        const val = e.target.value
                                        setCorrectedKeys(prev => ({ ...prev, [item.order]: val }))
                                        if (val) {
                                          setAuditLog(prev => [...prev, { timestamp: new Date().toISOString(), action: `Q${item.order}: Key corrected → ${val}`, note: pendingNote }])
                                          setPendingNote('')
                                        }
                                      }}
                                      style={{ fontSize: 12, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', cursor: 'pointer', fontFamily: 'inherit', height: 26 }}
                                    >
                                      <option value="">Fix key…</option>
                                      {['A', 'B', 'C', 'D', 'E'].map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {items.length > 20 && (
                    <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 8 }}>Showing first 20 of {items.length} questions.</p>
                  )}
                </div>

                {/* ── Section 2: Grade curve ── */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 12 }}>Grade curve</p>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['flat', 'percentage', 'top-100'] as const).map((val) => {
                        const label = val === 'flat' ? 'Flat ±pts' : val === 'percentage' ? '% curve' : 'Top score = 100%'
                        return (
                          <Button key={val} variant={curveMethod === val ? 'outline' : 'ghost'} size="xs" aria-pressed={curveMethod === val} onClick={() => setCurveMethod(val)} style={{ flex: 1, ...(curveMethod === val ? { borderColor: 'var(--brand-color)', background: 'var(--brand-tint)', color: 'var(--brand-color)' } : { color: 'var(--muted-foreground)' }) }}>{label}</Button>
                        )
                      })}
                    </div>
                    {curveMethod !== 'top-100' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          aria-label={curveMethod === 'flat' ? 'Points to add or subtract' : 'Percentage curve value'}
                          value={curveValue}
                          onChange={e => setCurveValue(e.target.value)}
                          placeholder={curveMethod === 'flat' ? '±pts (e.g. +5 or −3)' : '% (e.g. 10)'}
                          style={{ flex: 1, height: 36, padding: '0 10px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit' }}
                          onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                        />
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{curveMethod === 'flat' ? 'pts to all students' : '% applied'}</span>
                      </div>
                    )}
                    {curveAppliedMethod && (
                      <p style={{ fontSize: 12, color: 'var(--chart-2)', fontWeight: 600 }}>
                        <i className="fa-light fa-circle-check" aria-hidden="true" style={{ marginRight: 6 }} />
                        Curve applied: {curveAppliedMethod}
                      </p>
                    )}
                    <Button variant="default" size="sm" disabled={curveMethod !== 'top-100' && curveValue.trim() === ''} onClick={() => { const desc = curveMethod === 'top-100' ? 'Top score = 100%' : `${curveMethod === 'flat' ? 'Flat' : 'Percentage'} curve: ${curveValue}`; setCurveApplied(true); setCurveAppliedMethod(desc); setAuditLog(prev => [...prev, { timestamp: new Date().toISOString(), action: `Grade curve applied: ${desc}`, note: pendingNote }]); setPendingNote('') }} className="self-start">Apply curve</Button>
                  </div>
                </div>

                {/* ── Section 3: Audit log ── */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>Audit log</p>
                  <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12 }}>Every adjustment is logged with instructor, timestamp, and reason.</p>
                  <div style={{ marginBottom: 10 }}>
                    <input
                      type="text"
                      aria-label="Note for next adjustment"
                      placeholder="Add a note for your next adjustment (required for audit)…"
                      value={pendingNote}
                      onChange={e => setPendingNote(e.target.value)}
                      style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                    />
                  </div>
                  {auditLog.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No adjustments made yet.</p>
                  ) : (
                    <div role="log" aria-live="polite" style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      {[...auditLog].reverse().map((entry, i) => (
                        <div key={i} style={{ padding: '10px 14px', borderBottom: i < auditLog.length - 1 ? '1px solid var(--border)' : undefined, display: 'flex', gap: 12 }}>
                          <div style={{ flexShrink: 0 }}>
                            <i className="fa-light fa-clock" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: 'var(--foreground)', fontWeight: 500 }}>{entry.action}</p>
                            {entry.note && <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>Note: {entry.note}</p>}
                            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                              {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </TabsContent>
        <TabsContent value="content-areas" className="m-0">
          <ContentAreasView courseId={course.id} />
        </TabsContent>
          </div>
        </Tabs>
      </div>

    </>
  )
}

// ─── Score distribution generator ────────────────────────────────────────────
type ScoreDist = {
  n: number
  mean: number
  median: number
  passingPct: number
  passing: number
  histogram: { bucket: string; count: number }[]
  scores: number[]
}

function generateScoreDistribution(n: number, mean: number, sd: number): ScoreDist {
  const scores: number[] = []
  for (let i = 0; i < n; i++) {
    const seed = (i + 1) * 13
    // Box-Muller–ish synthesis
    const u1 = ((seed * 17) % 1000) / 1000 + 0.001
    const u2 = ((seed * 23) % 1000) / 1000 + 0.001
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const s = Math.max(40, Math.min(100, Math.round(mean + z * sd)))
    scores.push(s)
  }
  scores.sort((a, b) => a - b)
  const sum = scores.reduce((a, b) => a + b, 0)
  const meanCalc = Math.round(sum / scores.length)
  const median = scores[Math.floor(scores.length / 2)]
  const passing = scores.filter(s => s >= 70).length
  // Histogram in 10-point buckets
  const buckets = ['40-49', '50-59', '60-69', '70-79', '80-89', '90-100']
  const histogram = buckets.map(b => {
    const [lo, hi] = b.split('-').map(Number)
    return { bucket: b, count: scores.filter(s => s >= lo && s <= hi).length }
  })
  return { n, mean: meanCalc, median, passingPct: Math.round((passing / n) * 100), passing, histogram, scores }
}

// ─── Overview view ───────────────────────────────────────────────────────────
const BLOOMS_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
const BLOOMS_CHART_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-1']

function OverviewView({
  cohortAvg, cohortMedian, passingPct, scoreDist, negativeDiscCount, items,
  onJumpToItems, onJumpToCurve,
}: {
  cohortAvg: number; cohortMedian: number; passingPct: number; scoreDist: ScoreDist
  negativeDiscCount: number
  items: Item[]
  onJumpToItems: () => void; onJumpToCurve: () => void
}) {
  const total = items.length
  const meanTone: 'success' | 'info' | 'warning' = cohortAvg >= 80 ? 'success' : cohortAvg >= 70 ? 'info' : 'warning'

  // Content area frequency — group by objectiveTitle, sort by count desc
  const contentAreaCounts = useMemo(() => {
    const map = new Map<string, { count: number; correctnessSum: number }>()
    for (const item of items) {
      const existing = map.get(item.objectiveTitle) ?? { count: 0, correctnessSum: 0 }
      map.set(item.objectiveTitle, {
        count: existing.count + 1,
        correctnessSum: existing.correctnessSum + (item.distractorRates[0] ?? 0),
      })
    }
    return Array.from(map.entries())
      .map(([title, { count, correctnessSum }]) => ({
        title,
        count,
        avgCorrectness: Math.round((correctnessSum / count) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [items])

  // Bloom's frequency — group by blooms in canonical order
  const bloomsCounts = useMemo(() => {
    const map = new Map<string, { count: number; correctnessSum: number }>()
    for (const item of items) {
      if (item.blooms) {
        const existing = map.get(item.blooms) ?? { count: 0, correctnessSum: 0 }
        map.set(item.blooms, {
          count: existing.count + 1,
          correctnessSum: existing.correctnessSum + (item.distractorRates[0] ?? 0),
        })
      }
    }
    const ordered: { level: string; count: number; avgCorrectness: number; chartVar: string }[] = []
    BLOOMS_ORDER.forEach((level, i) => {
      if (map.has(level)) {
        const { count, correctnessSum } = map.get(level)!
        ordered.push({
          level,
          count,
          avgCorrectness: Math.round((correctnessSum / count) * 100),
          chartVar: BLOOMS_CHART_VARS[i % BLOOMS_CHART_VARS.length],
        })
      }
    })
    // Append any levels not in the canonical order
    for (const [level, { count, correctnessSum }] of map.entries()) {
      if (!BLOOMS_ORDER.includes(level)) {
        ordered.push({
          level,
          count,
          avgCorrectness: Math.round((correctnessSum / count) * 100),
          chartVar: BLOOMS_CHART_VARS[ordered.length % BLOOMS_CHART_VARS.length],
        })
      }
    }
    return ordered
  }, [items])

  return (
    <div className="flex flex-col gap-5">
      {/* Hero KPIs + alert callouts */}
      <section className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <Kpi icon="fa-chart-line" label="Cohort average" value={`${cohortAvg}%`} tone={meanTone} sub={`Median ${cohortMedian}%`} />
        <Kpi icon="fa-check-double" label="Pass rate" value={`${passingPct}%`} tone={passingPct >= 80 ? 'success' : passingPct >= 65 ? 'info' : 'warning'} sub={`${scoreDist.passing} of ${scoreDist.n} ≥ 70%`} />
        <Kpi icon="fa-square-root-variable" label="Std deviation" value="11.2" tone="neutral" sub="Spread of scores" />
        {negativeDiscCount > 0 && (
          <Kpi
            icon="fa-triangle-exclamation"
            label="Items to review"
            value={negativeDiscCount}
            tone="warning"
            sub={`${negativeDiscCount} negative discriminator${negativeDiscCount === 1 ? '' : 's'}`}
            onClick={onJumpToItems}
          />
        )}
      </section>

      {/* Quality alert callout */}
      {negativeDiscCount > 0 && (
        <section
          className="rounded-xl border p-5"
          style={{
            background: 'var(--muted)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-start gap-4">
            <i
              className="fa-light fa-lightbulb-on mt-0.5"
              aria-hidden="true"
              style={{ fontSize: 22, color: 'var(--chart-4)' }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground" style={{ fontSize: 14 }}>
                <><b>{negativeDiscCount}</b> negative-discriminator {negativeDiscCount === 1 ? 'item' : 'items'}</>
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                These items hurt the cohort. Removing them or excluding from scoring is recommended before publishing.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button size="sm" onClick={onJumpToItems} className="gap-1.5">
                <i className="fa-light fa-eye" aria-hidden="true" />
                Review items
              </Button>
              <Button variant="outline" size="sm" onClick={onJumpToCurve} className="gap-1.5">
                <i className="fa-light fa-sliders" aria-hidden="true" />
                Curving panel
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Score distribution chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold">Score distribution</CardTitle>
          <CardDescription className="text-xs">10-point buckets · vertical line marks 70% passing threshold</CardDescription>
          <div className="flex items-center gap-3 text-[11px] justify-self-end col-start-2 row-start-1">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded" style={{ background: 'var(--chart-2)' }} />Passing</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded" style={{ background: 'var(--chart-4)' }} />Below passing</span>
          </div>
        </CardHeader>
        <CardContent>
          <Histogram dist={scoreDist} />
        </CardContent>
      </Card>

      {/* Content area coverage */}
      {contentAreaCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base font-semibold">Content area coverage</CardTitle>
            <CardDescription className="text-xs">Question count per content area · sorted by frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              {contentAreaCounts.map(({ title, count, avgCorrectness }) => (
                <div key={title} className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm text-foreground flex-1 truncate" title={title}>{title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="secondary"
                      className="rounded font-mono"
                      style={{ padding: '1px 7px' }}
                    >
                      {count} of {total}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">· {avgCorrectness}% correct</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bloom's taxonomy distribution */}
      {bloomsCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base font-semibold">Bloom&apos;s taxonomy</CardTitle>
            <CardDescription className="text-xs">Question count by cognitive level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bloomsCounts.map(({ level, count, avgCorrectness, chartVar }) => (
                <div
                  key={level}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1"
                  style={{
                    background: `var(--muted)`,
                    border: `1px solid var(--border)`,
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: `var(${chartVar})` }}>{level}</span>
                  <Badge
                    variant="secondary"
                    className="rounded font-mono"
                    style={{
                      padding: '0px 5px',
                      background: `var(--muted)`,
                      color: `var(${chartVar})`,
                    }}
                  >
                    {count} of {total}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">· {avgCorrectness}% correct</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Page KPI strip uses the shared kit; mini chart palettes still need a tone→color lookup.
const Kpi = KpiTile

const TONE: Record<'brand' | 'info' | 'warning' | 'success' | 'neutral', { bg: string; fg: string }> = {
  brand:   { bg: 'var(--brand-tint)', fg: 'var(--brand-color-dark)' },
  info:    { bg: 'var(--muted)',     fg: 'var(--chart-1)' },
  warning: { bg: 'var(--muted)',     fg: 'var(--chart-4)' },
  success: { bg: 'var(--muted)',     fg: 'var(--chart-2)' },
  neutral: { bg: 'var(--muted)',                                                    fg: 'var(--muted-foreground)' },
}

// ─── Histogram ───────────────────────────────────────────────────────────────
function Histogram({ dist }: { dist: ScoreDist }) {
  const max = Math.max(...dist.histogram.map(b => b.count))
  return (
    <div className="flex items-end justify-between gap-2" style={{ minHeight: 180 }}>
      {dist.histogram.map(b => {
        const isFailing = parseInt(b.bucket.split('-')[0], 10) < 70
        const heightPct = (b.count / max) * 100
        return (
          <div key={b.bucket} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold text-foreground tabular-nums">{b.count}</span>
            <Tip label={`${b.count} ${b.count === 1 ? 'student' : 'students'} scored ${b.bucket}%`}>
              <div
                className="w-full rounded-t transition-all hover:opacity-80 cursor-help"
                style={{
                  height: `${heightPct}%`,
                  minHeight: 6,
                  background: isFailing ? 'var(--chart-4)' : 'var(--chart-2)',
                  opacity: 0.85,
                }}
              />
            </Tip>
            <span className="text-[10px] text-muted-foreground font-mono">{b.bucket}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Items view ──────────────────────────────────────────────────────────────
type Item = {
  order: number
  questionId: string
  code: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  blooms: string
  objectiveTitle: string
  difficultyIndex: number
  pointBiserial: number
  negativeDiscriminator: boolean
  distractorRates: number[]
}

function ItemsView({ items }: { items: Item[] }) {
  const [sortBy, setSortBy] = useState<'severity' | 'order' | 'difficulty'>('severity')
  const [filter, setFilter] = useState<'all' | 'easy' | 'hard'>('all')

  const sorted = useMemo(() => {
    let list = [...items]
    if (filter === 'easy') list = list.filter(i => i.difficultyIndex >= 0.85)
    if (filter === 'hard') list = list.filter(i => i.difficultyIndex < 0.4)
    if (sortBy === 'severity') {
      list.sort((a, b) => {
        const sa = severityScore(a)
        const sb = severityScore(b)
        return sb - sa
      })
    } else if (sortBy === 'difficulty') list.sort((a, b) => a.difficultyIndex - b.difficultyIndex)
    else list.sort((a, b) => a.order - b.order)
    return list
  }, [items, sortBy, filter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterChip label="Too easy (≥85%)" active={filter === 'easy'} onClick={() => setFilter('easy')} />
        <FilterChip label="Too hard (<40%)" active={filter === 'hard'} onClick={() => setFilter('hard')} />
        <span className="ms-auto text-xs text-muted-foreground">Sort by:</span>
        <FilterChip label="Severity" active={sortBy === 'severity'} onClick={() => setSortBy('severity')} small />
        <FilterChip label="Order" active={sortBy === 'order'} onClick={() => setSortBy('order')} small />
        <FilterChip label="Difficulty" active={sortBy === 'difficulty'} onClick={() => setSortBy('difficulty')} small />
      </div>
      <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div
          className="grid items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b"
          style={{ gridTemplateColumns: '40px minmax(0, 2fr) 100px 130px 80px', borderColor: 'var(--border)' }}
        >
          <div>#</div>
          <div>Question</div>
          <div>Difficulty</div>
          <div>Distractor mix</div>
          <div></div>
        </div>
        {sorted.map(item => <ItemRow key={item.questionId + item.order} item={item} />)}
      </div>
    </div>
  )
}

function severityScore(i: Item): number {
  let s = 0
  if (i.negativeDiscriminator) s += 100
  if (i.difficultyIndex < 0.3) s += 20
  if (i.difficultyIndex > 0.95) s += 10
  return s
}

function ItemRow({ item }: { item: Item }) {
  const flagged = item.negativeDiscriminator
  return (
    <div
      className={`grid items-start gap-3 px-4 py-3 border-b last:border-b-0 text-sm transition-colors ${flagged ? '' : 'hover:bg-muted/30'}`}
      style={{
        gridTemplateColumns: '40px minmax(0, 2fr) 100px 130px 80px',
        borderColor: 'var(--border)',
        background: item.negativeDiscriminator
          ? 'var(--muted)'
          : undefined,
      }}
    >
      <div className="font-mono text-xs text-muted-foreground font-semibold">Q{item.order}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <Badge variant="secondary" className="rounded font-mono text-[10px]" style={{ background: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}>
            {item.code}
          </Badge>
          {item.negativeDiscriminator && (
            <Badge
              variant="secondary"
              className="rounded text-[10px] uppercase tracking-wider font-bold gap-1"
              style={{
                background: 'var(--muted)',
                color: 'var(--chart-4)',
                border: '1px solid var(--border)',
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 9 }} />
              Negative
            </Badge>
          )}
        </div>
        {item.objectiveTitle && item.objectiveTitle !== '—' ? (
          <Tip label={item.objectiveTitle}>
            <p className="text-sm text-foreground line-clamp-3 leading-snug cursor-help">{item.title}</p>
          </Tip>
        ) : (
          <p className="text-sm text-foreground line-clamp-3 leading-snug">{item.title}</p>
        )}
        {(() => {
          const TOTAL = 28
          const correct = Math.round(item.distractorRates[0] * TOTAL)
          const wrongRate = item.distractorRates.slice(1).reduce((a, b) => a + b, 0)
          const wrong = Math.round(wrongRate * TOTAL)
          const skipped = Math.max(0, TOTAL - correct - wrong)
          return (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {TOTAL} students · {correct} correct · {wrong} wrong · {skipped} skipped
            </p>
          )
        })()}
      </div>
      <DiffMini difficulty={item.difficulty} />
      <DistractorMini rates={item.distractorRates} />
      <div className="text-end">
        <Tip label="View question + distractor analysis">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Open question detail">
            <Link href={`/questions/${item.questionId}`}>
              <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
            </Link>
          </Button>
        </Tip>
      </div>
    </div>
  )
}

function DiffMini({ difficulty }: { difficulty: 'Easy' | 'Medium' | 'Hard' }) {
  const palette: Record<'Easy' | 'Medium' | 'Hard', { bg: string; fg: string }> = {
    Easy:   { bg: 'var(--muted)', fg: 'var(--chart-2)' },
    Medium: { bg: 'var(--muted)', fg: 'var(--chart-1)' },
    Hard:   { bg: 'var(--muted)', fg: 'var(--chart-4)' },
  }
  const p = palette[difficulty]
  return (
    <Badge
      variant="secondary"
      className="rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: p.bg, color: p.fg }}
    >
      {difficulty}
    </Badge>
  )
}

function DistractorMini({ rates }: { rates: number[] }) {
  const labels = ['A', 'B', 'C', 'D', 'E']
  return (
    <Tip label="Pick rates · green bar = correct answer">
      <div className="flex items-end gap-0.5 cursor-help">
        {rates.slice(0, 5).map((r, i) => {
          const isKey = i === 0
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                style={{
                  width: 8, height: Math.max(2, Math.round(r * 24)),
                  background: isKey ? 'var(--chart-2)' : 'var(--muted-foreground)',
                  borderRadius: 1,
                }}
              />
              <span className="text-[8px] font-mono text-muted-foreground">{labels[i]}</span>
            </div>
          )
        })}
      </div>
    </Tip>
  )
}

function FilterChip({
  label, active, onClick, tone, small,
}: {
  label: string; active: boolean; onClick: () => void; tone?: 'warning'; small?: boolean
}) {
  const tonePalette = tone ? TONE[tone] : null
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className={`rounded-full text-xs font-medium h-auto ${small ? 'px-2.5 py-0.5' : 'px-3 py-1'}`}
      style={{
        background: active
          ? tonePalette?.bg ?? 'var(--brand-tint)'
          : 'var(--muted)',
        color: active
          ? tonePalette?.fg ?? 'var(--brand-color-dark)'
          : 'var(--foreground)',
        border: `1px solid ${active ? (tonePalette?.fg ?? 'var(--brand-tint)') : 'transparent'}`,
      }}
      aria-pressed={active}
    >
      {label}
    </Button>
  )
}

// ─── Content areas view ──────────────────────────────────────────────────────
function ContentAreasView({ courseId }: { courseId: string }) {
  const objectives = courseObjectives.filter(o => o.courseId === courseId)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold">
          Performance by content area / objective
        </CardTitle>
        <CardDescription className="text-xs">
          Aggregated student performance per objective on this assessment.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {objectives.map(o => {
          const tone = o.avgPerformance >= 80 ? 'success' : o.avgPerformance >= 70 ? 'info' : o.avgPerformance > 0 ? 'warning' : 'neutral'
          const palette = TONE[tone]
          return (
            <div key={o.id} className="flex items-center gap-3">
              <span className="text-sm text-foreground flex-1 truncate" title={o.title}>{o.title}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-32 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${o.avgPerformance}%`, background: palette.fg }} />
                </div>
                <span className="text-xs font-bold w-10 text-end" style={{ color: palette.fg }}>
                  {o.avgPerformance > 0 ? `${o.avgPerformance}%` : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ─── Curve view ──────────────────────────────────────────────────────────────
function CurveView({ scoreDist, items }: { scoreDist: ScoreDist; items: Item[] }) {
  const [bonus, setBonus] = useState(0)
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [applied, setApplied] = useState(false)

  const adjusted = useMemo(() => {
    const totalQs = items.length
    const excludedCount = excludedIds.size
    const newScores = scoreDist.scores.map(s => {
      // Recompute as percentage on remaining questions, then add bonus
      // (mock-grade approximation)
      const reduction = excludedCount === 0 ? 0 : (excludedCount / totalQs) * (100 - s) * 0.6
      return Math.min(100, s + bonus + reduction)
    })
    const newPassing = newScores.filter(s => s >= 70).length
    const newMean = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length)
    return { mean: newMean, passing: newPassing, passingPct: Math.round((newPassing / newScores.length) * 100) }
  }, [bonus, excludedIds, scoreDist, items])

  const toggleExclude = (id: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0, 1fr) 280px' }}>
      {/* Adjustment controls */}
      <section className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Bonus points (cohort-wide)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0} max={10} step={1}
                value={bonus}
                onChange={(e) => setBonus(parseInt(e.target.value, 10))}
                className="flex-1 accent-[color:var(--brand-color)]"
                aria-label="Bonus points"
              />
              <span className="text-sm font-bold tabular-nums w-12 text-end" style={{ color: 'var(--brand-color-dark)' }}>
                +{bonus}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Adds {bonus} {bonus === 1 ? 'point' : 'points'} to every student&apos;s score (capped at 100%).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Exclude questions from scoring</CardTitle>
            <CardDescription className="text-xs">
              Removed questions don&apos;t count against students. You can exclude any question — not just flagged ones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              {items.map(item => (
                <label
                  key={item.questionId + item.order}
                  className="flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <input
                    type="checkbox"
                    checked={excludedIds.has(item.questionId + item.order)}
                    onChange={() => toggleExclude(item.questionId + item.order)}
                    className="mt-0.5 accent-[color:var(--brand-color)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">Q{item.order}</span>
                      {item.negativeDiscriminator && (
                        <Badge variant="secondary" className="rounded text-[10px] uppercase font-bold gap-1" style={{ background: 'var(--muted)', color: 'var(--chart-4)' }}>
                          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 9 }} />
                          Negative
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2 mt-0.5">{item.title}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Live preview */}
      <Card className="self-start sticky top-2">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Live preview</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col gap-3">
          <PreviewMetric
            label="Cohort average"
            before={`${scoreDist.mean}%`}
            after={`${adjusted.mean}%`}
            delta={adjusted.mean - scoreDist.mean}
          />
          <PreviewMetric
            label="Pass rate"
            before={`${scoreDist.passingPct}%`}
            after={`${adjusted.passingPct}%`}
            delta={adjusted.passingPct - scoreDist.passingPct}
          />
          <PreviewMetric
            label="Excluded items"
            before="0"
            after={String(excludedIds.size)}
            delta={excludedIds.size}
          />
        </div>
        {applied ? (
          <LocalBanner variant="success" title="Curve applied" className="mt-4">
            {bonus > 0 ? `+${bonus} pt bonus · ` : ''}
            {excludedIds.size > 0 ? `${excludedIds.size} item${excludedIds.size === 1 ? '' : 's'} excluded` : 'no items excluded'}
          </LocalBanner>
        ) : (
          <Button
            size="default"
            className="w-full mt-4 gap-1.5"
            disabled={bonus === 0 && excludedIds.size === 0}
            onClick={() => setApplied(true)}
          >
            <i className="fa-light fa-check" aria-hidden="true" />
            Apply adjustments
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1.5"
          onClick={() => { setBonus(0); setExcludedIds(new Set()); setApplied(false) }}
        >
          Reset
        </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function PreviewMetric({ label, before, after, delta }: { label: string; before: string; after: string; delta: number }) {
  const deltaColor = delta > 0 ? 'var(--chart-2)' : delta < 0 ? 'var(--chart-4)' : 'var(--muted-foreground)'
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-muted-foreground line-through text-sm">{before}</span>
        <i className="fa-light fa-arrow-right text-muted-foreground" aria-hidden="true" style={{ fontSize: 10 }} />
        <span className="text-base font-bold text-foreground">{after}</span>
        {delta !== 0 && (
          <span className="text-xs font-bold tabular-nums" style={{ color: deltaColor }}>
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </div>
  )
}
