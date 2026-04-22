"use client"

import * as React from "react"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"
import { cn } from "../ui/utils"

export interface MetricCardData {
  title: string
  value: string
  change?: string
  trend?: "up" | "down" | "neutral"
  description?: string
  icon?: IconName
  color?: string
}

export interface MetricCardProps {
  data: MetricCardData
  className?: string
  onClick?: () => void
}

export function MetricCard({ 
  data, 
  className,
  onClick
}: MetricCardProps) {
  const { title, value, change, trend, icon: iconName, color } = data
  const trendIconName = trend === "up" ? "trendingUp" : (trend === "down" ? "trendingDown" : null)
  const trendColor = trend === "up" ? "text-chart-2" : (trend === "down" ? "text-destructive" : "text-muted-foreground")

  return (
    <div 
      className={cn(
        "flex flex-col p-4 bg-background",
        onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" : "",
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {iconName && (
          <FontAwesomeIcon name={iconName} className={cn("h-4 w-4", color || "text-muted-foreground")} />
        )}
      </div>
      
      <div className="flex items-end gap-2">
        <div className="text-2xl font-bold tracking-tight font-serif">{value}</div>
        {change && (
          <div className="flex items-center text-sm mb-1">
            {trend && trendIconName && (
              <FontAwesomeIcon name={trendIconName} className={cn("mr-1 h-3 w-3", trendColor)} />
            )}
            <span className={cn("font-medium", trendColor)}>{change}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Utility function to create metric card data
export function createMetricCardData(
  title: string,
  value: string,
  icon: IconName,
  color: string,
  options?: {
    change?: string
    trend?: "up" | "down" | "neutral"
    description?: string
  }
): MetricCardData {
  return {
    title,
    value,
    icon,
    color,
    ...options,
  }
}
