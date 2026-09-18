'use client'

import * as React from 'react'
import { CommandMenuProvider } from '@/contexts/command-menu-context'
import { buildCommandMenuConfig } from '@/lib/command-menu-config'
import { pceCommandMenuDataGroups } from '@/lib/pce-command-menu'
import { usePce } from '@/components/pce/pce-state'

/** Account-aware ⌘K config. Rebuilds the searchable Surveys/Templates rows
 *  from the active demo account (`usePce()`), so the palette never indexes
 *  surveys the current account doesn't have — see `pceCommandMenuDataGroups`. */
export function PceCommandMenuProvider({ children }: { children: React.ReactNode }) {
  const { surveys, templates } = usePce()
  const config = React.useMemo(
    () => buildCommandMenuConfig({ dataGroups: pceCommandMenuDataGroups(surveys, templates) }),
    [surveys, templates],
  )
  return <CommandMenuProvider value={config}>{children}</CommandMenuProvider>
}
