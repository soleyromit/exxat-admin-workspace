"use client"

import * as React from "react"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"
import { cn } from "../ui/utils"

export interface SimpleMetricData {
  label: string
  value: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  showArrow?: boolean
}

export type SimpleMetricVariant = "default" | "compact"

export interface SimpleMetricProps {
  data: SimpleMetricData
  variant?: SimpleMetricVariant
  className?: string
  onClick?: () => void
}

/**
 * SimpleMetric - Minimalist borderless metric component
 * Matches the Figma design: label on top, large number below with optional arrow and count
 * Used for compact metric displays like "Assessments Completed: 03 +5"
 */
export function SimpleMetric({ 
  data, 
  variant = "default",
  className,
  onClick
}: SimpleMetricProps) {
  const { label, value, trend, trendValue, showArrow = true } = data
  
  const trendIconName: IconName = trend === "up" ? "trendingUp" : (trend === "down" ? "trendingDown" : "arrowUpRight")
  const trendColor = trend === "up" 
    ? "text-chart-2" // Green theme color
    : trend === "down" 
    ? "text-destructive" // Red theme color
    : "text-foreground" // Default foreground

  const isCompact = variant === "compact"
  const valueSizeClass = isCompact ? "text-2xl" : "text-4xl"
  const trendIconSizeClass = isCompact ? "h-4 w-4" : "h-5 w-5"
  const trendTextSizeClass = isCompact ? "text-xs" : "text-sm"

  return (
    <div 
      className={cn(
        "flex flex-col gap-2 transition-all duration-200 relative overflow-hidden group",
        onClick ? "cursor-pointer hover:opacity-70 active:opacity-50" : "",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
    >
      {/* Label */}
      <div className={cn("text-muted-foreground font-normal", isCompact ? "text-xs" : "text-sm")}>
        {label}
      </div>
      
      {/* Value with arrow and count */}
      <div className="flex items-center gap-2">
        <div className={cn("font-bold tracking-tight text-foreground font-serif", valueSizeClass)}>
          {value}
        </div>
        {showArrow && (
          <div className="flex items-center gap-1">
            <FontAwesomeIcon name={trendIconName} className={cn(trendIconSizeClass, trendColor)} />
            {trendValue && (
              <span className={cn("font-medium", trendTextSizeClass, trendColor)}>
                {trendValue}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Utility function to create simple metric data
 */
export function createSimpleMetricData(
  label: string,
  value: string,
  options?: {
    trend?: "up" | "down" | "neutral"
    trendValue?: string
    showArrow?: boolean
  }
): SimpleMetricData {
  return {
    label,
    value,
    trend: options?.trend || "neutral",
    trendValue: options?.trendValue,
    showArrow: options?.showArrow ?? true,
  }
}
