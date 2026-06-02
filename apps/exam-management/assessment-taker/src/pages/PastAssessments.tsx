/**
 * PAST ASSESSMENTS — Aarti's "secondary tab" landing for completed work.
 *
 * Shows the student's full assessment history with:
 *   - Course context (Aarti's most-explicit ExamSoft complaint)
 *   - Score with performance tier color
 *   - Cohort comparison (your score vs cohort median)
 *   - Quick actions: view results, enter review session, message faculty
 *   - Filter by course / sort by date or score
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge, Button,
  InputGroup, InputGroupAddon, InputGroupInput,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@exxat/ds/packages/ui/src'

// ─── Mock past-assessment dataset (richer than dashboard's small set) ───────
type PastEntry = {
  id: string
  title: string
  courseCode: string
  courseName: string
  type: 'quiz' | 'midterm' | 'final' | 'practical'
  publishedDate: string  // ISO
  score: number
  cohortMedian: number
  passingScore: number
  facultyName: string
  reviewSessionEndsAt?: string  // ISO — if set + future, review still available
  hasFacultyMessage?: boolean
}

const PAST_ASSESSMENTS: PastEntry[] = [
  { id: 'p1',  title: 'Microbiology — Unit 2 Assessment', courseCode: 'MICRO 401', courseName: 'Medical Microbiology',         type: 'midterm',   publishedDate: '2026-04-25', score: 84, cohortMedian: 76, passingScore: 70, facultyName: 'Dr. Priya Nair',     reviewSessionEndsAt: '2026-05-08', hasFacultyMessage: true },
  { id: 'p2',  title: 'Pharmacology — Module 2 Quiz',     courseCode: 'PHARM 502', courseName: 'Clinical Pharmacology',         type: 'quiz',      publishedDate: '2026-04-18', score: 92, cohortMedian: 81, passingScore: 70, facultyName: 'Prof. Anand Kumar' },
  { id: 'p3',  title: 'Anatomy — Cardiovascular Quiz',     courseCode: 'ANAT 601',  courseName: 'Advanced Clinical Anatomy',     type: 'quiz',      publishedDate: '2026-04-10', score: 78, cohortMedian: 74, passingScore: 70, facultyName: 'Dr. Meera Pillai' },
  { id: 'p4',  title: 'Pathology — Inflammation Quiz',     courseCode: 'PATH 503',  courseName: 'General Pathology',             type: 'quiz',      publishedDate: '2026-04-02', score: 67, cohortMedian: 75, passingScore: 70, facultyName: 'Dr. Eric Hoffman',   hasFacultyMessage: true },
  { id: 'p5',  title: 'Pharmacology — Module 1 Quiz',     courseCode: 'PHARM 502', courseName: 'Clinical Pharmacology',         type: 'quiz',      publishedDate: '2026-03-26', score: 88, cohortMedian: 80, passingScore: 70, facultyName: 'Prof. Anand Kumar' },
  { id: 'p6',  title: 'Anatomy — Musculoskeletal Quiz',    courseCode: 'ANAT 601',  courseName: 'Advanced Clinical Anatomy',     type: 'quiz',      publishedDate: '2026-03-19', score: 81, cohortMedian: 77, passingScore: 70, facultyName: 'Dr. Meera Pillai' },
  { id: 'p7',  title: 'Microbiology — Unit 1 Assessment', courseCode: 'MICRO 401', courseName: 'Medical Microbiology',         type: 'midterm',   publishedDate: '2026-03-12', score: 74, cohortMedian: 72, passingScore: 70, facultyName: 'Dr. Priya Nair' },
  { id: 'p8',  title: 'Anatomy — Neuroanatomy Practical',  courseCode: 'ANAT 601',  courseName: 'Advanced Clinical Anatomy',     type: 'practical', publishedDate: '2026-03-04', score: 90, cohortMedian: 79, passingScore: 80, facultyName: 'Dr. Meera Pillai' },
  { id: 'p9',  title: 'Clinical Skills — Mid-term',        courseCode: 'CLIN 301',  courseName: 'Clinical Skills I',             type: 'midterm',   publishedDate: '2026-02-25', score: 85, cohortMedian: 78, passingScore: 75, facultyName: 'Prof. Marcus Lee' },
  { id: 'p10', title: 'Pathology — Cellular Injury Quiz',  courseCode: 'PATH 503',  courseName: 'General Pathology',             type: 'quiz',      publishedDate: '2026-02-18', score: 73, cohortMedian: 76, passingScore: 70, facultyName: 'Dr. Eric Hoffman' },
]

const TYPE_LABELS: Record<PastEntry['type'], string> = {
  quiz: 'Quiz', midterm: 'Midterm', final: 'Final', practical: 'Practical',
}

function tone(score: number) {
  if (score >= 80) return { fg: 'var(--foreground)', circleFg: 'var(--state-success-dark)',   bg: 'var(--state-success-bg-soft)',  label: 'Strong',    labelFg: 'var(--state-success-dark)'    }
  if (score >= 70) return { fg: 'var(--foreground)', circleFg: 'var(--state-info-blue-dark)', bg: 'var(--state-info-blue-bg)',     label: 'On track',  labelFg: 'var(--state-info-blue-dark)'  }
  if (score >= 60) return { fg: 'var(--foreground)', circleFg: 'var(--state-warning-dark)',   bg: 'var(--state-warning-bg-soft)',  label: 'Needs work', labelFg: 'var(--state-warning-dark)'   }
  return                 { fg: 'var(--foreground)',  circleFg: 'var(--state-error-text-dark)', bg: 'var(--state-error-bg-soft)',   label: 'At risk',   labelFg: 'var(--state-error-text-dark)' }
}

export function PastAssessments() {
  const navigate = useNavigate()
  const [query, setQuery]       = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [sort, setSort]         = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'>('date-desc')

  const courseOptions = useMemo(() => {
    const set = new Set(PAST_ASSESSMENTS.map(a => `${a.courseCode}|${a.courseName}`))
    return Array.from(set).map(c => c.split('|') as [string, string])
  }, [])

  const filtered = useMemo(() => {
    let list = PAST_ASSESSMENTS.filter(a => {
      const q = query.trim().toLowerCase()
      const courseMatches = courseFilter === 'all' || a.courseCode === courseFilter
      const queryMatches = !q ||
        a.title.toLowerCase().includes(q) ||
        a.courseCode.toLowerCase().includes(q) ||
        a.courseName.toLowerCase().includes(q)
      return courseMatches && queryMatches
    })
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'date-asc':   return a.publishedDate.localeCompare(b.publishedDate)
        case 'date-desc':  return b.publishedDate.localeCompare(a.publishedDate)
        case 'score-asc':  return a.score - b.score
        case 'score-desc': return b.score - a.score
      }
    })
    return list
  }, [query, courseFilter, sort])

  // Cumulative summary (across all visible)
  const summary = useMemo(() => {
    if (filtered.length === 0) return null
    const avg = Math.round(filtered.reduce((s, a) => s + a.score, 0) / filtered.length)
    const best = Math.max(...filtered.map(a => a.score))
    const worst = Math.min(...filtered.map(a => a.score))
    const aboveCohort = filtered.filter(a => a.score >= a.cohortMedian).length
    return { count: filtered.length, avg, best, worst, aboveCohort }
  }, [filtered])

  return (
    <div className="flex flex-1 flex-col px-6 py-6 gap-5" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-5">

        {/* ─── Page header ───────────────────────────────────────────── */}
        <header className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight font-heading">Past Assessments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your completed assessments across all courses, with cohort comparisons.
            </p>
          </div>
        </header>

        {/* ─── Summary strip ─────────────────────────────────────────── */}
        {summary && (
          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
            <SummaryTile icon="fa-list-check" label="Assessments" value={String(summary.count)} />
            <SummaryTile icon="fa-percent"     label="Average score"
              value={`${summary.avg}%`} valueColor={tone(summary.avg).fg} />
            <SummaryTile icon="fa-trophy"      label="Best"  value={`${summary.best}%`}  valueColor="var(--state-success-dark)" />
            <SummaryTile icon="fa-people-group" label="Above cohort" value={`${summary.aboveCohort} of ${summary.count}`} />
          </div>
        )}

        {/* ─── Toolbar ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <InputGroup className="w-full max-w-sm">
            <InputGroupAddon align="inline-start">
              <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search by title or course…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search past assessments"
            />
          </InputGroup>

          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[200px]" aria-label="Filter by course">
              <i className="fa-light fa-graduation-cap me-2" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courseOptions.map(([code, name]) => (
                <SelectItem key={code} value={code}>{code} · {name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-[180px]" aria-label="Sort order">
              <i className="fa-light fa-arrow-down-wide-short me-2" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest first</SelectItem>
              <SelectItem value="date-asc">Oldest first</SelectItem>
              <SelectItem value="score-desc">Highest score</SelectItem>
              <SelectItem value="score-asc">Lowest score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ─── Past list ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <i className="fa-light fa-folder-open text-3xl text-muted-foreground mb-2" aria-hidden="true" />
              <p className="font-medium text-foreground">No past assessments match your filters</p>
              <p className="text-sm text-muted-foreground mt-1">Try clearing the search or course filter.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(a => <PastRow key={a.id} a={a} onView={() => navigate(`/exam/${a.id}/results`)} onMessage={() => navigate(`/exam/${a.id}/chat`)} />)}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Summary tile ───────────────────────────────────────────────────────────
function SummaryTile({
  icon, label, value, valueColor,
}: {
  icon: string
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div
      className="rounded-xl border border-border px-4 py-3 flex items-center gap-3"
      style={{ background: 'var(--card)' }}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: 'var(--brand-tint)',
          color: 'var(--brand-color)',
        }}
      >
        <i className={`fa-light ${icon}`} aria-hidden="true" style={{ fontSize: 14 }} />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-base font-bold tabular-nums" style={{ color: valueColor ?? 'var(--foreground)' }}>{value}</span>
      </div>
    </div>
  )
}

// ─── Past assessment row ────────────────────────────────────────────────────
function PastRow({
  a, onView, onMessage,
}: {
  a: PastEntry
  onView: () => void
  onMessage: () => void
}) {
  const t = tone(a.score)
  const delta = a.score - a.cohortMedian
  const deltaPositive = delta >= 0
  const reviewOpen = a.reviewSessionEndsAt && new Date(a.reviewSessionEndsAt) > new Date()
  const date = new Date(a.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <li className="px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
      {/* Score circle */}
      <div
        className="flex flex-col items-center justify-center size-14 rounded-full shrink-0 border-2"
        style={{
          background: t.bg,
          borderColor: t.circleFg,
          color: t.fg,
        }}
        aria-hidden="true"
      >
        <span className="text-base font-bold tabular-nums leading-none">{a.score}</span>
        <span className="text-xs font-bold mt-0.5">pct</span>
      </div>

      {/* Title + course */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate font-heading">{a.title}</p>
          <Badge
            variant="secondary"
            className="rounded font-mono text-xs"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            {TYPE_LABELS[a.type]}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-light fa-graduation-cap" aria-hidden="true" />
            <strong className="text-foreground">{a.courseCode}</strong>
            <span>·</span>
            <span>{a.courseName}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-light fa-user" aria-hidden="true" />
            {a.facultyName}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-light fa-calendar" aria-hidden="true" />
            {date}
          </span>
        </div>
      </div>

      {/* Cohort delta + tier label */}
      <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0 w-32">
        <span className="text-xs font-medium" style={{ color: t.labelFg }}>{t.label}</span>
        <span
          className="text-xs font-mono tabular-nums"
          style={{ color: deltaPositive ? 'var(--state-success-dark)' : 'var(--state-error-text-dark)' }}
          title={`Cohort median: ${a.cohortMedian}%`}
        >
          <i className={`fa-light ${deltaPositive ? 'fa-arrow-up' : 'fa-arrow-down'} me-1`} aria-hidden="true" style={{ fontSize: 12 }} />
          {deltaPositive ? '+' : ''}{delta} vs cohort
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {reviewOpen && (
          <Button variant="outline" size="sm" onClick={() => {/* navigate review */}} className="gap-1.5 text-xs hidden lg:inline-flex">
            <i className="fa-light fa-eye" aria-hidden="true" />
            Review session
          </Button>
        )}
        {a.hasFacultyMessage && (
          <Button variant="outline" size="sm" onClick={onMessage} className="gap-1.5 text-xs hidden lg:inline-flex" aria-label="Message faculty">
            <i className="fa-light fa-envelope" aria-hidden="true" />
            Message
          </Button>
        )}
        <Button variant="default" size="sm" onClick={onView} className="gap-1.5 text-xs">
          <i className="fa-light fa-arrow-right" aria-hidden="true" />
          View
        </Button>
      </div>
    </li>
  )
}
