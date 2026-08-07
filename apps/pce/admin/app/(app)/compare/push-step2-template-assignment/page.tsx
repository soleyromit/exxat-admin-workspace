'use client'

// COMPARE ROUTE (throwaway — same lifecycle as sibling /compare/push-step2-*
// routes, delete once this is merged back or the direction is settled).
//
// 2026-08-05, round 5 — rounds 2-4 all built against invented fixture data
// and hand-approximated components, disconnected from what's actually
// shipped. This round reuses the REAL production pieces directly instead of
// reproducing them:
//   - TemplateControl (step-survey-instances.tsx, now exported) — the actual
//     radio-block template picker, already shipped per Romit's own Aug 5
//     "dropdown → radio blocks" fix. Not rebuilt, just imported.
//   - SurveyPreviewDialog (already exported) — wired to the real Preview
//     action instead of a no-op.
//   - Real fixture data: MOCK_COURSE_OFFERINGS['co13'] is DPT-510 itself —
//     the exact course the live app renders with Dr. Rachel Gomez as a real
//     coInstructorIds late addition (primaryFacultyId f1 = Dr. Anita Patel,
//     collaboratorIds f2 = Dr. Kevin Chen, coInstructorIds f5 = Dr. Rachel
//     Gomez) — not invented names.
//
// The one thing NOT reused directly is the per-person "Advisory" override
// card — EvaluateeRoster is coupled to the full CourseGate/expandInstances
// engine, too heavy to stand up standalone here. The block below mirrors its
// exact JSX/classes/component composition from step-survey-instances.tsx
// (advisoryFresh section) — same Label/Checkbox/Select/Button structure,
// same chip-4 tokens — not a reinterpretation.

import { useState } from 'react'
import { Label, Checkbox, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Button } from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { TemplateControl } from '@/components/pce/courses-evaluatees/step-survey-instances'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import { MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, type PceTemplate } from '@/lib/pce-mock-data'

const OFFERING = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co13')!
const DEFAULT_TEMPLATE_ID = 'tmpl1'

export default function PushStep2TemplateAssignmentComparePage() {
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID)
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)

  // Mirrors EvaluateeRoster's own local state for the advisory card
  // (step-survey-instances.tsx EvaluateeRoster).
  const [reyesIncluded, setReyesIncluded] = useState(true)
  const [reyesOverrideId, setReyesOverrideId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [pickedTemplateId, setPickedTemplateId] = useState('')

  const template = MOCK_TEMPLATES.find(t => t.id === templateId) ?? null
  const overrideTemplate = reyesOverrideId ? MOCK_TEMPLATES.find(t => t.id === reyesOverrideId) : null

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[900px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Template assignment</h1>
        <p className="text-sm text-muted-foreground">
          DPT-510 · Musculoskeletal Physical Therapy I — real fixture (co13), real TemplateControl.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Template</span>
        <TemplateControl
          offering={OFFERING}
          templateId={templateId}
          defaultTemplateId={DEFAULT_TEMPLATE_ID}
          publishedTemplates={MOCK_TEMPLATES.filter(t => t.status === 'active')}
          onTemplateChange={(_offeringId, id) => setTemplateId(id)}
          onCreate={() => {}}
          onPreview={setPreviewTemplate}
        />
        {template && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {template.name} · {template.questionCount} question{template.questionCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--chip-4)' }}>
          <i className="fa-solid fa-arrow-right-arrow-left text-[10px]" aria-hidden="true" />
          Advisory — uses default unless changed
        </span>
        <div
          className="flex flex-1 basis-64 max-w-sm flex-col gap-1.5 rounded-md border p-2.5 min-w-0"
          style={{ borderColor: 'var(--chip-4)', background: 'var(--card)' }}
        >
          <Label htmlFor="unit-dpt510-reyes" className="flex cursor-pointer items-start gap-2.5 min-w-0">
            <PersonAvatar name="Dr. Rachel Gomez" className={cn('size-6', !reyesIncluded && 'grayscale')} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cn('truncate text-sm font-medium', !reyesIncluded && 'text-muted-foreground')}>Dr. Rachel Gomez</span>
              <span className="truncate text-xs text-muted-foreground">Instructor</span>
            </span>
            <Checkbox
              id="unit-dpt510-reyes"
              checked={reyesIncluded}
              onCheckedChange={() => setReyesIncluded(v => !v)}
              aria-label="Include Dr. Rachel Gomez in this push"
            />
          </Label>
          <div className="flex flex-col gap-1.5 border-t border-border pt-1.5">
            <p className="text-xs text-muted-foreground">
              Evaluating with: <span className="font-medium text-foreground">{overrideTemplate?.name ?? template?.name ?? 'Same as course'}</span>
              {!overrideTemplate && <> — same as Dr. Kevin Chen</>}
            </p>
            {picking ? (
              <div className="flex flex-col gap-1.5">
                <Select value={pickedTemplateId} onValueChange={setPickedTemplateId}>
                  <SelectTrigger size="sm" aria-label="Different template for Dr. Rachel Gomez" className="w-full">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TEMPLATES.filter(t => t.status === 'active').map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={!pickedTemplateId}
                    onClick={() => { setReyesOverrideId(pickedTemplateId); setPicking(false); setPickedTemplateId('') }}
                  >
                    Use this template
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => { setPicking(false); setPickedTemplateId('') }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="link"
                size="xs"
                className="self-start px-0 h-auto"
                style={{ color: 'var(--chip-4)' }}
                onClick={() => setPicking(true)}
              >
                Use a different template
              </Button>
            )}
          </div>
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
