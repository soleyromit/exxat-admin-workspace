'use client'

// ONE anatomy for "what are this existing survey's communication rules" —
// shared by push step 2 (dup rows) and step 3 (the Already-messaging rail).
// Per-survey rules are legal and expected; this surface is visibility, never
// unification (Decisions/pce/2026-07-27-communication-rules-visibility).
//
// Mock flows were pushed under the program defaults, so those ARE their
// rules; the per-survey reminder timestamps are real fields. When the
// backend stores per-survey template choices, only commRulesOfSurvey changes.

import type { ReactNode } from 'react'
import { Button, Popover, PopoverContent, PopoverTrigger } from '@exxatdesignux/ui'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { SurveyStatusDateBadgeOS } from '@/components/pce/pce-badges'
import {
  EVAL_EMAIL_TEMPLATES, EVAL_REMINDER_CADENCE,
  REMINDER_FREQUENCY_LABELS, REMINDER_ANCHOR_LABELS,
  type PceSurvey, type SurveyStatus, type ReminderFrequency, type ReminderAnchor,
} from '@/lib/pce-mock-data'

export type CommCadence = { frequency: ReminderFrequency; anchor: ReminderAnchor; startDaysBefore: number }

export type CommRules = {
  inviteTemplate: string
  sender: string
  reminderTemplate: string
  /** "Dec 7" — next cadence send, when the survey is live. */
  nextReminder?: string
  /** "Jul 4" — last manual out-of-schedule nudge, if any. */
  lastManualNudge?: string
}

export type CommEvaluatee = { scope: 'course' | 'person'; personName?: string }

function fmtDay(iso?: string): string | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** The existing survey's rule set (program defaults + its real reminder facts). */
export function commRulesOfSurvey(s: PceSurvey): CommRules {
  return {
    inviteTemplate: EVAL_EMAIL_TEMPLATES.find(t => t.type === 'invitation')?.name ?? 'Invitation',
    sender: 'Exxat Surveys',
    reminderTemplate: EVAL_EMAIL_TEMPLATES.find(t => t.type === 'reminder')?.name ?? 'Reminder',
    nextReminder: fmtDay(s.nextScheduledReminderAt),
    lastManualNudge: fmtDay(s.lastReminderSentAt),
  }
}

export const commCadenceOfSurvey = (s: PceSurvey): CommCadence =>
  s.reminderCadence ?? EVAL_REMINDER_CADENCE

/** "until Dec 18" — deadline is already a display string ("Dec 18, 2026"). */
export function commUntilOfSurvey(s: PceSurvey): string | undefined {
  return s.deadline ? `until ${s.deadline.replace(/, \d{4}$/, '')}` : undefined
}

/** Evaluatee mark — PersonAvatar for people, the book disc for course material
 *  (same vocabulary as the Survey design rows). */
const MARK_SIZE = {
  5: { avatar: 'size-5', icon: 'text-[9px]' },
  7: { avatar: 'size-7', icon: 'text-[11px]' },
} as const
export function EvaluateeMark({ evaluatee, size = 5 }: { evaluatee: CommEvaluatee; size?: 5 | 7 }) {
  const s = MARK_SIZE[size]
  return evaluatee.scope === 'person' && evaluatee.personName ? (
    <PersonAvatar name={evaluatee.personName} className={s.avatar} />
  ) : (
    <span className={`${s.avatar} rounded-full flex items-center justify-center shrink-0 border border-border bg-background`}>
      <i className={`fa-light fa-book-open ${s.icon} text-muted-foreground`} aria-hidden="true" />
    </span>
  )
}

export const evaluateeLabel = (e: CommEvaluatee) =>
  e.scope === 'person' ? (e.personName ?? 'Faculty') : 'Course material'

/**
 * The rules popover. `evaluatees` with one entry = a single flow; more =
 * same-course flows sharing one rule set (the roster renders inside).
 */
export function CommRulesPopover({
  courseCode, courseName, evaluatees, status, openDate, untilLabel, cadence, rules,
  trigger,
}: {
  courseCode: string
  courseName?: string
  evaluatees: CommEvaluatee[]
  status: SurveyStatus
  openDate?: string
  untilLabel?: string
  cadence: CommCadence
  rules: CommRules
  /** Custom trigger node; defaults to a quiet "View rules" ghost button. */
  trigger?: ReactNode
}) {
  const single = evaluatees.length === 1
  const rows: [string, string][] = [
    ['Invitation', `${rules.inviteTemplate} · from ${rules.sender}`],
    ['Reminder email', rules.reminderTemplate],
    ['Cadence', `${REMINDER_FREQUENCY_LABELS[cadence.frequency]}, starting ${cadence.startDaysBefore} days before ${REMINDER_ANCHOR_LABELS[cadence.anchor].toLowerCase()}${untilLabel ? ` · ${untilLabel}` : ''}`],
    ...(rules.nextReminder ? ([['Next reminder', rules.nextReminder]] as [string, string][]) : []),
    ...(rules.lastManualNudge ? ([['Last manual nudge', rules.lastManualNudge]] as [string, string][]) : []),
  ]
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`View communication rules for ${courseCode}${single ? ` · ${evaluateeLabel(evaluatees[0])}` : ''}`}
          >
            View rules
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0" aria-label={`Communication rules for ${courseCode}`}>
        {/* Header — who this survey evaluates + where it stands. */}
        <div className="flex items-center gap-2.5 px-4 py-3">
          {single && <EvaluateeMark evaluatee={evaluatees[0]} size={7} />}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">
              {courseCode}
              {single ? ` · ${evaluateeLabel(evaluatees[0])}` : courseName ? ` · ${courseName}` : ''}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {single
                ? (courseName ?? 'Existing evaluation')
                : `${evaluatees.length} evaluations share these rules`}
            </p>
          </div>
          <span className="shrink-0">
            <SurveyStatusDateBadgeOS status={status} openDate={openDate} />
          </span>
        </div>

        {/* Grouped flows: the roster the shared rules apply to. */}
        {!single && (
          <div className="flex flex-col gap-1.5 px-4 pb-3">
            {evaluatees.map((e, i) => (
              <span key={i} className="flex items-center gap-2 text-sm min-w-0">
                <EvaluateeMark evaluatee={e} size={5} />
                <span className="truncate">{evaluateeLabel(e)}</span>
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-border" />

        <div className="flex flex-col gap-2.5 px-4 py-3">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3 text-sm">
              <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)', width: 104 }}>{k}</span>
              <span className="min-w-0">{v}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
