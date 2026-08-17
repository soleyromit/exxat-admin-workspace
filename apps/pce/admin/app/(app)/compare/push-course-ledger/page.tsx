'use client'

/**
 * VARIANT C (compare surface, Jul 22) — course rows with a FLOW LEDGER.
 *
 * The synthesis of A and B: the unit of DECISION is the course (template,
 * include-in-push), the unit of INFORMATION is the flow — so the row is the
 * course and the Status cell is a LEDGER: one line per flow, fixed grammar
 * (glyph · evaluatee · status/fix), state-adaptive weight:
 *   blocked   → amber line, fix button ON the line (the only loud thing)
 *   creatable → UNLABELED (mark only exceptions — "will be created" is the
 *               default of a push wizard; the green band says it once)
 *   scheduled → "Scheduled · Oct 12" (the exception: it already exists)
 * Same anatomy the term workspace settled in PR #49 (offering row + per-flow
 * lines, independent statuses) — one product vocabulary for "one course,
 * several evaluation flows". Monil's separate-flows case reads natively:
 * lines diverge per evaluatee.
 *
 * Fully functional like Variant B: real Fall 2026 scope, template Select per
 * course re-derives the ledger, verdict groups (Needs setup / Ready to send /
 * Already covered) in ONE table — the wizard's own grouping anatomy.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Tip,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { NumericCell } from '@/components/data-views/table-cells'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { TruncatedText } from '@/components/truncated-text'
import { usePce } from '@/components/pce/pce-state'
import { offeringsForScope } from '@/lib/pce-course-scope'
import { courseDates } from '@/lib/pce-push-validation'
import {
  type Criterion, templateCriteria, deriveReadiness, FACULTY_CRITERIA,
} from '@/lib/pce-course-readiness'
import {
  type PceSurvey, COURSE_TYPE_FULL_LABEL,
} from '@/lib/pce-mock-data'

/** One line of a course's flow ledger. */
interface FlowLine {
  id: string
  kind: 'course' | 'person' | 'missing' | 'students'
  label: string
  subLabel?: string
  /** Right side — ONLY for exceptions ('Scheduled · Oct 12'); creatable
   *  lines stay unlabeled. */
  right?: string
  fix?: { label: string; href: string; tip: string }
}

interface CourseRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  datesLabel: string
  enrolled: number
  typeLabel: string
  templateId: string
  fullyCovered: boolean
  lines: FlowLine[]
  verdict: 'needs' | 'ready' | 'covered'
}

const fmtIso = (iso?: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function PushCourseLedgerComparePage() {
  const { templates, surveys } = usePce()
  const publishedTemplates = useMemo(
    () => templates.filter(t => t.status === 'active' && (!t.surveyType || t.surveyType === 'course_evaluation')),
    [templates],
  )
  const scoped = useMemo(() => offeringsForScope('Fall', '2026–2027', []), [])
  const [assignments, setAssignments] = useState<Record<string, string>>({})

  const flowsByOffering = useMemo(() => {
    const m = new Map<string, PceSurvey[]>()
    for (const s of surveys) {
      if (!s.offeringId) continue
      m.set(s.offeringId, [...(m.get(s.offeringId) ?? []), s])
    }
    return m
  }, [surveys])

  const rows = useMemo<CourseRow[]>(() => {
    return scoped.map(o => {
      const fallback = publishedTemplates.find(t => t.courseType === o.courseType) ?? publishedTemplates[0]
      const templateId = assignments[o.id] ?? fallback?.id ?? ''
      const template = publishedTemplates.find(t => t.id === templateId)
      const criteria = template ? templateCriteria(template) : []
      const rowCriteria: Criterion[] = criteria.includes('students') ? criteria : ['students', ...criteria]
      const r = deriveReadiness([o], rowCriteria)[0]
      const [code, ...rest] = r.courseLabel.split(' – ')
      const dates = courseDates(o)
      const datesLabel = dates
        ? `${dates.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${dates.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : '—'
      const flows = flowsByOffering.get(o.id) ?? []
      const studentsCell = r.cells.students
      const noStudents = !!studentsCell && !studentsCell.ok

      const lines: FlowLine[] = []
      let blocked = 0
      let creatable = 0

      // Course-level roster gap leads the ledger — it blocks EVERY flow.
      if (noStudents) {
        blocked++
        lines.push({
          id: `${o.id}-students`, kind: 'students',
          label: 'No students enrolled',
          fix: { label: 'Add students', href: studentsCell?.prismHref ?? '#', tip: 'Add enrolled students in Exxat Prism — opens in a new tab' },
        })
      }
      if (criteria.includes('students')) {
        const covered = flows.find(f => f.evalScope !== 'instructor')
        if (covered) {
          lines.push({ id: `${o.id}-course`, kind: 'course', label: 'Course', right: `Scheduled · ${fmtIso(covered.openDate)}` })
        } else {
          creatable++
          lines.push({ id: `${o.id}-course`, kind: 'course', label: 'Course', right: undefined })
        }
      }
      for (const c of FACULTY_CRITERIA) {
        const cell = r.cells[c]
        if (!cell) continue
        if (!cell.ok) {
          blocked++
          lines.push({
            id: `${o.id}-${c}`, kind: 'missing',
            label: cell.label, subLabel: 'not assigned',
            fix: { label: 'Add faculty', href: cell.prismHref ?? '#', tip: `Add a ${cell.label} in Exxat Prism — opens in a new tab` },
          })
          continue
        }
        const covered = flows.find(f => f.evalScope === 'instructor' && f.instructors[0]?.name === cell.value)
        if (covered) {
          lines.push({ id: `${o.id}-${c}`, kind: 'person', label: cell.value!, subLabel: cell.label, right: `Scheduled · ${fmtIso(covered.openDate)}` })
        } else {
          creatable++
          lines.push({ id: `${o.id}-${c}`, kind: 'person', label: cell.value!, subLabel: cell.label, right: undefined })
        }
      }

      const verdict: CourseRow['verdict'] = blocked > 0 ? 'needs' : creatable > 0 ? 'ready' : 'covered'
      return {
        id: o.id, code, name: rest.join(' – '), datesLabel,
        enrolled: o.enrolledCount, typeLabel: COURSE_TYPE_FULL_LABEL[r.deliveryMode],
        templateId, fullyCovered: verdict === 'covered', lines, verdict,
      }
    }).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
  }, [scoped, publishedTemplates, assignments, flowsByOffering])

  const columns = useMemo<ColumnDef<CourseRow>[]>(() => [
    {
      key: 'code', label: 'Course', width: 190, defaultPin: 'left',
      cell: r => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-mono text-xs tabular-nums">{r.code}</span>
          <TruncatedText className="text-sm font-medium">{r.name}</TruncatedText>
          <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{r.datesLabel}</span>
        </div>
      ),
    },
    {
      key: 'enrolled', label: 'Students', width: 76,
      cell: r => <NumericCell value={r.enrolled} className="text-muted-foreground" />,
    },
    {
      // THE ledger — one line per flow, state-adaptive weight. This IS the
      // Status column, and Monil's separate-flows case: lines diverge freely.
      key: 'lines', label: 'Evaluation flows', width: 356,
      cell: r => (
        <div className="flex flex-col gap-1.5 py-1 min-w-0" onClick={e => e.stopPropagation()}>
          {r.lines.map(l => {
            if (l.fix) {
              // Blocked line — the only loud thing on the surface.
              return (
                <span key={l.id} className="flex items-center gap-1.5 min-w-0">
                  <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--group-band-attention-bg)' }}>
                    <i className={`fa-light ${l.kind === 'students' ? 'fa-users-slash' : 'fa-user-slash'}`} style={{ fontSize: 9, color: 'var(--chip-4)' }} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--chip-4)' }}>
                    {l.label}{l.subLabel ? <span className="font-normal"> — {l.subLabel}</span> : null}
                  </span>
                  <span className="ms-auto shrink-0">
                    <Tip label={l.fix.tip} side="left">
                      <Button asChild variant="outline" size="xs">
                        <a href={l.fix.href} target="_blank" rel="noopener noreferrer">
                          <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
                          {l.fix.label}
                          <span className="sr-only"> (opens in new tab)</span>
                          <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
                        </a>
                      </Button>
                    </Tip>
                  </span>
                </span>
              )
            }
            return (
              <span key={l.id} className="flex items-center gap-1.5 min-w-0">
                {l.kind === 'course' ? (
                  <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--muted)' }}>
                    <i className="fa-light fa-book-open" style={{ fontSize: 9, color: 'var(--muted-foreground)' }} aria-hidden="true" />
                  </span>
                ) : (
                  <PersonAvatar name={l.label} className="size-5" />
                )}
                <span className="text-sm truncate">
                  {l.label}
                  {l.subLabel && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}> · {l.subLabel}</span>}
                </span>
                <span className="ms-auto text-xs whitespace-nowrap shrink-0 tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                  {l.right}
                </span>
              </span>
            )
          })}
        </div>
      ),
    },
    {
      key: 'template', label: 'Template', width: 210,
      cell: r => {
        if (r.fullyCovered) {
          return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
        }
        return (
          <div onClick={e => e.stopPropagation()}>
            <Select value={r.templateId} onValueChange={v => setAssignments(prev => ({ ...prev, [r.id]: v }))}>
              <SelectTrigger
                aria-label={`Template for ${r.code}`}
                className="w-full min-w-0 [&>span]:truncate [&>span]:min-w-0"
                style={{ height: 32, fontSize: 13 }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {publishedTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )
      },
    },
    {
      key: 'typeLabel', label: 'Type', width: 92,
      cell: r => (
        <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
          {r.typeLabel.replace(/ based$/, '')}
        </span>
      ),
    },
  ], [publishedTemplates])

  const tableState = useTableState<CourseRow>(
    rows, columns, undefined, { page: 1, pageSize: 50 },
    'verdict',
    {
      needs: 'Needs setup',
      ready: 'Ready to send',
      covered: 'Already covered',
    },
    ['needs', 'ready', 'covered'],
  )

  const blockedTotal = rows.reduce((n, r) => n + r.lines.filter(l => l.fix).length, 0)

  return (
    <div className="flex flex-col gap-5 p-6 max-w-5xl">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Variant C — course rows, flow ledger
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          The course stays the row (the decision unit); its flows are a ledger inside the Status
          cell — one line each, statuses free to diverge, and the {blockedTotal} blocked lines are
          the only loud thing on the page, each carrying its own fix. Same per-flow anatomy the
          term workspace settled. Compare:{' '}
          <Link href="/surveys/push?term=pt5" className="underline underline-offset-2" style={{ color: 'var(--foreground)' }}>A — wizard</Link>
          {' · '}
          <Link href="/compare/push-flow-rows" className="underline underline-offset-2" style={{ color: 'var(--foreground)' }}>B — flow rows</Link>.
        </p>
      </div>
      <DataTable<CourseRow>
        data={rows}
        columns={columns}
        state={tableState}
        getRowId={r => r.id}
        emptyState="No courses in scope."
        stickyHeader={false}
        searchable={false}
        selectable={false}
        groupIcons={{
          needs: <i className="fa-solid fa-triangle-exclamation text-xs" aria-hidden="true" />,
          ready: <i className="fa-solid fa-circle-check text-xs" aria-hidden="true" />,
          covered: <i className="fa-solid fa-calendar-check text-xs" aria-hidden="true" />,
        }}
        groupHeaderStyles={{
          needs: { background: 'var(--group-band-attention-bg)', color: 'var(--chip-4)' },
          ready: { background: 'var(--group-band-done-bg)', color: 'var(--chip-2)' },
        }}
      />
    </div>
  )
}
