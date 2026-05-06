'use client'

/**
 * PERSONA SWITCHER — global persona dropdown for the SiteHeader.
 *
 * Visual model = QB header's existing persona dropdown (avatar + name + role
 * badge + chevron). Selecting a persona updates the global session, which
 * cascades to: nav, sidebar identity, /courses scope, QB folder access, and
 * any page that reads from useFacultySession().
 *
 * Two surfaces show this control:
 *   - SiteHeader (this component, every page)
 *   - QB header (already exists, reads/writes the same global session)
 */

import {
  Avatar, AvatarFallback,
  Badge, Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel,
} from '@exxat/ds/packages/ui/src'
import { useFacultySession } from '@/lib/faculty-session'
import { type Persona } from '@/lib/personas'

// Per Vishaka — three institutional roles surfaced in the UI:
//   Administrator     — full access to all courses + role assignment
//   Course Coordinator — manages a course (faculty with editor access)
//   Course Instructor  — contributes to a course (faculty with viewer access only)
//
// A faculty persona may be coordinator on one course and instructor on
// another; in that case we lead with Coordinator since it's the higher role.
function institutionalRole(p: Persona): { label: string; tone: 'brand' | 'info' | 'neutral' } {
  if (p.role === 'admin') return { label: 'Administrator', tone: 'brand' }
  const hasEditorAccess = p.courses.some(c => c.level === 'editor')
  if (hasEditorAccess) return { label: 'Course Coordinator', tone: 'info' }
  return { label: 'Course Instructor', tone: 'neutral' }
}

function roleBadgeStyle(tone: 'brand' | 'info' | 'neutral') {
  if (tone === 'brand') return {
    backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
    color: 'var(--brand-color-dark)',
  }
  if (tone === 'info') return {
    backgroundColor: 'color-mix(in oklch, var(--chart-1) 12%, var(--background))',
    color: 'var(--chart-1)',
  }
  return {
    backgroundColor: 'var(--muted)',
    color: 'var(--muted-foreground)',
  }
}

export function PersonaSwitcher() {
  const { currentPersona, setCurrentPersona, personas, hydrated } = useFacultySession()

  if (!hydrated) {
    // Same dimensions as the trigger so the header doesn't jump on hydration.
    return (
      <div className="h-8 w-44 rounded-md bg-muted/40" aria-hidden="true" />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2" aria-label="Switch persona">
          <Avatar style={{ width: 24, height: 24 }}>
            <AvatarFallback
              className="text-[9px] font-bold"
              style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
            >
              {currentPersona.initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium hidden sm:inline">
            {currentPersona.title} {currentPersona.name}
          </span>
          <Badge
            variant="secondary"
            className="rounded text-[10px]"
            style={roleBadgeStyle(institutionalRole(currentPersona).tone)}
          >
            {institutionalRole(currentPersona).label}
          </Badge>
          <i
            className="fa-light fa-chevron-down text-muted-foreground"
            aria-hidden="true"
            style={{ fontSize: 10 }}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
        {personas.map((p: Persona) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setCurrentPersona(p)}
            className="gap-2"
          >
            <Avatar style={{ width: 28, height: 28 }}>
              <AvatarFallback
                className="text-[10px] font-bold"
                style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
              >
                {p.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold truncate">
                  {p.title} {p.name}
                </span>
                {(() => {
                  const r = institutionalRole(p)
                  return (
                    <Badge
                      variant="secondary"
                      className="rounded text-[9px] uppercase tracking-wider"
                      style={roleBadgeStyle(r.tone)}
                    >
                      {r.label}
                    </Badge>
                  )
                })()}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {p.role === 'faculty' && p.courses.length > 0 && (() => {
                  const editorCount = p.courses.filter(c => c.level === 'editor').length
                  const viewerCount = p.courses.filter(c => c.level === 'viewer').length
                  return (
                    <>
                      <span>{p.courses.length} {p.courses.length === 1 ? 'course' : 'courses'}</span>
                      {editorCount > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{editorCount} coordinator</span>
                        </>
                      )}
                      {viewerCount > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{viewerCount} instructor</span>
                        </>
                      )}
                    </>
                  )
                })()}
                {p.role === 'admin' && (
                  <span>Full access · all courses · role assignment</span>
                )}
              </div>
            </div>
            {p.id === currentPersona.id && (
              <i
                className="fa-solid fa-check shrink-0"
                aria-hidden="true"
                style={{ fontSize: 11, color: 'var(--brand-color)' }}
              />
            )}
          </DropdownMenuItem>
        ))}
        <div
          style={{ margin: '4px 12px 4px', padding: '8px 0 0', borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs text-muted-foreground">
            Roles control access · Course Coordinators edit · Course Instructors are read-only on their courses.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
