"use client"

/**
 * KeyMetrics — WCAG 2.1 AA reusable KPI panel
 *
 * Variants:
 *   "card"  (default) — shadcn Card wrapper with brand gradient fill
 *   "flat"            — full-width brand gradient band, no card chrome
 *
 * AA checklist:
 *  ✓ Trend text never relies on colour alone — icon + label (WCAG 1.4.1)
 *  ✓ Trend icons have aria-hidden; sr-only label carries meaning (1.1.1)
 *  ✓ Select has accessible label via aria-label (4.1.2)
 *  ✓ Insight action button has descriptive text (4.1.2)
 *  ✓ Decorative dividers are aria-hidden (1.1.1)
 *  ✓ Contrast: value text foreground ≥ 17:1, trend colours ≥ 4.5:1 (1.4.3)
 */

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AskLeoShortcutKbds, useAskLeo } from "@/components/ask-leo-sidebar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/** Tooltip + optional ⌘⌥K when the insight CTA is the default Ask Leo action. */
function InsightAskLeoTooltip({
  actionLabel,
  children,
}: {
  actionLabel?: string
  children: React.ReactNode
}) {
  const label = actionLabel ?? "Ask Leo"
  const showShortcut = !actionLabel || actionLabel === "Ask Leo"
  if (!showShortcut) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="flex flex-wrap items-center gap-1.5">
        <span>{label}</span>
        <AskLeoShortcutKbds />
      </TooltipContent>
    </Tooltip>
  )
}

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface MetricItem {
  /** Unique identifier for React keying */
  id: string
  /** Short label shown above the value */
  label: string
  /** Displayed value — e.g. "23", "98%", "1,250" */
  value: string | number
  /** Change delta — e.g. "+5", "-3", "+12" */
  delta: string | number
  /** Visual + semantic trend direction */
  trend: "up" | "down" | "neutral"
  /** Makes the cell a link */
  href?: string
  /** Makes the cell a button */
  onClick?: () => void
  /**
   * "hero" — primary KPI (e.g. total count): larger value, same structure as siblings.
   * "default" — standard KPI strip cell.
   */
  metricVariant?: "default" | "hero"
}

export interface MetricInsight {
  /** Optional single line for custom copy; rail prefers `title` + `description` when both are set */
  statement?: string
  /** Card headline */
  title: string
  /** Supporting body copy */
  description?: string
  /** Optional deep-link for the ↗ button */
  href?: string
  /** CTA label — defaults to "Ask Leo" */
  actionLabel?: string
  /** Font Awesome class for the CTA icon — defaults to fa-wand-magic-sparkles */
  actionIcon?: string
  /** Callback for the CTA button */
  onAction?: () => void
  /** Severity determines the badge colour (default: warning) */
  severity?: "warning" | "info" | "error"
}

export interface PeriodOption {
  value: string
  label: string
}

export interface KeyMetricsProps {
  /**
   * "card"  — shadcn Card with brand gradient (default)
   * "flat"  — full-width gradient band, no card chrome
   */
  variant?: "card" | "flat" | "compact"
  /** Panel title */
  title?: string
  /** Subtitle / description below title */
  description?: string
  /** Array of KPI items — by default split into rows of 3 */
  metrics: MetricItem[]
  /** When true, all metrics share one horizontal row (md+ and compact mobile grid) */
  metricsSingleRow?: boolean
  /**
   * When true with `metricsSingleRow`, use a 2-column KPI grid so half-width dashboard cards
   * fit 1–4 KPIs without horizontal overflow (pair rows on md+; 2-col grid on small screens).
   * The insight rail (if any) stacks below the KPI grid instead of sitting beside it on md+.
   */
  metricsHalfWidthLayout?: boolean
  /** Optional insight card — see `insightFullWidth` */
  insight?: MetricInsight
  /**
   * When true, the insight sits on its own full-width row under the metrics (not a narrow side rail).
   */
  insightFullWidth?: boolean
  /** Comparison-period options for the Select */
  periods?: PeriodOption[]
  /** Initially-selected period value */
  defaultPeriod?: string
  /** Called with the new period value when the Select changes */
  onPeriodChange?: (period: string) => void
  /** When false, hides the title/description/period-selector header row (default: true) */
  showHeader?: boolean
  /**
   * Tighter insight card: one short title + line of body, no vertical filler;
   * aligns visually with a single-row KPI band.
   */
  insightCompact?: boolean
  className?: string
}

/* ── Default data ─────────────────────────────────────────────────────────── */

const DEFAULT_PERIODS: PeriodOption[] = [
  { value: "week",    label: "vs last week"    },
  { value: "month",   label: "vs last month"   },
  { value: "quarter", label: "vs last quarter" },
  { value: "year",    label: "vs last year"    },
]

/* ── Sub-components ───────────────────────────────────────────────────────── */

/** Single KPI cell inside the metrics grid */
function MetricCell({
  label,
  value,
  delta,
  trend,
  href,
  onClick,
  metricVariant = "default",
  dense = false,
}: Omit<MetricItem, "id"> & { dense?: boolean }) {
  const isUp       = trend === "up"
  const isDown     = trend === "down"
  const isInteractive = !!(href || onClick)
  const isHero     = metricVariant === "hero"

  const inner = (
    <>
      {/* Label row */}
      <div className="flex items-center justify-between gap-1">
        <p
          className={cn(
            "text-muted-foreground leading-none",
            dense ? "text-xs" : "text-sm",
            isHero && "font-medium",
          )}
        >
          {label}
        </p>
        {isInteractive && (
          <i
            className="fa-light fa-arrow-right text-xs text-foreground/70 group-hover:text-interactive-hover-foreground group-hover:translate-x-0.5 transition-all duration-150"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Value + trend badge */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className={cn(
            "font-bold tabular-nums leading-none text-foreground",
            dense
              ? isHero
                ? "text-lg sm:text-xl"
                : "text-base sm:text-lg"
              : isHero
                ? "text-2xl sm:text-[1.625rem]"
                : "text-xl sm:text-2xl",
          )}
        >
          {value}
        </span>

        {/* Trend chip — icon + text, never colour-only (WCAG 1.4.1) */}
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium leading-none",
            dense ? "text-xs sm:text-xs" : "text-xs sm:text-sm",
            isUp   && "text-chart-2",
            isDown && "text-destructive",
            !isUp && !isDown && "text-muted-foreground"
          )}
          aria-label={`${isUp ? "up" : isDown ? "down" : "no change"} ${delta}`}
        >
          {isUp   && <i className="fa-light fa-arrow-trend-up text-[0.8rem]"   aria-hidden="true" />}
          {isDown && <i className="fa-light fa-arrow-trend-down text-[0.8rem]" aria-hidden="true" />}
          {!isUp && !isDown && <i className="fa-light fa-minus text-[0.8rem]"  aria-hidden="true" />}
          <span>{delta}</span>
        </span>
      </div>
    </>
  )

  const sharedClass = cn(
    "group flex flex-col gap-2 text-left outline-none first:pl-0 last:pr-0",
    dense ? "gap-1.5 px-2 py-2 sm:px-3 sm:py-3" : "gap-2 px-3 py-3 sm:px-5 sm:py-4",
    isHero && "gap-2.5",
    isInteractive && [
      "cursor-pointer transition-colors duration-150",
      "hover:bg-foreground/5",
      "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    ]
  )

  if (href) {
    return (
      <a href={href} className={sharedClass} aria-label={`${label}: ${value}`}>
        {inner}
      </a>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClass} aria-label={`${label}: ${value}`}>
        {inner}
      </button>
    )
  }

  return <div className={sharedClass}>{inner}</div>
}

/** Body line for rail: `description`, else optional `statement` */
function insightRailBody(insight: MetricInsight): string {
  const d = insight.description?.trim()
  if (d) return d
  return insight.statement?.trim() ?? ""
}

/**
 * Rail insight: severity badge + title + description + optional ↗, Ask Leo (no rule between copy and action).
 */
function InsightRailStatementAction({
  insight,
  compact,
}: {
  insight: MetricInsight
  compact: boolean
}) {
  const badgeSize = compact ? "sm" : "default"
  const surface = compact
    ? "border border-border/50 bg-gradient-to-b from-muted/35 to-card"
    : "bg-card"
  const body = insightRailBody(insight)

  return (
    <Card
      role="region"
      aria-label="Insight"
      className={cn(
        "flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-lg border-0 p-0 shadow-none ring-1 ring-foreground/8",
        surface
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col justify-center px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-start gap-2.5">
          <InsightBadge severity={insight.severity} size={badgeSize} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-foreground">{insight.title}</p>
            {body ? (
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{body}</p>
            ) : null}
          </div>
          {insight.href && (
            <a
              href={insight.href}
              className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-interactive-hover-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
              aria-label={`Open ${insight.title} — details`}
            >
              <i className="fa-light fa-arrow-up-right text-xs" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <div className="flex shrink-0 justify-end px-3 pb-3 sm:px-4 sm:pb-4">
        <InsightAskLeoTooltip actionLabel={insight.actionLabel}>
          <Button
            variant={compact ? "outline" : "ghost"}
            size="sm"
            className={cn(
              "h-8 w-full gap-1.5 text-xs sm:w-auto",
              compact
                ? "border-border/60 bg-background px-3 text-foreground hover:bg-background"
                : "px-3 text-muted-foreground hover:text-interactive-hover-foreground"
            )}
            onClick={insight.onAction}
            aria-label={insight.actionLabel ?? "Ask Leo"}
          >
            <i
              className={
                insight.actionIcon
                  ? `fa-light ${insight.actionIcon} text-xs`
                  : "fa-duotone fa-solid fa-star-christmas text-xs text-brand"
              }
              aria-hidden="true"
            />
            {insight.actionLabel ?? "Ask Leo"}
          </Button>
        </InsightAskLeoTooltip>
      </div>
    </Card>
  )
}

/** Severity icon badge for the insight card */

function InsightBadge({
  severity = "warning",
  size = "default",
}: {
  severity?: MetricInsight["severity"]
  size?: "default" | "sm"
}) {
  const styles = {
    warning: {
      bg: "bg-[var(--insight-severity-warning-bg)]",
      icon: "fa-circle-exclamation",
      color: "text-[var(--insight-severity-warning-fg)]",
    },
    info: {
      bg: "bg-[var(--insight-severity-info-bg)]",
      icon: "fa-circle-info",
      color: "text-[var(--insight-severity-info-fg)]",
    },
    error: { bg: "bg-destructive/15", icon: "fa-circle-xmark", color: "text-destructive" },
  }[severity]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        size === "sm" ? "h-6 w-6 text-xs" : "h-7 w-7 text-sm",
        styles.bg,
        styles.color
      )}
      aria-hidden="true"
    >
      <i className={`fa-light ${styles.icon}`} />
    </span>
  )
}

/* ── Shared inner content ─────────────────────────────────────────────────── */

interface InnerProps {
  title: string
  description: string
  period: string
  periods: PeriodOption[]
  metrics: MetricItem[]
  rows: MetricItem[][]
  insight?: MetricInsight
  onPeriodChange: (v: string) => void
  /** Extra padding class injected by flat variant */
  innerPadding?: string
  /** When false, the header (title/description/period select) is hidden */
  showHeader?: boolean
  insightCompact?: boolean
  insightFullWidth?: boolean
  metricsSingleRow?: boolean
  /** Tighter KPI cells + 2-col mobile grid (half-width dashboard card). */
  metricsHalfWidthLayout?: boolean
}

function KeyMetricsInner({
  title,
  description,
  period,
  periods,
  metrics,
  rows,
  insight,
  onPeriodChange,
  innerPadding = "",
  showHeader = true,
  insightCompact = false,
  insightFullWidth = false,
  metricsSingleRow = false,
  metricsHalfWidthLayout = false,
}: InnerProps) {
  /** Side-by-side KPI + insight rail (md+). Disabled for half-width dashboard cards — insight stacks below. */
  const insightSideBySide = insight && !insightFullWidth && !metricsHalfWidthLayout
  const stackedRailInsight = insight && !insightFullWidth && metricsHalfWidthLayout

  return (
    <div data-slot="key-metrics" className="contents">
      {/* ── Header ──────────────────────────────────────────────────── */}
      {showHeader && (
        <div className={cn(
          "flex flex-col gap-2 pb-3",
          "sm:flex-row sm:items-center sm:justify-between sm:gap-4",
          innerPadding
        )}>
          <div>
            <p className="text-base font-semibold text-foreground leading-tight">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Period selector — align="end" keeps dropdown flush-right */}
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger
              className="h-8 w-full sm:w-auto sm:min-w-[9rem] shrink-0 text-sm"
              aria-label="Select comparison period"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" sideOffset={4}>
              {periods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Body: metrics grid + optional insight ───────────────────── */}
      <div
        className={cn(
          "flex flex-col gap-0",
          /* 60% KPIs / 40% insight (3fr:2fr); stretch so insight card height matches KPI row */
          insightSideBySide &&
            "md:grid md:grid-cols-[minmax(0,3fr)_minmax(13rem,2fr)] md:items-stretch md:gap-x-6 md:gap-y-0",
          innerPadding
        )}
      >

        {/* Metrics section — self-start so KPI cells don’t stretch when the insight column is taller */}
        <div
          className={cn(
            "min-w-0 md:flex md:min-h-0 md:flex-col",
            !insightSideBySide && "w-full",
            insightSideBySide && "md:self-start"
          )}
        >
          {/* Mobile: 2-col when half-width layout or multi-row; single row only when full-width single strip */}
          <div
            className={cn(
              "grid divide-x divide-border md:hidden",
              metricsHalfWidthLayout || !metricsSingleRow
                ? "grid-cols-2 divide-y"
                : "divide-y-0",
            )}
            style={
              metricsSingleRow && !metricsHalfWidthLayout
                ? { gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))` }
                : undefined
            }
          >
            {metrics.map((m) => (
              <MetricCell key={m.id} {...m} dense={metricsHalfWidthLayout} />
            ))}
          </div>

          {/* md+: row-by-row 3-col with horizontal separator between rows */}
          <div className="hidden md:block">
            {rows.map((row, rowIdx) => (
              <React.Fragment key={rowIdx}>
                {rowIdx > 0 && (
                  <Separator aria-hidden="true" className="my-1" />
                )}
                <div className="grid divide-x divide-border"
                  style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
                >
                  {row.map((m) => (
                    <MetricCell key={m.id} {...m} dense={metricsHalfWidthLayout} />
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Insight card — only rendered when data provided */}
        {insight && (
          <>
            {insightFullWidth ? (
              <Separator aria-hidden="true" className="my-4 w-full" />
            ) : stackedRailInsight ? (
              <Separator aria-hidden="true" className="my-4 w-full" />
            ) : (
              <Separator aria-hidden="true" className="my-3 md:hidden" />
            )}

            <div
              className={cn(
                "flex min-h-0 min-w-0 w-full flex-col",
                /* Divider + padding replace vertical Separator so grid stays 2 columns */
                insightSideBySide &&
                  !insightFullWidth &&
                  "md:h-full md:border-l md:border-border md:pl-6"
              )}
            >
              {insight && !insightFullWidth ? (
                <InsightRailStatementAction insight={insight} compact={insightCompact} />
              ) : (
                <Card
                  role="region"
                  aria-label="Insight"
                  className={cn(
                    "overflow-hidden rounded-lg p-0 ring-1 ring-foreground/8 shadow-none",
                    "flex min-h-0 flex-col bg-muted/25"
                  )}
                >
                  {insightCompact ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:gap-8 md:p-5">
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-start gap-2.5">
                          <InsightBadge severity={insight.severity} size="sm" />
                          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                            <p className="text-base font-semibold leading-tight text-foreground">
                              {insight.title}
                            </p>
                            {insight.href && (
                              <a
                                href={insight.href}
                                className="shrink-0 text-muted-foreground transition-colors hover:text-interactive-hover-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                                aria-label={`Open ${insight.title} — details`}
                              >
                                <i className="fa-light fa-arrow-up-right text-xs" aria-hidden="true" />
                              </a>
                            )}
                          </div>
                        </div>
                        {insight.description ? (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {insight.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex w-full shrink-0 md:w-auto">
                        <InsightAskLeoTooltip actionLabel={insight.actionLabel}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-full gap-1.5 px-4 text-xs text-muted-foreground hover:text-interactive-hover-foreground md:min-w-[8.5rem]"
                            onClick={insight.onAction}
                            aria-label={insight.actionLabel ?? "Ask Leo"}
                          >
                            <i
                              className={insight.actionIcon ? `fa-light ${insight.actionIcon} text-xs` : "fa-duotone fa-solid fa-star-christmas text-xs text-brand"}
                              aria-hidden="true"
                            />
                            {insight.actionLabel ?? "Ask Leo"}
                          </Button>
                        </InsightAskLeoTooltip>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:gap-8 md:p-5">
                      <div className="flex min-w-0 flex-1 flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <InsightBadge severity={insight.severity} />
                          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                            <p className="text-base font-semibold leading-snug text-foreground">
                              {insight.title}
                            </p>
                            {insight.href && (
                              <a
                                href={insight.href}
                                className="shrink-0 text-muted-foreground transition-colors hover:text-interactive-hover-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                                aria-label={`Open ${insight.title} — details`}
                              >
                                <i className="fa-light fa-arrow-up-right text-xs" aria-hidden="true" />
                              </a>
                            )}
                          </div>
                        </div>
                        {insight.description ? (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {insight.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex w-full shrink-0 md:w-auto">
                        <InsightAskLeoTooltip actionLabel={insight.actionLabel}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-full gap-1.5 px-4 text-xs text-muted-foreground hover:text-interactive-hover-foreground md:min-w-[8.5rem]"
                            onClick={insight.onAction}
                            aria-label={insight.actionLabel ?? "Ask Leo"}
                          >
                            <i
                              className={insight.actionIcon ? `fa-light ${insight.actionIcon} text-xs` : "fa-duotone fa-solid fa-star-christmas text-xs text-brand"}
                              aria-hidden="true"
                            />
                            {insight.actionLabel ?? "Ask Leo"}
                          </Button>
                        </InsightAskLeoTooltip>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function chunkMetricPairs(metrics: MetricItem[]): MetricItem[][] {
  const out: MetricItem[][] = []
  for (let i = 0; i < metrics.length; i += 2) out.push(metrics.slice(i, i + 2))
  return out
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function KeyMetrics({
  variant       = "card",
  title         = "Key Metrics",
  description   = "Overview of performance indicators",
  metrics       = [],
  insight,
  periods       = DEFAULT_PERIODS,
  defaultPeriod = "week",
  onPeriodChange,
  showHeader    = true,
  insightCompact = false,
  insightFullWidth = false,
  metricsSingleRow = false,
  metricsHalfWidthLayout = false,
  className,
}: KeyMetricsProps) {
  const [period, setPeriod] = React.useState(defaultPeriod)
  const { toggle: toggleAskLeo } = useAskLeo()

  function handlePeriodChange(v: string) {
    setPeriod(v)
    onPeriodChange?.(v)
  }

  /* Split metrics into rows of 3, or paired rows when half-width + single row, else one row */
  const rows: MetricItem[][] = metricsSingleRow
    ? metrics.length
      ? metricsHalfWidthLayout
        ? chunkMetricPairs(metrics)
        : [metrics]
      : []
    : (() => {
        const out: MetricItem[][] = []
        for (let i = 0; i < metrics.length; i += 3) {
          out.push(metrics.slice(i, i + 3))
        }
        return out
      })()

  const innerProps: InnerProps = {
    title,
    description,
    period,
    periods,
    metrics,
    rows,
    insight,
    onPeriodChange: handlePeriodChange,
    insightCompact,
    insightFullWidth,
    metricsSingleRow,
    metricsHalfWidthLayout,
  }

  /*
   * ── GLOW GUIDELINE ────────────────────────────────────────────────────────
   * The bottom-glow treatment is a deliberate design signal. Use it only for:
   *
   *   1. AI / intelligence surfaces  — e.g. AI Insights, Ask Leo responses,
   *      any card that surfaces machine-generated content.
   *      Opacity: 0.12–0.16  (subtle; the glow should not dominate)
   *
   *   2. Designer-designated hero sections — e.g. Key Metrics (the primary
   *      KPI band), onboarding completion, or any section the product team
   *      explicitly wants to "elevate" visually.
   *      Opacity: 0.18–0.24  (more pronounced; intentional focal point)
   *
   * Do NOT add glow to:
   *   • Standard data/content cards  (Tasks, Activity, Learn, Charts…)
   *   • Navigation or shell elements
   *   • Cards that already use a coloured border or badge for status
   *
   * Implementation:
   *   style={{ background: "radial-gradient(ellipse 110% 90% at 50% 100%,
   *     oklch(from var(--brand-color) l c h / <opacity>) 0%, transparent 68%)" }}
   *   + className="overflow-hidden"  ← required to clip the gradient
   * ─────────────────────────────────────────────────────────────────────────
   */
  const glowStyle: React.CSSProperties = {
    /* oklch relative color: inherit brand hue/chroma/lightness, set alpha only */
    background:
      "radial-gradient(ellipse 110% 90% at 50% 100%, oklch(from var(--brand-color) l c h / 0.13) 0%, transparent 65%)",
  }

  /* ── Card variant — ChartCard-style chrome ───────────────────────────── */
  if (variant === "card") {
    return (
      <Card className={cn("shadow-xs overflow-hidden flex flex-col", className)} style={glowStyle}>
        <CardHeader className={cn("shrink-0 pb-2", metricsHalfWidthLayout && "space-y-2")}>
          <div
            className={cn(
              "flex gap-2",
              metricsHalfWidthLayout
                ? "flex-col min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between"
                : "items-start",
            )}
          >
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <InsightAskLeoTooltip actionLabel="Ask Leo">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 text-xs gap-1.5 px-2"
                  aria-label="Ask Leo about these metrics"
                  onClick={toggleAskLeo}
                  type="button"
                >
                  <i className="fa-duotone fa-solid fa-star-christmas text-xs text-brand" aria-hidden="true" />
                  <span>Ask Leo</span>
                </Button>
              </InsightAskLeoTooltip>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger
                  size="sm"
                  className="w-auto min-w-[9rem] shrink-0 text-sm"
                  aria-label="Select comparison period"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" sideOffset={4}>
                  {periods.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <KeyMetricsInner {...innerProps} showHeader={false} />
        </CardContent>
      </Card>
    )
  }

  /* ── Compact variant — card chrome, no header, metrics only ──────────── */
  if (variant === "compact") {
    return (
      <Card className={cn("shadow-xs overflow-hidden", className)} style={glowStyle}>
        <CardContent className="py-3 px-4">
          <KeyMetricsInner {...innerProps} showHeader={false} />
        </CardContent>
      </Card>
    )
  }

  /* ── Flat variant — full-width bottom-glow band ───────────────────────── */
  return (
    <section
      aria-label={title}
      className={cn("w-full py-5", className)}
      style={glowStyle}
    >
      <KeyMetricsInner
        {...innerProps}
        innerPadding="px-4 lg:px-6"
        showHeader={showHeader}
      />
    </section>
  )
}

/**
 * KeyMetricsContent — renders just the metrics grid + optional insight panel.
 * No card wrapper, no header, no period selector.
 * Designed for embedding inside a ChartCard with tabOptions period tabs.
 */
export function KeyMetricsContent({
  metrics = [],
  insight,
  insightCompact = false,
  insightFullWidth = false,
}: Pick<KeyMetricsProps, "metrics" | "insight" | "insightCompact" | "insightFullWidth">) {
  const rows: MetricItem[][] = []
  for (let i = 0; i < metrics.length; i += 3) rows.push(metrics.slice(i, i + 3))

  return (
    <KeyMetricsInner
      title=""
      description=""
      period=""
      periods={[]}
      metrics={metrics}
      rows={rows}
      insight={insight}
      onPeriodChange={() => {}}
      showHeader={false}
      insightCompact={insightCompact}
      insightFullWidth={insightFullWidth}
    />
  )
}
