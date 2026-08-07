'use client'

// COMPARE HUB (throwaway — same lifecycle as its sibling /compare/push-step2-*
// routes, delete once a direction is picked).
//
// 2026-08-05 — the four push-step2-template-picker-* routes each explored one
// alternative to the shipped TemplateControl radio-block list in isolation, at
// their own URL. This hub puts all four in ONE page, switchable, alongside the
// REAL shipped `TemplateControl` (imported from the production file, not a
// reproduction) as the baseline — so "review the options" means one tab strip,
// not five browser tabs. Same switcher convention as
// /compare/push-step2-accordion-layout (Button group, active = variant, one
// bordered panel below) — no new comparison pattern invented.
//
// Every option renders against the SAME fixture (DPT-510, the 3 real
// course-evaluation templates: End-of-Term Evaluation 8q/Default, Faculty
// Midterm Check-In 3q, Comprehensive Course Evaluation 20q) and the SAME 280px
// wrapper — the actual rail-column width in the real wizard — so the
// comparison is apples-to-apples regardless of which sibling route's own
// fixture filtering it originally shipped with.
//
// Each option owns its own template-selection state (not shared across tabs)
// — switching tabs to look at another pattern shouldn't reset or leak the
// choice you made in a different one, matching how the accordion-layout
// variants each run their own independent state.

import { useState } from 'react'
import { Button } from '@exxatdesignux/ui'
import { TemplateControl } from '@/components/pce/courses-evaluatees/step-survey-instances'
import { TemplatePickerPopover } from '@/app/(app)/compare/push-step2-template-picker-popover/page'
import { CompactTemplateList } from '@/app/(app)/compare/push-step2-template-picker-compact-list/page'
import { TemplatePickerSheet, RailTemplateCard } from '@/app/(app)/compare/push-step2-template-picker-sheet/page'
import { SegmentedTemplatePicker } from '@/app/(app)/compare/push-step2-template-picker-segmented/page'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import { MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, type PceTemplate } from '@/lib/pce-mock-data'
import { courseLabelOf } from '@/lib/pce-course-readiness'

// ── One shared fixture for every option — the real wizard's input shape
// (surveyType-filtered to course-evaluation templates only), not whichever
// filter a given sibling route happened to use standalone. ─────────────────
const OFFERING = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co13')! // DPT-510
const PUBLISHED = MOCK_TEMPLATES.filter(
  t => t.status === 'active' && (!t.surveyType || t.surveyType === 'course_evaluation'),
)
const DEFAULT_ID = PUBLISHED.find(t => t.name === 'End-of-Term Evaluation')?.id ?? PUBLISHED[0]!.id
const [COURSE_CODE] = courseLabelOf(OFFERING).split(' – ')

type VariantKey = 'shipped' | 'popover' | 'compact-list' | 'sheet' | 'segmented'

const VARIANTS: { key: VariantKey; label: string; sub: string }[] = [
  { key: 'shipped', label: 'Shipped (current)', sub: 'The real TemplateControl, imported from production — RadioGroup block list, badge-relocation + min-w-0 patches already applied.' },
  { key: 'popover', label: 'Popover + Command', sub: 'Compact trigger, searchable list opens at a fixed width independent of the trigger column.' },
  { key: 'compact-list', label: 'Compact list', sub: 'Dense single-line rows, one shared Preview action instead of one icon per row.' },
  { key: 'sheet', label: 'Sheet gallery', sub: '"Change" opens a full-width drawer instead of expanding inline at 280px.' },
  { key: 'segmented', label: 'Segmented browse', sub: 'ToggleGroup browses one template at a time into a single full-width detail card.' },
]

function ShippedDemo({ onPreview }: { onPreview: (t: PceTemplate) => void }) {
  const [templateId, setTemplateId] = useState(DEFAULT_ID)
  return (
    <TemplateControl
      offering={OFFERING}
      templateId={templateId}
      defaultTemplateId={DEFAULT_ID}
      publishedTemplates={PUBLISHED}
      onTemplateChange={(_offeringId, id) => setTemplateId(id)}
      onCreate={() => {}}
      onPreview={onPreview}
    />
  )
}

function PopoverDemo({ onPreview }: { onPreview: (t: PceTemplate) => void }) {
  const [templateId, setTemplateId] = useState(DEFAULT_ID)
  return (
    <TemplatePickerPopover
      templates={PUBLISHED}
      value={templateId}
      onChange={setTemplateId}
      onPreview={onPreview}
    />
  )
}

function CompactListDemo({ onPreview }: { onPreview: (t: PceTemplate) => void }) {
  const [templateId, setTemplateId] = useState(DEFAULT_ID)
  return (
    <CompactTemplateList
      templates={PUBLISHED}
      templateId={templateId}
      defaultTemplateId={DEFAULT_ID}
      onChange={setTemplateId}
      onPreview={onPreview}
    />
  )
}

// No onPreview wiring here — the Sheet variant's own GalleryCard stubs Preview
// in-place with a dashed note, matching how it ships standalone. Kept as-is
// rather than reworking it into the shared dialog, so this hub shows exactly
// what the standalone route showed.
function SheetDemo() {
  const [templateId, setTemplateId] = useState(DEFAULT_ID)
  const [open, setOpen] = useState(false)
  const template = PUBLISHED.find(t => t.id === templateId)!
  return (
    <>
      <RailTemplateCard template={template} isDefault={template.id === DEFAULT_ID} onChange={() => setOpen(true)} />
      <TemplatePickerSheet
        open={open}
        onOpenChange={setOpen}
        courseCode={COURSE_CODE}
        templates={PUBLISHED}
        committedId={templateId}
        defaultTemplateId={DEFAULT_ID}
        onCommit={id => { setTemplateId(id); setOpen(false) }}
      />
    </>
  )
}

function SegmentedDemo({ onPreview }: { onPreview: (t: PceTemplate) => void }) {
  const [templateId, setTemplateId] = useState(DEFAULT_ID)
  return (
    <SegmentedTemplatePicker
      templates={PUBLISHED}
      committedId={templateId}
      defaultTemplateId={DEFAULT_ID}
      onCommit={setTemplateId}
      onPreview={onPreview}
    />
  )
}

export default function PushStep2TemplatePickerHubComparePage() {
  const [active, setActive] = useState<VariantKey>('shipped')
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Template picker — shipped vs. 4 alternatives</h1>
        <p className="text-sm text-muted-foreground">
          DPT-510 · Musculoskeletal Physical Therapy I — same fixture, same 280px rail-column width, across every
          option. "Shipped (current)" is the real production TemplateControl, not a reproduction.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {VARIANTS.map(v => (
          <Button key={v.key} variant={active === v.key ? 'default' : 'outline'} size="sm" onClick={() => setActive(v.key)}>
            {v.label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-2">{VARIANTS.find(v => v.key === active)?.sub}</p>

      <div className="rounded-md border border-border p-4">
        <div style={{ width: 280 }}>
          {active === 'shipped' && <ShippedDemo onPreview={setPreviewTemplate} />}
          {active === 'popover' && <PopoverDemo onPreview={setPreviewTemplate} />}
          {active === 'compact-list' && <CompactListDemo onPreview={setPreviewTemplate} />}
          {active === 'sheet' && <SheetDemo />}
          {active === 'segmented' && <SegmentedDemo onPreview={setPreviewTemplate} />}
        </div>
      </div>

      <SurveyPreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={v => { if (!v) setPreviewTemplate(null) }}
      />
    </div>
  )
}
