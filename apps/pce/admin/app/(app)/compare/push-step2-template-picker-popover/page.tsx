'use client'

// COMPARE ROUTE (throwaway — same lifecycle as /compare/push-step2-simplify
// and its siblings, delete once a direction is picked).
//
// 2026-08-05 — TemplateControl (step-survey-instances.tsx, search
// "TemplateControl") renders published templates as a RadioGroup block-list
// inside the Template rail, which is 280px wide (`layout === 'rail'`:
// Evaluatees gets the wide pane, Template collapses to a compact committed-
// template card that expands to this full radio list on "Change"). A prior
// patch already fixed the worst crowding at that width (badge moved to its
// own line under the title, `min-w-0` added so `truncate` actually has
// somewhere to shrink to) — see the comment above the radio map in the real
// file. That patch treats the symptom. The structural problem underneath is
// that a RadioGroup's card width is locked to its container: at 280px,
// title + question count + an optional "Default" badge + a Preview icon all
// have to fit that same 280px, no matter how long the template name is
// ("Comprehensive Course Evaluation" is the stress case in this fixture).
//
// This route asks whether decoupling picker-surface width from
// trigger-column width solves it more cleanly than any further radio-list
// patching. Popover + Command does that by construction: PopoverContent
// renders in a portal, so its width is independent of PopoverTrigger's —
// the trigger can stay a compact single-line button ("End-of-Term
// Evaluation · 8 questions ▾") at 280px while the list underneath opens at
// a comfortable 340px regardless. Nothing needs breathing-room triage
// because nothing is fighting for space in the first place.
//
// Trade-off, stated up front (see summary): a RadioGroup shows every option
// and the current pick in one glance, no click required. This pattern
// hides the option set behind a trigger — one extra interaction before an
// admin can compare templates, and there's no way to see "what else is
// available" without opening it. For a rail that's *usually* the compact
// committed-template summary and only expands to a chooser on deliberate
// "Change," that trade reads as acceptable — the admin has already opted
// into "I want to change this," so a searchable popover doesn't cost them
// a state they'd otherwise have had for free.
//
// Preview decision: kept as a per-row icon-button inside each CommandItem
// (same `fa-light fa-eye` affordance as the shipped radio list), NOT a
// footer/hover action. Two reasons: (1) parity — this is the same "preview
// without committing" job the radio version already solves per-row, so
// changing the affordance's location would be a second, unrelated variable
// in this comparison; (2) a footer action only previews the highlighted/
// selected row, which conflicts with letting an admin preview two or three
// candidates back-to-back before picking — a per-row button keeps that
// multi-preview flow intact. `e.stopPropagation()` on the Preview button's
// onClick keeps it from also firing the row's onSelect (cmdk fires select
// on the whole row's click).
//
// Real DS throughout (Popover/PopoverTrigger/PopoverContent,
// Command/CommandInput/CommandList/CommandEmpty/CommandItem, Button,
// Badge) — types confirmed via `node tools/ds/source.mjs Popover|Command`
// against the installed @exxatdesignux/ui@0.6.57. Fixture is the real
// MOCK_COURSE_OFFERINGS / MOCK_TEMPLATES data (co13 = DPT-510), not a
// synthetic list — self-contained otherwise, NOT wired to the real
// TemplateControl or the wizard's stage/commit state machine.

import { useState } from 'react'
import {
  Popover, PopoverTrigger, PopoverContent,
  Command, CommandInput, CommandList, CommandEmpty, CommandItem,
  Button, Badge,
} from '@exxatdesignux/ui'
import { MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, MOCK_MASTER_COURSES, type PceTemplate } from '@/lib/pce-mock-data'

// ── Fixture — real mock data, not synthetic ───────────────────────────────
const OFFERING = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co13')!
const MASTER_COURSE = MOCK_MASTER_COURSES.find(m => m.id === OFFERING.masterCourseId)!

// Real TemplateControl only ever receives course-evaluation templates from
// the wizard (programmatic-survey templates like "Alumni Outcomes Survey"
// are a different surface entirely) — filtering on `surveyType` in addition
// to `status` here reproduces that real input shape. Resolves to exactly
// the 3 templates this comparison needs: End-of-Term Evaluation (8q,
// Default), Faculty Midterm Check-In (3q), Comprehensive Course Evaluation
// (20q — the long-name stress case).
const PUBLISHED = MOCK_TEMPLATES.filter(t => t.status === 'active' && t.surveyType === 'course_evaluation')
const DEFAULT_ID = PUBLISHED.find(t => t.name === 'End-of-Term Evaluation')?.id ?? PUBLISHED[0]?.id

function questionLabel(t: PceTemplate) {
  return `${t.questionCount} question${t.questionCount !== 1 ? 's' : ''}`
}

// ── The picker itself — trigger button + Popover/Command list ────────────

export function TemplatePickerPopover({
  templates, value, onChange, onPreview, popoverWidth = 340,
}: {
  templates: PceTemplate[]
  value: string
  onChange: (id: string) => void
  onPreview: (t: PceTemplate) => void
  /** Deliberately independent of the trigger's own width — the whole point
   *  of this direction. Defaults to a comfortable reading width regardless
   *  of how narrow the collapsed trigger column is. */
  popoverWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = templates.find(t => t.id === value) ?? null

  return (
    <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setSearch('') }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full min-w-0 justify-between gap-2"
          aria-label={selected ? `Template: ${selected.name}, ${questionLabel(selected)}. Change template` : 'Choose a template'}
        >
          <span className="min-w-0 flex-1 truncate text-start">
            {selected ? (
              <>
                <span className="font-medium">{selected.name}</span>
                <span className="text-muted-foreground"> · {questionLabel(selected)}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Choose a template</span>
            )}
          </span>
          <i className="fa-light fa-chevron-down shrink-0 text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0" style={{ width: popoverWidth }}>
        <Command>
          <CommandInput placeholder="Search templates…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No templates match &ldquo;{search}&rdquo;.</CommandEmpty>
            {templates.map(t => {
              const isDefault = t.id === DEFAULT_ID
              return (
                <CommandItem
                  key={t.id}
                  value={t.name}
                  data-checked={t.id === value}
                  onSelect={() => { onChange(t.id); setOpen(false) }}
                  className="items-center gap-2 py-2"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{t.name}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{questionLabel(t)}</span>
                      {isDefault && (
                        // 12px floor (WCAG 1.4.4 / DS type scale) — same treatment
                        // as the shipped radio list's Default badge.
                        <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                          Default
                        </Badge>
                      )}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0"
                    aria-label={`Preview ${t.name}`}
                    onClick={e => { e.stopPropagation(); onPreview(t) }}
                  >
                    <i className="fa-light fa-eye text-xs" aria-hidden="true" />
                  </Button>
                </CommandItem>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ── Demo section — one width per instance, own state ──────────────────────

function PickerDemo({ width, label, popoverWidth }: { width: number; label: string; popoverWidth?: number }) {
  const [value, setValue] = useState(DEFAULT_ID)
  const [previewed, setPreviewed] = useState<PceTemplate | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="rounded-md border border-dashed border-border p-4" style={{ width }}>
        <TemplatePickerPopover
          templates={PUBLISHED}
          value={value}
          onChange={setValue}
          onPreview={setPreviewed}
          popoverWidth={popoverWidth}
        />
      </div>
      {previewed && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <i className="fa-light fa-eye text-xs" aria-hidden="true" />
          Previewing <span className="font-medium text-foreground">{previewed.name}</span> — dummy for this
          comparison; a real build opens the existing template-preview FloatingSheetPanel.
        </p>
      )}
    </div>
  )
}

export default function PushStep2TemplatePickerPopoverComparePage() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 2 — template picker as Popover + Command</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {MASTER_COURSE.code} · {MASTER_COURSE.name} — {PUBLISHED.length} published templates. Compact trigger
          button opens a searchable list whose width is independent of the trigger&rsquo;s own column. Not wired
          into the production wizard — real DS components, real fixture data.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold font-heading">1 · Constrained rail width (280px)</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            The real Template rail width. The trigger truncates cleanly on one line even for the 20-question
            &ldquo;Comprehensive Course Evaluation&rdquo; template — nothing is fighting for room because the list
            itself doesn&rsquo;t render at 280px.
          </p>
        </div>
        <PickerDemo width={280} label="280px column (real rail width)" />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold font-heading">2 · Unconstrained width (600px)</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Same component, wider trigger column. The Popover content renders at the same comfortable width as
            above — proof the picker surface never depended on the trigger&rsquo;s width in the first place.
          </p>
        </div>
        <PickerDemo width={600} label="600px column" />
      </section>
    </div>
  )
}
