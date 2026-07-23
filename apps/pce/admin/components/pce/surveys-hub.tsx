'use client'

// ============================================================================
// Evaluations hub — CE mode renders status sections (Pending Review → Results
// Available → Live → Scheduled) matching live pce-three IA (§12 supplemental
// audit Jun 29 2026). General mode keeps the flat SurveysTable.
// ============================================================================

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  PageHeader,
  LocalBanner,
  KeyMetrics,
  type MetricItem,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { CreateSurveySheet } from '@/components/pce/pce-modals'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
} from '@/lib/pce-mock-data'
import type { PceSurvey, SurveyStatus } from '@/lib/pce-mock-data'
import { SurveysTable } from '@/components/pce/surveys-table'
import { EmptyState as HubEmptyState } from '@/components/empty-state'

const VALID_STATUSES: SurveyStatus[] = ['draft', 'active', 'collecting', 'scheduled', 'pending_review', 'released', 'closed']

/** ?status=collecting,active → pre-filter for the table (dashboard ring deep-links). */
function statusFilterFromParam(param: string | null): SurveyStatus[] | undefined {
  if (!param) return undefined
  const parsed = param.split(',').filter((s): s is SurveyStatus => VALID_STATUSES.includes(s as SurveyStatus))
  return parsed.length > 0 ? parsed : undefined
}

function PushedBanner() {
  const params = useSearchParams()
  if (params?.get('pushed') !== '1') return null
  return (
    <div className="px-7 pt-3">
      <LocalBanner variant="success">
        Survey pushed successfully. It is now collecting responses.
      </LocalBanner>
    </div>
  )
}

// Group labels + urgency order for the single grouped DataTable (CE mode).
// Keys are SurveyStatus values; DataTable renders a sticky divider per group.
const CE_GROUP_LABELS: Record<string, string> = {
  pending_review: 'Closed · Pending Review',
  released:       'Results Available',
  closed:         'Results Available',
  collecting:     'Live',
  active:         'Live',
  scheduled:      'Scheduled',
  draft:          'Draft',
}

// Urgency order: items needing action surface first.
const CE_GROUP_ORDER = ['pending_review', 'released', 'closed', 'collecting', 'active', 'scheduled', 'draft']

export function SurveysHub({ mode }: { mode: 'course_evaluation' | 'general' }) {
  const { surveys } = usePce()
  const [createOpen, setCreateOpen] = useState(false)
  const searchParams = useSearchParams()
  const statusFilter = statusFilterFromParam(searchParams?.get('status') ?? null)

  const isGeneral = mode === 'general'
  const title = isGeneral ? 'Surveys' : 'Evaluations'

  const activeTerm = MOCK_PROGRAM_TERMS.find((t) => t.status === 'active') ?? null
  const activeTermOfferings = activeTerm
    ? MOCK_COURSE_OFFERINGS.filter((o) => o.termId === activeTerm.id)
    : []
  const activeTermSurveys = activeTerm
    ? surveys.filter(
        (s) =>
          s.term === activeTerm.name &&
          (!s.surveyType || s.surveyType === 'course_evaluation'),
      )
    : []
  const showRunBanner =
    !isGeneral &&
    activeTerm !== null &&
    activeTermOfferings.length > 0 &&
    activeTermSurveys.length === 0

  const modeFiltered = surveys.filter((s) =>
    isGeneral
      ? s.surveyType === 'programmatic'
      : !s.surveyType || s.surveyType === 'course_evaluation',
  )

  // CE KPI bar: 3 metrics matching live (Active / Pending Review / Released).
  // General keeps the original 4-metric bar.
  const ceMetrics: MetricItem[] = (() => {
    const active       = modeFiltered.filter((s) => s.status === 'collecting' || s.status === 'active').length
    const pendingReview = modeFiltered.filter((s) => s.status === 'pending_review').length
    const released     = modeFiltered.filter((s) => s.status === 'released').length
    return [
      { id: 'active',  label: 'Active surveys',  value: active,        description: 'Currently open',             delta: '', trend: 'neutral' },
      { id: 'review',  label: 'Pending review',  value: pendingReview, description: 'Awaiting your review & release', delta: pendingReview > 0 ? String(pendingReview) : '', trend: pendingReview > 0 ? 'up' : 'neutral', trendPolarity: 'lower_is_better' },
      { id: 'released',label: 'Released',         value: released,      description: 'Faculty can view',           delta: '', trend: 'neutral' },
    ]
  })()

  const generalMetrics: MetricItem[] = (() => {
    const total        = modeFiltered.length
    const live         = modeFiltered.filter((s) => s.status === 'collecting' || s.status === 'active').length
    const needsAction  = modeFiltered.filter((s) => s.status === 'pending_review').length
    const withResponses = modeFiltered.filter((s) => s.responseCount > 0)
    const avgRate = withResponses.length > 0
      ? Math.round(withResponses.reduce((sum, s) => sum + s.responseRate, 0) / withResponses.length)
      : null
    return [
      { id: 'total',  label: 'Total surveys',   value: total,       delta: '', trend: 'neutral' },
      { id: 'live',   label: 'Live now',         value: live,        delta: '', trend: 'neutral' },
      { id: 'review', label: 'Needs review',     value: needsAction, delta: needsAction > 0 ? String(needsAction) : '', trend: needsAction > 0 ? 'up' : 'neutral', trendPolarity: 'lower_is_better' },
      { id: 'rate',   label: 'Avg response',     value: avgRate != null ? `${avgRate}%` : '—', delta: '', trend: 'neutral' },
    ]
  })()

  const metrics = isGeneral ? generalMetrics : ceMetrics
  const surveyCount = modeFiltered.length
  const subtitle = isGeneral
    ? `${surveyCount} ${surveyCount === 1 ? 'survey' : 'surveys'}`
    : `${surveyCount} ${surveyCount === 1 ? 'evaluation' : 'evaluations'}`

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader title={title} />
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2" role="group" aria-label="Survey actions">
            {isGeneral && (
              <Button size="lg" asChild>
                <Link href="/surveys/programmatic/push">
                  <i className="fa-light fa-paper-plane" aria-hidden="true" />
                  Send surveys
                </Link>
              </Button>
            )}
            {!isGeneral && (
              <Button size="lg" asChild>
                <Link href="/surveys/push">Set Up Surveys</Link>
              </Button>
            )}
          </div>
        }
      />

      {showRunBanner && activeTerm && (
        <div className="px-7 pt-3 pb-1">
          <LocalBanner
            variant="info"
            title={`${activeTerm.name} evaluation cycle is ready to launch`}
            action={{ label: 'Run evaluation', href: '/surveys/push' }}
          >
            {activeTermOfferings.length} courses found · all with enrolled students
          </LocalBanner>
        </div>
      )}

      <Suspense>
        <PushedBanner />
      </Suspense>

      {modeFiltered.length > 0 && (
        <div className="shrink-0 px-7 py-1">
          <KeyMetrics variant="flat" showHeader={false} metricsSingleRow metrics={metrics} title={isGeneral ? 'Surveys overview' : 'Evaluations overview'} />
        </div>
      )}

      <div className="flex-1 overflow-auto py-4">
        {modeFiltered.length === 0 ? (
          <EmptySurveys onCreate={() => setCreateOpen(true)} isGeneral={isGeneral} />
        ) : isGeneral ? (
          <SurveysTable mode="general" pageSize={25} statusFilter={statusFilter} />
        ) : (
          <SurveysTable
            mode="course_evaluation"
            pageSize={50}
            statusFilter={statusFilter}
            defaultGroupBy="status"
            groupLabels={CE_GROUP_LABELS}
            groupOrder={CE_GROUP_ORDER}
          />
        )}
      </div>

      <CreateSurveySheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

function EmptySurveys({
  onCreate,
  isGeneral,
}: {
  onCreate: () => void
  isGeneral: boolean
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <HubEmptyState
        align="center"
        icon="fa-paper-plane"
        title={isGeneral ? 'No programmatic surveys yet' : 'No evaluations yet'}
        description={
          isGeneral
            ? 'Push a programmatic survey to alumni, preceptors, or external reviewers.'
            : 'Create an evaluation from a template to start collecting responses.'
        }
        footer={
          <Button variant="default" size="sm" onClick={onCreate}>
            <i className="fa-light fa-plus text-xs" aria-hidden="true" />
            Create Survey
          </Button>
        }
      />
    </div>
  )
}
