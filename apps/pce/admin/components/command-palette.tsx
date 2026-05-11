'use client'

/**
 * COMMAND PALETTE — ⌘K / Ctrl+K overlay for PCE admin navigation.
 *
 * Per docs/governance/component-depth-audits/coach-mark-and-command.md, Vishaka
 * has direct backing for this pattern: "Faculty search by course number first
 * — '301 tox' → toxicology — course code is primary search key" (see
 * apps/exam-management/docs/storytelling/vishaka-perspective.md:66).
 *
 * Built on the DS `CommandDialog` (which wraps `cmdk` under the hood — never
 * import cmdk directly).
 *
 * Item sources (4 groups):
 *   1. Surveys   — MOCK_SURVEYS,  label = "COURSE — NAME (TERM)",  → /surveys/:id
 *   2. Templates — MOCK_TEMPLATES,                                 → /templates/:id
 *   3. Admin     — ENTITIES (11 program-level masters),             → /admin/<slug>
 *   4. Pages     — top-level routes
 *
 * Filtering is built-in via `CommandInput` — `cmdk` matches the user query
 * against the `value` (or text content) of every `CommandItem`.
 *
 * Hotkey: ⌘K (Mac) / Ctrl+K (Win/Linux) toggles open. Suppressed when focus is
 * already in an editable target (using shared `isEditableTarget` helper).
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  Kbd,
  KbdGroup,
} from '@exxat/ds/packages/ui/src'
import { MOCK_SURVEYS, MOCK_TEMPLATES } from '@/lib/pce-mock-data'
import { isEditableTarget } from '@/lib/editable-target'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Shared open/toggle state for the ⌘K palette. Mounted once at the (app)
 * layout so any descendant (sidebar, top-bar, future command launcher buttons)
 * can call `useCommandPalette().setOpen(true)` without prop-drilling.
 */
const CommandPaletteContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext)
  if (!ctx) {
    throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>')
  }
  return ctx
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  )
}

/**
 * Admin master-list entities — mirrored from app/(app)/admin/page.tsx so the
 * palette stays in sync with the visible entity grid. When a new entity goes
 * live (or its route slug changes), update both places.
 */
const ADMIN_ENTITIES: Array<{ key: string; title: string; href: string; icon: string }> = [
  { key: 'courses',          title: 'Master Courses',     href: '/admin/courses',          icon: 'fa-book' },
  { key: 'terms',            title: 'Terms',              href: '/admin/terms',            icon: 'fa-calendar-days' },
  { key: 'offerings',        title: 'Course Offerings',   href: '/admin/offerings',        icon: 'fa-rectangle-list' },
  { key: 'students',         title: 'Students',           href: '/admin/students',         icon: 'fa-graduation-cap' },
  { key: 'faculty',          title: 'Faculty',            href: '/admin/faculty',          icon: 'fa-users' },
  { key: 'permissions',      title: 'Permissions',        href: '/admin/permissions',      icon: 'fa-shield-check' },
  { key: 'content-areas',    title: 'Content Areas',      href: '/admin/content-areas',    icon: 'fa-tags' },
  { key: 'competencies',     title: 'Competencies',       href: '/admin/competencies',     icon: 'fa-medal' },
  { key: 'standards',        title: 'Standards',          href: '/admin/standards',        icon: 'fa-stamp' },
  { key: 'assessment-types', title: 'Assessment Types',   href: '/admin/assessment-types', icon: 'fa-clipboard-question' },
  { key: 'accommodations',   title: 'Accommodations',     href: '/admin/accommodations',   icon: 'fa-universal-access' },
]

const TOP_LEVEL_PAGES: Array<{ key: string; title: string; href: string; icon: string }> = [
  { key: 'home',        title: 'Home',                 href: '/',            icon: 'fa-house' },
  { key: 'surveys',     title: 'Surveys',              href: '/surveys',     icon: 'fa-paper-plane' },
  { key: 'templates',   title: 'Templates',            href: '/templates',   icon: 'fa-rectangle-list' },
  { key: 'analytics',   title: 'Analytics',            href: '/analytics',   icon: 'fa-chart-mixed' },
  { key: 'moderation',  title: 'Review & Moderation',  href: '/moderation',  icon: 'fa-shield-check' },
  { key: 'my-surveys',  title: 'My Surveys',           href: '/my-surveys',  icon: 'fa-clipboard-list' },
  { key: 'admin',       title: 'Setup',                href: '/admin',       icon: 'fa-gear-complex' },
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()

  // ⌘K / Ctrl+K toggle — suppress while user is typing in an Input/Textarea/contenteditable.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (isEditableTarget(e.target)) return
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [router, onOpenChange],
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search PCE" description="Search surveys, templates, admin entities, and pages.">
      <div className="flex items-center gap-2 border-b border-border px-3">
        <CommandInput variant="palette" placeholder="Search surveys, templates, setup, pages… (try a course code like 'BIO 201')" />
        <KbdGroup className="ms-auto shrink-0">
          <Kbd>esc</Kbd>
        </KbdGroup>
      </div>

      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Surveys">
          {MOCK_SURVEYS.map(s => {
            const label = `${s.courseCode} — ${s.courseName} (${s.term})`
            return (
              <CommandItem
                key={`survey-${s.id}`}
                value={`${label} ${s.cohort ?? ''} ${s.status}`}
                onSelect={() => go(`/surveys/${s.id}`)}
              >
                <i className="fa-light fa-paper-plane" aria-hidden="true" />
                <span className="flex-1 truncate">{label}</span>
                {s.cohort && (
                  <span className="text-xs text-muted-foreground tabular-nums">{s.cohort}</span>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Templates">
          {MOCK_TEMPLATES.map(t => (
            <CommandItem
              key={`template-${t.id}`}
              value={`${t.name} template ${t.status}`}
              onSelect={() => go(`/templates/${t.id}`)}
            >
              <i className="fa-light fa-rectangle-list" aria-hidden="true" />
              <span className="flex-1 truncate">{t.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{t.questionCount} questions</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Admin">
          {ADMIN_ENTITIES.map(e => (
            <CommandItem
              key={`admin-${e.key}`}
              value={`${e.title} admin setup ${e.key}`}
              onSelect={() => go(e.href)}
            >
              <i className={`fa-light ${e.icon}`} aria-hidden="true" />
              <span className="flex-1 truncate">{e.title}</span>
              <span className="text-xs text-muted-foreground">Setup</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pages">
          {TOP_LEVEL_PAGES.map(p => (
            <CommandItem
              key={`page-${p.key}`}
              value={`${p.title} page ${p.href}`}
              onSelect={() => go(p.href)}
            >
              <i className={`fa-light ${p.icon}`} aria-hidden="true" />
              <span className="flex-1 truncate">{p.title}</span>
              <span className="text-xs text-muted-foreground">{p.href}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div
        className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground"
        style={{ background: 'var(--muted)' }}
      >
        <span className="inline-flex items-center gap-1.5">
          Press <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup> to search
        </span>
        <span className="inline-flex items-center gap-1.5">
          <KbdGroup><Kbd>esc</Kbd></KbdGroup> to close
        </span>
      </div>
    </CommandDialog>
  )
}
