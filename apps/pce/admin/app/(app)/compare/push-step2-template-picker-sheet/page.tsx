'use client'

// COMPARE ROUTE (throwaway — same lifecycle as /compare/push-step2-simplify
// and its siblings, delete once a direction is picked).
//
// 2026-08-05 — TemplateControl (step-survey-instances.tsx:905-1007) renders
// every published template as its own bordered RadioGroup card — name,
// question count, an optional Default badge, a Preview icon-button — inside
// the `layout === 'rail'` Template column, which is a fixed 280px track
// (:1162). Two narrow-width patches already landed there (:897-904 moved
// the Default badge off the title line; :970-977 gave the trailing Preview
// icon room to breathe) because at 280px, three-plus template cards with a
// name + count + badge + icon genuinely don't fit without crowding. Both
// patches treated the symptom. This route questions the premise: should the
// picker ever be forced into 280px at all?
//
// The rail's compact "committed template" summary card — name, question
// count, Default badge, Preview/Change buttons (:1183-1197) — is untouched
// below; it's a good fit for 280px precisely because it only ever shows ONE
// template. The radio gallery is a different job (comparing several
// candidates side by side) wearing the same width constraint for no reason
// other than physical proximity to the summary card. Clicking "Change" here
// opens a DS Sheet instead of expanding inline — same `showOverlay={false}`
// + bordered SheetHeader/SheetFooter + Cancel convention as
// settings-communication.tsx's TemplateEditorSheet (:112-158), which this
// route mirrors prop-for-prop. Off the 280px leash, each template card gets
// a second line ("Evaluates …", derived from the template's own sections +
// facultyRoleSets — the same data TemplateControl already reads, just with
// room to state it) and two explicit actions instead of one radio + one
// icon-button.
//
// Self-contained: local `committedId`/`sheetOpen` state stand in for the
// wizard's real onTemplateChange/stagedTemplate plumbing
// (CourseDetailBody:1053-1065) — picking a template in the Sheet commits
// straight to the compact card with no staging step, since this route is
// only comparing the PICKER's surface, not the separate staged-consequence
// pattern already settled in push-step2-template-switch. Real fixture data
// throughout (MOCK_COURSE_OFFERINGS / MOCK_TEMPLATES), real DS components
// (Sheet family, Button, Badge) — no invented chrome.

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Button, Badge,
} from '@exxatdesignux/ui'
import {
  MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, EVAL_FACULTY_ROLES, type PceTemplate,
} from '@/lib/pce-mock-data'
import { courseLabelOf } from '@/lib/pce-course-readiness'

const OFFERING = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co13')!
const PUBLISHED = MOCK_TEMPLATES.filter(t => t.status === 'active')
// Synthesized for this demo the same way the push-step2-simplify variants do
// (e.g. variant-a-detail-rail.tsx:179) — the shared fixture carries no
// isDefaultForType flags, so every sibling compare route that needs a
// "Default" badge to actually render flags tmpl1 itself.
const DEFAULT_TEMPLATE_ID = 'tmpl1'

const listFmt = (items: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items)

function splitCourseLabel(label: string): { code: string; name: string } {
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  EVAL_FACULTY_ROLES.map(r => [r.id, r.label]),
)

/** Same source data TemplateControl reads (sections + facultyRoleSets) —
 *  just stated as a sentence instead of implied by a section badge, since
 *  the Sheet card has room for one. */
function evaluatesOf(t: PceTemplate): string {
  const parts: string[] = []
  if (t.sections.includes('course_content')) parts.push('Course material')
  const roleIds = new Set((t.facultyRoleSets ?? []).flatMap(rs => rs.roles))
  if (t.sections.includes('faculty_performance')) {
    if (roleIds.size > 0) for (const id of roleIds) parts.push(ROLE_LABEL[id] ?? id)
    else parts.push('Instructor')
  }
  if (t.sections.includes('course_director')) parts.push('Course Director')
  return parts.length > 0 ? `Evaluates ${listFmt(parts)}` : 'No evaluation criteria yet'
}

// ── The compact rail card — EXACTLY the shipped 280px summary
// (step-survey-instances.tsx:1183-1197), reproduced here rather than
// imported since this route can't reach into TemplateControl's private
// CourseDetailBody scope. Not the surface under test — the Sheet is. ──────
export function RailTemplateCard({
  template, isDefault, onChange,
}: {
  template: PceTemplate
  isDefault: boolean
  onChange: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {template.name}
        {isDefault && (
          <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
            Default
          </Badge>
        )}
      </span>
      <span className="text-xs text-muted-foreground">{template.questionCount} questions</span>
      <div className="flex gap-1.5 pt-1">
        <Button variant="ghost" size="xs">Preview</Button>
        <Button variant="ghost" size="xs" onClick={onChange}>Change</Button>
      </div>
    </div>
  )
}

// ── The Sheet gallery card — roomy: name + Default tag, count, Evaluates
// caption, and two explicit actions instead of one radio + one icon. ──────
function GalleryCard({
  template, isDefault, isCommitted, onPreview, onSelect,
}: {
  template: PceTemplate
  isDefault: boolean
  isCommitted: boolean
  onPreview: () => void
  onSelect: () => void
}) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-md border p-4"
      style={{ borderColor: isCommitted ? 'var(--primary)' : 'var(--border)', background: 'var(--card)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span className="truncate">{template.name}</span>
            {isDefault && (
              <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                Default
              </Badge>
            )}
          </span>
          <span className="text-xs text-muted-foreground">{template.questionCount} questions</span>
        </div>
        {isCommitted && (
          <span className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: 'var(--primary)' }}>
            <i className="fa-light fa-circle-check text-xs" aria-hidden="true" />
            Currently assigned
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{evaluatesOf(template)}</p>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" size="xs" onClick={onPreview}>
          <i className="fa-light fa-eye text-xs" aria-hidden="true" />
          Preview
        </Button>
        <Button variant="default" size="xs" onClick={onSelect} disabled={isCommitted}>
          {isCommitted ? 'Selected' : 'Select'}
        </Button>
      </div>
    </div>
  )
}

export function TemplatePickerSheet({
  open, onOpenChange, courseCode, templates, committedId, defaultTemplateId, onCommit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  courseCode: string
  templates: PceTemplate[]
  committedId: string
  defaultTemplateId: string
  onCommit: (id: string) => void
}) {
  const [previewedId, setPreviewedId] = useState<string | null>(null)

  return (
    <Sheet open={open} onOpenChange={v => { onOpenChange(v); if (!v) setPreviewedId(null) }}>
      <SheetContent side="right" showOverlay={false} showCloseButton={false}
        className="w-full sm:max-w-[460px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-base">Choose a template for {courseCode}</SheetTitle>
          <SheetDescription className="text-xs">
            {templates.length} published template{templates.length !== 1 ? 's' : ''} available.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-6 py-5 flex flex-col gap-3">
          {templates.map(t => (
            <div key={t.id} className="flex flex-col gap-1.5">
              <GalleryCard
                template={t}
                isDefault={t.id === defaultTemplateId}
                isCommitted={t.id === committedId}
                onPreview={() => setPreviewedId(prev => (prev === t.id ? null : t.id))}
                onSelect={() => onCommit(t.id)}
              />
              {previewedId === t.id && (
                <p className="text-xs text-muted-foreground rounded-md border border-dashed border-border px-3 py-2">
                  <i className="fa-light fa-circle-info me-1.5" aria-hidden="true" />
                  Preview is stubbed on this compare route — in the real wizard this opens {t.name} in the
                  read-only template viewer.
                </p>
              )}
            </div>
          ))}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default function PushStep2TemplatePickerSheetComparePage() {
  const [committedId, setCommittedId] = useState('tmpl1')
  const [sheetOpen, setSheetOpen] = useState(false)
  const { code } = splitCourseLabel(courseLabelOf(OFFERING))
  const committedTemplate = PUBLISHED.find(t => t.id === committedId)!

  return (
    <div className="flex flex-col gap-8 p-6 max-w-[900px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 2 — template picker as a Sheet gallery</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          The rail&rsquo;s compact template card stays exactly as shipped at 280px. &ldquo;Change&rdquo; now opens a
          Sheet instead of expanding a radio list inline into that same 280px column. Not wired into the
          production wizard — real DS components and fixture data (DPT-510, three published templates),
          self-contained state.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold font-heading">Rail column (280px, untouched)</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Same width the real Template column renders at inside the row&rsquo;s <code className="text-xs">layout === &apos;rail&apos;</code> detail
            panel. Click Change.
          </p>
        </div>
        <div style={{ width: 280 }}>
          <span className="text-xs font-medium text-muted-foreground">Template</span>
          <div className="pt-1.5">
            <RailTemplateCard
              template={committedTemplate}
              isDefault={committedTemplate.id === DEFAULT_TEMPLATE_ID}
              onChange={() => setSheetOpen(true)}
            />
          </div>
        </div>
      </section>

      <TemplatePickerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        courseCode={code}
        templates={PUBLISHED}
        committedId={committedId}
        defaultTemplateId={DEFAULT_TEMPLATE_ID}
        onCommit={id => { setCommittedId(id); setSheetOpen(false) }}
      />
    </div>
  )
}
