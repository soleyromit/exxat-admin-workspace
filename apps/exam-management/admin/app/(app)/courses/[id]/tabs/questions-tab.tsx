'use client'

/**
 * QUESTIONS TAB — course-scoped question list.
 *
 * Aarti's "embedded workflow intelligence" directive: surface psychometric
 * data (point-biserial, difficulty, distractor analysis, negative discriminator)
 * INLINE on each row at the moment of decision-making — not in a separate
 * Reports section. This list is read-only by design here; the QB hub remains
 * the canonical edit surface (we don't disturb its layout).
 *
 * Faculty viewer-mode: sees the same data, no edit/add affordances.
 * Faculty editor-mode: gets "Add to assessment" + "Edit" affordances per row.
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Button, Badge, InputGroup, InputGroupAddon, InputGroupInput,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tip,
} from '@exxatdesignux/ui'
import { mockCourses, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import { questionPsychometrics } from '@/lib/faculty-mock-data'
import type { Question, QDiff, QBlooms } from '@/lib/qb-types'

interface QuestionsTabProps {
  courseId: string
  isViewer: boolean
}

const psychoMap = new Map(questionPsychometrics.map(p => [p.questionId, p]))

export function QuestionsTab({ courseId, isViewer }: QuestionsTabProps) {
  const [query, setQuery] = useState('')
  const [diff, setDiff] = useState<QDiff | 'all'>('all')
  const [bloomsFilter, setBloomsFilter] = useState<QBlooms | 'all'>('all')
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false)

  const course = mockCourses.find(c => c.id === courseId)
  const courseQuestions = useMemo(() => {
    if (!course) return []
    return MOCK_QB_QUESTIONS.filter(q => q.folder.startsWith(course.questionBankFolderId))
  }, [course])

  const filtered = useMemo(() => {
    return courseQuestions.filter(q => {
      const matchQuery = !query ||
        q.title.toLowerCase().includes(query.toLowerCase()) ||
        q.code.toLowerCase().includes(query.toLowerCase())
      const matchDiff = diff === 'all' || q.difficulty === diff
      const matchBlooms = bloomsFilter === 'all' || q.blooms === bloomsFilter
      const psy = psychoMap.get(q.id)
      const matchFlagged = !showOnlyFlagged || (psy?.negativeDiscriminator ?? false)
      return matchQuery && matchDiff && matchBlooms && matchFlagged
    })
  }, [courseQuestions, query, diff, bloomsFilter, showOnlyFlagged])

  // Embedded intelligence rollup
  const flaggedCount = courseQuestions.filter(q => psychoMap.get(q.id)?.negativeDiscriminator).length
  const lowPbisCount = courseQuestions.filter(q => {
    const p = psychoMap.get(q.id)
    return p && p.pointBiserial < 0.15
  }).length

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Embedded intelligence callout (only when there's something to surface) ─ */}
      {(flaggedCount > 0 || lowPbisCount > 0) && (
        <section
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{
            background: 'color-mix(in oklch, var(--chart-4) 6%, var(--background))',
            borderColor: 'color-mix(in oklch, var(--chart-4) 24%, var(--border))',
          }}
        >
          <i
            className="fa-light fa-lightbulb-on mt-0.5"
            aria-hidden="true"
            style={{ fontSize: 18, color: 'var(--chart-4)' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {flaggedCount > 0 && `${flaggedCount} ${flaggedCount === 1 ? 'question is a' : 'questions are'} negative ${flaggedCount === 1 ? 'discriminator' : 'discriminators'}`}
              {flaggedCount > 0 && lowPbisCount > 0 && ' · '}
              {lowPbisCount > 0 && `${lowPbisCount} with point-biserial below 0.15`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Top performers chose distractors more than the keyed answer — review wording or remove from rotation.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowOnlyFlagged(true)}>
            <i className="fa-light fa-filter" aria-hidden="true" />
            Show only flagged
          </Button>
        </section>
      )}

      {/* ─── Toolbar ─────────────────────────────────────────────────────── */}
      <section className="flex items-center gap-3 flex-wrap">
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon align="inline-start">
            <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search questions in this course…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <Select value={diff} onValueChange={(v) => setDiff(v as QDiff | 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={bloomsFilter} onValueChange={(v) => setBloomsFilter(v as QBlooms | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Bloom level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bloom levels</SelectItem>
            <SelectItem value="Remember">Remember</SelectItem>
            <SelectItem value="Understand">Understand</SelectItem>
            <SelectItem value="Apply">Apply</SelectItem>
            <SelectItem value="Analyze">Analyze</SelectItem>
            <SelectItem value="Evaluate">Evaluate</SelectItem>
            <SelectItem value="Create">Create</SelectItem>
          </SelectContent>
        </Select>
        {showOnlyFlagged && (
          <Button variant="ghost" size="sm" onClick={() => setShowOnlyFlagged(false)} className="gap-1.5">
            <i className="fa-light fa-xmark" aria-hidden="true" />
            Clear flagged filter
          </Button>
        )}
        <span className="ms-auto text-xs text-muted-foreground">
          {filtered.length} of {courseQuestions.length} {courseQuestions.length === 1 ? 'question' : 'questions'}
        </span>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href={`/question-bank?course=${courseId}`}>
            <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" />
            Open in Question Bank
          </Link>
        </Button>
      </section>

      {/* ─── Question list ──────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {filtered.length === 0 ? (
          <EmptyQuestionList />
        ) : (
          filtered.map(q => <QuestionRow key={q.id} q={q} isViewer={isViewer} />)
        )}
      </div>
    </div>
  )
}

// ─── Question row with inline psychometrics ──────────────────────────────────
function QuestionRow({ q, isViewer }: { q: Question; isViewer: boolean }) {
  const psy = psychoMap.get(q.id)
  return (
    <div
      className="grid items-start gap-4 px-4 py-3.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors group"
      style={{ gridTemplateColumns: 'minmax(0, 1fr) auto', borderColor: 'var(--border)' }}
    >
      {/* Left: code, title, meta */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge
            variant="secondary"
            className="rounded font-mono text-[10px] shrink-0"
            style={{
              background: 'var(--brand-tint)',
              color: 'var(--brand-color-dark)',
              border: '1px solid color-mix(in oklch, var(--brand-color) 22%, transparent)',
            }}
          >
            {q.code}
          </Badge>
          <DifficultyChip d={q.difficulty} />
          <BloomChip level={q.blooms} />
          <span className="text-[11px] text-muted-foreground">
            <i className="fa-light fa-arrow-rotate-right" aria-hidden="true" style={{ fontSize: 10 }} /> v{q.version}
          </span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">{q.usage} {q.usage === 1 ? 'use' : 'uses'}</span>
          {psy?.negativeDiscriminator && (
            <Tip label="Top performers picked the keyed answer at a lower rate than weaker performers — likely flawed item.">
              <Badge
                variant="secondary"
                className="rounded text-[10px] uppercase tracking-wider font-bold gap-1 cursor-help"
                style={{
                  background: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))',
                  color: 'var(--chart-4)',
                  border: '1px solid color-mix(in oklch, var(--chart-4) 26%, transparent)',
                }}
              >
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 9 }} />
                Negative discriminator
              </Badge>
            </Tip>
          )}
        </div>
        <p className="text-sm text-foreground leading-snug line-clamp-2 mb-2">{q.title}</p>

        {/* Inline psychometric bar */}
        {psy && (
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <PsychoMetric
              label="Difficulty index"
              value={psy.difficultyIndex}
              format={(v) => `${Math.round(v * 100)}%`}
              hint="proportion correct"
              ideal={[0.4, 0.85]}
            />
            <PsychoMetric
              label="Point-biserial"
              value={psy.pointBiserial}
              format={(v) => v.toFixed(2)}
              hint="discrimination"
              ideal={[0.2, 1]}
              negativeFloor
            />
            <DistractorPicker rates={psy.distractorRates} />
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <Tip label="View details">
          <Button asChild variant="ghost" size="icon-sm" aria-label="View question details">
            <Link href={`/questions/${q.id}`}>
              <i className="fa-light fa-eye" aria-hidden="true" />
            </Link>
          </Button>
        </Tip>
        {!isViewer && (
          <>
            <Tip label="Add to assessment">
              <Button asChild variant="ghost" size="icon-sm" aria-label="Add to assessment">
                <Link href={`/assessment-builder?question=${q.id}`}>
                  <i className="fa-light fa-plus" aria-hidden="true" />
                </Link>
              </Button>
            </Tip>
            <Tip label="Open in Question Bank">
              <Button asChild variant="ghost" size="icon-sm" aria-label="Edit question">
                <Link href={`/questions/${q.id}`}>
                  <i className="fa-light fa-pen" aria-hidden="true" />
                </Link>
              </Button>
            </Tip>
          </>
        )}
        {isViewer && (
          <Tip label="View-only access — editing disabled">
            <Button variant="ghost" size="icon-sm" disabled aria-label="Editing disabled">
              <i className="fa-light fa-lock" aria-hidden="true" />
            </Button>
          </Tip>
        )}
      </div>
    </div>
  )
}

// ─── Inline psychometric mini-bar ────────────────────────────────────────────
function PsychoMetric({
  label, value, format, hint, ideal, negativeFloor,
}: {
  label: string; value: number; format: (n: number) => string; hint: string;
  /** [min, max] of ideal range — outside this range gets warning tone */
  ideal: [number, number]; negativeFloor?: boolean
}) {
  const inIdeal = value >= ideal[0] && value <= ideal[1]
  const isNegative = value < 0
  const tone = isNegative ? 'warning' : inIdeal ? 'success' : 'warning'
  const palette = {
    success: { fg: 'var(--chart-2)', bg: 'color-mix(in oklch, var(--chart-2) 16%, var(--background))' },
    warning: { fg: 'var(--chart-4)', bg: 'color-mix(in oklch, var(--chart-4) 16%, var(--background))' },
  }[tone]

  // Render mini-bar (range -1..1 if negative-floor else 0..1)
  const min = negativeFloor ? -0.2 : 0
  const max = 1
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const idealStart = Math.max(0, Math.min(100, ((ideal[0] - min) / (max - min)) * 100))
  const idealEnd = Math.max(0, Math.min(100, ((ideal[1] - min) / (max - min)) * 100))

  return (
    <Tip label={`${label} ${format(value)} — ${hint}. Ideal range: ${format(ideal[0])}–${format(ideal[1])}.`}>
      <div className="flex items-center gap-2 cursor-help">
        <div className="flex flex-col gap-0.5 min-w-[60px]">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="text-[11px] font-bold" style={{ color: palette.fg }}>{format(value)}</span>
        </div>
        <div
          className="relative h-1 w-20 rounded-full"
          style={{ background: 'var(--muted)' }}
        >
          {/* Ideal range underlay */}
          <div
            className="absolute h-full rounded-full"
            style={{
              left: `${idealStart}%`,
              width: `${idealEnd - idealStart}%`,
              background: 'color-mix(in oklch, var(--chart-2) 18%, transparent)',
            }}
          />
          {/* Value marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2.5 w-1 rounded-full"
            style={{ left: `calc(${pct}% - 2px)`, background: palette.fg }}
          />
        </div>
      </div>
    </Tip>
  )
}

// ─── Distractor pick-rate viz ────────────────────────────────────────────────
function DistractorPicker({ rates }: { rates: number[] }) {
  // Highest rate is assumed correct answer (option A in our mock)
  const max = Math.max(...rates)
  const labels = ['A', 'B', 'C', 'D', 'E', 'F']
  return (
    <Tip label="Distractor pick-rate · Green = keyed · Amber = strong distractor (>20%)">
      <div className="flex items-end gap-0.5 cursor-help">
        {rates.map((r, i) => {
          const isKey = r === max
          const h = Math.max(2, Math.round(r * 22))
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                style={{
                  width: 8, height: h,
                  background: isKey
                    ? 'var(--chart-2)'
                    : r > 0.2 ? 'var(--chart-4)' : 'var(--muted-foreground)',
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

// ─── Difficulty + Bloom chips ────────────────────────────────────────────────
function DifficultyChip({ d }: { d: QDiff }) {
  const palette: Record<QDiff, { bg: string; fg: string }> = {
    Easy:   { bg: 'color-mix(in oklch, var(--chart-2) 14%, var(--background))', fg: 'var(--chart-2)' },
    Medium: { bg: 'color-mix(in oklch, var(--chart-1) 14%, var(--background))', fg: 'var(--chart-1)' },
    Hard:   { bg: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))', fg: 'var(--chart-4)' },
  }
  const c = palette[d]
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {d}
    </span>
  )
}

function BloomChip({ level }: { level: QBlooms }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
    >
      {level}
    </span>
  )
}

function EmptyQuestionList() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-2" style={{ background: 'var(--muted)' }}>
        <i className="fa-light fa-circle-question text-muted-foreground" aria-hidden="true" style={{ fontSize: 18 }} />
      </div>
      <p className="font-semibold text-foreground">No questions match your filters</p>
      <p className="text-sm text-muted-foreground mt-1">Adjust filters or open Question Bank to add new questions to this course.</p>
    </div>
  )
}
