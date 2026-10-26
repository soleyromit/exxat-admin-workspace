"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import type { PageHeaderActionItem } from "@exxatdesignux/ui/components/ui/page-header"
import { PageFrame } from "@/components/skills/page-header"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { useV2State } from "@/lib/v2/react"
import { unsentEntries } from "@/lib/v2/student"
import { syncSummary } from "@/lib/v2/sync"
import { SyncChip } from "@/components/v2/student/sync-chip"
import { useDevice, BTN } from "@/components/v2/student/use-student"

/** Always-visible sync status: the chip that needs the most attention, a sentence, and a link to the details. */
export function SyncStrip() {
  const s = useV2State()
  const sum = syncSummary(s)
  return (
    <Card size="sm" data-sync-strip={sum.chip}>
      <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div role="status" aria-live="polite" className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          {s.device.offline ? <StatusBadge label="Offline" tone="neutral" icon="fa-wifi-slash" size="sm" /> : <SyncChip state={sum.chip} />}
          <span className="min-w-0 text-foreground" data-sync-headline>
            {sum.headline}
          </span>
        </div>
        <Button asChild variant="link" size="sm" className={BTN}>
          <Link href="/v2/student/offline-sync">Sync details</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

/** Offline, signed out and update pending. None of them blocks logging. These states are demo controls. */
export function DeviceBanners() {
  const s = useV2State()
  const device = useDevice()
  const d = s.device
  return (
    <>
      {d.offline ? (
        <LocalBanner variant="warning" title="You are offline" data-device-banner="offline">
          Your entries are saved on this phone and send when you are back online.
        </LocalBanner>
      ) : null}
      {d.signedOut ? (
        <LocalBanner variant="info" title="You are signed out" data-device-banner="signed-out">
          <p>You can keep logging. Entries stay on this phone and send after you sign in.</p>
          <Button type="button" variant="outline" size="lg" className={`${BTN} mt-2`} onClick={() => device({ signedOut: false })}>
            Sign in
          </Button>
        </LocalBanner>
      ) : null}
      {d.updatePending ? (
        <LocalBanner variant="info" title="An update is ready" data-device-banner="update">
          <p>Install it when you have a minute. You can keep working until then.</p>
          <Button type="button" variant="outline" size="lg" className={`${BTN} mt-2`} onClick={() => device({ updatePending: false })}>
            Install update
          </Button>
        </LocalBanner>
      ) : null}
    </>
  )
}

const NAV = [
  { href: "/v2/student", label: "Home", icon: "house", match: (p: string) => p === "/v2/student" },
  { href: "/v2/student/pick-and-rate", label: "Log", icon: "pen-to-square", match: (p: string) => p.startsWith("/v2/student/pick-and-rate") },
  { href: "/v2/student/request-signoff", label: "Requests", icon: "paper-plane", match: (p: string) => p.startsWith("/v2/student/request-signoff") },
  { href: "/v2/student/history", label: "Record", icon: "clock-rotate-left", match: (p: string) => p.startsWith("/v2/student/history") },
] as const

/** Mobile bottom navigation: four destinations, 44 px targets, safe-area aware. From 768 px the same four rows are in the left shell. */
export function StudentNav() {
  const pathname = usePathname() ?? ""
  const s = useV2State()
  const ready = unsentEntries(s).length
  return (
    <nav aria-label="Student" className="sticky bottom-0 z-10 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex w-full max-w-md items-stretch justify-between gap-1 px-2 py-1">
        {NAV.map((n) => {
          const active = n.match(pathname)
          return (
            <li key={n.href} className="flex-1">
              <Button asChild variant={active ? "secondary" : "ghost"} size="default" className={`${BTN} h-auto w-full flex-col gap-0.5 py-1 text-xs`}>
                <Link href={n.href} aria-current={active ? "page" : undefined}>
                  <i className={`fa-${active ? "solid" : "light"} fa-${n.icon} text-base`} aria-hidden="true" />
                  <span>{n.label}</span>
                  {n.label === "Requests" && ready > 0 ? <span className="sr-only">{`, ${ready} ready to send`}</span> : null}
                </Link>
              </Button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * The student's page. Below 768px: the phone column (28rem, centred), the sync strip and device banners above the DS page
 * header, the bottom navigation. From 768px the left shell carries the same four rows, so the page is the shared PageFrame
 * (`width="reading"`, left aligned, 48rem, the staff gutter) and the title sits where every staff title sits. Composed from
 * DS primitives (docs/v2/new-components-needed.md).
 */
export function StudentPage({ title, subtitle, actionItems, children }: { title: React.ReactNode; subtitle?: string; actionItems?: PageHeaderActionItem[]; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-full w-full flex-col" data-student-page>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:mx-0 md:max-w-none">
        <PageFrame
          width="reading"
          title={title}
          subtitle={subtitle}
          actionItems={actionItems}
          lead={
            <>
              <SyncStrip />
              <DeviceBanners />
            </>
          }
        >
          {children}
        </PageFrame>
      </div>
      <StudentNav />
    </div>
  )
}

/** A titled region inside a student page. */
export function Block({ title, description, id, children }: { title: string; description?: string; id: string; children?: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id={`${id}-h`} className="text-base font-semibold text-foreground">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
