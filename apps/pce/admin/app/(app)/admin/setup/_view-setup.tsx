'use client'

import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@exxatdesignux/ui'
import { TruncatedText } from '@/components/truncated-text'
import { MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'

const _courseById = new Map(MOCK_MASTER_COURSES.map(c => [c.id, c]))
const _termByName = new Map(MOCK_PROGRAM_TERMS.map(t => [t.name, t]))

interface SetupViewProps {
  selectedTermName: string
  termSurveys: any[]
  canActivate: boolean
  isTermEnabled: boolean
  termsReady: boolean
  templatesReady: boolean
  emailReady: boolean
  reminderReady: boolean
  enabledTerms: any[]
  activeTemplates: any[]
  setupDefaults: { activeReminderIntervals: number[]; initialEmailBody: string }
}

export function SetupView({
  selectedTermName, canActivate, isTermEnabled,
  termsReady, templatesReady, emailReady, reminderReady,
  enabledTerms, activeTemplates, setupDefaults,
}: SetupViewProps) {
  const allReady = termsReady && templatesReady && emailReady && reminderReady && isTermEnabled

  // Offerings that will be evaluated this term
  const termId = _termByName.get(selectedTermName)?.id
  const offeringsToEvaluate = termId
    ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === termId)
    : []

  const configs = [
    { key: 'terms',     label: 'Terms',            done: termsReady,     detail: enabledTerms.length > 0 ? `${enabledTerms.map(t => t.name).slice(0,2).join(', ')}${enabledTerms.length > 2 ? ` +${enabledTerms.length-2}` : ''}` : 'None enabled', href: '/admin/terms' },
    { key: 'templates', label: 'Survey Templates',  done: templatesReady, detail: activeTemplates.length > 0 ? `${activeTemplates[0].name}${activeTemplates.length > 1 ? ` +${activeTemplates.length-1}` : ''}` : 'None active', href: '/templates' },
    { key: 'email',     label: 'Email Templates',   done: emailReady,     detail: emailReady ? 'Initial + reminder ready' : 'Survey link not configured', href: '/admin/email-templates' },
    { key: 'schedule',  label: 'Reminder Schedule', done: reminderReady,  detail: reminderReady ? `${setupDefaults.activeReminderIntervals.join(', ')} days before close` : 'No intervals set', href: '/admin/reminder-schedule' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Readiness hero */}
      <div
        className="rounded-lg border px-5 py-4 flex items-center gap-4"
        style={{ borderColor: allReady ? 'var(--chart-2)' : 'var(--chart-4)', backgroundColor: allReady ? 'rgba(22,163,74,0.04)' : 'rgba(217,119,6,0.04)' }}
      >
        <i
          className={`fa-light ${allReady ? 'fa-circle-check' : 'fa-circle-exclamation'} text-xl`}
          aria-hidden="true"
          style={{ color: allReady ? 'var(--chart-2)' : 'var(--chart-4)', flexShrink: 0 }}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {allReady
              ? `You're ready to activate ${selectedTermName} evaluations`
              : `Complete setup to activate ${selectedTermName} evaluations`}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {allReady
              ? 'All configuration is in place. Activate when your scheduling is confirmed.'
              : `${configs.filter(c => !c.done).map(c => c.label).join(', ')} still needed.`}
          </p>
        </div>
        {canActivate && (
          <Button variant="default" size="sm" className="shrink-0" asChild>
            <Link href="/surveys/push">
              Activate evaluations
              <i className="fa-light fa-circle-play ms-1.5 text-xs" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>

      {/* Config cards 2×2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {configs.map(c => (
          <Card key={c.key}>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <i
                    className={`fa-light ${c.done ? 'fa-circle-check' : 'fa-circle-exclamation'} text-xs`}
                    aria-hidden="true"
                    style={{ color: c.done ? 'var(--chart-2)' : 'var(--chart-4)' }}
                  />
                  {c.label}
                </CardTitle>
                <Link href={c.href} className="text-xs hover:underline" style={{ color: 'var(--brand-color)' }}>Edit</Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{c.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* What will be evaluated */}
      {offeringsToEvaluate.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
            WHAT {selectedTermName.toUpperCase()} INCLUDES — {offeringsToEvaluate.length} OFFERINGS
          </p>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {offeringsToEvaluate.slice(0, 6).map((o, i) => {
              const course = _courseById.get(o.masterCourseId)
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
                >
                  <span className="font-mono text-xs w-20 shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                    {course?.code ?? '—'}
                  </span>
                  <TruncatedText className="flex-1">{course?.name ?? '—'}</TruncatedText>
                  <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                    {o.enrolledCount} students
                  </span>
                </div>
              )
            })}
            {offeringsToEvaluate.length > 6 && (
              <div className="px-4 py-2 text-xs" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)' }}>
                +{offeringsToEvaluate.length - 6} more offerings
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics placeholder */}
      <div
        className="rounded-lg border px-5 py-6 text-center"
        style={{ borderColor: 'var(--border)', borderStyle: 'dashed', backgroundColor: 'var(--muted)' }}
      >
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Response rates and faculty completion will appear here once evaluations are active.
        </p>
      </div>
    </div>
  )
}
