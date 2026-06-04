'use client'

/**
 * ACTION ITEMS PANEL — workflow narrative on the Courses landing.
 *
 * Aarti's vision is workflow-driven: faculty logs in, sees what needs them
 * today, and walks the loop (review → publish → monitor → curve → intervene).
 * This panel is the "front door" that makes the workflow visible.
 *
 * Each item is computed live from the faculty's data: pending chair reviews,
 * untested objectives, at-risk students, in-progress assessments, etc. Each
 * routes to the surface where the action happens — so the demo is a guided
 * tour, not a feature-by-feature click-through.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@exxat/ds/packages/ui/src'
import { mockCourses, mockAssessments } from '@/lib/qb-mock-data'
import {
  facultyStudents, facultyAccommodations, courseObjectives,
  facultyExtraAssessments,
} from '@/lib/faculty-mock-data'
import type { FacultyUser } from '@/lib/faculty-session'
import { useAssessmentReviews } from '@/lib/assessment-review-store'

const ALL_ASSESSMENTS = [...mockAssessments, ...facultyExtraAssessments]

export interface ActionItemsPanelProps {
  faculty: FacultyUser
}

interface ActionItem {
  id: string
  icon: string
  iconTone: 'brand' | 'info' | 'warning' | 'success' | 'destructive'
  title: string
  detail: string
  count: number
  href: string
  hrefLabel: string
}

export function ActionItemsPanel({ faculty }: ActionItemsPanelProps) {
  const router = useRouter()
  const { reviewByAssessment } = useAssessmentReviews()

  const items = useMemo<ActionItem[]>(() => {
    const courseIds = faculty.courses.map(c => c.courseId)

    // Pending chair review (for editor-access courses only — viewer can't act)
    const editorIds = faculty.courses.filter(c => c.level === 'editor').map(c => c.courseId)
    const pendingChair = ALL_ASSESSMENTS.filter(a =>
      editorIds.includes(a.courseId) &&
      reviewByAssessment.get(a.id)?.state === 'pending-chair'
    )

    // Changes-requested — chair sent back for revision
    const changesRequested = ALL_ASSESSMENTS.filter(a =>
      editorIds.includes(a.courseId) &&
      reviewByAssessment.get(a.id)?.state === 'changes-requested'
    )

    // Approved — ready to publish (faculty action needed)
    const approvedAwaiting = ALL_ASSESSMENTS.filter(a =>
      editorIds.includes(a.courseId) &&
      reviewByAssessment.get(a.id)?.state === 'approved'
    )

    // In-progress assessments — students taking right now (live monitor)
    const inProgress = ALL_ASSESSMENTS.filter(a =>
      courseIds.includes(a.courseId) &&
      reviewByAssessment.get(a.id)?.state === 'in-progress'
    )

    // Submitted — results pending faculty review/curving
    const submittedPending = ALL_ASSESSMENTS.filter(a =>
      courseIds.includes(a.courseId) &&
      reviewByAssessment.get(a.id)?.state === 'submitted'
    )

    // Untested objectives — across faculty's editor courses (curriculum gap)
    const untestedObjs = courseObjectives.filter(o =>
      editorIds.includes(o.courseId) && !o.lastAssessed
    )

    // At-risk students — bottom 20% across faculty's courses
    const atRisk = facultyStudents.filter(s =>
      s.status === 'at-risk' && s.enrolledCourseIds.some(id => courseIds.includes(id))
    )

    const out: ActionItem[] = []

    if (changesRequested.length > 0) {
      const a = changesRequested[0]
      out.push({
        id: 'changes-requested',
        icon: 'fa-arrows-rotate',
        iconTone: 'destructive',
        title: `${changesRequested.length} ${changesRequested.length === 1 ? 'assessment needs' : 'assessments need'} revision`,
        detail: `Chair returned ${changesRequested.length === 1 ? a.title : 'multiple drafts'} with notes — address and resubmit.`,
        count: changesRequested.length,
        href: changesRequested.length === 1
          ? `/assessments/${a.id}/review`
          : `/courses/${a.courseId}?tab=assessments`,
        hrefLabel: 'Review notes',
      })
    }

    if (approvedAwaiting.length > 0) {
      const a = approvedAwaiting[0]
      out.push({
        id: 'approved-awaiting',
        icon: 'fa-bullhorn',
        iconTone: 'success',
        title: `${approvedAwaiting.length} ${approvedAwaiting.length === 1 ? 'assessment is' : 'assessments are'} ready to publish`,
        detail: `Chair-approved · awaiting your publish action.`,
        count: approvedAwaiting.length,
        href: approvedAwaiting.length === 1
          ? `/assessments/${a.id}`
          : `/courses/${a.courseId}?tab=assessments`,
        hrefLabel: 'Schedule & publish',
      })
    }

    if (inProgress.length > 0) {
      const a = inProgress[0]
      out.push({
        id: 'live-now',
        icon: 'fa-circle',
        iconTone: 'info',
        title: `${inProgress.length} ${inProgress.length === 1 ? 'exam is' : 'exams are'} in progress right now`,
        detail: 'Monitor completion in real time — alert all, pause, or extend.',
        count: inProgress.length,
        href: `/assessments/${a.id}/monitor`,
        hrefLabel: 'Open live monitor',
      })
    }

    if (submittedPending.length > 0) {
      const a = submittedPending[0]
      out.push({
        id: 'submitted-pending',
        icon: 'fa-check-double',
        iconTone: 'success',
        title: `${submittedPending.length} ${submittedPending.length === 1 ? 'assessment is' : 'assessments are'} ready to review`,
        detail: 'Run psychometrics, curve if needed, then publish results to students.',
        count: submittedPending.length,
        href: `/assessments/${a.id}/analytics`,
        hrefLabel: 'Review & curve',
      })
    }

    if (atRisk.length > 0) {
      out.push({
        id: 'at-risk',
        icon: 'fa-life-ring',
        iconTone: 'warning',
        title: `${atRisk.length} ${atRisk.length === 1 ? 'student is' : 'students are'} flagged at-risk`,
        detail: 'Bottom 20% by course average — assign practice questions and notify advisors.',
        count: atRisk.length,
        href: `/courses/${editorIds[0] ?? courseIds[0]}?tab=students&filter=at-risk`,
        hrefLabel: 'Plan interventions',
      })
    }

    if (untestedObjs.length > 0) {
      const o = untestedObjs[0]
      out.push({
        id: 'untested',
        icon: 'fa-bullseye-pointer',
        iconTone: 'brand',
        title: `${untestedObjs.length} curriculum ${untestedObjs.length === 1 ? 'objective is' : 'objectives are'} untested`,
        detail: 'Generate question drafts with AI, review, and add to the bank.',
        count: untestedObjs.length,
        href: `/courses/${o.courseId}`,
        hrefLabel: 'Open curricular loop',
      })
    }

    if (pendingChair.length > 0) {
      const a = pendingChair[0]
      out.push({
        id: 'pending-chair',
        icon: 'fa-hourglass-half',
        iconTone: 'warning',
        title: `${pendingChair.length} ${pendingChair.length === 1 ? 'assessment is' : 'assessments are'} awaiting chair review`,
        detail: 'No action needed yet — chair will respond within 3–4 days.',
        count: pendingChair.length,
        href: pendingChair.length === 1
          ? `/assessments/${a.id}/review`
          : `/courses/${a.courseId}?tab=assessments`,
        hrefLabel: 'View status',
      })
    }

    return out
  }, [faculty, reviewByAssessment])

  if (items.length === 0) {
    return null
  }

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Needs your attention</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {items.length} {items.length === 1 ? 'item' : 'items'} pending across your courses
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5">
          Mark all reviewed
          <i className="fa-light fa-check" aria-hidden="true" />
        </Button>
      </header>
      <ul className="divide-y divide-border">
        {items.slice(0, 6).map(item => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors group no-underline"
            >
              <ToneIcon tone={item.iconTone} icon={item.icon} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.detail}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-medium text-muted-foreground hidden md:inline">
                  {item.hrefLabel}
                </span>
                <i className="fa-light fa-arrow-right text-xs text-muted-foreground group-hover:text-brand group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ToneIcon({ tone, icon }: { tone: 'brand' | 'info' | 'warning' | 'success' | 'destructive'; icon: string }) {
  const fg: Record<typeof tone, string> = {
    brand: 'text-brand-dark',
    info: 'text-chart-1',
    warning: 'text-chart-4',
    success: 'text-chart-2',
    destructive: 'text-chart-5',
  } as any
  const isPulse = tone === 'info' && icon === 'fa-circle'
  return (
    <div className="flex size-8 items-center justify-center rounded-md bg-muted shrink-0">
      <i
        className={`fa-light ${icon} ${fg[tone]} text-sm ${isPulse ? '[animation:pulse-soft_1.6s_ease-in-out_infinite]' : ''}`}
        aria-hidden="true"
      />
    </div>
  )
}
