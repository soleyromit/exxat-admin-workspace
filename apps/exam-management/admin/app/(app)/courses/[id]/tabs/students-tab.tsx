'use client'

/**
 * STUDENTS TAB — course-scoped student roster with enrollment.
 *
 * Aarti's email: "Students registered for that course" as one of the four sections.
 * Entry point for course-first registration: Course detail → Students → Enroll Student.
 * (Student-first path: Student detail → Courses tab → Add to Course.)
 *
 * Surfaces:
 *   - Per-student average across course assessments
 *   - At-risk flagging (bottom-20%) for intervention
 *   - Accommodation chip when applicable
 *   - Enroll Student sheet — search all students, add to this course
 */

import { useState, useMemo, useEffect } from 'react'
import {
  Avatar, AvatarFallback,
  Button, InputGroup, InputGroupAddon, InputGroupInput,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Separator,
  Tip,
} from '@exxatdesignux/ui'
import { StatusPill, MetricBar } from '@/components/faculty-ui-kit'
import { StubButton } from '@/components/stub-button'
import { facultyStudents, type Student, type Accommodation } from '@/lib/faculty-mock-data'

interface StudentsTabProps {
  students: Student[]
  courseId: string
  accommodations: Accommodation[]
}

type FilterState = 'all' | 'at-risk' | 'top-performer' | 'with-accommodation'

// ── Add Student Sheet ────────────────────────────────────────────────────────

interface AddStudentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrolledIds: Set<string>
  onEnroll: (student: Student) => void
}

function AddStudentSheet({ open, onOpenChange, enrolledIds, onEnroll }: AddStudentSheetProps) {
  const [search, setSearch] = useState('')
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set())

  const available = useMemo(
    () => facultyStudents.filter((s) => !enrolledIds.has(s.id)),
    [enrolledIds]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return available
    return available.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.cohort.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    )
  }, [available, search])

  function handleEnroll(s: Student) {
    onEnroll(s)
    setJustAdded((prev) => new Set(prev).add(s.id))
  }

  function handleClose() {
    onOpenChange(false)
    setSearch('')
    setJustAdded(new Set())
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        showOverlay={false}
        showCloseButton
        style={{ width: 480, maxWidth: '100vw', display: 'flex', flexDirection: 'column' }}
      >
        <SheetHeader>
          <SheetTitle>Enroll Student</SheetTitle>
          <SheetDescription>
            Search and add students to this course offering.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4 pb-3 shrink-0">
          <div
            className="flex items-center gap-2 rounded-md border px-3"
            style={{ borderColor: 'var(--border-control-35)', height: 36 }}
          >
            <i
              className="fa-light fa-magnifying-glass text-muted-foreground shrink-0"
              aria-hidden="true"
              style={{ fontSize: 13 }}
            />
            <input
              type="search"
              placeholder="Search by name, student ID, or cohort…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search students to enroll"
              autoFocus
            />
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <i
                className="fa-light fa-user-slash text-muted-foreground text-2xl mb-3"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-foreground">No students available</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'No results match your search.' : 'All students are already enrolled.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1" role="list">
              {filtered.map((s) => {
                const added = justAdded.has(s.id)
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar style={{ width: 36, height: 36, flexShrink: 0 }} aria-hidden="true">
                      <AvatarFallback
                        className="text-xs font-bold"
                        style={{
                          backgroundColor: 'var(--muted)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {s.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.studentId} · {s.cohort}
                      </p>
                    </div>
                    {added ? (
                      <span
                        className="text-xs font-medium shrink-0 flex items-center gap-1"
                        style={{ color: 'var(--qb-status-saved-fg)' }}
                      >
                        <i className="fa-light fa-circle-check" aria-hidden="true" />
                        Enrolled
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs"
                        onClick={() => handleEnroll(s)}
                      >
                        Enroll
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function StudentsTab({ students, courseId, accommodations }: StudentsTabProps) {
  const [localStudents, setLocalStudents] = useState<Student[]>(students)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterState>('all')
  const [sheetOpen, setSheetOpen] = useState(false)

  // Sync when parent refreshes (e.g. route change with same component mounted)
  useEffect(() => { setLocalStudents(students) }, [students])

  const accByStudent = useMemo(() => {
    const m = new Map<string, Accommodation[]>()
    for (const a of accommodations) {
      if (!m.has(a.studentId)) m.set(a.studentId, [])
      m.get(a.studentId)!.push(a)
    }
    return m
  }, [accommodations])

  const enrolledIds = useMemo(
    () => new Set(localStudents.map((s) => s.id)),
    [localStudents]
  )

  const filtered = useMemo(() => {
    return localStudents.filter(s => {
      const matchQuery = !query ||
        s.firstName.toLowerCase().includes(query.toLowerCase()) ||
        s.lastName.toLowerCase().includes(query.toLowerCase()) ||
        s.studentId.toLowerCase().includes(query.toLowerCase())
      if (filter === 'all') return matchQuery
      if (filter === 'at-risk') return matchQuery && s.status === 'at-risk'
      if (filter === 'top-performer') return matchQuery && s.status === 'top-performer'
      if (filter === 'with-accommodation') return matchQuery && accByStudent.has(s.id)
      return matchQuery
    })
  }, [localStudents, query, filter, accByStudent])

  const atRiskCount = localStudents.filter(s => s.status === 'at-risk').length
  const topCount = localStudents.filter(s => s.status === 'top-performer').length
  const withAcc = localStudents.filter(s => accByStudent.has(s.id)).length

  function handleEnroll(student: Student) {
    setLocalStudents((prev) => {
      if (prev.some((s) => s.id === student.id)) return prev
      return [...prev, { ...student, enrolledCourseIds: [...student.enrolledCourseIds, courseId] }]
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Roster summary strip */}
      <section className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        <RosterTile icon="fa-users" label="Enrolled" value={localStudents.length} tone="brand" active={filter === 'all'} onClick={() => setFilter('all')} />
        <RosterTile icon="fa-triangle-exclamation" label="At-risk" value={atRiskCount} tone="warning" sub="Bottom 20% by avg" active={filter === 'at-risk'} onClick={() => setFilter('at-risk')} />
        <RosterTile icon="fa-trophy" label="Top performers" value={topCount} tone="success" sub="Top 20% by avg" active={filter === 'top-performer'} onClick={() => setFilter('top-performer')} />
        <RosterTile icon="fa-universal-access" label="With accommodation" value={withAcc} tone="info" active={filter === 'with-accommodation'} onClick={() => setFilter('with-accommodation')} />
      </section>

      {/* Toolbar */}
      <section className="flex items-center gap-3 flex-wrap">
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon align="inline-start">
            <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search by name or student ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterState)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            <SelectItem value="at-risk">At-risk only</SelectItem>
            <SelectItem value="top-performer">Top performers</SelectItem>
            <SelectItem value="with-accommodation">With accommodation</SelectItem>
          </SelectContent>
        </Select>
        <span className="ms-auto text-xs text-muted-foreground">
          {filtered.length} of {localStudents.length} students
        </span>
        <StubButton variant="outline" size="sm" className="gap-1.5">
          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
          Export
        </StubButton>
        <Button size="sm" className="gap-1.5" onClick={() => setSheetOpen(true)}>
          <i className="fa-light fa-plus" aria-hidden="true" />
          Enroll Student
        </Button>
      </section>

      {/* Roster table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border grid-cols-[32px_minmax(220px,2fr)_110px_100px_110px_60px]">
          <div></div>
          <div>Student</div>
          <div>Cohort</div>
          <div>Avg score</div>
          <div>Last activity</div>
          <div></div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-foreground">
              {localStudents.length === 0 ? 'No students enrolled yet' : 'No students match this filter'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {localStudents.length === 0
                ? 'Use "Enroll Student" to add students to this course.'
                : 'Try adjusting your search.'}
            </p>
            {localStudents.length === 0 && (
              <Button size="sm" className="mt-3 gap-1.5" onClick={() => setSheetOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Enroll Student
              </Button>
            )}
          </div>
        ) : (
          filtered.map(s => (
            <StudentRow
              key={s.id}
              student={s}
              accommodations={accByStudent.get(s.id) ?? []}
              courseId={courseId}
            />
          ))
        )}
      </div>

      <AddStudentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        enrolledIds={enrolledIds}
        onEnroll={handleEnroll}
      />
    </div>
  )
}

// ─── Roster tone classes ────────────────────────────────────────────────────
const TILE_TONE: Record<'brand' | 'info' | 'warning' | 'success', {
  iconBg: string; iconFg: string; valueFg: string; activeBg: string; activeBorder: string
}> = {
  brand:   { iconBg: 'bg-brand/12',     iconFg: 'text-brand-dark',   valueFg: 'text-brand-dark',   activeBg: 'bg-brand/7',     activeBorder: 'border-brand/40' },
  info:    { iconBg: 'bg-chart-1/14',   iconFg: 'text-chart-1',      valueFg: 'text-chart-1',      activeBg: 'bg-chart-1/7',   activeBorder: 'border-chart-1/40' },
  warning: { iconBg: 'bg-chart-4/16',   iconFg: 'text-chart-4',      valueFg: 'text-chart-4',      activeBg: 'bg-chart-4/8',   activeBorder: 'border-chart-4/40' },
  success: { iconBg: 'bg-chart-2/16',   iconFg: 'text-chart-2',      valueFg: 'text-chart-2',      activeBg: 'bg-chart-2/8',   activeBorder: 'border-chart-2/40' },
}

function RosterTile({
  icon, label, value, tone, sub, active, onClick,
}: {
  icon: string; label: string; value: number; tone: 'brand' | 'info' | 'warning' | 'success'
  sub?: string; active: boolean; onClick: () => void
}) {
  const t = TILE_TONE[tone]
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      aria-pressed={active}
      className={`text-start rounded-xl border bg-card px-4 py-3 flex items-center justify-start gap-3 h-auto whitespace-normal hover:shadow-md hover:-translate-y-0.5 ${active ? `${t.activeBg} ${t.activeBorder}` : 'border-border'}`}
    >
      <div className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${t.iconBg}`}>
        <i className={`fa-light ${icon} ${t.iconFg} text-sm`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-lg font-bold ${t.valueFg}`}>{value}</span>
          {sub && <span className="text-[10px] text-muted-foreground truncate">{sub}</span>}
        </div>
      </div>
    </Button>
  )
}

// ─── Student row ────────────────────────────────────────────────────────────
function StudentRow({
  student, accommodations, courseId,
}: {
  student: Student; accommodations: Accommodation[]; courseId: string
}) {
  const score = student.avgScore[courseId] ?? 0
  const scoreTone: 'success' | 'info' | 'warning' | 'neutral' = score >= 85 ? 'success' : score >= 70 ? 'info' : score > 0 ? 'warning' : 'neutral'
  const scoreColor =
    scoreTone === 'success' ? 'text-chart-2' :
    scoreTone === 'info' ? 'text-chart-1' :
    scoreTone === 'warning' ? 'text-chart-4' : 'text-muted-foreground'
  const hasAcc = accommodations.length > 0

  return (
    <div className="grid items-center gap-3 px-4 py-3 text-sm border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group grid-cols-[32px_minmax(220px,2fr)_110px_100px_110px_60px]">
      <Avatar className="size-8 rounded-full">
        <AvatarFallback className={`rounded-full text-[10px] font-bold ${student.status === 'at-risk' ? 'bg-chart-4/16 text-chart-4' : 'bg-muted text-foreground'}`}>
          {student.initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground truncate">
            {student.firstName} {student.lastName}
          </p>
          {student.status === 'at-risk' && (
            <Tip label="Bottom 20% by course average · consider intervention">
              <span className="cursor-help">
                <StatusPill tone="warning" icon="fa-triangle-exclamation" label="At-risk" uppercase />
              </span>
            </Tip>
          )}
          {student.status === 'top-performer' && (
            <StatusPill tone="success" icon="fa-trophy" label="Top" uppercase />
          )}
          {hasAcc && (
            <Tip label={accommodations.map(a => a.detail).join(' · ')}>
              <span className="cursor-help">
                <StatusPill tone="info" icon="fa-universal-access" label="Accommodation" uppercase />
              </span>
            </Tip>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {student.studentId} · {student.email}
        </p>
      </div>

      <div className="text-xs text-muted-foreground truncate">{student.cohort}</div>

      <div className="flex items-center gap-2">
        {score > 0 ? (
          <>
            <MetricBar value={score} tone={scoreTone === 'neutral' ? 'info' : scoreTone} width="w-16" />
            <span className={`text-xs font-bold tabular-nums w-9 text-right ${scoreColor}`}>
              {score}%
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No data</span>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {relativeTime(student.lastActivity)}
      </div>

      <div className="text-end flex items-center justify-end gap-1">
        <Tip label="Coming soon">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-disabled="true"
            className="pointer-events-none text-muted-foreground"
            aria-label="View student detail"
          >
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
          </Button>
        </Tip>
      </div>
    </div>
  )
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const days = Math.round((Date.now() - then) / 86_400_000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  return `${Math.round(days / 30)}mo ago`
}
