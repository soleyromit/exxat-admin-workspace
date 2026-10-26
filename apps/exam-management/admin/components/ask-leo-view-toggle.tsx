"use client"

import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAskLeo } from "@/components/ask-leo-context"
import { useProduct } from "@/contexts/product-context"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import { productSlug } from "@/stores/app-store"
import { cn } from "@/lib/utils"

type AskLeoViewMode = "panel" | "fullscreen"

function isLeoLandingPath(pathname: string, leoHref: string) {
  return pathname === leoHref || pathname.startsWith(`${leoHref}/`)
}

function useAskLeoViewMode(): AskLeoViewMode {
  const { pathname } = useLocation()
  const { product } = useProduct()
  const leoHref = `/${productSlug(product)}/leo`
  return isLeoLandingPath(pathname, leoHref) ? "fullscreen" : "panel"
}

/**
 * Panel <-> full-screen Leo view switcher. Kept separate from the heavy
 * sidebar panel so the landing route can render it without pulling the panel
 * implementation into the app shell chunk.
 */
export function AskLeoViewToggle({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { open, setOpen } = useAskLeo()
  const { product } = useProduct()
  const dashboardHref = useProductDashboardHref()
  const leoHref = `/${productSlug(product)}/leo`
  const viewMode = useAskLeoViewMode()

  const handleViewChange = React.useCallback(
    (next: AskLeoViewMode) => {
      if (next === viewMode) return
      if (next === "fullscreen") {
        setOpen(false)
        navigate(leoHref)
        return
      }
      if (viewMode === "fullscreen") {
        navigate(dashboardHref)
        queueMicrotask(() => setOpen(true))
        return
      }
      if (!open) setOpen(true)
    },
    [dashboardHref, leoHref, navigate, open, setOpen, viewMode],
  )

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "icon-button-chrome inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                className,
              )}
              aria-label="Leo view"
            >
              <i
                className={cn(
                  "text-icon",
                  viewMode === "fullscreen" ? "fa-light fa-expand" : "fa-light fa-sidebar",
                )}
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Change Leo view</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="min-w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">View</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          aria-selected={viewMode === "panel"}
          onClick={() => handleViewChange("panel")}
        >
          <i className="fa-light fa-sidebar text-icon" aria-hidden="true" />
          Panel
          {viewMode === "panel" ? (
            <i className="fa-solid fa-check ms-auto text-brand text-xs" aria-hidden="true" />
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          aria-selected={viewMode === "fullscreen"}
          onClick={() => handleViewChange("fullscreen")}
        >
          <i className="fa-light fa-expand text-icon" aria-hidden="true" />
          Full screen
          {viewMode === "fullscreen" ? (
            <i className="fa-solid fa-check ms-auto text-brand text-xs" aria-hidden="true" />
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
