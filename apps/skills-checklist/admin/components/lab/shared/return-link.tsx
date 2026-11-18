"use client"

/**
 * The one in-page way back, for a page opened from somewhere with return context (walk 3, D13; amends D-L42). Opened from a skill list's
 * panel (`?from=lists&list=`) or from step 3 of New skill list (`?from=setup&list=`), a back icon sits at the start of the title row, leading
 * to that list as it was left; its name is "Back to {list}". Opened plainly, the title stands alone: the breadcrumb and the Skills panel are
 * the way back (D-L42), except on Evaluation settings (`plainToLists`), whose icon leads to Skill lists.
 *
 * Romit 2026-11-16: "Back to Skills list, should be an icon besides the title". Same pattern as a list's skills page (library-chrome
 * `data-back-to-lists`): DS Button ghost icon, `fa-arrow-left`, a link so every leave guard asks first. One control for Library, Categories
 * and tags, Evaluation settings and Course mapping.
 */
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { PAGE_TITLE_TYPE_CLASS } from "@exxatdesignux/ui/components/ui/page-header"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { useLabHref, useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { skillsNavHref } from "@/lib/lab/admin-ia"
import { capitalize, skillListsNoun } from "@/lib/lab/terms"
import { inPageReturn, returnTarget } from "@/lib/lab/return-to"
import { listById, programLists } from "@/lib/lab/lists"
import { useV2State } from "@/lib/v2/react"

type Return = NonNullable<ReturnType<typeof inPageReturn>>

/** Where the in-page return leads and what it says. Reads the store only with return context, so a plain page needs no store. */
function useReturnTo(r: Return): { href: string; label: string } | null {
  const to = useLabHref()
  const state = useV2State()
  const target = returnTarget(r.from, r.list)
  if (!target) return null
  const list = listById(programLists(state), r.list)
  return { href: to(target.href), label: `Back to ${list?.name ?? target.label()}` }
}

/** The back icon and the page's h1 on one row. */
export function BackTitle({ href, label, children, titleClassName }: { href: string; label: string; children: React.ReactNode; titleClassName?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1" data-back-title>
      <Button asChild variant="ghost" size="icon" className="-ms-2 shrink-0">
        <Link href={href} aria-label={label} title={label} data-return-link>
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
        </Link>
      </Button>
      <h1 className={cn("min-w-0 break-words", PAGE_TITLE_TYPE_CLASS, titleClassName)}>{children}</h1>
    </div>
  )
}

function WithContext({ r, children }: { r: Return; children: React.ReactNode }) {
  const link = useReturnTo(r)
  if (!link) return <h1 className={PAGE_TITLE_TYPE_CLASS}>{children}</h1>
  return <BackTitle href={link.href} label={link.label}>{children}</BackTitle>
}

/**
 * The page title, with the back icon before it when there is somewhere to go back to. Pass it as PageFrame's `title`.
 * `plainToLists`: Evaluation settings (D-L155, Sankalp 2026-11-15 point 7) keeps a way out when opened plainly, to Skill lists.
 */
export function ReturnTitle({ children, plainToLists = false }: { children: React.ReactNode; plainToLists?: boolean }) {
  const r = inPageReturn(useSearchParams())
  const link = useLabLinkContext()
  if (r) return <WithContext r={r}>{children}</WithContext>
  if (!plainToLists) return <h1 className={PAGE_TITLE_TYPE_CLASS}>{children}</h1>
  return <BackTitle href={skillsNavHref(link)} label={`Back to ${capitalize(skillListsNoun())}`}>{children}</BackTitle>
}
