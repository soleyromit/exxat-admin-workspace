'use client'

/**
 * Global search — ⌘K command palette.
 *
 * Searches across ALL fields of every entity (not just name/title).
 * Shows recent searches in the dropdown when the input is empty.
 * Recent searches stored in localStorage; max 8.
 *
 * Entity coverage:
 *   Students  — name, studentId, email, cohort
 *   Faculty   — name, email, adminPosition, rank, department
 *   Courses   — courseName, courseNumber, cohort, facultyAssigned, term, academicYear
 *   Catalog   — courseName, courseNumber, department
 *   Questions — title, tags, course, folder
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog, Command, CommandInput, CommandList,
  CommandGroup, CommandItem, CommandEmpty, CommandSeparator,
  Button,
} from '@exxat/ds/packages/ui/src'
import { facultyStudents, facultyListRows } from '@/lib/faculty-mock-data'
import { courseOfferingRows } from '@/lib/course-mock-data'
import { masterCourses } from '@/lib/course-catalog-mock-data'
import { MOCK_QUESTIONS } from '@/lib/mock-questions'

// ── Recent-search persistence ─────────────────────────────────────────────────

const STORAGE_KEY = 'exam-mgmt-recent-searches'
const MAX_RECENT = 8

function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveRecent(query: string) {
  try {
    const prev = getRecent().filter((q) => q !== query)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)))
  } catch {}
}

function removeRecent(query: string) {
  try {
    const updated = getRecent().filter((q) => q !== query)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

// ── Search index — pre-built at module load ───────────────────────────────────

interface SearchResult {
  id: string
  type: 'student' | 'faculty' | 'course' | 'catalog' | 'question'
  label: string
  sublabel: string
  icon: string
  href: string
  /** All searchable text, lowercased and joined */
  searchText: string
}

const INDEX: SearchResult[] = [
  ...facultyStudents.slice(0, 50).map((s): SearchResult => ({
    id: `student-${s.id}`,
    type: 'student',
    label: `${s.firstName} ${s.lastName}`,
    sublabel: `${s.studentId} · ${s.cohort}`,
    icon: 'fa-user-graduate',
    href: `/students/${s.id}`,
    searchText: [s.firstName, s.lastName, s.studentId, s.email, s.cohort].join(' ').toLowerCase(),
  })),
  ...facultyListRows.map((f): SearchResult => ({
    id: `faculty-${f.id}`,
    type: 'faculty',
    label: f.fullName,
    sublabel: `${f.adminPosition} · ${f.email}`,
    icon: 'fa-chalkboard-user',
    href: `/faculty/${f.id}`,
    searchText: [f.fullName, f.email, f.adminPosition, f.rank].join(' ').toLowerCase(),
  })),
  ...courseOfferingRows.map((c): SearchResult => ({
    id: `course-${c.id}`,
    type: 'course',
    label: c.courseName,
    sublabel: `${c.courseNumber} · ${c.term} · ${c.cohort}`,
    icon: 'fa-graduation-cap',
    href: `/courses/${c.courseId}`,
    searchText: [c.courseName, c.courseNumber, c.term, c.cohort, c.facultyAssigned, c.academicYear].join(' ').toLowerCase(),
  })),
  ...masterCourses.map((m): SearchResult => ({
    id: `catalog-${m.id}`,
    type: 'catalog',
    label: m.courseName,
    sublabel: `${m.courseNumber} · ${m.department} · ${m.type}`,
    icon: 'fa-book-open',
    href: '/courses?tab=course-catalog',
    searchText: [m.courseName, m.courseNumber, m.department, m.type, m.description ?? '', m.prerequisites ?? ''].join(' ').toLowerCase(),
  })),
  ...MOCK_QUESTIONS.slice(0, 30).map((q): SearchResult => ({
    id: `question-${q.id}`,
    type: 'question',
    label: q.title.length > 80 ? q.title.slice(0, 80) + '…' : q.title,
    sublabel: `${q.course} · ${q.folder} · ${q.tags.slice(0, 2).join(', ')}`,
    icon: 'fa-circle-question',
    href: '/question-bank',
    searchText: [q.title, q.course, q.folder, ...q.tags].join(' ').toLowerCase(),
  })),
]

const GROUP_CONFIG: Record<SearchResult['type'], { label: string; color: string }> = {
  student:  { label: 'Students',       color: 'var(--chart-1)' },
  faculty:  { label: 'Faculty',        color: 'var(--chart-2)' },
  course:   { label: 'Course Offerings', color: 'var(--brand-color)' },
  catalog:  { label: 'Course Catalog', color: 'var(--chart-4)' },
  question: { label: 'Question Bank',  color: 'var(--chart-5)' },
}

const MAX_PER_GROUP = 4

function runSearch(query: string): Map<SearchResult['type'], SearchResult[]> {
  const q = query.trim().toLowerCase()
  if (!q) return new Map()
  const matched = INDEX.filter((r) => r.searchText.includes(q))
  const grouped = new Map<SearchResult['type'], SearchResult[]>()
  for (const r of matched) {
    const existing = grouped.get(r.type) ?? []
    if (existing.length < MAX_PER_GROUP) {
      existing.push(r)
      grouped.set(r.type, existing)
    }
  }
  return grouped
}

// ── Dialog ────────────────────────────────────────────────────────────────────

interface GlobalSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>([])
  const [results, setResults] = useState<Map<SearchResult['type'], SearchResult[]>>(new Map())

  // Load recent on open
  useEffect(() => {
    if (open) setRecent(getRecent())
  }, [open])

  // Re-run search as query changes
  useEffect(() => {
    setResults(runSearch(query))
  }, [query])

  function handleClose() {
    onOpenChange(false)
    setQuery('')
  }

  function handleSelect(result: SearchResult) {
    saveRecent(result.label)
    handleClose()
    router.push(result.href)
  }

  function handleRecentSelect(term: string) {
    setQuery(term)
  }

  function handleRecentRemove(e: React.MouseEvent, term: string) {
    e.stopPropagation()
    removeRecent(term)
    setRecent((prev) => prev.filter((r) => r !== term))
  }

  const isEmpty = query.trim() === ''
  const hasResults = results.size > 0
  const totalCount = [...results.values()].reduce((s, arr) => s + arr.length, 0)

  return (
    <CommandDialog open={open} onOpenChange={handleClose} title="Global search">
      <Command shouldFilter={false}>
        <CommandInput
          variant="palette"
          placeholder="Search students, faculty, courses, questions…"
          value={query}
          onValueChange={setQuery}
        />

        <CommandList>
          {/* ── Empty query: show recent searches ─────────────────────── */}
          {isEmpty && recent.length > 0 && (
            <CommandGroup heading="Recent searches">
              {recent.map((term) => (
                <CommandItem
                  key={term}
                  value={term}
                  onSelect={() => handleRecentSelect(term)}
                  className="group flex items-center gap-3"
                >
                  <i
                    className="fa-light fa-clock-rotate-left text-muted-foreground shrink-0"
                    aria-hidden="true"
                    style={{ fontSize: 13, width: 16 }}
                  />
                  <span className="flex-1 text-sm">{term}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRecentRemove(e, term)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity shrink-0 rounded"
                    aria-label={`Remove "${term}" from recent searches`}
                  >
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* ── Empty query, no recent ─────────────────────────────────── */}
          {isEmpty && recent.length === 0 && (
            <div className="py-10 text-center">
              <i
                className="fa-light fa-magnifying-glass text-muted-foreground text-2xl mb-3 block"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                Search across students, faculty, courses, and questions
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Any column — name, ID, cohort, email, department, tags…
              </p>
            </div>
          )}

          {/* ── Active query: show grouped results ────────────────────── */}
          {!isEmpty && !hasResults && (
            <CommandEmpty>
              <div className="py-8 text-center">
                <i
                  className="fa-light fa-circle-xmark text-muted-foreground text-2xl mb-2 block"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-foreground">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different name, ID, cohort, or keyword.
                </p>
              </div>
            </CommandEmpty>
          )}

          {!isEmpty && hasResults && (
            <>
              {/* Results count */}
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                {totalCount} result{totalCount !== 1 ? 's' : ''} across {results.size} {results.size === 1 ? 'category' : 'categories'}
              </div>

              {(Object.keys(GROUP_CONFIG) as SearchResult['type'][]).map((type, typeIdx) => {
                const items = results.get(type)
                if (!items || items.length === 0) return null
                const cfg = GROUP_CONFIG[type]
                return (
                  <div key={type}>
                    {typeIdx > 0 && <CommandSeparator />}
                    <CommandGroup heading={cfg.label}>
                      {items.map((r) => (
                        <CommandItem
                          key={r.id}
                          value={r.id}
                          onSelect={() => handleSelect(r)}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="flex size-7 items-center justify-center rounded shrink-0"
                            style={{
                              backgroundColor: `color-mix(in oklch, ${cfg.color} 12%, var(--background))`,
                              color: cfg.color,
                            }}
                          >
                            <i className={`fa-light ${r.icon}`} aria-hidden="true" style={{ fontSize: 12 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{r.sublabel}</p>
                          </div>
                          <i
                            className="fa-light fa-arrow-right text-muted-foreground shrink-0"
                            aria-hidden="true"
                            style={{ fontSize: 11 }}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                )
              })}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

// ── Trigger button (rendered in SiteHeader) ───────────────────────────────────

export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false)

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground font-normal"
        style={{ minWidth: 200 }}
        onClick={() => setOpen(true)}
        aria-label="Open global search"
      >
        <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 12 }} />
        <span className="flex-1 text-start text-xs">Search everything…</span>
        <kbd
          className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-60"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
          aria-label="Command K"
        >
          ⌘K
        </kbd>
      </Button>

      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
