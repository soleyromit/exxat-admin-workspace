'use client'

// Shared faculty-identity row — term-workspace.tsx (table) and
// term-evaluations-board.tsx (board) both render this so an offering's
// faculty look identical between the two views (2026-08-13, Granola
// 0ef80c33, Vishal: "the headers here should match the statuses there —
// it's the same information," extended here to faculty identity, not just
// status labels, once both views collapsed to one row/card per offering).
// Split into its own file rather than exported from either caller — the
// table already imports the board component, so exporting this from
// term-workspace.tsx would make the board import back from it (circular).
//
// Same role-label Badge + per-role AvatarGroup + per-person Tip as Step 2's
// Evaluatees column (courses-evaluatees/step-survey-instances.tsx
// EvaluateeChipCluster) — that column switched from a bare avatar cluster to
// role-label badges on 2026-08-12 ("Primary faculty ×2" + avatars per role),
// but this shared component was never updated to match, so the survey table
// and board kept the pre-08-12 look (Romit, 2026-08-25: "the evaluatee table
// isn't looking the same as push survey evaluatees column"). Grouped by
// PceInstructor's own 'primary' | 'guest' role field — a simpler taxonomy
// than the wizard's per-instance role labels, so at most two badges ever
// render here, never an overflow "+N" badge.
// AvatarGroupCount (not a text Badge) for within-group overflow — never an
// overlapping -space-x stack (AvatarGroup's own doc comment: "Overlapping
// face piles... MUST NOT").

import { AvatarGroup, AvatarGroupCount, AvatarInitials, Badge, Tip } from '@exxatdesignux/ui'
import type { PceInstructor } from '@/lib/pce-mock-data'

// Program Director gets a distinct ring — Aarti, same meeting (0ef80c33):
// "the program director who has senior program complete visibility across
// everything can be shown in a different color... people who just have
// affiliation to that course can be shown in a different color icon."
// `--chart-3` not brand-color (feedback_ds_typography_color_discipline:
// brand-color is reserved for primary CTAs, never identity/semantic state)
// and not `--chart-2` (already means "correct/selected" elsewhere in the
// product). Ring, not a background recolor, so initials stay legible.
// Color is a secondary cue only — the Tip label carries the position too,
// so the distinction survives for screen readers and non-color viewing.
const isProgramDirector = (i: PceInstructor) => i.position === 'Program Director'

const MAX_PER_GROUP = 3

function RoleGroup({ label, icon, instructors }: { label: string; icon: string; instructors: PceInstructor[] }) {
  const shown = instructors.slice(0, MAX_PER_GROUP)
  const overflow = instructors.length - MAX_PER_GROUP
  return (
    <>
      <Badge
        tabIndex={0}
        variant="outline"
        className="h-6 gap-1 border-border bg-background px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <i className={`fa-light ${icon} text-[10px]`} aria-hidden="true" />
        {label}{instructors.length > 1 ? ` ×${instructors.length}` : ''}
      </Badge>
      <AvatarGroup className="gap-0.5" role="group" aria-label={`${label}: ${instructors.map((i) => i.name).join(', ')}`}>
        {shown.map((i) => {
          const isPD = isProgramDirector(i)
          return (
            <Tip key={i.id} label={isPD ? `${i.name} — Program Director` : i.name} side="top">
              <span
                tabIndex={0}
                className="inline-flex shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                style={isPD ? { boxShadow: '0 0 0 1.5px var(--chart-3)', borderRadius: '9999px' } : undefined}
              >
                <AvatarInitials initials={i.initials} size="sm" className="size-5" />
              </span>
            </Tip>
          )
        })}
        {overflow > 0 && <AvatarGroupCount className="text-[11px]">+{overflow}</AvatarGroupCount>}
      </AvatarGroup>
    </>
  )
}

export function FacultyAvatarRow({ instructors, className }: { instructors: PceInstructor[]; className?: string }) {
  if (instructors.length === 0) return null
  const primary = instructors.filter((i) => i.role === 'primary')
  const guest = instructors.filter((i) => i.role === 'guest')
  return (
    <div className={className ?? 'flex flex-wrap items-center gap-1.5'}>
      {primary.length > 0 && <RoleGroup label="Primary faculty" icon="fa-chalkboard-user" instructors={primary} />}
      {guest.length > 0 && <RoleGroup label="Guest faculty" icon="fa-microphone" instructors={guest} />}
    </div>
  )
}
