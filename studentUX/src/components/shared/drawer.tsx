"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/components/ui/utils"

export type DrawerSize = "sm" | "md" | "lg" | "xl" | "full"
export type DrawerSide = "top" | "right" | "bottom" | "left"

const SIZE_CLASSES: Record<DrawerSize, string> = {
  sm: "max-w-[320px]",
  md: "max-w-md sm:max-w-md",
  lg: "max-w-lg sm:max-w-lg",
  xl: "max-w-xl sm:max-w-xl",
  full: "inset-0 w-full h-full max-w-none rounded-none",
}

const SIDE_POSITION: Record<DrawerSide, string> = {
  right: "!top-4 !right-4 !bottom-4 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right border-l",
  left: "!top-4 !left-4 !bottom-4 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left border-r",
  top: "!top-4 !left-4 !right-4 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top border-b",
  bottom: "!bottom-4 !left-4 !right-4 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom border-t",
}

export interface DrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  /** Simple title (rendered in SheetTitle) */
  title?: React.ReactNode
  /** Custom header (overrides title when provided) */
  header?: React.ReactNode
  children: React.ReactNode
  /** Size variant: sm (320px), md, lg, xl, full */
  size?: DrawerSize
  /** Side from which drawer slides */
  side?: DrawerSide
  /** Additional class for SheetContent */
  className?: string
  /** Modal behavior — set false when drawer contains dropdowns */
  modal?: boolean
  /** Custom shadow style */
  shadowStyle?: React.CSSProperties
}

export function Drawer({
  open,
  onOpenChange,
  trigger,
  title,
  header,
  children,
  size = "md",
  side = "right",
  className,
  modal = true,
  shadowStyle,
}: DrawerProps) {
  const contentClassName = cn(
    "flex flex-col p-0 gap-0 overflow-hidden",
    "rounded-xl border-border bg-background",
    SIDE_POSITION[side],
    SIZE_CLASSES[size],
    "h-[calc(100vh-2rem)]",
    className
  )

  const contentStyle: React.CSSProperties = {
    ...(shadowStyle ?? {}),
    boxShadow: shadowStyle?.boxShadow ?? "var(--shadow-drawer-elevated)",
    top: "1rem",
    right: side === "right" ? "1rem" : undefined,
    bottom: "1rem",
    left: side === "left" ? "1rem" : side === "top" || side === "bottom" ? "1rem" : undefined,
    height: "calc(100vh - 2rem)",
  }

  const hasHeader = header || title

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={modal}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side={side} className={contentClassName} style={contentStyle}>
        {hasHeader && (
          <SheetHeader className="flex flex-row items-center gap-4 px-6 pt-4 pb-4 pr-14 shrink-0 min-h-[52px]">
            <div className="flex-1 min-w-0 flex items-center">
              {header ?? (title ? <SheetTitle className="text-xl font-semibold truncate">{title}</SheetTitle> : null)}
            </div>
          </SheetHeader>
        )}
        {children}
      </SheetContent>
    </Sheet>
  )
}
