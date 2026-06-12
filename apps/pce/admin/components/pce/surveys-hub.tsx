'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Button,
  PageHeader,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Tooltip, TooltipTrigger, TooltipContent,
  Avatar, AvatarFallback,
  LocalBanner,
  KeyMetrics,
  type MetricItem,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_INFO,
  LIST_HUB_STATUS_TINT_PLANNED,
  LIST_HUB_STATUS_TINT_COMPLETED,
  LIST_HUB_STATUS_TINT_NEUTRAL,
  type StatusTint,
} from '@/lib/list-status-badges'
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

const SURVEY_STATUS_BADGE: Record<SurveyStatus, { tint: StatusTint; icon: string; label: string }> = {
  draft:          { tint: LIST_HUB_STATUS_TINT_WARNING,   icon: 'fa-pen-ruler',          label: 'Draft'          },
  scheduled:      { tint: LIST_HUB_STATUS_TINT_PLANNED,   icon: 'fa-calendar',           label: 'Scheduled'      },
  active:         { tint: LIST_HUB_STATUS_TINT_SUCCESS,   icon: 'fa-circle-check',       label: 'Active'         },
  collecting:     { tint: LIST_HUB_STATUS_TINT_INFO,      icon: 'fa-circle-dot',         label: 'Collecting'     },
  pending_review: { tint: LIST_HUB_STATUS_TINT_WARNING,   icon: 'fa-hourglass-half',     label: 'Pending Review' },
  released:       { tint: LIST_HUB_STATUS_TINT_COMPLETED, icon: 'fa-flag-checkered',     label: 'Released'       },
  closed:         { tint: LIST_HUB_STATUS_TINT_NEUTRAL,   icon: 'fa-box-archive',        label: 'Closed'         },
}

interface SurveyRow extends Record<string, unknown> {
  id: string
  survey: PceSurvey
  courseCode: string
  status: SurveyStatus
  term: string
  primaryInstructorName: string
  primaryInstructorInitials: string
  extraInstructorCount: number
  responseRate: number
  deadline: string
}

const STATUS_FILTER_OPTIONS = [
  { value: 'draft',          label: 'Draft' },
  { value: 'scheduled',      label: 'Scheduled' },
  { value: 'collecting',     label: 'Collecting Responses' },
  { value: 'active',         label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'released',       label: 'Results Released' },
  { value: 'closed',         label: 'Closed' },
]

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

export function SurveysHub({ mode }: { mode: 'course_evaluation' | 'general' }) {
  const { surveys } = usePce()
  const [createOpen, setCreateOpen] = useState(false)
  const [closeSurvey, setCloseSurvey] = useState<PceSurvey | null>(null)

  const isGeneral = mode === 'general'
  const title = isGeneral ? 'Surveys' : 'Evaluations'
  const pushHref = isGeneral ? '/surveys/programmatic/push' : '/surveys/push'
  const pushLabel = isGeneral ? 'Push surveys' : 'Push Evaluations'

  const activeTerm = MOCK_PROGRAM_TERMS.find(t => t.status === 'active') ?? null
  const activeTermOfferings = activeTerm
    ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === activeTerm.id)
    : []
  const activeTermSurveys = activeTerm
    ? surveys.filter(s => s.term === activeTerm.name && (!s.surveyType || s.surveyType === 'course_evaluation'))
    : []
  const showRunBanner =
    !isGeneral &&
    activeTerm !== null &&
    activeTermOfferings.length > 0 &&
    activeTermSurveys.length === 0

  const modeFiltered = surveys.filter(s =>
    isGeneral
      ? s.surveyType === 'programmatic'
      : (!s.surveyType || s.surveyType === 'course_evaluation')
  )

  const rows: SurveyRow[] = modeFiltered.map(survey => {
    const primary = survey.instructors.find(i => i.role === 'primary')
    return {
      id: survey.id,
      survey,
      courseCode: survey.courseCode,
      status: survey.status,
      term: survey.term ?? '',
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

  const termFilterOptions = MOCK_TERMS.map(t => ({ value: t, label: t }))
  const termColumn: ColumnDef<SurveyRow> = {
    key: 'term',
    label: 'Term',
    hidden: true,
    filter: { type: 'select', icon: 'fa-calendar', options: termFilterOptions },
  }

  const columns: ColumnDef<SurveyRow>[] = isGeneral ? [
    termColumn,
    {
      key: 'courseCode',
      label: 'Survey title',
      sortable: true,
      width: 320,
      filter: { type: 'text', icon: 'fa-paper-plane' },
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
      filter: { type: 'select', icon: 'fa-circle-dot', options: STATUS_FILTER_OPTIONS },
      cell: (row) => {
        const s = SURVEY_STATUS_BADGE[row.status as SurveyStatus] ?? SURVEY_STATUS_BADGE.draft
        return <ListHubStatusBadge label={s.label} tint={s.tint} icon={s.icon} />
      },
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
      filter: { type: 'text', icon: 'fa-calendar-day' },
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
    termColumn,
    {
      key: 'courseCode',
      label: 'Course',
      sortable: true,
      width: 200,
      filter: { type: 'text', icon: 'fa-book' },
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
      filter: { type: 'text', icon: 'fa-user-tie' },
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
      filter: { type: 'select', icon: 'fa-circle-dot', options: STATUS_FILTER_OPTIONS },
      cell: (row) => {
        const s = SURVEY_STATUS_BADGE[row.status as SurveyStatus] ?? SURVEY_STATUS_BADGE.draft
        return <ListHubStatusBadge label={s.label} tint={s.tint} icon={s.icon} />
      },
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
      filter: { type: 'text', icon: 'fa-calendar-day' },
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

  const surveyCount = modeFiltered.length
  const subtitle = isGeneral
    ? `${surveyCount} ${surveyCount === 1 ? 'survey' : 'surveys'}`
    : `${surveyCount} ${surveyCount === 1 ? 'evaluation' : 'evaluations'}`

  return (
    // overflow-hidden safe — floating uses Radix Portal
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader title={title} />
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2" role="group" aria-label="Survey actions">
            <Button size="lg" asChild>
              <Link href={pushHref}>
                <i className="fa-light fa-paper-plane" aria-hidden="true" />
                {pushLabel}
              </Link>
            </Button>
          </div>
        }
      />

      {showRunBanner && activeTerm && (
        <div style={{ paddingInline: 28, paddingTop: 12, paddingBottom: 4 }}>
          <div
            className="flex items-center gap-3 rounded-xl border border-border"
            style={{ padding: '14px 18px', background: 'var(--brand-tint)' }}
          >
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

      {modeFiltered.length > 0 && (() => {
        const live = modeFiltered.filter(s => s.status === 'collecting' || s.status === 'active').length
        const needsAction = modeFiltered.filter(s => s.status === 'pending_review').length
        const belowThreshold = modeFiltered.filter(s =>
          (s.status === 'collecting' || s.status === 'active') && s.responseCount < 5
        ).length
        const withResponses = modeFiltered.filter(s => s.responseCount > 0)
        const avgRate = withResponses.length > 0
          ? Math.round(withResponses.reduce((sum, s) => sum + s.responseRate, 0) / withResponses.length)
          : null
        const metrics: MetricItem[] = [
          { id: 'total',     label: isGeneral ? 'Total surveys' : 'Total evaluations', value: modeFiltered.length, delta: '', trend: 'neutral' },
          { id: 'live',      label: 'Live now',         value: live,               delta: '', trend: 'neutral' },
          { id: 'review',    label: 'Needs review',     value: needsAction,        delta: needsAction > 0 ? String(needsAction) : '', trend: needsAction > 0 ? 'up' : 'neutral', trendPolarity: 'lower_is_better' },
          { id: 'threshold', label: 'Below threshold',  value: belowThreshold,     delta: '', trend: 'neutral' },
          { id: 'rate',      label: 'Avg response rate', value: avgRate !== null ? `${avgRate}%` : '—', delta: '', trend: 'neutral' },
        ]
        return (
          <div className="shrink-0 [&_*]:!border-e-0" style={{ paddingInline: 28, paddingBlock: 4 }}>
            <KeyMetrics variant="flat" showHeader={false} metricsSingleRow metrics={metrics} />
          </div>
        )
      })()}

      <div className="flex-1 overflow-auto" style={{ paddingBlock: 16, paddingInline: 0 }}>
        {rows.length === 0 ? (
          <EmptySurveys
            onCreate={() => setCreateOpen(true)}
            hasFilters={false}
            isGeneral={isGeneral}
          />
        ) : (
          <DataTable<SurveyRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            onRowClick={(row) => {
              window.location.href = `/surveys/${row.survey.id}`
            }}
          />
        )}
      </div>

      <CreateSurveySheet open={createOpen} onOpenChange={setCreateOpen} />
      <CloseSurveyDialog
        open={!!closeSurvey}
        onOpenChange={v => { if (!v) setCloseSurvey(null) }}
        survey={closeSurvey}
      />
    </div>
  )
}

function RowActions({ survey, onClose }: { survey: PceSurvey; onClose: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
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
  isGeneral,
}: {
  onCreate: () => void
  hasFilters: boolean
  isGeneral: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i className="fa-light fa-paper-plane text-muted-foreground" aria-hidden="true" style={{ fontSize: 40 }} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {hasFilters ? (isGeneral ? 'No surveys match these filters' : 'No evaluations match these filters') : isGeneral ? 'No programmatic surveys yet' : 'No evaluations yet'}
        </p>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
          {hasFilters
            ? 'Try adjusting your filters.'
            : isGeneral
            ? 'Push a programmatic survey to alumni, preceptors, or external reviewers.'
            : 'Create an evaluation from a template to start collecting responses.'}
        </p>
      </div>
      {!hasFilters && (
        <Button variant="default" size="sm" onClick={onCreate}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create Survey
        </Button>
      )}
    </div>
  )
}
