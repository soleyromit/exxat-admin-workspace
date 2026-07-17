'use client'

/**
 * AT-RISK INTERVENTION DIALOG — closes Aarti's loop on bottom-20% students.
 *
 * From Granola: "Faculty intervention requirements: one-on-one meetings with
 * failing students; practice question assignment from question bank;
 * advisor notification."
 *
 * Surfaces:
 *   - Student snapshot (name, course avg, weakest objective)
 *   - 3 suggested practice questions (from QB, scoped to weakest objective)
 *   - Toggle: also notify advisor
 *   - Optional note for the student
 *   - "Assign practice & notify" CTA → mock confirmation toast
 */

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Badge, Textarea,
} from '@exxatdesignux/ui'
import { StatusPill, BloomChip, DifficultyChip } from '@/components/faculty-ui-kit'
import type { Student, Accommodation, CourseObjective } from '@/lib/faculty-mock-data'

export interface InterventionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  courseId: string
  /** Course objectives, used to identify the student's weakest area. */
  objectives: CourseObjective[]
  accommodations: Accommodation[]
}

export function InterventionDialog({
  open, onOpenChange, student, courseId, objectives, accommodations,
}: InterventionDialogProps) {
  const [notifyAdvisor, setNotifyAdvisor] = useState(true)
  const [scheduleMeeting, setScheduleMeeting] = useState(false)
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)

  if (!student) return null
  const score = student.avgScore[courseId] ?? 0

  // Pick the lowest-performance objective in this course as the "weak area"
  const weakest = [...objectives]
    .filter(o => o.lastAssessed && o.avgPerformance > 0)
    .sort((a, b) => a.avgPerformance - b.avgPerformance)[0] ?? objectives[0]

  // Suggested practice questions — mock 3 drawn from weakest objective
  const suggestions = generateSuggestions(weakest)

  const studentAccoms = accommodations.filter(a => a.studentId === student.id)

  const handleAssign = () => {
    setDone(true)
    setTimeout(() => {
      onOpenChange(false)
      setDone(false)
      setNote('')
    }, 1600)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <i className="fa-light fa-life-ring text-chart-4 text-base mt-1 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-heading text-lg">Intervention plan</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Assign targeted practice questions and notify the student&apos;s advisor.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {done ? (
          <DoneView studentName={`${student.firstName} ${student.lastName}`} />
        ) : (
          <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-5">
            {/* Student snapshot */}
            <section className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-foreground">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-muted-foreground">{student.studentId} · {student.cohort}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone="warning" icon="fa-triangle-exclamation" label="At-risk" uppercase />
                  {studentAccoms.length > 0 && (
                    <StatusPill tone="info" icon="fa-universal-access" label={`${studentAccoms.length} accommodation${studentAccoms.length === 1 ? '' : 's'}`} uppercase />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Course avg</p>
                  <p className="font-bold text-chart-4 text-lg">{score}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weakest area</p>
                  <p className="text-xs text-foreground font-medium line-clamp-1" title={weakest.title}>
                    {weakest.title}
                  </p>
                  <p className="text-[10px] text-chart-4 font-bold">
                    {weakest.avgPerformance > 0 ? `${weakest.avgPerformance}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last activity</p>
                  <p className="text-xs text-foreground">{relativeDays(student.lastActivity)}</p>
                </div>
              </div>
            </section>

            {/* Suggested practice questions */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Suggested practice ({suggestions.length})
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Targeted at weakest objective: <span className="text-foreground font-medium">{weakest.code}</span>
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {suggestions.map(q => (
                  <div key={q.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="secondary" className="rounded font-mono text-[10px] bg-muted text-foreground">
                        {q.code}
                      </Badge>
                      <DifficultyChip level={q.difficulty} />
                      <BloomChip level={q.blooms} />
                    </div>
                    <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{q.title}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Options */}
            <section className="flex flex-col gap-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Intervention options
              </p>
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyAdvisor}
                  onChange={(e) => setNotifyAdvisor(e.target.checked)}
                  className="mt-0.5 accent-brand"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Notify student&apos;s academic advisor</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sends a confidential summary to the assigned advisor for academic support coordination.
                  </p>
                </div>
                <i className="fa-light fa-user-tie text-muted-foreground" aria-hidden="true" />
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={scheduleMeeting}
                  onChange={(e) => setScheduleMeeting(e.target.checked)}
                  className="mt-0.5 accent-brand"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Request 1:1 meeting</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sends a calendar request via the advising system.
                  </p>
                </div>
                <i className="fa-light fa-calendar-day text-muted-foreground" aria-hidden="true" />
              </label>
            </section>

            {/* Note */}
            <section>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Note to student (optional)
              </p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I noticed you've been working on drug-interaction questions. Try these — happy to discuss in office hours."
                rows={3}
                className="text-sm"
              />
            </section>
          </div>
        )}

        {!done && (
          <DialogFooter className="px-6 py-3 border-t border-border shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAssign} className="gap-2">
              <i className="fa-light fa-paper-plane" aria-hidden="true" />
              Assign practice {notifyAdvisor || scheduleMeeting ? '+' : ''} {[notifyAdvisor && 'notify advisor', scheduleMeeting && 'schedule meeting'].filter(Boolean).join(' + ')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DoneView({ studentName }: { studentName: string }) {
  return (
    <div className="px-6 py-12 flex flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <i className="fa-solid fa-check text-chart-2 text-xl" aria-hidden="true" />
      </div>
      <div>
        <p className="font-heading text-base font-semibold text-foreground">Intervention sent</p>
        <p className="text-sm text-muted-foreground mt-1">
          {studentName} has been assigned practice questions. Their advisor was notified.
        </p>
      </div>
    </div>
  )
}

function generateSuggestions(weakest: CourseObjective) {
  // Mock — real impl pulls from QB filtered by objective tag
  return [
    {
      id: 'sug-1',
      code: `Q-${weakest.code.split('-').slice(-1)[0]}-PRAC-01`,
      title: 'A 70-year-old patient with chronic kidney disease is started on a new medication. Which adjustment is most appropriate to prevent toxicity?',
      difficulty: 'Medium' as const,
      blooms: 'Apply' as const,
    },
    {
      id: 'sug-2',
      code: `Q-${weakest.code.split('-').slice(-1)[0]}-PRAC-02`,
      title: 'Identify the primary mechanism by which this drug class causes the adverse effect described in the patient case.',
      difficulty: 'Medium' as const,
      blooms: 'Analyze' as const,
    },
    {
      id: 'sug-3',
      code: `Q-${weakest.code.split('-').slice(-1)[0]}-PRAC-03`,
      title: 'Compare the clinical scenarios in which short-acting versus long-acting agents are preferred.',
      difficulty: 'Easy' as const,
      blooms: 'Understand' as const,
    },
  ]
}

function relativeDays(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return `${Math.round(days / 7)}w ago`
}
