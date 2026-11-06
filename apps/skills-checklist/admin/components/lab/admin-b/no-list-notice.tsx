"use client"

/**
 * Students on no skill list, said once at the top of a report: they read as unassigned, never as behind and never as if on the default list (designer 2026-11-05, D-L103).
 * Names up to three, then how many more. The action opens Skill lists.
 */
import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { namesUpTo } from "@/lib/lab/lists"
import { capitalize, skillListNoun, skillListsNoun } from "@/lib/lab/terms"
import type { Person } from "@/lib/v2/types"

export function NoListNotice({ students }: { students: readonly Pick<Person, "id" | "name">[] }) {
  const to = useLabHref()
  if (!students.length) return null
  const names = namesUpTo(students.map((p) => p.name))
  return (
    <LocalBanner variant="info" title={`Not assigned: ${names}`} action={{ label: `Open ${capitalize(skillListsNoun())}`, href: to("admin/lists-cohorts") }} data-no-list-notice={students.length}>
      {`${students.length === 1 ? "This student has" : `These ${students.length.toLocaleString("en-US")} students have`} no ${skillListNoun()}, so no figure here counts them.`}
    </LocalBanner>
  )
}
