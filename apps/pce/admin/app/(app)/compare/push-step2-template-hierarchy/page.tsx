'use client'

// COMPARE ROUTE (throwaway — same lifecycle as sibling /compare/push-step2-*
// routes, delete once this direction is settled or folded back in).
//
// 2026-08-06, round 5 — audited against the real ST-02 acceptance-criteria
// doc (Step 2 — Survey Design & Faculty Coverage). Findings + fixes:
//
//   - BUG: round 3's "Live" → "Scheduled" relabel (Romit's own request, at
//     the time unverified against spec) turned out to contradict ST-02:
//     "A Draft or Scheduled survey... does not block — it's pulled in for
//     editing instead." Confirmed against the real shipped
//     `STORY_STATUS_BLOCKS_OVERLAP` set (pce-push-validation.ts:76-78) —
//     only live/closed/results_available/archived block; scheduled never
//     does. Reverted to "Live" here, which is both spec-correct AND matches
//     the real fixture (pf2's status 'active' → storyStatusOf → 'live').
//   - NEW RULE modeled: "a template whose assigned roles resolve to ZERO
//     faculty (all gaps, nobody at all) would produce an empty evaluation,
//     so the course cannot proceed" (ST-02 Blocks, 4th bullet) — a stricter
//     case than an ordinary partial gap, which explicitly does NOT block
//     ("Doesn't block: a faculty gap... informational only"). A
//     TemplateSection with zero ready/advisory/blocked rows and at least
//     one gap now renders "No faculty assigned" (red, blocks) instead of
//     "Needs a person" (orange, informational) — and the course's own
//     Status badge flips to "Blocked" rather than staying "Ready".
//   - NEW RULE modeled: "All units deselected on a course = treated as that
//     course row is deselected completely." Toggling off every evaluatee
//     now auto-collapses the course into the same "removed" state as
//     unchecking the course-level box, with copy that says which happened.
//   - "+ Add another template" is now available on EVERY course, not just
//     DPT-510 — Romit's explicit call, keeping this as a deliberate product
//     decision that supersedes ST-02's literal "one template per course"
//     line (flagged to Product as a doc update, not a bug). This forced
//     unifying what were four bespoke course components into one CourseCard
//     — duplicating add-template + toggle + status logic four ways would
//     have been unmaintainable, and it's also what let the "no faculty
//     assigned" rule above surface naturally (add "Course Director
//     Check-In" to ANY course — it dedupes Course material against the
//     course's first template and resolves Course Director via the real
//     CRITERION_BY_TYPE resolver, which is a gap on every course in this
//     fixture — zero people, one gap, hard block).
//   - Evaluatee checkboxes (Course material / person rows) are now
//     ToggleSwitch, not Checkbox — Romit's call. The course-level selection
//     control stays Checkbox: ST-02 says so explicitly ("This screen
//     carries Step 1's same course-selection checkbox").
//   - Filter counts are no longer a static per-course tag — each CourseCard
//     computes its own status (attention / blocked) from its LIVE rows and
//     reports it up via a small effect, so toggling a unit, adding a
//     template, or discovering Dr. Omar Hassan all move the course between
//     filter tabs in real time. "Blocked (0)" is no longer permanently
//     zero — adding a zero-faculty template moves a course into it.
//
// Still not modeled (flagged, not silently dropped): a genuine Draft/
// Scheduled-survey RESUME flow (pre-populate from the existing draft, "no
// block, pulled in for editing" — a materially different UI from anything
// here, since none of it involves a lock icon). Also not modeled: template
// unpublished/archived-since-assignment, and no-template-assigned at all.
//
// Real fixture throughout: MOCK_COURSE_OFFERINGS['co9'/'co10'/'co13'/'co15'],
// the real tmpl1/tmpl2/tmplrich templates, the real pf2 blocking survey, the
// real CRITERION_BY_TYPE resolvers and prismAddHref. Invented: SECOND_TEMPLATE
// ("Course Director Check-In" — no published template in the fixture
// overlaps on Course material), and Dr. Omar Hassan's simulated late Prism
// addition on DPT-530.

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Button, Badge, Checkbox, ToggleSwitch, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Card, CardContent, Collapsible, CollapsibleTrigger, CollapsibleContent,
  AvatarGroup, AvatarGroupCount, Tip, ToggleGroup, ToggleGroupItem, Input, LocalBanner,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import { SiteHeader } from '@/components/site-header'
import { WizardNav } from '@/components/pce/wizard-nav'
// "New template" (Wave 5) — real, exported create+build flow, same reuse
// discipline as TemplateControl (Wave 3): no reinvention, no edits to
// step-survey-instances.tsx. usePce() is already in scope — this page lives
// under app/(app)/layout.tsx's <PceProvider>. createTemplate only mutates
// in-memory PceProvider state (MOCK_TEMPLATES-seeded useState, not
// localStorage) — resets on reload, no lasting side effect on other sessions.
import { usePce } from '@/components/pce/pce-state'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import { LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_DANGER } from '@/lib/list-status-badges'
import { MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, MOCK_SURVEYS, MOCK_FACULTY, COURSE_TYPE_FULL_LABEL, type PceTemplate, type CourseOffering } from '@/lib/pce-mock-data'
import { CRITERION_BY_TYPE, prismAddHref, type Criterion } from '@/lib/pce-course-readiness'
// Real, exported radio-block template picker — reused directly rather than
// reinvented, same pattern already proven in the sibling
// /compare/push-step2-template-assignment page. Read-only import; no edits
// to step-survey-instances.tsx.
import { TemplateControl } from '@/components/pce/courses-evaluatees/step-survey-instances'

const MODE = 'classroom' as const
const TEMPLATE_1 = MOCK_TEMPLATES.find(t => t.id === 'tmpl1')!
const BLOCKING_SURVEY = MOCK_SURVEYS.find(s => s.id === 'pf2')!

function facultyName(id?: string | null) {
  if (!id) return null
  return MOCK_FACULTY.find(f => f.id === id)?.name ?? null
}
function criterionLabel(c: Criterion) {
  return c === 'students' ? 'Course material' : CRITERION_BY_TYPE[MODE][c]?.label ?? c
}

// Invented — see file header. Shape mirrors a real PceTemplate closely
// enough for this demo's rendering; not persisted, not pickable elsewhere.
const SECOND_TEMPLATE: PceTemplate = {
  ...MOCK_TEMPLATES.find(t => t.id === 'tmpl2')!,
  id: 'tmpl-demo-director',
  name: 'Course Director Check-In',
  questionCount: 4,
}

type EvaluateeRow =
  | { kind: 'ready'; key: string; label: string; sub: string; avatar?: string }
  | { kind: 'advisory'; key: string; label: string; sub: string; avatar: string; coveredByName: string | null }
  | { kind: 'blocked'; key: string; label: string; sub: string; avatar: string }
  | { kind: 'gap'; key: string; label: string; prismHref: string }
  | { kind: 'excluded'; key: string; label: string; sub: string; avatar: string }
  | { kind: 'deduped'; key: string; label: string; coveredByTemplateName: string }

type TemplateEntry = { template: PceTemplate; criteria: Criterion[] }
type RowStatusTag = 'ready' | 'gap' | 'blocked'
type AttentionTag = 'ready' | 'attention'

function evaluatesCaption(criteria: Criterion[]) {
  return criteria.map(criterionLabel).join(', ')
}

// ── Generic resolver for added templates — dedup-aware, uses the real
// CRITERION_BY_TYPE resolvers so a "gap" here is a genuine unresolved
// Prism role, not invented. ─────────────────────────────────────────────
function resolveGenericRows(
  entry: TemplateEntry, offering: CourseOffering, dedupedHere: Set<Criterion>, claimedByName: Map<Criterion, string>,
): EvaluateeRow[] {
  return entry.criteria.map(c => {
    const key = `${entry.template.id}-${c}`
    if (dedupedHere.has(c)) {
      return { kind: 'deduped', key, label: criterionLabel(c), coveredByTemplateName: claimedByName.get(c)! }
    }
    if (c === 'students') return { kind: 'ready', key, label: 'Course material', sub: 'Course' }
    const resolver = CRITERION_BY_TYPE[MODE][c]
    const name = resolver?.resolve(offering)
    if (!name) return { kind: 'gap', key, label: resolver?.label ?? criterionLabel(c), prismHref: prismAddHref(offering, c) }
    return { kind: 'ready', key, label: name, sub: resolver!.label, avatar: name }
  })
}

// ── Advisory row — real, working "Use a different template" action ────────
function AdvisoryRow({
  row, publishedTemplates, checked, onToggle,
}: {
  row: Extract<EvaluateeRow, { kind: 'advisory' }>
  publishedTemplates: PceTemplate[]
  checked: boolean
  onToggle: () => void
}) {
  const [picking, setPicking] = useState(false)
  const [pickedId, setPickedId] = useState('')
  const [overrideName, setOverrideName] = useState<string | null>(null)

  const toggleId = `unit-${row.key}`
  return (
    <div
      className="flex w-full flex-col gap-1.5 rounded-md border p-2.5 min-w-0"
      style={{ borderColor: 'var(--chip-4)', background: 'var(--card)' }}
    >
      <div className="flex w-full items-start gap-2.5 min-w-0">
        <PersonAvatar name={row.avatar} className={cn('size-6 shrink-0', !checked && 'grayscale')} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('truncate text-sm font-medium', !checked && 'text-muted-foreground')}>{row.label}</span>
          <span className="truncate text-xs" style={{ color: 'var(--chip-4)' }}>
            <i className="fa-solid fa-arrow-right-arrow-left me-1" aria-hidden="true" style={{ fontSize: 9 }} />
            Advisory — {row.sub}, uses default unless changed
          </span>
        </span>
        {/* ToggleSwitch's real props are only {checked, onChange, id} — it
            does not spread aria-label onto its underlying button, so passing
            one directly is silently dropped. sr-only label + htmlFor/id,
            same pairing already fixed in step-survey-instances.tsx. */}
        <label htmlFor={toggleId} className="sr-only">{`Include ${row.label} in this push`}</label>
        <ToggleSwitch id={toggleId} checked={checked} onChange={onToggle} />
      </div>
      <div className="flex flex-col gap-1.5 border-t border-border pt-1.5">
        <p className="text-xs text-muted-foreground">
          Evaluating with:{' '}
          <span className="font-medium text-foreground">{overrideName ?? 'Same as course template'}</span>
          {!overrideName && row.coveredByName && <> — same as {row.coveredByName}</>}
        </p>
        {picking ? (
          <div className="flex flex-col gap-1.5 max-w-xs">
            <Select value={pickedId} onValueChange={setPickedId}>
              <SelectTrigger size="sm" aria-label={`Different template for ${row.label}`} className="w-full">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {publishedTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="xs"
                disabled={!pickedId}
                onClick={() => {
                  setOverrideName(publishedTemplates.find(t => t.id === pickedId)?.name ?? null)
                  setPicking(false)
                  setPickedId('')
                }}
              >
                Use this template
              </Button>
              <Button variant="ghost" size="xs" onClick={() => { setPicking(false); setPickedId('') }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="xs" className="self-start" style={{ color: 'var(--chip-4)', borderColor: 'var(--chip-4)' }} onClick={() => setPicking(true)}>
            Use a different template
          </Button>
        )}
      </div>
    </div>
  )
}

function TemplateRow({
  row, checked, onToggle, onInclude,
}: {
  row: Exclude<EvaluateeRow, { kind: 'advisory' }>
  checked?: boolean
  onToggle?: () => void
  onInclude?: () => void
}) {
  if (row.kind === 'ready') {
    const isIn = checked ?? true
    const toggleId = `unit-${row.key}`
    return (
      <div className="flex w-full items-start gap-2.5 rounded-md border border-border p-2.5 min-w-0" style={{ background: 'var(--card)' }}>
        {row.avatar ? <PersonAvatar name={row.avatar} className={cn('size-6 shrink-0', !isIn && 'grayscale')} /> : (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--muted)' }} aria-hidden="true">
            <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('truncate text-sm font-medium', !isIn && 'text-muted-foreground')}>{row.label}</span>
          <span className="truncate text-xs text-muted-foreground">{row.sub}</span>
        </span>
        <label htmlFor={toggleId} className="sr-only">{`Include ${row.label} in this push`}</label>
        <ToggleSwitch id={toggleId} checked={isIn} onChange={() => onToggle?.()} />
      </div>
    )
  }
  if (row.kind === 'excluded') {
    // S4 — real copy, step-survey-instances.tsx:698 ("In Prism, not
    // included — Auto Update is off").
    const toggleId = `unit-${row.key}`
    return (
      <div className="flex w-full items-start gap-2.5 rounded-md border border-border p-2.5 min-w-0" style={{ background: 'var(--card)' }}>
        <PersonAvatar name={row.avatar} className="size-6 shrink-0 grayscale" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-muted-foreground">{row.label}</span>
          <span className="truncate text-xs text-muted-foreground">In Prism, not included — Auto Update is off</span>
        </span>
        <label htmlFor={toggleId} className="sr-only">{`Include ${row.label} in this push`}</label>
        <ToggleSwitch id={toggleId} checked={false} onChange={() => onInclude?.()} />
      </div>
    )
  }
  if (row.kind === 'blocked') {
    return (
      <div
        className="flex w-full items-start gap-2.5 rounded-md border p-2.5 min-w-0"
        style={{ borderColor: 'var(--chip-destructive)', background: 'var(--pce-impact-bg)' }}
      >
        <PersonAvatar name={row.avatar} className="size-6 shrink-0 grayscale" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{row.label}</span>
          {/* "Live" — reverted from "Scheduled" (round 3). ST-02 + the real
              STORY_STATUS_BLOCKS_OVERLAP set both confirm Scheduled never
              blocks — only Live/Closed/Results Available/Archived do. */}
          <span className="truncate text-xs" style={{ color: 'var(--chip-destructive)' }}>
            {row.sub} — already covered by a Live survey opened Dec 6
          </span>
        </span>
        <Button variant="outline" size="xs" asChild className="shrink-0">
          <Link href={`/surveys/${BLOCKING_SURVEY.id}`}>View survey</Link>
        </Button>
      </div>
    )
  }
  if (row.kind === 'gap') {
    return (
      <div
        className="flex w-full items-start gap-2.5 rounded-md border border-dashed p-2.5 min-w-0"
        style={{ borderColor: 'var(--chip-5)', background: 'var(--pce-impact-bg)' }}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed" style={{ borderColor: 'var(--chip-5)', color: 'var(--chip-5)' }} aria-hidden="true">
          <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium" style={{ color: 'var(--chip-5)' }}>{row.label}</span>
          <span className="text-xs" style={{ color: 'var(--chip-5)' }}>No one assigned in Prism</span>
          <Button
            variant="outline"
            size="xs"
            asChild
            className="self-start mt-1"
            style={{ color: 'var(--chip-5)', borderColor: 'var(--chip-5)' }}
          >
            <a href={row.prismHref} target="_blank" rel="noopener noreferrer">
              Add in Prism
              <span className="sr-only"> (opens Prism in a new tab to assign the {row.label} role)</span>
            </a>
          </Button>
        </span>
      </div>
    )
  }
  // deduped
  return (
    <div className="flex w-full items-start gap-2.5 rounded-md border border-border p-2.5 min-w-0" style={{ background: 'var(--muted)' }}>
      <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
        <i className="fa-light fa-circle-info text-xs text-muted-foreground" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-muted-foreground">{row.label}</span>
        <span className="truncate text-xs text-muted-foreground">Already evaluated by &ldquo;{row.coveredByTemplateName}&rdquo; above — not repeated here</span>
      </span>
    </div>
  )
}

function TemplateSection({
  entry, isFirst, rows, onRemove, onChangeTemplate, onPreview, excludedKeys, onToggleRow, onIncludeRow,
}: {
  entry: TemplateEntry
  isFirst: boolean
  rows: EvaluateeRow[]
  onRemove?: () => void
  /** Primary section only — opens the real TemplateControl picker. */
  onChangeTemplate?: () => void
  onPreview: (t: PceTemplate) => void
  excludedKeys: ReadonlySet<string>
  onToggleRow: (key: string) => void
  onIncludeRow?: (key: string) => void
}) {
  // Live templates (Wave 5) — so a template just created+published via
  // "New template" shows up in the advisory "Use a different template"
  // picker, not just the fixed MOCK_TEMPLATES snapshot.
  const { templates } = usePce()
  const { template } = entry
  const peopleCount = rows.filter(r => r.kind === 'ready' || r.kind === 'advisory' || r.kind === 'blocked').length
  const gapCount = rows.filter(r => r.kind === 'gap').length
  const hasBlockedUnit = rows.some(r => r.kind === 'blocked')
  // ST-02 Blocks, 4th bullet: a template whose roles resolve to ZERO
  // faculty (only gaps) would produce an empty evaluation — this hard
  // blocks, distinct from an ordinary partial gap (which is informational
  // only per "Doesn't block: a faculty gap").
  const zeroFaculty = peopleCount === 0 && gapCount > 0
  const rollup = hasBlockedUnit
    ? { label: 'Blocked', color: 'var(--chip-destructive)', icon: 'fa-solid fa-lock' }
    : zeroFaculty
      ? { label: 'No faculty assigned', color: 'var(--chip-destructive)', icon: 'fa-solid fa-lock' }
      : gapCount > 0
        ? { label: 'Needs a person', color: 'var(--chip-5)', icon: 'fa-light fa-user-plus' }
        : { label: 'Ready', color: 'var(--insight-severity-info-fg)', icon: 'fa-light fa-circle-check' }

  return (
    <div className="flex flex-col gap-3 border-l-2 pl-4" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {template.name}
            {isFirst && (
              <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>Default</Badge>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {template.questionCount} question{template.questionCount !== 1 ? 's' : ''} · Evaluates {evaluatesCaption(entry.criteria)}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: rollup.color }}>
            <i className={rollup.icon} aria-hidden="true" style={{ fontSize: 11 }} />
            {rollup.label}
          </span>
          <Button variant="ghost" size="xs" onClick={() => onPreview(template)}>Preview</Button>
          {onChangeTemplate && <Button variant="ghost" size="xs" onClick={onChangeTemplate}>Change</Button>}
          {onRemove && <Button variant="ghost" size="xs" onClick={onRemove}>Remove</Button>}
        </div>
      </div>

      {zeroFaculty && (
        <p className="text-xs" style={{ color: 'var(--chip-destructive)' }}>
          <i className="fa-solid fa-triangle-exclamation me-1.5" aria-hidden="true" />
          No faculty assigned to this template yet — it would produce an empty evaluation, so it can&rsquo;t be
          included until a role is filled{onRemove && <> or you remove it</>}.
        </p>
      )}

      <div className="flex flex-col">
        {rows.map(row =>
          row.kind === 'advisory'
            ? (
              <AdvisoryRow
                key={row.key}
                row={row}
                publishedTemplates={templates.filter(t => t.status === 'active')}
                checked={!excludedKeys.has(row.key)}
                onToggle={() => onToggleRow(row.key)}
              />
            )
            : (
              <TemplateRow
                key={row.key}
                row={row}
                checked={row.kind === 'ready' ? !excludedKeys.has(row.key) : undefined}
                onToggle={row.kind === 'ready' ? () => onToggleRow(row.key) : undefined}
                onInclude={onIncludeRow ? () => onIncludeRow(row.key) : undefined}
              />
            ),
        )}
      </div>
    </div>
  )
}

// ── Collapsed DataTable row — matches the real page's grid exactly
// (step-survey-instances.tsx:234 TABLE_GRID, :1876-1942 the row markup),
// since Romit asked to reference localhost:3005/surveys/push?term=pt5
// directly rather than floating cards. Reproduced here (not imported) only
// because TemplateChip/EvaluateeChipCluster/RowStatus/RowAction aren't
// exported from that file — same-shape, same classes, not a reinterpretation.
const TABLE_GRID = `24px 24px minmax(160px,1.4fr) 76px minmax(168px,1fr) 156px 88px minmax(168px,1fr)`

function MiniTemplateChip({ name }: { name: string }) {
  return (
    <Tip label={name} side="top">
      <span tabIndex={0} className="inline-flex min-w-0 items-center gap-1.5 rounded-sm text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
        <i className="fa-light fa-file-lines text-xs shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">{name}</span>
      </span>
    </Tip>
  )
}

function MiniEvaluateeCluster({ rows }: { rows: EvaluateeRow[] }) {
  const people = rows.filter((r): r is Extract<EvaluateeRow, { kind: 'ready' | 'advisory' | 'blocked' }> =>
    r.kind === 'ready' || r.kind === 'advisory' || r.kind === 'blocked')
  const shown = people.slice(0, 3)
  const extra = people.length - shown.length
  const gaps = rows.filter((r): r is Extract<EvaluateeRow, { kind: 'gap' }> => r.kind === 'gap')
  if (people.length === 0 && gaps.length === 0) return <span className="text-xs text-muted-foreground">&ndash;</span>
  // Real EvaluateeChipCluster (step-survey-instances.tsx:575) pairs its
  // avatar cluster with an sr-only summary for a fast screen-reader
  // overview, and gives a late-added co-instructor ('advisory' here — the
  // row that still needs a template decision) a visible-at-rest corner
  // badge distinct from the gap disc. Ported directly.
  const summary = `Evaluatees: ${people.map(r => r.label).join(', ') || 'none included'}.`
    + (gaps.length > 0 ? ` ${gaps.length} role${gaps.length !== 1 ? 's' : ''} without a person.` : '')
    + (people.some(r => r.kind === 'advisory')
      ? ` ${people.filter(r => r.kind === 'advisory').map(r => r.label).join(', ')} ${people.filter(r => r.kind === 'advisory').length === 1 ? 'is' : 'are'} newly added and can be assigned a different template.`
      : '')
  return (
    <span className="flex min-w-0 items-center">
      <span className="sr-only">{summary}</span>
      <AvatarGroup>
      {shown.map(r => (
        <Tip key={r.key} label={`${r.label} — ${r.sub}`} side="top">
          {r.avatar ? (
            r.kind === 'advisory' ? (
              <span tabIndex={0} className="relative inline-flex shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
                <PersonAvatar name={r.avatar} className="size-6" />
                <span
                  className="absolute -top-1 -end-1 size-3.5 rounded-full flex items-center justify-center border bg-background"
                  style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
                >
                  <i className="fa-solid fa-arrow-right-arrow-left text-[7px]" aria-hidden="true" />
                </span>
              </span>
            ) : (
              <span tabIndex={0} className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
                <PersonAvatar name={r.avatar} className={cn('size-6', r.kind === 'blocked' && 'grayscale')} />
              </span>
            )
          ) : (
            <span
              tabIndex={0}
              className="size-6 rounded-full flex items-center justify-center shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              style={{ background: 'var(--muted)' }}
            >
              <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
            </span>
          )}
        </Tip>
      ))}
      {extra > 0 && <AvatarGroupCount>+{extra}</AvatarGroupCount>}
      {gaps.length > 0 && (
        <Tip label={gaps.length === 1 ? `${gaps[0].label} needs a person` : `${gaps.length} roles need a person`} side="top">
          <span
            tabIndex={0}
            className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            style={{ borderColor: 'var(--chip-5)', color: 'var(--chip-5)' }}
          >
            <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
          </span>
        </Tip>
      )}
      </AvatarGroup>
    </span>
  )
}

function RowActionMini({ rows, onOpen, updateNotice }: { rows: EvaluateeRow[]; onOpen: () => void; updateNotice?: string | null }) {
  // Highest priority — ST-02 "Draft and Scheduled resume": "Previously
  // assigned template still Published but edited since save... row shows a
  // 'template updated since Draft was saved' notice." Surfaced in the
  // Action column so it can't be missed the way a change buried only inside
  // the panel could be.
  if (updateNotice) {
    return (
      <Button variant="ghost" size="xs" className="justify-start min-w-0 max-w-full" style={{ color: 'var(--insight-severity-info-fg)' }} onClick={onOpen}>
        <i className="fa-solid fa-arrow-rotate-right text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">{updateNotice}</span>
      </Button>
    )
  }
  const gaps = rows.filter((r): r is Extract<EvaluateeRow, { kind: 'gap' }> => r.kind === 'gap')
  if (gaps.length > 0) {
    return (
      <Button variant="outline" size="xs" className="justify-start min-w-0 max-w-full" onClick={onOpen}>
        <i className="fa-regular fa-circle-plus text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">{gaps.length === 1 ? `Assign ${gaps[0].label}` : `Assign ${gaps.length} roles`}</span>
      </Button>
    )
  }
  const advisories = rows.filter((r): r is Extract<EvaluateeRow, { kind: 'advisory' }> => r.kind === 'advisory')
  if (advisories.length > 0) {
    return (
      <Button variant="ghost" size="xs" className="justify-start min-w-0 max-w-full" style={{ color: 'var(--chip-4)' }} onClick={onOpen}>
        <i className="fa-solid fa-arrow-right-arrow-left text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">
          {advisories.length === 1 ? `Review ${advisories[0].label}’s template` : `Review ${advisories.length} new faculty templates`}
        </span>
      </Button>
    )
  }
  return <span className="text-sm text-muted-foreground">&mdash;</span>
}

// Available to add to ANY course now (Romit's 2026-08-06 call) — one shared
// pool, not DPT-510-specific.
const EXTRA_TEMPLATES: TemplateEntry[] = [
  { template: SECOND_TEMPLATE, criteria: ['students', 'courseDirector'] },
  { template: MOCK_TEMPLATES.find(t => t.id === 'tmpl2')!, criteria: ['coordinator', 'teachingAssistant'] },
  { template: MOCK_TEMPLATES.find(t => t.id === 'tmplrich')!, criteria: ['students', 'guestLecturer'] },
]

// Every template a course's PRIMARY slot can switch to via the real
// TemplateControl picker (Wave 3) — reuses EXTRA_TEMPLATES' own criteria
// pairs plus TEMPLATE_1 itself (so switching away and back both work), each
// resolved generically via resolveGenericRows same as an added secondary
// template — the hand-tuned advisory/blocked story on a given course's
// default template is specific to that assignment, not something a switch
// target inherits.
const SWITCHABLE_TEMPLATES: TemplateEntry[] = [
  { template: TEMPLATE_1, criteria: ['students', 'instructor', 'coordinator'] },
  ...EXTRA_TEMPLATES,
]

// ── Unified course card — collapsed DataTable row + expanded panel.
// Replaces four bespoke per-course components: add-template, toggle state,
// and status computation now live in ONE place so every course gets the
// same capabilities (Romit's "per course I should be allowed to add more
// templates" call). Callers supply only what's genuinely bespoke per course
// — its primary template's already-resolved rows. ──────────────────────────
function CourseCard({
  offering, code, name, primaryTemplate, primaryCriteria, primaryRows, onIncludeSpecialRow, onStatusChange, extraFooter, defaultOpen, templateUpdatedRole, onCreateTemplate,
}: {
  offering: CourseOffering
  code: string
  name: string
  primaryTemplate: PceTemplate
  primaryCriteria: Criterion[]
  primaryRows: EvaluateeRow[]
  /** Passthrough for a row whose inclusion is driven by page-level state
      (DPT-530's Dr. Omar Hassan / Auto Update), not the generic toggle. */
  onIncludeSpecialRow?: (key: string) => void
  onStatusChange: (code: string, status: { attention: AttentionTag; rowStatus: RowStatusTag }) => void
  /** DPT-530's Auto Update Refresh/Reset controls — the one piece of UI
      that's genuinely course-specific beyond the primary rows themselves. */
  extraFooter?: ReactNode
  defaultOpen?: boolean
  /** ST-02 "Draft and Scheduled resume": the row's already-assigned
      template picked up a new role since this survey's Draft was last
      saved. `primaryRows`/`primaryCriteria` are expected to already reflect
      the CURRENT (updated) definition — this only drives the awareness
      notice, never the underlying rows ("row keeps the template,
      faculty-gap status recomputes against its current definition"). */
  templateUpdatedRole?: string
  /** Page-level "New template" flow (Wave 5) — same real create+build
      subView the Change picker's empty state would launch in production. */
  onCreateTemplate: () => void
}) {
  // Live templates (Wave 5) — same reasoning as TemplateSection above.
  const { templates } = usePce()
  const [open, setOpen] = useState(!!defaultOpen)
  const [addedIds, setAddedIds] = useState<string[]>([])
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set())
  const [removed, setRemoved] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)
  const [updateAcknowledged, setUpdateAcknowledged] = useState(false)
  const showUpdateNotice = !!templateUpdatedRole && !updateAcknowledged
  const toggleRow = (key: string) => setExcludedKeys(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })

  // Wave 3 — real "Change template" flow via the imported TemplateControl.
  // changedTemplateId is null until the Admin actually confirms a switch;
  // until then the course keeps its hand-tuned primaryTemplate/Criteria/Rows
  // (including any advisory/blocked story specific to that assignment).
  // After a switch, coverage for the new template is resolved generically —
  // same resolveGenericRows path an added secondary template already uses.
  const [changedTemplateId, setChangedTemplateId] = useState<string | null>(null)
  const [changingTemplate, setChangingTemplate] = useState(false)
  const [stagedTemplateId, setStagedTemplateId] = useState('')
  // A template built via the live "New template" flow won't be in
  // SWITCHABLE_TEMPLATES (that pool is fixed demo scaffolding) — fall back
  // to the same generic students/instructor/coordinator coverage TEMPLATE_1
  // uses there. This demo's readiness model (CRITERION_BY_TYPE) is a closed
  // enum, so an arbitrary user-built role set can't be mapped exactly; this
  // is a known simplification, not silently pretending otherwise.
  const effectiveEntry = changedTemplateId
    ? SWITCHABLE_TEMPLATES.find(e => e.template.id === changedTemplateId)
      ?? { template: templates.find(t => t.id === changedTemplateId)!, criteria: ['students', 'instructor', 'coordinator'] as Criterion[] }
    : { template: primaryTemplate, criteria: primaryCriteria }
  const effectiveTemplate = effectiveEntry.template
  const effectiveCriteria = effectiveEntry.criteria
  const effectiveRows = changedTemplateId
    ? resolveGenericRows(effectiveEntry, offering, new Set(), new Map())
    : primaryRows

  const addedExtra = addedIds.map(id => EXTRA_TEMPLATES.find(e => e.template.id === id)!)
  const remainingExtra = EXTRA_TEMPLATES.filter(e => !addedIds.includes(e.template.id))

  // First template (add-order) to list a criterion wins it — primary is
  // always first. Every later template that also lists it renders
  // 'deduped' instead of asking again.
  const claimed = new Map<Criterion, string>(effectiveCriteria.map(c => [c, effectiveTemplate.name]))
  const extraRows = addedExtra.map(entry => {
    const dedupedHere = new Set<Criterion>()
    for (const c of entry.criteria) {
      if (claimed.has(c)) dedupedHere.add(c)
      else claimed.set(c, entry.template.name)
    }
    return resolveGenericRows(entry, offering, dedupedHere, claimed)
  })

  const sections = [{ criteria: effectiveCriteria, rows: effectiveRows }, ...addedExtra.map((e, i) => ({ criteria: e.criteria, rows: extraRows[i] }))]
  const allRows = sections.flatMap(s => s.rows)
  const hasBlockedUnit = allRows.some(r => r.kind === 'blocked')
  const hasGap = allRows.some(r => r.kind === 'gap')
  const anyZeroFaculty = sections.some(({ rows }) => {
    const people = rows.filter(r => r.kind === 'ready' || r.kind === 'advisory' || r.kind === 'blocked').length
    const gaps = rows.filter(r => r.kind === 'gap').length
    return people === 0 && gaps > 0
  })
  const rowStatus: RowStatusTag = anyZeroFaculty ? 'blocked' : hasGap ? 'gap' : 'ready'
  const attention: AttentionTag = (rowStatus !== 'ready' || hasBlockedUnit || showUpdateNotice || allRows.some(r => r.kind === 'advisory' || r.kind === 'excluded')) ? 'attention' : 'ready'

  useEffect(() => {
    onStatusChange(code, { attention, rowStatus })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, attention, rowStatus, onStatusChange])

  // ST-02: "All units deselected on a course = treated as that course row
  // is deselected completely."
  const toggleableKeys = allRows.filter(r => r.kind === 'ready' || r.kind === 'advisory').map(r => r.key)
  const allUnitsExcluded = toggleableKeys.length > 0 && toggleableKeys.every(k => excludedKeys.has(k))
  const effectivelyRemoved = removed || allUnitsExcluded
  const includedCount = toggleableKeys.length - toggleableKeys.filter(k => excludedKeys.has(k)).length
  // Tri-state, matching the real course-level Checkbox
  // (step-survey-instances.tsx:1944-1949) — indeterminate when some but not
  // all evaluatees are toggled off, not just a flat boolean.
  const courseCheckedState: boolean | 'indeterminate' = removed
    ? false
    : toggleableKeys.length === 0
      ? true
      : includedCount === toggleableKeys.length
        ? true
        : includedCount > 0 ? 'indeterminate' : false

  const blockedRoleLabels = allRows.filter((r): r is Extract<EvaluateeRow, { kind: 'blocked' }> => r.kind === 'blocked')
    .map(r => `${r.sub} coverage for ${r.label}`).join(', ')

  const typeLabel = COURSE_TYPE_FULL_LABEL[MODE]

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* Open-row accent — nothing distinguished an open row from a closed
          one besides the chevron rotating, in a long list that made it hard
          to tell which row a scrolled-past panel belonged to. Left rule
          reuses TemplateSection's own hierarchy vocabulary. The bottom
          border stays static (matches step-survey-instances.tsx's own open
          rows, which never drop it) — only the left accent + background vary. */}
      <div
        className="grid items-center gap-3 ps-3 pe-3 py-2 border-l-2 border-b border-border"
        style={{ gridTemplateColumns: TABLE_GRID, minHeight: 44, borderLeftColor: open ? 'var(--primary)' : 'transparent', background: open ? 'var(--accent)' : undefined }}
      >
        <span className="flex items-center">
          {/* Course-level control stays Checkbox — ST-02 says so explicitly
              ("This screen carries Step 1's same course-selection
              checkbox"). Only per-evaluatee controls became ToggleSwitch. */}
          <Checkbox
            checked={courseCheckedState}
            onCheckedChange={v => {
              if (v) { setRemoved(false); setExcludedKeys(new Set()) } else { setRemoved(true) }
            }}
            aria-label={`Include ${code} in this push`}
          />
        </span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="group" aria-label={`${open ? 'Hide' : 'Show'} template and evaluatees for ${code}`}>
            <i className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <span className="flex flex-col gap-0.5 min-w-0 py-0.5">
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
            <span className="truncate text-sm">{name}</span>
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">{offering.enrolledCount} students</span>
        </span>
        <span className="text-sm text-muted-foreground truncate">{typeLabel}</span>
        <span className="min-w-0"><MiniTemplateChip name={effectiveTemplate.name} /></span>
        <span className="min-w-0"><MiniEvaluateeCluster rows={allRows} /></span>
        <span className="min-w-0">
          {rowStatus === 'blocked'
            ? <ListHubStatusBadge label="Blocked" tint={LIST_HUB_STATUS_TINT_DANGER} icon="fa-lock" />
            : rowStatus === 'gap'
              ? <ListHubStatusBadge label="Gap" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-user-slash" />
              : <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />}
        </span>
        <span className="min-w-0">
          <RowActionMini rows={allRows} onOpen={() => setOpen(true)} updateNotice={showUpdateNotice ? 'Template updated' : null} />
        </span>
      </div>

      <CollapsibleContent>
        <Card className="mx-4 mb-3 shadow-sm">
          <CardContent className="flex flex-col gap-4">
            {effectivelyRemoved ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border p-3">
                <span className="text-sm text-muted-foreground">
                  {allUnitsExcluded && !removed
                    ? `Every evaluatee on ${code} is deselected — treated as removed from this push.`
                    : `${code} removed from this push.`}
                </span>
                <Button variant="link" size="xs" className="h-auto px-0" onClick={() => { setRemoved(false); setExcludedKeys(new Set()) }}>Undo</Button>
              </div>
            ) : (
              <>
                {showUpdateNotice && (
                  <div className="flex items-center justify-between gap-3 rounded-md border p-3" style={{ borderColor: 'var(--insight-severity-info-fg)', background: 'var(--insight-severity-info-bg)' }}>
                    <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--insight-severity-info-fg)' }}>
                      <i className="fa-solid fa-arrow-rotate-right" aria-hidden="true" />
                      <span>
                        {primaryTemplate.name} was edited since this Draft/Scheduled survey was last saved — it now
                        {' '}also covers <strong>{templateUpdatedRole}</strong>. Faculty coverage below reflects the
                        {' '}current definition.
                      </span>
                    </span>
                    <Button variant="ghost" size="xs" className="shrink-0" onClick={() => setUpdateAcknowledged(true)}>Got it</Button>
                  </div>
                )}
                {changingTemplate && (
                  <div className="flex flex-col gap-3 rounded-md border border-border p-3" style={{ background: 'var(--muted)' }}>
                    <span className="text-sm font-medium">Change template for {code}</span>
                    <TemplateControl
                      offering={offering}
                      templateId={stagedTemplateId || effectiveTemplate.id}
                      defaultTemplateId={TEMPLATE_1.id}
                      publishedTemplates={templates.filter(t => t.status === 'active')}
                      onTemplateChange={(_offeringId, tid) => setStagedTemplateId(tid)}
                      onCreate={onCreateTemplate}
                      onPreview={setPreviewTemplate}
                    />
                    {stagedTemplateId && stagedTemplateId !== effectiveTemplate.id ? (
                      <div className="flex items-center justify-between gap-3 rounded-md border p-2.5" style={{ borderColor: 'var(--primary)', background: 'var(--card)' }}>
                        <span className="text-xs text-muted-foreground">
                          Switching to{' '}
                          <span className="font-medium text-foreground">
                            {SWITCHABLE_TEMPLATES.find(e => e.template.id === stagedTemplateId)?.template.name}
                          </span>{' '}
                          recomputes evaluatee coverage for {code} — any per-person overrides on the current
                          {' '}template won&rsquo;t carry over.
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="xs" onClick={() => { setStagedTemplateId(''); setChangingTemplate(false) }}>
                            Keep current
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => {
                              setChangedTemplateId(stagedTemplateId)
                              setExcludedKeys(new Set())
                              setStagedTemplateId('')
                              setChangingTemplate(false)
                            }}
                          >
                            Switch template
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="ghost" size="xs" className="self-start" onClick={() => { setStagedTemplateId(''); setChangingTemplate(false) }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-6">
                  <TemplateSection
                    entry={{ template: effectiveTemplate, criteria: effectiveCriteria }}
                    isFirst
                    rows={effectiveRows}
                    onChangeTemplate={() => setChangingTemplate(true)}
                    onPreview={setPreviewTemplate}
                    excludedKeys={excludedKeys}
                    onToggleRow={toggleRow}
                    onIncludeRow={onIncludeSpecialRow}
                  />
                  {addedExtra.map((entry, i) => (
                    <TemplateSection
                      key={entry.template.id}
                      entry={entry}
                      isFirst={false}
                      rows={extraRows[i]}
                      onRemove={() => setAddedIds(ids => ids.filter(id => id !== entry.template.id))}
                      onPreview={setPreviewTemplate}
                      excludedKeys={excludedKeys}
                      onToggleRow={toggleRow}
                    />
                  ))}
                </div>
                {remainingExtra.length > 0 ? (
                  <div className="flex flex-col gap-2 pl-4">
                    <span className="text-xs font-medium text-muted-foreground">Add another template</span>
                    <div className="flex flex-wrap gap-2">
                      {remainingExtra.map(entry => (
                        <Button key={entry.template.id} variant="outline" size="sm" onClick={() => setAddedIds(ids => [...ids, entry.template.id])}>
                          <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
                          {entry.template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : addedExtra.length > 0 && (
                  <div className="flex items-center gap-1.5 pl-4 text-xs text-muted-foreground">
                    <i className="fa-light fa-circle-check text-xs" aria-hidden="true" />
                    All available templates have been added to {code}.
                  </div>
                )}
                {extraFooter}
                {hasBlockedUnit && (
                  <Card style={{ borderColor: 'var(--chip-destructive)' }}>
                    <CardContent className="flex flex-col gap-2.5 p-4">
                      <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--chip-destructive)' }}>
                        <i className="fa-solid fa-lock text-xs" aria-hidden="true" />
                        Can&rsquo;t push {code} again yet
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Some of {code}&rsquo;s coverage is ready to send, but {blockedRoleLabels} is already covered
                        {' '}by a Live survey opened Dec 6, and this push can&rsquo;t include just part of a course.
                        {' '}To send {code}, either open that survey and cancel or archive it, or leave {code} out of
                        {' '}this push for now.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="xs" asChild>
                          <Link href={`/surveys/${BLOCKING_SURVEY.id}`}>Open existing survey</Link>
                        </Button>
                        <Button variant="outline" size="xs" onClick={() => setRemoved(true)}>Remove {code} from this push</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
      <SurveyPreviewDialog template={previewTemplate} open={!!previewTemplate} onOpenChange={v => { if (!v) setPreviewTemplate(null) }} />
    </Collapsible>
  )
}

// ── Scenario 1 — DPT-501 (co9): Ready, single template ──────────────────
// Primary template deliberately covers only students + instructor (not
// coordinator) — narrowed 2026-08-06 so that adding "Faculty Midterm
// Check-In" (criteria coordinator + teachingAssistant, see EXTRA_TEMPLATES)
// resolves coordinator to a real, undeduped person via the real
// CRITERION_BY_TYPE resolver, making the "+ Add another template" toggle
// capability genuinely demonstrable instead of every addition landing on an
// already-claimed or unresolvable role.
function ReadyCourseDemo({ onStatusChange, onCreateTemplate }: { onStatusChange: CourseCardStatusHandler; onCreateTemplate: () => void }) {
  const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co9')!
  const instructor = facultyName(offering.collaboratorIds[0])
  const primaryCriteria: Criterion[] = ['students', 'instructor']
  const primaryRows: EvaluateeRow[] = [
    { kind: 'ready', key: 'students', label: 'Course material', sub: 'Course' },
    { kind: 'ready', key: 'instructor', label: instructor!, sub: 'Instructor', avatar: instructor! },
  ]
  return (
    <CourseCard
      offering={offering} code="DPT-501" name="Human Anatomy & Kinesiology"
      primaryTemplate={TEMPLATE_1} primaryCriteria={primaryCriteria} primaryRows={primaryRows}
      onStatusChange={onStatusChange} onCreateTemplate={onCreateTemplate}
    />
  )
}

// ── Scenario 2 — DPT-502 (co10): Gap, Instructor unresolved ─────────────
function GapCourseDemo({ onStatusChange, onCreateTemplate }: { onStatusChange: CourseCardStatusHandler; onCreateTemplate: () => void }) {
  const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co10')!
  const coordinator = facultyName(offering.primaryFacultyId)
  const primaryCriteria: Criterion[] = ['students', 'instructor', 'coordinator']
  const primaryRows: EvaluateeRow[] = [
    { kind: 'ready', key: 'students', label: 'Course material', sub: 'Course' },
    { kind: 'gap', key: 'instructor', label: CRITERION_BY_TYPE[MODE].instructor!.label, prismHref: prismAddHref(offering, 'instructor') },
    { kind: 'ready', key: 'coordinator', label: coordinator!, sub: 'Coordinator', avatar: coordinator! },
  ]
  return (
    <CourseCard
      offering={offering} code="DPT-502" name="Physiology &amp; Pathophysiology"
      primaryTemplate={TEMPLATE_1} primaryCriteria={primaryCriteria} primaryRows={primaryRows}
      onStatusChange={onStatusChange} onCreateTemplate={onCreateTemplate}
    />
  )
}

// ── Scenario 3 — DPT-510 (co13): Blocked person + Advisory ──────────────
function MultiTemplateCourseDemo({ onStatusChange, onCreateTemplate }: { onStatusChange: CourseCardStatusHandler; onCreateTemplate: () => void }) {
  const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co13')!
  // DPT-510 is real fixture ground for the ST-02 "Draft/Scheduled resume,
  // template updated since save" notice too: co13 already carries pf0/pf1
  // (both 'scheduled' — non-blocking, would be pulled in for editing) and
  // pf2 ('active'/Live — the Kevin Chen block above), so this course is
  // already the one place in the fixture genuinely framed as "an existing
  // survey, being revisited." End-of-Term Evaluation is simulated here as
  // having picked up Course Director since that survey was last saved —
  // resolved through the real CRITERION_BY_TYPE.courseDirector (co13 has no
  // collaboratorIds[2], so it's a genuine gap, not an invented one).
  const primaryCriteria: Criterion[] = ['students', 'instructor', 'coordinator', 'courseDirector']
  const primaryRows: EvaluateeRow[] = [
    { kind: 'ready', key: 'students', label: 'Course material', sub: 'Course' },
    { kind: 'ready', key: 'coordinator', label: 'Dr. Anita Patel', sub: 'Coordinator', avatar: 'Dr. Anita Patel' },
    { kind: 'advisory', key: 'instructor-gomez', label: 'Dr. Rachel Gomez', sub: 'Instructor', avatar: 'Dr. Rachel Gomez', coveredByName: 'Dr. Kevin Chen' },
    { kind: 'blocked', key: 'instructor-chen', label: 'Dr. Kevin Chen', sub: 'Instructor', avatar: 'Dr. Kevin Chen' },
    { kind: 'gap', key: 'course-director', label: CRITERION_BY_TYPE[MODE].courseDirector!.label, prismHref: prismAddHref(offering, 'courseDirector') },
  ]
  return (
    <CourseCard
      offering={offering} code="DPT-510" name="Musculoskeletal Physical Therapy I"
      primaryTemplate={TEMPLATE_1} primaryCriteria={primaryCriteria} primaryRows={primaryRows}
      onStatusChange={onStatusChange} templateUpdatedRole="Course Director" onCreateTemplate={onCreateTemplate}
    />
  )
}

// ── Scenario 4 — DPT-530 (co15): Auto Update ON vs OFF ───────────────────
// Grounded in the Aug 4 Granola call: Auto Update is ONE global flag (not
// per-course), and flipping it does nothing by itself — it only decides how
// a unit the wizard hasn't seen before is treated ON THE NEXT REFRESH.
// Units already discovered keep whatever selection they got at discovery
// time ("selections you have already made never change" — the real page's
// own copy, step-survey-instances.tsx:1815). Dr. Omar Hassan (real
// MOCK_FACULTY f6, not otherwise on this course) is undiscovered until
// Refresh is clicked; Refresh captures whatever Auto Update is set to AT
// THAT MOMENT. "Reset" re-hides him so both branches can be replayed — the
// one piece with no static-fixture equivalent, since Prism additions are
// inherently a live event, not a snapshot field.
type HassanDiscovery = { autoUpdateWasOn: boolean; selected: boolean }
type CourseCardStatusHandler = (code: string, status: { attention: AttentionTag; rowStatus: RowStatusTag }) => void

function AutoUpdateCourseDemo({
  discovered, onRefresh, onReset, onIncludeHassan, onStatusChange, onCreateTemplate,
}: {
  discovered: HassanDiscovery | null
  onRefresh: () => void
  onReset: () => void
  onIncludeHassan: () => void
  onStatusChange: CourseCardStatusHandler
  onCreateTemplate: () => void
}) {
  const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co15')!
  const coordinator = facultyName(offering.primaryFacultyId)!
  const instructor = facultyName(offering.collaboratorIds[0])!
  const primaryCriteria: Criterion[] = ['students', 'instructor', 'coordinator']
  const primaryRows: EvaluateeRow[] = [
    { kind: 'ready', key: 'students', label: 'Course material', sub: 'Course' },
    { kind: 'ready', key: 'instructor', label: instructor, sub: 'Instructor', avatar: instructor },
    { kind: 'ready', key: 'coordinator', label: coordinator, sub: 'Coordinator', avatar: coordinator },
  ]
  if (discovered && !discovered.selected) {
    primaryRows.push({ kind: 'excluded', key: 'hassan', label: 'Dr. Omar Hassan', sub: 'Instructor', avatar: 'Dr. Omar Hassan' })
  } else if (discovered?.selected) {
    primaryRows.push({ kind: 'ready', key: 'hassan', label: 'Dr. Omar Hassan', sub: 'Instructor (added in Prism)', avatar: 'Dr. Omar Hassan' })
  }

  const footer = (
    <div className="flex items-center justify-between gap-3 pl-4">
      {!discovered ? (
        <span className="text-xs text-muted-foreground">Dr. Omar Hassan was just added as a co-instructor in Prism — not reflected here until the next refresh (use the Auto Update bar above).</span>
      ) : (
        <span className="text-xs text-muted-foreground">
          Found on last refresh, Auto Update was {discovered.autoUpdateWasOn ? 'on' : 'off'} at that moment
          {!discovered.autoUpdateWasOn && discovered.selected ? ' — manually included since' : ''}.
        </span>
      )}
      <div className="flex items-center gap-2 shrink-0">
        {discovered && <Button variant="ghost" size="xs" onClick={onReset}>Reset demo</Button>}
        <Button variant="outline" size="xs" disabled={!!discovered} onClick={onRefresh}>Refresh</Button>
      </div>
    </div>
  )

  return (
    <CourseCard
      offering={offering} code="DPT-530" name="Therapeutic Exercise"
      primaryTemplate={TEMPLATE_1} primaryCriteria={primaryCriteria} primaryRows={primaryRows}
      onIncludeSpecialRow={onIncludeHassan} onStatusChange={onStatusChange} extraFooter={footer}
      onCreateTemplate={onCreateTemplate}
    />
  )
}

// Romit's 2026-08-06 call: filter counts were static/stale. Each CourseCard
// now reports its own live status; `statuses` is the reactive source of
// truth for both the tab counts and which rows are visible.
const COURSES_META: { code: string; name: string }[] = [
  { code: 'DPT-501', name: 'Human Anatomy & Kinesiology' },
  { code: 'DPT-502', name: 'Physiology & Pathophysiology' },
  { code: 'DPT-510', name: 'Musculoskeletal Physical Therapy I' },
  { code: 'DPT-530', name: 'Therapeutic Exercise' },
]

export default function PushStep2TemplateHierarchyComparePage() {
  const { templates } = usePce()
  const [autoUpdateOn, setAutoUpdateOn] = useState(false)
  const [discovered, setDiscovered] = useState<HassanDiscovery | null>(null)
  const [filter, setFilter] = useState<'all' | 'attention' | 'blocked'>('all')
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState<Record<string, { attention: AttentionTag; rowStatus: RowStatusTag }>>({})
  // Wave 5 — "New template" was a dead button (no onClick at all) and
  // TemplateControl's own empty-state "Create template" no-opped too.
  // Real precedent: step-survey-instances.tsx:1318,1596-1621 — ONE subView
  // swap for the whole page, using the same exported CreateBlankTemplate +
  // embedded TemplateEditor. Ported directly, not reinvented.
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<string | null>(null)

  const reportStatus: CourseCardStatusHandler = (code, status) => setStatuses(prev => {
    const existing = prev[code]
    if (existing && existing.attention === status.attention && existing.rowStatus === status.rowStatus) return prev
    return { ...prev, [code]: status }
  })

  const attentionCount = Object.values(statuses).filter(s => s.attention === 'attention').length
  const blockedCount = Object.values(statuses).filter(s => s.rowStatus === 'blocked').length

  const matchesSearch = (c: { code: string; name: string }) =>
    !search.trim() || `${c.code} ${c.name}`.toLowerCase().includes(search.trim().toLowerCase())
  const matchesFilter = (code: string) => {
    if (filter === 'all') return true
    const s = statuses[code]
    if (!s) return true // not yet reported — don't hide before the child mounts
    return filter === 'attention' ? s.attention === 'attention' : s.rowStatus === 'blocked'
  }
  const isVisible = (code: string) => {
    const meta = COURSES_META.find(c => c.code === code)!
    return matchesSearch(meta) && matchesFilter(code)
  }
  const anyVisible = COURSES_META.some(c => isVisible(c.code))

  // Real create+build swap (step-survey-instances.tsx:1596-1621) — replaces
  // the whole step body, same as production, rather than a dialog/sheet.
  if (subView !== 'assign') {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <SiteHeader breadcrumbs={[{ label: 'Dashboard', href: '/course-evaluation/dashboard' }]} title="Set up Evaluations" />
        <div className="flex-1 overflow-auto flex flex-col" style={{ padding: '32px 40px 40px' }}>
          <div className="flex flex-col gap-3 w-full">
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setSubView('assign')}
              >
                <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
                Back to Survey design
              </Button>
            </div>
            {subView === 'create' ? (
              <CreateBlankTemplate onCreated={id => setSubView({ buildId: id })} />
            ) : (
              <TemplateEditor
                templateId={subView.buildId}
                embedded
                onPublished={id => {
                  const t = templates.find(x => x.id === id)
                  setNotice(`${t?.name || 'Template'} published — available to assign below.`)
                  setSubView('assign')
                }}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    // 2026-08-06 — reuses the real SiteHeader + WizardNav (not a repaint)
    // and the Step 2 title block verbatim from step-survey-instances.tsx
    // :1627-1658. Save as draft / Reset to defaults stay visual-parity only
    // — no wizard state behind them in this demo. "New template" (Wave 5)
    // is real — see the subView swap above.
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader breadcrumbs={[{ label: 'Dashboard', href: '/course-evaluation/dashboard' }]} title="Set up Evaluations" />
      <h1 className="sr-only">Set up Evaluations</h1>
      <WizardNav currentStep={2} completedUpTo={1} onStepClick={() => {}} mode="course_evaluation" />

      <div className="flex-1 overflow-auto flex flex-col" style={{ padding: '32px 40px 40px' }}>
        <div className="flex flex-col gap-5 w-full">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="text-xl font-semibold font-heading">
                You&apos;re setting up <span className="tabular-nums">10 evaluations</span> across{' '}
                <span className="tabular-nums">4 courses</span> — hierarchical variant.
              </h2>
              <p className="text-sm text-muted-foreground tabular-nums">
                Grouped by template, not by decision type. Any course can carry more than one template now.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button variant="outline" size="sm">Save as draft</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
                Reset to defaults
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setNotice(null); setSubView('create') }}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                New template
              </Button>
            </div>
          </div>

          {notice && (
            <LocalBanner variant="success" dismissible onDismiss={() => setNotice(null)}>
              {notice}
            </LocalBanner>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <ToggleGroup type="single" value={filter} onValueChange={v => v && setFilter(v as typeof filter)} variant="outline" size="sm" aria-label="Filter courses">
              <ToggleGroupItem value="all">All <span className="tabular-nums text-muted-foreground">({COURSES_META.length})</span></ToggleGroupItem>
              <ToggleGroupItem value="attention">Needs attention <span className="tabular-nums text-muted-foreground">({attentionCount})</span></ToggleGroupItem>
              <ToggleGroupItem value="blocked">Blocked <span className="tabular-nums text-muted-foreground">({blockedCount})</span></ToggleGroupItem>
            </ToggleGroup>
            <div className="relative w-64">
              <i className="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" aria-hidden="true" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses" aria-label="Search courses by code or name" className="pl-8" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <label htmlFor="auto-update-units" className="flex items-center gap-2.5 cursor-pointer">
              <ToggleSwitch id="auto-update-units" checked={autoUpdateOn} onChange={() => setAutoUpdateOn(v => !v)} />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Auto Update</span>
                <span className="text-xs text-muted-foreground">Faculty found on the next refresh start selected. Selections you have already made never change.</span>
              </span>
            </label>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-muted-foreground">Recheck faculty assignments in Prism.</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!!discovered}
                onClick={() => setDiscovered({ autoUpdateWasOn: autoUpdateOn, selected: autoUpdateOn })}
              >
                Refresh
              </Button>
            </div>
          </div>

          <Card size="sm" className="py-0 gap-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid items-center gap-3 ps-3 pe-3 py-2 border-b border-border text-xs font-medium text-muted-foreground" style={{ gridTemplateColumns: TABLE_GRID }}>
                <span />
                <span />
                <span>Course</span>
                <span>Type</span>
                <span>Template</span>
                <span>Evaluatees</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {!anyVisible ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <i className="fa-light fa-circle-check text-muted-foreground" aria-hidden="true" style={{ fontSize: 28 }} />
                  <p className="text-sm font-medium">No courses match this filter</p>
                  <p className="text-xs text-muted-foreground">Switch to All to see every course in this push.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: isVisible('DPT-501') ? undefined : 'none' }}>
                    <ReadyCourseDemo onStatusChange={reportStatus} onCreateTemplate={() => { setNotice(null); setSubView('create') }} />
                  </div>
                  <div style={{ display: isVisible('DPT-502') ? undefined : 'none' }}>
                    <GapCourseDemo onStatusChange={reportStatus} onCreateTemplate={() => { setNotice(null); setSubView('create') }} />
                  </div>
                  <div style={{ display: isVisible('DPT-510') ? undefined : 'none' }}>
                    <MultiTemplateCourseDemo onStatusChange={reportStatus} onCreateTemplate={() => { setNotice(null); setSubView('create') }} />
                  </div>
                  <div style={{ display: isVisible('DPT-530') ? undefined : 'none' }}>
                    <AutoUpdateCourseDemo
                      discovered={discovered}
                      onRefresh={() => setDiscovered({ autoUpdateWasOn: autoUpdateOn, selected: autoUpdateOn })}
                      onReset={() => setDiscovered(null)}
                      onIncludeHassan={() => setDiscovered(d => d && { ...d, selected: true })}
                      onStatusChange={reportStatus}
                      onCreateTemplate={() => { setNotice(null); setSubView('create') }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
