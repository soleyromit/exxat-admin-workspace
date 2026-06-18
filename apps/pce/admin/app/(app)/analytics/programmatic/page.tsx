'use client'

import { useMemo } from 'react'
import {
  Button, KeyMetrics,
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from '@exxatdesignux/ui'
import type { MetricItem, ChartConfig } from '@exxatdesignux/ui'
import {
  BarChart, Bar, XAxis, YAxis,
  LineChart, Line, CartesianGrid, Cell,
} from 'recharts'
import { SiteHeader } from '@/components/site-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { MOCK_SURVEYS, MOCK_PROG_QUESTION_SCORES } from '@/lib/pce-mock-data'

function surveyTypeName(name: string): string {
  if (name.includes('Alumni'))    return 'Alumni Outcomes'
  if (name.includes('Preceptor')) return 'Preceptor Satisfaction'
  if (name.includes('Exit'))      return 'Program Exit'
  return 'General'
}

function StatusLabel({ status }: { status: string }) {
  if (status === 'collecting') return <span className="text-xs font-medium" style={{ color: 'var(--brand-color)' }}>Collecting</span>
  if (status === 'released')   return <span className="text-xs font-medium" style={{ color: 'var(--chart-2)' }}>Released</span>
  if (status === 'scheduled')  return <span className="text-xs text-muted-foreground">Scheduled</span>
  if (status === 'draft')      return <span className="text-xs text-muted-foreground">Draft</span>
  return <span className="text-xs text-muted-foreground capitalize">{status.replace('_', ' ')}</span>
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

const rateConfig: ChartConfig = {
  rate: { label: 'Response rate', color: 'var(--brand-color)' },
}

type ProgSurveyRow = {
  id: string; name: string; type: string; status: string
  sent: number; responses: number; rate: number; deadline: string
} & Record<string, unknown>

const surveyColumns: ColumnDef<ProgSurveyRow>[] = [
  {
    key: 'name', label: 'Survey', sortable: true,
    cell: (row) => (
      <div className="min-w-0">
        <p className="text-sm font-medium truncate max-w-[200px]">{row.name}</p>
        <p className="text-xs text-muted-foreground">{row.type}</p>
      </div>
    ),
  },
  {
    key: 'status', label: 'Status', sortable: true,
    cell: (row) => <StatusLabel status={row.status} />,
  },
  {
    key: 'sent', label: 'Sent', sortable: true,
    header: () => <span className="block text-right">Sent</span>,
    cell: (row) => <div className="text-right tabular-nums text-sm">{row.sent}</div>,
  },
  {
    key: 'responses', label: 'Responses', sortable: true,
    header: () => <span className="block text-right">Responses</span>,
    cell: (row) => (
      <div className="text-right tabular-nums text-sm">
        {row.responses > 0 ? row.responses : '—'}
      </div>
    ),
  },
  {
    key: 'rate', label: 'Rate', sortable: true,
    header: () => <span className="block text-right">Rate</span>,
    cell: (row) => (
      <div className="text-right tabular-nums text-sm font-semibold">
        {row.rate > 0 ? `${row.rate}%` : '—'}
      </div>
    ),
  },
  {
    key: 'deadline', label: 'Deadline', sortable: true,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.deadline}</span>,
  },
]

export default function ProgrammaticAnalyticsPage() {
  const progSurveys = useMemo(
    () => MOCK_SURVEYS.filter(s => s.surveyType === 'programmatic'),
    [],
  )

  const surveyRows = useMemo((): ProgSurveyRow[] =>
    progSurveys.map(s => ({
      id:        s.id,
      name:      s.courseCode,
      type:      surveyTypeName(s.courseCode),
      status:    s.status,
      sent:      s.enrollmentCount,
      responses: s.responseCount,
      rate:      s.responseRate,
      deadline:  s.deadline,
    })),
    [progSurveys],
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

  /* Only show surveys with actual response data in the rate bar chart, ranked. */
  const rateData = useMemo(
    () => progSurveys
      .filter(s => s.responseRate > 0)
      .map(s => ({
        name: s.courseCode.split('—')[0].trim(),
        rate: s.responseRate,
      }))
      .sort((a, b) => b.rate - a.rate),
    [progSurveys],
  )

  /* Question scores for collecting surveys (alumni outcomes in Spring 2026). */
  const collectingSurveys = useMemo(
    () => progSurveys.filter(s => s.status === 'collecting' && MOCK_PROG_QUESTION_SCORES[s.id]),
    [progSurveys],
  )

  return (
    <>
      <SiteHeader title="Dashboard" />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: '14px 28px 0' }}>
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
          Dashboard
        </h1>
        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
          Export
        </Button>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="flex flex-col gap-6 max-w-4xl">

          {/* KPI strip */}
          <KeyMetrics variant="compact" metricsSingleRow metrics={kpis} />

          {/* Charts row: response rate + trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Response rate — only surveys with data */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Response rate — Spring 2026</CardTitle>
                <CardDescription>
                  {rateData.length > 0
                    ? 'Surveys currently collecting. Scheduled/draft shown in survey list below.'
                    : 'No surveys are collecting yet this period.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rateData.length > 0 ? (
                  <ChartContainer
                    config={rateConfig}
                    className="w-full"
                    style={{ height: 176 }}
                    role="img"
                    aria-label="Response rate by survey, Spring 2026"
                  >
                    <BarChart
                      layout="vertical"
                      data={rateData}
                      margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                    >
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={132}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Bar
                        dataKey="rate"
                        radius={[0, 3, 3, 0]}
                        maxBarSize={16}
                        background={{ fill: 'var(--muted)', radius: 3 }}
                        isAnimationActive={false}
                        label={{ position: 'right', formatter: (v: number) => `${v}%`, fontSize: 11, fill: 'var(--muted-foreground)' }}
                      >
                        {rateData.map((d, i) => (
                          <Cell key={i} fill={d.rate >= 80 ? 'var(--chart-2)' : d.rate >= 60 ? 'var(--brand-color)' : 'var(--chart-4)'} />
                        ))}
                      </Bar>
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value) => [`${value}%`, 'Response rate']}
                          />
                        }
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[100px] flex items-center justify-center text-sm text-muted-foreground">
                    No data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Response rate trend — last 4 terms */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Response rate trend</CardTitle>
                <CardDescription>Last 4 terms by survey type. Gap = not yet collected.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={trendConfig}
                  className="w-full"
                  style={{ height: 176 }}
                  role="img"
                  aria-label="Response rate trend across last 4 terms"
                >
                  <LineChart
                    data={PROG_TREND}
                    margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="term"
                      tick={{ fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v: number) => `${v}%`}
                      tick={{ fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [`${value}%`, '']}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="alumni"    stroke="var(--color-alumni)"    strokeWidth={2} dot={{ r: 3, fill: 'var(--color-alumni)'    }} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="preceptor" stroke="var(--color-preceptor)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-preceptor)' }} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="exit"      stroke="var(--color-exit)"      strokeWidth={2} dot={{ r: 3, fill: 'var(--color-exit)'      }} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Question-level scores for collecting surveys */}
          {collectingSurveys.map(survey => {
            const scores = MOCK_PROG_QUESTION_SCORES[survey.id] ?? []
            if (scores.length === 0) return null
            return (
              <Card key={survey.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Question scores — {surveyTypeName(survey.courseCode)}</CardTitle>
                  <CardDescription>
                    Avg score (1–5 scale) from {survey.responseCount} responses. {survey.enrollmentCount - survey.responseCount} not yet responded.
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                          {/* distribution bar (1→5 left to right) + labelled n */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 flex h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }} role="img" aria-label={`${Math.round(pct(pos))}% positive, ${Math.round(pct(neu))}% neutral, ${Math.round(pct(neg))}% needs improvement`}>
                              {neg > 0 && <div style={{ width: `${pct(neg)}%`, background: 'var(--chart-4)' }} />}
                              {neu > 0 && <div style={{ width: `${pct(neu)}%`, background: 'var(--muted-foreground)', opacity: 0.45 }} />}
                              {pos > 0 && <div style={{ width: `${pct(pos)}%`, background: 'var(--chart-2)' }} />}
                            </div>
                            <span className="shrink-0 w-20 text-right text-xs text-muted-foreground tabular-nums">n = {q.count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Survey list */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Surveys this period</h2>
            <p className="text-xs text-muted-foreground">
              All programmatic surveys. Scheduled and draft surveys show no responses yet.
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <DataTable<ProgSurveyRow>
                data={surveyRows}
                columns={surveyColumns}
                getRowId={(row) => row.id}
                selectable={false}
                searchable={false}
                toolbarSlot={() => null}
                emptyState={
                  <div className="flex flex-col items-center gap-2 py-6">
                    <i className="fa-light fa-clipboard-list text-2xl text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-medium">No surveys this period</p>
                    <p className="text-xs text-muted-foreground">Programmatic surveys appear here once scheduled or sent.</p>
                  </div>
                }
              />
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
