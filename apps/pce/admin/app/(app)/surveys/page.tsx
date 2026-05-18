'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Tooltip, TooltipTrigger, TooltipContent,
  SidebarTrigger, Separator, Avatar, AvatarFallback,
  LocalBanner,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseGauge } from '@/components/pce/response-gauge'
import { CreateSurveySheet, CloseSurveyDialog } from '@/components/pce/pce-modals'
import { MOCK_TERMS } from '@/lib/pce-mock-data'
import type { PceSurvey, SurveyStatus } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import Link from 'next/link'

/* Group order + display labels for the status column. Drives DataTable's
   group-row dividers when defaultGroupBy="status". Aarti's directive: active
   buckets first, closed at the bottom. */
const GROUP_ORDER: SurveyStatus[] = ['pending_review', 'collecting', 'active', 'draft', 'released', 'closed']
const GROUP_LABELS: Record<SurveyStatus, string> = {
  pending_review: 'Needs Action',
  collecting:     'Collecting',
  active:         'Active',
  draft:          'Draft',
  released:       'Shared with Faculty',
  closed:         'Closed',
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
  if (!params.get('pushed')) return null
  return (
    <div style={{ paddingInline: 28, paddingTop: 12 }}>
      <LocalBanner variant="success">
        Survey pushed successfully. It is now collecting responses.
      </LocalBanner>
    </div>
  )
}

export default function SurveysPage() {
  const { surveys } = usePce()
  const [createOpen, setCreateOpen] = useState(false)
  const [closeSurvey, setCloseSurvey] = useState<PceSurvey | null>(null)
  const [termFilter, setTermFilter] = useState('all')

  const filtered = surveys.filter(s => {
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

  const columns: ColumnDef<SurveyRow>[] = [
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
      width: 160,
      cell: (row) => <SurveyStatusBadge status={row.status} />,
    },
    {
      key: 'responseRate',
      label: 'Response rate',
      sortable: true,
      width: 200,
      cell: (row) => (
        <ResponseGauge
          rate={row.survey.responseRate}
          responseCount={row.survey.responseCount}
          enrollmentCount={row.survey.enrollmentCount}
          showBar={row.survey.responseRate > 0}
        />
      ),
    },
    {
      key: 'deadline',
      label: 'Deadline',
      sortable: true,
      width: 140,
      cell: (row) => (
        <span className="text-sm font-medium text-muted-foreground">{row.deadline || '—'}</span>
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

      <Suspense>
        <PushedBanner />
      </Suspense>

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
        <DropdownMenuItem asChild>
          <Link href={`/surveys/${survey.id}`}>
            <i className="fa-light fa-eye" aria-hidden="true" />
            View
          </Link>
        </DropdownMenuItem>
        {survey.status === 'collecting' && (
          <DropdownMenuItem>
            <i className="fa-light fa-bell" aria-hidden="true" />
            Send Reminder
          </DropdownMenuItem>
        )}
        {survey.status === 'collecting' && (
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

function EmptySurveys({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i className="fa-light fa-paper-plane text-muted-foreground" aria-hidden="true" style={{ fontSize: 40 }} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {hasFilters ? 'No surveys match these filters' : 'No surveys yet'}
        </p>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
          {hasFilters
            ? 'Try adjusting your filters.'
            : 'Create a survey from a template to start collecting responses.'}
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
