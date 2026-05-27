'use client'

import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { Badge } from '@exxat/ds/packages/ui/src'
import { STUDENTS, type StudentLog } from '@/lib/mock-data'

const AT_RISK_COLS: ColumnDef<StudentLog>[] = [
  {
    key: 'name',
    label: 'Student',
    width: 180,
    cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
  },
  {
    key: 'program',
    label: 'Program',
    width: 120,
    cell: (row) => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.program}</span>,
  },
  {
    key: 'loggedCount',
    label: 'Logged / Target',
    width: 140,
    cell: (row) => (
      <span className="text-sm">
        <span className="font-medium" style={{ color: 'var(--destructive)' }}>{row.loggedCount}</span>
        <span style={{ color: 'var(--muted-foreground)' }}> / {row.targetCount}</span>
      </span>
    ),
  },
]

const atRiskStudents = STUDENTS.filter(s => s.status === 'at-risk').slice(0, 5)

export function AtRiskTable() {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--background)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Students at Risk</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Below 50% of encounter target</p>
        </div>
        <Badge variant="destructive">{atRiskStudents.length} students</Badge>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <DataTable
          data={atRiskStudents}
          columns={AT_RISK_COLS}
          getRowId={(row) => row.id}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <i className="fa-light fa-circle-check text-2xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>No students at risk</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>All students are meeting their encounter targets.</p>
            </div>
          }
        />
      </div>
    </div>
  )
}
