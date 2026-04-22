/**
 * Searchable ⌘K rows from mock/API data. Wire new sources here — not in `command-menu-config.ts`.
 */

import type { CommandMenuGroup, CommandMenuItem } from "@/lib/command-menu-config"
import { ALL_PLACEMENTS } from "@/lib/mock/placements"

function placementSearchItems(): CommandMenuItem[] {
  return ALL_PLACEMENTS.map((p) => {
    const nameParts = p.student.trim().split(/\s+/)
    return {
      id: `placement-${p.id}`,
      label: `${p.student} — ${p.internship}`,
      icon: "fa-light fa-user-graduate",
      href: "/data-list",
      keywords: [
        p.student,
        ...nameParts,
        p.program,
        p.site,
        p.internship,
        p.specialization,
        p.email,
        p.supervisor,
        p.status,
        p.compliance,
      ]
        .filter(Boolean)
        .join(" "),
    }
  })
}

/** Placements (student names, sites, programs, …) — passed as `dataGroups` in the app layout. */
export function getCommandMenuSearchDataGroups(): CommandMenuGroup[] {
  return [
    {
      id: "placements",
      heading: "Placements",
      items: placementSearchItems(),
      searchOnly: true,
    },
  ]
}
