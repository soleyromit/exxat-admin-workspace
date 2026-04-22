"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Label } from "./label"
import { RadioGroup, RadioGroupItem } from "./radio-group"

export interface SelectionTileOption<T extends string = string> {
  value: T
  label: string
  /** Font Awesome icon class without prefix (e.g. `fa-table`); rendered with `fa-light`. Ignored when `leading` is set. */
  icon?: string
  /** Custom graphic (SVG, swatch, etc.) instead of `icon`. */
  leading?: React.ReactNode
}

/** Shared surface classes for icon+label tiles (Properties view type, Export format, etc.). */
export function selectionTileClassNames(selected: boolean) {
  return cn(
    "flex flex-col items-center justify-center gap-1.5 rounded-lg border py-3 text-xs transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    selected
      ? "border-brand bg-brand/5 text-foreground font-medium shadow-sm"
      : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-interactive-hover-foreground",
  )
}

function SelectionTileGraphic<T extends string>({
  option,
  selected,
}: {
  option: SelectionTileOption<T>
  selected: boolean
}) {
  if (option.leading != null) {
    return (
      <span className="flex w-full shrink-0 items-center justify-center [&_svg]:pointer-events-none">
        {option.leading}
      </span>
    )
  }
  if (option.icon) {
    return (
      <i
        className={cn(
          "fa-light shrink-0 text-[18px] leading-none",
          option.icon,
          selected && "text-brand",
        )}
        aria-hidden="true"
      />
    )
  }
  return null
}

function SelectionTileLabelText<T extends string>({
  option,
}: {
  option: SelectionTileOption<T>
}) {
  return <span className="text-center leading-tight">{option.label}</span>
}

export interface SelectionTileGridProps<T extends string> {
  /** Section caption above the grid (e.g. “View type”). */
  sectionLabel?: string
  options: readonly SelectionTileOption<T>[]
  columns?: 2 | 3 | 4
  value: T
  onValueChange: (value: T) => void
  /** `radio` — Form / RadioGroup; `button` — toggle buttons with aria-pressed. */
  interaction: "radio" | "button"
  /** Prefix for radio ids (`${idPrefix}-${value}`). */
  idPrefix?: string
  className?: string
}

/**
 * Icon tile grid for single selection — matches Properties “View type” and Export “File format” patterns.
 */
export function SelectionTileGrid<T extends string>({
  sectionLabel,
  options,
  columns = 4,
  value,
  onValueChange,
  interaction,
  idPrefix = "tile",
  className,
}: SelectionTileGridProps<T>) {
  const gridClass = cn(
    "gap-2",
    columns === 2 && "grid grid-cols-2",
    columns === 3 && "grid grid-cols-3",
    columns === 4 && "grid grid-cols-4",
  )

  if (interaction === "radio") {
    return (
      <div className={className}>
        {sectionLabel ? (
          <p className="mb-2 text-xs font-medium text-muted-foreground">{sectionLabel}</p>
        ) : null}
        <RadioGroup value={value} onValueChange={v => onValueChange(v as T)} className={gridClass}>
          {options.map(opt => {
            const selected = value === opt.value
            return (
              <Label
                key={opt.value}
                htmlFor={`${idPrefix}-${opt.value}`}
                className={cn(
                  "cursor-pointer rounded-lg focus-within:rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:outline-none",
                  selectionTileClassNames(selected),
                )}
              >
                <RadioGroupItem value={opt.value} id={`${idPrefix}-${opt.value}`} className="sr-only" />
                <SelectionTileGraphic option={opt} selected={selected} />
                <SelectionTileLabelText option={opt} />
              </Label>
            )
          })}
        </RadioGroup>
      </div>
    )
  }

  return (
    <div className={className}>
      {sectionLabel ? (
        <p className="mb-2 text-xs font-medium text-muted-foreground">{sectionLabel}</p>
      ) : null}
      <div className={gridClass}>
        {options.map(opt => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.label}
              aria-pressed={selected}
              onClick={() => onValueChange(opt.value)}
              className={selectionTileClassNames(selected)}
            >
              <SelectionTileGraphic option={opt} selected={selected} />
              <SelectionTileLabelText option={opt} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
