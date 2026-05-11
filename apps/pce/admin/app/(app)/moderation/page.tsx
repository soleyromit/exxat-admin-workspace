'use client'

import { useState } from 'react'
import {
  Button, Avatar, AvatarFallback, SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { ResponseGauge } from '@/components/pce/response-gauge'
import { ReleaseSheet, ReleaseBulkDialog } from '@/components/pce/pce-modals'
import type { PceSurvey } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'

/* Flat row type — moderation queue is a single status bucket (pending_review)
   so no defaultGroupBy. Sortable scalars surfaced as properties. */
interface ModerationRow extends Record<string, unknown> {
  id: string
  survey: PceSurvey
  courseCode: string
  term: string
  deadline: string
  responseRate: number
  instructorCount: number
}

export default function ModerationPage() {
  const { surveys, releaseSurvey } = usePce()
  const [surveyToRelease, setSurveyToRelease] = useState<PceSurvey | null>(null)
  const [bulkIds, setBulkIds] = useState<string[]>([])

  const pending = surveys.filter(s => s.status === 'pending_review')

  const rows: ModerationRow[] = pending.map(s => ({
    id: s.id,
    survey: s,
    courseCode: s.courseCode,
    term: s.term,
    deadline: s.deadline ?? '',
    responseRate: s.responseRate,
    instructorCount: s.instructors.length,
  }))

  const handleBulkRelease = () => {
    bulkIds.forEach(id => releaseSurvey(id))
    setBulkIds([])
  }

  const columns: ColumnDef<ModerationRow>[] = [
    {
      key: 'courseCode',
      label: 'Course',
      sortable: true,
      width: 200,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{row.survey.courseCode}</span>
          <span className="text-xs text-muted-foreground">{row.survey.term}</span>
        </div>
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
      key: 'responseRate',
      label: 'Responses',
      sortable: true,
      width: 200,
      cell: (row) => (
        <ResponseGauge
          rate={row.survey.responseRate}
          responseCount={row.survey.responseCount}
          enrollmentCount={row.survey.enrollmentCount}
          showBar={false}
        />
      ),
    },
    {
      key: 'instructorCount',
      label: 'Instructors',
      sortable: true,
      width: 140,
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.survey.instructors.slice(0, 2).map(i => (
            <Avatar key={i.id} className="h-6 w-6">
              <AvatarFallback
                className="text-xs"
                style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
              >
                {i.initials}
              </AvatarFallback>
            </Avatar>
          ))}
          {row.survey.instructors.length > 2 && (
            <span className="text-xs ml-1 text-muted-foreground">
              +{row.survey.instructors.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 160,
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            setSurveyToRelease(row.survey)
          }}
        >
          Review &amp; Release
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>Review &amp; Moderation</h1>
      </header>

      {pending.length > 0 && (
        <div className="py-2 border-b border-border shrink-0" style={{ paddingInline: 28 }}>
          <p className="text-sm text-muted-foreground">
            {pending.length} {pending.length === 1 ? 'survey' : 'surveys'} pending review
          </p>
        </div>
      )}

      <div className="flex-1 overflow-auto" style={{ paddingBlock: 16, paddingInline: 0 }}>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
            <i
              className="fa-light fa-shield-check"
              aria-hidden="true"
              style={{ fontSize: 48, color: 'var(--brand-color)' }}
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">All caught up</p>
              <p className="text-sm text-muted-foreground" style={{ maxWidth: 360 }}>
                No surveys are waiting for review. When a survey closes, it will appear here
                before faculty can see results.
              </p>
            </div>
          </div>
        ) : (
          <DataTable<ModerationRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            defaultSort={{ key: 'deadline', dir: 'asc' }}
            onRowClick={(row) => setSurveyToRelease(row.survey)}
            bulkActionsSlot={(selectedSet) => (
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  setBulkIds(Array.from(selectedSet).map(String))
                }}
              >
                <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 12 }} />
                Release {selectedSet.size} selected
              </Button>
            )}
          />
        )}
      </div>

      <ReleaseSheet
        open={!!surveyToRelease}
        onOpenChange={v => { if (!v) setSurveyToRelease(null) }}
        survey={surveyToRelease}
      />
      <ReleaseBulkDialog
        open={bulkIds.length > 0}
        onOpenChange={v => { if (!v) setBulkIds([]) }}
        surveyIds={bulkIds}
        onConfirm={handleBulkRelease}
      />
    </div>
  )
}
