'use client'

// ============================================================================
// Send-reminders wizard (Jul 10 2026) — the term workspace's Remind flow.
// Built for the many-live-courses case: step 1 lists EVERY live evaluation in
// scope with a master checkbox, so one pass can remind all students at once.
//
//   1. Recipients    — all live courses (live first, status badges, response
//                      gauges, last-reminded context). Default = all selected;
//                      row-level entry (?ids=) pre-checks just that course.
//   2. Email         — which reminder template goes out, with live preview.
//   3. Review & send — reach headline + per-course sections + cadence
//                      guardrail; an ack gate fires when a selected course was
//                      already reminded ≤3 days ago.
//
// Entry: /surveys/remind?ids=<id,id>&from=term:<id>. `from` scopes the course
// list to that term and routes the breadcrumb + success CTA back.
// Layout follows the push wizard: full-bleed steps, controls at readable
// widths, single-row footers (Back left, primary right).
// ============================================================================

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Badge, Button, Card, CardContent, Checkbox, Label, Skeleton,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { TruncatedText } from '@/components/truncated-text'
import { WizardNav } from '@/components/pce/wizard-nav'
import { EmailThumbnail } from '@/components/pce/distribute-wizard/step-communication'
import { EmailTemplateSheet } from '@/components/pce/distribute-wizard/email-template-sheet'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { RESPONSE_TARGET, LIVE, termsOrdered } from '@/lib/pce-term-metrics'
import {
  REMINDER_TEMPLATES, nonRespondersFor, reminderGuardrail, daysSinceIso, dayPhrase,
} from '@/lib/pce-reminders'
import type { PceSurvey } from '@/lib/pce-mock-data'

const STEPS = [
  { n: 1, label: 'Recipients' },
  { n: 2, label: 'Email' },
  { n: 3, label: 'Review & send' },
]

type WizardStep = 1 | 2 | 3 | 'success'

/* Legacy survey courseType → display label (push-wizard type vocabulary). */
const COURSE_TYPE_LABEL: Record<string, string> = {
  didactic: 'Classroom based',
  clinical: 'Practice based',
}

function pendingFor(s: PceSurvey): number {
  return Math.max(0, s.enrollmentCount - s.responseCount)
}

function RemindWizardInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { surveys, sendSurveyReminder } = usePce()

  /* ── origin (breadcrumb + success CTA route back; also scopes the list) ── */
  const from = params?.get('from') ?? ''
  const originTerm = from.startsWith('term:')
    ? termsOrdered.find(t => t.id === from.slice('term:'.length))
    : null
  const origin = originTerm
    ? { label: originTerm.name, href: `/course-evaluation/term/${originTerm.id}` }
    : { label: 'Evaluations', href: '/surveys' }

  const requestedIds = useMemo(() => {
    const raw = params?.get('ids')
    return raw ? new Set(raw.split(',').filter(Boolean)) : null
  }, [params])

  /* ── candidates: live courses that actually NEED a reminder (below the
   * response target), lowest rate first. An explicitly requested id is always
   * included even if on-target — the row dropdown allows reminding any live
   * course. ── */
  const candidates = useMemo(() => {
    const ce = surveys.filter(s => (!s.surveyType || s.surveyType === 'course_evaluation') && LIVE(s))
    const scoped = originTerm ? ce.filter(s => s.term === originTerm.name) : ce
    const needsReminder = scoped.filter(
      s => s.responseRate < RESPONSE_TARGET || (requestedIds?.has(s.id) ?? false),
    )
    return [...needsReminder].sort((a, b) => a.responseRate - b.responseRate)
  }, [surveys, originTerm, requestedIds])

  /* Distinguishes "all on target" from "nothing set up" in the zero state. */
  const termHasEvals = useMemo(() => {
    const ce = surveys.filter(s => !s.surveyType || s.surveyType === 'course_evaluation')
    return originTerm ? ce.some(s => s.term === originTerm.name) : ce.length > 0
  }, [surveys, originTerm])

  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => {
    if (!requestedIds) return new Set()
    return new Set(
      candidates.filter(s => !requestedIds.has(s.id)).map(s => s.id),
    )
  })

  /* ── wizard state ── */
  const [step, setStep] = useState<WizardStep>(1)
  const [templateId, setTemplateId] = useState(REMINDER_TEMPLATES[0]?.id ?? '')
  const [ackRecent, setAckRecent] = useState(false)
  const [sentSummary, setSentSummary] = useState<{ students: number; courses: number } | null>(null)

  /* Email content — seeded from the template, editable per send via the shared
   * EmailTemplateSheet (push-wizard Communication anatomy). */
  const [emailSubject, setEmailSubject] = useState(REMINDER_TEMPLATES[0]?.subject ?? '')
  const [emailBody, setEmailBody] = useState(REMINDER_TEMPLATES[0]?.body ?? '')
  const [emailSheetOpen, setEmailSheetOpen] = useState(false)
  const [testSent, setTestSent] = useState(false)

  const selected = candidates.filter(s => !excludedIds.has(s.id))
  const totalPending = selected.reduce((n, s) => n + pendingFor(s), 0)
  const template = REMINDER_TEMPLATES.find(t => t.id === templateId) ?? REMINDER_TEMPLATES[0]
  const guardrail = selected.length > 0 ? reminderGuardrail(selected) : null
  const isEmailEdited = !!template &&
    (emailSubject !== template.subject || emailBody !== template.body)

  function handleTemplatePick(id: string) {
    setTemplateId(id)
    const t = REMINDER_TEMPLATES.find(x => x.id === id)
    if (t) { setEmailSubject(t.subject); setEmailBody(t.body) }
    setTestSent(false)
  }

  /* Merge-field preview against the first selected course (push resolveMerge). */
  function resolveMerge(text: string): string {
    const first = selected[0]
    return text
      .replace(/\{\{student_first_name\}\}/g, 'Alex')
      .replace(/\{\{course_name\}\}/g, first?.courseCode ?? 'your course')
      .replace(/\{\{close_date\}\}/g, first?.deadline ?? 'the close date')
      .replace(/\{\{days_until_close\}\}/g, '3')
      .replace(/\{\{s\}\}/g, 's')
      .replace(/\{\{program_name\}\}/g, 'your program')
      .replace(/\{\{survey_link\}\}/g, '[ Open survey ]')
  }

  /* Ack gate — anything in the selection nudged within the last 3 days. */
  const recentlyReminded = selected.filter(s => {
    const d = daysSinceIso(s.lastReminderSentAt)
    return d != null && d <= 3
  })
  const needsAck = recentlyReminded.length > 0

  const allSelected = selected.length === candidates.length && candidates.length > 0
  const masterState: boolean | 'indeterminate' =
    allSelected ? true : selected.length === 0 ? false : 'indeterminate'

  function toggle(id: string) {
    setExcludedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setAckRecent(false)
  }

  function toggleAll() {
    setExcludedIds(allSelected ? new Set(candidates.map(s => s.id)) : new Set())
    setAckRecent(false)
  }

  function handleSend() {
    sendSurveyReminder(selected.map(s => s.id))
    setSentSummary({ students: totalPending, courses: selected.length })
    setStep('success')
  }

  const currentStepNum = step === 'success' ? 4 : step
  const completedUpTo = step === 'success' ? 3 : step - 1

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        /* Full trail so every prior page backtracks: Dashboard › {term} › here.
           The term segment only when the reminder is scoped to one. */
        breadcrumbs={
          originTerm
            ? [
                { label: 'Dashboard', href: '/course-evaluation/dashboard' },
                { label: originTerm.name, href: `/course-evaluation/term/${originTerm.id}` },
              ]
            : [{ label: 'Dashboard', href: '/course-evaluation/dashboard' }]
        }
        title="Send reminders"
      />
      <h1 className="sr-only">Send reminders</h1>

      {step !== 'success' && (
        <WizardNav
          currentStep={currentStepNum}
          completedUpTo={completedUpTo}
          onStepClick={(n) => n < currentStepNum && setStep(n as WizardStep)}
          steps={STEPS}
        />
      )}

      <div className="flex-1 overflow-auto flex flex-col" style={{ padding: '32px 40px 0' }}>
        {/* Full-bleed steps — page never capped; only controls get readable widths
            (push-wizard anatomy). min-h fill + mt-auto footers keep the footer at
            the same bottom position on every step instead of floating up under
            short content. */}
        <div className="flex flex-col gap-6 flex-1">
          {/* ── Step 1 · Recipients ── */}
          {step === 1 && (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Recipients
                </h2>
                <p className="text-sm text-muted-foreground">
                  Live evaluations{originTerm ? ` in ${originTerm.name}` : ''} below the{' '}
                  {RESPONSE_TARGET}% response target — only students who haven&rsquo;t responded get
                  the email. Responses stay anonymous; completion status is tracked separately.
                </p>
              </div>

              {candidates.length === 0 ? (
                /* Two different zero states: a term with NO evaluations is not
                 * "all on target" — it needs setup, not congratulation. */
                termHasEvals ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/25 px-6 py-12">
                    <i className="fa-light fa-bell-slash text-3xl text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      Every live evaluation is at or above the {RESPONSE_TARGET}% target — nothing needs a reminder right now.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={origin.href}>Back to {origin.label}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/25 px-6 py-12">
                    <i className="fa-light fa-calendar-plus text-3xl text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      {originTerm ? `${originTerm.name} has` : 'This scope has'} no evaluations yet — set them up before sending reminders.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={origin.href}>Back to {origin.label}</Link>
                      </Button>
                      <Button variant="default" size="sm" asChild>
                        <Link href={`/surveys/push${originTerm ? `?term=${originTerm.id}` : ''}`}>
                          Set up evaluations
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  {/* Master row — select / clear every course at once */}
                  <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/40 border-b border-border">
                    <Checkbox
                      id="remind-all"
                      checked={masterState}
                      onCheckedChange={toggleAll}
                      aria-label="Select all courses"
                    />
                    <Label htmlFor="remind-all" className="text-xs font-medium cursor-pointer">
                      {selected.length} of {candidates.length} course{candidates.length !== 1 ? 's' : ''} selected
                    </Label>
                    <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                      {totalPending} student{totalPending !== 1 ? 's' : ''} will be emailed
                    </span>
                  </div>
                  {candidates.map((s, i) => {
                    const checked = !excludedIds.has(s.id)
                    const pending = pendingFor(s)
                    const lastDays = daysSinceIso(s.lastReminderSentAt)
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-4 px-4 py-3 ${i === candidates.length - 1 ? '' : 'border-b border-border'}`}
                      >
                        <Checkbox
                          id={`remind-${s.id}`}
                          checked={checked}
                          onCheckedChange={() => toggle(s.id)}
                          aria-label={`Include ${s.courseCode}`}
                        />
                        <Label htmlFor={`remind-${s.id}`} className="flex-1 min-w-0 flex flex-col items-start gap-0.5 font-normal cursor-pointer">
                          <span className="text-sm font-medium">{s.courseCode}</span>
                          <TruncatedText className="text-xs text-muted-foreground">{s.courseName}</TruncatedText>
                        </Label>
                        {s.courseType && (
                          <Badge variant="outline" className="font-normal whitespace-nowrap shrink-0">
                            {COURSE_TYPE_LABEL[s.courseType] ?? s.courseType}
                          </Badge>
                        )}
                        <SurveyStatusBadgeOS status={s.status} />
                        <div style={{ width: 170 }} className="shrink-0">
                          <ResponseProgressCell
                            rate={s.responseRate}
                            responseCount={s.responseCount}
                            enrollmentCount={s.enrollmentCount}
                            target={RESPONSE_TARGET}
                            detail="pct"
                          />
                        </div>
                        <div className="w-36 shrink-0 text-right">
                          <p className="text-sm tabular-nums font-medium">{pending} pending</p>
                          <p className="text-xs text-muted-foreground">
                            {lastDays != null ? `Reminded ${dayPhrase(lastDays)}` : 'Never reminded'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {candidates.length > 0 && (
                <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
                  <Button variant="outline" size="sm" asChild>
                    {/* Cancel abandons the wizard → module home (matches term-setup).
                        The breadcrumb, not Cancel, backtracks to the term. */}
                    <Link href="/course-evaluation/dashboard">Cancel</Link>
                  </Button>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {totalPending} student{totalPending !== 1 ? 's' : ''} across {selected.length} course{selected.length !== 1 ? 's' : ''}
                    </p>
                    <Button variant="default" size="sm" disabled={selected.length === 0 || totalPending === 0} onClick={() => setStep(2)}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Step 2 · Email — same card anatomy as the push wizard's
                 Communication step (thumbnail · title · purpose · template
                 select · resolved subject · From/reach · Edit + test) ── */}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Email
                </h2>
                <p className="text-sm text-muted-foreground">
                  What the {totalPending} non-responder{totalPending !== 1 ? 's' : ''} will receive.
                </p>
              </div>

              <div style={{ maxWidth: 640 }}>
                <Card className="overflow-hidden shadow-none">
                  <CardContent className="flex items-center gap-4" style={{ padding: 16 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1"
                      onClick={() => setEmailSheetOpen(true)}
                      aria-label="Preview and edit the reminder email"
                    >
                      <EmailThumbnail />
                    </Button>

                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <p className="text-sm font-semibold">Send reminder</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Sent immediately to students who haven&rsquo;t responded. Choose a template.
                      </p>

                      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 6 }}>
                        <Select value={templateId} onValueChange={handleTemplatePick}>
                          <SelectTrigger
                            aria-label="Choose reminder template"
                            className="gap-1.5 font-semibold"
                            style={{ height: 32, width: 220 }}
                          >
                            <SelectValue placeholder="Choose a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {REMINDER_TEMPLATES.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isEmailEdited && (
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>· Edited for this send</span>
                        )}
                      </div>

                      <p className="text-sm truncate" style={{ marginTop: 2 }} title={resolveMerge(emailSubject)}>
                        <span style={{ color: 'var(--muted-foreground)' }}>Subject: </span>
                        {resolveMerge(emailSubject) || 'Reminder: your evaluation closes soon'}
                      </p>

                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        From Exxat Surveys · {totalPending} non-responder{totalPending !== 1 ? 's' : ''} across {selected.length} course{selected.length !== 1 ? 's' : ''}
                      </p>

                      <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
                        <Button variant="outline" size="sm" onClick={() => setEmailSheetOpen(true)}>Edit</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setTestSent(true)}
                          disabled={testSent}
                        >
                          {testSent ? (
                            <>
                              <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--chart-2)' }} />
                              Test sent to you
                            </>
                          ) : 'Send test to me'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>Back</Button>
                <Button variant="default" size="sm" disabled={!template} onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* ── Step 3 · Review & send ── */}
          {step === 3 && (
            <>
              {/* Headline — push-review anatomy: reach sentence, guardrail under it */}
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Review &amp; send
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sending to{' '}
                  <span className="font-medium text-foreground">
                    {totalPending} student{totalPending !== 1 ? 's' : ''}
                  </span>{' '}
                  across{' '}
                  <span className="font-medium text-foreground">
                    {selected.length} course{selected.length !== 1 ? 's' : ''}
                  </span>
                  {' '}· one email per non-responder, sent immediately.
                </p>
                {guardrail && <p className="text-sm text-muted-foreground">{guardrail}</p>}
              </div>

              {/* Sections — hairline-band grid, Edit links back to their step */}
              <div className="grid grid-cols-1 gap-x-10 gap-y-4 lg:grid-cols-2">
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Recipients</h3>
                    <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground" onClick={() => setStep(1)}>
                      Edit
                    </Button>
                  </div>
                  {selected.map(s => {
                    const { count } = nonRespondersFor(s)
                    return (
                      <div key={s.id} className="flex items-baseline justify-between gap-3 text-sm">
                        <p className="min-w-0 truncate">
                          <span className="font-medium">{s.courseCode}</span>
                          <span className="text-muted-foreground"> — {s.courseName}</span>
                        </p>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {count} of {s.enrollmentCount} pending
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Email</h3>
                    <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground" onClick={() => setStep(2)}>
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)', width: 92 }}>Template</span>
                    <span className="min-w-0">
                      {template?.name}
                      {isEmailEdited && <span className="text-xs text-muted-foreground"> · edited</span>}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)', width: 92 }}>Subject</span>
                    <span className="min-w-0 truncate">{resolveMerge(emailSubject)}</span>
                  </div>
                </div>
              </div>

              {/* Ack gate — double-nudge guard (push-review AckGroup anatomy) */}
              {needsAck && (
                <div className="flex items-start gap-2.5 border-t border-border pt-4">
                  <i
                    className="fa-regular fa-circle-exclamation text-xs"
                    aria-hidden="true"
                    style={{ color: 'var(--insight-severity-warning-fg)', marginTop: 4 }}
                  />
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">Recently reminded</span>
                      <span className="text-xs text-muted-foreground">
                        {recentlyReminded.slice(0, 3).map(s => s.courseCode).join(', ')}
                        {recentlyReminded.length > 3 ? ` +${recentlyReminded.length - 3} more` : ''}{' '}
                        already got a reminder in the last 3 days.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Checkbox
                        id="remind-ack"
                        checked={ackRecent}
                        onCheckedChange={(v) => setAckRecent(v === true)}
                      />
                      <Label htmlFor="remind-ack" className="text-xs font-normal cursor-pointer">
                        Send another reminder anyway <span style={{ color: 'var(--destructive)' }}>*</span>
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>Back</Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={totalPending === 0 || (needsAck && !ackRecent)}
                  onClick={handleSend}
                >
                  Send {totalPending} email{totalPending !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}

          {/* ── Success ── */}
          {step === 'success' && sentSummary && (
            <div className="flex min-h-[min(360px,50vh)] flex-col items-center justify-center gap-3">
              <i className="fa-light fa-circle-check text-3xl" aria-hidden="true" style={{ color: 'var(--pce-status-released-fg)' }} />
              <div className="flex flex-col items-center gap-1">
                <h2 className="text-sm font-medium text-foreground">Reminders sent</h2>
                <p className="text-sm text-muted-foreground" style={{ maxWidth: 380, textAlign: 'center' }}>
                  {sentSummary.students} student{sentSummary.students !== 1 ? 's' : ''} across{' '}
                  {sentSummary.courses} course{sentSummary.courses !== 1 ? 's' : ''} will get the email shortly.
                </p>
              </div>
              <Button variant="default" size="sm" onClick={() => router.push(origin.href)}>
                Back to {origin.label}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview/edit — the same sheet the push wizard's Communication step uses. */}
      <EmailTemplateSheet
        open={emailSheetOpen}
        onOpenChange={setEmailSheetOpen}
        templateType="reminder"
        templateId={templateId}
        subject={emailSubject}
        body={emailBody}
        senderName="Exxat Surveys"
        onSave={(subject, body, _sender, tid) => {
          setEmailSubject(subject)
          setEmailBody(body)
          setTemplateId(tid)
          setTestSent(false)
        }}
      />
    </div>
  )
}

export default function RemindPage() {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" aria-label="Loading send reminders" className="flex flex-col flex-1 gap-6" style={{ padding: '32px 40px' }}>
          <h1 className="sr-only">Send reminders</h1>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" style={{ maxWidth: 760 }} />
        </div>
      }
    >
      <RemindWizardInner />
    </Suspense>
  )
}
