'use client'

import { useMemo } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  LocalBanner,
  Avatar,
  AvatarFallback,
} from '@exxatdesignux/ui'
import {
  MOCK_MASTER_COURSES,
  MOCK_FACULTY,
  type CourseOffering,
  type ProgramTerm,
} from '@/lib/pce-mock-data'
import { usePce } from '@/components/pce/pce-state'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'

const TYPE_LABEL: Record<string, string> = {
  didactic: 'Classroom based',
  clinical: 'Practice based',
  seminar:  'Lab based',
}

interface StepDistributionProps {
  offeringsForTerm: CourseOffering[]
  selectedOfferings: CourseOffering[]
  excludedIds: Set<string>
  selectedTerm: ProgramTerm
  programName?: string
  openDate?: Date
  closeDate?: Date
  onToggleOffering: (id: string) => void
  onSetExcluded: (ids: Set<string>) => void
  onApplyDatesToAll?: (open: Date | undefined, close: Date | undefined) => void
  onBack: () => void
  onNext: () => void
}

type DistRow = {
  id: string
  courseCode: string
  courseName: string
  facultyName: string
  facultyInitials: string
  enrolled: number
  courseType: string
  cohort: string
} & Record<string, unknown>

export function StepDistribution({
  offeringsForTerm,
  selectedOfferings,
  excludedIds,
  selectedTerm,
  programName,
  onToggleOffering,
  onSetExcluded,
  onBack,
  onNext,
}: StepDistributionProps) {
  const { surveys } = usePce()

  // Duplicate CE survey check
  const existingCourseCodes = new Set(
    surveys
      .filter(s =>
        s.surveyType === 'course_evaluation' &&
        s.term === selectedTerm.name &&
        (s.status === 'active' || s.status === 'collecting' || s.status === 'scheduled')
      )
      .map(s => s.courseCode)
  )
  const duplicateOfferings = selectedOfferings.filter(o => {
    const course = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)
    return course && existingCourseCodes.has(course.code)
  })

  const unassignedFacultyCount = offeringsForTerm.filter(
    o => !o.primaryFacultyId || !MOCK_FACULTY.find(f => f.id === o.primaryFacultyId),
  ).length

  const noneSelected = selectedOfferings.length === 0

  const rows = useMemo<DistRow[]>(
    () => offeringsForTerm.map(o => {
      const course = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)
      const fac = MOCK_FACULTY.find(f => f.id === o.primaryFacultyId)
      return {
        id: o.id,
        courseCode: course?.code ?? '—',
        courseName: course?.name ?? '',
        facultyName: fac?.name ?? 'Unassigned faculty',
        facultyInitials: fac?.initials ?? '?',
        enrolled: o.enrolledCount,
        courseType: o.courseType ?? '',
        cohort: o.cohort ?? '',
      }
    }),
    [offeringsForTerm],
  )

  // Select-all across the full term list (filtering is a view).
  const allIds = offeringsForTerm.map(o => o.id)
  const allSelected  = allIds.length > 0 && allIds.every(id => !excludedIds.has(id))
  const someSelected = allIds.some(id => !excludedIds.has(id)) && !allSelected
  const toggleAll = () => onSetExcluded(allSelected ? new Set(allIds) : new Set())

  const typeOptions = useMemo(() => {
    const present = [...new Set(offeringsForTerm.map(o => o.courseType).filter(Boolean))] as string[]
    return present.map(t => ({ value: t, label: TYPE_LABEL[t] ?? t }))
  }, [offeringsForTerm])

  const cohortOptions = useMemo(() => {
    const present = [...new Set(offeringsForTerm.map(o => o.cohort).filter(Boolean))].sort() as string[]
    return present.map(c => ({ value: c, label: c }))
  }, [offeringsForTerm])

  const columns: ColumnDef<DistRow>[] = [
    {
      key: 'include', label: '', width: 44, defaultPin: 'left', lockPin: true,
      header: () => (
        <Checkbox
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={toggleAll}
          aria-label="Select all courses"
        />
      ),
      cell: (row) => (
        <div onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={!excludedIds.has(row.id)}
            onCheckedChange={() => onToggleOffering(row.id)}
            aria-label={`Include ${row.courseCode}`}
          />
        </div>
      ),
    },
    {
      key: 'courseCode', label: 'Course', sortable: true, width: 320,
      cell: (row) => (
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
              {row.facultyInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm truncate">
              <span className="font-semibold">{row.courseCode}</span>{' '}
              <span className="text-muted-foreground">{row.courseName}</span>
            </p>
            <p className="text-xs text-muted-foreground truncate">{row.facultyName} · {row.enrolled} enrolled</p>
          </div>
        </div>
      ),
    },
    {
      key: 'courseType', label: 'Type', sortable: true, width: 150,
      filter: { type: 'select', icon: 'fa-layer-group', operators: ['is', 'is_not'], options: typeOptions },
      cell: (row) => row.courseType
        ? <Badge variant="outline" className="rounded">{TYPE_LABEL[row.courseType] ?? row.courseType}</Badge>
        : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: 'cohort', label: 'Cohort', sortable: true, width: 150,
      filter: { type: 'select', icon: 'fa-users', operators: ['is', 'is_not'], options: cohortOptions },
      cell: (row) => <span className="text-sm text-muted-foreground">{row.cohort || '—'}</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 760 }}>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Courses &amp; access</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {selectedTerm.name} · {selectedTerm.academicYear}{programName ? ` · ${programName}` : ''} · All courses included — uncheck to exclude.
        </p>
      </div>

      {/* Warnings */}
      {duplicateOfferings.length > 0 && (
        <LocalBanner variant="warning">
          {duplicateOfferings.length === 1
            ? `${MOCK_MASTER_COURSES.find(c => c.id === duplicateOfferings[0].masterCourseId)?.code} already has an active survey this term.`
            : `${duplicateOfferings.length} selected courses already have active surveys this term.`
          }{' '}Pushing will create additional survey instances.
        </LocalBanner>
      )}
      {noneSelected && (
        <LocalBanner variant="warning">At least one course must be selected to continue.</LocalBanner>
      )}
      {unassignedFacultyCount > 0 && (
        <LocalBanner variant="info">
          {unassignedFacultyCount} course{unassignedFacultyCount !== 1 ? 's have' : ' has'} no instructor — the Instructor section will be suppressed in those surveys.
        </LocalBanner>
      )}

      {offeringsForTerm.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
          No active course offerings for this term.
        </p>
      ) : (
        // -mx cancels the DataTable's own mx-4/6 so its border aligns with the header above.
        <div className="-mx-4 lg:-mx-6">
          <DataTable<DistRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            searchable
            toolbarSlot={() => (
              <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                {selectedOfferings.length} of {offeringsForTerm.length} selected
              </span>
            )}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-8">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" style={{ fontSize: 22 }} />
                <p className="text-sm text-muted-foreground">No courses match your search or filter</p>
              </div>
            }
          />
        </div>
      )}

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={noneSelected} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>

    </div>
  )
}
