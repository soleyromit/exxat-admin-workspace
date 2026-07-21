'use client'

/**
 * Faculty list — base entity page for Exam Management.
 *
 * Mirrors the Students list pattern (single Google-style search, DataTable,
 * no filter controls) per the established Aarti directive for entity list pages.
 *
 * Tab/column variations by product: see docs/BASE-ENTITIES.md
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useEntryPoint } from '@/lib/use-entry-point'
import {
  Badge, Avatar, AvatarFallback,
  Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Separator,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions } from '@/components/data-table/row-actions'
import { facultyListRows, type FacultyListRow } from '@/lib/faculty-mock-data'

// DataTable requires TData extends Record<string, unknown>.
// Intersect so cell renderers keep full FacultyListRow inference.
type FacultyTableRow = FacultyListRow & Record<string, unknown>

// ── Module-level constants ────────────────────────────────────────────────────

const IS_LMS_ACTIVE = false

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:   { bg: 'var(--qb-status-saved-bg)',  fg: 'var(--qb-status-saved-fg)',  label: 'Active' },
  inactive: { bg: 'var(--muted)',               fg: 'var(--muted-foreground)',     label: 'Inactive' },
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildFacultyColumns(isPrism: boolean): ColumnDef<FacultyTableRow>[] {
  return [
    {
      key: 'select',
      label: '',
      width: 40,
      defaultPin: 'left',
      lockPin: true,
    },
    {
      key: 'faculty',       // synthetic — cell renderer required
      label: 'Faculty',
      width: 260,
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
              <p className="text-[11px] text-muted-foreground font-mono">{row.facultyId}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'email',
      label: 'Email',
      width: 220,
      sortable: true,
      sortKey: 'email',
      cell: (row) => (
        <span className="text-sm text-muted-foreground block truncate">{row.email}</span>
      ),
    },
    {
      key: 'adminPosition',
      label: 'Administrative Position',
      width: 200,
      sortable: true,
      sortKey: 'adminPosition',
      cell: (row) => (
        <span className="text-sm text-foreground">{row.adminPosition as string}</span>
      ),
    },
    {
      key: 'rank',
      label: 'Faculty Rank',
      width: 180,
      sortable: true,
      sortKey: 'rank',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.rank as string}</span>
      ),
    },
    {
      key: 'coursesAssigned',
      label: 'Courses',
      width: 90,
      sortable: true,
      sortKey: 'coursesAssigned',
      cell: (row) => {
        const count = row.coursesAssigned as number
        return count > 0 ? (
          <Badge
            variant="secondary"
            className="rounded font-mono text-[11px] px-2"
            style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color)' }}
          >
            {count}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground tabular-nums">—</span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      sortable: true,
      sortKey: 'status',
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.status as keyof typeof STATUS_CONFIG]
        return (
          <Badge
            variant="secondary"
            className="rounded-full text-[10px] font-semibold px-2.5 py-0.5"
            style={{ backgroundColor: cfg.bg, color: cfg.fg }}
          >
            {cfg.label}
          </Badge>
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
            {
              label: 'Edit Faculty',
              icon: 'fa-pen',
              onClick: () => {},
            },
            ...(isPrism ? [{
              label: 'View in Prism',
              icon: 'fa-arrow-up-right-from-square',
              onClick: () => window.open(`https://steps.exxat.com/admin/faculty/${row.id as string}`, '_blank'),
            }] : []),
            {
              label: 'Deactivate',
              icon: 'fa-ban',
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

// ── Add Faculty Sheet ─────────────────────────────────────────────────────────

function AddFacultySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [adminPosition, setAdminPosition] = useState('')
  const [rank, setRank] = useState('')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showOverlay={false} showCloseButton={false} side="right" style={{ width: 480 }}>
        <SheetHeader>
          <SheetTitle>Add Faculty</SheetTitle>
        </SheetHeader>

        {/* Canvas/LTI info banner — mirrors TermDrawer pattern */}
        <div
          className="mx-4 flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs"
          style={{
            backgroundColor: 'var(--brand-tint)',
            color: 'var(--brand-color-dark)',
            border: '1px solid var(--brand-tint)',
          }}
          role="note"
        >
          <i className="fa-light fa-circle-info mt-0.5 shrink-0" aria-hidden="true" style={{ fontSize: 13 }} />
          <span>
            When Canvas integration is active, student/faculty/course data is imported automatically. Fields are pre-filled and locked.
          </span>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-2">
          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-first-name">
              First Name <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="faculty-first-name"
              placeholder="e.g. Dr. Sarah"
              required
              aria-required="true"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-last-name">
              Last Name <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="faculty-last-name"
              placeholder="e.g. Mitchell"
              required
              aria-required="true"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-email">
              Email <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="faculty-email"
              type="email"
              placeholder="e.g. smitchell@university.edu"
              required
              aria-required="true"
            />
          </div>

          {/* Faculty ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-id">
              Faculty ID <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="faculty-id"
              placeholder="e.g. FAC-001"
              required
              aria-required="true"
            />
            <p className="text-[11px] text-muted-foreground leading-snug">
              SIS faculty ID / LTI lis.person_sourcedid
            </p>
          </div>

          {/* Admin Position */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-admin-position">Admin Position</Label>
            <Select value={adminPosition} onValueChange={setAdminPosition}>
              <SelectTrigger id="faculty-admin-position" aria-label="Admin Position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Program Director">Program Director</SelectItem>
                <SelectItem value="Course Coordinator">Course Coordinator</SelectItem>
                <SelectItem value="Instructor">Instructor</SelectItem>
                <SelectItem value="Adjunct">Adjunct</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rank */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-rank">Rank</Label>
            <Select value={rank} onValueChange={setRank}>
              <SelectTrigger id="faculty-rank" aria-label="Faculty Rank">
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professor">Professor</SelectItem>
                <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                <SelectItem value="Lecturer">Lecturer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-department">Department</Label>
            <Input
              id="faculty-department"
              placeholder="e.g. College of Pharmacy"
            />
          </div>

          <Separator />

          {/* Canvas Integration section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Canvas Integration
          </p>

          {/* Canvas User ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-canvas-user-id">Canvas User ID</Label>
            <Input
              id="faculty-canvas-user-id"
              placeholder="Auto-filled when Canvas active"
              disabled
              value=""
            />
          </div>

          {/* Login ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty-login-id">Login ID</Label>
            <Input
              id="faculty-login-id"
              placeholder="Auto-filled when Canvas active"
              disabled
              value=""
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Save Faculty</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FacultyClient() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [addFacultyOpen, setAddFacultyOpen] = useState(false)
  const entryPoint = useEntryPoint()
  const isPrism = entryPoint === 'prism'
  const columns = useMemo(() => buildFacultyColumns(isPrism), [isPrism])

  // External search — mirrors Students pattern.
  // Covers fields that aren't DataTable columns (department, rank, position).
  const filtered = useMemo((): FacultyTableRow[] => {
    const q = query.trim().toLowerCase()
    const rows = q
      ? facultyListRows.filter(f =>
          f.fullName.toLowerCase().includes(q) ||
          f.facultyId.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q) ||
          f.adminPosition.toLowerCase().includes(q) ||
          f.rank.toLowerCase().includes(q) ||
          f.status.toLowerCase().includes(q)
        )
      : facultyListRows
    return rows as FacultyTableRow[]
  }, [query])

  return (
    <>
      <SiteHeader title="Faculty" breadcrumbs={[{ label: 'Faculty' }]} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Faculty"
          subtitle={`${facultyListRows.length} faculty members`}
          actions={
            IS_LMS_ACTIVE ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full gap-1.5 text-xs"
                  style={{
                    backgroundColor: 'var(--brand-tint)',
                    color: 'var(--brand-color)',
                  }}
                >
                  <i className="fa-light fa-link" aria-hidden="true" />
                  Managed by Canvas
                </Badge>
              </div>
            ) : (
              <Button size="sm" onClick={() => setAddFacultyOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add Faculty
              </Button>
            )
          }
        />

        <div className="flex flex-1 flex-col gap-0 min-h-0 min-w-0">
            {/* Single search bar — mirrors Aarti's "Google search" directive from Students */}
            <div className="px-4 lg:px-6 pt-4 pb-2">
              <SearchInput
                entityKey="faculty"
                value={query}
                onChange={setQuery}
                placeholder="Search by name, ID, email, position, or rank…"
                aria-label="Search faculty"
                width="w-full max-w-lg"
              />
            </div>

            {/* DataTable — handles column resize, sort, selection, row hover */}
            <DataTable<FacultyTableRow>
              data={filtered}
              columns={columns}
              getRowId={(row) => row.id as string}
              getRowSelectionLabel={(row) => row.fullName}
              selectable
              searchable={false}
              showQueryControls={false}
              onRowClick={(row) => router.push(`/faculty/${row.id as string}`)}
              emptyState={
                <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <i className="fa-light fa-chalkboard-user text-muted-foreground text-xl" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-foreground">No faculty match your search</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Try a different name, ID, position, or rank.
                  </p>
                </div>
              }
              toolbarSlot={() => (
                <span className="text-xs text-muted-foreground">
                  {filtered.length} faculty member{filtered.length !== 1 ? 's' : ''}
                  {query && ` matching "${query}"`}
                </span>
              )}
            />
        </div>
      </div>

      <AddFacultySheet open={addFacultyOpen} onOpenChange={setAddFacultyOpen} />
    </>
  )
}
