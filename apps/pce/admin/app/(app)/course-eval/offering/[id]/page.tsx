'use client'

/**
 * Course Evaluation — Admin offering drill-down (Sprint 3, deepest level).
 * Spec §6: per-question detail + AI themes + all responses.
 */

import * as React from 'react'
import Link from 'next/link'
import { use } from 'react'
import {
  Button,
  Card,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { AiInsightCard } from '@/components/pce/ai-insight-card'
import {
  SAMPLE_QUESTIONS, SAMPLE_OFFERING_THEMES, SAMPLE_RESPONSES,
} from '@/lib/course-eval-mock'

interface Props {
  params: Promise<{ id: string }>
}

export default function OfferingDrillDown({ params }: Props) {
  const { id } = use(params)
  const [filter, setFilter] = React.useState<'all' | 'low' | 'high'>('all')

  // id is "<courseId>-<termId>" — split for breadcrumb context
  const [courseId, ...termParts] = id.split('-')
  const term = termParts.join('-')

  const responses = filter === 'all'
    ? SAMPLE_RESPONSES
    : filter === 'low'
      ? SAMPLE_RESPONSES.filter(r => r.rating <= 3.5)
      : SAMPLE_RESPONSES.filter(r => r.rating >= 4.0)

  return (
    <>
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/" className="text-sm text-muted-foreground hover:underline">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <Link href="/course-eval" className="text-sm text-muted-foreground hover:underline">
          Course Evaluation
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <Link href={`/course-eval/course/${courseId}`} className="text-sm text-muted-foreground hover:underline">
          {courseId}
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">{term} offering</h1>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 overflow-auto"
        style={{ padding: '20px 28px 40px', scrollPaddingTop: 60 }}
      >
        <div className="max-w-6xl flex flex-col gap-5">

          <p className="text-sm text-muted-foreground">
            42 of 51 responses (82%) · last submission 4 hours ago
          </p>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">Quantitative — per question</h2>
            <div className="flex flex-col gap-2">
              {SAMPLE_QUESTIONS.map(q => {
                const total = q.distribution.reduce((s, n) => s + n, 0)
                const max = Math.max(...q.distribution)
                return (
                  <div
                    key={q.id}
                    className="grid items-center gap-3 rounded-md px-3 py-2"
                    style={{ gridTemplateColumns: '1fr 60px 240px', border: '1px solid var(--border)' }}
                  >
                    <span className="text-sm">{q.text}</span>
                    <span className="text-sm tabular-nums font-medium">{q.avg.toFixed(1)}</span>
                    {/* Mini distribution histogram (5 bars 1..5) */}
                    <div className="flex items-end gap-1 h-7" aria-label={`Distribution: ${q.distribution.join(', ')}`}>
                      {q.distribution.map((count, i) => {
                        const h = max > 0 ? (count / max) * 100 : 0
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm"
                            style={{
                              height: `${h}%`,
                              minHeight: count > 0 ? 2 : 1,
                              background: count > 0 ? 'var(--chart-1)' : 'var(--muted)',
                            }}
                            title={`${i + 1}: ${count} responses`}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <AiInsightCard
            title="Themes from qualitative responses"
            themes={SAMPLE_OFFERING_THEMES.map(t => ({
              id: t.id,
              text: t.text,
              mentionsCount: t.mentionsCount,
              totalContext: t.totalCourses,
              sentiment: t.sentiment,
            }))}
            source={`42 qualitative responses · ${SAMPLE_OFFERING_THEMES.length} themes`}
            confidence="high"
            body={
              <p className="text-xs text-muted-foreground italic">
                Themes are AI-extracted — verify by clicking through to source quotes.
              </p>
            }
            actions={
              <Button variant="outline" size="sm">View source quotes</Button>
            }
          />

          <Card className="p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold">All responses (anonymous)</h2>
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="h-8 w-36 text-xs" aria-label="Filter responses">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="low">Low ratings (≤3.5)</SelectItem>
                  <SelectItem value="high">High ratings (≥4.0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              {responses.map(r => {
                const date = new Date(r.submittedAt)
                const daysAgo = Math.round((Date.now() - date.getTime()) / 86400000)
                return (
                  <article
                    key={r.id}
                    className="rounded-md p-3"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <i
                            key={i}
                            className={i <= Math.round(r.rating) ? 'fa-solid fa-star text-xs' : 'fa-light fa-star text-xs'}
                            style={i <= Math.round(r.rating) ? { color: 'var(--chart-4)' } : { color: 'var(--muted-foreground)' }}
                            aria-hidden="true"
                          />
                        ))}
                        <span className="ms-2 text-sm tabular-nums">{r.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Submitted {daysAgo === 0 ? 'today' : `${daysAgo}d ago`}
                      </span>
                    </div>
                    <p className="text-sm">{r.comment}</p>
                    {r.themes.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Themes: {r.themes.join(', ')}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
