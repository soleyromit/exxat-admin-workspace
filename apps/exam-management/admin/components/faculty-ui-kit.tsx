'use client'

/**
 * FACULTY UI KIT — DS-compliant shared primitives.
 *
 * Centralizes the patterns used across course detail, live monitor,
 * analytics, and competency surfaces. Goals:
 *   - All color via Tailwind utility classes (no inline color: 'var(--token)')
 *   - All typography via Tailwind utilities (no inline fontSize/fontWeight)
 *   - DS Card / Badge primitives — no raw divs masquerading as cards
 *
 * The 5 tones (brand/info/warning/success/neutral) are mapped to admin DS
 * theme tokens that exist in @theme inline at exxat-ds/packages/ui/src/theme.css
 */

import type { ReactNode } from 'react'
import { Card, CardContent, Badge, Button } from '@exxat/ds/packages/ui/src'

export type Tone = 'brand' | 'info' | 'warning' | 'success' | 'neutral' | 'destructive'

// Tile palette — muted by default. Value text stays neutral (foreground); the
// tone shows up only as a thin left-accent rail and a subdued icon tint.
const TONE_TILE: Record<Tone, { wrap: string; iconBg: string; iconFg: string; valueFg: string; accent: string }> = {
  brand:       { wrap: 'border-border', iconBg: 'bg-muted',     iconFg: 'text-brand-dark',   valueFg: 'text-foreground', accent: 'before:bg-brand' },
  info:        { wrap: 'border-border', iconBg: 'bg-muted',     iconFg: 'text-chart-1',      valueFg: 'text-foreground', accent: 'before:bg-chart-1' },
  warning:     { wrap: 'border-border', iconBg: 'bg-muted',     iconFg: 'text-chart-4',      valueFg: 'text-foreground', accent: 'before:bg-chart-4' },
  success:     { wrap: 'border-border', iconBg: 'bg-muted',     iconFg: 'text-chart-2',      valueFg: 'text-foreground', accent: 'before:bg-chart-2' },
  neutral:     { wrap: 'border-border', iconBg: 'bg-muted',     iconFg: 'text-muted-foreground', valueFg: 'text-foreground', accent: 'before:bg-border' },
  destructive: { wrap: 'border-border', iconBg: 'bg-muted',     iconFg: 'text-chart-5',      valueFg: 'text-foreground', accent: 'before:bg-chart-5' },
}

// Pill palette — minimal fill; colored text on neutral surface. Border is
// only present in the rare destructive/warning case where attention is the
// point. Default keeps the pill quiet so it can be scanned, not screamed at.
/* WCAG fix 2026-05-11: chart palette is tuned for fills, not text. On tinted
   backgrounds (warning bg-chart-4/8 + destructive bg-chart-5/10) the direct
   text-chart-N dropped contrast to 2.99:1. Compose darker text via mix-toward-
   foreground; 60% chart + 40% foreground lands all tones at 4.5:1+. */
const TONE_PILL: Record<Tone, { bg: string; fg: string; border: string }> = {
  brand:       { bg: 'bg-transparent',    fg: 'text-brand-dark',       border: 'border-transparent' },
  info:        { bg: 'bg-transparent',    fg: 'text-[color:color-mix(in_oklch,var(--chart-1)_60%,var(--foreground))]', border: 'border-transparent' },
  warning:     { bg: 'bg-chart-4/8',      fg: 'text-[color:color-mix(in_oklch,var(--chart-4)_60%,var(--foreground))]', border: 'border-transparent' },
  success:     { bg: 'bg-transparent',    fg: 'text-chart-2',          border: 'border-transparent' },
  neutral:     { bg: 'bg-transparent',    fg: 'text-muted-foreground', border: 'border-transparent' },
  destructive: { bg: 'bg-chart-5/10',     fg: 'text-[color:color-mix(in_oklch,var(--chart-5)_60%,var(--foreground))]', border: 'border-transparent' },
}

// ─── KpiTile ────────────────────────────────────────────────────────────────

export interface KpiTileProps {
  icon: string
  label: string
  value: ReactNode
  tone?: Tone
  sub?: ReactNode
  /** When set, the tile renders as a button. */
  onClick?: () => void
  /** When true, the icon pulses (e.g. live indicators). */
  pulseIcon?: boolean
  /** Used in selectable tile groups (e.g. roster filter chips). */
  active?: boolean
}

export function KpiTile({ icon, label, value, tone = 'neutral', sub, onClick, pulseIcon, active }: KpiTileProps) {
  const t = TONE_TILE[tone]
  const interactive = !!onClick
  const Wrap: any = interactive ? 'button' : 'div'
  return (
    <Wrap
      onClick={onClick}
      aria-pressed={active ?? undefined}
      className={`relative text-start rounded-xl border bg-card px-4 py-3 flex items-start gap-3 transition-all ${t.wrap} ${t.accent} before:absolute before:left-0 before:top-3 before:bottom-3 before:w-0.5 before:rounded-full ${interactive ? 'hover:shadow-sm hover:bg-muted/30 cursor-pointer' : ''} ${active ? 'ring-1 ring-offset-1 ring-brand/30' : ''}`}
    >
      <div className={`flex size-7 items-center justify-center rounded-md shrink-0 ${t.iconBg}`}>
        <i
          className={`fa-light ${icon} ${t.iconFg} text-xs ${pulseIcon ? '[animation:pulse-soft_1.6s_ease-in-out_infinite]' : ''}`}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <div className={`text-xl font-semibold leading-tight ${t.valueFg}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </div>
      {interactive && (
        <i className="fa-light fa-arrow-right text-muted-foreground shrink-0 mt-1 text-xs" aria-hidden="true" />
      )}
    </Wrap>
  )
}

// ─── StatusPill ─────────────────────────────────────────────────────────────

export interface StatusPillProps {
  label: ReactNode
  icon?: string
  tone?: Tone
  pulse?: boolean
  uppercase?: boolean
}

export function StatusPill({ label, icon, tone = 'neutral', pulse, uppercase }: StatusPillProps) {
  const p = TONE_PILL[tone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold border ${p.bg} ${p.fg} ${p.border} ${uppercase ? 'uppercase tracking-wider text-[10px]' : ''}`}
    >
      {icon && (
        <i
          className={`fa-solid ${icon} text-[9px] ${pulse ? '[animation:pulse-soft_1.6s_ease-in-out_infinite]' : ''}`}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  )
}

// ─── BloomChip — for course objectives ──────────────────────────────────────

export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create'

const BLOOM_TONE: Record<BloomLevel, Tone> = {
  Remember:   'info',
  Understand: 'success',
  Apply:      'brand',
  Analyze:    'warning',
  Evaluate:   'warning',
  Create:     'brand',
}

export function BloomChip({ level }: { level: BloomLevel }) {
  return <StatusPill label={level} tone={BLOOM_TONE[level]} />
}

// ─── DifficultyChip ─────────────────────────────────────────────────────────

export function DifficultyChip({ level }: { level: 'Easy' | 'Medium' | 'Hard' }) {
  const tone: Tone = level === 'Easy' ? 'success' : level === 'Medium' ? 'info' : 'warning'
  return <StatusPill label={level} tone={tone} />
}

// ─── AccessLevelChip — Course Coordinator / Course Instructor / Read-only ──
//
// Per Vishaka: Three roles in this product — Administrator, Course Coordinator,
// Course Instructor. The chip should reflect the actual role on this course,
// not generic "Editor"/"Viewer" labels.
//
// Default mapping for the demo:
//   editor → Course Coordinator (full edit on assigned courses)
//   viewer → Course Instructor (read-only — contributes questions, no admin)

export function AccessLevelChip({ level }: { level: 'editor' | 'viewer' }) {
  if (level === 'editor') {
    return <StatusPill label="Course Coordinator" icon="fa-user-shield" tone="success" uppercase />
  }
  return <StatusPill label="Course Instructor" icon="fa-eye" tone="neutral" uppercase />
}

// ─── MetricBar — horizontal progress with tone-aware fill ──────────────────

export interface MetricBarProps {
  /** Value 0–100 (clamped). */
  value: number
  tone?: Tone
  /** Width class. Default 'w-full'. */
  width?: string
  height?: 'sm' | 'md'
}

export function MetricBar({ value, tone = 'info', width = 'w-full', height = 'sm' }: MetricBarProps) {
  const fillFg: Record<Tone, string> = {
    brand: 'bg-brand', info: 'bg-chart-1', warning: 'bg-chart-4',
    success: 'bg-chart-2', neutral: 'bg-foreground', destructive: 'bg-chart-5',
  }
  const h = height === 'sm' ? 'h-1.5' : 'h-2.5'
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={`${h} ${width} rounded-full bg-muted overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${fillFg[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

// ─── PerfBadge — score % with tone-aware coloring ──────────────────────────

export function PerfBadge({ score, passing = 70 }: { score: number; passing?: number }) {
  const tone: Tone = score >= passing + 10 ? 'success' : score >= passing ? 'info' : 'warning'
  const palette = TONE_TILE[tone]
  return <span className={`text-xs font-bold tabular-nums ${palette.valueFg}`}>{score}%</span>
}

// (KpiCard removed 2026-05-11 — confirmed 0 usages via grep + KeyMetrics
//  depth audit. The `px-0 py-0` overrides on Card violated the spacing
//  contract; KpiTile is the lighter variant teams actually use.)

function KpiTileInner({ icon, label, value, tone = 'neutral', sub }: KpiTileProps) {
  const t = TONE_TILE[tone]
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${t.iconBg}`}>
        <i className={`fa-light ${icon} ${t.iconFg} text-sm`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <div className={`text-[22px] font-bold leading-tight ${t.valueFg}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

// ─── ToneCallout — banner-style notice with tone ──────────────────────────

export function ToneCallout({
  tone = 'info',
  icon,
  title,
  description,
  actions,
}: {
  tone?: Tone
  icon: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  const accent: Record<Tone, string> = {
    brand: 'border-l-brand', info: 'border-l-chart-1', warning: 'border-l-chart-4',
    success: 'border-l-chart-2', neutral: 'border-l-border', destructive: 'border-l-chart-5',
  }
  const iconColor: Record<Tone, string> = {
    brand: 'text-brand-dark', info: 'text-chart-1', warning: 'text-chart-4',
    success: 'text-chart-2', neutral: 'text-muted-foreground', destructive: 'text-chart-5',
  }
  return (
    <div className={`rounded-lg border border-border bg-card border-l-3 ${accent[tone]} p-4`}>
      <div className="flex items-start gap-3">
        <i
          className={`fa-light ${icon} ${iconColor[tone]} mt-0.5 text-sm`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{title}</p>
          {description && (
            <div className="text-xs text-muted-foreground mt-1">{description}</div>
          )}
        </div>
        {actions && <div className="flex flex-col gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}

// ─── PageHeading — DS-compliant page header H1 ─────────────────────────────

export function PageHeading({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <h1 className="font-heading text-[26px] leading-tight font-normal text-foreground truncate">
        {children}
      </h1>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ─── SectionHeading — H2 ────────────────────────────────────────────────────

export function SectionHeading({ children, level = 2 }: { children: ReactNode; level?: 2 | 3 }) {
  const Tag = (level === 2 ? 'h2' : 'h3') as any
  const cls = level === 2 ? 'font-heading font-semibold text-base text-foreground' : 'font-heading font-semibold text-sm text-foreground'
  return <Tag className={cls}>{children}</Tag>
}

// ─── Re-export Button for kit consumers ────────────────────────────────────

export { Button, Badge, Card, CardContent }
