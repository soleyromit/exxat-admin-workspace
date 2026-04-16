import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
      }}
      className="flex items-center justify-between px-6 py-4"
    >
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && (
          <p
            className="mt-0.5 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
