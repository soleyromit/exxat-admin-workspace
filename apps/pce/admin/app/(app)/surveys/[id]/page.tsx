'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Button, Separator, SidebarTrigger, Avatar, AvatarFallback, Badge,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseGauge } from '@/components/pce/response-gauge'
import { CloseSurveyDialog, AddGuestSheet, SendReminderPopover, ReleaseSheet } from '@/components/pce/pce-modals'
import { SECTION_LABELS, MOCK_RESPONSES } from '@/lib/pce-mock-data'
import Link from 'next/link'

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { surveys, templates, removeInstructor } = usePce()
  const [closeOpen, setCloseOpen] = useState(false)
  const [addGuestOpen, setAddGuestOpen] = useState(false)
  const [releaseOpen, setReleaseOpen] = useState(false)

  const survey = surveys.find(s => s.id === id)
  const template = survey ? templates.find(t => t.id === survey.templateId) : null
  const responses = survey ? MOCK_RESPONSES.find(r => r.surveyId === survey.id) : null

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <i className="fa-light fa-circle-exclamation text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <p className="text-sm font-medium">Survey not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/surveys">Back to Surveys</Link>
        </Button>
      </div>
    )
  }

  const canClose = survey.status === 'collecting' || survey.status === 'active'
  const isPendingReview = survey.status === 'pending_review'

  return (
    <>
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/surveys" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Surveys</Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <span className="text-sm font-semibold flex-1 truncate">
          {survey.courseCode} — {survey.courseName}
        </span>
        <SurveyStatusBadge status={survey.status} />
      </header>

      {/* Pending review banner */}
      {isPendingReview && (
        <div
          className="flex items-center justify-between px-4 py-3 text-sm border-b border-border"
          style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-light fa-circle-info" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
            <span>This survey has closed. Review responses and release to faculty.</span>
          </div>
          <Button size="sm" onClick={() => setReleaseOpen(true)}>
            Review & Release
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
          </Button>
        </div>
      )}

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl flex flex-col gap-6">

          {/* Overview card */}
          <div className="border border-border rounded-lg p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Overview</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Response Rate</p>
                <ResponseGauge
                  rate={survey.responseRate}
                  responseCount={survey.responseCount}
                  enrollmentCount={survey.enrollmentCount}
                  showBar
                  size="md"
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Deadline</p>
                <p className="text-sm font-medium">{survey.deadline}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Template</p>
                <p className="text-sm font-medium">{template?.name ?? '—'}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-end gap-2">
              {canClose && (
                <SendReminderPopover survey={survey}>
                  <Button variant="outline" size="sm">
                    <i className="fa-light fa-bell" aria-hidden="true" style={{ fontSize: 12 }} />
                    Send Reminder
                  </Button>
                </SendReminderPopover>
              )}
              {canClose && (
                <Button variant="outline" size="sm" onClick={() => setCloseOpen(true)}
                  style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>
                  Close Survey
                </Button>
              )}
              {isPendingReview && (
                <Button size="sm" onClick={() => setReleaseOpen(true)}>
                  Release to Faculty
                </Button>
              )}
            </div>
          </div>

          {/* Sections */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Sections</h2>
            </div>
            {template?.sections.map(section => {
              const sectionResponse = responses?.sectionScores.find(s => s.section === section)
              return (
                <div
                  key={section}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{SECTION_LABELS[section]}</span>
                    {section === 'faculty_performance' && (
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {survey.instructors.map(i => i.name).join(' · ')}
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--muted-foreground)' }}>
                    {sectionResponse ? `${sectionResponse.count} responses` : `${survey.responseCount} responses`}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Instructors */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Instructors</h2>
              {canClose && (
                <Button variant="ghost" size="sm" onClick={() => setAddGuestOpen(true)}>
                  <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
                  Add Guest
                </Button>
              )}
            </div>
            {survey.instructors.map((instructor, i) => (
              <div
                key={instructor.id}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < survey.instructors.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {instructor.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{instructor.name}</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {instructor.role === 'primary' ? 'Primary instructor' : 'Guest lecturer'}
                    </span>
                  </div>
                </div>
                {instructor.role === 'guest' && canClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstructor(survey.id, instructor.id)}
                    style={{ color: 'var(--destructive)' }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {survey.instructors.length === 0 && (
              <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No instructors assigned.
              </div>
            )}
          </div>

        </div>
      </main>

      <CloseSurveyDialog open={closeOpen} onOpenChange={setCloseOpen} survey={survey} />
      <AddGuestSheet open={addGuestOpen} onOpenChange={setAddGuestOpen} surveyId={survey.id} />
      <ReleaseSheet open={releaseOpen} onOpenChange={setReleaseOpen} survey={survey} />
    </>
  )
}
