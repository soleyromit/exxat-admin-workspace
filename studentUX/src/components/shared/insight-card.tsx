"use client"

import * as React from "react"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"
import { cn } from "../ui/utils"
import { Button } from "../ui/button"
import Leo from "../../imports/Leo-68-134"
import { useAppStore } from "../../stores/app-store"

export interface InsightCardData {
  title: string
  description: string
  icon: IconName
  /** Optional metric value displayed prominently */
  metric?: string
}

export type InsightCardVariant = "default" | "compact"

export interface InsightCardProps {
  data: InsightCardData
  variant?: InsightCardVariant
  className?: string
  onClick?: () => void
}

const LeoIconSmall = () => (
  <div className="h-3.5 w-3.5 flex items-center justify-center shrink-0">
    <Leo />
  </div>
)

/**
 * InsightCard — Reusable card with white background and a subtle brand
 * radial glow behind it.  Used for actionable insights, recommendations, and
 * contextual call-outs throughout the application.
 *
 * Layout:
 *   ┌─────────────────────────────────┐
 *   │  ● icon   Title         →      │
 *   │           Description          │
 *   │           [Metric]             │
 *   │                    [Ask Leo]   │
 *   └─────────────────────────────────┘
 *   (brand gradient sits behind the card)
 */
export function InsightCard({ data, variant = "default", className, onClick }: InsightCardProps) {
  const { title, description, icon, metric } = data
  const openLeoPanelWithQuery = useAppStore((s) => s.openLeoPanelWithQuery)
  const isCompact = variant === "compact"

  const handleAskLeo = (e: React.MouseEvent) => {
    e.stopPropagation() // Don't trigger card onClick
    const prompt = `Analyze the insight: "${title}" — ${description}${metric ? ` (Metric: ${metric})` : ""}. Provide a deeper analysis, any related issues, and actionable recommendations.`
    openLeoPanelWithQuery(prompt)
  }

  return (
    <div className={cn("relative", className)}>
      {/* Keyframe definition — gentle one-time lift + glow via box-shadow
          Uses color-mix to derive alpha variants from --brand-color */}
      <style>{`
        @keyframes insight-enter {
          0%   { box-shadow: 0 0 0 0 color-mix(in oklch, var(--brand-color) 0%, transparent); transform: translateY(0); }
          40%  { box-shadow: 0 4px 24px 4px color-mix(in oklch, var(--brand-color) 18%, transparent); transform: translateY(-3px); }
          70%  { box-shadow: 0 2px 16px 2px color-mix(in oklch, var(--brand-color) 12%, transparent); transform: translateY(-1px); }
          100% { box-shadow: 0 1px 12px 1px color-mix(in oklch, var(--brand-color) 8%, transparent); transform: translateY(0); }
        }
      `}</style>

      {/* Card — glow rendered as box-shadow so it's never clipped */}
      <div
        className={cn(
          "relative bg-card border border-border rounded-lg shadow-sm",
          isCompact ? "p-3" : "p-4",
          "animate-[insight-enter_2s_ease-in-out_forwards]",
          onClick && "cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onClick()
                }
              }
            : undefined
        }
      >
        <div className={cn("flex items-start justify-between gap-3", isCompact && "gap-2")}>
          {/* Icon + content */}
          <div className={cn("flex items-start flex-1 min-w-0", isCompact ? "gap-2" : "gap-3")}>
            <div className={cn("mt-0.5 text-brand flex-shrink-0", isCompact && "mt-0")}>
              <FontAwesomeIcon name={icon} className={isCompact ? "h-4 w-4" : "h-5 w-5"} />
            </div>

            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <h3 className={cn("font-semibold text-foreground", isCompact ? "text-xs" : "text-sm")}>{title}</h3>
              <p className={cn("text-primary leading-relaxed line-clamp-2", isCompact ? "text-xs" : "text-sm")}>
                {description}
              </p>
            </div>
          </div>

          {/* Arrow */}
          {onClick && (
            <FontAwesomeIcon name="arrowUpRight" weight="light" className={cn("flex-shrink-0 text-muted-foreground", isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          )}
        </div>

        {/* Ask Leo ghost button */}
        <div className={cn("flex justify-end", isCompact ? "mt-1.5" : "mt-2")}>
          <Button
            variant="ghost"
            size={isCompact ? "sm" : "sm"}
            onClick={handleAskLeo}
            className={cn("gap-1.5 font-medium transition-all duration-200", isCompact ? "text-xs h-6 px-1.5" : "text-xs h-7 px-2")}
          >
            <LeoIconSmall />
            Ask Leo
            <span
              data-slot="brand-gradient"
              className="absolute inset-0 pointer-events-none opacity-0 transition-all duration-200 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 z-0"
              aria-hidden
              style={{
                background:
                  "radial-gradient(at bottom, color-mix(in oklch, var(--brand-color) 6%, transparent), transparent)",
              }}
            />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Utility factory for creating InsightCard data objects.
 */
export function createInsightCardData(
  title: string,
  description: string,
  icon: IconName,
  metric?: string
): InsightCardData {
  return { title, description, icon, metric }
}
