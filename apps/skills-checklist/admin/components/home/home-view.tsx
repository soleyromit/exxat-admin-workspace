"use client"

/**
 * HY-01 Home, Layout 2: one page in every state. Setup card (open while any skill is unconfigured, one line when none is),
 * then the attention list, then four counts, then a pointer to Attainment. Read-only: counts and links, nothing here changes
 * state. Props in, markup out, so every state is testable without the store.
 */
import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { PageFrame } from "@/components/skills"
import { home } from "@/lib/copy/home"
import { homeSummary, isFirstRun, type HomeSummary } from "@/lib/home/derive"
import type { Db } from "@/lib/domain/types"
import { ROUTES } from "@/lib/skills-routes"
import { AttentionList, type RowKey } from "./attention-list"
import { Glance } from "./glance"
import { LinkButton } from "./link-button"
import { SetupCard } from "./setup-card"

export type HomeStatus = "ready" | "loading" | "error"

export interface HomeViewProps {
  db: Db
  status?: HomeStatus
  onRetry?: () => void
  /** Attention rows whose figure failed to load: each says "Not available" and the rest of the page still renders. */
  unavailable?: RowKey[]
  /** Counts are recalculating after a rule change: figures read "Updating" inside a polite live region. */
  updating?: boolean
  /** Skills just added by an import (IM-09 reminder). */
  imported?: number | null
  onDismissImported?: () => void
}

export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" data-testid="home-skeleton">
      <p className="sr-only" role="status">
        {home.loading}
      </p>
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-6 w-40" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}

export function HomeErrorBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <LocalBanner variant="error" title={home.errorTitle} retry={onRetry ? { label: home.buttons.retry, onClick: onRetry } : undefined}>
      {home.error}
    </LocalBanner>
  )
}

function HomeBody({ s, status, unavailable, updating }: { s: HomeSummary; status: HomeStatus; unavailable: RowKey[]; updating: boolean }) {
  const first = isFirstRun(s)
  const failed = status === "error"
  return (
    <>
      {failed ? null : <SetupCard summary={s} />}
      <AttentionList summary={s} unavailable={failed ? ["approvals", "lab", "unmapped"] : unavailable} />
      {first && !failed ? null : <Glance summary={s} unavailable={failed} updating={updating} />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">{home.attainmentPointer}</p>
        <LinkButton href={ROUTES.attainment}>{home.buttons.openAttainment}</LinkButton>
      </div>
    </>
  )
}

export function HomeView({ db, status = "ready", onRetry, unavailable = [], updating = false, imported = null, onDismissImported }: HomeViewProps) {
  const s = React.useMemo(() => homeSummary(db), [db])
  const first = isFirstRun(s)
  const headerActions =
    status === "ready" && !first ? (
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton href={ROUTES.import} variant="outline" size="default">
          {home.actions.import}
        </LinkButton>
        <LinkButton href={ROUTES.skillNew} variant="outline" size="default">
          {home.actions.add}
        </LinkButton>
      </div>
    ) : undefined
  return (
    <PageFrame title={home.title} subtitle={home.subtitle} actions={headerActions}>
      {status === "error" ? (
        <HomeErrorBanner onRetry={onRetry} />
      ) : null}
      {imported ? (
        <LocalBanner variant="success" dismissible onDismiss={onDismissImported}>
          {home.imported(imported)}
        </LocalBanner>
      ) : null}
      {status === "ready" ? (
        <p className="sr-only" role="status" aria-live="polite">
          {updating ? home.updating : ""}
        </p>
      ) : null}
      {status === "loading" ? <HomeSkeleton /> : <HomeBody s={s} status={status} unavailable={unavailable} updating={updating} />}
    </PageFrame>
  )
}
