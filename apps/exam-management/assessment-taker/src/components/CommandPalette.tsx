/**
 * COMMAND PALETTE — ⌘K / Ctrl+K overlay for search and quick navigation.
 *
 * Wired into the NavShell sidebar's "Search or ask Leo" item.
 *
 * Two modes:
 *   1. Search — keyword over assessments, resources, competencies, courses
 *   2. Ask Leo — when input starts with "?" or matches "ask " — routes to AI
 *      response (mocked for the demo)
 *
 * Keyboard:
 *   ⌘K / Ctrl+K — open
 *   Esc        — close
 *   ↑ / ↓      — navigate items
 *   Enter      — select / navigate
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog, DialogContent,
  Kbd, KbdGroup,
} from '@exxat/ds/packages/ui/src'

interface PaletteItem {
  id: string
  type: 'assessment' | 'resource' | 'competency' | 'course' | 'page'
  title: string
  subtitle?: string
  icon: string
  keywords: string[]
  to: string
}

const PALETTE: PaletteItem[] = [
  // Active assessments
  { id: 'a1', type: 'assessment', title: 'Pharmacokinetics Final',         subtitle: 'PHARM 502 · due in 4 days',     icon: 'fa-clipboard-list-check', keywords: ['pharm', 'pharmacology', 'final', 'kinetics'],     to: '/exam/exam-001/setup' },
  { id: 'a2', type: 'assessment', title: 'Microbiology — Unit 2',           subtitle: 'MICRO 401 · in progress',         icon: 'fa-clipboard-list-check', keywords: ['micro', 'microbiology', 'unit'],                  to: '/exam/exam-002/setup' },
  // Pages
  { id: 'p1', type: 'page',       title: 'Dashboard',                       subtitle: 'Active assessments',              icon: 'fa-grid-2',           keywords: ['home', 'dashboard', 'today'],                     to: '/' },
  { id: 'p2', type: 'page',       title: 'Competency Progress',             subtitle: 'Your strengths and gaps',         icon: 'fa-chart-line',       keywords: ['competency', 'progress', 'strengths', 'weak'],    to: '/competency' },
  { id: 'p3', type: 'page',       title: 'Past Assessments',                subtitle: 'All completed work',              icon: 'fa-clock-rotate-left', keywords: ['past', 'history', 'completed', 'archive'],       to: '/history' },
  { id: 'p4', type: 'page',       title: 'Study Resources',                 subtitle: 'Recommended practice + library',  icon: 'fa-book-open',        keywords: ['study', 'resources', 'practice', 'library'],      to: '/resources' },
  { id: 'p5', type: 'page',       title: 'Settings',                        subtitle: 'Personalize your experience',     icon: 'fa-gear',             keywords: ['settings', 'preferences', 'options'],             to: '/settings' },
  // Resources / competencies (sample)
  { id: 'r1', type: 'resource',   title: 'Antimicrobial Therapy Catch-up',  subtitle: 'Practice pack · 15 questions',    icon: 'fa-bullseye-arrow',   keywords: ['antimicrobial', 'therapy', 'practice', 'catch'], to: '/resources' },
  { id: 'c1', type: 'competency', title: 'Pharmacokinetics',                subtitle: 'Your strongest area · 88%',        icon: 'fa-tag',              keywords: ['pharmacokinetics', 'kinetics'],                   to: '/competency' },
  { id: 'c2', type: 'competency', title: 'Drug-drug interactions',          subtitle: 'Needs work · 64%',                 icon: 'fa-tag',              keywords: ['interactions', 'drug-drug'],                      to: '/competency' },
]

const TYPE_LABEL: Record<PaletteItem['type'], string> = {
  assessment: 'Assessment',
  resource:   'Resource',
  competency: 'Competency',
  course:     'Course',
  page:       'Page',
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAskLeo = query.startsWith('?') || query.toLowerCase().startsWith('ask ')

  const results = useMemo(() => {
    if (!query.trim()) return PALETTE.slice(0, 6)
    if (isAskLeo) return []
    const q = query.toLowerCase().trim()
    return PALETTE
      .filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.keywords.some(k => k.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [query, isAskLeo])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // focus after dialog mounts
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => { setActiveIndex(0) }, [query])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, Math.max(0, results.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isAskLeo) {
        // mocked: would route to Leo response surface
        onOpenChange(false)
        return
      }
      const item = results[activeIndex]
      if (item) {
        navigate(item.to)
        onOpenChange(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <i
            className={`${isAskLeo ? 'fa-duotone fa-solid fa-star-christmas' : 'fa-light fa-magnifying-glass'} text-base`}
            style={{ color: isAskLeo ? 'var(--brand-color)' : 'var(--muted-foreground)' }}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search assessments, resources, competencies… or type ? to ask Leo"
            className="flex-1 outline-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground"
            aria-label="Search or ask Leo"
          />
          <KbdGroup>
            <Kbd>Esc</Kbd>
          </KbdGroup>
        </div>

        {/* Body */}
        <div className="max-h-80 overflow-y-auto">
          {isAskLeo ? (
            <AskLeoBody query={query.replace(/^ask\s+/i, '').replace(/^\?/, '').trim()} />
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <i className="fa-light fa-magnifying-glass text-2xl text-muted-foreground mb-2" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-muted-foreground mt-1">Try a different keyword, or type <code>?</code> to ask Leo.</p>
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => { navigate(item.to); onOpenChange(false) }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-start ${
                      i === activeIndex ? 'bg-muted/60' : 'hover:bg-muted/30'
                    }`}
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-md"
                      style={{
                        background: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))',
                        color: 'var(--brand-color)',
                      }}
                    >
                      <i className={`fa-light ${item.icon}`} aria-hidden="true" style={{ fontSize: 13 }} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground shrink-0">
                      {TYPE_LABEL[item.type]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint row */}
        <div
          className="flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground"
          style={{ background: 'var(--muted)', borderTop: '1px solid var(--border)' }}
        >
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Kbd>↑</Kbd><Kbd>↓</Kbd> navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>↵</Kbd> select
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-duotone fa-solid fa-star-christmas" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
            Type <Kbd>?</Kbd> to ask Leo
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Ask Leo body (mocked AI response) ──────────────────────────────────────

function AskLeoBody({ query }: { query: string }) {
  if (!query) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-3">
          <i className="fa-duotone fa-solid fa-star-christmas text-base" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Ask Leo anything</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Ask about a question rationale, your performance, or get a study suggestion. Leo references your scored assessments and curriculum.
        </p>
        <div className="flex flex-col gap-1.5">
          {[
            'Why was the answer to Q14 of Pharmacokinetics Final D and not B?',
            'Where am I weakest across all my courses?',
            'Suggest 5 practice questions on antimicrobial therapy.',
          ].map(suggestion => (
            <span
              key={suggestion}
              className="text-xs px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-muted/40"
              style={{
                background: 'color-mix(in oklch, var(--brand-color) 5%, var(--card))',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <i className="fa-light fa-message me-1.5 text-muted-foreground" aria-hidden="true" />
              {suggestion}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <i className="fa-duotone fa-solid fa-star-christmas" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground">Leo is thinking…</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed italic">
        &ldquo;{query}&rdquo;
      </p>
      <div
        className="rounded-md px-3 py-2 text-xs leading-relaxed"
        style={{
          background: 'color-mix(in oklch, var(--brand-color) 5%, var(--card))',
          border: '1px solid color-mix(in oklch, var(--brand-color) 18%, var(--border))',
        }}
      >
        Leo will answer here once the AI gateway is wired up. The full response surface is built — this is just the entry point.
      </div>
    </div>
  )
}
