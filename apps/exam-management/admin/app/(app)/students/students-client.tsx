'use client'

/**
 * Students list — base entity page for Exam Management.
 *
 * Design per Aarti (May 13 raw transcript):
 *   "I don't want filters and grid and everything. Needs to be a single line
 *    like Google search. Where I can put any attribute about the student."
 *
 *   No filter controls — search only. External InputGroup search sits above
 *   DataTable; DataTable searchable=false so there is one search source.
 *   Cohort is searchable via the text input.
 *
 *   "Recently used students could be highlighted on the right" — concept raised,
 *   not confirmed for launch. Shown as a deferred placeholder.
 *
 * Tab/column variations by product: see docs/BASE-ENTITIES.md
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Badge, Avatar, AvatarFallback,
  Tooltip, TooltipTrigger, TooltipContent,
  Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Input, Label, Separator,
  Popover, PopoverTrigger, PopoverContent,
} from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions } from '@/components/data-table/row-actions'
import { studentListRows, type StudentListRow, type StudentAnnotation } from '@/lib/student-mock-data'

const IS_LMS_ACTIVE = false

// Terms aligned to mock cohort years: "PT Class of 2027" → year 2027, "PT Class of 2028" → year 2028.
const TERMS = ['Fall 2027', 'Spring 2027', 'Fall 2028', 'Spring 2028'] as const
type Term = typeof TERMS[number]
const CURRENT_TERM: Term = 'Fall 2027'

// DataTable requires TData extends Record<string, unknown>.
// Intersect so cell renderers keep full StudentListRow inference.
type StudentTableRow = StudentListRow & Record<string, unknown>

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<StudentTableRow>[] = [
  {
    key: 'select',
    label: '',
    width: 40,
    defaultPin: 'left',
    lockPin: true,
  },
  {
    key: 'student',       // synthetic — no matching data field; cell renderer required
    label: 'Student',
    width: 240,
    sortable: true,
    sortKey: 'fullName',
    cell: (row) => {
      const initials = row.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
      return (
        <div className="flex items-center gap-3">
          <Avatar className="shrink-0" style={{ width: 32, height: 32 }} aria-hidden="true">
            <AvatarFallback
              className="text-[11px] font-bold"
              style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{row.fullName}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{row.studentId}</p>
          </div>
        </div>
      )
    },
  },
  {
    key: 'email',
    label: 'Email',
    width: 200,
    sortable: true,
    sortKey: 'email',
    cell: (row) => (
      <span className="text-sm text-muted-foreground block truncate">{row.email}</span>
    ),
  },
  {
    key: 'cohort',
    label: 'Cohort',
    width: 160,
    sortable: true,
    sortKey: 'cohort',
    cell: (row) => <span className="text-sm text-foreground">{row.cohort}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    width: 110,
    sortable: true,
    sortKey: 'status',
    cell: (row) => {
      const s = row.status as string
      const inactive = s === 'inactive'
      return (
        <Badge variant="secondary" className="rounded text-[11px] font-medium"
          style={{
            backgroundColor: inactive ? 'var(--muted)' : 'var(--state-success-bg-soft)',
            color: inactive ? 'var(--muted-foreground)' : 'var(--state-success-dark)',
          }}>
          {inactive ? 'Inactive' : 'Active'}
        </Badge>
      )
    },
  },
  {
    key: 'courseCount',
    label: 'Courses',
    width: 80,
    sortable: true,
    sortKey: 'courseCount',
    cell: (row) => (
      <span className="text-sm text-foreground tabular-nums">{row.courseCount as number}</span>
    ),
  },
  {
    key: 'advisor',
    label: 'Advisor',
    width: 180,
    sortable: true,
    sortKey: 'advisor',
    cell: (row) => <span className="text-sm text-muted-foreground">{row.advisor as string}</span>,
  },
  {
    key: 'gpa',
    label: 'GPA',
    width: 80,
    sortable: true,
    sortKey: 'gpa',
    cell: (row) => (
      <span className="text-sm font-medium text-foreground tabular-nums">
        {(row.gpa as number).toFixed(2)}
      </span>
    ),
  },
  {
    key: 'tags',
    label: 'Tags',
    width: 200,
    cell: (row) => {
      const tags = (row.annotations as StudentAnnotation[]).filter(a => a.type === 'tag')
      if (tags.length === 0) return <span className="text-muted-foreground text-xs">—</span>
      return (
        <div className="flex items-center gap-1 flex-wrap">
          {tags.slice(0, 2).map(tag => (
            <Tooltip key={tag.id}>
              <TooltipTrigger asChild>
                {/* style maxWidth overrides DS's w-fit; block+min-w-0 on span enables text-overflow */}
                <Badge variant="secondary" className="rounded text-[10px] cursor-default" style={{ maxWidth: 120 }}>
                  <span className="block truncate min-w-0">{tag.text}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{tag.text}</p>
                <p className="text-[10px] text-muted-foreground">Added by {tag.addedBy}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {tags.length > 2 && (
            <Badge variant="secondary" className="rounded text-[10px] shrink-0">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    key: 'actions',
    label: '',
    width: 52,
    defaultPin: 'right',
    lockPin: true,
    cell: (row) => (
      <RowActions
        row={row}
        label={row.fullName}
        actions={[
          ...(!IS_LMS_ACTIVE ? [{ label: 'Edit Student', icon: 'fa-pen', onClick: () => {} }] : []),
          ...(row.prismLinked ? [{ label: 'View in Prism', icon: 'fa-arrow-up-right-from-square', onClick: () => window.open(`https://steps.exxat.com/admin/student/${row.id as string}`, '_blank') }] : []),
          ...(!IS_LMS_ACTIVE ? [{ label: 'Deactivate', icon: 'fa-ban', variant: 'destructive' as const, divider: true, onClick: () => {} }] : []),
        ]}
      />
    ),
  },
]

// ── Add Student Sheet ─────────────────────────────────────────────────────────

function AddStudentSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showOverlay={false} showCloseButton={false} side="right" style={{ width: 480 }}>
        <SheetHeader>
          <SheetTitle>Add Student</SheetTitle>
        </SheetHeader>

        {/* Canvas/LTI info banner — mirrors TermDrawer pattern */}
        <div
          className="mx-4 flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs"
          style={{
            backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
            color: 'var(--brand-color-dark)',
            border: '1px solid color-mix(in oklch, var(--brand-color) 20%, var(--background))',
          }}
          role="note"
        >
          <i className="fa-light fa-circle-info mt-0.5 shrink-0" aria-hidden="true" style={{ fontSize: 13 }} />
          <span>
            When Canvas integration is active, student records are imported automatically. Canvas User ID and Login ID are populated from the LTI launch.
          </span>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-2">
          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-first-name">
              First Name <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="student-first-name"
              placeholder="e.g. Jane"
              required
              aria-required="true"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-last-name">
              Last Name <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="student-last-name"
              placeholder="e.g. Smith"
              required
              aria-required="true"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-email">
              Email <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="student-email"
              type="email"
              placeholder="e.g. jsmith@university.edu"
              required
              aria-required="true"
            />
          </div>

          {/* Student ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-id">
              Student ID <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="student-id"
              placeholder="e.g. STU-2026-0001"
              required
              aria-required="true"
            />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Institutional ID / SIS user_id — used as the unique student identifier across all modules
            </p>
          </div>

          {/* Cohort */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-cohort">
              Cohort <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="student-cohort"
              placeholder="e.g. PT Class of 2027"
              required
              aria-required="true"
            />
          </div>

          {/* Program */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-program">Program</Label>
            <Input
              id="student-program"
              placeholder="e.g. Doctor of Physical Therapy"
            />
          </div>

          <Separator />

          {/* Canvas Integration section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Canvas Integration
          </p>

          {/* Canvas User ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="canvas-user-id">Canvas User ID</Label>
            <Input
              id="canvas-user-id"
              placeholder="Auto-filled when Canvas active"
              disabled
              value=""
            />
          </div>

          {/* Login ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-id">Login ID</Label>
            <Input
              id="login-id"
              placeholder="Auto-filled when Canvas active"
              disabled
              value=""
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Save Student</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentsClient() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<Term>(CURRENT_TERM)
  const [termOpen, setTermOpen] = useState(false)

  // External search — Aarti May 13: "single line like Google search, no filters".
  // Covers non-column fields (program, annotation text) that DataTable's internal
  // search would miss. DataTable receives pre-filtered data; searchable=false.
  // Term filter: uses cohort year as proxy since mock data has cohort not term.
  const filtered = useMemo((): StudentTableRow[] => {
    const q = query.trim().toLowerCase()
    const termYear = selectedTerm.split(' ')[1]
    const rows = studentListRows.filter(s => {
      const matchTerm = s.cohort.includes(termYear)
      const matchQuery = !q || (
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.cohort.toLowerCase().includes(q) ||
        s.advisor.toLowerCase().includes(q) ||
        s.program.toLowerCase().includes(q) ||
        s.annotations.some(a => a.text.toLowerCase().includes(q))
      )
      return matchTerm && matchQuery
    })
    return rows as StudentTableRow[]
  }, [query, selectedTerm])

  return (
    <>
      <SiteHeader title="Students" breadcrumbs={[{ label: 'Students' }]} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Students"
          subtitle={`${filtered.length} of ${studentListRows.length} students`}
          actions={
            IS_LMS_ACTIVE ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full gap-1.5 text-xs"
                  style={{
                    backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
                    color: 'var(--brand-color)',
                  }}
                >
                  <i className="fa-light fa-link" aria-hidden="true" />
                  Managed by Canvas
                </Badge>
              </div>
            ) : (
              <Button size="sm" onClick={() => setAddStudentOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add Student
              </Button>
            )
          }
        />

        <div className="flex flex-1 flex-col gap-0 min-h-0 min-w-0">
            {/* Prominent single search bar — Aarti: "single line like Google search" */}
            <div className="px-4 lg:px-6 pt-4 pb-2 flex flex-col gap-2">
              <SearchInput
                entityKey="students"
                value={query}
                onChange={setQuery}
                placeholder="Search by name, ID, email, cohort, advisor, or tag…"
                aria-label="Search students"
                width="w-full max-w-lg"
              />

              {/* Term filter chip — QB pattern: dashed border = unset, solid = active */}
              <div className="flex items-center gap-2 flex-wrap">
                <Popover open={termOpen} onOpenChange={setTermOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-expanded={termOpen}
                      className="inline-flex items-center gap-1.5 text-xs rounded"
                      style={{
                        height: 26,
                        padding: '0 8px',
                        border: '1.5px dashed var(--border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--muted-foreground)',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <i className="fa-light fa-calendar" aria-hidden="true" style={{ fontSize: 10 }} />
                      <span className="font-medium">{selectedTerm}</span>
                      <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 8 }} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" style={{ width: 180, padding: '6px 0' }}>
                    {TERMS.map(term => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => { setSelectedTerm(term); setTermOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                        style={{ color: term === selectedTerm ? 'var(--brand-color)' : 'var(--foreground)' }}
                      >
                        {term === selectedTerm && (
                          <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10, flexShrink: 0 }} />
                        )}
                        {term !== selectedTerm && <span style={{ width: 14, flexShrink: 0 }} aria-hidden="true" />}
                        {term}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* DataTable — handles column resize, sort, selection, row hover */}
            <DataTable<StudentTableRow>
              data={filtered}
              columns={COLUMNS}
              getRowId={(row) => row.id as string}
              getRowSelectionLabel={(row) => row.fullName}
              selectable
              searchable={false}
              showQueryControls={false}
              onRowClick={(row) => router.push(`/students/${row.id as string}`)}
              emptyState={
                <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <i className="fa-light fa-user-group text-muted-foreground text-xl" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-foreground">No students match your search</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Try a different name, ID, cohort, or advisor.
                  </p>
                </div>
              }
              toolbarSlot={() => (
                <span className="text-xs text-muted-foreground">
                  {filtered.length} student{filtered.length !== 1 ? 's' : ''}
                  {query && ` matching “${query}”`}
                </span>
              )}
            />
        </div>
      </div>

      <AddStudentSheet open={addStudentOpen} onOpenChange={setAddStudentOpen} />
    </>
  )
}
