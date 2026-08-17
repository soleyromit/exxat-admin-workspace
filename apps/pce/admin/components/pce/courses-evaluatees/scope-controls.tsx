'use client'

// Shared scope-band + table furniture for the push wizard's course steps —
// extracted verbatim from step-courses-evaluatees.tsx (Jul 2026 two-step
// split) so the Courses & students step, the Survey design step, and the
// merged step (still used by the term-setup wizard) stay one source.

import { useMemo, useState } from 'react'
import {
  Badge, Button, InputGroup, Tip,
  Popover, PopoverTrigger, PopoverContent, PopoverAnchor,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from '@exxatdesignux/ui'
import type { DeliveryMode } from '@/lib/pce-mock-data'

/** Above this count a picker gains a search field. */
export const COHORT_SEARCH_THRESHOLD = 8

export const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export interface TokenOption {
  value: string
  label: string
  /** Optional heading this option sits under in the dropdown. */
  group?: string
}

interface TokenSelectProps {
  /** id of the field's visible label — names both the field and the popup. */
  labelId: string
  /** Resting text when nothing is chosen (e.g. "All cohorts"). */
  placeholder: string
  options: TokenOption[]
  selected: string[]
  onToggle: (value: string) => void
  onClear?: () => void
  groupOrder?: readonly string[]
  /** Above this many options the dropdown gains a search field. */
  searchThreshold?: number
  /** Block removing the last chip (required fields). */
  minOne?: boolean
  contentLabel: string
}

/** One width for every control in the scope band — Term, Academic Year,
 *  Cohort — so the row reads as a set, not a ragged line. */
export const SCOPE_FIELD_WIDTH = 224

/** Type-column pill tints — chart-hue wash + matching --chip ink (the DS
 *  icon-disc pairing). srgb mix (the oklch form is banned in product code);
 *  chart-4 amber is excluded — it belongs to the warning vocabulary. */
export const TYPE_PILL_TINT: Record<DeliveryMode, { bg: string; fg: string }> = {
  classroom: { bg: 'color-mix(in srgb, var(--chart-1) 12%, transparent)', fg: 'var(--chip-1)' },
  lab:       { bg: 'var(--icon-disc-chart-2-bg)',                          fg: 'var(--chip-2)' },
  practice:  { bg: 'color-mix(in srgb, var(--chart-5) 12%, transparent)', fg: 'var(--chip-5)' },
}

/** Tinted categorical type pill (D5, Romit Jul 21) — short label, chip ink. */
export function TypePill({ deliveryMode, label }: { deliveryMode: DeliveryMode; label: string }) {
  const tint = TYPE_PILL_TINT[deliveryMode]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ background: tint.bg, color: tint.fg }}
    >
      {label.replace(/ based$/, '')}
    </span>
  )
}

/** Px estimate of one chip: badge chrome (padding, border, gap, ×-button ≈32)
 *  + ~6.5px per character at text-xs, capped at the chip's 150px maxWidth. */
const estChipWidth = (label: string) => Math.min(32 + label.length * 6.5, 150)
/** Shell padding + the chevron trigger's minimum are spoken for. */
const CHIP_BUDGET = SCOPE_FIELD_WIDTH - 46
const OVERFLOW_BADGE_WIDTH = 38

/**
 * One control for both scope fields: chosen values are chips INSIDE the field,
 * the full option list lives in a searchable, grouped popup.
 *
 * Cohort and What-to-evaluate are different jobs, but they are the same *job
 * shape* — pick several from many — so they get the same control; the label and
 * the required marker carry the difference. Convergent across Gusto, Juicebox,
 * Contra, Udemy and Upwork.
 *
 * Chips and the popup trigger are SIBLINGS inside the shell, never nested: the
 * chip's remove button inside a trigger button would trip nested-interactive.
 */
export function TokenSelect({
  labelId, placeholder, options, selected, onToggle, onClear,
  groupOrder, searchThreshold = 8, minOne = false, contentLabel,
}: TokenSelectProps) {
  const [open, setOpen] = useState(false)
  const byValue = useMemo(() => new Map(options.map(o => [o.value, o])), [options])
  const groups = useMemo(() => {
    if (!groupOrder?.length) return [{ heading: undefined as string | undefined, items: options }]
    return groupOrder
      .map(g => ({ heading: g as string | undefined, items: options.filter(o => o.group === g) }))
      .filter(g => g.items.length > 0)
  }, [options, groupOrder])

  // Fill the fixed shell with as many chips as fit, then tuck the rest into
  // "+N" — a lone chip beside "+N" with dead space after it reads broken.
  // Estimated, not measured: chips shrink+truncate, so a near-miss degrades
  // into slight truncation rather than overflow.
  const shown = useMemo(() => {
    const labels = selected.map(v => byValue.get(v)?.label ?? v)
    const widthOf = (n: number) =>
      labels.slice(0, n).reduce((sum, l) => sum + estChipWidth(l), 0) + Math.max(0, n - 1) * 4
    if (widthOf(selected.length) <= CHIP_BUDGET) return selected
    let n = 1
    while (n < selected.length && widthOf(n + 1) + 4 + OVERFLOW_BADGE_WIDTH <= CHIP_BUDGET) n++
    return selected.slice(0, n)
  }, [selected, byValue])
  const overflow = selected.length - shown.length
  // The last chip of a required field must stay put; the field's helper line
  // explains why rather than a title tooltip that never fires on keyboard.
  const atMin = minOne && selected.length === 1

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor>
        <InputGroup
          className="flex flex-nowrap items-center gap-1 py-1 ps-1.5 pe-1 overflow-hidden"
          style={{ width: SCOPE_FIELD_WIDTH }}
        >
          {shown.map(v => {
            const o = byValue.get(v)
            if (!o) return null
            return (
              /* outline, not secondary: every filled neutral in this theme is
                 brand-tinted (--secondary oklch .012 @345, --muted .008 @345),
                 so a filled chip is always pink. outline = white + --border
                 (chroma .002) = actually neutral, and it's a real DS variant
                 rather than a className override of one. */
              <Badge key={v} variant="outline" className="gap-1 ps-2 pe-0.5 py-0.5 font-normal min-w-0 shrink" style={{ maxWidth: 150 }}>
                {/* Long values truncate rather than force the field wider — a
                    cohort can be "Class of 2027 – Group B". */}
                <span className="truncate" title={o.label}>{o.label}</span>
                <Button
                  variant="ghost"
                  size="xs"
                  className="size-4 p-0 shrink-0"
                  style={{ backgroundColor: 'transparent' }}
                  disabled={atMin}
                  aria-label={`Remove ${o.label}`}
                  onClick={() => onToggle(v)}
                >
                  <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                </Button>
              </Badge>
            )
          })}
          {overflow > 0 && (
            <Badge variant="outline" className="font-normal shrink-0">
              +{overflow}<span className="sr-only"> more selected</span>
            </Badge>
          )}
          {/* The chevron lives INSIDE the trigger — the one affordance that
              reads as "open me" must be clickable.
              justify-end when chips are shown: the visible label is sr-only
              (out of flex flow), so justify-between would leave the chevron —
              the only in-flow child — stranded at the start of the field. */}
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-labelledby={labelId}
              className={`flex-1 gap-1 px-1 font-normal ${selected.length === 0 ? 'justify-between' : 'justify-end'}`}
              style={{ minWidth: selected.length === 0 ? 64 : 32, backgroundColor: 'transparent' }}
            >
              {selected.length === 0
                ? <span style={{ color: 'var(--muted-foreground)' }}>{placeholder}</span>
                : <span className="sr-only">Change selection</span>}
              <i
                className="fa-light fa-chevron-down text-xs shrink-0"
                aria-hidden="true"
                style={{ color: 'var(--muted-foreground)' }}
              />
            </Button>
          </PopoverTrigger>
        </InputGroup>
      </PopoverAnchor>

      {/* Hugs its content instead of a fixed width: "Course / Instructor" needs
          far less room than a cohort name, and a half-empty menu reads broken.
          Bounded so a long role still wraps sanely. */}
      <PopoverContent
        align="start"
        className="p-0 w-auto min-w-44 max-w-80"
        aria-label={contentLabel}
      >
        <Command>
          {options.length > searchThreshold && <CommandInput placeholder="Search" />}
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            {groups.map(({ heading, items }) => (
              <CommandGroup key={heading ?? '_'} heading={heading}>
                {items.map(o => {
                  const checked = selected.includes(o.value)
                  return (
                    /* Check glyph, not a DS Checkbox — Checkbox is a button and
                       would nest inside role="option". cmdk owns aria-selected
                       for its highlight, so state rides in the accessible name. */
                    <CommandItem key={o.value} value={o.label} onSelect={() => onToggle(o.value)}>
                      <i
                        className={`fa-solid fa-check text-xs ${checked ? '' : 'opacity-0'}`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{o.label}</span>
                      {checked && <span className="sr-only">, selected</span>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
          {onClear && selected.length > 0 && (
            <>
              <CommandSeparator />
              <div className="p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal"
                  onClick={onClear}
                >
                  Clear
                </Button>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Fix action — opens Prism in a new tab.
 *
 * The label stays generic ("Add faculty") because a course can be missing
 * several roles at once and naming one of them lies. `roles` names them on
 * hover/focus instead, so the CTA still tells you WHAT to add. DS Tip rather
 * than a native title: title never fires on keyboard focus.
 *
 * `ghost` lightens the chrome to a text-link weight for inline placements
 * (Step 2's gap issue line) where a bordered button box is too heavy; the
 * default stays outline for the existing column/section call sites.
 */
export function AddInPrismButton({ href, label, roles, ghost = false }: {
  href: string
  label: string
  roles?: string[]
  ghost?: boolean
}) {
  const missing = roles?.length ? `Missing: ${roles.join(', ')}` : null
  const trigger = (
    /* Neutral DS chrome: the amber FACT line beside the button carries the
       attention; the button is the remedy, not the alarm. */
    <Button
      asChild
      variant={ghost ? 'ghost' : 'outline'}
      size="xs"
      className={ghost ? 'justify-start text-muted-foreground hover:text-foreground' : 'justify-start'}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
        {label}
        {missing && <span className="sr-only"> · {missing}</span>}
        <span className="sr-only"> (opens in new tab)</span>
        <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
      </a>
    </Button>
  )
  return (
    <Tip
      label={
        <>
          {missing ?? `${label} in Exxat Prism`}
          <span className="block opacity-70">Opens Exxat Prism in a new tab</span>
        </>
      }
      side="left"
    >
      {trigger}
    </Tip>
  )
}

export function EmptyHint({ heading, sub }: { heading: string; sub: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 text-center rounded-lg border border-dashed border-border"
      style={{ minHeight: 300, padding: 40 }}
    >
      <CourseTablePlaceholder />
      <div className="flex flex-col gap-1" style={{ maxWidth: 340 }}>
        <p className="text-sm font-medium">{heading}</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>
      </div>
    </div>
  )
}

/** Tokenised mini course-table mockup — gives the empty course area a visual identity. */
function CourseTablePlaceholder() {
  const line = (w: string, muted = false) => (
    <div style={{ height: 6, width: w, borderRadius: 2, background: muted ? 'var(--border)' : 'var(--border-control-35)' }} />
  )
  return (
    <div
      aria-hidden="true"
      className="rounded-md border border-border overflow-hidden"
      style={{ width: 220, background: 'var(--card)' }}
    >
      <div className="flex items-center gap-3" style={{ height: 26, padding: '0 12px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
        {line('34%')}{line('22%')}{line('22%')}
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="flex items-center gap-3" style={{ padding: '11px 12px', borderBottom: i < 2 ? '1px solid var(--border)' : undefined }}>
          {line('40%', true)}{line('26%', true)}
          <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: i === 2 ? 'var(--border)' : 'var(--chart-2)', opacity: i === 2 ? 1 : 0.7 }} />
        </div>
      ))}
    </div>
  )
}
