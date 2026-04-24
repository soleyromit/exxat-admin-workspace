'use client'

import { useState } from 'react'
import {
  Button, Input, InputGroup, InputGroupAddon, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Tooltip, TooltipTrigger, TooltipContent, SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { TemplateSectionChips, SurveyStatusBadge } from '@/components/pce/pce-badges'
import { CreateTemplateSheet, DeleteTemplateDialog } from '@/components/pce/pce-modals'
import type { PceTemplate } from '@/lib/pce-mock-data'
import Link from 'next/link'

export default function TemplatesPage() {
  const { templates } = usePce()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<PceTemplate | null>(null)
  const [deleteTemplate, setDeleteTemplate] = useState<PceTemplate | null>(null)
  const [search, setSearch] = useState('')

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Page header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-semibold flex-1">Templates</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          New Template
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <InputGroup className="w-56">
          <InputGroupAddon align="inline-start">
            <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
          </InputGroupAddon>
          <Input
            placeholder="Search templates…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </InputGroup>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4">
        {filtered.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} hasSearch={search.length > 0} />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead className="text-right">Used by</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last modified</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TemplateRow
                    key={t.id}
                    template={t}
                    onEdit={() => setEditTemplate(t)}
                    onDelete={() => setDeleteTemplate(t)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

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

function TemplateRow({
  template,
  onEdit,
  onDelete,
}: {
  template: PceTemplate
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <TableRow
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      <TableCell>
        <Link
          href={`/templates/${template.id}`}
          className="font-medium hover:underline"
          style={{ color: 'var(--foreground)' }}
        >
          {template.name}
        </Link>
      </TableCell>
      <TableCell><TemplateSectionChips sections={template.sections} /></TableCell>
      <TableCell className="text-right tabular-nums text-sm">{template.questionCount}</TableCell>
      <TableCell className="text-right">
        {template.usedBySurveyCount > 0 ? (
          <Button variant="link" size="sm" className="h-auto p-0 text-sm tabular-nums">
            {template.usedBySurveyCount}
          </Button>
        ) : (
          <span className="text-sm tabular-nums" style={{ color: 'var(--muted-foreground)' }}>0</span>
        )}
      </TableCell>
      <TableCell>
        <SurveyStatusBadge status={template.status} />
      </TableCell>
      <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {template.lastModified}
      </TableCell>
      <TableCell>
        <div
          style={{
            opacity: hovered || menuOpen ? 1 : 0,
            transition: 'opacity 100ms',
          }}
        >
          <DropdownMenu onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Template actions">
                <i className="fa-regular fa-ellipsis" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
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
        </div>
      </TableCell>
    </TableRow>
  )
}

function EmptyState({ onCreate, hasSearch }: { onCreate: () => void; hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i
        className="fa-light fa-rectangle-list"
        aria-hidden="true"
        style={{ fontSize: 40, color: 'var(--muted-foreground)' }}
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {hasSearch ? 'No templates match your search' : 'No templates yet'}
        </p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
          {hasSearch
            ? 'Try a different search term.'
            : 'Create a template to start distributing post course evaluations.'
          }
        </p>
      </div>
      {!hasSearch && (
        <Button size="sm" onClick={onCreate}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create Template
        </Button>
      )}
    </div>
  )
}
