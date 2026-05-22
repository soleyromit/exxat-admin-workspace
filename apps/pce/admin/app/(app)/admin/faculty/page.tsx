'use client'

/**
 * Admin · Faculty (UC-19, workspace ADR-001 entity #5).
 *
 * Per Aarti 2026-05-08 16:09 D12: Faculty profile must be a SHARED component
 * between Exam Mgmt + CFE — single source of truth. This admin list view is
 * the platform-level inventory; the per-faculty drilldown will become a
 * shared React component in a later workstream.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Button,
  Tooltip, TooltipContent, TooltipTrigger,
  Avatar, AvatarFallback,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_FACULTY, MOCK_LMS_ENABLED, MOCK_COURSE_OFFERINGS,
  type PceInstructor,
} from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions, type RowAction } from '@/components/data-table/row-actions'

/* Flat row type — keep faculty record + sortable scalars (name, count). */
interface FacultyRow extends Record<string, unknown> {
  id: string
  faculty: PceInstructor
  name: string
  initials: string
  offeringCount: number
}

export default function FacultyPage() {
  // Derived: count of course offerings per faculty (active term)
  const offeringCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of MOCK_COURSE_OFFERINGS) {
      if (o.status === 'archived') continue
      m.set(o.primaryFacultyId, (m.get(o.primaryFacultyId) ?? 0) + 1)
    }
    return m
  }, [])

  const rows: FacultyRow[] = useMemo(
    () => MOCK_FACULTY.map(f => ({
      id: f.id,
      faculty: f,
      name: f.name,
      initials: f.initials,
      offeringCount: offeringCount.get(f.id) ?? 0,
    })),
    [offeringCount]
  )

  const columns: ColumnDef<FacultyRow>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: 280,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 rounded-full shrink-0">
            <AvatarFallback
              className="rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
            >
              {row.initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'offeringCount',
      label: 'Active offerings',
      sortable: true,
      width: 180,
      cell: (row) => (
        <span className="tabular-nums text-sm">
          {row.offeringCount > 0
            ? `${row.offeringCount} offering${row.offeringCount === 1 ? '' : 's'}`
            : <span className="text-muted-foreground">none</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => (
        <RowActions
          row={row}
          label={row.name}
          actions={FACULTY_ROW_ACTIONS}
        />
      ),
    },
  ]

  const FACULTY_ROW_ACTIONS: RowAction<FacultyRow>[] = [
    { label: 'Edit profile',   icon: 'fa-pen',             disabled: MOCK_LMS_ENABLED },
    { label: 'View offerings', icon: 'fa-rectangle-list'  },
    { label: 'Manage roles',   icon: 'fa-shield-check'    },
    { label: 'Archive',        icon: 'fa-box-archive',     variant: 'destructive', divider: true },
  ]

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Faculty</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            Faculty profiles are shared across all modules. Manage the master list here.
          </p>

          {/* Toolbar: Add + Import sit outside the table because they aren't column controls.
              Search is provided by DataTable's built-in searchable toolbar. */}
          <div className="flex items-center gap-2 justify-end">
            {MOCK_LMS_ENABLED ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" disabled aria-disabled="true">
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add faculty
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Managed by your LMS</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" disabled aria-disabled="true">
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add faculty
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Faculty add UI coming in next pass — use Import CSV for now</TooltipContent>
              </Tooltip>
            )}

            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import CSV
            </Button>
          </div>

          <DataTable<FacultyRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-users text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">
                  {rows.length === 0 ? 'No faculty yet' : 'No faculty match your search'}
                </p>
                <p className="text-xs text-muted-foreground" style={{ maxWidth: 320 }}>
                  {rows.length === 0
                    ? (MOCK_LMS_ENABLED ? 'Faculty sync from your LMS — none have synced yet.' : 'Import a CSV or wait for the Add faculty UI in Phase 2.')
                    : 'Try a different name or clear the search.'}
                </p>
              </div>
            }
            toolbarSlot={(state) => (
              <span className="text-xs text-muted-foreground">
                {state.rows.length} faculty member{state.rows.length !== 1 ? 's' : ''}
              </span>
            )}
          />

          {!MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is off. Faculty list is managed manually.
            </p>
          )}

        </div>
      </div>
    </>
  )
}

