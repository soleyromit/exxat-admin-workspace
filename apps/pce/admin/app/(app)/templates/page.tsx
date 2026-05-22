'use client'

import { useState } from 'react'
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { TemplateSectionChips, SurveyStatusBadge } from '@/components/pce/pce-badges'
import { CreateTemplateSheet, DeleteTemplateDialog } from '@/components/pce/pce-modals'
import type { PceTemplate, TemplateSection, SurveyStatus } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import Link from 'next/link'

/* Flat row type. Sortable scalars are real properties so DataTable can sort
   directly. `template` carries the source-of-truth object for renderers. */
interface TemplateRow extends Record<string, unknown> {
  id: string
  template: PceTemplate
  name: string
  sections: TemplateSection[]
  questionCount: number
  usedBySurveyCount: number
  status: SurveyStatus
  lastModified: string
}

export default function TemplatesPage() {
  const { templates } = usePce()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<PceTemplate | null>(null)
  const [deleteTemplate, setDeleteTemplate] = useState<PceTemplate | null>(null)

  const rows: TemplateRow[] = templates.map(t => ({
    id: t.id,
    template: t,
    name: t.name,
    sections: t.sections,
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
      key: 'sections',
      label: 'Sections',
      width: 280,
      cell: (row) => <TemplateSectionChips sections={row.template.sections} />,
    },
    {
      key: 'questionCount',
      label: 'Questions',
      sortable: true,
      width: 110,
      cell: (row) => (
        <div className="text-right tabular-nums text-sm">{row.template.questionCount}</div>
      ),
    },
    {
      key: 'usedBySurveyCount',
      label: 'Used by',
      sortable: true,
      width: 110,
      cell: (row) => (
        <div className="text-right">
          {row.template.usedBySurveyCount > 0 ? (
            <Button variant="link" size="sm" className="h-auto p-0 tabular-nums text-sm">
              {row.template.usedBySurveyCount}
            </Button>
          ) : (
            <span className="tabular-nums text-sm text-muted-foreground">0</span>
          )}
        </div>
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
          onEdit={() => setEditTemplate(row.template)}
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
        <Button variant="default" size="sm" onClick={() => setCreateOpen(true)}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          New Template
        </Button>
      </header>

      <div className="flex-1 overflow-auto" style={{ paddingBlock: 16, paddingInline: 0 }}>
        {rows.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
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

      <CreateTemplateSheet
        open={createOpen}
        onOpenChange={v => { setCreateOpen(v) }}
      />
      <CreateTemplateSheet
        open={!!editTemplate}
        onOpenChange={v => { if (!v) setEditTemplate(null) }}
        template={editTemplate ?? undefined}
      />
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i
        className="fa-light fa-rectangle-list"
        aria-hidden="true"
        style={{ fontSize: 40, color: 'var(--muted-foreground)' }}
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">No templates yet</p>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
          Create a template to start distributing post course evaluations.
        </p>
      </div>
      <Button variant="default" size="sm" onClick={onCreate}>
        <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
        Create Template
      </Button>
    </div>
  )
}
