"use client"

/**
 * Shared pieces of the configure and rule impact pages: loading and not-found states, the skill facts subtitle and Close with a
 * leave check (save a draft, discard, or keep editing; decision D-X31). The dashed in-page demo toolbar is gone (layout rule L12): demo states live in the lab bar's Scenario menu
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
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { PAGE_TITLE_TYPE_CLASS } from "@exxatdesignux/ui/components/ui/page-header"
import { PageFrame } from "@/components/skills/page-header"
import { evalsOfSkill } from "@/lib/v2/evidence-index"
import { isConfigured } from "@/lib/v2/population"
import { shortDate } from "@/lib/v2/format"
import { notConfiguredBlock, STATUS_META } from "@/lib/lab/library"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import type { Skill, V2State } from "@/lib/v2/types"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"

export const LIBRARY_HREF = "/lab/admin/skills-library"
/** Back to the library with the skill open and a banner saying what happened (`saved` after Save configuration, `draft` after Save draft). */
export const libraryReturnHref = (skillId: string, what: "saved" | "draft", base: string = LIBRARY_HREF) => `${base}?skill=${encodeURIComponent(skillId)}&${what}=1`
export const configureSkillHref = (skillId: string) => `/lab/admin/configure-skill?skill=${encodeURIComponent(skillId)}`
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

/**
 * The Configure page title (Romit 2026-10-27, "needs to be in one line, can we represent Airway better, needs to give a better
 * hierarchy and context"; then "Needs to be in one line"): the h1, the status chip, then the category as a quiet outline badge
 * with a folder glyph that links to the library filtered by it (where this skill lives), all on one line, wrapping only when
 * narrow. The draft day and, once configured, the evidence count follow as muted facts. No category: no badge. Tags are not
 * shown here. The DS PageHeader has no eyebrow slot and renders a node title as-is, so this keeps the h1 and the DS title type.
 */
export function SkillTitle({ state, skill }: { state: V2State; skill: Skill }) {
  const configured = isConfigured(skill)
  const spec = STATUS_META[configured ? "configured" : "not-configured"]
  const n = studentsWithEvidence(state, skill.id)
  const draft = state.configDrafts?.[skill.id]
  const category = skill.category?.trim()
  // One line (Romit 2026-10-27, "Needs to be in one line"): h1, status chip, then the category as a quiet neutral badge that
  // links to the library filtered by it; wraps only at narrow widths.
  return (
    <div className="flex min-w-0 flex-col" data-skill-title>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1" data-skill-facts>
        <h1 className={PAGE_TITLE_TYPE_CLASS}>{skill.name}</h1>
        {configured ? (
          <StatusBadge label={spec.label} tone="neutral" icon={spec.icon} size="sm" />
        ) : (
          // The consequence lives on the chip, not in a banner that repeats it [REQ IM-09].
          <Tip label={notConfiguredBlock(true)}>
            <span tabIndex={0} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]" aria-label={`${spec.label}. ${notConfiguredBlock(true)}`}>
              <StatusBadge label={spec.label} tone="warning" icon={spec.icon} size="sm" />
            </span>
          </Tip>
        )}
        {category ? (
          <Badge asChild variant="outline">
            <Link href={`${LIBRARY_HREF}?cat=${encodeURIComponent(category)}`} aria-label={`Category: ${category}`} data-skill-category>
              <i className="fa-light fa-folder" aria-hidden="true" />
              {category}
            </Link>
          </Badge>
        ) : null}
        {draft ? <span className="text-sm text-muted-foreground" data-draft-note>{`Draft saved ${shortDate(draft.at.slice(0, 10))}`}</span> : null}
        {configured && n > 0 ? <span className="text-sm text-muted-foreground tabular-nums">{`${n} students have evidence`}</span> : null}
      </div>
    </div>
  )
}

/**
 * Close in the title zone, while configuring (decision D-X31). With unsaved edits it asks first, in a DS dialog: save them as a
 * draft and leave (the skill keeps its status), discard them, or keep editing. Focus starts on the safe choice. After "Save
 * configuration" the page shows no Close: the receipt's own actions take the admin on.
 */
export function LeaveButton({ dirty, onSaveDraft, skillId, href = LIBRARY_HREF }: { dirty: boolean; onSaveDraft: () => void; skillId: string; href?: string }) {
  const router = useLabRouter()
  const [open, setOpen] = React.useState(false)
  if (!dirty) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={href}>Close</Link>
      </Button>
    )
  }
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Close
      </Button>
      <LeaveDialog
        open={open}
        onOpenChange={setOpen}
        onSaveDraft={() => {
          onSaveDraft()
          router.push(libraryReturnHref(skillId, "draft", href))
        }}
        onDiscard={() => router.push(href)}
      />
    </>
  )
}

export function LeaveDialog({ open, onOpenChange, onSaveDraft, onDiscard }: { open: boolean; onOpenChange: (o: boolean) => void; onSaveDraft: () => void; onDiscard: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-leave-dialog>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave with unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>{`Save them as a draft to finish later. The ${skillNoun()} keeps its current status until you save the configuration.`}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="default" autoFocus>
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction variant="outline" size="default" onClick={onDiscard}>
            Discard changes
          </AlertDialogAction>
          <AlertDialogAction variant="default" size="default" onClick={onSaveDraft}>
            Save draft and leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Cancel with a discard check, for the rule impact pages (no draft to save there). */
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
            <AlertDialogDescription>Nothing has been saved. Your edits to this configuration will be lost.</AlertDialogDescription>
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
