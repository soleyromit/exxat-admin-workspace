"use client"

/**
 * Segmented “view tabs” control — same visual language as `ListPageTemplate` views toolbar
 * (`bg-muted/60` pill). Uses `role="radiogroup"` + `role="radio"` for exclusive choice (1.3.1).
 *
 * Keyboard: Arrow Left/Right (or Up/Down), Home, End — see onRadioKeyDown.
 */

import * as React from "react"
import { cn } from "../../lib/utils"
import { Tip } from "./tip"

export function viewSegmentedToolbarClass(className?: string) {
  return cn(
    "inline-flex items-center gap-0.5 rounded-lg bg-muted/60 p-[3px]",
    className,
  )
}

export function viewSegmentedButtonClass(
  isActive: boolean,
  opts?: { iconOnly?: boolean },
) {
  return cn(
    "inline-flex items-center rounded-md transition-all whitespace-nowrap",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    opts?.iconOnly
      ? "size-8 min-h-8 min-w-8 shrink-0 justify-center p-0 text-xs"
      : "gap-1.5 px-2.5 py-1 text-xs min-h-8",
    isActive
      ? "bg-background text-foreground font-medium shadow-sm"
      : "text-muted-foreground hover:text-interactive-hover-foreground",
  )
}

export interface ViewSegmentOption<T extends string = string> {
  value: T
  label: string
  /** Full `className` for Font Awesome icon (e.g. `fa-light fa-chart-bar`) */
  icon?: string
}

export interface ViewSegmentedControlProps<T extends string = string> {
  value: T
  onValueChange: (value: T) => void
  options: readonly ViewSegmentOption<T>[]
  /** Accessible name for the group (required — names the radiogroup) */
  "aria-label": string
  /** Optional description id for `aria-describedby` (e.g. helper text) */
  "aria-describedby"?: string
  /** Icon-only triggers (labels in `sr-only` or visible text) */
  iconOnly?: boolean
  className?: string
  /** Tooltip on each segment (defaults to `iconOnly` — recommended for icon-only) */
  showTooltips?: boolean
  /** Tooltip position */
  tooltipSide?: "top" | "bottom" | "left" | "right"
}

export function ViewSegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  iconOnly = false,
  className,
  showTooltips,
  tooltipSide = "top",
}: ViewSegmentedControlProps<T>) {
  const tips = showTooltips ?? iconOnly
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  React.useLayoutEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, options.length)
  }, [options.length])

  const focusIndex = React.useCallback(
    (index: number) => {
      const len = options.length
      if (len === 0) return
      const i = ((index % len) + len) % len
      onValueChange(options[i].value)
      requestAnimationFrame(() => {
        itemRefs.current[i]?.focus()
      })
    },
    [onValueChange, options],
  )

  const onRadioKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const len = options.length
      if (len === 0) return
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        focusIndex(index + 1)
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        focusIndex(index - 1)
      } else if (e.key === "Home") {
        e.preventDefault()
        focusIndex(0)
      } else if (e.key === "End") {
        e.preventDefault()
        focusIndex(len - 1)
      }
    },
    [focusIndex, options.length],
  )

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      data-slot="view-segmented-toolbar"
      className={cn(viewSegmentedToolbarClass(), "w-fit min-w-0 shrink-0", className)}
    >
      {options.map((opt, index) => {
        const isActive = opt.value === value
        const tabIndex = isActive ? 0 : -1

        const button = (
          <button
            ref={el => {
              itemRefs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={iconOnly ? opt.label : undefined}
            tabIndex={tabIndex}
            onKeyDown={e => onRadioKeyDown(e, index)}
            onClick={() => onValueChange(opt.value)}
            data-slot="view-segmented-item"
            className={viewSegmentedButtonClass(isActive, { iconOnly })}
          >
            {opt.icon ? (
              <i
                className={cn(opt.icon, iconOnly ? "text-[13px]" : "text-xs")}
                aria-hidden="true"
              />
            ) : null}
            {!iconOnly ? opt.label : null}
          </button>
        )

        return tips ? (
          <Tip key={opt.value} label={opt.label} side={tooltipSide}>
            {button}
          </Tip>
        ) : (
          <React.Fragment key={opt.value}>{button}</React.Fragment>
        )
      })}
    </div>
  )
}
