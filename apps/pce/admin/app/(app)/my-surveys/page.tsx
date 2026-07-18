'use client'

/**
 * /my-surveys — the FACULTY HOME.
 *
 * The job (Apr 21 prototype walk-through, Dr. Robert): "I log into course
 * evaluation. I see my surveys. Active surveys, inactive surveys, closed
 * surveys." One glance answers: which of my courses still need my students to
 * respond, and what can I act on right now?
 *
 * Why the live group shows a response rate (Apr 21, David): "I'd get emails
 * saying, hey, only 30 of your students have responded and this closes in two
 * days. Make sure you tell your students to complete the survey." Faculty see
 * the RATE while open — never the content, and never who did or didn't respond.
 *
 * Copy is the settled faculty-side wording, which differs from admin's:
 *   "Results available"      — faculty (May 28: "makes sense for a faculty view")
 *   "Pending admin release"  — faculty (Apr 21: grade language explicitly killed)
 *
 * DS OS: PageHeader (owns the h1) · DataRowList · ListHubStatusBadge ·
 * ResponseProgressCell. No red — the gauge carries amber/teal (aarti_no_red).
 * Rows with actions are NOT links (no nested interactives); rows that open a
 * destination are links and carry no buttons.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  DataRowList,
  PageHeader,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { SurveyQrDialog } from '@/components/pce/survey-qr-dialog'
import { EditEndDateDialog } from '@/components/pce/pce-modals'
import { RESPONSE_TARGET, daysUntil } from '@/lib/pce-term-metrics'
import {
  mySurveys,
  groupOf,
  myRoleOn,
  canExtend,
  facultyExtensionBound,
  EXTENSION_BOUND_COPY,
  FACULTY_GROUP_ORDER,
  FACULTY_GROUP_LABEL,
  type FacultyGroup,
  type FacultyCourseRole,
} from '@/lib/pce-faculty'
import { MOCK_TERMS, type PceSurvey } from '@/lib/pce-mock-data'

/* No Suspense boundary: this page reads no search params, so there is nothing to
 * suspend on. The old one existed only for `useSearchParams` (the `?filter=released`
 * entry point, now unreferenced — My Results has its own route). Keeping it left a
 * hidden copy of the fallback's PageHeader in the DOM — a second, hidden <h1>. */
export default function MySurveysPage() {
  const { surveys, user } = usePce()
  const facultyId = user.facultyId
  const [term, setTerm] = useState('Spring 2026')
  const [qrSurvey, setQrSurvey] = useState<PceSurvey | null>(null)
  const [extendSurvey, setExtendSurvey] = useState<PceSurvey | null>(null)
  const extendBound = extendSurvey ? facultyExtensionBound(extendSurvey) ?? undefined : undefined

  /* No facultyId = this account isn't linked to a faculty record, so there is
   * nothing it could legitimately be shown. Fail closed, not open. */
  const mine = useMemo(
    () => (facultyId ? mySurveys(surveys, facultyId).filter((s) => s.term === term) : []),
    [surveys, facultyId, term],
  )

  const grouped = useMemo(() => {
    const g = new Map<FacultyGroup, PceSurvey[]>()
    for (const s of mine) {
      const k = groupOf(s)
      g.set(k, [...(g.get(k) ?? []), s])
    }
    return g
  }, [mine])

  const termSelect = (
    <Select value={term} onValueChange={setTerm}>
      <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by term">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MOCK_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
      </SelectContent>
    </Select>
  )

  return (
    <>
      <SiteHeader title="My Surveys" />
      <PageHeader
        title="My Surveys"
        subtitle="Your assigned courses and their evaluation status."
        actions={termSelect}
      />

      <div className="flex-1 overflow-auto px-7 py-4">
        {/* max-w-5xl, not 3xl: a row here carries title + badge + gauge + up to two
            actions. At 3xl (the simpler My Results width) the title wrapped to two
            lines and pushed the badge under it, while ~700px sat empty to the right. */}
        <div className="flex flex-col gap-8 max-w-5xl">
          {mine.length === 0 ? (
            <EmptyFaculty term={term} linked={!!facultyId} />
          ) : (
            FACULTY_GROUP_ORDER.map((group) => {
              const rows = grouped.get(group)
              if (!rows || rows.length === 0) return null
              return (
                <section key={group} aria-label={FACULTY_GROUP_LABEL[group]}>
                  <h2 className="text-sm font-medium">{FACULTY_GROUP_LABEL[group]}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    {groupHeadline(group, rows)}
                  </p>
                  <DataRowList<PceSurvey>
                    rows={rows}
                    getRowId={(s) => s.id}
                    renderRow={(s) =>
                      group === 'results' ? (
                        <ResultRow survey={s} />
                      ) : (
                        <StatusRow
                          survey={s}
                          group={group}
                          facultyId={facultyId ?? ''}
                          onShowQr={() => setQrSurvey(s)}
                          onExtend={() => setExtendSurvey(s)}
                        />
                      )
                    }
                  />
                </section>
              )
            })
          )}
        </div>
      </div>

      <SurveyQrDialog
        open={!!qrSurvey}
        onOpenChange={(v) => !v && setQrSurvey(null)}
        survey={qrSurvey}
      />
      {/* The ceiling's REASON has to follow whichever bound actually binds —
          the policy window and the release date are different limits with
          different explanations. */}
      <EditEndDateDialog
        open={!!extendSurvey}
        onOpenChange={(v) => !v && setExtendSurvey(null)}
        surveys={extendSurvey ? [extendSurvey] : []}
        maxDate={extendBound?.date}
        maxDateReason={extendBound ? EXTENSION_BOUND_COPY[extendBound.reason] : undefined}
        requireNotify
      />
    </>
  )
}

/* ── Group headlines ──────────────────────────────────────────────────────
 * A count is a claim without evidence — each heading is a full sentence that
 * names scope + the nearest deadline, so the row list below is the proof.
 */
function groupHeadline(group: FacultyGroup, rows: PceSurvey[]): string {
  const n = rows.length
  const courses = `${n} ${n === 1 ? 'course' : 'courses'}`
  if (group === 'live') {
    const soonest = rows
      .map((s) => ({ s, d: daysUntil(s.deadline) }))
      .filter((x): x is { s: PceSurvey; d: number } => x.d !== null)
      .sort((a, b) => a.d - b.d)[0]
    const tail = soonest
      ? soonest.d < 0
        ? ` · ${soonest.s.courseCode} is past its close date`
        : soonest.d === 0
          ? ` · ${soonest.s.courseCode} closes today`
          : ` · ${soonest.s.courseCode} closes in ${soonest.d} ${soonest.d === 1 ? 'day' : 'days'}`
      : ''
    return `${courses} still collecting responses${tail}.`
  }
  if (group === 'pending_release') {
    return `${courses} closed — your program admin reviews comments before results reach you.`
  }
  if (group === 'results') {
    return `${courses} with results you can open.`
  }
  return `${courses} not open to students yet.`
}

/* ── Rows ─────────────────────────────────────────────────────────────────── */

/** Truncating title + badge that never wraps under it — the settled card title
 *  anatomy (term triptych: truncating title left, StatusBadge holding its line).
 *
 *  `role` rides the meta line because it describes MY relationship to this course,
 *  which is identity, not action. It also quietly explains why a coordinator's row
 *  offers "Extend close date" and an instructor's doesn't. It was briefly a
 *  "Coordinator only" note in the action column — sat next to "Show QR" and read
 *  as if it gated the QR button, which is false: any assigned faculty can show
 *  the code. */
function CourseIdentity({ survey, role }: { survey: PceSurvey; role: FacultyCourseRole }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-sm font-medium truncate">
          {survey.courseCode} — {survey.courseName}
        </p>
        <div className="shrink-0">
          <SurveyStatusBadge status={survey.status} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">
        {survey.term}
        {survey.academicYear ? ` · AY ${survey.academicYear}` : ''}
        {survey.cohort ? ` · ${survey.cohort}` : ''}
        {role ? ` · You’re the ${role === 'coordinator' ? 'course coordinator' : 'instructor'}` : ''}
      </p>
    </div>
  )
}

/** Live / pending / scheduled — carries actions, so it is NOT a link. */
function StatusRow({
  survey,
  group,
  facultyId,
  onShowQr,
  onExtend,
}: {
  survey: PceSurvey
  group: FacultyGroup
  facultyId: string
  onShowQr: () => void
  onExtend: () => void
}) {
  const live = group === 'live'
  const showExtend = live && canExtend(survey, facultyId)
  const role = myRoleOn(survey, facultyId)

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 mb-2">
      <CourseIdentity survey={survey} role={role} />

      {live && (
        <div className="shrink-0 w-44">
          <ResponseProgressCell
            rate={survey.responseRate}
            responseCount={survey.responseCount}
            enrollmentCount={survey.enrollmentCount}
            target={RESPONSE_TARGET}
            detail="full"
          />
        </div>
      )}

      {/* Fixed width + justify-end so the gauge column lines up down the list —
          with an auto-width action area, a row with two buttons pushed its gauge
          left of its neighbour's and the column read as ragged. */}
      <div className="shrink-0 w-[248px] flex items-center justify-end gap-2">
        {group === 'pending_release' && (
          <span className="text-xs text-muted-foreground">Waiting on your program admin</span>
        )}
        {group === 'scheduled' && (
          <span className="text-xs text-muted-foreground">
            {survey.openDate ? `Opens ${survey.openDate}` : 'Not open yet'}
          </span>
        )}
        {live && (
          <Button variant="outline" size="sm" onClick={onShowQr}>
            Show QR
          </Button>
        )}
        {showExtend && (
          <Button variant="outline" size="sm" onClick={onExtend}>
            Extend close date
          </Button>
        )}
      </div>
    </div>
  )
}

/** Released — the whole row opens the result, so it carries no buttons.
 *  Result id is `${surveyId}:${facultyId}` (courseOffering × faculty) and the
 *  terminal re-checks access; this link is navigation, never authorisation. */
function ResultRow({ survey }: { survey: PceSurvey }) {
  const { user } = usePce()
  const resultId = `${survey.id}:${user.facultyId}`
  const role = myRoleOn(survey, user.facultyId ?? '')
  return (
    <Link
      href={`/results/${encodeURIComponent(resultId)}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 mb-2 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <CourseIdentity survey={survey} role={role} />
      <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {survey.responseCount} of {survey.enrollmentCount} responded · {survey.responseRate}%
      </p>
      <i className="fa-light fa-chevron-right text-muted-foreground shrink-0" aria-hidden="true" />
    </Link>
  )
}

/* ── States ───────────────────────────────────────────────────────────────── */

function EmptyFaculty({ term, linked }: { term: string; linked: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 rounded-lg border border-dashed border-border bg-muted/25">
      <i className="fa-light fa-paper-plane text-2xl text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">
        {linked
          ? `No courses assigned to you in ${term}`
          : 'Your account isn’t linked to a faculty record'}
      </p>
      <p className="text-xs text-muted-foreground max-w-[340px] text-center">
        {linked
          ? 'Pick another term, or contact your program administrator if you expected a course here.'
          : 'Contact your program administrator to link your account before evaluations can appear.'}
      </p>
    </div>
  )
}

