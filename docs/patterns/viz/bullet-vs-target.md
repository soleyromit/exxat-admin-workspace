# Bullet vs Target

**Question answered:** Where does X stand vs target / cohort?

**Pattern ID:** `VIZ-PATTERN-003`
**Binds rules:** VIZ-001 (replaces progress bars), VIZ-002, VIZ-003, VIZ-004, A11Y-001, A11Y-002, A11Y-008

---

## When to use

- Single numeric value compared against a target with optional qualitative ranges
- **Replaces a progress bar in 90% of dashboards** — actual + target + benchmark + ranges in one read
- Reader needs to know not just "what" but "is it good"

## When NOT to use

| Situation | Use instead |
|---|---|
| Pure progress (download, in-flight task with real 0→100%) | Progress bar (the only valid use of progress bar) |
| Multiple values to compare | Grouped bar / slope chart (P3) |
| No target / range exists | Strip plot or simple bar |
| Need to show change over time | Line / sparkline (P3) |

## Data shape

```ts
type BulletDatum = {
  label: string
  actual: number
  target: number
  ranges: [number, number, number]   // [poor_max, ok_max, good_max] — cumulative
  scale: { min: number; max: number }
  comparison?: number                  // benchmark / cohort average
  unit?: string                        // '%', 'points', 'days'
}
```

## Visual spec

| Element | Spec |
|---|---|
| Total height | 28px compact, 40px emphasis (admin); 44px+ student (touch) |
| Label | Above bar, 12px, `var(--foreground)` |
| Value text | Right of label, `tabular-nums`, "actual / target" |
| Background ranges | 3 bands at decreasing opacity using `--muted` (decorative only) |
| Actual fill | 12px tall, vertically centered |
| Color above target | `var(--chart-2)` |
| Color below target | `var(--chart-4)` (amber, NOT red — VIZ-004) |
| Target marker | 2px wide × full height, `var(--foreground)` |
| Comparison marker | 2px wide × inset height, dashed, `var(--muted-foreground)` |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring` |

## A11y notes

- Bar uses `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`
- `aria-valuetext` describes position relative to target ("75%, target 80%, below target")
- Color is paired with: target line (always shown) + value text (A11Y-008)
- Wrapper is a focusable `<button>` for drill-down (or DS Button if click action exists)

## Code recipe — admin profile (Exxat-DS)

```tsx
'use client'
import { Tooltip, TooltipTrigger, TooltipContent } from '@exxat/ds/packages/ui/src'

type Props = {
  label: string
  actual: number
  target: number
  ranges: [number, number, number]
  scale: { min: number; max: number }
  comparison?: number
  unit?: string
  onClick?: () => void
}

export function BulletVsTarget({
  label,
  actual,
  target,
  ranges,
  scale,
  comparison,
  unit = '%',
  onClick,
}: Props) {
  const span = scale.max - scale.min || 1
  const pct = (v: number) =>
    Math.max(0, Math.min(100, ((v - scale.min) / span) * 100))
  const isAboveTarget = actual >= target

  const ariaText =
    `${label}: ${actual}${unit}, target ${target}${unit}, ` +
    `${isAboveTarget ? 'meets or exceeds' : 'below'} target` +
    (comparison !== undefined ? `, cohort ${comparison}${unit}` : '')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="w-full text-left rounded-md p-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={ariaText}
        >
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-medium text-foreground truncate">
              {label}
            </span>
            <span className="text-xs tabular-nums text-foreground ml-2 whitespace-nowrap">
              {actual}{unit}
              <span className="text-muted-foreground ml-1">/ {target}{unit}</span>
            </span>
          </div>

          <div
            role="meter"
            aria-valuenow={actual}
            aria-valuemin={scale.min}
            aria-valuemax={scale.max}
            aria-valuetext={ariaText}
            className="relative h-7 bg-muted rounded-sm overflow-hidden"
          >
            {/* Range bands (decorative, A11Y-008 — paired with target line + text) */}
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${pct(ranges[0])}%`,
                background: 'color-mix(in oklch, var(--muted) 60%, transparent)',
              }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-y-0"
              style={{
                left: `${pct(ranges[0])}%`,
                width: `${pct(ranges[1]) - pct(ranges[0])}%`,
                background: 'color-mix(in oklch, var(--muted) 30%, transparent)',
              }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-y-0"
              style={{
                left: `${pct(ranges[1])}%`,
                width: `${pct(ranges[2]) - pct(ranges[1])}%`,
                background: 'color-mix(in oklch, var(--muted) 15%, transparent)',
              }}
              aria-hidden="true"
            />

            {/* Actual fill */}
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-3 rounded-sm transition-all"
              style={{
                width: `${pct(actual)}%`,
                backgroundColor: isAboveTarget
                  ? 'var(--chart-2)'
                  : 'var(--chart-4)',
              }}
              aria-hidden="true"
            />

            {/* Target marker */}
            <div
              className="absolute inset-y-0 w-0.5 bg-foreground"
              style={{ left: `${pct(target)}%` }}
              aria-hidden="true"
            />

            {/* Comparison marker (optional, dashed) */}
            {comparison !== undefined && (
              <div
                className="absolute inset-y-1 w-0.5"
                style={{
                  left: `${pct(comparison)}%`,
                  backgroundImage:
                    'linear-gradient(to bottom, var(--muted-foreground) 50%, transparent 50%)',
                  backgroundSize: '100% 4px',
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs"><strong>{label}</strong></div>
        <div className="text-xs">Actual: {actual}{unit}</div>
        <div className="text-xs">Target: {target}{unit}</div>
        {comparison !== undefined && (
          <div className="text-xs">Cohort avg: {comparison}{unit}</div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
```

## Code recipe — student profile (StudentUX)

Swap imports to per-file:

```tsx
import { Tooltip, TooltipTrigger, TooltipContent } from '@exxat/student/components/ui/tooltip'
```

Adjustments for A11Y-005 (touch targets):
- Outer `<button>` `min-h-11` (44px)
- Bar height `h-9` (36px) instead of `h-7`
- Actual fill `h-4` instead of `h-3`

## Tokens used

| Token | Purpose | Rule |
|---|---|---|
| `--muted` | range bands (decorative) | semantic |
| `--muted-foreground` | comparison marker | semantic |
| `--chart-2` | above target | VIZ-003 |
| `--chart-4` | below target (amber, NOT red) | VIZ-003, VIZ-004 |
| `--foreground` | target marker, label | semantic |
| `--ring` | focus ring | A11Y-002 |

## Use cases (PCE-specific)

- **Student mastery vs target per competency** — replace every faculty-home progress bar
- **Course completion vs target deadline** — instructor dashboard
- **Site placement target vs actual** — partner site card
- **Assessment score vs cohort average** — student performance card (with `comparison` prop)
- **Hours logged vs required** — clinical-experience tracker

## Anti-patterns

- ❌ Replace with `<Progress value={x} max={y} />` — VIZ-001 violation, hides target + ranges + comparison
- ❌ Use red `var(--destructive)` for below target — VIZ-004 violation
- ❌ Hide the target line — defeats the entire pattern
- ❌ Add a separate "X% to target" text below — VIZ-002 violation; the visual already carries that
- ❌ Use background ranges as primary color encoding — they're decorative; actual fill carries the meaning
- ❌ Add inset shadow to the bar — DS-009 violation
