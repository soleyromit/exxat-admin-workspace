'use client'

import * as React from 'react'
import {
  OutlineTreeMenu,
  OutlineTreeMenuItem,
  OutlineTreeSub,
  OutlineTreeSubItem,
  OutlineTreeLeafButton,
} from '@exxatdesignux/ui'

export interface BuilderOutlineItem {
  anchorId: string
  label: string
  /** Question count — quiet meta on the right. */
  count?: number
  /** Faculty sections sit one level under their role set. */
  nested?: boolean
}

export interface BuilderOutlineGroup {
  anchorId: string
  label: string
  count?: number
  items: BuilderOutlineItem[]
}

/**
 * Outline rail for the canvas builder layout — DS OutlineTree family (adoption
 * verdict: IMPORT; mirrors the results/[id] "On this page" navigator). Scroll-spy
 * highlights the aspect/section header currently in view; clicking scrolls to it.
 * Anchors are the small header rows, not the tall cards — a tall element stays
 * "intersecting" and masks the row actually in view.
 */
export function TemplateBuilderOutlineRail({ groups }: { groups: BuilderOutlineGroup[] }) {
  const [activeId, setActiveId] = React.useState('')

  // Stable key so the observer only rebuilds when the anchor set changes,
  // not on every parent render (groups is rebuilt inline each render).
  const idsKey = groups.flatMap(g => [g.anchorId, ...g.items.map(i => i.anchorId)]).join('|')

  React.useEffect(() => {
    const els = idsKey.split('|').filter(Boolean)
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      /* Top inset ≈ sticky shell; bottom bias keeps the highlight on the
         header the user just scrolled past (results/[id] tuning). */
      { rootMargin: '-64px 0px -55% 0px' },
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [idsKey])

  function jump(id: string) {
    // Instant scroll — smooth window scrolling is inert under the app shell
    // (verified on results/[id] 2026-07-09).
    document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' })
    setActiveId(id)
  }

  function Row({ label, anchorId, count, sub, className }: {
    label: string; anchorId: string; count?: number; sub?: boolean; className?: string
  }) {
    return (
      <OutlineTreeLeafButton
        surface="panel"
        isActive={activeId === anchorId}
        subGuideAlign={sub}
        onClick={() => jump(anchorId)}
        title={label}
        className={`w-full min-w-0 ${className ?? ''}`}
      >
        <span className="min-w-0 flex-1 truncate text-start">{label}</span>
        {count != null && (
          <span className="ms-auto shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
        )}
      </OutlineTreeLeafButton>
    )
  }

  return (
    <nav
      aria-label="Template outline"
      className="hidden md:flex shrink-0 w-60 flex-col overflow-y-auto overflow-x-hidden p-3 sticky self-start"
      /* Page scrolls at the window level (app shell) — sticky keeps the
         outline in view below the sticky breadcrumb bar; capped height so a
         long outline scrolls itself. */
      style={{ top: 56, maxHeight: 'calc(100vh - 64px)' }}
    >
      <OutlineTreeMenu className="gap-0.5">
        {groups.map(g => (
          /* before:hidden — the MenuItem's built-in branch guide spans the
             whole item; the per-sub inset border is the only guide we want
             (results/[id] round 8). */
          <OutlineTreeMenuItem key={g.anchorId} className="before:hidden">
            <Row label={g.label} anchorId={g.anchorId} count={g.count} className="font-medium" />
            {g.items.length > 0 && (
              <OutlineTreeSub surface="panel" guideLayout="inset" className="gap-0.5 py-0 ms-3">
                {g.items.map(i => (
                  <OutlineTreeSubItem key={i.anchorId}>
                    <Row label={i.label} anchorId={i.anchorId} count={i.count} sub className={i.nested ? 'ms-4' : ''} />
                  </OutlineTreeSubItem>
                ))}
              </OutlineTreeSub>
            )}
          </OutlineTreeMenuItem>
        ))}
      </OutlineTreeMenu>
    </nav>
  )
}
