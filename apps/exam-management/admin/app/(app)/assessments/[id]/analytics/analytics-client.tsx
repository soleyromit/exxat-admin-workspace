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
  Tooltip, TooltipTrigger, TooltipContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { StatusPill, KpiTile } from '@/components/faculty-ui-kit'
import { StubButton } from '@/components/stub-button'
import { AssignPracticeDialog } from '@/components/assign-practice-dialog'
import { QuestionScatterPlot } from '@/components/question-scatter-plot'
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
  const [assignPracticeOpen, setAssignPracticeOpen] = useState(false)

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
  const lowPbisCount = items.filter(i => i.pointBiserial < 0.15 && !i.negativeDiscriminator).length

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
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAssignPracticeOpen(true)}>
        <i className="fa-duotone fa-solid fa-bullseye-arrow text-brand" aria-hidden="true" />
        Assign practice
      </Button>
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
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none overflow-hidden">
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
                {(negativeDiscCount + lowPbisCount) > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full text-[9px] font-bold min-w-4 h-4 px-1 bg-chart-4 text-primary-foreground">
                    {negativeDiscCount + lowPbisCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="content-areas" className="gap-2">
                <i className="fa-light fa-bullseye-pointer text-xs" aria-hidden="true" />
                Content areas
              </TabsTrigger>
              <TabsTrigger value="curve" className="gap-2">
                <i className="fa-light fa-sliders text-xs" aria-hidden="true" />
                Curving & adjustments
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
            lowPbisCount={lowPbisCount}
            onJumpToItems={() => setActiveView('items')}
            onJumpToCurve={() => setActiveView('curve')}
          />
        </TabsContent>
        <TabsContent value="items" className="m-0">
          <ItemsView items={items} />
        </TabsContent>
        <TabsContent value="content-areas" className="m-0">
          <ContentAreasView courseId={course.id} />
        </TabsContent>
            <TabsContent value="curve" className="m-0">
              <CurveView scoreDist={scoreDist} items={items} />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <AssignPracticeDialog
        open={assignPracticeOpen}
        onOpenChange={setAssignPracticeOpen}
        assessmentTitle={assessment.title}
        defaultStudents={[
          { id: 's1', name: 'Joel Rondo',     initials: 'JR', scoreOnAssessment: 58, weakArea: items[0]?.objectiveTitle ?? 'Pharmacokinetics' },
          { id: 's2', name: 'Maya Patel',     initials: 'MP', scoreOnAssessment: 62, weakArea: items[0]?.objectiveTitle ?? 'Pharmacokinetics' },
          { id: 's3', name: 'Diego Alvarez',  initials: 'DA', scoreOnAssessment: 64, weakArea: items[1]?.objectiveTitle ?? 'Drug interactions' },
          { id: 's4', name: 'Hannah Chen',    initials: 'HC', scoreOnAssessment: 66, weakArea: items[1]?.objectiveTitle ?? 'Drug interactions' },
          { id: 's5', name: 'Tyler Brooks',   initials: 'TB', scoreOnAssessment: 68, weakArea: items[2]?.objectiveTitle ?? 'Adverse events' },
        ]}
        contentAreas={Array.from(
          new Map(items.filter(it => it.objectiveTitle).map(it => [it.objectiveTitle, { id: it.objectiveTitle, name: it.objectiveTitle }])).values()
        ).slice(0, 6)}
      />
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
function OverviewView({
  cohortAvg, cohortMedian, passingPct, scoreDist, negativeDiscCount, lowPbisCount,
  onJumpToItems, onJumpToCurve,
}: {
  cohortAvg: number; cohortMedian: number; passingPct: number; scoreDist: ScoreDist
  negativeDiscCount: number; lowPbisCount: number
  onJumpToItems: () => void; onJumpToCurve: () => void
}) {
  const meanTone: 'success' | 'info' | 'warning' = cohortAvg >= 80 ? 'success' : cohortAvg >= 70 ? 'info' : 'warning'
  return (
    <div className="flex flex-col gap-5">
      {/* Hero KPIs + alert callouts */}
      <section className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <Kpi icon="fa-chart-line" label="Cohort average" value={`${cohortAvg}%`} tone={meanTone} sub={`Median ${cohortMedian}%`} />
        <Kpi icon="fa-check-double" label="Pass rate" value={`${passingPct}%`} tone={passingPct >= 80 ? 'success' : passingPct >= 65 ? 'info' : 'warning'} sub={`${scoreDist.passing} of ${scoreDist.n} ≥ 70%`} />
        <Kpi icon="fa-square-root-variable" label="Std deviation" value="11.2" tone="neutral" sub="Spread of scores" />
        {(negativeDiscCount > 0 || lowPbisCount > 0) && (
          <Kpi
            icon="fa-triangle-exclamation"
            label="Items to review"
            value={negativeDiscCount + lowPbisCount}
            tone="warning"
            sub={`${negativeDiscCount} negative · ${lowPbisCount} low pbis`}
            onClick={onJumpToItems}
          />
        )}
      </section>

      {/* Quality alert callout */}
      {(negativeDiscCount > 0 || lowPbisCount > 0) && (
        <section
          className="rounded-xl border p-5"
          style={{
            background: 'color-mix(in oklch, var(--chart-4) 7%, var(--background))',
            borderColor: 'color-mix(in oklch, var(--chart-4) 28%, var(--border))',
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
                {negativeDiscCount > 0 && <><b>{negativeDiscCount}</b> negative-discriminator {negativeDiscCount === 1 ? 'item' : 'items'}</>}
                {negativeDiscCount > 0 && lowPbisCount > 0 && ' · '}
                {lowPbisCount > 0 && <><b>{lowPbisCount}</b> {lowPbisCount === 1 ? 'item' : 'items'} with point-biserial &lt; 0.15</>}
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
      <section className="rounded-xl border bg-card p-5" style={{ borderColor: 'var(--border)' }}>
        <header className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>
              Score distribution
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">10-point buckets · vertical line marks 70% passing threshold</p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded" style={{ background: 'var(--chart-2)' }} />Passing</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded" style={{ background: 'var(--chart-4)' }} />Below passing</span>
          </div>
        </header>
        <Histogram dist={scoreDist} />
      </section>
    </div>
  )
}

// Page KPI strip uses the shared kit; mini chart palettes still need a tone→color lookup.
const Kpi = KpiTile

const TONE: Record<'brand' | 'info' | 'warning' | 'success' | 'neutral', { bg: string; fg: string }> = {
  brand:   { bg: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))', fg: 'var(--brand-color-dark)' },
  info:    { bg: 'color-mix(in oklch, var(--chart-1) 12%, var(--background))',     fg: 'var(--chart-1)' },
  warning: { bg: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))',     fg: 'var(--chart-4)' },
  success: { bg: 'color-mix(in oklch, var(--chart-2) 12%, var(--background))',     fg: 'var(--chart-2)' },
  neutral: { bg: 'var(--muted)',                                                    fg: 'var(--muted-foreground)' },
}

// ─── Histogram ───────────────────────────────────────────────────────────────
function Histogram({ dist }: { dist: ScoreDist }) {
  const max = Math.max(...dist.histogram.map(b => b.count))
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 180 }}>
      {dist.histogram.map(b => {
        const isFailing = parseInt(b.bucket.split('-')[0], 10) < 70
        const heightPct = (b.count / max) * 100
        return (
          <div key={b.bucket} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold text-foreground tabular-nums">{b.count}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="w-full rounded-t transition-all hover:opacity-80 cursor-help"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: 6,
                    background: isFailing ? 'var(--chart-4)' : 'var(--chart-2)',
                    opacity: 0.85,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>{b.count} {b.count === 1 ? 'student' : 'students'} scored {b.bucket}%</TooltipContent>
            </Tooltip>
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
  const [sortBy, setSortBy] = useState<'severity' | 'order' | 'difficulty' | 'pbis'>('severity')
  const [filter, setFilter] = useState<'all' | 'flagged' | 'easy' | 'hard'>('all')

  const sorted = useMemo(() => {
    let list = [...items]
    if (filter === 'flagged') list = list.filter(i => i.negativeDiscriminator || i.pointBiserial < 0.15)
    if (filter === 'easy') list = list.filter(i => i.difficultyIndex >= 0.85)
    if (filter === 'hard') list = list.filter(i => i.difficultyIndex < 0.4)
    if (sortBy === 'severity') {
      list.sort((a, b) => {
        const sa = severityScore(a)
        const sb = severityScore(b)
        return sb - sa
      })
    } else if (sortBy === 'difficulty') list.sort((a, b) => a.difficultyIndex - b.difficultyIndex)
    else if (sortBy === 'pbis') list.sort((a, b) => a.pointBiserial - b.pointBiserial)
    else list.sort((a, b) => a.order - b.order)
    return list
  }, [items, sortBy, filter])

  return (
    <div className="flex flex-col gap-4">
      {/* Bird's-eye scatter — shows item-quality landscape at a glance */}
      <QuestionScatterPlot items={items} />

      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterChip label="Flagged" active={filter === 'flagged'} onClick={() => setFilter('flagged')} tone="warning" />
        <FilterChip label="Too easy (≥85%)" active={filter === 'easy'} onClick={() => setFilter('easy')} />
        <FilterChip label="Too hard (<40%)" active={filter === 'hard'} onClick={() => setFilter('hard')} />
        <span className="ms-auto text-xs text-muted-foreground">Sort by:</span>
        <FilterChip label="Severity" active={sortBy === 'severity'} onClick={() => setSortBy('severity')} small />
        <FilterChip label="Order" active={sortBy === 'order'} onClick={() => setSortBy('order')} small />
        <FilterChip label="Difficulty" active={sortBy === 'difficulty'} onClick={() => setSortBy('difficulty')} small />
        <FilterChip label="Point-biserial" active={sortBy === 'pbis'} onClick={() => setSortBy('pbis')} small />
      </div>
      <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div
          className="grid items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b"
          style={{ gridTemplateColumns: '40px minmax(0, 2fr) 100px 110px 130px 80px 80px', borderColor: 'var(--border)' }}
        >
          <div>#</div>
          <div>Question</div>
          <div>Difficulty</div>
          <div>Pt-biserial</div>
          <div>Distractor mix</div>
          <div>Objective</div>
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
  if (i.pointBiserial < 0.15) s += 30
  if (i.difficultyIndex < 0.3) s += 20
  if (i.difficultyIndex > 0.95) s += 10
  return s
}

function ItemRow({ item }: { item: Item }) {
  const flagged = item.negativeDiscriminator || item.pointBiserial < 0.15
  return (
    <div
      className={`grid items-start gap-3 px-4 py-3 border-b last:border-b-0 text-sm transition-colors ${flagged ? '' : 'hover:bg-muted/30'}`}
      style={{
        gridTemplateColumns: '40px minmax(0, 2fr) 100px 110px 130px 80px 80px',
        borderColor: 'var(--border)',
        background: item.negativeDiscriminator
          ? 'color-mix(in oklch, var(--chart-4) 5%, var(--background))'
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
                background: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))',
                color: 'var(--chart-4)',
                border: '1px solid color-mix(in oklch, var(--chart-4) 26%, transparent)',
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 9 }} />
              Negative
            </Badge>
          )}
          {!item.negativeDiscriminator && item.pointBiserial < 0.15 && (
            <Badge
              variant="secondary"
              className="rounded text-[10px] uppercase tracking-wider font-bold"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              Low pbis
            </Badge>
          )}
        </div>
        <p className="text-sm text-foreground line-clamp-2 leading-snug">{item.title}</p>
      </div>
      <DiffMini value={item.difficultyIndex} />
      <PbisMini value={item.pointBiserial} />
      <DistractorMini rates={item.distractorRates} />
      <span className="text-[11px] text-muted-foreground line-clamp-1" title={item.objectiveTitle}>{item.objectiveTitle}</span>
      <div className="text-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon-sm" aria-label="Open question detail">
              <Link href={`/questions/${item.questionId}`}>
                <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View question + distractor analysis</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

function DiffMini({ value }: { value: number }) {
  const tone = value < 0.4 ? 'warning' : value > 0.95 ? 'warning' : value < 0.85 ? 'success' : 'info'
  const palette = TONE[tone]
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: palette.fg }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color: palette.fg }}>{Math.round(value * 100)}%</span>
    </div>
  )
}

function PbisMini({ value }: { value: number }) {
  const tone = value < 0 ? 'warning' : value < 0.15 ? 'warning' : value < 0.25 ? 'info' : 'success'
  const palette = TONE[tone]
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-1.5 w-14 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
        {/* Center line */}
        <div aria-hidden="true" className="absolute top-0 bottom-0" style={{ left: '20%', width: 1, background: 'var(--border)' }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 w-1 rounded-full"
          style={{
            left: `calc(${Math.max(0, (value + 0.2) / 1.2 * 100)}% - 2px)`,
            background: palette.fg,
          }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color: palette.fg }}>{value.toFixed(2)}</span>
    </div>
  )
}

function DistractorMini({ rates }: { rates: number[] }) {
  const max = Math.max(...rates)
  const labels = ['A', 'B', 'C', 'D', 'E']
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-end gap-0.5 cursor-help">
          {rates.slice(0, 5).map((r, i) => {
            const isKey = r === max
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  style={{
                    width: 8, height: Math.max(2, Math.round(r * 24)),
                    background: isKey ? 'var(--chart-2)' : r > 0.2 ? 'var(--chart-4)' : 'var(--muted-foreground)',
                    borderRadius: 1,
                  }}
                />
                <span className="text-[8px] font-mono text-muted-foreground">{labels[i]}</span>
              </div>
            )
          })}
        </div>
      </TooltipTrigger>
      <TooltipContent>Pick rates · green = keyed · amber = strong distractor &gt;20%</TooltipContent>
    </Tooltip>
  )
}

function FilterChip({
  label, active, onClick, tone, small,
}: {
  label: string; active: boolean; onClick: () => void; tone?: 'warning'; small?: boolean
}) {
  const tonePalette = tone ? TONE[tone] : null
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${small ? 'px-2.5 py-0.5' : ''}`}
      style={{
        background: active
          ? tonePalette?.bg ?? 'color-mix(in oklch, var(--brand-color) 12%, var(--background))'
          : 'var(--muted)',
        color: active
          ? tonePalette?.fg ?? 'var(--brand-color-dark)'
          : 'var(--foreground)',
        border: `1px solid ${active ? (tonePalette?.fg ?? 'color-mix(in oklch, var(--brand-color) 24%, transparent)') : 'transparent'}`,
      }}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}

// ─── Content areas view ──────────────────────────────────────────────────────
function ContentAreasView({ courseId }: { courseId: string }) {
  const objectives = courseObjectives.filter(o => o.courseId === courseId)
  return (
    <div className="rounded-xl border bg-card p-5" style={{ borderColor: 'var(--border)' }}>
      <header className="mb-4">
        <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>
          Performance by content area / objective
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Aggregated student performance per objective on this assessment.
        </p>
      </header>
      <div className="flex flex-col gap-2.5">
        {objectives.map(o => {
          const tone = o.avgPerformance >= 80 ? 'success' : o.avgPerformance >= 70 ? 'info' : o.avgPerformance > 0 ? 'warning' : 'neutral'
          const palette = TONE[tone]
          return (
            <div key={o.id} className="flex items-center gap-3">
              <span className="text-sm text-foreground flex-1 truncate" title={o.title}>{o.title}</span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{o.questionCount} Qs</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-32 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                    <div className="h-full rounded-full" style={{ width: `${o.avgPerformance}%`, background: palette.fg }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-end" style={{ color: palette.fg }}>
                    {o.avgPerformance > 0 ? `${o.avgPerformance}%` : '—'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
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
        <div className="rounded-xl border bg-card p-5" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-foreground mb-3" style={{ fontSize: 14 }}>
            Bonus points (cohort-wide)
          </h3>
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
            Adds {bonus} {bonus === 1 ? 'point' : 'points'} to every student's score (capped at 100%).
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Exclude items from scoring
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Removed items don't count against students. Select any item to exclude it from grading.
          </p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
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
                      <Badge variant="secondary" className="rounded text-[10px] uppercase font-bold gap-1" style={{ background: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))', color: 'var(--chart-4)' }}>
                        <i className="fa-solid fa-triangle-exclamation text-[9px]" aria-hidden="true" />
                        Negative
                      </Badge>
                    )}
                    {!item.negativeDiscriminator && item.pointBiserial < 0.15 && (
                      <Badge variant="secondary" className="rounded text-[10px] uppercase font-bold" style={{ background: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))', color: 'var(--chart-4)' }}>
                        Low pbis
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground line-clamp-1 mt-0.5">{item.title}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Live preview */}
      <aside className="rounded-xl border bg-card p-5 self-start sticky top-2" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-semibold text-foreground mb-3" style={{ fontSize: 14 }}>
          Live preview
        </h3>
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
          <div className="mt-4 rounded-md border border-chart-2/30 bg-chart-2/10 p-3">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-chart-2 text-base" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">Curve applied</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {bonus > 0 ? `+${bonus} pt bonus · ` : ''}
              {excludedIds.size > 0 ? `${excludedIds.size} item${excludedIds.size === 1 ? '' : 's'} excluded` : 'no items excluded'}
            </p>
          </div>
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
      </aside>
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
