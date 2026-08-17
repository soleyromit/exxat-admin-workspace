'use client'

// COMPARE ROUTE (throwaway — same lifecycle as /compare/push-step2-* siblings,
// delete once a direction is picked).
//
// 2026-08-11 — Romit asked to "improve this ui" on the just-shipped
// "Customize per course" list (step-communication.tsx, Survey window card —
// see docs/specs/2026-08-11-step-2-3-4-course-eval-sync-up-audit.md §3.3/§4.2
// and the 2026-06-30 course-level-dates decision it implements). The shipped
// version: a Collapsible disclosure, "Uses survey window" muted text + a
// "Set dates" outline button per row, editing reveals two inline
// DatePickerFields + a "Reset" ghost button. It works, but leans entirely on
// TEXT to distinguish default-vs-overridden rows in what's often a 13+ row
// list — nothing to scan for at a glance.
//
// Seven structurally different answers, each grounded in a real analogy
// (Mobbin, Aug 11 — first pass A–D, second pass E–G after Romit asked for
// more):
//
//   A  CHECKBOX ROW    — a leading Checkbox replaces the "Set dates" button;
//                        checked/unchecked is scannable in the left margin
//                        without reading any row text. Analogy: Navan's
//                        "Set different restrictions for hotel check-in/out
//                        dates" (checkbox-gated inline fields).
//   B  ELEVATED CARD   — default rows stay plain single-line text; an
//                        overridden row becomes its own bordered, accent-
//                        ruled mini-card that visually pops out of the flat
//                        list — no reading required to spot which courses
//                        are customized. Analogy: Airbnb's "Custom weekend
//                        price" treatment in the pricing calendar.
//   C  MODE SWITCH     — collapses two levels of hierarchy (global fields +
//                        a nested "customize per course" disclosure) into
//                        ONE choice: "Same window for every course" vs.
//                        "Different windows per course." Picking "Different"
//                        replaces the global fields with the editable list
//                        directly — no separate disclosure to find. Analogy:
//                        Deel's "Bulk edit" (one value for all vs. several
//                        values, edit individually).
//   D  ROW POPOVER     — rows never change height. "Set dates" opens a
//                        Popover anchored to the row with the two fields +
//                        Save/Cancel; the list itself stays a stable,
//                        single-line-per-course grid no matter how many rows
//                        are customized. Analogy: Cal.com / Lyssna's "Select
//                        the dates to override" modal pattern.
//   E  BULK SELECT     — every A–D variant only edits ONE course at a time;
//                        this fixes that. Checkboxes select N courses, a
//                        bulk bar appears with two date fields + "Apply to N
//                        courses" — one action overrides a whole batch (e.g.
//                        every clinical-practicum course) at once. Analogy:
//                        Pipedrive's "Bulk edit N leads" side panel.
//   F  TIMELINE BAR    — abandons the list entirely for a shared calendar
//                        strip; each course renders as a horizontal bar
//                        positioned by its actual dates, default-window
//                        courses in one muted color, overridden courses in
//                        brand color at their own position — click a bar to
//                        edit. Answers "which courses run outside the norm"
//                        visually instead of by reading text. Analogy:
//                        Asana/Basecamp timeline views.
//   G  SEGMENTED FILTER — reuses this exact codebase's own established idiom
//                        (step-survey-instances.tsx's All/Needs
//                        attention/Blocked ToggleGroup) instead of importing
//                        a new one: "All (14) / Customized (2)" narrows the
//                        list once several courses are overridden, so a long
//                        term doesn't force scrolling past 12 unchanged rows
//                        to review the 2 that matter.
//
// All seven pull the SAME real fixture (MOCK_COURSE_OFFERINGS scoped to Fall
// 2026 · pt5, the exact term the real push wizard defaults to — 14
// offerings) and the same real global window (Dec 4–18, 2026) the shipped
// step ships with. Each variant is fully self-contained — no shared state.

import { useState } from 'react'
import {
  Button, Card, CardContent, Checkbox, DatePickerField, DateRangePickerField, Input,
  Popover, PopoverTrigger, PopoverContent,
  RadioGroup, RadioGroupItem, Label,
  ToggleGroup, ToggleGroupItem,
} from '@exxatdesignux/ui'
import { MOCK_COURSE_OFFERINGS, type CourseOffering } from '@/lib/pce-mock-data'
import { courseLabelOf } from '@/lib/pce-course-readiness'

const OFFERINGS = MOCK_COURSE_OFFERINGS.filter(o => o.termId === 'pt5' && o.status !== 'archived')
const GLOBAL_OPEN = new Date(2026, 11, 4)
const GLOBAL_CLOSE = new Date(2026, 11, 18)

function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

interface Override {
  openDate?: Date
  closeDate?: Date
}

const fmt = (d: Date | undefined) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

// ── A · Checkbox row ─────────────────────────────────────────────────────────
function VariantCheckboxRow() {
  const [overrides, setOverrides] = useState<Record<string, Override>>({ co13: { openDate: new Date(2026, 11, 1), closeDate: new Date(2026, 11, 15) } })
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 300 }}>
        {OFFERINGS.map(o => {
          const { code, name } = splitLabel(o)
          const ov = overrides[o.id]
          const checked = !!ov
          return (
            <div key={o.id} className="flex items-center gap-3 px-3 py-2 border-b border-border/60 last:border-b-0" style={{ background: checked ? 'var(--muted)' : undefined }}>
              <Checkbox
                checked={checked}
                onCheckedChange={v => {
                  setOverrides(p => {
                    if (!v) { const { [o.id]: _rm, ...rest } = p; return rest }
                    return { ...p, [o.id]: { openDate: GLOBAL_OPEN, closeDate: GLOBAL_CLOSE } }
                  })
                }}
                aria-label={`Customize window for ${code}`}
              />
              <span className="text-sm min-w-0 truncate flex-1">
                <span className="font-medium">{code}</span>
                <span className="text-muted-foreground"> · {name}</span>
              </span>
              {checked ? (
                <span className="flex items-center gap-2 shrink-0">
                  <span style={{ width: 128 }}>
                    <DatePickerField value={ov.openDate} onChange={d => setOverrides(p => ({ ...p, [o.id]: { ...ov, openDate: d } }))} triggerClassName="h-8 text-sm" />
                  </span>
                  <span className="text-xs text-muted-foreground">–</span>
                  <span style={{ width: 128 }}>
                    <DatePickerField value={ov.closeDate} onChange={d => setOverrides(p => ({ ...p, [o.id]: { ...ov, closeDate: d } }))} triggerClassName="h-8 text-sm" />
                  </span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground shrink-0">Uses survey window</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── B · Elevated card override ───────────────────────────────────────────────
function VariantElevatedCard() {
  const [overrides, setOverrides] = useState<Record<string, Override>>({ co13: { openDate: new Date(2026, 11, 1), closeDate: new Date(2026, 11, 15) } })
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 320 }}>
      {OFFERINGS.map(o => {
        const { code, name } = splitLabel(o)
        const ov = overrides[o.id]
        if (!ov) {
          return (
            <div key={o.id} className="flex items-center gap-3 px-1 py-1.5">
              <span className="text-sm min-w-0 truncate flex-1">
                <span className="font-medium">{code}</span>
                <span className="text-muted-foreground"> · {name}</span>
              </span>
              <span className="text-xs text-muted-foreground shrink-0">Uses survey window</span>
              <Button
                variant="ghost" size="xs" className="shrink-0"
                onClick={() => setOverrides(p => ({ ...p, [o.id]: { openDate: GLOBAL_OPEN, closeDate: GLOBAL_CLOSE } }))}
              >
                Customize
              </Button>
            </div>
          )
        }
        return (
          <div
            key={o.id}
            className="flex items-center gap-3 rounded-md border-s-2 px-2.5 py-2"
            style={{ borderColor: 'var(--chip-4)', background: 'var(--card)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <span className="text-sm min-w-0 truncate flex-1">
              <span className="font-medium">{code}</span>
              <span className="text-muted-foreground"> · {name}</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span style={{ width: 124 }}>
                <DatePickerField value={ov.openDate} onChange={d => setOverrides(p => ({ ...p, [o.id]: { ...ov, openDate: d } }))} triggerClassName="h-8 text-sm" />
              </span>
              <span className="text-xs text-muted-foreground">–</span>
              <span style={{ width: 124 }}>
                <DatePickerField value={ov.closeDate} onChange={d => setOverrides(p => ({ ...p, [o.id]: { ...ov, closeDate: d } }))} triggerClassName="h-8 text-sm" />
              </span>
              <Button
                variant="ghost" size="xs"
                onClick={() => setOverrides(p => { const { [o.id]: _rm, ...rest } = p; return rest })}
              >
                Remove
              </Button>
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── C · Mode switch ───────────────────────────────────────────────────────────
function VariantModeSwitch() {
  const [mode, setMode] = useState<'same' | 'different'>('same')
  const [globalOpen, setGlobalOpen] = useState<Date | undefined>(GLOBAL_OPEN)
  const [globalClose, setGlobalClose] = useState<Date | undefined>(GLOBAL_CLOSE)
  const [perCourse, setPerCourse] = useState<Record<string, Override>>(() =>
    Object.fromEntries(OFFERINGS.map(o => [o.id, { openDate: GLOBAL_OPEN, closeDate: GLOBAL_CLOSE }]))
  )
  return (
    <div className="flex flex-col gap-3">
      <RadioGroup value={mode} onValueChange={v => setMode(v as 'same' | 'different')} className="flex flex-col gap-2">
        <label className="flex items-start gap-2.5 rounded-md border border-border p-2.5 cursor-pointer" style={{ background: mode === 'same' ? 'var(--muted)' : undefined }}>
          <RadioGroupItem value="same" className="mt-0.5" />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Same window for every course</span>
            <span className="text-xs text-muted-foreground">One open/close date applies to all {OFFERINGS.length} courses.</span>
          </span>
        </label>
        <label className="flex items-start gap-2.5 rounded-md border border-border p-2.5 cursor-pointer" style={{ background: mode === 'different' ? 'var(--muted)' : undefined }}>
          <RadioGroupItem value="different" className="mt-0.5" />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Different windows per course</span>
            <span className="text-xs text-muted-foreground">Set open/close independently for each course.</span>
          </span>
        </label>
      </RadioGroup>

      {mode === 'same' ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Opens on</Label>
            <DatePickerField value={globalOpen} onChange={setGlobalOpen} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Closes on</Label>
            <DatePickerField value={globalClose} onChange={setGlobalClose} />
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 300 }}>
            {OFFERINGS.map(o => {
              const { code, name } = splitLabel(o)
              const ov = perCourse[o.id]
              return (
                <div key={o.id} className="flex items-center gap-3 px-3 py-2 border-b border-border/60 last:border-b-0">
                  <span className="text-sm min-w-0 truncate flex-1">
                    <span className="font-medium">{code}</span>
                    <span className="text-muted-foreground"> · {name}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span style={{ width: 128 }}>
                      <DatePickerField value={ov?.openDate} onChange={d => setPerCourse(p => ({ ...p, [o.id]: { ...ov, openDate: d } }))} triggerClassName="h-8 text-sm" />
                    </span>
                    <span className="text-xs text-muted-foreground">–</span>
                    <span style={{ width: 128 }}>
                      <DatePickerField value={ov?.closeDate} onChange={d => setPerCourse(p => ({ ...p, [o.id]: { ...ov, closeDate: d } }))} triggerClassName="h-8 text-sm" />
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── D · Row popover ───────────────────────────────────────────────────────────
function VariantRowPopover() {
  const [overrides, setOverrides] = useState<Record<string, Override>>({ co13: { openDate: new Date(2026, 11, 1), closeDate: new Date(2026, 11, 15) } })
  const [draft, setDraft] = useState<Override>({})
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 300 }}>
        {OFFERINGS.map(o => {
          const { code, name } = splitLabel(o)
          const ov = overrides[o.id]
          return (
            <div key={o.id} className="flex items-center gap-3 px-3 py-2 border-b border-border/60 last:border-b-0" style={{ minHeight: 44 }}>
              <span className="text-sm min-w-0 truncate flex-1">
                <span className="font-medium">{code}</span>
                <span className="text-muted-foreground"> · {name}</span>
              </span>
              <span className="text-xs shrink-0" style={{ color: ov ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                {ov ? `${fmt(ov.openDate)} – ${fmt(ov.closeDate)}` : 'Uses survey window'}
              </span>
              <Popover
                open={openRowId === o.id}
                onOpenChange={open => { setOpenRowId(open ? o.id : null); if (open) setDraft(ov ?? { openDate: GLOBAL_OPEN, closeDate: GLOBAL_CLOSE }) }}
              >
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon-xs" aria-label={`Edit window for ${code}`} className="shrink-0">
                    <i className="fa-light fa-pen-to-square text-xs" aria-hidden="true" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-3 flex flex-col gap-2.5">
                  <p className="text-xs font-medium">{code} window</p>
                  <DateRangePickerField
                    value={{ from: draft.openDate, to: draft.closeDate }}
                    onChange={range => setDraft({ openDate: range?.from, closeDate: range?.to })}
                    triggerClassName="h-8 text-sm"
                    numberOfMonths={1}
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {ov ? (
                      <Button
                        variant="ghost" size="xs"
                        onClick={() => { setOverrides(p => { const { [o.id]: _rm, ...rest } = p; return rest }); setOpenRowId(null) }}
                      >
                        Clear override
                      </Button>
                    ) : <span />}
                    <Button
                      variant="default" size="xs"
                      onClick={() => { setOverrides(p => ({ ...p, [o.id]: draft })); setOpenRowId(null) }}
                    >
                      Save
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── E · Bulk select + apply ──────────────────────────────────────────────────
function VariantBulkSelect() {
  const [overrides, setOverrides] = useState<Record<string, Override>>({ co13: { openDate: new Date(2026, 11, 1), closeDate: new Date(2026, 11, 15) } })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [draftOpen, setDraftOpen] = useState<Date | undefined>(GLOBAL_OPEN)
  const [draftClose, setDraftClose] = useState<Date | undefined>(GLOBAL_CLOSE)

  const toggleSelected = (id: string, on: boolean) =>
    setSelected(p => { const n = new Set(p); if (on) n.add(id); else n.delete(id); return n })

  const applyToSelected = () => {
    setOverrides(p => {
      const next = { ...p }
      for (const id of selected) next[id] = { openDate: draftOpen, closeDate: draftClose }
      return next
    })
    setSelected(new Set())
  }

  return (
    <div className="flex flex-col">
      <div className="rounded-t-md border border-b-0 border-border overflow-hidden">
        <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 300 }}>
          {OFFERINGS.map(o => {
            const { code, name } = splitLabel(o)
            const ov = overrides[o.id]
            return (
              <div key={o.id} className="flex items-center gap-3 px-3 py-2 border-b border-border/60 last:border-b-0">
                <Checkbox
                  checked={selected.has(o.id)}
                  onCheckedChange={v => toggleSelected(o.id, !!v)}
                  aria-label={`Select ${code} for bulk window edit`}
                />
                <span className="text-sm min-w-0 truncate flex-1">
                  <span className="font-medium">{code}</span>
                  <span className="text-muted-foreground"> · {name}</span>
                </span>
                <span className="text-xs shrink-0" style={{ color: ov ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                  {ov ? `${fmt(ov.openDate)} – ${fmt(ov.closeDate)}` : 'Uses survey window'}
                </span>
                {ov && (
                  <Button
                    variant="ghost" size="xs" className="shrink-0"
                    onClick={() => setOverrides(p => { const { [o.id]: _rm, ...rest } = p; return rest })}
                  >
                    Reset
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {/* Bulk bar — same shape as the row-level controls, just applied to N at once */}
      <Card
        size="sm"
        className="flex-row items-center gap-3 rounded-t-none border-t-0 py-2.5"
        style={{ background: selected.size > 0 ? 'var(--muted)' : 'var(--card)' }}
      >
        <span className="text-sm font-medium shrink-0 tabular-nums" style={{ color: selected.size > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
          {selected.size > 0 ? `${selected.size} selected` : 'Select courses to bulk-apply a window'}
        </span>
        {selected.size > 0 && (
          <>
            <span className="flex items-center gap-2 shrink-0 ms-auto">
              <span style={{ width: 128 }}>
                <DatePickerField value={draftOpen} onChange={setDraftOpen} triggerClassName="h-8 text-sm" />
              </span>
              <span className="text-xs text-muted-foreground">–</span>
              <span style={{ width: 128 }}>
                <DatePickerField value={draftClose} onChange={setDraftClose} triggerClassName="h-8 text-sm" />
              </span>
            </span>
            <Button variant="default" size="xs" className="shrink-0" onClick={applyToSelected}>
              Apply to {selected.size} course{selected.size !== 1 ? 's' : ''}
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}

// ── F · Timeline bar ──────────────────────────────────────────────────────────
const TIMELINE_START = new Date(2026, 10, 23) // Nov 23
const TIMELINE_END = new Date(2026, 11, 25)   // Dec 25
const TIMELINE_DAYS = Math.round((TIMELINE_END.getTime() - TIMELINE_START.getTime()) / 86_400_000)
const TIMELINE_TICKS = [new Date(2026, 10, 23), new Date(2026, 10, 30), new Date(2026, 11, 7), new Date(2026, 11, 14), new Date(2026, 11, 21)]

function dayOffsetPct(d: Date): number {
  const days = (d.getTime() - TIMELINE_START.getTime()) / 86_400_000
  return Math.max(0, Math.min(100, (days / TIMELINE_DAYS) * 100))
}

function VariantTimelineBar() {
  const [overrides, setOverrides] = useState<Record<string, Override>>({ co13: { openDate: new Date(2026, 11, 1), closeDate: new Date(2026, 11, 15) } })
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Override>({})

  return (
    <div className="flex flex-col gap-1.5">
      {/* Axis */}
      <div className="flex text-xs text-muted-foreground" style={{ marginInlineStart: 168 }}>
        {TIMELINE_TICKS.map(t => (
          <span key={t.toISOString()} className="flex-1">{fmt(t)}</span>
        ))}
      </div>
      <div className="flex flex-col overflow-y-auto border-t border-border" style={{ maxHeight: 300 }}>
        {OFFERINGS.map(o => {
          const { code } = splitLabel(o)
          const ov = overrides[o.id]
          const barOpen = ov?.openDate ?? GLOBAL_OPEN
          const barClose = ov?.closeDate ?? GLOBAL_CLOSE
          const left = dayOffsetPct(barOpen)
          const width = Math.max(2, dayOffsetPct(barClose) - left)
          return (
            <div key={o.id} className="flex items-center gap-2 border-b border-border/60 last:border-b-0" style={{ minHeight: 34 }}>
              <span className="text-xs font-medium truncate shrink-0" style={{ width: 160 }}>{code}</span>
              <div className="relative flex-1" style={{ height: 22 }}>
                <Popover
                  open={openRowId === o.id}
                  onOpenChange={open => { setOpenRowId(open ? o.id : null); if (open) setDraft(ov ?? { openDate: GLOBAL_OPEN, closeDate: GLOBAL_CLOSE }) }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute h-auto min-h-0 rounded-full p-0 text-start"
                      style={{
                        left: `${left}%`, width: `${width}%`, top: 3, height: 16,
                        background: ov ? 'var(--brand-color)' : 'var(--border-control-35)',
                      }}
                      aria-label={`${code} window: ${fmt(barOpen)} – ${fmt(barClose)}${ov ? ' (customized)' : ''}`}
                    />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-3 flex flex-col gap-2.5">
                    <p className="text-xs font-medium">{code} window</p>
                    <DateRangePickerField
                      value={{ from: draft.openDate, to: draft.closeDate }}
                      onChange={range => setDraft({ openDate: range?.from, closeDate: range?.to })}
                      triggerClassName="h-8 text-sm"
                      numberOfMonths={1}
                    />
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {ov ? (
                        <Button variant="ghost" size="xs" onClick={() => { setOverrides(p => { const { [o.id]: _rm, ...rest } = p; return rest }); setOpenRowId(null) }}>
                          Clear override
                        </Button>
                      ) : <span />}
                      <Button variant="default" size="xs" onClick={() => { setOverrides(p => ({ ...p, [o.id]: draft })); setOpenRowId(null) }}>
                        Save
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="inline-block rounded-full me-1.5" style={{ width: 8, height: 8, background: 'var(--border-control-35)' }} aria-hidden="true" />
        Uses survey window
        <span className="inline-block rounded-full ms-3 me-1.5" style={{ width: 8, height: 8, background: 'var(--brand-color)' }} aria-hidden="true" />
        Customized
      </p>
    </div>
  )
}

// ── G · Segmented filter ──────────────────────────────────────────────────────
function VariantSegmentedFilter() {
  const [overrides, setOverrides] = useState<Record<string, Override>>({
    co13: { openDate: new Date(2026, 11, 1), closeDate: new Date(2026, 11, 15) },
    co17: { openDate: new Date(2026, 11, 8), closeDate: new Date(2026, 11, 22) },
  })
  const [filter, setFilter] = useState<'all' | 'customized'>('all')
  const customizedCount = OFFERINGS.filter(o => overrides[o.id]).length
  const visible = filter === 'customized' ? OFFERINGS.filter(o => overrides[o.id]) : OFFERINGS

  return (
    <div className="flex flex-col gap-2.5">
      <ToggleGroup type="single" variant="outline" size="sm" value={filter} onValueChange={v => v && setFilter(v as 'all' | 'customized')} aria-label="Filter courses">
        <ToggleGroupItem value="all">All ({OFFERINGS.length})</ToggleGroupItem>
        <ToggleGroupItem value="customized" disabled={customizedCount === 0}>Customized ({customizedCount})</ToggleGroupItem>
      </ToggleGroup>
      <div className="rounded-md border border-border overflow-hidden">
        <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 300 }}>
          {visible.map(o => {
            const { code, name } = splitLabel(o)
            const ov = overrides[o.id]
            return (
              <div key={o.id} className="flex items-center gap-3 px-3 py-2 border-b border-border/60 last:border-b-0">
                <span className="text-sm min-w-0 truncate flex-1">
                  <span className="font-medium">{code}</span>
                  <span className="text-muted-foreground"> · {name}</span>
                </span>
                {ov ? (
                  <span className="flex items-center gap-2 shrink-0">
                    <span style={{ width: 128 }}>
                      <DatePickerField value={ov.openDate} onChange={d => setOverrides(p => ({ ...p, [o.id]: { ...ov, openDate: d } }))} triggerClassName="h-8 text-sm" />
                    </span>
                    <span className="text-xs text-muted-foreground">–</span>
                    <span style={{ width: 128 }}>
                      <DatePickerField value={ov.closeDate} onChange={d => setOverrides(p => ({ ...p, [o.id]: { ...ov, closeDate: d } }))} triggerClassName="h-8 text-sm" />
                    </span>
                    <Button variant="ghost" size="xs" onClick={() => setOverrides(p => { const { [o.id]: _rm, ...rest } = p; return rest })}>Reset</Button>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">Uses survey window</span>
                    <Button variant="outline" size="xs" onClick={() => setOverrides(p => ({ ...p, [o.id]: { openDate: GLOBAL_OPEN, closeDate: GLOBAL_CLOSE } }))}>Set dates</Button>
                  </span>
                )}
              </div>
            )
          })}
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-4">No customized courses yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── H · Quiet default, marked exception (revised, post-feedback) ────────────
// 2026-08-11 — Romit's direct critique of D (the recommended variant): "Uses
// survey window" repeated on every unmodified row is noise (11+ identical
// lines in a 14-row list), and finding which rows differ is hard because
// nothing distinguishes an overridden row from a default one except reading
// the text. This variant keeps D's real strengths (stable row height, resolved
// dates visible at rest, Popover editing — no new interaction vocabulary) and
// fixes both complaints directly:
//   · Default rows go SILENT — course code + name, nothing else but a small
//     muted icon-only "+" (always visible, not hover-only — hover-only
//     affordances fail touch and keyboard discovery). Absence of state text
//     communicates "default" on its own; nothing needs to say so 11 times.
//   · Overridden rows get a small brand-colored dot + a subtle row tint
//     (background only, no border/elevation) + the resolved dates in
//     full-weight foreground text instead of muted-foreground — scans as
//     different by SHAPE AND WEIGHT, not just by reading content. The dot
//     borrows the exact vocabulary already established in this codebase for
//     "this is the marked one" (/compare/push-step2-template-picker-segmented's
//     committed-template dot) — deliberately NOT B's bordered/elevated card,
//     since that shape already means "Advisory" in step 2's roster.
//   · A "Find a course" filter input answers the other half of the feedback
//     (searching a long list) without needing G's segmented control — typing
//     narrows by course code/name, same DS Input the rest of the app uses
//     for search.
function VariantQuietException() {
  const [overrides, setOverrides] = useState<Record<string, Override>>({
    co13: { openDate: new Date(2026, 11, 1), closeDate: new Date(2026, 11, 15) },
    co17: { openDate: new Date(2026, 11, 8), closeDate: new Date(2026, 11, 22) },
  })
  const [query, setQuery] = useState('')
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Override>({})

  const overriddenCount = OFFERINGS.filter(o => overrides[o.id]).length
  const visible = OFFERINGS.filter(o => {
    if (!query.trim()) return true
    const { code, name } = splitLabel(o)
    return `${code} ${name}`.toLowerCase().includes(query.trim().toLowerCase())
  })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1" style={{ maxWidth: 220 }}>
          <i
            className="fa-light fa-magnifying-glass absolute text-xs text-muted-foreground"
            style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }}
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Find a course"
            className="h-8 text-sm"
            style={{ paddingLeft: 28 }}
            aria-label="Find a course to customize"
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{overriddenCount} of {OFFERINGS.length} customized</span>
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 300 }}>
          {visible.map(o => {
            const { code, name } = splitLabel(o)
            const ov = overrides[o.id]
            return (
              <div
                key={o.id}
                className="flex items-center gap-2.5 px-3 py-2 border-b border-border/60 last:border-b-0"
                style={{ background: ov ? 'var(--muted)' : undefined }}
              >
                {ov ? (
                  <span className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--brand-color)' }} aria-hidden="true" />
                ) : (
                  <span className="shrink-0" style={{ width: 6 }} aria-hidden="true" />
                )}
                <span className="text-sm min-w-0 truncate flex-1">
                  <span className="font-medium">{code}</span>
                  <span className="text-muted-foreground"> · {name}</span>
                </span>
                {ov && (
                  <span className="text-xs font-medium shrink-0 tabular-nums">{fmt(ov.openDate)} – {fmt(ov.closeDate)}</span>
                )}
                <Popover
                  open={openRowId === o.id}
                  onOpenChange={open => { setOpenRowId(open ? o.id : null); if (open) setDraft(ov ?? { openDate: GLOBAL_OPEN, closeDate: GLOBAL_CLOSE }) }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon-xs" aria-label={`${ov ? 'Edit' : 'Customize'} window for ${code}`} className="shrink-0">
                      <i className={`fa-light ${ov ? 'fa-pen-to-square' : 'fa-plus'} text-xs`} aria-hidden="true" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-3 flex flex-col gap-2.5">
                    <p className="text-xs font-medium">{code} window</p>
                    <DateRangePickerField
                      value={{ from: draft.openDate, to: draft.closeDate }}
                      onChange={range => setDraft({ openDate: range?.from, closeDate: range?.to })}
                      triggerClassName="h-8 text-sm"
                      numberOfMonths={1}
                    />
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {ov ? (
                        <Button variant="ghost" size="xs" onClick={() => { setOverrides(p => { const { [o.id]: _rm, ...rest } = p; return rest }); setOpenRowId(null) }}>
                          Clear override
                        </Button>
                      ) : <span />}
                      <Button variant="default" size="xs" onClick={() => { setOverrides(p => ({ ...p, [o.id]: draft })); setOpenRowId(null) }}>
                        Save
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )
          })}
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-4">No courses match &ldquo;{query}&rdquo;.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page shell ─────────────────────────────────────────────────────────────
function VariantSection({
  letter, title, analogy, tradeoff, children,
}: {
  letter: string
  title: string
  analogy: string
  tradeoff: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold font-heading">{letter} · {title}</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">{analogy}</p>
      </div>
      <Card className="shadow-none">
        <CardContent style={{ padding: 16 }}>
          {children}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground max-w-2xl border-t border-dashed border-border pt-2.5">
        <span className="font-medium text-foreground">Trade-off: </span>{tradeoff}
      </p>
    </section>
  )
}

export default function PushStep3CourseWindowOverrideComparePage() {
  return (
    <div className="flex flex-col gap-10 p-6 max-w-[820px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 3 — Customize per course, four variants</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Riffs on the shipped &ldquo;Customize per course&rdquo; list (<code className="text-xs">step-communication.tsx</code>,
          Survey window card). Real fixture — Fall 2026 (14 courses), real global window (Dec 4–18, 2026). Each
          section below is fully interactive.
        </p>
      </div>

      <VariantSection
        letter="A"
        title="Checkbox row"
        analogy="A leading Checkbox replaces the 'Set dates' button — checked/unchecked reads in the left margin without reading row text. Analogy: Navan's 'Set different restrictions for hotel check-in/out dates.'"
        tradeoff="Fastest to scan which rows are overridden, but a checkbox reads as a binary toggle — it doesn't hint that unchecking DISCARDS the dates rather than just hiding them (the shipped 'Reset' button says that explicitly)."
      >
        <VariantCheckboxRow />
      </VariantSection>

      <VariantSection
        letter="B"
        title="Elevated card override"
        analogy="Default rows stay flat, single-line text; an overridden row becomes its own bordered, accent-ruled card that visually pops out of the list. Analogy: Airbnb's 'Custom weekend price' treatment on the pricing calendar."
        tradeoff="Best at-a-glance scan for 'which courses are customized' in a long list — the shape itself is the signal, no text needed. Costs more vertical rhythm (cards don't align to the same grid as plain rows), and the elevated-card language competes with the 'Advisory' card treatment step 2 already uses for a different concept (late-added co-instructor decisions) — same visual vocabulary, different meaning, worth checking that doesn't read as related."
      >
        <VariantElevatedCard />
      </VariantSection>

      <VariantSection
        letter="C"
        title="Mode switch"
        analogy="Collapses the global fields + nested disclosure into one top-level choice: 'Same window for every course' vs. 'Different windows per course.' Analogy: Deel's 'Bulk edit' (one value for all vs. several values, edit individually)."
        tradeoff="Removes a whole layer of hierarchy — no disclosure to find, no default-vs-overridden distinction to track per row. But it's all-or-nothing: there's no 'mostly default, 2 exceptions' state anymore, which is the actual common case per the Aug 11 transcript (most courses share the window, a few don't) — this variant fits worse than A/B/D for that shape."
      >
        <VariantModeSwitch />
      </VariantSection>

      <VariantSection
        letter="D"
        title="Row popover"
        analogy="Rows never change height — 'Set dates' opens a Popover anchored to the row with the two fields + Save/Cancel, so the list stays a stable single-line-per-course grid. Analogy: Cal.com / Lyssna's 'Select the dates to override' modal."
        tradeoff="Most stable list — no layout reflow as rows get customized, best for very long course lists. Costs a click-to-see: the resolved dates ARE visible at rest (unlike a full modal), but editing always requires opening the popover first, one more step than A/B's always-inline fields."
      >
        <VariantRowPopover />
      </VariantSection>

      <VariantSection
        letter="E"
        title="Bulk select + apply"
        analogy="Every A–D variant edits one course at a time. Checkboxes select N courses; a bulk bar with two date fields applies one window to all of them at once. Analogy: Pipedrive's 'Bulk edit N leads' side panel."
        tradeoff="The only variant that scales to 'these 5 clinical courses all move a week later' in one action instead of N repeated edits — a real gap in A–D for anything beyond one-off exceptions. Costs a second control vocabulary in the same list (checkboxes for selection AND the resolved-date text for state), and the bulk bar's empty state ('Select courses to bulk-apply') is one more thing to explain before the first use."
      >
        <VariantBulkSelect />
      </VariantSection>

      <VariantSection
        letter="F"
        title="Timeline bar"
        analogy="Abandons the list for a shared calendar strip — each course is a horizontal bar positioned by its real dates, muted for default-window courses, brand-colored (and offset) for overrides. Click a bar to edit. Analogy: Asana / Basecamp timeline views."
        tradeoff="Only variant that answers 'which courses run outside the norm' by SHAPE (a bar sitting apart from the others) rather than by reading — valuable once a term has real spread (half-credit courses, session-based dates, the actual reason this feature exists per the Jun 30 decision). Costs the most build effort by far, and course NAMES compete with the timeline for horizontal space — the 160px label column will truncate longer course names that the other six variants show in full."
      >
        <VariantTimelineBar />
      </VariantSection>

      <VariantSection
        letter="G"
        title="Segmented filter"
        analogy="Reuses this exact codebase's own established idiom — step-survey-instances.tsx's All/Needs attention/Blocked ToggleGroup — instead of inventing a new one. 'All (14) / Customized (2)' narrows the list once several courses are overridden."
        tradeoff="Lowest-risk of the seven — it's the shipped row shape (A's text-button version) plus one filter control this codebase already ships elsewhere, so it introduces zero new visual vocabulary. But it only helps once overrides exist; on a fresh push (0 customized) it adds a disabled 'Customized (0)' segment that does nothing yet — worth deciding whether that's worth showing before the first override."
      >
        <VariantSegmentedFilter />
      </VariantSection>

      <VariantSection
        letter="H"
        title="Quiet default, marked exception (revised)"
        analogy="D, revised after direct feedback: 'Uses survey window' repeated on every row is noise, and finding which rows differ is hard when nothing but text distinguishes them. Default rows go silent (course name + a small muted '+'); overridden rows get a brand dot + subtle row tint + full-weight resolved dates, plus a 'Find a course' search input. Dot borrows the exact vocabulary /compare/push-step2-template-picker-segmented already established for 'this is the marked one' — deliberately not B's bordered card, which already means 'Advisory' in step 2."
        tradeoff="Fixes both complaints without picking up A's checkbox (already means 'included/excluded' elsewhere in this wizard) or B's card (already means 'Advisory'). The '+' -vs-pencil icon swap is a small extra thing to notice on first use, and silence-as-default relies on the admin knowing absence of a badge means 'default' — one line of copy the first time this ships would remove any ambiguity there."
      >
        <VariantQuietException />
      </VariantSection>
    </div>
  )
}
