"use client"

import * as React from "react"
import { FontAwesomeIcon } from "../brand/font-awesome-icon"
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { cn } from "../ui/utils"

export interface ActionCardData {
  title: string
  description: string
  icon: LucideIcon
  backgroundColor?: string
  textColor?: string
  iconColor?: string
}

export interface ActionCardProps {
  data: ActionCardData
  className?: string
  onClick?: () => void
}

/**
 * ActionCard - Bordered card component for actionable items
 * Matches the Figma design: colored background, icon, title, description, and arrow
 * Used for items like "Start Practice Session"
 */
export function ActionCard({ 
  data, 
  className,
  onClick
}: ActionCardProps) {
  const { 
    title, 
    description, 
    icon: Icon, 
    backgroundColor = "bg-chart-2/10", // Use theme-aware green from design system
    textColor = "text-foreground",
    iconColor = "text-foreground"
  } = data

  return (
    <Card 
      className={cn(
        backgroundColor,
        "border-border shadow-sm relative overflow-hidden group",
        onClick ? "cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" : "",
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Icon and content */}
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("mt-0.5", iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="flex flex-col gap-1 flex-1">
              <h3 className={cn("text-sm font-semibold", textColor)}>
                {title}
              </h3>
              <p className={cn("text-xs", textColor, "opacity-90")}>
                {description}
              </p>
            </div>
          </div>
          
          {/* Arrow icon */}
          <FontAwesomeIcon name="arrowUpRight" weight="light" className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Utility function to create action card data
 */
export function createActionCardData(
  title: string,
  description: string,
  icon: LucideIcon,
  options?: {
    backgroundColor?: string
    textColor?: string
    iconColor?: string
  }
): ActionCardData {
  return {
    title,
    description,
    icon,
    backgroundColor: options?.backgroundColor,
    textColor: options?.textColor,
    iconColor: options?.iconColor,
  }
}
