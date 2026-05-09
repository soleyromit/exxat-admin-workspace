'use client'

/**
 * Admin · Course Offerings (UC-19, workspace ADR-001 entity #3).
 *
 * Per Aarti 2026-05-08 16:09 D3: course offering = `master course × term ×
 * cohort × faculty` — the ATOMIC UNIT for evaluation. All eval data, all
 * trend analysis, all faculty-rating analysis ties back to this 4-tuple.
 *
 * This is what faculty actually act on (vs master courses which are just
 * the catalog).
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Input,
  InputGroup,
  InputGroupAddon,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS,
  MOCK_COHORTS, MOCK_FACULTY, MOCK_LMS_ENABLED,
  type CourseOffering,
} from '@/lib/pce-mock-data'

export default function CourseOfferingsPage() {
  const [rows, setRows] = useState<CourseOffering[]>(MOCK_COURSE_OFFERINGS)
  const [search, setSearch] = useState('')
  const [termFilter, setTermFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({
    masterCourseId: '',
    termId: '',
    cohort: MOCK_COHORTS[0],
    primaryFacultyId: '',
    enrolledCount: 0,
  })

  // Active master courses + active terms only (offerings can't be made on archived)
  const activeMasterCourses = useMemo(
    () => MOCK_MASTER_COURSES.filter(c => c.status === 'active'),
    []
  )
  const activeTerms = useMemo(
    () => MOCK_PROGRAM_TERMS.filter(t => t.status === 'active'),
    []
  )

  // Lookups for table rendering
  const courseById = useMemo(
    () => new Map(MOCK_MASTER_COURSES.map(c => [c.id, c])),
    []
  )
  const termById = useMemo(
    () => new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t])),
    []
  )
  const facultyById = useMemo(
    () => new Map(MOCK_FACULTY.map(f => [f.id, f])),
    []
  )

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (termFilter !== 'all' && r.termId !== termFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      const course = courseById.get(r.masterCourseId)
      const faculty = facultyById.get(r.primaryFacultyId)
      return (
        course?.code.toLowerCase().includes(q) ||
        course?.name.toLowerCase().includes(q) ||
        faculty?.name.toLowerCase().includes(q) ||
        r.cohort.toLowerCase().includes(q)
      )
    })
  }, [rows, search, termFilter, statusFilter, courseById, facultyById])

  function handleSave() {
    if (!draft.masterCourseId || !draft.termId || !draft.primaryFacultyId) return
    const newRow: CourseOffering = {
      id: `co${Date.now()}`,
      masterCourseId: draft.masterCourseId,
      termId: draft.termId,
      cohort: draft.cohort,
      primaryFacultyId: draft.primaryFacultyId,
      collaboratorIds: [],
      enrolledCount: draft.enrolledCount,
      status: 'planned',
    }
    setRows([newRow, ...rows])
    setDraft({
      masterCourseId: '',
      termId: '',
      cohort: MOCK_COHORTS[0],
      primaryFacultyId: '',
      enrolledCount: 0,
    })
    setAddOpen(false)
  }

  function handleArchive(id: string) {
    setRows(rows.map(r => r.id === id ? { ...r, status: r.status === 'archived' ? 'active' : 'archived' } : r))
  }

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold flex-1 truncate">Course Offerings</span>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-6xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            A course offering is the atomic unit for evaluation per Aarti: <span className="font-mono text-xs">master course × term × cohort × faculty</span>.
            Faculty acts on offerings; master courses are the catalog.
          </p>

          {/* Toolbar — search + filters + Add + Import */}
          <div className="flex items-center gap-2 flex-wrap">
            <InputGroup className="flex-1 max-w-sm min-w-[180px]">
              <Input
                placeholder="Search by course, faculty, cohort…"
                aria-label="Search course offerings"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>

            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by term">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All terms</SelectItem>
                {MOCK_PROGRAM_TERMS.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {MOCK_LMS_ENABLED ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" disabled aria-disabled="true">
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add offering
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Managed by your LMS</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="default" onClick={() => setAddOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add offering
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Cohort</TableHead>
                  <TableHead>Primary faculty</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <p className="text-sm font-medium">
                          {search || termFilter !== 'all' || statusFilter !== 'all'
                            ? 'No offerings match these filters'
                            : 'No course offerings yet'}
                        </p>
                        {!search && termFilter === 'all' && statusFilter === 'all' && !MOCK_LMS_ENABLED && (
                          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                            <i className="fa-light fa-plus" aria-hidden="true" />
                            Add your first offering
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(row => {
                    const course = courseById.get(row.masterCourseId)
                    const term = termById.get(row.termId)
                    const faculty = facultyById.get(row.primaryFacultyId)
                    const collaboratorCount = row.collaboratorIds.length
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs">{course?.code ?? '—'}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-44">{course?.name ?? '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell><span className="text-sm">{term?.name ?? '—'}</span></TableCell>
                        <TableCell><span className="text-sm text-muted-foreground">{row.cohort}</span></TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{faculty?.name ?? '—'}</span>
                            {collaboratorCount > 0 && (
                              <span className="text-xs text-muted-foreground">+{collaboratorCount} collaborator{collaboratorCount === 1 ? '' : 's'}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><span className="tabular-nums text-sm">{row.enrolledCount}</span></TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{row.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${course?.code} ${term?.name}`}>
                                <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem disabled={MOCK_LMS_ENABLED}>
                                <i className="fa-light fa-pen" aria-hidden="true" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <i className="fa-light fa-users" aria-hidden="true" />
                                Manage collaborators
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <i className="fa-light fa-clock-rotate-left" aria-hidden="true" />
                                View history
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleArchive(row.id)}
                              >
                                <i className="fa-light fa-box-archive" aria-hidden="true" />
                                {row.status === 'archived' ? 'Reactivate' : 'Archive'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is OFF. Showing manually-managed list. Toggle in Settings (per workspace ADR-002).
            </p>
          )}

        </div>
      </main>

      {/* Add offering dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add course offering</DialogTitle>
            <DialogDescription>
              An offering combines a master course with a term, cohort, and primary faculty.
              Collaborators can be added later (per Aarti D7 — first-class concept).
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="off-course">Master course *</FieldLabel>
              <Select
                value={draft.masterCourseId}
                onValueChange={v => setDraft({ ...draft, masterCourseId: v })}
              >
                <SelectTrigger id="off-course" aria-label="Master course">
                  <SelectValue placeholder="Choose a course…" />
                </SelectTrigger>
                <SelectContent>
                  {activeMasterCourses.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Manage the catalog under <Link href="/admin/courses" className="underline">Master Courses</Link>.</FieldDescription>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field orientation="vertical">
                <FieldLabel htmlFor="off-term">Term *</FieldLabel>
                <Select
                  value={draft.termId}
                  onValueChange={v => setDraft({ ...draft, termId: v })}
                >
                  <SelectTrigger id="off-term" aria-label="Term">
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTerms.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field orientation="vertical">
                <FieldLabel htmlFor="off-cohort">Cohort *</FieldLabel>
                <Select
                  value={draft.cohort}
                  onValueChange={v => setDraft({ ...draft, cohort: v })}
                >
                  <SelectTrigger id="off-cohort" aria-label="Cohort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_COHORTS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field orientation="vertical">
              <FieldLabel htmlFor="off-faculty">Primary faculty *</FieldLabel>
              <Select
                value={draft.primaryFacultyId}
                onValueChange={v => setDraft({ ...draft, primaryFacultyId: v })}
              >
                <SelectTrigger id="off-faculty" aria-label="Primary faculty">
                  <SelectValue placeholder="Choose faculty…" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_FACULTY.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Course Coordinator role per Aarti D6 — full edit access. Collaborators can be added after creation.</FieldDescription>
            </Field>

            <Field orientation="vertical">
              <FieldLabel htmlFor="off-enrolled">Enrolled count</FieldLabel>
              <Input
                id="off-enrolled"
                type="number"
                min={0}
                value={draft.enrolledCount || ''}
                onChange={e => setDraft({ ...draft, enrolledCount: parseInt(e.target.value, 10) || 0 })}
                placeholder="0"
              />
              <FieldDescription>Approximate roster size. Synced from LMS when integration is on.</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={!draft.masterCourseId || !draft.termId || !draft.primaryFacultyId}
            >
              Add offering
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
