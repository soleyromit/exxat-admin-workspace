'use client'

import React, { useState } from 'react'
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Tooltip, TooltipTrigger, TooltipContent,
  AvatarInitials,
} from '@exxatdesignux/ui'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePce } from '@/components/pce/pce-state'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import { SURVEY_STATUS_BADGE } from '@/components/pce/pce-badges'
import { BulletGauge } from '@/components/pce/bullet-gauge'
import { CloseSurveyDialog, SendReminderDialog, EditEndDateDialog } from '@/components/pce/pce-modals'
import { ModerationSheet } from '@/components/pce/moderation-sheet'
import { MOCK_TERMS } from '@/lib/pce-mock-data'
import type { PceSurvey, SurveyStatus } from '@/lib/pce-mock-data'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import { EmptyState } from '@/components/empty-state'

function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusContextCell({ survey, onReview }: { survey: PceSurvey; onReview?: () => void }) {
  if (survey.status === 'scheduled' && survey.openDate) {
    return <span className="text-sm text-muted-foreground">Opens {formatIsoDate(survey.openDate)}</span>
  }
  if ((survey.status === 'collecting' || survey.status === 'active') && survey.deadline) {
    return <span className="text-sm text-muted-foreground">Closes {survey.deadline}</span>
  }
  if (survey.status === 'pending_review') {
    return (
      <Button
        variant="link"
        className="h-auto p-0 text-sm font-normal text-left"
        onClick={(e) => { e.stopPropagation(); onReview?.() }}
      >
        Ready to release →
      </Button>
    )
  }
  if (survey.status === 'released') {
    return (
      <Button variant="link" className="h-auto p-0 text-sm font-normal" asChild>
        <Link href={`/surveys/${survey.id}`} onClick={(e) => e.stopPropagation()}>
          Results shared →
        </Link>
      </Button>
    )
  }
  return null
}

export interface SurveyRow extends Record<string, unknown> {
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
  createdBy: string
  completionBand: string
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

// Response-rate buckets — powers the "Completion" filter (live pce-three parity).
const COMPLETION_BANDS = [
  { value: 'below-40', label: 'Below 40%' },
  { value: '40-69',    label: '40–69%' },
  { value: '70-plus',  label: '70% and above' },
] as const

function completionBand(rate: number): string {
  return rate < 40 ? 'below-40' : rate < 70 ? '40-69' : '70-plus'
}

// Statuses where a reminder / close-date change still makes sense.
const REMINDABLE: SurveyStatus[] = ['collecting', 'active']
const EXTENDABLE: SurveyStatus[] = ['collecting', 'active', 'scheduled']

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

/**
 * Canonical surveys / evaluations table — the single source of truth rendered both
 * in the Surveys/Evaluations nav hub (SurveysHub) and merged into the matching
 * Dashboard. Paginated (10/page default) for long lists. Owns its own row-action
 * dialogs (close / moderation / create).
 *
 * `statusFilter` — when provided, only rows with those statuses are shown.
 * Used by SurveysStatusSections to render one table per status section.
 */
export function SurveysTable({
  mode,
  pageSize = 10,
  statusFilter,
  defaultGroupBy,
  groupLabels,
  groupOrder,
}: {
  mode: 'course_evaluation' | 'general'
  pageSize?: number
  /** Pre-filter rows to only these statuses (used by status-section wrappers). */
  statusFilter?: SurveyStatus[]
  /** Group rows by this column key (e.g. "status"). */
  defaultGroupBy?: string | null
  /** Display labels for group dividers keyed by column value. */
  groupLabels?: Record<string, string>
  /** Ordered list of group keys; rows not listed sort to the end. */
  groupOrder?: string[]
}) {
  const { surveys } = usePce()
  const [closeSurvey, setCloseSurvey] = useState<PceSurvey | null>(null)
  const [moderationSurveyId, setModerationSurveyId] = useState<string | null>(null)
  const [remindTarget, setRemindTarget] = useState<PceSurvey[]>([])
  const [extendTarget, setExtendTarget] = useState<PceSurvey[]>([])

  const router = useRouter()
  const isGeneral = mode === 'general'
  const pushHref = isGeneral ? '/surveys/programmatic/push' : '/surveys/push'
  const noun = isGeneral ? 'survey' : 'evaluation'

  const modeFiltered = surveys.filter(s => {
    const matchesMode = isGeneral
      ? s.surveyType === 'programmatic'
      : (!s.surveyType || s.surveyType === 'course_evaluation')
    const matchesStatus = !statusFilter || statusFilter.includes(s.status)
    return matchesMode && matchesStatus
  })

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
      createdBy: survey.createdBy ?? '',
      completionBand: completionBand(survey.responseRate),
    }
  })

  const termFilterOptions = MOCK_TERMS.map(t => ({ value: t, label: t }))
  const termColumn: ColumnDef<SurveyRow> = {
    key: 'term',
    label: 'Term',
    hidden: true,
    filter: { type: 'select', icon: 'fa-calendar', options: termFilterOptions },
  }

  // Hidden filter-only columns — same pattern as termColumn: no cell rendered,
  // but the filter chip is available in the toolbar.
  const completionColumn: ColumnDef<SurveyRow> = {
    key: 'completionBand',
    label: 'Completion',
    hidden: true,
    filter: { type: 'select', icon: 'fa-gauge', options: [...COMPLETION_BANDS] },
  }
  const createdByOptions = [...new Set(rows.map(r => r.createdBy).filter(Boolean))]
    .sort()
    .map(name => ({ value: name, label: name }))
  const createdByColumn: ColumnDef<SurveyRow> = {
    key: 'createdBy',
    label: 'Created by',
    hidden: true,
    filter: { type: 'select', icon: 'fa-user-pen', options: createdByOptions },
  }

  const statusColumn: ColumnDef<SurveyRow> = {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: 220,
    filter: { type: 'select', icon: 'fa-circle-dot', options: STATUS_FILTER_OPTIONS },
    cell: (row) => {
      const s = SURVEY_STATUS_BADGE[row.status as SurveyStatus] ?? SURVEY_STATUS_BADGE.draft
      return <ListHubStatusBadge label={s.label} tint={s.tint} icon={s.icon} />
    },
  }
  const statusContextColumn: ColumnDef<SurveyRow> = {
    key: 'statusContext',
    label: '',
    header: () => <span className="sr-only">Status details</span>,
    width: 200,
    cell: (row) => <StatusContextCell survey={row.survey} onReview={() => setModerationSurveyId(row.survey.id)} />,
  }
  const responseRateColumn: ColumnDef<SurveyRow> = {
    key: 'responseRate',
    label: 'Response rate',
    sortable: true,
    width: 180,
    cell: responseRateCell,
  }
  const deadlineColumn: ColumnDef<SurveyRow> = {
    key: 'deadline',
    label: 'Close date',
    sortable: true,
    width: 140,
    filter: { type: 'text', icon: 'fa-calendar-day' },
    cell: (row) => <span className="text-sm text-muted-foreground">{row.deadline || '—'}</span>,
  }
  const actionsColumn: ColumnDef<SurveyRow> = {
    key: 'actions',
    label: '',
    width: 44,
    cell: (row) => (
      <RowActions
        survey={row.survey}
        onClose={() => setCloseSurvey(row.survey)}
        onReview={() => setModerationSurveyId(row.survey.id)}
        onRemind={() => setRemindTarget([row.survey])}
        onExtend={() => setExtendTarget([row.survey])}
      />
    ),
  }

  // Leading checkbox column — required for `selectable` to render checkboxes + bulk bar.
  const selectCol: ColumnDef<SurveyRow> = { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true }

  const columns: ColumnDef<SurveyRow>[] = isGeneral ? [
    selectCol,
    termColumn,
    completionColumn,
    createdByColumn,
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
    statusColumn,
    statusContextColumn,
    responseRateColumn,
    deadlineColumn,
    actionsColumn,
  ] : [
    selectCol,
    termColumn,
    completionColumn,
    createdByColumn,
    {
      key: 'courseCode',
      label: 'Course',
      sortable: true,
      width: 200,
      // PRD "filter by course": distinct-course picker (was free-text).
      filter: {
        type: 'select',
        icon: 'fa-book',
        options: [...new Map(rows.map(r => [r.courseCode, r.survey.courseName])).entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([code, name]) => ({ value: code, label: `${code} — ${name}` })),
      },
      cell: (row) => (
        <Link
          href={`/surveys/${row.survey.id}`}
          className="flex flex-col gap-0.5 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm font-semibold">{row.survey.courseCode}</span>
          <span className="text-xs text-muted-foreground">
            {row.survey.courseName}
            {row.survey.evalScope ? ` · ${row.survey.evalScope === 'course' ? 'Course evaluation' : 'Instructor evaluation'}` : ''}
          </span>
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
              <AvatarInitials initials={row.primaryInstructorInitials} className="h-6 w-6" decorative />
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
    statusColumn,
    statusContextColumn,
    responseRateColumn,
    deadlineColumn,
    actionsColumn,
  ]

  return (
    <>
      <DataTablePaginated<SurveyRow>
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        searchable
        pagination={{ pageSize }}
        defaultGroupBy={defaultGroupBy}
        groupLabels={groupLabels}
        groupOrder={groupOrder}
        toolbarSlot={(state) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {state.rows.length} {noun}{state.rows.length !== 1 ? 's' : ''}
          </span>
        )}
        bulkActionsSlot={(selected) => {
          const selectedSurveys = rows.filter(r => selected.has(r.id)).map(r => r.survey)
          const remindable = selectedSurveys.filter(s => REMINDABLE.includes(s.status))
          const extendable = selectedSurveys.filter(s => EXTENDABLE.includes(s.status))
          return (
            <>
              {remindable.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setRemindTarget(remindable)}>
                  Send reminders ({remindable.length})
                </Button>
              )}
              {extendable.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setExtendTarget(extendable)}>
                  Edit close dates ({extendable.length})
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => { router.push(`${pushHref}?ids=${[...selected].join(',')}`) }}
              >
                <i className="fa-light fa-paper-plane" aria-hidden="true" />
                Push {selected.size} {noun}{selected.size !== 1 ? 's' : ''}
              </Button>
            </>
          )
        }}
        onRowClick={(row) => { router.push(`/surveys/${row.survey.id}`) }}
        emptyState={
          <div className="px-4 py-6">
            <EmptyState
              icon="fa-paper-plane"
              title={isGeneral ? 'No programmatic surveys yet' : 'No evaluations yet'}
              description={isGeneral ? 'Adjust your filters or push a new survey.' : 'Adjust your filters or create an evaluation.'}
              align="center"
            />
          </div>
        }
      />

      <CloseSurveyDialog
        open={!!closeSurvey}
        onOpenChange={v => { if (!v) setCloseSurvey(null) }}
        survey={closeSurvey}
      />
      <SendReminderDialog
        open={remindTarget.length > 0}
        onOpenChange={v => { if (!v) setRemindTarget([]) }}
        surveys={remindTarget}
      />
      <EditEndDateDialog
        open={extendTarget.length > 0}
        onOpenChange={v => { if (!v) setExtendTarget([]) }}
        surveys={extendTarget}
      />
      {!isGeneral && (
        <ModerationSheet
          surveyId={moderationSurveyId}
          onClose={() => setModerationSurveyId(null)}
        />
      )}
    </>
  )
}

function RowActions({
  survey,
  onClose,
  onReview,
  onRemind,
  onExtend,
}: {
  survey: PceSurvey
  onClose: () => void
  onReview?: () => void
  onRemind: () => void
  onExtend: () => void
}) {
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
          <DropdownMenuItem onSelect={() => { setMenuOpen(false); onReview?.() }}>
            <i className="fa-light fa-shield-check" aria-hidden="true" />
            Review responses
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
        <DropdownMenuItem asChild>
          <Link href={`/surveys/${survey.id}/preview`}>
            <i className="fa-light fa-file-magnifying-glass" aria-hidden="true" />
            Preview Survey
          </Link>
        </DropdownMenuItem>
        {REMINDABLE.includes(survey.status) && (
          <DropdownMenuItem onSelect={() => { setMenuOpen(false); onRemind() }}>
            <i className="fa-light fa-bell" aria-hidden="true" />
            Send Reminder
          </DropdownMenuItem>
        )}
        {EXTENDABLE.includes(survey.status) && (
          <DropdownMenuItem onSelect={() => { setMenuOpen(false); onExtend() }}>
            <i className="fa-light fa-calendar-pen" aria-hidden="true" />
            Edit End Date
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
