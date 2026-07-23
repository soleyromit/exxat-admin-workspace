'use client'

/**
 * Student Voice — story 18, and the doc's sharpest content observation.
 *
 * §2.2/§2.3: the SAME verbatims, re-cut by the axis the persona cares about. "The quant
 * scores tell you *that* 3.58 happened; the verbatims tell you *why*. Splitting
 * course-vs-instructor comments is the same course/faculty disentangling that Gap Analysis
 * does — the theme runs through the whole tab."
 *
 * The model already carries that axis: `ResponseComment.section` is course_content |
 * faculty_performance | course_director, which IS the doc's "COURSE MATERIAL vs INSTRUCTOR
 * FEEDBACK" split. So the re-cut is real, not cosmetic:
 *   · By Faculty  → comments about the PERSON lead; the course's own feedback is context.
 *   · By Course   → comments about the COURSE lead; the instructor's feedback is context.
 * Same corpus, opposite emphasis, because the two personas arrive with different questions.
 *
 * ⚠️ The doc's By-Course cut is "grouped by survey QUESTION". The model has no question on a
 * comment — only `section` — so that exact cut is not buildable, and inventing question
 * labels would be the fabricated-radar mistake again. Section is the honest axis available;
 * question-level grouping needs the data model to carry it.
 *
 * AI LANE (ai-vs-pulled-lane, ADR-005): sentiment is LLM-extracted, so this is the AI lane —
 * it must look distinct from pulled data and cite its source. Hence the sparkles affordance
 * and the "Based on N responses" footer, and NEVER a chart: charting an AI-derived sentiment
 * as if it were a measured distribution is the double violation the doc calls out.
 *
 * Comments are evidence, not a census. Monil: "we don't have to completely take everything
 * from that evaluation, we can just pick from four surveys… used as reference to take an
 * action." So this samples and says so, rather than implying completeness.
 */

import { useMemo, useState } from 'react'
import { VoiceExplorerDialog } from '@/components/pce/voice-explorer'
import { SENTIMENT_COLOR, SENTIMENT_LABEL } from '@/lib/pce-sentiment'
import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import {
  MOCK_RESPONSES,
  MOCK_SURVEYS,
  SECTION_LABELS,
  type ResponseComment,
  type TemplateSection,
} from '@/lib/pce-mock-data'

type Sentiment = ResponseComment['sentiment']

const FILTERS: (Sentiment | 'all')[] = ['all', 'positive', 'concern', 'neutral']

/** Max verbatims rendered per section — evidence, not a transcript dump. */
const SAMPLE_PER_SECTION = 4

interface VoiceComment extends ResponseComment {
  courseCode: string
  courseName: string
  term: string
  surveyId: string
}

function SentimentDot({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span
      aria-hidden="true"
      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: SENTIMENT_COLOR[sentiment] }}
    />
  )
}

export function StudentVoice({
  axis,
  facultyId,
  courseCode,
  scopeLabel,
}: {
  /** Which persona is reading — decides which sections lead. */
  axis: 'faculty' | 'course'
  facultyId?: string
  courseCode?: string
  scopeLabel: string
}) {
  const [filter, setFilter] = useState<Sentiment | 'all'>('all')
  const [exploring, setExploring] = useState(false)

  const comments = useMemo<VoiceComment[]>(() => {
    const scoped = MOCK_SURVEYS.filter(
      (s) =>
        s.surveyType !== 'programmatic' &&
        (axis === 'faculty'
          ? s.instructors.some((i) => i.id === facultyId)
          : s.courseCode === courseCode),
    )
    return scoped.flatMap((s) => {
      const resp = MOCK_RESPONSES.find((r) => r.surveyId === s.id)
      if (!resp) return []
      return resp.comments.map((c) => ({
        ...c,
        courseCode: s.courseCode,
        courseName: s.courseName,
        term: s.term,
        surveyId: s.id,
      }))
    })
  }, [axis, facultyId, courseCode])

  const counts = useMemo(
    () => ({
      all: comments.length,
      positive: comments.filter((c) => c.sentiment === 'positive').length,
      concern: comments.filter((c) => c.sentiment === 'concern').length,
      neutral: comments.filter((c) => c.sentiment === 'neutral').length,
    }),
    [comments],
  )

  /**
   * The re-cut. By Faculty leads with what students said about the PERSON; By Course leads
   * with what they said about the COURSE. Same corpus, and the order is the argument.
   */
  const sectionOrder: TemplateSection[] =
    axis === 'faculty'
      ? ['faculty_performance', 'course_director', 'course_content']
      : ['course_content', 'faculty_performance', 'course_director']

  const visible = filter === 'all' ? comments : comments.filter((c) => c.sentiment === filter)

  const grouped = sectionOrder
    .map((section) => ({ section, items: visible.filter((c) => c.section === section) }))
    .filter((g) => g.items.length > 0)

  // The AI lane never shows an empty shell — it appears once there is something to summarise.
  if (!comments.length) return null

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <i className="fa-light fa-sparkles text-sm" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--brand-color)' }}>
          AI insight
        </span>
        <h3 className="text-sm font-semibold">Student voice</h3>
      </div>

      {/* Sentiment chips with counts — §2.3's "All (32) / Positive (13) / Constructive (16)". */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const n = counts[f === 'all' ? 'all' : f]
          if (n === 0 && f !== 'all') return null
          const active = filter === f
          return (
            <Button
              key={f}
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              aria-pressed={active}
            >
              {f === 'all' ? 'All' : SENTIMENT_LABEL[f]} ({n})
            </Button>
          )
        })}
      </div>

      {grouped.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No {filter === 'all' ? '' : `${SENTIMENT_LABEL[filter as Sentiment].toLowerCase()} `}comments in this
          scope.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(({ section, items }) => (
            <div key={section} className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {SECTION_LABELS[section]} · {items.length}
              </p>
              {items.slice(0, SAMPLE_PER_SECTION).map((c, i) => (
                <div key={`${c.surveyId}-${section}-${i}`} className="flex gap-2">
                  <SentimentDot sentiment={c.sentiment} />
                  <p className="text-sm">
                    “{c.text}”{' '}
                    {/* Every quote names its source — a verbatim with no course is unactionable. */}
                    <Link
                      href={`/results/${encodeURIComponent(c.surveyId)}?from=analytics`}
                      className="text-xs text-muted-foreground underline underline-offset-2"
                    >
                      {c.courseCode} · {c.term}
                    </Link>
                  </p>
                </div>
              ))}
              {items.length > SAMPLE_PER_SECTION && (
                /* This used to be a dead-end count. A "+N more" that goes nowhere is an unmet
                   promise — it now opens the explorer, filtered corpus and all. */
                <Button
                  variant="link"
                  size="sm"
                  className="self-start px-0"
                  onClick={() => setExploring(true)}
                >
                  + {items.length - SAMPLE_PER_SECTION} more in {SECTION_LABELS[section].toLowerCase()}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Provenance — the AI lane must cite its source (ai-layer.md). */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {counts.all} open-text responses · {scopeLabel} · sampled
        </p>
        <Button variant="outline" size="sm" onClick={() => setExploring(true)}>
          Explore all {counts.all}
        </Button>
      </div>

      <VoiceExplorerDialog
        open={exploring}
        onOpenChange={setExploring}
        scopeLabel={scopeLabel}
        comments={comments}
      />
    </section>
  )
}
