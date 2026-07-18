'use client'

/**
 * ⌘K scoped to the active role.
 *
 * The palette listed every admin route and record regardless of view — a faculty member could
 * summon "Faculty", "Templates" or the program analytics from ⌘K (2026-07-16). The sidebar
 * guard bounces the navigation afterwards, but showing commands the role cannot use is both a
 * data-surface leak (survey/template titles) and a broken promise. Faculty keep: their own
 * pages (isFacultyRoute), Ask-Leo prompts, and nothing search-only from the admin data layer.
 */

import { useMemo } from 'react'
import { usePce } from '@/components/pce/pce-state'
import { isFacultyRoute } from '@/lib/pce-faculty'
import { CommandMenuProvider } from '@/contexts/command-menu-context'
import type { CommandMenuConfig } from '@/lib/command-menu-config'

export function RoleScopedCommandMenu({
  base,
  children,
}: {
  base: CommandMenuConfig
  children: React.ReactNode
}) {
  const { user } = usePce()

  const config = useMemo<CommandMenuConfig>(() => {
    if (user.role !== 'faculty') return base
    return {
      ...base,
      groups: base.groups
        .filter((g) => !g.searchOnly) // admin row indexes (surveys, templates, entities)
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (i) => i.askLeoPrompt || (i.href ? isFacultyRoute(i.href) : false),
          ),
        }))
        .filter((g) => g.items.length > 0),
    }
  }, [base, user.role])

  return <CommandMenuProvider value={config}>{children}</CommandMenuProvider>
}
