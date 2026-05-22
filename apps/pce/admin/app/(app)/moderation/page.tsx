'use client'

import { useState } from 'react'
import {
  Button, LocalBanner, SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { BulletGauge } from '@/components/pce/bullet-gauge'
import { MOCK_OPEN_TEXT_RESPONSES } from '@/lib/pce-mock-data'
import type { PceSurvey, SubjectKey } from '@/lib/pce-mock-data'

// Human-readable section labels for open-text grouping
const SUBJECT_LABELS: Record<SubjectKey, string> = {
  course_content:     'Course Content',
  course_instructor:  'Course Instructor',
  course_coordinator: 'Course Coordinator',
  teaching_assistant: 'Teaching Assistant',
  lab_instructor:     'Lab Instructor',
  course_director:    'Course Director',
}

export default function ModerationPage() {
  const { surveys, enableResults } = usePce()

  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(
    () => new Set(MOCK_OPEN_TEXT_RESPONSES.filter(r => r.flagged).map(r => r.id))
  )

  const pending = surveys.filter(s => s.status === 'pending_review')

  const selectedSurvey: PceSurvey | null =
    pending.find(s => s.id === selectedSurveyId) ?? null

  function toggleFlag(responseId: string) {
    setFlaggedIds(prev => {
      const next = new Set(prev)
      next.has(responseId) ? next.delete(responseId) : next.add(responseId)
      return next
    })
  }

  // Responses for the selected survey
  const surveyResponses = selectedSurvey
    ? MOCK_OPEN_TEXT_RESPONSES.filter(r => r.surveyId === selectedSurvey.id)
    : []

  // Group responses by sectionSubject, preserving insertion order
  const groupedResponses: Array<{ subject: SubjectKey; responses: typeof surveyResponses }> = []
  if (surveyResponses.length > 0) {
    const seen = new Set<SubjectKey>()
    for (const r of surveyResponses) {
      if (!seen.has(r.sectionSubject)) {
        seen.add(r.sectionSubject)
        groupedResponses.push({ subject: r.sectionSubject, responses: [] })
      }
      groupedResponses.find(g => g.subject === r.sectionSubject)!.responses.push(r)
    }
  }

  const responseCount = surveyResponses.length

  // Count flagged responses belonging to the selected survey
  const surveyFlaggedCount = selectedSurvey
    ? [...flaggedIds].filter(id =>
        MOCK_OPEN_TEXT_RESPONSES.find(r => r.id === id && r.surveyId === selectedSurvey.id)
      ).length
    : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1
          className="flex-1 text-[22px] font-normal"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Review &amp; Moderation
        </h1>
      </header>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel — survey list ─────────────────────────────────── */}
        <aside
          className="flex flex-col border-r border-border shrink-0 overflow-y-auto"
          style={{ width: 300 }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '12px 14px 8px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.06em' }}
            >
              PENDING ({pending.length})
            </p>
          </div>

          {pending.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <i
                className="fa-light fa-shield-check text-3xl"
                aria-hidden="true"
                style={{ color: 'var(--brand-color)' }}
              />
              <p className="text-sm font-medium">All caught up</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No surveys pending review.
              </p>
            </div>
          ) : (
            pending.map(survey => {
              const isSelected = selectedSurveyId === survey.id
              const count = MOCK_OPEN_TEXT_RESPONSES.filter(
                r => r.surveyId === survey.id
              ).length

              return (
                <button
                  key={survey.id}
                  type="button"
                  onClick={() => setSelectedSurveyId(survey.id)}
                  className="w-full text-left"
                  style={{
                    padding: '10px 14px',
                    background: isSelected ? 'var(--brand-tint)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    border: 'none',
                    borderBottomColor: 'var(--border)',
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {survey.courseCode}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--muted-foreground)', marginBottom: 6 }}
                  >
                    {survey.term} · {survey.enrollmentCount} enrolled
                  </p>
                  <BulletGauge
                    responseCount={survey.responseCount}
                    enrollmentCount={survey.enrollmentCount}
                    width={80}
                    height={5}
                    ariaLabel={null}
                  />
                  <p
                    className="text-xs"
                    style={{ color: 'var(--muted-foreground)', marginTop: 4 }}
                  >
                    {count} open-text {count === 1 ? 'response' : 'responses'}
                  </p>
                </button>
              )
            })
          )}
        </aside>

        {/* ── Right panel — response cards or empty state ──────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {selectedSurvey ? (
            <>
              {/* Detail header */}
              <div
                className="shrink-0"
                style={{
                  padding: '16px 24px 12px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <p className="text-base font-semibold">
                  {selectedSurvey.courseCode} — {selectedSurvey.courseName}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {selectedSurvey.term} · {selectedSurvey.enrollmentCount} enrolled
                  · {responseCount} {responseCount !== 1 ? 'responses' : 'response'}
                </p>
              </div>

              {/* Scrollable response cards */}
              <div
                className="flex-1 overflow-y-auto"
                style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                {surveyResponses.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-16 gap-2 text-center"
                  >
                    <i
                      className="fa-light fa-comment-lines text-3xl"
                      aria-hidden="true"
                      style={{ color: 'var(--muted-foreground)' }}
                    />
                    <p className="text-sm font-medium">No open-text responses</p>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      This survey has no open-text responses to moderate.
                    </p>
                  </div>
                ) : (
                  groupedResponses.map(group => (
                    <div key={group.subject} className="flex flex-col gap-3">
                      {/* Section label */}
                      <p
                        className="text-xs font-semibold"
                        style={{
                          color: 'var(--muted-foreground)',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {SUBJECT_LABELS[group.subject] ?? group.subject}
                      </p>

                      {/* Response cards */}
                      {group.responses.map(response => {
                        const isFlagged = flaggedIds.has(response.id)
                        return (
                          <div
                            key={response.id}
                            className="flex flex-col gap-2 rounded-lg border"
                            style={{
                              padding: '12px 14px',
                              borderColor: 'var(--border)',
                              background: isFlagged ? 'var(--muted)' : 'var(--card)',
                            }}
                          >
                            {/* Question text */}
                            <p
                              className="text-xs"
                              style={{ color: 'var(--muted-foreground)' }}
                            >
                              {response.questionText}
                            </p>

                            {/* Response text + flag button */}
                            <div className="flex items-start justify-between gap-3">
                              <p
                                className="text-sm flex-1 leading-relaxed"
                                style={{
                                  color: isFlagged
                                    ? 'var(--muted-foreground)'
                                    : 'var(--foreground)',
                                  textDecoration: isFlagged ? 'line-through' : 'none',
                                }}
                              >
                                {response.text}
                              </p>

                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={isFlagged ? 'Unflag response' : 'Flag response'}
                                onClick={() => toggleFlag(response.id)}
                              >
                                <i
                                  className={
                                    isFlagged
                                      ? 'fa-light fa-eye'
                                      : 'fa-light fa-eye-slash'
                                  }
                                  aria-hidden="true"
                                  style={{ fontSize: 13 }}
                                />
                              </Button>
                            </div>

                            {/* Flagged notice */}
                            {isFlagged && (
                              <p
                                className="text-xs"
                                style={{ color: 'var(--chart-4)' }}
                              >
                                Flagged — will not be shown to faculty
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Sticky footer */}
              <div
                className="shrink-0 border-t border-border flex flex-col gap-3"
                style={{ padding: '16px 24px', background: 'var(--card)' }}
              >
                {responseCount < 5 && (
                  <LocalBanner variant="warning">
                    Only {responseCount} {responseCount !== 1 ? 'responses' : 'response'} received.
                    We recommend at least 5 before sharing results with faculty.
                  </LocalBanner>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {surveyFlaggedCount > 0
                      ? `${surveyFlaggedCount} ${surveyFlaggedCount === 1 ? 'response' : 'responses'} flagged — will not be shared`
                      : ''}
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      enableResults(selectedSurvey.id)
                      setSelectedSurveyId(null)
                    }}
                  >
                    <i
                      className="fa-light fa-share-nodes"
                      aria-hidden="true"
                      style={{ fontSize: 12 }}
                    />
                    Share Results with Faculty
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state — no survey selected */
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-20">
              <i
                className="fa-light fa-inbox text-3xl"
                aria-hidden="true"
                style={{ color: 'var(--muted-foreground)' }}
              />
              <p className="text-sm font-medium">Select a survey to review</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Choose a pending survey from the left to review its responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
