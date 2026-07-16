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
import { useRouter } from 'next/navigation'
import {
  Button,
  PageHeader,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
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

  const router = useRouter()

  /* One table, grouped by lifecycle — Romit (2026-07-16): "most of the row based should be
     a datatable instead of status based rows." The Apr-21 lifecycle groups survive as the
     table's grouping; the sentence-headline layer moved into the per-row columns (the
     nearest deadline is each row's Closes cell). */
  interface FacultyRow extends Record<string, unknown> {
    id: string
    survey: PceSurvey
    group: FacultyGroup
    courseCode: string
    status: string
    responseRate: number
    when: string
  }
  const rows = useMemo<FacultyRow[]>(
    () =>
      mine.map((s) => ({
        id: s.id,
        survey: s,
        group: groupOf(s),
        courseCode: s.courseCode,
        status: s.status,
        responseRate: s.responseRate,
        when: groupOf(s) === 'scheduled' ? (s.openDate ?? '') : (s.deadline ?? ''),
      })),
    [mine],
  )

  const columns = useMemo<ColumnDef<FacultyRow>[]>(
    () => [
      {
        key: 'courseCode', label: 'Course', sortable: true,
        cell: (row) => {
          const role = myRoleOn(row.survey, facultyId ?? '')
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.survey.courseCode} — {row.survey.courseName}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {row.survey.term}
                {row.survey.cohort ? ` · ${row.survey.cohort}` : ''}
                {role ? ` · You’re the ${role === 'coordinator' ? 'course coordinator' : 'instructor'}` : ''}
              </p>
            </div>
          )
        },
      },
      {
        key: 'status', label: 'Status', sortable: true, width: 150,
        cell: (row) => <SurveyStatusBadge status={row.survey.status} />,
      },
      {
        key: 'responseRate', label: 'Response', sortable: true, width: 190,
        cell: (row) =>
          row.group === 'live' ? (
            <ResponseProgressCell
              rate={row.survey.responseRate}
              responseCount={row.survey.responseCount}
              enrollmentCount={row.survey.enrollmentCount}
              target={RESPONSE_TARGET}
              detail="full"
            />
          ) : row.group === 'scheduled' ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <span className="text-xs tabular-nums text-muted-foreground">
              {row.survey.responseCount} of {row.survey.enrollmentCount} · {row.survey.responseRate}%
            </span>
          ),
      },
      {
        key: 'when', label: 'Closes / opens', sortable: true, width: 130,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.group === 'scheduled'
              ? row.survey.openDate
                ? `Opens ${row.survey.openDate}`
                : 'Not open yet'
              : row.survey.deadline || '—'}
          </span>
        ),
      },
      {
        key: 'actions', label: '', resizable: false, width: 300,
        cell: (row) => {
          const live = row.group === 'live'
          return (
            <div className="flex items-center justify-end gap-2">
              {row.group === 'pending_release' && (
                <span className="text-xs text-muted-foreground">Waiting on your program admin</span>
              )}
              {live && (
                /* Icon + explicit label — Romit 2026-07-16: "QR code can have an icon and
                   can be explicit as label 'Show QR Code'". */
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setQrSurvey(row.survey) }}>
                  <i className="fa-light fa-qrcode" aria-hidden="true" />
                  Show QR Code
                </Button>
              )}
              {live && canExtend(row.survey, facultyId ?? '') && (
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setExtendSurvey(row.survey) }}>
                  Extend close date
                </Button>
              )}
              {row.group === 'results' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  View result
                  <i className="fa-light fa-chevron-right" aria-hidden="true" />
                </span>
              )}
            </div>
          )
        },
      },
    ],
    [facultyId],
  )

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
        {mine.length === 0 ? (
          <EmptyFaculty term={term} linked={!!facultyId} />
        ) : (
          <DataTable<FacultyRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            searchable
            defaultGroupBy="group"
            groupLabels={FACULTY_GROUP_LABEL}
            groupOrder={FACULTY_GROUP_ORDER as unknown as string[]}
            onRowClick={(row) => {
              if (row.group === 'results') {
                router.push(`/results/${encodeURIComponent(`${row.survey.id}:${facultyId ?? ''}`)}`)
              }
            }}
            toolbarSlot={() => null}
          />
        )}
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


/* ── Rows ─────────────────────────────────────────────────────────────────── */


/** Live / pending / scheduled — carries actions, so it is NOT a link. */


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

