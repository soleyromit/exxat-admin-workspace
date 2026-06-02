// overflow-hidden safe — floating uses Radix Portal (PopoverContent, TooltipContent, SelectContent all use Radix Portal)
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

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Avatar, AvatarFallback,
  Badge, Button,
  InputGroup, InputGroupAddon, InputGroupInput,
  LocalBanner,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { AddAccommodationModal } from '@/components/add-accommodation-modal'
import { facultyAccommodations, facultyStudents, type Accommodation, type AccommodationType } from '@/lib/faculty-mock-data'
import { mockCourses } from '@/lib/qb-mock-data'
import { useFacultySession } from '@/lib/faculty-session'
import { useStudentAccommodations } from '@/lib/student-accommodation-store'

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
  const { role, hydrated, currentPersona } = useFacultySession()
  const isAdmin = role === 'admin'
  const { localAccommodations, removeAccommodation } = useStudentAccommodations()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | AccommodationType>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [banner, setBanner] = useState<{
    studentName: string
    typeLabel: string
    undoIds: string[]
    pulseStudentId?: string
  } | null>(null)

  // 5-sec undo window — banner auto-dismisses if not used.
  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 5000)
    return () => clearTimeout(t)
  }, [banner])

  // Group accommodations by student — same student may appear under
  // multiple courses, but we want one roster entry per student. Merges
  // seed data with locally-created accommodations from the store.
  const roster = useMemo<RosterEntry[]>(() => {
    if (!hydrated) return []
    const all: Accommodation[] = [...facultyAccommodations, ...localAccommodations]
    const byStudent = new Map<string, Accommodation[]>()
    for (const a of all) {
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
  }, [hydrated, localAccommodations])

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

  const totalAccommodations = facultyAccommodations.length + localAccommodations.length
  const uniqueStudents = roster.length

  return (
    <>
      <SiteHeader title="Student Accommodations" />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Student Accommodations"
          subtitle={`${uniqueStudents} ${uniqueStudents === 1 ? 'student' : 'students'} · ${totalAccommodations} approved accommodations · follows to every registered course`}
          actions={
            isAdmin ? (
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={() => setModalOpen(true)}
              >
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

          {banner && (
            <LocalBanner
              variant="success"
              title="Accommodation added"
              dismissible
              onDismiss={() => setBanner(null)}
              action={{
                label: 'Undo',
                onClick: () => {
                  banner.undoIds.forEach(id => removeAccommodation(id))
                  setBanner(null)
                },
              }}
            >
              {banner.studentName} · {banner.typeLabel}
            </LocalBanner>
          )}

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
              <SelectTrigger className="w-[200px]" aria-label="Filter accommodations">
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
      </div>

      <AddAccommodationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        approverName={currentPersona ? `${currentPersona.title} ${currentPersona.name}` : 'Administrator'}
        onCreated={({ undoIds, studentName, typeLabel }) => {
          setBanner({ undoIds, studentName, typeLabel })
        }}
      />
    </>
  )
}

function RosterRow({ entry }: { entry: RosterEntry }) {
  return (
    <li className="px-5 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
      <Avatar className="size-10 shrink-0">
        {/* Roster avatars use a pure-neutral grey color-mix. Both
            `--foreground` (oklch 0.145 0 0) and `--background` (oklch 1 0 0)
            are zero-chroma, so the mix is guaranteed hue-neutral — even
            under theme-prism (rose). The DS uses the same construction for
            `--overlay` (globals.css line 299). The brand-tinted DS token
            `--avatar-initials-bg` is meant for a single user-identity
            moment (the trigger avatar in the header), not 11+ rows. */}
        <AvatarFallback
          className="text-xs font-bold"
          style={{
            background: 'var(--muted)',
            color: 'var(--muted-foreground)',
          }}
        >
          {entry.initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/students/${entry.studentId}`}
            className="text-sm font-semibold hover:underline"
            style={{ color: 'var(--brand-color)' }}>
            {entry.studentName}
          </Link>
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
                background: 'var(--muted)',
                border: '1px solid var(--border)',
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
