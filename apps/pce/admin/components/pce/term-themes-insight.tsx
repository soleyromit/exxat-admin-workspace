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

import { useMemo, useState } from 'react'
import { Button } from '@exxatdesignux/ui'
import { VoiceExplorerDialog, type VoiceExplorerComment } from '@/components/pce/voice-explorer'
import { SENTIMENT_COLOR } from '@/lib/pce-sentiment'
import Link from 'next/link'
import { AiInsightCard } from '@/components/pce/ai-insight-card'
import { deriveTermThemes, type ThemeComment, type ThemeSentiment, type TermThemeRow } from '@/lib/pce-themes'
import { MOCK_RESPONSES, type PceSurvey } from '@/lib/pce-mock-data'

function SentimentDot({ sentiment }: { sentiment: ThemeSentiment }) {
  const color = SENTIMENT_COLOR[sentiment]
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
    /**
     * Group by course BEFORE deriving. `deriveTermThemes` documents its input as "one
     * {courseCode, comments} entry per course" — passing one entry per *survey* only
     * happens to hold at term scope, where each survey is a different course. At course
     * scope (this card scoped to DPT-501 across terms) every entry shares a code, and the
     * chips render "DPT-501, DPT-501, DPT-501" while the citation claims "3 courses".
     * A claim that miscounts its own evidence is worse than no claim — the whole point of
     * naming the courses is that "2 courses mentioned pacing" is unactionable without them.
     */
    const byCourse = new Map<string, ThemeComment[]>()
    for (const x of withComments) {
      const prev = byCourse.get(x.survey.courseCode) ?? []
      byCourse.set(x.survey.courseCode, [...prev, ...x.resp.comments])
    }
    const themes = deriveTermThemes(
      [...byCourse.entries()].map(([code, comments]) => ({ code, comments })),
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
    // The explorer's corpus — same joins the quotes chips already rely on.
    const explorerComments: VoiceExplorerComment[] = withComments.flatMap((x) =>
      x.resp.comments.map((c) => ({
        text: c.text,
        section: c.section,
        sentiment: c.sentiment,
        courseCode: x.survey.courseCode,
        courseName: x.survey.courseName,
        term: x.survey.term,
        surveyId: x.survey.id,
      })),
    )
    return {
      themes,
      quote,
      surveyIdByCode,
      explorerComments,
      commentCount: withComments.reduce((n, x) => n + x.resp.comments.length, 0),
      // Distinct courses, not surveys — three terms of one course is one course.
      courseCount: byCourse.size,
    }
  }, [surveys])

  // No open-text responses in scope yet — no card (the AI lane never shows
  // an empty shell; it appears once there is something to summarize).
  const [exploreTheme, setExploreTheme] = useState<string | null>(null)
  const [exploring, setExploring] = useState(false)

  if (data.themes.length === 0) return null

  const top = data.themes[0]
  const maxOccurrences = Math.max(1, ...data.themes.map((t) => t.occurrences))

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
                        href={`/results/${encodeURIComponent(data.surveyIdByCode.get(code) ?? '')}?from=analytics`}
                        className="hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
                      >
                        {code}
                      </Link>
                    </span>
                  ))}
                </span>
                <span className="ms-auto flex shrink-0 items-center gap-2">
                  {/* Occurrence bar — a keyword COUNT, deterministic, so a magnitude bar is
                      honest here; sentiment stays a dot and never colours the bar (ADR-005). */}
                  <span aria-hidden="true" className="h-1 w-16 rounded-full bg-muted">
                    <span
                      className="block h-1 rounded-full bg-muted-foreground/50"
                      style={{ width: `${Math.round((t.occurrences / maxOccurrences) * 100)}%` }}
                    />
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0 tabular-nums"
                    aria-label={`Explore ${t.occurrences} comments matching ${t.label}`}
                    onClick={() => {
                      setExploreTheme(t.label)
                      setExploring(true)
                    }}
                  >
                    {t.occurrences}
                  </Button>
                </span>
              </div>
            ))}
          </div>

          <VoiceExplorerDialog
            open={exploring}
            onOpenChange={setExploring}
            scopeLabel={scopeLabel}
            comments={data.explorerComments}
            defaultTheme={exploreTheme}
          />
        </div>
      }
      actions={
        <Button variant="outline" size="sm" onClick={() => { setExploreTheme(null); setExploring(true) }}>
          Explore
        </Button>
      }
    />
  )
}
