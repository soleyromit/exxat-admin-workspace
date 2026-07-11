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
// ============================================================================

import { useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import {
  ListPageBoardCard,
  ListPageBoardCardAvatar,
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
import { RESPONSE_TARGET } from '@/lib/pce-term-metrics'
import {
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_FACULTY,
  type PceSurvey,
} from '@/lib/pce-mock-data'

type SetupCard = { id: string; code: string; name: string; facultyName: string | null }

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

function primaryInstructor(s: PceSurvey) {
  return s.instructors.find(i => i.role === 'primary') ?? s.instructors[0] ?? null
}

/* ── cards ──────────────────────────────────────────────────────────────── */

function SurveyBoardCard({ s, href }: { s: PceSurvey; href: string }) {
  const instructor = primaryInstructor(s)
  const extra = s.instructors.length - 1
  const col = SURVEY_COLUMN[s.status]
  const opens = fmtIsoShort(s.openDate)
  const showGauge = col === 'live' || col === 'pending' || col === 'released'
  return (
    /* Stretched-link card (WCAG 2.1.1 — a div onClick is not keyboard
     * operable): the overlay anchor makes the whole card one tab stop with
     * Enter activation and a visible ring. Safe here: survey cards contain
     * no other interactive elements. */
    <ListPageBoardCard className="relative w-full">
      <Link
        href={href}
        aria-label={`Open results for ${s.courseCode}`}
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
          trailing={instructor ? <ListPageBoardCardAvatar initials={instructor.initials} /> : undefined}
        />
      </ListPageBoardCardHeader>
      <ListPageBoardCardBody>
        {instructor && (
          <BoardCardTwoLineBlock
            iconClass="fa-user"
            line1={extra > 0 ? `${instructor.name} +${extra}` : instructor.name}
            line2={s.cohort}
          />
        )}
        {col === 'scheduled' && (
          s.status === 'draft'
            ? <ListPageBoardCardSecondary>Draft — not scheduled yet</ListPageBoardCardSecondary>
            : opens && <BoardCardTwoLineBlock iconClass="fa-calendar-days" line1={`Opens ${opens}`} line2={s.deadline ? `Closes ${s.deadline}` : undefined} />
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
}: {
  /** Term-scoped course evaluations (same rows as the table view). */
  surveys: PceSurvey[]
  termId: string
}) {
  /* Origin param so /results/[id] breadcrumbs back to this term workspace. */
  const resultsHref = (s: PceSurvey) =>
    `/results/${s.id}?from=${encodeURIComponent(`term:${termId}`)}`
  const rows = useMemo<BoardRow[]>(() => {
    const surveyRows: BoardRow[] = surveys.map(s => ({ key: `s-${s.id}`, kind: 'survey', s }))
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
     * prop for them, so hide the dashed placeholder buttons in this scope. */
    <div className="[&_button.border-dashed]:hidden">
      <ListPageBoardTemplate
        columns={columns}
        rows={rows}
        getRowKey={r => r.key}
        columnCountBadgeClassName={badgeMap}
        emptyColumnLabel="No evaluations"
        renderCard={row =>
          row.kind === 'setup'
            ? <SetupBoardCard o={row.o} termId={termId} />
            : <SurveyBoardCard s={row.s} href={resultsHref(row.s)} />
        }
      />
    </div>
  )
}
