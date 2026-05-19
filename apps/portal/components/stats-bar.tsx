'use client'

import { PRODUCTS } from '@/lib/products'

export function StatsBar() {
  const active = PRODUCTS.filter(p => p.subscriptionStatus === 'active').length
  const trial = PRODUCTS.filter(p => p.subscriptionStatus === 'trial').length
  const none = PRODUCTS.filter(p => p.subscriptionStatus === 'not-subscribed').length

  return (
    <div
      className="flex items-center gap-5"
      style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}
    >
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: 'var(--brand-color)' }}
          aria-hidden="true"
        />
        <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{active}</span>
        {' '}Active
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: 'var(--portal-amber-border)' }}
          aria-hidden="true"
        />
        <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{trial}</span>
        {' '}Trial
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: 'var(--muted-foreground)', opacity: 0.5 }}
          aria-hidden="true"
        />
        <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{none}</span>
        {' '}Not subscribed
      </span>
    </div>
  )
}
