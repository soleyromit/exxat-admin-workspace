"use client"

/**
 * The one in-page way back, for a page opened from somewhere with return context (walk 3, D13; amends D-L42). Opened from a skill list's
 * panel (`?from=lists&list=`) or from step 3 of New skill list (`?from=setup&list=`), the header shows "Back to {list}", leading to that
 * list as it was left. Opened plainly, nothing renders: the breadcrumb and the Skills panel are the way back (D-L42), except on Evaluation
 * settings (`plainToLists`). One control for Library, Categories and tags, Evaluation settings and Course mapping. Bulk upload keeps its Cancel, which returns to the same place.
 */
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { useLabHref, useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { skillsNavHref } from "@/lib/lab/admin-ia"
import { capitalize, skillListsNoun } from "@/lib/lab/terms"
import { inPageReturn, returnTarget } from "@/lib/lab/return-to"
import { listById, programLists } from "@/lib/lab/lists"
import { useV2State } from "@/lib/v2/react"

/** Where the in-page return leads and what it says. Reads the store only with return context, so a plain page needs no store. */
function useReturnTo(r: NonNullable<ReturnType<typeof inPageReturn>>): { href: string; label: string } | null {
  const to = useLabHref()
  const state = useV2State()
  const target = returnTarget(r.from, r.list)
  if (!target) return null
  const list = listById(programLists(state), r.list)
  return { href: to(target.href), label: `Back to ${list?.name ?? target.label()}` }
}

function ReturnLinkTo({ r }: { r: NonNullable<ReturnType<typeof inPageReturn>> }) {
  const link = useReturnTo(r)
  if (!link) return null
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href={link.href} data-return-link data-return-to="">{link.label}</Link>
    </Button>
  )
}

/**
 * `plainToLists`: the one exception, Evaluation settings (D-L155). Opened plainly it still shows "Back to Skill lists", because Sankalp asked
 * for a visible way out of that page (2026-11-15, point 7, with a screenshot of the plain page).
 */
export function ReturnLink({ plainToLists = false }: { plainToLists?: boolean }) {
  const r = inPageReturn(useSearchParams())
  const link = useLabLinkContext()
  if (r) return <ReturnLinkTo r={r} />
  if (!plainToLists) return null
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href={skillsNavHref(link)} data-return-link>{`Back to ${capitalize(skillListsNoun())}`}</Link>
    </Button>
  )
}
