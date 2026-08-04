'use client'

// Wizard step shell — hand-roll justified (no DS step-frame organism), see
// docs/governance/ds-adoption.md §PCE. Composes DS Card/AvatarGroup/Popover/
// Command/Collapsible/ToggleGroup/ToggleSwitch/Checkbox/Select/Button/Badge/
// Tip/AlertDialog/LocalBanner + ListHubStatusBadge/StoryStatusBadgeOS.
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
// What changed, and why:
//   · A row is ONE LINE by default: checkbox · course · type · template ·
//     Evaluatees avatars · status badge · Preview. Ready courses (the
//     majority) render nothing else — no chips, no issue lines.
//   · Evaluatees (course material AND faculty — not "Faculty," which
//     undersold the course-material avatar sitting right beside them) is a
//     READ-ONLY avatar summary at rest; changing the selection opens a
//     Popover+Command picker (EvaluateesPickerCell below), then reverts to
//     the summary on close. Three earlier attempts put the toggle directly
//     ON the tiny avatar itself (a checkmark badge, an ×/+ badge, a DS
//     Checkbox overlay) and each was reported unreliable/unclear in live
//     testing — a 24px avatar is too small a target to carry both identity
//     and a selection control legibly. See that function's header for the
//     full composition rationale.
//   · Status is a real DS badge — `ListHubStatusBadge` (the same component
//     Step 1's readiness column uses) for every tier, including the hard
//     block, with a SOLID fill for Blocked so it reads as strictly the
//     loudest state in the row (a translucent DS `Badge
//     variant="destructive"` was tried first and read fainter than the
//     amber "unassigned" pill — backwards from the intended severity).
//   · The disclosure chevron exists ONLY for a role-overlap conflict (a
//     faculty gap is fixable from the Evaluatees picker instead). What it
//     reveals is plain sentences grouped by the SAME existing survey — two
//     instructors blocked by one survey read as one fact ("Dr. Chen and
//     Dr. Gomez are already being evaluated by a Live survey opened Nov
//     20…"), never the old Evaluate?/Role/Assigned/Covered-by grid, which
//     read as its own mini spreadsheet.
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

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AvatarGroup, AvatarGroupCount,
  Popover, PopoverTrigger, PopoverContent,
  Command, CommandList, CommandEmpty, CommandGroup, CommandItem,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Button, Checkbox, LocalBanner, ToggleGroup, ToggleGroupItem, ToggleSwitch, Badge, Tip,
  Card, CardContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
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
  type CourseOffering, type PceTemplate,
} from '@/lib/pce-mock-data'
import { courseLabelOf, templateCriteria, CRITERION_BY_TYPE } from '@/lib/pce-course-readiness'
import {
  storyStatusOf,
  type StoryStatus, type SurveyInstance, type UnitSelectionMap, type UnitSelectionState,
} from '@/lib/pce-push-validation'
import { EmptyHint, TypePill } from './scope-controls'

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

/** Faculty avatars show at most this many real faces before the DS
 *  AvatarGroupCount overflow ("+N", Tip lists the hidden names) — matches
 *  the cap the DS avatar docs use (lib/design-system/component-docs/
 *  avatar.tsx). Missing-role add-avatars are never folded into this count:
 *  they're the row's one actionable fix and would otherwise hide behind a
 *  click. */
const FACULTY_AVATAR_CAP = 3
/** Fixed template-select width so the header row and every course row stay
 *  aligned. */
const TEMPLATE_COL_W = 188
// checkbox · chevron · course · type · template · faculty · status · preview
const TABLE_GRID = `24px 24px minmax(0,1fr) 92px ${TEMPLATE_COL_W}px 140px 210px 72px`

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

interface DupGroup {
  key: string
  roleLabel: string
  names: string[]
  status: StoryStatus
  openedLabel: string | null
  existingId: string
}

/** Groups role-overlap conflict instances by the SAME existing survey +
 *  role, so two instructors blocked by one survey read as one sentence
 *  ("Dr. Chen and Dr. Gomez are already covered…") instead of two
 *  identical-looking rows that only differ by name. */
function buildDupGroups(dups: SurveyInstance[]): DupGroup[] {
  const map = new Map<string, DupGroup>()
  for (const i of dups) {
    if (!i.existing) continue
    const key = `${i.existing.id}|${i.roleLabel}`
    const existing = map.get(key)
    const name = i.personName ?? 'Course material'
    if (existing) {
      existing.names.push(name)
    } else {
      map.set(key, {
        key,
        roleLabel: i.roleLabel || 'Course material',
        names: [name],
        status: storyStatusOf(i.existing),
        openedLabel: i.existing.openDate ? fmtYmd(i.existing.openDate) : null,
        existingId: i.existing.id,
      })
    }
  }
  return [...map.values()]
}

const BLOCK_BADGE_COPY: Record<BlockReason, { label: string; icon: string }> = {
  'overlap': { label: 'Blocked', icon: 'fa-lock' },
  'no-template': { label: 'No template', icon: 'fa-circle-xmark' },
  'unstaffed': { label: 'No one to evaluate', icon: 'fa-user-slash' },
  'none-selected': { label: 'Nothing selected', icon: 'fa-circle-xmark' },
  'no-units': { label: 'Nothing to evaluate', icon: 'fa-circle-xmark' },
}

// ═════════════════════════════════════════════════════════════════════════════
// Status — the load-bearing element of this variant, ALWAYS a real DS
// ListHubStatusBadge (never a hand-rolled dot+text span), and ALWAYS the
// SAME component family across every severity tier — Ready, gap, and
// blocked differ only by tint, so a hard block is unmistakably the loudest
// of the three, not a differently-shaped element. No person names ever
// appear here — names live in Evaluatees.
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

/** Names the role for the common single-role case ("Instructor unassigned")
 *  — specific enough to act on without opening anything else. Falls back to
 *  a count for 2+ roles ("2 roles unassigned") so the badge never has to
 *  cram a long joined list into a fixed-width column and clip; the exact
 *  roles are still visible via the Evaluatees column's indicators and
 *  inside the picker itself. */
function roleSummaryLabel(roles: string[], suffix: string): string {
  if (roles.length === 1) return `${roles[0]} ${suffix}`
  return `${roles.length} roles ${suffix}`
}

function RowStatus({ gate }: { gate: CourseGate }) {
  const blockBadges = gate.reasons.map(reason => {
    // 'overlap' names the actual blocked role — "Coordinator blocked" says
    // WHAT is wrong without opening the disclosure; a bare "Blocked" made the
    // admin hunt for the reason even when they only wanted the headline.
    if (reason === 'overlap') {
      const roles = [...new Set(gate.dups.map(i => i.roleLabel || 'Course material'))]
      return (
        <ListHubStatusBadge
          key={reason}
          label={roles.length > 0 ? roleSummaryLabel(roles, 'blocked') : 'Blocked'}
          tint={LIST_HUB_STATUS_TINT_DANGER}
          icon="fa-lock"
        />
      )
    }
    const copy = BLOCK_BADGE_COPY[reason]
    return <ListHubStatusBadge key={reason} label={copy.label} tint={LIST_HUB_STATUS_TINT_DANGER} icon={copy.icon} />
  })
  const showGapBadge = gate.gaps.length > 0 && !gate.reasons.includes('unstaffed')
  if (blockBadges.length === 0 && !showGapBadge) {
    return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
  }
  // Same reasoning for the gap badge: "1 unassigned" never said which role —
  // "Instructor unassigned" tells the admin exactly what to go fix, and
  // doubles as the cue that the Evaluatees picker is where to fix it.
  const gapRoles = [...new Set(gate.gaps.map(i => i.roleLabel))]
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0 flex-wrap">
      {blockBadges}
      {showGapBadge && (
        <ListHubStatusBadge
          label={roleSummaryLabel(gapRoles, 'unassigned')}
          tint={LIST_HUB_STATUS_TINT_WARNING}
          icon="fa-user-slash"
        />
      )}
    </span>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Evaluatees — resting state is a read-only DS AvatarGroup (who's currently
// included, at a glance, no click needed). Opening it swaps to a proper
// Popover + Command picker to actually change the selection, then swaps
// back to the avatar summary on close.
//
// Three prior attempts put the toggle directly ON the tiny avatar (a
// checkmark badge, then an ×/+ badge, then a DS Checkbox overlay) and each
// was reported unreliable/unclear in live testing — a 24px avatar is simply
// too small a target to carry both identity AND a selection control legibly.
// This composition instead follows the SAME proven Popover+Command pattern
// already used for Cohort/What-to-evaluate in TokenSelect
// (courses-evaluatees/scope-controls.tsx) — a full-size list with names,
// roles, and real click targets — and avoids that file's own documented
// traps: a check GLYPH inside CommandItem, never a nested DS Checkbox
// (Checkbox renders a <button>, which trips nested-interactive inside
// CommandItem's role="option"); state rides in the accessible name, never
// in aria-selected (cmdk owns that for its own keyboard-highlight); and
// PopoverContent gets an explicit aria-label (it's role="dialog").
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

function EvaluateesPickerCell({ code, gate, included, onToggleUnit }: {
  code: string
  gate: CourseGate
  included: ReadonlySet<string>
  onToggleUnit: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { fresh, gaps, dups } = gate
  if (fresh.length === 0 && gaps.length === 0 && dups.length === 0) {
    return <span className="text-xs text-muted-foreground">&ndash;</span>
  }

  const includedFresh = fresh.filter(i => included.has(i.key))
  const visibleIncluded = includedFresh.slice(0, FACULTY_AVATAR_CAP)
  const overflowIncluded = includedFresh.length - visibleIncluded.length
  const gapRoles = [...new Set(gaps.map(i => i.roleLabel))]
  const dupRoles = [...new Set(dups.map(i => i.roleLabel || 'Course material'))]
  const noIndicator = visibleIncluded.length === 0 && gaps.length === 0 && dups.length === 0
  const summaryParts: string[] = []
  if (includedFresh.length > 0) summaryParts.push(includedFresh.map(evaluateeLabel).join(', '))
  if (gapRoles.length > 0) summaryParts.push(`${gapRoles.join(', ')} needs a person`)
  if (dupRoles.length > 0) summaryParts.push(`${dupRoles.join(', ')} already covered`)
  const summary = summaryParts.length > 0 ? summaryParts.join('. ') : 'Nothing selected'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="group h-auto gap-1 rounded-md py-0.5 pe-1 -ms-1 ps-1 font-normal hover:bg-secondary"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Evaluatees for ${code}: ${summary}. Click to change.`}
        >
          {noIndicator ? (
            <span className="size-6 rounded-full flex items-center justify-center border border-dashed border-border text-muted-foreground">
              <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
            </span>
          ) : (
            <AvatarGroup className="flex items-center" aria-hidden="true">
              {visibleIncluded.map(i => <EvaluateeAvatar key={i.key} i={i} className="size-6" />)}
              {overflowIncluded > 0 && <AvatarGroupCount>+{overflowIncluded}</AvatarGroupCount>}
              {/* A dashed amber circle restores the "something's missing here"
                  glance-signal the old per-avatar dashed "+" gave — it was
                  lost when Evaluatees became a read-only summary, and its
                  absence was reported as "not easy to understand I need to
                  assign faculty." One glyph represents ALL gap roles (not
                  one per role) to stay compact; the exact roles are named in
                  the Status column's badge and inside the picker itself. */}
              {gaps.length > 0 && (
                <span
                  className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0"
                  style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
                >
                  <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
                </span>
              )}
              {dups.length > 0 && (
                <span
                  className="size-6 rounded-full flex items-center justify-center border shrink-0"
                  style={{ borderColor: 'var(--qb-status-blocked-border)', color: 'var(--qb-status-blocked-fg)' }}
                >
                  <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
                </span>
              )}
            </AvatarGroup>
          )}
          <i
            className="fa-light fa-chevron-down text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[state=open]:opacity-100"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="p-0 w-auto min-w-64 max-w-80" aria-label={`Evaluatees for ${code}`}>
        <Command>
          <CommandList>
            <CommandEmpty>No evaluatees for this course.</CommandEmpty>

            {fresh.length > 0 && (
              <CommandGroup heading="Include in this push">
                {fresh.map(i => {
                  const isIn = included.has(i.key)
                  return (
                    <CommandItem key={i.key} value={evaluateeLabel(i)} onSelect={() => onToggleUnit(i.key)}>
                      <i className={cn('fa-solid fa-check text-xs', !isIn && 'opacity-0')} aria-hidden="true" />
                      <EvaluateeAvatar i={i} className="size-5" />
                      <span className="truncate">{i.scope === 'course' ? 'Course material' : i.personName}</span>
                      {i.roleLabel && i.scope !== 'course' && (
                        <span className="text-muted-foreground text-xs shrink-0">· {i.roleLabel}</span>
                      )}
                      {isIn && <span className="sr-only">, included</span>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {gaps.length > 0 && (
              <CommandGroup heading="Needs a person">
                {gaps.map(i => (
                  <CommandItem
                    key={i.key}
                    value={`no ${i.roleLabel} assigned`}
                    onSelect={() => { if (i.prismHref) window.open(i.prismHref, '_blank', 'noopener,noreferrer') }}
                  >
                    <i className="fa-light fa-user-slash text-xs shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                    <span className="truncate">No {i.roleLabel} assigned</span>
                    <span className="ms-auto text-xs shrink-0" style={{ color: 'var(--insight-severity-info-fg)' }}>
                      Add in Prism
                      <span className="sr-only"> (opens in new tab)</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {dups.length > 0 && (
              <CommandGroup heading="Already covered">
                {dups.map(i => (
                  <CommandItem key={i.key} value={evaluateeLabel(i)} disabled>
                    <i className="fa-solid fa-lock text-xs shrink-0" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
                    <EvaluateeAvatar i={i} className="size-5" />
                    <span className="truncate">{i.scope === 'course' ? 'Course material' : i.personName}</span>
                    {i.roleLabel && i.scope !== 'course' && (
                      <span className="text-muted-foreground text-xs shrink-0">· {i.roleLabel}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
  unitSelections, onUnitSelectionChange,
  autoUpdateOn, onAutoUpdateChange, onRefreshUnits, onCourseSelectedChange,
  templateDriftNotices, onDismissTemplateDrift,
  onBack, onContinue,
}: StepSurveyInstancesProps) {
  // In-step template creation — the SAME create flow + builder as Settings >
  // Templates (the wizard page never unmounts, so state persists).
  const { templates: allTemplates } = usePce()
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
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
        if (dups.length > 0) reasons.push('overlap')
        if (items.length === 0) reasons.push('no-units')
        else if (fresh.length === 0 && gaps.length > 0 && dups.length === 0) reasons.push('unstaffed')
        else if (fresh.length > 0 && fresh.every(i => !included.has(i.key))) reasons.push('none-selected')
      }
      m.set(o.id, { reasons, fresh, gaps, dups })
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, instancesByOffering, templateAssignments, defaultAssignments, publishedTemplates, included])

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
  const attentionCount = courses.filter(o => {
    const g = gatesByOffering.get(o.id)!
    return g.reasons.length > 0 || g.gaps.length > 0
  }).length
  const blockedCount = courses.filter(o => gatesByOffering.get(o.id)!.reasons.length > 0).length
  const visibleCourses = courses.filter(o => {
    if (filter === 'all') return true
    const g = gatesByOffering.get(o.id)!
    return filter === 'blocked' ? g.reasons.length > 0 : g.reasons.length > 0 || g.gaps.length > 0
  })

  const canContinue = missingTemplate === 0 && toCreate > 0 && conflictedCourseCount === 0
  const continueDisabledReason = missingTemplate > 0
    ? `${missingTemplate} course${missingTemplate !== 1 ? 's need' : ' needs'} a template before continuing.`
    : conflictedCourseCount > 0
      ? `${conflictedCourseCount} course${conflictedCourseCount !== 1 ? 's are' : ' is'} blocked. Resolve or exclude ${conflictedCourseCount !== 1 ? 'them' : 'it'} before continuing.`
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
            <div className="flex items-center gap-2 shrink-0">
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
              A row is one line by default; the disclosure chevron exists
              only for a role-overlap conflict. */}
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
              <span className="inline-flex items-center gap-1.5">
                Evaluatees
                <Tip label="Click a person or course material to include or exclude them from this push. + adds, × removes." side="top">
                  <i className="fa-light fa-circle-info" aria-hidden="true" style={{ fontSize: 11 }} />
                </Tip>
              </span>
              <span>Status</span>
              <span />
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
                const inCount = freshKeys.filter(k => included.has(k)).length
                const templateId = templateIdFor(o)
                const template = publishedTemplates.find(t => t.id === templateId) ?? null
                const criteria = template ? templateCriteria(template) : []
                const hasDisclosure = dups.length > 0
                const previewButton = (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    disabled={!template}
                    onClick={() => template && setPreviewTemplate(template)}
                  >
                    Preview
                    <span className="sr-only">
                      {template ? ` the survey for ${code}` : '. Assign a template to preview.'}
                    </span>
                  </Button>
                )
                return (
                  <Collapsible
                    key={o.id}
                    defaultOpen={dups.length > 0}
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

                      {/* Chevron only exists when there's a role-overlap
                          conflict — a faculty gap is already fixable from
                          its avatar in the Faculty column. */}
                      {hasDisclosure ? (
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="group"
                            aria-label={`Show conflict details for ${code}`}
                          >
                            <i
                              className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180"
                              aria-hidden="true"
                            />
                          </Button>
                        </CollapsibleTrigger>
                      ) : (
                        <span aria-hidden="true" />
                      )}

                      <span className="flex items-baseline gap-2 min-w-0">
                        <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
                        {name && <span className="truncate text-sm">{name}</span>}
                      </span>

                      <span><TypePill deliveryMode={mode} label={COURSE_TYPE_FULL_LABEL[mode]} /></span>

                      <TemplateControl
                        offering={o}
                        templateId={templateId}
                        defaultTemplateId={defaultAssignments[o.id]}
                        edited={!!templateId && templateId !== defaultAssignments[o.id]}
                        publishedTemplates={publishedTemplates}
                        onTemplateChange={onTemplateChange}
                        onCreate={() => { setNotice(null); setSubView('create') }}
                      />

                      <span className="min-w-0">
                        <EvaluateesPickerCell code={code} gate={gate} included={included} onToggleUnit={flip} />
                      </span>

                      <span className="min-w-0"><RowStatus gate={gate} /></span>

                      <span className="flex justify-end">
                        {template ? (
                          previewButton
                        ) : (
                          <Tip label="Assign a template to preview" side="left">
                            {/* Disabled buttons swallow pointer/focus events —
                                the focusable wrapper carries the tooltip AND
                                a visible focus ring (WCAG 2.4.7). */}
                            <span
                              className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                              tabIndex={0}
                            >
                              {previewButton}
                            </span>
                          </Tip>
                        )}
                      </span>
                    </div>

                    {/* Disclosure — plain sentences grouped by the existing
                        survey doing the blocking, not a data grid. Only ever
                        mounted for a row with a role-overlap conflict. */}
                    {hasDisclosure && (
                      <CollapsibleContent>
                        <div className="mx-4 mb-3 rounded-md border border-border bg-background flex flex-col divide-y divide-border">
                          {buildDupGroups(dups).map(g => (
                            <div key={g.key} className="flex flex-col gap-1.5 px-3 py-2.5" style={{ background: 'var(--pce-impact-bg)' }}>
                              <p className="text-sm font-medium inline-flex items-center gap-1.5" style={{ color: 'var(--chip-destructive)' }}>
                                <i className="fa-solid fa-lock text-xs" aria-hidden="true" />
                                {g.roleLabel} already covered
                              </p>
                              {/* Fact on its own line, "View survey" as a real
                                  button on its own row — never inline with
                                  the sentence. Run together ("...opened Jul
                                  25. View survey Cancel or archive...") read
                                  as one garbled phrase with no separation
                                  between the link and the next sentence. */}
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground min-w-0">
                                  {g.names.join(' and ')} {g.names.length > 1 ? 'are' : 'is'} already being evaluated by a{' '}
                                  <StoryStatusBadgeOS status={g.status} size="sm" />
                                  {' '}survey{g.openedLabel && <> opened {g.openedLabel}</>}.
                                </p>
                                <Button variant="outline" size="xs" asChild className="shrink-0">
                                  <Link href={`/surveys/${g.existingId}`}>
                                    View survey
                                    <span className="sr-only"> covering the {g.roleLabel} role of {code}</span>
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                          {/* The ONE place this guidance appears — it was
                              previously said twice (once per fact card above,
                              once here), which read as padding, not
                              clarity. */}
                          <div className="flex items-center justify-between gap-3 px-3 py-2">
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
                          {template && (
                            <p className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                              {template.name} · {template.questionCount} question{template.questionCount !== 1 ? 's' : ''} · evaluates{' '}
                              {criteria
                                .map(c => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c]?.label ?? c))
                                .join(', ')}
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
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
