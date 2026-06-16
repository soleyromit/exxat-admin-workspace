'use client'

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Button, LocalBanner,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { MOCK_OPEN_TEXT_RESPONSES } from '@/lib/pce-mock-data'
import type { SubjectKey } from '@/lib/pce-mock-data'

const SUBJECT_LABELS: Record<SubjectKey, string> = {
  course_content:     'Course Content',
  course_instructor:  'Course Instructor',
  course_coordinator: 'Course Coordinator',
  teaching_assistant: 'Teaching Assistant',
  lab_instructor:     'Lab Instructor',
  course_director:    'Course Director',
  preceptor:          'Preceptor',
  clinical_supervisor: 'Clinical Supervisor',
}

interface Props {
  surveyId: string | null
  onClose: () => void
}

export function ModerationSheet({ surveyId, onClose }: Props) {
  const { surveys, enableResults } = usePce()
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(
    () => new Set(MOCK_OPEN_TEXT_RESPONSES.filter(r => r.flagged).map(r => r.id))
  )
  const [confirmOpen, setConfirmOpen] = useState(false)

  const survey = surveyId ? surveys.find(s => s.id === surveyId) ?? null : null
  const responses = survey ? MOCK_OPEN_TEXT_RESPONSES.filter(r => r.surveyId === survey.id) : []

  const grouped: Array<{ subject: SubjectKey; items: typeof responses }> = []
  for (const r of responses) {
    const group = grouped.find(g => g.subject === r.sectionSubject)
    if (group) { group.items.push(r) }
    else { grouped.push({ subject: r.sectionSubject, items: [r] }) }
  }

  const hiddenCount = [...hiddenIds].filter(id =>
    responses.some(r => r.id === id)
  ).length

  function toggleHidden(id: string) {
    setHiddenIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleRelease() {
    if (survey) {
      enableResults(survey.id)
    }
    setConfirmOpen(false)
    onClose()
  }

  return (
    <>
      <Sheet open={!!survey} onOpenChange={(open) => { if (!open) onClose() }}>
        <SheetContent
          side="right"
          className="flex flex-col p-0 gap-0"
          style={{ width: 560, maxWidth: '90vw' }}
        >
          <SheetHeader className="shrink-0 px-6 py-4 border-b border-border">
            <SheetTitle className="text-base font-semibold">
              Review &amp; Release — {survey?.courseCode}
            </SheetTitle>
            {survey && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {survey.term} · {survey.enrollmentCount} enrolled · {responses.length} open-text {responses.length === 1 ? 'response' : 'responses'}
                {hiddenCount > 0 && (
                  <span style={{ color: 'var(--chart-4)' }}> · {hiddenCount} hidden</span>
                )}
              </p>
            )}
          </SheetHeader>

          {/* Response list */}
          <div className="flex-1 overflow-y-auto" tabIndex={0}>
            {responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <i className="fa-light fa-comment-lines text-3xl text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">No open-text responses</p>
                <p className="text-sm text-muted-foreground">Nothing to moderate for this survey.</p>
              </div>
            ) : (
              grouped.map(group => (
                <div key={group.subject}>
                  <div
                    className="px-6 py-2 flex items-center gap-2"
                    style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
                  >
                    <h2 className="text-xs font-medium text-muted-foreground">
                      {SUBJECT_LABELS[group.subject] ?? group.subject}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      · {group.items.length} {group.items.length === 1 ? 'response' : 'responses'}
                    </span>
                  </div>

                  {group.items.map(response => {
                    const isHidden = hiddenIds.has(response.id)
                    return (
                      <div
                        key={response.id}
                        className="flex items-start gap-4 px-6 py-4 group"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{response.questionText}</p>
                          <p className="text-sm leading-relaxed">{response.text}</p>
                          {isHidden && (
                            <span
                              className="text-xs font-medium self-start px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: 'var(--muted)', color: 'var(--chart-4)' }}
                            >
                              Hidden from faculty
                            </span>
                          )}
                        </div>

                        <Button
                          variant={isHidden ? 'outline' : 'ghost'}
                          size="sm"
                          aria-label={isHidden ? 'Unhide — show to faculty' : 'Hide from faculty'}
                          onClick={() => toggleHidden(response.id)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          style={isHidden
                            ? { color: 'var(--chart-4)', borderColor: 'var(--chart-4)' }
                            : {}
                          }
                        >
                          <i
                            className={`fa-${isHidden ? 'solid' : 'light'} fa-eye-slash`}
                            aria-hidden="true"
                            style={{ fontSize: 12 }}
                          />
                          {isHidden ? 'Unhide' : 'Hide'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 border-t border-border px-6 py-4 flex flex-col gap-3">
            {responses.length < 5 && responses.length > 0 && (
              <LocalBanner variant="warning">
                Only {responses.length} {responses.length === 1 ? 'response' : 'responses'} received — below the recommended minimum of 5.
              </LocalBanner>
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {hiddenCount > 0
                  ? `${hiddenCount} response${hiddenCount !== 1 ? 's' : ''} hidden from faculty`
                  : 'All responses visible to faculty'
                }
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={!survey}
              >
                <i className="fa-light fa-share-from-square" aria-hidden="true" style={{ fontSize: 12 }} />
                Share with Faculty
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent style={{ maxWidth: 440 }}>
          <DialogHeader>
            <DialogTitle>Share results with faculty?</DialogTitle>
            <DialogDescription>
              {survey && responses.length < 5 ? (
                <>
                  Only <strong>{responses.length}</strong> {responses.length === 1 ? 'response' : 'responses'} received — below the recommended minimum of 5.
                  {' '}Faculty will see aggregate scores based on this small sample.
                </>
              ) : (
                <>
                  Results for <strong>{survey?.courseCode}</strong> will be shared with faculty.
                  {hiddenCount > 0 && (
                    <> {hiddenCount} hidden {hiddenCount === 1 ? 'response has' : 'responses have'} been excluded.</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleRelease}>
              <i className="fa-light fa-share-from-square" aria-hidden="true" style={{ fontSize: 12 }} />
              Share Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
