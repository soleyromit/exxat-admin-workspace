'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Tooltip, TooltipTrigger, TooltipContent,
  SidebarTrigger, Separator, Avatar, AvatarFallback,
  LocalBanner,
} from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { BulletGauge } from '@/components/pce/bullet-gauge'
import { CreateSurveySheet, CloseSurveyDialog } from '@/components/pce/pce-modals'
import {
  MOCK_TERMS,
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
} from '@/lib/pce-mock-data'
import type { PceSurvey, SurveyStatus } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import Link from 'next/link'

function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* Group order + display labels for the status column. Drives DataTable's
   group-row dividers when defaultGroupBy="status". Aarti's directive: active
   buckets first, closed at the bottom. */
const GROUP_ORDER: SurveyStatus[] = ['draft', 'scheduled', 'collecting', 'active', 'pending_review', 'released', 'closed']
const GROUP_LABELS: Record<SurveyStatus, string> = {
  draft:          'Draft',
  scheduled:      'Scheduled',
  collecting:     'Collecting Responses',
  active:         'Active',
  pending_review: 'Pending Review',
  released:       'Results Released',
  closed:         'Closed',
}

/* Transcript (May 26): status context in its own "Details" column —
   neutral muted text. Empty for draft/closed/collecting (no info needed). */
function StatusContextCell({ survey }: { survey: PceSurvey }) {
  const muted: React.CSSProperties = { color: 'var(--muted-foreground)' }

  if (survey.status === 'scheduled' && survey.openDate) {
    return <span className="text-sm" style={muted}>Opens {formatIsoDate(survey.openDate)}</span>
  }
  if ((survey.status === 'collecting' || survey.status === 'active') && survey.deadline) {
    return <span className="text-sm" style={muted}>Closes {survey.deadline}</span>
  }
  if (survey.status === 'pending_review') {
    return (
      <Link href="/moderation" className="text-sm hover:underline" style={muted} onClick={(e) => e.stopPropagation()}>
        Ready to release →
      </Link>
    )
  }
  if (survey.status === 'released') {
    return (
      <Link href={`/surveys/${survey.id}`} className="text-sm hover:underline" style={muted} onClick={(e) => e.stopPropagation()}>
        Results shared →
      </Link>
    )
  }
  return null
}

/* Row type flattened with sortable scalar fields. Canonical DataTable's
   sortKey indexes TData directly, so any column we want sortable needs a
   real property here. */
interface SurveyRow extends Record<string, unknown> {
  id: string
  survey: PceSurvey
  courseCode: string
  status: SurveyStatus
  primaryInstructorName: string
  primaryInstructorInitials: string
  extraInstructorCount: number
  responseRate: number
  deadline: string
}

function PushedBanner() {
  const params = useSearchParams()
  if (params.get('pushed') !== '1') return null
  return (
    <div style={{ paddingInline: 28, paddingTop: 12 }}>
      <LocalBanner variant="success">
        Survey pushed successfully. It is now collecting responses.
      </LocalBanner>
    </div>
  )
}

export default function SurveysPage() {
  const { surveys, surveyMode } = usePce()
  const [createOpen, setCreateOpen] = useState(false)
  const [closeSurvey, setCloseSurvey] = useState<PceSurvey | null>(null)
  const [termFilter, setTermFilter] = useState('all')

  // Run Evaluation banner: show when active term has offerings but no CE surveys pushed
  const activeTerm = MOCK_PROGRAM_TERMS.find(t => t.status === 'active') ?? null
  const activeTermOfferings = activeTerm
    ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === activeTerm.id)
    : []
  const activeTermSurveys = activeTerm
    ? surveys.filter(s => s.term === activeTerm.name && (!s.surveyType || s.surveyType === 'course_evaluation'))
    : []
  const showRunBanner =
    surveyMode === 'course_evaluation' &&
    activeTerm !== null &&
    activeTermOfferings.length > 0 &&
    activeTermSurveys.length === 0

  // Filter by mode first, then by term
  const modeFiltered = surveys.filter(s =>
    surveyMode === 'course_evaluation'
      ? (!s.surveyType || s.surveyType === 'course_evaluation')
      : s.surveyType === 'programmatic'
  )

  const filtered = modeFiltered.filter(s => {
    if (termFilter !== 'all' && s.term !== termFilter) return false
    return true
  })

  const rows: SurveyRow[] = filtered.map(survey => {
    const primary = survey.instructors.find(i => i.role === 'primary')
    return {
      id: survey.id,
      survey,
      courseCode: survey.courseCode,
      status: survey.status,
      primaryInstructorName: primary?.name ?? '',
      primaryInstructorInitials: primary?.initials ?? '',
      extraInstructorCount: Math.max(0, survey.instructors.length - 1),
      responseRate: survey.responseRate,
      deadline: survey.deadline ?? '',
    }
  })

  const responseRateCell = (row: SurveyRow) => (
    <div className="flex flex-col gap-1" style={{ minWidth: 120 }}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold tabular-nums">{row.survey.responseRate}%</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.survey.responseCount}/{row.survey.enrollmentCount}
        </span>
      </div>
      {row.survey.enrollmentCount > 0 && (
        <BulletGauge
          responseCount={row.survey.responseCount}
          enrollmentCount={row.survey.enrollmentCount}
          width={120}
          height={4}
          ariaLabel={null}
        />
      )}
    </div>
  )

  const columns: ColumnDef<SurveyRow>[] = surveyMode === 'general' ? [
    {
      key: 'courseCode',
      label: 'Survey title',
      sortable: true,
      width: 320,
      cell: (row) => (
        <Link
          href={`/surveys/${row.survey.id}`}
          className="font-medium hover:underline text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {row.survey.courseCode}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 150,
      cell: (row) => <SurveyStatusBadge status={row.status} />,
    },
    {
      key: 'statusContext',
      label: 'Details',
      width: 200,
      cell: (row) => <StatusContextCell survey={row.survey} />,
    },
    {
      key: 'responseRate',
      label: 'Response rate',
      sortable: true,
      width: 180,
      cell: responseRateCell,
    },
    {
      key: 'deadline',
      label: 'Deadline',
      sortable: true,
      width: 140,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.deadline || '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => <RowActions survey={row.survey} onClose={() => setCloseSurvey(row.survey)} />,
    },
  ] : [
    {
      key: 'courseCode',
      label: 'Course',
      sortable: true,
      width: 200,
      cell: (row) => (
        <Link
          href={`/surveys/${row.survey.id}`}
          className="flex flex-col gap-0.5 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm font-semibold">{row.survey.courseCode}</span>
          <span className="text-xs text-muted-foreground">{row.survey.courseName}</span>
        </Link>
      ),
    },
    {
      key: 'primaryInstructorName',
      label: 'Instructor(s)',
      sortable: true,
      width: 200,
      cell: (row) => row.primaryInstructorName ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 w-fit">
              <Avatar className="h-6 w-6">
                <AvatarFallback
                  className="text-xs"
                  style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                >
                  {row.primaryInstructorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate max-w-32">{row.primaryInstructorName}</span>
              {row.extraInstructorCount > 0 && (
                <span className="text-xs text-muted-foreground">+{row.extraInstructorCount}</span>
              )}
            </div>
          </TooltipTrigger>
          {row.extraInstructorCount > 0 && (
            <TooltipContent>
              <div className="flex flex-col gap-0.5">
                {row.survey.instructors.map(i => (
                  <span key={i.id} className="text-xs">{i.name} ({i.role})</span>
                ))}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 150,
      cell: (row) => <SurveyStatusBadge status={row.status} />,
    },
    {
      key: 'statusContext',
      label: 'Details',
      width: 200,
      cell: (row) => <StatusContextCell survey={row.survey} />,
    },
    {
      key: 'responseRate',
      label: 'Response rate',
      sortable: true,
      width: 180,
      cell: responseRateCell,
    },
    {
      key: 'deadline',
      label: 'Deadline',
      sortable: true,
      width: 140,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.deadline || '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => <RowActions survey={row.survey} onClose={() => setCloseSurvey(row.survey)} />,
    },
  ]

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>Surveys</h1>
        <Button variant="default" size="sm" asChild>
          <Link href="/surveys/push">
            <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 12 }} />
            Push survey
          </Link>
        </Button>
      </header>

      {showRunBanner && activeTerm && (
        <div style={{ paddingInline: 28, paddingTop: 12, paddingBottom: 4 }}>
          <div
            className="flex items-center gap-3 rounded-xl border border-border"
            style={{ padding: '14px 18px', background: 'var(--brand-tint)' }}
          >
            {/* Pulsing dot */}
            <div
              className="shrink-0 rounded-full animate-pulse"
              style={{ width: 8, height: 8, background: 'var(--brand-color)' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {activeTerm.name} evaluation cycle is ready to launch
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {activeTermOfferings.length} courses found · all with enrolled students
              </p>
            </div>
            <Button variant="default" size="sm" asChild>
              <Link href="/surveys/run-evaluation">
                Run evaluation
                <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <Suspense>
        <PushedBanner />
      </Suspense>

      {/* ── Term health stats ── Wayyy/Sprig pattern: stats before the list */}
      {filtered.length > 0 && (() => {
        const live = filtered.filter(s => s.status === 'collecting' || s.status === 'active').length
        const needsAction = filtered.filter(s => s.status === 'pending_review').length
        const belowThreshold = filtered.filter(s =>
          (s.status === 'collecting' || s.status === 'active') && s.responseCount < 5
        ).length
        const avgRate = Math.round(
          filtered.filter(s => s.responseCount > 0).reduce((sum, s) => sum + s.responseRate, 0) /
          Math.max(filtered.filter(s => s.responseCount > 0).length, 1)
        )
        const stats = [
          { label: 'Total surveys', value: String(filtered.length), warn: false },
          { label: 'Live now', value: String(live), warn: false },
          { label: 'Needs review', value: String(needsAction), warn: needsAction > 0 },
          { label: 'Below threshold', value: String(belowThreshold), warn: belowThreshold > 0 },
          { label: 'Avg response rate', value: filtered.some(s => s.responseCount > 0) ? `${avgRate}%` : '—', warn: false },
        ]
        return (
          <div
            className="flex items-center border-b border-border shrink-0"
            style={{ paddingInline: 28, paddingBlock: 12, gap: 32 }}
          >
            {stats.map(stat => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span
                  className="text-xl font-semibold tabular-nums"
                  style={{ color: stat.warn ? 'var(--chart-4)' : 'var(--foreground)' }}
                >
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Term filter sits outside the table because it isn't a column. The
          DataTable toolbar (search + filter pills + properties) renders below. */}
      <div className="flex items-center gap-2 py-2 border-b border-border shrink-0 flex-wrap" style={{ paddingInline: 28 }}>
        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by term">
            <SelectValue placeholder="All terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto" style={{ paddingBlock: 16, paddingInline: 0 }}>
        {rows.length === 0 ? (
          <EmptySurveys
            onCreate={() => setCreateOpen(true)}
            hasFilters={termFilter !== 'all'}
            mode={surveyMode}
          />
        ) : (
          <DataTable<SurveyRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            defaultGroupBy="status"
            groupLabels={GROUP_LABELS}
            groupOrder={GROUP_ORDER}
            onRowClick={(row) => {
              window.location.href = `/surveys/${row.survey.id}`
            }}
            toolbarSlot={(state) => (
              <span className="text-xs text-muted-foreground">
                {state.rows.length} survey{state.rows.length !== 1 ? 's' : ''}
                {termFilter !== 'all' && ` · ${termFilter}`}
              </span>
            )}
          />
        )}
      </div>

      <CreateSurveySheet open={createOpen} onOpenChange={setCreateOpen} />
      <CloseSurveyDialog
        open={!!closeSurvey}
        onOpenChange={v => { if (!v) setCloseSurvey(null) }}
        survey={closeSurvey}
      />
    </>
  )
}

function RowActions({ survey, onClose }: { survey: PceSurvey; onClose: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    // modal={false} — see components/data-table/row-actions.tsx note: prevents
    // Radix hideOthers from setting aria-hidden on the sidebar-wrapper while
    // the row-action menu is open (axe aria-hidden-focus). Fixed 2026-05-11.
    <DropdownMenu modal={false} onOpenChange={setMenuOpen} open={menuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Survey actions"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fa-regular fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        {survey.status === 'pending_review' ? (
          <DropdownMenuItem asChild>
            <Link href="/moderation">
              <i className="fa-light fa-shield-check" aria-hidden="true" />
              Review &amp; Release
            </Link>
          </DropdownMenuItem>
        ) : survey.status === 'draft' ? (
          <DropdownMenuItem asChild>
            <Link href={`/surveys/${survey.id}`}>
              <i className="fa-light fa-pen" aria-hidden="true" />
              Edit
            </Link>
          </DropdownMenuItem>
        ) : survey.status === 'released' ? (
          <DropdownMenuItem asChild>
            <Link href={`/surveys/${survey.id}`}>
              <i className="fa-light fa-chart-mixed" aria-hidden="true" />
              View Results
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={`/surveys/${survey.id}`}>
              <i className="fa-light fa-eye" aria-hidden="true" />
              View
            </Link>
          </DropdownMenuItem>
        )}
        {(survey.status === 'collecting' || survey.status === 'active') && (
          <DropdownMenuItem>
            <i className="fa-light fa-bell" aria-hidden="true" />
            Send Reminder
          </DropdownMenuItem>
        )}
        {(survey.status === 'collecting' || survey.status === 'active') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onClose}>
              <i className="fa-light fa-xmark" aria-hidden="true" />
              Close Survey
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmptySurveys({
  onCreate,
  hasFilters,
  mode,
}: {
  onCreate: () => void
  hasFilters: boolean
  mode: 'course_evaluation' | 'general'
}) {
  const isGeneral = mode === 'general'
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i className="fa-light fa-paper-plane text-muted-foreground" aria-hidden="true" style={{ fontSize: 40 }} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {hasFilters ? 'No surveys match these filters' : isGeneral ? 'No general surveys yet' : 'No surveys yet'}
        </p>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
          {hasFilters
            ? 'Try adjusting your filters.'
            : isGeneral
            ? 'Push a general survey to alumni, preceptors, or external reviewers.'
            : 'Create a survey from a template to start collecting responses.'}
        </p>
      </div>
      {!hasFilters && (
        <Button variant="default" size="sm" onClick={onCreate}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          {isGeneral ? 'Create General Survey' : 'Create Survey'}
        </Button>
      )}
    </div>
  )
}
