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
// Same AvatarGroup + per-person Tip + non-overlapping layout as Step 2's
// Evaluates column (courses-evaluatees/step-survey-instances.tsx
// EvaluateeChipCluster) — the established in-product pattern for "who, at a
// glance, with a name on hover," not a bare "+N" text suffix.
// AvatarGroupCount (not a text Badge) for overflow — never an overlapping
// -space-x stack (AvatarGroup's own doc comment: "Overlapping face
// piles... MUST NOT").

import { AvatarGroup, AvatarGroupCount, AvatarInitials, Tip } from '@exxatdesignux/ui'
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

export function FacultyAvatarRow({ instructors, className }: { instructors: PceInstructor[]; className?: string }) {
  if (instructors.length === 0) return null
  const MAX = 3
  const shown = instructors.slice(0, MAX)
  const overflow = instructors.length - MAX
  const names = instructors.map((i) => i.name).join(', ')
  return (
    <AvatarGroup className={className ?? 'gap-0.5'} role="group" aria-label={`Faculty: ${names}`}>
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
  )
}
