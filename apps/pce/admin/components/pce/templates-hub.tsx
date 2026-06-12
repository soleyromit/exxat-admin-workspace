'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  PageHeader,
  Tooltip, TooltipTrigger, TooltipContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@exxatdesignux/ui'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
} from '@/lib/list-status-badges'

import { TablePropertiesDrawer } from '@/components/table-properties/drawer'
import type { FilterFieldDef } from '@/components/table-properties/types'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { DeleteTemplateDialog } from '@/components/pce/pce-modals'
import type { PceTemplate, SurveyStatus } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import Link from 'next/link'

interface TemplateRow extends Record<string, unknown> {
  id: string
  template: PceTemplate
  name: string
  questionCount: number
  usedBySurveyCount: number
  status: SurveyStatus
  lastModified: string
}

export function TemplatesHub({ mode }: { mode: 'course_evaluation' | 'general' }) {
  const { templates } = usePce()
  const router = useRouter()
  const [deleteTemplate, setDeleteTemplate] = useState<PceTemplate | null>(null)

  const isGeneral = mode === 'general'
  const title = 'Templates'
  const newTemplateHref = isGeneral ? '/templates/new?mode=programmatic' : '/templates/new'
  const newTemplateLabel = isGeneral ? 'New Template' : 'New Template'

  const modeTemplates = templates.filter(t =>
    isGeneral
      ? t.surveyType === 'programmatic'
      : (!t.surveyType || t.surveyType === 'course_evaluation')
  )

  const rows: TemplateRow[] = modeTemplates.map(t => ({
    id: t.id,
    template: t,
    name: t.name,
    questionCount: t.questionCount,
    usedBySurveyCount: t.usedBySurveyCount,
    status: t.status,
    lastModified: t.lastModified,
  }))

  const courseTypeColumn: ColumnDef<TemplateRow> = {
    key: 'courseType',
    label: 'Course type',
    sortable: true,
    width: 140,
    filter: {
      type: 'select',
      icon: 'fa-chalkboard-teacher',
      operators: ['is', 'is_not'],
      options: [
        { value: 'didactic', label: 'Didactic' },
        { value: 'clinical', label: 'Clinical' },
      ],
    },
    cell: (row) => {
      const ct = row.template.courseType
      if (!ct || ct === 'any') return <span className="text-sm text-muted-foreground">Any</span>
      return (
        <span
          className="text-xs font-medium rounded px-1.5 py-0.5"
          style={{
            background: ct === 'didactic' ? 'var(--brand-tint)' : 'var(--muted)',
            color: ct === 'didactic' ? 'var(--brand-color)' : 'var(--muted-foreground)',
          }}
        >
          {ct === 'didactic' ? 'Didactic' : 'Clinical'}
        </span>
      )
    },
  }

  const columns: ColumnDef<TemplateRow>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: 280,
      cell: (row) => (
        <Link
          href={`/templates/${row.template.id}`}
          className="font-medium hover:underline text-sm text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          {row.template.name}
        </Link>
      ),
    },
    ...(!isGeneral ? [courseTypeColumn] : []),
    {
      key: 'questionCount',
      label: 'Questions',
      sortable: true,
      width: 120,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.template.questionCount > 0
            ? <><span className="font-medium text-foreground">{row.template.questionCount}</span> questions</>
            : 'No questions'}
        </span>
      ),
    },
    {
      key: 'usedBySurveyCount',
      label: 'Used by',
      sortable: true,
      width: 140,
      cell: (row) => (
        row.template.usedBySurveyCount > 0 ? (
          <Button variant="link" size="sm" className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground">
            <span className="font-medium text-foreground">{row.template.usedBySurveyCount}</span>
            &nbsp;{row.template.usedBySurveyCount === 1 ? 'survey' : 'surveys'}
            <i className="fa-light fa-arrow-up-right-from-square ms-1 text-xs" aria-hidden="true" />
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">Not used</span>
        )
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 150,
      filter: {
        type: 'select',
        icon: 'fa-circle-dot',
        operators: ['is', 'is_not'],
        options: [
          {
            value: 'active',
            label: 'Active',
            node: <ListHubStatusBadge label="Active" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />,
          },
          {
            value: 'draft',
            label: 'Draft',
            node: <ListHubStatusBadge label="Draft" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-pen-to-square" />,
          },
        ],
      },
      cell: (row) => (
        row.template.status === 'active'
          ? <ListHubStatusBadge label="Active" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
          : <ListHubStatusBadge label="Draft" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-pen-to-square" />
      ),
    },
    {
      key: 'lastModified',
      label: 'Last modified',
      sortable: true,
      width: 160,
      cell: (row) => (
        <span className="text-sm font-medium text-muted-foreground">{row.template.lastModified}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => (
        <RowActions
          onEdit={() => router.push(`/templates/${row.template.id}`)}
          onDelete={() => setDeleteTemplate(row.template)}
        />
      ),
    },
  ]

  const subtitle = `${rows.length} ${rows.length === 1 ? 'template' : 'templates'}`

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader title={title} />
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2" role="group" aria-label="Template actions">
            <Button size="lg" onClick={() => router.push(newTemplateHref)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              {newTemplateLabel}
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto" style={{ paddingBlock: 16, paddingInline: 0 }}>
        {rows.length === 0 ? (
          <EmptyState onCreate={() => router.push(newTemplateHref)} isGeneral={isGeneral} />
        ) : (
          <DataTable<TemplateRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            onRowClick={(row) => {
              window.location.href = `/templates/${row.template.id}`
            }}
            toolbarSlot={(state) => {
              const filterFields: FilterFieldDef[] = columns
                .filter(c => c.filter)
                .map(c => ({
                  key: c.key,
                  label: c.label,
                  icon: c.filter!.icon ?? 'fa-filter',
                  type: c.filter!.type,
                  operators: c.filter!.operators ?? ['is', 'is_not'],
                  options: c.filter!.options,
                }))
              return (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Table properties"
                        aria-expanded={state.sheetOpen}
                        onClick={() => state.setSheetOpen(o => !o)}
                      >
                        <i className="fa-light fa-sliders text-[13px]" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Table properties</TooltipContent>
                  </Tooltip>
                  <TablePropertiesDrawer
                    open={state.sheetOpen}
                    onOpenChange={state.setSheetOpen}
                    activeFilters={state.activeFilters}
                    onAddFilter={state.addFilter}
                    onUpdateFilter={state.updateFilter}
                    onRemoveFilter={state.removeFilter}
                    getFilterConnector={state.getConnector}
                    onToggleFilterConnector={state.toggleConnector}
                    filterFields={filterFields}
                    totalRows={rows.length}
                    filteredRows={state.rows.length}
                    sortRules={state.sortRules}
                    onSortRulesChange={state.setSortRules}
                    onAddSortRule={state.addSortRule}
                    onRemoveSortRule={state.removeSortRule}
                    onToggleSortDir={state.toggleSortDir}
                    colOrder={state.colOrder}
                    onColOrderChange={state.setColOrder}
                    hiddenCols={state.hiddenCols}
                    onToggleColVisibility={state.toggleColVisibility}
                    onMoveCol={state.moveCol}
                    resolveColumnLabel={(key) => columns.find(c => c.key === key)?.label ?? key}
                    orderableKeys={columns.filter(c => c.key !== 'actions').map(c => c.key)}
                  />
                </>
              )
            }}
          />
        )}
      </div>

      <DeleteTemplateDialog
        open={!!deleteTemplate}
        onOpenChange={v => { if (!v) setDeleteTemplate(null) }}
        template={deleteTemplate}
      />
    </div>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <DropdownMenu modal={false} onOpenChange={setMenuOpen} open={menuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Template actions"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fa-regular fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onEdit}>
          <i className="fa-light fa-pen" aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <i className="fa-light fa-copy" aria-hidden="true" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <i className="fa-light fa-trash-can" aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmptyState({ onCreate, isGeneral }: { onCreate: () => void; isGeneral: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i
        className="fa-light fa-rectangle-list"
        aria-hidden="true"
        style={{ fontSize: 40, color: 'var(--muted-foreground)' }}
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {isGeneral ? 'No programmatic templates yet' : 'No templates yet'}
        </p>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
          {isGeneral
            ? 'Create a template for alumni outcomes, preceptor satisfaction, or other program-level surveys.'
            : 'Create a template to start distributing evaluations.'}
        </p>
      </div>
      <Button variant="default" size="sm" onClick={onCreate}>
        <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
        {isGeneral ? 'Create Template' : 'Create Template'}
      </Button>
    </div>
  )
}
