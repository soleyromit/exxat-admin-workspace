'use client'

// COMPARE ROUTE (throwaway — same lifecycle as /compare/push-step2-template-switch
// and its siblings, delete once a direction is picked).
//
// 2026-08-05 — a THIRD angle on the shipped `TemplateControl`
// (step-survey-instances.tsx:905-1007) radio-block list. Round 1
// (component-consistency badge fix, :970-977) moved the Default badge off
// the title line. Round 2 (/compare/push-step2-template-picker-compact-list)
// stayed with a stacked list but stripped every row down to one dense line.
// Both rounds still stack N options vertically in the 280px rail, so name
// length is always fighting the column width for SOME row, even after the
// badge/icon fixes.
//
// This route asks a different question: does the admin need to see every
// template at once, or is browsing one candidate at a time actually fine at
// this width? A compact horizontal ToggleGroup up top — one short-label
// segment per template — replaces the vertical stack entirely. Exactly ONE
// detail card renders below it, showing the browsed segment's full info at
// FULL card width (no sibling row competing for space, so the name never
// truncates regardless of length). Clicking a different segment swaps the
// card's content instead of scrolling/scanning a list.
//
// Control choice: ToggleGroup, not Tabs. This workspace's DS notes flag
// ToggleGroup as "normally an icon-only segmented toolbar," but THIS
// codebase already runs it with short text labels at comparable width three
// times over — term-workspace.tsx ("Table"/"Board"), analytics/page.tsx
// ("Term"/"Cohort"), and step-survey-instances.tsx itself
// ("All"/"Needs attention"/"Blocked", :1723-1740). `size="sm"` renders at
// text-xs/h-7 (toggle.tsx), so three short labels fit inside 280px with
// room to spare — verified against the vendored toggle.tsx source, not
// memory. Tabs/TabsList was the fallback if that hadn't held, but it didn't
// need to: ToggleGroup keeps the exact same primitive this file already
// uses one section up for filtering, so a reviewer sees one segmented-
// control vocabulary in the file, not two.
//
// Browsing vs. committing are kept explicit and separate, not conflated:
// the segmented control only changes which template's info is DISPLAYED
// (`browsedId`); the detail card's "Select" button is the actual commit
// (`committedId`). Segments for the currently-assigned template carry a
// small filled dot so the admin can still tell what's assigned while
// browsing candidates that aren't. Real fixture data (MOCK_TEMPLATES /
// DPT-510, same co13 fixture as the sibling compare routes), real DS
// components throughout (ToggleGroup/ToggleGroupItem, Card, Badge, Button,
// Tip) — no new component introduced.

import { useState } from 'react'
import {
  ToggleGroup, ToggleGroupItem, Card, CardContent, Badge, Button, Tip,
} from '@exxatdesignux/ui'
import { MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, SECTION_LABELS, type PceTemplate } from '@/lib/pce-mock-data'

const OFFERING = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co13')! // DPT-510
// Same scoping the real push wizard applies (surveys/push/page.tsx:159-165) —
// `status === 'active'` alone also pulls in `tmpl-gen1` ("Alumni Outcomes
// Survey", surveyType: 'programmatic'), which never appears in the course-
// evaluation Step 2 rail this route is comparing against.
const PUBLISHED = MOCK_TEMPLATES.filter(
  t => t.status === 'active' && (!t.surveyType || t.surveyType === 'course_evaluation'),
)
const DEFAULT_TEMPLATE_ID = PUBLISHED.find(t => t.isDefaultForType)?.id ?? PUBLISHED[0].id

// First word (or the most distinctive word, when the literal first word is
// generic across templates — e.g. every PT template starts "Faculty…" or
// "Comprehensive…") — short enough that 3 segments sit comfortably in 280px
// at ToggleGroup's size="sm" (text-xs, toggle.tsx). Full name always
// available via the Tip + aria-label on the segment itself.
const SHORT_LABEL: Record<string, string> = {
  tmpl1: 'End-of-Term',
  tmpl2: 'Midterm',
  tmplrich: 'Comprehensive',
}

function evaluatesLine(t: PceTemplate) {
  return t.sections.map(s => SECTION_LABELS[s]).join(', ')
}

// ── Segmented picker + single detail card ─────────────────────────────────
export function SegmentedTemplatePicker({
  templates, committedId, defaultTemplateId, onCommit, onPreview,
}: {
  templates: PceTemplate[]
  committedId: string
  defaultTemplateId: string
  onCommit: (id: string) => void
  onPreview: (t: PceTemplate) => void
}) {
  const [browsedId, setBrowsedId] = useState(committedId)
  const browsed = templates.find(t => t.id === browsedId) ?? templates[0]
  const isBrowsedCommitted = browsed.id === committedId
  const isBrowsedDefault = browsed.id === defaultTemplateId

  return (
    <div className="flex flex-col gap-2.5">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={browsedId}
        onValueChange={v => v && setBrowsedId(v)}
        className="w-full"
        aria-label={`Browse templates for ${OFFERING.id.toUpperCase()}`}
      >
        {templates.map(t => {
          const isCommitted = t.id === committedId
          return (
            <Tip key={t.id} label={t.name} side="top">
              <ToggleGroupItem
                value={t.id}
                className="min-w-0 flex-1"
                aria-label={`${t.name}${isCommitted ? ' — currently assigned' : ''}`}
              >
                {isCommitted && (
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--brand-color)' }}
                    aria-hidden="true"
                  />
                )}
                <span className="truncate">{SHORT_LABEL[t.id] ?? t.name}</span>
              </ToggleGroupItem>
            </Tip>
          )
        })}
      </ToggleGroup>

      <Card>
        <CardContent className="flex flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium leading-snug">{browsed.name}</span>
            {isBrowsedCommitted && (
              <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                Assigned
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground tabular-nums">
              {browsed.questionCount} question{browsed.questionCount !== 1 ? 's' : ''}
            </span>
            {isBrowsedDefault && (
              <Badge variant="outline" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                Default
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Evaluates: {evaluatesLine(browsed)}
          </p>

          <div className="flex items-center gap-1.5 pt-0.5">
            <Button variant="outline" size="xs" onClick={() => onPreview(browsed)}>
              <i className="fa-light fa-eye text-xs" aria-hidden="true" />
              Preview
            </Button>
            {isBrowsedCommitted ? (
              <span className="text-xs text-muted-foreground px-1">Currently assigned</span>
            ) : (
              <Button variant="default" size="xs" onClick={() => onCommit(browsed.id)}>
                Select
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PushStep2TemplatePickerSegmentedComparePage() {
  const [committedId, setCommittedId] = useState(DEFAULT_TEMPLATE_ID)
  const [previewed, setPreviewed] = useState<PceTemplate | null>(null)

  const committed = PUBLISHED.find(t => t.id === committedId)!

  return (
    <div className="flex flex-col gap-8 p-6 max-w-[900px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">
          Step 2 — TemplateControl, segmented control + single detail card
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Replaces the shipped vertical radio-block list in <code className="text-xs">TemplateControl</code> with
          a horizontal ToggleGroup (one segment per template) above ONE detail card that shows whichever segment
          is currently browsed. Rendered at the real 280px rail width.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold font-heading">280px rail — real fixture data</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {OFFERING.id.toUpperCase()} · DPT-510 · Musculoskeletal Physical Therapy I, three published templates
            (End-of-Term Evaluation 8q · Default, Faculty Midterm Check-In 3q, Comprehensive Course Evaluation
            20q). Currently assigned: <span className="font-medium text-foreground">{committed.name}</span>.
          </p>
        </div>
        <div style={{ width: 280 }}>
          <SegmentedTemplatePicker
            templates={PUBLISHED}
            committedId={committedId}
            defaultTemplateId={DEFAULT_TEMPLATE_ID}
            onCommit={setCommittedId}
            onPreview={setPreviewed}
          />
        </div>
        {previewed && (
          <p className="text-xs text-muted-foreground">
            Last previewed: <span className="font-medium text-foreground">{previewed.name}</span>
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2 border-t border-dashed border-border pt-4">
        <h2 className="text-sm font-semibold font-heading">What this trades away</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          No per-row crowding is possible anymore — the detail card is always full-width, so a name of any
          length has the room it needs. The real cost is comparison: the compact-list and radio-block variants
          both keep every question count and Default tag on screen together, so an admin can eyeball "8q vs. 3q
          vs. 20q" in one glance before picking. Here that comparison requires clicking through all three
          segments and holding the numbers in memory — a real cost once a program has 5+ templates instead of 3,
          or when the decision genuinely hinges on comparing counts/criteria across candidates rather than just
          confirming one already-known choice. The committed-segment dot mitigates losing track of what's
          assigned while browsing, but it doesn't solve side-by-side comparison.
        </p>
      </section>
    </div>
  )
}
