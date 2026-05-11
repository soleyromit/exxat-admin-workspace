'use client'

/**
 * CURRICULAR ASSESSMENT MATRIX — tabbed diagnostic.
 *
 * Aarti's pitch is a *three-way chain*: course objectives → questions tagged
 * to those objectives → cohort performance on assessments composed from those
 * questions. "No current software provides this complete chain."
 *
 * The chain is diagnosed across three views:
 *   - Performance: objectives × assessments × cohort-perf (where the chain is
 *     working / breaking on student outcomes)
 *   - Coverage:    objectives × question-difficulty mix (whether the chain's
 *     middle link — questions — is actually built)
 *   - Trend:       objectives across time (whether each objective is improving
 *     across successive assessments — i.e., is the loop closing)
 *
 * Closure happens via the page workflow (AI generate, intervention) — those
 * are the actions taken in response to what the chain reveals.
 */

import { useMemo } from 'react'
import {
  Button,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell,
} from '@exxat/ds/packages/ui/src'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import type { CourseObjective, Student, AssessmentReview } from '@/lib/faculty-mock-data'
import type { Assessment, QDiff } from '@/lib/qb-types'
import { MicroTrend, type MicroTrendPoint } from './micro-trend'

// ─── HoverCard wrapper — DS-styled rich tooltip (purpose-built for hover) ───
// Uses Radix HoverCard primitives directly so we get reliable hover behavior
// (built-in delay, gap-bridging between trigger and content, automatic close
// when cursor leaves both, portaled to body).
function MatrixHoverCard({
  trigger, children, side = 'top', align = 'center', className = 'w-72',
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}) {
  return (
    <HoverCardPrimitive.Root openDelay={60} closeDelay={120}>
      <HoverCardPrimitive.Trigger asChild>{trigger}</HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className={`z-50 rounded-md border border-border bg-popover text-popover-foreground p-3 shadow-md outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 ${className}`}
        >
          {children}
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  )
}

export type LoopNodeKey = 'objectives' | 'questions' | 'assessments' | 'intervention'

type AssessmentLike =
  | Assessment
  | {
      id: string
      courseId: string
      offeringId: string
      title: string
      questionCount: number
      durationMinutes: number
      diffDistribution?: Record<QDiff, number>
    }

export interface CurricularLoopDiagramProps {
  objectives: CourseObjective[]
  students: Student[]
  assessments: AssessmentLike[]
  cohortAvg: number
  reviewByAssessment: Map<string, AssessmentReview>
  onNodeClick?: (node: LoopNodeKey) => void
  onObjectiveClick?: (objectiveId: string) => void
}

// ─── Deterministic helpers ──────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

interface CellData {
  perf: number
  qCount: number
}

/** Decide whether (obj, asmt) is tested + per-cell perf and Q count. Stable. */
function buildCell(obj: CourseObjective, asmt: AssessmentLike, allAssessments: AssessmentLike[]): CellData | null {
  if (!obj.lastAssessed || obj.avgPerformance === 0) return null
  const covered = obj.assessmentsCovered
  if (covered <= 0) return null
  const ranked = [...allAssessments]
    .map(a => ({ id: a.id, rank: hashStr(obj.id + a.id) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, covered)
    .map(r => r.id)
  if (!ranked.includes(asmt.id)) return null

  const v = (hashStr(obj.id + asmt.id) % 1200) / 100 - 6
  const perf = Math.max(20, Math.min(99, Math.round(obj.avgPerformance + v)))
  const qCount = Math.max(1, Math.round(obj.questionCount / Math.max(1, covered)))
  return { perf, qCount }
}

/** Difficulty mix per objective — derived from Bloom level for a stable
 *  demo split. Higher Bloom levels skew Hard. */
function difficultyMix(obj: CourseObjective): { Easy: number; Medium: number; Hard: number } {
  const total = obj.questionCount
  const skew: Record<CourseObjective['bloomsLevel'], { e: number; m: number; h: number }> = {
    Remember:   { e: 0.55, m: 0.35, h: 0.10 },
    Understand: { e: 0.45, m: 0.40, h: 0.15 },
    Apply:      { e: 0.30, m: 0.45, h: 0.25 },
    Analyze:    { e: 0.20, m: 0.45, h: 0.35 },
    Evaluate:   { e: 0.15, m: 0.40, h: 0.45 },
    Create:     { e: 0.10, m: 0.35, h: 0.55 },
  }
  const s = skew[obj.bloomsLevel]
  const Easy   = Math.round(total * s.e)
  const Hard   = Math.round(total * s.h)
  const Medium = Math.max(0, total - Easy - Hard)
  return { Easy, Medium, Hard }
}

// ─── Performance tone palette (cell + popover) ──────────────────────────────

interface ToneStyle { bg: string; bar: string; text: string; label: string }
function perfTone(perf: number): ToneStyle {
  if (perf >= 80) return {
    bg:    'bg-chart-2/40',
    bar:   'bg-chart-2',
    text:  'text-chart-2',
    label: 'Healthy',
  }
  if (perf >= 70) return {
    bg:    'bg-chart-1/30',
    bar:   'bg-chart-1',
    text:  'text-chart-1',
    label: 'On track',
  }
  if (perf >= 60) return {
    bg:    'bg-chart-4/45',
    bar:   'bg-chart-4',
    text:  'text-chart-4',
    label: 'Underperforming',
  }
  return {
    bg:    'bg-chart-5/35',
    bar:   'bg-chart-5',
    text:  'text-chart-5',
    label: 'Critical',
  }
}

function shortAssessmentLabel(title: string): string {
  const parts = title.split(/\s+/)
  const num = parts.find(p => /\d/.test(p))
  if (num && parts[0]) return `${parts[0]} ${num}`
  return parts.slice(0, 2).join(' ')
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CurricularLoopDiagram({
  objectives, assessments, onObjectiveClick,
}: CurricularLoopDiagramProps) {
  const tested   = useMemo(() => objectives.filter(o => o.lastAssessed && o.avgPerformance > 0), [objectives])
  const untested = useMemo(() => objectives.filter(o => !o.lastAssessed), [objectives])

  return (
    <div className="flex flex-col gap-4 w-full">
      <Tabs defaultValue="performance" className="w-full">
        <TabsList variant="line">
          <TabsTrigger value="performance">
            <i className="fa-light fa-grid-2 me-1.5" aria-hidden="true" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="coverage">
            <i className="fa-light fa-rectangle-list me-1.5" aria-hidden="true" />
            Coverage
          </TabsTrigger>
          <TabsTrigger value="trend">
            <i className="fa-light fa-chart-line me-1.5" aria-hidden="true" />
            Trend
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="pt-4">
          <PerformanceHeatmap
            tested={tested}
            assessments={assessments}
            onObjectiveClick={onObjectiveClick}
          />
        </TabsContent>

        <TabsContent value="coverage" className="pt-4">
          <CoverageView
            objectives={objectives}
            onObjectiveClick={onObjectiveClick}
          />
        </TabsContent>

        <TabsContent value="trend" className="pt-4">
          <TrendView
            tested={tested}
            assessments={assessments}
            onObjectiveClick={onObjectiveClick}
          />
        </TabsContent>
      </Tabs>

      {/* Untested strip — present on every tab; the chain is broken at this end */}
      {untested.length > 0 && (
        <div className="rounded-lg border border-dashed border-chart-4/40 bg-chart-4/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-light fa-circle-dashed text-chart-4 text-sm" aria-hidden="true" />
            <p className="text-xs font-semibold text-foreground">
              {untested.length} {untested.length === 1 ? 'objective is' : 'objectives are'} not yet assessed
            </p>
            <span className="text-[10px] text-muted-foreground">
              · No data on any tab — coverage gap
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {untested.map(o => (
              <li key={o.id} className="flex items-center gap-2 text-xs text-foreground">
                <span className="size-1.5 rounded-full bg-chart-4 shrink-0" aria-hidden="true" />
                <Button
                  variant="ghost"
                  onClick={onObjectiveClick ? () => onObjectiveClick(o.id) : undefined}
                  className="line-clamp-1 flex-1 justify-start text-start hover:text-brand h-auto p-0 whitespace-normal font-normal"
                  title={o.title}
                >
                  {o.title}
                </Button>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {o.questionCount} {o.questionCount === 1 ? 'question' : 'questions'} tagged
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Tab 1 · Performance heatmap ────────────────────────────────────────────

function PerformanceHeatmap({
  tested, assessments, onObjectiveClick,
}: {
  tested: CourseObjective[]
  assessments: AssessmentLike[]
  onObjectiveClick?: (id: string) => void
}) {
  const grid = useMemo(() => tested.map(obj => ({
    obj,
    cells: assessments.map(a => ({ asmt: a, data: buildCell(obj, a, assessments) })),
  })), [tested, assessments])

  const rowSummary = (cells: { data: CellData | null }[]) => {
    const data = cells.map(c => c.data).filter(Boolean) as CellData[]
    if (data.length === 0) return { perf: 0, n: 0 }
    return { perf: Math.round(data.reduce((s, c) => s + c.perf, 0) / data.length), n: data.length }
  }
  const colSummary = (i: number) => {
    const data = grid.map(r => r.cells[i].data).filter(Boolean) as CellData[]
    if (data.length === 0) return { perf: 0, n: 0 }
    return { perf: Math.round(data.reduce((s, c) => s + c.perf, 0) / data.length), n: data.length }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Legend strip — same pattern across all matrix tabs */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[10px] uppercase tracking-wider text-muted-foreground px-1">
        <LegendDot tone="success"     label="≥ 80%" />
        <LegendDot tone="info"        label="70 – 79%" />
        <LegendDot tone="warning"     label="60 – 69%" />
        <LegendDot tone="destructive" label="< 60%" />
        <LegendDot tone="empty"       label="Not tested" />
        <span className="ms-auto text-[10px] text-muted-foreground/70">
          Hover for details · click for deep-dive
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 bg-card text-start px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground border-b border-border" style={{ minWidth: 220 }}>
                Objective
              </TableHead>
              {assessments.map(a => (
                <TableHead
                  key={a.id}
                  className="px-2 py-2 text-[10px] font-medium border-b border-border align-bottom"
                  style={{ minWidth: 92 }}
                >
                  <div className="flex flex-col items-center gap-0.5" title={a.title}>
                    <span className="line-clamp-1 max-w-[88px] font-semibold text-foreground">
                      {shortAssessmentLabel(a.title)}
                    </span>
                    <span className="text-[9px] text-muted-foreground/80 font-mono">
                      {a.questionCount} Qs
                    </span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground border-b border-border text-end" style={{ minWidth: 80 }}>
                Avg
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {grid.map(({ obj, cells }) => {
              const summary = rowSummary(cells)
              const summaryTone = perfTone(summary.perf || 0)
              return (
                <TableRow key={obj.id} className="hover:bg-muted/20">
                  <TableHead
                    scope="row"
                    className="sticky left-0 z-10 bg-card text-start px-3 py-2 border-b border-border align-middle"
                  >
                    <Button
                      variant="ghost"
                      onClick={onObjectiveClick ? () => onObjectiveClick(obj.id) : undefined}
                      className="text-start group flex flex-col items-start justify-start gap-0.5 h-auto p-0 max-w-[220px] whitespace-normal font-normal hover:bg-transparent"
                    >
                      <span
                        className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-brand transition-colors"
                        title={obj.title}
                      >
                        {obj.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {obj.bloomsLevel} · {obj.questionCount} Qs
                      </span>
                    </Button>
                  </TableHead>

                  {cells.map(({ asmt, data }) => (
                    <TableCell
                      key={asmt.id}
                      className="px-1.5 py-1.5 border-b border-border align-middle text-center"
                    >
                      {data ? (
                        <CellWithPopover
                          objTitle={obj.title}
                          objBlooms={obj.bloomsLevel}
                          asmtTitle={asmt.title}
                          perf={data.perf}
                          qCount={data.qCount}
                          lastAssessed={obj.lastAssessed}
                          onClick={onObjectiveClick ? () => onObjectiveClick(obj.id) : undefined}
                        />
                      ) : (
                        <EmptyCellWithPopover objTitle={obj.title} asmtTitle={asmt.title} />
                      )}
                    </TableCell>
                  ))}

                  <TableCell className="px-3 py-1.5 border-b border-border align-middle text-end">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-sm font-bold tabular-nums ${summaryTone.text}`}>
                        {summary.perf > 0 ? `${summary.perf}%` : '—'}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {summary.n} {summary.n === 1 ? 'asmt' : 'asmts'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>

          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 bg-muted/60 text-start px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground" style={{ borderTop: '2px solid var(--border)' }}>
                Cohort avg
              </TableHead>
              {assessments.map((a, i) => {
                const s = colSummary(i)
                const tone = s.perf > 0 ? perfTone(s.perf) : null
                return (
                  <TableCell
                    key={a.id}
                    className="bg-muted/60 px-2 py-2.5 text-center"
                    style={{ borderTop: '2px solid var(--border)' }}
                  >
                    {tone ? (
                      <span className={`text-sm font-bold font-mono tabular-nums ${tone.text}`}>
                        {s.perf}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )
              })}
              <TableCell className="bg-muted/60 px-3 py-2.5" style={{ borderTop: '2px solid var(--border)' }} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}

// ─── Cell with hover-popover (light bg, readable) ───────────────────────────

function CellWithPopover({
  objTitle, objBlooms, asmtTitle, perf, qCount, lastAssessed, onClick,
}: {
  objTitle: string
  objBlooms: CourseObjective['bloomsLevel']
  asmtTitle: string
  perf: number
  qCount: number
  lastAssessed: string | null
  onClick?: () => void
}) {
  const tone = perfTone(perf)

  return (
    <MatrixHoverCard
      trigger={
        <Button
          variant="ghost"
          onClick={onClick}
          className={[
            'w-full h-9 rounded-md flex items-center justify-center font-mono text-sm font-bold tabular-nums',
            'text-foreground',
            tone.bg,
            'hover:ring-2 hover:ring-offset-1 hover:ring-foreground/20',
          ].join(' ')}
          aria-label={`${objTitle} on ${asmtTitle}: ${perf}%`}
        >
          {perf}
        </Button>
      }
    >
        <div className="flex flex-col gap-2.5">
          <div>
            <p className="text-sm font-semibold text-foreground leading-snug">{objTitle}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              On <span className="text-foreground font-medium">{asmtTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-2 flex-1 rounded-full overflow-hidden bg-muted">
              <div
                className={`h-full rounded-full ${tone.bar}`}
                style={{ width: `${perf}%` }}
              />
            </div>
            <span className={`text-xl font-bold tabular-nums ${tone.text}`}>
              {perf}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${tone.bar}`} aria-hidden="true" />
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${tone.text}`}>
              {tone.label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            <PopStat label="Questions" value={String(qCount)} />
            <PopStat label="Bloom"     value={objBlooms} />
            <PopStat label="Last seen" value={formatDateShort(lastAssessed)} />
          </div>

          {onClick && (
            <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
              Click cell to drill into this objective
            </p>
          )}
        </div>
    </MatrixHoverCard>
  )
}

function EmptyCellWithPopover({ objTitle, asmtTitle }: { objTitle: string; asmtTitle: string }) {
  return (
    <MatrixHoverCard
      className="w-64"
      trigger={
        <Button
          variant="ghost"
          className="w-full h-9 rounded-md flex items-center justify-center cursor-help"
          style={{
            backgroundColor: 'var(--muted)',
            backgroundImage: 'repeating-linear-gradient(135deg, transparent 0, transparent 4px, color-mix(in oklch, var(--muted-foreground) 18%, transparent) 4px, color-mix(in oklch, var(--muted-foreground) 18%, transparent) 5px)',
          }}
          aria-label={`${objTitle} not tested in ${asmtTitle}`}
        >
          <i className="fa-light fa-slash text-muted-foreground/60 text-[11px]" aria-hidden="true" />
        </Button>
      }
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-foreground leading-snug">{objTitle}</p>
        <p className="text-[11px] text-muted-foreground">
          Not tested in <span className="text-foreground">{asmtTitle}</span>
        </p>
        <p className="text-[10px] text-muted-foreground border-t border-border pt-2 mt-1">
          Coverage gap — consider adding tagged questions
        </p>
      </div>
    </MatrixHoverCard>
  )
}

function PopStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span className="text-xs font-semibold text-foreground truncate">
        {value}
      </span>
    </div>
  )
}

// ─── Tab 2 · Coverage view ──────────────────────────────────────────────────

function CoverageView({
  objectives, onObjectiveClick,
}: {
  objectives: CourseObjective[]
  onObjectiveClick?: (id: string) => void
}) {
  const totalQuestions = objectives.reduce((s, o) => s + o.questionCount, 0)
  const maxObjQ = Math.max(1, ...objectives.map(o => o.questionCount))

  const overallMix = objectives.reduce(
    (acc, o) => {
      const m = difficultyMix(o)
      return { Easy: acc.Easy + m.Easy, Medium: acc.Medium + m.Medium, Hard: acc.Hard + m.Hard }
    },
    { Easy: 0, Medium: 0, Hard: 0 },
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Legend strip — same pattern across all matrix tabs */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[10px] uppercase tracking-wider text-muted-foreground px-1">
        <LegendSwatch tone="easy"   label="Easy" />
        <LegendSwatch tone="medium" label="Medium" />
        <LegendSwatch tone="hard"   label="Hard" />
        <span className="ms-auto text-[10px] text-muted-foreground/70">
          {totalQuestions} questions across {objectives.length} objectives
        </span>
      </div>

      {/* Single body card — overall row at top, per-objective rows below */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <ul className="divide-y divide-border">
          {/* Overall mix — same row layout as objectives below for visual alignment */}
          <li className="px-4 py-3 flex items-center gap-3 bg-muted/30">
            <div className="flex flex-col gap-0.5 w-[220px] shrink-0">
              <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
                Overall mix
              </span>
              <span className="text-[10px] text-muted-foreground">
                Across all objectives
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <StackedDiffBar mix={overallMix} max={totalQuestions} />
            </div>
            <span className="text-xs font-mono tabular-nums text-foreground shrink-0 w-24 text-end">
              {totalQuestions} {totalQuestions === 1 ? 'Q' : 'Qs'}
            </span>
          </li>

          {/* Per-objective rows */}
          {objectives.map(o => {
            const mix = difficultyMix(o)
            return (
              <CoverageRow
                key={o.id}
                obj={o}
                mix={mix}
                max={maxObjQ}
                onClick={onObjectiveClick ? () => onObjectiveClick(o.id) : undefined}
              />
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// ─── Coverage row with hover-popover (per-objective breakdown) ──────────────
function CoverageRow({
  obj, mix, max, onClick,
}: {
  obj: CourseObjective
  mix: { Easy: number; Medium: number; Hard: number }
  max: number
  onClick?: () => void
}) {
  const total = mix.Easy + mix.Medium + mix.Hard
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0

  return (
    <li className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
      <Button
        variant="ghost"
        onClick={onClick}
        className="flex flex-col items-start justify-start gap-0.5 w-[220px] shrink-0 h-auto p-0 text-start whitespace-normal font-normal group hover:bg-transparent"
      >
        <span
          className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-brand transition-colors"
          title={obj.title}
        >
          {obj.title}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {obj.bloomsLevel}
        </span>
      </Button>

      <MatrixHoverCard
        trigger={
          <Button
            variant="ghost"
            onClick={onClick}
            className="flex-1 min-w-0 h-auto p-0 rounded-full hover:bg-transparent"
            aria-label={`${obj.title} difficulty mix · ${total} questions`}
          >
            <StackedDiffBar mix={mix} max={max} />
          </Button>
        }
      >
        <div className="flex flex-col gap-2.5">
          <div>
            <p className="text-sm font-semibold text-foreground leading-snug">{obj.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {obj.bloomsLevel} · {total} {total === 1 ? 'question' : 'questions'} tagged
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <DifficultyBreakdownRow tone="easy"   label="Easy"   count={mix.Easy}   pct={pct(mix.Easy)} />
            <DifficultyBreakdownRow tone="medium" label="Medium" count={mix.Medium} pct={pct(mix.Medium)} />
            <DifficultyBreakdownRow tone="hard"   label="Hard"   count={mix.Hard}   pct={pct(mix.Hard)} />
          </div>

          {onClick && (
            <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
              Click to drill into this objective
            </p>
          )}
        </div>
      </MatrixHoverCard>

      <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0 w-24 text-end">
        {obj.questionCount} {obj.questionCount === 1 ? 'Q' : 'Qs'}
      </span>
    </li>
  )
}

function DifficultyBreakdownRow({
  tone, label, count, pct,
}: {
  tone: 'easy' | 'medium' | 'hard'
  label: string
  count: number
  pct: number
}) {
  const cls = DIFF_BG[tone]
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2.5 rounded-sm shrink-0 ${cls}`} aria-hidden="true" />
      <span className="text-xs font-medium text-foreground w-16 shrink-0">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0 w-14 text-end">
        {count} · {pct}%
      </span>
    </div>
  )
}

function StackedDiffBar({
  mix, max,
}: {
  mix: { Easy: number; Medium: number; Hard: number }
  max: number
}) {
  const total = mix.Easy + mix.Medium + mix.Hard
  if (total === 0) return null
  const pct = (n: number) => `${(n / max) * 100}%`
  return (
    <div className="h-3 w-full rounded-full overflow-hidden bg-muted/40 flex">
      <div className={DIFF_BG.easy}   style={{ width: pct(mix.Easy)   }} title={`Easy: ${mix.Easy}`} />
      <div className={DIFF_BG.medium} style={{ width: pct(mix.Medium) }} title={`Medium: ${mix.Medium}`} />
      <div className={DIFF_BG.hard}   style={{ width: pct(mix.Hard)   }} title={`Hard: ${mix.Hard}`} />
    </div>
  )
}

// ─── Tab 3 · Trend view ─────────────────────────────────────────────────────

function TrendView({
  tested, assessments, onObjectiveClick,
}: {
  tested: CourseObjective[]
  assessments: AssessmentLike[]
  onObjectiveClick?: (id: string) => void
}) {
  // Same per-cell perf data as the heatmap — ordered by assessment index.
  // Reads the timeline left → right by the same ranking the heatmap uses.
  const series = useMemo(
    () => tested.map(obj => ({
      obj,
      points: assessments.map(a => ({ asmt: a, data: buildCell(obj, a, assessments) })),
    })),
    [tested, assessments],
  )

  // Cohort-wide trend — average performance per assessment across all objectives.
  const cohortPoints = useMemo(() => assessments.map(a => {
    const perfs = tested
      .map(obj => buildCell(obj, a, assessments)?.perf)
      .filter((p): p is number => typeof p === 'number')
    if (perfs.length === 0) return { asmt: a, data: null as CellData | null }
    const avg = Math.round(perfs.reduce((s, p) => s + p, 0) / perfs.length)
    return { asmt: a, data: { perf: avg, qCount: 0 } as CellData }
  }), [tested, assessments])

  return (
    <div className="flex flex-col gap-3">
      {/* Legend strip — mirrors Coverage tab pattern */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[10px] uppercase tracking-wider text-muted-foreground px-1">
        <LegendDot tone="success"     label="≥ 80%" />
        <LegendDot tone="info"        label="70 – 79%" />
        <LegendDot tone="warning"     label="60 – 69%" />
        <LegendDot tone="destructive" label="< 60%" />
        <span className="ms-auto text-[10px] text-muted-foreground/70">
          Each row = one objective across this course&apos;s timeline
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <ul className="divide-y divide-border">
          {/* Cohort overall trend — same row layout for visual alignment */}
          <TrendRow
            obj={{ id: '__cohort__', code: '__cohort__', title: 'Cohort overall', bloomsLevel: 'Understand', courseId: '', questionCount: 0, assessmentsCovered: 0, lastAssessed: null, avgPerformance: 0 } satisfies CourseObjective}
            points={cohortPoints}
            isOverall
            labelOverride={{ title: 'Cohort overall', sub: 'Average across all objectives' }}
          />
          {series.map(({ obj, points }) => (
            <TrendRow
              key={obj.id}
              obj={obj}
              points={points}
              onClick={onObjectiveClick ? () => onObjectiveClick(obj.id) : undefined}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

function TrendRow({
  obj, points, onClick, isOverall, labelOverride,
}: {
  obj: CourseObjective
  points: { asmt: AssessmentLike; data: CellData | null }[]
  onClick?: () => void
  isOverall?: boolean
  labelOverride?: { title: string; sub: string }
}) {
  // viewBox aspect intentionally matches rendered height so the line shape
  // is honest. MicroTrend with sizing="fluid" stretches across the column.
  // We keep xs/ys locally for the HTML dot overlay (dots must stay circular
  // regardless of column width, so they can't live inside the stretching SVG).
  const W = 100
  const H = 32
  const PAD_X = 2
  const PAD_Y = 3
  const filled = points.filter(p => p.data !== null) as { asmt: AssessmentLike; data: CellData }[]

  // Each timeline column gets an evenly-spaced x. Filled points only define y.
  const xs = points.map((_, i) =>
    points.length > 1 ? PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2) : W / 2
  )
  const ys = points.map(p =>
    p.data ? H - PAD_Y - (p.data.perf / 100) * (H - PAD_Y * 2) : null
  )

  const first   = filled[0]?.data?.perf ?? 0
  const last    = filled[filled.length - 1]?.data?.perf ?? 0
  const delta   = last - first
  const lastTone = perfTone(last)

  // Find the last filled point index — drives the dot ring overlay.
  const lastIdx  = (() => { for (let i = points.length - 1; i >= 0; i--) if (points[i].data) return i; return -1 })()

  const title = labelOverride?.title ?? obj.title
  const sub = labelOverride?.sub ?? `${filled.length} of ${points.length} assessments · started ${first}%`

  // Map points → MicroTrendPoint | null (gaps preserve column spacing).
  const trendPoints: ReadonlyArray<MicroTrendPoint | null> = points.map(p =>
    p.data ? { value: p.data.perf, label: p.asmt.title } : null
  )

  return (
    <li className={`px-4 py-3 flex items-center gap-3 transition-colors ${isOverall ? 'bg-muted/30' : 'hover:bg-muted/30'}`}>
      {isOverall ? (
        <div className="flex flex-col gap-0.5 w-[220px] shrink-0">
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
            {title}
          </span>
          <span className="text-[10px] text-muted-foreground">{sub}</span>
        </div>
      ) : (
        <Button
          variant="ghost"
          onClick={onClick}
          className="flex flex-col items-start justify-start gap-0.5 w-[220px] shrink-0 h-auto p-0 text-start whitespace-normal font-normal group hover:bg-transparent"
        >
          <span
            className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-brand transition-colors"
            title={title}
          >
            {title}
          </span>
          <span className="text-[10px] text-muted-foreground">{sub}</span>
        </Button>
      )}

      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className={`relative h-14 w-full ${lastTone.text}`} role="img" aria-label={`${title} performance trend`}>
          {/* MicroTrend = shared inline-sparkline primitive (line + area + reference line).
              Color is inherited via currentColor from the parent tone class — that way the
              line + area tracks `perfTone(last)` without lifting tone palette into the primitive.
              HTML dot overlays are rendered below the SVG so they stay perfectly circular. */}
          <MicroTrend
            points={trendPoints}
            sizing="fluid"
            width={W}
            height={H}
            stroke="currentColor"
            areaFill="currentColor"
            referenceLine={70}
            strokeWidth={1.8}
            ariaLabel={null}
            className="absolute inset-0 h-full w-full"
          />
          {/* Dots — HTML overlay so they stay perfectly circular regardless of width.
              Latest dot gets a brand-emphasis ring so the eye lands on "now". */}
          {points.map((p, i) => {
            const y = ys[i]
            if (!p.data || y === null) return null
            const dotTone = perfTone(p.data.perf)
            const isLatest = i === lastIdx
            return (
              <MatrixHoverCard
                key={p.asmt.id}
                className="w-64"
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className={[
                      'absolute rounded-full bg-current p-0',
                      dotTone.text,
                      isLatest
                        ? 'size-3.5 ring-[3px] ring-card hover:scale-110 shadow-sm'
                        : 'size-2.5 ring-2 ring-card hover:size-3.5',
                    ].join(' ')}
                    style={{
                      left: `${(xs[i] / W) * 100}%`,
                      top: `${(y / H) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    aria-label={`${p.asmt.title}: ${p.data.perf}%${isLatest ? ' (latest)' : ''}`}
                  />
                }
              >
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-foreground leading-snug">{p.asmt.title}</p>
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 flex-1 rounded-full overflow-hidden bg-muted">
                      <div className={`h-full rounded-full ${dotTone.bar}`} style={{ width: `${p.data.perf}%` }} />
                    </div>
                    <span className={`text-base font-bold tabular-nums ${dotTone.text}`}>
                      {p.data.perf}%
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground border-t border-border pt-2">
                    {p.data.qCount > 0
                      ? `${p.data.qCount} ${p.data.qCount === 1 ? 'question' : 'questions'} on this objective`
                      : 'Cohort average across all objectives in this assessment'}
                  </div>
                </div>
              </MatrixHoverCard>
            )
          })}
        </div>

        <div className="flex flex-col items-end gap-0.5 shrink-0 w-24">
          <span className={`text-sm font-bold tabular-nums ${lastTone.text}`}>
            {last > 0 ? `${last}%` : '—'}
          </span>
          {filled.length >= 2 && (
            <span className={`text-[10px] font-mono tabular-nums ${delta >= 0 ? 'text-chart-2' : 'text-chart-5'}`}>
              <i className={`fa-light ${delta >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} me-0.5`} aria-hidden="true" style={{ fontSize: 9 }} />
              {delta >= 0 ? '+' : ''}{delta} pts
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

// ─── Legend bits ────────────────────────────────────────────────────────────

function LegendDot({
  tone, label,
}: {
  tone: 'success' | 'info' | 'warning' | 'destructive' | 'empty'
  label: string
}) {
  if (tone === 'empty') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-3 rounded-sm"
          aria-hidden="true"
          style={{
            backgroundColor: 'var(--muted)',
            backgroundImage: 'repeating-linear-gradient(135deg, transparent 0, transparent 2px, color-mix(in oklch, var(--muted-foreground) 25%, transparent) 2px, color-mix(in oklch, var(--muted-foreground) 25%, transparent) 3px)',
          }}
        />
        <span>{label}</span>
      </span>
    )
  }
  const cls =
    tone === 'success'      ? 'bg-chart-2/40 border border-chart-2/60' :
    tone === 'info'         ? 'bg-chart-1/30 border border-chart-1/50' :
    tone === 'warning'      ? 'bg-chart-4/45 border border-chart-4/60' :
                              'bg-chart-5/35 border border-chart-5/55'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-3 rounded-sm ${cls}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

// Coverage palette: Easy / Medium / Hard. Per Vishaka's color critique +
// universal LMS convention — green / amber / red, not teal / blue / gold.
const DIFF_BG: Record<'easy' | 'medium' | 'hard', string> = {
  easy:   'bg-chart-2/70',          // green-tinted (chart-2 = teal-green family)
  medium: 'bg-chart-4/80',          // amber
  hard:   'bg-chart-5/70',          // orange (Aarti's no-red rule)
}

function LegendSwatch({
  tone, label,
}: {
  tone: 'easy' | 'medium' | 'hard'
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-3 rounded-sm ${DIFF_BG[tone]}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
