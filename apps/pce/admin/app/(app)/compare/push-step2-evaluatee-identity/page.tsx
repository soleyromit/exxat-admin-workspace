'use client'

// COMPARE ROUTE (throwaway — delete once a direction is picked, same
// lifecycle as /compare/push-step2-row-detail and its siblings).
//
// Two asks from the 2026-08-13 Granola call ("Survey design and email
// template configuration for course evaluation", Vishal — raw transcript,
// not a summary):
//
//   1. "If we are showing faculty icons, it's easier to skim through...
//      [without them] I need to go and look at the details of every single
//      value" — the shipped Evaluates column (courses-evaluatees/step-
//      survey-instances.tsx EvaluateeChipCluster) shows role TYPE only
//      (Instructor ×2), never WHO. That's a deliberate 2026-08-06 decision
//      (Monil, Course Eval sync up, raw transcript: "that toggle is not on
//      a person, it's on a role... we will not show who the instructors
//      are at this level") — Vishal is reopening it live in this call and
//      asked for screenshots of the options rather than a shipped answer:
//      "you can just share a screenshot... I can review and confirm
//      offline." Three variants below, A is the shipped baseline.
//   2. "Is there an example where there are two faculties of type
//      instructor... I want to see how I can add or remove" — no such
//      example exists in the fixture (confirmed live: "No, not in
//      example"), and the shipped detail panel only has a role-level
//      ALL-in/ALL-out ToggleSwitch, no per-person control. Every variant's
//      expanded panel below uses the SAME FacultyRosterPicker (_shared.tsx)
//      to answer this — the identity question (A/B/C) only changes the
//      COLLAPSED row; the add/remove interaction doesn't change by variant.
//
// Same real engine + fixture as every other /compare/push-step2-* route
// (expandInstances/storyStatusOf against MOCK_COURSE_OFFERINGS) — see
// _shared.tsx's own header comment for exactly which 3 offerings and why.

import { Fragment, useState } from 'react'
import { AvatarGroup, AvatarInitials, Badge, Button, Card, CardContent, Tip } from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { initialsOf } from '@/lib/pce-analytics'
import {
  useEvaluateeIdentityDemo, groupByRole, roleIcon, FacultyRosterPicker,
  type DemoRow, type RoleGroup,
} from './_shared'

type IdentityMode = 'role-only' | 'hover-names' | 'inline-names'

const MODES: { key: IdentityMode; label: string; sub: string }[] = [
  { key: 'role-only', label: 'A · Role only (shipped today)', sub: 'Instructor ×3 — type and count, no names until you open the row' },
  { key: 'hover-names', label: 'B · Names on hover', sub: 'Same chip, plus a tight avatar cluster — hover/focus any avatar for the name' },
  { key: 'inline-names', label: 'C · Names inline', sub: 'Names sit in the cell itself, no hover required — row grows to fit' },
]

/** The ONE thing that differs per variant — the collapsed row's Evaluates
 *  cluster. Role chip is common to all three (Vishal didn't ask to drop
 *  it, just to stop hiding WHO); B adds a hoverable avatar cluster next to
 *  it, C replaces the count with real names. */
function EvaluatesCluster({ mode, groups }: { mode: IdentityMode; groups: RoleGroup[] }) {
  if (groups.length === 0) return <span className="text-xs text-muted-foreground">&ndash;</span>
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
      {groups.map(g => {
        const label = g.scope === 'course' ? 'Course material' : g.roleLabel
        const icon = g.scope === 'course' ? 'fa-book-open' : roleIcon(g.roleLabel)
        const names = g.instances.map(i => i.personName).filter((n): n is string => !!n)
        return (
          <Fragment key={g.key}>
            <Badge variant="outline" className="h-6 gap-1 border-border bg-background px-2 text-xs font-medium">
              <i className={cn('fa-light text-[10px]', icon)} aria-hidden="true" />
              {label}{g.instances.length > 1 && mode === 'role-only' ? ` ×${g.instances.length}` : ''}
            </Badge>
            {mode === 'hover-names' && names.length > 0 && (
              // ds-adoption-reviewer catch (2026-08-13): an overlapping
              // -space-x stack is a banned pattern — AvatarGroup's own doc
              // comment is explicit ("Overlapping face piles... MUST NOT").
              // Switched to AvatarGroup for the gapped, non-overlapping row
              // (also fixes the earlier legibility catch — 3 avatars at
              // -space-x-1.5 read as an illegible blob). Kept the tabIndex
              // span the reviewer's snippet dropped: AvatarInitials isn't
              // itself focusable, and production's own EvaluateeRoster
              // wraps it the same way so the tooltip name is keyboard-
              // reachable (WCAG 1.4.13), not hover-only.
              <AvatarGroup className="gap-0.5" role="group" aria-label={`${g.roleLabel}: ${names.join(', ')}`}>
                {g.instances.map(i => (
                  <Tip key={i.key} label={i.personName ?? ''} side="top">
                    <span tabIndex={0} className="inline-flex shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
                      <AvatarInitials initials={initialsOf(i.personName!)} size="sm" className="size-6" />
                    </span>
                  </Tip>
                ))}
              </AvatarGroup>
            )}
            {mode === 'inline-names' && names.length > 0 && (
              <span className="text-xs text-muted-foreground">{names.join(', ')}</span>
            )}
          </Fragment>
        )
      })}
    </span>
  )
}

function DemoCard({
  row, mode, included, onToggle,
}: {
  row: DemoRow
  mode: IdentityMode
  included: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  const groups = groupByRole(row.fresh)
  const facultyGroups = groups.filter(g => g.scope === 'instructor')
  const courseGroup = groups.find(g => g.scope === 'course')

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-3" style={{ padding: 16 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold">{row.code}</span>
          <span className="text-xs text-muted-foreground truncate">{row.name}</span>
        </div>
        <EvaluatesCluster mode={mode} groups={groups} />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        {courseGroup && (
          <p className="text-xs text-muted-foreground">
            <i className="fa-light fa-book-open me-1.5" aria-hidden="true" />
            Course material — evaluated for every student, no person to assign.
          </p>
        )}
        {facultyGroups.map(g => (
          <div key={g.key} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{g.roleLabel}</span>
            <FacultyRosterPicker roleLabel={g.roleLabel} instances={g.instances} included={included} onToggle={onToggle} />
          </div>
        ))}
        {row.dups.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {row.dups.map(i => (
              <div key={i.key} className="flex items-center gap-2 px-1 py-1 min-w-0 text-muted-foreground">
                <i className="fa-solid fa-lock text-xs shrink-0" aria-hidden="true" />
                <AvatarInitials initials={initialsOf(i.personName ?? '')} size="sm" className="size-6 shrink-0 grayscale" />
                <span className="text-sm truncate">
                  {i.roleLabel} &middot; {i.personName} &mdash; already covered by another survey
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  )
}

function VariantSection({ mode, sub, rows, included, onToggle }: {
  mode: IdentityMode
  sub: string
  rows: DemoRow[]
  included: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold">{MODES.find(m => m.key === mode)?.label}</h2>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map(row => (
          <DemoCard key={row.offering.id} row={row} mode={mode} included={included} onToggle={onToggle} />
        ))}
      </div>
    </section>
  )
}

export default function PushStep2EvaluateeIdentityComparePage() {
  const { rows, included, toggleUnit } = useEvaluateeIdentityDemo()
  const [active, setActive] = useState<IdentityMode>('role-only')

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[900px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 2 Evaluates — faculty identity + add/remove</h1>
        <p className="text-sm text-muted-foreground">
          Same real data (DPT-501 · DPT-520 · DPT-510, Fall 2026–2027 fixture), same real
          expandInstances engine. Three answers to &ldquo;can we show WHO&rdquo; (A/B/C below), each
          with the same person-grain add/remove picker in its detail panel. None of this is wired
          into the production wizard.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {MODES.map(m => (
          <Button
            key={m.key}
            variant={active === m.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActive(m.key)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      <VariantSection
        mode={active}
        sub={MODES.find(m => m.key === active)!.sub}
        rows={rows}
        included={included}
        onToggle={toggleUnit}
      />
    </div>
  )
}
