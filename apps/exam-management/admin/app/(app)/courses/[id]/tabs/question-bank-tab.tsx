'use client'

/**
 * QUESTION BANK TAB — course-scoped QB reference.
 *
 * Phase 1: Stats block (# questions, # folders, last updated) +
 * quick link to the course QB in the Question Bank nav.
 *
 * Aarti May 19: "Question bank is more relevant for this page than showing
 * objectives... I'm not going to ever have somebody come in and work here
 * in isolation. They'll pretty much always pick their course and go to the
 * question bank for that course."
 *
 * QB editing stays in /question-bank — do not duplicate QB interactions here.
 */

import Link from 'next/link'
import { Button, Badge } from '@exxatdesignux/ui'
import { mockCourses, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'

interface QuestionBankTabProps {
  courseId: string
}

export function QuestionBankTab({ courseId }: QuestionBankTabProps) {
  const course = mockCourses.find(c => c.id === courseId)

  const courseQuestions = course
    ? MOCK_QB_QUESTIONS.filter(q => q.folder.startsWith(course.questionBankFolderId))
    : []
  const draftCount    = courseQuestions.filter(q => q.status === 'Draft').length
  const savedCount    = courseQuestions.filter(q => q.status === 'Saved').length
  const archivedCount = courseQuestions.filter(q => q.status === 'Archived').length

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <i className="fa-light fa-books text-muted-foreground text-3xl" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No question bank linked to this course.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-2">

      {/* Stats strip */}
      <section aria-labelledby="qb-stats-heading" className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <i className="fa-light fa-books text-muted-foreground" aria-hidden="true" style={{ fontSize: 16 }} />
            <h2 id="qb-stats-heading" className="text-sm font-semibold text-foreground">
              {course.name} — Question Bank
            </h2>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" asChild>
            <Link href="/question-bank">
              <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 11 }} />
              Open Question Bank
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total questions', value: courseQuestions.length, icon: 'fa-list-check' },
            { label: 'Saved',           value: savedCount,             icon: 'fa-circle-check' },
            { label: 'Drafts',          value: draftCount,             icon: 'fa-file-pen' },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-3"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <i
                  className={`fa-light ${stat.icon}`}
                  aria-hidden="true"
                  style={{ fontSize: 13, color: 'var(--muted-foreground)' }}
                />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {archivedCount > 0 && (
          <p className="text-[11px] text-muted-foreground mt-3">
            {archivedCount} archived question{archivedCount !== 1 ? 's' : ''} — visible in the full Question Bank.
          </p>
        )}
      </section>

      {/* Folder list */}
      <section aria-labelledby="qb-folders-heading" className="rounded-xl border border-border bg-card p-5">
        <h2 id="qb-folders-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">
          Folders
        </h2>

        {courseQuestions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <i className="fa-light fa-folder-open text-muted-foreground text-lg" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              No questions yet. Open the Question Bank to add questions to this course.
            </p>
            <Button size="sm" className="gap-1.5 mt-1" asChild>
              <Link href="/question-bank">
                <i className="fa-light fa-plus" aria-hidden="true" />
                Go to Question Bank
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {(() => {
              const folderGroups = courseQuestions.reduce<Record<string, number>>((acc, q) => {
                const folder = q.folderPath.split(' / ').pop() ?? q.folderPath
                acc[folder] = (acc[folder] ?? 0) + 1
                return acc
              }, {})
              return (
                <div className="flex flex-col gap-1">
                  {Object.entries(folderGroups).map(([folder, count]) => (
                    <div
                      key={folder}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors"
                    >
                      <i
                        className="fa-light fa-folder text-muted-foreground shrink-0"
                        aria-hidden="true"
                        style={{ fontSize: 14 }}
                      />
                      <span className="flex-1 text-sm text-foreground truncate">{folder}</span>
                      <Badge
                        variant="secondary"
                        className="rounded-full text-[10px] tabular-nums"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            })()}

            <div className="mt-3 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" asChild>
                <Link href="/question-bank">
                  <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 11 }} />
                  Manage in Question Bank
                </Link>
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
