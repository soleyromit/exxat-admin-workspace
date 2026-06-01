'use client'
// Table primitive used directly (not DataTable) — documented hand-roll.
// Embedded picker inside a Sheet with a pinned footer CTA; DataTable's bulk-actions
// bar conflicts with the Sheet footer. See docs/governance/ds-adoption.md.

import { useState } from 'react'
import {
  Button, Badge, Checkbox,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@exxatdesignux/ui'
import { MOCK_STUDENTS, MOCK_FACULTY } from '@/lib/pce-mock-data'

export interface PrismRecipient {
  id: string
  name: string
  email: string
  source: 'prism'
  subtitle?: string
}

type Persona = 'student' | 'faculty' | 'personnel'

// Extended faculty mock — augment with display-only fields
const FACULTY_EXTENDED = MOCK_FACULTY.map((f, i) => ({
  ...f,
  email: `${f.name.toLowerCase().replace(/[\s.]/g, '.')}@example.com`,
  status: i % 5 === 0 ? 'N/A' : 'Active',
  profileTypes: i % 4 === 0 ? 'N/A' : 'Faculty',
  position: ['Dean', 'Associate Dean', 'Full Professor', 'Assistant Professor', 'Director of Clinical Education', 'Department Chair'][i % 6],
}))

// Personnel placeholder (empty — matches screenshot #11)
const PERSONNEL_MOCK: { id: string; name: string; email: string; status: string; designation: string; clinicalInstructor: string; practiceSettings: string }[] = []

// Student cohort options derived from mock data
const STUDENT_COHORTS = Array.from(new Set(MOCK_STUDENTS.map(s => s.cohort))).sort()

interface ExxatPrismSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: Set<string>
  onCommit: (recipients: PrismRecipient[]) => void
}

export function ExxatPrismSheet({ open, onOpenChange, selectedIds: initialIds, onCommit }: ExxatPrismSheetProps) {
  const [persona, setPersona] = useState<Persona | ''>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialIds))
  const [search, setSearch] = useState('')

  // Student filters
  const [studentStatus, setStudentStatus]         = useState('all')
  const [studentCohort, setStudentCohort]         = useState('all')
  const [studentFiltersApplied, setStudentFiltersApplied] = useState(false)

  // Faculty filters
  const [facultyStatus, setFacultyStatus]         = useState('all')
  const [facultyFiltersApplied, setFacultyFiltersApplied] = useState(false)

  // Derived filtered lists
  const filteredStudents = MOCK_STUDENTS.filter(s => {
    const matchesSearch = !search || `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = studentStatus === 'all' || s.enrollmentStatus === studentStatus
    const matchesCohort = studentCohort === 'all' || s.cohort === studentCohort
    return matchesSearch && matchesStatus && matchesCohort
  })

  const filteredFaculty = FACULTY_EXTENDED.filter(f => {
    const matchesSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = facultyStatus === 'all' || (facultyStatus === 'active' ? f.status === 'Active' : f.status === 'N/A')
    return matchesSearch && matchesStatus
  })

  function toggleId(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    if (persona === 'student') setSelectedIds(new Set(filteredStudents.map(s => s.id)))
    else if (persona === 'faculty') setSelectedIds(new Set(filteredFaculty.map(f => f.id)))
  }

  function clearAll() { setSelectedIds(new Set()) }

  function handleCommit() {
    const recipients: PrismRecipient[] = []
    if (persona === 'student') {
      MOCK_STUDENTS.filter(s => selectedIds.has(s.id)).forEach(s => recipients.push({
        id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email, source: 'prism', subtitle: s.cohort,
      }))
    } else if (persona === 'faculty') {
      FACULTY_EXTENDED.filter(f => selectedIds.has(f.id)).forEach(f => recipients.push({
        id: f.id, name: f.name, email: f.email, source: 'prism', subtitle: f.position,
      }))
    }
    onCommit(recipients)
  }

  const totalRows = persona === 'student' ? filteredStudents.length : persona === 'faculty' ? filteredFaculty.length : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-5xl">

        {/* Header */}
        <SheetHeader className="flex flex-row items-center gap-3 shrink-0 border-b border-border" style={{ padding: '14px 20px' }}>
          <SheetTitle className="flex-1 text-base font-semibold">Select Recipients</SheetTitle>
          <Button variant="default" size="sm" onClick={handleCommit}>
            Add / Update Recipients
          </Button>
        </SheetHeader>

        {/* Body — layout switches based on persona selection */}
        {persona === '' ? (

          /* ── No persona selected: single-column prompt ── */
          <div className="flex flex-col flex-1 overflow-auto items-center" style={{ padding: '40px 24px' }}>
            <div className="flex flex-col gap-5 w-full" style={{ maxWidth: 480 }}>
              {/* Select Persona card */}
              <div className="flex flex-col gap-3 rounded-xl border border-border" style={{ padding: 16, background: 'var(--card)' }}>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">Select Persona</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Select a persona first to choose individual recipients
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    Persona <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <Select value={persona} onValueChange={v => { setPersona(v as Persona); setSelectedIds(new Set()); setSearch('') }}>
                    <SelectTrigger aria-label="Select persona">
                      <SelectValue placeholder="Select Persona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="personnel">Personnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Empty state */}
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <i className="fa-light fa-users text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">No Recipients Added Yet</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>
                    First select the persona and then select recipients from the populated list.
                  </p>
                </div>
              </div>
            </div>
          </div>

        ) : (

          /* ── Persona selected: two-panel layout ── */
          <div className="flex flex-1 overflow-hidden">

            {/* Left: Persona selector + Filters */}
            <div
              className="flex flex-col gap-3 shrink-0 overflow-auto border-r border-border"
              style={{ width: 280, padding: '16px 14px' }}
            >
              {/* Select Persona card */}
              <div className="flex flex-col gap-3 rounded-xl border border-border" style={{ padding: 14, background: 'var(--card)' }}>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">Select Persona</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Select a persona first to choose individual recipients
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    Persona <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <Select value={persona} onValueChange={v => { setPersona(v as Persona); setSelectedIds(new Set()); setSearch('') }}>
                    <SelectTrigger aria-label="Select persona" style={{ height: 36, fontSize: 13 }}>
                      <SelectValue placeholder="Select Persona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="personnel">Personnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Configure Filters card */}
              <div className="flex flex-col gap-3 rounded-xl border border-border" style={{ padding: 14, background: 'var(--card)' }}>
                <p className="text-sm font-semibold">Configure Filters</p>

                {persona === 'student' && (
                  <>
                    <FilterField label="Status">
                      <Select value={studentStatus} onValueChange={setStudentStatus}>
                        <SelectTrigger aria-label="Filter by status" style={{ height: 34, fontSize: 12 }}>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="enrolled">Enrolled</SelectItem>
                          <SelectItem value="graduated">Graduated</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          <SelectItem value="on-leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterField>
                    <FilterField label="Cohort">
                      <Select value={studentCohort} onValueChange={setStudentCohort}>
                        <SelectTrigger aria-label="Filter by cohort" style={{ height: 34, fontSize: 12 }}>
                          <SelectValue placeholder="Select Cohort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cohorts</SelectItem>
                          {STUDENT_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FilterField>
                    <FilterField label="Group">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Groups" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Enrollment Term">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Enrollment Term" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Graduation Term">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Graduation Term" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Category">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Campus">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Campus" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Tags">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Tags" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                  </>
                )}

                {persona === 'faculty' && (
                  <>
                    <FilterField label="Faculty Rank">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Faculty Rank" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Faculty / Staff">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Faculty or Staff" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Administrative Position">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Administrative Position" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Status">
                      <Select value={facultyStatus} onValueChange={setFacultyStatus}>
                        <SelectTrigger aria-label="Filter by status" style={{ height: 34, fontSize: 12 }}>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterField>
                  </>
                )}

                {persona === 'personnel' && (
                  <>
                    <FilterField label="Status">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Status" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Include Clinical Instructor">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Include Clinical Instructor" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Tags">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Tags" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Designation">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Designation" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Practice Settings">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Practice Settings" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                    <FilterField label="Personnel Category">
                      <Select disabled><SelectTrigger style={{ height: 34, fontSize: 12 }}><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent /></Select>
                    </FilterField>
                  </>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => { setStudentStatus('all'); setStudentCohort('all'); setFacultyStatus('all') }}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" onClick={() => {}}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Search + table + footer */}
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Search + Select All/Clear All */}
              <div
                className="flex items-center gap-3 shrink-0 border-b border-border"
                style={{ padding: '10px 14px' }}
              >
                <div
                  className="flex items-center gap-2 flex-1 rounded-md"
                  style={{ padding: '5px 10px', border: '1px solid var(--border-control-35)', background: 'var(--background)' }}
                >
                  <i className="fa-light fa-magnifying-glass text-xs shrink-0" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    placeholder="Search recipients by name or email"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent text-sm outline-none flex-1"
                    style={{ color: 'var(--foreground)' }}
                    aria-label="Search recipients"
                  />
                </div>
                {persona !== 'personnel' && (
                  <>
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={clearAll}>
                      Clear All
                    </Button>
                  </>
                )}
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {persona === 'student' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10" />
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cohort</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">No record found</TableCell>
                        </TableRow>
                      ) : filteredStudents.map(s => (
                        <TableRow key={s.id} className="cursor-pointer" onClick={() => toggleId(s.id)}>
                          <TableCell>
                            <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleId(s.id)} aria-label={`Select ${s.firstName} ${s.lastName}`} onClick={e => e.stopPropagation()} />
                          </TableCell>
                          <TableCell className="text-sm font-medium">{s.firstName} {s.lastName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                          <TableCell className="text-sm">{s.cohort}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">N/A</TableCell>
                          <TableCell>
                            <StatusBadge status={s.enrollmentStatus === 'enrolled' ? 'Active' : s.enrollmentStatus === 'withdrawn' ? 'Withdrawn' : 'N/A'} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {persona === 'faculty' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10" />
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Profile Types</TableHead>
                        <TableHead>Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFaculty.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">No record found</TableCell>
                        </TableRow>
                      ) : filteredFaculty.map(f => (
                        <TableRow key={f.id} className="cursor-pointer" onClick={() => toggleId(f.id)}>
                          <TableCell>
                            <Checkbox checked={selectedIds.has(f.id)} onCheckedChange={() => toggleId(f.id)} aria-label={`Select ${f.name}`} onClick={e => e.stopPropagation()} />
                          </TableCell>
                          <TableCell className="text-sm font-medium">{f.name}</TableCell>
                          <TableCell><StatusBadge status={f.status} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{f.email}</TableCell>
                          <TableCell className="text-sm">{f.profileTypes}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{f.position}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {persona === 'personnel' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Clinical Instructor</TableHead>
                        <TableHead>Practice Settings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">No record found</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Footer: showing N of M */}
              <div
                className="shrink-0 border-t border-border flex items-center justify-end"
                style={{ padding: '8px 14px' }}
              >
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Showing {totalRows} of {totalRows} results
                </p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'Active'
  if (status === 'N/A') return <span className="text-sm text-muted-foreground">N/A</span>
  return (
    <Badge
      variant="secondary"
      className="rounded-full text-xs"
      style={{
        paddingInline: 8,
        paddingBlock: 2,
        background: 'var(--muted)',
        color: isActive ? 'var(--chart-2)' : 'var(--muted-foreground)',
      }}
    >
      {status}
    </Badge>
  )
}
