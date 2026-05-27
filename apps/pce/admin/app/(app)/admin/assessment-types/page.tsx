'use client'

/**
 * Admin · Assessment Types (UC-19, workspace ADR-001 entity #11).
 *
 * Per Aarti 2026-05-06 audit T6 (BLOCKER): "Five assessment types — get
 * product/PM alignment on definitions and per-type parameters before more
 * assessment screens." This list view is the canonical inventory; the
 * per-type parameter spec is a separate doc workstream.
 *
 * Phase rollout per Aarti 2026-05-08 16:09 D13:
 *   P1: pop quiz / timed / take-home / open-book / standard proctored
 *   P2: lockdown browser
 *   P3: remote-monitored proctored
 */

import Link from 'next/link'
import {
  Badge,
  SidebarTrigger, Separator,
} from '@exxatdesignux/ui'
import { MOCK_ASSESSMENT_TYPES } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'

/* Flat row shape — sortable scalars hoisted onto the row so the canonical
   DataTable's sortKey indexing works without accessor callbacks. */
interface AssessmentTypeRow extends Record<string, unknown> {
  id: string
  name: string
  description: string
  phase: number
  status: string
}

export default function AssessmentTypesPage() {
  const rows: AssessmentTypeRow[] = MOCK_ASSESSMENT_TYPES.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    phase: t.phase,
    status: t.status,
  }))

  const columns: ColumnDef<AssessmentTypeRow>[] = [
    {
      key: 'name',
      label: 'Type',
      sortable: true,
      width: 220,
      cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.description}</span>,
    },
    {
      key: 'phase',
      label: 'Phase',
      sortable: true,
      width: 80,
      cell: (row) => <span className="text-xs tabular-nums">P{row.phase}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 120,
      cell: (row) => (
        <Badge variant="secondary" className="capitalize">
          {row.status}
        </Badge>
      ),
    },
  ]

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Assessment Types</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            Five assessment types are available. Additional proctoring types are coming in future updates.
          </p>

          <DataTable<AssessmentTypeRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            searchable
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-clipboard-question text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">No assessment types match your search</p>
                <p className="text-xs text-muted-foreground">Clear the search to see the full inventory.</p>
              </div>
            }
            toolbarSlot={(state) => (
              <span className="text-xs text-muted-foreground">
                {state.rows.length} assessment type{state.rows.length !== 1 ? 's' : ''}
              </span>
            )}
          />

          <p className="text-xs text-muted-foreground">
            <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
            Assessment types are platform-defined and not customer-editable. New types require an ADR + workspace governance review.
          </p>

        </div>
      </div>
    </>
  )
}
