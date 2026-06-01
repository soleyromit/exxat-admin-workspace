'use client'
// Table primitive used directly (not DataTable) — documented hand-roll.
// Embedded picker inside a Sheet with a pinned footer CTA; DataTable's bulk-actions
// bar conflicts with the Sheet footer. See docs/governance/ds-adoption.md.

import { useState, useRef, useEffect } from 'react'
import {
  Button, Badge, Checkbox,
  Input,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { MOCK_STUDENTS, MOCK_FACULTY } from '@/lib/pce-mock-data'

export interface PrismRecipient {
  id: string
  name: string
  email: string
  source: 'prism'
  subtitle?: string
  personaType?: 'student' | 'faculty' | 'personnel'
}

type Persona = 'student' | 'faculty' | 'personnel'

const FACULTY_EXTENDED = MOCK_FACULTY.map((f, i) => ({
  ...f,
  email: `${f.name.toLowerCase().replace(/[\s.]/g, '.')}@example.com`,
  status: i % 5 === 0 ? 'N/A' : 'Active',
  profileTypes: i % 4 === 0 ? 'N/A' : 'Faculty',
  position: ['Dean', 'Associate Dean', 'Full Professor', 'Assistant Professor', 'Director of Clinical Education', 'Department Chair'][i % 6],
}))

const STUDENT_COHORTS = Array.from(new Set(MOCK_STUDENTS.map(s => s.cohort))).sort()

interface ExxatPrismSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: Set<string>
  onCommit: (recipients: PrismRecipient[]) => void
}

export function ExxatPrismSheet({ open, onOpenChange, selectedIds: initialIds, onCommit }: ExxatPrismSheetProps) {
  const [tab, setTab] = useState<Persona>('student')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialIds))
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Student filters
  const [studentStatus, setStudentStatus] = useState('all')
  const [studentCohort, setStudentCohort] = useState('all')
  // Faculty filters
  const [facultyStatus, setFacultyStatus] = useState('all')

  // Sync selection + reset transient state each time the sheet opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(initialIds))
      setSearch('')
      setSearchOpen(false)
      setTab('student')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleTabChange(t: Persona) {
    setTab(t)
    setSearch('')
    setSearchOpen(false)
  }

  const filteredStudents = MOCK_STUDENTS.filter(s => {
    const q = search.toLowerCase()
    const matchesSearch = !search || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    const matchesStatus = studentStatus === 'all' || s.enrollmentStatus === studentStatus
    const matchesCohort = studentCohort === 'all' || s.cohort === studentCohort
    return matchesSearch && matchesStatus && matchesCohort
  })

  const filteredFaculty = FACULTY_EXTENDED.filter(f => {
    const q = search.toLowerCase()
    const matchesSearch = !search || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)
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

  // Select All / Clear All are tab-scoped so mixed selection across tabs works
  function selectAll() {
    const ids = tab === 'student'
      ? filteredStudents.map(s => s.id)
      : tab === 'faculty'
      ? filteredFaculty.map(f => f.id)
      : []
    setSelectedIds(prev => new Set([...prev, ...ids]))
  }

  function clearAll() {
    const poolIds = tab === 'student'
      ? new Set(MOCK_STUDENTS.map(s => s.id))
      : tab === 'faculty'
      ? new Set(FACULTY_EXTENDED.map(f => f.id))
      : new Set<string>()
    setSelectedIds(prev => new Set([...prev].filter(id => !poolIds.has(id))))
  }

  // Commit collects from all pools — supports mixed student+faculty selection
  function handleCommit() {
    const recipients: PrismRecipient[] = []
    MOCK_STUDENTS.filter(s => selectedIds.has(s.id)).forEach(s =>
      recipients.push({ id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email, source: 'prism', subtitle: s.cohort, personaType: 'student' })
    )
    FACULTY_EXTENDED.filter(f => selectedIds.has(f.id)).forEach(f =>
      recipients.push({ id: f.id, name: f.name, email: f.email, source: 'prism', subtitle: f.position, personaType: 'faculty' })
    )
    onCommit(recipients)
  }

  const filteredRows = tab === 'student' ? filteredStudents.length : tab === 'faculty' ? filteredFaculty.length : 0
  const totalRows = tab === 'student' ? MOCK_STUDENTS.length : tab === 'faculty' ? FACULTY_EXTENDED.length : 0
  const selectedCount = selectedIds.size

  const hasActiveFilters =
    (tab === 'student' && (studentStatus !== 'all' || studentCohort !== 'all')) ||
    (tab === 'faculty' && facultyStatus !== 'all')

  function resetFilters() {
    setStudentStatus('all')
    setStudentCohort('all')
    setFacultyStatus('all')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-5xl">

        {/* Header */}
        <SheetHeader className="flex flex-row items-center gap-3 shrink-0 border-b border-border" style={{ padding: '14px 20px' }}>
          <SheetTitle className="flex-1 text-base font-semibold">Select Recipients</SheetTitle>
          <Button variant="default" size="sm" onClick={handleCommit}>
            {selectedCount > 0
              ? `Add ${selectedCount} recipient${selectedCount !== 1 ? 's' : ''}`
              : 'Add / Update Recipients'}
          </Button>
        </SheetHeader>

        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Recipient type"
          className="shrink-0 border-b border-border flex"
          style={{ paddingInline: 20 }}
        >
          {(['student', 'faculty', 'personnel'] as Persona[]).map(t => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => handleTabChange(t)}
              className={cn(
                'px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset capitalize',
                tab === t
                  ? 'border-foreground text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'student' ? 'Students' : t === 'faculty' ? 'Faculty' : 'Personnel'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Combined filter + action toolbar */}
          <div
            className="flex items-center gap-2 shrink-0 border-b border-border"
            style={{ padding: '8px 14px' }}
          >
            {/* Left: tab-specific filters */}
            {tab === 'student' && (
              <>
                <Select value={studentStatus} onValueChange={setStudentStatus}>
                  <SelectTrigger aria-label="Filter by status" className="h-7 text-xs" style={{ minWidth: 108 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={studentCohort} onValueChange={setStudentCohort}>
                  <SelectTrigger aria-label="Filter by cohort" className="h-7 text-xs" style={{ minWidth: 108 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cohorts</SelectItem>
                    {STUDENT_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}

            {tab === 'faculty' && (
              <Select value={facultyStatus} onValueChange={setFacultyStatus}>
                <SelectTrigger aria-label="Filter by status" className="h-7 text-xs" style={{ minWidth: 108 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs rounded px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Reset
              </button>
            )}

            <div className="flex-1" />

            {/* Select All / Clear All */}
            {tab !== 'personnel' && (
              <>
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={selectAll}>
                  Select All
                </Button>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>·</span>
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={clearAll}>
                  Clear
                </Button>
              </>
            )}

            {/* DS toggle search */}
            {searchOpen ? (
              <div className="relative flex items-center">
                <i className="fa-light fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none" aria-hidden="true" />
                <Input
                  ref={searchRef}
                  type="text"
                  role="searchbox"
                  inputMode="search"
                  autoComplete="off"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onBlur={() => { if (!search) setSearchOpen(false) }}
                  onKeyDown={e => { if (e.key === 'Escape') { setSearch(''); setSearchOpen(false) } }}
                  className={cn('h-8 w-48 pl-7 text-xs', search ? 'pr-8' : 'pr-2')}
                  aria-label="Search recipients"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                aria-label="Search recipients"
                onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 10) }}
                className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="fa-light fa-magnifying-glass text-[13px]" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {tab === 'student' && (
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

            {tab === 'faculty' && (
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

            {tab === 'personnel' && (
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

          {/* Footer */}
          <div
            className="shrink-0 border-t border-border flex items-center justify-end"
            style={{ padding: '8px 14px' }}
          >
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Showing {filteredRows} of {totalRows} results
            </p>
          </div>
        </div>

      </SheetContent>
    </Sheet>
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
