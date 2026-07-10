'use client'

// TermThemesInsight — cross-course AI theme summary at the TERM aggregation
// level (Aarti D14: AI summaries before question-level detail). Every claim
// carries its nouns: theme chips NAME the courses behind them and link to the
// course's result, and one example quote grounds the headline (research
// finding 2026-07-08: "2 courses mentioned pacing" with no course names and
// no evidence path earns zero trust and zero action).
//
// Composes AiInsightCard — documented PCE hand-roll (docs/governance/
// ds-adoption.md); registered second-layer composition. Sentiment palette
// (no red): positive var(--chart-2) · concern var(--chart-4) · neutral
// var(--muted-foreground). Mobbin: Gorgias comment highlights (theme +
// evidence quote + drill).

import { useMemo } from 'react'
import Link from 'next/link'
import { AiInsightCard } from '@/components/pce/ai-insight-card'
import { deriveTermThemes, type ThemeSentiment, type TermThemeRow } from '@/lib/pce-themes'
import { MOCK_RESPONSES, type PceSurvey } from '@/lib/pce-mock-data'

function SentimentDot({ sentiment }: { sentiment: ThemeSentiment }) {
  const color =
    sentiment === 'positive' ? 'var(--chart-2)' :
    sentiment === 'concern'  ? 'var(--chart-4)' :
    'var(--muted-foreground)'
  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
    />
  )
}

export function TermThemesInsight({
  surveys,
  scopeLabel,
  className,
}: {
  /** The scope's surveys (already filtered to a term or cohort). */
  surveys: PceSurvey[]
  /** Rendered in the source citation, e.g. "Spring 2026". */
  scopeLabel: string
  className?: string
}) {
  const data = useMemo(() => {
    const withComments = surveys
      .map((s) => ({
        survey: s,
        resp: MOCK_RESPONSES.find((r) => r.surveyId === s.id),
      }))
      .filter(
        (x): x is { survey: PceSurvey; resp: NonNullable<typeof x.resp> } =>
          !!x.resp && x.resp.comments.length > 0,
      )
    const themes = deriveTermThemes(
      withComments.map((x) => ({ code: x.survey.courseCode, comments: x.resp.comments })),
    )
    // One grounding quote for the top theme — shortest matching concern first.
    const top: TermThemeRow | undefined = themes[0]
    let quote: { text: string; code: string } | null = null
    if (top) {
      for (const x of withComments) {
        if (!top.courseCodes.includes(x.survey.courseCode)) continue
        const match = x.resp.comments.find((c) =>
          top.sentiment === 'concern' ? c.sentiment === 'concern' : true,
        )
        if (match && (!quote || match.text.length < quote.text.length)) {
          quote = { text: match.text, code: x.survey.courseCode }
        }
      }
    }
    // surveyId lookup so chips can deep-link each course to its result.
    const surveyIdByCode = new Map(withComments.map((x) => [x.survey.courseCode, x.survey.id]))
    return {
      themes,
      quote,
      surveyIdByCode,
      commentCount: withComments.reduce((n, x) => n + x.resp.comments.length, 0),
      courseCount: withComments.length,
    }
  }, [surveys])

  // No open-text responses in scope yet — no card (the AI lane never shows
  // an empty shell; it appears once there is something to summarize).
  if (data.themes.length === 0) return null

  const top = data.themes[0]

  return (
    <AiInsightCard
      className={className}
      source={`${data.commentCount} open-text response${data.commentCount !== 1 ? 's' : ''} across ${data.courseCount} course${data.courseCount !== 1 ? 's' : ''} · ${scopeLabel}`}
      body={
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            <strong>{top.label}</strong> came up in{' '}
            <strong>{top.courseCodes.join(', ')}</strong>
            {top.sentiment === 'concern' ? ' — with concerns.' : '.'}
          </p>
          {data.quote && (
            <blockquote className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
              “{data.quote.text}”
              <span className="text-xs"> — {data.quote.code}</span>
            </blockquote>
          )}
          <div className="flex flex-col gap-1.5">
            {data.themes.map((t) => (
              <div key={t.label} className="flex items-center gap-2 min-w-0 text-xs">
                <SentimentDot sentiment={t.sentiment} />
                <span className="shrink-0 text-foreground">{t.label}</span>
                <span className="min-w-0 truncate text-muted-foreground">
                  {t.courseCodes.map((code, i) => (
                    <span key={code}>
                      {i > 0 && ', '}
                      <Link
                        href={`/results/${encodeURIComponent(data.surveyIdByCode.get(code) ?? '')}`}
                        className="hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
                      >
                        {code}
                      </Link>
                    </span>
                  ))}
                </span>
                <span className="ms-auto shrink-0 tabular-nums text-muted-foreground">
                  {t.occurrences}
                </span>
              </div>
            ))}
          </div>
        </div>
      }
    />
  )
}
