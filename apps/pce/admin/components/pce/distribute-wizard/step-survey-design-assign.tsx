'use client'

import { useMemo, useState } from 'react'
import {
  Badge, Button, LocalBanner,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { NewTemplateFlow } from '@/components/pce/new-template-flow'
import { TemplateEditor } from '@/components/pce/template-editor'
import { DataTable } from '@/components/data-table'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { MOCK_MASTER_COURSES, type CourseOffering, type PceTemplate } from '@/lib/pce-mock-data'

interface StepSurveyDesignAssignProps {
  selectedOfferings: CourseOffering[]
  publishedTemplates: PceTemplate[]
  templateAssignments: Record<string, string>
  defaultAssignments: Record<string, string>
  onTemplateChange: (offeringId: string, templateId: string) => void
  onResetDefaults: () => void
  onBack: () => void
  onNext: () => void
}

interface DesignRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  typeLabel: string
  enrolled: number
  templateId: string
}

const TYPE_LABEL = (courseType?: string) => (courseType === 'clinical' ? 'Practice-based' : 'Classroom-based')

export function StepSurveyDesignAssign({
  selectedOfferings, publishedTemplates, templateAssignments, defaultAssignments,
  onTemplateChange, onResetDefaults, onBack, onNext,
}: StepSurveyDesignAssignProps) {
  const total = selectedOfferings.length
  const assigned = selectedOfferings.filter(o => templateAssignments[o.id] ?? defaultAssignments[o.id]).length
  const effective = (id: string) => templateAssignments[id] ?? defaultAssignments[id] ?? ''

  // In-step template creation (Klaviyo model): the step swaps to the SAME
  // create flow + builder used by Settings > Templates, then returns on publish.
  // The wizard page never unmounts, so scope/selection state is preserved.
  const { templates: allTemplates } = usePce()
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const backToAssign = () => {
    if (typeof subView === 'object') {
      const t = allTemplates.find(x => x.id === subView.buildId)
      if (t && t.status !== 'active') setNotice({ kind: 'draft', name: t.name || 'Untitled template' })
    }
    setSubView('assign')
  }

  const rows = useMemo<DesignRow[]>(() =>
    selectedOfferings.map(o => {
      const c = MOCK_MASTER_COURSES.find(m => m.id === o.masterCourseId)
      return {
        id: o.id,
        code: c?.code ?? o.id,
        name: c?.name ?? '',
        typeLabel: TYPE_LABEL(o.courseType),
        enrolled: o.enrolledCount,
        templateId: effective(o.id),
      }
    }),
  [selectedOfferings, templateAssignments, defaultAssignments])

  const columns = useMemo<ColumnDef<DesignRow>[]>(() => [
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    { key: 'code', label: 'Code', sortable: true, width: 100,
      cell: (r: DesignRow) => <span className="font-mono text-xs font-semibold">{r.code}</span> },
    { key: 'name', label: 'Course', sortable: true, width: 260 },
    { key: 'typeLabel', label: 'Type', sortable: true, width: 150,
      filter: { type: 'select', icon: 'fa-shapes', options: [
        { value: 'Classroom-based', label: 'Classroom-based' },
        { value: 'Practice-based', label: 'Practice-based' },
      ] },
      cell: (r: DesignRow) => <Badge variant="secondary" className="font-normal">{r.typeLabel}</Badge> },
    { key: 'enrolled', label: 'Students', sortable: true, width: 90,
      cell: (r: DesignRow) => <span className="tabular-nums">{r.enrolled}</span> },
    { key: 'template', label: 'Template', width: 300,
      cell: (r: DesignRow) => {
        const isDefault = !!r.templateId && r.templateId === defaultAssignments[r.id]
        return (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <Select value={r.templateId} onValueChange={v => onTemplateChange(r.id, v)}>
              <SelectTrigger aria-label={`Template for ${r.code}`} style={{ height: 32, fontSize: 13, width: 240 }}>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {publishedTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {isDefault && <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>Default</span>}
          </div>
        )
      } },
  ], [publishedTemplates, onTemplateChange, defaultAssignments])

  const tableState = useTableState<DesignRow>(rows, columns)

  // ── Create sub-view: same chooser + builder as Settings > Templates ──────
  if (subView !== 'assign') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={backToAssign}>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back to Survey design
          </Button>
        </div>
        {subView === 'create' ? (
          <NewTemplateFlow embedded onCreated={id => setSubView({ buildId: id })} />
        ) : (
          <TemplateEditor
            templateId={subView.buildId}
            embedded
            onPublished={id => {
              const t = allTemplates.find(x => x.id === id)
              setNotice({ kind: 'published', name: t?.name || 'Template' })
              setSubView('assign')
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 940 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Survey design</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Each course uses its type&apos;s default template. Select courses — filter by type to grab a group — to change several at once.
        </p>
      </div>

      {notice && (
        <LocalBanner
          variant={notice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setNotice(null)}
        >
          {notice.kind === 'published'
            ? <>&ldquo;{notice.name}&rdquo; published — assign it in the Template column below.</>
            : <>&ldquo;{notice.name}&rdquo; saved as a draft — publish it to make it assignable. It&apos;s in Settings &rsaquo; Templates.</>}
        </LocalBanner>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{assigned} of {total} courses assigned</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={onResetDefaults}>
            <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
            Reset to defaults
          </Button>
          {/* Opens the SAME create flow + builder as Settings → Templates,
              in place — the wizard stays mounted so its state is preserved. */}
          <Button variant="outline" size="sm" onClick={() => { setNotice(null); setSubView('create') }}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New template
          </Button>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-lg border border-border py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
          No courses selected. Go back and pick courses first.
        </div>
      ) : (
        <DataTable<DesignRow>
          data={rows}
          columns={columns}
          state={tableState}
          getRowId={(r) => r.id}
          selectable
          searchable
          emptyState={
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <i className="fa-light fa-book-open text-lg" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-sm font-medium">No courses selected</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Go back and pick courses first.</p>
            </div>
          }
          bulkActionsSlot={(selected) => (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Set template:</span>
              <Select onValueChange={v => { selected.forEach(id => onTemplateChange(String(id), v)); tableState.setSelected(new Set()) }}>
                <SelectTrigger aria-label="Set template for selected courses" className="h-7 text-xs" style={{ width: 220 }}>
                  <SelectValue placeholder="Choose a template…" />
                </SelectTrigger>
                <SelectContent>
                  {publishedTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      )}

      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={assigned < total || total === 0} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
