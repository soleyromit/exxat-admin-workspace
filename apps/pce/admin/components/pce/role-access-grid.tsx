'use client'

/**
 * Role Access Grid — role × scope × faculty matrix.
 *
 * Extracted from the former /admin/permissions page so it can be embedded as the
 * 4th section of Central Settings (matching live pce-three IA) while the route
 * redirects here.
 *
 * As of 2026-09-01 both tabs run on the confirmed Course Survey RBAC 5-role
 * model (SurveyRbacRoleKey in lib/pce-mock-data.ts) — the Assignments roster
 * and the Permissions matrix reference the same roles, so a grant made here
 * always maps to a row in the matrix. See lib/pce-mock-data.ts for the model's
 * source (RBAC spreadsheet + Granola transcripts).
 *
 * Assignments tab redesigned 2026-09-01 onto the canonical grouped DataTable
 * (matches directory/students, directory/courses, my-surveys conventions) —
 * replaces the former hand-rolled faculty-card list.
 */

import { useMemo, useState } from 'react'
import {
  Button, Card, CardContent,
  AvatarInitials, PillCell, RowActionsCell, KeyMetrics,
  Popover, PopoverTrigger, PopoverContent,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
  Tooltip, TooltipTrigger, TooltipContent,
  Field, FieldLabel, FieldGroup,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectSeparator,
  Tabs, TabsList, TabsTrigger, TabsTriggerLabel, TabsCountBadge, TabsContent,
  type MetricItem,
} from '@exxatdesignux/ui'
import {
  FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent,
  FloatingSheetPanelHeader, FloatingSheetPanelWorkflowFooter,
} from '@/lib/floating-sheet-panel'
import {
  MOCK_ROLE_ASSIGNMENTS, MOCK_FACULTY, MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS,
  SURVEY_RBAC_ROLES, DEFAULT_RBAC_FACULTY_ROLE_MAP, facultyEvalRole,
  type RoleAssignment, type SurveyRbacRoleKey, type RbacFacultyRoleMap, type MasterCourse,
} from '@/lib/pce-mock-data'
import { resolveTermPositions } from '@/lib/pce-term-metrics'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { PermissionsMatrix, RoleCapabilityList } from '@/components/pce/permissions-matrix'

const ROLE_ICON: Record<SurveyRbacRoleKey | 'none', string> = {
  'super-admin':           'fa-crown',
  'program-admin':         'fa-user-gear',
  'program-admin-limited': 'fa-user-lock',
  'course-manager':        'fa-clipboard-user',
  'instructor':            'fa-chalkboard-user',
  'none':                  'fa-user',
}

/** Roles grantable directly in the "Grant role" sheet — institution/program-wide,
 *  picked once per user. Course Manager / Instructor are deliberately excluded: the
 *  Sep 1 sync confirmed they're never manual grants (see deriveCourseRoleGrants). */
const ADMIN_ROLES: SurveyRbacRoleKey[] = ['super-admin', 'program-admin', 'program-admin-limited']

/** Sentinel for "add this faculty member without an administrative role" — answers
 *  the Sep 1 sync's own open question ("as an admin how can I add a user without a
 *  role... I need your input"). No admin functions; course-level access (if any)
 *  still resolves independently from course association. */
const NO_ADMIN_ROLE = 'none' as const
type GrantRoleValue = SurveyRbacRoleKey | typeof NO_ADMIN_ROLE

const DERIVED_ROLE_KEYS = ['course-manager', 'instructor'] as const

interface GrantRow extends Record<string, unknown> {
  id: string
  facultyId: string
  facultyName: string
  facultyEmail?: string
  facultyInitials: string
  role: SurveyRbacRoleKey | 'none'
  roleLabel: string
  scope: string
  /** Present only when `scope` is a "N courses" summary — the individual course
   *  descriptions behind it, shown in the Scope cell's popover. */
  courseScopes?: string[]
  grantedAt: string
  grantedBy: string
  /** 'manual' = a stored grant (revocable here). 'derived' = computed live from a
   *  course-faculty association — nothing to revoke in this sheet. */
  source: 'manual' | 'derived'
}

/** One faculty member's derived access to a single RBAC role, aggregated across
 *  every current-term course that resolves to it — never one row per course. */
interface DerivedGrant {
  facultyId: string
  role: 'course-manager' | 'instructor'
  offeringIds: string[]
}

/** Offerings that count as "currently teaching" — CURRENT term only (via the
 *  same registrar rule the dashboard uses — resolveTermPositions), not every
 *  non-archived offering ever created, since CourseOffering.status stays
 *  'active' across many simultaneous terms and filtering on it alone grows
 *  unbounded as more terms/academic years are added (Romit, 2026-09-02:
 *  "isn't scalable if i see more terms... added"). Shared by
 *  deriveCourseRoleGrants and the Faculty picker's course-association line
 *  so "currently teaching" means one thing across this file. */
function currentTermActiveOfferings() {
  const positions = resolveTermPositions(MOCK_PROGRAM_TERMS)
  const currentTermIds = new Set(MOCK_PROGRAM_TERMS.filter(t => positions.get(t.id) === 'current').map(t => t.id))
  return MOCK_COURSE_OFFERINGS.filter(o => o.status === 'active' && currentTermIds.has(o.termId))
}

/** Course Manager / Instructor access resolved live from course-faculty associations
 *  + the tenant's faculty-role mapping (Sep 1 sync, Vishal: "when a user logs in, we
 *  get a list of courses they have, we get their associated role, find the RBAC
 *  role").
 *
 *  Aggregated per (faculty, role) — not per (faculty, course) — because the same
 *  person routinely holds one role across several courses in the same term; a flat
 *  row per course doesn't scale as a faculty member's course load grows (Romit,
 *  2026-09-02: "a faculty would have multiple role[s]... the design doesn't work
 *  here"). This is a current-access roster, not a historical log. */
function deriveCourseRoleGrants(facultyRoleMap: RbacFacultyRoleMap): DerivedGrant[] {
  const byKey = new Map<string, DerivedGrant>()
  for (const offering of currentTermActiveOfferings()) {
    // Dedupe — the same person can appear in both collaboratorIds and
    // coInstructorIds (late-added co-instructor); they resolve to one row.
    const facultyIds = [...new Set([offering.primaryFacultyId, ...offering.collaboratorIds, ...(offering.coInstructorIds ?? [])])]
    for (const facultyId of facultyIds) {
      const faculty = MOCK_FACULTY.find(f => f.id === facultyId)
      const evalRole = facultyEvalRole('primary', faculty?.position)
      const rbacRole = DERIVED_ROLE_KEYS.find(key => facultyRoleMap[key].includes(evalRole))
      if (!rbacRole) continue
      const key = `${facultyId}|${rbacRole}`
      const existing = byKey.get(key)
      if (existing) existing.offeringIds.push(offering.id)
      else byKey.set(key, { facultyId, role: rbacRole, offeringIds: [offering.id] })
    }
  }
  return Array.from(byKey.values())
}

/** facultyId → current-term course codes they're on (primary, collaborator, or
 *  co-instructor) — the Faculty picker's course-association line (Romit,
 *  2026-09-10: "see if there is a way to show any courses the faculties are
 *  associated to"). Same current-term-active definition as deriveCourseRoleGrants. */
function facultyCurrentCourseCodes(courseById: Map<string, MasterCourse>): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const offering of currentTermActiveOfferings()) {
    const course = courseById.get(offering.masterCourseId)
    if (!course) continue
    const facultyIds = [...new Set([offering.primaryFacultyId, ...offering.collaboratorIds, ...(offering.coInstructorIds ?? [])])]
    for (const facultyId of facultyIds) {
      const existing = map.get(facultyId)
      if (existing) { if (!existing.includes(course.code)) existing.push(course.code) }
      else map.set(facultyId, [course.code])
    }
  }
  return map
}

const SORTED_FACULTY = [...MOCK_FACULTY].sort((a, b) => a.name.localeCompare(b.name))

/** Searchable, alphabetized Faculty picker — Popover+Command composition (DS has
 *  no Combobox primitive; same pattern as FacultyRoleMapCell in
 *  permissions-matrix.tsx). A plain Select stopped scaling once the roster passed
 *  a couple dozen names (Romit, 2026-09-10: "order by faculty and also, add search
 *  functionality"). Each row's course line answers "who is this, in context"
 *  without leaving the sheet. */
function FacultyCombobox({ value, onChange, courseCodesByFaculty }: {
  value: string
  onChange: (facultyId: string) => void
  courseCodesByFaculty: Map<string, string[]>
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? SORTED_FACULTY.find(f => f.id === value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="perm-faculty"
          variant="outline"
          aria-label={selected ? `Faculty: ${selected.name}` : 'Faculty'}
          className="w-full justify-between font-normal"
          style={{ height: 'var(--control-height)' }}
        >
          <span className={`truncate ${selected ? '' : 'text-muted-foreground'}`}>
            {selected?.name ?? 'Choose faculty…'}
          </span>
          <i className="fa-light fa-chevron-down text-2xs shrink-0" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-[var(--radix-popover-trigger-width)] z-[90]" aria-label="Search faculty">
        <Command>
          <CommandInput placeholder="Search faculty…" />
          <CommandList style={{ maxHeight: 280 }}>
            <CommandEmpty>No faculty match.</CommandEmpty>
            <CommandGroup>
              {SORTED_FACULTY.map(f => {
                const courses = courseCodesByFaculty.get(f.id) ?? []
                const checked = value === f.id
                return (
                  <CommandItem
                    key={f.id}
                    value={f.name}
                    onSelect={() => { onChange(f.id); setOpen(false) }}
                    className="flex items-center gap-2.5"
                  >
                    {/* Check glyph, not a DS Checkbox — Checkbox is a button and
                        would nest inside role="option" (same reasoning as
                        courses-evaluatees/scope-controls.tsx TokenSelect). */}
                    <i className={`fa-solid fa-check text-xs shrink-0 ${checked ? '' : 'opacity-0'}`} aria-hidden="true" />
                    <AvatarInitials initials={f.initials} size="sm" className="h-6 w-6 shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm truncate">{f.name}</span>
                      {/* Cap at 2 + a count, one line — wrapping the full list (tried
                          first) grew rows to 3 uneven lines each and broke the list's
                          scan rhythm (Romit, 2026-09-10: "doesn't look good on a
                          dropdown"). `title` keeps the full list one hover away. */}
                      {courses.length > 0 && (
                        <span
                          className="text-xs text-muted-foreground truncate"
                          title={courses.length > 2 ? courses.join(', ') : undefined}
                        >
                          {courses.slice(0, 2).join(', ')}
                          {courses.length > 2 && ` +${courses.length - 2} more`}
                        </span>
                      )}
                    </div>
                    {checked && <span className="sr-only">, selected</span>}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function RoleAccessGrid() {
  const [rows, setRows] = useState<RoleAssignment[]>(MOCK_ROLE_ASSIGNMENTS)
  const [facultyRoleMap, setFacultyRoleMap] = useState<RbacFacultyRoleMap>(DEFAULT_RBAC_FACULTY_ROLE_MAP)
  const [grantOpen, setGrantOpen] = useState(false)
  const [draft, setDraft] = useState<{ facultyId: string; role: GrantRoleValue }>({
    facultyId: '', role: NO_ADMIN_ROLE,
  })
  const facultyById = useMemo(() => new Map(MOCK_FACULTY.map(f => [f.id, f])), [])
  const offeringById = useMemo(() => new Map(MOCK_COURSE_OFFERINGS.map(o => [o.id, o])), [])
  const courseById = useMemo(() => new Map(MOCK_MASTER_COURSES.map(c => [c.id, c])), [])
  const termById = useMemo(() => new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t])), [])
  const roleByKey = useMemo(() => new Map(SURVEY_RBAC_ROLES.map(r => [r.key, r])), [])
  const facultyCourseCodes = useMemo(() => facultyCurrentCourseCodes(courseById), [courseById])

  function describeScope(scope: string): string {
    if (scope === 'global') return 'All program (global)'
    if (scope === 'none') return '—'
    const offering = offeringById.get(scope)
    if (!offering) return scope
    const course = courseById.get(offering.masterCourseId)
    const term = termById.get(offering.termId)
    return `${course?.code ?? '?'} · ${term?.name ?? '?'}`
  }

  function toGrantRow(a: RoleAssignment): GrantRow {
    const faculty = facultyById.get(a.facultyId)
    return {
      id: a.id,
      facultyId: a.facultyId,
      facultyName: faculty?.name ?? 'Unknown faculty',
      facultyEmail: faculty?.email,
      facultyInitials: faculty?.initials ?? '?',
      role: a.role,
      roleLabel: a.role === 'none' ? 'No administrative role' : (roleByKey.get(a.role)?.label ?? a.role),
      scope: describeScope(a.scope),
      grantedAt: a.grantedAt,
      grantedBy: a.grantedBy,
      source: 'manual',
    }
  }

  function toDerivedGrantRow(g: DerivedGrant): GrantRow {
    const faculty = facultyById.get(g.facultyId)
    const courseScopes = g.offeringIds.map(describeScope)
    return {
      id: `derived-${g.facultyId}-${g.role}`,
      facultyId: g.facultyId,
      facultyName: faculty?.name ?? 'Unknown faculty',
      facultyEmail: faculty?.email,
      facultyInitials: faculty?.initials ?? '?',
      role: g.role,
      roleLabel: roleByKey.get(g.role)?.label ?? g.role,
      scope: courseScopes.length === 1 ? courseScopes[0] : `${courseScopes.length} courses`,
      courseScopes: courseScopes.length > 1 ? courseScopes : undefined,
      grantedAt: '',
      grantedBy: 'Course roster (Prism)',
      source: 'derived',
    }
  }

  const derivedGrants = useMemo(() => deriveCourseRoleGrants(facultyRoleMap), [facultyRoleMap])

  const grantRows: GrantRow[] = useMemo(() => [
    ...rows.map(toGrantRow),
    ...derivedGrants.map(toDerivedGrantRow),
  ], [rows, derivedGrants, facultyById, offeringById, courseById, termById, roleByKey])

  function openGrantSheet(prefillFacultyId = '') {
    setDraft({ facultyId: prefillFacultyId, role: NO_ADMIN_ROLE })
    setGrantOpen(true)
  }

  function handleGrant() {
    if (!draft.facultyId) return
    const newRow: RoleAssignment = {
      id: `ra${rows.length + 1}`,
      facultyId: draft.facultyId,
      role: draft.role,
      scope: draft.role === NO_ADMIN_ROLE ? 'none' : 'global',
      grantedAt: MOCK_PROGRAM_TERMS[0].startDate, grantedBy: 'You (current user)',
    }
    setRows([newRow, ...rows])
    setGrantOpen(false)
  }

  function handleRevoke(id: string) {
    setRows(rows.filter(r => r.id !== id))
  }

  function handleBulkRevoke(ids: Set<string | number>) {
    setRows(rows.filter(r => !ids.has(r.id)))
  }

  const totalGrants = grantRows.length
  const adminCount = rows.filter(r => ADMIN_ROLES.includes(r.role as SurveyRbacRoleKey)).length
  const courseManagerCount = derivedGrants.filter(g => g.role === 'course-manager').length
  const instructorCount = derivedGrants.filter(g => g.role === 'instructor').length

  const kpis: MetricItem[] = [
    { id: 'total',       label: 'Total grants',   value: totalGrants,       delta: '', trend: 'neutral', description: 'Manual grants plus course rosters' },
    { id: 'admin',       label: 'Admins',         value: adminCount,        delta: '', trend: 'neutral', description: 'Super + Program (+ Limited)' },
    { id: 'managers',    label: 'Course managers', value: courseManagerCount, delta: '', trend: 'neutral', description: 'From course rosters, not granted manually' },
    { id: 'instructors', label: 'Instructors',    value: instructorCount,   delta: '', trend: 'neutral', description: 'From course rosters, not granted manually' },
  ]

  const columns: ColumnDef<GrantRow>[] = [
    // Leading checkbox column — required for `selectable` to render checkboxes + bulk bar.
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'facultyName', label: 'Faculty', sortable: true, width: 240,
      cell: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <AvatarInitials initials={row.facultyInitials} size="sm" className="h-8 w-8 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{row.facultyName}</span>
            {row.facultyEmail && (
              <span className="text-xs text-muted-foreground truncate">{row.facultyEmail}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'roleLabel', label: 'Role', sortable: true, width: 190,
      cell: (row) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              aria-label={`What ${row.roleLabel} can access`}
            >
              <PillCell label={row.roleLabel} icon={ROLE_ICON[row.role]} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3" aria-label={`${row.roleLabel} access details`}>
            <p className="text-xs font-medium text-muted-foreground mb-2">What {row.roleLabel} can access</p>
            <RoleCapabilityList role={row.role} />
          </PopoverContent>
        </Popover>
      ),
    },
    {
      key: 'scope', label: 'Scope', sortable: true, width: 200,
      cell: (row) => row.courseScopes ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:bg-transparent hover:text-foreground"
              aria-label={`${row.scope} for ${row.facultyName}, view list`}
            >
              {row.scope}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3" aria-label={`${row.roleLabel} course scope for ${row.facultyName}`}>
            <p className="text-sm font-medium mb-2">{row.roleLabel} on</p>
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {row.courseScopes.map(s => <li key={s}>{s}</li>)}
            </ul>
            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border flex items-center gap-1.5">
              <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" />
              Synced from the Prism course roster — edit assignments there
            </p>
          </PopoverContent>
        </Popover>
      ) : (
        <span className="text-sm text-muted-foreground truncate">{row.scope}</span>
      ),
    },
    {
      key: 'grantedAt', label: 'Granted', sortable: true, width: 120,
      cell: (row) => <span className="text-sm tabular-nums text-muted-foreground">{row.grantedAt || '—'}</span>,
    },
    {
      key: 'grantedBy', label: 'Granted by', sortable: true, width: 180,
      cell: (row) => <span className="text-sm text-muted-foreground truncate">{row.grantedBy}</span>,
    },
    {
      key: 'actions', label: '', width: 44,
      cell: (row) => row.source === 'derived' ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${row.roleLabel} for ${row.facultyName} is synced from Prism`}
            >
              <i className="fa-light fa-circle-info text-muted-foreground" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Synced from Prism — no manual actions here</TooltipContent>
        </Tooltip>
      ) : (
        <RowActionsCell<GrantRow>
          row={row}
          triggerLabel={`Actions for ${row.roleLabel} · ${row.facultyName}`}
          actions={[
            {
              label: `Grant another role to ${row.facultyName}`,
              icon: 'fa-plus',
              onSelect: (r) => openGrantSheet(r.facultyId),
            },
            {
              label: 'Revoke this grant',
              icon: 'fa-trash',
              variant: 'destructive',
              onSelect: (r) => handleRevoke(r.id),
            },
          ]}
        />
      ),
    },
  ]

  const draftRoleMeta = draft.role === NO_ADMIN_ROLE ? undefined : roleByKey.get(draft.role)

  return (
    <>
    <Card>
      <CardContent className="flex flex-col gap-4">
        <Tabs defaultValue="assignments" className="flex flex-col gap-4">
          <TabsList variant="line" ariaLabel="Role & access views">
            <TabsTrigger value="assignments">
              <TabsTriggerLabel>Assignments</TabsTriggerLabel>
              <TabsCountBadge count={totalGrants} />
            </TabsTrigger>
            <TabsTrigger value="matrix">
              <TabsTriggerLabel>Permissions matrix</TabsTriggerLabel>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix">
            <PermissionsMatrix facultyRoleMap={facultyRoleMap} onFacultyRoleMapChange={setFacultyRoleMap} />
          </TabsContent>

          <TabsContent value="assignments" className="flex flex-col gap-4">
            <KeyMetrics variant="compact" size="sm" showHeader={false} metricsSingleRow metrics={kpis} />

            <div className="flex items-center justify-end">
              <Button variant="default" onClick={() => openGrantSheet()}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Grant role
              </Button>
            </div>

            <DataTable<GrantRow>
              data={grantRows}
              columns={columns}
              getRowId={(row) => row.id}
              getRowSelectionLabel={(row) => `${row.roleLabel} for ${row.facultyName}`}
              isRowSelectable={(row) => row.source !== 'derived'}
              selectable
              searchable
              defaultGroupBy="facultyName"
              bulkActionsSlot={(selected) => (
                <Button
                  variant="destructive" size="sm" className="h-7 text-xs"
                  onClick={() => handleBulkRevoke(selected)}
                >
                  <i className="fa-light fa-trash" aria-hidden="true" />
                  Revoke {selected.size} grant{selected.size === 1 ? '' : 's'}
                </Button>
              )}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-6">
                  <i className="fa-light fa-user-shield text-muted-foreground text-2xl" aria-hidden="true" />
                  <p className="text-sm font-medium">No role grants to show</p>
                </div>
              }
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

      {/* Grant role sheet — administrative roles only (SURVEY_RBAC_ROLES minus
          Course Manager/Instructor). Sep 1 sync, Vishal, verbatim: "you cannot
          select course manager [when adding a user]... these are decided based
          on the associations" — that access resolves live from course-faculty
          data (deriveCourseRoleGrants above), never a manual grant here.
          FloatingSheetPanel only — never the raw Sheet primitive (exxat-overlays).

          Every <SelectContent> here gets `z-[90]`: FloatingSheetPanelContent
          renders at `z-[80]` (floating-sheet-panel.js:158), but DS Select's
          popper content is hardcoded `z-50` (select.js:74) — the same tier
          the raw Sheet primitive uses (sheet.js:164), which is why a Select
          works fine inside a raw Sheet (equal z-index, DOM order wins) but
          renders fully invisible inside a FloatingSheetPanel (z-80 always
          wins over z-50, popper buried under the panel's own background —
          confirmed via DOM/paint inspection: the dropdown exists, is
          correctly positioned, and is even clickable at its true
          coordinates, just never visually painted). This is a DS package
          defect (@exxatdesignux/ui), not something fixable in this file
          beyond overriding the affected instances — the DS's own internal
          size-menu dropdown hits the identical problem and is fixed the
          same way (floating-sheet-panel.js:205, `className: "z-[90]"`).
          Flag to Himanshu: every Radix popover-family component (Select,
          Popover, Combobox, DropdownMenu, DatePicker, Tooltip) needs a
          z-index above 80 — or FloatingSheetPanel needs a lower one — to be
          usable inside a FloatingSheetPanel anywhere in the product. */}
      <FloatingSheetPanel open={grantOpen} onOpenChange={setGrantOpen}>
        <FloatingSheetPanelContent contentSlot="grant-role-sheet">
          {/* No header description (Romit, 2026-09-10: "remove extra text, if its not
              required under grant role"). Its only real payload was "why aren't Course
              Manager and Instructor in the dropdown" — a question that occurs at the
              dropdown, not at the title, and only to the reader who goes looking for
              those roles. It now lives on-demand in the info tooltip beside the
              "Administrative role" label, the same affordance PermissionsMatrix uses
              for the identical caveat, so it costs no permanent vertical space. */}
          <FloatingSheetPanelHeader
            title="Grant role"
            onClose={() => setGrantOpen(false)}
          />

          <form
            id="grant-role-form"
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={event => { event.preventDefault(); handleGrant() }}
          >
            <FloatingSheetPanelBody className="gap-4 px-4 pb-4">
              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="perm-faculty">Faculty *</FieldLabel>
                  <FacultyCombobox
                    value={draft.facultyId}
                    onChange={facultyId => setDraft(d => ({ ...d, facultyId }))}
                    courseCodesByFaculty={facultyCourseCodes}
                  />
                </Field>

                <Field orientation="vertical">
                  {/* The Course Manager / Instructor caveat lives here, on demand —
                      same info-icon + Tooltip affordance as PermissionsMatrix's
                      "Faculty roles" row. It answers the one question this field
                      raises ("where are the other two roles?") at the point it is
                      raised, and it absorbs what the removed FieldDescription said
                      about the "No administrative role" case, so one tooltip
                      replaces two permanent paragraphs. */}
                  {/* h-5 pins this row to the label's own line height: the icon-xs
                      Button is 24px and would otherwise push the Select 2px further
                      down than the Faculty field's Select above it. The button still
                      renders and hit-tests at its full size, just centred on the text. */}
                  <div className="flex h-5 items-center gap-1.5">
                    <FieldLabel htmlFor="perm-role">Administrative role *</FieldLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon-xs" aria-label="Why Course Manager and Instructor are not listed">
                          <i className="fa-light fa-circle-info text-xs" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="z-[90] max-w-xs">
                        Course Manager and Instructor are not granted here. Those roles resolve automatically from a faculty member&apos;s course associations.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={draft.role} onValueChange={v => setDraft(d => ({ ...d, role: v as GrantRoleValue }))}>
                    <SelectTrigger id="perm-role" aria-label="Administrative role" aria-required="true"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[90]">
                      <SelectItem value={NO_ADMIN_ROLE}>No administrative role</SelectItem>
                      <SelectSeparator />
                      {SURVEY_RBAC_ROLES.filter(r => ADMIN_ROLES.includes(r.key)).map(r => (
                        <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Per-role FieldDescription dropped (Romit, 2026-09-10: "remove...
                      placeholder text under role dropdown"). draftRoleMeta.description
                      only restated the role name in a sentence ("Program Admin Limited...
                      within their program") — the capability list below already answers
                      "what does this role do" concretely, per function, so the paragraph
                      was a third telling of the same fact. The NO_ADMIN_ROLE branch's
                      automatic-resolution note moved into the label tooltip above. */}
                </Field>

                {/* Scope dropped as its own field (Romit, 2026-09-10: "not clear how
                    scope program-wide helps") — it never held new information, only
                    restated a word ("Program-wide") from the role description directly
                    above it ("...within their program"), and the badge didn't explain
                    what that scope actually changes. The description already carries it
                    in plain language; a separate field just repeated the same fact twice. */}

                {/* Capability strip — scoped to the selected role, via the shared
                    RoleCapabilityList (permissions-matrix.tsx) so this sheet, the
                    Assignments tab's role-chip popover, and the matrix table can
                    never drift from one another. "No administrative role" reads as
                    all-none here — this strip covers admin/content functions
                    only, not the separate course-association access that may
                    still resolve for this faculty member. */}
                <Field orientation="vertical">
                  {/* Decorative info glyph removed: it carried no tooltip, and the
                      identical glyph two fields above is now a real affordance —
                      one that does nothing beside one that does reads as broken. */}
                  <FieldLabel className="text-xs text-muted-foreground">
                    What {draft.role === NO_ADMIN_ROLE ? 'this user' : draftRoleMeta?.label} can access
                  </FieldLabel>
                  <RoleCapabilityList role={draft.role} />
                </Field>
              </FieldGroup>
            </FloatingSheetPanelBody>

            <FloatingSheetPanelWorkflowFooter
              onCancel={() => setGrantOpen(false)}
              primaryLabel={draft.role === NO_ADMIN_ROLE ? 'Add without a role' : 'Grant role'}
              primaryForm="grant-role-form"
              onPrimary={handleGrant}
              primaryDisabled={!draft.facultyId}
              primaryIconClassName="fa-light fa-user-plus text-xs"
            />
          </form>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </>
  )
}
