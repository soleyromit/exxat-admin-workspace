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
  SidebarTrigger, Separator,
  Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent,
} from '@exxat/ds/packages/ui/src'

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
    href: '/admin/courses', status: 'available', metric: '8 courses' },

  { key: 'terms', title: 'Terms', icon: 'fa-calendar-days',
    description: 'Academic terms (Spring 2026, Fall 2025, etc.).',
    href: '/admin/terms', status: 'available', metric: '5 terms' },

  { key: 'offerings', title: 'Course Offerings', icon: 'fa-rectangle-list',
    description: 'A course delivered in a specific term and cohort, taught by a faculty member.',
    href: '/admin/offerings', status: 'available', metric: '8 offerings' },

  // Phase 1 — coming next

  { key: 'students', title: 'Students', icon: 'fa-graduation-cap',
    description: 'Synced from LMS or imported manually.',
    href: '/admin/students', status: 'available', metric: '17 students · 14 enrolled' },

  { key: 'faculty', title: 'Faculty', icon: 'fa-users',
    description: 'Faculty profiles and role assignments.',
    href: '/admin/faculty', status: 'available', metric: 'shared across modules' },

  { key: 'permissions', title: 'Permissions', icon: 'fa-shield-check',
    description: 'Role assignments and collaboration access.',
    href: '/admin/permissions', status: 'available', metric: '10 grants' },

  { key: 'content-areas', title: 'Content Areas', icon: 'fa-tags',
    description: 'Topic taxonomy mapped to courses + questions.',
    href: '/admin/content-areas', status: 'available', metric: '8 areas' },

  { key: 'competencies', title: 'Competencies', icon: 'fa-medal',
    description: 'Program-level outcome capabilities.',
    href: '/admin/competencies', status: 'available', metric: '8 competencies' },

  { key: 'standards', title: 'Standards', icon: 'fa-stamp',
    description: 'Accreditation requirements (CAPTE, ARC-PA, NCLEX, etc.).',
    href: '/admin/standards', status: 'available', metric: '8 standards' },

  { key: 'assessment-types', title: 'Assessment Types', icon: 'fa-clipboard-question',
    description: 'Pop quiz, timed, take-home, open-book, proctored.',
    href: '/admin/assessment-types', status: 'available', metric: '7 types (5 P1)' },

  // Shared module (workspace ADR-006)
  { key: 'accommodations', title: 'Accommodations', icon: 'fa-universal-access',
    description: 'Shared disability and accommodation catalog available across all modules.',
    href: '/admin/accommodations', status: 'available', metric: '12 in catalog' },
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
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Soon</span>
          )}
          {entity.status === 'shared' && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Shared</span>
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
          style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))' }}
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
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
          Admin · Setup
        </h1>
      </header>

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
