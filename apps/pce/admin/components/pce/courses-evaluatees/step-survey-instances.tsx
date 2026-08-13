'use client'

// Wizard step shell — hand-roll justified (no DS step-frame organism), see
// docs/governance/ds-adoption.md §PCE. Composes DS Card/AvatarGroup/Command/
// FloatingSheetPanel/ToggleSwitch/Checkbox/Select/Button/Badge/Tip/Dialog/
// AlertDialog/LocalBanner + ListHubStatusBadge/StoryStatusBadgeOS +
// DataTableToolbar/TablePropertiesDrawer (real DataTable search/filter).
//
// SHEET REVISION (2026-08-12) — the per-row accordion (below) is replaced by
// a single FloatingSheetPanel: clicking a row's chevron opens its Template +
// Evaluatees detail in a panel that slides in from the right, instead of
// expanding inline. A sheet can only show one row at a time, so the
// accordion's "seed every flagged row open on load" behavior is gone —
// flagged rows stay visually marked (RowStatus badge, gap/late-added chips
// in Evaluatees) and are opened one at a time. Everything below this note,
// through ROUND 2, documents the accordion this replaced; kept for the
// record since the row-detail CONTENT (card roster, staged template
// switches, etc.) is unchanged — only its container moved.
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
import {
  AvatarGroup, AvatarInitials,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Button, Checkbox, CheckboxLabel, LocalBanner, ToggleSwitch, Badge, Tip,
  Card, CardContent,
  FloatingSheetPanel, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelBody,
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
  /** Confirms the replace — the dialog's only outcome now (2026-08-12: the
   *  reviewer reconfirmed "one template, one course... there is no concept
   *  of two templates with the same survey", killing this dialog's former
   *  "Keep both" choice, the same reasoning that already removed the
   *  general "+ Add another template" affordance on 2026-08-11). */
  onResolveReassign: () => void
  /** Dismiss without applying either choice — Escape, outside click, or the
   *  Cancel button all route here. Idempotent (just clears the pending
   *  state), safe to fire redundantly alongside onResolveReassign since
   *  Radix's AlertDialogAction also closes the dialog on click. */
  onCancelReassign: () => void
  /** Every EXTRA template assigned to an offering beyond its primary — one
   *  array per offering, in add-order (add-order also decides which
   *  template "wins" a criterion two entries both list; see page.tsx's
   *  secondaryInstancePlan). Originates from S2's "Create new survey"
   *  choice (still the only entry point — 2026-08-11: the general "+ Add
   *  another template" affordance is gone, spec now says one template per
   *  course, §5.2) or the person-grain late-added-co-instructor exception.
   *  `scopePersonNames` absent = the entry covers the whole role/aspect;
   *  present (2026-08-05) = it covers only those named people. */
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
  /** Changes the template of the extra-template entry at `index` (its
   *  position in that offering's array) — the "Change" action on an
   *  already-added secondary row. */
  onSecondaryTemplateChange: (offeringId: string, index: number, templateId: string) => void
  /** Person-grain entry point (2026-08-05), retired 2026-08-12 along with
   *  its own UI trigger (see EvaluateeRoster's offering/publishedTemplates
   *  doc comment) — accepted but no longer called from this file. */
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
// 2026-08-12: Evaluatees switched from an avatar cluster to role-label text
// ("Course · Instructor · Coordinator") — unlike fixed-size avatars, text
// DOES benefit from extra room, so the track widened from 140px to fit the
// common 3-role case without truncating on every row.
const TABLE_GRID = `24px minmax(160px,1.1fr) 76px minmax(210px,1.3fr) 200px 88px minmax(160px,1fr) 24px`

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
 *  A late-added co-instructor (SurveyInstance.lateAddedRelativeTo) used to
 *  get its own "Review {role}" callout here (2026-08-05) — retired
 *  2026-08-12 per the reviewer's own words in that morning's "Survey design
 *  and review" call (Granola `d6d6e961`): "when I refresh there's a new
 *  instructor getting added then automatically... I don't need to show
 *  them differently" — confirmed. A late-added instructor is now just
 *  another member of its role group, same as anyone else; nothing left to
 *  call out here. */
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
  return i.roleLabel && i.scope !== 'course' ? `${i.roleLabel} · ${name}` : name
}

/** Per-role glyph — same FA kit as everywhere else in this app (fa-light),
 *  one icon per label from CRITERION_BY_TYPE's full role set (pce-course-
 *  readiness.ts) so a role reads as itself at a glance instead of every
 *  role sharing one generic person icon. Falls back to fa-user-group for
 *  any label not in the map (defensive — every current template role IS
 *  mapped, but a future template could introduce a new one). */
const ROLE_ICON: Record<string, string> = {
  Instructor: 'fa-chalkboard-user',
  'Lab Instructor': 'fa-flask',
  'Lab Assistant': 'fa-flask',
  Coordinator: 'fa-user-tie',
  'Clinical Coordinator': 'fa-hospital-user',
  'Site Coordinator': 'fa-location-dot',
  Preceptor: 'fa-user-doctor',
  'Placement Faculty': 'fa-briefcase-medical',
  'Course Director': 'fa-user-graduate',
  'Academic Advisor': 'fa-user-graduate',
  'Teaching Assistant': 'fa-user-group',
  'Guest Lecturer': 'fa-microphone',
}
function roleIcon(roleLabel: string): string {
  return ROLE_ICON[roleLabel] ?? 'fa-user-group'
}

function EvaluateeAvatar({ i, className }: { i: SurveyInstance; className?: string }) {
  return (
    <span className={cn('rounded-full flex items-center justify-center border border-border bg-background shrink-0', className)}>
      <i
        className={cn('fa-light text-[10px] text-muted-foreground', i.scope === 'course' ? 'fa-book-open' : roleIcon(i.roleLabel))}
        aria-hidden="true"
      />
    </span>
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

/** Role-label chips (DS `Badge`, up to 2 + "+N" overflow) instead of running
 *  text — Romit's 2026-08-12 follow-up call: the plain-text version (itself
 *  a follow-up to dropping avatars, itself a follow-up to the 2026-08-06
 *  decision to stop showing faculty identity here) had no visual boundary
 *  between roles and no color signal for "needs attention", so it didn't
 *  scan any faster than the icons it replaced. Chips are the DS's own
 *  cataloged pattern for "several short categorical values in one cell"
 *  (`PillCell`/`TagListCell`, `columns-showcase.tsx` #9) and the pattern
 *  Juicebox/Dovetail/Notion all converge on for the same job. Course
 *  material is dropped from the collapsed chips — the Type column already
 *  implies it and it's rarely toggled off — but stays in the sr-only
 *  summary, the full tooltip, and the expanded panel below. Gap gets its
 *  own dashed amber chip (a first-class status signal, not blended into a
 *  text run); late-added rides as a small icon inside its role's chip.
 *
 *  REOPENED 2026-08-13 (Granola `7aeae56b`, Vishal, raw transcript: "if we
 *  are showing faculty icons, it's easier to skim through... I need to go
 *  and look at the details of every single value" — followed by "how about
 *  we show instructor and next to that we show the faculty instructors").
 *  Explored as three variants at /compare/push-step2-evaluatee-identity
 *  (A role-only = what shipped here before this change, B names-on-hover,
 *  C names-inline); Romit picked B. Each role chip now carries a
 *  non-overlapping `AvatarGroup` (never a `-space-x` stack — that's a
 *  banned pattern, see `AvatarGroup`'s own doc comment) of hoverable
 *  initials beside it, reusing the exact same avatar treatment
 *  EvaluateeRoster's own expanded-panel caption already used for 2+ people
 *  — this only brings that same B-shaped answer up to the COLLAPSED row so
 *  "who" is visible without opening it. Doesn't reverse Monil's role-GRAIN
 *  point (the chip still reads as one role, not a person list) — narrows it
 *  to "don't show WHO" specifically, which is what Vishal reopened. */
function EvaluateeChipCluster({ code, gate, included }: { code: string; gate: CourseGate; included: ReadonlySet<string> }) {
  const inUnits = gate.fresh.filter(i => included.has(i.key))
  const gapCount = gate.gaps.length
  const summary = inUnits.length > 0
    ? `Evaluatees for ${code}: ${inUnits.map(evaluateeLabel).join(', ')}.`
    : `Evaluatees for ${code}: none included.`
  if (inUnits.length === 0 && gapCount === 0) {
    return <span className="text-xs text-muted-foreground">&ndash;</span>
  }
  // Late-added instances (SurveyInstance.lateAddedRelativeTo) used to carry
  // their own swap-icon/tooltip variant here — retired 2026-08-12, same
  // Granola-confirmed decision as EvaluateeRoster's own advisory card and
  // RowAction's "Review {role}" button: a newly-added instructor is just
  // another member of its role group now, indistinguishable from anyone
  // else in this cluster.
  const groups: { key: string; label: string; count: number; instances: SurveyInstance[] }[] = []
  for (const i of inUnits) {
    if (i.scope === 'course') continue
    const existing = groups.find(g => g.key === i.roleLabel)
    if (existing) { existing.count++; existing.instances.push(i) }
    else groups.push({ key: i.roleLabel, label: i.roleLabel, count: 1, instances: [i] })
  }
  // A template that only evaluates course material has no role chip —
  // fall back to naming it so the cell isn't blank despite an active
  // evaluatee.
  if (groups.length === 0 && gapCount === 0) {
    groups.push({ key: 'course', label: 'Course material', count: 1, instances: [] })
  }
  const shown = groups.slice(0, 2)
  const extra = groups.length - shown.length
  // All-gap row (every role unstaffed, no ready roles to show) — now that
  // the gap pill itself is gone, there's nothing left to render here.
  // Status's own "Gap" badge + Action's "Assign N roles" already carry
  // this; an empty-looking cell would read as broken, so fall back to the
  // same plain dash the fully-empty case above already uses.
  if (shown.length === 0) {
    return <span className="text-xs text-muted-foreground">&ndash;</span>
  }
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {/* Same sr-only-summary + per-segment Tip split as the prior
          versions: a screen reader gets the full picture in one pass here,
          the Tips below add focus/hover detail without being required. */}
      <span className="sr-only">
        {summary}
        {gapCount > 0 ? ` ${gapCount} role${gapCount !== 1 ? 's' : ''} without a person.` : ''}
      </span>
      {shown.map(g => (
        <Fragment key={g.key}>
          <Tip label={g.label} side="top">
            <Badge
              tabIndex={0}
              variant="outline"
              className="h-6 gap-1 border-border bg-background px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <i className={cn('fa-light text-[10px]', g.key === 'course' ? 'fa-book-open' : roleIcon(g.label))} aria-hidden="true" />
              {g.label}{g.count > 1 ? ` ×${g.count}` : ''}
            </Badge>
          </Tip>
          {g.key !== 'course' && (
            <AvatarGroup className="gap-0.5" role="group" aria-label={`${g.label}: ${g.instances.map(i => i.personName).join(', ')}`}>
              {g.instances.map(i => (
                <Tip key={i.key} label={i.personName ?? ''} side="top">
                  <span tabIndex={0} className="inline-flex shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
                    <AvatarInitials initials={initialsOf(i.personName!)} size="sm" className="size-6" />
                  </span>
                </Tip>
              ))}
            </AvatarGroup>
          )}
        </Fragment>
      ))}
      {extra > 0 && (
        <Tip label={groups.slice(2).map(g => (g.count > 1 ? `${g.label} ×${g.count}` : g.label)).join(', ')} side="top">
          <Badge tabIndex={0} variant="secondary" className="h-6 px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
            +{extra}
          </Badge>
        </Tip>
      )}
      {/* Gap pill removed (Romit's 2026-08-12 call) — Status already carries
          this via its own "Gap" badge + Tip (same gate.gaps role names),
          and Action already carries the fix ("Assign N roles"). A third
          repeat of the same fact in Evaluatees added a column-cluttering
          pill without saying anything new. */}
    </span>
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
  /** Person-grain toggle — one key at a time. Was accepted-but-unused here
   *  (2026-08-05 through 2026-08-12: Monil's role-grain-only call below
   *  meant nothing called it) until 2026-08-13, when every non-course role
   *  got its own per-person Checkbox row, one per faculty member regardless
   *  of headcount (Granola `7aeae56b`, Vishal: "how I can add or remove" —
   *  Romit picked the variant that answers this at /compare/push-step2-
   *  evaluatee-identity, which used a checkbox row for every person, not
   *  just roles with 2+). Already fully wired to the real sticky selection
   *  state (StepSurveyInstances' `flip` → onUnitSelectionChange) — this
   *  file just never called it. */
  onToggleUnit: (key: string) => void
  /** Role-level bulk toggle (2026-08-06 Course Eval sync up, Monil, raw
   *  transcript: "that toggle is not on a person, it's on a role... we
   *  will not show who the instructors are at this level"). Sets every key
   *  in a role group to the SAME state in one call. As of 2026-08-13, the
   *  ONLY caller left is course material — no person concept, so there's
   *  no "which of them" question a role-level toggle can't answer.
   *  Every other role uses `onToggleUnit` per person instead. */
  onToggleUnits: (keys: string[], on: boolean) => void
  /** Person-grain exception (2026-08-05) — no longer rendered here
   *  (2026-08-12: reviewer reconfirmed no aspect/faculty-level template,
   *  "not supporting that anytime in future" — the advisory row's "Use a
   *  different template" entry point let an admin do exactly that). Left
   *  as accepted-but-unused props rather than threading a removal through
   *  CourseDetailBody/page.tsx — the underlying secondaryTemplateAssignments
   *  machinery still serves the separate "+ Add another template"/"Keep
   *  both" course-level flow. */
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
  if (fresh.length === 0 && gaps.length === 0 && dups.length === 0) {
    return <span className="text-xs text-muted-foreground">&ndash;</span>
  }
  const deselectedKeys = new Set(deselectedFresh.map(i => i.key))

  // 2026-08-13 fix (Romit, live click-test against DPT-510 caught this):
  // the ONE real multi-instructor row in the fixture (co13 — Chen already
  // covered by a Live survey, Gomez still free) has a FRESH count of 1, not
  // 2 — Chen lives in `dups`, a completely separate list, so the new
  // per-person checklist below never fired for the exact row it exists to
  // demo. Folding each role's dups into its own group's TOTAL headcount
  // (not just `fresh`) fixes that: Chen now renders as a locked row
  // alongside Gomez's checkbox, inside the SAME Instructor card, instead of
  // in a detached list at the bottom with no visible connection to the role
  // it's blocking. `standaloneDups` (used by the bottom dups.map below)
  // excludes anything folded in here, so Chen isn't rendered twice.
  const dupsByRole = new Map<string, SurveyInstance[]>()
  for (const d of dups) {
    if (d.scope === 'course') continue
    const list = dupsByRole.get(d.roleLabel)
    if (list) list.push(d)
    else dupsByRole.set(d.roleLabel, [d])
  }

  // 2026-08-06 Course Eval sync up (Monil, raw transcript): "your end of
  // term evaluation has how many roles to be evaluated... course material
  // and instructor, only two... you tell the system that I only want to
  // evaluate course material and instructor... that toggle is not on a
  // person, it's on a role." Every plain-ready instance for the SAME role
  // (co-instructors, co-coordinators) collapses into ONE row — one toggle
  // for the whole role, faculty shown as a stacked avatar cluster instead
  // of "who the instructors are at this level." Course material has no
  // person concept, so it's never grouped with anything. Blocked rows below
  // keep their own per-person treatment (a real action a role-level toggle
  // can't represent — view the blocking survey). Late-added instances used
  // to split into their own "Advisory" group here (2026-08-05) — merged
  // back into `fresh` as of 2026-08-12: the reviewer confirmed a newly-added
  // instructor should show up "under that aspect" with nothing to
  // distinguish it, not its own card.
  const readyGroups: { key: string; roleLabel: string; scope: SurveyInstance['scope']; instances: SurveyInstance[] }[] = []
  for (const i of fresh) {
    const groupKey = i.scope === 'course' ? i.key : i.roleLabel
    const existing = readyGroups.find(g => g.key === groupKey)
    if (existing) existing.instances.push(i)
    else readyGroups.push({ key: groupKey, roleLabel: i.roleLabel, scope: i.scope, instances: [i] })
  }
  // Every non-course role now folds its dups into its own card (roleDups,
  // below) — dropped from the standalone list here so Chen-on-DPT-510
  // renders once, not twice. A role with ONLY dups (no fresh person at
  // all) has no readyGroups entry to fold into, so it correctly falls
  // through to the standalone list unchanged.
  const mergedDupKeys = new Set<string>()
  for (const g of readyGroups) {
    if (g.scope === 'course') continue
    const rd = dupsByRole.get(g.roleLabel)
    if (rd) rd.forEach(d => mergedDupKeys.add(d.key))
  }
  const standaloneDups = dups.filter(d => !mergedDupKeys.has(d.key))

  return (
    <div className="flex flex-col gap-2">
      {readyGroups.map(group => {
        const keys = group.instances.map(i => i.key)
        const allIn = keys.every(k => included.has(k))
        // Folds in this role's dups (see dupsByRole above) — DPT-510's
        // Instructor role is 1 fresh (Gomez) + 1 locked (Chen); rendering
        // Chen alongside Gomez needs the role's TOTAL headcount, not just
        // the fresh one.
        const roleDups = group.scope !== 'course' ? (dupsByRole.get(group.roleLabel) ?? []) : []

        // 2026-08-13 (Granola 7aeae56b, Vishal, raw transcript: "is there
        // an example where there are two faculties of type instructor...
        // I want to see how I can add or remove" — no such example existed
        // in the fixture at the time, and this role-level ToggleSwitch had
        // no per-person answer). Explored alongside the identity question
        // at /compare/push-step2-evaluatee-identity; Romit picked variant
        // B — which used a per-person Checkbox row for EVERY role
        // regardless of headcount, not just 2+-person ones. First pass here
        // (same day) gated this on `count > 1` to minimize the diff against
        // the shipped single-person ToggleSwitch path; wrong call — most
        // courses in the fixture have exactly 1 person per role, so that
        // gate meant the change was invisible on everything except DPT-510.
        // Reversed: every non-course role uses the checklist now, one
        // control for identity + add/remove regardless of count, matching
        // what was actually demoed and picked. Course material keeps its
        // ToggleSwitch unchanged below — no person concept, not part of
        // this ask. `onToggleUnit` (singular) was already fully wired
        // (StepSurveyInstances' `flip` → onUnitSelectionChange, the same
        // sticky unitSelections map onToggleUnits writes into) but never
        // called from this file until now.
        if (group.scope !== 'course') {
          return (
            <div
              key={group.key}
              className="flex w-full flex-col gap-2 rounded-md border border-border p-2.5 min-w-0"
              style={{ background: 'var(--card)' }}
            >
              <span className="flex items-center gap-2.5">
                <span className={cn('size-6 rounded-full flex items-center justify-center border border-border bg-background shrink-0', !allIn && 'grayscale')}>
                  <i className={cn('fa-light text-[10px] text-muted-foreground', roleIcon(group.roleLabel))} aria-hidden="true" />
                </span>
                <span className={cn('truncate text-sm font-medium', !allIn && 'text-muted-foreground')}>
                  {group.roleLabel}
                </span>
                {/* Select-all, only when the card actually has 2+ people to
                    select (Romit, 2026-08-13 follow-up) — a role with one
                    free person plus a locked dup (DPT-510) gets no master
                    toggle, since toggling "all" would be identical to that
                    person's own checkbox. Reuses onToggleUnits exactly as
                    the pre-2026-08-13 role-level toggle did — same call,
                    now a convenience ALONGSIDE the per-person checkboxes
                    instead of the only control. */}
                {group.instances.length > 1 && (
                  <span className="ms-auto flex items-center gap-2">
                    <label htmlFor={`unit-all-${code}-${group.key}`} className="sr-only">
                      {`Include all ${group.roleLabel} (${group.instances.length} people: ${group.instances.map(i => i.personName).join(', ')}) in this push`}
                    </label>
                    <ToggleSwitch id={`unit-all-${code}-${group.key}`} checked={allIn} onChange={() => onToggleUnits(keys, !allIn)} />
                  </span>
                )}
              </span>
              <div className="flex flex-col gap-1 ps-1">
                {group.instances.map(i => {
                  const isIn = included.has(i.key)
                  const isAutoExcluded = !isIn && deselectedKeys.has(i.key)
                  return (
                    <CheckboxLabel
                      key={i.key}
                      htmlFor={`unit-${code}-${i.key}`}
                      className={cn('flex items-center gap-2 rounded-md px-1.5 py-1 font-normal', !isIn && 'text-muted-foreground')}
                    >
                      <Checkbox id={`unit-${code}-${i.key}`} checked={isIn} onCheckedChange={() => onToggleUnit(i.key)} />
                      <AvatarInitials initials={initialsOf(i.personName!)} size="sm" className={cn('size-5 shrink-0', !isIn && 'grayscale')} />
                      <span className="truncate text-xs flex-1 min-w-0">{i.personName}</span>
                      {isAutoExcluded && <span className="text-[11px] shrink-0">Auto Update off</span>}
                    </CheckboxLabel>
                  )
                })}
                {roleDups.map(d => {
                  const status = d.existing ? storyStatusOf(d.existing) : null
                  const openedLabel = d.existing?.openDate ? fmtYmd(d.existing.openDate) : null
                  return (
                    <Tip
                      key={d.key}
                      side="top"
                      label={status ? `Already covered by a ${status} survey${openedLabel ? ` opened ${openedLabel}` : ''}.` : 'Already covered by another survey.'}
                    >
                      <div tabIndex={0} className="flex items-center gap-2 rounded-md px-1.5 py-1 min-w-0 text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <i className="fa-solid fa-lock text-xs shrink-0" aria-hidden="true" />
                        <AvatarInitials initials={initialsOf(d.personName ?? '')} size="sm" className="size-5 shrink-0 grayscale" />
                        <span className="truncate text-xs flex-1 min-w-0">{d.personName}</span>
                        <span className="text-[11px] shrink-0">Already covered</span>
                      </div>
                    </Tip>
                  )
                })}
              </div>
            </div>
          )
        }

        // Course material only past this point — no person concept, so it
        // keeps its original ToggleSwitch (Romit's 2026-08-06 call, still
        // correct here) and its own avatar/caption treatment, both
        // untouched by the 2026-08-13 change above.
        const allAutoUpdateExcluded = keys.every(k => !included.has(k) && deselectedKeys.has(k))
        return (
          <div
            key={group.key}
            className="flex w-full items-start gap-2.5 rounded-md border border-border p-2.5 min-w-0"
            style={{ background: 'var(--card)' }}
          >
            <EvaluateeAvatar i={group.instances[0]} className={cn('size-6', !allIn && 'grayscale')} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cn('truncate text-sm font-medium', !allIn && 'text-muted-foreground')}>
                Course material
              </span>
              {allAutoUpdateExcluded ? (
                <span className="truncate text-xs text-muted-foreground">In Prism, not included — Auto Update is off</span>
              ) : (
                <span className="truncate text-xs text-muted-foreground">Course</span>
              )}
            </span>
            {/* Gate 2 fix (ds-conformance-reviewer): ToggleSwitch's real
                props are only {checked, onChange, id} — it does not spread
                aria-label onto its underlying button, so passing one
                directly is silently dropped (renders "On"/"Off" with no
                evaluatee context). sr-only label + htmlFor/id, same pairing
                already used for the real Auto Update ToggleSwitch below. */}
            <label htmlFor={`unit-${code}-${group.key}`} className="sr-only">
              {'Include Course material in this push'}
            </label>
            <ToggleSwitch id={`unit-${code}-${group.key}`} checked={allIn} onChange={() => onToggleUnits(keys, !allIn)} />
          </div>
        )
      })}

      {gaps.map(i => (
        <div
          key={i.key}
          className="flex w-full items-start gap-2.5 rounded-md border border-dashed p-2.5 min-w-0"
          // chip-4 (amber), not chip-5 (orange) — matches the gap vocabulary
          // used everywhere else in this step (GapAvatar, RowStatus's Gap
          // badge/icon disc). chip-5 here was a stray second "gap" hue with
          // no other user in this file.
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
          </span>
          {i.prismHref && (
            // Plain outline, no color override — same "warning lives in the
            // icon/text, the action button stays neutral" split step-review.tsx's
            // AckGroup already applies (its own doc comment: "warning hue on
            // the title only... makes the card scan as a warning without a
            // filled background"). The colored-outline button this replaces
            // read as low-contrast ghost text, not a real action. Trailing
            // external-link icon matches this app's own "Fix in Prism"
            // convention (step-review.tsx's subjectIssues AckGroup) for any
            // button that hands off to Prism in a new tab.
            <Button variant="outline" size="xs" asChild className="shrink-0">
              <a href={i.prismHref} target="_blank" rel="noopener noreferrer">
                Add in Prism
                <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
                <span className="sr-only"> (opens Prism in a new tab to assign the {i.roleLabel} role on {code})</span>
              </a>
            </Button>
          )}
        </div>
      ))}

      {standaloneDups.map(i => {
        const primaryLabel = i.scope === 'course' ? 'Course material' : i.roleLabel
        const secondaryLabel = i.scope === 'course' ? null : i.personName
        const status = i.existing ? storyStatusOf(i.existing) : null
        const openedLabel = i.existing?.openDate ? fmtYmd(i.existing.openDate) : null
        return (
          // 2026-08-12 (Romit's call) — no longer a bordered card. There's
          // nothing to toggle or click here (no button, view-survey removed
          // below), so giving it the same card weight as the real toggle
          // cards above misrepresented it as another decision to make. A
          // plain read-only row, lock icon leading, matches what it actually
          // is: a fact, not an action.
          <div key={i.key} className="flex items-start gap-2.5 px-1 py-1.5 min-w-0 text-muted-foreground">
            <i className="fa-solid fa-lock text-xs shrink-0 mt-0.5" aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm">
                {primaryLabel}
                {secondaryLabel && <span> · {secondaryLabel}</span>}
              </span>
              {i.existing && status && (
                <span className="text-xs">
                  Already covered by a <StoryStatusBadgeOS status={status} size="sm" />
                  {' '}survey{openedLabel && <> opened {openedLabel}</>}.
                </span>
              )}
            </span>
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
  secondaryTemplateAssignments, secondaryInstances, secondaryDedupedLabels, onSecondaryTemplateChange, onAssignPersonTemplate, onRemoveSecondary,
  unitSelections, onUnitSelectionChange,
  autoUpdateOn, onAutoUpdateChange, onRefreshUnits, onCourseSelectedChange,
  templateDriftNotices, onDismissTemplateDrift,
  onBack, onContinue,
}: StepSurveyInstancesProps) {
  // In-step template creation — the SAME create flow + builder as Settings >
  // Templates (the wizard page never unmounts, so state persists).
  const { templates: allTemplates, surveys } = usePce()
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
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

  // Each extra template's own gate, computed exactly like the primary (same
  // reasons logic) from its own instance plan — one array per offering,
  // aligned by index with secondaryTemplateAssignments[offeringId]. Read by
  // renderCourseDetail's "Additional templates" section below.
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

  // 2026-08-12 — Romit's call: accordion (any number of rows expanded at
  // once, seeded open for every conflict/dup/late-add/blocked-secondary row
  // on load) replaced by a single FloatingSheetPanel. A sheet can only show
  // one row at a time, so the auto-open seed is gone — flagged rows stay
  // visually marked (RowStatus badge, gap/late-added chips in Evaluatees)
  // and are opened one at a time by clicking a row's chevron. The Action
  // column's "Assign" button still opens its row (openRow), same as before.
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const openRow = (id: string) => setOpenRowId(id)
  const openOffering = openRowId ? (visibleCourses.find(o => o.id === openRowId) ?? null) : null

  // 2026-08-12 — the accordion's per-row detail (Template card + Evaluatees
  // roster + any "Additional templates") now renders once, for whichever
  // row is open, inside the shared FloatingSheetPanel below. A plain
  // function of `o` — recomputes the same derived values the row loop
  // itself computes (gate, template, criteria, secondaryEntries) rather
  // than capturing them out of that loop, so this is an ordinary render
  // call with no side effects, called after the loop finishes.
  function renderCourseDetail(o: CourseOffering): ReactNode {
    const { code } = splitLabel(o)
    const mode = deliveryModeOf(o)
    const gate = gatesByOffering.get(o.id)!
    const { fresh } = gate
    const deselectedFresh = fresh.filter(i => unitSelections[i.key] === 'deselected')
    const templateId = templateIdFor(o)
    const template = publishedTemplates.find(t => t.id === templateId) ?? null
    const criteria = template ? templateCriteria(template) : []
    const secondaryEntries = secondaryTemplateAssignments[o.id] ?? []
    const secondaryScopePersonNames = secondaryEntries.flatMap(e => e.scopePersonNames ?? [])
    return (
      <div className="flex flex-col gap-4">
        <Card size="sm" className="shadow-none">
          <CardContent>
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
          </CardContent>
        </Card>
        {/* Romit's 2026-08-06 call, carried over from the accordion version:
            no divider between this section and the template card above —
            the gap alone reads as one continuous thread, not two unrelated
            pieces. 2026-08-11 — "Add another template" is gone (spec: only
            one template per course); this section now only has something to
            show once an extra template already exists via the S2 conflict
            "Create new" path (§5.2, still wired), so it's gated on that
            instead of always rendering a bare label. */}
        {secondaryEntries.length > 0 && (
        <div>
          {/* "Additional templates" — same label style as "Evaluatees"
              above (Romit's call): a bare "Add another template" card
              sitting directly below the roster read as one more roster
              item, not a different kind of control for a different concept
              (a whole second, independently-toggleable survey). The label
              names that boundary explicitly instead of relying on shape
              alone to carry it. */}
          <span className="text-xs font-medium text-muted-foreground">Additional templates</span>
          <div className="mt-2 flex flex-col gap-2">
            {secondaryEntries.map((entry, entryIndex) => {
              const sGate = secondaryGatesByOffering.get(o.id)?.[entryIndex]
                ?? { reasons: [], fresh: [], gaps: [], dups: [] }
              const sTemplate = publishedTemplates.find(t => t.id === entry.templateId) ?? null
              // Keyed by templateId, not entryIndex — with 2+ extra
              // entries, removing one used to shift every LATER entry's
              // index down a slot, which silently reassigned its
              // pendingTemplate state (and its React key) to whatever the
              // entry ahead of it had been using. templateId is stable
              // across removals since no two entries on one course ever
              // share one.
              const secondaryKey = `${o.id}::secondary::${entry.templateId}`
              const dedupedLabels = secondaryDedupedLabels[o.id]?.[entryIndex] ?? []
              // This entry's every criterion was already claimed by an
              // earlier template on this course (primary or an earlier
              // extra) — common with the real template catalog, not a rare
              // edge case (see secondaryDedupedLabels' declaration).
              // Nothing new to evaluate, so the row says so instead of
              // showing a bare "–" with no explanation.
              const fullyDeduped = sGate.fresh.length === 0 && sGate.gaps.length === 0
                && sGate.dups.length === 0 && dedupedLabels.length > 0
              // 2026-08-06 — one header, not a separate grey toolbar
              // sitting above TemplateHeaderRow's own name/Preview/Remove
              // line (Romit's call: the two-header layout read as a
              // different kind of control than the primary template's one
              // clean row, which has no collapse of its own either — every
              // extra template's full detail is always visible now, same
              // as the primary's). "Also evaluating" + live status fold
              // into TemplateHeaderRow's own badge slot.
              // Round 2 (same day) — the inline template-switch dropdown
              // that used to sit in this header is gone (Romit's call): to
              // change an extra template's own pick, Remove it and "Add
              // another template" — one decision path, not two ways to do
              // the same thing.
              const secondaryBadges = (
                <>
                  <Badge variant="secondary" className="shrink-0" style={{ fontSize: 12, paddingInline: 6, paddingBlock: 1 }}>
                    Also evaluating
                  </Badge>
                  {!fullyDeduped && <RowStatus gate={sGate} />}
                </>
              )
              return (
                // Same card treatment as the primary template above: one
                // card per extra template, no vertical rail, no dropdown.
                <div key={entry.templateId} className="rounded-md border border-border p-4">
                  {fullyDeduped ? (
                    // No roster to render (everything this entry would
                    // cover is already claimed) — same header as the normal
                    // case below (TemplateHeaderRow), so Preview/Remove are
                    // never missing just because this particular entry has
                    // nothing new to evaluate.
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
                      {/* dt-row-selected — a fixed neutral gray in every
                          theme (not var(--muted), which carries a faint
                          pink cast in the Prism theme) for this plain
                          informational aside, so it reads as neutral rather
                          than a status color. */}
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
          </div>
        </div>
        )}
      </div>
    )
  }

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
              {/* Save as draft moved to the shared WizardNav endSlot
                  (2026-08-12) — one position across all steps instead of
                  living here alongside this step's own actions. */}
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
              className="grid items-center gap-4 ps-3 pe-3 py-2 border-b border-border text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: TABLE_GRID }}
            >
              <span />
              <span>Course</span>
              <span>Type</span>
              <span>Template</span>
              <span>Evaluatees</span>
              <span>Status</span>
              <span>Action</span>
              <span />
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
                const isOpen = openRowId === o.id
                const driftNotice = templateDriftByOffering.get(o.id)

                return (
                  <Fragment key={o.id}>
                  <div className="border-b border-border last:border-b-0">
                    {/* Open-row accent — 2026-08-06, Romit's call: nothing
                        distinguished an open row from a closed one besides
                        the chevron rotating, which made it hard to tell
                        which row a scrolled-past panel belonged to in a long
                        list. Left rule reuses the tree's own hierarchy
                        vocabulary (CourseDetailBody's border-l-2). Carried
                        over as-is after the 2026-08-12 sheet conversion —
                        still the only cue tying an open sheet back to its row. */}
                    <div
                      // 2026-08-12 — Romit's call: uniform gap-3 gave every
                      // column boundary the same weight, whether it separated
                      // two controls in the same logical group (checkbox,
                      // chevron) or two unrelated ones (Template, Evaluatees,
                      // Status). gap-4 + a touch more row height reads less
                      // crowded without re-tuning TABLE_GRID's own column
                      // widths (still deliberately sized per the comment
                      // above the constant).
                      className="grid items-center gap-4 ps-3 pe-3 py-2.5 border-l-2 cursor-pointer"
                      // dt-row-selected (the canonical DataTable's own open/selected-row
                      // token, component-consistency.md) — not --accent: in the active
                      // theme-prism theme --accent is a brand-hue-343 rose tint, the same
                      // family as the KC/AP persona avatar colors and the status badges
                      // sitting on top of it, so the row wash flattened their contrast
                      // against each other (Romit's 2026-08-06 live catch). dt-row-selected
                      // is a fixed neutral gray in every theme, same reasoning RowStatus's
                      // header comment already gives for avoiding brand-hue tokens on status.
                      style={{ gridTemplateColumns: TABLE_GRID, minHeight: 48, borderLeftColor: isOpen ? 'var(--primary)' : 'transparent', background: isOpen ? 'var(--dt-row-selected)' : undefined }}
                      // The chevron used to be the row's only way in — Romit's
                      // 2026-08-12 feedback: a 24px icon is too small a target
                      // for "open this row's detail", the row's single most
                      // common action. The row itself now opens the sheet;
                      // Checkbox/TemplateDropdown/RowAction stop propagation
                      // below so their own clicks don't also open it.
                      onClick={() => setOpenRowId(o.id)}
                    >
                      <span className="flex items-center" onClick={e => e.stopPropagation()}>
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

                      <span className="flex items-baseline gap-2.5 min-w-0">
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

                      <span className="min-w-0" onClick={e => e.stopPropagation()}>
                        <TemplateDropdown
                          templateId={templateId}
                          code={code}
                          publishedTemplates={publishedTemplates}
                          onChange={tid => onTemplateChange(o.id, tid)}
                        />
                      </span>

                      <span className="min-w-0"><EvaluateeChipCluster code={code} gate={gate} included={included} /></span>

                      <span className="min-w-0"><RowStatus gate={gate} /></span>

                      <span className="min-w-0" onClick={e => e.stopPropagation()}>
                        <RowAction gate={gate} driftNotice={driftNotice} onAssign={() => openRow(o.id)} />
                      </span>

                      {/* 2026-08-12 — opens the shared FloatingSheetPanel for
                          this row instead of expanding inline (was a
                          CollapsibleTrigger). Static chevron-right, not a
                          rotating chevron-down — there's no in-place
                          open/closed state to animate anymore, just "opens a
                          panel." Template and Evaluatees still live outside
                          this collapsed line, in the panel this opens.
                          Moved to the row's trailing edge (Romit's
                          2026-08-12 feedback) — a leading chevron read as an
                          expand/collapse disclosure at the START of the row's
                          content; a trailing one reads as "go to detail",
                          the more common end-of-row convention, and now sits
                          beside Action instead of squeezed next to the
                          checkbox. The row's own onClick (above) already
                          opens the sheet from anywhere in the row — this
                          button is a redundant, keyboard-focusable entry
                          point, not the only way in anymore. */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={e => { e.stopPropagation(); setOpenRowId(o.id) }}
                        aria-label={`View details for ${code}`}
                      >
                        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  </Fragment>
                )
              })}
           </CardContent>
          </Card>
          </div>
        </div>
      )}

      {/* 2026-08-12 — single shared FloatingSheetPanel for whichever row's
          chevron was clicked (openRowId), replacing the accordion's
          per-row CollapsibleContent. Never the raw Sheet/SheetContent
          primitive (exxat-overlays: FloatingSheetPanel only). */}
      <FloatingSheetPanel open={openOffering !== null} onOpenChange={open => { if (!open) setOpenRowId(null) }}>
        <FloatingSheetPanelContent contentSlot="course-evaluatee-detail">
          {openOffering && (() => {
            const { code, name } = splitLabel(openOffering)
            return (
              <>
                <FloatingSheetPanelHeader
                  title={code}
                  subtitle={name || undefined}
                  onClose={() => setOpenRowId(null)}
                />
                <FloatingSheetPanelBody className="gap-4 px-4 pb-4">
                  {renderCourseDetail(openOffering)}
                </FloatingSheetPanelBody>
              </>
            )
          })()}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>

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
          // 2026-08-12 — was a RadioGroup offering "Keep both" (a second,
          // concurrent template on this course) vs. "Replace". The reviewer
          // reconfirmed "one template, one course... there is no concept of
          // two templates with the same survey" (the same rule that killed
          // the general "+ Add another template" affordance the day
          // before) — Replace is now the only outcome, so this is a plain
          // confirm, not a choice.
          <AlertDialog open onOpenChange={(open) => { if (!open) onCancelReassign() }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change template for {code}?</AlertDialogTitle>
              </AlertDialogHeader>
              {/* Anchor — the one fact true regardless, stated once, inline —
                  no box, no card. StoryStatusBadgeOS is the only
                  "component" here; everything else is plain text. */}
              <div className="mx-6 flex items-center gap-2 text-sm text-muted-foreground">
                <i className="fa-light fa-file-lines text-xs shrink-0" aria-hidden="true" />
                <span className="truncate">{existingTemplate?.name ?? 'Its assigned template'}</span>
                <StoryStatusBadgeOS status={pendingReassign.existingStatus} />
              </div>
              <div className="flex flex-col gap-1 px-6 py-3">
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
                <span className="text-sm text-muted-foreground">
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
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={onCancelReassign}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onResolveReassign}>
                  Change template
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
