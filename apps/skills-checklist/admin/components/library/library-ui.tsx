"use client"

import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import type { Db } from "@/lib/domain/types"
import type { ActionCtx, Result } from "@/lib/store"
import { useActions } from "@/lib/store/react"

/** Active or inactive as TEXT first (WCAG 1.4.1); the tone only supports it. Never red. */
export function ActiveBadge({ active, activeLabel = "Active", inactiveLabel = "Inactive" }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return active ? <StatusBadge label={activeLabel} tone="success" icon="fa-circle-check" size="sm" /> : <StatusBadge label={inactiveLabel} tone="neutral" icon="fa-circle-minus" size="sm" />
}

export interface BannerItem {
  id: number
  variant: "success" | "error" | "info" | "warning"
  text: string
  /** Error recovery (docs/ux/08 P-17): the same action again, nothing changed. */
  retry?: () => void
}

/** Banners for save, deactivate and error results. LocalBanner, never a toast; success is never auto-dismissed. */
export function useBanners() {
  const [items, setItems] = React.useState<BannerItem[]>([])
  const nextId = React.useRef(1)
  const push = React.useCallback((b: Omit<BannerItem, "id">) => {
    const id = nextId.current++
    // One result banner at a time keeps the page calm; the latest result replaces the previous one.
    setItems([{ ...b, id }])
    return id
  }, [])
  const dismiss = React.useCallback((id: number) => setItems((cur) => cur.filter((x) => x.id !== id)), [])
  const clear = React.useCallback(() => setItems([]), [])
  return { items, push, dismiss, clear }
}

export function BannerStack({ items, onDismiss }: { items: BannerItem[]; onDismiss: (id: number) => void }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {items.map((b) => (
        <LocalBanner key={b.id} variant={b.variant} dismissible onDismiss={() => onDismiss(b.id)} retry={b.retry ? { label: "Try again", onClick: b.retry } : undefined}>
          {b.text}
        </LocalBanner>
      ))}
    </div>
  )
}

/** Skeleton rows in the shape of the table; the page header and tabs render at once (state L). */
export function TableSkeleton({ rows = 6, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

type Banners = ReturnType<typeof useBanners>

/**
 * Run one store action and report the result as a banner. A failure keeps the screen as it was and offers the same
 * action again (docs/ux/08 P-17). Returns the Result so the caller can close a dialog on success only.
 */
export function useRunner(banners: Pick<Banners, "push">) {
  const { run } = useActions()
  const { push } = banners
  const attemptRef = React.useRef<(what: string, action: (db: Db, ctx: ActionCtx) => Result<unknown>, success: string) => boolean>(() => false)
  attemptRef.current = (what, action, success) => {
    const r = run(action)
    if (r.ok) {
      push({ variant: "success", text: success })
      return true
    }
    push({ variant: "error", text: `${what} could not be completed. ${r.error.message}`, retry: () => attemptRef.current(what, action, success) })
    return false
  }
  return React.useCallback((what: string, action: (db: Db, ctx: ActionCtx) => Result<unknown>, success: string) => attemptRef.current(what, action, success), [])
}

/** Section heading (h2) on the left, the surface's one filled primary on the right, on one row. */
export function SectionHeader({ id, title, action }: { id: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={id} className="text-base font-semibold text-foreground">
        {title}
      </h2>
      {action}
    </div>
  )
}
