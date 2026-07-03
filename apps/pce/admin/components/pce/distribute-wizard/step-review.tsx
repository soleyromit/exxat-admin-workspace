'use client'

import { Button } from '@exxatdesignux/ui'
import type { Reminder, EmailContact } from './step-communication'

export interface ReviewCourseGroup {
  templateTitle: string
  codes: string[]
}

interface StepReviewProps {
  surveyMode: 'course_evaluation' | 'general'
  surveyTitle: string
  surveyDescription: string
  termName: string
  academicYear: string
  offeringCount: number
  courseGroups: ReviewCourseGroup[]
  openDate: Date | undefined
  closeDate: Date | undefined
  releaseDate: Date | undefined
  studentCount: number
  emailContacts: EmailContact[]
  senderName: string
  templateName: string
  emailSubject: string
  isEmailEdited: boolean
  reminders: Reminder[]
  onEdit: (step: number) => void
  onBack: () => void
  onPush: () => void
}

function fmtDate(d: Date | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}
function fmtShort(d: Date | undefined): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
}

// Detail column — matches the template publish review: fixed-width label + value.
function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0" style={{ width: 130, paddingTop: 1 }}>{label}</span>
      <div className="flex-1 min-w-0 text-sm">{children}</div>
    </div>
  )
}
function SummaryCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
      <div className="flex items-center gap-2" style={{ background: 'var(--muted)', padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold flex-1">{title}</h2>
        <Button variant="ghost" size="xs" onClick={onEdit}>
          <i className="fa-light fa-pen text-xs" aria-hidden="true" />Edit
        </Button>
      </div>
      <div style={{ padding: '4px 14px 8px' }}>{children}</div>
    </section>
  )
}

// Right panel — checkout "Order Summary" analogy: at-a-glance totals line.
function SummaryLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right min-w-0">{value}</span>
    </div>
  )
}

export function StepReview({
  surveyMode, surveyTitle, surveyDescription, termName, academicYear, offeringCount, courseGroups,
  openDate, closeDate, releaseDate, studentCount, emailContacts, senderName,
  templateName, emailSubject, isEmailEdited, reminders, onEdit, onBack, onPush,
}: StepReviewProps) {
  const typeLabel = surveyMode === 'general' ? 'Programmatic survey' : 'Course evaluation'
  const totalRecipients = studentCount + emailContacts.length
  const reminderSummary = reminders.length === 0
    ? null
    : `${[...reminders].map(r => r.daysBefore).sort((a, b) => b - a).join(', ')} days before close`
  const muted = (s: string) => <span className="text-muted-foreground">{s}</span>

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 980 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Review &amp; push</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Confirm your selections, then push. This sends to all recipients and can&apos;t be undone — use Edit on any section to change it.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Detail column ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5" style={{ maxWidth: 620 }}>
          <SummaryCard title="Survey" onEdit={() => onEdit(1)}>
            <ReviewRow label="Name">{surveyTitle || muted('Untitled survey')}</ReviewRow>
            <ReviewRow label="Type">{typeLabel}</ReviewRow>
            <ReviewRow label="Term">{termName || muted('—')}</ReviewRow>
            <ReviewRow label="Academic year">{academicYear || muted('—')}</ReviewRow>
            <ReviewRow label="Description">{surveyDescription || muted('—')}</ReviewRow>
          </SummaryCard>

          {surveyMode === 'course_evaluation' && (
            <SummaryCard title={`Courses & templates · ${offeringCount} offering${offeringCount !== 1 ? 's' : ''}`} onEdit={() => onEdit(1)}>
              {courseGroups.length === 0
                ? <ReviewRow label="Courses">{muted('No courses selected')}</ReviewRow>
                : courseGroups.map((g, i) => (
                    <ReviewRow key={i} label={g.templateTitle}>
                      <span className="text-muted-foreground">{g.codes.length} course{g.codes.length !== 1 ? 's' : ''} — </span>
                      {g.codes.join(', ')}
                    </ReviewRow>
                  ))}
            </SummaryCard>
          )}

          <SummaryCard title="Schedule" onEdit={() => onEdit(3)}>
            <ReviewRow label="Opens">{fmtDate(openDate)}</ReviewRow>
            <ReviewRow label="Closes">{fmtDate(closeDate)}</ReviewRow>
            <ReviewRow label="Results released">{fmtDate(releaseDate)}</ReviewRow>
          </SummaryCard>

          <SummaryCard title="Recipients" onEdit={() => onEdit(3)}>
            <ReviewRow label="Via Prism">
              {studentCount > 0 ? `${studentCount} student${studentCount !== 1 ? 's' : ''} from the selected courses` : muted('None')}
            </ReviewRow>
            <ReviewRow label="External contacts">
              {emailContacts.length === 0 ? muted('None') : (
                <div className="flex flex-col gap-1">
                  {emailContacts.map(c => {
                    const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
                    return (
                      <div key={c.id} className="truncate">
                        {name ? <span className="font-medium">{name}</span> : null}
                        {name ? <span className="text-muted-foreground"> · {c.email}</span> : c.email}
                      </div>
                    )
                  })}
                </div>
              )}
            </ReviewRow>
          </SummaryCard>

          <SummaryCard title="Invitation email" onEdit={() => onEdit(3)}>
            <ReviewRow label="Template">
              {templateName}
              {isEmailEdited && <span className="text-xs text-muted-foreground"> · edited for this push</span>}
            </ReviewRow>
            <ReviewRow label="Subject">{emailSubject || muted('—')}</ReviewRow>
            <ReviewRow label="From">{senderName || 'Exxat Surveys'}</ReviewRow>
          </SummaryCard>

          <SummaryCard title="Reminders" onEdit={() => onEdit(3)}>
            <ReviewRow label="Schedule">{reminderSummary ?? muted('No reminders scheduled')}</ReviewRow>
          </SummaryCard>
        </div>

        {/* ── Push summary panel (checkout "Order Summary" analogy) ──────── */}
        <aside className="shrink-0" style={{ width: 300, position: 'sticky', top: 8 }}>
          <div className="rounded-lg border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
            <div style={{ background: 'var(--muted)', padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold">Push summary</h2>
            </div>

            <div style={{ padding: '10px 14px 4px' }}>
              {/* Recipients = the "order total" of a send — emphasised */}
              <div className="flex items-baseline justify-between gap-3 pb-2 mb-1 border-b border-border">
                <span className="text-sm font-medium">Recipients</span>
                <span className="text-lg font-semibold tabular-nums" style={{ fontFamily: 'var(--font-heading)' }}>{totalRecipients}</span>
              </div>
              <p className="text-xs text-muted-foreground" style={{ marginTop: -2, marginBottom: 4 }}>
                {studentCount} student{studentCount !== 1 ? 's' : ''} · {emailContacts.length} external
              </p>

              <SummaryLine label="Survey window" value={`${fmtShort(openDate)} – ${fmtShort(closeDate)}`} />
              <SummaryLine label="Results" value={fmtShort(releaseDate)} />
              <SummaryLine label="Reminders" value={reminders.length === 0 ? muted('None') : `${reminders.length} send${reminders.length !== 1 ? 's' : ''}`} />
              <SummaryLine label="Template" value={<span className="truncate inline-block max-w-[150px] align-bottom">{templateName}</span>} />
            </div>

            <div className="flex flex-col gap-2.5" style={{ padding: '10px 14px 14px' }}>
              {surveyMode === 'course_evaluation' && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <i className="fa-light fa-shield-check" aria-hidden="true" style={{ fontSize: 11, marginTop: 2 }} />
                  <span>Responses are anonymous. Results release to instructors on {fmtShort(releaseDate)}.</span>
                </p>
              )}
              <Button variant="default" size="sm" className="w-full" onClick={onPush}>
                <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 12 }} />
                Push Survey
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground" onClick={onBack}>
                Back to Communication
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
