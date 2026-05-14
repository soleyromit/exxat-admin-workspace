'use client'

import { SidebarTrigger, Separator } from '@exxat/ds/packages/ui/src'

export function SiteHeader() {
  return (
    <header
      className="flex h-14 shrink-0 items-center gap-2 px-4"
      style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="text-base font-semibold">Workspace</h1>
    </header>
  )
}
