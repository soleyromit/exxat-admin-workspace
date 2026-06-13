'use client'

import { useState, useMemo } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  Input,
  LocalBanner,
  Avatar,
  AvatarFallback,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ViewSegmentedControl,
} from '@exxatdesignux/ui'
import {
  MOCK_MASTER_COURSES,
  MOCK_FACULTY,
  type CourseOffering,
  type PceTemplate,
  type ProgramTerm,
} from '@/lib/pce-mock-data'

type TypeTab = 'all' | 'didactic' | 'clinical'

interface StepCoursesProps {
  offeringsForTerm: CourseOffering[]
  selectedTerm: ProgramTerm
  excludedIds: Set<string>
  templateAssignments: Record<string, string>
  publishedTemplates: PceTemplate[]
  onToggleOffering: (id: string) => void
  onSetExcluded: (ids: Set<string>) => void
  onTemplateChange: (offeringId: string, templateId: string) => void
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

export function StepCourses({
  offeringsForTerm,
  selectedTerm,
  excludedIds,
  templateAssignments,
  publishedTemplates,
  onToggleOffering,
  onSetExcluded,
  onTemplateChange,
  onBack,
  onNext,
}: StepCoursesProps) {
  const [typeTab, setTypeTab] = useState<TypeTab>('all')
  const [search, setSearch] = useState('')

  const selectedOfferings = offeringsForTerm.filter(o => !excludedIds.has(o.id))
  const didacticOfferings = offeringsForTerm.filter(o => o.courseType === 'didactic')
  const clinicalOfferings = offeringsForTerm.filter(o => o.courseType === 'clinical')
  const hasBothTypes = didacticOfferings.length > 0 && clinicalOfferings.length > 0
  const unassignedFacultyCount = offeringsForTerm.filter(o => !o.primaryFacultyId || !MOCK_FACULTY.find(f => f.id === o.primaryFacultyId)).length

  const tabFiltered = offeringsForTerm.filter(o => {
    if (typeTab === 'didactic') return o.courseType === 'didactic'
    if (typeTab === 'clinical') return o.courseType === 'clinical'
    return true
  })

  const filteredOfferings = tabFiltered.filter(offering => {
    if (!search.trim()) return true
    const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
    const q = search.toLowerCase()
    return course?.code.toLowerCase().includes(q) || course?.name.toLowerCase().includes(q)
  })

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

  const typeOptions = useMemo(() => [
    { value: 'all' as const,      label: `All (${offeringsForTerm.length})` },
    { value: 'didactic' as const, label: `Didactic (${didacticOfferings.length})` },
    { value: 'clinical' as const, label: `Clinical (${clinicalOfferings.length})` },
  ], [offeringsForTerm.length, didacticOfferings.length, clinicalOfferings.length])

  const noneSelected = selectedOfferings.length === 0
  const allAssigned = selectedOfferings.every(o => !!templateAssignments[o.id])

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 700 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Review courses
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {selectedTerm.name} · {selectedTerm.academicYear} · All courses included. Uncheck to exclude.
        </p>
      </div>

      {noneSelected && (
        <LocalBanner variant="warning">
          At least one course must be selected to continue.
        </LocalBanner>
      )}
      {!allAssigned && selectedOfferings.length > 0 && (
        <LocalBanner variant="warning">
          Some included courses have no template assigned.
        </LocalBanner>
      )}
      {unassignedFacultyCount > 0 && (
        <LocalBanner variant="info">
          {unassignedFacultyCount} course{unassignedFacultyCount !== 1 ? 's have' : ' has'} no faculty — the Instructor section will be suppressed in those surveys.
        </LocalBanner>
      )}

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
            <div className="flex items-center gap-2 flex-wrap px-3 py-2 border-b border-border">
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                onCheckedChange={handleHeaderCheckbox}
                aria-label="Select or deselect all visible courses"
              />
              <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                {selectedOfferings.length} of {offeringsForTerm.length} selected
              </span>
              <div className="flex-1" />
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

            {/* Column headers */}
            <div
              className="grid items-center px-3 border-b border-border"
              style={{ gridTemplateColumns: '20px 28px 1fr auto', gap: '0 12px', padding: '6px 12px', background: 'var(--muted)' }}
            >
              <span />
              <span />
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Course</span>
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: 180 }}>Template</span>
            </div>

            {/* Rows */}
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {filteredOfferings.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
                  No courses match your search.
                </p>
              ) : (
                filteredOfferings.map((offering, i) => {
                  const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
                  const faculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
                  const checked = !excludedIds.has(offering.id)
                  const isLast = i === filteredOfferings.length - 1
                  const assignedTemplateId = templateAssignments[offering.id] ?? ''

                  return (
                    <div
                      key={offering.id}
                      className="grid items-center"
                      style={{
                        gridTemplateColumns: '20px 28px 1fr auto',
                        gap: '0 12px',
                        padding: '10px 12px',
                        borderBottom: isLast ? 'none' : '1px solid var(--border)',
                        background: checked ? 'var(--card)' : 'var(--muted)',
                      }}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onToggleOffering(offering.id)}
                        aria-label={`Include ${course?.code ?? offering.id}`}
                      />

                      <Avatar style={{ width: 28, height: 28 }}>
                        <AvatarFallback style={{ fontSize: 11, fontWeight: 600 }}>
                          {faculty?.initials ?? '?'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{course?.code}</span>
                          <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                            {course?.name}
                          </span>
                          {offering.courseType && <CourseTypeBadge type={offering.courseType} />}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {faculty?.name ?? 'Unassigned'} · {offering.enrolledCount} enrolled
                        </span>
                      </div>

                      {/* Template selector */}
                      <div style={{ minWidth: 180 }}>
                        {publishedTemplates.length === 0 ? (
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No templates</span>
                        ) : checked ? (
                          <Select
                            value={assignedTemplateId}
                            onValueChange={v => onTemplateChange(offering.id, v)}
                          >
                            <SelectTrigger
                              className="h-8 text-xs"
                              aria-label={`Template for ${course?.code ?? offering.id}`}
                            >
                              <SelectValue placeholder="Assign template…" />
                            </SelectTrigger>
                            <SelectContent>
                              {publishedTemplates.map(t => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Excluded</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={noneSelected || !allAssigned} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}
