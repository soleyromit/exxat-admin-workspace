'use client'

import { useSidebar, Button, Tip } from '@exxat/ds/packages/ui/src'

export function SiteHeader({ title }: { title: string }) {
  const { toggleSidebar, state: sidebarState } = useSidebar()

  return (
    <header
      style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
      className="flex h-14 items-center gap-4 px-6 text-foreground"
    >
      <Tip label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}
          className={sidebarState !== 'collapsed' ? 'text-foreground' : 'text-muted-foreground'}
        >
          <i className="fa-light fa-sidebar" aria-hidden="true" style={{ fontSize: 16 }} />
        </Button>
      </Tip>

      <div
        style={{ width: 1, alignSelf: 'stretch', margin: '10px 0', background: 'var(--border)', flexShrink: 0 }}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate">{title}</h1>
      </div>
    </header>
  )
}
