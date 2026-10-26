"use client"

/**
 * Shared pieces of the configure and rule impact pages: loading and not-found states, the skill facts subtitle and Cancel with
 * a discard check. The dashed in-page demo toolbar is gone (layout rule L12): demo states live in the lab bar's Scenario menu
 * (screens.json `scenarios`), and "Reset edits" arrives as the `lab:reset` window event that use-configure listens for.
 */
import * as React from "react"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@exxatdesignux/ui/components/ui/alert-dialog"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { PageFrame } from "@/components/skills/page-header"
import { evalsOfSkill } from "@/lib/v2/evidence-index"
import { pillSpec, skillPillValue } from "@/lib/v2/status-pill"
import type { Skill, V2State } from "@/lib/v2/types"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"

export const LIBRARY_HREF = "/lab/admin/skills-library"
export const mappingHref = (skillId: string) => `/lab/admin/course-mapping?skill=${encodeURIComponent(skillId)}`

/** Build a URL on the current page with some params changed (null removes one). */
export function useHref() {
  const pathname = usePathname() ?? ""
  const params = useSearchParams()
  return React.useCallback(
    (patch: Record<string, string | null>) => {
      const q = new URLSearchParams(params?.toString() ?? "")
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) q.delete(k)
        else q.set(k, v)
      }
      const s = q.toString()
      return s ? `${pathname}?${s}` : pathname
    },
    [pathname, params],
  )
}

/** Students with any evaluation on this skill. */
export const studentsWithEvidence = (state: V2State, skillId: string) => new Set(evalsOfSkill(state, skillId).map((e) => e.studentId)).size

/** Facts only (layout rule L1): the state badge, the category and, when in use, how many students have evidence. */
export function SkillSubtitle({ state, skill }: { state: V2State; skill: Skill }) {
  const spec = pillSpec("skill", skillPillValue(skill))
  const n = studentsWithEvidence(state, skill.id)
  return (
    <span className="inline-flex flex-wrap items-center gap-2" data-skill-facts>
      {/* One state hue per page: a healthy state is neutral; amber stays for what needs action. */}
      <StatusBadge label={spec.label} tone={spec.tone === "success" || spec.tone === "info" ? "neutral" : spec.tone} icon={spec.icon} size="sm" />
      <span>{skill.published && n > 0 ? `${skill.category}. ${n} students have evidence.` : skill.category}</span>
    </span>
  )
}

/** Cancel in the title zone. With unsaved edits it asks first; focus starts on the safe choice. */
export function CancelButton({ dirty, href = LIBRARY_HREF }: { dirty: boolean; href?: string }) {
  const router = useLabRouter()
  const [open, setOpen] = React.useState(false)
  if (!dirty) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={href}>Cancel</Link>
      </Button>
    )
  }
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Cancel
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>Nothing has been published. Your edits to this configuration will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default" autoFocus>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="default" onClick={() => router.push(href)}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** Loading in the final shape of a form column: stepper row, fields, sticky footer (rule L10). */
export function ConfigureLoading({ title = `Configure ${skillNoun()}` }: { title?: string }) {
  return (
    <PageFrame title={title} width="form">
      <div role="status" aria-busy="true" aria-label="Loading configuration" className="flex flex-col gap-6">
        <span className="sr-only">Loading configuration</span>
        <Skeleton aria-hidden="true" className="h-6 w-full" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} aria-hidden="true" className="h-10 w-full" />
          ))}
        </div>
        <Skeleton aria-hidden="true" className="h-16 w-full" />
      </div>
    </PageFrame>
  )
}

export function ConfigureNotFound({ skillId }: { skillId: string }) {
  return (
    <PageFrame title={`Configure ${skillNoun()}`} width="form">
      <LocalBanner variant="error" title={`This ${skillNoun()} does not exist`} action={{ label: `Open the ${skillNounPlural()} library`, href: LIBRARY_HREF }}>
        {`No ${skillNoun()} matches "${skillId}". It may have been removed.`}
      </LocalBanner>
    </PageFrame>
  )
}
