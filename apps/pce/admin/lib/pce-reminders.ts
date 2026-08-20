// ── Reminder helpers ──────────────────────────────────────────────────────────
// Shared by the send-reminders wizard (/surveys/remind) and the reminder sheet
// in pce-modals (SendReminderDialog / Popover). Quotes when the last reminder
// went out / when the next scheduled one fires so admins self-govern against
// double-nudging students.

import { MOCK_STUDENTS, EVAL_EMAIL_TEMPLATES } from '@/lib/pce-mock-data'
import type { PceSurvey, Student } from '@/lib/pce-mock-data'

export const REMINDER_TEMPLATES = EVAL_EMAIL_TEMPLATES.filter(t => t.type === 'reminder')

/* Deterministic non-responder roster per survey (mock — responses stay
 * anonymous; completion status is tracked separately, which is what makes
 * targeted reminders possible without de-anonymizing answers). */
function hashStr(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h
}

export function nonRespondersFor(s: PceSurvey): { students: Student[]; count: number } {
  const pool = MOCK_STUDENTS.filter(st => !s.cohort || st.cohort === s.cohort)
  const list = pool.length > 0 ? pool : MOCK_STUDENTS
  const count = Math.max(0, s.enrollmentCount - s.responseCount)
  const start = list.length > 0 ? hashStr(s.id) % list.length : 0
  const students = Array.from(
    { length: Math.min(count, list.length) },
    (_, i) => list[(start + i) % list.length],
  )
  return { students, count }
}

export function daysSinceIso(iso?: string): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const diff = Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86_400_000)
  return diff >= 0 ? diff : null
}

export function daysUntilIso(iso?: string): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const diff = Math.ceil((new Date(y, m - 1, d).getTime() - Date.now()) / 86_400_000)
  return diff >= 0 ? diff : null
}

export const dayPhrase = (n: number, future = false) =>
  n === 0 ? (future ? 'later today' : 'today') : future ? `in ${n} day${n !== 1 ? 's' : ''}` : `${n} day${n !== 1 ? 's' : ''} ago`

/** One-sentence guard rail for a selection of surveys. Null when nothing to say. */
export function reminderGuardrail(surveys: PceSurvey[]): string | null {
  if (surveys.length === 1) {
    const s = surveys[0]
    const last = daysSinceIso(s.lastReminderSentAt)
    const next = daysUntilIso(s.nextScheduledReminderAt)
    if (last != null && next != null)
      return `The last reminder went out ${dayPhrase(last)} and the next scheduled reminder goes out ${dayPhrase(next, true)}.`
    if (last != null) return `The last reminder went out ${dayPhrase(last)}.`
    if (next != null) return `The next scheduled reminder goes out ${dayPhrase(next, true)}.`
    return 'No reminder has been sent for this survey yet.'
  }
  const lastDays = surveys
    .map(s => daysSinceIso(s.lastReminderSentAt))
    .filter((n): n is number => n != null)
  const neverCount = surveys.length - lastDays.length
  if (lastDays.length === 0) return 'None of the selected surveys have been reminded yet.'
  const mostRecent = Math.min(...lastDays)
  const neverPart = neverCount > 0 ? ` ${neverCount} of them ${neverCount === 1 ? 'has' : 'have'} never been reminded.` : ''
  return `The most recent reminder across these courses went out ${dayPhrase(mostRecent)}.${neverPart}`
}
