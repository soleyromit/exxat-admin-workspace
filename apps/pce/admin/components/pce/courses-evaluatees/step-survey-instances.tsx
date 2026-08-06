'use client'

// Wizard step shell — hand-roll justified (no DS step-frame organism), see
// docs/governance/ds-adoption.md §PCE. Composes DS Card/AvatarGroup/Command/
// Collapsible/ToggleSwitch/Checkbox/Select/Button/Badge/Tip/Dialog/
// AlertDialog/LocalBanner + ListHubStatusBadge/StoryStatusBadgeOS +
// DataTableToolbar/TablePropertiesDrawer (real DataTable search/filter).
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
  AvatarGroup, AvatarGroupCount, AvatarInitials,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Button, Checkbox, LocalBanner, ToggleSwitch, Badge, Tip,
  Card, CardContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  RadioGroup, RadioGroupItem, Label,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { DataTableToolbar } from '@/components/data-table'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { TablePropertiesDrawer } from '@/components/table-properties/drawer'
import { initialsOf } from '@/lib/pce-analytics'
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
  /** Every EXTRA template assigned to an offering beyond its primary — one
   *  array per offering, in add-order (add-order also decides which
   *  template "wins" a criterion two entries both list; see page.tsx's
   *  secondaryInstancePlan). Originates from S2's "Create new survey"
   *  choice, the general "+ Add another template" affordance below
   *  (2026-08-06, Romit's call — every course can carry more than one, not
   *  just the S2-conflict case), or the person-grain late-added-
   *  co-instructor exception. `scopePersonNames` absent = the entry covers
   *  the whole role/aspect; present (2026-08-05) = it covers only those
   *  named people. */
  secondaryTemplateAssignments: Record<string, { templateId: string; scopePersonNames?: string[] }[]>
  /** Per offering, per-entry-index (aligned with secondaryTemplateAssignments'
   *  array) — not flattened, see page.tsx's secondaryInstancesByOffering. */
  secondaryInstances: Record<string, SurveyInstance[][]>
  /** Per offering, per-entry-index — CRITERION_TOGGLE_LABEL labels for
   *  criteria that entry's template lists but a DIFFERENT template already
   *  on this offering (primary or an earlier extra) claimed first, so
   *  they're not repeated as their own evaluatee rows. Every real published
   *  template in this fixture heavily overlaps the default primary, so a
   *  whole-role entry landing here empty is common, not a rare edge case —
   *  the row uses this to say WHY instead of rendering a bare "–". */
  secondaryDedupedLabels: Record<string, string[][]>
  /** General "+ Add another template" trigger — appends a new whole-role
   *  entry. The step's own picker only offers templates not already
   *  assigned to this offering (primary or an existing extra). */
  onAddSecondaryTemplate: (offeringId: string, templateId: string) => void
  /** Changes the template of the extra-template entry at `index` (its
   *  position in that offering's array) — the "Change" action on an
   *  already-added secondary row. */
  onSecondaryTemplateChange: (offeringId: string, index: number, templateId: string) => void
  /** Person-grain entry point (2026-08-05) — a late-added co-instructor
   *  (SurveyInstance.lateAddedRelativeTo set) picks a different template
   *  than their role's existing coverage without disturbing it. Adds (or
   *  updates) an extra-template entry scoped to just this person. */
  onAssignPersonTemplate: (offeringId: string, personName: string, templateId: string) => void
  /** Removes the extra-template entry at `index`. */
  onRemoveSecondary: (offeringId: string, index: number) => void
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
// checkbox · chevron · course · type · template dropdown · evaluatees chip · status · action
// 2026-08-05: Template/Evaluatees/Action were frozen px tracks that stayed
// pinned at their old width even when the row had slack to spare — Course
// alone absorbed all growth. Template and Action now share growth via
// minmax(...,1fr) instead of being frozen; Evaluatees stays a fixed track
// (avatars are fixed-size content, not text that benefits from extra room)
// but is widened to fit 3 avatars + "+N" count + gap indicator without
// relying on PersonAvatar's un-forwarded DS size (fixed alongside this).
// 2026-08-06: Template became a real Select (SelectTrigger + chevron), not
// a read-only chip — the old 168px floor clipped longer names ("Comprehensive
// Course Evaluation") against the trigger's own affordance icon. Widened its
// floor/share; Course's growth share and Evaluatees' fixed width both gave up
// a little room rather than starving Action, which still needs to fit
// multi-word button labels ("Assign Placement Faculty").
const TABLE_GRID = `24px 24px minmax(160px,1.1fr) 76px minmax(210px,1.3fr) 140px 88px minmax(160px,1fr)`

/** Per-course Continue-gate failure states (ST-02 Blocks). A faculty gap
 *  alone never appears here — it never blocks. */
type BlockReason = 'no-template' | 'overlap' | 'no-units' | 'unstaffed' | 'none-selected'

interface CourseGate {
  reasons: BlockReason[]
  fresh: SurveyInstance[]
  gaps: SurveyInstance[]
  dups: SurveyInstance[]
}

/** One row per course, just for the real DataTable search/filter
 *  infrastructure (useTableState + DataTableToolbar + TablePropertiesDrawer
 *  — the same machinery step-scope-courses.tsx uses) — NOT for rendering:
 *  the accordion rows below still render straight off `courses`/
 *  `gatesByOffering`. DataTable itself can't do this step's expand-per-row
 *  panel, so only its search/filter layer is reused; `offering` carries the
 *  real data back out of `state.rows` after filtering. */
interface StepCourseRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  statusFilter: 'ready' | 'attention' | 'blocked'
  offering: CourseOffering
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
function RowAction({ gate, onAssign, driftNotice }: { gate: CourseGate; onAssign: () => void; driftNotice?: TemplateDriftNotice }) {
  // ST-02 Draft/Scheduled resume: "row shows a 'template updated since
  // Draft was saved' notice" — surfaced here (not just the top LocalBanner)
  // so it can't be missed scrolling past this one row. Same array/dismiss
  // as the banner (templateDriftNotices/onDismissTemplateDrift) — no
  // separate acknowledge state to fall out of sync with.
  if (driftNotice?.kind === 'updated') {
    return (
      <Button variant="ghost" size="xs" className="justify-start min-w-0 max-w-full" style={{ color: 'var(--insight-severity-info-fg)' }} onClick={onAssign} aria-label={`Template updated for ${driftNotice.courseCode} — review`}>
        <i className="fa-solid fa-arrow-rotate-right text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">Template updated</span>
      </Button>
    )
  }
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
    // Role-based, not person-named (Romit's 2026-08-06 call, same as the
    // roster's own advisory row) — a new person found on a role this course
    // already covers still surfaces as a role-scoped decision here, not a
    // name the Action column singles out.
    const lateRoles = [...new Set(lateAdded.map(i => i.roleLabel))]
    // Shortened to "Review {role}" (drop "template") — same shape as the
    // Gap button's "Assign {role}" / "Assign {n} roles" pair above, and
    // short enough not to truncate mid-word in this column at common role
    // name lengths (Romit's catch: "Review Instructor template" clipped to
    // "Review Instructor templ…").
    const label = lateRoles.length === 1
      ? `Review ${lateRoles[0]}`
      : `Review ${lateRoles.length} roles`
    return (
      <Button
        variant="outline"
        size="xs"
        className="justify-start min-w-0 max-w-full"
        style={{ color: 'var(--chip-4)', borderColor: 'var(--chip-4)' }}
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
    <AvatarInitials initials={initialsOf(i.personName!)} size="sm" className={cn('shrink-0', className)} />
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
/** Template column, collapsed row — a real dropdown instead of a read-only
 *  chip (2026-08-06, Romit's call): change the template directly from the
 *  table without opening the row. Reuses whichever change handler the
 *  caller already had wired (primary → onTemplateChange, still runs
 *  through the S2 conflict check in page.tsx; secondary → per-entry
 *  onSecondaryTemplateChange) — this is just a faster trigger for the same
 *  commit path, not a new one. */
function TemplateDropdown({
  templateId, code, publishedTemplates, onChange,
}: {
  templateId: string
  code: string
  publishedTemplates: PceTemplate[]
  onChange: (templateId: string) => void
}) {
  // 2026-08-06 Course Eval sync up (Monil, raw transcript): "You will give a
  // dialogue that are you sure you want to change the template — if the
  // template is updated, all the evaluatees will also be updated based on
  // the new template selected." Picking a DIFFERENT template stages the
  // choice here instead of committing it straight from the Select; only
  // Confirm calls the real `onChange`, which still runs through whatever
  // conflict handling the caller already had wired (the primary row's S2
  // Draft/Scheduled-survey check in page.tsx). No dialog for a row's FIRST
  // assignment (`templateId` empty) — Monil's "too complex" pushback was
  // about guiding a first-time pick, not about warning on nothing-to-lose.
  const [pendingId, setPendingId] = useState<string | null>(null)
  const pendingTemplate = pendingId ? publishedTemplates.find(t => t.id === pendingId) : null
  return (
    <>
      <Select
        value={templateId}
        onValueChange={tid => {
          if (tid === templateId) return
          if (!templateId) { onChange(tid); return }
          setPendingId(tid)
        }}
      >
        {/* bg-background — the DS SelectTrigger is bg-transparent at rest
            (fieldControlChromeClass), which reads fine on the plain table
            but blended into var(--dt-row-selected) once a row opens (Romit's
            catch): a light-gray control on a light-gray row read as one
            undifferentiated surface. An explicit opaque background keeps the
            control visible in both the closed AND open row states. */}
        <SelectTrigger size="sm" aria-label={`Template for ${code}`} className="w-full min-w-0 bg-background">
          <SelectValue placeholder="No template" />
        </SelectTrigger>
        <SelectContent>
          {publishedTemplates.map(t => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AlertDialog open={!!pendingId} onOpenChange={open => { if (!open) setPendingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change template for {code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to <strong>{pendingTemplate?.name}</strong> updates every evaluatee on {code} to match its
              roles — course material and faculty assignments recompute from the new template, and any per-person
              choices made under the current one don&rsquo;t carry over.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onChange(pendingId!); setPendingId(null) }}>
              Change template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
      {/* Romit's 2026-08-06 call: these avatars had no tooltip (aria-hidden,
          identity only in the sr-only summary above) — now individually
          reachable + labeled via Tip, so hovering/tabbing a specific avatar
          answers "who is this" without opening the row. The sr-only summary
          stays for a fast screen-reader overview of the whole cluster. */}
      <AvatarGroup>
        {shown.map(i => (
          // Person-grain exception (2026-08-05) — a late-added co-instructor
          // gets a visible-at-rest corner badge here too, not just inside the
          // expanded panel: this file's own Round 2 rationale (see header) is
          // that collapsed-row state should be readable without opening
          // anything, and "needs a template decision" is exactly that kind
          // of state. Distinct glyph/position from the gap disc (dashed,
          // sibling in this row) and the S4 excluded ban-badge (bottom-end),
          // so none of the three read as each other.
          <Tip key={i.key} label={evaluateeLabel(i)} side="top">
            {i.lateAddedRelativeTo ? (
              <span tabIndex={0} className="relative inline-flex shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
                <EvaluateeAvatar i={i} className="size-6" />
                <span
                  className="absolute -top-1 -end-1 size-3.5 rounded-full flex items-center justify-center border bg-background"
                  style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
                >
                  <i className="fa-solid fa-arrow-right-arrow-left text-[7px]" aria-hidden="true" />
                </span>
              </span>
            ) : (
              <span tabIndex={0} className="inline-flex shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
                <EvaluateeAvatar i={i} className="size-6" />
              </span>
            )}
          </Tip>
        ))}
        {extra > 0 && <AvatarGroupCount>+{extra}</AvatarGroupCount>}
        {gapCount > 0 && (
          <Tip label={gapCount === 1 ? `${gate.gaps[0].roleLabel} needs a person` : `${gapCount} roles need a person`} side="top">
            <span
              tabIndex={0}
              className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
            >
              <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
            </span>
          </Tip>
        )}
      </AvatarGroup>
    </span>
  )
}

/** General "+ Add another template" trigger (2026-08-06, Romit's call —
 *  validated at /compare/push-step2-template-hierarchy: "available on EVERY
 *  course, not just DPT-510"). Sits after a course's primary row and any
 *  already-added extra-template rows; offers only templates not already on
 *  this course. Module scope for the same reason as the row helpers above —
 *  a fresh identity per render would remount the Select on every keystroke
 *  elsewhere in the row. */
function AddTemplateRow({
  code, templates, onAdd,
}: {
  code: string
  templates: PceTemplate[]
  onAdd: (templateId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [pickedId, setPickedId] = useState('')
  if (templates.length === 0) return null
  const confirm = () => {
    if (!pickedId) return
    onAdd(pickedId)
    setOpen(false)
    setPickedId('')
  }
  return (
    <>
      {/* Full-width card, matching the "Also evaluating" entries it now
          stacks directly beneath (Romit's call: it needs to read as "one
          more item in this same list," not a smaller, differently-shaped
          control tacked on after them). Same rounded-md/border shape those
          entries' own outer card uses — the brand-colored border/icon/text
          is what still marks it as the ACTION in that stack, not a compact
          standalone button that broke the rhythm of the list. */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className="flex h-auto w-full items-center justify-start gap-2.5 rounded-md p-2.5 min-w-0 text-start font-normal"
        style={{ borderColor: 'var(--primary)' }}
      >
        <span
          className="size-6 rounded-full flex items-center justify-center border shrink-0"
          style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          <i className="fa-solid fa-circle-plus text-xs" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>Add another template</span>
      </Button>

      {/* Dialog, not the old inline Select-in-the-row — Romit's call.
          Picking a second template is a real, standalone decision (it
          stages a whole new, independently-toggleable evaluation for this
          course), not a quick inline tweak like the row's own Template
          dropdown, which stays inline since it only ever changes one
          already-committed value. */}
      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setPickedId('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add another template for {code}</DialogTitle>
            <DialogDescription>
              Evaluates alongside the template{templates.length !== 1 ? 's' : ''} already on this course — choose one
              not already assigned.
            </DialogDescription>
          </DialogHeader>
          <Select value={pickedId} onValueChange={setPickedId}>
            <SelectTrigger aria-label={`Choose another template for ${code}`} className="w-full">
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button variant="default" size="sm" disabled={!pickedId} onClick={confirm}>
              Add template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// 2026-08-06 — the previous "card roster" (each evaluatee its own bordered
// checkbox-card, grouped under a zone header per decision type) is replaced
// below by a flowing hierarchical tree, grouped by TEMPLATE (the tree
// header, CourseDetailBody) with plain divided rows underneath — see
// EvaluateeRoster's own comment for why. EvaluateeZoneHeader (the zone-label
// component this design used) is gone with it; each row already states its
// own status inline, so nothing it said is lost.
function EvaluateeRoster({
  code, gate, included, deselectedFresh, onToggleUnit, onToggleUnits,
  offering, publishedTemplates, secondaryScopePersonNames, onAssignPersonTemplate,
}: {
  code: string
  gate: CourseGate
  included: ReadonlySet<string>
  /** S4 — `fresh` units whose unitSelections entry is 'deselected': present
   *  in Prism, explicitly excluded from this push. Rendered muted so the
   *  admin can SEE the exclusion instead of the unit silently vanishing. */
  deselectedFresh: readonly SurveyInstance[]
  onToggleUnit: (key: string) => void
  /** Role-level bulk toggle (2026-08-06 Course Eval sync up, Monil, raw
   *  transcript: "that toggle is not on a person, it's on a role... we
   *  will not show who the instructors are at this level"). Sets every key
   *  in a role group to the SAME state in one call. */
  onToggleUnits: (keys: string[], on: boolean) => void
  /** Person-grain exception (2026-08-05) — only wired on the PRIMARY row's
   *  roster; the secondary ("Also evaluating") row's own roster omits
   *  these, since the affordance's target IS that one secondary slot. */
  offering?: CourseOffering
  publishedTemplates?: PceTemplate[]
  /** Named people already occupying this offering's one secondary slot. */
  secondaryScopePersonNames?: string[]
  onAssignPersonTemplate?: (offeringId: string, personName: string, templateId: string) => void
}) {
  const { fresh, gaps, dups } = gate
  // 2026-08-06 — hierarchical tree, replacing the ZONE-GROUPED layout (Ready
  // / Advisory / Needs a person / Blocked, each under its own section
  // header). Romit's direction across the whole push-step2-template-
  // hierarchy exploration: group by TEMPLATE first (this roster IS one
  // template's worth of evaluatees — the tree header lives in
  // CourseDetailBody just above), rows flowing in ONE sequential list
  // instead of four separately-labeled sections.
  //
  // Round 2 (2026-08-06, same day) — the first pass over-flattened this:
  // dropping the zone headers also dropped every row's own card background
  // and border (var(--card)/var(--pce-impact-bg), rounded-md border,
  // border-dashed for gaps), leaving plain text divided by a hairline.
  // Romit's live comparison against the original caught it. Restored here
  // — each row keeps its original per-severity card treatment (still the
  // one real design signal distinguishing "resolved" / "optional" /
  // "missing" / "locked" at a glance) — only the SECTION GROUPING is gone,
  // not the row-level visual weight.
  const [openPicker, setOpenPicker] = useState<string | null>(null)
  const [pickedTemplateId, setPickedTemplateId] = useState('')
  if (fresh.length === 0 && gaps.length === 0 && dups.length === 0) {
    return <span className="text-xs text-muted-foreground">&ndash;</span>
  }
  const deselectedKeys = new Set(deselectedFresh.map(i => i.key))
  const readyFresh = fresh.filter(i => !i.lateAddedRelativeTo)
  const advisoryFresh = fresh.filter(i => i.lateAddedRelativeTo)
  const canOfferDifferentTemplate = !!offering && !!publishedTemplates && !!onAssignPersonTemplate

  // 2026-08-06 Course Eval sync up (Monil, raw transcript): "your end of
  // term evaluation has how many roles to be evaluated... course material
  // and instructor, only two... you tell the system that I only want to
  // evaluate course material and instructor... that toggle is not on a
  // person, it's on a role." Every plain-ready instance for the SAME role
  // (co-instructors, co-coordinators) collapses into ONE row — one toggle
  // for the whole role, faculty shown as a stacked avatar cluster instead
  // of "who the instructors are at this level." Course material has no
  // person concept, so it's never grouped with anything. Advisory
  // (late-added, needs its own template decision) and Blocked rows below
  // keep their existing per-person treatment — each already carries an
  // action a role-level toggle can't represent (pick a different template,
  // view the blocking survey).
  const readyGroups: { key: string; roleLabel: string; scope: SurveyInstance['scope']; instances: SurveyInstance[] }[] = []
  for (const i of readyFresh) {
    const groupKey = i.scope === 'course' ? i.key : i.roleLabel
    const existing = readyGroups.find(g => g.key === groupKey)
    if (existing) existing.instances.push(i)
    else readyGroups.push({ key: groupKey, roleLabel: i.roleLabel, scope: i.scope, instances: [i] })
  }

  return (
    <div className="flex flex-col gap-2">
      {readyGroups.map(group => {
        const keys = group.instances.map(i => i.key)
        const allIn = keys.every(k => included.has(k))
        const allAutoUpdateExcluded = keys.every(k => !included.has(k) && deselectedKeys.has(k))
        const count = group.instances.length
        return (
          <div
            key={group.key}
            className="flex w-full items-start gap-2.5 rounded-md border border-border p-2.5 min-w-0"
            style={{ background: 'var(--card)' }}
          >
            {group.scope === 'course' ? (
              <EvaluateeAvatar i={group.instances[0]} className={cn('size-6', !allIn && 'grayscale')} />
            ) : (
              // Role-level glyph, never AvatarInitials/an AvatarGroup of real
              // people — Romit's 2026-08-06 call (Monil, raw transcript:
              // "that toggle is not on a person, it's on a role... we will
              // not show who the instructors are at this level"). The prior
              // version still surfaced names as this row's caption, which
              // contradicted the decision it was built to satisfy — this
              // glyph can never leak a specific identity, whether the role
              // resolves to one person or several. Same circle/border
              // treatment as the course-material icon beside it, so a role
              // row and a course row read as the same visual family.
              <span className={cn('size-6 rounded-full flex items-center justify-center border border-border bg-background shrink-0', !allIn && 'grayscale')}>
                <i className="fa-light fa-user-group text-[10px] text-muted-foreground" aria-hidden="true" />
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              {/* Role is the ONLY identity this toggle carries now — no
                  person name/count-of-names caption underneath. */}
              <span className={cn('truncate text-sm font-medium', !allIn && 'text-muted-foreground')}>
                {group.scope === 'course' ? 'Course material' : group.roleLabel}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {allAutoUpdateExcluded
                  ? 'In Prism, not included — Auto Update is off'
                  : (group.scope === 'course' ? 'Course' : `${count} ${count === 1 ? 'person' : 'people'}`)}
              </span>
            </span>
            {/* Evaluatee toggle is ToggleSwitch, not Checkbox — Romit's
                2026-08-06 call. Course-level selection stays Checkbox
                (Step 1's same control, ST-02).
                Gate 2 fix (ds-conformance-reviewer): ToggleSwitch's real
                props are only {checked, onChange, id} — it does not spread
                aria-label onto its underlying button, so passing one
                directly is silently dropped (renders "On"/"Off" with no
                evaluatee context). sr-only label + htmlFor/id, same pairing
                already used for the real Auto Update ToggleSwitch below. */}
            <label htmlFor={`unit-${code}-${group.key}`} className="sr-only">
              {`Include ${group.scope === 'course' ? 'Course material' : `${group.roleLabel} (${count} ${count === 1 ? 'person' : 'people'})`} in this push`}
            </label>
            <ToggleSwitch id={`unit-${code}-${group.key}`} checked={allIn} onChange={() => onToggleUnits(keys, !allIn)} />
          </div>
        )
      })}

      {advisoryFresh.map(i => {
        const isIn = included.has(i.key)
        const slotTaken = !!secondaryScopePersonNames?.length && !secondaryScopePersonNames.includes(i.personName ?? '')
        const picking = openPicker === i.key
        return (
          <div
            key={i.key}
            className="flex w-full flex-col gap-1.5 rounded-md border p-2.5 min-w-0"
            style={{ borderColor: 'var(--chip-4)', background: 'var(--card)' }}
          >
            <div className="flex w-full items-start gap-2.5 min-w-0">
              {/* Role-level glyph, not EvaluateeAvatar — Romit's 2026-08-06
                  call, same reasoning as the readyGroups rows above: this is
                  a role-scoped decision (include the role or not), so the
                  avatar can't imply a specific person is the thing being
                  decided on, even though the row's own caption still names
                  who was newly added. */}
              <span className={cn('size-6 rounded-full flex items-center justify-center border shrink-0', !isIn && 'grayscale')} style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}>
                <i className="fa-light fa-user-group text-[10px]" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cn('truncate text-sm font-medium', !isIn && 'text-muted-foreground')}>{i.roleLabel}</span>
                <span className="truncate text-xs" style={{ color: 'var(--chip-4)' }}>
                  <i className="fa-solid fa-arrow-right-arrow-left me-1" aria-hidden="true" style={{ fontSize: 9 }} />
                  Advisory — {i.personName}, uses default unless changed
                </span>
              </span>
              {/* Same Gate 2 fix as the readyFresh toggle above — aria-label
                  is not a real ToggleSwitch prop. */}
              <label htmlFor={`unit-${code}-${i.key}`} className="sr-only">{`Include ${evaluateeLabel(i)} in this push`}</label>
              <ToggleSwitch id={`unit-${code}-${i.key}`} checked={isIn} onChange={() => onToggleUnit(i.key)} />
            </div>
            {canOfferDifferentTemplate && (
              <div className="flex flex-col gap-1.5 border-t border-border pt-1.5">
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
                  // Was variant="link" (bare colored text) — Romit's
                  // 2026-08-06 call: it didn't read as a clickable action.
                  // variant="outline" gives it the same button affordance as
                  // every other row action (View survey, Add in Prism).
                  <Button
                    variant="outline"
                    size="xs"
                    className="self-start"
                    style={{ color: 'var(--chip-4)', borderColor: 'var(--chip-4)' }}
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

      {gaps.map(i => (
        <div
          key={i.key}
          className="flex w-full items-start gap-2.5 rounded-md border border-dashed p-2.5 min-w-0"
          style={{ borderColor: 'var(--chip-5)', background: 'var(--pce-impact-bg)' }}
        >
          <span
            className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0"
            style={{ borderColor: 'var(--chip-5)', color: 'var(--chip-5)' }}
            aria-hidden="true"
          >
            <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium" style={{ color: 'var(--chip-5)' }}>{i.roleLabel}</span>
            <span className="text-xs" style={{ color: 'var(--chip-5)' }}>No one assigned in Prism</span>
          </span>
          {i.prismHref && (
            // Was an inline underlined link stacked under the caption text —
            // Romit's call: every other card's action (View survey, Use a
            // different template) reads as a real button, and this one now
            // sits on the right the same way, instead of being the odd one
            // out as plain text at the bottom.
            <Button
              variant="outline"
              size="xs"
              asChild
              className="shrink-0"
              style={{ color: 'var(--chip-5)', borderColor: 'var(--chip-5)' }}
            >
              <a href={i.prismHref} target="_blank" rel="noopener noreferrer">
                Add in Prism
                <span className="sr-only"> (opens Prism in a new tab to assign the {i.roleLabel} role on {code})</span>
              </a>
            </Button>
          )}
        </div>
      ))}

      {dups.map(i => {
        const primaryLabel = i.scope === 'course' ? 'Course material' : i.roleLabel
        const secondaryLabel = i.scope === 'course' ? null : i.personName
        const status = i.existing ? storyStatusOf(i.existing) : null
        const openedLabel = i.existing?.openDate ? fmtYmd(i.existing.openDate) : null
        return (
          <div
            key={i.key}
            // 2026-08-06 — toned down from the solid chip-destructive
            // border/pce-impact-bg fill (Romit's call): this role isn't
            // broken or blocking anything, it's already being evaluated by
            // a LIVE survey — informational and locked, not an error. The
            // full-alarm red read as something to fix, competing with the
            // Blocked status this row can't actually cause on its own (see
            // the 'overlap' reason — only fires when NOTHING else on the
            // course is left to evaluate).
            // Round 2 (same day) — the first muted-surface pass (Romit's
            // catch) put text-muted-foreground ON var(--muted): that pairing
            // is only calibrated against var(--card)/var(--background), so
            // on its own muted background the icon/text contrast fell
            // short, on top of reading as a flat, slightly off (brand-hue-
            // tinted) wash rather than a clean neutral. Plain var(--card) +
            // border-border instead — the same white-card treatment every
            // OTHER evaluatee row here already uses, so muted-foreground is
            // back on the surface it's actually designed for.
            className="flex w-full flex-col gap-1.5 rounded-md border border-border p-2.5 min-w-0"
            style={{ background: 'var(--card)' }}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {i.scope === 'course' ? (
                <EvaluateeAvatar i={i} className="size-6 grayscale" />
              ) : (
                // Role-level glyph, not EvaluateeAvatar — same 2026-08-06 call
                // as the ready/advisory rows above, applied here too (Romit's
                // catch): the card's own caption still names who's already
                // covered (needed to know whose survey "View survey" opens),
                // but the avatar itself can't single out a specific person.
                <span className="size-6 rounded-full flex items-center justify-center border shrink-0 grayscale text-muted-foreground">
                  <i className="fa-light fa-user-group text-[10px]" aria-hidden="true" />
                </span>
              )}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{primaryLabel}</span>
                {secondaryLabel && <span className="truncate text-xs text-muted-foreground">{secondaryLabel}</span>}
              </span>
              <i className="fa-solid fa-lock text-xs shrink-0 mt-0.5 text-muted-foreground" aria-hidden="true" />
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
  )
}

// 2026-08-05 (2nd pass) — dropdown → radio blocks, per Romit's live feedback:
// a Select hid every OTHER candidate template behind a closed menu, so
// comparing options meant opening it, reading one at a time, closing it.
// Blocks keep every option visible at once and give each its own Preview
// action (`onPreview`) — the Admin can preview a CANDIDATE before
// committing, not only the template already assigned. Reuses the exact
// card/whole-Label-click-target vocabulary EvaluateeRoster already
// established in this file, rather than inventing new chrome.
export function TemplateControl({ offering, templateId, defaultTemplateId, publishedTemplates, onTemplateChange, onCreate, onPreview }: {
  offering: CourseOffering
  templateId: string
  /** The course-type default (page-owned pickTemplateForType) — drives the
   *  "Default" badge (Revolut/Airwallex "Suggested" tag model). Badged only
   *  when the template really matches the course's type, so the legacy
   *  first-published fallback never wears a label it didn't earn. */
  defaultTemplateId?: string
  publishedTemplates: PceTemplate[]
  onTemplateChange: (offeringId: string, templateId: string) => void
  onCreate: () => void
  onPreview: (t: PceTemplate) => void
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
  // A template with no courseType (or the explicit 'any') applies to every
  // course type — same wildcard rule as page.tsx's pickTemplateForType.
  // Without it, this always reads empty against the fixture's own
  // courseType:'any' templates, showing "No templates for this course
  // type" above a list that includes them anyway.
  const typeMatches = offering.courseType
    ? publishedTemplates.filter(t => !t.courseType || t.courseType === 'any' || t.courseType === offering.courseType)
    : []
  return (
    <div className="flex flex-col gap-2">
      {typeMatches.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          No templates for this course type
        </p>
      )}
      {!templateId && (
        <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
          <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
          Choose a template
        </p>
      )}
      <RadioGroup
        value={templateId}
        onValueChange={v => onTemplateChange(offering.id, v)}
        className="flex flex-col gap-2"
        aria-label={`Template for ${code}${!templateId ? ' · required' : ''}`}
      >
        {publishedTemplates.map(t => {
          const checked = t.id === templateId
          const isDefault = t.id === defaultTemplateId && (!t.courseType || t.courseType === 'any' || t.courseType === offering.courseType)
          const inputId = `tmpl-${code}-${t.id}`
          return (
            <div
              key={t.id}
              className="flex w-full items-start gap-2.5 rounded-md border p-2.5 min-w-0"
              style={{ borderColor: checked ? 'var(--primary)' : 'var(--border)', background: 'var(--card)' }}
            >
              <RadioGroupItem value={t.id} id={inputId} className="mt-0.5 shrink-0" />
              {/* 2026-08-05 (3rd pass) — the Default badge used to share the
                  title line with the trailing Preview icon: at the rail's
                  real 280px width, title + badge + icon regularly exceeded
                  the available line, crowding the icon straight against the
                  title text (live-verified — zero gap). Moving the badge
                  down to the meta line leaves line 1 as title-only, so
                  `truncate` has the room it needs and the icon always gets
                  its own clear gap regardless of name length. */}
              <Label htmlFor={inputId} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{t.name}</span>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate text-xs text-muted-foreground">
                    {t.questionCount} question{t.questionCount !== 1 ? 's' : ''}
                  </span>
                  {isDefault && (
                    // 12px floor (WCAG 1.4.4 / DS type scale) — never below text-xs.
                    <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                      Default
                    </Badge>
                  )}
                </span>
              </Label>
              <Button
                variant="ghost"
                size="icon-xs"
                className="ml-1 shrink-0"
                aria-label={`Preview ${t.name}`}
                onClick={() => onPreview(t)}
              >
                <i className="fa-light fa-eye text-xs" aria-hidden="true" />
              </Button>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// 2026-08-05 — Template + Evaluatees detail body, shared between the two
// layout variants a course row can open into (Romit wants both testable
// live, side by side, before picking one — see the "Row detail" toggle in
// StepSurveyInstances): `layout="grid"` is the current shipped inline
// accordion (two columns in the row's own expanded panel); `layout="stack"`
// is the new master-detail Sheet (single column — a ~560px rail has no
// room for two). Extracting this once means the two variants can never
// silently drift apart while both are live for comparison. MODULE scope,
// same reason as this file's other row pieces (stable identity across
// re-renders — see file header).

/** Name + question/criteria caption + Preview/Remove — the tree header a
 *  template's detail opens with, shared between CourseDetailBody's rail
 *  layout (primary + normal extra-template entries) and the "fully deduped"
 *  extra-template case below (which skips CourseDetailBody's roster entirely
 *  since it has nothing to toggle, but still needs the same header). Pulled
 *  out so those two call sites can never drift onto different button styles
 *  or copy — the exact bug that let Preview stay a plain-text ghost Button
 *  for as long as it did. */
function TemplateHeaderRow({
  template, isDefault, criteria, mode, onPreview, onRemove, secondaryBadges,
}: {
  template: PceTemplate
  isDefault: boolean
  criteria: Criterion[]
  mode: DeliveryMode
  onPreview: (t: PceTemplate) => void
  onRemove?: () => void
  /** Extra-template entries only — "Also evaluating" + its live Ready/Gap/
   *  Blocked status, folded into this SAME header (2026-08-06, Romit's
   *  call) instead of a separate toolbar sitting above it. The old
   *  two-header layout (a grey "Also evaluating" bar, then this row again
   *  underneath) read as a different kind of control than the primary
   *  template's one clean line — this makes every template entry, primary
   *  or extra, read the same. Switching an extra template's own choice is
   *  Remove + "Add another template" (Romit's call, 2026-08-06 round 2 — an
   *  inline dropdown here duplicated that same decision two ways). */
  secondaryBadges?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          {template.name}
          {isDefault && (
            <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
              Default
            </Badge>
          )}
          {secondaryBadges}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {template.questionCount} question{template.questionCount !== 1 ? 's' : ''} · Evaluates{' '}
          {criteria
            .filter(c => c === 'students' || !!CRITERION_BY_TYPE[mode][c])
            .map(c => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c]?.label ?? c))
            .join(', ')}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* Both real outline buttons, not ghost — a ghost Button has no
            visible chrome at rest and read as plain text (Romit's 2026-08-06
            call). Remove gets the same treatment as Preview, not a bare icon
            — an extra template entry is a real, named commitment on this
            course, so removing it reads as an equally real action. */}
        <Button variant="outline" size="xs" onClick={() => onPreview(template)}>Preview</Button>
        {onRemove && <Button variant="outline" size="xs" onClick={onRemove}>Remove</Button>}
      </div>
    </div>
  )
}

function CourseDetailBody({
  offering, code, mode, gate, template, criteria, templateId, stagedTemplateId,
  defaultTemplateId, publishedTemplates, onStageTemplate, onCommitStage, onClearStage,
  onCreateTemplate, onPreview, included, deselectedFresh, onToggleUnit, onToggleUnits,
  secondaryScopePersonNames, onAssignPersonTemplate, onRemove, layout, secondaryBadges,
}: {
  offering: CourseOffering
  code: string
  mode: DeliveryMode
  gate: CourseGate
  template: PceTemplate | null
  criteria: Criterion[]
  templateId: string
  stagedTemplateId: string | undefined
  defaultTemplateId: string | undefined
  publishedTemplates: PceTemplate[]
  onStageTemplate: (offeringId: string, templateId: string) => void
  onCommitStage: (stagedTemplate: PceTemplate) => void
  onClearStage: () => void
  onCreateTemplate: () => void
  onPreview: (t: PceTemplate) => void
  included: ReadonlySet<string>
  deselectedFresh: readonly SurveyInstance[]
  onToggleUnit: (key: string) => void
  onToggleUnits: (keys: string[], on: boolean) => void
  secondaryScopePersonNames?: string[]
  onAssignPersonTemplate?: (offeringId: string, personName: string, templateId: string) => void
  /** Extra-template entries only ("+ Add another template") — removes this
   *  whole entry from the course. Undefined on the primary row, which has no
   *  remove concept of its own. */
  onRemove?: () => void
  /** 'grid' = inline accordion (side by side); 'stack' = Sheet (vertical);
   *  'rail' = Evaluatees as the wide pane, Template as a compact card that
   *  expands to the full radio stack only on "Change" (picked direction,
   *  2026-08-05 — see variant comparison at /compare/push-step2-accordion-layout). */
  layout: 'grid' | 'stack' | 'rail'
  /** Extra-template entries only — passed straight through to the 'rail'
   *  layout's TemplateHeaderRow (see that component's own doc). */
  secondaryBadges?: ReactNode
}) {
  const stagedTemplate = stagedTemplateId ? publishedTemplates.find(t => t.id === stagedTemplateId) : undefined
  const consequence = stagedTemplate && stagedTemplateId !== templateId
    ? templateSwitchConsequence(mode, template, stagedTemplate)
    : null
  // Fix, 2026-08-05: TemplateControl used to receive `stagedTemplateId ??
  // templateId`, so its radio visually committed to the staged pick the
  // instant it was clicked — the exact pending-vs-committed confusion this
  // whole redesign thread started from (the radio said "done", the
  // consequence card below still said "takes its place", the caption
  // further down still showed the OLD template). TemplateControl now only
  // ever receives the real committed `templateId`; the staged pick lives
  // only in the consequence card below, same as every other Round 1
  // "Honest Trigger" variant explored.
  const isDefault = !!defaultTemplateId && templateId === defaultTemplateId
  // ST-02 Blocks, 4th bullet — ported from the /compare/push-step2-template-
  // hierarchy exploration, never previously wired into the shipped step:
  // a template whose assigned roles resolve to ZERO faculty (all gaps, no
  // one at all) would produce an empty evaluation, so it can't be included
  // until a role is filled or the entry is removed. Reuses the gate's own
  // 'unstaffed' reason rather than re-deriving fresh/gap counts, so this can
  // never disagree with the row's own Blocked status or Continue-gate logic.
  const zeroFaculty = gate.reasons.includes('unstaffed')

  const templatePicker = (
    <TemplateControl
      offering={offering}
      templateId={templateId}
      defaultTemplateId={defaultTemplateId}
      publishedTemplates={publishedTemplates}
      onTemplateChange={(offeringId, tid) => {
        if (tid === templateId) { onClearStage(); return }
        onStageTemplate(offeringId, tid)
      }}
      onCreate={onCreateTemplate}
      onPreview={onPreview}
    />
  )

  const consequenceCard = consequence && stagedTemplate && (
    // dt-row-selected, not var(--muted) — see the identical fix + rationale
    // on the "already evaluated by another template" aside below.
    <div className="flex max-w-sm flex-col gap-2 rounded-md border border-border p-2.5" style={{ background: 'var(--dt-row-selected)' }}>
      <p className="text-xs text-muted-foreground">
        <i className="fa-light fa-arrow-right-arrow-left me-1.5" aria-hidden="true" />
        Switch to <span className="font-medium text-foreground">{stagedTemplate.name}</span>?{' '}
        {consequence.removed.length > 0 && consequence.added.length > 0 && (
          <>Stops evaluating <span className="font-medium text-foreground">{listFmt(consequence.removed)}</span> and adds <span className="font-medium text-foreground">{listFmt(consequence.added)}</span>.</>
        )}
        {consequence.removed.length > 0 && consequence.added.length === 0 && (
          <>Stops evaluating <span className="font-medium text-foreground">{listFmt(consequence.removed)}</span> and adds nothing new.</>
        )}
        {consequence.removed.length === 0 && consequence.added.length > 0 && (
          <>Adds <span className="font-medium text-foreground">{listFmt(consequence.added)}</span>. Nothing is removed.</>
        )}
        {consequence.removed.length === 0 && consequence.added.length === 0 && <>Same aspects, different questions.</>}
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="default" size="xs" onClick={() => onCommitStage(stagedTemplate)}>
          Switch template
        </Button>
        <Button variant="ghost" size="xs" onClick={onClearStage}>
          Keep current
        </Button>
      </div>
    </div>
  )

  // 2026-08-05 — neutral template metadata, true regardless of any block,
  // not a fact about a conflict.
  // Fix, 2026-08-05: this used to map every raw template criterion
  // straight to a label with `?? c` as the fallback — so a criterion the
  // template lists but this course's delivery mode has no resolver for
  // (e.g. `labAssistant` on a classroom course; see CRITERION_BY_TYPE's
  // per-mode Partial, pce-course-readiness.ts:168) leaked its bare enum
  // key into the caption instead of a real word. `templateSwitchConsequence`
  // and the pendingReassign dialog below both already apply this same
  // "not applicable to this mode = drop it" filter before labeling —
  // matching that instead of inventing a third fallback strategy.
  // I3 (2026-08-06 UX audit) — used to restate `{template.name} ·
  // {questionCount} questions` before "evaluates ..."; in the 'rail' layout
  // that's the exact same name + count TemplateHeaderRow already shows above
  // it, so it read as the same fact twice. The "evaluates X, Y, Z" clause is
  // the only part
  // that's genuinely new information (neither the card nor the radio picker
  // states it) — kept, the redundant prefix dropped.
  const metadataCaption = template && (
    <p className="text-xs text-muted-foreground tabular-nums">
      Evaluates{' '}
      {criteria
        .filter(c => c === 'students' || !!CRITERION_BY_TYPE[mode][c])
        .map(c => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c]?.label ?? c))
        .join(', ')}
    </p>
  )

  const evaluateeRosterEl = (
    <EvaluateeRoster
      code={code}
      gate={gate}
      included={included}
      deselectedFresh={deselectedFresh}
      onToggleUnit={onToggleUnit}
      onToggleUnits={onToggleUnits}
      offering={offering}
      publishedTemplates={publishedTemplates}
      secondaryScopePersonNames={secondaryScopePersonNames}
      onAssignPersonTemplate={onAssignPersonTemplate}
    />
  )

  if (layout === 'rail') {
    // 2026-08-06 — hierarchical tree, replacing the side-by-side
    // [Evaluatees | Template] rail split. Template is now the tree's own
    // header (TemplateHeaderRow: name/badge/meta/Preview/Remove) with
    // Evaluatees nested directly below it — grouped by template, not spread
    // across two columns.
    // Round 2 (2026-08-06, same day) — the border-l-2/pl-4 hierarchy rail
    // this used to draw is gone (Romit's call): once the whole expanded
    // panel (primary + Additional templates) sits on its own shared grey
    // card background, that rail read as a stray extra vertical line on top
    // of a boundary the card itself already draws. Reading order (header,
    // then Evaluatees, directly beneath) carries the hierarchy now.
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {template && (
            <TemplateHeaderRow
              template={template}
              isDefault={isDefault}
              criteria={criteria}
              mode={mode}
              onPreview={onPreview}
              onRemove={onRemove}
              secondaryBadges={secondaryBadges}
            />
          )}
          {zeroFaculty && (
            <p className="text-xs" style={{ color: 'var(--chip-destructive)' }}>
              <i className="fa-solid fa-triangle-exclamation me-1.5" aria-hidden="true" />
              No faculty assigned to this template yet — it would produce an empty evaluation, so it can&rsquo;t be
              included until a role is filled{onRemove && <> or you remove it</>}.
            </p>
          )}
          {consequenceCard}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            Evaluatees
            {/* Gate 2 fix (ds-conformance-reviewer + state-review, both
                independently flagged this): the trigger was an aria-hidden
                <i> with no tabIndex — mouse-hover only, unreachable by
                keyboard (WCAG 1.4.13). Same tabIndex+focus-ring wrapper
                TemplateChip already uses in this file. */}
            <Tip label="Click a person or course material to include or exclude them from this push." side="top">
              <span tabIndex={0} className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
                <i className="fa-light fa-circle-info" aria-hidden="true" style={{ fontSize: 11 }} />
              </span>
            </Tip>
          </span>
          {evaluateeRosterEl}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={layout === 'grid' ? 'grid gap-6 md:grid-cols-2 items-start' : 'flex flex-col gap-6'}>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Template</span>
          {templatePicker}
          {consequenceCard}
          {metadataCaption}
        </div>

        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            Evaluatees
            {/* Gate 2 fix (ds-conformance-reviewer + state-review, both
                independently flagged this): the trigger was an aria-hidden
                <i> with no tabIndex — mouse-hover only, unreachable by
                keyboard (WCAG 1.4.13). Same tabIndex+focus-ring wrapper
                TemplateChip already uses in this file. */}
            <Tip label="Click a person or course material to include or exclude them from this push." side="top">
              <span tabIndex={0} className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
                <i className="fa-light fa-circle-info" aria-hidden="true" style={{ fontSize: 11 }} />
              </span>
            </Tip>
          </span>
          {evaluateeRosterEl}
        </div>
      </div>
    </div>
  )
}

export function StepSurveyInstances({
  selectedOfferings, instances, publishedTemplates,
  templateAssignments, defaultAssignments, onTemplateChange, onResetDefaults,
  pendingReassign, onResolveReassign, onCancelReassign,
  secondaryTemplateAssignments, secondaryInstances, secondaryDedupedLabels, onAddSecondaryTemplate, onSecondaryTemplateChange, onAssignPersonTemplate, onRemoveSecondary,
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
  // 2026-08-06 — the "template updated since Draft was saved" notice
  // (ST-02 Draft/Scheduled resume) previously lived only in the top
  // LocalBanner; Romit asked for it in the Action column too, so it can't
  // be missed scrolling past this one row. Same source array, just indexed
  // per offering for O(1) row lookup.
  const templateDriftByOffering = useMemo(() => {
    const m = new Map<string, TemplateDriftNotice>()
    for (const n of templateDriftNotices ?? []) if (n.kind === 'updated') m.set(n.offeringId, n)
    return m
  }, [templateDriftNotices])

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

  // Search + filter — the REAL DataTable infrastructure (useTableState +
  // DataTableToolbar + TablePropertiesDrawer), the same machinery
  // step-scope-courses.tsx uses, not a hand-rolled ToggleGroup/Input pair
  // (Romit's call — the DataTable component itself can't render this step's
  // per-row accordion panel, but its search/filter LAYER doesn't depend on
  // that, so it's reused as-is rather than reinvented). Narrows only which
  // rows render below; every count, gate, and the Continue button still
  // read the full `courses` list — filtering is a triage aid, never a way
  // to accidentally hide a course from the push itself.
  const courseTableRows = useMemo<StepCourseRow[]>(() => courses.map(o => {
    const { code, name } = splitLabel(o)
    const g = gatesByOffering.get(o.id)!
    const statusFilter: StepCourseRow['statusFilter'] =
      g.reasons.length > 0 ? 'blocked' : g.gaps.length > 0 ? 'attention' : 'ready'
    return { id: o.id, code, name, statusFilter, offering: o }
  }), [courses, gatesByOffering])
  const courseTableColumns = useMemo<ColumnDef<StepCourseRow>[]>(() => [
    {
      key: 'statusFilter', label: 'Status',
      filter: {
        type: 'select', icon: 'fa-circle-dot',
        options: [
          { value: 'ready', label: 'Ready' },
          { value: 'attention', label: 'Needs attention' },
          { value: 'blocked', label: 'Blocked' },
        ],
      },
    },
  ], [])
  const courseTableState = useTableState<StepCourseRow>(courseTableRows, courseTableColumns)
  const visibleCourses = useMemo(() => courseTableState.rows.map(r => r.offering), [courseTableState.rows])
  const blockedCount = courses.filter(o => gatesByOffering.get(o.id)!.reasons.length > 0).length

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
  // Each extra template's own gate, computed exactly like the primary (same
  // reasons logic) from its own instance plan — one array per offering,
  // aligned by index with secondaryTemplateAssignments[offeringId]. Moved
  // above `openRows` (was declared after it) so its seed effect below can
  // read it on first render.
  const secondaryGatesByOffering = useMemo(() => {
    const m = new Map<string, CourseGate[]>()
    for (const [offeringId, entries] of Object.entries(secondaryTemplateAssignments)) {
      const itemsByEntry = secondaryInstances[offeringId] ?? []
      m.set(offeringId, entries.map((entry, i) => {
        const items = itemsByEntry[i] ?? []
        const fresh = items.filter(x => x.status === 'new')
        const gaps = items.filter(x => x.status === 'gap')
        const dups = items.filter(x => x.status === 'duplicate')
        const reasons: BlockReason[] = []
        if (!entry.templateId) reasons.push('no-template')
        else if (fresh.length === 0 && gaps.length === 0 && dups.length > 0) reasons.push('overlap')
        // ST-02 Blocks, 4th bullet — was missing here entirely (only ever
        // computed for the primary row's gatesByOffering above), so an extra
        // template whose only role(s) resolve to zero faculty rendered as an
        // ordinary informational gap instead of the hard "No faculty
        // assigned" block the spec requires.
        else if (fresh.length === 0 && gaps.length > 0 && dups.length === 0) reasons.push('unstaffed')
        return { reasons, fresh, gaps, dups }
      }))
    }
    return m
  }, [secondaryTemplateAssignments, secondaryInstances])

  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(
    () => new Set(
      [...gatesByOffering.entries()]
        .filter(([id, g]) =>
          g.dups.length > 0
          || g.fresh.some(i => i.lateAddedRelativeTo)
          // "Also evaluating" entries now render INSIDE the primary row's
          // own collapse (Romit's call — stacked with "Add another
          // template" instead of always-visible flat siblings), so a
          // blocked/unstaffed extra template needs the PRIMARY row seeded
          // open too, or it'd be invisible until someone thought to expand
          // a course that otherwise looks fully Ready.
          || (secondaryGatesByOffering.get(id) ?? []).some(sg => sg.reasons.length > 0))
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
  const stageTemplate = (key: string, templateId: string) =>
    setPendingTemplate(prev => ({ ...prev, [key]: templateId }))
  const clearStagedTemplate = (key: string) =>
    setPendingTemplate(prev => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })

  const toCreate = instances.filter(i => i.status !== 'gap' && included.has(i.key)).length
  const missingTemplate = courses.filter(o => gatesByOffering.get(o.id)!.reasons.includes('no-template')).length
  const conflictedCourseCount = courses.filter(o => gatesByOffering.get(o.id)!.reasons.includes('overlap')).length
  // ST-02 Blocks: a course where every unit is deselected, or the assigned
  // template has only unstaffed roles, or nothing on it applies to this
  // delivery mode — none of these has ever gated Continue (see canContinue
  // below); the course was just silently dropped from the push with zero
  // acknowledgement anywhere downstream (confirmed live: Review's "Survey
  // design" card shows a clean "Ready" badge with no trace of the course).
  const otherBlockedCount = courses.filter(o => {
    const r = gatesByOffering.get(o.id)!.reasons
    return r.includes('unstaffed') || r.includes('no-units') || r.includes('none-selected')
  }).length
  const templatesInUse = new Set(courses.map(o => templateIdFor(o)).filter(Boolean))
  // Reset-to-defaults impact (Resend "itemize what changes" model) — courses
  // whose EFFECTIVE template differs from their type default.
  const resetChangedCount = courses.filter(o => {
    const def = defaultAssignments[o.id]
    return !!def && templateIdFor(o) !== def
  }).length

  // 2026-08-05: a locked role on one course used to disable Continue for
  // the ENTIRE multi-course push — even courses with zero relationship to
  // the conflict, and even the SAME course's own unrelated, perfectly
  // pushable roles (Coordinator, Course material). A dup instance can never
  // become `included` (no checkbox exists for it — see the Blocked zone),
  // so `toCreate` already excludes it naturally; nothing further needs to
  // gate on a PARTIALLY-blocked course here — that reasoning still holds.
  //
  // 2026-08-05 (audit fix): it over-corrected into never gating on ANY
  // course-level reason. `reasons.length > 0` (conflictedCourseCount +
  // otherBlockedCount, i.e. `blockedCount`) only ever fires when the course
  // contributes NOTHING pushable at all (overlap-with-no-other-content,
  // unstaffed, no-units, or every unit deselected) — ST-02's Blocks list
  // requires the Admin to resolve or remove that course, not have it
  // silently vanish from the batch while Continue stays enabled.
  const canContinue = missingTemplate === 0 && blockedCount === 0 && toCreate > 0
  const continueDisabledReason = missingTemplate > 0
    ? `${missingTemplate} course${missingTemplate !== 1 ? 's need' : ' needs'} a template before continuing.`
    : conflictedCourseCount > 0
      ? `${conflictedCourseCount} course${conflictedCourseCount !== 1 ? 's are' : ' is'} blocked by an existing survey. Resolve, archive, or remove ${conflictedCourseCount !== 1 ? 'them' : 'it'} before continuing.`
      : otherBlockedCount > 0
        ? `${otherBlockedCount} course${otherBlockedCount !== 1 ? 's need' : ' needs'} attention before continuing.`
        : toCreate === 0
          ? 'Nothing is selected to evaluate yet.'
          : ''

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

          {/* ST-02 Auto Update — ONE flag for every course row, at the top of
              the step (never per-row). Flipping it does nothing by itself: it
              only decides how units the rows haven't seen before arrive on
              the next manual Refresh. State lives in push/page.tsx; Phase 3
              persists it with Save-as-Draft.
              2026-08-06 (Romit's catch) — moved above the filter toolbar: the
              toolbar filters/searches the table directly below it, and with
              Auto Update sitting between them the toolbar read as
              disconnected from the table it acts on. */}
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

          {/* Toolbar + table wrapped tight together (Romit's catch,
              2026-08-06 round 5) — gap-5 on the outer flex-col (heading /
              Auto Update / this pair) is right for separating unrelated
              sections, but the SAME 20px between the toolbar and the table
              it filters read as if they were two more unrelated sections
              instead of one control belonging to the grid right below it.
              This inner gap-2 keeps that pair visually coupled without
              touching the outer rhythm. */}
          <div className="flex flex-col gap-2">
            {/* Real DataTable search + filter (DataTableToolbar +
                TablePropertiesDrawer, same as step-scope-courses.tsx) — see
                the courseTableState/courseTableRows/courseTableColumns setup
                above. Narrows only which rows render below; every count,
                gate, and the Continue button still read the full `courses`
                list — filtering is a triage aid, never a way to accidentally
                hide a course from the push itself. Directly above the table
                it filters (see the Auto Update comment above). */}
            <DataTableToolbar
              state={courseTableState}
              columns={courseTableColumns}
              searchAriaLabel="Search courses by code or name"
              edgeInset={false}
              toolbarSlot={state => (
                <>
                  <Tip label="Table properties" side="bottom">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Table properties"
                      aria-expanded={state.sheetOpen}
                      onClick={() => state.setSheetOpen(o => !o)}
                    >
                      <i className="fa-light fa-sliders text-[13px]" aria-hidden="true" />
                    </Button>
                  </Tip>
                  <TablePropertiesDrawer
                    open={state.sheetOpen}
                    onOpenChange={state.setSheetOpen}
                    activeFilters={state.activeFilters}
                    onAddFilter={state.addFilter}
                    onUpdateFilter={state.updateFilter}
                    onRemoveFilter={state.removeFilter}
                    getFilterConnector={state.getConnector}
                    onToggleFilterConnector={state.toggleConnector}
                    filterFields={courseTableColumns
                      .filter(c => c.filter)
                      .map(c => ({
                        key: c.key,
                        label: c.label,
                        icon: c.filter!.icon ?? 'fa-filter',
                        type: c.filter!.type,
                        operators: c.filter!.operators ?? ['is', 'is_not'],
                        options: c.filter!.options,
                      }))}
                    totalRows={courseTableRows.length}
                    filteredRows={state.rows.length}
                    sortRules={state.sortRules}
                    onSortRulesChange={state.setSortRules}
                    onAddSortRule={state.addSortRule}
                    onRemoveSortRule={state.removeSortRule}
                    onToggleSortDir={state.toggleSortDir}
                    colOrder={state.colOrder}
                    onColOrderChange={state.setColOrder}
                    hiddenCols={state.hiddenCols}
                    onToggleColVisibility={state.toggleColVisibility}
                    onMoveCol={state.moveCol}
                    resolveColumnLabel={key => courseTableColumns.find(c => c.key === key)?.label ?? key}
                    orderableKeys={[]}
                  />
                </>
              )}
            />

            {/* ONE flat table — course-code order, never reordered by
                status. A row is one line by default; every row's chevron
                expands to its Template and Evaluatees detail. */}
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

            {visibleCourses.length === 0 && (
              <div className="py-6">
                <EmptyHint
                  heading="No courses match your search or filter"
                  sub="Clear the search or switch the filter back to All to see every course in this push."
                />
              </div>
            )}

            {visibleCourses.map(o => {
                const { code, name } = splitLabel(o)
                const mode = deliveryModeOf(o)
                const gate = gatesByOffering.get(o.id)!
                const { fresh } = gate
                const freshKeys = fresh.map(i => i.key)
                // S4 — in Prism, explicitly excluded from this push (Auto
                // Update off): rendered muted in the Evaluatees cell instead
                // of silently disappearing.
                const deselectedFresh = fresh.filter(i => unitSelections[i.key] === 'deselected')
                const inCount = freshKeys.filter(k => included.has(k)).length
                const templateId = templateIdFor(o)
                const template = publishedTemplates.find(t => t.id === templateId) ?? null
                const criteria = template ? templateCriteria(template) : []
                const secondaryEntries = secondaryTemplateAssignments[o.id] ?? []
                const secondaryEntryTemplateIds = new Set(secondaryEntries.map(e => e.templateId))
                // Flattened across every extra-template entry — the primary
                // roster's "Use a different template" card only needs to
                // know a person is ALREADY claimed by some entry, not which.
                const secondaryScopePersonNames = secondaryEntries.flatMap(e => e.scopePersonNames ?? [])
                const addableTemplates = publishedTemplates.filter(
                  t => t.id !== templateId && !secondaryEntryTemplateIds.has(t.id),
                )
                const isOpen = openRows.has(o.id)
                const driftNotice = templateDriftByOffering.get(o.id)
                return (
                  <Fragment key={o.id}>
                  <Collapsible
                    open={isOpen}
                    onOpenChange={() => toggleRow(o.id)}
                    className="border-b border-border last:border-b-0"
                  >
                    {/* Open-row accent — 2026-08-06, Romit's call: nothing
                        distinguished an open row from a closed one besides
                        the chevron rotating, which made it hard to tell
                        which row a scrolled-past panel belonged to in a long
                        list. Left rule reuses the tree's own hierarchy
                        vocabulary (CourseDetailBody's border-l-2). */}
                    <div
                      className="grid items-center gap-3 ps-3 pe-3 py-2 border-l-2"
                      // dt-row-selected (the canonical DataTable's own open/selected-row
                      // token, component-consistency.md) — not --accent: in the active
                      // theme-prism theme --accent is a brand-hue-343 rose tint, the same
                      // family as the KC/AP persona avatar colors and the status badges
                      // sitting on top of it, so the row wash flattened their contrast
                      // against each other (Romit's 2026-08-06 live catch). dt-row-selected
                      // is a fixed neutral gray in every theme, same reasoning RowStatus's
                      // header comment already gives for avoiding brand-hue tokens on status.
                      style={{ gridTemplateColumns: TABLE_GRID, minHeight: 44, borderLeftColor: isOpen ? 'var(--primary)' : 'transparent', background: isOpen ? 'var(--dt-row-selected)' : undefined }}
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

                      <span className="min-w-0">
                        <TemplateDropdown
                          templateId={templateId}
                          code={code}
                          publishedTemplates={publishedTemplates}
                          onChange={tid => onTemplateChange(o.id, tid)}
                        />
                      </span>

                      <span className="min-w-0"><EvaluateeChipCluster code={code} gate={gate} included={included} /></span>

                      <span className="min-w-0"><RowStatus gate={gate} /></span>

                      <span className="min-w-0">
                        <RowAction gate={gate} driftNotice={driftNotice} onAssign={() => openRow(o.id)} />
                      </span>
                    </div>

                    <CollapsibleContent>
                      {/* 2026-08-06 round 3 (Romit's catch on round 2) — this
                          is the ACCORDION's own background continuing down
                          from the header, not an inset card floating inside
                          it: same dt-row-selected grey, same ps-3/pe-3 the
                          header row uses, no margin between them and no
                          rounded corners of its own — so the open header and
                          its content read as one unbroken grey surface, the
                          same way the header alone reads today when a row is
                          open. (Round 2's mx-4/rounded-md/p-4 version was
                          wrong — that's card styling, and this was never
                          meant to be a separate card floating below the
                          header.) */}
                      <div className="ps-3 pe-3 pt-3 pb-4 flex flex-col gap-4" style={{ background: 'var(--dt-row-selected)' }}>
                        {/* 2026-08-06 round 4 (Romit's call) — the primary
                            template is its own white card floating on the
                            grey accordion canvas, not flowing flush with it.
                            Every "Additional templates" entry below gets the
                            same treatment (see that loop) — one visual
                            language, card vs. canvas, for every template on
                            this course. */}
                        <div className="rounded-md p-4" style={{ background: 'var(--card)' }}>
                          <CourseDetailBody
                            layout="rail"
                            offering={o}
                            code={code}
                            mode={mode}
                            gate={gate}
                            template={template}
                            criteria={criteria}
                            templateId={templateId}
                            stagedTemplateId={pendingTemplate[o.id]}
                            defaultTemplateId={defaultAssignments[o.id]}
                            publishedTemplates={publishedTemplates}
                            onStageTemplate={stageTemplate}
                            onCommitStage={staged => { onTemplateChange(o.id, staged.id); clearStagedTemplate(o.id) }}
                            onClearStage={() => clearStagedTemplate(o.id)}
                            onCreateTemplate={() => { setNotice(null); setSubView('create') }}
                            onPreview={setPreviewTemplate}
                            included={included}
                            deselectedFresh={deselectedFresh}
                            onToggleUnit={flip}
                            onToggleUnits={setMany}
                            secondaryScopePersonNames={secondaryScopePersonNames}
                            onAssignPersonTemplate={onAssignPersonTemplate}
                          />
                        </div>
                        {/* Romit's 2026-08-06 call: this used to render as a
                            bare sibling row below every "Also evaluating"
                            entry, at the table's own outer indentation —
                            outside the accordion it visually belonged to.
                            Nested here, on the same grey canvas as the
                            primary template's card above, it reads as one
                            continuous thread running from the evaluation
                            down through "add one more" instead of two
                            misaligned pieces. No divider needed — the gap
                            between this section and the card above is
                            spacing on the shared canvas, not a boundary
                            between two surfaces. */}
                        <div>
                          {/* "Additional templates" — same label style as
                              "Evaluatees" above (Romit's call): a bare "Add
                              another template" card sitting directly below
                              the roster read as one more roster item, not a
                              different kind of control for a different
                              concept (a whole second, independently-
                              toggleable survey). The label names that
                              boundary explicitly instead of relying on shape
                              alone to carry it. */}
                          <span className="text-xs font-medium text-muted-foreground">Additional templates</span>
                          {/* Already-added entries stack FIRST, "Add another
                              template" comes LAST as one more item in the
                              same stack (Romit's call) — was the other way
                              around, with entries rendered as always-visible
                              siblings entirely outside this course's own
                              collapse (no boundary between them, and no
                              spacing telling them apart from the NEXT
                              course's row). Both now live in this one
                              flex-col with a consistent gap-2, and both are
                              gated on the SAME collapse as the roster above
                              — see the openRows seed update, which now also
                              opens a course whose extra template is blocked/
                              unstaffed so that state is never hidden by
                              default. */}
                          <div className="mt-2 flex flex-col gap-2">
                            {secondaryEntries.map((entry, entryIndex) => {
                              const sGate = secondaryGatesByOffering.get(o.id)?.[entryIndex]
                                ?? { reasons: [], fresh: [], gaps: [], dups: [] }
                              const sTemplate = publishedTemplates.find(t => t.id === entry.templateId) ?? null
                              // Keyed by templateId, not entryIndex — with 2+
                              // extra entries, removing one used to shift
                              // every LATER entry's index down a slot, which
                              // silently reassigned its openRows/
                              // pendingTemplate state (and its React key) to
                              // whatever the entry ahead of it had been
                              // using. A surviving entry could pop open/
                              // closed or lose a staged pick on an unrelated
                              // removal. templateId is stable across
                              // removals since addableTemplates already
                              // guarantees no two entries on one course
                              // share one.
                              const secondaryKey = `${o.id}::secondary::${entry.templateId}`
                              const dedupedLabels = secondaryDedupedLabels[o.id]?.[entryIndex] ?? []
                              // This entry's every criterion was already
                              // claimed by an earlier template on this
                              // course (primary or an earlier extra) —
                              // common with the real template catalog, not a
                              // rare edge case (see secondaryDedupedLabels'
                              // declaration). Nothing new to evaluate, so
                              // the row says so instead of showing a bare
                              // "–" with no explanation.
                              const fullyDeduped = sGate.fresh.length === 0 && sGate.gaps.length === 0
                                && sGate.dups.length === 0 && dedupedLabels.length > 0
                              // 2026-08-06 — one header, not a separate grey
                              // toolbar sitting above TemplateHeaderRow's own
                              // name/Preview/Remove line (Romit's call: the
                              // two-header layout read as a different kind of
                              // control than the primary template's one clean
                              // row, which has no collapse of its own either
                              // — every extra template's full detail is
                              // always visible now, same as the primary's).
                              // "Also evaluating" + live status fold into
                              // TemplateHeaderRow's own badge slot.
                              // Round 2 (same day) — the inline template-
                              // switch dropdown that used to sit in this
                              // header is gone (Romit's call): to change an
                              // extra template's own pick, Remove it and
                              // "Add another template" — one decision path,
                              // not two ways to do the same thing.
                              const secondaryBadges = (
                                <>
                                  <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                                    Also evaluating
                                  </Badge>
                                  {!fullyDeduped && <RowStatus gate={sGate} />}
                                </>
                              )
                              return (
                                // 2026-08-06 round 4 (Romit's call) — same
                                // white-card-on-grey-canvas treatment as the
                                // primary template above: one card per extra
                                // template, no vertical rail, no dropdown.
                                <div key={entry.templateId} className="rounded-md p-4" style={{ background: 'var(--card)' }}>
                                  {fullyDeduped ? (
                                    // No roster to render (everything this
                                    // entry would cover is already claimed)
                                    // — same header as the normal case below
                                    // (TemplateHeaderRow), so Preview/Remove
                                    // are never missing just because this
                                    // particular entry has nothing new to
                                    // evaluate.
                                    <div className="flex flex-col gap-3">
                                      {sTemplate && (
                                        <TemplateHeaderRow
                                          template={sTemplate}
                                          isDefault={false}
                                          criteria={templateCriteria(sTemplate)}
                                          mode={mode}
                                          onPreview={setPreviewTemplate}
                                          onRemove={() => onRemoveSecondary(o.id, entryIndex)}
                                          secondaryBadges={secondaryBadges}
                                        />
                                      )}
                                      {/* 2026-08-06 round 4 (Romit's catch) —
                                          var(--muted) carries a faint pink
                                          cast in the Prism theme (oklch hue
                                          343, unlike dt-row-selected's
                                          near-zero-chroma neutral gray), so a
                                          plain informational aside rendered
                                          with a warm/rosy tint instead of
                                          reading as neutral. dt-row-selected
                                          instead — same family this file
                                          already uses for "this is neutral,
                                          not a status color" surfaces. */}
                                      <div className="flex items-start gap-2 rounded-md border border-border p-2.5" style={{ background: 'var(--dt-row-selected)' }}>
                                        <i className="fa-light fa-circle-info text-xs text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                                        <span className="text-xs text-muted-foreground">
                                          {listFmt(dedupedLabels)} {dedupedLabels.length === 1 ? 'is' : 'are'} already evaluated by
                                          {' '}another template on {code} — not repeated here.
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <CourseDetailBody
                                      layout="rail"
                                      offering={o}
                                      code={code}
                                      mode={mode}
                                      gate={sGate}
                                      template={sTemplate}
                                      criteria={sTemplate ? templateCriteria(sTemplate) : []}
                                      templateId={entry.templateId}
                                      stagedTemplateId={pendingTemplate[secondaryKey]}
                                      defaultTemplateId={undefined}
                                      publishedTemplates={publishedTemplates}
                                      onStageTemplate={(_offeringId, tid) => stageTemplate(secondaryKey, tid)}
                                      onCommitStage={staged => { onSecondaryTemplateChange(o.id, entryIndex, staged.id); clearStagedTemplate(secondaryKey) }}
                                      onClearStage={() => clearStagedTemplate(secondaryKey)}
                                      onCreateTemplate={() => { setNotice(null); setSubView('create') }}
                                      onPreview={setPreviewTemplate}
                                      included={included}
                                      deselectedFresh={sGate.fresh.filter(i => unitSelections[i.key] === 'deselected')}
                                      onToggleUnit={flip}
                                      onToggleUnits={setMany}
                                      onRemove={() => onRemoveSecondary(o.id, entryIndex)}
                                      secondaryBadges={secondaryBadges}
                                    />
                                  )}
                                </div>
                              )
                            })}
                            <AddTemplateRow
                              code={code}
                              templates={addableTemplates}
                              onAdd={addedTemplateId => onAddSecondaryTemplate(o.id, addedTemplateId)}
                            />
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  </Fragment>
                )
              })}
           </CardContent>
          </Card>
          </div>
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
          {otherBlockedCount > 0 && (
            <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--chip-4)' }}>
              {otherBlockedCount} course{otherBlockedCount !== 1 ? 's need' : ' needs'} attention
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
