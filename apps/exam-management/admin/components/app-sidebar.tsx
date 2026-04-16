'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Question Bank', href: '/question-bank', icon: 'fa-books' },
  { label: 'Share Access', href: '/access', icon: 'fa-share-nodes' },
  { label: 'Private Space', href: '/private', icon: 'fa-lock' },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        backgroundColor: 'var(--sidebar)',
        color: 'var(--sidebar-foreground)',
        borderRight: '1px solid var(--border)',
      }}
      className="flex w-64 flex-shrink-0 flex-col"
      aria-label="Main navigation"
    >
      <div
        style={{ borderBottom: '1px solid var(--border)' }}
        className="flex h-16 items-center px-6"
      >
        <span className="text-lg font-semibold">Exam Management</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                color: 'var(--sidebar-foreground)',
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
            >
              <i
                className={`fa-light ${item.icon} w-5 text-center`}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
