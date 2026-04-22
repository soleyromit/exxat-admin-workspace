"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, X, MoreHorizontal, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { Checkbox } from "../ui/checkbox"
import { OutlineSearchInput } from "../ui/outline-search-input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Separator } from "../ui/separator"
import { Calendar } from "../ui/calendar"
import { cn } from "../ui/utils"
import { formatDate } from "@/utils/date-utils"

// ─── Layout rules (reusable across filter UIs) ───────────────────────────────
export const FILTER_LAYOUT = {
  /** Max height for expanded filter content (chips + search + list) */
  expandedContentMaxHeight: 400,
  /** Min/max height for checkbox list */
  listMinHeight: 120,
  listMaxHeight: 280,
} as const

/** Scrollable container with fixed max height — use for filter editors, option lists, etc. */
export function ScrollableContainer({
  className,
  maxHeight = FILTER_LAYOUT.expandedContentMaxHeight,
  children,
  ...props
}: React.ComponentProps<"div"> & { maxHeight?: number }) {
  return (
    <div
      className={cn("overflow-y-auto overflow-x-hidden", className)}
      style={{ maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }}
      {...props}
    >
      {children}
    </div>
  )
}

/** Scrollable option list with consistent sizing */
export function ScrollableOptionList({
  className,
  children,
  emptyMessage = "No options found",
  ...props
}: React.ComponentProps<"div"> & { emptyMessage?: string }) {
  const hasContent = React.Children.count(children) > 0
  return (
    <div
      role="listbox"
      className={cn(
        "min-h-[120px] max-h-[280px] overflow-y-auto overflow-x-hidden rounded border",
        className
      )}
      {...props}
    >
      {hasContent ? (
        children
      ) : (
        <div className="px-2 py-4 text-center text-sm text-muted-foreground">{emptyMessage}</div>
      )}
    </div>
  )
}

// ─── Filter clause editor (expanded content) ──────────────────────────────────
export const DATE_PRESET_OPTIONS = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Next 7 days",
  "Last 30 days",
  "Next 30 days",
  "This week",
  "Last week",
  "This month",
  "Last month",
] as const

export const DATE_SELECTOR_OPTIONS = [...DATE_PRESET_OPTIONS, "Custom"] as const

export interface FilterClauseEditorProps {
  /** Current selected values */
  values: string[]
  /** Search term for filtering options */
  searchValue: string
  onSearchChange: (value: string) => void
  /** Options to show (after search filter) */
  options: string[]
  /** Toggle a value on/off */
  onToggleValue: (value: string) => void
  /** Clear all selections */
  onClearAll: () => void
  /** Operator label: "is any of", "is X", etc. */
  operatorLabel: string
  /** Render as inline (inside parent) or dropdown content */
  variant?: "inline" | "dropdown"
  /** Filter UI type: "date" = presets + exact dates, "status" = chips with badges */
  filterType?: "date" | "status"
  /** Badge className per option value (for status filters) */
  optionVariantMap?: Record<string, string>
  /** Replace all values at once (for date preset/custom selection) */
  onReplaceValues?: (values: string[]) => void
}

export function FilterClauseEditor({
  values,
  searchValue,
  onSearchChange,
  options,
  onToggleValue,
  onClearAll,
  operatorLabel,
  variant = "inline",
  filterType,
  optionVariantMap = {},
  onReplaceValues,
}: FilterClauseEditorProps) {
  const isDate = filterType === "date"
  const isStatus = filterType === "status"

  const allOptions = isDate
    ? [...DATE_PRESET_OPTIONS, ...options.filter((o) => !DATE_PRESET_OPTIONS.includes(o as any))]
    : options

  const filteredOptions = allOptions.filter(
    (o) => !searchValue || o.toLowerCase().includes(searchValue.toLowerCase())
  )

  const renderOption = (option: string) => {
    if (isStatus && optionVariantMap[option]) {
      return (
        <div
          key={option}
          className="flex items-center gap-3 px-2 py-2 hover:bg-accent cursor-pointer"
          onClick={() => onToggleValue(option)}
          role="option"
          aria-selected={values.includes(option)}
        >
          <Checkbox
            checked={values.includes(option)}
            onCheckedChange={() => onToggleValue(option)}
            onClick={(e) => e.stopPropagation()}
          />
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border", optionVariantMap[option])}>
            {option}
          </span>
        </div>
      )
    }
    return (
      <div
        key={option}
        className="flex items-center gap-3 px-2 py-2 hover:bg-accent cursor-pointer"
        onClick={() => onToggleValue(option)}
        role="option"
        aria-selected={values.includes(option)}
      >
        <Checkbox
          checked={values.includes(option)}
          onCheckedChange={() => onToggleValue(option)}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-sm flex-1 select-none">{option}</span>
      </div>
    )
  }

  const dateSelectorValue = React.useMemo(() => {
    if (values.length === 0) return ""
    const v = values[0]
    if ((DATE_PRESET_OPTIONS as readonly string[]).includes(v)) return v
    return "Custom"
  }, [values])

  const customDateValue = React.useMemo(() => {
    if (values.length === 0) return undefined
    const v = values[0]
    if ((DATE_PRESET_OPTIONS as readonly string[]).includes(v) || v === "Custom") return undefined
    try {
      const parts = v.split("/")
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1
        const day = parseInt(parts[1], 10)
        const year = parseInt(parts[2], 10)
        const d = new Date(year, month, day)
        return isNaN(d.getTime()) ? undefined : d
      }
    } catch {
      /* ignore */
    }
    return undefined
  }, [values])

  const showDateCalendar = isDate && (dateSelectorValue === "Custom" || customDateValue !== undefined)

  const dateContent = isDate ? (
    <div className="flex flex-col gap-3">
      <Select
        value={dateSelectorValue}
        onValueChange={(v) => {
          if (!onReplaceValues) return
          if (v === "Custom") {
            onReplaceValues(["Custom"])
          } else if (v) {
            onReplaceValues([v])
          } else {
            onClearAll()
          }
        }}
      >
        <SelectTrigger className="h-8 w-full" size="sm">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          {DATE_SELECTOR_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showDateCalendar && (
        <div className="rounded-md border p-2 w-full">
          <Calendar
            mode="single"
            selected={customDateValue ?? undefined}
            onSelect={(date) => {
              if (date && onReplaceValues) onReplaceValues([formatDate(date)])
            }}
            className="rounded-md w-full"
          />
        </div>
      )}
    </div>
  ) : null

  const content = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 justify-start text-muted-foreground font-normal px-2 w-full">
              <span className="truncate">{operatorLabel}</span>
              <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={4}>
            <DropdownMenuItem onClick={onClearAll}>Clear selection</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {values.map((val) => (
              <span
                key={val}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm",
                  isStatus && optionVariantMap[val] ? cn("border", optionVariantMap[val]) : "bg-muted"
                )}
              >
                {val}
                <button
                  type="button"
                  onClick={() => onToggleValue(val)}
                  className="p-0.5 rounded hover:bg-muted-foreground/20"
                  aria-label={`Remove ${val}`}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      {isDate ? (
        dateContent
      ) : (
        <>
          <OutlineSearchInput
            placeholder="Search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 text-sm"
          />
          <ScrollableOptionList>
            {filteredOptions.map(renderOption)}
          </ScrollableOptionList>
        </>
      )}
    </div>
  )

  if (variant === "dropdown") {
    return (
      <DropdownMenuContent className="w-64" side="bottom" align="start" sideOffset={4} avoidCollisions collisionPadding={8}>
        {content}
      </DropdownMenuContent>
    )
  }

  return <div className="space-y-2">{content}</div>
}

// ─── Filter clause connector (And/Or between clauses) ────────────────────────
export interface FilterClauseConnectorProps {
  operator: "and" | "or"
  onOperatorChange: (op: "and" | "or") => void
  /** Use modal={false} when inside Sheet/Dialog */
  modal?: boolean
}

export function FilterClauseConnector({ operator, onOperatorChange, modal = false }: FilterClauseConnectorProps) {
  return (
    <div className="flex items-center gap-2 py-3">
      <Separator className="flex-1" />
      <DropdownMenu modal={modal}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground shrink-0">
            {operator === "and" ? "And" : "Or"}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => onOperatorChange("and")}>And</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOperatorChange("or")}>Or</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator className="flex-1" />
    </div>
  )
}

// ─── Filter clause row (expandable row with label + condition) ─────────────────
export interface FilterClauseProps {
  label: string
  conditionText: string
  isExpanded: boolean
  onToggleExpand: () => void
  onRemove: () => void
  /** Render the expanded content */
  expandedContent: React.ReactNode
  /** Render the "more actions" dropdown content (e.g. FilterClauseEditor as dropdown) */
  moreActionsContent?: React.ReactNode
  /** Controlled open state for more actions dropdown */
  moreActionsOpen?: boolean
  onMoreActionsOpenChange?: (open: boolean) => void
}

export function FilterClause({
  label,
  conditionText,
  isExpanded,
  onToggleExpand,
  onRemove,
  expandedContent,
  moreActionsContent,
  moreActionsOpen,
  onMoreActionsOpenChange,
}: FilterClauseProps) {
  return (
    <div>
      <div className="flex items-start gap-2 py-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="shrink-0 mt-0.5 p-0.5 rounded hover:bg-muted/50"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">{label}</span>
            <div className="flex items-center gap-1">
              {moreActionsContent && (
                <DropdownMenu modal={false} open={moreActionsOpen} onOpenChange={onMoreActionsOpenChange}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" aria-label="More actions">
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>More actions</TooltipContent>
                  </Tooltip>
                  {moreActionsContent}
                </DropdownMenu>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" onClick={onRemove} aria-label="Remove clause">
                    <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove clause</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{conditionText}</div>
        </div>
      </div>
      {isExpanded && (
        <ScrollableContainer
          className="pl-6 pr-2 py-2"
          maxHeight={FILTER_LAYOUT.expandedContentMaxHeight}
        >
          {expandedContent}
        </ScrollableContainer>
      )}
    </div>
  )
}
