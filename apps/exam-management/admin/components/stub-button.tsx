'use client'

/**
 * STUB BUTTON — visual placeholder for actions not yet wired.
 *
 * Demo guard: shows a "Coming soon" tooltip on hover and visually disables
 * the button so Aarti (or anyone clicking around) doesn't hit a dead path.
 *
 * Replace with real DS Button + onClick once the destination exists.
 *
 * Pattern note: native `disabled` blocks pointer events, which prevents
 * the Tooltip from firing. The inner Button gets `aria-disabled` + visual
 * disable styles, while a wrapping <span> captures hover for the tooltip.
 *
 * Contrast note: button labels are informative content (they describe the
 * future feature), so we use the DS Button's native `disabled:opacity-50`
 * scale via aria-disabled styling, plus text-muted-foreground for tone,
 * rather than stacking `opacity-60` on already-muted text (which dropped
 * the muted-foreground stub label below 3:1 — NURS-bug-class flagged at
 * components/data-table/index.tsx:1041).
 */

import {
  Button, Tip,
} from '@exxatdesignux/ui'
import { type ComponentProps, type ReactNode } from 'react'

type DSButtonProps = ComponentProps<typeof Button>

export interface StubButtonProps extends Omit<DSButtonProps, 'onClick' | 'asChild'> {
  children: ReactNode
  tooltip?: string
}

export function StubButton({
  children, tooltip = 'Coming soon', className, ...props
}: StubButtonProps) {
  return (
    <Tip label={tooltip}>
      <span tabIndex={0} className="inline-flex">
        <Button
          {...props}
          aria-disabled="true"
          className={[
            className ?? '',
            // pointer-events-none keeps Tip clickable via the wrapping span.
            // text-muted-foreground @ full opacity ≈ 4.5:1 on background;
            // safer than opacity-60 (~2.57:1 with the same fg).
            'pointer-events-none text-muted-foreground',
          ].join(' ')}
        >
          {children}
        </Button>
      </span>
    </Tip>
  )
}
