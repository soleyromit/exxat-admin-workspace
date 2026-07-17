'use client'

// ============================================================================
// Origin-aware navigation for the shared /results/[id] terminal.
//
// Results can be entered from four places — the Results hub, a term workspace,
// My surveys, and Analytics. The detail page's breadcrumb/back MUST return the
// user to the list they actually came from (Romit, Jul 10 2026: hard-coded
// "Back to Results" strands term-workspace users on a different list).
//
// Contract: entry links append `?from=<origin>`; the detail page resolves it
// with useResultsOrigin() and every in-page link to another result preserves
// it via withFrom(). Origins are TYPED (validated against known routes) — a
// raw back-URL param would be an open-redirect smell.
// ============================================================================

import { useSearchParams } from 'next/navigation'
import { termsOrdered } from '@/lib/pce-term-metrics'

export interface ResultsOrigin {
  /** Breadcrumb label — the list the user came from. */
  label: string
  /** Back target (immediate parent) — used by the back button + success CTA. */
  href: string
  /** Full breadcrumb ancestors, rooted at the module home so every prior page
   *  backtracks (Dashboard › … › result). */
  trail: { label: string; href: string }[]
  /** Raw param to thread onto sibling/related result links (null = default). */
  from: string | null
}

const DASHBOARD = { label: 'Dashboard', href: '/course-evaluation/dashboard' }

const DEFAULT_ORIGIN: ResultsOrigin = {
  label: 'Dashboard', href: '/course-evaluation/dashboard', trail: [DASHBOARD], from: null,
}

/** `results` → the hub · `term:<id>` → that term's workspace · `my-surveys` ·
 *  `analytics` · else Dashboard. */
export function resolveResultsOrigin(from: string | null): ResultsOrigin {
  if (from === 'results') {
    return { label: 'Results', href: '/results', trail: [{ label: 'Results', href: '/results' }], from }
  }
  if (from === 'my-dashboard') {
    return { label: 'My Dashboard', href: '/my-dashboard', trail: [{ label: 'My Dashboard', href: '/my-dashboard' }], from }
  }
  if (from?.startsWith('term:')) {
    const term = termsOrdered.find((t) => t.id === from.slice('term:'.length))
    if (term) {
      const href = `/course-evaluation/term/${term.id}`
      return { label: term.name, href, trail: [DASHBOARD, { label: term.name, href }], from }
    }
  }
  if (from === 'my-surveys') {
    return { label: 'My surveys', href: '/my-surveys', trail: [{ label: 'My surveys', href: '/my-surveys' }], from }
  }
  if (from === 'analytics') {
    return { label: 'Analytics', href: '/analytics', trail: [DASHBOARD, { label: 'Analytics', href: '/analytics' }], from }
  }
  return DEFAULT_ORIGIN
}

/** Read + resolve the `?from=` origin. Callers must be under a <Suspense>. */
export function useResultsOrigin(): ResultsOrigin {
  const searchParams = useSearchParams()
  return resolveResultsOrigin(searchParams?.get('from') ?? null)
}

/** Append the origin param so deeper result-to-result links keep the way back. */
export function withFrom(href: string, from: string | null): string {
  return from ? `${href}?from=${encodeURIComponent(from)}` : href
}
