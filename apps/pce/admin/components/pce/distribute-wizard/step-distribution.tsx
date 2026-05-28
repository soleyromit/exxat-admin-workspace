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

type ScopeMode = 'all' | 'didactic' | 'clinical' | 'custom'

interface StepDistributionProps {
  offeringsForTerm: CourseOffering[]
  selectedOfferings: CourseOffering[]
  excludedIds: Set<string>
  selectedTerm: ProgramTerm
  programName?: string
  onToggleOffering: (id: string) => void
  onSetExcluded: (ids: Set<string>) => void
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

// A single scope-selector card (radio-style)
function ScopeCard({
  selected,
  title,
  description,
  count,
  countLabel,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  count?: number
  countLabel?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className="w-full flex items-center gap-4 text-left transition-colors"
      style={{
        padding: '14px 16px',
        border: `1px solid ${selected ? 'var(--border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        background: selected ? 'var(--card)' : 'transparent',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {/* Radio indicator */}
      <div
        className="shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 16,
          height: 16,
          border: `2px solid ${selected ? 'var(--brand-color)' : 'var(--border-control-35)'}`,
          background: selected ? 'var(--brand-color)' : 'transparent',
          transition: 'background 120ms, border-color 120ms',
        }}
      >
        {selected && (
          <div
            className="rounded-full"
            style={{ width: 5, height: 5, background: 'var(--background)' }}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
      </div>

      {/* Count */}
      {count !== undefined && (
        <Badge
          variant="secondary"
          className="rounded shrink-0"
          style={{
            fontSize: 12,
            fontWeight: 500,
            paddingInline: 8,
            backgroundColor: selected ? 'var(--muted)' : 'transparent',
            color: 'var(--muted-foreground)',
            border: '1px solid var(--border)',
          }}
        >
          {count} {countLabel ?? (count === 1 ? 'course' : 'courses')}
        </Badge>
      )}
    </button>
  )
}

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
  const [scopeMode, setScopeMode] = useState<ScopeMode>('all')
  const [search, setSearch] = useState('')
  const [cohortFilter, setCohortFilter] = useState<string>('all')
  const [rosterOffering, setRosterOffering] = useState<CourseOffering | null>(null)
  const [rosterOpen, setRosterOpen] = useState(false)

  const didacticOfferings = offeringsForTerm.filter(o => o.courseType === 'didactic')
  const clinicalOfferings = offeringsForTerm.filter(o => o.courseType === 'clinical')
  const hasDidactic = didacticOfferings.length > 0
  const hasClinical = clinicalOfferings.length > 0
  const hasBothTypes = hasDidactic && hasClinical

  function applyScope(mode: ScopeMode) {
    setScopeMode(mode)
    if (mode === 'all') {
      onSetExcluded(new Set())
    } else if (mode === 'didactic') {
      onSetExcluded(new Set(clinicalOfferings.map(o => o.id)))
    } else if (mode === 'clinical') {
      onSetExcluded(new Set(didacticOfferings.map(o => o.id)))
    } else {
      // custom — start with all selected
      onSetExcluded(new Set())
    }
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
    <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Courses &amp; access</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {selectedTerm.name} · {selectedTerm.academicYear}{programName ? ` · ${programName}` : ''}
        </p>
      </div>

      {/* Scope cards */}
      <div
        role="radiogroup"
        aria-label="Course scope"
        className="flex flex-col gap-2"
      >
        <ScopeCard
          selected={scopeMode === 'all'}
          title="All courses"
          description="Every active course offering this term"
          count={offeringsForTerm.length}
          onClick={() => applyScope('all')}
        />

        {hasBothTypes && (
          <>
            <ScopeCard
              selected={scopeMode === 'didactic'}
              title="Didactic courses only"
              description="Clinical-tagged offerings excluded"
              count={didacticOfferings.length}
              onClick={() => applyScope('didactic')}
            />
            <ScopeCard
              selected={scopeMode === 'clinical'}
              title="Clinical courses only"
              description="Didactic-tagged offerings excluded"
              count={clinicalOfferings.length}
              onClick={() => applyScope('clinical')}
            />
          </>
        )}

        <ScopeCard
          selected={scopeMode === 'custom'}
          title="Custom selection"
          description="Choose exactly which courses to include"
          onClick={() => applyScope('custom')}
        />
      </div>

      {/* Custom expansion — only when Custom selected */}
      {scopeMode === 'custom' && (
        <div className="flex flex-col gap-3">

          {noneSelected && (
            <LocalBanner variant="warning">
              At least one course must be selected to continue.
            </LocalBanner>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => onSetExcluded(new Set())}>
              Select all
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSetExcluded(new Set(offeringsForTerm.map(o => o.id)))}>
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
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div
              className="flex items-center gap-2 rounded-md"
              style={{
                padding: '5px 10px',
                border: '1px solid var(--border-control-35)',
                background: 'var(--card)',
                minWidth: 180,
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
            <p className="text-sm py-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
              No active course offerings for this term.
            </p>
          ) : (
            <div
              className="flex flex-col rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--card)' }}
            >
              {filteredOfferings.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
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
                              <span style={{ color: 'var(--chart-4)' }}>Unassigned faculty</span>
                            )}
                            {' '}· {offering.enrolledCount} enrolled
                          </span>
                        </div>

                        {MOCK_COURSE_ENROLLMENTS[offering.id] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => { e.preventDefault(); setRosterOffering(offering); setRosterOpen(true) }}
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
        </div>
      )}

      {/* Summary */}
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
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
      />
    </div>
  )
}
