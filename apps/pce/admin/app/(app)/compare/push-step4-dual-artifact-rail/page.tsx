'use client'

// COMPARE ROUTE (throwaway — same lifecycle as the /compare/push-step2-* and
// /compare/push-step3-* siblings, delete once a direction is picked).
//
// 2026-08-12 — Step 4 "Review" variant: DUAL-ARTIFACT RAIL.
//
// The shipped review step (step-review.tsx) keeps ONE outgoing artifact — the
// email — persistently visible beside the pre-flight checklist, with an
// Invitation/Reminder switch at the rail's top. But a push actually sends TWO
// artifacts to students: the email AND the survey form the email links to.
// Today the survey is only checkable through the Survey-design step's preview
// dialog — a modal, two steps back, gone by the time the admin is staring at
// the commit button. Grounded in Mobbin's HubSpot quote-review pattern (the
// document being sent is inspectable in place, beside the checklist, right up
// to Send), this variant adds a top-level Email / Survey switch (DS Tabs —
// tablist semantics, two structurally different panels) to the rail:
//
//   · EMAIL  — the shipped rail's content: Invitation/Reminder segmented
//              switch, From/Subject header block, merge-resolved body.
//   · SURVEY — the REAL survey content inline (survey-preview-dialog.tsx's
//              question rendering — rating-scale rows + textareas — adapted
//              out of the modal into the rail), scoped to one course's
//              assigned template, with a course Select above it so the admin
//              can spot-check any course's survey without leaving the page.
//
// Real fixture throughout: MOCK_COURSE_OFFERINGS scoped to Fall 2026 · pt5
// (the exact term the real push wizard defaults to — 14 offerings), template
// assignment via the wizard's own pickTemplateForType logic (all-'any'
// published CE templates → tmpl1 default), plus two clinical-course
// reassignments to tmplrich — the same per-course reassignment the real
// Survey-design step allows — so the course picker demonstrably switches
// between different surveys. Email content is the real EVAL_EMAIL_TEMPLATES
// fixture with the same merge-field resolution step-review.tsx ships.
//
// 2026-08-12 (second pass) — applied the senior-designer critique: Evaluates
// column folded into one summary sentence (2 distinct values across 14 rows
// didn't earn a wrapping column), Courses table moved out of the label grid
// to full card width with no inner scroll cap, rail heading dropped (the tab
// labels say it), Invitation/Reminder switched to the neutral DS
// ButtonSegmentedControl (outline ToggleGroup out-saturated the primary CTA),
// rating pills shrunk to plain 24px circles with a once-per-section legend,
// both rail panels made equal-height (flex-1, no fixed caps), always-"Ready"
// badges hidden (exception-only), and the Recipients section deleted (the
// headline already states it).

import { useMemo, useState } from 'react'
import {
  Button, ButtonSegmentedControl, Textarea,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import {
  MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, EVAL_EMAIL_TEMPLATES,
  COURSE_TYPE_FULL_LABEL, deliveryModeOf,
  type CourseOffering, type PceTemplate,
} from '@/lib/pce-mock-data'
import {
  courseLabelOf, templateCriteria, CRITERION_TOGGLE_LABEL,
} from '@/lib/pce-course-readiness'

// ── Fixture — same scope as the real wizard's default ───────────────────────
const OFFERINGS = MOCK_COURSE_OFFERINGS.filter(o => o.termId === 'pt5' && o.status !== 'archived')
const OPEN_DATE = new Date(2026, 11, 4)
const CLOSE_DATE = new Date(2026, 11, 18)
const TERM_NAME = 'Fall 2026'
const ACADEMIC_YEAR = '2026–2027'

// Published course-evaluation templates — the same filter the push wizard
// applies (page.tsx publishedTemplates).
const CE_TEMPLATES = MOCK_TEMPLATES.filter(
  t => t.status === 'active' && (!t.surveyType || t.surveyType === 'course_evaluation'),
)

// The wizard's pickTemplateForType, collapsed for this fixture: every published
// CE template is courseType 'any' and none is flagged isDefaultForType, so the
// default is matches[0] for every course.
const DEFAULT_TEMPLATE = CE_TEMPLATES[0]

// Per-course reassignments — the same override the real Survey-design step
// records in templateAssignments. Two clinical courses run the richer
// Comprehensive Course Evaluation so the rail's course picker actually has
// different surveys to switch between.
const TEMPLATE_OVERRIDES: Record<string, string> = (() => {
  const rich = CE_TEMPLATES.find(t => t.id === 'tmplrich')
  if (!rich) return {}
  const clinical = OFFERINGS.filter(o => o.courseType === 'clinical').slice(0, 2)
  return Object.fromEntries(clinical.map(o => [o.id, rich.id]))
})()

function assignedTemplateOf(o: CourseOffering): PceTemplate {
  const overrideId = TEMPLATE_OVERRIDES[o.id]
  return CE_TEMPLATES.find(t => t.id === overrideId) ?? DEFAULT_TEMPLATE
}

const STUDENT_TOTAL = OFFERINGS.reduce((n, o) => n + o.enrolledCount, 0)

const INVITATION = EVAL_EMAIL_TEMPLATES.find(t => t.type === 'invitation')!
const REMINDER = EVAL_EMAIL_TEMPLATES.find(t => t.type === 'reminder')!
const SENDER_NAME = 'Exxat Surveys'

function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// Same merge-field resolution as step-review.tsx — the preview shows what a
// student actually receives, not raw {{tokens}}.
function resolveMerge(text: string): string {
  return text
    .replace(/\{\{student_first_name\}\}/g, 'Alex')
    .replace(/\{\{course_name\}\}/g, splitLabel(OFFERINGS[0]).code)
    .replace(/\{\{term_name\}\}/g, TERM_NAME)
    .replace(/\{\{close_date\}\}/g, fmtShort(CLOSE_DATE))
    .replace(/\{\{days_until_close\}\}/g, '3')
    .replace(/\{\{s\}\}/g, 's')
    .replace(/\{\{program_name\}\}/g, 'your program')
    .replace(/\{\{survey_link\}\}/g, '[ Open survey ]')
}

// ── Checklist section — same anatomy as step-review.tsx's Section, minus the
// readiness badge: the shipped component derives ready/warning/incomplete from
// real state, but this exploration's fixture is all-ready, and a green pill
// that never changes is noise (critique 2026-08-12) — readiness should only
// surface on a non-ready exception. ──────────────────────────────────────────
function Section({
  title, rows, children,
}: {
  title: string
  rows: [string, React.ReactNode][]
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border py-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold min-w-0 truncate">{title}</h3>
        <Button variant="ghost" size="icon-xs" aria-label={`Edit ${title}`} title={`Edit ${title}`} className="shrink-0">
          <i className="fa-light fa-pen-to-square" aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-3 text-sm">
            <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)', width: 92 }}>{k}</span>
            <span className="min-w-0">{v}</span>
          </div>
        ))}
        {children}
      </div>
    </div>
  )
}

// ── Survey question rendering — survey-preview-dialog.tsx adapted to a rail ──
// Same wording students actually see on the survey-taking page; only valid for
// the 5-point scale (the one every current template fixture uses).
const RATING_LABELS = ['', 'Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']

/** Read-only scale indicator — plain 24px numbered circles, not the survey
 *  taker's full pill buttons: at rail width the bordered pills cost ~80px of
 *  height per question for a control that isn't interactive here (critique
 *  2026-08-12). The per-value labels move to a once-per-section legend.
 *  flex-wrap keeps a 7/10-point likertPointer sane in the 360px rail. */
function RatingScaleRow({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, i) => i + 1).map(n => (
        <span
          key={n}
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
          style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
        >
          {n}
        </span>
      ))}
    </div>
  )
}

function SurveyInlinePreview({ template }: { template: PceTemplate }) {
  const sections = template.templateSections ?? []
  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0)
  // Legend renders once per section (not once per question). Endpoint labels
  // only for the 5-point scale — the only one RATING_LABELS covers; a
  // mislabeled 3/7/10-point scale would be worse than none.
  const legend = template.likertPointer === 5
    ? `1 = ${RATING_LABELS[1]} · 5 = ${RATING_LABELS[5]}`
    : null
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
        <p className="text-sm font-medium truncate">{template.name}</p>
        <p className="text-xs text-muted-foreground">
          {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} · {sections.length} section{sections.length !== 1 ? 's' : ''}
        </p>
      </div>
      {/* Keyboard-scrollable (axe scrollable-region-focusable): tabIndex + a
          region role so a keyboard user can reach and arrow through it. */}
      <div
        className="flex flex-col gap-5 flex-1 min-h-0"
        style={{ padding: 12, overflowY: 'auto' }}
        tabIndex={0}
        role="region"
        aria-label="Survey questions"
      >
        {sections.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No sections in this template.
          </p>
        ) : (
          sections.map((section, si) => {
            const startNum = sections.slice(0, si).reduce((n, s) => n + s.questions.length, 0)
            const hasLikert = section.questions.some(q => q.answerType === 'likert')
            return (
              <div key={section.id} className="flex flex-col gap-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                    {section.title}
                  </p>
                  {hasLikert && legend && (
                    <p className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>{legend}</p>
                  )}
                </div>
                {section.questions.map((q, qi) => (
                  <div key={q.id} className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <span
                        className="text-xs font-medium shrink-0"
                        style={{ color: 'var(--muted-foreground)', width: 18, paddingTop: 2 }}
                      >
                        {startNum + qi + 1}
                      </span>
                      <p className="text-sm flex-1">{q.text}</p>
                    </div>
                    <div className="ps-6">
                      {q.answerType === 'likert' ? (
                        <RatingScaleRow count={template.likertPointer} />
                      ) : (
                        <Textarea
                          className="resize-none"
                          style={{ minHeight: 56 }}
                          placeholder="Share your thoughts… (optional)"
                          disabled
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function PushStep4DualArtifactRailComparePage() {
  // Top-level rail tabs — the variant's whole point.
  const [artifact, setArtifact] = useState<'email' | 'survey'>('email')
  // Email tab's own Invitation/Reminder switch (same as shipped).
  const [previewMode, setPreviewMode] = useState<'invitation' | 'reminder'>('invitation')
  // Survey tab's course scope.
  const [surveyCourseId, setSurveyCourseId] = useState(OFFERINGS[0].id)
  const [testSent, setTestSent] = useState(false)

  const surveyCourse = OFFERINGS.find(o => o.id === surveyCourseId) ?? OFFERINGS[0]
  const surveyTemplate = assignedTemplateOf(surveyCourse)

  const preview = previewMode === 'reminder'
    ? { subject: REMINDER.subject, body: REMINDER.body }
    : { subject: INVITATION.subject, body: INVITATION.body }

  const courseRows = useMemo(() => OFFERINGS.map(o => {
    const { code, name } = splitLabel(o)
    const t = assignedTemplateOf(o)
    const roles = templateCriteria(t).map(c => CRITERION_TOGGLE_LABEL[c])
    return { id: o.id, code, name, typeLabel: COURSE_TYPE_FULL_LABEL[deliveryModeOf(o)], students: o.enrolledCount, roles }
  }), [])

  // Evaluates as one sentence, not a column: across the whole fixture the
  // column held only 2 distinct values (critique 2026-08-12) — a near-constant
  // stated once, with the exception courses named. Derived from the same
  // per-course template criteria the column showed, so it stays truthful if
  // the fixture changes.
  const evaluatesSummary = useMemo(() => {
    const extraCourses = courseRows.filter(r => r.roles.includes('Course Director')).map(r => r.code)
    const base = 'Every course evaluates its instructor and course coordinator.'
    if (extraCourses.length === 0) return base
    return `${base} ${extraCourses.join(' and ')} also evaluate${extraCourses.length === 1 ? 's' : ''} the course director.`
  }, [courseRows])

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1080px] mx-auto">
      <div className="flex flex-col gap-1">
        {/* Compare-route caption — deliberately quieter than the page's real
            headline below (they rendered pixel-identical at text-xl serif). */}
        <h1 className="text-sm font-semibold text-muted-foreground">Step 4 — Review, dual-artifact rail</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Variant of the shipped review step (<code className="text-xs">step-review.tsx</code>): the persistent rail
          gains a top-level Email / Survey toggle so BOTH real outgoing artifacts are checkable in place before
          committing — not just the email. Real fixture: Fall 2026 (pt5, {OFFERINGS.length} courses), real templates,
          real email templates. Analogy: HubSpot&rsquo;s quote review (Mobbin) — the document being sent stays
          inspectable beside the checklist right up to Send.
        </p>
      </div>

      {/* ── Headline — same two-line anatomy as the shipped step ───────────── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold font-heading">
          {TERM_NAME}
          <span className="font-normal text-muted-foreground"> · {ACADEMIC_YEAR}</span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Sending to <span className="font-medium" style={{ color: 'var(--foreground)' }}>{STUDENT_TOTAL} students</span>
          {' '}across <span className="font-medium" style={{ color: 'var(--foreground)' }}>{OFFERINGS.length} courses</span>
          {' '}· opens <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmtShort(OPEN_DATE)}</span>
          {' '}· closes <span className="font-medium" style={{ color: 'var(--foreground)' }}>{fmtShort(CLOSE_DATE)}</span>
        </p>
      </div>

      {/* ── Pre-flight checklist + dual-artifact rail. No Recipients section:
           the headline sentence above already states the full audience. ───── */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        <div className="flex flex-col flex-1 min-w-0">
          <Section title="Survey design" rows={[]}>
            <p className="text-sm text-muted-foreground">{evaluatesSummary}</p>
            {/* Full card width (out of the label grid), no inner scroll cap —
                the page is the only scroller in this column. Course is the
                only column with real variance, so it gets the whole flexible
                track and stops truncating. */}
            <div>
              <div
                className="grid gap-3 pb-1.5 mb-1 border-b border-border text-xs font-medium text-muted-foreground"
                style={{ gridTemplateColumns: 'minmax(0,1fr) 84px 64px' }}
              >
                <span>Course</span>
                <span>Type</span>
                <span>Students</span>
              </div>
              {courseRows.map(row => (
                <div
                  key={row.id}
                  className="grid gap-3 items-baseline py-1.5 border-t border-border/60 first:border-t-0 text-sm"
                  style={{ gridTemplateColumns: 'minmax(0,1fr) 84px 64px' }}
                >
                  {/* Wraps rather than truncates: the course name is the one
                      column with real variance, so it never clips — one line
                      at the design viewport, a wrapped second line only when
                      the window is genuinely narrow. */}
                  <span className="min-w-0">
                    <span className="font-medium">{row.code}</span>
                    <span className="text-muted-foreground"> · {row.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground min-w-0 truncate">{row.typeLabel}</span>
                  {row.students === 0 ? (
                    // A course nobody receives is an exception, not another
                    // gray number.
                    <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--insight-severity-warning-fg)' }}>
                      0
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground tabular-nums">{row.students}</span>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Schedule & email"
            rows={[
              ['Responses', (
                <span className="flex items-center gap-1.5">
                  <i className="fa-light fa-shield-check text-xs" aria-hidden="true" />
                  Anonymous
                </span>
              )],
              ['Email', INVITATION.name],
              ['Reminders', <>{REMINDER.name}<span className="text-muted-foreground"> · 7, 3 days before close</span></>],
              ['From', SENDER_NAME],
            ]}
          />
        </div>

        {/* ── Rail — BOTH outgoing artifacts. Top-level switch is DS Tabs
             (tablist/tab/tabpanel — two structurally different content
             panels); the tab labels name the rail, so it carries no heading of
             its own. Both panels are flex-1 with no fixed caps so the rail
             holds one consistent height across the switch. ─────────────────── */}
        <aside className="w-full lg:w-[360px] shrink-0 border-t border-border pt-4 flex flex-col" aria-label="Outgoing artifact preview">
          <Tabs
            value={artifact}
            onValueChange={v => setArtifact(v as 'email' | 'survey')}
            className="flex flex-col gap-3 flex-1 min-h-0"
          >
            <TabsList variant="line" className="w-full" aria-label="Artifact to preview">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="survey">Survey</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="flex flex-col gap-3 flex-1 min-h-0">
              {/* Second-level mode switch — neutral segmented control, not the
                  outline ToggleGroup: its brand-colored border on both states
                  out-saturated the primary CTA (critique 2026-08-12). */}
              <ButtonSegmentedControl<'invitation' | 'reminder'>
                value={previewMode}
                onValueChange={setPreviewMode}
                options={[
                  { value: 'invitation', label: 'Invitation' },
                  { value: 'reminder', label: 'Reminder' },
                ]}
                aria-label="Email preview type"
                className="self-start"
              />
              <div className="rounded-md border border-border overflow-hidden flex flex-col flex-1 min-h-0" style={{ background: 'var(--card)' }}>
                <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                  <p className="text-xs text-muted-foreground truncate">From {SENDER_NAME}</p>
                  <p className="text-sm font-medium truncate" title={resolveMerge(preview.subject)}>
                    {resolveMerge(preview.subject)}
                  </p>
                </div>
                {/* Keyboard-scrollable (axe scrollable-region-focusable). */}
                <div
                  className="flex-1 min-h-0"
                  style={{ padding: 12, overflowY: 'auto' }}
                  tabIndex={0}
                  role="region"
                  aria-label="Email body preview"
                >
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)', lineHeight: 1.55 }}>
                    {resolveMerge(preview.body)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-muted-foreground hover:text-foreground"
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
            </TabsContent>

            <TabsContent value="survey" className="flex flex-col gap-3 flex-1 min-h-0">
              {/* Course scope — spot-check any course's assigned survey. */}
              <Select value={surveyCourseId} onValueChange={setSurveyCourseId}>
                <SelectTrigger size="sm" aria-label="Course whose survey to preview">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OFFERINGS.map(o => {
                    const { code, name } = splitLabel(o)
                    return (
                      <SelectItem key={o.id} value={o.id}>
                        {code} · {name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <div className="rounded-md border border-border overflow-hidden flex flex-col flex-1 min-h-0" style={{ background: 'var(--card)' }}>
                <SurveyInlinePreview template={surveyTemplate} />
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* ── Footer — same single-row anatomy as the shipped step ───────────── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" className="shrink-0">
          Set up Evaluations · {STUDENT_TOTAL} students
        </Button>
      </div>
    </div>
  )
}
