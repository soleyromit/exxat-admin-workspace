'use client'
// Hand-roll documented: docs/governance/ds-adoption.md § PCE Documented hand-rolls.
// Static RBAC reference matrix — DS Table primitives used per Table docstring
// ("static doc matrices and small read-only tables"). DataTable rejected:
// cross-tab column model (5 roles × 4 function groups), no sorting/filtering
// needed. Pattern mirrors distribute-wizard/step-report-access.tsx.

import { Fragment, useState } from 'react'
import {
  Table, TableCaption, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Tooltip, TooltipTrigger, TooltipContent,
  Button, Badge, Separator,
  Field, FieldGroup, FieldTitle, FieldDescription,
  Popover, PopoverTrigger, PopoverContent,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@exxatdesignux/ui'
import {
  SURVEY_RBAC_ROLES, SURVEY_RBAC_MATRIX, EVAL_FACULTY_ROLES,
  type SurveyRbacAccess, type SurveyRbacRoleKey, type RbacFacultyRoleMap, type FacultyEvalRoleId,
} from '@/lib/pce-mock-data'

const DERIVED_ROLE_KEYS = ['course-manager', 'instructor'] as const satisfies readonly SurveyRbacRoleKey[]

/** One glyph per SURVEY_RBAC_MATRIX function group — lets a capability list be
 *  scanned by icon before anyone reads the label text. */
export const FUNCTION_GROUP_ICON: Record<string, string> = {
  'program-setup':            'fa-sliders',
  'course-survey-admin':      'fa-bell',
  'view-course-feedback':     'fa-chart-simple',
  'view-instructor-feedback': 'fa-user',
}

export function AccessCell({ access, roleLabel, groupLabel }: { access: SurveyRbacAccess; roleLabel: string; groupLabel: string }) {
  if (access === 'full') {
    return (
      <div className="flex items-center justify-center">
        <i className="fa-solid fa-check text-xs" style={{ color: 'var(--foreground)' }} aria-hidden="true" />
        <span className="sr-only">{`${roleLabel}: full access to ${groupLabel}`}</span>
      </div>
    )
  }
  if (access === 'self') {
    return (
      <div className="flex items-center justify-center gap-1">
        <i className="fa-solid fa-check text-xs" style={{ color: 'var(--foreground)' }} aria-hidden="true" />
        <span className="text-xs font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>self</span>
        <span className="sr-only">{`${roleLabel}: access to own ${groupLabel} only, not other faculty's`}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center">
      <i className="fa-light fa-minus text-xs" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
      <span className="sr-only">{`${roleLabel}: no access to ${groupLabel}`}</span>
    </div>
  )
}

/**
 * Editable faculty-role mapping cell — the "new column" the Sep 1 sync (Vishal)
 * described merging into this same grid, not a separate one: "you're adding a new
 * column here which says faculty roles... in a way you are merging these into this."
 * Compact trigger (count only — role columns are 108px) opens the same
 * Popover+Command searchable checklist as Settings' "Faculty roles to evaluate"
 * control (eval-settings/page.tsx), scaled to Prism's ~40-role catalog.
 */
function FacultyRoleMapCell({ roleKey, selected, onChange }: {
  roleKey: SurveyRbacRoleKey
  selected: FacultyEvalRoleId[]
  onChange: (next: FacultyEvalRoleId[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selectedLabels = EVAL_FACULTY_ROLES.filter(r => selected.includes(r.id)).map(r => r.label)
  const filtered = EVAL_FACULTY_ROLES.filter(r => r.label.toLowerCase().includes(query.toLowerCase()))
  const toggle = (id: FacultyEvalRoleId) =>
    onChange(selected.includes(id) ? selected.filter(r => r !== id) : [...selected, id])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full text-xs font-normal justify-between gap-1"
          aria-label={`Faculty roles mapped to ${roleKey}: ${selectedLabels.join(', ') || 'none'}`}
        >
          <span className="truncate">{selected.length === 0 ? 'None mapped' : `${selected.length} role${selected.length === 1 ? '' : 's'}`}</span>
          <i className="fa-light fa-chevron-down text-2xs shrink-0" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-64 p-0 z-[90]" aria-label="Search faculty roles">
        <Command>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search roles…" />
          <CommandList style={{ maxHeight: 260 }}>
            {filtered.length === 0 ? (
              <CommandEmpty>No roles match &quot;{query}&quot;.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map(r => {
                  const on = selected.includes(r.id)
                  return (
                    <CommandItem
                      key={r.id}
                      value={r.id}
                      onSelect={() => toggle(r.id)}
                      aria-label={on ? `${r.label}, selected` : r.label}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-sm">{r.label}</span>
                      {on && <i className="fa-solid fa-check text-xs text-brand-color" aria-hidden="true" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Canonical "what can this role access" list — same ✓ / self / — vocabulary and
 * function groups as the matrix table above, rendered as a compact vertical list
 * instead of a table column. Single source shared by the Grant role sheet's
 * capability strip and the Assignments tab's role-chip popover (Romit, 2026-09-02:
 * "the chip which has tooltip, need a proper popover... info same as permission
 * matrix") — so those two surfaces can never drift from this table or each other.
 *
 * Structure (Romit, 2026-09-10: "set the content hierarchy better by using proper
 * ds components") — every row is DS Field composition, no hand-rolled flex divs:
 *   FieldGroup (list shell, gap collapsed to 0 so Separator sets the rhythm)
 *     └ Field orientation="horizontal"  → DS's own label-left / content-right row
 *         ├ FieldTitle                  → icon + function name (data-slot=field-label,
 *         │                                which Field horizontal gives flex-auto, so
 *         │                                the trailing state is pushed right without
 *         │                                a justify-between of our own)
 *         └ Badge | FieldDescription     → the access state
 *     └ Separator between rows          → DS hairline; FieldSeparator's -my-2 h-5 shell
 *                                          is tuned for gap-4/5 form sections, too airy
 *                                          at this density.
 *
 * Badge over StatusBadge, deliberately: StatusBadge's semantic variant is tone-driven
 * (success / info / warning / danger / neutral). This is an RBAC surface — "Full access"
 * is not a good outcome the way "Published" is, and tinting it green would visually
 * reward over-granting. The only value-free tone (neutral) is a single style, so it
 * cannot carry a three-step ramp. Badge's structural variants do it with no colour
 * semantics at all: filled (secondary) > outlined (outline) > unchipped muted text.
 */
export function RoleCapabilityList({ role }: { role: SurveyRbacRoleKey | 'none' }) {
  // Collapsed to one line for 'none' — four repeated "no access" rows read as
  // noise where a single stated fact reads as the answer.
  if (role === 'none') {
    return (
      <FieldDescription className="flex items-center gap-2">
        <i className="fa-light fa-circle-minus text-xs shrink-0" aria-hidden="true" />
        No administrative access granted.
      </FieldDescription>
    )
  }
  return (
    <FieldGroup className="gap-0">
      {SURVEY_RBAC_MATRIX.map((group, index) => {
        const access = group.access[role]
        return (
          <Fragment key={group.key}>
            {index > 0 && <Separator />}
            <Field orientation="horizontal" className="py-2 first:pt-0 last:pb-0">
              <FieldTitle>
                <i
                  className={`fa-light ${FUNCTION_GROUP_ICON[group.key]} text-xs w-3.5 text-center shrink-0`}
                  style={{ color: 'var(--muted-foreground)' }}
                  aria-hidden="true"
                />
                {group.label}
              </FieldTitle>
              {access === 'none' ? (
                <FieldDescription className="shrink-0 text-xs">No access</FieldDescription>
              ) : (
                <Badge variant={access === 'full' ? 'secondary' : 'outline'} className="shrink-0">
                  {access === 'full' ? 'Full access' : 'Self only'}
                </Badge>
              )}
            </Field>
          </Fragment>
        )
      })}
    </FieldGroup>
  )
}

export function PermissionsMatrix({ facultyRoleMap, onFacultyRoleMapChange }: {
  facultyRoleMap: RbacFacultyRoleMap
  onFacultyRoleMapChange: (next: RbacFacultyRoleMap) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        What each role can do in the course survey module. Point at the <i className="fa-light fa-circle-info" aria-hidden="true" /> next to a row for the functions it covers.
      </p>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table className="border-separate border-spacing-0" scrollLabel="Course survey permissions matrix">
          <TableCaption className="sr-only">Course survey permissions matrix</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent" style={{ background: 'var(--dt-header-bg)' }}>
              <TableHead
                scope="col"
                className="h-9 px-3 text-xs font-medium border-b border-border"
                style={{ width: 220, color: 'var(--muted-foreground)' }}
              >
                Function
              </TableHead>
              {SURVEY_RBAC_ROLES.map(role => (
                <TableHead
                  key={role.key}
                  scope="col"
                  className="h-9 px-3 text-xs font-medium border-b border-border text-center whitespace-normal"
                  style={{ width: 108, color: 'var(--foreground)' }}
                >
                  {role.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow style={{ background: 'var(--dt-header-bg)' }}>
              <TableHead scope="row" className="h-11 px-3 text-sm font-medium text-left border-b border-border">
                <div className="flex items-center gap-1.5">
                  <span>Faculty roles</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-xs" aria-label="About faculty roles mapping">
                        <i className="fa-light fa-circle-info text-xs" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Course Manager and Instructor are never granted directly. A user gets one automatically when their Prism course-association role is mapped here.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              {SURVEY_RBAC_ROLES.map(role => (
                <TableCell key={role.key} className="h-11 px-2 text-center border-b border-border" style={{ width: 108 }}>
                  {DERIVED_ROLE_KEYS.includes(role.key as typeof DERIVED_ROLE_KEYS[number]) ? (
                    <FacultyRoleMapCell
                      roleKey={role.key}
                      selected={facultyRoleMap[role.key as 'course-manager' | 'instructor']}
                      onChange={next => onFacultyRoleMapChange({ ...facultyRoleMap, [role.key]: next })}
                    />
                  ) : (
                    <i className="fa-light fa-minus text-xs" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
                  )}
                </TableCell>
              ))}
            </TableRow>
            {SURVEY_RBAC_MATRIX.map(group => (
              <TableRow key={group.key}>
                <TableHead scope="row" className="h-11 px-3 text-sm font-medium text-left border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <span>{group.label}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Functions included in ${group.label}`}
                        >
                          <i className="fa-light fa-circle-info text-xs" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs font-medium mb-1">Includes</p>
                        <ul className="text-xs list-disc pl-3 flex flex-col gap-0.5">
                          {group.includes.map(item => <li key={item}>{item}</li>)}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                {SURVEY_RBAC_ROLES.map(role => (
                  <TableCell key={role.key} className="h-11 px-3 text-center border-b border-border" style={{ width: 108 }}>
                    <AccessCell access={group.access[role.key]} roleLabel={role.label} groupLabel={group.label} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        "Self" means the role sees only their own feedback, never another faculty member's. Course Manager and Instructor resolve automatically from the faculty roles mapped above. See the Assignments tab for who currently has each.
      </p>
    </div>
  )
}
