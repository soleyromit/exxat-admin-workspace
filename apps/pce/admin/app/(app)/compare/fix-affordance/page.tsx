'use client'

/**
 * FIX-AFFORDANCE COMPARE (Jul 22) — three treatments of the blocked-flow fix
 * inside the Evaluation-flows ledger, same three courses in all three, so the
 * only variable is the design:
 *
 *  1. INLINE LINK — the action stays ON the blocked line, but as a compact
 *     amber text link instead of a bordered button. Per-gap precision,
 *     minimum chrome.
 *  2. COURSE FOOTER — ledger lines are pure information; ONE consolidated
 *     action line per course sits under the ledger. Predictable place,
 *     fewest interactive elements.
 *  3. GAP CHIP — blocked roles leave the ledger entirely: an amber "N gaps"
 *     chip summarizes them, detail + per-gap links live in its popover.
 *     Calmest cell; detail on demand.
 */

import type { ReactNode } from 'react'
import {
  Button, Tip, Popover, PopoverTrigger, PopoverContent,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { TruncatedText } from '@/components/truncated-text'

interface Gap { role: string; kind: 'faculty' | 'students' }
interface Line { id: string; kind: 'course' | 'person'; label: string; sub?: string; right?: string }
interface CourseRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  enrolled: number
  lines: Line[]
  gaps: Gap[]
}

/** Same three courses in every variant — the design is the only variable. */
const ROWS: CourseRow[] = [
  {
    id: 'c1', code: 'DPT-502', name: 'Physiology & Pathophysiology', enrolled: 48,
    lines: [
      { id: 'l1', kind: 'course', label: 'Course' },
      { id: 'l2', kind: 'person', label: 'Dr. Maria Williams', sub: 'Coordinator' },
    ],
    gaps: [{ role: 'Instructor', kind: 'faculty' }],
  },
  {
    id: 'c2', code: 'DPT-511', name: 'Musculoskeletal Physical Therapy II', enrolled: 0,
    lines: [
      { id: 'l1', kind: 'course', label: 'Course' },
      { id: 'l2', kind: 'person', label: 'Dr. Kevin Chen', sub: 'Lab Instructor' },
      { id: 'l3', kind: 'person', label: 'Dr. Maria Williams', sub: 'Coordinator' },
    ],
    gaps: [{ role: 'No students enrolled', kind: 'students' }],
  },
  {
    id: 'c3', code: 'DPT-601', name: 'Clinical Practicum I', enrolled: 14,
    lines: [
      { id: 'l1', kind: 'course', label: 'Course', right: 'Scheduled · Dec 4' },
      { id: 'l2', kind: 'person', label: 'Dr. Anita Patel', sub: 'Clinical Coordinator' },
    ],
    gaps: [{ role: 'Placement Faculty', kind: 'faculty' }],
  },
]

const gapLabel = (g: Gap) => g.kind === 'students' ? g.role : `${g.role} — not assigned`
const fixLabel = (g: Gap) => g.kind === 'students' ? 'Add students' : 'Add faculty'

function GapDisc({ kind }: { kind: Gap['kind'] }) {
  return (
    <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--group-band-attention-bg)' }}>
      <i className={`fa-light ${kind === 'students' ? 'fa-users-slash' : 'fa-user-slash'}`} style={{ fontSize: 9, color: 'var(--chip-4)' }} aria-hidden="true" />
    </span>
  )
}

function FlowLine({ l }: { l: Line }) {
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      {l.kind === 'course' ? (
        <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--muted)' }}>
          <i className="fa-light fa-book-open" style={{ fontSize: 9, color: 'var(--muted-foreground)' }} aria-hidden="true" />
        </span>
      ) : (
        <PersonAvatar name={l.label} className="size-5" />
      )}
      <span className="text-sm truncate">
        {l.label}
        {l.sub && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}> · {l.sub}</span>}
      </span>
      {l.right && (
        <span className="ms-auto text-xs whitespace-nowrap shrink-0 tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{l.right}</span>
      )}
    </span>
  )
}

/** V1 — blocked line keeps its own action, as an amber text link. */
function LedgerInlineLink({ r }: { r: CourseRow }) {
  return (
    <div className="flex flex-col gap-1.5 py-1 min-w-0" onClick={e => e.stopPropagation()}>
      {r.gaps.map(g => (
        <span key={g.role} className="flex items-center gap-1.5 min-w-0">
          <GapDisc kind={g.kind} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--chip-4)' }}>
            {g.kind === 'students' ? g.role : <>{g.role}<span className="font-normal"> — not assigned</span></>}
          </span>
          <a
            href="#" target="_blank" rel="noopener noreferrer"
            className="ms-auto shrink-0 text-xs font-medium underline underline-offset-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ color: 'var(--chip-4)' }}
          >
            {fixLabel(g)}
            <span className="sr-only"> in Exxat Prism (opens in new tab)</span>
            <i className="fa-light fa-arrow-up-right-from-square text-xs ms-1" aria-hidden="true" />
          </a>
        </span>
      ))}
      {r.lines.map(l => <FlowLine key={l.id} l={l} />)}
    </div>
  )
}

/** V2 — lines are information only; one consolidated action line per course. */
function LedgerCourseFooter({ r }: { r: CourseRow }) {
  const kinds = [...new Set(r.gaps.map(fixLabel))]
  return (
    <div className="flex flex-col gap-1.5 py-1 min-w-0" onClick={e => e.stopPropagation()}>
      {r.gaps.map(g => (
        <span key={g.role} className="flex items-center gap-1.5 min-w-0">
          <GapDisc kind={g.kind} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--chip-4)' }}>
            {g.kind === 'students' ? g.role : <>{g.role}<span className="font-normal"> — not assigned</span></>}
          </span>
        </span>
      ))}
      {r.lines.map(l => <FlowLine key={l.id} l={l} />)}
      {r.gaps.length > 0 && (
        <span className="flex items-center gap-2 pt-0.5">
          {kinds.map(k => (
            <a
              key={k}
              href="#" target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium underline underline-offset-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ color: 'var(--chip-4)' }}
            >
              <i className="fa-regular fa-circle-plus text-xs me-1" aria-hidden="true" />
              {k} in Prism
              <span className="sr-only"> (opens in new tab)</span>
              <i className="fa-light fa-arrow-up-right-from-square text-xs ms-1" aria-hidden="true" />
            </a>
          ))}
        </span>
      )}
    </div>
  )
}

/** V3 — gaps leave the ledger: an amber chip summarizes; detail in popover. */
function LedgerGapChip({ r }: { r: CourseRow }) {
  return (
    <div className="flex flex-col gap-1.5 py-1 min-w-0" onClick={e => e.stopPropagation()}>
      {r.gaps.length > 0 && (
        <span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="xs"
                className="h-auto rounded-full px-2 py-0.5 text-xs font-medium border-0"
                style={{ background: 'var(--group-band-attention-bg)', color: 'var(--chip-4)' }}
              >
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 9 }} aria-hidden="true" />
                {r.gaps.length} gap{r.gaps.length === 1 ? '' : 's'} — fix in Prism
              </Button>
            </PopoverTrigger>
            <PopoverContent aria-label={`Setup gaps for ${r.code}`} align="start" className="w-auto p-3" style={{ maxWidth: 280 }}>
              <div className="flex flex-col gap-2.5">
                {r.gaps.map(g => (
                  <span key={g.role} className="flex items-center gap-2 min-w-0">
                    <GapDisc kind={g.kind} />
                    <span className="text-sm truncate">{gapLabel(g)}</span>
                    <a
                      href="#" target="_blank" rel="noopener noreferrer"
                      className="ms-auto shrink-0 text-xs font-medium underline underline-offset-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {fixLabel(g)}
                      <span className="sr-only"> in Exxat Prism (opens in new tab)</span>
                      <i className="fa-light fa-arrow-up-right-from-square text-xs ms-1" aria-hidden="true" />
                    </a>
                  </span>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </span>
      )}
      {r.lines.map(l => <FlowLine key={l.id} l={l} />)}
    </div>
  )
}

/** V4 — dedicated Action column; ledger lines are information only. */
function LedgerInfoOnly({ r }: { r: CourseRow }) {
  return (
    <div className="flex flex-col gap-1.5 py-1 min-w-0">
      {r.gaps.map(g => (
        <span key={g.role} className="flex items-center gap-1.5 min-w-0">
          <GapDisc kind={g.kind} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--chip-4)' }}>
            {g.kind === 'students' ? g.role : <>{g.role}<span className="font-normal"> — not assigned</span></>}
          </span>
        </span>
      ))}
      {r.lines.map(l => <FlowLine key={l.id} l={l} />)}
    </div>
  )
}

function ActionCell({ r }: { r: CourseRow }) {
  const kinds = [...new Set(r.gaps.map(fixLabel))]
  if (kinds.length === 0) {
    return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
  }
  return (
    <div className="flex flex-col items-start gap-1 py-0.5" onClick={e => e.stopPropagation()}>
      {kinds.map(k => (
        <Tip key={k} label={`${k} in Exxat Prism — opens in a new tab`} side="left">
          <Button asChild variant="outline" size="xs">
            <a href="#" target="_blank" rel="noopener noreferrer">
              <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
              {k}
              <span className="sr-only"> (opens in new tab)</span>
              <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
            </a>
          </Button>
        </Tip>
      ))}
    </div>
  )
}

const VARIANTS: { id: string; title: string; why: string; render: (r: CourseRow) => ReactNode; actionColumn?: boolean }[] = [
  {
    id: 'v1', title: '1 — Inline link',
    why: 'The fix stays on the exact line it unblocks, but as a compact amber link — per-gap precision, minimum chrome. Risk: links inside data lines still add interactive noise to reading.',
    render: r => <LedgerInlineLink r={r} />,
  },
  {
    id: 'v2', title: '2 — Course footer action',
    why: 'Ledger lines become pure information; every fix for the course consolidates into one predictable action line at the bottom. Fewest interactive elements. Risk: the action is one step removed from the specific gap.',
    render: r => <LedgerCourseFooter r={r} />,
  },
  {
    id: 'v3', title: '3 — Gap chip, detail on demand',
    why: 'Blocked roles leave the ledger entirely — an amber chip counts them; names and per-gap links live in its popover. Calmest cell by far. Risk: one extra click, and gap names are hidden at a glance.',
    render: r => <LedgerGapChip r={r} />,
  },
  {
    id: 'v4', title: '4 — Dedicated Action column',
    why: 'The classic pattern, revisited: ledger lines are pure information, buttons live in one scannable column. Works now because the amber lines name each gap in the same row. Risk: ~150px of width (needs a slightly narrower ledger to stay inside the no-scroll budget) and the action sits a column away from its gap.',
    render: r => <LedgerInfoOnly r={r} />,
    actionColumn: true,
  },
]

function VariantTable({ render, actionColumn = false }: { render: (r: CourseRow) => ReactNode; actionColumn?: boolean }) {
  const columns: ColumnDef<CourseRow>[] = [
    {
      key: 'code', label: 'Course', width: 190,
      cell: r => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-mono text-xs tabular-nums">{r.code}</span>
          <TruncatedText className="text-sm font-medium">{r.name}</TruncatedText>
          <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{r.enrolled} students</span>
        </div>
      ),
    },
    { key: 'lines', label: 'Evaluation flows', width: actionColumn ? 300 : 430, cell: render },
    ...(actionColumn
      ? [{ key: 'action', label: 'Action needed', width: 150, cell: (r: CourseRow) => <ActionCell r={r} /> } satisfies ColumnDef<CourseRow>]
      : []),
  ]
  const tableState = useTableState<CourseRow>(ROWS, columns, undefined, { page: 1, pageSize: 10 })
  return (
    <DataTable<CourseRow>
      data={ROWS}
      columns={columns}
      state={tableState}
      getRowId={r => r.id}
      emptyState="—"
      stickyHeader={false}
      searchable={false}
      selectable={false}
    />
  )
}

export default function FixAffordanceComparePage() {
  return (
    <div className="flex flex-col gap-6 p-6" style={{ maxWidth: 760 }}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Fix affordance — three treatments
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Same three courses in each; the only variable is where the &ldquo;Add faculty / Add
          students&rdquo; action lives. Pick one and it replaces the buttons in the wizard&rsquo;s ledger.
        </p>
      </div>
      {VARIANTS.map(v => (
        <div key={v.id} className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold">{v.title}</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{v.why}</p>
          </div>
          <VariantTable render={v.render} actionColumn={v.actionColumn} />
        </div>
      ))}
    </div>
  )
}
