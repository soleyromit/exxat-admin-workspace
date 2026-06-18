'use client'

/**
 * Admin landing — 11 program-level master entities (workspace ADR-001).
 *
 * Per Aarti 2026-05-08 16:09: "Just go fucking create these pages." Build the
 * unglamorous setup screens first. Currently 2 of 11 entities have list views;
 * the rest are scoped tiles indicating "coming soon."
 */

import Link from 'next/link'
import {
  Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import {
  MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS, MOCK_COURSE_OFFERINGS,
  MOCK_STUDENTS, MOCK_ACCOMMODATIONS, MOCK_CONTENT_AREAS,
  MOCK_COMPETENCIES, MOCK_STANDARDS, MOCK_ASSESSMENT_TYPES,
} from '@/lib/pce-mock-data'

interface EntityTile {
  key: string
  title: string
  description: string
  icon: string
  href?: string
  /** Phase or status hint shown in tile footer. */
  status: 'available' | 'phase-2' | 'shared'
  /** Optional metric — count of items, etc. */
  metric?: string
}

const ENTITIES: EntityTile[] = [
  // Available now
  { key: 'courses', title: 'Master Courses', icon: 'fa-book',
    description: 'Catalog of every course the program offers.',
    href: '/admin/courses', status: 'available', metric: `${MOCK_MASTER_COURSES.length} courses` },

  { key: 'terms', title: 'Terms', icon: 'fa-calendar-days',
    description: 'Academic terms (Spring 2026, Fall 2025, etc.).',
    href: '/admin/terms', status: 'available', metric: `${MOCK_PROGRAM_TERMS.length} terms · ${MOCK_PROGRAM_TERMS.filter(t => t.status === 'active').length} active` },

  { key: 'offerings', title: 'Course Offerings', icon: 'fa-rectangle-list',
    description: 'A course delivered in a specific term and cohort, taught by a faculty member.',
    href: '/admin/offerings', status: 'available', metric: `${MOCK_COURSE_OFFERINGS.length} offerings · ${MOCK_COURSE_OFFERINGS.filter(o => o.status === 'active').length} active` },

  // Phase 1 — coming next

  { key: 'students', title: 'Students', icon: 'fa-graduation-cap',
    description: 'Synced from LMS or imported manually.',
    href: '/admin/students', status: 'available', metric: `${MOCK_STUDENTS.length} students · ${MOCK_STUDENTS.filter(s => s.enrollmentStatus === 'enrolled').length} enrolled` },

  { key: 'faculty', title: 'Faculty', icon: 'fa-users',
    description: 'Faculty profiles and role assignments.',
    href: '/admin/faculty', status: 'available', metric: 'shared across modules' },

  { key: 'email-templates', title: 'Email Templates', icon: 'fa-envelope',
    description: 'Initial invitation and reminder templates used each cycle.',
    href: '/admin/email-templates', status: 'available', metric: '2 templates' },

  { key: 'reminder-schedule', title: 'Reminder Schedule', icon: 'fa-bell',
    description: 'Default reminder intervals anchored to term end date.',
    href: '/admin/reminder-schedule', status: 'available', metric: '3 active intervals' },

  { key: 'permissions', title: 'Permissions', icon: 'fa-shield-check',
    description: 'Role assignments and collaboration access.',
    href: '/admin/permissions', status: 'available', metric: '10 grants' },

  { key: 'content-areas', title: 'Content Areas', icon: 'fa-tags',
    description: 'Topic taxonomy mapped to courses + questions.',
    href: '/admin/content-areas', status: 'available', metric: `${MOCK_CONTENT_AREAS.length} areas` },

  { key: 'competencies', title: 'Competencies', icon: 'fa-medal',
    description: 'Program-level outcome capabilities.',
    href: '/admin/competencies', status: 'available', metric: `${MOCK_COMPETENCIES.length} competencies` },

  { key: 'standards', title: 'Standards', icon: 'fa-stamp',
    description: 'Accreditation requirements (CAPTE, ARC-PA, NCLEX, etc.).',
    href: '/admin/standards', status: 'available', metric: `${MOCK_STANDARDS.length} standards` },

  { key: 'assessment-types', title: 'Assessment Types', icon: 'fa-clipboard-question',
    description: 'Pop quiz, timed, take-home, open-book, proctored.',
    href: '/admin/assessment-types', status: 'available', metric: `${MOCK_ASSESSMENT_TYPES.length} types (${MOCK_ASSESSMENT_TYPES.filter(t => t.phase === 1 && t.status === 'active').length} P1)` },

  // Shared module (workspace ADR-006)
  { key: 'accommodations', title: 'Accommodations', icon: 'fa-universal-access',
    description: 'Shared disability and accommodation catalog available across all modules.',
    href: '/admin/accommodations', status: 'available', metric: `${MOCK_ACCOMMODATIONS.filter(a => a.status === 'active').length} in catalog` },
]

/* DS Card slot composition (replaces hand-rolled <article> + raw divs).
 * Per card.md depth audit: one of 3 named Card-substitutes the audit regex
 * couldn't catch. Migration to slots aligns visual treatment with workspace. */
function EntityCard({ entity }: { entity: EntityTile }) {
  const isClickable = entity.status === 'available' && Boolean(entity.href)

  /* WCAG fix 2026-05-11 (parity with FolderCard at app/(app)/page.tsx):
     opacity-60 on the Card root drops muted-foreground descendants to ~2.57:1.
     Disabled state uses aria-disabled + bg-muted/30 + cursor-not-allowed so
     all text remains 4.5:1+. The "Soon" / "Shared" labels convey state. */
  const inner = (
    <Card
      size="sm"
      aria-disabled={!isClickable || undefined}
      className={
        'group relative h-full transition-colors ' +
        (isClickable
          ? 'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          : 'cursor-not-allowed bg-muted/30')
      }
    >
      <CardHeader>
        <CardAction>
          {entity.status === 'phase-2' && (
            <span className="text-[10px] font-medium text-muted-foreground">Soon</span>
          )}
          {entity.status === 'shared' && (
            <span className="text-[10px] font-medium text-muted-foreground">Shared</span>
          )}
          {isClickable && (
            <i
              className="fa-light fa-arrow-right text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          )}
        </CardAction>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-md mb-2"
          style={{ backgroundColor: 'var(--brand-tint)' }}
        >
          <i
            className={`fa-light ${entity.icon} text-sm`}
            style={{ color: 'var(--brand-color)' }}
            aria-hidden="true"
          />
        </div>
        <CardTitle className="text-sm font-semibold">{entity.title}</CardTitle>
        <CardDescription className="text-xs">{entity.description}</CardDescription>
      </CardHeader>
      {entity.metric && (
        <CardContent>
          <p className="text-xs text-muted-foreground tabular-nums">{entity.metric}</p>
        </CardContent>
      )}
    </Card>
  )

  if (isClickable && entity.href) {
    return <Link href={entity.href} className="block h-full" aria-label={`${entity.title}: ${entity.description}`}>{inner}</Link>
  }
  return inner
}

export default function AdminLandingPage() {
  return (
    <>
      <SiteHeader title="Admin · Setup" />
      <h1 className="sr-only">Admin Setup</h1>

      <div className="flex-1 overflow-auto" style={{ padding: '28px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-5">
          <p className="text-sm text-muted-foreground max-w-2xl">
            Program-level master lists shared across all modules.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ENTITIES.map(e => <EntityCard key={e.key} entity={e} />)}
          </div>
        </div>
      </div>
    </>
  )
}
