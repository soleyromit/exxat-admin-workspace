'use client'

/**
 * Course Catalog (Master Courses) — client component
 *
 * Grid + Sheet drawer pattern. No standalone detail page.
 * Clicking a row or the edit icon opens the drawer pre-populated.
 * "Add Course" in the page header opens an empty drawer.
 *
 * Key behaviour:
 *   • External search input above DataTable (DataTable searchable=false).
 *   • Information banner above the table explains the QB shell auto-generation.
 *   • Sheet drawer handles both Add (blank) and Edit (pre-populated) modes.
 *
 * See docs/BASE-ENTITIES.md for the Master Course field spec.
 */

import { useState, useMemo } from 'react'
import {
  Button,
  Badge,
  Card, CardContent,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import {
  masterCourses,
  type MasterCourse,
} from '@/lib/course-catalog-mock-data'

// DataTable requires TData extends Record<string, unknown>.
type MasterCourseRow = MasterCourse & Record<string, unknown>

// ── Type badge colors ─────────────────────────────────────────────────────────

const TYPE_STYLES: Record<MasterCourse['type'], { bg: string; fg: string }> = {
  Core: {
    bg: 'var(--brand-tint)',
    fg: 'var(--brand-color-dark)',
  },
  Elective: {
    bg: 'var(--muted)',
    fg: 'var(--muted-foreground)',
  },
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildColumns(
  onEdit: (course: MasterCourse) => void
): ColumnDef<MasterCourseRow>[] {
  return [
    {
      key: 'select',
      label: '',
      width: 40,
      defaultPin: 'left',
      lockPin: true,
    },
    {
      key: 'courseNumber',
      label: 'Course Number',
      width: 140,
      sortable: true,
      sortKey: 'courseNumber',
      cell: (row) => (
        <span className="text-sm font-mono font-medium text-foreground">
          {row.courseNumber as string}
        </span>
      ),
    },
    {
      key: 'courseName',
      label: 'Course Name',
      width: 280,
      sortable: true,
      sortKey: 'courseName',
      cell: (row) => (
        <Button
          variant="ghost"
          size="xs"
          className="text-sm font-medium text-left truncate w-full justify-start px-0 h-auto"
          style={{ color: 'var(--brand-color)' }}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(row as unknown as MasterCourse)
          }}
          aria-label={`Edit ${row.courseName as string}`}
        >
          {row.courseName as string}
        </Button>
      ),
    },
    {
      key: 'credits',
      label: 'Credits',
      width: 80,
      sortable: true,
      sortKey: 'credits',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">
          {row.credits as number}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: 100,
      sortable: true,
      sortKey: 'type',
      cell: (row) => {
        const t = row.type as MasterCourse['type']
        const s = TYPE_STYLES[t]
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
      key: 'department',
      label: 'Department',
      width: 180,
      sortable: true,
      sortKey: 'department',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.department as string}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 48,
      defaultPin: 'right',
      lockPin: true,
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${row.courseName as string}`}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(row as unknown as MasterCourse)
          }}
        >
          <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 13 }} />
        </Button>
      ),
    },
  ]
}

// ── Blank form state ──────────────────────────────────────────────────────────

const BLANK_FORM: Omit<MasterCourse, 'id'> = {
  courseNumber: '',
  courseName: '',
  credits: 3,
  type: 'Core',
  department: '',
  description: '',
  prerequisites: '',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CatalogClient() {
  const [query, setQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<MasterCourse | null>(null)
  const [form, setForm] = useState<Omit<MasterCourse, 'id'>>(BLANK_FORM)

  // ── Helpers ───────────────────────────────────────────────────────────────

  function openAdd() {
    setEditing(null)
    setForm(BLANK_FORM)
    setDrawerOpen(true)
  }

  function openEdit(course: MasterCourse) {
    setEditing(course)
    setForm({
      courseNumber: course.courseNumber,
      courseName: course.courseName,
      credits: course.credits,
      type: course.type,
      department: course.department,
      description: course.description ?? '',
      prerequisites: course.prerequisites ?? '',
    })
    setDrawerOpen(true)
  }

  function handleSave() {
    // Mock save — in production this would call an API
    setDrawerOpen(false)
  }

  // ── Columns (memoised so references are stable between renders) ───────────

  const columns = useMemo(() => buildColumns(openEdit), [])

  // ── External search ───────────────────────────────────────────────────────

  const filtered = useMemo((): MasterCourseRow[] => {
    const q = query.trim().toLowerCase()
    const rows = q
      ? masterCourses.filter(
          (c) =>
            c.courseNumber.toLowerCase().includes(q) ||
            c.courseName.toLowerCase().includes(q) ||
            c.department.toLowerCase().includes(q) ||
            c.type.toLowerCase().includes(q) ||
            (c.description ?? '').toLowerCase().includes(q)
        )
      : masterCourses
    return rows as MasterCourseRow[]
  }, [query])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <SiteHeader title="Course Catalog" />

      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Course Catalog"
          subtitle={`${masterCourses.length} master courses`}
          actions={
            <Button size="sm" onClick={openAdd}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add Course
            </Button>
          }
        />

        <div className="flex flex-1 flex-col overflow-auto py-4">
          {/* Information banner — QB shell auto-generation note */}
          <div className="px-4 lg:px-6 pb-3">
            <Card role="note" style={{ backgroundColor: 'var(--brand-tint)' }}>
              <CardContent className="flex items-start gap-2.5 px-3 py-2.5 text-[13px]">
              <i
                className="fa-light fa-circle-info mt-0.5 shrink-0 text-sm"
                aria-hidden="true"
                style={{ color: 'var(--brand-color)' }}
              />
              <span style={{ color: 'var(--muted-foreground)' }}>
                When a course offering is created from this catalog, a{' '}
                <strong className="text-foreground font-medium">
                  Question Bank shell
                </strong>{' '}
                is automatically generated with the same name.
              </span>
              </CardContent>
            </Card>
          </div>

          {/* Search bar above the table */}
          <div className="px-4 lg:px-6 pb-2">
            <InputGroup className="w-full max-w-sm">
              <InputGroupAddon align="inline-start">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Search by number, name, department…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search courses"
                autoComplete="off"
              />
            </InputGroup>
          </div>

          {/* Data table */}
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
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <div className="flex size-14 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--muted)' }}>
                  <i
                    className="fa-light fa-book-open text-xl"
                    aria-hidden="true"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                </div>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  No courses match your search
                </p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Try a different course number, name, or department.
                </p>
              </div>
            }
            toolbarSlot={() => (
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {filtered.length} course{filtered.length !== 1 ? 's' : ''}
                {query && ` matching "${query}"`}
              </span>
            )}
          />
        </div>
      </div>

      {/* Add / Edit drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          showOverlay={false}
          showCloseButton
          side="right"
          style={{ width: 480 }}
        >
          <SheetHeader>
            <SheetTitle>
              {editing ? 'Edit Course' : 'Add Course'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 py-4 overflow-y-auto flex-1 px-4">
            {/* QB shell info note */}
            <Card role="note" className="text-muted-foreground">
              <CardContent className="flex items-start gap-2 p-3 text-[13px]">
              <i
                className="fa-light fa-circle-info shrink-0 text-sm"
                aria-hidden="true"
                style={{ color: 'var(--brand-color)', marginTop: 1 }}
              />
              <span>
                Creating a course offering from this catalog auto-generates a Question Bank shell.
              </span>
              </CardContent>
            </Card>

            {/* Course Number */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-number">
                Course Number <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
              </Label>
              <Input
                id="course-number"
                placeholder="e.g. PHARM 501"
                value={form.courseNumber}
                onChange={(e) => setForm((f) => ({ ...f, courseNumber: e.target.value }))}
                required
                aria-required="true"
              />
            </div>

            {/* Course Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-name">
                Course Name <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
              </Label>
              <Input
                id="course-name"
                placeholder="e.g. Pharmacology I"
                value={form.courseName}
                onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}
                required
                aria-required="true"
              />
            </div>

            {/* Credits */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                min={1}
                max={12}
                placeholder="3"
                value={form.credits}
                onChange={(e) =>
                  setForm((f) => ({ ...f, credits: Number(e.target.value) }))
                }
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, type: val as MasterCourse['type'] }))
                }
              >
                <SelectTrigger id="course-type" aria-label="Course type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Core">Core</SelectItem>
                  <SelectItem value="Elective">Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g. Pharmacy"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the course…"
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Prerequisites */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prerequisites">
                Prerequisites{' '}
                <span className="text-[11px] font-normal" style={{ color: 'var(--muted-foreground)' }}>
                  (comma-separated)
                </span>
              </Label>
              <Input
                id="prerequisites"
                placeholder="e.g. PHARM 501, PHARM 502"
                value={form.prerequisites ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, prerequisites: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Course</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
