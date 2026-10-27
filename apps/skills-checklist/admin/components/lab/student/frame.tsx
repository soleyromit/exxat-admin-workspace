"use client"

/**
 * Page chrome shared by every student screen: the DS PageHeader (through PageFrame) with at most one filled action, the
 * offline chip (queued, synced, conflict) and the demo states. The screen lays out its own regions inside.
 * States: ?state=loading (final-shape skeleton), empty (nothing mapped yet), done (all required achieved, demo),
 * offline (device banner, entries kept), error (LocalBanner with Try again). Never a toast.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { PageFrame, type PageFrameWidth } from "@/components/skills/page-header"
import { EmptyBlock } from "@/components/lab/empty-block"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { aNoun, skillNounPlural } from "@/lib/lab/terms"
import { studentHref, type StudentModel } from "@/lib/lab/student"
import { useStudentPage, type StudentPageCtx } from "@/components/lab/student/use-student"
import { usePresent } from "@/components/lab/lab-bar/present"

export interface StudentFrameCtx extends StudentPageCtx {
  model: StudentModel
}

/**
 * Sync status in one chip: a conflict wins (amber, links to the fix), then queued, then synced. Hidden in present mode: offline
 * sync is pending scope, so the client walk-through does not show a "1 conflict" it cannot explain (the Sample data chip stays).
 * Outside present mode it shows only when a sync scenario is asked for (?state=offline, conflict, queued, synced): the seeded
 * conflict is a scenario, not product state, so it never sits in the header of an ordinary page (2026-10-27 sweep).
 */
export function SyncChip({ model, offline, studentId, scenario = false }: { model: StudentModel; offline: boolean; studentId: string; /** A sync demo state is on. */ scenario?: boolean }) {
  const { present } = usePresent()
  const s = model.sync
  if (present || !scenario) return null
  if (s.conflict > 0) {
    return (
      <Link href={studentHref("offline-sync", {}, studentId)} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${s.conflict} conflict: open sync to choose a version`} data-sync-chip="conflict">
        <StatusBadge label={`${s.conflict} conflict`} tone="warning" icon="fa-code-compare" size="sm" />
      </Link>
    )
  }
  if (offline || s.queued > 0) return <span className="inline-flex" data-sync-chip="queued"><StatusBadge label={`${s.queued} queued`} tone="neutral" icon="fa-cloud-arrow-up" size="sm" /></span>
  return <span className="inline-flex" data-sync-chip="synced"><StatusBadge label="Synced" tone="neutral" icon="fa-cloud-check" size="sm" /></span>
}

export function StudentFrame({
  title,
  width = "full",
  primary,
  showSync = true,
  back,
  subtitle,
  children,
}: {
  title: string | ((ctx: StudentFrameCtx) => string)
  width?: PageFrameWidth
  /** The page's one filled action. */
  primary?: { label: string; href: string } | ((ctx: StudentFrameCtx) => { label: string; href: string } | null) | null
  showSync?: boolean
  /** A quiet way back to where the student came from. */
  back?: (ctx: StudentFrameCtx) => { label: string; href: string; /** Phone only: the breadcrumb says it from md up. */ phoneOnly?: boolean } | null
  /** Context under the title (the course view: "Skills by course"). */
  subtitle?: (ctx: StudentFrameCtx) => string | null
  children: (ctx: StudentFrameCtx) => React.ReactNode
}) {
  const ctx = useStudentPage()
  const { model, demo, studentId } = ctx
  const full = model ? ({ ...ctx, model } as StudentFrameCtx) : null
  const action = typeof primary === "function" ? (full ? primary(full) : null) : primary
  const heading = typeof title === "function" ? (full ? title(full) : "") : title
  const backLink = back && full ? back(full) : null
  const lead = backLink ? (
    <Button asChild variant="ghost" size="sm" className={cn("-ms-2 self-start text-muted-foreground", backLink.phoneOnly ? "md:hidden" : "")}>
      <Link href={backLink.href}>
        <i className="fa-light fa-arrow-left" aria-hidden="true" />
        {backLink.label}
      </Link>
    </Button>
  ) : null

  const actions = model ? (
    <div className="flex items-center gap-2">
      <SampleDataBadge />
      {showSync ? <SyncChip model={model} offline={demo === "offline"} studentId={studentId} scenario={demo === "offline"} /> : null}
      {action && demo !== "empty" ? (
        <Button asChild variant="default" size="sm">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  ) : null

  if (!model || demo === "loading") {
    return (
      <PageFrame title={heading || "Loading"} width={width}>
        <p role="status" className="sr-only">Loading your progress</p>
        <LoadingShape />
      </PageFrame>
    )
  }

  return (
    <PageFrame title={heading} subtitle={subtitle && full ? subtitle(full) ?? undefined : undefined} width={width} actions={actions} lead={lead}>
      <div className="flex flex-col gap-6" data-page-type="student">
        {demo === "offline" ? (
          <LocalBanner variant="info" title="You are offline">
            {`New entries stay on this device and send when you reconnect. ${model.sync.queued} queued.`}
          </LocalBanner>
        ) : null}
        {demo === "error" ? (
          <LocalBanner variant="error" title="Your progress did not load" retry={{ label: "Try again", onClick: () => ctx.setParams({ state: null }) }}>
            Nothing you logged is lost. Entries on this device are kept.
          </LocalBanner>
        ) : demo === "empty" || model.required.length + model.all.length === 0 ? (
          <EmptyState studentId={studentId} />
        ) : (
          children({ ...ctx, model })
        )}
      </div>
    </PageFrame>
  )
}

/** Nothing mapped yet: the shared lab empty state (consistency audit item 3). */
export function EmptyState({ studentId }: { studentId: string }) {
  return (
    <EmptyBlock
      title={`No ${skillNounPlural()} mapped to your courses yet`}
      body={`You can still log ${aNoun()} and send it for evaluation.`}
      action={{ label: `Log ${aNoun()}`, href: studentHref("request-signoff", {}, studentId) }}
    />
  )
}

export function LoadingShape() {
  return (
    <div className="grid gap-6 lg:grid-cols-12" aria-hidden="true">
      <Skeleton className="h-40 lg:col-span-5" />
      <Skeleton className="h-40 lg:col-span-7" />
      <Skeleton className="h-64 lg:col-span-12" />
    </div>
  )
}
