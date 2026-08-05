'use client'

// Wizard step shell — hand-roll justified (no DS step-frame organism), see
// docs/governance/ds-adoption.md §PCE. Composes DS Card/AvatarGroup/Command/
// Collapsible/ToggleGroup/ToggleSwitch/Checkbox/Select/Button/Badge/Tip/
// AlertDialog/LocalBanner + ListHubStatusBadge/StoryStatusBadgeOS.
//
// Step 2 of the push wizard — "Survey design".
//
// PROMOTED (2026-08-03) from /compare/push-step2-simplify?v=g "Quiet table",
// replacing the ST-02 Phase 4 row-per-course design (chips + gap/conflict
// issue lines under them) after three rounds of live feedback found it still
// too busy: every row rendered full coverage detail even for the ~60% of
// courses (Ready) that needed no action, and the row-level "Covered by"
// state read as a bare status word nobody could parse.
//
// ACCORDION REVISION (2026-08-04, later same day) — even the "quiet" one-line
// row still packed 8 zones (checkbox, conditional chevron, course, type,
// template+preview, evaluatees, status, action) into a single line, reported
// as too many controls at once. Every row is now a Collapsible: the
// collapsed line carries only what's needed to triage (checkbox · chevron ·
// course · type · status · one primary action); Template and Evaluatees
// moved into the row's own expanded detail panel, where they get real
// labels and room instead of sharing a cramped grid cell. Rows open
// independently (a Set, not a single shared flag) so an admin comparing
// several flagged rows doesn't have one close every time another opens.
//
// ROUND 2 (2026-08-05) — round 1 dropped Template/Evaluatees from the
// collapsed row entirely, which meant every row had to be opened just to
// see what was assigned. Explored four structural answers at
// /compare/push-step2-row-detail (chip preview, card roster, toolbar+split,
// two-line row); this synthesizes the picked direction (card roster) with
// two pieces pulled from the others:
//   · TemplateChip / EvaluateeChipCluster (from "chip preview") sit back in
//     the collapsed row — read-only, no click target of their own — so
//     state is visible without opening anything. The panel is now only for
//     CHANGING something, never for reading it.
//   · Evaluatees in the expanded panel is a card roster (EvaluateeRoster,
//     from "card roster") instead of a flat list — each evaluatee is its
//     own checkbox-card, so the panel's width does real work.
//   · Template switches now stage before committing: picking a different
//     template shows an inline "what changes" strip (added/removed roles,
//     same voice as the S2 Override/Create-new dialog) with Switch/Keep
//     buttons, rather than committing silently. "Switch" still routes
//     through the real onTemplateChange, so the existing pendingReassign
//     conflict flow is untouched — this only adds a preview in front of it.
//   · The Preview-survey icon now reveals on hover/focus of the Template
//     control instead of sitting visible at rest — a secondary action that
//     doesn't need to compete with the primary Select for attention.
//
// What changed in round 1, and why (superseded by round 2 above, kept for
// the record):
//   · Evaluatees (course material AND faculty — not "Faculty," which
//     undersold the course-material avatar sitting right beside them) used
//     to be a read-only avatar summary that opened a Popover+Command picker
//     on click. Round 1 moved the list inline (no Popover); round 2 above
//     replaced that inline list with the card roster.
//   · Status is a real DS badge — `ListHubStatusBadge` (the same component
//     Step 1's readiness column uses) for every tier, including the hard
//     block, with a SOLID fill for Blocked so it reads as strictly the
//     loudest state in the row (a translucent DS `Badge
//     variant="destructive"` was tried first and read fainter than the
//     amber "unassigned" pill — backwards from the intended severity).
//   · The disclosure chevron now exists on every row (used to be
//     conflict-only). A role-overlap conflict's plain-sentence detail —
//     grouped by the SAME existing survey, so two instructors blocked by one
//     survey read as one fact ("Dr. Chen and Dr. Gomez are already being
//     evaluated by a Live survey opened Nov 20…") — folds into the same
//     expanded panel as Template/Evaluatees instead of being a second,
//     independent expansion mechanism.
//   · A segmented filter (All / Needs attention / Blocked) narrows the
//     visible rows without ever reordering the list — course-code order is
//     permanent, so "where did my course go" never happens. Defaults to
//     ALL: defaulting to "Needs attention" made a row you'd just fixed
//     (by assigning its template) vanish out from under you mid-task, which
//     read as data loss even though the row just moved to a filter you
//     weren't on. The filter is now an explicit, opt-in narrowing tool.
//
// Duplicate rules (role-grain, ST-02) live in lib/pce-push-validation.ts.
// Since Phase 2 (ST-02) the unit-selection state is PAGE-owned: a sticky
// per-unit map (UnitSelectionMap — selected/deselected, absence = untouched)
// that survives plan recomputes, is wiped per-course on template change, and
// is reconciled by the manual Refresh (reconcileUnitsOnRefresh) under the
// Auto Update flag. This step renders the plan against that map and reports
// selection changes up — the page pushes exactly the selected set (minus
// gaps, guarded there).

import { Fragment, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  AvatarGroup, AvatarGroupCount,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Button, Checkbox, LocalBanner, ToggleGroup, ToggleGroupItem, ToggleSwitch, Badge, Tip,
  Card, CardContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
  RadioGroup, RadioGroupItem, Label,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_DANGER,
} from '@/lib/list-status-badges'
import { usePce } from '@/components/pce/pce-state'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import {
  COURSE_TYPE_FULL_LABEL, deliveryModeOf,
  type CourseOffering, type PceTemplate, type DeliveryMode,
} from '@/lib/pce-mock-data'
import { courseLabelOf, templateCriteria, CRITERION_BY_TYPE, type Criterion } from '@/lib/pce-course-readiness'
import {
  storyStatusOf, expandInstances,
  type StoryStatus, type SurveyInstance, type UnitSelectionMap, type UnitSelectionState,
} from '@/lib/pce-push-validation'
import { EmptyHint } from './scope-controls'

/** ST-02 Phase 3 — one Draft-resume finding about a course's saved template.
 *  Built by the resume hydration in app/(app)/surveys/push/page.tsx:
 *  'updated' = template still published but edited since the draft was saved
 *  (criteria snapshot diff — pre-Live only; content freezes at Live);
 *  'unpublished' = template since unpublished/archived/deleted, row treated
 *  as "no template assigned". */
export interface TemplateDriftNotice {
  offeringId: string
  courseCode: string
  templateName: string
  kind: 'updated' | 'unpublished'
  /** CRITERION_TOGGLE_LABEL strings — roles the template gained since save. */
  addedRoleLabels: string[]
  /** Roles the template no longer covers since save. */
  removedRoleLabels: string[]
}

interface StepSurveyInstancesProps {
  /** Step-1 selection, already scoped + student-checked. */
  selectedOfferings: CourseOffering[]
  /** The expanded instance plan (page-owned — the push handler uses the same list). */
  instances: SurveyInstance[]
  publishedTemplates: PceTemplate[]
  templateAssignments: Record<string, string>
  defaultAssignments: Record<string, string>
  onTemplateChange: (offeringId: string, templateId: string) => void
  /** S2 — set (by the page) when onTemplateChange detects the offering
   *  already has a Draft/Scheduled survey under a DIFFERENT template. The
   *  AlertDialog below is co-located here (same convention as this file's
   *  other dialogs) but the conflict DETECTION lives in the page, since
   *  that's where the real survey records are. */
  pendingReassign: { offeringId: string; newTemplateId: string; existingTemplateId: string; existingStatus: 'draft' | 'scheduled' } | null
  onResolveReassign: (choice: 'override' | 'create-new') => void
  /** Dismiss without applying either choice — Escape, outside click, or the
   *  Cancel button all route here. Idempotent (just clears the pending
   *  state), safe to fire redundantly alongside onResolveReassign since
   *  Radix's AlertDialogAction also closes the dialog on click. */
  onCancelReassign: () => void
  /** S2 — the second, independent survey created by "Create new survey."
   *  Scoped to one extra slot per offering (see page.tsx comment) — enough
   *  to demo the coexisting-row state without the full N-template rewrite
   *  a general model would need. `scopePersonNames` absent = the original
   *  whole-role "Keep both" flow; present (2026-08-05) = the person-grain
   *  exception, this slot covers only those named people. */
  secondaryTemplateAssignments: Record<string, { templateId: string; scopePersonNames?: string[] }>
  secondaryInstances: SurveyInstance[]
  onSecondaryTemplateChange: (offeringId: string, templateId: string) => void
  /** Person-grain entry point (2026-08-05) — a late-added co-instructor
   *  (SurveyInstance.lateAddedRelativeTo set) picks a different template
   *  than their role's existing coverage without disturbing it. Fills the
   *  same one secondary slot as onSecondaryTemplateChange, scoped to just
   *  this person. */
  onAssignPersonTemplate: (offeringId: string, personName: string, templateId: string) => void
  onRemoveSecondary: (offeringId: string) => void
  onResetDefaults: () => void
  /** ST-02 sticky per-unit (role + person) selection — PAGE-owned so the
   *  template-change reset lives beside the assignments and Phase 3 can
   *  persist it with Save-as-Draft. The page seeds first-sight defaults
   *  (new → selected; gaps and duplicates → deselected), so every rendered
   *  instance has an entry here. */
  unitSelections: UnitSelectionMap
  onUnitSelectionChange: (keys: string[], state: UnitSelectionState) => void
  /** ST-02 Auto Update — one flag for every course row, top of the step.
   *  Governs only how units the rows haven't seen before arrive on the next
   *  manual Refresh; it never changes a state the admin already set. */
  autoUpdateOn: boolean
  onAutoUpdateChange: (on: boolean) => void
  /** Manual refresh (the only Prism fetch trigger) — the page re-derives the
   *  unit list and applies reconcileUnitsOnRefresh under the flag. */
  onRefreshUnits: () => void
  /** ST-02: Step 2 carries Step 1's course checkbox. Unchecking a course here
   *  writes the SAME page-owned selectedCourseIds Step 1 reports into — the
   *  course drops out of this push entirely (and out of `selectedOfferings`
   *  on the next render), not just its units. */
  onCourseSelectedChange: (offeringId: string, selected: boolean) => void
  /** ST-02 Phase 3 — Draft-resume template findings, rendered as one info
   *  LocalBanner at the top of the step. Empty/absent = no banner. */
  templateDriftNotices?: TemplateDriftNotice[]
  onDismissTemplateDrift?: () => void
  /** 2026-08-05 — Save as draft, grouped with Reset to defaults/New
   *  template instead of its own shell-level row (Romit's call): it's an
   *  action on this step's content the same way those two are, so it reads
   *  as part of the same action group, not a separately-floating button. */
  onSaveDraft?: () => void
  draftSavedAt?: string | null
  onBack: () => void
  onContinue: () => void
}

// ── Row/section pieces — MODULE scope on purpose ─────────────────────────────
// Defining these inside the component gives them a fresh identity every
// render: React then unmounts/remounts the whole row subtree on each click,
// replaying open animations from height 0 and yanking the scroll ("checkbox
// clicks scroll the page up", Jul 27). Keep them here.

/** Accordion revision, round 2 (post-Aug-4, same day): round 1 dropped
 *  Template and Evaluatees from the collapsed row entirely, moving them into
 *  the expanded panel — but that meant you had to open every row just to
 *  see what's assigned. This round puts them back as READ-ONLY preview
 *  chips (a template Badge + a non-overlapping avatar cluster, never an
 *  interactive control) — state is visible at rest again, the panel is only
 *  needed to CHANGE something. Grounded in the Aug 4 compare exploration
 *  (/compare/push-step2-row-detail, variant 1 "chip preview"). */
// checkbox · chevron · course · type · template chip · evaluatees chip · status · action
// 2026-08-05: Template/Evaluatees/Action were frozen px tracks that stayed
// pinned at their old width even when the row had slack to spare — Course
// alone absorbed all growth. Template and Action now share growth via
// minmax(...,1fr) instead of being frozen; Evaluatees stays a fixed track
// (avatars are fixed-size content, not text that benefits from extra room)
// but is widened to fit 3 avatars + "+N" count + gap indicator without
// relying on PersonAvatar's un-forwarded DS size (fixed alongside this).
const TABLE_GRID = `24px 24px minmax(160px,1.4fr) 76px minmax(168px,1fr) 156px 88px minmax(168px,1fr)`

type FilterKey = 'all' | 'attention' | 'blocked'
/** Per-course Continue-gate failure states (ST-02 Blocks). A faculty gap
 *  alone never appears here — it never blocks. */
type BlockReason = 'no-template' | 'overlap' | 'no-units' | 'unstaffed' | 'none-selected'

interface CourseGate {
  reasons: BlockReason[]
  fresh: SurveyInstance[]
  gaps: SurveyInstance[]
  dups: SurveyInstance[]
}

/** YYYY-MM-DD → "Dec 4" without the UTC-midnight day shift of new Date(iso). */
function fmtYmd(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** code + name split; master courses missing from the catalog fall back to the
 *  raw id — show it as the code so the row never goes blank. */
function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

const listFmt = (roles: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(roles)

/** Round 2 (post-Aug-4, same day) — the inline "what changes" strip shown
 *  while a template pick is staged but not yet committed. Same
 *  "not-applicable-to-this-delivery-mode = drop it" rule expandInstances
 *  applies internally, and the same voice already proven in the S2
 *  Override/Create-new dialog ("Stops evaluating X and adds Y."), just
 *  computed ahead of any commit instead of inside that dialog's own scope —
 *  intentionally NOT reusing that dialog's avatar-level diff (this is a
 *  lighter, always-available preview; the dialog only fires when there's a
 *  real Draft/Scheduled conflict to resolve). */
function templateSwitchConsequence(mode: DeliveryMode, current: PceTemplate | null, staged: PceTemplate): { added: string[]; removed: string[] } {
  const label = (c: Criterion) => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c]?.label)
  const applicable = (t: PceTemplate | null) => (t ? templateCriteria(t) : []).filter(c => c === 'students' || !!CRITERION_BY_TYPE[mode][c])
  const currentSet = new Set(applicable(current))
  const stagedCriteria = applicable(staged)
  const stagedSet = new Set(stagedCriteria)
  const added = stagedCriteria.filter(c => !currentSet.has(c)).map(label).filter((l): l is string => !!l)
  const removed = applicable(current).filter(c => !stagedSet.has(c)).map(label).filter((l): l is string => !!l)
  return { added, removed }
}

const BLOCK_BADGE_COPY: Record<BlockReason, { label: string; icon: string }> = {
  'overlap': { label: 'Blocked', icon: 'fa-lock' },
  'no-template': { label: 'No template', icon: 'fa-circle-xmark' },
  'unstaffed': { label: 'No one to evaluate', icon: 'fa-user-slash' },
  'none-selected': { label: 'Nothing selected', icon: 'fa-circle-xmark' },
  'no-units': { label: 'Nothing to evaluate', icon: 'fa-circle-xmark' },
}

// ═════════════════════════════════════════════════════════════════════════════
// Status — a compact severity read (Ready / Gap / Blocked), ALWAYS a real DS
// ListHubStatusBadge (never a hand-rolled dot+text span), and ALWAYS the
// SAME component family across every tier — differing only by tint, so a
// hard block is unmistakably the loudest, not a differently-shaped element.
//
// 2026-08-04 revision: the prior version named the specific role inline
// ("Instructor unassigned", "Placement Faculty unassigned") and stacked a
// block badge next to a gap badge — reported as too much text to scan across
// 13+ rows. The specific reason now lives in a Tip on hover (still one click
// away, never lost) and the fix itself lives in the Action column, which
// names the role in its own button label — so nothing this badge used to say
// is gone, it just isn't both badge text AND button text anymore.
//
// Blocked uses LIST_HUB_STATUS_TINT_DANGER (app/globals.css
// --qb-status-blocked-*), NOT a solid `--chip-destructive` fill with white
// text — that was tried and is a real theme bug, not just a style choice:
// --chip-destructive is an "ink" token that INTENTIONALLY flips lightness
// per theme so it stays readable as text against the page background (dark
// red in light theme, bright red in dark theme). Used as a solid badge fill
// instead, it renders deep maroon in light mode but washes out to a pale
// coral in dark mode — confirmed live by toggling `.dark` on <html>. The
// qb-status-* family avoids this entirely: a fixed light bg + dark
// saturated fg, the SAME two colors in every theme, reads correctly on both
// a light and a dark page via luminance contrast with the surface — no
// per-theme calibration needed, which is why Ready/gap already used it.
// ═════════════════════════════════════════════════════════════════════════════

/** Hover detail for a Blocked badge — every concurrent reason, joined, since
 *  the badge itself only ever says the one word "Blocked". */
function blockReasonSummary(gate: CourseGate): string {
  return gate.reasons
    .map(reason => {
      if (reason === 'overlap') {
        const roles = [...new Set(gate.dups.map(i => i.roleLabel || 'Course material'))]
        return roles.length > 0 ? `${roles.join(', ')} blocked` : 'Blocked'
      }
      return BLOCK_BADGE_COPY[reason].label
    })
    .join(' · ')
}

function RowStatus({ gate }: { gate: CourseGate }) {
  if (gate.reasons.length > 0) {
    return (
      <Tip label={blockReasonSummary(gate)} side="top">
        {/* ListHubStatusBadge renders a plain, non-focusable <span> — without
            tabIndex the Tip's detail (which reason(s) blocked this row) is
            mouse-hover-only and unreachable by keyboard (WCAG 1.4.13/2.1.1). */}
        <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
          <ListHubStatusBadge label="Blocked" tint={LIST_HUB_STATUS_TINT_DANGER} icon="fa-lock" />
        </span>
      </Tip>
    )
  }
  if (gate.gaps.length > 0) {
    const gapRoles = [...new Set(gate.gaps.map(i => i.roleLabel))]
    return (
      <Tip label={`${gapRoles.join(', ')} unassigned`} side="top">
        <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
          <ListHubStatusBadge label="Gap" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-user-slash" />
        </span>
      </Tip>
    )
  }
  return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
}

/** The Action column — the one explicit, clickable callout per row. Blocked
 *  rows show a dash: the fix is either the Template control (no-template) or
 *  the conflict panel inside the row's own expanded detail (overlap) — a
 *  second button here would just duplicate an affordance that's already
 *  visible once expanded. A Gap gets a button — EvaluateeChipCluster's
 *  dashed disc in the collapsed row shows THAT a role is unstaffed, but it
 *  isn't itself a click target; this button is the one real trigger to fix
 *  it (open the row, land in EvaluateeRoster below with the gap card already
 *  there).
 *
 *  2026-08-05: a row with no gaps or blocks can STILL have something worth a
 *  look — a late-added co-instructor (SurveyInstance.lateAddedRelativeTo)
 *  whose template choice defaults to "same as everyone else" but is a real,
 *  reversible decision, not a fact. This was previously invisible at scale
 *  (10+ courses/admin — Aug 4 transcript, Monil/Romit): the corner badge on
 *  the collapsed avatar and the card inside the panel only read if you're
 *  already looking at THIS row. A Ready row otherwise shows a dash exactly
 *  like one with nothing to decide, so nothing hinted a decision existed.
 *  Deliberately NOT styled like the Gap button (circle-plus, solid) — this
 *  is optional and already resolved to a safe default, not "something is
 *  missing." Ghost variant + the same chip-4 tint as the corner badge/card
 *  border keeps it recognizably part of the same vocabulary without
 *  reading as equally urgent. */
function RowAction({ gate, onAssign }: { gate: CourseGate; onAssign: () => void }) {
  if (gate.reasons.length > 0) {
    return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>&mdash;</span>
  }
  if (gate.gaps.length > 0) {
    const gapRoles = [...new Set(gate.gaps.map(i => i.roleLabel))]
    const label = gapRoles.length === 1 ? `Assign ${gapRoles[0]}` : `Assign ${gapRoles.length} roles`
    return (
      // min-w-0 on the button lets its text span actually shrink instead of
      // forcing the fixed-width grid track wider than the column (which the
      // Card's overflow-hidden would then silently clip) — "Assign Clinical
      // Coordinator" is the long case this guards against. Truncated
      // visually, never truncated for a screen reader (aria-label carries
      // the full text).
      <Button variant="outline" size="xs" className="justify-start min-w-0 max-w-full" onClick={onAssign} aria-label={label}>
        <i className="fa-regular fa-circle-plus text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </Button>
    )
  }
  const lateAdded = gate.fresh.filter(i => i.lateAddedRelativeTo)
  if (lateAdded.length > 0) {
    const label = lateAdded.length === 1
      ? `Review ${lateAdded[0].personName}'s template`
      : `Review ${lateAdded.length} new faculty templates`
    return (
      <Button
        variant="ghost"
        size="xs"
        className="justify-start min-w-0 max-w-full"
        style={{ color: 'var(--chip-4)' }}
        onClick={onAssign}
        aria-label={label}
      >
        <i className="fa-solid fa-arrow-right-arrow-left text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </Button>
    )
  }
  return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>&mdash;</span>
}

// ═════════════════════════════════════════════════════════════════════════════
// Evaluatees — two representations of the SAME state, at two zoom levels.
// Collapsed row: EvaluateeChipCluster, a read-only AvatarGroup preview, no
// click target of its own. Expanded panel: EvaluateeRoster, a card grid
// where each card IS the click target (round 2, post-Aug-4, same day —
// replaced an inline Command list that read as cramped once the panel had
// real width to use).
//
// Three prior attempts (pre-accordion) put the toggle directly ON the tiny
// avatar itself (a checkmark badge, then an ×/+ badge, then a bare DS
// Checkbox overlay) and each was reported unreliable/unclear in live
// testing — a 24px avatar is too small a target to carry both identity AND
// a selection control legibly. The card roster's Checkbox sits BESIDE the
// avatar inside a full-card Label, not on top of it — same lesson, applied
// at card scale instead of avatar scale.
// ═════════════════════════════════════════════════════════════════════════════

function evaluateeLabel(i: SurveyInstance): string {
  const name = i.scope === 'course' ? 'Course material' : (i.personName ?? '')
  return i.roleLabel && i.scope !== 'course' ? `${name} · ${i.roleLabel}` : name
}

function EvaluateeAvatar({ i, className }: { i: SurveyInstance; className?: string }) {
  return i.scope === 'course' ? (
    <span className={cn('rounded-full flex items-center justify-center border border-border bg-background shrink-0', className)}>
      <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={i.personName!} className={className} decorative />
  )
}

/** A role that would newly need staffing (status 'gap' — no person in Prism
 *  yet), shown alongside real avatars so an "adds Course Coordinator" role
 *  with nobody assigned reads the same way it does everywhere else in this
 *  step, not silently omitted from the row. Same dashed/chip-4 vocabulary as
 *  the Evaluatees detail's own gap glyph (step-survey-instances.tsx
 *  EvaluateeRoster), sized to match EvaluateeAvatar/ExcludedEvaluatee. */
function GapAvatar() {
  return (
    <span
      className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0"
      style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
    >
      <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
    </span>
  )
}

/** S4 — a unit that exists in Prism but was explicitly deselected from this
 *  push (Auto Update off): muted avatar + small corner ban badge, distinct
 *  from both the solid "included" avatar and the dashed "gap" circle.
 *  Decorative only, same as the gap/dup indicators beside it — no tabIndex,
 *  no per-item Tip. A focusable Tip nested inside the trigger Button (which
 *  is what an earlier pass here shipped) is a real problem, not just style:
 *  gap/dup indicators already establish "state lives in the outer button's
 *  aria-label, indicators are silent decoration" — breaking that here would
 *  add a keyboard dead-end (a focusable span with no Enter/Space handler,
 *  since spans don't get native activation) inside an already-interactive
 *  button. The exclusion is instead folded into the outer button's
 *  aria-label via summaryParts below.
 *  `grayscale` (not `opacity-*`, banned per A11Y-020) mutes the avatar without
 *  touching luminance — the initials/photo stay at full contrast, only the
 *  chroma drains, so it reads as "drained" without becoming unreadable. */
function ExcludedEvaluatee({ i }: { i: SurveyInstance }) {
  return (
    <span className="relative inline-flex shrink-0 rounded-full">
      <EvaluateeAvatar i={i} className="size-6 grayscale" />
      <span
        className="absolute -bottom-0.5 -end-0.5 size-3.5 rounded-full flex items-center justify-center border bg-background"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
      >
        <i className="fa-solid fa-ban text-[8px]" aria-hidden="true" />
      </span>
    </span>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Collapsed-row PREVIEW chips (round 2, same day) — a template Badge and a
// non-overlapping avatar cluster, read-only, so the collapsed row answers
// "which template, who's in" without opening the panel. Grounded in the
// Aug 4 compare exploration's "chip preview" variant. Neither is a click
// target of its own; the row's chevron is the only way in.
// ═════════════════════════════════════════════════════════════════════════════

/** Truncated template name in a Badge — full name rides a keyboard-reachable
 *  Tip (WCAG 1.4.13) since the chip itself is width-capped. */
/** Plain text, not a Badge pill — Romit's call, 2026-08-05: a pill here
 *  read as one more chip crowding the row next to the Evaluatees cluster.
 *  Still keyboard-reachable via the Tip (WCAG 1.4.13) since the name
 *  truncates. */
function TemplateChip({ template, code }: { template: PceTemplate | null; code: string }) {
  if (!template) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <i className="fa-light fa-file-slash text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">No template</span>
      </span>
    )
  }
  return (
    <Tip label={template.name} side="top">
      <span
        tabIndex={0}
        className="inline-flex min-w-0 items-center gap-1.5 rounded-sm text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        aria-label={`Template for ${code}: ${template.name}`}
      >
        <i className="fa-light fa-file-lines text-xs shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">{template.name}</span>
      </span>
    </Tip>
  )
}

/** Up to 3 gapped avatars (DS AvatarGroup — never overlapping) + "+N"
 *  overflow, plus one dashed disc when a role still needs a person. Reuses
 *  the same EvaluateeAvatar/GapAvatar vocabulary as the expanded panel, so
 *  the collapsed preview and the full list never disagree on what an icon
 *  means. */
function EvaluateeChipCluster({ code, gate, included }: { code: string; gate: CourseGate; included: ReadonlySet<string> }) {
  const inUnits = gate.fresh.filter(i => included.has(i.key))
  const shown = inUnits.slice(0, 3)
  const extra = inUnits.length - shown.length
  const gapCount = gate.gaps.length
  const lateAdded = inUnits.filter(i => i.lateAddedRelativeTo)
  const summary = inUnits.length > 0
    ? `Evaluatees for ${code}: ${inUnits.map(evaluateeLabel).join(', ')}.`
    : `Evaluatees for ${code}: none included.`
  if (inUnits.length === 0 && gapCount === 0) {
    return <span className="text-xs text-muted-foreground">&ndash;</span>
  }
  return (
    <span className="flex min-w-0 items-center">
      <span className="sr-only">
        {summary}
        {gapCount > 0 ? ` ${gapCount} role${gapCount !== 1 ? 's' : ''} without a person.` : ''}
        {lateAdded.length > 0
          ? ` ${lateAdded.map(i => i.personName).join(', ')} ${lateAdded.length === 1 ? 'is' : 'are'} newly added and can be assigned a different template.`
          : ''}
      </span>
      <AvatarGroup aria-hidden="true">
        {shown.map(i => (
          // Person-grain exception (2026-08-05) — a late-added co-instructor
          // gets a visible-at-rest corner badge here too, not just inside the
          // expanded panel: this file's own Round 2 rationale (see header) is
          // that collapsed-row state should be readable without opening
          // anything, and "needs a template decision" is exactly that kind
          // of state. Distinct glyph/position from the gap disc (dashed,
          // sibling in this row) and the S4 excluded ban-badge (bottom-end),
          // so none of the three read as each other.
          i.lateAddedRelativeTo ? (
            <span key={i.key} className="relative inline-flex shrink-0 rounded-full">
              <EvaluateeAvatar i={i} className="size-6" />
              <span
                className="absolute -top-1 -end-1 size-3.5 rounded-full flex items-center justify-center border bg-background"
                style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
              >
                <i className="fa-solid fa-arrow-right-arrow-left text-[7px]" aria-hidden="true" />
              </span>
            </span>
          ) : (
            <EvaluateeAvatar key={i.key} i={i} className="size-6" />
          )
        ))}
        {extra > 0 && <AvatarGroupCount>+{extra}</AvatarGroupCount>}
        {gapCount > 0 && (
          <span
            className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0"
            style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
          >
            <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
          </span>
        )}
      </AvatarGroup>
    </span>
  )
}

/** Round 2 (post-Aug-4, same day) — replaces the Command-list picker with a
 *  card roster: each evaluatee is its own checkbox-card in a responsive
 *  grid, so the panel's width does real work instead of stacking a narrow
 *  list into it. Grounded in the Aug 4 compare exploration's "card roster"
 *  variant, carried over near-verbatim since it was the one Romit picked as
 *  the base. Whole-card click target (Label wraps Checkbox), never a 16px
 *  box alone. Unselected cards drain to grayscale — the same "not in this
 *  push" vocabulary ExcludedEvaluatee already established here; S4's
 *  specific "Auto Update is off" reason still gets its own line so that
 *  distinction isn't lost, it just lives in card copy now instead of a Tip. */
/** Small zone header — the ONE mechanism that makes "which decision is
 *  which" (Monil, Aug 4) scannable at the zone level instead of requiring
 *  every card to be read individually. Neutral (no icon) for the
 *  no-action-needed zone; tinted + icon for the three zones that carry an
 *  actual decision, at increasing severity. */
function EvaluateeZoneHeader({ label, tint, icon }: { label: string; tint?: string; icon?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium"
      style={{ color: tint ?? 'var(--muted-foreground)' }}
    >
      {icon && <i className={`${icon} text-[10px]`} aria-hidden="true" />}
      {label}
    </span>
  )
}

function EvaluateeRoster({
  code, gate, included, deselectedFresh, onToggleUnit,
  offering, publishedTemplates, currentTemplateName, secondaryScopePersonNames, onAssignPersonTemplate,
}: {
  code: string
  gate: CourseGate
  included: ReadonlySet<string>
  /** S4 — `fresh` units whose unitSelections entry is 'deselected': present
   *  in Prism, explicitly excluded from this push. Rendered muted so the
   *  admin can SEE the exclusion instead of the unit silently vanishing. */
  deselectedFresh: readonly SurveyInstance[]
  onToggleUnit: (key: string) => void
  /** Person-grain exception (2026-08-05) — only wired on the PRIMARY row's
   *  roster; the secondary ("Also evaluating") row's own roster omits
   *  these, since the affordance's target IS that one secondary slot. */
  offering?: CourseOffering
  publishedTemplates?: PceTemplate[]
  currentTemplateName?: string
  /** Named people already occupying this offering's one secondary slot. */
  secondaryScopePersonNames?: string[]
  onAssignPersonTemplate?: (offeringId: string, personName: string, templateId: string) => void
}) {
  const { fresh, gaps, dups } = gate
  // 2026-08-05 — zoned by decision TYPE (Ready / Advisory / Gap / Blocked),
  // not one flat grid: each zone answers a different question ("nothing to
  // do" / "resolved by default, optional to change" / "needs a person" /
  // "can't proceed here"), and Monil's own brief (Aug 4) was explicit that
  // the design problem is "faster recognition of which decision is which"
  // — scannable at the ZONE label, not by reading every card. Each card
  // still carries its own full explanation (no separate panel elsewhere on
  // the page repeats what a card already says).
  const [openPicker, setOpenPicker] = useState<string | null>(null)
  const [pickedTemplateId, setPickedTemplateId] = useState('')
  if (fresh.length === 0 && gaps.length === 0 && dups.length === 0) {
    return <span className="text-xs text-muted-foreground">&ndash;</span>
  }
  const deselectedKeys = new Set(deselectedFresh.map(i => i.key))
  const readyFresh = fresh.filter(i => !i.lateAddedRelativeTo)
  const advisoryFresh = fresh.filter(i => i.lateAddedRelativeTo)
  const canOfferDifferentTemplate = !!offering && !!publishedTemplates && !!onAssignPersonTemplate

  return (
    <div className="flex flex-col gap-4">
      {readyFresh.length > 0 && (
        <div className="flex flex-col gap-2">
          <EvaluateeZoneHeader label="Ready to evaluate" />
          <div className="flex flex-wrap gap-2">
            {readyFresh.map(i => {
              const checkboxId = `unit-${code}-${i.key}`
              const isIn = included.has(i.key)
              const isAutoUpdateExcluded = !isIn && deselectedKeys.has(i.key)
              return (
                <Label
                  key={i.key}
                  htmlFor={checkboxId}
                  className="flex flex-1 basis-64 max-w-sm cursor-pointer items-start gap-2.5 rounded-md border border-border p-2.5 min-w-0"
                  style={{ background: 'var(--card)' }}
                >
                  <EvaluateeAvatar i={i} className={cn('size-6', !isIn && 'grayscale')} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn('truncate text-sm font-medium', !isIn && 'text-muted-foreground')}>
                      {i.scope === 'course' ? 'Course material' : i.personName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {isAutoUpdateExcluded
                        ? 'In Prism, not included — Auto Update is off'
                        : (i.scope === 'course' ? 'Course' : i.roleLabel)}
                    </span>
                  </span>
                  <Checkbox
                    id={checkboxId}
                    checked={isIn}
                    onCheckedChange={() => onToggleUnit(i.key)}
                    aria-label={`Include ${evaluateeLabel(i)} in this push`}
                  />
                </Label>
              )
            })}
          </div>
        </div>
      )}

      {advisoryFresh.length > 0 && (
        <div className="flex flex-col gap-2">
          <EvaluateeZoneHeader label="Advisory — uses default unless changed" tint="var(--chip-4)" icon="fa-solid fa-arrow-right-arrow-left" />
          <div className="flex flex-wrap gap-2">
            {advisoryFresh.map(i => {
              const checkboxId = `unit-${code}-${i.key}`
              const isIn = included.has(i.key)
              const slotTaken = !!secondaryScopePersonNames?.length && !secondaryScopePersonNames.includes(i.personName ?? '')
              // Named from the SAME already-blocked dup instances the
              // Blocked zone below shows (per-person, via person-grain
              // resolution in expandInstances) — not the raw survey
              // record's own instructor list, which can name someone
              // resolved under a DIFFERENT role for this course.
              const coveredBy = dups
                .filter(d => d.criterion === i.criterion)
                .map(d => d.personName)
                .filter((n): n is string => !!n)
              const picking = openPicker === i.key
              return (
                <div
                  key={i.key}
                  className="flex flex-1 basis-64 max-w-sm flex-col gap-1.5 rounded-md border p-2.5 min-w-0"
                  style={{ borderColor: 'var(--chip-4)', background: 'var(--card)' }}
                >
                  <Label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-2.5 min-w-0">
                    <EvaluateeAvatar i={i} className={cn('size-6', !isIn && 'grayscale')} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={cn('truncate text-sm font-medium', !isIn && 'text-muted-foreground')}>{i.personName}</span>
                      <span className="truncate text-xs text-muted-foreground">{i.roleLabel}</span>
                    </span>
                    <Checkbox
                      id={checkboxId}
                      checked={isIn}
                      onCheckedChange={() => onToggleUnit(i.key)}
                      aria-label={`Include ${evaluateeLabel(i)} in this push`}
                    />
                  </Label>
                  {canOfferDifferentTemplate && (
                    <div className="flex flex-col gap-1.5 border-t border-border pt-1.5">
                      <p className="text-xs text-muted-foreground">
                        Template: <span className="font-medium text-foreground">{currentTemplateName ?? 'Same as course'}</span>
                        {coveredBy.length > 0 && <> — same as {coveredBy.join(' and ')}</>}
                      </p>
                      {slotTaken ? (
                        <p className="text-xs text-muted-foreground">
                          A different template is already set for another late addition — see &ldquo;Also evaluating&rdquo; below.
                        </p>
                      ) : picking ? (
                        <div className="flex flex-col gap-1.5">
                          <Select value={pickedTemplateId} onValueChange={setPickedTemplateId}>
                            <SelectTrigger size="sm" aria-label={`Different template for ${i.personName}`} className="w-full">
                              <SelectValue placeholder="Choose a template" />
                            </SelectTrigger>
                            <SelectContent>
                              {publishedTemplates!.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              disabled={!pickedTemplateId}
                              onClick={() => {
                                onAssignPersonTemplate!(offering!.id, i.personName!, pickedTemplateId)
                                setOpenPicker(null)
                                setPickedTemplateId('')
                              }}
                            >
                              Use this template
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => { setOpenPicker(null); setPickedTemplateId('') }}>
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
                          onClick={() => setOpenPicker(i.key)}
                        >
                          Use a different template
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {gaps.length > 0 && (
        <div className="flex flex-col gap-2">
          <EvaluateeZoneHeader label="Needs a person" tint="var(--chip-4)" icon="fa-light fa-user-plus" />
          <div className="flex flex-wrap gap-2">
            {gaps.map(i => (
              <div
                key={i.key}
                className="flex flex-1 basis-64 max-w-sm items-start gap-2.5 rounded-md border border-dashed p-2.5 min-w-0"
                style={{ borderColor: 'var(--chip-4)', background: 'var(--pce-impact-bg)' }}
              >
                <span
                  className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0"
                  style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
                  aria-hidden="true"
                >
                  <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium" style={{ color: 'var(--chip-4)' }}>{i.roleLabel}</span>
                  <span className="text-xs" style={{ color: 'var(--chip-4)' }}>No one assigned in Prism</span>
                  {i.prismHref && (
                    <a
                      href={i.prismHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline underline-offset-2"
                      style={{ color: 'var(--chip-4)' }}
                    >
                      Add in Prism
                      <span className="sr-only"> (opens Prism in a new tab to assign the {i.roleLabel} role on {code})</span>
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dups.length > 0 && (
        <div className="flex flex-col gap-2">
          <EvaluateeZoneHeader label="Blocked — resolve outside this screen" tint="var(--chip-destructive)" icon="fa-solid fa-lock" />
          <div className="flex flex-wrap gap-2">
            {dups.map(i => {
              const label = i.scope === 'course' ? 'Course material' : i.personName
              const status = i.existing ? storyStatusOf(i.existing) : null
              const openedLabel = i.existing?.openDate ? fmtYmd(i.existing.openDate) : null
              return (
                <div
                  key={i.key}
                  className="flex flex-1 basis-64 max-w-sm flex-col gap-1.5 rounded-md border p-2.5 min-w-0"
                  style={{ borderColor: 'var(--chip-destructive)', background: 'var(--pce-impact-bg)' }}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <EvaluateeAvatar i={i} className="size-6 grayscale" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">{label}</span>
                      <span className="truncate text-xs text-muted-foreground">{i.roleLabel || 'Course'}</span>
                    </span>
                    <i className="fa-solid fa-lock text-xs shrink-0 mt-0.5" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
                  </div>
                  {i.existing && status && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Already covered by a <StoryStatusBadgeOS status={status} size="sm" />
                        {' '}survey{openedLabel && <> opened {openedLabel}</>}.
                      </p>
                      <Button variant="outline" size="xs" asChild className="self-start">
                        <Link href={`/surveys/${i.existing.id}`}>
                          View survey
                          <span className="sr-only"> covering the {i.roleLabel || 'course material'} role of {code}</span>
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateControl({ offering, templateId, defaultTemplateId, edited, publishedTemplates, onTemplateChange, onCreate }: {
  offering: CourseOffering
  templateId: string
  /** The course-type default (page-owned pickTemplateForType) — drives the
   *  "Default" badge (Revolut/Airwallex "Suggested" tag model). Badged only
   *  when the template really matches the course's type, so the legacy
   *  first-published fallback never wears a label it didn't earn. */
  defaultTemplateId?: string
  edited: boolean
  publishedTemplates: PceTemplate[]
  onTemplateChange: (offeringId: string, templateId: string) => void
  onCreate: () => void
}) {
  const { code } = splitLabel(offering)
  if (publishedTemplates.length === 0) {
    return (
      <Button
        variant="outline"
        size="xs"
        aria-label={`Create a template. None exist yet to assign to ${code}`}
        onClick={onCreate}
      >
        <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
        Create template
      </Button>
    )
  }
  const typeMatches = offering.courseType
    ? publishedTemplates.filter(t => t.courseType === offering.courseType)
    : []
  return (
    <Select value={templateId} onValueChange={v => onTemplateChange(offering.id, v)}>
      <SelectTrigger
        size="sm"
        aria-label={`Template for ${code}${!templateId ? ' · required' : ''}${edited ? ' · changed from default' : ''}`}
        className={cn('w-full [&>span]:truncate [&>span]:min-w-0', edited && 'bg-secondary')}
      >
        <SelectValue
          placeholder={
            <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
              <i className="fa-light fa-plus text-xs" aria-hidden="true" />
              Assign template
            </span>
          }
        />
      </SelectTrigger>
      <SelectContent>
        {/* ST-02: zero published templates for this course's TYPE — exact copy. */}
        {typeMatches.length === 0 && (
          <div className="px-2 py-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            No templates for this course type
          </div>
        )}
        {publishedTemplates.map(t => (
          <SelectItem key={t.id} value={t.id}>
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">{t.name}</span>
              {t.id === defaultTemplateId && t.courseType === offering.courseType && (
                // 12px floor (WCAG 1.4.4 / DS type scale) — never below text-xs.
                <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                  Default
                </Badge>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function StepSurveyInstances({
  selectedOfferings, instances, publishedTemplates,
  templateAssignments, defaultAssignments, onTemplateChange, onResetDefaults,
  pendingReassign, onResolveReassign, onCancelReassign,
  secondaryTemplateAssignments, secondaryInstances, onSecondaryTemplateChange, onAssignPersonTemplate, onRemoveSecondary,
  unitSelections, onUnitSelectionChange,
  autoUpdateOn, onAutoUpdateChange, onRefreshUnits, onCourseSelectedChange,
  templateDriftNotices, onDismissTemplateDrift,
  onSaveDraft, draftSavedAt,
  onBack, onContinue,
}: StepSurveyInstancesProps) {
  // In-step template creation — the SAME create flow + builder as Settings >
  // Templates (the wizard page never unmounts, so state persists).
  const { templates: allTemplates, surveys } = usePce()
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  // S2 — defaults to the non-destructive choice (create-new keeps the
  // existing survey untouched; override replaces it and can't be undone).
  const [reassignChoice, setReassignChoice] = useState<'override' | 'create-new'>('create-new')
  // Defaults to ALL, not "Needs attention" — see file header for why
  // (a row you just fixed shouldn't vanish out from under you).
  const [filter, setFilter] = useState<FilterKey>('all')
  const backToAssign = () => {
    if (typeof subView === 'object') {
      const t = allTemplates.find(x => x.id === subView.buildId)
      if (t && t.status !== 'active') setNotice({ kind: 'draft', name: t.name || 'Untitled template' })
    }
    setSubView('assign')
  }

  // ── Inclusion (ST-02): projection of the page-owned sticky selection map ──
  // A unit the admin touched keeps its state across plan recomputes; only the
  // page's template-change reset, course deselection, or a manual Refresh may
  // change an existing entry.
  const included = useMemo(
    () => new Set(Object.keys(unitSelections).filter(k => unitSelections[k] === 'selected')),
    [unitSelections],
  )
  const flip = (key: string) =>
    onUnitSelectionChange([key], included.has(key) ? 'deselected' : 'selected')
  const setMany = (keys: string[], on: boolean) =>
    onUnitSelectionChange(keys, on ? 'selected' : 'deselected')

  // ── Derived (the lead + footer speak for the full plan) ───────────────────
  const courses = useMemo(
    () =>
      [...selectedOfferings]
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true })),
    [selectedOfferings],
  )
  const instancesByOffering = useMemo(() => {
    const m = new Map<string, SurveyInstance[]>()
    for (const i of instances) m.set(i.offeringId, [...(m.get(i.offeringId) ?? []), i])
    return m
  }, [instances])

  const templateIdFor = (o: CourseOffering) => {
    const raw = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
    return publishedTemplates.some(t => t.id === raw) ? raw : ''
  }

  // ── Per-course gate — single source of truth for the Status badge, the
  // Faculty column, the segmented filter counts, and the footer/Continue
  // gate. Faculty gaps alone never appear in `reasons` — they never block.
  const gatesByOffering = useMemo(() => {
    const m = new Map<string, CourseGate>()
    for (const o of courses) {
      const items = instancesByOffering.get(o.id) ?? []
      const fresh = items.filter(i => i.status === 'new')
      const gaps = items.filter(i => i.status === 'gap')
      const dups = items.filter(i => i.status === 'duplicate')
      const templateId = templateIdFor(o)
      const reasons: BlockReason[] = []
      if (!templateId) {
        reasons.push('no-template')
      } else {
        // 2026-08-05: a locked role (dup) used to mark the WHOLE course
        // "Blocked" — and block Continue for the entire multi-course push —
        // even when other roles on the SAME course (or every other course
        // in the batch) had nothing to do with it. A role being already
        // covered only means that one role can't be re-evaluated; it never
        // implies the course itself, or unrelated courses, can't proceed.
        // 'overlap' now only fires when there's genuinely nothing else this
        // course contributes (every role is either locked or empty) — the
        // one case where "Blocked" as a whole-row status is actually true.
        // The per-person lock is still fully visible via its own card in
        // the Blocked zone regardless of this reason firing.
        if (fresh.length === 0 && gaps.length === 0 && dups.length > 0) reasons.push('overlap')
        if (items.length === 0) reasons.push('no-units')
        else if (fresh.length === 0 && gaps.length > 0 && dups.length === 0) reasons.push('unstaffed')
        else if (fresh.length > 0 && fresh.every(i => !included.has(i.key))) reasons.push('none-selected')
      }
      m.set(o.id, { reasons, fresh, gaps, dups })
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, instancesByOffering, templateAssignments, defaultAssignments, publishedTemplates, included])

  // Accordion revision (post-Aug-4): which rows' detail panels are expanded.
  // A Set, not a single id — independent per-row open/close, so an admin
  // triaging several flagged rows can compare them side by side instead of
  // one closing every time another opens. Seeded once with every
  // role-overlap-conflict row already open — the same "conflicts start
  // expanded" behavior the old conflict-only Collapsible had via
  // defaultOpen, just computed once instead of per-row. The Action column's
  // "Assign" button opens its own row from outside the row's own
  // CollapsibleTrigger (same cross-component-open need the old single-flag
  // popover version had).
  // 2026-08-05: also seeds open for a late addition alone, with no dup —
  // the edge case where the only conflicting survey named someone no
  // longer on the roster, so nothing else here would auto-expand the row.
  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(
    () => new Set(
      [...gatesByOffering.entries()]
        .filter(([, g]) => g.dups.length > 0 || g.fresh.some(i => i.lateAddedRelativeTo))
        .map(([id]) => id),
    )
  )
  const toggleRow = (id: string) =>
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  const openRow = (id: string) =>
    setOpenRows(prev => (prev.has(id) ? prev : new Set(prev).add(id)))

  // Round 2 (post-Aug-4, same day) — staged template pick, per offering
  // (main row) and per `${offeringId}::secondary` (the S2 second-survey
  // row). Picking a DIFFERENT template in the Select no longer commits
  // immediately — it stages the choice and an inline strip states exactly
  // what changes, before anything is applied. "Switch template" is the only
  // path that calls the real onTemplateChange/onSecondaryTemplateChange
  // prop, so the existing S2 Override/Create-new conflict detection in the
  // parent still runs exactly as before — this only adds an informative
  // preview in front of it, it doesn't bypass it.
  const [pendingTemplate, setPendingTemplate] = useState<Record<string, string>>({})
  // 2026-08-05 — top-of-step entry point for the person-grain decision,
  // outside the DataTable: the in-row Advisory card (EvaluateeRoster) only
  // helps once a row is already open. At 10+ courses/admin, discovering a
  // late addition at all still requires opening (or auto-expanding) each
  // row. This surfaces every open one in one place, no navigation required
  // — same self-contained fact-plus-one-action card as the in-row version,
  // driven by the same underlying state, so resolving it here clears the
  // in-row card too (never two places to reconcile).
  const [topPicker, setTopPicker] = useState<string | null>(null)
  const [topPickerTemplateId, setTopPickerTemplateId] = useState('')
  const stageTemplate = (key: string, templateId: string) =>
    setPendingTemplate(prev => ({ ...prev, [key]: templateId }))
  const clearStagedTemplate = (key: string) =>
    setPendingTemplate(prev => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })

  // S2 — the secondary survey's own gate, computed exactly like the primary
  // (same reasons logic) from its own instance plan. Only offerings with a
  // secondaryTemplateAssignments entry get one.
  const secondaryInstancesByOffering = useMemo(() => {
    const m = new Map<string, SurveyInstance[]>()
    for (const i of secondaryInstances) m.set(i.offeringId, [...(m.get(i.offeringId) ?? []), i])
    return m
  }, [secondaryInstances])
  const secondaryGatesByOffering = useMemo(() => {
    const m = new Map<string, CourseGate>()
    for (const [offeringId, entry] of Object.entries(secondaryTemplateAssignments)) {
      const items = secondaryInstancesByOffering.get(offeringId) ?? []
      const fresh = items.filter(i => i.status === 'new')
      const gaps = items.filter(i => i.status === 'gap')
      const dups = items.filter(i => i.status === 'duplicate')
      const reasons: BlockReason[] = []
      if (!entry.templateId) reasons.push('no-template')
      else if (fresh.length === 0 && gaps.length === 0 && dups.length > 0) reasons.push('overlap')
      m.set(offeringId, { reasons, fresh, gaps, dups })
    }
    return m
  }, [secondaryTemplateAssignments, secondaryInstancesByOffering])

  const toCreate = instances.filter(i => i.status !== 'gap' && included.has(i.key)).length
  const missingTemplate = courses.filter(o => gatesByOffering.get(o.id)!.reasons.includes('no-template')).length
  const conflictedCourseCount = courses.filter(o => gatesByOffering.get(o.id)!.reasons.includes('overlap')).length
  const templatesInUse = new Set(courses.map(o => templateIdFor(o)).filter(Boolean))
  // Reset-to-defaults impact (Resend "itemize what changes" model) — courses
  // whose EFFECTIVE template differs from their type default.
  const resetChangedCount = courses.filter(o => {
    const def = defaultAssignments[o.id]
    return !!def && templateIdFor(o) !== def
  }).length

  // ── Segmented filter — a PREDICATE, never a regrouping. Rows only hide or
  // show; course-code order never changes. ─────────────────────────────────
  // 2026-08-05: "needs attention" now also catches a Ready row carrying a
  // late-added co-instructor's still-open template decision — before this,
  // that state had NO filter path at all (not blocked, not a gap), so at
  // 10+ courses/admin there was no way to round them all up in one view,
  // only the per-row Action-column callout as you scrolled past each one.
  const hasOpenLateAddition = (g: CourseGate) => g.fresh.some(i => i.lateAddedRelativeTo)
  const attentionCount = courses.filter(o => {
    const g = gatesByOffering.get(o.id)!
    return g.reasons.length > 0 || g.gaps.length > 0 || hasOpenLateAddition(g)
  }).length
  const blockedCount = courses.filter(o => gatesByOffering.get(o.id)!.reasons.length > 0).length
  const visibleCourses = courses.filter(o => {
    if (filter === 'all') return true
    const g = gatesByOffering.get(o.id)!
    return filter === 'blocked' ? g.reasons.length > 0 : g.reasons.length > 0 || g.gaps.length > 0 || hasOpenLateAddition(g)
  })


  // 2026-08-05: a locked role on one course used to disable Continue for
  // the ENTIRE multi-course push — even courses with zero relationship to
  // the conflict, and even the SAME course's own unrelated, perfectly
  // pushable roles (Coordinator, Course material). A dup instance can never
  // become `included` (no checkbox exists for it — see the Blocked zone),
  // so `toCreate` already excludes it naturally; nothing further needs to
  // gate on `conflictedCourseCount` here.
  const canContinue = missingTemplate === 0 && toCreate > 0
  const continueDisabledReason = missingTemplate > 0
    ? `${missingTemplate} course${missingTemplate !== 1 ? 's need' : ' needs'} a template before continuing.`
    : toCreate === 0
      ? 'Nothing is selected to evaluate yet.'
      : ''

  // Every currently-open late addition across every course — the flat list
  // the top-of-step card below renders. Carries the offering's CURRENT
  // template name so "will use X" reads as a fact, not a vague default.
  const lateAdditions = courses.flatMap(o => {
    const g = gatesByOffering.get(o.id)
    if (!g) return []
    const currentTemplateName = publishedTemplates.find(t => t.id === templateIdFor(o))?.name
    return g.fresh
      .filter(i => i.lateAddedRelativeTo)
      .map(i => ({
        offeringId: o.id,
        code: splitLabel(o).code,
        personName: i.personName!,
        roleLabel: i.roleLabel,
        currentTemplateName,
        coveredBy: g.dups
          .filter(d => d.criterion === i.criterion)
          .map(d => d.personName)
          .filter((n): n is string => !!n),
      }))
  })

  // ── Create sub-view: same chooser + builder as Settings > Templates ────────
  if (subView !== 'assign') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={backToAssign}>
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
              const t = allTemplates.find(x => x.id === id)
              setNotice({ kind: 'published', name: t?.name || 'Template' })
              setSubView('assign')
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 flex-1">
      {notice && (
        <LocalBanner
          variant={notice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setNotice(null)}
        >
          {notice.kind === 'published'
            ? <>&ldquo;{notice.name}&rdquo; is published. Assign it in the course list below.</>
            : <>&ldquo;{notice.name}&rdquo; is saved as a draft. Publish it from Settings &rsaquo; Templates to make it assignable.</>}
        </LocalBanner>
      )}

      {/* ST-02 Phase 3 — Draft-resume template findings. Pattern: stale-
          document banner (fact, what changed, consequence), on the DS
          LocalBanner. Applies PRE-LIVE only: the resume path only ever sees
          Draft/Scheduled surveys (template content freezes at Live, Freeze &
          Sync Policy). */}
      {templateDriftNotices && templateDriftNotices.length > 0 && (
        <LocalBanner variant="info" dismissible onDismiss={onDismissTemplateDrift}>
          <span className="flex flex-col gap-1">
            {templateDriftNotices.map(n => (
              <span key={`${n.offeringId}-${n.kind}`}>
                {n.kind === 'updated' ? (
                  <>
                    &ldquo;{n.templateName}&rdquo; changed since this draft was saved.
                    {n.addedRoleLabels.length > 0 && (
                      <> For {n.courseCode} it now also covers {n.addedRoleLabels.join(', ')}.</>
                    )}
                    {n.removedRoleLabels.length > 0 && (
                      <> It no longer covers {n.removedRoleLabels.join(', ')}.</>
                    )}
                    {' '}Faculty coverage below reflects the current template.
                  </>
                ) : (
                  <>
                    {n.templateName
                      ? <>&ldquo;{n.templateName}&rdquo;</>
                      : <>The template saved with this draft</>}
                    {' '}is no longer published. Assign a published template to {n.courseCode} to continue.
                  </>
                )}
              </span>
            ))}
          </span>
        </LocalBanner>
      )}

      {courses.length === 0 ? (
        <EmptyHint heading="No courses selected" sub="Go back and select at least one course." />
      ) : (
        <div className="flex flex-col gap-5 w-full">
          {/* The lead IS the step heading — one headline, not two; scale and
              weight match the other steps' h2 ("Courses & students"). Step
              actions share the headline row instead of a row of their own. */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="text-xl font-semibold font-heading">
                You&apos;re setting up <span className="tabular-nums">{toCreate} evaluation{toCreate !== 1 ? 's' : ''}</span> across{' '}
                <span className="tabular-nums">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>.
              </h2>
              <p className="text-sm text-muted-foreground tabular-nums">
                {templatesInUse.size === 1 ? 'Every course uses the same template.' : `${templatesInUse.size} templates are in use.`}
                {conflictedCourseCount > 0 && (
                  <> {conflictedCourseCount} course{conflictedCourseCount !== 1 ? 's are' : ' is'} blocked by existing surveys.</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {draftSavedAt && (
                <span className="text-xs tabular-nums text-muted-foreground">Draft saved at {draftSavedAt}</span>
              )}
              {onSaveDraft && (
                <Button variant="outline" size="sm" onClick={onSaveDraft}>
                  Save as draft
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setResetOpen(true)}>
                <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
                Reset to defaults
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setNotice(null); setSubView('create') }}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                New template
              </Button>
            </div>
          </div>

          {/* 2026-08-05 — the fast, no-navigation entry point for the
              person-grain decision, outside the DataTable: at 10+
              courses/admin, the in-row Advisory card only helps once a row
              is already open. Same self-contained card shape as the in-row
              version (fact + one optional action, no forced Same/Different
              pick), driven by the SAME underlying state via
              onAssignPersonTemplate — resolving it here clears the
              matching in-row card too, so there's never a stale duplicate
              to reconcile. Sits below the step heading (Romit's call) so
              the heading is always the first thing read, then this, then
              the table. */}
          {lateAdditions.length > 0 && (
            <Card className="py-0 gap-0">
              <CardContent className="p-4 flex flex-col gap-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <i className="fa-solid fa-arrow-right-arrow-left text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                  {lateAdditions.length === 1
                    ? '1 new faculty member needs a template decision'
                    : `${lateAdditions.length} new faculty members need a template decision`}
                </span>
                <div className="flex flex-wrap gap-2">
                  {lateAdditions.map(a => {
                    const key = `${a.offeringId}|${a.personName}`
                    const picking = topPicker === key
                    return (
                      <div
                        key={key}
                        className="flex flex-1 basis-72 max-w-sm flex-col gap-1.5 rounded-md border p-2.5 min-w-0"
                        style={{ borderColor: 'var(--chip-4)', background: 'var(--card)' }}
                      >
                        <span className="flex items-start gap-2.5 min-w-0">
                          <PersonAvatar name={a.personName} className="size-6" />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-sm font-medium">{a.personName}</span>
                            <span className="truncate text-xs text-muted-foreground">{a.roleLabel} · {a.code}</span>
                          </span>
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Template: <span className="font-medium text-foreground">{a.currentTemplateName ?? 'Same as course'}</span>
                          {a.coveredBy.length > 0 && <> — same as {a.coveredBy.join(' and ')}</>}
                        </p>
                        {picking ? (
                          <div className="flex flex-col gap-1.5">
                            <Select value={topPickerTemplateId} onValueChange={setTopPickerTemplateId}>
                              <SelectTrigger size="sm" aria-label={`Different template for ${a.personName}`} className="w-full">
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
                                disabled={!topPickerTemplateId}
                                onClick={() => {
                                  onAssignPersonTemplate(a.offeringId, a.personName, topPickerTemplateId)
                                  setTopPicker(null)
                                  setTopPickerTemplateId('')
                                }}
                              >
                                Use this template
                              </Button>
                              <Button variant="ghost" size="xs" onClick={() => { setTopPicker(null); setTopPickerTemplateId('') }}>
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
                            onClick={() => setTopPicker(key)}
                          >
                            Use a different template
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Segmented filter — hides or shows rows, never reorders them. */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <ToggleGroup
                type="single"
                value={filter}
                onValueChange={v => v && setFilter(v as FilterKey)}
                variant="outline"
                size="sm"
                aria-label="Filter courses by status"
              >
                <ToggleGroupItem value="all" aria-label={`Show all ${courses.length} courses`}>
                  All <span className="tabular-nums text-muted-foreground">({courses.length})</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="attention" aria-label={`Show ${attentionCount} courses needing attention`}>
                  Needs attention <span className="tabular-nums text-muted-foreground">({attentionCount})</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="blocked" aria-label={`Show ${blockedCount} blocked courses`}>
                  Blocked <span className="tabular-nums text-muted-foreground">({blockedCount})</span>
                </ToggleGroupItem>
              </ToggleGroup>
              {filter !== 'all' && (
                <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                  Showing {visibleCourses.length} of {courses.length} courses
                </p>
              )}
            </div>
          </div>

          {/* ST-02 Auto Update — ONE flag for every course row, at the top of
              the step (never per-row). Flipping it does nothing by itself: it
              only decides how units the rows haven't seen before arrive on
              the next manual Refresh. State lives in push/page.tsx; Phase 3
              persists it with Save-as-Draft. */}
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="auto-update-units" className="flex items-center gap-2.5 cursor-pointer">
              <ToggleSwitch
                id="auto-update-units"
                checked={autoUpdateOn}
                onChange={() => onAutoUpdateChange(!autoUpdateOn)}
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Auto Update</span>
                <span className="text-xs text-muted-foreground">
                  Faculty found on the next refresh start selected. Selections you have already made never change.
                </span>
              </span>
            </label>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-muted-foreground">Recheck faculty assignments in Prism.</span>
              <Button variant="outline" size="sm" onClick={onRefreshUnits}>
                Refresh
              </Button>
            </div>
          </div>

          {/* ONE flat table — course-code order, never reordered by status.
              A row is one line by default; every row's chevron expands to
              its Template and Evaluatees detail. */}
          <Card size="sm" className="py-0 gap-0 overflow-hidden">
           <CardContent className="p-0">
            <div
              className="grid items-center gap-3 ps-3 pe-3 py-2 border-b border-border text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: TABLE_GRID }}
            >
              <span />
              <span />
              <span>Course</span>
              <span>Type</span>
              <span>Template</span>
              <span>Evaluatees</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {visibleCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <i className="fa-light fa-circle-check text-muted-foreground" aria-hidden="true" style={{ fontSize: 28 }} />
                <p className="text-sm font-medium">No courses match this filter</p>
                <p className="text-xs text-muted-foreground">Switch to All to see every course in this push.</p>
              </div>
            ) : (
              visibleCourses.map(o => {
                const { code, name } = splitLabel(o)
                const mode = deliveryModeOf(o)
                const gate = gatesByOffering.get(o.id)!
                const { fresh, gaps, dups } = gate
                const freshKeys = fresh.map(i => i.key)
                // S4 — in Prism, explicitly excluded from this push (Auto
                // Update off): rendered muted in the Evaluatees cell instead
                // of silently disappearing.
                const deselectedFresh = fresh.filter(i => unitSelections[i.key] === 'deselected')
                const inCount = freshKeys.filter(k => included.has(k)).length
                const templateId = templateIdFor(o)
                const template = publishedTemplates.find(t => t.id === templateId) ?? null
                const criteria = template ? templateCriteria(template) : []
                const previewIconButton = (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={!template}
                    onClick={() => template && setPreviewTemplate(template)}
                    aria-label={template ? `Preview the survey for ${code}` : 'Preview unavailable. Assign a template to preview.'}
                  >
                    <i className="fa-light fa-eye text-xs" aria-hidden="true" />
                  </Button>
                )
                const secondaryTemplateId = secondaryTemplateAssignments[o.id]?.templateId
                const secondaryScopePersonNames = secondaryTemplateAssignments[o.id]?.scopePersonNames
                return (
                  <Fragment key={o.id}>
                  <Collapsible
                    open={openRows.has(o.id)}
                    onOpenChange={() => toggleRow(o.id)}
                    className="border-b border-border last:border-b-0"
                  >
                    <div
                      className="grid items-center gap-3 ps-3 pe-3 py-2"
                      style={{ gridTemplateColumns: TABLE_GRID, minHeight: 44 }}
                    >
                      <span className="flex items-center">
                        <Checkbox
                          checked={
                            fresh.length > 0
                              ? (inCount === freshKeys.length ? true : inCount > 0 ? 'indeterminate' : false)
                              : true
                          }
                          onCheckedChange={v => {
                            // ST-02: this is Step 1's course checkbox carried
                            // forward. Checking (from partial/none) selects
                            // the course's remaining units; UNCHECKING
                            // deselects the COURSE itself — same
                            // selectedCourseIds Step 1 owns, so the row
                            // leaves this push entirely and re-selecting
                            // starts from defaults, not restored state.
                            if (v && fresh.length > 0) setMany(freshKeys, true)
                            else onCourseSelectedChange(o.id, false)
                          }}
                          aria-label={`Include ${code} in this push`}
                        />
                      </span>

                      {/* Accordion revision — every row expands now (used to
                          be conflict-only). Template and Evaluatees moved out
                          of this collapsed line entirely; they live in the
                          panel this trigger opens. */}
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="group"
                          aria-label={`${openRows.has(o.id) ? 'Hide' : 'Show'} template and evaluatees for ${code}`}
                        >
                          <i
                            className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180"
                            aria-hidden="true"
                          />
                        </Button>
                      </CollapsibleTrigger>

                      <span className="flex items-baseline gap-2 min-w-0">
                        <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
                        {name && <span className="truncate text-sm">{name}</span>}
                      </span>

                      {/* Plain text, not the tinted TypePill — Romit's call,
                          2026-08-05: a pill here read as one more chip
                          competing with the Template/Evaluatees chips beside
                          it for the same kind of attention. Type is
                          reference info, not a status signal, so it doesn't
                          need chip weight. */}
                      <span className="text-sm text-muted-foreground truncate">{COURSE_TYPE_FULL_LABEL[mode]}</span>

                      <span className="min-w-0"><TemplateChip template={template} code={code} /></span>

                      <span className="min-w-0"><EvaluateeChipCluster code={code} gate={gate} included={included} /></span>

                      <span className="min-w-0"><RowStatus gate={gate} /></span>

                      <span className="min-w-0">
                        <RowAction gate={gate} onAssign={() => openRow(o.id)} />
                      </span>
                    </div>

                    <CollapsibleContent>
                      <Card className="mx-4 mb-3">
                       <CardContent className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground">Template</span>
                          <div className="group flex items-center gap-1 max-w-sm">
                            <span className="min-w-0 flex-1">
                              <TemplateControl
                                offering={o}
                                templateId={pendingTemplate[o.id] ?? templateId}
                                defaultTemplateId={defaultAssignments[o.id]}
                                edited={!!templateId && templateId !== defaultAssignments[o.id]}
                                publishedTemplates={publishedTemplates}
                                onTemplateChange={(offeringId, tid) => {
                                  if (tid === templateId) { clearStagedTemplate(offeringId); return }
                                  stageTemplate(offeringId, tid)
                                }}
                                onCreate={() => { setNotice(null); setSubView('create') }}
                              />
                            </span>
                            {/* Reveals on hover/focus of the Template control —
                                a secondary action, doesn't need to compete for
                                attention at rest. Always visible while there's
                                no template yet, since picking one is the
                                primary thing to do here. */}
                            <span className={cn('transition-opacity', template && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100')}>
                              {template ? (
                                previewIconButton
                              ) : (
                                <Tip label="Assign a template to preview" side="top">
                                  {/* Disabled buttons swallow pointer/focus events —
                                      the focusable wrapper carries the tooltip AND
                                      a visible focus ring (WCAG 2.4.7). */}
                                  <span
                                    className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                    tabIndex={0}
                                  >
                                    {previewIconButton}
                                  </span>
                                </Tip>
                              )}
                            </span>
                          </div>

                          {/* Round 2 — inline consequence preview the moment a
                              DIFFERENT template is staged, before anything
                              commits. Same voice as the S2 Override/Create-new
                              dialog. "Switch" routes back through the real
                              onTemplateChange, so existing conflict detection
                              (pendingReassign) still runs exactly as before —
                              this only adds a preview in front of it. */}
                          {pendingTemplate[o.id] && pendingTemplate[o.id] !== templateId && (() => {
                            const stagedTemplate = publishedTemplates.find(t => t.id === pendingTemplate[o.id])
                            if (!stagedTemplate) return null
                            const { added, removed } = templateSwitchConsequence(mode, template, stagedTemplate)
                            return (
                              <div className="flex max-w-sm flex-col gap-2 rounded-md border border-border p-2.5" style={{ background: 'var(--muted)' }}>
                                <p className="text-xs text-muted-foreground">
                                  <i className="fa-light fa-arrow-right-arrow-left me-1.5" aria-hidden="true" />
                                  <span className="font-medium text-foreground">{stagedTemplate.name}</span> takes its place.{' '}
                                  {removed.length > 0 && added.length > 0 && (
                                    <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds <span className="font-medium text-foreground">{listFmt(added)}</span>.</>
                                  )}
                                  {removed.length > 0 && added.length === 0 && (
                                    <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds nothing new.</>
                                  )}
                                  {removed.length === 0 && added.length > 0 && (
                                    <>Adds <span className="font-medium text-foreground">{listFmt(added)}</span>. Nothing is removed.</>
                                  )}
                                  {removed.length === 0 && added.length === 0 && <>Same aspects, different questions.</>}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="default"
                                    size="xs"
                                    onClick={() => { onTemplateChange(o.id, stagedTemplate.id); clearStagedTemplate(o.id) }}
                                  >
                                    Switch template
                                  </Button>
                                  <Button variant="ghost" size="xs" onClick={() => clearStagedTemplate(o.id)}>
                                    Keep current
                                  </Button>
                                </div>
                              </div>
                            )
                          })()}

                          {/* 2026-08-05 — moved out of the (now removed)
                              Conflicts panel: this is neutral template
                              metadata, true regardless of any block, not a
                              fact about a conflict. */}
                          {template && (
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {template.name} · {template.questionCount} question{template.questionCount !== 1 ? 's' : ''} · evaluates{' '}
                              {criteria
                                .map(c => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c]?.label ?? c))
                                .join(', ')}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            Evaluatees
                            <Tip label="Click a person or course material to include or exclude them from this push." side="top">
                              <i className="fa-light fa-circle-info" aria-hidden="true" style={{ fontSize: 11 }} />
                            </Tip>
                          </span>
                          <EvaluateeRoster
                            code={code}
                            gate={gate}
                            included={included}
                            deselectedFresh={deselectedFresh}
                            onToggleUnit={flip}
                            offering={o}
                            publishedTemplates={publishedTemplates}
                            currentTemplateName={template?.name}
                            secondaryScopePersonNames={secondaryScopePersonNames}
                            onAssignPersonTemplate={onAssignPersonTemplate}
                          />
                        </div>

                        {/* 2026-08-05 — course-level utility ONLY, shown
                            once, never per-person: the actual facts (who's
                            blocked, why, the survey link; who's a late
                            addition and their default) now live entirely on
                            their own self-contained cards in the zoned
                            roster above (Blocked / Advisory zones) — this
                            line exists only because "remove this course"
                            is a course-level action with nowhere else to
                            live, not because anything needs restating. */}
                        {dups.length > 0 && (
                          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                            <span className="text-xs text-muted-foreground">
                              Cancel or archive the existing survey to push this course again, or remove it from this push.
                            </span>
                            <Button
                              variant="outline"
                              size="xs"
                              className="shrink-0"
                              onClick={() => onCourseSelectedChange(o.id, false)}
                            >
                              Remove course from push
                            </Button>
                          </div>
                        )}
                       </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* S2 — "Create new survey" second row for this offering.
                      Sits directly under the primary row it belongs to, with
                      a connecting rule + muted "Also evaluating" label
                      instead of repeating the course name — reads as ONE
                      course with two surveys, not two unrelated rows. Kept
                      as a flat adjacent row rather than a second nested
                      collapsible level: fewer visual layers for the same
                      information, in keeping with this screen's "less text,
                      less structure" direction from today's earlier pass. */}
                  {secondaryTemplateId && (() => {
                    const sGate = secondaryGatesByOffering.get(o.id) ?? { reasons: [], fresh: [], gaps: [], dups: [] }
                    const sTemplate = publishedTemplates.find(t => t.id === secondaryTemplateId) ?? null
                    const secondaryKey = `${o.id}::secondary`
                    const sPreviewButton = (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={!sTemplate}
                        onClick={() => sTemplate && setPreviewTemplate(sTemplate)}
                        aria-label={sTemplate ? `Preview the second survey for ${code}` : 'Preview unavailable. Assign a template first.'}
                      >
                        <i className="fa-light fa-eye text-xs" aria-hidden="true" />
                      </Button>
                    )
                    return (
                      <Collapsible
                        open={openRows.has(secondaryKey)}
                        onOpenChange={() => toggleRow(secondaryKey)}
                        className="border-b border-border last:border-b-0"
                        style={{ borderInlineStart: '2px solid var(--border)' }}
                      >
                        <div
                          className="grid items-center gap-3 ps-3 pe-3 py-2"
                          style={{ gridTemplateColumns: TABLE_GRID, minHeight: 44 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove this second survey for ${code}`}
                            onClick={() => onRemoveSecondary(o.id)}
                          >
                            <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="group"
                              aria-label={`${openRows.has(secondaryKey) ? 'Hide' : 'Show'} template and evaluatees for the second survey on ${code}`}
                            >
                              <i
                                className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180"
                                aria-hidden="true"
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <span className="text-sm text-muted-foreground truncate">Also evaluating</span>
                          <span />
                          <span className="min-w-0"><TemplateChip template={sTemplate} code={code} /></span>
                          <span className="min-w-0"><EvaluateeChipCluster code={code} gate={sGate} included={included} /></span>
                          <span className="min-w-0"><RowStatus gate={sGate} /></span>
                          <span className="min-w-0">
                            <RowAction gate={sGate} onAssign={() => openRow(secondaryKey)} />
                          </span>
                        </div>

                        <CollapsibleContent>
                          <Card className="mx-4 mb-3">
                       <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-xs font-medium text-muted-foreground">Template</span>
                              <div className="group flex items-center gap-1 max-w-sm">
                                <span className="min-w-0 flex-1">
                                  <TemplateControl
                                    offering={o}
                                    templateId={pendingTemplate[secondaryKey] ?? secondaryTemplateId}
                                    edited={false}
                                    publishedTemplates={publishedTemplates}
                                    onTemplateChange={(offeringId, tid) => {
                                      if (tid === secondaryTemplateId) { clearStagedTemplate(secondaryKey); return }
                                      stageTemplate(secondaryKey, tid)
                                    }}
                                    onCreate={() => { setNotice(null); setSubView('create') }}
                                  />
                                </span>
                                <span className={cn('transition-opacity', sTemplate && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100')}>
                                  {sTemplate ? sPreviewButton : (
                                    <Tip label="Assign a template to preview" side="top">
                                      <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
                                        {sPreviewButton}
                                      </span>
                                    </Tip>
                                  )}
                                </span>
                              </div>

                              {pendingTemplate[secondaryKey] && pendingTemplate[secondaryKey] !== secondaryTemplateId && (() => {
                                const stagedTemplate = publishedTemplates.find(t => t.id === pendingTemplate[secondaryKey])
                                if (!stagedTemplate) return null
                                const { added, removed } = templateSwitchConsequence(mode, sTemplate, stagedTemplate)
                                return (
                                  <div className="flex max-w-sm flex-col gap-2 rounded-md border border-border p-2.5" style={{ background: 'var(--muted)' }}>
                                    <p className="text-xs text-muted-foreground">
                                      <i className="fa-light fa-arrow-right-arrow-left me-1.5" aria-hidden="true" />
                                      <span className="font-medium text-foreground">{stagedTemplate.name}</span> takes its place.{' '}
                                      {removed.length > 0 && added.length > 0 && (
                                        <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds <span className="font-medium text-foreground">{listFmt(added)}</span>.</>
                                      )}
                                      {removed.length > 0 && added.length === 0 && (
                                        <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds nothing new.</>
                                      )}
                                      {removed.length === 0 && added.length > 0 && (
                                        <>Adds <span className="font-medium text-foreground">{listFmt(added)}</span>. Nothing is removed.</>
                                      )}
                                      {removed.length === 0 && added.length === 0 && <>Same aspects, different questions.</>}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                      <Button
                                        variant="default"
                                        size="xs"
                                        onClick={() => { onSecondaryTemplateChange(o.id, stagedTemplate.id); clearStagedTemplate(secondaryKey) }}
                                      >
                                        Switch template
                                      </Button>
                                      <Button variant="ghost" size="xs" onClick={() => clearStagedTemplate(secondaryKey)}>
                                        Keep current
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-xs font-medium text-muted-foreground">Evaluatees</span>
                              <EvaluateeRoster
                                code={code}
                                gate={sGate}
                                included={included}
                                deselectedFresh={sGate.fresh.filter(i => unitSelections[i.key] === 'deselected')}
                                onToggleUnit={flip}
                              />
                            </div>
                           </CardContent>
                          </Card>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })()}
                  </Fragment>
                )
              })
            )}
           </CardContent>
          </Card>
        </div>
      )}

      {/* Per-row Preview Survey target — the lightweight template-backed
          dialog (survey-preview-dialog.tsx), NOT /surveys/[id]/preview
          (ST-12): that page requires a persisted survey id and this step
          previews unsaved assignments. ST-10 vs ST-12 equivalence is an open
          confirm-with-Romit item (implementation plan decision #4). */}
      <SurveyPreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={open => { if (!open) setPreviewTemplate(null) }}
      />

      {/* Reset to defaults — irreversible per ST-02 ("no undo after
          confirming"), so it itemizes WHAT will change (Resend delete-team
          model) instead of a generic are-you-sure. */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all templates to defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              {resetChangedCount > 0 ? (
                <>
                  {resetChangedCount} course{resetChangedCount !== 1 ? 's' : ''} will return to the default template
                  for its course type, and the evaluatee selections on {resetChangedCount !== 1 ? 'those courses' : 'that course'} will
                  reset to the new template&rsquo;s coverage. This cannot be undone.
                </>
              ) : (
                <>Every course already uses its default template. Nothing will change.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={resetChangedCount > 0 ? 'destructive' : 'default'}
              onClick={onResetDefaults}
            >
              Reset templates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* S2 — Override vs. Create-new-survey. A radio CHOICE, not two
          competing buttons: the question is which of these two things the
          admin wants, not a single yes/no. Mobbin reference: Zillow's
          "Choose when to confirm" dialog uses this exact shape.
          2026-08-04 visual pass v3: v1 (icon+chip per option) and v2
          (richer TemplateCard with section dots + question counts) both
          made the SAME mistake in opposite directions — v1 repeated the
          existing template three times, v2 fixed that but then stacked an
          icon tile + colored dots + a count + a connector glyph + a lead
          icon into two small option rows, which reads as MORE cluttered
          than v1 despite being logically leaner (Romit: "too crowded").
          Correction: cut components, don't add them. One inline anchor
          line (icon + name + status, no card chrome). Options are a flat
          radio list — no bordered boxes, no per-option lead icon, no
          template card — the new template's name rides in the sentence as
          plain medium-weight text, same as any other referenced entity in
          this app's prose (e.g. the existing "Edit "X" to add it instead"
          link already does this). Whitespace and a short sentence carry the
          hierarchy instead of more graphic elements. */}
      {pendingReassign && (() => {
        const offering = selectedOfferings.find(o => o.id === pendingReassign.offeringId)
        const { code } = offering ? splitLabel(offering) : { code: '' }
        const existingTemplate = publishedTemplates.find(t => t.id === pendingReassign.existingTemplateId)
        const newTemplate = publishedTemplates.find(t => t.id === pendingReassign.newTemplateId)

        // 2026-08-04 visual pass v5 — "I want visual elements, avatars...
        // the content isn't easy to decode": v4's role-label prose (Fable)
        // was still text-only. Romit wants the actual WHO, not a role noun
        // in bold. This reuses expandInstances (already how every other row
        // in this step resolves real people — no new data model, just
        // calling it again for the NEW template hypothetically, same as the
        // Evaluatees column does for the assigned one) so the avatars here
        // are the exact same people/vocabulary already on screen in the
        // table behind this dialog — solid avatar = included, dashed circle
        // = role exists but no person yet (gap), grayscale + ban badge =
        // no longer evaluated (EvaluateeAvatar/ExcludedEvaluatee, both
        // already built for Step 2's own Evaluatees column — reused
        // verbatim here, not reinvented).
        const mode = offering ? deliveryModeOf(offering) : null
        const roleLabel = (c: Criterion) => (c === 'students' ? 'Course material' : mode ? CRITERION_BY_TYPE[mode][c]?.label : undefined)
        // Same "not applicable to this course type = drop it" rule
        // expandInstances applies internally (spec undefined → `continue`,
        // students/course-scope is always applicable) — needed here too so
        // a criterion valid for one delivery mode but not this offering's
        // never surfaces as its raw internal key.
        const applicable = (arr: Criterion[]) => arr.filter(c => c === 'students' || (mode && CRITERION_BY_TYPE[mode][c]))
        const existingCriteria = applicable(existingTemplate ? templateCriteria(existingTemplate) : [])
        const newCriteria = applicable(newTemplate ? templateCriteria(newTemplate) : [])
        const existingCriteriaSet = new Set(existingCriteria)
        const newCriteriaSet = new Set(newCriteria)
        const addedCriteria = new Set(newCriteria.filter(c => !existingCriteriaSet.has(c)))
        const removedCriteria = new Set(existingCriteria.filter(c => !newCriteriaSet.has(c)))
        const added = [...addedCriteria].map(roleLabel).filter((l): l is string => !!l)
        const removed = [...removedCriteria].map(roleLabel).filter((l): l is string => !!l)
        const list = (roles: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(roles)
        const Bold = ({ children }: { children: ReactNode }) => <span className="text-foreground font-medium">{children}</span>

        // Real instances for each template against THIS offering — same
        // resolver the Evaluatees column already runs, called a second time
        // for the not-yet-assigned template. Person-scoped only (course
        // material has no avatar to show); duplicates excluded (a blocked
        // aspect was never going to show a person here regardless).
        const peopleFor = (t?: PceTemplate) =>
          (offering && t ? expandInstances(offering, t, surveys, allTemplates) : [])
            .filter(i => i.scope !== 'course' && i.status !== 'duplicate')
        const existingPeople = peopleFor(existingTemplate)
        const newPeople = peopleFor(newTemplate)
        // Only the roles actually changing — a role both templates already
        // share never renders an avatar here, same as it never enters
        // `added`/`removed` above.
        const addedAvatars = newPeople.filter(i => addedCriteria.has(i.criterion))
        // "Removed" means someone who WAS being evaluated no longer is —
        // status 'new' only. A 'gap' instance (role existed but nobody was
        // ever assigned) has no person to exclude; ExcludedEvaluatee always
        // renders a real PersonAvatar and crashes on a null name if a gap
        // instance reaches it (caught in review — ExcludedEvaluatee itself
        // stays a "real person only" component, same contract as everywhere
        // else it's used in this file, rather than adding a null-guard
        // inside it for a case that can only arise here).
        const removedAvatars = existingPeople.filter(i => removedCriteria.has(i.criterion) && i.status === 'new')

        return (
          <AlertDialog open onOpenChange={(open) => { if (!open) { onCancelReassign(); setReassignChoice('create-new') } }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change template for {code}?</AlertDialogTitle>
              </AlertDialogHeader>
              {/* Anchor — the one fact true regardless of choice, stated
                  once, inline — no box, no card. StoryStatusBadgeOS is the
                  only "component" here; everything else is plain text. */}
              <div className="mx-6 flex items-center gap-2 text-sm text-muted-foreground">
                <i className="fa-light fa-file-lines text-xs shrink-0" aria-hidden="true" />
                <span className="truncate">{existingTemplate?.name ?? 'Its assigned template'}</span>
                <StoryStatusBadgeOS status={pendingReassign.existingStatus} />
              </div>
              <RadioGroup
                value={reassignChoice}
                onValueChange={v => setReassignChoice(v as 'override' | 'create-new')}
                className="flex flex-col divide-y divide-border px-6"
                aria-label="How to apply this template change"
              >
                <div className="flex flex-col gap-1 py-3">
                  <Label className="flex items-start gap-2 cursor-pointer">
                    <RadioGroupItem value="create-new" id="reassign-new" className="mt-0.5" />
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium">Keep both</span>
                      {/* Same avatar vocabulary as this step's own Evaluatees
                          column (EvaluateeAvatar/GapAvatar) — decorative
                          reinforcement of what the sentence already states in
                          words, not a second source of information, so it
                          stays aria-hidden rather than exposing names only
                          visually. */}
                      {addedAvatars.length > 0 && (
                        <AvatarGroup className="flex items-center" aria-hidden="true">
                          {addedAvatars.map(i => i.personName
                            ? <EvaluateeAvatar key={i.key} i={i} className="size-6" />
                            : <GapAvatar key={i.key} />)}
                        </AvatarGroup>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Also schedules {newTemplate?.name ?? 'the new template'}.{' '}
                        {added.length > 0
                          ? <>Adds <Bold>{list(added)}</Bold>. Nothing sends twice.</>
                          : <>It covers nothing the current survey does not already. Nothing sends twice.</>}
                      </span>
                    </span>
                  </Label>
                  {/* S3 escape hatch — surfaced here, not as a separate
                      dialog, since this is the exact moment an admin is
                      about to run two templates for what might really be
                      one missing aspect on the first. Opens in a new tab,
                      same convention this app already uses for "go edit
                      templates without losing your wizard place"
                      (step-survey-design.tsx's "Go to templates" links). A
                      SIBLING of the Label, not nested inside it — nesting it
                      in the radio's own Label would fold the link's text
                      into the radio's accessible name (a compliance-review
                      nit caught this). */}
                  {existingTemplate && (
                    <p className="text-xs text-muted-foreground ps-6">
                      Only need one more aspect?{' '}
                      <Link
                        href={`/templates/${existingTemplate.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        Edit it instead
                        <span className="sr-only"> (opens &ldquo;{existingTemplate.name}&rdquo; in a new tab; the template must be unpublished to edit)</span>
                      </Link>
                    </p>
                  )}
                </div>
                <Label className="flex items-start gap-2 cursor-pointer py-3">
                  <RadioGroupItem value="override" id="reassign-override" className="mt-0.5" />
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium">Replace</span>
                    {(removedAvatars.length > 0 || addedAvatars.length > 0) && (
                      <AvatarGroup className="flex items-center" aria-hidden="true">
                        {/* Grayscale + ban badge — the exact ExcludedEvaluatee
                            treatment this step already uses for "in Prism but
                            not part of this survey", reused here for "was
                            evaluated, won't be anymore". Same meaning, same
                            component, no new visual language. */}
                        {removedAvatars.map(i => <ExcludedEvaluatee key={`r-${i.key}`} i={i} />)}
                        {addedAvatars.map(i => i.personName
                          ? <EvaluateeAvatar key={`a-${i.key}`} i={i} className="size-6" />
                          : <GapAvatar key={`a-${i.key}`} />)}
                      </AvatarGroup>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {newTemplate?.name ?? 'The new template'} takes its place.{' '}
                      {removed.length > 0 && added.length > 0 && (
                        <>Stops evaluating <Bold>{list(removed)}</Bold> and adds <Bold>{list(added)}</Bold>.</>
                      )}
                      {removed.length > 0 && added.length === 0 && (
                        <>Stops evaluating <Bold>{list(removed)}</Bold> and adds nothing new.</>
                      )}
                      {removed.length === 0 && added.length > 0 && (
                        <>Adds <Bold>{list(added)}</Bold>. Nothing is removed.</>
                      )}
                      {removed.length === 0 && added.length === 0 && (
                        <>Same aspects, different questions.</>
                      )}
                    </span>
                  </span>
                </Label>
              </RadioGroup>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { onCancelReassign(); setReassignChoice('create-new') }}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { onResolveReassign(reassignChoice); setReassignChoice('create-new') }}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      })()}

      {/* ── Footer — canonical wizard anatomy (Back left, primary right); the
             plan counts live in the step heading, so the only notes that ride
             beside the submit are the gates that disable it. ── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
          Back
        </Button>
        <div className="flex items-center gap-4 min-w-0">
          {missingTemplate > 0 && (
            <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
              {missingTemplate} course{missingTemplate !== 1 ? 's' : ''} without a template
            </span>
          )}
          {conflictedCourseCount > 0 && (
            <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--chip-4)' }}>
              {conflictedCourseCount} course{conflictedCourseCount !== 1 ? 's' : ''} blocked by existing surveys
            </span>
          )}
          {canContinue ? (
            <Button variant="default" size="sm" onClick={onContinue}>
              Continue
              <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
            </Button>
          ) : (
            <Tip label={continueDisabledReason} side="top">
              <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
                <Button variant="default" size="sm" disabled>
                  Continue
                  <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                </Button>
              </span>
            </Tip>
          )}
        </div>
      </div>
    </div>
  )
}
