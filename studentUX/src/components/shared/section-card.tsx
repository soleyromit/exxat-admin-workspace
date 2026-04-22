"use client"

import * as React from "react"
import { Card, CardContent } from "../ui/card"
import { cn } from "../ui/utils"

export interface SectionCardProps {
  title: string
  /** Optional icon. Omit for iconless cards. */
  icon?: React.ReactNode
  /** Icon container background. Default: bg-muted. Use bg-chart-1/10, bg-destructive/10, etc. for colored icons. */
  iconBg?: string
  /** Icon color. Default: text-muted-foreground */
  iconColor?: string
  children: React.ReactNode
  className?: string
}

/**
 * SectionCard — Matches home screen card style (alerts section)
 * Icon in rounded box, title, content. Used for content sections in detail pages.
 */
export function SectionCard({
  title,
  icon,
  iconBg = "bg-muted",
  iconColor = "text-muted-foreground",
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn("group transition-all", className)}>
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start gap-3 mb-4">
          {icon && (
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                iconBg,
                iconColor
              )}
            >
              {icon}
            </div>
          )}
          <h4 className={cn("font-semibold text-[14px] leading-tight", icon ? "pt-2" : "")}>{title}</h4>
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </CardContent>
    </Card>
  )
}
