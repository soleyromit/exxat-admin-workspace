'use client'

import { useState } from 'react'
import { SidebarTrigger, Separator, Button } from '@exxatdesignux/ui'
import { NotificationsPopover } from '@/components/notifications-popover'
import { LeoDrawer } from '@/components/leo-drawer'

export function SiteHeader() {
  const [leoOpen, setLeoOpen] = useState(false)

  return (
    <>
      <header
        className="flex h-14 shrink-0 items-center gap-2 px-4"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
      >
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-base font-semibold flex-1">Workspace</h1>
        <div className="flex items-center gap-1">
          <NotificationsPopover />
          <Button
            variant="ghost"
            size="sm"
            aria-label="Ask Leo"
            onClick={() => setLeoOpen(true)}
            className="gap-1.5"
          >
            <i
              className="fa-duotone fa-solid fa-star-christmas"
              aria-hidden="true"
              style={{ color: 'var(--brand-color)' }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--brand-color)' }}>Ask Leo</span>
          </Button>
        </div>
      </header>
      <LeoDrawer open={leoOpen} onOpenChange={setLeoOpen} />
    </>
  )
}
