"use client"
import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

interface TipProps {
  /** Plain string or text + `<Kbd />` — see `.cursor/rules/exxat-kbd-shortcuts.mdc` */
  label: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
}

export function Tip({ label, children, side = "top" }: TipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="flex flex-wrap items-center gap-1.5">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
