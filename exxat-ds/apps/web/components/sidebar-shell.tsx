"use client"

/**
 * SidebarShell — SidebarProvider with layout-aware widths.
 */

import * as React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"

export function SidebarShell({
  children,
  headerHeight = "calc(var(--spacing) * 12)",
  defaultOpen = true,
  wrapperClassName,
}: {
  children: React.ReactNode
  headerHeight?: string
  defaultOpen?: boolean
  /** Extra classes on the SidebarProvider wrapper div */
  wrapperClassName?: string
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className={wrapperClassName}
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
          "--header-height": headerHeight,
        } as React.CSSProperties
      }
    >
      {children}
    </SidebarProvider>
  )
}
