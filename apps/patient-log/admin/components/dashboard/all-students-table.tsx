'use client'

import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { Badge } from '@exxat/ds/packages/ui/src'
import { STUDENTS, type StudentLog, type StudentStatus } from '@/lib/mock-data'

const STATUS_LABELS: Record<StudentStatus, string> = {
  'on-track':  'On Track',
  'at-risk':   'At Risk',
  'completed': 'Completed',
}

const STATUS_VARIANTS: Record<StudentStatus, 'default' | 'destructive' | 'outline'> = {
  'on-track':  'outline',
  'at-risk':   'destructive',
  'completed': 'default',
}

const ALL_STUDENTS_COLS: ColumnDef<StudentLog>[] = [
  {
    key: 'name',
    label: 'Student',
    width: 200,
    sortable: true,
    cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
  },
  {
    key: 'program',
    label: 'Program',
    width: 140,
    sortable: true,
    cell: (row) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.program}</span>,
  },
  {
    key: 'loggedCount',
    label: 'Logged',
    width: 90,
    sortable: true,
    cell: (row) => <span className="text-sm font-medium">{row.loggedCount}</span>,
  },
  {
    key: 'targetCount',
    label: 'Target',
    width: 80,
    cell: (row) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.targetCount}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    sortable: true,
    cell: (row) => (
      <Badge variant={STATUS_VARIANTS[row.status]}>
        {STATUS_LABELS[row.status]}
      </Badge>
    ),
  },
]

export function AllStudentsTable() {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--background)',
        overflow: 'hidden',
      }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>All Students</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{STUDENTS.length} enrolled this term</p>
      </div>
      <DataTable
        data={STUDENTS}
        columns={ALL_STUDENTS_COLS}
        getRowId={(row) => row.id}
        searchable
        defaultSort={{ key: 'status', dir: 'asc' }}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <i className="fa-light fa-user-slash text-2xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>No students enrolled</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No students are enrolled in this term yet.</p>
          </div>
        }
      />
    </div>
  )
}
