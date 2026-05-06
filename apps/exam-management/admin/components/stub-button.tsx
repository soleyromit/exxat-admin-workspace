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
 */

import {
  Button, Tooltip, TooltipTrigger, TooltipContent,
} from '@exxat/ds/packages/ui/src'
import { type ComponentProps, type ReactNode } from 'react'

type DSButtonProps = ComponentProps<typeof Button>

export interface StubButtonProps extends Omit<DSButtonProps, 'onClick' | 'asChild'> {
  children: ReactNode
  tooltip?: string
}

export function StubButton({
  children, tooltip = 'Coming soon — post-demo', className, ...props
}: StubButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex">
          <Button
            {...props}
            aria-disabled="true"
            className={[
              className ?? '',
              'opacity-60 pointer-events-none',
            ].join(' ')}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
