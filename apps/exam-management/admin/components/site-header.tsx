'use client'

import Link from 'next/link'
import { useSidebar, Button, Tip } from '@exxat/ds/packages/ui/src'
import { PersonaSwitcher } from './persona-switcher'

export interface Breadcrumb {
  label: string
  href?: string
}

export interface SiteHeaderProps {
  title: string
  breadcrumbs?: Breadcrumb[]
}

export function SiteHeader({ title, breadcrumbs }: SiteHeaderProps) {
  const { toggleSidebar, state: sidebarState } = useSidebar()

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
      }}
      className="flex h-14 items-center gap-4 px-6 text-foreground"
    >
      {/* Sidebar toggle — canonical pattern from QBHeader */}
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

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <i
                      className="fa-light fa-chevron-right text-xs text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className="text-foreground"
                      aria-current="page"
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <h1 className="text-base font-semibold truncate">{title}</h1>
        )}
        </div>
      </div>

      <PersonaSwitcher />
    </header>
  )
}
