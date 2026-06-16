'use client'

import { useState } from 'react'
import {
  Button, LocalBanner,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { BulletGauge } from '@/components/pce/bullet-gauge'
import { MOCK_OPEN_TEXT_RESPONSES } from '@/lib/pce-mock-data'
import type { PceSurvey, SubjectKey } from '@/lib/pce-mock-data'

const SUBJECT_LABELS: Record<SubjectKey, string> = {
  course_content:     'Course Content',
  faculty:            'Faculty',
  course_instructor:  'Course Instructor',
  course_coordinator: 'Course Coordinator',
  teaching_assistant: 'Teaching Assistant',
  lab_instructor:     'Lab Instructor',
  course_director:    'Course Director',
  preceptor:          'Preceptor',
  clinical_supervisor: 'Clinical Supervisor',
}

export default function ModerationPage() {
  const { surveys, enableResults } = usePce()

  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(
    () => new Set(MOCK_OPEN_TEXT_RESPONSES.filter(r => r.flagged).map(r => r.id))
  )
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false)

  const pending = surveys.filter(s => s.status === 'pending_review')
  const selectedSurvey: PceSurvey | null = pending.find(s => s.id === selectedSurveyId) ?? null

  function toggleFlag(responseId: string) {
    setFlaggedIds(prev => {
      const next = new Set(prev)
      next.has(responseId) ? next.delete(responseId) : next.add(responseId)
      return next
    })
  }

  const surveyResponses = selectedSurvey
    ? MOCK_OPEN_TEXT_RESPONSES.filter(r => r.surveyId === selectedSurvey.id)
    : []

  // Group by subject, preserving insertion order
  const groupedResponses: Array<{ subject: SubjectKey; responses: typeof surveyResponses }> = []
  for (const r of surveyResponses) {
    const group = groupedResponses.find(g => g.subject === r.sectionSubject)
    if (group) { group.responses.push(r) }
    else { groupedResponses.push({ subject: r.sectionSubject, responses: [r] }) }
  }

  const surveyFlaggedCount = selectedSurvey
    ? [...flaggedIds].filter(id =>
        MOCK_OPEN_TEXT_RESPONSES.some(r => r.id === id && r.surveyId === selectedSurvey.id)
      ).length
    : 0

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Page header ── */}
      <SiteHeader title="Review &amp; Moderation" />
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '14px 28px 14px' }}>
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
          Review &amp; Moderation
        </h1>
        {pending.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {pending.length} survey{pending.length !== 1 ? 's' : ''} pending
          </span>
        )}
      </div>

      {/* ── Two-panel body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: survey list using DS sidebar components */}
        <aside
          className="flex flex-col border-r border-border shrink-0 overflow-y-auto"
          style={{ width: 264, background: 'var(--background)' }}
        >
          <SidebarGroup>
            <SidebarGroupLabel>
              Needs Review
              {pending.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto rounded-full text-xs px-1.5 py-0 min-w-[18px] text-center"
                >
                  {pending.length}
                </Badge>
              )}
            </SidebarGroupLabel>

            <SidebarMenu>
              {pending.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                  <i className="fa-light fa-shield-check text-2xl" aria-hidden="true"
                    style={{ color: 'var(--brand-color)' }} />
                  <p className="text-sm font-medium">All caught up</p>
                  <p className="text-xs text-muted-foreground">No surveys pending review.</p>
                </div>
              ) : (
                pending.map(survey => {
                  const isActive = selectedSurveyId === survey.id
                  const count = MOCK_OPEN_TEXT_RESPONSES.filter(r => r.surveyId === survey.id).length
                  const flagCount = [...flaggedIds].filter(id =>
                    MOCK_OPEN_TEXT_RESPONSES.some(r => r.id === id && r.surveyId === survey.id)
                  ).length

                  return (
                    <SidebarMenuItem key={survey.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setSelectedSurveyId(survey.id)}
                        className="h-auto flex-col items-start gap-1.5 py-3 data-active:bg-muted data-active:shadow-none data-active:ring-0"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="text-sm font-medium truncate">{survey.courseCode}</span>
                          {flagCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 rounded-full text-xs"
                            >
                              {flagCount} flagged
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate w-full">{survey.courseName}</span>
                        <BulletGauge
                          responseCount={survey.responseCount}
                          enrollmentCount={survey.enrollmentCount}
                          width={180}
                          height={4}
                          ariaLabel={null}
                        />
                        <span className="text-xs text-muted-foreground">
                          {survey.responseRate}% · {count} open-text {count === 1 ? 'response' : 'responses'}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroup>
        </aside>

        {/* Right: response review */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {selectedSurvey ? (
            <>
              {/* Detail header */}
              <div
                className="shrink-0 flex items-start justify-between px-6 py-4 border-b border-border"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {selectedSurvey.courseCode} — {selectedSurvey.courseName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedSurvey.term} · {selectedSurvey.enrollmentCount} enrolled
                    · {surveyResponses.length} {surveyResponses.length !== 1 ? 'responses' : 'response'}
                    {surveyFlaggedCount > 0 && (
                      <span style={{ color: 'var(--chart-4)' }}>
                        {' · '}{surveyFlaggedCount} flagged
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Response list */}
              <div className="flex-1 overflow-y-auto" tabIndex={0}>
                {surveyResponses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <i className="fa-light fa-comment-lines text-3xl text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-medium">No open-text responses</p>
                    <p className="text-sm text-muted-foreground">Nothing to moderate for this survey.</p>
                  </div>
                ) : (
                  groupedResponses.map(group => (
                    <div key={group.subject}>
                      {/* Section heading — NOT uppercase, NOT letterSpacing */}
                      <div
                        className="px-6 py-2 flex items-center gap-2"
                        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
                      >
                        <h2 className="text-xs font-medium text-muted-foreground">
                          {SUBJECT_LABELS[group.subject] ?? group.subject}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                          · {group.responses.length} {group.responses.length === 1 ? 'response' : 'responses'}
                        </span>
                      </div>

                      {/* Flat rows — Reddit / Circle pattern */}
                      {group.responses.map((response, idx) => {
                        const isFlagged = flaggedIds.has(response.id)
                        return (
                          <div
                            key={response.id}
                            className="flex items-start gap-4 px-6 py-4 group"
                            style={{ borderBottom: '1px solid var(--border)' }}
                          >
                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{response.questionText}</p>
                              <p className="text-sm leading-relaxed">{response.text}</p>
                              {isFlagged && (
                                <span
                                  className="text-xs font-medium self-start px-2 py-0.5 rounded-md"
                                  style={{
                                    backgroundColor: 'var(--muted)',
                                    color: 'var(--chart-4)',
                                  }}
                                >
                                  Hidden from faculty
                                </span>
                              )}
                            </div>

                            <Button
                              variant={isFlagged ? 'outline' : 'ghost'}
                              size="sm"
                              aria-label={isFlagged ? 'Remove flag — show to faculty' : 'Flag response — hide from faculty'}
                              onClick={() => toggleFlag(response.id)}
                              className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              style={isFlagged
                                ? { color: 'var(--chart-4)', borderColor: 'var(--chart-4)' }
                                : {}
                              }
                            >
                              <i
                                className={`fa-${isFlagged ? 'solid' : 'light'} fa-flag`}
                                aria-hidden="true"
                                style={{ fontSize: 12 }}
                              />
                              {isFlagged ? 'Unflag' : 'Flag'}
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
                {surveyResponses.length < 5 && (
                  <LocalBanner variant="warning">
                    Only {surveyResponses.length} {surveyResponses.length !== 1 ? 'responses' : 'response'} received.
                    We recommend at least 5 before sharing results with faculty.
                  </LocalBanner>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {surveyFlaggedCount > 0
                      ? `${surveyFlaggedCount} response${surveyFlaggedCount !== 1 ? 's' : ''} flagged — hidden from faculty`
                      : 'All responses will be shared with faculty'
                    }
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShareConfirmOpen(true)}
                  >
                    <i className="fa-light fa-share-from-square" aria-hidden="true" style={{ fontSize: 12 }} />
                    Share Results with Faculty
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
              <i className="fa-light fa-inbox text-3xl text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">Select a survey to review</p>
              <p className="text-sm text-muted-foreground" style={{ maxWidth: 280 }}>
                Choose a pending survey from the left to review and moderate its responses before sharing with faculty.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Share confirmation dialog */}
    <Dialog open={shareConfirmOpen} onOpenChange={setShareConfirmOpen}>
      <DialogContent style={{ maxWidth: 440 }}>
        <DialogHeader>
          <DialogTitle>Share results with faculty?</DialogTitle>
          <DialogDescription>
            {selectedSurvey && surveyResponses.length < 5 ? (
              <>
                Only <strong>{surveyResponses.length}</strong> {surveyResponses.length === 1 ? 'response' : 'responses'} received — below the recommended minimum of 5.
                {' '}Faculty will see aggregate scores based on this small sample.
              </>
            ) : (
              <>
                Results for <strong>{selectedSurvey?.courseCode}</strong> will be shared with faculty.
                {surveyFlaggedCount > 0 && (
                  <> {surveyFlaggedCount} flagged {surveyFlaggedCount === 1 ? 'response has' : 'responses have'} been hidden.</>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setShareConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (selectedSurvey) {
                enableResults(selectedSurvey.id)
                setSelectedSurveyId(null)
              }
              setShareConfirmOpen(false)
            }}
          >
            <i className="fa-light fa-share-from-square" aria-hidden="true" style={{ fontSize: 12 }} />
            Share Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
