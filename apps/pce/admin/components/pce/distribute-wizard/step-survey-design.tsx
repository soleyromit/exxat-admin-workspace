'use client'

import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@exxatdesignux/ui'
import {
  MOCK_MASTER_COURSES,
  type CourseOffering,
  type PceTemplate,
} from '@/lib/pce-mock-data'

interface StepSurveyDesignProps {
  selectedOfferings: CourseOffering[]
  publishedTemplates: PceTemplate[]
  templateAssignments: Record<string, string>
  onTemplateChange: (offeringId: string, tmplId: string) => void
  onBulkAssignByType: (courseType: 'didactic' | 'clinical' | 'any', tmplId: string) => void
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

export function StepSurveyDesign({
  selectedOfferings,
  publishedTemplates,
  templateAssignments,
  onTemplateChange,
  onBulkAssignByType,
  onBack,
  onNext,
}: StepSurveyDesignProps) {
  const assignedCount = selectedOfferings.filter(o => !!templateAssignments[o.id]).length
  const allAssigned = selectedOfferings.length > 0 && assignedCount === selectedOfferings.length

  const hasDidactic = selectedOfferings.some(o => o.courseType === 'didactic')
  const hasClinical = selectedOfferings.some(o => o.courseType === 'clinical')
  const showBulkByType = hasDidactic && hasClinical

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Survey design</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Assign a template to each course.
        </p>
      </div>

      {publishedTemplates.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 py-14 text-center rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)' }}
        >
          <i
            className="fa-light fa-file-lines text-3xl"
            aria-hidden="true"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <div>
            <p className="text-sm font-medium">No published templates</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Publish a template to continue.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/templates" target="_blank" rel="noreferrer" aria-label="Go to templates (opens in new tab)">
              Go to templates
              <i
                className="fa-light fa-arrow-up-right-from-square ml-1.5 text-xs"
                aria-hidden="true"
              />
            </a>
          </Button>
        </div>
      ) : (
        <>
          {/* Bulk assign by type — only when both types exist */}
          {showBulkByType && publishedTemplates.length > 1 && (
            <div
              className="flex flex-col gap-2 rounded-xl p-4"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                Bulk assign by course type
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {/* All Didactic */}
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">All Didactic</span>
                  <i
                    className="fa-light fa-arrow-right text-xs"
                    aria-hidden="true"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                  <div style={{ minWidth: 180 }}>
                    <Select value="" onValueChange={v => { if (v) onBulkAssignByType('didactic', v) }}>
                      <SelectTrigger
                        aria-label="Assign template to all didactic courses"
                        style={{ height: 32, fontSize: 13 }}
                      >
                        <SelectValue placeholder="Choose template…" />
                      </SelectTrigger>
                      <SelectContent>
                        {publishedTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* All Clinical */}
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">All Clinical</span>
                  <i
                    className="fa-light fa-arrow-right text-xs"
                    aria-hidden="true"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                  <div style={{ minWidth: 180 }}>
                    <Select value="" onValueChange={v => { if (v) onBulkAssignByType('clinical', v) }}>
                      <SelectTrigger
                        aria-label="Assign template to all clinical courses"
                        style={{ height: 32, fontSize: 13 }}
                      >
                        <SelectValue placeholder="Choose template…" />
                      </SelectTrigger>
                      <SelectContent>
                        {publishedTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Per-offering rows */}
          <div
            className="flex flex-col rounded-xl border border-border overflow-hidden"
            style={{ background: 'var(--card)' }}
          >
            {selectedOfferings.map((offering, i) => {
              const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
              const assignedId = templateAssignments[offering.id] ?? ''
              const isLast = i === selectedOfferings.length - 1
              const isAssigned = !!assignedId

              return (
                <div
                  key={offering.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: '10px 14px',
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {/* Course info */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold shrink-0">{course?.code}</span>
                    <span
                      className="text-sm truncate"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {course?.name}
                    </span>
                    {offering.courseType && <CourseTypeBadge type={offering.courseType} />}
                  </div>

                  {/* Assignment status indicator */}
                  <span
                    className="text-xs shrink-0"
                    style={{ color: isAssigned ? 'var(--brand-color)' : 'var(--destructive)' }}
                  >
                    {isAssigned ? (
                      <>
                        <i className="fa-solid fa-check text-xs mr-1" aria-hidden="true" />
                        Assigned
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-triangle-exclamation text-xs mr-1" aria-hidden="true" />
                        Unassigned
                      </>
                    )}
                  </span>

                  {/* Template select */}
                  <div style={{ minWidth: 200 }}>
                    <Select value={assignedId} onValueChange={v => onTemplateChange(offering.id, v)}>
                      <SelectTrigger
                        aria-label={`Template for ${course?.code ?? offering.id}`}
                        style={{
                          height: 32,
                          fontSize: 13,
                          borderColor: isAssigned ? 'var(--border-control-35)' : 'var(--destructive)',
                        }}
                      >
                        <SelectValue placeholder="Choose…" />
                      </SelectTrigger>
                      <SelectContent>
                        {publishedTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress + escape hatch */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {assignedCount} of {selectedOfferings.length} assigned
            </span>
            <a
              href="/templates"
              target="_blank"
              rel="noreferrer"
              className="text-xs"
              style={{ color: 'var(--brand-color)' }}
              aria-label="Create a template (opens in new tab)"
            >
              Create a template
              <i
                className="fa-light fa-arrow-up-right-from-square ml-1 text-xs"
                aria-hidden="true"
              />
            </a>
          </div>
        </>
      )}

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={!allAssigned || publishedTemplates.length === 0}
          onClick={onNext}
        >
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}
