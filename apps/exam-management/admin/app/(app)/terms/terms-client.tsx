'use client'

/**
 * Terms list — base entity page for Exam Management.
 *
 * Design per docs/BASE-ENTITIES.md (Terms):
 *   • No standalone detail page — grid + Sheet drawer for add/edit.
 *   • Search sits above the DataTable; DataTable searchable=false.
 *   • No row click navigation.
 *   • Status: Active / Upcoming / Completed (badge chips).
 *   • LMS note: Canvas import locks fields when integration is live.
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Button,
  Badge,
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
  Separator,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  StatusBadge,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { terms as initialTerms, type Term } from '@/lib/terms-mock-data'

// DataTable requires TData extends Record<string, unknown>
type TermTableRow = Term & Record<string, unknown>

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
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
    bg: 'var(--brand-tint)',
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
  const s = STATUS_CONFIG[status]
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

// ── Date formatting ───────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildColumns(
  onEdit: (term: TermTableRow) => void,
): ColumnDef<TermTableRow>[] {
  return [
    {
      key: 'select',
      label: '',
      width: 40,
      defaultPin: 'left',
      lockPin: true,
    },
    {
      key: 'label',
      label: 'Term',
      width: 180,
      sortable: true,
      sortKey: 'label',
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">{row.label}</span>
      ),
    },
    {
      key: 'academicYear',
      label: 'Academic Year',
      width: 160,
      sortable: true,
      sortKey: 'academicYear',
      cell: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {(row.academicYear as string).replace('-', '–')}
        </span>
      ),
    },
    {
      key: 'startDate',
      label: 'Start Date',
      width: 140,
      sortable: true,
      sortKey: 'startDate',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">
          {formatDate(row.startDate as string)}
        </span>
      ),
    },
    {
      key: 'endDate',
      label: 'End Date',
      width: 140,
      sortable: true,
      sortKey: 'endDate',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">
          {formatDate(row.endDate as string)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      sortable: true,
      sortKey: 'status',
      cell: (row) => <TermStatusBadge status={row.status as Term['status']} />,
    },
    {
      key: 'actions',
      label: '',
      width: 52,
      defaultPin: 'right',
      lockPin: true,
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${row.label as string}`}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(row)
          }}
        >
          <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 13 }} />
        </Button>
      ),
    },
  ]
}

// ── Blank term factory ────────────────────────────────────────────────────────

function blankTerm(): Term {
  return {
    id: '',
    label: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
    notes: '',
  }
}

// ── Add/Edit drawer ───────────────────────────────────────────────────────────

interface TermDrawerProps {
  open: boolean
  term: Term
  isNew: boolean
  onClose: () => void
  onSave: (term: Term) => void
}

function TermDrawer({ open, term, isNew, onClose, onSave }: TermDrawerProps) {
  const [draft, setDraft] = useState<Term>(term)

  // Sync draft when the term prop changes (opening with a different term)
  useMemo(() => { setDraft(term) }, [term])

  function field<K extends keyof Term>(key: K, value: Term[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    onSave(draft)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        showOverlay={false}
        showCloseButton={false}
        side="right"
        style={{ width: 420 }}
      >
        <SheetHeader>
          <SheetTitle>{isNew ? 'Add Term' : 'Edit Term'}</SheetTitle>
        </SheetHeader>

        {/* LMS info banner */}
        <div
          className="mx-4 flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs"
          style={{
            backgroundColor: 'var(--brand-tint)',
            color: 'var(--brand-color-dark)',
            border: '1px solid var(--brand-tint)',
          }}
          role="note"
          aria-label="LMS integration note"
        >
          <i className="fa-light fa-circle-info mt-0.5 shrink-0" aria-hidden="true" style={{ fontSize: 13 }} />
          <span>
            When Canvas integration is active, terms are imported automatically and fields are locked.
          </span>
        </div>

        <Separator />

        {/* Form fields */}
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-2">
          {/* Term label */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-label">
              Term Label <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="term-label"
              placeholder="e.g. Fall 2026"
              value={draft.label}
              onChange={(e) => field('label', e.target.value)}
              required
              aria-required="true"
            />
          </div>

          {/* Academic year */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-academic-year">
              Academic Year <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="term-academic-year"
              placeholder="e.g. 2026-2027"
              value={draft.academicYear}
              onChange={(e) => field('academicYear', e.target.value)}
              required
              aria-required="true"
            />
          </div>

          {/* Start date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-start-date">
              Start Date <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="term-start-date"
              type="date"
              value={draft.startDate}
              onChange={(e) => field('startDate', e.target.value)}
              required
              aria-required="true"
            />
          </div>

          {/* End date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-end-date">
              End Date <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="term-end-date"
              type="date"
              value={draft.endDate}
              onChange={(e) => field('endDate', e.target.value)}
              required
              aria-required="true"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-status">Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => field('status', v as Term['status'])}
            >
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

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-notes">Notes</Label>
            <textarea
              id="term-notes"
              className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: 'var(--border-control-35)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                resize: 'vertical',
              }}
              placeholder="Optional notes about this term…"
              value={draft.notes ?? ''}
              onChange={(e) => field('notes', e.target.value)}
              aria-label="Notes"
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TermsClient() {
  const [data, setData] = useState<Term[]>(initialTerms)
  const [query, setQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term>(blankTerm())
  const [isNew, setIsNew] = useState(true)

  // External search — covers all visible text fields.
  const filtered = useMemo((): TermTableRow[] => {
    const q = query.trim().toLowerCase()
    const rows = q
      ? data.filter((t) =>
          t.label.toLowerCase().includes(q) ||
          t.academicYear.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q) ||
          (t.notes ?? '').toLowerCase().includes(q)
        )
      : data
    return rows as TermTableRow[]
  }, [data, query])

  const openAdd = useCallback(() => {
    setEditingTerm(blankTerm())
    setIsNew(true)
    setDrawerOpen(true)
  }, [])

  const openEdit = useCallback((row: TermTableRow) => {
    setEditingTerm(row as Term)
    setIsNew(false)
    setDrawerOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const handleSave = useCallback(
    (term: Term) => {
      if (isNew) {
        const newTerm: Term = {
          ...term,
          id: `term-${Date.now()}`,
        }
        setData((prev) => [newTerm, ...prev])
      } else {
        setData((prev) => prev.map((t) => (t.id === term.id ? term : t)))
      }
      setDrawerOpen(false)
    },
    [isNew],
  )

  const columns = useMemo(() => buildColumns(openEdit), [openEdit])

  return (
    <>
      <SiteHeader title="Terms" />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Terms"
          subtitle={`${data.length} term${data.length !== 1 ? 's' : ''}`}
          actions={
            <Button onClick={openAdd} size="sm">
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add Term
            </Button>
          }
        />

        <div className="flex flex-1 overflow-auto py-4">
          <div className="flex flex-1 flex-col gap-0 min-w-0">
            {/* Search bar */}
            <div className="px-4 lg:px-6 pb-2">
              <InputGroup className="w-full max-w-lg">
                <InputGroupAddon align="inline-start">
                  <i
                    className="fa-light fa-magnifying-glass text-muted-foreground"
                    aria-hidden="true"
                  />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  placeholder="Search by label, academic year, status, or notes…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search terms"
                  autoComplete="off"
                />
              </InputGroup>
            </div>

            {/* DataTable */}
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
                <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <i
                      className="fa-light fa-calendar-days text-muted-foreground text-xl"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="font-semibold text-foreground">
                    {query ? 'No terms match your search' : 'No terms yet'}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {query
                      ? 'Try a different label, year, or status.'
                      : 'Add your first term to get started.'}
                  </p>
                  {!query && (
                    <Button size="sm" className="mt-2" onClick={openAdd}>
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
        </div>
      </div>

      <TermDrawer
        open={drawerOpen}
        term={editingTerm}
        isNew={isNew}
        onClose={handleClose}
        onSave={handleSave}
      />
    </>
  )
}
