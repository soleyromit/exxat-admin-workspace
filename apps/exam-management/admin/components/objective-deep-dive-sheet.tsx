'use client'

/**
 * OBJECTIVE DEEP-DIVE SHEET
 *
 * Opens when faculty clicks any cell in the curricular matrix. The matrix
 * promised "click cell to drill into this objective" — this is what backs
 * the promise. Closes the loop without leaving the course view.
 *
 * Sections:
 *   1. Objective header + bloom + avg + status
 *   2. Per-assessment row (mirrors the matrix row)
 *   3. Top students who struggled (bottom 5 on this objective)
 *   4. Tagged questions (count + sample titles)
 *   5. Actions — Open in QB · Generate more · Review students
 */

import { useMemo } from 'react'
import {
  Button,
  Sheet, SheetContent, SheetTitle,
  Badge,
} from '@exxatdesignux/ui'
import type { CourseObjective, Student } from '@/lib/faculty-mock-data'
import type { Assessment } from '@/lib/qb-types'

type AssessmentLike =
  | Assessment
  | { id: string; courseId: string; offeringId: string; title: string; questionCount: number; durationMinutes: number }

interface ObjectiveDeepDiveSheetProps {
  objective: CourseObjective | null
  students: Student[]
  assessments: AssessmentLike[]
  onClose: () => void
  onOpenInQB?: () => void
  onGenerateMore?: () => void
  onReviewStudents?: () => void
}

// Deterministic mock helpers (same hash style as the matrix uses, so values
// stay stable across renders and match the matrix's perception of "this
// objective on this assessment").
function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function perfTone(perf: number) {
  if (perf >= 80) return { fg: 'text-chart-2', bg: 'bg-chart-2/14', label: 'Healthy' }
  if (perf >= 70) return { fg: 'text-chart-1', bg: 'bg-chart-1/12', label: 'On track' }
  if (perf >= 60) return { fg: 'text-chart-4', bg: 'bg-chart-4/14', label: 'Underperforming' }
  return { fg: 'text-chart-5', bg: 'bg-chart-5/14', label: 'Critical' }
}

export function ObjectiveDeepDiveSheet({
  objective,
  students,
  assessments,
  onClose,
  onOpenInQB,
  onGenerateMore,
  onReviewStudents,
}: ObjectiveDeepDiveSheetProps) {
  const open = !!objective

  // Per-assessment perf (mock — derived deterministically from objective + assessment ids)
  const perAssessment = useMemo(() => {
    if (!objective) return []
    if (!objective.lastAssessed) return []
    const covered = objective.assessmentsCovered
    const ranked = [...assessments]
      .map(a => ({ id: a.id, title: a.title, questionCount: a.questionCount, rank: hashStr(objective.id + a.id) }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, covered)
    return ranked.map(a => {
      const variance = ((hashStr(objective.id + a.id) % 21) - 10)  // -10..+10
      const perf = Math.max(20, Math.min(99, Math.round(objective.avgPerformance + variance)))
      return { id: a.id, title: a.title, perf, qCount: Math.max(1, Math.round(a.questionCount * 0.15)) }
    })
  }, [objective, assessments])

  // Bottom-5 students on this objective (mock — variance off the cohort avg)
  const strugglingStudents = useMemo(() => {
    if (!objective) return []
    const enriched = students.map(s => {
      const base = objective.avgPerformance
      const variance = ((hashStr(objective.id + s.id) % 41) - 20)  // -20..+20
      const perf = Math.max(20, Math.min(99, Math.round(base + variance)))
      return { student: s, perf }
    })
    return enriched.sort((a, b) => a.perf - b.perf).slice(0, 5)
  }, [objective, students])

  if (!objective) return null

  const tone = perfTone(objective.avgPerformance)

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        showOverlay={false}
        className="w-[28rem] sm:max-w-[28rem] p-0 gap-0 flex flex-col border border-border shadow-xl rounded-xl overflow-hidden"
        style={{ top: '0.5rem', bottom: '0.5rem', right: '0.5rem', height: 'calc(100vh - 1rem)' }}
      >
        <SheetTitle className="sr-only">{objective.title}</SheetTitle>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-border flex flex-col gap-2.5 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="rounded text-[10px] uppercase tracking-wider font-semibold">
                {objective.bloomsLevel}
              </Badge>
              <Badge
                variant="secondary"
                className={`rounded text-[10px] uppercase tracking-wider font-semibold ${tone.bg} ${tone.fg}`}
              >
                {tone.label}
              </Badge>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
              <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 13 }} />
            </Button>
          </div>
          <h2 className="text-base font-semibold text-foreground leading-snug">
            {objective.title}
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <i className="fa-light fa-rectangle-list" aria-hidden="true" />
              {objective.questionCount} {objective.questionCount === 1 ? 'question' : 'questions'} tagged
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <i className="fa-light fa-list-check" aria-hidden="true" />
              {objective.assessmentsCovered} of {assessments.length} assessments
            </span>
            {objective.lastAssessed && (
              <>
                <span>·</span>
                <span>Last seen {formatDateShort(objective.lastAssessed)}</span>
              </>
            )}
          </div>
        </div>

        {/* Body — scrolls */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* Cohort avg — large stat */}
          <section>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
              Cohort average
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold tabular-nums ${tone.fg}`}>
                {objective.avgPerformance > 0 ? `${objective.avgPerformance}%` : '—'}
              </span>
              <span className="text-xs text-muted-foreground">across {objective.assessmentsCovered} assessments</span>
            </div>
          </section>

          {/* Per-assessment breakdown */}
          {perAssessment.length > 0 && (
            <section>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                Performance per assessment
              </p>
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
                {perAssessment.map(a => {
                  const t = perfTone(a.perf)
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {a.qCount} tagged {a.qCount === 1 ? 'question' : 'questions'}
                        </p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${t.fg}`}>{a.perf}%</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Students who struggled */}
          {strugglingStudents.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Bottom 5 students on this objective
                </p>
                {onReviewStudents && (
                  <Button variant="ghost" size="sm" onClick={onReviewStudents} className="text-xs h-6 px-2 gap-1">
                    All students
                    <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 9 }} />
                  </Button>
                )}
              </div>
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
                {strugglingStudents.map(({ student, perf }) => {
                  const t = perfTone(perf)
                  return (
                    <li key={student.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex size-7 items-center justify-center rounded-full bg-muted shrink-0">
                        <span className="text-[10px] font-bold text-foreground">{student.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{student.studentId}</p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${t.fg}`}>{perf}%</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Untested-objective shortcut */}
          {!objective.lastAssessed && (
            <section className="rounded-lg border border-border bg-card border-l-3 border-l-chart-4 p-3.5">
              <div className="flex items-start gap-2.5">
                <i className="fa-light fa-bullseye-pointer text-chart-4 text-sm mt-0.5 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    This objective hasn&apos;t been assessed yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generate questions to close the gap before your next exam.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-border flex items-center gap-2 shrink-0">
          {onOpenInQB && (
            <Button variant="outline" size="sm" onClick={onOpenInQB} className="gap-1.5">
              <i className="fa-light fa-rectangle-list" aria-hidden="true" />
              Open in Question Bank
            </Button>
          )}
          {onGenerateMore && (
            <Button variant="default" size="sm" onClick={onGenerateMore} className="gap-1.5 ms-auto">
              <i className="fa-duotone fa-solid fa-star-christmas" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
              Generate more
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
