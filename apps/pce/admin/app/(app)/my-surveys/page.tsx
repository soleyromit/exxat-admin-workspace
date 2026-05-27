'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Button,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  SidebarTrigger, Separator, Skeleton,
} from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { BulletGauge } from '@/components/pce/bullet-gauge'
import { MOCK_TERMS } from '@/lib/pce-mock-data'
import type { PceSurvey, SurveyStatus } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import Link from 'next/link'

const FACULTY_ID = 'f1'

/* Group buckets for faculty's own surveys. Aarti's 2026-05-08 directive: active
   bubbles up, results next, past surveys at the bottom. We collapse open/active
   into 'collecting' for grouping purposes. */
const GROUP_ORDER: SurveyStatus[] = ['collecting', 'active', 'released', 'closed', 'pending_review', 'draft']
const GROUP_LABELS: Record<SurveyStatus, string> = {
  pending_review: 'Pending review',
  collecting:     'Collecting',
  active:         'Active',
  scheduled:      'Scheduled',
  draft:          'Draft',
  released:       'Results',
  closed:         'Past surveys',
}

interface MySurveyRow extends Record<string, unknown> {
  id: string
  survey: PceSurvey
  courseCode: string
  status: SurveyStatus
  responseRate: number
  deadline: string
}

export default function MySurveysPage() {
  return (
    <Suspense fallback={<MySurveysSkeleton />}>
      <MySurveysContent />
    </Suspense>
  )
}

function MySurveysContent() {
  const { surveys } = usePce()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')
  const [term, setTerm] = useState('Spring 2026')

  const mySurveys = surveys.filter(s =>
    s.instructors.some(i => i.id === FACULTY_ID) && s.term === term
  )

  // ?filter=released narrows to released/closed; otherwise show all assigned.
  const displayed = filterParam === 'released'
    ? mySurveys.filter(s => s.status === 'released' || s.status === 'closed')
    : mySurveys

  const rows: MySurveyRow[] = displayed.map(s => ({
    id: s.id,
    survey: s,
    courseCode: s.courseCode,
    status: s.status,
    responseRate: s.responseRate,
    deadline: s.deadline ?? '',
  }))

  const columns: ColumnDef<MySurveyRow>[] = [
    {
      key: 'courseCode',
      label: 'Course',
      sortable: true,
      width: 240,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{row.survey.courseCode}</span>
          <span className="text-xs text-muted-foreground">{row.survey.courseName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 160,
      cell: (row) => <SurveyStatusBadge status={row.survey.status} />,
    },
    {
      key: 'responseRate',
      label: 'Response rate',
      sortable: true,
      width: 200,
      cell: (row) => (
        <BulletGauge
          responseCount={row.survey.responseCount}
          enrollmentCount={row.survey.enrollmentCount}
          width={120}
          height={4}
          ariaLabel={null}
        />
      ),
    },
    {
      key: 'deadline',
      label: 'Deadline',
      sortable: true,
      width: 140,
      cell: (row) => (
        <span className="text-sm font-medium text-muted-foreground">{row.survey.deadline || '—'}</span>
      ),
    },
    {
      key: 'results',
      label: 'Results',
      width: 160,
      cell: (row) => {
        const isReleased = row.survey.status === 'released' || row.survey.status === 'closed'
        return isReleased ? (
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/my-surveys/${row.survey.id}/results`}
              onClick={(e) => e.stopPropagation()}
            >
              View Results
              <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 11 }} />
            </Link>
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <i className="fa-light fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 12 }} />
            Pending review
          </div>
        )
      },
    },
  ]

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
          {filterParam === 'released' ? 'Results' : 'My Surveys'}
        </h1>
        <Select value={term} onValueChange={setTerm}>
          <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by term">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      <div className="flex-1 overflow-auto" style={{ paddingBlock: 16, paddingInline: 0 }}>
        {rows.length === 0 ? (
          <EmptyFaculty filterParam={filterParam} term={term} />
        ) : (
          <DataTable<MySurveyRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            searchable
            defaultGroupBy="status"
            groupLabels={GROUP_LABELS}
            groupOrder={GROUP_ORDER}
            onRowClick={(row) => {
              const isReleased = row.survey.status === 'released' || row.survey.status === 'closed'
              if (isReleased) {
                window.location.href = `/my-surveys/${row.survey.id}/results`
              }
            }}
            toolbarSlot={(state) => (
              <span className="text-xs text-muted-foreground">
                {state.rows.length} survey{state.rows.length !== 1 ? 's' : ''}
              </span>
            )}
          />
        )}
      </div>
    </>
  )
}

function MySurveysSkeleton() {
  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-4 w-24" />
      </header>
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </div>
    </>
  )
}

function EmptyFaculty({ filterParam, term }: { filterParam: string | null; term: string }) {
  if (filterParam === 'released') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <i className="fa-light fa-chart-bar text-muted-foreground" aria-hidden="true" style={{ fontSize: 40 }} />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">No results available for {term}</p>
          <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
            Results will appear here once your surveys are released by the program administrator.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i className="fa-light fa-paper-plane text-muted-foreground" aria-hidden="true" style={{ fontSize: 40 }} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">No surveys assigned to you for {term}</p>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 360 }}>
          Contact your program administrator if you expected to see surveys here.
        </p>
      </div>
    </div>
  )
}
