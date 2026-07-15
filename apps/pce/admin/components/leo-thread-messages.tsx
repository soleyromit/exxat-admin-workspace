'use client'

import type { ReactNode } from 'react'

/**
 * Minimal stub for the original `leo-thread-messages`, which was an untracked
 * local file (never committed) that got removed — leaving `ask-leo-sidebar`
 * and `leo-landing-client` importing a missing module and 500-ing the whole
 * (app) layout in `next dev`. Ask Leo isn't wired up in PCE, so this just
 * renders the empty state (or a plain message list) — enough to unblock dev.
 * Restore the real component when Ask Leo is adopted here.
 */
export interface LeoThreadMessage {
  id?: string
  role?: string
  content?: ReactNode
}

export function LeoThreadMessages({
  messages = [],
  emptyState,
  className,
  contentClassName,
  maxWidthClassName,
}: {
  messages?: LeoThreadMessage[]
  isThinking?: boolean
  emptyState?: ReactNode
  className?: string
  contentClassName?: string
  maxWidthClassName?: string
}) {
  return (
    <div className={className}>
      <div
        className={['mx-auto flex flex-col', maxWidthClassName, contentClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {messages.length === 0
          ? emptyState
          : messages.map((m, i) => (
              <div key={m.id ?? i} className="text-sm text-foreground">
                {m.content}
              </div>
            ))}
      </div>
    </div>
  )
}

export default LeoThreadMessages
