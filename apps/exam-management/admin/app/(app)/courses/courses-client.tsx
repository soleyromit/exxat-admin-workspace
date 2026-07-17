// overflow-hidden safe — floating uses Radix Portal (PopoverContent, TooltipContent, SelectContent all use Radix Portal)
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
import { cn } from '@/lib/utils'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
  Button, Badge,
  StatusBadge, type StatusBadgeTone,
  Card, CardContent,
  InputGroup, InputGroupAddon, InputGroupInput,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  ViewSegmentedControl,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Input, Label, Separator, Textarea,
  Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount,
  Tooltip, TooltipContent, TooltipTrigger,
  KeyMetrics, type MetricItem, LocalBanner,
} from '@exxatdesignux/ui'
import { RowActions } from '@/components/data-table/row-actions'
import { SearchInput } from '@/components/search-input'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
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
import { courseOfferingRows, type CourseOfferingRow, type FacultyChip } from '@/lib/course-mock-data'

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
  { label: string; icon: string; tone: StatusBadgeTone }
> = {
  active: {
    label: 'Active',
    icon: 'fa-circle-check',
    tone: 'success',
  },
  upcoming: {
    label: 'Upcoming',
    icon: 'fa-hourglass',
    tone: 'info',
  },
  completed: {
    label: 'Completed',
    icon: 'fa-circle-check',
    tone: 'neutral',
  },
}

function TermStatusBadge({ status }: { status: Term['status'] }) {
  const s = TERM_STATUS_CONFIG[status]
  return <StatusBadge label={s.label} tone={s.tone} icon={s.icon} />
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
          <i className="fa-light fa-pen text-[13px]" aria-hidden="true" />
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
      <SheetContent showOverlay={false} showCloseButton={false} side="right" className="w-[420px]">
        <SheetHeader>
          <SheetTitle>{isNew ? 'Add Term' : 'Edit Term'}</SheetTitle>
        </SheetHeader>

        <div className="mx-4 my-2 shrink-0">
          <LocalBanner variant="info">
            When Canvas integration is active, terms are imported automatically and fields are locked.
          </LocalBanner>
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
        <i className={`fa-light ${icon} text-sm`} aria-hidden="true" />
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
        return (
          <StatusBadge
            label={t}
            icon={t === 'Core' ? 'fa-star' : 'fa-bookmark'}
            tone={t === 'Core' ? 'success' : 'neutral'}
          />
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
          <i className="fa-light fa-pen text-[13px]" aria-hidden="true" />
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
        <LocalBanner variant="info">
          When a course offering is created from this catalog, a{' '}
          <strong>Question Bank shell</strong>{' '}
          is automatically generated with the same name.
        </LocalBanner>
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
        <SheetContent showOverlay={false} showCloseButton side="right" className="w-[480px]">
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
      <SheetContent showOverlay={false} showCloseButton={false} side="right" className="w-[480px]">
        <SheetHeader>
          <SheetTitle>Add Course Offering</SheetTitle>
        </SheetHeader>

        {/* Canvas/LTI info banner — mirrors TermDrawer pattern */}
        <div className="mx-4 my-2 shrink-0">
          <LocalBanner variant="info">
            When Canvas integration is active, course offerings are created automatically from your Canvas courses. Canvas Course ID and SIS Course ID are populated from the LTI context.
          </LocalBanner>
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
          <p className="text-xs font-semibold text-muted-foreground">
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
            <p className="text-xs text-muted-foreground leading-snug">
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
type OfferingStatus = CourseOfferingRow['status'] | 'all' | 'attn'

const OFFERING_STATUS_CONFIG: Record<
  CourseOfferingRow['status'],
  { label: string; bg: string; fg: string }
> = {
  active: {
    label: 'Active',
    bg: 'var(--qb-status-saved-bg)',
    fg: 'var(--qb-status-saved-fg)',
  },
  past: { label: 'Past', bg: 'var(--muted)', fg: 'var(--muted-foreground)' },
  upcoming: {
    label: 'Upcoming',
    bg: 'var(--brand-tint)',
    fg: 'var(--brand-color-dark)',
  },
}

// ── KPI analytics strip ───────────────────────────────────────────────────────

function OfferingAnalyticsStrip({
  onFilter,
  activeFilter,
}: {
  onFilter: (f: OfferingStatus) => void
  activeFilter: OfferingStatus
}) {
  const activeCount = courseOfferingRows.filter(r => r.status === 'active').length
  const upcomingCount = courseOfferingRows.filter(r => r.status === 'upcoming').length
  const pastCount = courseOfferingRows.filter(r => r.status === 'past').length
  const attnCount = courseOfferingRows.filter(r => r.attn).length
  const dueSoon = courseOfferingRows.reduce((acc, r) => acc + r.assessmentsDueSoon, 0)
  const noAsm = courseOfferingRows.filter(r => r.status === 'active' && r.activeWithNoAssessments).length
  const missingDates = courseOfferingRows.filter(r => r.startDate === null || r.endDate === null).length

  const metrics: MetricItem[] = [
    { id: 'attn', label: 'Need attention', value: attnCount, delta: '', trend: 'neutral', trendPolarity: 'lower_is_better', onClick: () => onFilter('attn') },
    { id: 'active', label: 'Active', value: activeCount, delta: '', trend: 'neutral', onClick: () => onFilter('active') },
    { id: 'future', label: 'Future', value: upcomingCount, delta: '', trend: 'neutral', onClick: () => onFilter('upcoming') },
    { id: 'past', label: 'Past', value: pastCount, delta: '', trend: 'neutral', onClick: () => onFilter('past') },
    { id: 'due', label: 'Due this week', value: dueSoon, delta: '', trend: 'neutral', description: 'Assessments', trendPolarity: 'lower_is_better' },
    { id: 'noasmt', label: 'No assessments', value: noAsm, delta: '', trend: 'neutral', trendPolarity: 'lower_is_better', onClick: () => onFilter('active') },
    { id: 'missing', label: 'Missing dates', value: missingDates, delta: '', trend: 'neutral', trendPolarity: 'lower_is_better' },
  ]

  return (
    <KeyMetrics
      variant="compact"
      metricsSingleRow
      metrics={metrics}
      className="mx-6 mt-4 mb-2 shrink-0"
    />
  )
}

// ── Assessment text breakdown ─────────────────────────────────────────────────

function AssessmentBreakdownText({ breakdown }: { breakdown: CourseOfferingRow['assessmentBreakdown'] }) {
  const parts: string[] = []
  if (breakdown.published) parts.push(`${breakdown.published} pub`)
  if (breakdown.scheduled) parts.push(`${breakdown.scheduled} sched`)
  if (breakdown.grading)   parts.push(`${breakdown.grading} grading`)
  if (breakdown.review)    parts.push(`${breakdown.review} review`)
  if (breakdown.approved)  parts.push(`${breakdown.approved} approved`)
  if (breakdown.draft)     parts.push(`${breakdown.draft} draft`)
  if (parts.length === 0) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {parts.join(' · ')}
    </span>
  )
}

// ── QB health text ────────────────────────────────────────────────────────────

function QbHealthText({ pct }: { pct: number }) {
  const color = pct >= 70
    ? 'var(--qb-status-saved-fg)'
    : pct >= 40
    ? 'var(--chip-4)'
    : 'var(--muted-foreground)'
  return (
    <span className="text-sm font-semibold tabular-nums" style={{ color }}>
      {pct}%
    </span>
  )
}

// ── Faculty avatar stack ──────────────────────────────────────────────────────

function FacultyAvatarStack({ faculty }: { faculty: FacultyChip[] }) {
  const MAX = 3
  const shown = faculty.slice(0, MAX)
  const overflow = faculty.length - MAX
  const names = faculty.map(f => f.name).join(', ')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AvatarGroup className="flex items-center gap-1" role="group" aria-label={`Faculty: ${names}`}>
          {shown.map(f => (
            <Avatar key={f.name} size="sm" aria-hidden="true">
              <AvatarFallback
                className="text-xs font-semibold"
                // The chip token paints the disc, so the initials need a
                // foreground too — without one they inherit --muted-foreground
                // and axe measured 1.03:1 (dark grey on dark indigo), i.e.
                // invisible. --background is the right pairing because it
                // inverts with the theme in step with --chip-*: light theme is
                // chip L=0.38 on white (~10:1), dark theme raises chips to
                // L=0.72 against a near-black background (~8:1). A fixed light
                // colour would pass light mode and fail dark.
                style={{ backgroundColor: f.chipToken, color: 'var(--background)' }}
              >
                {f.initials}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflow > 0 && (
            <AvatarGroupCount className="text-xs">+{overflow}</AvatarGroupCount>
          )}
        </AvatarGroup>
      </TooltipTrigger>
      <TooltipContent>{names}</TooltipContent>
    </Tooltip>
  )
}

function buildOfferingColumns(isPrism: boolean): ColumnDef<OfferingTableRow>[] {
  return [
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'course', label: 'Course', width: 260, sortable: true, sortKey: 'courseNumber',
      cell: (row) => (
        <div className="flex items-start gap-2 min-w-0">
          {(row.attn as boolean) && (
            <>
              <i
                className="fa-light fa-circle-dot text-[10px] mt-1.5 shrink-0"
                aria-hidden="true"
                style={{ color: 'var(--chip-4)' }}
              />
              <span className="sr-only">Needs attention</span>
            </>
          )}
          <div className="min-w-0">
            <p className="text-xs font-mono text-muted-foreground leading-none mb-0.5">
              {row.courseNumber as string}
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {row.courseName as string}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'term', label: 'Term', width: 160, sortable: true, sortKey: 'academicYear',
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground leading-none mb-0.5 tabular-nums">
            {row.academicYear as string}
          </p>
          <p className="text-sm text-foreground">{row.term as string}</p>
        </div>
      ),
    },
    {
      key: 'cohort', label: 'Cohort', width: 160, sortable: true, sortKey: 'cohort',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.cohort as string}</span>
      ),
    },
    {
      key: 'dates', label: 'Dates', width: 180, sortable: true, sortKey: 'startDate',
      cell: (row) => {
        const start = row.startDate as string | null
        const end = row.endDate as string | null
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {start ? formatDate(start) : 'TBD'} → {end ? formatDate(end) : 'TBD'}
          </span>
        )
      },
    },
    {
      key: 'credits', label: 'Cr', width: 50, sortable: true, sortKey: 'credits',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">{row.credits as number}</span>
      ),
    },
    {
      key: 'faculty', label: 'Faculty', width: 120,
      cell: (row) => (
        <FacultyAvatarStack faculty={row.facultyList as FacultyChip[]} />
      ),
    },
    {
      key: 'registeredStudents', label: 'Students', width: 80, sortable: true, sortKey: 'registeredStudents',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <i className="fa-light fa-user text-[11px] text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground tabular-nums">
            {row.registeredStudents as number}
          </span>
        </div>
      ),
    },
    {
      key: 'assessments', label: 'Assessments', width: 120,
      cell: (row) => (
        <AssessmentBreakdownText breakdown={row.assessmentBreakdown as CourseOfferingRow['assessmentBreakdown']} />
      ),
    },
    {
      key: 'qbHealth', label: 'QB Health', width: 120, sortable: true, sortKey: 'qbHealth',
      cell: (row) => <QbHealthText pct={row.qbHealth as number} />,
    },
    {
      key: 'actions', label: '', width: 100, defaultPin: 'right', lockPin: true,
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => { e.stopPropagation() }}
            aria-label={`Add assessment to ${row.courseName as string}`}
          >
            <i className="fa-light fa-plus text-[10px]" aria-hidden="true" />
            Assessment
          </Button>
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
        </div>
      ),
    },
  ]
}

function CourseOfferingsTab() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<OfferingStatus>('all')
  const [query, setQuery] = useState('')
  const [addOfferingOpen, setAddOfferingOpen] = useState(false)
  const [filterAY, setFilterAY] = useState('all')
  const [filterTerm, setFilterTerm] = useState('all')
  const [filterCohort, setFilterCohort] = useState('all')
  const [filterFaculty, setFilterFaculty] = useState('all')
  const entryPoint = useEntryPoint()
  const isPrism = entryPoint === 'prism'
  const offeringColumns = useMemo(() => buildOfferingColumns(isPrism), [isPrism])

  const filtered = useMemo((): OfferingTableRow[] => {
    let rows = courseOfferingRows
    if (statusFilter === 'attn') rows = rows.filter(r => r.attn)
    else if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter)
    if (filterAY !== 'all') rows = rows.filter(r => r.academicYear === filterAY)
    if (filterTerm !== 'all') rows = rows.filter(r => r.term === filterTerm)
    if (filterCohort !== 'all') rows = rows.filter(r => r.cohort === filterCohort)
    if (filterFaculty !== 'all') rows = rows.filter(r => r.facultyAssigned === filterFaculty)
    if (query) {
      const q = query.toLowerCase()
      rows = rows.filter(r =>
        r.courseName.toLowerCase().includes(q) ||
        r.courseNumber.toLowerCase().includes(q) ||
        r.facultyAssigned.toLowerCase().includes(q)
      )
    }
    return rows as OfferingTableRow[]
  }, [statusFilter, filterAY, filterTerm, filterCohort, filterFaculty, query])

  const STATUS_FILTERS: Array<{ value: OfferingStatus; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'upcoming', label: 'Future' },
    { value: 'past', label: 'Past' },
  ]

  const totalByStatus = useMemo(() => ({
    all: courseOfferingRows.length,
    active: courseOfferingRows.filter((r) => r.status === 'active').length,
    past: courseOfferingRows.filter((r) => r.status === 'past').length,
    upcoming: courseOfferingRows.filter((r) => r.status === 'upcoming').length,
  }), [])

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
        {/* KPI analytics strip */}
        <OfferingAnalyticsStrip
          onFilter={setStatusFilter}
          activeFilter={statusFilter}
        />

        <div className="flex items-center gap-3 px-6 pt-2 pb-2 shrink-0 flex-wrap">
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => {
              const isActive = statusFilter === value
              const count = totalByStatus[value as keyof typeof totalByStatus]
              return (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(value)}
                  aria-pressed={isActive}
                  className={cn(
                    isActive && 'bg-muted border-foreground text-foreground'
                  )}
                >
                  {label}
                  <span className={cn('ml-1 text-xs tabular-nums', isActive ? 'text-foreground' : 'text-muted-foreground')}>
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

        {/* Filterbar */}
        <div className="flex items-center gap-2 px-6 pb-2 shrink-0 flex-wrap">
          <Select value={filterAY} onValueChange={setFilterAY}>
            <SelectTrigger className="h-8 w-36 text-sm" aria-label="Academic Year">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {Array.from(new Set(courseOfferingRows.map(r => r.academicYear))).sort().map(ay => (
                <SelectItem key={ay} value={ay}>{ay}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTerm} onValueChange={setFilterTerm}>
            <SelectTrigger className="h-8 w-32 text-sm" aria-label="Term">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All terms</SelectItem>
              {Array.from(new Set(courseOfferingRows.map(r => r.term))).sort().map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCohort} onValueChange={setFilterCohort}>
            <SelectTrigger className="h-8 w-40 text-sm" aria-label="Cohort">
              <SelectValue placeholder="Cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cohorts</SelectItem>
              {Array.from(new Set(courseOfferingRows.map(r => r.cohort))).sort().map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterFaculty} onValueChange={setFilterFaculty}>
            <SelectTrigger className="h-8 w-44 text-sm" aria-label="Faculty">
              <SelectValue placeholder="Faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All faculty</SelectItem>
              {Array.from(new Set(courseOfferingRows.map(r => r.facultyAssigned))).sort().map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <i className="fa-light fa-graduation-cap text-muted-foreground text-lg" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-foreground">
                  {query
                    ? 'No offerings match your search'
                    : statusFilter === 'all'
                    ? 'No offerings yet'
                    : statusFilter === 'attn'
                    ? 'No offerings need attention'
                    : `No ${OFFERING_STATUS_CONFIG[statusFilter as CourseOfferingRow['status']]?.label ?? statusFilter} offerings`
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {query
                    ? 'Try a different search term or clear the filter.'
                    : statusFilter === 'all'
                    ? 'Add a course offering to get started.'
                    : 'Change the filter to see other offerings.'
                  }
                </p>
              </div>
              {(query || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setStatusFilter('all'); }}
                >
                  Show all offerings
                </Button>
              )}
              {!query && statusFilter === 'all' && (
                <Button size="sm" onClick={() => setAddOfferingOpen(true)}>
                  Add Offering
                </Button>
              )}
            </div>
          }
          toolbarSlot={() => (
            <span className="text-xs text-muted-foreground">
              {filtered.length} offering{filtered.length !== 1 ? 's' : ''}
              {query && ` matching "${query}"`}
            </span>
          )}
        />

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
      className="group rounded-lg border border-border bg-card px-5 py-5 flex flex-col gap-3 transition-colors hover:bg-muted no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="min-w-0">
        <p className="font-mono text-xs font-medium text-muted-foreground">
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
    <div className="rounded-lg border border-border bg-card overflow-hidden">
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
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted transition-colors no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <Badge variant="secondary" className="font-mono shrink-0">
                  {formatCourseCode(c.code)}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.activeSemester}</p>
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
                <i className="fa-light fa-chevron-right text-muted-foreground text-[11px]" aria-hidden="true" />
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
          <h2 id="active-courses-heading" className="text-xs font-semibold text-muted-foreground mb-3">
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
          <h2 id="all-courses-heading" className="text-xs font-semibold text-muted-foreground mb-3">
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
  const ongoingCount = courseOfferingRows.filter(r => r.status === 'active').length

  return (
    <>
      <SiteHeader title="Courses" breadcrumbs={[{ label: 'Courses' }]} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Courses"
          subtitle={`${masterCourses.length} courses in catalog · ${totalOfferings} offerings · ${ongoingCount} active`}
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
