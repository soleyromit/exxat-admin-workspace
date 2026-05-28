'use client'

/**
 * Programmatic Surveys (UC-15) — stub.
 *
 * Per Aarti 2026-05-05: renamed from "General Surveys"; houses annual
 * standardized surveys (alumni, graduating student, preceptor, faculty, etc.).
 *
 * Phase 1: not built. Show explanatory empty state + back link.
 */

import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'

export default function ProgrammaticSurveysPage() {
  return (
    <>
      <SiteHeader title="Programmatic Surveys" />
      <div className="flex items-center gap-3 border-b border-border shrink-0" style={{ padding: '14px 28px 14px' }}>
        <Link href="/" className="text-sm text-muted-foreground">Course Evaluation and Surveys</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Programmatic Surveys</h1>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: '28px 28px 28px' }}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center max-w-md mx-auto">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full"
            style={{ backgroundColor: 'var(--muted)' }}
          >
            <i className="fa-light fa-rectangle-list text-muted-foreground text-2xl" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Programmatic surveys are coming soon</h2>
            <p className="text-sm text-muted-foreground">
              Annual student, preceptor, alumni, and faculty surveys will live here.
              Course Evaluation is fully available — start there for end-of-term feedback.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/surveys">
              <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
              Back to Course Evaluation
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
