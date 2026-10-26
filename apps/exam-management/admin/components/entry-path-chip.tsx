'use client'

/**
 * Entry-path chip — surfaces the dual-entry capability Aarti called out:
 *   1. via Prism faculty module (tile/menu)        → "← Back to Prism"
 *   2. direct exam-management login (standalone)   → "Exam Management"
 *
 * This is the visible signal that the same exam-management surface can be
 * embedded inside Prism OR sold standalone (144 approved-only users).
 *
 * Click on Prism mode → simulates returning to the Prism dashboard.
 * Click on Standalone mode → opens a small popover explaining the mode.
 */

import { useFacultySession } from '@/lib/faculty-session'
import { Tip } from '@exxatdesignux/ui'

export function EntryPathChip() {
  const { entry, setEntry, hydrated } = useFacultySession()

  if (!hydrated) {
    return <div className="h-7 w-32 rounded-full bg-muted/40" aria-hidden="true" />
  }

  if (entry === 'prism') {
    return (
      <Tip label="Prism entry mode — user arrived via the Prism faculty module. Switch entry mode in the persona menu (top-right).">
        <div
          className="flex items-center gap-2 h-7 rounded-full px-2.5 font-medium text-xs select-none"
          style={{
            backgroundColor: 'var(--brand-tint)',
            color: 'var(--brand-color-dark)',
          }}
          aria-label="Entry mode: Prism"
        >
          <i className="fa-light fa-grid-2" aria-hidden="true" style={{ fontSize: 11 }} />
          <span className="font-semibold tracking-wide">Prism</span>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <span className="font-normal">Exam Management</span>
        </div>
      </Tip>
    )
  }

  // Standalone mode
  return (
    <Tip label="Standalone entry mode — user logged in directly, no Prism context. Switch entry mode in the persona menu (top-right).">
      <div
        className="flex items-center gap-2 h-7 rounded-full px-2.5 font-medium text-xs border border-border select-none"
        style={{ color: 'var(--muted-foreground)' }}
        aria-label="Entry mode: Standalone"
      >
        <i className="fa-light fa-clipboard-list-check" aria-hidden="true" style={{ fontSize: 11 }} />
        <span className="font-semibold text-foreground">Exam Management</span>
        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--muted-foreground)' }}>
          Standalone
        </span>
      </div>
    </Tip>
  )
}
