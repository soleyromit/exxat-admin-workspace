'use client'

// COMPARE ROUTE — shared harness (throwaway, same lifecycle as
// /compare/push-step2-row-detail and its siblings — delete once a
// direction is picked).
//
// Scope: two asks from the 2026-08-13 Granola call ("Survey design and
// email template configuration for course evaluation", Vishal):
//   1. The shipped Evaluates column/card (courses-evaluatees/
//      step-survey-instances.tsx EvaluateeChipCluster + EvaluateeRoster)
//      shows role TYPE only (Instructor/Coordinator), never names — a
//      deliberate 2026-08-06 decision (Monil, Course Eval sync up: "that
//      toggle is not on a person, it's on a role... we will not show who
//      the instructors are at this level"). Vishal is now reopening that
//      call and wants to SEE faculty names before deciding — three
//      variants, screenshots only, nothing wired into the real wizard.
//   2. "Is there an example where there are two faculties of type
//      instructor... I want to see how I can add or remove" — the shipped
//      EvaluateeRoster toggles a whole ROLE in/out (onToggleUnits, plural)
//      with no per-person control; onToggleUnit (singular) is threaded
//      through as an accepted-but-unused prop. This demonstrates the
//      person-grain add/remove the underlying engine already supports
//      (expandInstances resolves N people per role via resolveAll) but the
//      shipped UI never exposes.
//
// Both reuse the REAL engine (expandInstances/storyStatusOf) and REAL
// fixture (MOCK_COURSE_OFFERINGS) so screenshots reflect actual data
// shapes, not invented ones. Three demo rows:
//   · DPT-501 (co9)  — Ready, ONE instructor (Patel). Baseline case.
//   · DPT-520 (co14) — Ready, THREE instructors. co14 ships with an empty
//     collaboratorIds (Gap) — there is no multi-instructor Ready row
//     anywhere in the fixture, so this derives a demo copy of the real
//     offering with collaboratorIds/coInstructorIds populated (Patel +
//     Chen + Gomez), same pattern push-step2-row-detail's WANT_CODES
//     selection already uses (pick/shape real rows, never mutate the
//     source arrays). Clean — no survey blocks any of the three.
//   · DPT-510 (co13) — the ONE real multi-instructor row in the fixture,
//     unmodified. Mixed on purpose: Chen is already covered by a Live
//     survey (locked, shows as a dup), Gomez is a late-added co-instructor
//     still open ('new'). Shows the add/remove picker against a row that
//     already has a locked person in it, not just the clean case above.

import { useMemo, useState } from 'react'
import { AvatarInitials, Checkbox, CheckboxLabel } from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { usePce } from '@/components/pce/pce-state'
import {
  MOCK_COURSE_OFFERINGS, MOCK_PROGRAM_TERMS,
  type CourseOffering, type PceInstructor,
} from '@/lib/pce-mock-data'
import { courseLabelOf } from '@/lib/pce-course-readiness'
import { expandInstances, storyStatusOf, type SurveyInstance } from '@/lib/pce-push-validation'
import { initialsOf } from '@/lib/pce-analytics'

export function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

export interface DemoRow {
  offering: CourseOffering
  code: string
  name: string
  fresh: SurveyInstance[]
  gaps: SurveyInstance[]
  dups: SurveyInstance[]
}

/** Same-role instances grouped into ONE unit — matches the shipped
 *  EvaluateeRoster's readyGroups grouping (role-grain toggle, Monil's
 *  2026-08-06 call). Course-material never groups (no person concept). */
export interface RoleGroup {
  key: string
  roleLabel: string
  scope: SurveyInstance['scope']
  instances: SurveyInstance[]
}
export function groupByRole(fresh: SurveyInstance[]): RoleGroup[] {
  const groups: RoleGroup[] = []
  for (const i of fresh) {
    const groupKey = i.scope === 'course' ? i.key : i.roleLabel
    const existing = groups.find(g => g.key === groupKey)
    if (existing) existing.instances.push(i)
    else groups.push({ key: groupKey, roleLabel: i.roleLabel, scope: i.scope, instances: [i] })
  }
  return groups
}

const ROLE_ICON: Record<string, string> = {
  Instructor: 'fa-chalkboard-user',
  Coordinator: 'fa-user-tie',
}
export function roleIcon(roleLabel: string): string {
  return ROLE_ICON[roleLabel] ?? 'fa-user-group'
}

export function useEvaluateeIdentityDemo() {
  const { templates, surveys } = usePce()
  const publishedTemplates = useMemo(() => templates.filter(t => t.status === 'active'), [templates])
  const term = MOCK_PROGRAM_TERMS.find(t => t.season === 'Fall' && t.academicYear === '2026–2027')
  const template = publishedTemplates.find(t => t.courseType === 'any' || t.courseType === 'didactic') ?? publishedTemplates[0] ?? null

  const offerings = useMemo(() => {
    const pool = MOCK_COURSE_OFFERINGS.filter(o => o.termId === term?.id)
    const co9 = pool.find(o => o.id === 'co9')
    const co13 = pool.find(o => o.id === 'co13')
    // Demo-only derivation (2026-08-13) — co14 ships with collaboratorIds: []
    // (a Gap row); no Ready row in the fixture carries 3+ instructors. This
    // never touches MOCK_COURSE_OFFERINGS, only shapes a local copy, same as
    // push-step2-row-detail's WANT_CODES selection does.
    const co14base = pool.find(o => o.id === 'co14')
    // f2/f5 (not f3) as co-instructors — co14's real primaryFacultyId is f3
    // (Williams, resolves as Coordinator); reusing it as an instructor too
    // would double-book one person across two role sections in the demo.
    const co14: CourseOffering | undefined = co14base
      ? { ...co14base, collaboratorIds: ['f1'], coInstructorIds: ['f2', 'f5'] }
      : undefined
    return [co9, co14, co13].filter((o): o is CourseOffering => !!o)
  }, [term?.id])

  const rows: DemoRow[] = useMemo(() => offerings.map(o => {
    const { code, name } = splitLabel(o)
    const instances = template ? expandInstances(o, template, surveys, templates) : []
    return {
      offering: o, code, name,
      fresh: instances.filter(i => i.status === 'new'),
      gaps: instances.filter(i => i.status === 'gap'),
      dups: instances.filter(i => i.status === 'duplicate'),
    }
  }), [offerings, template, surveys, templates])

  const [included, setIncluded] = useState<ReadonlySet<string>>(
    () => new Set(rows.flatMap(r => r.fresh.map(i => i.key)))
  )
  const toggleUnit = (key: string) =>
    setIncluded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })

  return { rows, included, toggleUnit }
}

export { storyStatusOf }
export type { SurveyInstance, PceInstructor, CourseOffering }

/** The add/remove control both new-ask variants share (2026-08-13).
 *
 *  Domain check before building this (Granola 5f6c8679, Aug 4 "Step two
 *  design" call, Monil): faculty ASSOCIATION to a course happens in
 *  Prism — "go to prism and add some instructor... when they come back
 *  and refresh the screen they will now see this state." This step only
 *  decides who, of the people Prism already resolved for a role, gets
 *  EVALUATED. So the "master list" in Vishal's ask isn't a university-wide
 *  people search — it's exactly `instances`, everyone expandInstances
 *  already resolved for this role (Patel/Williams/Kim, or Chen/Gomez on
 *  DPT-510). A per-person Checkbox list over that fixed, already-known set
 *  is the correct control, not a Popover+search — there's no "not on this
 *  course yet" case for this control to add FROM. Someone missing entirely
 *  (zero people in a role) is the separate Gap state — shipped already,
 *  with its own "Add in Prism" link; not reproduced here. Mobbin grounding
 *  for the checklist itself: ClickUp "Manage Timesheet Approvers" and
 *  7shifts "Select employees" (checkbox + avatar + name rows, no search
 *  needed at this list size). */
export function FacultyRosterPicker({
  roleLabel, instances, included, onToggle,
}: {
  roleLabel: string
  /** Every instance Prism resolved for this role on this course — the
   *  fixed roster this control toggles membership within. */
  instances: SurveyInstance[]
  included: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {instances.map(i => {
        const isIn = included.has(i.key)
        return (
          <CheckboxLabel
            key={i.key}
            htmlFor={`roster-${i.key}`}
            className={cn(
              'flex items-center gap-2 rounded-md border border-border px-2 py-1.5 min-w-0 font-normal',
              !isIn && 'text-muted-foreground'
            )}
            style={{ background: 'var(--card)' }}
          >
            <Checkbox id={`roster-${i.key}`} checked={isIn} onCheckedChange={() => onToggle(i.key)} />
            <AvatarInitials initials={initialsOf(i.personName!)} size="sm" className={cn('size-6 shrink-0', !isIn && 'grayscale')} />
            <span className="truncate text-sm flex-1 min-w-0">{i.personName}</span>
            {!isIn && <span className="text-xs shrink-0">Excluded</span>}
          </CheckboxLabel>
        )
      })}
    </div>
  )
}
