'use client'

/**
 * VARIANT B (compare surface, Jul 22) — one row per EVALUATION FLOW.
 *
 * Monil's model: each (course × evaluatee) is a separate flow with its own
 * status and its own actions. Variant A (the live push wizard,
 * /surveys/push?term=pt5) keeps one row per COURSE and shows the flows inside
 * the Status cell. This page renders the same Fall 2026 fixtures as one row
 * per flow, grouped by course, so the two models can be compared side by side.
 * Representative subset (3 courses), not the full 14-course scope — enough to
 * judge the row model, not a second source of truth.
 */

import Link from 'next/link'
import { Button, Tip } from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { PersonAvatar } from '@/components/pce/person-avatar'
import type { SurveyStatus } from '@/lib/pce-mock-data'

interface FlowRow extends Record<string, unknown> {
  id: string
  courseCode: string
  /** null = the course itself is the evaluatee (course-material flow). */
  person: { name: string; role: string } | null
  /** null = flow not created yet (would be created by the next push). */
  status: SurveyStatus | null
  template: string
  window: string
}

/** Same fixtures as the wizard (pf0–pf3 + defaults), flattened to flows. */
const ROWS: FlowRow[] = [
  // DPT-510 — three real flows, three lifecycles (pf0/pf1/pf2)
  { id: 'f-510-course', courseCode: 'DPT-510', person: null, status: 'scheduled', template: 'End-of-Term Evaluation', window: 'Sep 14 – Sep 25' },
  { id: 'f-510-patel', courseCode: 'DPT-510', person: { name: 'Dr. Anita Patel', role: 'Coordinator' }, status: 'scheduled', template: 'Faculty Midterm Check-In', window: 'Oct 12 – Oct 23' },
  { id: 'f-510-chen', courseCode: 'DPT-510', person: { name: 'Dr. Kevin Chen', role: 'Instructor' }, status: 'draft', template: 'Faculty Midterm Check-In', window: 'Nov 23 – Dec 4' },
  // DPT-601 — course flow out (pf3); the faculty flow does not exist yet
  { id: 'f-601-course', courseCode: 'DPT-601', person: null, status: 'scheduled', template: 'End-of-Term Evaluation', window: 'Dec 4 – Dec 18' },
  { id: 'f-601-patel', courseCode: 'DPT-601', person: { name: 'Dr. Anita Patel', role: 'Clinical Coordinator' }, status: null, template: 'End-of-Term Evaluation', window: '—' },
  // DPT-501 — nothing pushed: every flow the next push would create
  { id: 'f-501-course', courseCode: 'DPT-501', person: null, status: null, template: 'End-of-Term Evaluation', window: '—' },
  { id: 'f-501-patel', courseCode: 'DPT-501', person: { name: 'Dr. Anita Patel', role: 'Instructor' }, status: null, template: 'End-of-Term Evaluation', window: '—' },
  { id: 'f-501-chen', courseCode: 'DPT-501', person: { name: 'Dr. Kevin Chen', role: 'Coordinator' }, status: null, template: 'End-of-Term Evaluation', window: '—' },
]

const GROUP_LABELS: Record<string, string> = {
  'DPT-510': 'DPT-510 — Musculoskeletal Physical Therapy I',
  'DPT-601': 'DPT-601 — Clinical Practicum I',
  'DPT-501': 'DPT-501 — Human Anatomy & Kinesiology',
}
const GROUP_ORDER = ['DPT-510', 'DPT-601', 'DPT-501']

const COLUMNS: ColumnDef<FlowRow>[] = [
  {
    key: 'person', label: 'Evaluates', width: 230,
    cell: r =>
      r.person ? (
        <span className="flex items-center gap-1.5 min-w-0 py-1">
          <PersonAvatar name={r.person.name} />
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{r.person.name}</span>
            <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{r.person.role}</span>
          </span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 py-1">
          <span className="size-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--muted)' }}>
            <i className="fa-light fa-book-open" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} aria-hidden="true" />
          </span>
          <span className="text-sm font-medium">Course</span>
        </span>
      ),
  },
  {
    key: 'status', label: 'Status', width: 130,
    cell: r =>
      r.status
        ? <SurveyStatusBadge status={r.status} />
        : <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Not pushed</span>,
  },
  {
    key: 'template', label: 'Template', width: 210,
    cell: r => <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{r.template}</span>,
  },
  {
    key: 'window', label: 'Window', width: 140,
    cell: r => <span className="text-sm tabular-nums whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{r.window}</span>,
  },
  {
    // The point of variant B: each flow carries ITS OWN action.
    key: 'action', label: 'Action', width: 170,
    cell: r => {
      if (r.status === 'draft') {
        return (
          <Button variant="outline" size="xs" onClick={e => e.stopPropagation()}>
            Finalize &amp; schedule
          </Button>
        )
      }
      if (r.status === 'scheduled') {
        return (
          <Button variant="outline" size="xs" onClick={e => e.stopPropagation()}>
            Edit schedule
          </Button>
        )
      }
      return (
        <Tip label="This flow is created when you push the course from the wizard" side="left">
          <span
            tabIndex={0}
            className="text-xs underline decoration-dotted underline-offset-2 cursor-default rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Created on push
          </span>
        </Tip>
      )
    },
  },
]

export default function PushFlowRowsComparePage() {
  const tableState = useTableState<FlowRow>(
    ROWS, COLUMNS, undefined, { page: 1, pageSize: 50 },
    'courseCode', GROUP_LABELS, GROUP_ORDER,
  )
  return (
    <div className="flex flex-col gap-5 p-6 max-w-5xl">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Variant B — one row per evaluation flow
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Each (course × evaluatee) flow is its own row with its own status and action, grouped by
          course — Monil&rsquo;s per-evaluatee model made literal. Compare with{' '}
          <Link href="/surveys/push?term=pt5" className="underline underline-offset-2" style={{ color: 'var(--foreground)' }}>
            Variant A — the push wizard
          </Link>{' '}
          (one row per course; flows shown inside the Status cell).
        </p>
      </div>
      <DataTable<FlowRow>
        data={ROWS}
        columns={COLUMNS}
        state={tableState}
        getRowId={r => r.id}
        emptyState="No flows in the comparison set."
        stickyHeader={false}
      />
    </div>
  )
}
