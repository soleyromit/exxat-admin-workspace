/**
 * CSV export for the analytics tabs.
 *
 * The header Export button had no `onClick` — it rendered, it looked live, and it did
 * nothing. A dead control is worse than a missing one: the user spends a click and a moment
 * of confusion discovering the affordance lied. (Same reason the Faculty Role filter did not
 * get built — every offering is role:'primary', so it would have been a dropdown with one
 * option.) So: make it real or delete it. This makes it real.
 *
 * ONE ROW = ONE OFFERING, on every tab. The tabs are five questions asked of one grain, and
 * the offering IS that grain — every KPI, dot and line in this feature derives from
 * `offeringPoints()`. Exporting the grain rather than each tab's rendered aggregate means the
 * CSV can be re-aggregated any way the reader needs, and it cannot disagree with the charts
 * the way a separately-computed export inevitably would. That "numbers disagree" bug is the
 * one this whole layer exists to end; an export is just another view that could drift.
 *
 * WHAT THE SCOPE DOES. The export honours the tab's current scope, because exporting the
 * whole program from a screen filtered to one faculty member is a lie of omission — the
 * reader believes they exported what they were looking at.
 *
 * FERPA — this is aggregate evaluation data (offering-level means and counts). It carries no
 * student identifiers and no verbatims. Comments are deliberately NOT exported: they are
 * free text students wrote believing it went to a review process, and a CSV is a file that
 * travels. Suppression below MINIMUM_THRESHOLD is preserved, so a 2-respondent offering
 * exports its counts but not a score that could re-identify.
 */

import { offeringPoints, type OfferingPoint } from '@/lib/pce-analytics'
// Same constant the on-screen register suppresses by (analytics-survey-details.tsx) — imported,
// not re-declared, so the CSV and the table can never disagree about who is suppressed.
import { MINIMUM_THRESHOLD } from '@/lib/pce-results'

export type ExportScope =
  | { tab: 'overview' }
  | { tab: 'faculty'; facultyId?: string; term?: string }
  | { tab: 'course'; courseCode?: string }
  | { tab: 'term'; term?: string }

/**
 * RFC 4180: wrap in quotes when the value contains a comma, quote or newline, and double any
 * inner quote. Course names carry commas ("Human Anatomy, Advanced") and a naive join would
 * silently shift every column after it — the kind of corruption nobody notices until the
 * numbers are already in a report.
 */
function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
}

/** The offerings this scope is actually looking at. */
export function scopedOfferings(scope: ExportScope): OfferingPoint[] {
  const all = offeringPoints()
  switch (scope.tab) {
    case 'faculty':
      return all.filter(
        (o) =>
          (!scope.facultyId || o.facultyId === scope.facultyId) &&
          (!scope.term || o.term === scope.term),
      )
    case 'course':
      return all.filter((o) => !scope.courseCode || o.courseCode === scope.courseCode)
    case 'term':
      return all.filter((o) => !scope.term || o.term === scope.term)
    default:
      return all
  }
}

const HEADERS = [
  'Faculty',
  'Course code',
  'Course name',
  'Term',
  'Cohort',
  'Enrolled',
  'Responded',
  'Response rate (%)',
  'Faculty score',
  'Course score',
  'Suppressed',
]

export function offeringsCsv(scope: ExportScope): string {
  const rows = scopedOfferings(scope)
    // Stable order — a diffable export. Re-exporting after no change must produce an
    // identical file, or nobody can tell what actually moved between two downloads.
    .slice()
    .sort(
      (a, b) =>
        a.term.localeCompare(b.term) ||
        a.facultyName.localeCompare(b.facultyName) ||
        a.courseCode.localeCompare(b.courseCode),
    )
    .map((o) => {
      // Below the threshold the counts still export — "we asked 8, 2 answered" is the fact
      // that explains the gap — but the scores do not, because a mean over 2 respondents in
      // a named course is close to reading their answers back.
      const suppressed = o.responded < MINIMUM_THRESHOLD
      return [
        o.facultyName,
        o.courseCode,
        o.courseName,
        o.term,
        o.cohort ?? '',
        o.enrolled,
        o.responded,
        o.enrolled > 0 ? Math.round((o.responded / o.enrolled) * 100) : 0,
        suppressed ? '' : o.avgRating.toFixed(2),
        // `courseAvg` is optional on the record — an offering with no content score is a
        // different fact from a suppressed one, and both are blank cells here. The
        // Suppressed column is what distinguishes them, which is why it exists.
        suppressed || o.courseAvg === undefined ? '' : o.courseAvg.toFixed(2),
        suppressed ? `below ${MINIMUM_THRESHOLD}-response threshold` : '',
      ]
    })
  return toCsv(HEADERS, rows)
}

/** `pce-analytics-faculty-anita-patel-2026-07-14.csv` — scope and date in the name. */
export function exportFilename(scope: ExportScope, label?: string, today?: string): string {
  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const parts = ['pce-analytics', scope.tab]
  if (label) parts.push(slug(label))
  // Date passed in, never `new Date()` here — a pure function is testable and this module
  // has no business reading the clock.
  if (today) parts.push(today)
  return `${parts.join('-')}.csv`
}

/**
 * Trigger the download. Blob + object URL, revoked after — a data: URL truncates at a few MB
 * in some browsers and 53 offerings is small today but the grain grows every term.
 */
export function downloadCsv(filename: string, csv: string): void {
  // \uFEFF as an escape, not a literal BOM character in the source — a literal one does not
  // survive every editor/tool round-trip, and I shipped exactly that: the first version wrote
  // the char inline and the emitted blob came back with hasBOM:false. Without it Excel on
  // Windows reads UTF-8 as Latin-1 and mangles every accented name in the faculty column.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
