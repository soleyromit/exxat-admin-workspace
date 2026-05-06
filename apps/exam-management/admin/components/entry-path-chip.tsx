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
import {
  Button, Tooltip, TooltipTrigger, TooltipContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
} from '@exxat/ds/packages/ui/src'

export function EntryPathChip() {
  const { entry, setEntry, hydrated } = useFacultySession()

  if (!hydrated) {
    return <div className="h-7 w-32 rounded-full bg-muted/40" aria-hidden="true" />
  }

  if (entry === 'prism') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 h-7 rounded-full px-2.5 font-medium text-xs"
            style={{
              backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
              color: 'var(--brand-color-dark)',
            }}
            aria-label="Back to Prism dashboard"
            onClick={() => setEntry('standalone')}
          >
            <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 11 }} />
            <span className="font-semibold tracking-wide">Prism</span>
            <span className="text-muted-foreground" aria-hidden="true">·</span>
            <span className="font-normal">Exam Management</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          You came in via the Prism faculty module · click to switch to standalone
        </TooltipContent>
      </Tooltip>
    )
  }

  // Standalone mode
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-7 rounded-full px-2.5 font-medium text-xs border border-border"
          aria-label="Standalone exam management mode"
        >
          <i className="fa-light fa-clipboard-list-check text-brand" aria-hidden="true" style={{ fontSize: 11 }} />
          <span className="font-semibold">Exam Management</span>
          <i className="fa-light fa-chevron-down text-muted-foreground" aria-hidden="true" style={{ fontSize: 9 }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Standalone mode</DropdownMenuLabel>
        <div className="px-2 pb-2 text-[11px] text-muted-foreground leading-snug">
          You signed in directly to exam management.
          <br />
          For Prism customers, this surface also appears as a tile inside the Prism faculty module.
        </div>
        <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
        <DropdownMenuItem onClick={() => setEntry('prism')}>
          <i className="fa-light fa-grid-2" aria-hidden="true" />
          Simulate Prism entry
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
