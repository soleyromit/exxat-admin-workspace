'use client'

import * as React from 'react'
import { Input } from '@exxatdesignux/ui'

export interface SurveyRailItem {
  anchorId: string
  qNumber: number
  text: string
  /** Likert average; omitted for free-text questions. */
  avg?: number
}

export interface SurveyRailGroup {
  id: string
  title: string
  /** e.g. instructor name for repeated faculty sections. */
  subtitle?: string
  items: SurveyRailItem[]
}

/**
 * Sticky "On this page" navigator for the survey detail page. Scrollspy via
 * IntersectionObserver (viewport root) highlights the section/question currently
 * in view; clicking an anchor scrolls to it via scrollIntoView (which resolves
 * the correct scroll ancestor). Solves the long-scroll + jump-to-a-specific-
 * question problem at 20+ questions without hiding content. Anchor links keep
 * native keyboard + assistive-tech behavior; reduced-motion is honored.
 */
export function SurveyResponseRail({ groups }: { groups: SurveyRailGroup[] }) {
  const [activeId, setActiveId] = React.useState<string>('')
  const [query, setQuery] = React.useState('')

  // Observe only question anchors for scrollspy — section cards are tall and would
  // stay "intersecting", masking the question actually in view.
  const allIds = React.useMemo(
    () => groups.flatMap(g => g.items.map(i => i.anchorId)),
    [groups],
  )

  React.useEffect(() => {
    const els = allIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null)
    if (els.length === 0) return

    const io = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      // Active band sits just below the sticky header, in the upper part of the viewport.
      { root: null, rootMargin: '-128px 0px -68% 0px', threshold: 0 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [allIds])

  function jump(e: React.MouseEvent, id: string) {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    setActiveId(id)
    // Update the URL hash for shareability without a second native jump.
    history.replaceState(null, '', `#${id}`)
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? groups
        .map(g => ({
          ...g,
          items: g.items.filter(
            i => i.text.toLowerCase().includes(q) || `q${i.qNumber}` === q,
          ),
        }))
        .filter(g => g.items.length > 0)
    : groups

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 w-60 sticky self-start gap-3"
      style={{ top: 4, maxHeight: 'calc(100vh - 132px)' }}
      aria-label="Survey questions"
    >
      <div className="relative shrink-0">
        <i
          className="fa-light fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Jump to question…"
          aria-label="Jump to question"
          className="h-8 text-sm pl-7"
        />
      </div>

      <nav className="flex flex-col gap-3 overflow-y-auto pr-1" aria-label="On this page">
        {filtered.length === 0 ? (
          <p className="text-sm px-2 py-1 text-muted-foreground">No questions match.</p>
        ) : (
          filtered.map(g => (
            <div key={g.id} className="flex flex-col gap-0.5">
              <a
                href={`#${g.id}`}
                onClick={e => jump(e, g.id)}
                className="text-left text-sm font-semibold py-1 text-foreground hover:underline"
              >
                {g.title}
                {g.subtitle && (
                  <span className="font-normal text-muted-foreground">{' · '}{g.subtitle}</span>
                )}
              </a>
              {g.items.map(i => {
                const active = activeId === i.anchorId
                return (
                  <a
                    key={i.anchorId}
                    href={`#${i.anchorId}`}
                    onClick={e => jump(e, i.anchorId)}
                    aria-current={active ? 'location' : undefined}
                    className={`flex items-center gap-2 rounded-md px-2 py-1 text-left transition-colors ${
                      active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-xs tabular-nums shrink-0 text-muted-foreground" style={{ minWidth: 20 }}>
                      Q{i.qNumber}
                    </span>
                    <span className="text-sm truncate flex-1">{i.text}</span>
                    {i.avg != null && (
                      <span className="text-xs tabular-nums shrink-0 text-muted-foreground">
                        {i.avg.toFixed(1)}
                      </span>
                    )}
                  </a>
                )
              })}
            </div>
          ))
        )}
      </nav>
    </aside>
  )
}
