'use client'

import { Button, Card, CardContent } from '@exxatdesignux/ui'
import type { AssessmentDraft } from '@/lib/qb-types'
import { MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'

interface Props {
  asmt: AssessmentDraft
  selectedIds: Set<string>
  onSendForReview: () => void
  onPublish: () => void
}

const fmt = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const fmtShort = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

export function ReviewPublishPanel({ asmt, selectedIds, onSendForReview, onPublish }: Props) {
  const lowPbisCount = MOCK_QB_QUESTIONS.filter(q => selectedIds.has(q.id) && q.pbis !== null && q.pbis < 0.2).length
  const allSectionsAssigned = asmt.sections.length === 0 || asmt.sections.every(s => (s.facultyIds?.length ?? 0) > 0 || !!s.facultyId)

  const readiness = [
    {
      ok: asmt.questions.length >= 1,
      warn: false,
      label: `${asmt.questions.length} question${asmt.questions.length !== 1 ? 's' : ''} across ${asmt.sections.length} section${asmt.sections.length !== 1 ? 's' : ''}`,
      status: asmt.questions.length >= 1 ? 'Complete' : 'Incomplete',
    },
    {
      ok: allSectionsAssigned,
      warn: false,
      label: 'All sections assigned to faculty',
      status: allSectionsAssigned ? 'Complete' : 'Incomplete',
    },
    {
      ok: !!asmt.settings.openDate,
      warn: false,
      label: asmt.settings.openDate
        ? `Exam window set (${fmtShort.format(new Date(asmt.settings.openDate))})`
        : 'Exam window not set',
      status: !!asmt.settings.openDate ? 'Complete' : 'Incomplete',
    },
    {
      ok: false,
      warn: true,
      label: `${lowPbisCount} question${lowPbisCount !== 1 ? 's' : ''} with low pt. bi-serial (<0.20)`,
      status: 'Review',
    },
    {
      ok: false,
      warn: true,
      label: 'Not yet approved by department chair',
      status: 'Pending',
    },
  ]

  const firstQ = asmt.sections[0]?.questionIds[0]
    ? MOCK_QB_QUESTIONS.find(q => q.id === asmt.sections[0].questionIds[0])
    : MOCK_QB_QUESTIONS[0]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Admin preview bar */}
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border bg-muted shrink-0 text-xs text-muted-foreground">
        <span className="flex-1">Admin view — students won&apos;t see this bar.</span>
        {asmt.sections.map((sec, idx) => (
          <Button key={sec.id} variant="ghost" size="sm" className="h-[26px] text-xs">
            {idx + 1}. {sec.title}
          </Button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: student preview + readiness */}
        <div className="flex-1 overflow-y-auto border-r border-border">
          {/* Student taker simulation */}
          <div className="border-b border-border">
            {/* ET toolbar */}
            <div className="h-[52px] bg-card border-b border-border flex items-center px-4 gap-2.5">
              <span className="text-sm font-extrabold tracking-tight text-foreground">EM</span>
              <span className="w-px h-5 bg-border" />
              <span className="text-[13px] font-medium flex-1 text-center text-foreground">{asmt.title}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">01:26:44</span>
              <Button variant="outline" size="sm" className="ml-2">Submit</Button>
            </div>

            {/* Progress bar */}
            <div className="h-[3px] bg-muted">
              <div className="h-full w-[35%] bg-[var(--brand-color)]" />
            </div>

            {/* Question card */}
            <div className="px-7 py-4" style={{ background: 'oklch(0.975 0.005 270)' }}>
              <Card size="sm" className="max-w-[580px] mx-auto">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Question 1 of {asmt.questions.length || 20} — {asmt.sections[0]?.title ?? 'Section 1'}
                </div>
                <div className="text-[13px] leading-relaxed mb-3 text-foreground">
                  {firstQ?.title ?? 'A 68-year-old patient with reduced ejection fraction heart failure is started on metoprolol succinate. Which best explains the long-term benefit?'}
                </div>
                {['Increased heart rate improves cardiac output', 'Reverse remodeling reduces ventricular wall stress over time', 'Direct inotropic effect augments stroke volume', 'Peripheral vasodilation reduces afterload acutely'].map((opt, i) => (
                  <div key={i} className="flex items-baseline gap-2.5 rounded-[10px] px-3.5 py-2.5 mb-2 cursor-pointer text-[13px] text-foreground"
                    style={{
                      border: `2px solid ${i === 1 ? 'var(--brand-color)' : 'var(--border)'}`,
                      background: i === 1 ? 'var(--brand-tint)' : 'transparent',
                    }}>
                    <span className="w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center shrink-0"
                      style={{
                        background: i === 1 ? 'var(--brand-color)' : 'var(--muted)',
                        color: i === 1 ? 'white' : 'var(--muted-foreground)',
                      }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </div>
                ))}
              </CardContent>
              </Card>
            </div>

            {/* ET footer */}
            <div className="h-[52px] bg-card border-t border-border flex items-center px-5 gap-2.5">
              <Button variant="outline" size="sm">← Previous</Button>
              <div className="text-[13px] font-semibold bg-muted rounded-full px-3.5 py-1 mx-auto">
                Q 1 / {asmt.questions.length || 20}
              </div>
              <Button variant="ghost" size="sm">Flag</Button>
              <Button size="sm">Next →</Button>
            </div>
          </div>

          {/* Readiness check + send for review */}
          <div className="p-5">
            <p className="text-[13px] font-semibold mb-3.5 text-foreground">Readiness check</p>
            {readiness.map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-2.5">
                <span className="text-base">{item.ok ? '✅' : item.warn ? '⚠️' : '❌'}</span>
                <span className="text-[13px] flex-1 text-foreground">{item.label}</span>
                <span className="text-xs font-semibold" style={{ color: item.ok ? 'var(--chart-2)' : 'var(--chart-4)' }}>{item.status}</span>
              </div>
            ))}

            <div className="h-px bg-border my-3.5" />

            {/* Send for review */}
            <Card size="sm" className="mb-3.5">
              <CardContent className="p-3.5">
                <p className="text-[13px] font-semibold mb-1 text-foreground">Send for review</p>
                <p className="text-xs text-muted-foreground mb-2.5 leading-snug">
                  Your department chair reviews question quality, difficulty mix, and coverage before publishing.
                </p>
                <div className="flex items-center gap-1.5 p-2.5 border border-border rounded-lg mb-1.5 bg-background">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'rgb(124 107 191)' }}>DK</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-foreground">Dr. Kapoor</div>
                    <div className="text-xs text-muted-foreground">Program Director</div>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Reviewer</span>
                </div>
                <Button size="sm" className="w-full justify-center" onClick={onSendForReview}>
                  Send for review
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: publish panel */}
        <div className="w-[280px] shrink-0 overflow-y-auto p-4">
          <Card size="sm" className="border-ring" style={{ background: 'var(--brand-tint)' }}>
            <CardContent className="p-3.5">
              <p className="text-sm font-bold mb-1 text-foreground">Ready to publish?</p>
              <p className="text-xs text-muted-foreground mb-3 leading-snug">
                Students in the {asmt ? 'Spring 2026' : ''} offering will be notified and can access the exam during the scheduled window.
              </p>
              {asmt.settings.openDate && (
                <>
                  <div className="mb-2.5">
                    <div className="text-xs text-muted-foreground mb-0.5">Opens</div>
                    <div className="text-[13px] font-medium text-foreground">{fmt.format(new Date(asmt.settings.openDate))}</div>
                  </div>
                  {asmt.settings.closeDate && (
                    <div className="mb-3.5">
                      <div className="text-xs text-muted-foreground mb-0.5">Closes</div>
                      <div className="text-[13px] font-medium text-foreground">{fmt.format(new Date(asmt.settings.closeDate))}</div>
                    </div>
                  )}
                </>
              )}
              {!asmt.settings.openDate && (
                <p className="text-xs text-muted-foreground mb-3.5">No exam window set yet. Add dates in Delivery &amp; Security.</p>
              )}
              <Button size="sm" className="w-full justify-center" onClick={onPublish}>
                Publish assessment
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">Review not required to publish</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
