'use client'

/**
 * Courses page — unified 3-tab view matching Prism pattern.
 *
 * Admin: Tabs — Course Offerings (default) | Course Catalog | Setup
 * Faculty: My Courses (card/list view, no tabs)
 *
 * Previously, Terms and Course Catalog were standalone sidebar nav items.
 * Per Prism reference (Images #10-12) and Aarti May 8: "menu items have to
 * only be limited to the entities that I care about." Setup items collapse here.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEntryPoint } from '@/lib/use-entry-point'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
  Button, Badge,
  InputGroup, InputGroupAddon, InputGroupInput,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  ViewSegmentedControl,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Input, Label, Separator, Textarea,
} from '@exxat/ds/packages/ui/src'
import { RowActions } from '@/components/data-table/row-actions'
import { SearchInput } from '@/components/search-input'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { loadRecentlyViewed, type RecentlyViewedItem } from '@/lib/recently-viewed'
import { mockCourses, mockCourseOfferings, mockAssessments } from '@/lib/qb-mock-data'
import {
  facultyStudents, facultyAccommodations, courseObjectives, facultyExtraAssessments,
  facultyListRows,
} from '@/lib/faculty-mock-data'
import { useAssessmentReviews } from '@/lib/assessment-review-store'
import { useFacultySession } from '@/lib/faculty-session'
import { AccessLevelChip, StatusPill } from '@/components/faculty-ui-kit'
import { ActionItemsPanel } from '@/components/action-items-panel'
import { StubButton } from '@/components/stub-button'
import { terms as initialTerms, type Term } from '@/lib/terms-mock-data'
import { masterCourses, type MasterCourse } from '@/lib/course-catalog-mock-data'
import { courseOfferingRows, type CourseOfferingRow } from '@/lib/course-mock-data'

const ALL_ASSESSMENTS = [...mockAssessments, ...facultyExtraAssessments]

// ── Shared helpers ────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatCourseCode(code: string): string {
  const m = code.match(/^(\D+)(\d+)$/)
  return m ? `${m[1]} ${m[2]}` : code
}

// ══════════════════════════════════════════════════════════════════════════════
// SETUP TAB — Terms DataTable + stub sections (Academic Years, Prof. Years)
// ══════════════════════════════════════════════════════════════════════════════

type TermTableRow = Term & Record<string, unknown>

const TERM_STATUS_CONFIG: Record<
  Term['status'],
  { label: string; icon: string; bg: string; fg: string }
> = {
  active: {
    label: 'Active',
    icon: 'fa-circle-check',
    bg: 'var(--qb-status-saved-bg)',
    fg: 'var(--qb-status-saved-fg)',
  },
  upcoming: {
    label: 'Upcoming',
    icon: 'fa-hourglass',
    bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
    fg: 'var(--brand-color-dark)',
  },
  completed: {
    label: 'Completed',
    icon: 'fa-circle-check',
    bg: 'var(--muted)',
    fg: 'var(--muted-foreground)',
  },
}

function TermStatusBadge({ status }: { status: Term['status'] }) {
  const s = TERM_STATUS_CONFIG[status]
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-3 py-1 gap-1.5 font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <i className={`fa-light ${s.icon}`} aria-hidden="true" style={{ fontSize: 11 }} />
      {s.label}
    </Badge>
  )
}

function buildTermColumns(onEdit: (t: TermTableRow) => void): ColumnDef<TermTableRow>[] {
  return [
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'label', label: 'Term', width: 180, sortable: true, sortKey: 'label',
      cell: (row) => <span className="text-sm font-medium text-foreground">{row.label as string}</span>,
    },
    {
      key: 'academicYear', label: 'Academic Year', width: 160, sortable: true, sortKey: 'academicYear',
      cell: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {(row.academicYear as string).replace('-', '–')}
        </span>
      ),
    },
    {
      key: 'startDate', label: 'Start Date', width: 140, sortable: true, sortKey: 'startDate',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">
          {formatDate(row.startDate as string)}
        </span>
      ),
    },
    {
      key: 'endDate', label: 'End Date', width: 140, sortable: true, sortKey: 'endDate',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">
          {formatDate(row.endDate as string)}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status', width: 140, sortable: true, sortKey: 'status',
      cell: (row) => <TermStatusBadge status={row.status as Term['status']} />,
    },
    {
      key: 'actions', label: '', width: 52, defaultPin: 'right', lockPin: true,
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${row.label as string}`}
          onClick={(e) => { e.stopPropagation(); onEdit(row) }}
        >
          <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 13 }} />
        </Button>
      ),
    },
  ]
}

function blankTerm(): Term {
  return { id: '', label: '', academicYear: '', startDate: '', endDate: '', status: 'upcoming', sisTermId: '', notes: '' }
}

interface TermDrawerProps {
  open: boolean
  term: Term
  isNew: boolean
  onClose: () => void
  onSave: (t: Term) => void
}

function TermDrawer({ open, term, isNew, onClose, onSave }: TermDrawerProps) {
  const [draft, setDraft] = useState<Term>(term)
  useEffect(() => { setDraft(term) }, [term])

  function field<K extends keyof Term>(key: K, value: Term[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent showOverlay={false} showCloseButton={false} side="right" style={{ width: 420 }}>
        <SheetHeader>
          <SheetTitle>{isNew ? 'Add Term' : 'Edit Term'}</SheetTitle>
        </SheetHeader>

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
          <span>When Canvas integration is active, terms are imported automatically and fields are locked.</span>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-label">
              Term Label <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input id="term-label" placeholder="e.g. Fall 2026" value={draft.label}
              onChange={(e) => field('label', e.target.value)} required aria-required="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-academic-year">
              Academic Year <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input id="term-academic-year" placeholder="e.g. 2026-2027" value={draft.academicYear}
              onChange={(e) => field('academicYear', e.target.value)} required aria-required="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-start-date">
              Start Date <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input id="term-start-date" type="date" value={draft.startDate}
              onChange={(e) => field('startDate', e.target.value)} required aria-required="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-end-date">
              End Date <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input id="term-end-date" type="date" value={draft.endDate}
              onChange={(e) => field('endDate', e.target.value)} required aria-required="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-status">Status</Label>
            <Select value={draft.status} onValueChange={(v) => field('status', v as Term['status'])}>
              <SelectTrigger id="term-status" aria-label="Status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-sis-id">
              SIS Term ID{' '}
              <span className="text-xs font-normal text-muted-foreground">(Canvas)</span>
            </Label>
            <Input id="term-sis-id" placeholder="Auto-filled when Canvas is active"
              value={draft.sisTermId ?? ''}
              onChange={(e) => field('sisTermId', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-notes">Notes</Label>
            <Textarea
              id="term-notes"
              placeholder="Optional notes about this term…"
              value={draft.notes ?? ''}
              onChange={(e) => field('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)}>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SetupTab() {
  const [data, setData] = useState<Term[]>(initialTerms)
  const [query, setQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term>(blankTerm())
  const [isNew, setIsNew] = useState(true)

  const filtered = useMemo((): TermTableRow[] => {
    const q = query.trim().toLowerCase()
    const rows = q
      ? data.filter((t) =>
          t.label.toLowerCase().includes(q) ||
          t.academicYear.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q) ||
          (t.sisTermId ?? '').toLowerCase().includes(q) ||
          (t.notes ?? '').toLowerCase().includes(q)
        )
      : data
    return rows as TermTableRow[]
  }, [data, query])

  const openAdd = useCallback(() => {
    setEditingTerm(blankTerm()); setIsNew(true); setDrawerOpen(true)
  }, [])

  const openEdit = useCallback((row: TermTableRow) => {
    setEditingTerm(row as Term); setIsNew(false); setDrawerOpen(true)
  }, [])

  const handleSave = useCallback((term: Term) => {
    if (isNew) {
      setData((prev) => [{ ...term, id: `term-${Date.now()}` }, ...prev])
    } else {
      setData((prev) => prev.map((t) => (t.id === term.id ? term : t)))
    }
    setDrawerOpen(false)
  }, [isNew])

  const columns = useMemo(() => buildTermColumns(openEdit), [openEdit])

  return (
    <>
      {/* Terms section */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-3 shrink-0 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-foreground">Terms</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.length} term{data.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput
              entityKey="terms"
              value={query}
              onChange={setQuery}
              placeholder="Search terms…"
              aria-label="Search terms"
              width="w-56"
            />
            <Button size="sm" onClick={openAdd}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add Term
            </Button>
          </div>
        </div>

        <DataTable<TermTableRow>
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id as string}
          getRowSelectionLabel={(row) => row.label as string}
          selectable
          searchable={false}
          showQueryControls={false}
          defaultSort={{ key: 'startDate', dir: 'desc' }}
          emptyState={
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <i className="fa-light fa-calendar-days text-muted-foreground text-lg" aria-hidden="true" />
              </div>
              <p className="font-semibold text-foreground">
                {query ? 'No terms match your search' : 'No terms yet'}
              </p>
              {!query && (
                <Button size="sm" className="mt-1" onClick={openAdd}>
                  <i className="fa-light fa-plus" aria-hidden="true" />
                  Add Term
                </Button>
              )}
            </div>
          }
          toolbarSlot={() => (
            <span className="text-xs text-muted-foreground">
              {filtered.length} term{filtered.length !== 1 ? 's' : ''}
              {query && ` matching "${query}"`}
            </span>
          )}
        />
      </div>

      {/* Stub sections below terms */}
      <div className="shrink-0 border-t border-border px-6 py-5 flex flex-col gap-5">
        <StubSection
          icon="fa-layer-group"
          title="Professional Years"
          description="Define professional year groupings (P1, P2, P3, P4) for your program cohorts."
        />
        <StubSection
          icon="fa-calendar-range"
          title="Academic Years"
          description="Configure academic year boundaries. Academic years group terms for reporting and curriculum mapping."
        />
        <StubSection
          icon="fa-tag"
          title="Additional Course Identifiers"
          description="Add custom course identifiers used alongside the standard course number (e.g. section codes, LMS IDs)."
        />
      </div>

      <TermDrawer
        open={drawerOpen}
        term={editingTerm}
        isNew={isNew}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

function StubSection({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-md mt-0.5"
        style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
      >
        <i className={`fa-light ${icon}`} aria-hidden="true" style={{ fontSize: 14 }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <StubButton variant="outline" size="sm" className="shrink-0">
        Configure
      </StubButton>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COURSE CATALOG TAB
// ══════════════════════════════════════════════════════════════════════════════

type MasterCourseRow = MasterCourse & Record<string, unknown>

const CATALOG_TYPE_STYLES: Record<MasterCourse['type'], { bg: string; fg: string }> = {
  Core: {
    bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
    fg: 'var(--brand-color-dark)',
  },
  Elective: { bg: 'var(--muted)', fg: 'var(--muted-foreground)' },
}

function buildCatalogColumns(onEdit: (c: MasterCourse) => void): ColumnDef<MasterCourseRow>[] {
  return [
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'courseNumber', label: 'Course Number', width: 140, sortable: true, sortKey: 'courseNumber',
      cell: (row) => (
        <span className="text-sm font-mono font-medium text-foreground">
          {row.courseNumber as string}
        </span>
      ),
    },
    {
      key: 'courseName', label: 'Course Name', width: 280, sortable: true, sortKey: 'courseName',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-0 py-0 font-medium text-sm justify-start"
          style={{ color: 'var(--brand-color)' }}
          onClick={(e) => { e.stopPropagation(); onEdit(row as unknown as MasterCourse) }}
          aria-label={`Edit ${row.courseName as string}`}
        >
          {row.courseName as string}
        </Button>
      ),
    },
    {
      key: 'credits', label: 'Credits', width: 80, sortable: true, sortKey: 'credits',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">{row.credits as number}</span>
      ),
    },
    {
      key: 'type', label: 'Type', width: 100, sortable: true, sortKey: 'type',
      cell: (row) => {
        const t = row.type as MasterCourse['type']
        const s = CATALOG_TYPE_STYLES[t]
        return (
          <Badge
            variant="secondary"
            className="rounded text-[11px] font-medium"
            style={{ backgroundColor: s.bg, color: s.fg }}
          >
            {t}
          </Badge>
        )
      },
    },
    {
      key: 'department', label: 'Department', width: 180, sortable: true, sortKey: 'department',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.department as string}</span>
      ),
    },
    {
      key: 'actions', label: '', width: 52, defaultPin: 'right', lockPin: true,
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${row.courseName as string}`}
          onClick={(e) => { e.stopPropagation(); onEdit(row as unknown as MasterCourse) }}
        >
          <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 13 }} />
        </Button>
      ),
    },
  ]
}

const BLANK_CATALOG_FORM: Omit<MasterCourse, 'id'> = {
  courseNumber: '', courseName: '', credits: 3, type: 'Core', department: '', description: '', prerequisites: '', sisId: '',
}

function CourseCatalogTab() {
  const [query, setQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<MasterCourse | null>(null)
  const [form, setForm] = useState<Omit<MasterCourse, 'id'>>(BLANK_CATALOG_FORM)

  function openAdd() { setEditing(null); setForm(BLANK_CATALOG_FORM); setDrawerOpen(true) }
  function openEdit(course: MasterCourse) {
    setEditing(course)
    setForm({
      courseNumber: course.courseNumber, courseName: course.courseName,
      credits: course.credits, type: course.type, department: course.department,
      description: course.description ?? '', prerequisites: course.prerequisites ?? '',
      sisId: course.sisId ?? '',
    })
    setDrawerOpen(true)
  }

  const columns = useMemo(() => buildCatalogColumns(openEdit), [])

  const filtered = useMemo((): MasterCourseRow[] => {
    const q = query.trim().toLowerCase()
    const rows = q
      ? masterCourses.filter((c) =>
          c.courseNumber.toLowerCase().includes(q) ||
          c.courseName.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q) ||
          (c.sisId ?? '').toLowerCase().includes(q)
        )
      : masterCourses
    return rows as MasterCourseRow[]
  }, [query])

  return (
    <>
      {/* Info banner */}
      <div className="px-6 pt-4 pb-2 shrink-0">
        <div
          className="rounded-lg border border-border flex items-start gap-2.5 px-3 py-2.5 text-[13px]"
          style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 6%, var(--background))' }}
          role="note"
        >
          <i className="fa-light fa-circle-info mt-0.5 shrink-0" aria-hidden="true"
            style={{ color: 'var(--brand-color)', fontSize: 14 }} />
          <span style={{ color: 'var(--muted-foreground)' }}>
            When a course offering is created from this catalog, a{' '}
            <strong style={{ color: 'var(--foreground)', fontWeight: 500 }}>Question Bank shell</strong>{' '}
            is automatically generated with the same name.
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 pb-2 shrink-0 flex-wrap">
        <SearchInput
          entityKey="course-catalog"
          value={query}
          onChange={setQuery}
          placeholder="Search by number, name, department…"
          aria-label="Search courses"
        />
        <Button size="sm" onClick={openAdd}>
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add Course
        </Button>
      </div>

      <DataTable<MasterCourseRow>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id as string}
        getRowSelectionLabel={(row) => row.courseName as string}
        selectable
        searchable={false}
        showQueryControls={false}
        onRowClick={(row) => openEdit(row as unknown as MasterCourse)}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <i className="fa-light fa-book-open text-muted-foreground text-lg" aria-hidden="true" />
            </div>
            <p className="font-semibold text-foreground">No courses match your search</p>
            <p className="text-sm text-muted-foreground">Try a different course number, name, or department.</p>
          </div>
        }
        toolbarSlot={() => (
          <span className="text-xs text-muted-foreground">
            {filtered.length} course{filtered.length !== 1 ? 's' : ''}
            {query && ` matching "${query}"`}
          </span>
        )}
      />

      {/* Add / Edit drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent showOverlay={false} showCloseButton side="right" style={{ width: 480 }}>
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Course' : 'Add Course'}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4 overflow-y-auto flex-1 px-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-number">
                Course Number <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
              </Label>
              <Input id="course-number" placeholder="e.g. PHARM 501" value={form.courseNumber}
                onChange={(e) => setForm((f) => ({ ...f, courseNumber: e.target.value }))}
                required aria-required="true" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-name">
                Course Name <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
              </Label>
              <Input id="course-name" placeholder="e.g. Pharmacology I" value={form.courseName}
                onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}
                required aria-required="true" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="credits">Credits</Label>
              <Input id="credits" type="number" min={1} max={12} placeholder="3" value={form.credits}
                onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as MasterCourse['type'] }))}>
                <SelectTrigger id="course-type" aria-label="Course type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Core">Core</SelectItem>
                  <SelectItem value="Elective">Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" placeholder="e.g. Pharmacy" value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Brief description of the course…"
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prerequisites">
                Prerequisites{' '}
                <span className="text-xs font-normal text-muted-foreground">(comma-separated)</span>
              </Label>
              <Input id="prerequisites" placeholder="e.g. PHARM 501, PHARM 502"
                value={form.prerequisites ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, prerequisites: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="catalog-sis-id">
                SIS Course ID{' '}
                <span className="text-xs font-normal text-muted-foreground">(Canvas)</span>
              </Label>
              <Input id="catalog-sis-id" placeholder="Auto-filled when Canvas is active"
                value={form.sisId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, sisId: e.target.value }))} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button onClick={() => setDrawerOpen(false)}>Save Course</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD OFFERING SHEET
// ══════════════════════════════════════════════════════════════════════════════

function AddOfferingSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [masterCourseId, setMasterCourseId] = useState('')
  const [termId, setTermId] = useState('')
  const [facultyId, setFacultyId] = useState('')

  const activeTerms = initialTerms.filter((t) => t.status === 'active' || t.status === 'upcoming')
  const activeFaculty = facultyListRows.filter((f) => f.status === 'active')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showOverlay={false} showCloseButton={false} side="right" style={{ width: 480 }}>
        <SheetHeader>
          <SheetTitle>Add Course Offering</SheetTitle>
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
            When Canvas integration is active, course offerings are created automatically from your Canvas courses. Canvas Course ID and SIS Course ID are populated from the LTI context.
          </span>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-2">
          {/* Master Course */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offering-master-course">
              Master Course <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Select value={masterCourseId} onValueChange={setMasterCourseId}>
              <SelectTrigger id="offering-master-course" aria-label="Master Course">
                <SelectValue placeholder="Select a course from catalog" />
              </SelectTrigger>
              <SelectContent>
                {masterCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.courseNumber} — {c.courseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Term */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offering-term">
              Term <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger id="offering-term" aria-label="Term">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {activeTerms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cohort */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offering-cohort">
              Cohort <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="offering-cohort"
              placeholder="e.g. DPT Cohort 2025"
              required
              aria-required="true"
            />
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offering-start-date">
              Start Date <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="offering-start-date"
              type="date"
              required
              aria-required="true"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offering-end-date">
              End Date <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="offering-end-date"
              type="date"
              required
              aria-required="true"
            />
          </div>

          {/* Primary Faculty */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offering-faculty">
              Primary Faculty <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Select value={facultyId} onValueChange={setFacultyId}>
              <SelectTrigger id="offering-faculty" aria-label="Primary Faculty">
                <SelectValue placeholder="Select faculty member" />
              </SelectTrigger>
              <SelectContent>
                {activeFaculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Canvas Integration section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Canvas Integration
          </p>

          {/* SIS Course ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offering-sis-course-id">
              SIS Course ID{' '}
              <span className="text-xs font-normal text-muted-foreground">($Canvas.course.sisSourceId)</span>
            </Label>
            <Input
              id="offering-sis-course-id"
              placeholder="Auto-filled when Canvas active"
              disabled
              value=""
            />
          </div>

          {/* Canvas Course ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offering-canvas-course-id">
              Canvas Course ID{' '}
              <span className="text-xs font-normal text-muted-foreground">(context.id)</span>
            </Label>
            <Input
              id="offering-canvas-course-id"
              placeholder="Auto-filled when Canvas active"
              disabled
              value=""
            />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Used for NRPS roster sync and AGS grade passback
            </p>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Create Offering</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COURSE OFFERINGS TAB
// ══════════════════════════════════════════════════════════════════════════════

type OfferingTableRow = CourseOfferingRow & Record<string, unknown>
type OfferingStatus = CourseOfferingRow['status'] | 'all'

const OFFERING_STATUS_CONFIG: Record<
  CourseOfferingRow['status'],
  { label: string; bg: string; fg: string }
> = {
  ongoing: {
    label: 'Ongoing',
    bg: 'var(--qb-status-saved-bg)',
    fg: 'var(--qb-status-saved-fg)',
  },
  completed: { label: 'Completed', bg: 'var(--muted)', fg: 'var(--muted-foreground)' },
  upcoming: {
    label: 'Upcoming',
    bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
    fg: 'var(--brand-color-dark)',
  },
}

function OfferingStatusBadge({ status }: { status: CourseOfferingRow['status'] }) {
  const s = OFFERING_STATUS_CONFIG[status]
  return (
    <Badge
      variant="secondary"
      className="rounded text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {s.label}
    </Badge>
  )
}

function buildOfferingColumns(isPrism: boolean): ColumnDef<OfferingTableRow>[] {
  return [
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'courseNumber', label: 'Course Number', width: 140, sortable: true, sortKey: 'courseNumber',
      cell: (row) => (
        <span className="text-sm font-mono font-medium text-foreground">
          {row.courseNumber as string}
        </span>
      ),
    },
    {
      key: 'courseName', label: 'Course Name', width: 240, sortable: true, sortKey: 'courseName',
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">{row.courseName as string}</span>
      ),
    },
    {
      key: 'academicYear', label: 'Academic Year', width: 130, sortable: true, sortKey: 'academicYear',
      cell: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {(row.academicYear as string).replace('-', '–')}
        </span>
      ),
    },
    {
      key: 'term', label: 'Term', width: 130, sortable: true, sortKey: 'term',
      cell: (row) => <span className="text-sm text-foreground">{row.term as string}</span>,
    },
    {
      key: 'cohort', label: 'Cohort', width: 160, sortable: true, sortKey: 'cohort',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.cohort as string}</span>,
    },
    {
      key: 'startDate', label: 'Start Date', width: 120, sortable: true, sortKey: 'startDate',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">
          {formatDate(row.startDate as string)}
        </span>
      ),
    },
    {
      key: 'endDate', label: 'End Date', width: 120, sortable: true, sortKey: 'endDate',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">
          {formatDate(row.endDate as string)}
        </span>
      ),
    },
    {
      key: 'facultyAssigned', label: 'Faculty / Staff', width: 180, sortable: true, sortKey: 'facultyAssigned',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.facultyAssigned as string}</span>
      ),
    },
    {
      key: 'registeredStudents', label: 'Students', width: 80, sortable: true, sortKey: 'registeredStudents',
      cell: (row) => (
        <span className="text-sm font-medium text-foreground tabular-nums">
          {row.registeredStudents as number}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status', width: 120, sortable: true, sortKey: 'status',
      cell: (row) => <OfferingStatusBadge status={row.status as CourseOfferingRow['status']} />,
    },
    {
      key: 'actions', label: '', width: 52, defaultPin: 'right', lockPin: true,
      cell: (row) => (
        <RowActions
          row={row}
          label={row.courseName as string}
          actions={[
            {
              label: 'View Offering',
              icon: 'fa-arrow-right',
              onClick: (r) => { window.location.href = `/courses/offerings/${r.id as string}` },
            },
            {
              label: 'Edit Offering',
              icon: 'fa-pen',
              onClick: () => {},
            },
            ...(isPrism ? [{
              label: 'View in Prism',
              icon: 'fa-arrow-up-right-from-square',
              onClick: () => {},
            }] : []),
            {
              label: 'Archive',
              icon: 'fa-box-archive',
              variant: 'destructive' as const,
              divider: true,
              onClick: () => {},
            },
          ]}
        />
      ),
    },
  ]
}

function CourseOfferingsTab() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<OfferingStatus>('all')
  const [query, setQuery] = useState('')
  const [addOfferingOpen, setAddOfferingOpen] = useState(false)
  const entryPoint = useEntryPoint()
  const isPrism = entryPoint === 'prism'
  const offeringColumns = useMemo(() => buildOfferingColumns(isPrism), [isPrism])

  const [recentOfferings, setRecentOfferings] = useState<RecentlyViewedItem[]>([])
  const refreshRecent = useCallback(() => { setRecentOfferings(loadRecentlyViewed('courses')) }, [])
  useEffect(() => {
    refreshRecent()
    window.addEventListener('focus', refreshRecent)
    return () => window.removeEventListener('focus', refreshRecent)
  }, [refreshRecent])

  const filtered = useMemo((): OfferingTableRow[] => {
    const q = query.trim().toLowerCase()
    let rows = statusFilter === 'all'
      ? courseOfferingRows
      : courseOfferingRows.filter((r) => r.status === statusFilter)
    if (q) {
      rows = rows.filter((r) =>
        r.courseNumber.toLowerCase().includes(q) ||
        r.courseName.toLowerCase().includes(q) ||
        r.cohort.toLowerCase().includes(q) ||
        r.facultyAssigned.toLowerCase().includes(q) ||
        r.term.toLowerCase().includes(q) ||
        r.academicYear.toLowerCase().includes(q)
      )
    }
    return rows as OfferingTableRow[]
  }, [statusFilter, query])

  const STATUS_FILTERS: Array<{ value: OfferingStatus; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'upcoming', label: 'Upcoming' },
  ]

  const totalByStatus = useMemo(() => ({
    all: courseOfferingRows.length,
    ongoing: courseOfferingRows.filter((r) => r.status === 'ongoing').length,
    completed: courseOfferingRows.filter((r) => r.status === 'completed').length,
    upcoming: courseOfferingRows.filter((r) => r.status === 'upcoming').length,
  }), [])

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <div className="flex items-center gap-3 px-6 pt-4 pb-2 shrink-0 flex-wrap">
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => {
              const isActive = statusFilter === value
              const count = totalByStatus[value]
              return (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(value)}
                  aria-pressed={isActive}
                  style={isActive ? {
                    backgroundColor: 'var(--muted)',
                    borderColor: 'var(--foreground)',
                    color: 'var(--foreground)',
                  } : undefined}
                >
                  {label}
                  <span
                    className="ml-1 text-[11px] tabular-nums"
                    style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                  >
                    {count}
                  </span>
                </Button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <SearchInput
              entityKey="course-offerings"
              value={query}
              onChange={setQuery}
              placeholder="Search offerings…"
              aria-label="Search course offerings"
              width="w-52"
            />
            <Button size="sm" onClick={() => setAddOfferingOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add Offering
            </Button>
          </div>
        </div>

        <DataTable<OfferingTableRow>
          data={filtered}
          columns={offeringColumns}
          getRowId={(row) => row.id as string}
          getRowSelectionLabel={(row) => row.courseName as string}
          selectable
          searchable={false}
          showQueryControls={false}
          defaultSort={{ key: 'startDate', dir: 'desc' }}
          onRowClick={(row) => router.push(`/courses/offerings/${row.id as string}`)}
          emptyState={
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <i className="fa-light fa-graduation-cap text-muted-foreground text-lg" aria-hidden="true" />
              </div>
              <p className="font-semibold text-foreground">
                {query ? 'No offerings match your search' : `No ${statusFilter === 'all' ? '' : statusFilter + ' '}offerings`}
              </p>
            </div>
          }
          toolbarSlot={() => (
            <span className="text-xs text-muted-foreground">
              {filtered.length} offering{filtered.length !== 1 ? 's' : ''}
              {query && ` matching "${query}"`}
            </span>
          )}
        />
      </div>

      {/* Recently viewed — xl only, same pattern as faculty-client.tsx */}
      <aside
        className="w-64 shrink-0 hidden xl:flex flex-col gap-3 px-6 pt-1"
        aria-label="Recently viewed offerings"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Recently viewed
        </p>
        {recentOfferings.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-border bg-card p-4 flex flex-col items-center justify-center gap-2 text-center"
            style={{ minHeight: 120 }}
          >
            <i className="fa-light fa-clock-rotate-left text-muted-foreground" aria-hidden="true" style={{ fontSize: 18 }} />
            <p className="text-xs text-muted-foreground">Recently viewed offerings will appear here</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {recentOfferings.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-muted/60 transition-colors"
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: 'var(--muted)' }}
                    aria-hidden="true"
                  >
                    <i className="fa-light fa-book text-muted-foreground" style={{ fontSize: 12 }} aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <AddOfferingSheet open={addOfferingOpen} onOpenChange={setAddOfferingOpen} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// FACULTY VIEW — course cards / list (no tabs)
// ══════════════════════════════════════════════════════════════════════════════

interface CourseSummary {
  id: string; code: string; name: string; activeSemester: string
  studentCount: number; assessmentCount: number; pendingReviewCount: number
  inProgressCount: number; publishedCount: number; draftCount: number
  accommodationsCount: number; untestedObjectivesCount: number
  accessLevel: 'editor' | 'viewer' | null
}

function buildSummary(
  courseId: string,
  accessLevel: 'editor' | 'viewer' | null,
  reviewByAssessment: Map<string, import('@/lib/faculty-mock-data').AssessmentReview>,
): CourseSummary {
  const course = mockCourses.find(c => c.id === courseId)
  if (!course) {
    return {
      id: courseId, code: '—', name: 'Unknown course', activeSemester: '—',
      studentCount: 0, assessmentCount: 0, pendingReviewCount: 0,
      inProgressCount: 0, publishedCount: 0, draftCount: 0,
      accommodationsCount: 0, untestedObjectivesCount: 0, accessLevel,
    }
  }
  const offerings = mockCourseOfferings.filter(o => o.courseId === courseId)
  const activeOffering = offerings.find(o => o.semester.includes('2026')) ?? offerings[0]
  const studentCount = facultyStudents.filter(s => s.enrolledCourseIds.includes(courseId)).length
  const courseAssessments = ALL_ASSESSMENTS.filter(a => a.courseId === courseId)
  let pending = 0, inProgress = 0, published = 0, draft = 0
  for (const a of courseAssessments) {
    const r = reviewByAssessment.get(a.id)
    if (!r || r.state === 'draft') draft++
    else if (r.state === 'pending-chair' || r.state === 'changes-requested') pending++
    else if (r.state === 'in-progress') inProgress++
    else if (r.state === 'published' || r.state === 'submitted' || r.state === 'results-published') published++
  }
  return {
    id: courseId,
    code: course.code,
    name: course.name,
    activeSemester: activeOffering?.semester ?? '—',
    studentCount: studentCount || (activeOffering?.studentCount ?? 0),
    assessmentCount: courseAssessments.length,
    pendingReviewCount: pending,
    inProgressCount: inProgress,
    publishedCount: published,
    draftCount: draft,
    accommodationsCount: facultyAccommodations.filter(a => a.courseId === courseId).length,
    untestedObjectivesCount: courseObjectives.filter(o => o.courseId === courseId && !o.lastAssessed).length,
    accessLevel,
  }
}

function CourseCard({ course }: { course: CourseSummary }) {
  const statusBits: string[] = []
  if (course.pendingReviewCount > 0) statusBits.push(`${course.pendingReviewCount} pending review`)
  if (course.inProgressCount > 0) statusBits.push(`${course.inProgressCount} ongoing`)
  if (course.draftCount > 0) statusBits.push(`${course.draftCount} draft${course.draftCount === 1 ? '' : 's'}`)
  if (course.untestedObjectivesCount > 0) {
    statusBits.push(`${course.untestedObjectivesCount} untested objective${course.untestedObjectivesCount === 1 ? '' : 's'}`)
  }
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-xl border border-border bg-card px-5 py-5 flex flex-col gap-3 transition-colors hover:bg-muted/30 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="min-w-0">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {formatCourseCode(course.code)}
        </p>
        <p className="font-heading text-base font-semibold text-foreground leading-snug truncate mt-0.5 group-hover:underline underline-offset-2">
          {course.name}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{course.activeSemester}</p>
      </div>
      <div className="flex items-baseline gap-4 text-xs text-muted-foreground">
        <span><span className="text-foreground font-semibold tabular-nums">{course.studentCount}</span> students</span>
        <span><span className="text-foreground font-semibold tabular-nums">{course.assessmentCount}</span> assessments</span>
        <span><span className="text-foreground font-semibold tabular-nums">{course.accommodationsCount}</span> accommodations</span>
      </div>
      {statusBits.length > 0 && (
        <p className="text-xs text-muted-foreground">{statusBits.join(' · ')}</p>
      )}
    </Link>
  )
}

function CourseListView({ courses }: { courses: CourseSummary[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <ul className="divide-y divide-border">
        {courses.map(c => {
          const isActive = c.activeSemester.includes('2026')
          const statusPill =
            c.pendingReviewCount > 0 ? { tone: 'warning', label: `${c.pendingReviewCount} pending review` } :
            c.inProgressCount > 0 ? { tone: 'info', label: `${c.inProgressCount} ongoing` } :
            c.draftCount > 0 ? { tone: 'neutral', label: `${c.draftCount} draft` } :
            c.untestedObjectivesCount > 0 ? { tone: 'warning', label: `${c.untestedObjectivesCount} untested` } :
            null
          return (
            <li key={c.id}>
              <Link
                href={`/courses/${c.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-muted text-muted-foreground shrink-0 min-w-[80px] text-center">
                  {formatCourseCode(c.code)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.activeSemester}</p>
                </div>
                <div className="hidden md:flex items-center gap-5 shrink-0 text-xs text-muted-foreground">
                  <span><strong className="text-foreground">{c.studentCount}</strong> students</span>
                  <span><strong className="text-foreground">{c.assessmentCount}</strong> assessments</span>
                  {c.accommodationsCount > 0 && (
                    <span><strong className="text-foreground">{c.accommodationsCount}</strong> accommodations</span>
                  )}
                </div>
                {statusPill && (
                  <StatusPill tone={statusPill.tone as 'warning' | 'info' | 'neutral'} icon="" label={statusPill.label} />
                )}
                {c.accessLevel && <AccessLevelChip level={c.accessLevel} />}
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <span className={`inline-block size-1.5 rounded-full ${isActive ? 'bg-chart-2' : 'bg-muted-foreground'}`} />
                  {isActive ? 'Active' : 'Past'}
                </span>
                <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true" style={{ fontSize: 11 }} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FacultyCourseSections({
  courses, viewMode, hasQuery, query,
}: {
  courses: CourseSummary[]; viewMode: 'cards' | 'list'; hasQuery: boolean; query: string
}) {
  const active = courses.filter(c => c.activeSemester.includes('2026'))
  const others = courses.filter(c => !c.activeSemester.includes('2026'))

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full mb-3 bg-muted">
          <i className="fa-light fa-magnifying-glass text-muted-foreground text-xl" aria-hidden="true" />
        </div>
        {hasQuery ? (
          <>
            <p className="font-semibold text-foreground">No courses match your search</p>
            <p className="text-sm text-muted-foreground mt-1">&ldquo;{query}&rdquo; didn&apos;t match any of your courses.</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-foreground">No courses assigned yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              You haven&apos;t been assigned to any course offerings. Contact your program administrator to request access.
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {active.length > 0 && (
        <section aria-labelledby="active-courses-heading">
          <h2 id="active-courses-heading" className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-3">
            Active this term
          </h2>
          {viewMode === 'cards' ? (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
              {active.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : <CourseListView courses={active} />}
        </section>
      )}
      {others.length > 0 && (
        <section aria-labelledby="all-courses-heading">
          <h2 id="all-courses-heading" className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-3">
            All my courses
          </h2>
          {viewMode === 'cards' ? (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
              {others.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : <CourseListView courses={others} />}
        </section>
      )}
    </div>
  )
}

function EmptyState({
  role, hasQuery, query, crossFilterHint, onSwitchFilter,
}: {
  role: 'admin' | 'faculty'
  hasQuery: boolean
  query: string
  crossFilterHint: { otherFilter: 'all' | 'active' | 'past'; count: number } | null
  onSwitchFilter: (next: 'all' | 'active' | 'past') => void
}) {
  if (hasQuery) {
    const filterLabel: Record<'all' | 'active' | 'past', string> = {
      all: 'all terms', active: 'active term', past: 'past terms',
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full mb-3 bg-muted">
          <i className="fa-light fa-magnifying-glass text-muted-foreground text-xl" aria-hidden="true" />
        </div>
        {crossFilterHint ? (
          <>
            <p className="font-semibold text-foreground">
              &ldquo;{query}&rdquo; isn&apos;t in your current filter
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              We found {crossFilterHint.count} {crossFilterHint.count === 1 ? 'match' : 'matches'} in{' '}
              <strong className="text-foreground">{filterLabel[crossFilterHint.otherFilter]}</strong>.
            </p>
            <Button variant="default" size="sm" className="mt-3 gap-2"
              onClick={() => onSwitchFilter(crossFilterHint.otherFilter)}>
              <i className="fa-light fa-arrow-right" aria-hidden="true" />
              Switch to {filterLabel[crossFilterHint.otherFilter]}
            </Button>
          </>
        ) : (
          <>
            <p className="font-semibold text-foreground">No courses match your search</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term.</p>
          </>
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full mb-3 bg-muted">
        <i className="fa-light fa-graduation-cap text-muted-foreground text-xl" aria-hidden="true" />
      </div>
      <p className="font-semibold text-foreground">No courses yet</p>
      <p className="text-sm text-muted-foreground mt-1">Create your first course to get started.</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════

export default function CoursesClient() {
  const { role, faculty, accessFor, hydrated } = useFacultySession()
  const { reviewByAssessment } = useAssessmentReviews()
  const [query, setQuery] = useState('')
  const [termFilter, setTermFilter] = useState<'all' | 'active' | 'past'>('active')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  // Faculty-only: visible courses + filters
  const visibleCourses = useMemo(() => {
    if (!hydrated) return []
    const ids = role === 'faculty' && faculty
      ? faculty.courses.map(c => c.courseId)
      : mockCourses.map(c => c.id)
    return ids.map(id => buildSummary(id, accessFor(id), reviewByAssessment))
  }, [role, faculty, accessFor, hydrated, reviewByAssessment])

  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, '')
  const matchesQuery = (c: CourseSummary) =>
    !normalizedQuery || c.name.toLowerCase().includes(normalizedQuery) || c.code.toLowerCase().includes(normalizedQuery)
  const matchesTerm = (c: CourseSummary, t: 'all' | 'active' | 'past') =>
    t === 'all' ||
    (t === 'active' && c.activeSemester.includes('2026')) ||
    (t === 'past' && !c.activeSemester.includes('2026'))

  const filtered = useMemo(() => {
    return visibleCourses.filter(c => matchesQuery(c) && matchesTerm(c, termFilter))
  }, [visibleCourses, normalizedQuery, termFilter])

  const otherFilterMatches = useMemo(() => {
    if (filtered.length > 0 || !normalizedQuery) return null
    for (const t of (['active', 'past', 'all'] as const).filter(t => t !== termFilter)) {
      const hits = visibleCourses.filter(c => matchesQuery(c) && matchesTerm(c, t))
      if (hits.length > 0) return { otherFilter: t, count: hits.length }
    }
    return null
  }, [filtered.length, normalizedQuery, termFilter, visibleCourses])

  // ── Faculty view (no tabs) ────────────────────────────────────────────────
  if (hydrated && role === 'faculty') {
    const pageTitle = faculty
      ? `Welcome back, ${faculty.title} ${faculty.name.split(' ')[1] ?? faculty.name}`
      : 'My Courses'
    const pageSubtitle = faculty
      ? `${faculty.department} · ${visibleCourses.length} ${visibleCourses.length === 1 ? 'course' : 'courses'} this term`
      : ''

    return (
      <>
        <SiteHeader title="My Courses" />
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          <PageHeader title={pageTitle} subtitle={pageSubtitle} />
          <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
            {faculty && <ActionItemsPanel faculty={faculty} />}

            <div className="flex items-center gap-3 flex-wrap">
              <InputGroup className="w-full max-w-sm">
                <InputGroupAddon align="inline-start">
                  <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  placeholder="Search by course code or name…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search courses"
                />
              </InputGroup>
              <ViewSegmentedControl
                className="ms-auto"
                value={viewMode}
                onValueChange={(v) => setViewMode(v as 'cards' | 'list')}
                options={[
                  { value: 'cards', label: 'Cards', icon: 'fa-light fa-grid-2' },
                  { value: 'list',  label: 'List',  icon: 'fa-light fa-list' },
                ]}
                aria-label="View mode"
              />
            </div>

            <FacultyCourseSections
              courses={visibleCourses.filter(c => matchesQuery(c))}
              viewMode={viewMode}
              hasQuery={Boolean(query)}
              query={query}
            />
          </div>
        </div>
      </>
    )
  }

  // ── Admin view (3 tabs) ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('course-offerings')
  const totalOfferings = courseOfferingRows.length
  const ongoingCount = courseOfferingRows.filter(r => r.status === 'ongoing').length

  return (
    <>
      <SiteHeader title="Courses" />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Courses"
          subtitle={`${masterCourses.length} courses in catalog · ${totalOfferings} offerings · ${ongoingCount} ongoing`}
        />

        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col min-h-0">
            {/* Tab strip */}
            <div className="shrink-0 border-b border-border px-6">
              <TabsList variant="line">
                <TabsTrigger value="course-offerings">
                  Course Offerings
                </TabsTrigger>
                <TabsTrigger value="course-catalog">
                  Course Catalog
                </TabsTrigger>
                <TabsTrigger value="setup">
                  Setup
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="course-offerings" className="m-0 flex flex-col flex-1 min-h-0">
              <CourseOfferingsTab />
            </TabsContent>

            <TabsContent value="course-catalog" className="m-0 flex flex-col flex-1 min-h-0">
              <CourseCatalogTab />
            </TabsContent>

            <TabsContent value="setup" className="m-0 flex flex-col flex-1 min-h-0 overflow-auto">
              <SetupTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
