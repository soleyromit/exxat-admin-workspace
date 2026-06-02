'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
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
import { SurveyPreviewDialog } from './survey-preview-dialog'

interface StepSurveyDesignProps {
  selectedOfferings: CourseOffering[]
  publishedTemplates: PceTemplate[]
  templateAssignments: Record<string, string>
  onTemplateChange: (offeringId: string, tmplId: string) => void
  onBulkAssignByType: (courseType: 'didactic' | 'clinical' | 'any', tmplId: string) => void
  onBack: () => void
  onNext: () => void
}

type CourseGroupType = 'didactic' | 'clinical'

export function StepSurveyDesign({
  selectedOfferings,
  publishedTemplates,
  templateAssignments,
  onTemplateChange,
  onBulkAssignByType,
  onBack,
  onNext,
}: StepSurveyDesignProps) {
  const [groupDefaults, setGroupDefaults] = useState<Partial<Record<CourseGroupType, string>>>(() => {
    const defaults: Partial<Record<CourseGroupType, string>> = {}
    for (const type of ['didactic', 'clinical'] as const) {
      const offerings = selectedOfferings.filter(o => o.courseType === type)
      if (offerings.length === 0) continue
      const first = templateAssignments[offerings[0].id] ?? ''
      if (first && offerings.every(o => templateAssignments[o.id] === first)) {
        defaults[type] = first
      }
    }
    return defaults
  })

  const [overrideIds, setOverrideIds] = useState<Set<string>>(new Set())
  const [openGroups, setOpenGroups] = useState<Set<CourseGroupType>>(new Set())
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)

  const assignedCount = selectedOfferings.filter(o => {
    if (overrideIds.has(o.id)) return !!templateAssignments[o.id]
    const type = o.courseType as CourseGroupType | undefined
    return type ? !!groupDefaults[type] : false
  }).length
  const allAssigned = selectedOfferings.length > 0 && assignedCount === selectedOfferings.length

  function toggleGroup(type: CourseGroupType) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  function handleGroupSelect(type: CourseGroupType, tmplId: string) {
    setGroupDefaults(p => ({ ...p, [type]: tmplId }))
    setOverrideIds(prev => {
      const next = new Set(prev)
      selectedOfferings.filter(o => o.courseType === type).forEach(o => next.delete(o.id))
      return next
    })
    onBulkAssignByType(type, tmplId)
  }

  function handleOverride(offering: CourseOffering) {
    setOverrideIds(prev => new Set(prev).add(offering.id))
  }

  function handleOverrideChange(offeringId: string, tmplId: string) {
    onTemplateChange(offeringId, tmplId)
  }

  function handleResetOverride(offering: CourseOffering) {
    const type = offering.courseType as CourseGroupType
    setOverrideIds(prev => { const n = new Set(prev); n.delete(offering.id); return n })
    const defaultTmpl = groupDefaults[type] ?? ''
    if (defaultTmpl) onTemplateChange(offering.id, defaultTmpl)
  }

  function openPreview(tmplId: string) {
    setPreviewTemplate(publishedTemplates.find(t => t.id === tmplId) ?? null)
  }

  const didacticOfferings = selectedOfferings.filter(o => o.courseType === 'didactic')
  const clinicalOfferings = selectedOfferings.filter(o => o.courseType === 'clinical')
  const untypedOfferings = selectedOfferings.filter(o => !o.courseType)

  const groups: Array<{ type: CourseGroupType; label: string; offerings: CourseOffering[] }> = [
    ...(didacticOfferings.length > 0 ? [{ type: 'didactic' as const, label: 'Didactic', offerings: didacticOfferings }] : []),
    ...(clinicalOfferings.length > 0 ? [{ type: 'clinical' as const, label: 'Clinical', offerings: clinicalOfferings }] : []),
  ]

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 680 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Survey design</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Set a template for each course type. Expand to override individual courses.
        </p>
      </div>

      {publishedTemplates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center rounded-xl border border-dashed border-border">
          <i className="fa-light fa-file-lines text-3xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
          <div>
            <p className="text-sm font-medium">No published templates</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Publish a template to continue.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/templates" target="_blank" rel="noreferrer" aria-label="Go to templates (opens in new tab)">
              Go to templates
              <i className="fa-light fa-arrow-up-right-from-square ml-1.5 text-xs" aria-hidden="true" />
            </a>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3" role="list" aria-label="Course groups">

            {/* Typed groups — collapsed by default */}
            {groups.map(({ type, label, offerings }) => {
              const groupTmplId = groupDefaults[type] ?? ''
              const isOpen = openGroups.has(type)
              const overrideCount = offerings.filter(o => overrideIds.has(o.id)).length

              return (
                <Collapsible
                  key={type}
                  open={isOpen}
                  onOpenChange={() => toggleGroup(type)}
                >
                  {/* overflow-hidden safe — floating uses Radix Portal */}
                  <Card role="listitem" className="flex flex-col overflow-hidden shadow-none">
                    {/* Group header — always visible */}
                    <div
                      className="flex items-center gap-3"
                      style={{ padding: '10px 14px', borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}
                    >
                      <span className="text-sm font-semibold flex-1 flex items-center gap-2">
                        {label}
                        <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>
                          {offerings.length} course{offerings.length !== 1 ? 's' : ''}
                        </span>
                        {overrideCount > 0 && (
                          <Badge variant="secondary" className="rounded text-xs">
                            {overrideCount} override{overrideCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </span>

                      <Select value={groupTmplId} onValueChange={v => handleGroupSelect(type, v)}>
                        <SelectTrigger
                          className="w-48 shrink-0"
                          aria-label={`Default template for all ${label} courses`}
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

                      {groupTmplId && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Preview default template for ${label} courses`}
                          onClick={() => openPreview(groupTmplId)}
                        >
                          <i className="fa-light fa-eye text-xs" aria-hidden="true" />
                        </Button>
                      )}

                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={isOpen ? `Collapse ${label} course list` : `Expand ${label} course list`}
                        >
                          <i
                            className={`fa-light ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}
                            aria-hidden="true"
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    {/* Course rows — collapsed by default, capped scroll */}
                    <CollapsibleContent>
                      <div
                        style={{ maxHeight: 280, overflowY: 'auto' }}
                        aria-label={`${label} course overrides`}
                      >
                        {offerings.map((offering, i) => {
                          const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
                          const isOverridden = overrideIds.has(offering.id)
                          const overrideTmplId = isOverridden ? (templateAssignments[offering.id] ?? '') : ''
                          const isLast = i === offerings.length - 1

                          return (
                            <div
                              key={offering.id}
                              className="flex items-center gap-3"
                              style={{
                                padding: '8px 14px 8px 20px',
                                borderBottom: isLast ? 'none' : '1px solid var(--border)',
                              }}
                            >
                              <span className="text-sm font-semibold shrink-0" style={{ minWidth: 72 }}>
                                {course?.code}
                              </span>
                              <span className="text-sm flex-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
                                {course?.name}
                              </span>

                              {isOverridden ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge variant="secondary" className="rounded text-xs shrink-0">
                                    Override
                                  </Badge>
                                  <Select
                                    value={overrideTmplId}
                                    onValueChange={v => handleOverrideChange(offering.id, v)}
                                  >
                                    <SelectTrigger
                                      className="w-44"
                                      aria-label={`Override template for ${course?.code ?? offering.id}`}
                                      style={{ height: 30, fontSize: 13 }}
                                    >
                                      <SelectValue placeholder="Choose…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {publishedTemplates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {overrideTmplId && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Preview override template for ${course?.code}`}
                                      onClick={() => openPreview(overrideTmplId)}
                                    >
                                      <i className="fa-light fa-eye text-xs" aria-hidden="true" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Reset ${course?.code} to group default`}
                                    onClick={() => handleResetOverride(offering)}
                                  >
                                    <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0 font-normal text-xs"
                                  style={{ color: 'var(--muted-foreground)' }}
                                  aria-label={`Override template for ${course?.code ?? offering.id}`}
                                  onClick={() => handleOverride(offering)}
                                >
                                  Override
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}

            {/* Untyped courses (edge case — no bulk group) */}
            {untypedOfferings.length > 0 && (
              <Card
                role="listitem"
                className="flex flex-col overflow-hidden shadow-none"
              >
                {untypedOfferings.map((offering, i) => {
                  const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
                  const assignedId = templateAssignments[offering.id] ?? ''
                  const isLast = i === untypedOfferings.length - 1
                  return (
                    <div
                      key={offering.id}
                      className="flex items-center gap-3"
                      style={{ padding: '9px 14px', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
                    >
                      <span className="text-sm font-semibold shrink-0" style={{ minWidth: 72 }}>{course?.code}</span>
                      <span className="text-sm flex-1 truncate" style={{ color: 'var(--muted-foreground)' }}>{course?.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Select value={assignedId} onValueChange={v => onTemplateChange(offering.id, v)}>
                          <SelectTrigger className="w-48" aria-label={`Template for ${course?.code}`} style={{ height: 32, fontSize: 13 }}>
                            <SelectValue placeholder="Choose…" />
                          </SelectTrigger>
                          <SelectContent>
                            {publishedTemplates.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {assignedId && (
                          <Button variant="ghost" size="icon-sm" aria-label={`Preview template for ${course?.code}`} onClick={() => openPreview(assignedId)}>
                            <i className="fa-light fa-eye text-xs" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </Card>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {assignedCount} of {selectedOfferings.length} assigned
            </span>
            <a
              href="/templates"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline underline-offset-2"
              aria-label="Create a template (opens in new tab)"
            >
              Create a template
              <i className="fa-light fa-arrow-up-right-from-square ml-1 text-xs" aria-hidden="true" />
            </a>
          </div>
        </>
      )}

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

      <SurveyPreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={open => { if (!open) setPreviewTemplate(null) }}
      />
    </div>
  )
}
