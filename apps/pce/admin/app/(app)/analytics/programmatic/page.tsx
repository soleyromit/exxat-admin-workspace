'use client'

import { useMemo } from 'react'
import {
  Button, KeyMetrics,
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
  chartTooltipKeyboardSyncProps,
} from '@exxatdesignux/ui'
import type { MetricItem, ChartConfig } from '@exxatdesignux/ui'
import {
  XAxis, YAxis, LineChart, Line, CartesianGrid, ReferenceLine, BarChart, Bar,
} from 'recharts'
import {
  ChartCard, ChartFigure, ChartDataTable,
  ChartLeoPlotInsightOverlay,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import { CHART_AXIS_TICK } from '@/lib/chart-typography'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SurveysTable } from '@/components/pce/surveys-table'
import { MOCK_SURVEYS, MOCK_PROG_QUESTION_SCORES } from '@/lib/pce-mock-data'

function surveyTypeName(name: string): string {
  if (name.includes('Alumni'))    return 'Alumni Outcomes'
  if (name.includes('Preceptor')) return 'Preceptor Satisfaction'
  if (name.includes('Exit'))      return 'Program Exit'
  return 'General'
}

/* Historical response rate trend — last 4 terms per survey type. null = not yet collected. */
const PROG_TREND: { term: string; alumni: number | null; preceptor: number | null; exit: number | null }[] = [
  { term: 'Fa 24', alumni: 72, preceptor: 68, exit: 78 },
  { term: 'Sp 25', alumni: 79, preceptor: 75, exit: 82 },
  { term: 'Fa 25', alumni: 79, preceptor: 79, exit: 85 },
  { term: 'Sp 26', alumni: 42, preceptor: null, exit: null },
]

const trendConfig: ChartConfig = {
  alumni:    { label: 'Alumni Outcomes',        color: 'var(--chart-1)' },
  preceptor: { label: 'Preceptor Satisfaction', color: 'var(--chart-2)' },
  exit:      { label: 'Program Exit',           color: 'var(--chart-3)' },
}

const RESPONSE_TARGET = 70

/* Sentiment-band distribution config (1–2 / 3 / 4–5 buckets). */
const progDistConfig: ChartConfig = {
  neg: { label: 'Needs improvement', color: 'var(--chart-4)' },
  neu: { label: 'Neutral',           color: 'var(--muted-foreground)' },
  pos: { label: 'Positive',          color: 'var(--chart-2)' },
}

// Leo insight — derived from PROG_TREND: the in-flight series vs target.
const PROG_TREND_LEO: ChartLeoInsight = (() => {
  const last = PROG_TREND[PROG_TREND.length - 1]
  const prev = PROG_TREND[PROG_TREND.length - 2]
  const collected = last.alumni != null ? last.alumni : null
  const delta = collected != null && prev.alumni != null ? collected - prev.alumni : null
  return {
    headline:
      collected != null && collected < RESPONSE_TARGET
        ? `Alumni Outcomes is at ${collected}% in ${last.term} — ${RESPONSE_TARGET - collected}% under target`
        : `Programmatic response rates are at or above the ${RESPONSE_TARGET}% target`,
    explanation:
      'Preceptor Satisfaction and Program Exit haven\'t started collecting this term — the alumni series is the only live signal, and it is still mid-collection.',
    kind: collected != null && collected < RESPONSE_TARGET ? 'dip' : 'trend',
    delta: delta != null ? { value: `${delta >= 0 ? '+' : ''}${delta}%`, label: `vs ${prev.term}` } : undefined,
    bullets: [
      `${last.term}: alumni ${last.alumni ?? '—'}% · preceptor ${last.preceptor ?? 'not started'} · exit ${last.exit ?? 'not started'}.`,
      `Prior term (${prev.term}): alumni ${prev.alumni}% · preceptor ${prev.preceptor}% · exit ${prev.exit}%.`,
    ],
    anchor: { xValue: last.term, yDataKeys: ['alumni', 'preceptor', 'exit'], yCombine: 'max' },
  }
})()

export default function ProgrammaticAnalyticsPage() {
  const progSurveys = useMemo(
    () => MOCK_SURVEYS.filter(s => s.surveyType === 'programmatic'),
    [],
  )

  const kpis: MetricItem[] = useMemo(() => {
    const totalResponses = progSurveys.reduce((sum, s) => sum + s.responseCount, 0)
    const totalSent      = progSurveys.reduce((sum, s) => sum + s.enrollmentCount, 0)
    const overallRate    = totalSent > 0 ? Math.round((totalResponses / totalSent) * 100) : 0
    const active         = progSurveys.filter(s => s.status === 'collecting').length
    return [
      { id: 'rate',      label: 'Response rate',   value: `${overallRate}%`,  delta: '', trend: 'neutral', description: `${totalSent} invited` },
      { id: 'responses', label: 'Total responses', value: totalResponses,     delta: '', trend: 'neutral', description: 'across all surveys' },
      { id: 'active',    label: 'Collecting',      value: active,             delta: '', trend: 'neutral', description: 'currently open' },
      { id: 'surveys',   label: 'Surveys',         value: progSurveys.length, delta: '', trend: 'neutral', description: 'this period' },
    ]
  }, [progSurveys])


  /* Question scores for collecting surveys (alumni outcomes in Spring 2026). */
  const collectingSurveys = useMemo(
    () => progSurveys.filter(s => s.status === 'collecting' && MOCK_PROG_QUESTION_SCORES[s.id]),
    [progSurveys],
  )

  return (
    <>
      <SiteHeader title="Dashboard" />

      <div className="flex items-center gap-2 shrink-0" style={{ padding: '14px 28px 0' }}>
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
          Dashboard
        </h1>
        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
          Export
        </Button>
        <Button size="sm" asChild>
          <Link href="/surveys/programmatic/push">
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Push surveys
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="flex flex-col gap-6 max-w-4xl">

          {/* KPI strip */}
          <KeyMetrics variant="compact" metricsSingleRow metrics={kpis} />

          {/* sr-only h2 bridges h1→h3 heading order (WCAG 2.4.6) */}
          <h2 className="sr-only">Overview</h2>

          {/* Response rate trend — DS OS ChartCard + Leo insight */}
          <ChartCard
            variant="normal"
            title="Response rate trend"
            description="Last 4 terms by survey type. Gap = not yet collected."
            leoInsight={PROG_TREND_LEO}
          >
            <ChartFigure
              label="Response rate trend"
              summary={`Line chart of response rates for alumni, preceptor, and exit surveys across the last ${PROG_TREND.length} terms against a ${RESPONSE_TARGET} percent target.`}
              dataLength={PROG_TREND.length}
            >
              {(activeIndex) => (
                <>
                  <div className="relative w-full">
                    <ChartContainer config={trendConfig} className="w-full" style={{ height: 176 }}>
                      <LineChart data={PROG_TREND} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="term" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} width={36} />
                        <ChartTooltip
                          key={chartTooltipKeyboardSyncProps(activeIndex).key}
                          {...chartTooltipKeyboardSyncProps(activeIndex).props}
                          content={<ChartTooltipContent formatter={(value) => [`${value}%`, '']} />}
                        />
                        <ReferenceLine y={RESPONSE_TARGET} stroke="var(--muted-foreground)" strokeDasharray="4 3" label={{ value: `${RESPONSE_TARGET}% target`, position: 'insideTopRight', fontSize: 12, fill: 'var(--muted-foreground)' }} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="alumni"    stroke="var(--color-alumni)"    strokeWidth={2} dot={{ r: 3, fill: 'var(--color-alumni)'    }} activeDot={{ r: 4, stroke: 'var(--ring)', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="preceptor" stroke="var(--color-preceptor)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-preceptor)' }} activeDot={{ r: 4, stroke: 'var(--ring)', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="exit"      stroke="var(--color-exit)"      strokeWidth={2} dot={{ r: 3, fill: 'var(--color-exit)'      }} activeDot={{ r: 4, stroke: 'var(--ring)', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
                      </LineChart>
                    </ChartContainer>
                    <ChartLeoPlotInsightOverlay data={PROG_TREND} xDataKey="term" />
                  </div>
                  <ChartDataTable
                    caption="Response rate trend"
                    headers={['Term', 'Alumni', 'Preceptor', 'Exit']}
                    rows={PROG_TREND.map(d => [d.term, d.alumni != null ? `${d.alumni}%` : '—', d.preceptor != null ? `${d.preceptor}%` : '—', d.exit != null ? `${d.exit}%` : '—'])}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>

          {/* Question-level scores for collecting surveys — DS OS ChartCard + Leo */}
          {collectingSurveys.map(survey => {
            const scores = MOCK_PROG_QUESTION_SCORES[survey.id] ?? []
            if (scores.length === 0) return null
            const lowest = scores.reduce((a, b) => (b.avg < a.avg ? b : a))
            const highest = scores.reduce((a, b) => (b.avg > a.avg ? b : a))
            const questionLeo: ChartLeoInsight = {
              headline:
                lowest.avg < 3.7
                  ? `The lowest-scoring question sits at ${lowest.avg.toFixed(1)}/5`
                  : `Every question scores at or above the 3.7 tier`,
              explanation:
                lowest.avg < 3.7
                  ? `"${lowest.text}" is dragging the survey average — its distribution shows where the dissatisfaction concentrates.`
                  : `"${highest.text}" leads at ${highest.avg.toFixed(1)}/5.`,
              kind: lowest.avg < 3.7 ? 'anomaly' : 'trend',
              delta: { value: (highest.avg - lowest.avg).toFixed(1), label: 'spread across questions' },
              bullets: scores.map(q => `${q.avg.toFixed(1)}/5 — ${q.text}`),
            }
            return (
              <ChartCard
                key={survey.id}
                variant="normal"
                title={`Question scores — ${surveyTypeName(survey.courseCode)}`}
                description={`Avg score (1–5 scale) from ${survey.responseCount} responses. ${survey.enrollmentCount - survey.responseCount} not yet responded.`}
                leoInsight={questionLeo}
              >
                  {/* Legend — explains the distribution bar + scale */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: 'var(--chart-4)' }} aria-hidden="true" />Needs improvement (1–2)</span>
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: 'var(--muted-foreground)', opacity: 0.45 }} aria-hidden="true" />Neutral (3)</span>
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: 'var(--chart-2)' }} aria-hidden="true" />Positive (4–5)</span>
                  </div>

                  <div className="flex flex-col">
                    {scores.map(q => {
                      const neg = (q.distribution[0] ?? 0) + (q.distribution[1] ?? 0)
                      const neu = q.distribution[2] ?? 0
                      const pos = (q.distribution[3] ?? 0) + (q.distribution[4] ?? 0)
                      const total = neg + neu + pos
                      const pct = (n: number) => total > 0 ? (n / total) * 100 : 0
                      const tier = q.avg >= 4.3 ? 'var(--chart-2)' : q.avg >= 3.7 ? 'var(--brand-color)' : 'var(--chip-4)'
                      return (
                        <div key={q.questionId} className="flex flex-col gap-2 py-3 border-b border-border last:border-0">
                          {/* full question text + labelled average */}
                          <div className="flex items-baseline justify-between gap-4">
                            <p className="text-sm flex-1">{q.text}</p>
                            <span className="shrink-0 text-sm tabular-nums">
                              <span className="font-semibold" style={{ color: tier }}>{q.avg.toFixed(1)}</span>
                              <span className="text-muted-foreground"> / 5 avg</span>
                            </span>
                          </div>
                          {/* distribution — DS stacked bar (decorative; the text row below carries values) */}
                          <div className="flex items-center gap-3">
                            <ChartContainer
                              config={progDistConfig}
                              className="aspect-auto flex-1"
                              style={{ height: 10 }}
                              aria-hidden="true"
                            >
                              <BarChart
                                accessibilityLayer={false}
                                layout="vertical"
                                data={[{ name: q.questionId, neg: pct(neg), neu: pct(neu), pos: pct(pos) }]}
                                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                              >
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis type="category" dataKey="name" hide />
                                <Bar dataKey="neg" stackId="d" fill="var(--color-neg)" radius={[5, 0, 0, 5]} barSize={10} isAnimationActive={false} />
                                <Bar dataKey="neu" stackId="d" fill="var(--color-neu)" fillOpacity={0.45} barSize={10} isAnimationActive={false} />
                                <Bar dataKey="pos" stackId="d" fill="var(--color-pos)" radius={[0, 5, 5, 0]} barSize={10} isAnimationActive={false} />
                              </BarChart>
                            </ChartContainer>
                            <span className="shrink-0 w-20 text-right text-xs text-muted-foreground tabular-nums">n = {q.count}</span>
                          </div>
                          {/* quantified breakdown */}
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {Math.round(pct(pos))}% positive · {Math.round(pct(neu))}% neutral · {Math.round(pct(neg))}% needs improvement
                          </p>
                        </div>
                      )
                    })}
                  </div>
              </ChartCard>
            )
          })}

          {/* Survey list — canonical surveys table (same as the Surveys nav), paginated */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Surveys</h2>
            <p className="text-xs text-muted-foreground">
              All programmatic surveys. Scheduled and draft surveys show no responses yet.
            </p>
            <SurveysTable mode="general" pageSize={10} />
          </div>

        </div>
      </div>
    </>
  )
}
