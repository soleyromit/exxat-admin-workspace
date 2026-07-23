'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { MOCK_FACULTY } from '@/lib/pce-mock-data'
import { initialsOf } from '@/lib/pce-analytics'

/** Photo lookup by display name — for surfaces that only carry a name string
 *  (readiness cells resolve people to names, not records). Faculty only; other
 *  personas fall back to initials until their records carry an avatarUrl. */
export function facultyAvatarUrl(name: string): string | undefined {
  return MOCK_FACULTY.find(f => f.name === name)?.avatarUrl
}

/**
 * THE person avatar for product surfaces: photo when the record has one,
 * DS initials disc as the fallback (never an empty circle). One component so
 * every table/card resolves photos the same way — pass `src` when the caller
 * has the record, or let the name-based faculty lookup fill it in.
 *
 * Composition per DS Avatar API (Avatar + AvatarImage + AvatarFallback);
 * 24px floor per the avatar-initials rule.
 */
export function PersonAvatar({
  name,
  src,
  initials,
  className,
  decorative = true,
}: {
  name: string
  /** Explicit photo URL — skips the faculty name lookup. */
  src?: string
  /** Explicit initials — skips deriving them from the name. */
  initials?: string
  className?: string
  /** True (default) when the name is rendered next to the avatar. */
  decorative?: boolean
}) {
  const url = src ?? facultyAvatarUrl(name)
  return (
    <Avatar
      className={cn('h-6 w-6 shrink-0', className)}
      aria-hidden={decorative || undefined}
    >
      {url && <AvatarImage src={url} alt={decorative ? '' : name} />}
      <AvatarFallback className="text-xs">{initials ?? initialsOf(name)}</AvatarFallback>
    </Avatar>
  )
}
