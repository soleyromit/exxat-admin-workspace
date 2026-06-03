'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  Input,
  LocalBanner,
  Avatar,
  AvatarFallback,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  ViewSegmentedControl,
} from '@exxatdesignux/ui'
import {
  MOCK_MASTER_COURSES,
  MOCK_FACULTY,
  MOCK_COURSE_ENROLLMENTS,
  type CourseOffering,
  type ProgramTerm,
} from '@/lib/pce-mock-data'
import { CourseManagementDialog } from '@/components/pce/course-management-dialog'
import { usePce } from '@/components/pce/pce-state'

type TypeTab = 'all' | 'didactic' | 'clinical'

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

function CourseTypeBadge({ type }: { type: 'didactic' | 'clinical' }) {
  return (
    <Badge variant="outline" className="rounded shrink-0">
      {type === 'didactic' ? 'Didactic' : 'Clinical'}
    </Badge>
  )
}

export function StepDistribution({
  offeringsForTerm,
  selectedOfferings,
  excludedIds,
  selectedTerm,
  programName,
  openDate,
  closeDate,
  onToggleOffering,
  onSetExcluded,
  onApplyDatesToAll,
  onBack,
  onNext,
}: StepDistributionProps) {
  const { surveys } = usePce()
  const [typeTab, setTypeTab] = useState<TypeTab>('all')
  const [search, setSearch] = useState('')
  const [cohortFilter, setCohortFilter] = useState<string>('all')
  const [manageOffering, setManageOffering] = useState<CourseOffering | null>(null)
  const [manageOpen, setManageOpen] = useState(false)

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

  const didacticOfferings = offeringsForTerm.filter(o => o.courseType === 'didactic')
  const clinicalOfferings = offeringsForTerm.filter(o => o.courseType === 'clinical')
  const hasBothTypes = didacticOfferings.length > 0 && clinicalOfferings.length > 0

  const cohortOptions = Array.from(
    new Set(offeringsForTerm.map(o => o.cohort).filter(Boolean))
  ).sort()

  const tabFiltered = offeringsForTerm.filter(o => {
    if (typeTab === 'didactic') return o.courseType === 'didactic'
    if (typeTab === 'clinical') return o.courseType === 'clinical'
    return true
  })

  const filteredOfferings = tabFiltered.filter(offering => {
    if (cohortFilter !== 'all' && offering.cohort !== cohortFilter) return false
    if (!search.trim()) return true
    const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
    const q = search.toLowerCase()
    return (
      course?.code.toLowerCase().includes(q) ||
      course?.name.toLowerCase().includes(q)
    )
  })

  // Header checkbox state (over visible rows only)
  const visibleSelectedCount = filteredOfferings.filter(o => !excludedIds.has(o.id)).length
  const allVisibleSelected = filteredOfferings.length > 0 && visibleSelectedCount === filteredOfferings.length
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected

  function handleHeaderCheckbox() {
    const next = new Set(excludedIds)
    if (allVisibleSelected) {
      filteredOfferings.forEach(o => next.add(o.id))
    } else {
      filteredOfferings.forEach(o => next.delete(o.id))
    }
    onSetExcluded(next)
  }

  const noneSelected = selectedOfferings.length === 0

  const typeOptions = [
    { value: 'all' as const, label: `All (${offeringsForTerm.length})` },
    { value: 'didactic' as const, label: `Didactic (${didacticOfferings.length})` },
    { value: 'clinical' as const, label: `Clinical (${clinicalOfferings.length})` },
  ] as const

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 640 }}>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Courses &amp; access</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {selectedTerm.name} · {selectedTerm.academicYear}{programName ? ` · ${programName}` : ''}
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
        <LocalBanner variant="warning">
          At least one course must be selected to continue.
        </LocalBanner>
      )}

      {/* Type filter + table */}
      {offeringsForTerm.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
          No active course offerings for this term.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {hasBothTypes && (
            <ViewSegmentedControl
              value={typeTab}
              onValueChange={v => setTypeTab(v as TypeTab)}
              options={typeOptions}
              aria-label="Filter courses by type"
            />
          )}

          <div className="flex flex-col overflow-hidden rounded-lg border border-border">
            {/* Toolbar */}
            <div
              className="flex items-center gap-2 flex-wrap px-3 py-2 border-b border-border"
            >
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                onCheckedChange={handleHeaderCheckbox}
                aria-label="Select or deselect all visible courses"
              />
              <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                {selectedOfferings.length} of {offeringsForTerm.length} selected
              </span>
              <div className="flex-1" />
              {cohortOptions.length > 1 && (
                <Select value={cohortFilter} onValueChange={setCohortFilter}>
                  <SelectTrigger className="h-8 text-xs" style={{ minWidth: 130 }} aria-label="Filter by cohort">
                    <SelectValue placeholder="All cohorts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cohorts</SelectItem>
                    {cohortOptions.map(c => (
                      <SelectItem key={c} value={c!}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="relative flex items-center" style={{ minWidth: 180, maxWidth: 220 }}>
                <i className="fa-light fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none" aria-hidden="true" />
                <Input
                  placeholder="Search courses…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search courses"
                  className="h-8 pl-7 pr-2 text-xs"
                />
              </div>
            </div>

            {/* Rows — scrollable */}
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {filteredOfferings.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
                  No courses match your filters.
                </p>
              ) : (
                filteredOfferings.map((offering, i) => {
                  const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
                  const faculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
                  const checked = !excludedIds.has(offering.id)
                  const isLast = i === filteredOfferings.length - 1
                  const isUnassigned = !faculty

                  return (
                    <div key={offering.id}>
                      <label
                        className="flex items-center gap-3 cursor-pointer"
                        style={{
                          padding: '10px 12px',
                          borderBottom: isLast && !isUnassigned ? 'none' : '1px solid var(--border)',
                          background: checked ? 'var(--card)' : 'var(--muted)',
                        }}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => onToggleOffering(offering.id)}
                          aria-label={`Include ${course?.code ?? offering.id}`}
                        />

                        <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                          <AvatarFallback style={{ fontSize: 11, fontWeight: 600 }}>
                            {faculty?.initials ?? '?'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold" style={{ letterSpacing: '-0.01em' }}>
                              {course?.code}
                            </span>
                            <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                              {course?.name}
                            </span>
                            {offering.courseType && (
                              <CourseTypeBadge type={offering.courseType} />
                            )}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {faculty ? faculty.name : (
                              <span style={{ color: 'var(--muted-foreground)' }}>Unassigned faculty</span>
                            )}
                            {' '}· {offering.enrolledCount} enrolled
                            {offering.cohort && <> · {offering.cohort}</>}
                          </span>
                        </div>

                        {MOCK_COURSE_ENROLLMENTS[offering.id] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.preventDefault()
                              setManageOffering(offering)
                              setManageOpen(true)
                            }}
                            aria-label={`Manage ${course?.code}`}
                          >
                            <i className="fa-light fa-sliders" aria-hidden="true" style={{ fontSize: 12 }} />
                            Manage
                          </Button>
                        )}
                      </label>

                      {isUnassigned && (
                        <div
                          className="flex items-start gap-2"
                          style={{
                            padding: '6px 12px 8px 52px',
                            background: 'var(--muted)',
                            borderBottom: isLast ? 'none' : '1px solid var(--border)',
                          }}
                        >
                          <i
                            className="fa-light fa-circle-info text-xs shrink-0 mt-0.5"
                            aria-hidden="true"
                            style={{ color: 'var(--muted-foreground)' }}
                          />
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            No instructor assigned. Instructor section will be suppressed in this survey.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
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

      <CourseManagementDialog
        offering={manageOffering}
        open={manageOpen}
        onOpenChange={setManageOpen}
        globalOpenDate={openDate}
        globalCloseDate={closeDate}
        onApplyDatesToAll={onApplyDatesToAll}
      />
    </div>
  )
}
