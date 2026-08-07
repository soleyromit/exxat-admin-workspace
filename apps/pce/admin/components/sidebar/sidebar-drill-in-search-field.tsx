"use client"

/**
 * Search field for sidebar drill-in panels — expands to a full input when the
 * rail is open; collapses to a magnifying-glass `SidebarMenuButton` in icon mode
 * (same affordance as other nav rows).
 */

import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export interface SidebarDrillInSearchFieldProps {
  id: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  value: string
  onChange: (value: string) => void
  /** Accessible name + collapsed tooltip */
  label: string
  placeholder: string
  /** Extra class on the expanded input */
  inputClassName?: string
  /**
   * `standalone` — own `SidebarGroup` (Leo recents, legacy drill-in).
   * `menu-item` — first row inside an existing `SidebarMenu` (catalog browse).
   */
  variant?: "standalone" | "menu-item"
}

export function SidebarDrillInSearchField({
  id,
  inputRef,
  value,
  onChange,
  label,
  placeholder,
  inputClassName,
  variant = "standalone",
}: SidebarDrillInSearchFieldProps) {
  const { state, setOpen, isMobile } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile

  const focusInput = React.useCallback(() => {
    setOpen(true)
    queueMicrotask(() => inputRef?.current?.focus())
  }, [inputRef, setOpen])

  const inputClass =
    inputClassName ??
    "h-8 w-full rounded-md border border-[color:var(--control-border)] bg-card pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  if (variant === "menu-item") {
    if (collapsed) {
      return (
        <SidebarMenuItem>
          <SidebarMenuButton type="button" tooltip={label} onClick={focusInput}>
            <i
              className="fa-light fa-magnifying-glass size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }

    return (
      <SidebarMenuItem>
        <div className="px-0.5 py-0.5">
          <label htmlFor={id} className="sr-only">
            {label}
          </label>
          <div className="relative">
            <i
              className="fa-light fa-magnifying-glass pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id={id}
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={inputClass}
            />
          </div>
        </div>
      </SidebarMenuItem>
    )
  }

  if (collapsed) {
    return (
      <SidebarGroup className="py-2 pt-1">
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton type="button" tooltip={label} onClick={focusInput}>
                <i
                  className="fa-light fa-magnifying-glass size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup className="py-2 pt-1">
      <SidebarGroupContent className="flex flex-col gap-2 px-1">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <div className="relative">
          <i
            className="fa-light fa-magnifying-glass pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id={id}
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClass}
          />
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
