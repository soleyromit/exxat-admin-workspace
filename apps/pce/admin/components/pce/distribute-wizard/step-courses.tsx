'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Badge, Button } from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'

interface CourseRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  cohort: string
  term: string
  academicYear: string
  enrolled: number
  typeLabel: string
}

interface StepCoursesProps {
  selectedCourseIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onNext: () => void
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

export function StepCourses({ selectedCourseIds, onSelectionChange, onNext }: StepCoursesProps) {
  const rows = useMemo<CourseRow[]>(() => {
    return MOCK_COURSE_OFFERINGS
      .filter(o => o.status !== 'archived')
      .map(o => {
        const mc = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)
        const term = MOCK_PROGRAM_TERMS.find(t => t.id === o.termId)
        return {
          id: o.id,
          code: mc?.code ?? o.id,
          name: mc?.name ?? '',
          cohort: o.cohort,
          term: term?.name ?? '',
          academicYear: term?.academicYear ?? '',
          enrolled: o.enrolledCount,
          typeLabel: o.courseType === 'clinical' ? 'Clinical' : 'Classroom',
        }
      })
  }, [])

  const columns = useMemo<ColumnDef<CourseRow>[]>(() => {
    const opt = (vals: string[]) => vals.map(v => ({ value: v, label: v }))
    return [
      { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
      { key: 'code', label: 'Code', sortable: true, width: 110,
        cell: (r: CourseRow) => <span className="font-mono text-xs font-semibold">{r.code}</span> },
      { key: 'name', label: 'Course', sortable: true, width: 300 },
      { key: 'cohort', label: 'Cohort', sortable: true, width: 140,
        filter: { type: 'select', icon: 'fa-users', options: opt(uniq(rows.map(r => r.cohort))) } },
      { key: 'term', label: 'Term', sortable: true, width: 130,
        filter: { type: 'select', icon: 'fa-calendar', options: opt(uniq(rows.map(r => r.term))) } },
      { key: 'academicYear', label: 'Academic year', sortable: true, width: 150,
        filter: { type: 'select', icon: 'fa-graduation-cap', options: opt(uniq(rows.map(r => r.academicYear))) } },
      { key: 'enrolled', label: 'Students', sortable: true, width: 100,
        cell: (r: CourseRow) => <span className="tabular-nums">{r.enrolled}</span> },
      { key: 'typeLabel', label: 'Type', sortable: true, width: 120,
        filter: { type: 'select', icon: 'fa-shapes', options: opt(['Classroom', 'Clinical']) },
        cell: (r: CourseRow) => <Badge variant="secondary" className="font-normal">{r.typeLabel}</Badge> },
    ]
  }, [rows])

  const tableState = useTableState<CourseRow>(rows, columns)
  const { selected, setSelected } = tableState

  // Seed selection from the wizard once, then push changes back up.
  const seeded = useRef(false)
  useEffect(() => {
    if (!seeded.current) { setSelected(new Set(selectedCourseIds)); seeded.current = true }
  }, [selectedCourseIds, setSelected])
  useEffect(() => {
    if (seeded.current) onSelectionChange(new Set([...selected].map(String)))
  }, [selected, onSelectionChange])

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 980 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Courses</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Filter and choose the courses whose students receive this survey.
        </p>
      </div>

      <DataTable<CourseRow>
        data={rows}
        columns={columns}
        state={tableState}
        getRowId={(r) => r.id}
        selectable
        searchable
        hideBulkActions
        emptyState={
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <i className="fa-light fa-book-open text-lg" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-medium">No courses available</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>There are no active course offerings to choose from.</p>
          </div>
        }
      />

      <div className="border-t border-border pt-4 flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {selected.size} course{selected.size !== 1 ? 's' : ''} selected
        </span>
        <Button variant="default" size="sm" disabled={selected.size === 0} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
