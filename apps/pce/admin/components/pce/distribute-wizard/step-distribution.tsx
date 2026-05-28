'use client'

import { useState } from 'react'
import {
  Button,
  Badge,
  Checkbox,
  LocalBanner,
  Avatar,
  AvatarFallback,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@exxatdesignux/ui'
import {
  MOCK_MASTER_COURSES,
  MOCK_FACULTY,
  MOCK_COURSE_ENROLLMENTS,
  type CourseOffering,
  type ProgramTerm,
} from '@/lib/pce-mock-data'
import { CourseManagementSheet } from '@/components/pce/course-management-sheet'

interface StepDistributionProps {
  offeringsForTerm: CourseOffering[]
  selectedOfferings: CourseOffering[]
  excludedIds: Set<string>
  selectedTerm: ProgramTerm
  publishedTemplates: import('@/lib/pce-mock-data').PceTemplate[]
  templateAssignments: Record<string, string>
  programName?: string
  onToggleOffering: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onTemplateChange: (offeringId: string, tmplId: string) => void
  onBack: () => void
  onNext: () => void
}

function CourseTypeBadge({ type }: { type: 'didactic' | 'clinical' }) {
  const isDidactic = type === 'didactic'
  return (
    <Badge
      variant="secondary"
      className="rounded shrink-0"
      style={{
        fontSize: 12,
        fontWeight: 500,
        paddingInline: 6,
        paddingBlock: 2,
        backgroundColor: isDidactic ? 'var(--brand-tint)' : 'var(--muted)',
        color: isDidactic ? 'var(--brand-color)' : 'var(--muted-foreground)',
      }}
    >
      {isDidactic ? 'Didactic' : 'Clinical'}
    </Badge>
  )
}

export function StepDistribution({
  offeringsForTerm,
  selectedOfferings,
  excludedIds,
  selectedTerm,
  publishedTemplates,
  templateAssignments,
  programName,
  onToggleOffering,
  onSelectAll,
  onDeselectAll,
  onTemplateChange,
  onBack,
  onNext,
}: StepDistributionProps) {
  const [search, setSearch] = useState('')
  const [cohortFilter, setCohortFilter] = useState<string>('all')
  const [rosterOffering, setRosterOffering] = useState<CourseOffering | null>(null)
  const [rosterOpen, setRosterOpen] = useState(false)

  function openRoster(offering: CourseOffering) {
    setRosterOffering(offering)
    setRosterOpen(true)
  }

  const cohortOptions = Array.from(
    new Set(offeringsForTerm.map(o => o.cohort).filter(Boolean))
  ).sort()

  const filteredOfferings = offeringsForTerm.filter(offering => {
    const matchesCohort = cohortFilter === 'all' || offering.cohort === cohortFilter
    if (!matchesCohort) return false
    if (!search.trim()) return true
    const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
    const q = search.toLowerCase()
    return (
      course?.code.toLowerCase().includes(q) ||
      course?.name.toLowerCase().includes(q)
    )
  })

  const noneSelected = selectedOfferings.length === 0
  const canContinue = !noneSelected

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Courses &amp; access</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {selectedTerm.name} · {selectedTerm.academicYear}{programName ? ` · ${programName}` : ''}
        </p>
      </div>

      {noneSelected && (
        <LocalBanner variant="warning">
          At least one course must be selected to continue.
        </LocalBanner>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          Select all
        </Button>
        <Button variant="outline" size="sm" onClick={onDeselectAll}>
          Deselect all
        </Button>
        <div className="flex-1" />
        {cohortOptions.length > 1 && (
          <Select value={cohortFilter} onValueChange={setCohortFilter}>
            <SelectTrigger className="h-8 text-xs" style={{ minWidth: 140 }} aria-label="Filter by cohort">
              <SelectValue placeholder="All cohorts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cohorts</SelectItem>
              {cohortOptions.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div
          className="flex items-center gap-2 rounded-md"
          style={{
            padding: '6px 10px',
            border: '1px solid var(--border-control-35)',
            background: 'var(--card)',
            minWidth: 200,
          }}
        >
          <i
            className="fa-light fa-magnifying-glass text-xs shrink-0"
            aria-hidden="true"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1"
            style={{ color: 'var(--foreground)' }}
            aria-label="Search courses"
          />
        </div>
      </div>

      {/* Course list */}
      {offeringsForTerm.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
          No active course offerings for this term.
        </p>
      ) : (
        <div
          className="flex flex-col rounded-xl border border-border overflow-hidden"
          style={{ background: 'var(--card)' }}
        >
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
              const isUnassigned = !faculty

              return (
                <div key={offering.id}>
                  <label
                    className="flex items-center gap-3 cursor-pointer"
                    style={{
                      padding: '10px 14px',
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
                      <AvatarFallback
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: 'var(--avatar-initials-bg)',
                          color: 'var(--avatar-initials-fg)',
                        }}
                      >
                        {faculty?.initials ?? '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Course info */}
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
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {faculty ? faculty.name : (
                            <span style={{ color: 'var(--chart-4)' }}>Unassigned faculty</span>
                          )}
                          {' '}· {offering.enrolledCount} enrolled
                        </span>
                      </div>
                    </div>

                    {/* Template status */}
                    <span className="text-xs shrink-0" style={{ minWidth: 80, textAlign: 'right' }}>
                      {templateAssignments[offering.id]
                        ? (() => {
                            const t = publishedTemplates.find(t => t.id === templateAssignments[offering.id])
                            return t ? (
                              <span title={t.name} style={{ color: 'var(--foreground)' }}>
                                {t.name.length > 16 ? t.name.slice(0, 14) + '…' : t.name}
                              </span>
                            ) : null
                          })()
                        : <span style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>No template</span>
                      }
                    </span>

                    {/* Manage button */}
                    {MOCK_COURSE_ENROLLMENTS[offering.id] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => { e.preventDefault(); openRoster(offering) }}
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
                        padding: '6px 14px 8px 52px',
                        background: 'var(--muted)',
                        borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      <i
                        className="fa-light fa-circle-info text-xs shrink-0 mt-0.5"
                        aria-hidden="true"
                        style={{ color: 'var(--chart-4)' }}
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
      )}

      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {selectedOfferings.length} of {offeringsForTerm.length} course{offeringsForTerm.length !== 1 ? 's' : ''} selected
      </p>

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>

      <CourseManagementSheet
        offering={rosterOffering}
        open={rosterOpen}
        onOpenChange={setRosterOpen}
        publishedTemplates={publishedTemplates}
        templateAssignments={templateAssignments}
        onTemplateChange={onTemplateChange}
      />
    </div>
  )
}
