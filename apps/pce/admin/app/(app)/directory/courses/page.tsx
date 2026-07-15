'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  KeyMetrics, Button, PageHeader, Avatar, AvatarFallback,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, Input,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import {
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS,
  MOCK_FACULTY, MOCK_SURVEYS,
  type CourseOffering,
} from '@/lib/pce-mock-data'
import { DataTablePaginated } from '@/components/data-table/pagination'
import { TruncatedText } from '@/components/truncated-text'
import { OfferingStatusBadge } from '@/components/pce/pce-badges'
import type { ColumnDef } from '@/components/data-table/types'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'

interface OfferingRow extends Record<string, unknown> {
  id: string
  courseCode: string; courseName: string; termName: string
  cohort: string; primaryFacultyName: string; primaryFacultyInitials: string
  collaboratorCount: number; enrolledCount: number
  status: CourseOffering['status']
  surveyId?: string
  completion: number | null
}

const PRISM_BASE = 'https://app.exxat.com/prism/dpt/offerings'

const _evalSurveys = MOCK_SURVEYS.filter(
  s => s.surveyType === 'course_evaluation' && s.status !== 'draft',
)
const surveyKeyMap = new Map<string, string>(
  _evalSurveys.map(s => [`${s.courseCode}-${s.term}`, s.id]),
)
const surveyRateMap = new Map<string, number>(
  _evalSurveys.map(s => [s.id, s.responseRate]),
)
const _collectingCount = _evalSurveys.filter(s => s.status === 'collecting').length
const _closedCount     = _evalSurveys.filter(s => s.status === 'closed' || s.status === 'pending_review').length
const _ratedSurveys    = _evalSurveys.filter(s => s.responseRate > 0)
const _avgCompletion   = _ratedSurveys.length > 0
  ? +(_ratedSurveys.reduce((a, s) => a + s.responseRate, 0) / _ratedSurveys.length).toFixed(1)
  : null

const completionColor = (pct: number) =>
  pct >= 80 ? 'var(--chart-2)' : pct >= 60 ? 'var(--foreground)' : 'var(--chip-4)'

// ── Add Course Offering dialog (matches live's create action) ─────────────────
function AddOfferingDialog({ open, onOpenChange, onAdd }: {
  open: boolean; onOpenChange: (v: boolean) => void
  onAdd: (o: CourseOffering) => void
}) {
  const [masterCourseId, setMasterCourseId] = useState('')
  const [termId, setTermId] = useState('')
  const [primaryFacultyId, setPrimaryFacultyId] = useState('')
  const [cohort, setCohort] = useState('')
  const valid = masterCourseId && termId && primaryFacultyId

  function submit() {
    if (!valid) return
    onAdd({
      id: `off-${masterCourseId}-${termId}`,
      masterCourseId, termId, primaryFacultyId,
      collaboratorIds: [], enrolledCount: 0, status: 'planned',
      cohort: cohort || 'Class of 2027',
    } as CourseOffering)
    setMasterCourseId(''); setTermId(''); setPrimaryFacultyId(''); setCohort('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add course offering</DialogTitle>
          <DialogDescription>
            Offerings normally sync from Prism. Add one manually for a course running this program.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field orientation="vertical">
            <FieldLabel htmlFor="off-course">Course *</FieldLabel>
            <Select value={masterCourseId} onValueChange={setMasterCourseId}>
              <SelectTrigger id="off-course" aria-label="Course"><SelectValue placeholder="Choose a course…" /></SelectTrigger>
              <SelectContent>
                {MOCK_MASTER_COURSES.map(c => <SelectItem key={c.id} value={c.id}>{c.code} · {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="vertical">
            <FieldLabel htmlFor="off-term">Term *</FieldLabel>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger id="off-term" aria-label="Term"><SelectValue placeholder="Choose a term…" /></SelectTrigger>
              <SelectContent>
                {MOCK_PROGRAM_TERMS.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="vertical">
            <FieldLabel htmlFor="off-faculty">Primary faculty *</FieldLabel>
            <Select value={primaryFacultyId} onValueChange={setPrimaryFacultyId}>
              <SelectTrigger id="off-faculty" aria-label="Primary faculty"><SelectValue placeholder="Choose faculty…" /></SelectTrigger>
              <SelectContent>
                {MOCK_FACULTY.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="vertical">
            <FieldLabel htmlFor="off-cohort">Cohort</FieldLabel>
            <Input id="off-cohort" value={cohort} onChange={e => setCohort(e.target.value)} placeholder="e.g. Class of 2027" />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={submit} disabled={!valid}>Add offering</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CoursesDirectoryPage() {
  const router = useRouter()
  const [offerings, setOfferings] = useState<CourseOffering[]>(MOCK_COURSE_OFFERINGS)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const courseById  = useMemo(() => new Map(MOCK_MASTER_COURSES.map(c => [c.id, c])), [])
  const termById    = useMemo(() => new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t])), [])
  const facultyById = useMemo(() => new Map(MOCK_FACULTY.map(f => [f.id, f])), [])

  const tableRows: OfferingRow[] = useMemo(
    () => offerings
      .map(r => {
        const courseCode = courseById.get(r.masterCourseId)?.code ?? '—'
        const termName   = termById.get(r.termId)?.name ?? '—'
        const surveyId   = surveyKeyMap.get(`${courseCode}-${termName}`)
        const completion = surveyId ? (surveyRateMap.get(surveyId) ?? null) : null
        return {
          id: r.id,
          courseCode,
          courseName:          courseById.get(r.masterCourseId)?.name ?? '—',
          termName,
          cohort:              r.cohort,
          primaryFacultyName:     facultyById.get(r.primaryFacultyId)?.name ?? '—',
          primaryFacultyInitials: facultyById.get(r.primaryFacultyId)?.initials ?? '',
          collaboratorCount:   r.collaboratorIds.length,
          enrolledCount:       r.enrolledCount,
          status:              r.status,
          surveyId,
          completion: completion !== null && completion > 0 ? completion : null,
        }
      }),
    [offerings, courseById, termById, facultyById],
  )

  // Filter options derive from the live offering set so manually-added offerings
  // stay filterable.
  const cohortOptions = useMemo(
    () => Array.from(new Set(offerings.map(o => o.cohort))).sort()
      .map(c => ({ value: c, label: c })),
    [offerings],
  )

  const activeCount = offerings.filter(o => o.status === 'active').length

  const kpis: MetricItem[] = [
    { id: 'total',      label: 'Total courses', value: offerings.length, delta: '', trend: 'neutral' },
    { id: 'collecting', label: 'Collecting',     value: _collectingCount, delta: '', trend: 'neutral' },
    { id: 'closed',     label: 'Closed/released', value: _closedCount,    delta: '', trend: 'neutral' },
    { id: 'completion', label: 'Avg completion',  value: _avgCompletion !== null ? `${_avgCompletion}%` : '—', delta: '', trend: 'neutral' },
  ]

  const columns: ColumnDef<OfferingRow>[] = [
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'courseCode', label: 'Course', sortable: true, width: 220,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs">{row.courseCode}</span>
          <TruncatedText className="text-xs text-muted-foreground max-w-44">{row.courseName}</TruncatedText>
        </div>
      ),
    },
    {
      key: 'termName', label: 'Term', sortable: true, width: 140,
      cell: (row) => <span className="text-sm">{row.termName}</span>,
      filter: {
        type: 'select', icon: 'fa-calendar', operators: ['is', 'is_not'],
        options: MOCK_PROGRAM_TERMS.map(t => ({ value: t.name, label: t.name })),
      },
    },
    {
      key: 'cohort', label: 'Cohort', sortable: true, width: 140,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.cohort}</span>,
      filter: { type: 'select', icon: 'fa-users', operators: ['is', 'is_not'], options: cohortOptions },
    },
    {
      key: 'primaryFacultyName', label: 'Primary faculty', sortable: true, width: 220,
      filter: {
        type: 'select', icon: 'fa-user', operators: ['is', 'is_not'],
        options: MOCK_FACULTY.map(f => ({ value: f.name, label: f.name })),
      },
      cell: (row) => (
        <div className="flex items-center gap-1.5 w-fit">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
              {row.primaryFacultyInitials || row.primaryFacultyName.replace(/^Dr\.?\s+/i, '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-32">{row.primaryFacultyName}</p>
            {row.collaboratorCount > 0 && (
              <p className="text-xs text-muted-foreground">+{row.collaboratorCount} collaborator{row.collaboratorCount === 1 ? '' : 's'}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'enrolledCount', label: 'Enrolled', sortable: true, width: 100,
      header: () => <span className="block text-right">Enrolled</span>,
      cell: (row) => <div className="text-right tabular-nums text-sm">{row.enrolledCount}</div>,
    },
    {
      key: 'completion', label: 'Completion', sortable: true, width: 110,
      header: () => <span className="block text-right">Completion</span>,
      cell: (row) => (
        <div className="text-right tabular-nums text-sm font-semibold"
          style={{ color: row.completion !== null ? completionColor(row.completion) : 'var(--muted-foreground)' }}>
          {row.completion !== null ? `${row.completion}%` : '—'}
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true, width: 120,
      cell: (row) => <OfferingStatusBadge status={row.status} />,
      filter: {
        type: 'select', icon: 'fa-circle-dot', operators: ['is', 'is_not'],
        options: [
          { value: 'planned',   label: 'Planned' },
          { value: 'active',    label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'archived',  label: 'Archived' },
        ],
      },
    },
    {
      key: 'evalOrPrism', label: '', width: 32,
      cell: (row) => row.surveyId ? (
        <Button variant="ghost" size="icon-sm" aria-label="Open Evaluation Card"
          onClick={(e) => { e.stopPropagation(); setSelectedSurveyId(row.surveyId!) }}>
          <i className="fa-light fa-chart-bar text-xs" aria-hidden="true" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon-sm" aria-label="Open in Prism"
          onClick={(e) => { e.stopPropagation(); window.open(`${PRISM_BASE}/${row.id}`, '_blank', 'noopener') }}>
          <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Manage and view all courses in the program."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/surveys/push')}>Push Surveys</Button>
            <Button onClick={() => setAddOpen(true)}>Add Course Offering</Button>
          </div>
        }
      />
      <EvaluationCardSheet surveyId={selectedSurveyId} onClose={() => setSelectedSurveyId(null)} />
      <AddOfferingDialog open={addOpen} onOpenChange={setAddOpen} onAdd={(o) => setOfferings(prev => [o, ...prev])} />

      <div className="shrink-0 px-4 lg:px-6" style={{ paddingBlock: 4 }}>
        <KeyMetrics variant="compact" showHeader={false} metricsSingleRow metrics={kpis} />
      </div>

      <div className="flex-1 overflow-auto" tabIndex={0} style={{ paddingTop: 16, paddingBottom: 28 }}>
        <div className="w-full flex flex-col gap-4">
          <DataTablePaginated<OfferingRow>
            data={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            defaultGroupBy="termName"
            onRowClick={(row) => router.push(`/admin/offerings/${encodeURIComponent(row.courseCode)}`)}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-rectangle-list text-muted-foreground text-2xl" aria-hidden="true" />
                <p className="text-sm font-medium">No courses match your search or filters</p>
              </div>
            }
            bulkActionsSlot={(selected) => (
              <Button variant="default" size="sm" className="h-7 text-xs"
                onClick={() => { router.push(`/surveys/push?offerings=${Array.from(selected).join(',')}`) }}>
                <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 11 }} />
                Push Survey
              </Button>
            )}
          />
        </div>
      </div>
    </>
  )
}
