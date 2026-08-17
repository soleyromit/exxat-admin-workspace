'use client'

// COMPARE ROUTE (throwaway — same lifecycle as /compare/push-step2-template-switch
// and its siblings, delete once a direction is picked).
//
// 2026-08-05 — the shipped `TemplateControl` (step-survey-instances.tsx:905-1007)
// renders every template as its own bordered radio card — name, question-count,
// an optional "Default" badge, and a Preview icon-button, each option costing
// ~2 lines + card padding/border chrome. A same-day patch (:970-977) already
// fixed the worst crowding by moving the Default badge off the title line, but
// at the real 280px rail width a longer name ("Comprehensive Course Evaluation")
// still fights the Preview icon for room, and every option pays full card
// chrome for what's fundamentally a one-line decision.
//
// This route explores a genuinely different pattern instead of another patch:
// a compact BORDERLESS list, Airtable/Otter.ai-density. Each template collapses
// to ONE dense row — name (truncating) + a middot-joined meta string ("8q ·
// Default") on the SAME line, no second line, no per-row card border. Selection
// reads as a tinted row background (var(--brand-tint), this workspace's
// selection-state rule — never border-color alone) plus a small leading check
// glyph instead of a radio circle claiming its own column. The structural fix
// for the crowding: NO per-row Preview icon at all — one "Preview" text-button
// below the list, scoped to whichever row is selected/hovered. Removing 3 of the
// row's 4 elements (radio circle, border, per-row icon) is what buys the room
// the title needed; the badge relocation alone couldn't get there.
//
// Selection is still real radio semantics (RadioGroup/RadioGroupItem, visually
// hidden but present + focusable) — this is a required, keyboard-operable
// choice, not a decorative list. Real fixture data (MOCK_TEMPLATES / DPT-510),
// real DS components (RadioGroup, RadioGroupItem, Button, Badge, Label) — no
// new component introduced.

import { useState } from 'react'
import { RadioGroup, RadioGroupItem, Button, Badge, Label } from '@exxatdesignux/ui'
import { MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, type PceTemplate } from '@/lib/pce-mock-data'

const OFFERING = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co13')! // DPT-510
const PUBLISHED = MOCK_TEMPLATES.filter(t => t.status === 'active')

// Stress-test row — clone a real template with a name long enough to force
// truncation at 280px, so the compact list has to prove it survives the
// worst case, not just the three real (mostly short) fixture names.
const LONG_NAME_TEMPLATE: PceTemplate = {
  ...PUBLISHED[2],
  id: 'tmpl-stress-long-name',
  name: 'Comprehensive End-of-Semester Clinical Competency Evaluation',
}

const ROW_TEMPLATES = [...PUBLISHED, LONG_NAME_TEMPLATE]

function metaOf(t: PceTemplate, isDefault: boolean) {
  const q = `${t.questionCount}q`
  return isDefault ? `${q} · Default` : q
}

// ── Compact borderless list ────────────────────────────────────────────────
export function CompactTemplateList({
  templates, templateId, defaultTemplateId, onChange, onPreview,
}: {
  templates: PceTemplate[]
  templateId: string
  defaultTemplateId?: string
  onChange: (id: string) => void
  onPreview: (t: PceTemplate) => void
}) {
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const selected = templates.find(t => t.id === templateId) ?? null
  // Preview scopes to whichever row currently has attention: keyboard focus
  // first (so the control stays fully operable without a mouse), else the
  // committed selection. No hover-only state — hover has no keyboard
  // equivalent and this control must stay operable without a pointer.
  const previewTarget = (focusedId && templates.find(t => t.id === focusedId)) || selected

  return (
    <div className="flex flex-col gap-1.5">
      <RadioGroup
        value={templateId}
        onValueChange={onChange}
        className="flex flex-col gap-px"
        aria-label={`Template for ${OFFERING.id}`}
      >
        {templates.map(t => {
          const checked = t.id === templateId
          const isDefault = t.id === defaultTemplateId
          const inputId = `compact-tmpl-${t.id}`
          return (
            <Label
              key={t.id}
              htmlFor={inputId}
              className="group flex min-w-0 cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5"
              style={{ background: checked ? 'var(--brand-tint)' : 'transparent' }}
              onFocusCapture={() => setFocusedId(t.id)}
              onBlurCapture={() => setFocusedId(prev => (prev === t.id ? null : prev))}
              onMouseEnter={() => setFocusedId(t.id)}
              onMouseLeave={() => setFocusedId(prev => (prev === t.id ? null : prev))}
            >
              {/* Leading check/dot in place of a radio circle's own column —
                  RadioGroupItem stays mounted (real semantics, keyboard-
                  operable, focus-visible ring) but is visually minimized so
                  it reads as a small glyph, not a chrome element. */}
              <RadioGroupItem
                value={t.id}
                id={inputId}
                size="sm"
                className="shrink-0"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.name}</span>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                {metaOf(t, isDefault)}
              </span>
            </Label>
          )
        })}
      </RadioGroup>

      {/* Structural fix for the crowding: ONE Preview action for the whole
          list, scoped to the focused/selected row, instead of one icon-button
          bolted onto every row. */}
      <div className="flex items-center justify-between gap-2 px-2 pt-0.5">
        <span className="truncate text-xs text-muted-foreground">
          {previewTarget ? `Previewing ${previewTarget.name}` : 'Select a template to preview it'}
        </span>
        <Button
          variant="link"
          size="xs"
          className="shrink-0 px-0"
          disabled={!previewTarget}
          onClick={() => previewTarget && onPreview(previewTarget)}
        >
          Preview
        </Button>
      </div>
    </div>
  )
}

export default function PushStep2TemplatePickerCompactListComparePage() {
  const [templateId, setTemplateId] = useState(PUBLISHED[0].id)
  const [previewed, setPreviewed] = useState<PceTemplate | null>(null)
  const defaultTemplateId = PUBLISHED.find(t => t.isDefaultForType)?.id ?? PUBLISHED[0].id

  return (
    <div className="flex flex-col gap-8 p-6 max-w-[900px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">
          Step 2 — TemplateControl, compact borderless list
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Airtable/Otter.ai-density alternative to the shipped radio-block list in{' '}
          <code className="text-xs">TemplateControl</code>. One line per template — name + middot meta,
          tinted-row selection, a single scoped Preview action instead of one icon per row. Rendered at
          the real 280px rail width the shipped widget has to survive.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold font-heading">280px rail — real fixture data</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {OFFERING.id.toUpperCase()} · DPT-510, three published templates (End-of-Term Evaluation 8q ·
            Default, Faculty Midterm Check-In 3q, Comprehensive Course Evaluation 20q).
          </p>
        </div>
        <div style={{ width: 280 }} className="rounded-md border border-border bg-card p-2">
          <CompactTemplateList
            templates={PUBLISHED}
            templateId={templateId}
            defaultTemplateId={defaultTemplateId}
            onChange={setTemplateId}
            onPreview={setPreviewed}
          />
        </div>
        {previewed && (
          <p className="text-xs text-muted-foreground">
            Last previewed: <span className="font-medium text-foreground">{previewed.name}</span>
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold font-heading">
            280px rail — truncation stress test
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Same list with one cloned template renamed to a deliberately long name (
            <span className="italic">Comprehensive End-of-Semester Clinical Competency Evaluation</span>
            ) to confirm the row still truncates cleanly and keeps its meta string readable.
          </p>
        </div>
        <div style={{ width: 280 }} className="rounded-md border border-border bg-card p-2">
          <CompactTemplateList
            templates={ROW_TEMPLATES}
            templateId={templateId}
            defaultTemplateId={defaultTemplateId}
            onChange={setTemplateId}
            onPreview={setPreviewed}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2 border-t border-dashed border-border pt-4">
        <h2 className="text-sm font-semibold font-heading">What this trades away</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Dropping per-row borders and the radio's own column buys back the horizontal room the title
          needed, but it also flattens visual weight — the shipped card list read as "this is a real,
          consequential choice" partly through that chrome; the dense list reads closer to a settings
          toggle. It also demotes the question count from a same-line badge-adjacent fact to small
          trailing muted text, which scans slightly slower when comparing counts across three rows at a
          glance.
        </p>
      </section>
    </div>
  )
}
