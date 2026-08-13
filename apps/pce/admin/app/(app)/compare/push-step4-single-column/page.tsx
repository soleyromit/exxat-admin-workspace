'use client'

// COMPARE ROUTE (throwaway — same lifecycle as /compare/push-step2-* and
// /compare/push-step3-* siblings, delete once a direction is picked).
//
// 2026-08-12 — Step 4 "Review" variant: SINGLE COLUMN, NO RAIL.
//
// The shipped step (components/pce/distribute-wizard/step-review.tsx) is a
// two-column layout: the pre-flight checklist beside a PERSISTENT email-
// preview rail. This variant drops the split entirely:
//
//   · Full-width single column — each section is a Card spanning the page.
//     Analogy: Zillow's lease-review screen and GoFundMe's fundraiser-review
//     screen (stacked review sections, edit affordance per section, no side
//     panel).
//   · The Survey design course table (Course | Type | Window | Students |
//     Evaluates) gets the freed-up width — no column truncates; Evaluates
//     shows full role names comfortably.
//   · The email preview is an EXPAND-IN-PLACE disclosure inside "Schedule &
//     email": collapsed, the row reads "Formal Invite · edited"; a "Preview
//     email" Collapsible trigger expands the same From/Subject/body card the
//     rail used to show, inline, pushing content below it down.
//   · Submit footer stays full-width at the bottom, unchanged anatomy.
//
// Revision history on this route:
//   · a11y/DS pass (same day): headlineShown gate ported from step-review.tsx
//     (never restate the dispatch sentence), single Radix trigger, zero-
//     enrollment surfaced, off-grid spacing/token fixes.
//   · Senior-designer critique (same day, live-measured): per-course
//     Evaluates roles via CRITERION_BY_TYPE (the sibling refine-current's
//     evaluatedRolesOf — the template-wildcard fallthrough had produced one
//     identical string on all 14 rows); content-proportioned table grid;
//     zero-enrollment moved from an inline cell into the acknowledgement
//     list; email preview capped at 600px (real client width) and aligned
//     under its row; 16px section titles; the ack box on a muted surface
//     with one shared left edge; Recipients card deleted (one real value —
//     folded into the headline); reminder cadence resolved to real dates;
//     duplicate "From" line removed; DS Card header slots.
//
// Real fixture, self-contained: MOCK_COURSE_OFFERINGS scoped to Fall 2026
// (pt5, 14 offerings — the exact term the real push wizard defaults to),
// per-course evaluated roles resolved from CRITERION_BY_TYPE against the
// people who actually exist on each offering, the real global window
// (Dec 4–18, 2026) with one per-course override (co13), and the real
// "Formal Invite" / "Formal Reminder" EVAL_EMAIL_TEMPLATES.

import { useMemo, useState } from 'react'
import {
  Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle,
  Checkbox, Collapsible, CollapsibleContent, CollapsibleTrigger, LocalBanner,
  ToggleGroup, ToggleGroupItem,
} from '@exxatdesignux/ui'
import {
  MOCK_COURSE_OFFERINGS, EVAL_EMAIL_TEMPLATES,
  COURSE_TYPE_FULL_LABEL, deliveryModeOf,
  type CourseOffering,
} from '@/lib/pce-mock-data'
import { courseLabelOf, CRITERION_BY_TYPE } from '@/lib/pce-course-readiness'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING,
} from '@/lib/list-status-badges'

// ── Fixture (mirrors the real wizard's derivations, frozen) ──────────────────

const OFFERINGS = MOCK_COURSE_OFFERINGS.filter(o => o.termId === 'pt5' && o.status !== 'archived')
const GLOBAL_OPEN = new Date(2026, 11, 4)
const GLOBAL_CLOSE = new Date(2026, 11, 18)
/** One per-course window override, same course the step-3 compare route uses. */
const WINDOW_OVERRIDES: Record<string, { openDate: Date; closeDate: Date }> = {
  co13: { openDate: new Date(2026, 11, 1), closeDate: new Date(2026, 11, 15) },
}

function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

/** Evaluated roles per course — ported from the refine-current sibling's
 *  evaluatedRolesOf. CRITERION_BY_TYPE resolves 'instructor' / 'coordinator'
 *  to their type-aware labels (CB → Instructor + Coordinator, LB → Lab
 *  Instructor, PB → Placement Faculty + Clinical Coordinator) and a role is
 *  only listed when that person actually exists on the offering — so real
 *  faculty gaps thin some rows. 'Course material' leads every list: the
 *  push's template opens with a Course Content section. (The prior
 *  template-wildcard derivation fell through 'any' to one template for every
 *  offering and rendered the identical string on all 14 rows.) */
function evaluatedRolesOf(o: CourseOffering): string[] {
  const spec = CRITERION_BY_TYPE[deliveryModeOf(o)]
  const labels: string[] = ['Course material']
  for (const c of ['instructor', 'coordinator'] as const) {
    const resolver = spec[c]
    if (resolver && resolver.resolve(o) != null) labels.push(resolver.label)
  }
  return labels
}

interface ReviewRow {
  offeringId: string
  code: string
  name: string
  courseTypeLabel: string
  openDate: Date
  closeDate: Date
  hasCustomWindow: boolean
  studentCount: number
  evaluatedRoleLabels: string[]
}

const COURSE_ROWS: ReviewRow[] = OFFERINGS.map(o => {
  const { code, name } = splitLabel(o)
  const override = WINDOW_OVERRIDES[o.id]
  return {
    offeringId: o.id,
    code,
    name,
    courseTypeLabel: COURSE_TYPE_FULL_LABEL[deliveryModeOf(o)],
    openDate: override?.openDate ?? GLOBAL_OPEN,
    closeDate: override?.closeDate ?? GLOBAL_CLOSE,
    hasCustomWindow: !!override,
    studentCount: o.enrolledCount,
    evaluatedRoleLabels: evaluatedRolesOf(o),
  }
})

const STUDENT_TOTAL = COURSE_ROWS.reduce((sum, r) => sum + r.studentCount, 0)
const OVERRIDE_COUNT = Object.keys(WINDOW_OVERRIDES).length
const ZERO_STUDENT_ROWS = COURSE_ROWS.filter(r => r.studentCount === 0)
const ZERO_STUDENT_COUNT = ZERO_STUDENT_ROWS.length
const ZERO_STUDENT_ISSUES_LABEL = ZERO_STUDENT_ROWS.map(r => `${r.code} – ${r.name}`).join(' and ')
const TERM_NAME = 'Fall 2026'
const ACADEMIC_YEAR = '2026–2027'
const SENDER_NAME = 'DPT Program · Exxat Surveys'

const INVITE_TEMPLATE = EVAL_EMAIL_TEMPLATES.find(t => t.id === 'tpl-invite-formal')!
const REMINDER_TEMPLATE = EVAL_EMAIL_TEMPLATES.find(t => t.id === 'tpl-reminder-formal')!
/** The admin tweaked the invite body in step 3 — drives the "· edited" tag. */
const EDITED_INVITE_BODY = INVITE_TEMPLATE.body.replace(
  'Your answers are anonymous.',
  'Your answers are anonymous and results are only shared in aggregate.'
)

/** Reminder cadence resolved to the actual send dates (refine-current's
 *  treatment) — a bare "7, 3 days before close" makes the reader do the math. */
const REMINDER_DAYS_BEFORE = [7, 3]
const REMINDER_DATES = REMINDER_DAYS_BEFORE.map(days => {
  const d = new Date(GLOBAL_CLOSE)
  d.setDate(d.getDate() - days)
  return d
})

/** Courses that ended >2 weeks before the survey opens. Named explicitly in
 *  one banner sentence rather than color-coded on their table row — a
 *  reader shouldn't have to spot two amber rows in a 14-row list or decode
 *  a symbol against a legend to know what's wrong. */
const WINDOW_ISSUES = COURSE_ROWS.slice(0, 2).map(r => ({
  id: r.offeringId,
  courseLabel: `${r.code} – ${r.name}`,
  reason: 'ended Oct 16, 7 weeks before the survey opens',
}))

const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

function resolveMerge(text: string): string {
  return text
    .replace(/\{\{student_first_name\}\}/g, 'Alex')
    .replace(/\{\{course_name\}\}/g, COURSE_ROWS[0]?.code ?? 'your course')
    .replace(/\{\{term_name\}\}/g, TERM_NAME)
    .replace(/\{\{close_date\}\}/g, fmtShort(GLOBAL_CLOSE))
    .replace(/\{\{days_until_close\}\}/g, '3')
    .replace(/\{\{s\}\}/g, 's')
    .replace(/\{\{program_name\}\}/g, SENDER_NAME)
    .replace(/\{\{survey_link\}\}/g, '[ Open survey ]')
}

// ── Section shell — DS Card slots (header divider for free), GoFundMe/Zillow
// review-section shape. Title at text-base: the one typographic landmark on a
// long scrolling page — everything else on the page is 14px and below. ───────

function ReviewSection({
  state, title, summary, children,
}: {
  state: 'ready' | 'warning'
  title: string
  /** One-line under the title — what this section resolved to. */
  summary: string
  children?: React.ReactNode
}) {
  const status = state === 'ready'
    ? { tint: LIST_HUB_STATUS_TINT_SUCCESS, icon: 'fa-circle-check', label: 'Ready' }
    : { tint: LIST_HUB_STATUS_TINT_WARNING, icon: 'fa-circle-exclamation', label: 'Needs acknowledgement' }
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold min-w-0 truncate">{title}</CardTitle>
        <CardDescription>{summary}</CardDescription>
        <CardAction className="flex items-center gap-4">
          <ListHubStatusBadge label={status.label} tint={status.tint} icon={status.icon} />
          <Button variant="ghost" size="icon-xs" aria-label={`Edit ${title}`} title={`Edit ${title}`}>
            <i className="fa-light fa-pen-to-square" aria-hidden="true" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {children}
      </CardContent>
    </Card>
  )
}

function LabeledRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-xs shrink-0 w-24" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

// Content-proportioned grid (live-measured): Course is the only column with
// real variance and gets the room (no more wrapping on 10 of 14 rows); Type /
// Window / Students shrink to what their content needs; Evaluates flexes for
// the role lists. Columns are fixed tracks so every row aligns identically.
// Course's 330px floor covers the longest code+name in the fixture measured
// single-line (324px) — below that the cell wraps at narrow viewports even
// though the fr max would stretch on wide ones; the overflow-x scroll absorbs
// small windows instead.
const COURSE_TABLE_GRID = 'minmax(330px,1.6fr) 64px 92px 50px minmax(177px,1fr)'
/** Sum of column minimums + 4 gaps — the overflow container's floor. */
const COURSE_TABLE_MIN_WIDTH = 330 + 64 + 92 + 50 + 177 + 4 * 12

/** LabeledRow's value-column indent (label w-24 = 96px + gap-3 = 12px) — the
 *  single content left edge everything in a section aligns to, including the
 *  expanded email preview. */
const VALUE_COLUMN_INDENT = 108

export default function PushStep4SingleColumnComparePage() {
  const [ackWindow, setAckWindow] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'invitation' | 'reminder'>('invitation')
  const [testSent, setTestSent] = useState(false)

  const preview = useMemo(() => (
    previewMode === 'invitation'
      ? { subject: INVITE_TEMPLATE.subject, body: EDITED_INVITE_BODY }
      : { subject: REMINDER_TEMPLATE.subject, body: REMINDER_TEMPLATE.body }
  ), [previewMode])

  const allReady = ackWindow
  // The flag lives on Survey design's own rows (Window column), so the
  // warning badge belongs to that section, not Schedule & email — which has
  // nothing wrong with it and should read as Ready regardless.
  const surveyDesignState: 'ready' | 'warning' = ackWindow ? 'ready' : 'warning'

  // Ported from step-review.tsx's `headlineShown` gate (Aug-12 reviewer call:
  // never restate what the dispatch sentence already says). While the headline
  // states the audience count, dates, and anonymity, the Schedule "Window" row
  // stays suppressed — it only surfaces when the headline is silent.
  const headlineShown = STUDENT_TOTAL > 0 && !!GLOBAL_OPEN && !!GLOBAL_CLOSE

  return (
    <div className="flex flex-col gap-6 p-6 pb-10 mx-auto w-full" style={{ maxWidth: 1040 }}>
      {/* ── Compare-route framing ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 4 — Review, single column (no rail)</h1>
        <p className="text-sm max-w-3xl" style={{ color: 'var(--muted-foreground)' }}>
          The shipped review keeps a persistent email rail beside the checklist. Here the rail is gone:
          full-width sections (Zillow lease review / GoFundMe fundraiser review shape), the course table
          takes the recovered width so no column truncates, and the email preview expands in place inside
          Schedule &amp; email. Real fixture — {TERM_NAME} · pt5, {OFFERINGS.length} courses.
        </p>
      </div>

      {/* ── Headline — same two-line grammar as the shipped step. Audience,
           dates, and anonymity are stated HERE, once; the sections below never
           restate them (headlineShown gate). The former Recipients card held
           exactly one value ("Anonymous") — folded in here, card deleted. ── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold font-heading">
          {TERM_NAME}
          <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}> · {ACADEMIC_YEAR}</span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Sending to <span className="font-medium" style={{ color: 'var(--foreground)' }}>{STUDENT_TOTAL} students</span>
          {' '}across <span className="font-medium" style={{ color: 'var(--foreground)' }}>{OFFERINGS.length} courses</span>
          {' '}· opens <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmtShort(GLOBAL_OPEN)}</span>
          {' '}· closes <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmtShort(GLOBAL_CLOSE)}</span>
          {' '}· responses <span className="font-medium" style={{ color: 'var(--foreground)' }}>
            <i className="fa-light fa-shield-check text-xs" aria-hidden="true" /> anonymous
          </span>
        </p>
      </div>

      {/* ── 1 · Survey design — the course table gets the full page width ── */}
      <ReviewSection
        state={surveyDesignState}
        title="Survey design"
        summary="One evaluation per course; roles evaluated come from each course's assigned template."
      >
        {/* One consistent labeling rule down the page: key/value pairs carry
            their label BESIDE them (LabeledRow); full-width content blocks
            like this table carry it ABOVE — a beside-gutter here cost 108px
            and pushed Evaluates (the money column) into horizontal overflow
            at laptop widths. */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Courses</span>
          <div className="overflow-x-auto">
            <div style={{ minWidth: COURSE_TABLE_MIN_WIDTH }}>
              <div
                className="grid gap-3 pb-2 border-b border-border text-xs font-medium"
                style={{ gridTemplateColumns: COURSE_TABLE_GRID, color: 'var(--muted-foreground)' }}
              >
                <span>Course</span>
                <span>Type</span>
                <span>Window</span>
                <span>Students</span>
                <span>Evaluates</span>
              </div>
              {COURSE_ROWS.map(row => (
                <div
                  key={row.offeringId}
                  className="grid gap-3 items-center py-2 border-t border-border/60 first:border-t-0 text-sm hover:bg-muted"
                  style={{ gridTemplateColumns: COURSE_TABLE_GRID }}
                >
                  {/* Full width now — nothing here truncates, deliberately. */}
                  <span className="min-w-0">
                    <span className="font-medium">{row.code}</span>
                    <span style={{ color: 'var(--muted-foreground)' }}> · {row.name}</span>
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{row.courseTypeLabel}</span>
                  {/* Plain — no color-coding or symbols to decode against a
                      legend. Every row reads the same; the two issues below
                      are called out explicitly, once, in plain language. */}
                  <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                    {fmtShort(row.openDate)}–{fmtShort(row.closeDate)}
                    {row.hasCustomWindow && <span aria-label="Custom window for this course"> *</span>}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{row.studentCount}</span>
                  {/* The one thing the admin is here to verify — full role
                      names, per course, never clipped. */}
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {row.evaluatedRoleLabels.join(', ')}
                  </span>
                </div>
              ))}
              <p className="text-xs pt-2" style={{ color: 'var(--muted-foreground)' }}>
                * {OVERRIDE_COUNT} course{OVERRIDE_COUNT !== 1 ? 's use' : ' uses'} a custom window (set in Schedule).
              </p>
            </div>
          </div>
        </div>

        {/* Explicit, not encoded — names the exact courses in one sentence
            instead of asking the reader to spot colored rows or decode a
            symbol legend. One banner, one checkbox, one decision. */}
        {WINDOW_ISSUES.length > 0 && (
          <LocalBanner variant="warning" title="Review before sending">
            <div className="flex flex-col gap-2.5">
              <p className="text-sm">
                {WINDOW_ISSUES.map(i => i.courseLabel).join(' and ')} ended over 2 weeks before this survey opens.
                Students would be answering long after class ended, so responses may be less accurate.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox id="ack-window" checked={ackWindow} onCheckedChange={v => setAckWindow(!!v)} />
                <label htmlFor="ack-window" className="text-sm font-medium cursor-pointer">
                  Send anyway
                  <span style={{ color: 'var(--destructive)' }} aria-hidden="true"> *</span>
                  <span className="sr-only"> required</span>
                </label>
              </div>
            </div>
          </LocalBanner>
        )}

        {/* Informational only — no decision, so no banner, no checkbox, just
            the fact stated plainly. */}
        {ZERO_STUDENT_COUNT > 0 && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <i className="fa-light fa-circle-info text-xs" aria-hidden="true" /> {ZERO_STUDENT_ISSUES_LABEL} has no students enrolled, so it won&rsquo;t receive invitations — skipped automatically, no action needed.
          </p>
        )}
      </ReviewSection>

      {/* ── 2 · Schedule & email — preview expands IN PLACE, no side rail ── */}
      <ReviewSection
        state="ready"
        title="Schedule & email"
        summary={`Invitation and reminders from ${SENDER_NAME}.`}
      >
        {/* Dates live in the headline sentence — the Window row only surfaces
            while the headline is silent about them (headlineShown gate, same
            as shipped step-review.tsx). Per-course overrides are already the
            table footnote's job. */}
        {!headlineShown && (
          <LabeledRow label="Window">
            {fmtShort(GLOBAL_OPEN)} – {fmtShort(GLOBAL_CLOSE)}
          </LabeledRow>
        )}
        {/* Expand-in-place disclosure — replaces the shipped persistent rail.
            One trigger, one Tab stop: the visible Button IS the Radix trigger
            (CollapsibleTrigger asChild — the app-sidebar.tsx precedent), so
            Radix owns open state, aria-expanded, and aria-controls. Collapsed,
            the row reads exactly like today's; expanded, the same From/
            Subject/body card renders inline and pushes the section down. */}
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <LabeledRow label="Email">
            <span className="flex items-center gap-3 flex-wrap">
              <span>
                {INVITE_TEMPLATE.name}
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}> · edited</span>
              </span>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="xs">
                  <i className={`fa-light ${previewOpen ? 'fa-chevron-up' : 'fa-envelope-open-text'} text-xs`} aria-hidden="true" />
                  {previewOpen ? 'Hide preview' : 'Preview email'}
                </Button>
              </CollapsibleTrigger>
            </span>
          </LabeledRow>
          <CollapsibleContent>
            {/* Aligned under the value column of the row that triggered it,
                and capped at 600px — the width a real email client renders
                at. Toggle + test button read as one control cluster. */}
            <div
              className="flex flex-col gap-2.5 pt-2.5 pb-1"
              style={{ paddingInlineStart: VALUE_COLUMN_INDENT, maxWidth: VALUE_COLUMN_INDENT + 600 }}
            >
              <div className="flex items-center gap-3">
                {/* DS gap flagged (not locally overridden): Toggle/ToggleGroup
                    ship only default|outline variants — the outline active
                    state is brand-tinted, which spends the page's most
                    saturated color on a preview-mode switch while the primary
                    CTA sits disabled. A neutral active variant is a DS
                    request, not a product-side style override. */}
                <ToggleGroup
                  type="single"
                  value={previewMode}
                  onValueChange={v => { if (v) setPreviewMode(v as 'invitation' | 'reminder') }}
                  variant="outline"
                  size="sm"
                  aria-label="Email preview type"
                >
                  <ToggleGroupItem value="invitation">Invitation</ToggleGroupItem>
                  <ToggleGroupItem value="reminder">Reminder</ToggleGroupItem>
                </ToggleGroup>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setTestSent(true)}
                  disabled={testSent}
                >
                  {testSent ? (
                    <>
                      <i className="fa-solid fa-circle-check text-xs" aria-hidden="true" style={{ color: 'var(--qb-status-saved-fg)' }} />
                      Test sent to you
                    </>
                  ) : 'Send test to me'}
                </Button>
              </div>
              <div className="rounded-md border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
                <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>From {SENDER_NAME}</p>
                  <p className="text-sm font-medium">{resolveMerge(preview.subject)}</p>
                </div>
                <div style={{ padding: 12, maxHeight: 320, overflowY: 'auto' }}>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)', lineHeight: 1.55 }}>
                    {resolveMerge(preview.body)}
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Cadence resolved to the actual send dates (refine-current's
            treatment) — the offsets stay as the muted explainer. "From" is
            already the section summary's job; no row restates it. */}
        <LabeledRow label="Reminders">
          Same as invitation
          <span style={{ color: 'var(--muted-foreground)' }}>
            {' '}· sends {REMINDER_DATES.map(fmtShort).join(' and ')} ({REMINDER_DAYS_BEFORE.join(' and ')} days before close)
          </span>
        </LabeledRow>
      </ReviewSection>

      {/* ── Footer — full-width, unchanged anatomy ── */}
      <div className="sticky bottom-0 bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <div className="flex items-center gap-4 min-w-0">
          {!allReady && (
            <p className="text-xs flex items-center gap-1.5 min-w-0" style={{ color: 'var(--insight-severity-warning-fg)' }}>
              <i className="fa-light fa-circle-exclamation text-xs" aria-hidden="true" />
              <span className="truncate">Acknowledge the flagged warnings above to continue.</span>
            </p>
          )}
          <Button variant="default" size="sm" className="shrink-0" disabled={!allReady}>
            Set up Evaluations · {STUDENT_TOTAL} students
          </Button>
        </div>
      </div>
    </div>
  )
}
