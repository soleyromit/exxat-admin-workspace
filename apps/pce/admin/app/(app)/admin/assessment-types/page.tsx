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
} from '@exxat/ds/packages/ui/src'
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
            Five Phase 1 types ship at launch. Lockdown + remote-monitored proctoring follow in P2/P3 (per Aarti audit D13). Per-type parameter spec is a separate workstream — this list is the canonical inventory.
          </p>

          <DataTable<AssessmentTypeRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            searchable
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
