'use client'

import { PRODUCTS } from '@/lib/products'

export function StatsBar() {
  const active = PRODUCTS.filter(p => p.subscriptionStatus === 'active').length
  const trial = PRODUCTS.filter(p => p.subscriptionStatus === 'trial').length
  const comingSoon = PRODUCTS.filter(p => p.comingSoon).length
  const notSubscribed = PRODUCTS.filter(
    p => p.subscriptionStatus === 'not-subscribed' && !p.comingSoon,
  ).length

  // Only surface segments that actually have products behind them.
  const segments = [
    { key: 'active', n: active, label: 'Active', color: 'var(--brand-color)', dim: false },
    { key: 'trial', n: trial, label: 'Trial', color: 'var(--portal-amber-border)', dim: false },
    { key: 'coming', n: comingSoon, label: 'Coming soon', color: 'var(--muted-foreground)', dim: true },
    { key: 'none', n: notSubscribed, label: 'Not subscribed', color: 'var(--muted-foreground)', dim: true },
  ].filter(s => s.n > 0)

  return (
    <div className="flex items-center gap-5 text-[13px] text-muted-foreground">
      {segments.map(s => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: s.color, opacity: s.dim ? 0.5 : 1 }}
            aria-hidden="true"
          />
          <span className="font-medium text-foreground">{s.n}</span> {s.label}
        </span>
      ))}
    </div>
  )
}
