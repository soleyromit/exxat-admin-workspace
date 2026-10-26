"use client"

/**
 * Page chrome for Log a skill, Send for evaluation, Record, Share record, and Offline and sync. Same DS PageHeader (via PageFrame)
 * and sync chip as the other student screens, plus the device states these screens own.
 * States (`?state=`): loading (final-shape skeleton), empty (screen-specific), error (LocalBanner with Try again, never a toast),
 * offline (one info banner, entries kept), conflict, queued, synced (the chip and the sync rows follow), verified (share demo).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { PageFrame, type PageFrameWidth } from "@/components/skills/page-header"
import { SyncChip } from "@/components/lab/student/frame"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { useStudentPage } from "@/components/lab/student/use-student"
import type { V2State } from "@/lib/v2/types"
import type { StudentModel } from "@/lib/lab/student"
import { STUDENT2_DEMOS, type Student2Demo } from "@/lib/lab/student2"

export interface Student2Ctx {
  state: V2State
  model: StudentModel
  studentId: string
  demo: Student2Demo | null
  /** Offline: the device keeps everything and sends on reconnect. */
  offline: boolean
  param: (k: string) => string | null
  setParams: (p: Record<string, string | null>) => void
}

/** The chip follows the demo state so the header never disagrees with the page. */
function chipModel(m: StudentModel, demo: Student2Demo | null): StudentModel {
  const s = m.sync
  if (demo === "synced") return { ...m, sync: { ...s, queued: 0, conflict: 0, failed: 0 } }
  if (demo === "queued") return { ...m, sync: { ...s, queued: s.queued + s.synced, synced: 0, conflict: 0 } }
  if (demo === "offline") return { ...m, sync: { ...s, queued: s.queued + s.synced, synced: 0 } }
  return m
}

export function Student2Frame({
  title,
  width = "full",
  primary,
  back,
  empty,
  loading,
  showSync = true,
  children,
}: {
  /** False on Offline and sync, where the page itself is the sync status (say it once). */
  showSync?: boolean
  title: string
  width?: PageFrameWidth
  /** The page's one filled action, when the page has one in the header. */
  primary?: (ctx: Student2Ctx) => { label: string; href: string } | null
  back?: (ctx: Student2Ctx) => { label: string; href: string } | null
  /** The screen's own empty state (what will appear here and the one action that makes it appear). */
  empty: (ctx: Student2Ctx) => React.ReactNode
  /** Final-shape skeleton for the screen. */
  loading?: React.ReactNode
  children: (ctx: Student2Ctx) => React.ReactNode
}) {
  const page = useStudentPage()
  const raw = page.param("state")
  const demo = STUDENT2_DEMOS.includes(raw as Student2Demo) ? (raw as Student2Demo) : null
  if (!page.model || demo === "loading") {
    return (
      <PageFrame title={title} width={width}>
        <p role="status" className="sr-only">Loading</p>
        {loading ?? <DefaultLoading />}
      </PageFrame>
    )
  }
  const ctx: Student2Ctx = { state: page.state, model: page.model, studentId: page.studentId, demo, offline: demo === "offline", param: page.param, setParams: page.setParams }
  const action = primary ? primary(ctx) : null
  const backLink = back ? back(ctx) : null
  const actions = (
    <div className="flex items-center gap-2">
      {/* Phone: the header row cannot hold the chip, the sync state and the action without crushing the title; the chip shows from sm up. */}
      <span className="max-sm:hidden"><SampleDataBadge /></span>
      {showSync ? <SyncChip model={chipModel(ctx.model, demo)} offline={ctx.offline} studentId={ctx.studentId} /> : null}
      {action && demo !== "empty" && demo !== "error" ? (
        <Button asChild variant="default" size="sm">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  )
  const lead = backLink ? (
    <Button asChild variant="ghost" size="sm" className="-ms-2 self-start text-muted-foreground">
      <Link href={backLink.href}>
        <i className="fa-light fa-arrow-left" aria-hidden="true" />
        {backLink.label}
      </Link>
    </Button>
  ) : null
  return (
    <PageFrame title={title} width={width} actions={actions} lead={lead}>
      <div className="flex flex-col gap-5" data-page-type="student">
        {ctx.offline ? (
          <LocalBanner variant="info" title="You are offline">
            Everything you add stays on this device and sends when you reconnect.
          </LocalBanner>
        ) : null}
        {demo === "error" ? (
          <LocalBanner variant="error" title="This page did not load" action={{ label: "Try again", onClick: () => ctx.setParams({ state: null }) }}>
            Nothing on this device is lost.
          </LocalBanner>
        ) : demo === "empty" ? (
          empty(ctx)
        ) : (
          children(ctx)
        )}
      </div>
    </PageFrame>
  )
}

function DefaultLoading() {
  return (
    <div className="grid gap-5 lg:grid-cols-12" aria-hidden="true">
      <Skeleton className="h-10 lg:col-span-12" />
      <Skeleton className="h-72 lg:col-span-8" />
      <Skeleton className="h-72 lg:col-span-4" />
    </div>
  )
}

/** The shared lab empty state (components/lab/empty-block.tsx), re-exported for the student screens that import it from here. */
export { EmptyBlock } from "@/components/lab/empty-block"
