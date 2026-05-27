'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { DeleteTemplateDialog } from '@/components/pce/pce-modals'
import type { PceTemplate, SurveyStatus, SurveyType } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import Link from 'next/link'

/* Flat row type. Sortable scalars are real properties so DataTable can sort
   directly. `template` carries the source-of-truth object for renderers. */
interface TemplateRow extends Record<string, unknown> {
  id: string
  template: PceTemplate
  name: string
  questionCount: number
  usedBySurveyCount: number
  status: SurveyStatus
  lastModified: string
}

export default function TemplatesPage() {
  const { templates, surveyMode, createTemplate, user } = usePce()
  const router = useRouter()
  const [deleteTemplate, setDeleteTemplate] = useState<PceTemplate | null>(null)

  function handleNewTemplate() {
    const id = createTemplate({
      name: 'Untitled template',
      sections: ['course_content'],
      status: 'draft',
      questionCount: 0,
      createdBy: user.name,
      surveyType: (surveyMode === 'general' ? 'programmatic' : 'course_evaluation') as SurveyType,
      questions: { course_content: [], faculty_performance: [], course_director: [] },
      likertPointer: 5,
      templateSections: [],
    })
    router.push(`/templates/${id}`)
  }

  const modeTemplates = templates.filter(t =>
    surveyMode === 'course_evaluation'
      ? (!t.surveyType || t.surveyType === 'course_evaluation')
      : t.surveyType === 'programmatic'
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
      width: 140,
      cell: (row) => <SurveyStatusBadge status={row.template.status} />,
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

  return (
    <>
      {/* Page header */}
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>Templates</h1>
        <Button variant="default" size="sm" onClick={handleNewTemplate}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          New Template
        </Button>
      </header>

      <div className="flex-1 overflow-auto" style={{ paddingBlock: 16, paddingInline: 0 }}>
        {rows.length === 0 ? (
          <EmptyState onCreate={handleNewTemplate} mode={surveyMode} />
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
            toolbarSlot={(state) => (
              <span className="text-xs text-muted-foreground">
                {state.rows.length} template{state.rows.length !== 1 ? 's' : ''}
              </span>
            )}
          />
        )}
      </div>

      <DeleteTemplateDialog
        open={!!deleteTemplate}
        onOpenChange={v => { if (!v) setDeleteTemplate(null) }}
        template={deleteTemplate}
      />
    </>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    // modal={false} — see components/data-table/row-actions.tsx: prevents
    // Radix hideOthers from setting aria-hidden on sidebar-wrapper while
    // row menu is open (axe aria-hidden-focus). Fixed 2026-05-11.
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

function EmptyState({ onCreate, mode }: { onCreate: () => void; mode: 'course_evaluation' | 'general' }) {
  const isGeneral = mode === 'general'
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i
        className="fa-light fa-rectangle-list"
        aria-hidden="true"
        style={{ fontSize: 40, color: 'var(--muted-foreground)' }}
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{isGeneral ? 'No general survey templates yet' : 'No templates yet'}</p>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
          {isGeneral
            ? 'Create a template for alumni outcomes, preceptor satisfaction, or other program-level surveys.'
            : 'Create a template to start distributing post course evaluations.'}
        </p>
      </div>
      <Button variant="default" size="sm" onClick={onCreate}>
        <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
        {isGeneral ? 'Create General Template' : 'Create Template'}
      </Button>
    </div>
  )
}
