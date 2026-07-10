'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Button, Badge,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'
import { ByTermPanel, type NudgeTarget } from '@/components/pce/analytics-panels'
import { MOCK_SURVEYS, MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'

function fmt(ymd: string) {
  const d = new Date(ymd + 'T00:00:00')
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ymd
}

export default function TermProfile() {
  const params  = useParams<{ id: string }>()
  const termId  = params?.id ?? ''

  const term = MOCK_PROGRAM_TERMS.find(t => t.id === termId)
  const [nudgeTarget, setNudgeTarget]           = useState<NudgeTarget | null>(null)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  const termSurveys = useMemo(
    () => term ? MOCK_SURVEYS.filter(s => s.surveyType !== 'programmatic' && s.term === term.name) : [],
    [term],
  )

  if (!term) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2">
        <i className="fa-light fa-calendar-xmark text-muted-foreground" aria-hidden="true" style={{ fontSize: 32 }} />
        <p className="text-sm text-muted-foreground">Term not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/terms">Back to Terms</Link>
        </Button>
      </div>
    )
  }

  // Term lifecycle facts (profile details).
  const enrolledTotal = termSurveys.reduce((s, x) => s + x.enrollmentCount, 0)
  const courseCount   = termSurveys.length
  const facultyCount  = new Set(termSurveys.flatMap(s => s.instructors.map(i => i.id))).size

  return (
    <>
      <SiteHeader breadcrumbs={[{ label: 'Terms', href: '/admin/terms' }]} title={term.name} />

      {/* Term header — profile details */}
      <div className="shrink-0 flex items-center gap-4" style={{ padding: '20px 28px 8px' }}>
        <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 48, height: 48, background: 'var(--brand-tint)' }}>
          <i className="fa-light fa-calendar text-base" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold leading-tight">{term.name}</h1>
          <p className="text-sm text-muted-foreground">
            {term.academicYear} &nbsp;·&nbsp; {fmt(term.startDate)} – {fmt(term.endDate)}
            &nbsp;·&nbsp; {courseCount} course{courseCount !== 1 ? 's' : ''} · {enrolledTotal.toLocaleString()} students · {facultyCount} faculty
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={term.status === 'active' ? 'secondary' : 'outline'} className="capitalize">{term.status}</Badge>
          {term.enabledForEval
            ? <Badge variant="secondary">Enabled for evaluation</Badge>
            : <Badge variant="outline">Not enabled</Badge>}
        </div>
      </div>

      {/* Analytics — same design as Dashboard › By Term, scoped to this term */}
      <div className="flex-1 overflow-auto" style={{ padding: '8px 28px 28px' }}>
        <div className="flex flex-col gap-6 max-w-4xl">
          <ByTermPanel axis="term" value={term.name} onOpenSurvey={setSelectedSurveyId} onNudge={setNudgeTarget} />
        </div>
      </div>

      <EvaluationCardSheet surveyId={selectedSurveyId} onClose={() => setSelectedSurveyId(null)} />

      <AlertDialog open={!!nudgeTarget} onOpenChange={(open) => !open && setNudgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send ad-hoc reminder</AlertDialogTitle>
            <AlertDialogDescription>
              {nudgeTarget && (
                <>
                  Send an immediate reminder to{' '}
                  <strong>{nudgeTarget.nonResponders} non-responder{nudgeTarget.nonResponders !== 1 ? 's' : ''}</strong>{' '}
                  in <strong>{nudgeTarget.courseCode} — {nudgeTarget.courseName}</strong>. This is an out-of-schedule nudge.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Send reminder</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
