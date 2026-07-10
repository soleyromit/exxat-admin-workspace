// overflow-hidden safe — floating uses Radix Portal (PopoverContent, TooltipContent, SelectContent all use Radix Portal)
'use client'

/**
 * Course Offering detail — base entity page.
 *
 * Tabs use controlled state (value + onValueChange) matching all other
 * detail pages in this codebase. Uncontrolled defaultValue caused the
 * active-indicator to not track correctly in the DS line variant.
 *
 * Entity connections (bidirectional, both directions functional):
 *   Students  — Enroll Student sheet (offering → student, entry point B)
 *               entry point A is Student detail → Courses tab
 *   Faculty   — Assign Faculty sheet (offering → faculty, entry point B)
 *               entry point A is Faculty detail → Teaching tab
 *   Accommodations — reads global student accommodations for this offering
 *
 * Canvas/SIS IDs live on the data model but are not surfaced to end users
 * when empty — only shown when Canvas integration is active and values exist.
 */

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEntryPoint } from '@/lib/use-entry-point'
import { recordView } from '@/lib/recently-viewed'
import {
  Button, Badge, Avatar, AvatarFallback,
  Card, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  InputGroup, InputGroupAddon, InputGroupInput,
  Separator,
  KeyMetrics,
  SelectionTileGrid,
  Field, FieldLabel, FieldContent,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions } from '@/components/data-table/row-actions'
import { facultyStudents, type ExtendedFaculty } from '@/lib/faculty-mock-data'
import { allFaculty } from '@/lib/faculty-mock-data'
import type { ExtendedCourseOffering } from '@/lib/course-mock-data'
import { MOCK_QB_FOLDERS, MOCK_QB_QUESTIONS, mockAssessments } from '@/lib/qb-mock-data'
import { findPersona } from '@/lib/personas'
import { ImportAssessmentModal } from '@/components/import-assessment-modal'
import { ASSESSMENTS as FLOW_ASSESSMENTS } from '@/components/assessment-creation/data'

const IS_LMS_ACTIVE = false

// ── Types ─────────────────────────────────────────────────────────────────────

type EnrolledStudent = { id: string; name: string; email: string; studentId: string; cohort: string; status: 'enrolled' | 'completed' | 'withdrawn' }
type AssignedFaculty = { id: string; name: string; role: 'Course Coordinator' | 'Instructor' }

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function nameInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

// ── Shared badge configs ──────────────────────────────────────────────────────

const OFFERING_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  active:   { label: 'Active',   bg: 'var(--chip-green-surface)', fg: 'var(--chip-green-fg)' },
  past:     { label: 'Past',     bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
  upcoming: { label: 'Upcoming', bg: 'var(--brand-tint)',          fg: 'var(--brand-color-dark)' },
}

const STUDENT_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  enrolled:  { label: 'Enrolled',  bg: 'var(--chip-green-surface)', fg: 'var(--chip-green-fg)' },
  completed: { label: 'Completed', bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
  withdrawn: { label: 'Withdrawn', bg: 'var(--muted)', fg: 'var(--destructive)' },
}

// ── Enroll Student Sheet ──────────────────────────────────────────────────────

function EnrollStudentSheet({
  open, onOpenChange, enrolledIds, onEnroll,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrolledIds: Set<string>
  onEnroll: (s: EnrolledStudent) => void
}) {
  const [search, setSearch] = useState('')
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set())

  const available = useMemo(
    () => facultyStudents.filter(s => !enrolledIds.has(s.id)),
    [enrolledIds]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return available
    return available.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.cohort.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    )
  }, [available, search])

  function handleEnroll(s: typeof facultyStudents[0]) {
    onEnroll({ id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email, studentId: s.studentId, cohort: s.cohort, status: 'enrolled' })
    setJustAdded(prev => new Set(prev).add(s.id))
  }

  function handleClose() {
    onOpenChange(false)
    setSearch('')
    setJustAdded(new Set())
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" showOverlay={false} showCloseButton
        className="w-[480px] max-w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Enroll Student</SheetTitle>
          <SheetDescription>Search and add students to this course offering.</SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4 pb-3 shrink-0">
          <InputGroup className="w-full">
            <InputGroupAddon align="inline-start">
              <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search by name, student ID, or cohort…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search students"
              autoFocus
            />
          </InputGroup>
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <i className="fa-light fa-user-slash text-muted-foreground text-2xl mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No students available</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'No results match your search.' : 'All students are already enrolled.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map(s => {
                const added = justAdded.has(s.id)
                return (
                  <li key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted transition-colors">
                    <Avatar size="sm" className="shrink-0">
                      <AvatarFallback className="text-xs font-bold">
                        {s.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.studentId} · {s.cohort}</p>
                    </div>
                    {added ? (
                      <span className="text-sm font-medium shrink-0 flex items-center gap-1"
                        style={{ color: 'var(--qb-status-saved-fg)' }}>
                        <i className="fa-light fa-circle-check" aria-hidden="true" />
                        Enrolled
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => handleEnroll(s)}>
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
          <Button variant="outline" size="sm" onClick={handleClose}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Assign Faculty Sheet ──────────────────────────────────────────────────────

function AssignFacultySheet({
  open, onOpenChange, assignedIds, onAssign,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignedIds: Set<string>
  onAssign: (f: AssignedFaculty) => void
}) {
  const [search, setSearch] = useState('')
  const [pendingRoles, setPendingRoles] = useState<Record<string, 'Course Coordinator' | 'Instructor'>>({})

  const available = useMemo(
    () => allFaculty.filter(f => !assignedIds.has(f.id) && f.status === 'active'),
    [assignedIds]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return available
    return available.filter(f =>
      f.fullName.toLowerCase().includes(q) ||
      f.adminPosition.toLowerCase().includes(q) ||
      f.rank.toLowerCase().includes(q)
    )
  }, [available, search])

  function getRole(id: string): 'Course Coordinator' | 'Instructor' {
    return pendingRoles[id] ?? 'Instructor'
  }

  function handleAssign(f: ExtendedFaculty) {
    onAssign({ id: f.id, name: f.fullName, role: getRole(f.id) })
    setPendingRoles(prev => { const n = { ...prev }; delete n[f.id]; return n })
  }

  function handleClose() {
    onOpenChange(false)
    setSearch('')
    setPendingRoles({})
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" showOverlay={false} showCloseButton
        className="w-[480px] max-w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Assign Faculty</SheetTitle>
          <SheetDescription>Select faculty and set their role for this offering.</SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4 pb-3 shrink-0">
          <InputGroup className="w-full">
            <InputGroupAddon align="inline-start">
              <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search faculty…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search faculty"
              autoFocus
            />
          </InputGroup>
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <i className="fa-light fa-user-slash text-muted-foreground text-2xl mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No faculty available</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'No results match your search.' : 'All active faculty are already assigned.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map(f => {
                const initials = f.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                const role = getRole(f.id)
                return (
                  <li key={f.id} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted transition-colors">
                    <Avatar size="sm" className="shrink-0">
                      <AvatarFallback className="text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.adminPosition} · {f.rank}</p>
                    </div>
                    <Select value={role}
                      onValueChange={v => setPendingRoles(prev => ({ ...prev, [f.id]: v as 'Course Coordinator' | 'Instructor' }))}>
                      <SelectTrigger className="w-[150px] h-8 text-xs shrink-0" aria-label={`Role for ${f.fullName}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Course Coordinator">Course Coordinator</SelectItem>
                        <SelectItem value="Instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => handleAssign(f)}>
                      Assign
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleClose}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Create Assessment modal ───────────────────────────────────────────────────
// Four entry modes per Aarti May 19: blank, QB-first, copy from previous, import PDF.

function LegacyCreateAssessmentModal({
  open, onOpenChange, offeringId, courseId, onOpenImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  offeringId: string
  courseId: string
  onOpenImport: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<'pick-mode' | 'pick-source'>('pick-mode')
  const [mode, setMode] = useState<'blank' | 'qb' | 'copy' | 'import'>('blank')

  // Previous assessments for this course but a different offering (previous term)
  const prevAssessments = mockAssessments.filter(
    a => a.courseId === courseId && a.offeringId !== offeringId
  )

  function close() { onOpenChange(false); setStep('pick-mode'); setMode('blank') }

  function handleContinue() {
    if (mode === 'copy') { setStep('pick-source'); return }
    if (mode === 'import') {
      close()
      onOpenImport()
      return
    }
    close()
    router.push(`/assessment-builder?offeringId=${offeringId}&mode=${mode}`)
  }

  function handleSource(sourceId: string) {
    close()
    router.push(`/assessment-builder?offeringId=${offeringId}&mode=copy&sourceId=${sourceId}`)
  }

  const MODES: { id: 'blank' | 'qb' | 'copy' | 'import'; icon: string; label: string; desc: string }[] = [
    {
      id: 'blank',
      icon: 'fa-file-pen',
      label: 'From scratch',
      desc: 'Start with a blank assessment and add questions from the QB.',
    },
    {
      id: 'qb',
      icon: 'fa-books',
      label: 'From question bank',
      desc: 'Jump straight to the QB picker with smart view filters ready.',
    },
    {
      id: 'copy',
      icon: 'fa-copy',
      label: 'Copy from previous',
      desc: "Use a previous term's assessment as your starting point — keep structure, swap questions.",
    },
    {
      id: 'import',
      icon: 'fa-file-import',
      label: 'Import PDF',
      desc: 'Upload a paper exam. We match questions to your QB automatically.',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else onOpenChange(true) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Assessment</DialogTitle>
          <DialogDescription>How would you like to start?</DialogDescription>
        </DialogHeader>

        {step === 'pick-mode' && (
          <div className="flex flex-col gap-3 pt-1">
            <SelectionTileGrid
              interaction="radio"
              columns={2}
              idPrefix="create-mode"
              options={MODES.map(m => ({
                value: m.id,
                label: m.label,
                icon: m.icon,
              }))}
              value={mode}
              onValueChange={(v) => setMode(v as typeof mode)}
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
              <Button variant="default" size="sm" onClick={handleContinue} className="gap-1.5">
                Continue
                <i className="fa-light fa-arrow-right" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {step === 'pick-source' && (
          <div className="flex flex-col gap-3 pt-1">
            <Button variant="ghost" size="xs" onClick={() => setStep('pick-mode')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start h-auto px-0">
              <i className="fa-light fa-arrow-left" aria-hidden="true" />
              Back
            </Button>
            <p className="text-sm font-medium text-foreground">Select a previous assessment to copy from:</p>
            {prevAssessments.length === 0 ? (
              <Card className="bg-muted text-center">
                <CardContent className="py-5">
                <p className="text-sm text-muted-foreground">No previous assessments found for this course.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setMode('blank'); setStep('pick-mode') }}>
                  Start from scratch instead
                </Button>
                </CardContent>
              </Card>
            ) : (
              prevAssessments.map(a => (
                <Button
                  key={a.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSource(a.id)}
                  className="flex items-center gap-4 rounded-lg p-4 text-left h-auto justify-start w-full hover:bg-muted"
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    <i className="fa-light fa-clipboard-list text-sm" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.questionCount} questions · {a.durationMinutes} min
                    </p>
                  </div>
                  <i className="fa-light fa-arrow-right text-xs text-muted-foreground shrink-0" aria-hidden="true" />
                </Button>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Assessments tab ───────────────────────────────────────────────────────────

type AssessmentRow = ExtendedCourseOffering['assessments'][0] & Record<string, unknown>

const ASSESSMENT_STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  Published: { label: 'Published', bg: 'var(--chip-green-surface)', fg: 'var(--chip-green-fg)' },
  Scheduled: { label: 'Scheduled', bg: 'var(--brand-tint)',          fg: 'var(--brand-color-dark)' },
  Review:    { label: 'Review',    bg: 'var(--chip-amber-surface)',   fg: 'var(--chip-4)' },
  Draft:     { label: 'Draft',     bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
  Grading:   { label: 'Grading',   bg: 'var(--chip-blue-surface)',   fg: 'var(--chip-3)' },
}

const assessmentColumns: ColumnDef<AssessmentRow>[] = [
  {
    key: 'title', label: 'Name', width: 260, sortable: true, sortKey: 'title',
    cell: (row) => (
      <span className="text-sm font-medium text-foreground">{row.title as string}</span>
    ),
  },
  {
    key: 'type', label: 'Type', width: 110, sortable: true, sortKey: 'type',
    cell: (row) => (
      <span className="text-sm text-muted-foreground">{row.type as string}</span>
    ),
  },
  {
    key: 'durationMinutes', label: 'Duration', width: 90, sortable: true, sortKey: 'durationMinutes',
    cell: (row) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {row.durationMinutes ? `${row.durationMinutes as number} min` : '—'}
      </span>
    ),
  },
  {
    key: 'date', label: 'Schedule', width: 130, sortable: true, sortKey: 'date',
    cell: (row) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {row.date ? new Date(row.date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
      </span>
    ),
  },
  {
    key: 'gradingScheme', label: 'Grading Scheme', width: 140,
    cell: (row) => (
      <span className="text-sm text-muted-foreground">{(row.gradingScheme as string) ?? '—'}</span>
    ),
  },
  {
    key: 'weightage', label: 'Weightage', width: 90, sortable: true, sortKey: 'weightage',
    cell: (row) => (
      <span className="text-sm text-foreground tabular-nums">
        {row.weightage != null ? `${row.weightage as number}%` : '—'}
      </span>
    ),
  },
  {
    key: 'status', label: 'Status', width: 110, sortable: true, sortKey: 'status',
    cell: (row) => {
      const s = ASSESSMENT_STATUS_CONFIG[row.status as string] ?? ASSESSMENT_STATUS_CONFIG.Draft
      return (
        <Badge variant="secondary" className="rounded font-medium"
          style={{ backgroundColor: s.bg, color: s.fg }}>
          {s.label}
        </Badge>
      )
    },
  },
  {
    key: 'actions', label: '', width: 52, defaultPin: 'right', lockPin: true,
    cell: (row) => (
      <RowActions
        row={row}
        label={row.title as string}
        actions={[
          { label: 'Open in Builder', icon: 'fa-arrow-right', onClick: () => {} },
          { label: 'Duplicate', icon: 'fa-copy', onClick: () => {} },
          { label: 'Archive', icon: 'fa-box-archive', variant: 'destructive', divider: true, onClick: () => {} },
        ]}
      />
    ),
  },
]

function AssessmentsTab({ offering, onNewAssessment }: { offering: ExtendedCourseOffering; onNewAssessment: () => void }) {
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterGrading, setFilterGrading] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const stats = {
    scheduled: offering.assessments.filter(a => a.status === 'Scheduled').length,
    draftReview: offering.assessments.filter(a => a.status === 'Draft' || a.status === 'Review').length,
    attn: offering.assessments.filter(a => a.status === 'Draft').length,
    totalWeight: offering.assessments.reduce((s, a) => s + (a.weightage ?? 0), 0),
  }

  const filtered = useMemo((): AssessmentRow[] => {
    let rows = offering.assessments
    if (query) {
      const q = query.trim().toLowerCase()
      rows = rows.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
      )
    }
    if (filterType !== 'all') rows = rows.filter(a => a.type === filterType)
    if (filterGrading !== 'all') rows = rows.filter(a => a.gradingScheme === filterGrading)
    if (filterStatus !== 'all') rows = rows.filter(a => a.status === filterStatus)
    return rows as AssessmentRow[]
  }, [offering.assessments, query, filterType, filterGrading, filterStatus])

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <KeyMetrics
        variant="compact"
        metricsSingleRow
        metrics={[
          {
            id: 'scheduled',
            label: 'Scheduled',
            value: stats.scheduled,
            delta: '',
            trend: 'neutral',
            trendPolarity: 'higher_is_better',
          },
          {
            id: 'draft-review',
            label: 'Draft / Review',
            value: stats.draftReview,
            delta: '',
            trend: 'neutral',
            trendPolarity: 'lower_is_better',
          },
          {
            id: 'attn',
            label: 'Needs attention',
            value: stats.attn,
            delta: '',
            trend: 'neutral',
            trendPolarity: 'lower_is_better',
          },
          {
            id: 'weight',
            label: 'Total weightage',
            value: `${stats.totalWeight}%`,
            delta: '',
            trend: 'neutral',
            description: stats.totalWeight < 100 ? `${100 - stats.totalWeight}% unallocated` : 'Fully allocated',
          },
        ]}
        className="shrink-0"
      />

      <DataTable<AssessmentRow>
        data={filtered}
        columns={assessmentColumns}
        getRowId={(row) => row.id as string}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        toolbarSlot={() => (
          <>
            <InputGroup className="w-52">
              <InputGroupAddon>
                <i className="fa-light fa-magnifying-glass text-muted-foreground text-[12px]" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search assessments…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search assessments"
                className="text-sm"
              />
            </InputGroup>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Array.from(new Set(offering.assessments.map(a => a.type))).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Array.from(new Set(offering.assessments.map(a => a.status))).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={onNewAssessment}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add Assessment
            </Button>
          </>
        )}
        emptyState={
          <div className="flex flex-col items-center justify-center py-14 text-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <i className="fa-light fa-clipboard-list text-muted-foreground text-lg" aria-hidden="true" />
            </div>
            <p className="font-semibold text-foreground">
              {query ? 'No assessments match your search' : 'No assessments yet'}
            </p>
            {!query && (
              <Button size="sm" className="mt-1" onClick={onNewAssessment}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add Assessment
              </Button>
            )}
          </div>
        }
      />
    </div>
  )
}

// ── Students tab ──────────────────────────────────────────────────────────────

type EnrolledStudentRow = EnrolledStudent & Record<string, unknown>

const enrolledStudentColumns: ColumnDef<EnrolledStudentRow>[] = [
  {
    key: 'student',
    label: 'Student',
    width: 240,
    sortable: true,
    sortKey: 'name',
    cell: (row) => {
      const initials = nameInitials(row.name as string)
      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm" className="shrink-0" aria-hidden="true">
            <AvatarFallback className="text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{row.name as string}</p>
            <p className="text-xs text-muted-foreground truncate">{row.email as string}</p>
          </div>
        </div>
      )
    },
  },
  {
    key: 'studentId',
    label: 'ID',
    width: 140,
    sortable: true,
    sortKey: 'studentId',
    cell: (row) => (
      <span className="text-sm font-mono text-muted-foreground tabular-nums">
        {(row.studentId as string) || '—'}
      </span>
    ),
  },
  {
    key: 'cohort',
    label: 'Cohort',
    width: 160,
    sortable: true,
    sortKey: 'cohort',
    cell: (row) => (
      <span className="text-sm text-muted-foreground">{(row.cohort as string) || '—'}</span>
    ),
  },
  {
    key: 'actions',
    label: '',
    width: 52,
    defaultPin: 'right',
    lockPin: true,
    cell: (row) => (
      <RowActions
        row={row}
        label={row.name as string}
        actions={[
          {
            label: 'View Student',
            icon: 'fa-arrow-right',
            onClick: (r) => { window.location.href = `/students/${r.id as string}` },
          },
          {
            label: 'Unregister',
            icon: 'fa-user-minus',
            variant: 'destructive',
            divider: true,
            onClick: () => {},
          },
        ]}
      />
    ),
  },
]

function StudentsTab({ localStudents, onOpenEnroll, onNavigateStudent }: {
  localStudents: EnrolledStudent[]
  onOpenEnroll: () => void
  onNavigateStudent: (id: string) => void
}) {
  const [studentQuery, setStudentQuery] = useState('')
  const [studentCohort, setStudentCohort] = useState('all')

  const cohorts = useMemo(
    () => Array.from(new Set(localStudents.map(s => s.cohort).filter(Boolean))),
    [localStudents]
  )

  const filteredStudents = useMemo((): EnrolledStudentRow[] => {
    let rows = localStudents
    if (studentQuery) {
      const q = studentQuery.trim().toLowerCase()
      rows = rows.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
      )
    }
    if (studentCohort !== 'all') rows = rows.filter(s => s.cohort === studentCohort)
    return rows as EnrolledStudentRow[]
  }, [localStudents, studentQuery, studentCohort])

  return (
    <DataTable<EnrolledStudentRow>
      data={filteredStudents}
      columns={enrolledStudentColumns}
      getRowId={(row) => row.id as string}
      selectable={false}
      searchable={false}
      showQueryControls={false}
      onRowClick={(row) => onNavigateStudent(row.id as string)}
      toolbarSlot={() => (
        <>
          <InputGroup className="w-52">
            <InputGroupAddon>
              <i className="fa-light fa-magnifying-glass text-muted-foreground text-[12px]" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search students…"
              value={studentQuery}
              onChange={e => setStudentQuery(e.target.value)}
              aria-label="Search students"
              className="text-sm"
            />
          </InputGroup>
          {cohorts.length > 0 && (
            <Select value={studentCohort} onValueChange={setStudentCohort}>
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue placeholder="Cohort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cohorts</SelectItem>
                {cohorts.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="text-xs text-muted-foreground">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </span>
          {IS_LMS_ACTIVE ? (
            <Badge
              variant="secondary"
              className="rounded-full gap-1.5 text-xs"
              style={{
                backgroundColor: 'var(--brand-tint)',
                color: 'var(--brand-color)',
              }}
            >
              <i className="fa-light fa-link" aria-hidden="true" />
              Managed by Canvas
            </Badge>
          ) : (
            <Button size="sm" onClick={onOpenEnroll}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Enroll Student
            </Button>
          )}
        </>
      )}
      emptyState={
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <i className="fa-light fa-users text-muted-foreground text-xl" aria-hidden="true" />
          </div>
          <p className="font-semibold text-foreground">No students enrolled</p>
          <p className="text-sm text-muted-foreground">Enroll students in this course offering.</p>
          {!IS_LMS_ACTIVE && (
            <Button size="sm" className="mt-1" onClick={onOpenEnroll}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Enroll Student
            </Button>
          )}
        </div>
      }
    />
  )
}

// ── Faculty tab ───────────────────────────────────────────────────────────────

type AssignedFacultyRow = AssignedFaculty & Record<string, unknown>

const assignedFacultyColumns: ColumnDef<AssignedFacultyRow>[] = [
  {
    key: 'faculty',
    label: 'Faculty',
    width: 240,
    sortable: true,
    sortKey: 'name',
    cell: (row) => {
      const initials = nameInitials(row.name as string)
      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm" className="shrink-0" aria-hidden="true">
            <AvatarFallback className="text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium text-foreground truncate">{row.name as string}</p>
        </div>
      )
    },
  },
  {
    key: 'role',
    label: 'Role',
    width: 180,
    sortable: true,
    sortKey: 'role',
    cell: (row) => (
      <Badge variant="secondary" className="rounded font-medium"
        style={row.role === 'Course Coordinator'
          ? { backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color)' }
          : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
        {row.role as string}
      </Badge>
    ),
  },
  {
    key: 'actions',
    label: '',
    width: 52,
    defaultPin: 'right',
    lockPin: true,
    cell: (row) => (
      <RowActions
        row={row}
        label={row.name as string}
        actions={[
          {
            label: 'View Faculty',
            icon: 'fa-arrow-right',
            onClick: (r) => { window.location.href = `/faculty/${r.id as string}` },
          },
          {
            label: 'Remove from Course',
            icon: 'fa-user-minus',
            variant: 'destructive',
            divider: true,
            onClick: () => {},
          },
        ]}
      />
    ),
  },
]

function FacultyTab({ localFaculty, onOpenAssign, onNavigateFaculty }: {
  localFaculty: AssignedFaculty[]
  onOpenAssign: () => void
  onNavigateFaculty: (id: string) => void
}) {
  const [facultyQuery, setFacultyQuery] = useState('')
  const [facultyRole, setFacultyRole] = useState('all')

  const filteredFaculty = useMemo((): AssignedFacultyRow[] => {
    let rows = localFaculty
    if (facultyQuery) {
      const q = facultyQuery.trim().toLowerCase()
      rows = rows.filter(f => f.name.toLowerCase().includes(q))
    }
    if (facultyRole !== 'all') rows = rows.filter(f => f.role === facultyRole)
    return rows as AssignedFacultyRow[]
  }, [localFaculty, facultyQuery, facultyRole])

  return (
    <DataTable<AssignedFacultyRow>
      data={filteredFaculty}
      columns={assignedFacultyColumns}
      getRowId={(row) => row.id as string}
      selectable={false}
      searchable={false}
      showQueryControls={false}
      onRowClick={(row) => onNavigateFaculty(row.id as string)}
      toolbarSlot={() => (
        <>
          <InputGroup className="w-44">
            <InputGroupAddon>
              <i className="fa-light fa-magnifying-glass text-muted-foreground text-[12px]" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search faculty…"
              value={facultyQuery}
              onChange={e => setFacultyQuery(e.target.value)}
              aria-label="Search faculty"
              className="text-sm"
            />
          </InputGroup>
          <Select value={facultyRole} onValueChange={setFacultyRole}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="Course Coordinator">Course Coordinator</SelectItem>
              <SelectItem value="Instructor">Instructor</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {filteredFaculty.length} faculty member{filteredFaculty.length !== 1 ? 's' : ''} assigned
          </span>
          {IS_LMS_ACTIVE ? (
            <Badge
              variant="secondary"
              className="rounded-full gap-1.5 text-xs"
              style={{
                backgroundColor: 'var(--brand-tint)',
                color: 'var(--brand-color)',
              }}
            >
              <i className="fa-light fa-link" aria-hidden="true" />
              Managed by Canvas
            </Badge>
          ) : (
            <Button size="sm" onClick={onOpenAssign}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Assign Faculty
            </Button>
          )}
        </>
      )}
      emptyState={
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <i className="fa-light fa-chalkboard-user text-muted-foreground text-xl" aria-hidden="true" />
          </div>
          <p className="font-semibold text-foreground">No faculty assigned</p>
          <p className="text-sm text-muted-foreground">Assign a course coordinator and instructors to this offering.</p>
          {!IS_LMS_ACTIVE && (
            <Button size="sm" className="mt-1" onClick={onOpenAssign}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Assign Faculty
            </Button>
          )}
        </div>
      }
    />
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ offering, onNavigate }: { offering: ExtendedCourseOffering; onNavigate: (tab: string) => void }) {
  const status = OFFERING_STATUS[offering.status]

  const kvRows = [
    { label: 'Course Code',   value: offering.courseNumber },
    { label: 'Academic Year', value: offering.academicYear },
    { label: 'Term',          value: offering.term },
    { label: 'Cohort',        value: offering.cohort },
    { label: 'Start Date',    value: offering.startDate ? formatDate(offering.startDate) : 'TBD' },
    { label: 'End Date',      value: offering.endDate ? formatDate(offering.endDate) : 'TBD' },
    { label: 'Credits',       value: `${offering.credits} credits` },
    { label: 'Status',        value: status?.label ?? offering.status },
  ]

  const nextAssessment = offering.assessments
    .filter(a => a.status !== 'Published' && a.date > new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  const nextDueDesc = nextAssessment
    ? `Next: ${new Date(nextAssessment.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'No upcoming'

  const summaryCards = [
    { label: 'Students', count: offering.students.length, sub: `${offering.registeredStudents} registered`, tab: 'students' },
    { label: 'Assessments', count: offering.assessments.length, sub: nextDueDesc, tab: 'assessments' },
    { label: 'Faculty', count: offering.faculty.length, sub: offering.faculty[0]?.name ?? 'None assigned', tab: 'faculty' },
    { label: 'Question Bank', count: `${offering.qbHealth}%`, sub: 'QB Health', tab: 'question-bank' },
    { label: 'Resources', count: offering.resources.length, sub: `${offering.resources.filter(r => r.syncedFromPrism).length} synced from PRISM`, tab: 'resources' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* About this offering — kv-grid */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">About this offering</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
            {kvRows.map(({ label, value }) => (
              <Field key={label} orientation="vertical">
                <FieldLabel className="text-xs text-muted-foreground">{label}</FieldLabel>
                <FieldContent className="text-sm font-medium text-foreground">{value}</FieldContent>
              </Field>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5 summary metrics */}
      <KeyMetrics
        variant="compact"
        metricsSingleRow
        metrics={summaryCards.map(card => ({
          id: card.tab,
          label: card.label,
          value: card.count,
          delta: '',
          trend: 'neutral' as const,
          description: card.sub,
          onClick: () => onNavigate(card.tab),
        }))}
      />

      {/* Description (if present) */}
      {offering.description && (
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{offering.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Resources tab ─────────────────────────────────────────────────────────────

function ResourcesTab({ offering }: { offering: ExtendedCourseOffering }) {
  if (offering.resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-14 text-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <i className="fa-light fa-folder-open text-muted-foreground text-lg" aria-hidden="true" />
        </div>
        <p className="font-semibold text-foreground">No resources added</p>
        <p className="text-sm text-muted-foreground">Reading materials, links, and videos will appear here.</p>
      </div>
    )
  }
  const TYPE_ICON: Record<string, { icon: string; bg: string; fg: string }> = {
    PDF:   { icon: 'fa-file-pdf', bg: 'var(--chip-red-surface)', fg: 'var(--destructive)' },
    Video: { icon: 'fa-play',     bg: 'var(--brand-tint)',       fg: 'var(--brand-color)' },
    Link:  { icon: 'fa-link',     bg: 'var(--muted)',            fg: 'var(--muted-foreground)' },
  }
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <ul className="divide-y divide-border">
        {offering.resources.map((res, i) => {
          const t = TYPE_ICON[res.type] ?? TYPE_ICON.Link
          return (
            <li key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted transition-colors">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: t.bg, color: t.fg }}>
                <i className={`fa-light ${t.icon} text-[13px]`} aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{res.title}</p>
                {(res.fileSize || res.updatedDate) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {res.fileSize && <span>{res.fileSize}</span>}
                    {res.fileSize && res.updatedDate && <span> · </span>}
                    {res.updatedDate && <span>Updated {new Date(res.updatedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                  </p>
                )}
              </div>
              {res.syncedFromPrism && (
                <Badge variant="secondary" className="rounded-full text-xs shrink-0"
                  style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}>
                  Synced from PRISM
                </Badge>
              )}
              <Badge variant="secondary" className="rounded text-xs shrink-0"
                style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                {res.type}
              </Badge>
              {res.url && (
                <Button variant="ghost" size="icon-sm" aria-label={`Open ${res.title}`}
                  onClick={() => window.open(res.url, '_blank', 'noopener,noreferrer')}>
                  <i className="fa-light fa-arrow-up-right-from-square text-[12px]" aria-hidden="true" />
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Question Bank tab ─────────────────────────────────────────────────────────

const QB_STATUS_CONFIG: Record<string, { bg: string; fg: string }> = {
  Saved:    { bg: 'var(--qb-status-saved-bg)',    fg: 'var(--qb-status-saved-fg)' },
  Draft:    { bg: 'var(--muted)',                  fg: 'var(--muted-foreground)' },
  Archived: { bg: 'var(--muted)',                  fg: 'var(--destructive)' },
}

const QB_DIFF_CONFIG: Record<string, { bg: string; fg: string }> = {
  Easy:   { bg: 'var(--chip-green-surface)',  fg: 'var(--chip-green-fg)' },
  Medium: { bg: 'var(--chip-amber-surface)',  fg: 'var(--chip-4)' },
  Hard:   { bg: 'var(--chip-red-surface)',    fg: 'var(--chip-destructive)' },
}

type QBQuestionRow = (typeof MOCK_QB_QUESTIONS)[0] & Record<string, unknown>

const qbQuestionColumns: ColumnDef<QBQuestionRow>[] = [
  {
    key: 'title', label: 'Question', width: 380, sortable: true, sortKey: 'title',
    cell: (row) => (
      <p className="text-sm text-foreground line-clamp-2 leading-snug">{row.title as string}</p>
    ),
  },
  {
    key: 'type', label: 'Type', width: 120, sortable: true, sortKey: 'type',
    cell: (row) => (
      <span className="text-xs text-muted-foreground">{row.type as string}</span>
    ),
  },
  {
    key: 'blooms', label: "Bloom's", width: 110, sortable: true, sortKey: 'blooms',
    cell: (row) => (
      <span className="text-xs text-muted-foreground">{row.blooms as string}</span>
    ),
  },
  {
    key: 'difficulty', label: 'Difficulty', width: 90, sortable: true, sortKey: 'difficulty',
    cell: (row) => {
      const d = QB_DIFF_CONFIG[row.difficulty as string]
      if (!d) return <span className="text-xs text-muted-foreground">{row.difficulty as string}</span>
      return (
        <Badge variant="secondary" className="rounded text-xs font-medium"
          style={{ backgroundColor: d.bg, color: d.fg }}>
          {row.difficulty as string}
        </Badge>
      )
    },
  },
  {
    key: 'status', label: 'Status', width: 90, sortable: true, sortKey: 'status',
    cell: (row) => {
      const s = QB_STATUS_CONFIG[row.status as string] ?? QB_STATUS_CONFIG.Draft
      return (
        <Badge variant="secondary" className="rounded text-xs font-medium"
          style={{ backgroundColor: s.bg, color: s.fg }}>
          {row.status as string}
        </Badge>
      )
    },
  },
  {
    key: 'folderPath', label: 'Source', width: 160,
    cell: (row) => {
      const fp = row.folderPath as string
      const isShared = fp && !fp.startsWith((row as { courseFolder?: string }).courseFolder ?? '')
      return (
        <span className="text-xs text-muted-foreground truncate">
          {isShared ? `Shared · ${fp.split('/')[0].trim()}` : 'This course'}
        </span>
      )
    },
  },
]

function QuestionBankTab({ offering }: { offering: ExtendedCourseOffering }) {
  const [query, setQuery] = useState('')
  const qbRootId = offering.courseId.replace('course-', '')
  const rootFolder = MOCK_QB_FOLDERS.find(f => f.id === qbRootId)

  // Filter questions that belong to this course's folders (by folder prefix match)
  const courseQuestions = useMemo(
    () => MOCK_QB_QUESTIONS.filter(q => q.folder.startsWith(qbRootId.replace('101', '').replace('201', '').replace('301', '').replace('401', '').replace('501', '').replace('601', '')) || q.folder.includes(qbRootId.split('').slice(0, 4).join(''))),
    [qbRootId]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courseQuestions
    return courseQuestions.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.blooms.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    )
  }, [courseQuestions, query])

  return (
    <div className="flex flex-col gap-4">
      {/* QB analytics strip */}
      <KeyMetrics
        variant="compact"
        metricsSingleRow
        metrics={[
          { id: 'total',      label: 'Total questions',   value: offering.qbAnalytics.total,                delta: '', trend: 'neutral' as const },
          { id: 'measure',    label: 'Measure-tagged',    value: `${offering.qbAnalytics.measurePct}%`,     delta: '', trend: offering.qbAnalytics.measurePct >= 70 ? 'up' as const : 'down' as const,      trendPolarity: 'higher_is_better' as const },
          { id: 'competency', label: 'Competency-tagged', value: `${offering.qbAnalytics.competencyPct}%`, delta: '', trend: offering.qbAnalytics.competencyPct >= 70 ? 'up' as const : 'down' as const, trendPolarity: 'higher_is_better' as const },
          { id: 'untagged',   label: 'Untagged',          value: offering.qbAnalytics.untagged,             delta: '', trend: offering.qbAnalytics.untagged > 0 ? 'up' as const : 'neutral' as const,     trendPolarity: 'lower_is_better' as const },
          { id: 'flagged',    label: 'AI-flagged',        value: offering.qbAnalytics.aiFlagged,            delta: '', trend: offering.qbAnalytics.aiFlagged > 0 ? 'up' as const : 'neutral' as const,    trendPolarity: 'lower_is_better' as const },
          { id: 'unused',     label: 'Never used',        value: offering.qbAnalytics.neverUsed,            delta: '', trend: offering.qbAnalytics.neverUsed > 0 ? 'up' as const : 'neutral' as const,    trendPolarity: 'lower_is_better' as const },
        ]}
        className="shrink-0"
      />

      <DataTable<QBQuestionRow>
        data={filtered as QBQuestionRow[]}
        columns={qbQuestionColumns}
        getRowId={(row) => (row as { id: string }).id}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        toolbarSlot={() => (
          <>
            <InputGroup className="w-52">
              <InputGroupAddon>
                <i className="fa-light fa-magnifying-glass text-muted-foreground text-[12px]" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search questions…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search questions"
                className="text-sm"
              />
            </InputGroup>
            <span className="text-xs text-muted-foreground">
              {rootFolder ? `${rootFolder.count} questions in QB` : `${filtered.length} questions`}
            </span>
            <Button variant="outline" size="sm" className="ms-auto" asChild>
              <a href="/question-bank" aria-label="Open Question Bank">
                <i className="fa-light fa-arrow-up-right-from-square text-[12px]" aria-hidden="true" />
                Open Question Bank
              </a>
            </Button>
          </>
        )}
        emptyState={
          <div className="flex flex-col items-center justify-center py-14 text-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <i className="fa-light fa-books text-muted-foreground text-lg" aria-hidden="true" />
            </div>
            <p className="font-semibold text-foreground">
              {query ? 'No questions match your search' : 'No questions in this course QB'}
            </p>
          </div>
        }
      />
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CourseOfferingDetailClient({ offering }: { offering: ExtendedCourseOffering }) {
  const router = useRouter()
  const entryPoint = useEntryPoint()
  const isPrism = entryPoint === 'prism'

  useEffect(() => {
    recordView('courses', {
      id: offering.id,
      name: offering.courseName,
      subtitle: `${offering.courseNumber} · ${offering.term}`,
      href: `/courses/offerings/${offering.id}`,
      icon: 'fa-book',
    })
  }, [offering.id])

  // Controlled tab state — overview is the default per the wireframe
  const [activeTab, setActiveTab] = useState('overview')

  // Enrollment state — initialized from offering data, mutated locally
  const [localStudents, setLocalStudents] = useState<EnrolledStudent[]>(
    offering.students.map(s => ({
      id: s.id, name: s.name, email: s.email,
      studentId: s.studentId ?? '',
      cohort: s.cohort ?? offering.cohort,
      status: s.status,
    }))
  )
  const [localFaculty, setLocalFaculty] = useState<AssignedFaculty[]>(
    offering.faculty.map(f => ({ id: f.id, name: f.name, role: f.role }))
  )

  // Sheet open state
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const enrolledIds = useMemo(() => new Set(localStudents.map(s => s.id)), [localStudents])
  const assignedIds = useMemo(() => new Set(localFaculty.map(f => f.id)), [localFaculty])

  const status = OFFERING_STATUS[offering.status]

  return (
    <>
      <SiteHeader
        title={offering.courseName}
        breadcrumbs={[{ label: 'Courses', href: '/courses' }, { label: offering.courseName }]}
      />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none min-h-0">
        <PageHeader
          title={offering.courseName}
          subtitle={`${offering.courseNumber} · ${offering.academicYear} · ${offering.term} · ${offering.cohort} · ${offering.startDate ? formatDate(offering.startDate) : 'TBD'} → ${offering.endDate ? formatDate(offering.endDate) : 'TBD'} · ${offering.credits} credits`}
          actions={
            <div className="flex items-center gap-2">
              {offering.isPrism && (
                <Button variant="outline" size="sm" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" />
                    View in Prism
                  </a>
                </Button>
              )}
              {IS_LMS_ACTIVE && (
                <Badge
                  variant="secondary"
                  className="rounded-full gap-1.5 text-xs"
                  style={{
                    backgroundColor: 'var(--brand-tint)',
                    color: 'var(--brand-color)',
                  }}
                >
                  <i className="fa-light fa-link" aria-hidden="true" />
                  Canvas Synced
                </Badge>
              )}
              {status && (
                <Badge
                  variant="secondary"
                  className="rounded-full text-xs font-semibold px-3 py-1"
                  style={{ backgroundColor: status.bg, color: status.fg }}
                >
                  {status.label}
                </Badge>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
              >
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add Assessment
              </Button>
            </div>
          }
        />

        {/* Controlled tabs — value + onValueChange, matching course-detail-client.tsx */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col min-h-0">
          <div className="px-6 border-b border-border shrink-0">
            <TabsList variant="line">
              <TabsTrigger value="overview">
                <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="assessments">
                <i className="fa-light fa-clipboard-list text-xs" aria-hidden="true" />
                Assessments
                <Badge variant="secondary" className="rounded-full text-xs px-1.5 py-0 min-w-[18px] text-center">
                  {FLOW_ASSESSMENTS.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="students">
                <i className="fa-light fa-users text-xs" aria-hidden="true" />
                Students
                {localStudents.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs px-1.5 py-0 min-w-[18px] text-center">
                    {localStudents.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="faculty">
                <i className="fa-light fa-chalkboard-user text-xs" aria-hidden="true" />
                Faculty
                {localFaculty.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs px-1.5 py-0 min-w-[18px] text-center">
                    {localFaculty.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="question-bank">
                <i className="fa-light fa-books text-xs" aria-hidden="true" />
                Question Bank
                {(() => {
                  const rootFolder = MOCK_QB_FOLDERS.find(f => f.id === offering.courseId.replace('course-', ''))
                  return rootFolder ? (
                    <Badge variant="secondary" className="rounded-full text-xs px-1.5 py-0 min-w-[18px] text-center">
                      {rootFolder.count}
                    </Badge>
                  ) : null
                })()}
              </TabsTrigger>
              <TabsTrigger value="resources">
                <i className="fa-light fa-folder-open text-xs" aria-hidden="true" />
                Resources
                {offering.resources.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs px-1.5 py-0 min-w-[18px] text-center">
                    {offering.resources.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto pt-2 px-6 pb-6">
            <TabsContent value="overview" className="m-0">
              <OverviewTab offering={offering} onNavigate={setActiveTab} />
            </TabsContent>
            <TabsContent value="assessments" className="m-0">
              <AssessmentsTab
                offering={offering}
                onNewAssessment={() => setCreateModalOpen(true)}
              />
            </TabsContent>
            <TabsContent value="students" className="m-0">
              <StudentsTab
                localStudents={localStudents}
                onOpenEnroll={() => setEnrollOpen(true)}
                onNavigateStudent={(id) => router.push(`/students/${id}`)}
              />
            </TabsContent>
            <TabsContent value="faculty" className="m-0">
              <FacultyTab
                localFaculty={localFaculty}
                onOpenAssign={() => setAssignOpen(true)}
                onNavigateFaculty={(id) => router.push(`/faculty/${id}`)}
              />
            </TabsContent>
            <TabsContent value="question-bank" className="m-0">
              <QuestionBankTab offering={offering} />
            </TabsContent>
            <TabsContent value="resources" className="m-0">
              <ResourcesTab offering={offering} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Sheets live outside tab content so they don't re-mount on tab switch */}
      <EnrollStudentSheet
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        enrolledIds={enrolledIds}
        onEnroll={s => setLocalStudents(prev => prev.some(e => e.id === s.id) ? prev : [...prev, s])}
      />
      <AssignFacultySheet
        open={assignOpen}
        onOpenChange={setAssignOpen}
        assignedIds={assignedIds}
        onAssign={f => setLocalFaculty(prev => prev.some(e => e.id === f.id) ? prev : [...prev, f])}
      />
      <LegacyCreateAssessmentModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        offeringId={offering.id}
        courseId={offering.courseId}
        onOpenImport={() => setImportOpen(true)}
      />
      <ImportAssessmentModal
        open={importOpen}
        onOpenChange={setImportOpen}
        courseCode={offering.courseNumber}
        onImport={(questions) => {
          router.push(`/assessment-builder?offeringId=${offering.id}&mode=import&questionCount=${questions.length}`)
        }}
      />
    </>
  )
}
