'use client'

/**
 * VoiceExplorer — the analysis surface behind BOTH text cards (Student voice + AI themes).
 *
 * Dovetail's grammar (Mobbin, 2026-07-15): a theme rail with count bars on the left, the
 * verbatims on the right, and selecting a theme filters the quotes. Same selection grammar
 * as EntityTrendExplorer — rail ↔ content, one state. The card samples 2–4 quotes as
 * evidence; this is where "+N more" actually goes.
 *
 * ── ADR-005 (ai-vs-pulled-lane) shapes this component ─────────────────────────────
 * Sentiment is LLM-extracted → AI lane → "NEVER a chart: charting an AI-derived sentiment
 * as if it were a measured distribution is the double violation." So, deliberately:
 *   · NO sentiment-stacked distribution chart (the plan had one; ADR-005 killed it).
 *     Sentiment appears only as the established dot + chip affordances.
 *   · Theme count bars ARE allowed: occurrences are deterministic keyword counts over the
 *     corpus (THEME_PATTERNS), a measured quantity — and the bars are neutral-tinted so
 *     they encode magnitude, not sentiment.
 *   · The header says "keyword themes" honestly — these are 5 fixed patterns, not free AI
 *     clustering (vault: themes are conditional, "IF we are capturing the theme").
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  PaginationBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@exxatdesignux/ui'
import { THEME_PATTERNS, type ThemeSentiment } from '@/lib/pce-themes'
import { SENTIMENT_COLOR, SENTIMENT_LABEL } from '@/lib/pce-sentiment'
import { SECTION_LABELS, type TemplateSection } from '@/lib/pce-mock-data'
import { ChartCardActions } from '@/components/pce/chart-card-actions'

export interface VoiceExplorerComment {
  text: string
  section: TemplateSection
  sentiment: ThemeSentiment
  courseCode: string
  courseName: string
  term: string
  surveyId: string
}

const PAGE_SIZE = 10
const ALL = '__all__'

function matchesTheme(text: string, themeLabel: string): boolean {
  const pattern = THEME_PATTERNS.find((p) => p.label === themeLabel)
  if (!pattern) return false
  const t = text.toLowerCase()
  return pattern.keywords.some((k) => t.includes(k))
}

function SentimentDot({ sentiment }: { sentiment: ThemeSentiment }) {
  return (
    <span
      aria-hidden="true"
      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: SENTIMENT_COLOR[sentiment] }}
    />
  )
}

export function VoiceExplorer({
  comments,
  scopeLabel,
  defaultTheme = null,
}: {
  comments: VoiceExplorerComment[]
  scopeLabel: string
  /** Pre-select a theme — the theme card's rows open the explorer already filtered. */
  defaultTheme?: string | null
}) {
  const [theme, setTheme] = React.useState<string | null>(defaultTheme)
  const [sentiment, setSentiment] = React.useState<ThemeSentiment | 'all'>('all')
  const [section, setSection] = React.useState<string>(ALL)
  const [term, setTerm] = React.useState<string>(ALL)
  const [page, setPage] = React.useState(1)

  const railRef = React.useRef<HTMLDivElement>(null)
  /* Arrow-key navigation — a radiogroup navigates with arrows, not Tab-through. Same contract
     as EntityTrendExplorer's rail; this rail missed it the first time (state-review round 2). */
  const onRailKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    const radios = [...(railRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [])]
    if (!radios.length) return
    const idx = radios.findIndex((r) => r === document.activeElement)
    let next = -1
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = Math.min(idx + 1, radios.length - 1)
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = Math.max(idx - 1, 0)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = radios.length - 1
    else return
    e.preventDefault()
    radios[next]?.focus()
  }, [])

  const terms = React.useMemo(() => [...new Set(comments.map((c) => c.term))], [comments])
  const sections = React.useMemo(() => [...new Set(comments.map((c) => c.section))], [comments])

  /* Theme rail counts run over the SECTION/TERM-scoped corpus (not the sentiment-filtered
     one), so picking a sentiment chip narrows the quotes without making the rail lie about
     how often each theme occurs. */
  const scoped = React.useMemo(
    () =>
      comments.filter(
        (c) => (section === ALL || c.section === section) && (term === ALL || c.term === term),
      ),
    [comments, section, term],
  )

  const themeRows = React.useMemo(
    () =>
      THEME_PATTERNS.map((p) => ({
        label: p.label,
        count: scoped.filter((c) => matchesTheme(c.text, p.label)).length,
      })).filter((t) => t.count > 0),
    [scoped],
  )
  const maxThemeCount = Math.max(1, ...themeRows.map((t) => t.count))

  const filtered = React.useMemo(
    () =>
      scoped.filter(
        (c) =>
          (sentiment === 'all' || c.sentiment === sentiment) &&
          (theme === null || matchesTheme(c.text, theme)),
      ),
    [scoped, sentiment, theme],
  )

  const sentimentCounts = React.useMemo(
    () => ({
      all: scoped.length,
      positive: scoped.filter((c) => c.sentiment === 'positive').length,
      concern: scoped.filter((c) => c.sentiment === 'concern').length,
      neutral: scoped.filter((c) => c.sentiment === 'neutral').length,
    }),
    [scoped],
  )

  // Any filter change resets to page 1 — page 4 of a different corpus is nonsense.
  React.useEffect(() => setPage(1), [theme, sentiment, section, term])

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {(['all', 'positive', 'concern', 'neutral'] as const).map((f) => {
          const n = sentimentCounts[f]
          if (n === 0 && f !== 'all') return null
          const active = sentiment === f
          return (
            <Button
              key={f}
              variant={active ? 'default' : 'outline'}
              size="sm"
              aria-pressed={active}
              onClick={() => setSentiment(f)}
            >
              {f === 'all' ? 'All' : SENTIMENT_LABEL[f]} ({n})
            </Button>
          )
        })}
        {sections.length > 1 && (
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="h-8 w-44 text-sm" aria-label="Filter by section">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sections</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s} value={s}>
                  {SECTION_LABELS[s as TemplateSection]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {terms.length > 1 && (
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by term">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All terms</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_1fr]">
        {/* Theme rail. Bars are keyword-occurrence magnitudes on a neutral tint — measured
            counts, allowed; sentiment never colours a bar (ADR-005). */}
        <div
          ref={railRef}
          role="radiogroup"
          aria-label="Keyword themes"
          tabIndex={0}
          onKeyDown={onRailKeyDown}
          className="flex max-h-[420px] flex-col overflow-y-auto rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {themeRows.map((t) => {
            const active = theme === t.label
            return (
              <Button
                key={t.label}
                variant="ghost"
                size="sm"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(active ? null : t.label)}
                className={`h-auto w-full flex-col items-stretch gap-1 rounded-none border-b border-border px-2.5 py-2 font-normal last:border-b-0 ${
                  active ? 'bg-muted font-medium' : ''
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-left text-sm">{t.label}</span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {t.count}
                  </span>
                </span>
                <span aria-hidden="true" className="h-1 w-full rounded-full bg-muted">
                  <span
                    className="block h-1 rounded-full bg-muted-foreground/50"
                    style={{ width: `${Math.round((t.count / maxThemeCount) * 100)}%` }}
                  />
                </span>
              </Button>
            )
          })}
          {!themeRows.length && (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No keyword themes match this scope.
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {comments.length} comments
            {theme ? <> · theme “{theme}”</> : null}
          </p>
          {pageItems.map((c, i) => (
            <div key={`${c.surveyId}-${i}-${page}`} className="flex gap-2">
              <SentimentDot sentiment={c.sentiment} />
              <p className="text-sm">
                “{c.text}”{' '}
                <Link
                  href={`/results/${encodeURIComponent(c.surveyId)}?from=analytics`}
                  className="whitespace-nowrap text-xs text-muted-foreground underline underline-offset-2"
                >
                  {SECTION_LABELS[c.section]} · {c.courseCode} · {c.term}
                </Link>
              </p>
            </div>
          ))}
          {!filtered.length && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No comments match these filters.
            </p>
          )}
          {filtered.length > PAGE_SIZE && (
            <PaginationBar
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              pageSizeOptions={[PAGE_SIZE]}
              onPageChange={setPage}
              onPageSizeChange={() => {}}
            />
          )}
        </div>
      </div>

      {/* Provenance — the AI lane cites its source, always. */}
      <p className="text-xs text-muted-foreground">
        Sentiment is AI-derived; themes are keyword-matched over {THEME_PATTERNS.length} fixed
        patterns. Based on {comments.length} open-text responses · {scopeLabel}.
      </p>

      <ChartCardActions
        title={`Student voice — ${scopeLabel}`}
        formats={['pdf', 'excel', 'csv']}
        table={{
          headers: ['Comment', 'Section', 'Sentiment', 'Course', 'Term'],
          rows: filtered.map((c) => [
            c.text,
            SECTION_LABELS[c.section],
            SENTIMENT_LABEL[c.sentiment],
            c.courseCode,
            c.term,
          ]),
        }}
      />
    </div>
  )
}

/** The dialog wrapper both text cards mount — one Expand affordance, one chrome. */
export function VoiceExplorerDialog({
  open,
  onOpenChange,
  scopeLabel,
  comments,
  defaultTheme,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  scopeLabel: string
  comments: VoiceExplorerComment[]
  defaultTheme?: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[min(1100px,92vw)]">
        <DialogHeader>
          <DialogTitle>Student voice — {scopeLabel}</DialogTitle>
          <DialogDescription>
            Every open-text comment in scope, filterable by keyword theme, sentiment, section and
            term. Each quote links to its survey result.
          </DialogDescription>
        </DialogHeader>
        <div
          tabIndex={0}
          role="region"
          aria-label="Student voice explorer"
          className="max-h-[72vh] overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Remount per open so defaultTheme applies each time a theme row launches it. */}
          {open ? (
            <VoiceExplorer comments={comments} scopeLabel={scopeLabel} defaultTheme={defaultTheme} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
