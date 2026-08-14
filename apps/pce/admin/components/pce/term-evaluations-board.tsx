'use client'

// ============================================================================
// Term evaluations kanban (Jul 10 2026) — board view of the term workspace's
// evaluation list, columns = lifecycle stage (reference: Romit's Spring 2026
// board mock). Composes the vendored DS board suite (ListPageBoardTemplate +
// ListPageBoardCard parts) exactly like library-board-view.tsx — no one-off
// card markup. Response cells = ResponseProgressCell (DS ProgressCell anatomy, no
// bar — never red/green raw hex like the reference).
//
// Columns: No survey configured (term offerings without an evaluation — cards
// deep-link into the push wizard scoped to that offering) · Scheduled (+drafts)
// · Live · Closed · Pending review · Results available.
//
// 2026-08-13 (Granola 0ef80c33, Vishal, raw transcript: "not in every case
// you'll be seeing all these different rows, the breakups... it should be
// just available and just directly say point out that this is the response
// rate right now") — ONE card per offering now, not one per evaluation type.
// This file's own prior comment on BoardRow said the per-type split existed
// specifically "so the board and the table agree" — now that the table
// collapsed to one row per offering (term-workspace.tsx, same date), keeping
// this per-type would have recreated that exact mismatch in the other
// direction. Faculty now renders via the shared FacultyAvatarRow (also used
// by the table) so both views show identity identically, not just similarly.
// ============================================================================

import { useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import {
  ListPageBoardCard,
  ListPageBoardCardBody,
  ListPageBoardCardHeader,
  ListPageBoardCardSecondary,
  ListPageBoardCardTitleRow,
} from '@/components/data-views/list-page-board-card'
import { BoardCardTwoLineBlock } from '@/components/data-views/board-card-primitives'
import {
  ListPageBoardTemplate,
  type ListPageBoardColumnDef,
} from '@/components/data-views/list-page-board-template'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { FacultyAvatarRow } from '@/components/pce/faculty-avatar-row'
import { RESPONSE_TARGET } from '@/lib/pce-term-metrics'
import { withFrom } from '@/lib/pce-nav-origin'
import { expandInstances } from '@/lib/pce-push-validation'
import {
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_FACULTY, MOCK_TEMPLATES,
  type PceSurvey,
} from '@/lib/pce-mock-data'

/** Aug 4 transcript scenario #6 — a Draft/re-editable Scheduled survey is
 *  still mid-setup; its card must route back into the push wizard to resume,
 *  never to a results page for a survey that hasn't collected anything.
 *  Resumability rides on `wizardDraft` itself (pce-mock-data.ts:422-428:
 *  present on Draft rows and on Scheduled rows re-saved after being pulled
 *  in for editing; cleared on a normal full submit) — not on status alone,
 *  since most Scheduled rows finish the wizard in one pass and have nothing
 *  to resume into. */
function isResumable(s: PceSurvey): boolean {
  return !!s.wizardDraft
}

/** Aug 4 transcript scenario #9 — "how do we show this user scenario... so
 *  that user knows only David is evaluating, there is another person called
 *  John but is not being evaluated." PM: "it's a good idea to show somewhere
 *  outside also... in the list view." This reuses the exact reconciliation
 *  the wizard itself runs (fresh, non-conflicting instances checked against
 *  the saved unitSelections) rather than a new computation.
 *  Only meaningful where `wizardDraft` survives (see isResumable) — a fully
 *  submitted survey's Auto Update snapshot is gone by design, so the board
 *  honestly shows nothing there instead of fabricating a stale count. */
function excludedCount(s: PceSurvey, surveys: PceSurvey[]): number {
  if (!s.wizardDraft) return 0
  const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === s.offeringId)
  const template = MOCK_TEMPLATES.find(t => t.id === s.templateId)
  if (!offering || !template) return 0
  const instances = expandInstances(offering, template, surveys, MOCK_TEMPLATES)
  const { unitSelections } = s.wizardDraft
  return instances.filter(i => i.status === 'new' && unitSelections[i.key] === 'deselected').length
}

type SetupCard = { id: string; code: string; name: string; facultyName: string | null }

/* One card = one offering's evaluation (see file header, 2026-08-13). */
type BoardRow =
  | { key: string; kind: 'survey'; s: PceSurvey }
  | { key: string; kind: 'setup'; o: SetupCard }

type ColumnId = 'no_survey' | 'scheduled' | 'live' | 'pending' | 'released'

const SURVEY_COLUMN: Record<PceSurvey['status'], ColumnId> = {
  draft: 'scheduled',
  scheduled: 'scheduled',
  active: 'live',
  collecting: 'live',
  pending_review: 'pending',
  closed: 'pending',
  released: 'released',
}

/* Neutral count chips on every column (library-board precedent) — the column
 * label already names the stage; coloring counts would re-encode it. */
const NEUTRAL_COUNT_BADGE = 'bg-muted/90 text-foreground'

const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'no_survey', label: 'No survey configured' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'live',      label: 'Live' },
  { id: 'pending',   label: 'Closed · Pending review' },
  { id: 'released',  label: 'Results available' },
]

function columnOf(row: BoardRow): ColumnId {
  return row.kind === 'setup' ? 'no_survey' : SURVEY_COLUMN[row.s.status]
}

function fmtIsoShort(iso?: string): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ── cards ──────────────────────────────────────────────────────────────── */

function SurveyBoardCard({
  s, href, resumable, excluded, evalClose,
}: {
  s: PceSurvey
  href: string
  /** Scenario #6 — routes this card into the wizard instead of results. */
  resumable: boolean
  /** Scenario #9 — fresh Prism people this survey's saved state excludes. 0
   *  when unresumable (nothing to reconcile against, see excludedCount). */
  excluded: number
  /** Term's standard close date — same extension check as the table
   *  (term-workspace.tsx), so a card and its row agree on which offerings
   *  are non-standard. */
  evalClose?: string
}) {
  const col = SURVEY_COLUMN[s.status]
  const opens = fmtIsoShort(s.openDate)
  const showGauge = col === 'live' || col === 'pending' || col === 'released'
  const closeTime = evalClose ? new Date(evalClose).getTime() : NaN
  const deadlineTime = s.deadline ? new Date(s.deadline).getTime() : NaN
  const extended = Number.isFinite(closeTime) && Number.isFinite(deadlineTime) && deadlineTime > closeTime
  return (
    /* Stretched-link card (WCAG 2.1.1 — a div onClick is not keyboard
     * operable): the overlay anchor makes the whole card one tab stop with
     * Enter activation and a visible ring. Safe here: survey cards contain
     * no other interactive elements. */
    <ListPageBoardCard className="relative w-full">
      <Link
        href={href}
        aria-label={resumable ? `Resume setup for ${s.courseCode}` : `Open results for ${s.courseCode}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <ListPageBoardCardHeader>
        <ListPageBoardCardTitleRow
          title={(
            <span className="block">
              <span className="block font-mono text-xs font-normal text-muted-foreground">{s.courseCode}</span>
              <span className="line-clamp-2">{s.courseName}</span>
            </span>
          )}
        />
      </ListPageBoardCardHeader>
      <ListPageBoardCardBody>
        {s.instructors.length > 0 && <FacultyAvatarRow instructors={s.instructors} />}
        {col === 'scheduled' && (
          s.status === 'draft'
            ? <ListPageBoardCardSecondary>Draft — resume setup</ListPageBoardCardSecondary>
            : resumable
              ? <ListPageBoardCardSecondary>Scheduled — resume setup to review</ListPageBoardCardSecondary>
              : opens && <BoardCardTwoLineBlock iconClass="fa-calendar-days" line1={`Opens ${opens}`} line2={s.deadline ? `Closes ${s.deadline}${extended ? ' · Extended' : ''}` : undefined} />
        )}
        {/* #9 — neutral, not amber: this isn't a data gap to fix, it's an FYI
            about a deliberate Auto-Update-off exclusion (same non-amber
            reasoning as the excluded-avatar treatment in Step 2 itself). */}
        {excluded > 0 && (
          <BoardCardTwoLineBlock
            iconClass="fa-ban"
            line1={`${excluded} ${excluded === 1 ? 'person' : 'people'} not included`}
          />
        )}
        {showGauge && extended && (
          <ListPageBoardCardSecondary>
            <i className="fa-solid fa-star text-[10px] me-1" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
            Extended past {evalClose}
          </ListPageBoardCardSecondary>
        )}
        {showGauge && (
          <ResponseProgressCell
            rate={s.responseRate}
            responseCount={s.responseCount}
            enrollmentCount={s.enrollmentCount}
            target={RESPONSE_TARGET}
            className="w-full max-w-none"
          />
        )}
        {col === 'released' && (
          <ListPageBoardCardSecondary>Released to faculty</ListPageBoardCardSecondary>
        )}
      </ListPageBoardCardBody>
    </ListPageBoardCard>
  )
}

function SetupBoardCard({ o, termId }: { o: SetupCard; termId: string }) {
  return (
    <ListPageBoardCard className="w-full">
      <ListPageBoardCardHeader>
        <ListPageBoardCardTitleRow
          title={(
            <span className="block">
              <span className="block font-mono text-xs font-normal text-muted-foreground">{o.code}</span>
              <span className="line-clamp-2">{o.name}</span>
            </span>
          )}
        />
      </ListPageBoardCardHeader>
      <ListPageBoardCardBody>
        {o.facultyName && <BoardCardTwoLineBlock iconClass="fa-user" line1={o.facultyName} />}
        <div>
          {/* Spec'd DS variant — no padding/color overrides (Romit flag). */}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/surveys/push?term=${termId}&offerings=${o.id}`}>
              Set up survey
            </Link>
          </Button>
        </div>
      </ListPageBoardCardBody>
    </ListPageBoardCard>
  )
}

/* ── board ──────────────────────────────────────────────────────────────── */

export function TermEvaluationsBoard({
  surveys,
  termId,
  evalClose,
}: {
  /** Term-scoped course evaluations (same rows as the table view). */
  surveys: PceSurvey[]
  termId: string
  /** Term's standard close date (term-workspace.tsx's evalWindow(term).close)
   *  — for the same per-card extension flag the table shows. Optional so a
   *  caller without the term object (none today) still renders correctly,
   *  just without the flag. */
  evalClose?: string
}) {
  /* Canonical results link (pce-nav-origin.withFrom) — breadcrumbs back to this
   * term workspace. Offering-level today; per-type results is a future route. */
  const resultsHref = (s: PceSurvey) => withFrom(`/results/${s.id}`, `term:${termId}`)
  /* Scenario #6 — same resume URL shape SetupBoardCard already uses below;
   * push/page.tsx's Phase 3 hydration effect rehydrates the saved
   * templateAssignments/unitSelections/autoUpdateOn from wizardDraft once
   * this offering is selected, so nothing further is needed here to make
   * "resume" actually resume. */
  const resumeHref = (s: PceSurvey) => `/surveys/push?term=${termId}&offerings=${s.offeringId}`
  const rows = useMemo<BoardRow[]>(() => {
    const surveyRows: BoardRow[] = surveys.map(s => ({ key: `s-${s.id}`, kind: 'survey' as const, s }))
    /* Offerings in this term without ANY evaluation. Unlike coverageFor(),
     * drafts count here — a draft card already sits in the Scheduled column,
     * so listing the course under "No survey configured" too would duplicate it. */
    const surveyedCodes = new Set(surveys.map(s => s.courseCode))
    const setupRows: BoardRow[] = MOCK_COURSE_OFFERINGS
      .filter(o => o.termId === termId && o.status !== 'archived')
      .flatMap(o => {
        const course = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)
        if (!course || surveyedCodes.has(course.code)) return []
        const faculty = MOCK_FACULTY.find(f => f.id === o.primaryFacultyId)
        return [{
          key: `o-${o.id}`,
          kind: 'setup' as const,
          o: { id: o.id, code: course.code, name: course.name, facultyName: faculty?.name ?? null },
        }]
      })
    return [...setupRows, ...surveyRows]
  }, [surveys, termId])

  const columns = useMemo<ListPageBoardColumnDef<BoardRow>[]>(
    () => COLUMNS.map(c => ({
      id: c.id,
      label: c.label,
      filter: (r: BoardRow) => columnOf(r) === c.id,
    })),
    [],
  )
  const badgeMap = useMemo(
    () => Object.fromEntries(COLUMNS.map(c => [c.id, NEUTRAL_COUNT_BADGE])),
    [],
  )

  return (
    /* The template's "+ New card" placeholders don't apply here — cards derive
     * from offerings/surveys, not free-form adds — and the template exposes no
     * prop for them, so hide the dashed placeholder buttons in this scope.
     *
     * The DS HorizontalScrollRegion centers its scroll arrows (`self-center`),
     * which is right for a short KPI strip but floats them in the vertical
     * middle of this tall board. Pin the control group to the top-right so it
     * sits alongside the column headers. Scoped here (not the DS) so the KPI
     * strip's centered arrows are unaffected. */
    <div className="[&_button.border-dashed]:hidden [&_[data-slot=horizontal-scroll-controls]]:self-start">
      <ListPageBoardTemplate
        columns={columns}
        rows={rows}
        getRowKey={r => r.key}
        columnCountBadgeClassName={badgeMap}
        emptyColumnLabel="No evaluations"
        renderCard={row => {
          if (row.kind === 'setup') return <SetupBoardCard o={row.o} termId={termId} />
          const resumable = isResumable(row.s)
          return (
            <SurveyBoardCard
              s={row.s}
              href={resumable ? resumeHref(row.s) : resultsHref(row.s)}
              resumable={resumable}
              excluded={excludedCount(row.s, surveys)}
              evalClose={evalClose}
            />
          )
        }}
      />
    </div>
  )
}
