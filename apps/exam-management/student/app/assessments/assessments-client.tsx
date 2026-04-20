'use client'

import Link from 'next/link'
import type { Assessment } from '@/lib/mock-assessments'
import { MOCK_ASSESSMENTS, ASSESSMENT_METRICS } from '@/lib/mock-assessments'
import { buttonVariants } from '@exxat/student/components/ui/button'
import { Badge } from '@exxat/student/components/ui/badge'

const STATUS_VARIANT: Record<Assessment['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'not-started': 'secondary',
  'in-progress': 'default',
  'submitted': 'outline',
  'graded': 'secondary',
}

const STATUS_LABELS: Record<Assessment['status'], string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'submitted': 'Submitted',
  'graded': 'Graded',
}

export function AssessmentsClient() {
  return (
    <div className="flex flex-1 flex-col">
      {/* KPI strip */}
      <div className="flex items-center gap-px border-b border-[var(--border)] bg-[var(--muted)]">
        {ASSESSMENT_METRICS.map(m => (
          <div key={m.id} className="flex flex-1 flex-col gap-0.5 bg-[var(--background)] px-4 py-3">
            <span className="text-xs text-[var(--muted-foreground)]">{m.label}</span>
            <span className="text-xl font-semibold text-[var(--foreground)]">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">My Assessments</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{MOCK_ASSESSMENTS.length} assigned</p>
        </div>
        <div className="relative">
          <i className="fa-light fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-sm" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search assessments…"
            aria-label="Search assessments"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] w-56"
          />
        </div>
      </div>

      {/* List */}
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none px-6 py-4 gap-3">
        {MOCK_ASSESSMENTS.map(a => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 gap-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="text-sm font-semibold text-[var(--foreground)] truncate">{a.title}</span>
              <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                <span>{a.course}</span>
                <span>·</span>
                <span>{a.questionCount} questions</span>
                <span>·</span>
                <span>{a.duration} min</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-[var(--muted-foreground)]">Due</div>
                <div className="text-sm font-medium text-[var(--foreground)]">{a.dueDate}</div>
              </div>
              {a.status === 'graded' && a.score !== undefined && (
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-[var(--muted-foreground)]">Score</div>
                  <div className="text-sm font-semibold text-emerald-600">{a.score}%</div>
                </div>
              )}
              <Badge variant={STATUS_VARIANT[a.status]}>
                {STATUS_LABELS[a.status]}
              </Badge>
              {(a.status === 'not-started' || a.status === 'in-progress') && (
                <Link href={`/exam/${a.id}`} className={buttonVariants({ variant: 'default' })}>
                  {a.status === 'in-progress' ? 'Continue' : 'Start'}
                </Link>
              )}
              {(a.status === 'graded' || a.status === 'submitted') && (
                <Link href={`/exam/${a.id}/results`} className={buttonVariants({ variant: 'outline' })}>
                  Review
                </Link>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
