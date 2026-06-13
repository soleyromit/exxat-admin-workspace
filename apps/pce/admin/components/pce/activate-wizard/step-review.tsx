'use client'

import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import {
  MOCK_MASTER_COURSES,
  type CourseOffering,
  type PceTemplate,
  type ProgramTerm,
} from '@/lib/pce-mock-data'
import type { ReminderDays } from './step-email'

interface StepReviewProps {
  selectedTerm: ProgramTerm
  selectedOfferings: CourseOffering[]
  excludedCount: number
  openDate: Date | undefined
  closeDate: Date | undefined
  releaseDate: Date | undefined
  reminderDays: ReminderDays
  senderName: string
  emailSubject: string
  publishedTemplates: PceTemplate[]
  templateAssignments: Record<string, string>
  onBack: () => void
  onActivate: () => void
}

function fmt(d: Date | undefined) {
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function reminderSummary(days: ReminderDays, termEndDate: string) {
  if (days === 0) return 'None'
  const end = new Date(termEndDate + 'T00:00:00')
  const d = new Date(end.getTime() - days * 86400_000)
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${days} days before term end (${label})`
}

function templateSummary(
  selectedOfferings: CourseOffering[],
  templateAssignments: Record<string, string>,
  publishedTemplates: PceTemplate[],
) {
  const uniqueTemplateIds = new Set(selectedOfferings.map(o => templateAssignments[o.id]).filter(Boolean))
  if (uniqueTemplateIds.size === 0) return 'None assigned'
  if (uniqueTemplateIds.size === 1) {
    const t = publishedTemplates.find(t => t.id === [...uniqueTemplateIds][0])
    return t?.name ?? 'Unknown'
  }
  return `${uniqueTemplateIds.size} templates (varies by course)`
}

export function StepReview({
  selectedTerm,
  selectedOfferings,
  excludedCount,
  openDate,
  closeDate,
  releaseDate,
  reminderDays,
  senderName,
  emailSubject,
  publishedTemplates,
  templateAssignments,
  onBack,
  onActivate,
}: StepReviewProps) {
  const rows: { label: string; value: string }[] = [
    { label: 'Term',          value: `${selectedTerm.name} · ${selectedTerm.academicYear}` },
    { label: 'Courses',       value: `${selectedOfferings.length} included${excludedCount > 0 ? ` · ${excludedCount} excluded` : ''}` },
    { label: 'Survey opens',  value: fmt(openDate) },
    { label: 'Survey closes', value: fmt(closeDate) },
    { label: 'Results visible', value: fmt(releaseDate) },
    { label: 'Reminder',      value: reminderSummary(reminderDays, selectedTerm.endDate) },
    { label: 'Template',      value: templateSummary(selectedOfferings, templateAssignments, publishedTemplates) },
    { label: 'Sender',        value: senderName || 'Exxat Surveys' },
    { label: 'Email subject', value: emailSubject || '—' },
  ]

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 560 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Ready to activate
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Emails fire automatically on the survey open date — this is a schedule, not an immediate send.
        </p>
      </div>

      <div className="flex flex-col rounded-lg border border-border overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-start gap-4 px-4"
            style={{
              padding: '10px 16px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'var(--card)' : 'var(--background)',
            }}
          >
            <span className="text-sm shrink-0" style={{ width: 120, color: 'var(--muted-foreground)' }}>
              {row.label}
            </span>
            <span className="text-sm font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" onClick={onActivate}>
          Activate {selectedTerm.name} evaluations
          <i className="fa-light fa-calendar-check" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}
