/**
 * COMMAND PALETTE — ⌘K / Ctrl+K overlay for search and quick navigation.
 *
 * Rebased onto DS `CommandDialog` (cmdk under the hood, wrapped in Radix Dialog).
 * Mirrors apps/pce/admin/components/command-palette.tsx so the surface is
 * identical across products. Per audit
 * docs/governance/component-depth-audits/coach-mark-and-command.md.
 *
 * Two modes:
 *   1. Search   — filters CommandItem list by typed query
 *   2. Ask Leo  — when input starts with "?" or "ask " — routes to AI response
 *      (mocked for the demo; gates real AI hand-off behind the existing
 *      AskLeoBody panel)
 *
 * Filtering relies on cmdk's built-in matcher against each CommandItem's
 * `value` prop — no manual filtering loop. We swap CommandList's body for the
 * AskLeoBody when the input starts with "?" or "ask ".
 *
 * Keyboard (handled by cmdk):
 *   ⌘K / Ctrl+K — open
 *   Esc         — close (Radix Dialog)
 *   ↑ / ↓       — navigate items
 *   Enter       — select / navigate
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  Kbd,
  KbdGroup,
} from '@exxatdesignux/ui'

interface PaletteItem {
  id: string
  type: 'assessment' | 'resource' | 'competency' | 'course' | 'page'
  title: string
  subtitle?: string
  icon: string
  keywords: string[]
  to: string
}

const ASSESSMENTS: PaletteItem[] = [
  { id: 'a1', type: 'assessment', title: 'Pharmacokinetics Final',  subtitle: 'PHARM 502 · due in 4 days', icon: 'fa-clipboard-list-check', keywords: ['pharm', 'pharmacology', 'final', 'kinetics'], to: '/exam/exam-001/setup' },
  { id: 'a2', type: 'assessment', title: 'Microbiology — Unit 2',    subtitle: 'MICRO 401 · in progress',    icon: 'fa-clipboard-list-check', keywords: ['micro', 'microbiology', 'unit'],             to: '/exam/exam-002/setup' },
]

const PAGES: PaletteItem[] = [
  { id: 'p1', type: 'page', title: 'Dashboard',            subtitle: 'Active assessments',             icon: 'fa-grid-2',            keywords: ['home', 'dashboard', 'today'],                  to: '/' },
  { id: 'p2', type: 'page', title: 'Competency Progress', subtitle: 'Your strengths and gaps',         icon: 'fa-chart-line',        keywords: ['competency', 'progress', 'strengths', 'weak'], to: '/competency' },
  { id: 'p3', type: 'page', title: 'Past Assessments',    subtitle: 'All completed work',              icon: 'fa-clock-rotate-left', keywords: ['past', 'history', 'completed', 'archive'],     to: '/history' },
  { id: 'p4', type: 'page', title: 'Study Resources',     subtitle: 'Recommended practice + library', icon: 'fa-book-open',         keywords: ['study', 'resources', 'practice', 'library'],   to: '/resources' },
  { id: 'p5', type: 'page', title: 'Settings',            subtitle: 'Personalize your experience',    icon: 'fa-gear',              keywords: ['settings', 'preferences', 'options'],          to: '/settings' },
]

const RESOURCES: PaletteItem[] = [
  { id: 'r1', type: 'resource',   title: 'Antimicrobial Therapy Catch-up', subtitle: 'Practice pack · 15 questions', icon: 'fa-bullseye-arrow', keywords: ['antimicrobial', 'therapy', 'practice', 'catch'], to: '/resources' },
]

const COMPETENCIES: PaletteItem[] = [
  { id: 'c1', type: 'competency', title: 'Pharmacokinetics',       subtitle: 'Your strongest area · 88%', icon: 'fa-tag', keywords: ['pharmacokinetics', 'kinetics'],   to: '/competency' },
  { id: 'c2', type: 'competency', title: 'Drug-drug interactions', subtitle: 'Needs work · 64%',          icon: 'fa-tag', keywords: ['interactions', 'drug-drug'],      to: '/competency' },
]

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

/** Build cmdk's `value` from item fields — joined so the matcher hits any of them. */
function itemValue(item: PaletteItem) {
  return [item.title, item.subtitle ?? '', ...item.keywords].join(' ')
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const isAskLeo = query.startsWith('?') || query.toLowerCase().startsWith('ask ')

  const go = (to: string) => {
    onOpenChange(false)
    navigate(to)
  }

  // Reset query when palette closes so reopening starts fresh.
  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery('')
    onOpenChange(next)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search or ask Leo"
      description="Search assessments, resources, competencies, or pages — or type ? to ask Leo."
    >
      <div className="flex items-center gap-2 border-b border-border px-3">
        <CommandInput
          variant="palette"
          value={query}
          onValueChange={setQuery}
          placeholder="Search assessments, resources, competencies… or type ? to ask Leo"
        />
        <KbdGroup className="ms-auto shrink-0">
          <Kbd>esc</Kbd>
        </KbdGroup>
      </div>

      {isAskLeo ? (
        <div className="max-h-80 overflow-y-auto">
          <AskLeoBody query={query.replace(/^ask\s+/i, '').replace(/^\?/, '').trim()} />
        </div>
      ) : (
        <CommandList className="max-h-80">
          <CommandEmpty>No results.</CommandEmpty>

          <CommandGroup heading="Assessments">
            {ASSESSMENTS.map(item => (
              <CommandItem
                key={item.id}
                value={itemValue(item)}
                onSelect={() => go(item.to)}
              >
                <i className={`fa-light ${item.icon}`} aria-hidden="true" />
                <span className="flex-1 truncate">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Pages">
            {PAGES.map(item => (
              <CommandItem
                key={item.id}
                value={itemValue(item)}
                onSelect={() => go(item.to)}
              >
                <i className={`fa-light ${item.icon}`} aria-hidden="true" />
                <span className="flex-1 truncate">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Resources">
            {RESOURCES.map(item => (
              <CommandItem
                key={item.id}
                value={itemValue(item)}
                onSelect={() => go(item.to)}
              >
                <i className={`fa-light ${item.icon}`} aria-hidden="true" />
                <span className="flex-1 truncate">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Competencies">
            {COMPETENCIES.map(item => (
              <CommandItem
                key={item.id}
                value={itemValue(item)}
                onSelect={() => go(item.to)}
              >
                <i className={`fa-light ${item.icon}`} aria-hidden="true" />
                <span className="flex-1 truncate">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      )}

      {/* Footer hint row */}
      <div
        className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground"
        style={{ background: 'var(--muted)' }}
      >
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <KbdGroup><Kbd>↑</Kbd><Kbd>↓</Kbd></KbdGroup> navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>↵</Kbd> select
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i
            className="fa-duotone fa-solid fa-star-christmas"
            style={{ color: 'var(--brand-color)' }}
            aria-hidden="true"
          />
          Type <Kbd>?</Kbd> to ask Leo
        </span>
      </div>
    </CommandDialog>
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
