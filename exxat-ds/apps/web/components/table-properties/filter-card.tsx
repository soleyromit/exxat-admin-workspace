"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tip } from "@/components/ui/tip"
import { FilterDateCalendar } from "@/components/data-table/filter-date-calendar"
import {
  type ActiveFilter,
  type ConditionalRule,
  type FilterFieldDef,
  type FilterOperator,
  OPERATOR_LABELS,
  RULE_COLORS,
} from "./types"

type DrawerFilterCardBaseProps = {
  fieldDef: FilterFieldDef
  expanded: boolean
  onToggleExpand: () => void
  onRemove: (id: string) => void
  renderOptionLabel?: (value: string) => React.ReactNode
}

export type DrawerFilterCardProps =
  | (DrawerFilterCardBaseProps & {
      variant?: "filter"
      filter: ActiveFilter
      onUpdate: (id: string, patch: Partial<ActiveFilter>) => void
    })
  | (DrawerFilterCardBaseProps & {
      variant: "conditional"
      filter: ConditionalRule
      onUpdate: (id: string, patch: Partial<ConditionalRule>) => void
    })

/** Inline filter card used inside the Table Properties drawer (filter or conditional rule). */
export function DrawerFilterCard(props: DrawerFilterCardProps) {
  const {
    fieldDef,
    expanded,
    onToggleExpand,
    onRemove,
    renderOptionLabel,
  } = props

  const isCond = props.variant === "conditional"
  const filter = props.filter
  const filterId = filter.id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onUpdate = props.onUpdate as (id: string, patch: any) => void

  const [optSearch, setOptSearch] = React.useState("")
  const options = fieldDef.options ?? []
  const showSearch = options.length > 8
  const filteredOpts = optSearch
    ? options.filter(o => o.label.toLowerCase().includes(optSearch.toLowerCase()))
    : options

  const values = filter.values

  React.useEffect(() => {
    if (fieldDef.type !== "select" && fieldDef.type !== "date") return
    if (filter.operator !== "is" && filter.operator !== "is_not") {
      onUpdate(filterId, { operator: "is" })
    }
  }, [filter.operator, filter.id, fieldDef.type, filterId, onUpdate])

  function toggleValue(val: string) {
    const next = values.includes(val) ? values.filter(v => v !== val) : [...values, val]
    onUpdate(filterId, { values: next })
  }

  function cycleOperator() {
    const ops = fieldDef.operators
    const idx = ops.indexOf(filter.operator as FilterOperator)
    const i = idx === -1 ? 0 : idx
    onUpdate(filterId, { operator: ops[(i + 1) % ops.length] })
  }

  const removeLabel = isCond ? "rule" : "filter"
  const rule = isCond ? (props.filter as ConditionalRule) : null

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div>
      {/* Card header */}
      <div className="flex items-start justify-between px-3 pt-2.5 pb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{fieldDef.label}</p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label={`Operator: ${OPERATOR_LABELS[filter.operator as FilterOperator]} — click to cycle`}
            onClick={cycleOperator}
            className="h-auto py-0 px-1 -ms-1 text-xs text-muted-foreground font-normal"
          >
            {OPERATOR_LABELS[filter.operator as FilterOperator]}
            <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 self-start">
          <Tip label={`Remove ${fieldDef.label} ${removeLabel}`} side="top">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${fieldDef.label} ${removeLabel}`}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(filterId)}
            >
              <i className="fa-light fa-trash text-xs" aria-hidden="true" />
            </Button>
          </Tip>
          <Tip label={expanded ? `Collapse ${fieldDef.label}` : `Expand ${fieldDef.label}`} side="top">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={expanded ? `Collapse ${fieldDef.label}` : `Expand ${fieldDef.label}`}
              onClick={onToggleExpand}
            >
              <i className={`fa-light ${expanded ? "fa-chevron-up" : "fa-chevron-down"} text-xs`} aria-hidden="true" />
            </Button>
          </Tip>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border">
          {fieldDef.type === "select" ? (
            <>
              {showSearch && (
                <div className="px-3 pt-2 pb-1">
                  <Input placeholder="Search…" value={optSearch} onChange={e => setOptSearch(e.target.value)} className="h-7 text-xs" />
                </div>
              )}
              <div role="listbox" aria-multiselectable="true" aria-label={`${fieldDef.label} options`} className="py-1 max-h-52 overflow-y-auto">
                {filteredOpts.map(opt => {
                  const checked = values.includes(opt.value)
                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={checked}
                      tabIndex={0}
                      onClick={() => toggleValue(opt.value)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleValue(opt.value) } }}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-interactive-hover cursor-pointer select-none focus-visible:outline-none focus-visible:bg-interactive-hover"
                    >
                      <span aria-hidden="true" data-slot="checkbox" data-state={checked ? "checked" : "unchecked"} className={cn(
                        "inline-flex items-center justify-center size-3.5 shrink-0 rounded-[3px] border transition-colors",
                        checked ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                      )}>
                        {checked && <i className="fa-solid fa-check text-current" style={{ fontSize: "7px" }} />}
                      </span>
                      {renderOptionLabel
                        ? renderOptionLabel(opt.value)
                        : <span className="text-foreground">{opt.label}</span>
                      }
                    </div>
                  )
                })}
                {filteredOpts.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No options found</p>
                )}
              </div>
            </>
          ) : fieldDef.type === "date" ? (
            <div className="p-2">
              <FilterDateCalendar
                label={`${fieldDef.label} — choose date`}
                valueYmd={filter.values[0]}
                onChangeYmd={(ymd) =>
                  onUpdate(filterId, { values: ymd ? [ymd] : [] })
                }
              />
            </div>
          ) : fieldDef.type === "text" ? (
            <div className="p-3">
              <Input
                aria-label={`${fieldDef.label} value`}
                placeholder={`Enter ${fieldDef.label.toLowerCase()}…`}
                value={values[0] ?? ""}
                onChange={e => onUpdate(filterId, { values: [e.target.value] })}
                className="text-sm"
                autoFocus
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Highlight color — conditional rules only */}
      {isCond && rule && (
        <div className="border-t border-border px-3 py-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Highlight color
          </p>
          <div className="flex flex-wrap gap-1.5">
            {RULE_COLORS.map(c => (
              <Button
                key={c.name}
                type="button"
                size="icon-xs"
                variant="outline"
                aria-label={c.name}
                className={cn(
                  "rounded-md border-2 p-0 transition-all",
                  rule.bgColor === c.bg ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                )}
                style={{ background: c.bg }}
                onClick={() => onUpdate(filterId, { bgColor: c.bg })}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
