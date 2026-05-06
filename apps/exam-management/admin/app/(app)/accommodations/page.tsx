'use client'

/**
 * STUDENT ACCOMMODATIONS — top-level menu item per Vishaka.
 *
 * "Accommodations are a one-time setup per student that follows them to every
 * course they're registered to. Should be a top-level menu item, not buried
 * per course." Faculty / Course Coordinator can VIEW the roster + their
 * accommodations; only Administrators (or Student Services in production) can
 * edit.
 *
 * Phase 1 scope (per Vishaka's transcript):
 *   - List students with approved accommodations + their requirements.
 *   - Use this as planning information (room booking, proctor briefing).
 *   - No emailing / approval workflow yet — that's phase 2.
 */

import { useMemo, useState } from 'react'
import {
  Avatar, AvatarFallback,
  Badge, Button,
  InputGroup, InputGroupAddon, InputGroupInput,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { facultyAccommodations, facultyStudents, type Accommodation, type AccommodationType } from '@/lib/faculty-mock-data'
import { mockCourses } from '@/lib/qb-mock-data'
import { useFacultySession } from '@/lib/faculty-session'

const TYPE_LABEL: Record<AccommodationType, string> = {
  'extended-time':    'Extended time',
  'separate-room':    'Separate room',
  'extended-breaks':  'Extended breaks',
  'screen-reader':    'Screen reader',
  'quiet-room':       'Quiet room',
}

const TYPE_ICON: Record<AccommodationType, string> = {
  'extended-time':    'fa-clock',
  'separate-room':    'fa-door-open',
  'extended-breaks':  'fa-pause',
  'screen-reader':    'fa-volume',
  'quiet-room':       'fa-volume-xmark',
}

interface RosterEntry {
  studentId: string
  studentName: string
  initials: string
  programLabel: string
  accommodations: Accommodation[]
  courseCount: number
}

export default function AccommodationsPage() {
  const { role, hydrated } = useFacultySession()
  const isAdmin = role === 'admin'
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | AccommodationType>('all')

  // Group accommodations by student — same student may appear under
  // multiple courses, but we want one roster entry per student.
  const roster = useMemo<RosterEntry[]>(() => {
    if (!hydrated) return []
    const byStudent = new Map<string, Accommodation[]>()
    for (const a of facultyAccommodations) {
      const list = byStudent.get(a.studentId) ?? []
      list.push(a)
      byStudent.set(a.studentId, list)
    }
    const entries: RosterEntry[] = []
    byStudent.forEach((accs, studentId) => {
      const student = facultyStudents.find(s => s.id === studentId)
      if (!student) return
      const courseIds = new Set(accs.map(a => a.courseId))
      entries.push({
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        initials: student.initials,
        programLabel: courseIds.size === 1
          ? mockCourses.find(c => c.id === Array.from(courseIds)[0])?.code ?? '—'
          : `${courseIds.size} courses`,
        accommodations: accs,
        courseCount: courseIds.size,
      })
    })
    return entries.sort((a, b) => a.studentName.localeCompare(b.studentName))
  }, [hydrated])

  const filtered = useMemo(() => {
    return roster.filter(r => {
      const q = query.trim().toLowerCase()
      const matchesQuery = !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.programLabel.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' ||
        r.accommodations.some(a => a.type === typeFilter)
      return matchesQuery && matchesType
    })
  }, [roster, query, typeFilter])

  const totalAccommodations = facultyAccommodations.length
  const uniqueStudents = roster.length

  return (
    <>
      <SiteHeader title="Student Accommodations" />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Student Accommodations"
          subtitle={`${uniqueStudents} ${uniqueStudents === 1 ? 'student' : 'students'} · ${totalAccommodations} approved accommodations · follows to every registered course`}
          actions={
            isAdmin ? (
              <Button variant="default" size="sm" className="gap-2">
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add accommodation
              </Button>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-full gap-1.5"
                style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                <i className="fa-light fa-eye" aria-hidden="true" style={{ fontSize: 11 }} />
                View only
              </Badge>
            )
          }
        />

        <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">

          <div className="flex items-center gap-3 flex-wrap">
            <InputGroup className="w-full max-w-sm">
              <InputGroupAddon align="inline-start">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Search by student name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search students with accommodations"
              />
            </InputGroup>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | AccommodationType)}>
              <SelectTrigger className="w-[200px]">
                <i className="fa-light fa-filter me-2" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accommodation types</SelectItem>
                {(Object.keys(TYPE_LABEL) as AccommodationType[]).map(t => (
                  <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <i className="fa-light fa-universal-access text-3xl text-muted-foreground mb-3" aria-hidden="true" />
                <p className="font-semibold text-foreground">No matching accommodations</p>
                <p className="text-sm text-muted-foreground mt-1">Try clearing filters.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map(entry => (
                  <RosterRow key={entry.studentId} entry={entry} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

function RosterRow({ entry }: { entry: RosterEntry }) {
  return (
    <li className="px-5 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
      <Avatar className="size-10 shrink-0">
        <AvatarFallback
          className="text-xs font-bold"
          style={{ background: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
        >
          {entry.initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{entry.studentName}</p>
          <Badge
            variant="secondary"
            className="rounded font-mono text-[9px] uppercase tracking-wider"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            {entry.programLabel}
          </Badge>
          {entry.courseCount > 1 && (
            <span className="text-[11px] text-muted-foreground">
              · accommodations apply across all {entry.courseCount} courses
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {entry.accommodations.map(a => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1.5 text-xs rounded-md px-2 py-1"
              style={{
                background: 'color-mix(in oklch, var(--chart-1) 8%, var(--background))',
                border: '1px solid color-mix(in oklch, var(--chart-1) 20%, var(--border))',
                color: 'var(--foreground)',
              }}
              title={a.notes ?? `${TYPE_LABEL[a.type]}: ${a.detail}`}
            >
              <i className={`fa-light ${TYPE_ICON[a.type]}`} aria-hidden="true" style={{ fontSize: 11, color: 'var(--chart-1)' }} />
              <strong className="font-semibold">{TYPE_LABEL[a.type]}</strong>
              <span className="text-muted-foreground">· {a.detail}</span>
            </span>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground mt-2">
          Approved by {entry.accommodations[0].approvedBy} ·{' '}
          {new Date(entry.accommodations[0].approvedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </li>
  )
}
