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
  Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription, FieldError,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, LocalBanner,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS,
  MOCK_COHORTS, MOCK_FACULTY, MOCK_LMS_ENABLED,
  type CourseOffering,
} from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions } from '@/components/data-table/row-actions'

interface OfferingRow extends Record<string, unknown> {
  id: string
  courseCode: string
  courseName: string
  termName: string
  cohort: string
  primaryFacultyName: string
  collaboratorCount: number
  enrolledCount: number
  status: CourseOffering['status']
  raw: CourseOffering
}

export default function CourseOfferingsPage() {
  const [rows, setRows] = useState<CourseOffering[]>(MOCK_COURSE_OFFERINGS)
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
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  // External hard-filters (term, status) applied OUTSIDE the table — these are scope filters.
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (termFilter !== 'all' && r.termId !== termFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [rows, termFilter, statusFilter])

  const tableRows: OfferingRow[] = useMemo(
    () => filtered.map(r => {
      const course = courseById.get(r.masterCourseId)
      const term = termById.get(r.termId)
      const faculty = facultyById.get(r.primaryFacultyId)
      return {
        id: r.id,
        courseCode: course?.code ?? '—',
        courseName: course?.name ?? '—',
        termName: term?.name ?? '—',
        cohort: r.cohort,
        primaryFacultyName: faculty?.name ?? '—',
        collaboratorCount: r.collaboratorIds.length,
        enrolledCount: r.enrolledCount,
        status: r.status,
        raw: r,
      }
    }),
    [filtered, courseById, termById, facultyById]
  )

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!draft.masterCourseId) next.masterCourseId = 'Choose a master course.'
    if (!draft.termId) next.termId = 'Choose a term.'
    if (!draft.primaryFacultyId) next.primaryFacultyId = 'Choose a primary faculty member.'
    if (draft.enrolledCount < 0) {
      next.enrolledCount = 'Enrolled count cannot be negative.'
    } else if (draft.enrolledCount > 1000) {
      next.enrolledCount = 'Enrolled count must be 1000 or fewer.'
    }
    return next
  }

  function handleSave() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
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
    setErrors({})
    setAddOpen(false)
  }

  function handleAddOpenChange(open: boolean) {
    setAddOpen(open)
    if (!open) setErrors({})
  }

  function handleArchive(id: string) {
    setRows(rows.map(r => r.id === id ? { ...r, status: r.status === 'archived' ? 'active' : 'archived' } : r))
  }

  const columns: ColumnDef<OfferingRow>[] = [
    {
      key: 'courseCode',
      label: 'Course',
      sortable: true,
      width: 220,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs">{row.courseCode}</span>
          <span className="text-xs text-muted-foreground truncate max-w-44">{row.courseName}</span>
        </div>
      ),
    },
    {
      key: 'termName',
      label: 'Term',
      sortable: true,
      width: 140,
      cell: (row) => <span className="text-sm">{row.termName}</span>,
    },
    {
      key: 'cohort',
      label: 'Cohort',
      sortable: true,
      width: 140,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.cohort}</span>,
    },
    {
      key: 'primaryFacultyName',
      label: 'Primary faculty',
      sortable: true,
      width: 200,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{row.primaryFacultyName}</span>
          {row.collaboratorCount > 0 && (
            <span className="text-xs text-muted-foreground">
              +{row.collaboratorCount} collaborator{row.collaboratorCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'enrolledCount',
      label: 'Enrolled',
      sortable: true,
      width: 100,
      cell: (row) => <div className="text-right tabular-nums text-sm">{row.enrolledCount}</div>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 120,
      cell: (row) => <Badge variant="secondary" className="capitalize">{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => (
        <RowActions
          row={row}
          label={`${row.courseCode} ${row.termName}`}
          actions={[
            { label: 'Edit',                  icon: 'fa-pen',                disabled: MOCK_LMS_ENABLED },
            { label: 'Manage collaborators',  icon: 'fa-users'              },
            { label: 'View history',          icon: 'fa-clock-rotate-left'  },
            {
              label: row.status === 'archived' ? 'Reactivate' : 'Archive',
              icon: 'fa-box-archive',
              variant: 'destructive',
              divider: true,
              onClick: () => handleArchive(row.id),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Course Offerings</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-6xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            A course offering is the atomic unit for evaluation per Aarti: <span className="font-mono text-xs">master course × term × cohort × faculty</span>.
            Faculty acts on offerings; master courses are the catalog.
          </p>

          {/* Toolbar — external hard-filters (term, status) + Add. Search is provided by DataTable. */}
          <div className="flex items-center gap-2 flex-wrap">
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

            <div className="flex-1" />

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

          <DataTable<OfferingRow>
            data={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            defaultGroupBy="termName"
          />

          {!MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is OFF. Showing manually-managed list. Toggle in Settings (per workspace ADR-002).
            </p>
          )}

        </div>
      </div>

      {/* Add offering dialog */}
      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add course offering</DialogTitle>
            <DialogDescription>
              An offering combines a master course with a term, cohort, and primary faculty.
              Collaborators can be added later (per Aarti D7 — first-class concept).
            </DialogDescription>
          </DialogHeader>

          {Object.keys(errors).length > 1 && (
            <LocalBanner variant="error" title="Fix the following before saving">
              {Object.keys(errors).length} fields need attention.
            </LocalBanner>
          )}

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="off-course">Master course *</FieldLabel>
              <Select
                value={draft.masterCourseId}
                onValueChange={v => setDraft({ ...draft, masterCourseId: v })}
              >
                <SelectTrigger
                  id="off-course"
                  aria-label="Master course"
                  aria-invalid={!!errors.masterCourseId}
                  aria-describedby={errors.masterCourseId ? 'off-course-error' : 'off-course-desc'}
                >
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
              {errors.masterCourseId ? (
                <FieldError id="off-course-error">{errors.masterCourseId}</FieldError>
              ) : (
                <FieldDescription id="off-course-desc">Manage the catalog under <Link href="/admin/courses" className="underline">Master Courses</Link>.</FieldDescription>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field orientation="vertical">
                <FieldLabel htmlFor="off-term">Term *</FieldLabel>
                <Select
                  value={draft.termId}
                  onValueChange={v => setDraft({ ...draft, termId: v })}
                >
                  <SelectTrigger
                    id="off-term"
                    aria-label="Term"
                    aria-invalid={!!errors.termId}
                    aria-describedby={errors.termId ? 'off-term-error' : undefined}
                  >
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTerms.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.termId && <FieldError id="off-term-error">{errors.termId}</FieldError>}
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
                <SelectTrigger
                  id="off-faculty"
                  aria-label="Primary faculty"
                  aria-invalid={!!errors.primaryFacultyId}
                  aria-describedby={errors.primaryFacultyId ? 'off-faculty-error' : 'off-faculty-desc'}
                >
                  <SelectValue placeholder="Choose faculty…" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_FACULTY.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.primaryFacultyId ? (
                <FieldError id="off-faculty-error">{errors.primaryFacultyId}</FieldError>
              ) : (
                <FieldDescription id="off-faculty-desc">Course Coordinator role per Aarti D6 — full edit access. Collaborators can be added after creation.</FieldDescription>
              )}
            </Field>

            <Field orientation="vertical">
              <FieldLabel htmlFor="off-enrolled">Enrolled count</FieldLabel>
              <Input
                id="off-enrolled"
                type="number"
                min={0}
                max={1000}
                value={draft.enrolledCount || ''}
                onChange={e => setDraft({ ...draft, enrolledCount: parseInt(e.target.value, 10) || 0 })}
                placeholder="0"
                aria-invalid={!!errors.enrolledCount}
                aria-describedby={errors.enrolledCount ? 'off-enrolled-error' : 'off-enrolled-desc'}
              />
              {errors.enrolledCount ? (
                <FieldError id="off-enrolled-error">{errors.enrolledCount}</FieldError>
              ) : (
                <FieldDescription id="off-enrolled-desc">Approximate roster size. Synced from LMS when integration is on.</FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={handleSave}>
              Add offering
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

