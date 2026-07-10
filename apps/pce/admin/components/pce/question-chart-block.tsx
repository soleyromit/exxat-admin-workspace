'use client'

import { BarChart, Bar, XAxis, YAxis } from 'recharts'
import {
  Button,
  ChartContainer,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import type { TemplateQuestion, QuestionScore } from '@/lib/pce-mock-data'
import {
  MOCK_OPEN_TEXT_RESPONSES,
  medianFromDistribution,
  programAvgForQuestion,
} from '@/lib/pce-mock-data'

export function tierColor(avg: number): string {
  return avg >= 4.3 ? 'var(--chart-2)'
    : avg >= 3.7   ? 'var(--chart-5)'
    :                'var(--chart-4)'
}

function DistributionBars({
  distribution,
  avg,
}: {
  distribution: [number, number, number, number, number]
  avg: number
}) {
  const fill = tierColor(avg)

  const data = [
    { r: '5', count: distribution[4] },
    { r: '4', count: distribution[3] },
    { r: '3', count: distribution[2] },
    { r: '2', count: distribution[1] },
    { r: '1', count: distribution[0] },
  ]

  const config: ChartConfig = { count: { label: 'Responses', color: fill } }

  return (
    <ChartContainer config={config} className="h-[88px] w-full" role="img" aria-label="Rating distribution">
      <BarChart
        accessibilityLayer
        layout="vertical"
        data={data}
        margin={{ top: 2, right: 32, bottom: 2, left: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="r"
          width={14}
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
        />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={[0, 3, 3, 0]}
          maxBarSize={8}
          background={{ fill: 'var(--muted)' }}
        />
      </BarChart>
    </ChartContainer>
  )
}

interface QuestionChartBlockProps {
  question: TemplateQuestion
  questionNumber: number
  score?: QuestionScore
  freeTextCount?: number
  surveyId: string
  isLast?: boolean
  /** Scroll anchor id — target for the survey response rail (scrollspy). */
  anchorId?: string
}

export function QuestionChartBlock({
  question,
  questionNumber,
  score,
  freeTextCount,
  surveyId,
  isLast,
  anchorId,
}: QuestionChartBlockProps) {
  const isFreeText = question.answerType === 'free_text'

  const freeTextResponses = isFreeText
    ? MOCK_OPEN_TEXT_RESPONSES.filter(
        r => r.surveyId === surveyId && r.questionText === question.text
      )
    : []

  const count = freeTextCount ?? freeTextResponses.length

  return (
    <div
      id={anchorId}
      style={{
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        scrollMarginTop: 16,
      }}
    >
      {/* Question header row */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span
            className="text-xs shrink-0 tabular-nums mt-px"
            style={{ color: 'var(--muted-foreground)', minWidth: 20 }}
          >
            Q{questionNumber}
          </span>
          <p className="text-sm leading-snug">{question.text}</p>
        </div>
        {!isFreeText && score && (
          <div className="flex items-baseline gap-1 shrink-0">
            <span
              className="text-base font-semibold tabular-nums"
              style={{ color: 'var(--foreground)' }}
            >
              {score.avg.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}> / 5</span>
          </div>
        )}
        {isFreeText && (
          <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
            {count} response{count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="ml-7">
        {!isFreeText && score ? (
          <>
            <DistributionBars distribution={score.distribution} avg={score.avg} />
            {/* Benchmarks — median + program avg, both derived from response data */}
            <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {score.count} responses
              {' · '}Median {medianFromDistribution(score.distribution).toFixed(1)}
              {(() => {
                const programAvg = programAvgForQuestion(score.questionId)
                return programAvg != null ? <>{' · '}Program avg {programAvg.toFixed(1)}</> : null
              })()}
            </p>
          </>
        ) : !isFreeText ? (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No data yet</p>
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2">
                <span className="text-xs">View responses</span>
                <i className="fa-light fa-arrow-right" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" showCloseButton>
              <SheetHeader>
                <SheetTitle className="text-sm font-semibold leading-snug pr-6">
                  {question.text}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col overflow-y-auto mt-4">
                {freeTextResponses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                    <i className="fa-light fa-comment-lines text-3xl text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">No responses yet.</p>
                  </div>
                ) : (
                  freeTextResponses.map((r, i) => (
                    <div
                      key={r.id}
                      className="py-3 text-sm"
                      style={{
                        borderBottom: i < freeTextResponses.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      {r.text}
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  )
}
