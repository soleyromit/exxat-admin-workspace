'use client'

// COMPARE ROUTE (throwaway — same lifecycle as /compare/push-step2-* and
// /compare/push-step3-* siblings, delete once a direction is picked).
//
// 2026-08-12 — Step 4 "Review" variant: REFINE CURRENT. Keeps the shipped
// step-review.tsx architecture exactly (pre-flight checklist left, persistent
// email rail right, anchored submit footer) and applies three targeted
// improvements, no structural change:
//
//   (a) FOCUSED COURSE TABLE — (revised 2026-08-12 after a senior-designer
//       critique: the first cut's per-role icons at 10px were indistinguishable
//       silhouettes and their wrapping made row heights ragged 33–68px.)
//       The table now lives full-width under the section title (no 108px
//       "Courses" label gutter), drops the Type column (the role set implies
//       it), hoists the on-every-row facts ("Course material", the shared
//       window) into one summary sentence, and prints roles as plain text.
//       Only the two exception windows print dates; everything else is "—" —
//       the anomaly is the ink, not the default.
//   (b) PREVIEW SURVEY — the Survey design section gains a "Preview survey"
//       action beside its edit pencil that opens the REAL SurveyPreviewDialog
//       (labeled rating pills + open-text textarea) against the template this
//       push uses — the reviewer's "preview should actually open fast" ask,
//       now reachable from the last screen too, not only from step 2.
//   (c) RESOLVED REMINDERS — the dense "Formal Reminder · 14, 11, 8, 5, 2 days
//       before close" line resolves into the actual send DATES on two quiet
//       lines ("Dec 7, Dec 10, Dec 13, Dec 16 · from the Dec 18 close") — the
//       admin verifies dates, not math. Sends on/before the survey's own open
//       date are dropped. (The first cut's settings-style labeled sub-fields
//       out-shouted the section heading — collapsed per the same critique.)
//
// Real fixture throughout: MOCK_COURSE_OFFERINGS scoped to Fall 2026 · pt5
// (14 offerings, the term the real push wizard defaults to), evaluated roles
// derived per course from CRITERION_BY_TYPE via deliveryModeOf (so CB courses
// read Instructor + Coordinator, PB courses Placement Faculty + Clinical
// Coordinator, with real faculty gaps thinning some rows), MOCK_TEMPLATES[0]
// ('End-of-Term Evaluation') for the survey preview, and the real
// EVAL_EMAIL_TEMPLATES + EVAL_REMINDER_CADENCE fixtures for the email rail.

import { useMemo, useState } from 'react'
import { Button, ToggleGroup, ToggleGroupItem } from '@exxatdesignux/ui'
import {
  MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, EVAL_EMAIL_TEMPLATES, EVAL_REMINDER_CADENCE,
  deliveryModeOf, type CourseOffering,
} from '@/lib/pce-mock-data'
import { courseLabelOf, CRITERION_BY_TYPE } from '@/lib/pce-course-readiness'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'

// ── Fixture — same slice the real wizard defaults to ─────────────────────────
const OFFERINGS = MOCK_COURSE_OFFERINGS.filter(o => o.termId === 'pt5' && o.status !== 'archived')
const GLOBAL_OPEN = new Date(2026, 11, 4)
const GLOBAL_CLOSE = new Date(2026, 11, 18)
const TEMPLATE = MOCK_TEMPLATES[0] // 'End-of-Term Evaluation' — the push's survey
const INVITE = EVAL_EMAIL_TEMPLATES.find(t => t.id === 'tpl-invite-formal')!
const REMINDER = EVAL_EMAIL_TEMPLATES.find(t => t.id === 'tpl-reminder-formal')!

// Per-course window overrides — same two courses every push-step3 compare
// fixture customizes (co13 / co17), so the Window column exercises both states.
const WINDOW_OVERRIDES: Record<string, { open: Date; close: Date }> = {
  co13: { open: new Date(2026, 11, 1), close: new Date(2026, 11, 15) },
  co17: { open: new Date(2026, 11, 8), close: new Date(2026, 11, 22) },
}

const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

/** Evaluated FACULTY roles per course, derived from the real delivery-mode
 *  logic: CRITERION_BY_TYPE resolves 'instructor' / 'coordinator' to their
 *  type-aware labels (CB → Instructor + Coordinator, LB → Lab Instructor,
 *  PB → Placement Faculty + Clinical Coordinator) and only includes a role
 *  when the person actually exists on the offering — real faculty gaps thin
 *  some rows. 'Course material' is NOT repeated per row: every course
 *  evaluates it (tmpl1 opens with a Course Content section), so it lives in
 *  the section's one-line summary instead. */
function evaluatedRolesOf(o: CourseOffering): string[] {
  const spec = CRITERION_BY_TYPE[deliveryModeOf(o)]
  const labels: string[] = []
  for (const c of ['instructor', 'coordinator'] as const) {
    const resolver = spec[c]
    if (resolver && resolver.resolve(o) != null) labels.push(resolver.label)
  }
  return labels
}

interface ReviewRow {
  offering: CourseOffering
  code: string
  name: string
  open: Date
  close: Date
  hasCustomWindow: boolean
  students: number
  roles: string[]
}

const ROWS: ReviewRow[] = OFFERINGS.map(o => {
  const { code, name } = splitLabel(o)
  const ov = WINDOW_OVERRIDES[o.id]
  return {
    offering: o,
    code,
    name,
    open: ov?.open ?? GLOBAL_OPEN,
    close: ov?.close ?? GLOBAL_CLOSE,
    hasCustomWindow: !!ov,
    students: o.enrolledCount,
    roles: evaluatedRolesOf(o),
  }
})

const STUDENT_TOTAL = ROWS.reduce((n, r) => n + r.students, 0)
// +1 per course = the course-material evaluation every offering runs.
const INSTANCE_TOTAL = ROWS.reduce((n, r) => n + r.roles.length + 1, 0)
const ZERO_STUDENT_COURSES = ROWS.filter(r => r.students === 0).length

// ── (c) Reminder cadence resolved to real send dates ─────────────────────────
// EVAL_REMINDER_CADENCE: every 3 days, anchored to survey close, starting 14
// days before → offsets 14, 11, 8, 5, 2 (the exact digits the shipped line
// showed bare). Each offset resolves to its actual calendar date; sends that
// land on or before the survey's own open date are dropped — a reminder
// firing on day zero, before anyone could have responded, is noise.
const REMINDER_OFFSETS: number[] = (() => {
  const out: number[] = []
  for (let d = EVAL_REMINDER_CADENCE.startDaysBefore; d > 0; d -= 3) out.push(d)
  return out
})()
const REMINDER_DATES = REMINDER_OFFSETS
  .map(days => {
    const d = new Date(GLOBAL_CLOSE)
    d.setDate(d.getDate() - days)
    return d
  })
  .filter(d => d.getTime() > GLOBAL_OPEN.getTime())

// Course · Window · Students · Evaluates — full-width under the section title
// (no rows-prop label gutter), Type dropped (the role set implies it), Window
// a narrow mostly-"—" column since only exceptions print dates. Course /
// Students / Evaluates tracks per the 2026-08-12 senior-critique targets.
const COURSE_TABLE_GRID = `minmax(200px,1.5fr) 96px 56px minmax(190px,1.3fr)`

// ── Checklist section (same anatomy as the shipped Section) ──────────────────
function Section({
  title, headerActions, rows, children,
}: {
  title: string
  /** Extra actions on the header's right axis, beside the edit affordance. */
  headerActions?: React.ReactNode
  rows: [string, React.ReactNode][]
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border py-4">
      {/* No always-green "Ready" badge — a decorative all-clear signal that
          never changes state was the loudest color on the page (2026-08-12
          senior critique); readiness only earns ink when it's an exception. */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold min-w-0 truncate">{title}</h3>
        <div className="flex items-center gap-4 shrink-0">
          {headerActions}
          {/* Inert by design — this throwaway compare route has no wizard
              steps to navigate back to; disabled + title says so. */}
          <Button variant="ghost" size="icon-xs" aria-label={`Edit ${title}`} disabled title="Not wired in this exploration">
            <i className="fa-light fa-pen-to-square" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-3 text-sm">
            <span className="text-xs shrink-0 w-24" style={{ color: 'var(--muted-foreground)' }}>{k}</span>
            <span className="min-w-0 flex-1">{v}</span>
          </div>
        ))}
        {children}
      </div>
    </div>
  )
}

export default function PushStep4RefineCurrentComparePage() {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'invitation' | 'reminder'>('invitation')
  const [testSent, setTestSent] = useState(false)

  function resolveMerge(text: string): string {
    return text
      .replace(/\{\{student_first_name\}\}/g, 'Alex')
      .replace(/\{\{course_name\}\}/g, ROWS[0]?.code ?? 'your course')
      .replace(/\{\{term_name\}\}/g, 'Fall 2026')
      .replace(/\{\{close_date\}\}/g, fmt(GLOBAL_CLOSE))
      .replace(/\{\{days_until_close\}\}/g, '3')
      .replace(/\{\{s\}\}/g, 's')
      .replace(/\{\{program_name\}\}/g, 'your program')
      .replace(/\{\{survey_link\}\}/g, '[ Open survey ]')
  }
  const preview = useMemo(
    () => (previewMode === 'reminder' ? REMINDER : INVITE),
    [previewMode],
  )
  const muted = (s: string) => <span className="text-muted-foreground">{s}</span>

  return (
    /* w-full matters: the (app) layout's <main> is a flex column, and mx-auto
       alone disables flex stretch — the wrapper then sizes to fit-content
       (capped at 1120px) and overflows narrow windows. w-full pins it to the
       main's width, capped by max-w. */
    <div className="flex flex-col gap-4 p-6 w-full max-w-[1120px] mx-auto min-h-screen">
      {/* ── Variant framing ── */}
      <div className="flex flex-col gap-1 pb-2">
        <h1 className="text-xl font-semibold font-heading">Step 4 — Review · Refine current</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Same architecture as the shipped <code className="text-xs">step-review.tsx</code> (checklist + email rail +
          anchored footer), refined: a full-width course table where only exceptions get ink (override windows,
          zero-enrollment counts), a &ldquo;Preview survey&rdquo; action on Survey design, and the reminder cadence
          resolved to its real send dates. Real fixture — Fall 2026 · {ROWS.length} courses.
        </p>
      </div>

      {/* ── Headline + dispatch sentence (unchanged from shipped) ── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold font-heading">
          Fall 2026
          <span className="font-normal text-muted-foreground"> · 2026–2027</span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Creating{' '}
          <span className="font-medium tabular-nums" style={{ color: 'var(--foreground)' }}>
            {INSTANCE_TOTAL} evaluations
          </span>
          {' '}across <span className="font-medium" style={{ color: 'var(--foreground)' }}>{ROWS.length} courses</span>
          {' '}· reaching <span className="font-medium" style={{ color: 'var(--foreground)' }}>{STUDENT_TOTAL} students</span>
          {' '}· opens <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmt(GLOBAL_OPEN)}</span>
          {' '}· closes <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmt(GLOBAL_CLOSE)}</span>
        </p>
      </div>

      {/* ── Checklist + persistent email rail ── */}
      {/* xl, not lg: below ~1280px viewport the checklist + 300px rail can't
          both honor the course table's column minimums — the rail stacks
          below instead of forcing hidden columns. */}
      <div className="flex flex-col xl:flex-row gap-8 flex-1">
        <div className="flex flex-col flex-1 min-w-0">
          {/* Survey design — the table lives in children (full-width under the
              title, no rows-prop label gutter); improvements (a) + (b) here. */}
          <Section
            title="Survey design"
            headerActions={
              /* (b) The real SurveyPreviewDialog, one click from the last
                 screen — link variant so it reads as an action, not a second
                 badge, beside the header's other chrome. */
              <Button variant="link" size="xs" onClick={() => setPreviewOpen(true)}>
                Preview survey
              </Button>
            }
            rows={[]}
          >
            {/* The on-every-row facts stated once, not fourteen times. */}
            <p className="text-xs text-muted-foreground">
              Every course evaluates its course material with {TEMPLATE.name}. Windows follow{' '}
              {fmt(GLOBAL_OPEN)}–{fmt(GLOBAL_CLOSE)} except where shown.
            </p>
            <div>
              <div
                className="grid gap-3 pb-1.5 mb-1 border-b border-border text-xs font-medium text-muted-foreground"
                style={{ gridTemplateColumns: COURSE_TABLE_GRID }}
              >
                <span>Course</span>
                <span>Window</span>
                <span>Students</span>
                <span>Evaluates</span>
              </div>
              {ROWS.map(row => (
                <div
                  key={row.offering.id}
                  className="grid gap-3 items-center py-1.5 border-t border-border/60 first:border-t-0 text-sm"
                  style={{ gridTemplateColumns: COURSE_TABLE_GRID }}
                >
                  <span className="min-w-0 truncate" title={`${row.code} · ${row.name}`}>
                    <span className="font-medium">{row.code}</span>
                    <span className="text-muted-foreground"> · {row.name}</span>
                  </span>
                  {/* (8-inverted) The exception is the ink: only overridden
                      windows print dates; the 12 default rows read "—". */}
                  {row.hasCustomWindow ? (
                    <span className="text-xs font-medium min-w-0 truncate tabular-nums">
                      {fmt(row.open)}–{fmt(row.close)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground" aria-label="Uses the shared survey window">—</span>
                  )}
                  <span
                    className={`text-xs tabular-nums ${row.students === 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                  >
                    {row.students}
                  </span>
                  <span className="text-xs text-muted-foreground min-w-0">
                    {row.roles.length > 0 ? row.roles.join(' · ') : muted('No faculty evaluated')}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Schedule & email — improvement (c) lives here. */}
          <Section
            title="Schedule & email"
            rows={[
              ['Responses', (
                <span className="flex items-center gap-1.5">
                  <i className="fa-light fa-shield-check text-xs" aria-hidden="true" />
                  Anonymous
                </span>
              )],
              ['Email', <span key="e" className="min-w-0 truncate">{INVITE.name}</span>],
              // (c) The cadence resolved into its actual send dates — two
              // quiet lines, review-screen weight (the labeled settings-style
              // sub-fields of the first cut out-shouted the section h3).
              ['Reminders', (
                <span className="flex flex-col gap-0.5">
                  <span>{REMINDER.name} <span className="text-muted-foreground">· {REMINDER_DATES.length} sends</span></span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {REMINDER_DATES.map(fmt).join(', ')} · from the {fmt(GLOBAL_CLOSE)} close
                  </span>
                </span>
              )],
              ['From', 'Exxat Surveys'],
            ]}
          />
        </div>

        {/* ── Email rail — narrowed + sticky so it tracks the longer left
               column instead of leaving dead space below its content ── */}
        <aside
          className="w-full xl:w-[300px] shrink-0 flex flex-col gap-3 border-t border-border pt-4 xl:sticky xl:top-6 self-start"
          aria-label="Email preview"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Email</h3>
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
          </div>
          <div className="rounded-md border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
            <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
              <p className="text-xs text-muted-foreground truncate">From Exxat Surveys</p>
              <p className="text-sm font-medium truncate" title={resolveMerge(preview.subject)}>
                {resolveMerge(preview.subject)}
              </p>
            </div>
            <div style={{ padding: 12, maxHeight: 340, overflowY: 'auto' }}>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)', lineHeight: 1.55 }}>
                {resolveMerge(preview.body)}
              </p>
            </div>
          </div>
          <Button
            variant="link"
            size="sm"
            className="self-start"
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
        </aside>
      </div>

      {/* ── Footer — anchored, same anatomy as every other step ── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <div className="flex items-center gap-4 min-w-0">
          {/* The one real anomaly, stated where the commit happens. */}
          {ZERO_STUDENT_COURSES > 0 && (
            <p className="text-xs flex items-center gap-1.5 min-w-0" style={{ color: 'var(--insight-severity-warning-fg)' }}>
              <i className="fa-light fa-circle-exclamation text-xs" aria-hidden="true" />
              <span className="truncate">
                {ZERO_STUDENT_COURSES} course{ZERO_STUDENT_COURSES !== 1 ? 's have' : ' has'} no enrolled students.
              </span>
            </p>
          )}
          <Button variant="default" size="sm" className="shrink-0">
            Create {INSTANCE_TOTAL} evaluations
          </Button>
        </div>
      </div>

      {/* (b) The real dialog — real rating pills, real textarea. */}
      <SurveyPreviewDialog template={TEMPLATE} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}
