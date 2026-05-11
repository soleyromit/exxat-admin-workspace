'use client'

/**
 * Admin · Permissions (UC-19, workspace ADR-001 entity #6).
 *
 * Per Aarti 2026-05-08 16:09 D6 + D7:
 *   - 3 view tiers: admin / faculty / student
 *   - 2 faculty sub-roles at course level: Course Coordinator + Instructor
 *   - Collaborator pattern (read-only / co-edit) on specific offerings
 *
 * Different UI shape than other entity lists — this is a role × scope matrix
 * grouped by faculty. Each faculty card shows their assignments across global
 * + per-offering scopes.
 *
 * Phase 1 ships: role assignment view + grant/revoke. Granular per-resource
 * permission editing is Phase 2 (depends on Vishaka R7 — permissions matrix
 * definition).
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, InputGroup, InputGroupAddon,
  Badge, Avatar, AvatarFallback,
  Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_ROLE_ASSIGNMENTS, MOCK_FACULTY, MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS,
  ROLE_LABELS, ROLE_DESCRIPTIONS,
  type RoleAssignment, type RoleKey, type PceInstructor,
} from '@/lib/pce-mock-data'
import { RowActions } from '@/components/data-table/row-actions'

const ROLE_BADGE_VARIANT: Record<RoleKey, 'default' | 'secondary' | 'outline'> = {
  'admin':                 'default',
  'course-coordinator':    'secondary',
  'instructor':            'secondary',
  'collaborator-readonly': 'outline',
  'collaborator-edit':     'outline',
}

function initials(name: string): string {
  const parts = name.replace(/^Dr\.\s*/i, '').split(' ')
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

export default function PermissionsPage() {
  const [rows, setRows] = useState<RoleAssignment[]>(MOCK_ROLE_ASSIGNMENTS)
  const [search, setSearch] = useState('')
  const [grantOpen, setGrantOpen] = useState(false)
  const [draft, setDraft] = useState<{ facultyId: string; role: RoleKey; scope: string }>({
    facultyId: '',
    role: 'instructor',
    scope: 'global',
  })

  // Lookups
  const facultyById = useMemo(() => new Map(MOCK_FACULTY.map(f => [f.id, f])), [])
  const offeringById = useMemo(() => new Map(MOCK_COURSE_OFFERINGS.map(o => [o.id, o])), [])
  const courseById = useMemo(() => new Map(MOCK_MASTER_COURSES.map(c => [c.id, c])), [])
  const termById = useMemo(() => new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t])), [])

  // Group assignments by faculty
  const assignmentsByFaculty = useMemo(() => {
    const m = new Map<string, RoleAssignment[]>()
    for (const r of rows) {
      const list = m.get(r.facultyId) ?? []
      list.push(r)
      m.set(r.facultyId, list)
    }
    return m
  }, [rows])

  const filteredFaculty = useMemo(() => {
    const q = search.trim().toLowerCase()
    return MOCK_FACULTY.filter(f => {
      if (!q) return true
      if (f.name.toLowerCase().includes(q)) return true
      // Also match by role label assigned to this faculty
      const assignments = assignmentsByFaculty.get(f.id) ?? []
      return assignments.some(a => ROLE_LABELS[a.role].toLowerCase().includes(q))
    })
  }, [search, assignmentsByFaculty])

  function describeScope(scope: string): string {
    if (scope === 'global') return 'All program (global)'
    const offering = offeringById.get(scope)
    if (!offering) return scope
    const course = courseById.get(offering.masterCourseId)
    const term = termById.get(offering.termId)
    return `${course?.code ?? '?'} · ${term?.name ?? '?'}`
  }

  function handleGrant() {
    if (!draft.facultyId || !draft.role) return
    const newRow: RoleAssignment = {
      id: `ra${Date.now()}`,
      facultyId: draft.facultyId,
      role: draft.role,
      scope: draft.scope,
      grantedAt: new Date().toISOString().slice(0, 10),
      grantedBy: 'You (current user)',
    }
    setRows([newRow, ...rows])
    setDraft({ facultyId: '', role: 'instructor', scope: 'global' })
    setGrantOpen(false)
  }

  function handleRevoke(id: string) {
    setRows(rows.filter(r => r.id !== id))
  }

  const totalGrants = rows.length
  const adminCount = rows.filter(r => r.role === 'admin').length
  const courseCoordinatorCount = rows.filter(r => r.role === 'course-coordinator').length
  const collaboratorCount = rows.filter(r => r.role.startsWith('collaborator')).length

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Permissions</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            {totalGrants} grants · {adminCount} admin · {courseCoordinatorCount} course coordinators · {collaboratorCount} collaborators.
            Per workspace ADR-004, Phase 1 collapses to 3 view tiers (admin / faculty / student). Faculty has 2 sub-roles + collaborator pattern per Aarti D6/D7. Granular per-resource permissions land in Phase 2 (pending Vishaka R7).
          </p>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <InputGroup className="flex-1 max-w-sm min-w-[200px]">
              <Input
                placeholder="Search by name or role…"
                aria-label="Search permissions"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>

            <Button variant="default" onClick={() => setGrantOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Grant role
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" disabled aria-disabled="true">
                  <i className="fa-light fa-table" aria-hidden="true" />
                  Permissions matrix
                </Button>
              </TooltipTrigger>
              <TooltipContent>Phase 2 — pending Vishaka R7 (permissions matrix definition)</TooltipContent>
            </Tooltip>
          </div>

          {/* Faculty cards — each shows their grants */}
          <div className="flex flex-col gap-3">
            {filteredFaculty.length === 0 ? (
              <div className="border border-border rounded-lg p-10 text-center">
                <p className="text-sm font-medium">
                  {search ? `No faculty match "${search}"` : 'No faculty yet'}
                </p>
              </div>
            ) : (
              filteredFaculty.map(faculty => {
                const assignments = assignmentsByFaculty.get(faculty.id) ?? []
                if (assignments.length === 0 && search) return null  // filter out unmatched
                return (
                  <article
                    key={faculty.id}
                    className="border border-border rounded-lg p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-full shrink-0">
                        <AvatarFallback
                          className="rounded-full text-sm font-semibold"
                          style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                        >
                          {initials(faculty.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{faculty.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignments.length} grant{assignments.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <RowActions<PceInstructor>
                        row={faculty}
                        label={faculty.name}
                        contentClassName="w-52"
                        actions={[
                          {
                            label:   'Grant new role',
                            icon:    'fa-plus',
                            onClick: (f) => { setDraft({ ...draft, facultyId: f.id }); setGrantOpen(true) },
                          },
                          { label: 'View grant history', icon: 'fa-clock-rotate-left' },
                        ]}
                      />
                    </div>

                    {assignments.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No active grants. Faculty has no module access.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {assignments.map(a => (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-md"
                            style={{ backgroundColor: 'var(--muted)' }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant={ROLE_BADGE_VARIANT[a.role]} className="shrink-0 cursor-help">
                                  {ROLE_LABELS[a.role]}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">{ROLE_DESCRIPTIONS[a.role]}</TooltipContent>
                            </Tooltip>
                            <span className="text-xs text-muted-foreground flex-1 truncate">
                              {describeScope(a.scope)}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:inline">
                              {a.grantedAt}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Revoke ${ROLE_LABELS[a.role]} on ${describeScope(a.scope)}`}
                              onClick={() => handleRevoke(a.id)}
                            >
                              <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
            Per Aarti 2026-05-08, faculty cannot add courses or alter master-list entities — only Admin can. Faculty can add Collaborators on courses they coordinate, but only if Admin granted that capability.
          </p>

        </div>
      </div>

      {/* Grant role dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant role</DialogTitle>
            <DialogDescription>
              Assign a faculty member to a role with the specified scope. Admin and Course Coordinator are the load-bearing assignments; Collaborator grants are made by Course Coordinators on their assigned offerings.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="perm-faculty">Faculty *</FieldLabel>
              <Select value={draft.facultyId} onValueChange={v => setDraft({ ...draft, facultyId: v })}>
                <SelectTrigger id="perm-faculty" aria-label="Faculty">
                  <SelectValue placeholder="Choose faculty…" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_FACULTY.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field orientation="vertical">
              <FieldLabel htmlFor="perm-role">Role *</FieldLabel>
              <Select value={draft.role} onValueChange={v => setDraft({ ...draft, role: v as RoleKey })}>
                <SelectTrigger id="perm-role" aria-label="Role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as RoleKey[]).map(r => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{ROLE_DESCRIPTIONS[draft.role]}</FieldDescription>
            </Field>

            <Field orientation="vertical">
              <FieldLabel htmlFor="perm-scope">Scope *</FieldLabel>
              <Select value={draft.scope} onValueChange={v => setDraft({ ...draft, scope: v })}>
                <SelectTrigger id="perm-scope" aria-label="Scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">All program (global)</SelectItem>
                  {MOCK_COURSE_OFFERINGS.filter(o => o.status !== 'archived').map(o => {
                    const c = MOCK_MASTER_COURSES.find(mc => mc.id === o.masterCourseId)
                    const t = MOCK_PROGRAM_TERMS.find(pt => pt.id === o.termId)
                    return (
                      <SelectItem key={o.id} value={o.id}>
                        {c?.code} · {t?.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <FieldDescription>Admin grants are typically global. Course Coordinator + Instructor + Collaborator grants are scoped to a specific offering.</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={handleGrant} disabled={!draft.facultyId || !draft.role}>
              Grant role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
