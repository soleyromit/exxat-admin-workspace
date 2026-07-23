'use client'

/**
 * VARIANT B (compare surface, Jul 22) — audit, one row per EVALUATION FLOW.
 *
 * Round 5 (Romit): fully FUNCTIONAL — same machinery as the wizard, not
 * hardcoded rows. Real Fall 2026 scope (offeringsForScope), real published
 * templates, per-course template Select; the template's role set derives the
 * flow rows (type-aware: Lab Instructor on lab, Placement Faculty on
 * practice), deriveReadiness marks what's blocked, existing pushed flows
 * (pf0–pf3) mark what's covered. Changing a template re-derives the course's
 * rows and re-sections it live.
 *
 * Page structure = the audit verdict (Round 4):
 *   NEEDS SETUP → READY TO SEND → ALREADY COVERED
 * Lifecycle ground rules: a flow born from a push STARTS at 'scheduled' — no
 * per-faculty draft; live management belongs to the term workspace.
 */

import type React from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Tip,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { usePce } from '@/components/pce/pce-state'
import { offeringsForScope } from '@/lib/pce-course-scope'
import { courseDates } from '@/lib/pce-push-validation'
import {
  type Criterion, templateCriteria, deriveReadiness, FACULTY_CRITERIA,
} from '@/lib/pce-course-readiness'
import {
  type PceSurvey, type SurveyStatus, COURSE_TYPE_FULL_LABEL,
} from '@/lib/pce-mock-data'

interface FlowRow extends Record<string, unknown> {
  id: string
  offeringId: string
  courseCode: string
  /** null = the course itself is the evaluatee (course-material flow). */
  person: { name: string; role: string } | null
  /** Role the template evaluates that nobody holds in Prism. */
  missingRole?: string
  missingHref?: string
  /** Course has no enrolled students — blocks every flow of the course. */
  noStudents?: boolean
  studentsHref?: string
  /** Existing pushed flow covering this evaluatee, else null. */
  status: SurveyStatus | null
  statusLine: string
  templateName: string
  /** This row hosts the course's template Select (first row the push would create). */
  hostsSelect?: boolean
}

interface CourseAudit {
  offeringId: string
  code: string
  bandLabel: string
  rows: FlowRow[]
  verdict: 'needs' | 'ready' | 'covered'
  blockedCount: number
  createCount: number
}

const fmtD = (iso?: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function PushFlowRowsComparePage() {
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

  const templateNameById = useMemo(
    () => new Map(templates.map(t => [t.id, t.name])),
    [templates],
  )

  const audits = useMemo<CourseAudit[]>(() => {
    return scoped.map(o => {
      // Same default rule as the wizard: courseType match ?? first published.
      const fallback = publishedTemplates.find(t => t.courseType === o.courseType) ?? publishedTemplates[0]
      const templateId = assignments[o.id] ?? fallback?.id ?? ''
      const template = publishedTemplates.find(t => t.id === templateId)
      const criteria = template ? templateCriteria(template) : []
      const rowCriteria: Criterion[] = criteria.includes('students') ? criteria : ['students', ...criteria]
      const r = deriveReadiness([o], rowCriteria)[0]
      const [code] = r.courseLabel.split(' – ')
      const dates = courseDates(o)
      const datesLabel = dates
        ? `${dates.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${dates.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : '—'
      const flows = flowsByOffering.get(o.id) ?? []
      const studentsCell = r.cells.students
      const noStudents = !!studentsCell && !studentsCell.ok

      const rows: FlowRow[] = []
      // Course-material flow — only when the template evaluates course content.
      if (criteria.includes('students')) {
        const covered = flows.find(f => f.evalScope !== 'instructor')
        rows.push({
          id: `${o.id}-course`, offeringId: o.id, courseCode: code, person: null,
          noStudents: !covered && noStudents, studentsHref: studentsCell?.prismHref ?? undefined,
          status: covered?.status ?? null,
          statusLine: covered
            ? `Opens ${fmtD(covered.openDate)}`
            : noStudents ? 'No students enrolled' : 'Created when you push this course',
          templateName: covered ? (templateNameById.get(covered.templateId) ?? '') : (template?.name ?? ''),
        })
      }
      // One flow per evaluated faculty role (type-aware labels from readiness).
      for (const c of FACULTY_CRITERIA) {
        const cell = r.cells[c]
        if (!cell) continue
        const covered = cell.ok
          ? flows.find(f => f.evalScope === 'instructor' && f.instructors[0]?.name === cell.value)
          : undefined
        rows.push({
          id: `${o.id}-${c}`, offeringId: o.id, courseCode: code,
          person: cell.ok && cell.value ? { name: cell.value ?? '', role: cell.label } : null,
          missingRole: cell.ok ? undefined : cell.label,
          missingHref: cell.ok ? undefined : (cell.prismHref ?? '#'),
          noStudents: !covered && noStudents,
          status: covered?.status ?? null,
          statusLine: covered
            ? `Opens ${fmtD(covered.openDate)}`
            : !cell.ok ? 'No one holds this role in Prism'
              : noStudents ? 'No students enrolled' : 'Created when you push this course',
          templateName: covered ? (templateNameById.get(covered.templateId) ?? '') : (template?.name ?? ''),
        })
      }
      // Blocked rows lead the group; covered rows sink to the bottom.
      rows.sort((a, b) =>
        Number(!!b.missingRole) - Number(!!a.missingRole) ||
        Number(!!a.status) - Number(!!b.status))
      // The Select rides the first row this push would CREATE.
      const host = rows.find(x => !x.status)
      if (host) host.hostsSelect = true

      const blockedCount = rows.filter(x => !x.status && (x.missingRole || x.noStudents)).length
      const createCount = rows.filter(x => !x.status && !x.missingRole && !x.noStudents).length
      const verdict: CourseAudit['verdict'] =
        blockedCount > 0 ? 'needs' : createCount > 0 ? 'ready' : 'covered'
      return {
        offeringId: o.id, code,
        bandLabel: `${r.courseLabel} · ${o.enrolledCount} students · ${datesLabel} · ${COURSE_TYPE_FULL_LABEL[r.deliveryMode]}`,
        rows, verdict, blockedCount, createCount,
      }
    }).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
  }, [scoped, publishedTemplates, assignments, flowsByOffering, templateNameById])

  const needs = audits.filter(a => a.verdict === 'needs')
  const ready = audits.filter(a => a.verdict === 'ready')
  const covered = audits.filter(a => a.verdict === 'covered')

  const columns = useMemo<ColumnDef<FlowRow>[]>(() => [
    {
      key: 'person', label: 'Evaluates', width: 220,
      cell: r => {
        if (r.missingRole) {
          // Amber vocabulary end to end: the empty-role disc matches the row
          // wash and the section band, so "this is the problem" reads at a
          // glance rather than from the words.
          return (
            <span className="flex items-center gap-1.5 min-w-0 py-1">
              <span className="size-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--group-band-attention-bg)' }}>
                <i className="fa-light fa-user-slash" style={{ fontSize: 10, color: 'var(--chip-4)' }} aria-hidden="true" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{r.missingRole}</span>
                <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>Not assigned</span>
              </span>
            </span>
          )
        }
        return r.person ? (
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
        )
      },
    },
    {
      // Three visually DISTINCT vocabularies, one per state: lifecycle badge +
      // opens date (covered) / amber bold Blocked + reason (the problem) /
      // one quiet "Will be created" line (fine, nothing to read twice).
      key: 'status', label: 'Status', width: 200,
      cell: r => {
        if (r.status) {
          return (
            <span className="flex flex-col items-start gap-0.5 py-1">
              <SurveyStatusBadge status={r.status} />
              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{r.statusLine}</span>
            </span>
          )
        }
        if (r.missingRole || r.noStudents) {
          return (
            <span className="flex flex-col items-start gap-0.5 py-1">
              <span className="text-sm font-medium" style={{ color: 'var(--chip-4)' }}>Blocked</span>
              <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{r.statusLine}</span>
            </span>
          )
        }
        return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Will be created</span>
      },
    },
    {
      // Covered flows name the template they were pushed with; the first row
      // this push would create hosts the course's template Select — changing
      // it re-derives the course's flow rows and its section, live.
      key: 'template', label: 'Template', width: 216,
      cell: r => {
        if (!r.hostsSelect) {
          return <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>{r.templateName}</span>
        }
        const fallback = publishedTemplates.find(t => t.name === r.templateName)
        return (
          <div onClick={e => e.stopPropagation()}>
            <Select
              value={fallback?.id ?? ''}
              onValueChange={v => setAssignments(prev => ({ ...prev, [r.offeringId]: v }))}
            >
              <SelectTrigger
                aria-label={`Template for ${r.courseCode}`}
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
      key: 'action', label: 'Action needed', width: 170,
      cell: r => {
        if (r.missingRole) {
          return (
            <Tip label={`Add a ${r.missingRole} in Exxat Prism — opens in a new tab`} side="left">
              <Button asChild variant="outline" size="xs" onClick={e => e.stopPropagation()}>
                <a href={r.missingHref} target="_blank" rel="noopener noreferrer">
                  <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
                  Add faculty
                  <span className="sr-only"> (opens in new tab)</span>
                  <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
                </a>
              </Button>
            </Tip>
          )
        }
        if (r.noStudents && !r.person) {
          return (
            <Tip label="Add enrolled students in Exxat Prism — opens in a new tab" side="left">
              <Button asChild variant="outline" size="xs" onClick={e => e.stopPropagation()}>
                <a href={r.studentsHref ?? '#'} target="_blank" rel="noopener noreferrer">
                  <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
                  Add students
                  <span className="sr-only"> (opens in new tab)</span>
                  <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
                </a>
              </Button>
            </Tip>
          )
        }
        return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
      },
    },
  ], [publishedTemplates])

  return (
    <div className="flex flex-col gap-4 p-6 max-w-5xl">
      <div className="flex flex-col gap-1.5 pb-1">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Variant B — audit, one row per evaluation flow
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Functional prototype on the real Fall 2026 scope: the template Select derives each
          course&rsquo;s flow rows (type-aware roles), readiness marks what&rsquo;s blocked, earlier runs mark
          what&rsquo;s covered. Change a template and watch the course re-derive. Compare with{' '}
          <Link href="/surveys/push?term=pt5" className="underline underline-offset-2" style={{ color: 'var(--foreground)' }}>
            Variant A — the push wizard
          </Link>.
        </p>
      </div>

      <Section
        tone="attention" icon="fa-solid fa-triangle-exclamation" title="Needs setup"
        meta={`${needs.length} course${needs.length === 1 ? '' : 's'} · ${needs.reduce((n, a) => n + a.blockedCount, 0)} blocked flows — fix in Prism before these can be scheduled`}
        audits={needs} columns={columns}
      />
      <Section
        tone="done" icon="fa-solid fa-circle-check" title="Ready to send"
        meta={`${ready.length} course${ready.length === 1 ? '' : 's'} · ${ready.reduce((n, a) => n + a.createCount, 0)} flows created when you push`}
        audits={ready} columns={columns}
      />
      <Section
        tone="neutral" icon="fa-solid fa-calendar-check" title="Already covered"
        meta={`${covered.length} course${covered.length === 1 ? '' : 's'} · all flows scheduled by earlier runs — nothing to do`}
        audits={covered} columns={columns}
      />
    </div>
  )
}

function Section({
  tone, icon, title, meta, audits, columns,
}: {
  tone: 'attention' | 'done' | 'neutral'
  icon: string
  title: string
  meta: string
  audits: CourseAudit[]
  columns: ColumnDef<FlowRow>[]
}) {
  const style: React.CSSProperties =
    tone === 'attention'
      ? { background: 'var(--group-band-attention-bg)', color: 'var(--chip-4)' }
      : tone === 'done'
        ? { background: 'var(--group-band-done-bg)', color: 'var(--chip-2)' }
        : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
  const rows = audits.flatMap(a => a.rows)
  const groupLabels = Object.fromEntries(audits.map(a => [a.code, a.bandLabel]))
  const groupOrder = audits.map(a => a.code)
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center gap-2 rounded-lg px-4 py-2.5" style={style}>
        <i className={`${icon} text-sm`} aria-hidden="true" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs font-normal opacity-90">{meta}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm px-1" style={{ color: 'var(--muted-foreground)' }}>Nothing in this section.</p>
      ) : (
        <SectionTable rows={rows} columns={columns} groupLabels={groupLabels} groupOrder={groupOrder} />
      )}
    </div>
  )
}

function SectionTable({
  rows, columns, groupLabels, groupOrder,
}: {
  rows: FlowRow[]
  columns: ColumnDef<FlowRow>[]
  groupLabels: Record<string, string>
  groupOrder: string[]
}) {
  const tableState = useTableState<FlowRow>(
    rows, columns, undefined, { page: 1, pageSize: 200 },
    'courseCode', groupLabels, groupOrder,
  )
  return (
    <DataTable<FlowRow>
      data={rows}
      columns={columns}
      state={tableState}
      getRowId={r => r.id}
      emptyState="No flows in this section."
      stickyHeader={false}
      searchable={false}
      getRowClassName={r => (!r.status && (r.missingRole || r.noStudents)) ? 'dt-row-blocked' : undefined}
    />
  )
}
